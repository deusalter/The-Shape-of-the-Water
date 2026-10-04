package main

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"sync"
	"testing"
	"time"
)

func gameFixture(t *testing.T) string {
	t.Helper()
	dir := t.TempDir()
	files := map[string]string{
		"index.html":          "<!doctype html><title>Exact game fixture</title><p>UNCHANGED GAME</p>",
		"asset-manifest.json": `{"version":"fixture-build","files":["index.html"]}`,
		"assets/game.js":      "export const game = true;",
		"assets/game.css":     "body{color:blue}",
		"art/card.svg":        `<svg xmlns="http://www.w3.org/2000/svg"/>`,
		"world/room.glb":      "GLB fixture",
		"sw.js":               "self.addEventListener('fetch',()=>{});",
		"data.bin":            "binary fixture",
	}
	for name, content := range files {
		full := filepath.Join(dir, filepath.FromSlash(name))
		if err := os.MkdirAll(filepath.Dir(full), 0755); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(full, []byte(content), 0644); err != nil {
			t.Fatal(err)
		}
	}
	return dir
}

func startTestLauncher(t *testing.T, dir string) *launchResult {
	t.Helper()
	result, err := startLauncher(serverConfig{address: "127.0.0.1:0", gameDir: dir, version: version})
	if err != nil {
		t.Fatal(err)
	}
	ctx, cancel := context.WithCancel(context.Background())
	done := make(chan error, 1)
	go func() { done <- result.server.wait(ctx) }()
	t.Cleanup(func() {
		cancel()
		select {
		case err := <-done:
			if err != nil {
				t.Error(err)
			}
		case <-time.After(2 * time.Second):
			result.server.close()
			t.Error("server did not stop")
		}
	})
	return result
}

func noProxyClient() *http.Client {
	return &http.Client{Timeout: 2 * time.Second, Transport: &http.Transport{Proxy: nil, DisableKeepAlives: true}, CheckRedirect: func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse }}
}

func response(t *testing.T, method, requestURL, body string, headers map[string]string) (int, http.Header, string) {
	t.Helper()
	req, err := http.NewRequest(method, requestURL, strings.NewReader(body))
	if err != nil {
		t.Fatal(err)
	}
	for key, value := range headers {
		if key == "Host" {
			req.Host = value
		} else {
			req.Header.Set(key, value)
		}
	}
	resp, err := noProxyClient().Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	data, err := io.ReadAll(resp.Body)
	if err != nil {
		t.Fatal(err)
	}
	return resp.StatusCode, resp.Header.Clone(), string(data)
}

func TestControlPageAndStatus(t *testing.T) {
	dir := gameFixture(t)
	result := startTestLauncher(t, dir)
	status, headers, html := response(t, "GET", result.controlURL, "", nil)
	if status != 200 || !strings.Contains(html, "The Mercy of Morning") || !strings.Contains(html, `href="/" target="_blank"`) {
		t.Fatalf("unexpected control page: %d %s", status, html)
	}
	if headers.Get("Cache-Control") != "no-store" || headers.Get("X-Frame-Options") != "DENY" || !strings.Contains(headers.Get("Content-Security-Policy"), "frame-ancestors 'none'") {
		t.Fatalf("missing control protection: %v", headers)
	}
	if !strings.Contains(html, ".actions[hidden] { display: none; }") {
		t.Fatal("closed controls can remain visible")
	}
	status, headers, body := response(t, "GET", origin(result.server.address)+"/__launcher/status", "", nil)
	var actual gameIdentity
	if err := json.Unmarshal([]byte(body), &actual); err != nil {
		t.Fatal(err)
	}
	if status != 200 || actual != result.server.identity || strings.Contains(body, result.server.nonce) || headers.Get("X-Shape-Launcher") != launcherIdentity {
		t.Fatal("invalid recognition response or nonce disclosure")
	}
	status, _, body = response(t, "HEAD", result.controlURL, "", nil)
	if status != 200 || body != "" {
		t.Fatal("HEAD control did not omit its body")
	}
}

