# Mac app launch

The owner asked for easier startup without terminal commands and selected Mac. The new `releases/The-Shape-of-the-Water-Mac.zip` is a self-contained universal app around the exact optimized game. The original general ZIP and all literary/runtime files remain unchanged. This is a launch and distribution change, not a new text edition.

## Use

Extract the Mac download, open **The Shape of the Water.app**, then click **Play**. macOS 13 Ventura or later is required. Both Apple silicon and Intel executables are included. Python, Node and Go are not needed by the player. A modern default browser is required. The app can be moved to Applications.

The launcher page opens Play in another tab and offers **Quit launcher** when finished. Opening the app again restores that page and reuses the recognized local game process. Browser saves retain the previous address, `http://127.0.0.1:4173`. An unrelated or older service occupying that address produces an error rather than silently moving to an empty save location. Existing browser tabs retain their normal ownership/takeover behavior.

This independent app has no Apple Developer ID signature or notarization ticket. The arm64 executable carries the Go linker's ad-hoc integrity signature. That is not Apple approval. If macOS blocks a first opening, Apple's graphical procedure is System Settings → Privacy & Security → Open Anyway, then Open: https://support.apple.com/en-us/102445. No disabling Gatekeeper or terminal commands are requested.

## Implementation

`desktop/launcher/` is a standard-library-only Go module. The short-lived macOS entrypoint starts a detached server child, verifies readiness, opens the default browser and exits, so subsequent Finder openings execute the entrypoint again. The child remains until Quit or a termination signal. The app reads resources relative to its executable and never writes inside its bundle. Reuse requires the same protocol, launcher version and exact game-manifest digest.

The server binds IPv4 loopback only, validates Host, confines file access through `os.OpenRoot`, rejects directory listings and sets correct static MIME types. Quit requires a same-origin POST with a random session token. The live control page is not cached. Its successful Quit message is rendered directly without navigating after shutdown, since the unchanged game's service worker can supply its cached game for failed navigation requests.

`tools/package-mercy-mac.py` validates the original player ZIP, all asset hashes and build identity, then copies its 25 game files without rebuilding them. It compiles darwin/amd64 and darwin/arm64 using official Go 1.27.1, wraps the byte-preserved slices in a universal executable, and records executable/directory permissions in the ZIP. The bundle includes dependency and Go-runtime notices. `releases/MAC-PACKAGE.json` pins the archive, executable slices and original player archive.

The compiler download and its verified official SHA-256 are recorded in `TOOLCHAIN.json`. `/usr/bin/go` in this workspace was an unrelated executable and was not used. Building again requires Go 1.27.1 and Python 3 for packaging; these are developer requirements only:

```
python tools/package-mercy-mac.py --go /path/to/go1.27.1/bin/go
```

## Evidence and limits

`BASELINE.json` records unchanged game inputs and the original published archive. `BUILD-SOURCE-PINS.json` records the exact source used for the two Mac builds. `package-output.txt` is the actual cross-build output. The independent reviewer owns `../../../reviews/MAC-LAUNCH-31/`, including the ZIP/Mach-O checker, browser migration diagnostics and final disposition. Launcher tests and their implementation record are under `implementation/`.

The workspace is Linux. It can execute the same Go server and browser flow, inspect native Mac binary structure and verify signature page hashes. It cannot execute Finder, AppleScript alerts, Gatekeeper, App Translocation or Safari here. Those native checks remain explicitly unverified. No new complete-game playthrough is claimed for a wrapper-only change: the exact unchanged player retains the separately recorded 530-test and four whole-story checks from the optimized release. No public website, paid service or signing account was created.

Final acceptance: `VERIFY.json` records all checks passing within the stated platform limits. The Go suite passed 18 top-level tests and 42 subcases, race detection and vet. Actual browser migration/reload/import/reuse/Quit checks passed. The archive has 40 safe entries and 25 unchanged game files. The downloadable ZIP is 9,163,637 bytes; its exact digest is in `releases/MAC-PACKAGE.json`.
