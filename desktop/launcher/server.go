package main

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	_ "embed"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"html/template"
	"io"
	"mime"
	"net"
	"net/http"
	"net/url"
	"os"
	"path"
	"strings"
	"sync"
	"time"
)

const launcherIdentity = "the-shape-of-the-water-local-launcher"
const launcherProtocol = 1

//go:embed control.html
var controlSource string

var controlTemplate = template.Must(template.New("control").Parse(controlSource))

type gameIdentity struct {
	Launcher       string `json:"launcher"`
	Protocol       int    `json:"protocol"`
	Version        string `json:"version"`
	GameBuild      string `json:"gameBuild"`
	ManifestSHA256 string `json:"manifestSha256"`
}

type serverConfig struct{ address, gameDir, version string }
type launchResult struct {
	server     *launcherServer
	reused     bool
	controlURL string
}
type launcherServer struct {
	http      *http.Server
	root      *os.Root
	identity  gameIdentity
	address   string
	nonce     string
	quit      chan struct{}
	quitOnce  sync.Once
	done      chan error
	closeOnce sync.Once
}

func origin(address string) string     { return "http://" + address }
func controlURL(address string) string { return origin(address) + "/__launcher/" }

func inspectGame(gameDir, launcherVersion string) (gameIdentity, error) {
	root, err := os.OpenRoot(gameDir)
	if err != nil {
		return gameIdentity{}, errors.New("the bundled game folder is missing or unreadable. Extract the complete app from its ZIP and try again")
	}
	defer root.Close()
	return identityFromRoot(root, launcherVersion)
}

func identityFromRoot(root *os.Root, launcherVersion string) (gameIdentity, error) {
	index, err := root.Open("index.html")
	if err != nil {
		return gameIdentity{}, errors.New("the bundled game is incomplete: index.html is missing. Extract a fresh copy of the complete app")
	}
	stat, err := index.Stat()
	index.Close()
	if err != nil || !stat.Mode().IsRegular() {
		return gameIdentity{}, errors.New("the bundled game index is not a readable regular file")
	}
	manifest, err := root.Open("asset-manifest.json")
	if err != nil {
		return gameIdentity{}, errors.New("the bundled game's asset manifest is missing. Extract a fresh copy of the complete app")
	}
	defer manifest.Close()
	manifestStat, err := manifest.Stat()
	if err != nil || !manifestStat.Mode().IsRegular() {
		return gameIdentity{}, errors.New("the bundled game's asset manifest is not a readable regular file")
	}
	data, err := io.ReadAll(io.LimitReader(manifest, 1024*1024+1))
	if err != nil || len(data) > 1024*1024 {
		return gameIdentity{}, errors.New("the bundled game's asset manifest cannot be read")
	}
	var build struct {
		Version string `json:"version"`
	}
	if err := json.Unmarshal(data, &build); err != nil || build.Version == "" {
		return gameIdentity{}, errors.New("the bundled game's asset manifest is invalid. Extract a fresh copy of the complete app")
	}
	digest := sha256.Sum256(data)
	return gameIdentity{launcherIdentity, launcherProtocol, launcherVersion, build.Version, hex.EncodeToString(digest[:])}, nil
}