func TestAssetsExactMIMEAndReadOnly(t *testing.T) {
	dir := gameFixture(t)
	result := startTestLauncher(t, dir)
	cases := map[string]string{"/": "text/html; charset=utf-8", "/index.html": "text/html; charset=utf-8", "/assets/game.js": "text/javascript; charset=utf-8", "/sw.js": "text/javascript; charset=utf-8", "/assets/game.css": "text/css; charset=utf-8", "/asset-manifest.json": "application/json; charset=utf-8", "/art/card.svg": "image/svg+xml", "/world/room.glb": "model/gltf-binary", "/data.bin": "application/octet-stream"}
	for requestPath, contentType := range cases {
		t.Run(requestPath, func(t *testing.T) {
			status, headers, body := response(t, "GET", origin(result.server.address)+requestPath, "", nil)
			name, _ := assetPath(requestPath)
			expected, err := os.ReadFile(filepath.Join(dir, filepath.FromSlash(name)))
			if err != nil {
				t.Fatal(err)
			}
			if status != 200 || body != string(expected) || headers.Get("Content-Type") != contentType || headers.Get("X-Content-Type-Options") != "nosniff" {
				t.Fatalf("asset changed or wrong MIME: %d %v", status, headers)
			}
		})
	}
	status, headers, _ := response(t, "POST", origin(result.server.address)+"/index.html", "replacement", nil)
	if status != 405 || headers.Get("Allow") != "GET, HEAD" {
		t.Fatal("asset mutation method was accepted")
	}
	unchanged, err := os.ReadFile(filepath.Join(dir, "index.html"))
	if err != nil || !strings.Contains(string(unchanged), "UNCHANGED GAME") {
		t.Fatal("game file was mutated")
	}
	status, headers, body := response(t, "GET", origin(result.server.address)+"/assets/game.js", "", map[string]string{"Range": "bytes=0-5"})
	if status != 206 || body != "export" || headers.Get("Content-Range") == "" {
		t.Fatal("range serving did not preserve expected bytes")
	}
}

func TestStaticBoundaries(t *testing.T) {
	dir := gameFixture(t)
	outside := t.TempDir()
	if err := os.WriteFile(filepath.Join(outside, "secret.txt"), []byte("OUTSIDE SECRET"), 0644); err != nil {
		t.Fatal(err)
	}
	if err := os.Symlink(filepath.Join(outside, "secret.txt"), filepath.Join(dir, "escape.txt")); err != nil {
		t.Fatal(err)
	}
	if err := os.Symlink(outside, filepath.Join(dir, "escape-dir")); err != nil {
		t.Fatal(err)
	}
	if err := os.Symlink("index.html", filepath.Join(dir, "inside.html")); err != nil {
		t.Fatal(err)
	}
	result := startTestLauncher(t, dir)
	for _, requestPath := range []string{"/assets", "/assets/", "/assets//game.js", "/../secret.txt", "/%2e%2e/secret.txt", "/assets/%2e%2e/index.html", "/assets/./game.js", "/escape.txt", "/escape-dir/secret.txt", "/assets%5cgame.js", "/%00", "/missing", "/__launcher/missing"} {
		t.Run(requestPath, func(t *testing.T) {
			status, _, body := response(t, "GET", origin(result.server.address)+requestPath, "", nil)
			if status != 404 || strings.Contains(body, "OUTSIDE SECRET") || strings.Contains(body, "game.js") {
				t.Fatalf("path escaped or listed: %s %d %q", requestPath, status, body)
			}
		})
	}
	status, _, body := response(t, "GET", origin(result.server.address)+"/inside.html", "", nil)
	if status != 200 || !strings.Contains(body, "UNCHANGED GAME") {
		t.Fatal("safe in-root symlink did not remain rooted")
	}
}

func TestStrictHost(t *testing.T) {
	result := startTestLauncher(t, gameFixture(t))
	for _, host := range []string{"evil.example", "localhost:" + strings.Split(result.server.address, ":")[1], result.server.address + ".evil", "127.0.0.1", "[::1]:4173"} {
		for _, requestPath := range []string{"/", "/__launcher/", "/__launcher/status", "/__launcher/quit"} {
			status, _, _ := response(t, "GET", origin(result.server.address)+requestPath, "", map[string]string{"Host": host})
			if status != 403 {
				t.Fatalf("host accepted: %q %s %d", host, requestPath, status)
			}
		}
	}
}

