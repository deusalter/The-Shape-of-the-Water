package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"net/url"
	"os"
	"os/signal"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"syscall"
	"testing"
	"time"
)

// Re-execute the real test executable as a detached child. Production flags,
// startup pipe, process separation and server lifecycle are exercised; only
// the listener address is replaced here to keep port 4173 free for review.
func TestMain(tests *testing.M) {
	if os.Getenv("SHAPE_LAUNCHER_TEST_CHILD") == "1" {
		if err := runTestChild(); err != nil {
			os.Exit(1)
		}
		os.Exit(0)
	}
	os.Exit(tests.Run())
}

func runTestChild() error {
	opts, err := parseOptions(os.Args[1:], io.Discard)
	if err != nil || !opts.serve || opts.readyFD != 3 {
		return errors.New("unexpected test child arguments")
	}
	pipe := os.NewFile(3, "launcher-startup")
	defer pipe.Close()
	if pidPath := os.Getenv("SHAPE_LAUNCHER_TEST_PID_FILE"); pidPath != "" {
		if err := os.WriteFile(pidPath, []byte(strconv.Itoa(os.Getpid())), 0600); err != nil {
			return err
		}
	}
	if os.Getenv("SHAPE_LAUNCHER_TEST_CHILD_MODE") == "unexpected-url" {
		if err := json.NewEncoder(pipe).Encode(startupMessage{Ready: true, URL: "http://example.invalid/"}); err != nil {
			return err
		}
		pipe.Close()
		ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
		defer cancel()
		<-ctx.Done()
		return nil
	}
	result, startErr := startLauncher(serverConfig{address: os.Getenv("SHAPE_LAUNCHER_TEST_ADDRESS"), gameDir: opts.gameDir, version: version})
	if err := writeStartup(pipe, result, startErr); err != nil {
		if result != nil && result.server != nil {
			result.server.close()
		}
		return err
	}
	pipe.Close()
	if startErr != nil {
		return startErr
	}
	if result.reused {
		return nil
	}
	ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer cancel()
	return result.server.wait(ctx)
}

