// The macOS app entrypoint starts the local server, opens its control page,
// and exits. The detached server stays alive until Quit or a process signal.
package main

import (
	"context"
	"errors"
	"flag"
	"fmt"
	"io"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"runtime"
	"syscall"
)

var version = "1.0.0"

const productionAddress = "127.0.0.1:4173"

type options struct {
	gameDir     string
	headless    bool
	serve       bool
	readyFD     int
	showVersion bool
}

func parseOptions(args []string, output io.Writer) (options, error) {
	var opts options
	flags := flag.NewFlagSet("The Shape of the Water", flag.ContinueOnError)
	flags.SetOutput(output)
	flags.StringVar(&opts.gameDir, "game-dir", "", "developer diagnostic: static game directory")
	flags.BoolVar(&opts.headless, "headless", false, "developer diagnostic: serve in the foreground without opening a browser")
	flags.BoolVar(&opts.serve, "serve", false, "internal detached server mode")
	flags.IntVar(&opts.readyFD, "ready-fd", 0, "internal startup notification file descriptor")
	flags.BoolVar(&opts.showVersion, "version", false, "print launcher version")
	if err := flags.Parse(args); err != nil {
		return opts, err
	}
	if flags.NArg() != 0 {
		return opts, errors.New("unexpected launcher arguments")
	}
	if opts.readyFD != 0 && (!opts.serve || opts.readyFD != 3) {
		return opts, errors.New("startup notification is available only to the internal server")
	}
	return opts, nil
}

func bundledGameDir(executable string) string {
	return filepath.Clean(filepath.Join(filepath.Dir(executable), "..", "Resources", "game"))
}

func main() {
	opts, err := parseOptions(os.Args[1:], os.Stderr)
	if errors.Is(err, flag.ErrHelp) {
		return
	}
	if err == nil && opts.showVersion {
		fmt.Fprintln(os.Stdout, version)
		return
	}
	var executable string
	if err == nil {
		executable, err = os.Executable()
	}
	if err == nil && opts.gameDir == "" {
		opts.gameDir = bundledGameDir(executable)
	}
	if err == nil {
		if opts.serve || opts.headless {
			err = runForeground(opts)
		} else if runtime.GOOS != "darwin" {
			err = errors.New("this app is for macOS; use --headless only for developer diagnostics")
		} else {
			err = runDesktop(executable, opts.gameDir, openBrowser)
		}
	}
	if err != nil {
		fmt.Fprintln(os.Stderr, "The Shape of the Water:", err)
		if !opts.serve && !opts.headless {
			showAlert(err.Error())
		}
		os.Exit(1)
	}
}

func runForeground(opts options) error {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	result, err := startLauncher(serverConfig{address: productionAddress, gameDir: opts.gameDir, version: version})
	if opts.readyFD == 3 {
		file := os.NewFile(3, "launcher-startup")
		if file == nil {
			return errors.New("the launcher startup channel is unavailable")
		}
		if writeErr := writeStartup(file, result, err); writeErr != nil {
			if result != nil && result.server != nil {
				result.server.close()
			}
			file.Close()
			return errors.New("unable to notify the app that the local server is ready")
		}
		file.Close()
	}
	if err != nil {
		return err
	}
	if result.reused {
		return nil
	}
	if opts.headless {
		fmt.Fprintln(os.Stdout, "Launcher ready at "+result.controlURL)
	}
	return result.server.wait(ctx)
}

func openBrowser(url string) error {
	return exec.Command("/usr/bin/open", url).Run()
}

func showAlert(message string) {
	if runtime.GOOS != "darwin" {
		return
	}
	// The AppleScript source is fixed. The error is passed as an argument,
	// never interpolated into either a shell command or an AppleScript program.
	const script = `on run argv
display alert "The Shape of the Water" message (item 1 of argv) as critical buttons {"OK"} default button "OK"
end run`
	exec.Command("/usr/bin/osascript", "-e", script, message).Run()
}