func TestQuitRejectsCrossSiteAndBadNonce(t *testing.T) {
	result := startTestLauncher(t, gameFixture(t))
	base := origin(result.server.address)
	goodHeaders := map[string]string{"Origin": base, "Sec-Fetch-Site": "same-origin", "Content-Type": "application/x-www-form-urlencoded"}
	goodBody := url.Values{"nonce": {result.server.nonce}}.Encode()
	cases := []struct {
		name, method, body string
		headers            map[string]string
		expected           int
	}{
		{"get", "GET", "", nil, 405},
		{"missing-origin", "POST", goodBody, map[string]string{"Content-Type": "application/x-www-form-urlencoded"}, 403},
		{"foreign-origin", "POST", goodBody, map[string]string{"Origin": "https://evil.example", "Content-Type": "application/x-www-form-urlencoded"}, 403},
		{"null-origin", "POST", goodBody, map[string]string{"Origin": "null", "Content-Type": "application/x-www-form-urlencoded"}, 403},
		{"cross-site", "POST", goodBody, map[string]string{"Origin": base, "Sec-Fetch-Site": "cross-site", "Content-Type": "application/x-www-form-urlencoded"}, 403},
		{"foreign-referrer", "POST", goodBody, map[string]string{"Origin": base, "Referer": "http://evil.example/", "Content-Type": "application/x-www-form-urlencoded"}, 403},
		{"foreign-host", "POST", goodBody, map[string]string{"Origin": base, "Host": "evil.example", "Content-Type": "application/x-www-form-urlencoded"}, 403},
		{"wrong-nonce", "POST", "nonce=wrong", goodHeaders, 403},
		{"query-only-nonce", "POST", "", goodHeaders, 403},
		{"duplicate-nonce", "POST", goodBody + "&" + goodBody, goodHeaders, 403},
		{"json", "POST", `{"nonce":"` + result.server.nonce + `"}`, map[string]string{"Origin": base, "Content-Type": "application/json"}, 403},
		{"oversized-body", "POST", goodBody + "&extra=" + strings.Repeat("x", 5000), goodHeaders, 403},
	}
	for _, test := range cases {
		t.Run(test.name, func(t *testing.T) {
			status, _, _ := response(t, test.method, base+"/__launcher/quit?nonce="+result.server.nonce, test.body, test.headers)
			if status != test.expected {
				t.Fatalf("bad quit accepted: %d", status)
			}
			if err := probeExisting(result.server.address, result.server.identity); err != nil {
				t.Fatalf("bad quit stopped the server: %v", err)
			}
		})
	}
}

func TestGracefulQuitAfterCompleteResponse(t *testing.T) {
	result := startTestLauncher(t, gameFixture(t))
	base := origin(result.server.address)
	_, _, html := response(t, "GET", result.controlURL, "", nil)
	match := regexp.MustCompile(`name="nonce" value="([a-f0-9]{64})"`).FindStringSubmatch(html)
	if len(match) != 2 {
		t.Fatal("control did not contain a fresh session nonce")
	}
	status, headers, body := response(t, "POST", base+"/__launcher/quit", url.Values{"nonce": {match[1]}}.Encode(), map[string]string{"Origin": base, "Content-Type": "application/x-www-form-urlencoded"})
	if status != 200 || headers.Get("Cache-Control") != "no-store" || !strings.Contains(body, "The launcher is closed.") || !strings.HasSuffix(body, "</body></html>") {
		t.Fatalf("shutdown truncated its response: %d %q", status, body)
	}
	awaitClosed(t, result.server.address)
}

func awaitClosed(t *testing.T, address string) {
	t.Helper()
	deadline := time.Now().Add(2 * time.Second)
	for time.Now().Before(deadline) {
		connection, err := net.DialTimeout("tcp4", address, 50*time.Millisecond)
		if err != nil {
			return
		}
		connection.Close()
		time.Sleep(10 * time.Millisecond)
	}
	t.Fatal("listener remained open")
}

func TestDuplicateInstanceReusesOneListener(t *testing.T) {
	dir := gameFixture(t)
	first := startTestLauncher(t, dir)
	second, err := startLauncher(serverConfig{address: first.server.address, gameDir: dir, version: version})
	if err != nil || !second.reused || second.server != nil || second.controlURL != first.controlURL {
		t.Fatalf("duplicate listener started or reuse failed: %#v %v", second, err)
	}
	if err := probeExisting(first.server.address, first.server.identity); err != nil {
		t.Fatal("existing server was stopped")
	}
}

func TestDuplicateVersionOrGameBuildRejected(t *testing.T) {
	dir := gameFixture(t)
	first := startTestLauncher(t, dir)
	_, err := startLauncher(serverConfig{address: first.server.address, gameDir: dir, version: "future-version"})
	if !errors.Is(err, errDifferentBuild) {
		t.Fatalf("old launcher silently reused: %v", err)
	}
	differentDir := gameFixture(t)
	if err := os.WriteFile(filepath.Join(differentDir, "asset-manifest.json"), []byte(`{"version":"other-build"}`), 0644); err != nil {
		t.Fatal(err)
	}
	_, err = startLauncher(serverConfig{address: first.server.address, gameDir: differentDir, version: version})
	if !errors.Is(err, errDifferentBuild) {
		t.Fatalf("old game silently reused: %v", err)
	}
	if err := probeExisting(first.server.address, first.server.identity); err != nil {
		t.Fatal("different build stopped existing server")
	}
}

