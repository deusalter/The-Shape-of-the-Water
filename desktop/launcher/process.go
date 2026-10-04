package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"time"
)

type startupMessage struct {
	Ready  bool   `json:"ready"`
	Reused bool   `json:"reused"`
	URL    string `json:"url,omitempty"`
	Error  string `json:"error,omitempty"`
}

func writeStartup(out io.Writer, result *launchResult, err error) error {
	message := startupMessage{}
	if err != nil {
		message.Error = err.Error()
	} else {
		message.Ready, message.Reused, message.URL = true, result.reused, result.controlURL
	}
	return json.NewEncoder(out).Encode(message)
}

func runDesktop(executable, gameDir string, opener func(string) error) error {
	return runDesktopAt(executable, gameDir, productionAddress, opener)
}

// The address is injectable for lifecycle tests; the app entrypoint always
// passes productionAddress and offers no user-facing port override.
func runDesktopAt(executable, gameDir, address string, opener func(string) error) error {
	identity, err := inspectGame(gameDir, version)
	if err != nil {
		return err
	}
	reader, writer, err := os.Pipe()
	if err != nil {
		return errors.New("unable to create the local server startup channel")
	}
	defer reader.Close()
	cmd := exec.Command(executable, "--serve", "--ready-fd=3", "--game-dir", gameDir)
	cmd.ExtraFiles = []*os.File{writer}
	detachProcess(cmd)
	// Nil standard streams connect to the null device; the server never holds
	// Finder's entrypoint open and does not write into the application bundle.
	if err := cmd.Start(); err != nil {
		writer.Close()
		return errors.New("unable to start the game's local server; try opening the app again")
	}
	writer.Close()
	messageChannel := make(chan struct {
		message startupMessage
		err     error
	}, 1)
	go func() {
		var message startupMessage
		err := json.NewDecoder(io.LimitReader(reader, 8192)).Decode(&message)
		messageChannel <- struct {
			message startupMessage
			err     error
		}{message, err}
	}()
	var message startupMessage
	select {
	case received := <-messageChannel:
		if received.err != nil {
			stopChild(cmd)
			return errors.New("the local server could not start; reopen the app after closing any earlier launcher")
		}
		message = received.message
	case <-time.After(8 * time.Second):
		stopChild(cmd)
		return errors.New("the local server took too long to start; try opening the app again")
	}
	if !message.Ready {
		stopChild(cmd)
		if message.Error == "" {
			return errors.New("the local server reported a startup failure")
		}
		return errors.New(message.Error)
	}
	// Do not trust readiness notification alone: verify the listener's exact
	// identity and fixed URL before launching the default browser.
	if message.URL != controlURL(address) {
		stopChild(cmd)
		return errors.New("the local server reported an unexpected address")
	}
	if err := probeExisting(address, identity); err != nil {
		stopChild(cmd)
		return fmt.Errorf("unable to confirm the local server is ready: %w", err)
	}
	cmd.Process.Release()
	if err := opener(message.URL); err != nil {
		return errors.New("macOS could not open the default browser. The launcher is ready at " + message.URL + ". Open that address in your browser, or reopen the app")
	}
	return nil
}

func stopChild(cmd *exec.Cmd) {
	// Only the child this entrypoint just started can be stopped here. An
	// existing server identified during a reopen is never killed.
	cmd.Process.Kill()
	cmd.Wait()
}