func startLauncher(config serverConfig) (*launchResult, error) {
	if config.address == "" {
		config.address = productionAddress
	}
	host, _, err := net.SplitHostPort(config.address)
	if err != nil || host != "127.0.0.1" {
		return nil, errors.New("the launcher must use its IPv4 loopback address")
	}
	root, err := os.OpenRoot(config.gameDir)
	if err != nil {
		return nil, errors.New("the bundled game folder is missing or unreadable. Extract the complete app from its ZIP and try again")
	}
	identity, err := identityFromRoot(root, config.version)
	if err != nil {
		root.Close()
		return nil, err
	}
	listener, err := net.Listen("tcp4", config.address)
	if err != nil {
		root.Close()
		// A concurrent double-click can bind before it starts accepting HTTP.
		// Bounded retries recognize that launcher without choosing a new port.
		var probeErr error
		for attempt := 0; attempt < 5; attempt++ {
			probeErr = probeExisting(config.address, identity)
			if probeErr == nil {
				return &launchResult{reused: true, controlURL: controlURL(config.address)}, nil
			}
			if errors.Is(probeErr, errDifferentBuild) {
				return nil, probeErr
			}
			if attempt < 4 {
				time.Sleep(80 * time.Millisecond)
			}
		}
		return nil, fmt.Errorf("the game's saved-game address %s is already in use. Quit the earlier game launcher (including any Python play.py launcher), or close the app using that port, then open this app again. The launcher will keep this address so your browser saves stay available", origin(config.address))
	}
	address := listener.Addr().String()
	token := make([]byte, 32)
	if _, err := rand.Read(token); err != nil {
		listener.Close()
		root.Close()
		return nil, errors.New("unable to create a secure local launcher session")
	}
	server := &launcherServer{root: root, identity: identity, address: address, nonce: hex.EncodeToString(token), quit: make(chan struct{}), done: make(chan error, 1)}
	server.http = &http.Server{Handler: server, ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 10 * time.Second, WriteTimeout: 30 * time.Second, IdleTimeout: 60 * time.Second, MaxHeaderBytes: 16 * 1024}
	go func() {
		err := server.http.Serve(listener)
		if errors.Is(err, http.ErrServerClosed) {
			err = nil
		}
		server.done <- err
	}()
	// A successful TCP bind is not sufficient: exercise the HTTP handler.
	if err := probeExisting(address, identity); err != nil {
		server.close()
		return nil, errors.New("the local server could not become ready")
	}
	return &launchResult{server: server, controlURL: controlURL(address)}, nil
}

var errDifferentBuild = errors.New("another version of The Shape of the Water is already running at the saved-game address. Use Quit on its launcher page, then open this app again")

func probeExisting(address string, expected gameIdentity) error {
	// Ignore HTTP proxy environment variables, redirects and browser caches.
	client := &http.Client{Timeout: 500 * time.Millisecond, Transport: &http.Transport{Proxy: nil, DisableKeepAlives: true}, CheckRedirect: func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse }}
	req, err := http.NewRequest(http.MethodGet, origin(address)+"/__launcher/status", nil)
	if err != nil {
		return err
	}
	req.Header.Set("Cache-Control", "no-store")
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK || resp.Header.Get("X-Shape-Launcher") != launcherIdentity {
		return errors.New("the occupied port is not this launcher")
	}
	var actual gameIdentity
	decoder := json.NewDecoder(io.LimitReader(resp.Body, 4096))
	if err := decoder.Decode(&actual); err != nil {
		return errors.New("the occupied port did not identify this launcher")
	}
	if actual.Launcher != launcherIdentity || actual.Protocol != launcherProtocol {
		return errors.New("the occupied port is not a compatible launcher")
	}
	if actual != expected {
		return errDifferentBuild
	}
	return nil
}

func (server *launcherServer) wait(ctx context.Context) error {
	select {
	case <-server.quit:
	case <-ctx.Done():
	case err := <-server.done:
		server.close()
		return err
	}
	shutdown, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	err := server.http.Shutdown(shutdown)
	server.close()
	if err != nil {
		return errors.New("the local server did not finish closing cleanly")
	}
	return nil
}

func (server *launcherServer) close() {
	server.closeOnce.Do(func() { server.http.Close(); server.root.Close() })
}

func (server *launcherServer) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.Header().Set("X-Frame-Options", "DENY")
	w.Header().Set("Cross-Origin-Resource-Policy", "same-origin")
	if r.Host != server.address {
		http.Error(w, "This launcher accepts only its local saved-game address.", http.StatusForbidden)
		return
	}
	if strings.HasPrefix(r.URL.Path, "/__launcher/") || r.URL.Path == "/__launcher" {
		server.serveControl(w, r)
		return
	}
	server.serveAsset(w, r)
}

func (server *launcherServer) serveControl(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Cache-Control", "no-store")
	w.Header().Set("Referrer-Policy", "no-referrer")
	w.Header().Set("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-"+server.nonce+"'; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'")
	switch r.URL.Path {
	case "/__launcher", "/__launcher/":
		if !readMethod(w, r) {
			return
		}
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		if r.Method == http.MethodHead {
			return
		}
		controlTemplate.Execute(w, struct{ Nonce, Version string }{server.nonce, server.identity.Version})
	case "/__launcher/status":
		if !readMethod(w, r) {
			return
		}
		w.Header().Set("X-Shape-Launcher", launcherIdentity)
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		if r.Method != http.MethodHead {
			json.NewEncoder(w).Encode(server.identity)
		}
	case "/__launcher/quit":
		server.serveQuit(w, r)
	default:
		http.NotFound(w, r)
	}
}