func TestSimultaneousLaunchesSettleOnOneServer(t *testing.T) {
	dir := gameFixture(t)
	reserved, err := net.Listen("tcp4", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	address := reserved.Addr().String()
	reserved.Close()
	var wait sync.WaitGroup
	results := make(chan *launchResult, 8)
	errors := make(chan error, 8)
	for i := 0; i < 8; i++ {
		wait.Add(1)
		go func() {
			defer wait.Done()
			result, err := startLauncher(serverConfig{address: address, gameDir: dir, version: version})
			results <- result
			errors <- err
		}()
	}
	wait.Wait()
	close(results)
	close(errors)
	for err := range errors {
		if err != nil {
			t.Fatal(err)
		}
	}
	servers, reuses := 0, 0
	for result := range results {
		if result.reused {
			reuses++
		} else {
			servers++
			t.Cleanup(result.server.close)
		}
	}
	if servers != 1 || reuses != 7 {
		t.Fatalf("got %d servers and %d reuses", servers, reuses)
	}
}

func TestUnrelatedPortOwnerIsNeverReplaced(t *testing.T) {
	for _, kind := range []string{"python", "fake-json", "redirect"} {
		t.Run(kind, func(t *testing.T) {
			unrelated := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if kind == "redirect" {
					http.Redirect(w, r, "http://example.invalid", 302)
					return
				}
				if kind == "fake-json" {
					w.Header().Set("Content-Type", "application/json")
					io.WriteString(w, `{"launcher":"unrelated"}`)
					return
				}
				io.WriteString(w, "<!doctype html><h1>Existing Python game</h1>")
			}))
			defer unrelated.Close()
			address := strings.TrimPrefix(unrelated.URL, "http://")
			result, err := startLauncher(serverConfig{address: address, gameDir: gameFixture(t), version: version})
			if err == nil || result != nil || !strings.Contains(err.Error(), "already in use") || !strings.Contains(err.Error(), "Python play.py") {
				t.Fatalf("collision did not explain the fixed address: %v", err)
			}
			status, _, _ := response(t, "GET", unrelated.URL, "", nil)
			if kind != "redirect" && status != 200 {
				t.Fatal("unrelated service was stopped")
			}
		})
	}
}

func TestBundledPathAndStableSaveOrigin(t *testing.T) {
	if productionAddress != "127.0.0.1:4173" || controlURL(productionAddress) != "http://127.0.0.1:4173/__launcher/" {
		t.Fatal("production save origin changed")
	}
	if got := bundledGameDir("/private/var/folders/random/AppTranslocation/XYZ/d/The Shape of the Water.app/Contents/MacOS/launcher"); got != "/private/var/folders/random/AppTranslocation/XYZ/d/The Shape of the Water.app/Contents/Resources/game" {
		t.Fatalf("translocated bundle path changed: %s", got)
	}
	if _, err := parseOptions([]string{"--port", "9000"}, io.Discard); err == nil {
		t.Fatal("a port override can silently separate saves")
	}
	if _, err := startLauncher(serverConfig{address: "0.0.0.0:4173", gameDir: gameFixture(t), version: version}); err == nil {
		t.Fatal("non-loopback bind was accepted")
	}
}

func TestIncompleteAssetsFailBeforeListening(t *testing.T) {
	for _, kind := range []string{"missing-directory", "missing-index", "missing-manifest", "bad-manifest", "directory-index"} {
		t.Run(kind, func(t *testing.T) {
			dir := gameFixture(t)
			switch kind {
			case "missing-directory":
				dir = filepath.Join(dir, "missing")
			case "missing-index":
				os.Remove(filepath.Join(dir, "index.html"))
			case "missing-manifest":
				os.Remove(filepath.Join(dir, "asset-manifest.json"))
			case "bad-manifest":
				os.WriteFile(filepath.Join(dir, "asset-manifest.json"), []byte("bad json"), 0644)
			case "directory-index":
				os.Remove(filepath.Join(dir, "index.html"))
				os.Mkdir(filepath.Join(dir, "index.html"), 0755)
			}
			result, err := startLauncher(serverConfig{address: "127.0.0.1:0", gameDir: dir, version: version})
			if err == nil || result != nil {
				t.Fatalf("incomplete bundle was accepted: %s", kind)
			}
		})
	}
}
