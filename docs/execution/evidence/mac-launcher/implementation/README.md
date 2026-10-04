# Native Mac launcher implementation

The launcher wraps the exact existing static game without changing narrative, game code, assets, manifest, IndexedDB identifiers or service worker. It uses only the Go standard library, requires Go 1.24 or newer to build, and requires no Go or Python installation on the player's Mac.

The `.app` entrypoint is short-lived. It starts the same executable as a detached `--serve` child, receives a startup result through an inherited pipe, verifies the live server's identity, opens the default browser with `/usr/bin/open`, and exits. The server stays alive until the launcher page's Quit button or process termination. A subsequent app launch identifies and reuses the existing server. This structure avoids relying on a Go process to handle Finder AppleEvents; actual Finder behavior remains a native Mac verification limit.

The executable at `Contents/MacOS/launcher` resolves its bundled assets relative to itself at `Contents/Resources/game`. It never writes into the app bundle. Production always binds IPv4 loopback at `http://127.0.0.1:4173`, preserving the earlier Python launcher's normal browser origin. It offers no port override or random-port fallback. Browser saves that were created at a different Python fallback port remain at that different origin.

`/__launcher/` is a separate, uncached control page with a Play link opening `/` in a new tab and a Quit button. `GET /__launcher/status` identifies the protocol, launcher version, game build and SHA-256 of the exact asset-manifest bytes. It exposes no shutdown nonce. Reuse requires all these identity fields to match; a different launcher/game build requests that the player use Quit on the earlier control page before reopening. An unrelated listener, including an earlier Python launcher, produces a useful collision error without killing any existing process or changing the origin. Mac startup errors use a fixed AppleScript alert with the message passed as an argument, without a shell.

`POST /__launcher/quit` requires the process's random 256-bit nonce, exact Host, exact Origin, and same-origin Fetch Metadata when supplied. Missing, foreign or null Origin; foreign Host/referrer; duplicate or query-only nonce; wrong nonce; oversized bodies; and non-form requests are rejected. The endpoint writes and flushes a complete successful response before graceful shutdown. JavaScript updates the control page in place and hides its actions without issuing a follow-up navigation. GET cannot quit the server.

Every request requires the exact listener Host. Static files use Go's `os.Root` confinement, which prevents symlink escapes, including paths containing symlink components. URL dot segments, repeated separators, backslashes and NUL are rejected. Only regular files are served; directories never produce listings. Existing file bytes, accurate game MIME types, HEAD and byte ranges are preserved. Static writes are rejected. There is no runtime download, AI, GUI dependency, telemetry or paid dependency.

The unchanged game service worker falls through uncached control GETs to the live server and ignores the Quit POST. If a control tab is manually reloaded after shutdown, its existing navigation fallback may display the cached game. The successful Quit page does not reload and clearly reports the closed launcher. Do not describe that fallback as a change to the game's worker.

Build from `desktop/launcher` with the verified official toolchain (not this environment's unrelated `/usr/bin/go`):

```sh
GOTOOLCHAIN=local CGO_ENABLED=0 GOOS=darwin GOARCH=amd64 /workspace/.toolchains/go1.27.1/go/bin/go build -trimpath -buildvcs=false -ldflags='-s -w -X main.version=1.0.0' -o /tmp/launcher-amd64 .
GOTOOLCHAIN=local CGO_ENABLED=0 GOOS=darwin GOARCH=arm64 /workspace/.toolchains/go1.27.1/go/bin/go build -trimpath -buildvcs=false -ldflags='-s -w -X main.version=1.0.0' -o /tmp/launcher-arm64 .
```

Root owns the universal executable, `.app` packaging, Go notices, package hash, instructions, publication and native architecture inspection. Launcher version is `1.0.0`, wrapping game `1.0.1` and manifest build `7524dd0797af0673`. Production source was held before root cross-built both Mac architectures; later additions are test and implementation-evidence files only.

Developer diagnostics: `--headless --game-dir /absolute/path/to/game` runs the real foreground server without opening a browser, at the same fixed port. `--version` prints the launcher version. `--serve` and `--ready-fd=3` are internal child arguments. Tests inject temporary listener addresses internally; this is not a shipped CLI option.

Verification uses actual loopback listeners and detached subprocesses on Linux: 18 top-level tests plus 42 parameterized cases. The suite covers ready browser opening, a surviving server after the entrypoint returns, reopen/session reuse, mismatched versions/builds, eight simultaneous launches settling on one server, unrelated port ownership, startup-child cleanup, browser-opener failure and retry, SIGTERM, complete graceful Quit response, hostile Host/Origin/referrer/nonce requests, rooted assets, symlink escape, exact bytes/MIME, range serving, no directory listings, fixed save origin, translocated bundle paths and incomplete assets. `go test -race -count=1 ./...` and `go vet ./...` passed. `UNIT-EVENTS.jsonl` records the final ordinary test run, and `VERIFY.json` records checks and source pins.

Limits: Linux execution does not verify Finder double-click, Mac `/usr/bin/open`, native alert appearance, Safari, macOS quarantine/Gatekeeper, code signing or notarization. Mac binaries cross-compiled successfully in root's separate build checks; this implementation receipt does not claim native Mac execution. No background launcher is intentionally left running after tests. Requested model settings are not backend identity attestation.
