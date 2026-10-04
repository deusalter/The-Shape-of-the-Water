# Mac launch review

Disposition: no blocker found in the reviewed source, exact final ZIP, or Linux HTTP/browser checks. The candidate is `releases/The-Shape-of-the-Water-Mac.zip`, 9,163,637 bytes, SHA-256 `c4cfdb90c5fe230e9b36d54dfc695ba810eddb84a358904e0150be447c5513a9`.

This is a universal macOS 13+ app bundle with a short-lived Finder entrypoint and a detached local server. It requires no Python, Node, package installation or terminal commands from the player. It opens a browser control page with Play and Quit. An unsigned/not-notarized first launch may require Apple's per-app Open Anyway flow. Actual Finder, Gatekeeper, Safari, App Translocation and Mac process behavior have not been executed in this Linux workspace.

## Source review

Reviewed the six production inputs in `docs/execution/evidence/mac-launcher/BUILD-SOURCE-PINS.json` and `tools/package-mercy-mac.py`. The game directory is executable-relative and remains read-only; `os.OpenRoot` confines static access. The server binds IPv4 loopback on fixed port 4173. Existing listeners must match launcher protocol/version and the exact manifest digest before reuse; unrelated listeners fail instead of changing the save origin. The parent receives bounded child startup notification, checks the live server identity, opens the control page and exits. This avoids relying on an unimplemented application-reopen AppleEvent handler.

HTTP requests validate the exact Host. Quit requires POST, same Origin, a random process token, and a bounded form body. Control responses are not cached and cannot be framed. The existing game service worker forwards uncached live control requests, while successful Quit updates the current page without a later GET. The service worker itself is unchanged.

One small review finding was corrected before packaging: the control page's `display:flex` rule could override the HTML `hidden` attribute after Quit. The shipped `.actions[hidden]` rule now hides Play and Quit correctly. The actual browser check verifies this result. No other source fix was requested.

## Exact package inspection

`PACKAGE-CHECK.json` records 40 unique safe ZIP entries, traversable directories, launcher mode 0755, expected plist/entrypoint, and matching macOS minimum. Every one of the 25 game files is byte-identical to the published optimized ZIP, including the service worker; all 23 manifest asset hashes match. Build `7524dd0797af0673` and content identity `09fc3576b1c788c95989c18b2fafa3fd53c8ad540549b904a995e54bf03f504b` are unchanged.

The universal file contains x86_64 and arm64 slices at 16 KiB-aligned offsets. Both declare minimum macOS 13.0.0 and SDK 26.2.0. All 2,293 arm64 signature page hashes verify in the packaged slice. This checks the Go linker's preserved ad-hoc executable signature, not Developer ID, bundle resource sealing, notarization, native `codesign`, or Gatekeeper acceptance. The first checker run exposed a local parser-variable collision; the checker was corrected and the unchanged ZIP passed.

## Actual browser checks

`BROWSER-SMOKE.json` and `browser-smoke.mjs` record Chromium at 1440×1000 with software WebGL. The original ZIP first established a saved action and its controlling service worker at `http://127.0.0.1:4173`. After stopping that server, a Linux compilation of the same pinned Go source served the exact game resources extracted from the Mac ZIP. Only the temporary diagnostic executable was replaced; the final ZIP was not changed.

The existing worker delivered the live control page, Play opened a separate tab, and the original saved export remained exactly equal. Keyboard movement left the story record unchanged. Another action saved and reloaded exactly; importing the original export and reloading also reproduced it exactly. Unrelated Host, GET Quit, foreign or missing Origin, and an invalid token were rejected. A second launcher process reused the same server identity and token. Quit hid Play and stopped the process; the game still reloaded its unchanged save offline. Restarting the server restored the live control page at the same origin.

No page errors or external HTTP requests occurred. The reviewer visually inspected `launcher.png`. All smoke-test server processes were stopped and port 4173 was verified free afterward. Production source hashes still matched the packaged source pins after testing.

## Limits

The browser test exercises shared Go server behavior and exact resource/save continuity on Linux. It does not establish native Mac launch behavior or Safari compatibility. The initial macOS security exception and any managed-device restrictions remain platform behavior. Reloading the control URL after stopping the server can show the cached offline game because the unchanged worker falls back for failed navigations; opening the app again restores the live control page. Broader engine, whole-story and retained-edition tests were not repeated because all game bytes are unchanged and prior release evidence remains applicable.
