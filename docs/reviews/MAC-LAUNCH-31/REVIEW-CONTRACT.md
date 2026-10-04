# Mac launcher review contract

Scope: add a Finder-launchable Mac bundle around the exact published optimized game, retaining the browser origin `http://127.0.0.1:4173`. No story, save-format or game-asset changes. Review execution is on Linux, so Finder, Gatekeeper, App Translocation and native macOS runtime behavior remain unverified.

The practical implementation is a short-lived `.app` entrypoint that starts a detached server child, opens `/__launcher/` in the default browser, and exits. Opening the bundle again executes the entrypoint and reuses an existing server only when its launcher protocol and exact game-manifest digest match. Keeping a plain Go entrypoint alive as the application would leave Finder reopen AppleEvents unhandled. The native child does not require Python, Node, a shell or a terminal window.

The child binds only `127.0.0.1:4173`. An unrelated or incompatible occupant must produce a clear error rather than moving browser saves to a different port. Every request validates the exact Host, and Quit requires POST, the server's random token, and the expected Origin. The control page must not be cached or framed. Game paths stay confined to the bundle's `Contents/Resources/game`; the bundle is treated as read-only and located relative to the executable rather than the working directory.

The unchanged game service worker serves cached game assets and forwards an uncached live `/__launcher/` request. It falls back to the cached game index for failed navigation requests. Consequently, a control page reloaded after the local server stops can show the offline game. The Quit response must show that the server stopped, without depending on a later GET that can hit that fallback. This preserves the exact published worker while keeping normal launch and stop behavior clear.

The universal executable contains byte-preserved amd64 and arm64 Mach-O slices at correctly aligned offsets. ZIP Unix mode bits must mark the launcher executable and the `.app` directories traversable. The arm64 slice's ad-hoc signature must remain valid after assembly. This is an executable integrity signature, not an Apple Developer ID signature, notarization ticket, or approval of the bundle by Gatekeeper.

Official sources inspected on 2026-10-04:

- [Go 1.27 release notes](https://go.dev/doc/go1.27), Ports/Darwin: "Go 1.27 requires macOS 13 Ventura or later". The Linker section identifies the default minimum `LC_BUILD_VERSION` as `13.0.0`. Set the bundle minimum to macOS 13.
- [Apple, Safely open apps on your Mac](https://support.apple.com/en-us/102445): for an app the user chooses to trust, use System Settings, Privacy & Security, Open Anyway, then Open. This creates a per-app exception for future double-click launches. Managed Macs may restrict that choice. Do not promise a first-launch bypass, or ask the user to disable Gatekeeper globally.
- [Apple, Launch Services Keys](https://developer.apple.com/library/archive/documentation/General/Reference/InfoPlistKeyReference/Articles/LaunchServicesKeys.html): `LSUIElement` identifies an agent app that does not appear in Dock or Force Quit; `LSMinimumSystemVersion` supplies the minimum supported OS. `LSMultipleInstancesProhibited` is not an AppleEvent handler.
- [Go linker ad-hoc signature implementation](https://github.com/golang/go/blob/master/src/cmd/internal/codesign/codesign.go): the code-signature load command identifies a SuperBlob/CodeDirectory with hashes of executable pages. Verify these hashes from the packaged arm64 slice; do not call that a native `codesign` or `spctl` check.

Planned evidence: source review, Linux tests of the same Go source, final ZIP structure/modes/asset equality/Mach-O signature inspection, and an actual Chromium launch/save/reload/reopen/quit smoke using the bundled game resources. Native macOS validation remains a stated limit.