func readMethod(w http.ResponseWriter, r *http.Request) bool {
	if r.Method == http.MethodGet || r.Method == http.MethodHead {
		return true
	}
	w.Header().Set("Allow", "GET, HEAD")
	http.Error(w, "Use GET or HEAD.", http.StatusMethodNotAllowed)
	return false
}

func (server *launcherServer) serveQuit(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.Header().Set("Allow", "POST")
		http.Error(w, "Use the Quit button on the launcher page.", http.StatusMethodNotAllowed)
		return
	}
	if len(r.Header.Values("Origin")) != 1 || r.Header.Get("Origin") != origin(server.address) || (r.Header.Get("Sec-Fetch-Site") != "" && r.Header.Get("Sec-Fetch-Site") != "same-origin") {
		http.Error(w, "Quit is available only from this launcher page.", http.StatusForbidden)
		return
	}
	if referrer := r.Header.Get("Referer"); referrer != "" {
		parsed, err := url.Parse(referrer)
		if err != nil || parsed.Scheme != "http" || parsed.Host != server.address {
			http.Error(w, "Quit is available only from this launcher page.", http.StatusForbidden)
			return
		}
	}
	r.Body = http.MaxBytesReader(w, r.Body, 4096)
	mediaType, _, err := mime.ParseMediaType(r.Header.Get("Content-Type"))
	if err != nil || mediaType != "application/x-www-form-urlencoded" || r.ParseForm() != nil || len(r.PostForm["nonce"]) != 1 || subtle.ConstantTimeCompare([]byte(r.PostForm.Get("nonce")), []byte(server.nonce)) != 1 {
		http.Error(w, "Reload the launcher page before using Quit.", http.StatusForbidden)
		return
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	io.WriteString(w, "<!doctype html><html lang=\"en\"><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>Launcher closed</title><body style=\"background:#131b24;color:#ede4d4;font:20px Georgia,serif;padding:10vw;line-height:1.6\"><h1>The launcher is closed.</h1><p>You can close this tab. Open The Shape of the Water app to play again.</p><p>Your browser saves stay in this browser.</p></body></html>")
	if flusher, ok := w.(http.Flusher); ok {
		flusher.Flush()
	}
	// The response is sent before Shutdown stops accepting new connections.
	server.quitOnce.Do(func() { close(server.quit) })
}

func (server *launcherServer) serveAsset(w http.ResponseWriter, r *http.Request) {
	if !readMethod(w, r) {
		return
	}
	name, ok := assetPath(r.URL.Path)
	if !ok {
		http.NotFound(w, r)
		return
	}
	file, err := server.root.Open(name)
	if err != nil {
		http.NotFound(w, r)
		return
	}
	defer file.Close()
	info, err := file.Stat()
	if err != nil || !info.Mode().IsRegular() {
		http.NotFound(w, r)
		return
	}
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Content-Type", assetMIME(name))
	http.ServeContent(w, r, info.Name(), info.ModTime(), file)
}

func assetPath(urlPath string) (string, bool) {
	if urlPath == "/" {
		return "index.html", true
	}
	if !strings.HasPrefix(urlPath, "/") || strings.ContainsAny(urlPath, "\\\x00") {
		return "", false
	}
	name := strings.TrimPrefix(urlPath, "/")
	for _, part := range strings.Split(name, "/") {
		if part == "" || part == "." || part == ".." {
			return "", false
		}
	}
	return name, true
}

func assetMIME(name string) string {
	switch strings.ToLower(path.Ext(name)) {
	case ".html":
		return "text/html; charset=utf-8"
	case ".js", ".mjs":
		return "text/javascript; charset=utf-8"
	case ".css":
		return "text/css; charset=utf-8"
	case ".json":
		return "application/json; charset=utf-8"
	case ".svg":
		return "image/svg+xml"
	case ".glb":
		return "model/gltf-binary"
	case ".gltf":
		return "model/gltf+json"
	case ".wasm":
		return "application/wasm"
	default:
		if value := mime.TypeByExtension(path.Ext(name)); value != "" {
			return value
		}
		return "application/octet-stream"
	}
}