func reserveAddress(t *testing.T) string {
	t.Helper()
	listener, err := net.Listen("tcp4", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	address := listener.Addr().String()
	listener.Close()
	return address
}

func childEnvironment(t *testing.T, address string) string {
	t.Helper()
	t.Setenv("SHAPE_LAUNCHER_TEST_CHILD", "1")
	t.Setenv("SHAPE_LAUNCHER_TEST_ADDRESS", address)
	executable, err := os.Executable()
	if err != nil {
		t.Fatal(err)
	}
	return executable
}

func nonceFromControl(t *testing.T, address string) string {
	t.Helper()
	status, _, html := response(t, "GET", controlURL(address), "", nil)
	match := regexp.MustCompile(`name="nonce" value="([a-f0-9]{64})"`).FindStringSubmatch(html)
	if status != 200 || len(match) != 2 {
		t.Fatal("no ready control-page session")
	}
	return match[1]
}

func quitDetached(t *testing.T, address string) {
	t.Helper()
	nonce := nonceFromControl(t, address)
	status, _, _ := response(t, "POST", origin(address)+"/__launcher/quit", url.Values{"nonce": {nonce}}.Encode(), map[string]string{"Origin": origin(address), "Content-Type": "application/x-www-form-urlencoded"})
	if status != 200 {
		t.Fatal("detached child did not accept valid Quit")
	}
	awaitClosed(t, address)
}

func TestDetachedParentStartsAndReopensReadyChild(t *testing.T) {
	address := reserveAddress(t)
	executable := childEnvironment(t, address)
	dir := gameFixture(t)
	identity, err := inspectGame(dir, version)
	if err != nil {
		t.Fatal(err)
	}
	openCalls := 0
	opener := func(openURL string) error {
		openCalls++
		if openURL != controlURL(address) {
			return fmt.Errorf("unexpected browser origin %s", openURL)
		}
		return probeExisting(address, identity)
	}
	start := time.Now()
	if err := runDesktopAt(executable, dir, address, opener); err != nil {
		t.Fatal(err)
	}
	if elapsed := time.Since(start); elapsed > 3*time.Second {
		t.Fatalf("app entrypoint did not return promptly: %s", elapsed)
	}
	t.Cleanup(func() { quitDetached(t, address) })
	firstNonce := nonceFromControl(t, address)
	// The parent has returned; its separate child continues to serve exact game.
	status, _, body := response(t, "GET", origin(address)+"/", "", nil)
	if status != 200 || !strings.Contains(body, "UNCHANGED GAME") {
		t.Fatal("detached child did not survive its parent entrypoint")
	}
	if err := runDesktopAt(executable, dir, address, opener); err != nil {
		t.Fatal(err)
	}
	if openCalls != 2 || nonceFromControl(t, address) != firstNonce {
		t.Fatal("reopening did not reuse the same live server session")
	}
}

func TestDetachedParentCollisionReportsFailureWithoutOpening(t *testing.T) {
	// Use an actual launcher with different assets as the unrelated child.
	firstDir := gameFixture(t)
	first := startTestLauncher(t, firstDir)
	executable := childEnvironment(t, first.server.address)
	newDir := gameFixture(t)
	if err := os.WriteFile(filepath.Join(newDir, "asset-manifest.json"), []byte(`{"version":"changed-build"}`), 0644); err != nil {
		t.Fatal(err)
	}
	opened := false
	err := runDesktopAt(executable, newDir, first.server.address, func(string) error { opened = true; return nil })
	if err == nil || !strings.Contains(err.Error(), "another version") || opened {
		t.Fatalf("unsafe collision startup: %v opened=%v", err, opened)
	}
	if err := probeExisting(first.server.address, first.server.identity); err != nil {
		t.Fatal("failed child startup stopped a pre-existing server")
	}
}

func TestDetachedParentStopsItsChildOnInvalidReadiness(t *testing.T) {
	address := reserveAddress(t)
	executable := childEnvironment(t, address)
	t.Setenv("SHAPE_LAUNCHER_TEST_CHILD_MODE", "unexpected-url")
	pidPath := filepath.Join(t.TempDir(), "child.pid")
	t.Setenv("SHAPE_LAUNCHER_TEST_PID_FILE", pidPath)
	opened := false
	err := runDesktopAt(executable, gameFixture(t), address, func(string) error { opened = true; return nil })
	if err == nil || !strings.Contains(err.Error(), "unexpected address") || opened {
		t.Fatalf("invalid startup notification accepted: %v", err)
	}
	data, err := os.ReadFile(pidPath)
	if err != nil {
		t.Fatal(err)
	}
	pid, err := strconv.Atoi(string(data))
	if err != nil {
		t.Fatal(err)
	}
	process, err := os.FindProcess(pid)
	if err != nil {
		t.Fatal(err)
	}
	if err := process.Signal(syscall.Signal(0)); err == nil {
		process.Kill()
		t.Fatal("failed startup left its child alive")
	}
}

func TestDetachedBrowserFailureLeavesReusableServer(t *testing.T) {
	address := reserveAddress(t)
	executable := childEnvironment(t, address)
	dir := gameFixture(t)
	err := runDesktopAt(executable, dir, address, func(string) error { return errors.New("browser launch diagnostic failure") })
	if err == nil || !strings.Contains(err.Error(), controlURL(address)) {
		t.Fatalf("browser failure did not provide usable local address: %v", err)
	}
	t.Cleanup(func() { quitDetached(t, address) })
	firstNonce := nonceFromControl(t, address)
	if err := runDesktopAt(executable, dir, address, func(string) error { return nil }); err != nil {
		t.Fatal(err)
	}
	if nonceFromControl(t, address) != firstNonce {
		t.Fatal("retry after browser failure created a new server")
	}
}

func TestProcessOptionsRejectUnexpectedArguments(t *testing.T) {
	for _, args := range [][]string{{"--ready-fd=3"}, {"--serve", "--ready-fd=4"}, {"some-file"}} {
		if _, err := parseOptions(args, io.Discard); err == nil {
			t.Fatalf("unexpected process arguments accepted: %v", args)
		}
	}
	if opts, err := parseOptions([]string{"--headless", "--game-dir", "/some game"}, io.Discard); err != nil || !opts.headless || opts.gameDir != "/some game" {
		t.Fatalf("safe diagnostic arguments rejected: %v", err)
	}
}

func TestSignalStopsDetachedServer(t *testing.T) {
	address := reserveAddress(t)
	executable := childEnvironment(t, address)
	pidPath := filepath.Join(t.TempDir(), "child.pid")
	t.Setenv("SHAPE_LAUNCHER_TEST_PID_FILE", pidPath)
	if err := runDesktopAt(executable, gameFixture(t), address, func(string) error { return nil }); err != nil {
		t.Fatal(err)
	}
	data, err := os.ReadFile(pidPath)
	if err != nil {
		t.Fatal(err)
	}
	pid, err := strconv.Atoi(string(data))
	if err != nil {
		t.Fatal(err)
	}
	process, err := os.FindProcess(pid)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { process.Kill(); process.Wait() })
	if err := process.Signal(syscall.SIGTERM); err != nil {
		t.Fatal(err)
	}
	awaitClosed(t, address)
}
