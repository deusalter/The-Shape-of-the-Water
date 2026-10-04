# The Shape of the Water

**The Mercy of Morning** is a complete playable literary psychological mystery. Blaise Bloom lives in Aubade, a city whose patron can restore one particular morning. When Julian disappears, Blaise investigates a miracle he has already used to change their life together. The shared story follows the disappearance through its explanation, Blaise's own loss of memory, a public performance, and consequential endings.

Third-person 3D follows Blaise through an uncanny city populated by faceless figures. Sustained dialogue and inner monologues investigate causality, identity, knowledge, God and recurrence. The story draws on research into Kant and Spinoza while keeping its invented rules distinct from their historical arguments.

Update 1.0.2 adds location-specific warm/cool lighting, deeper atmosphere, finer stonework, crafted theatre seating, glowing lanterns and a redesigned reading frame. The story and existing save format are unchanged.

## Play on Mac

**[Download the Mac app](https://github.com/deusalter/The-Shape-of-the-Water/raw/refs/heads/main/releases/The-Shape-of-the-Water-Mac.zip)** (macOS 13 Ventura or later; Apple silicon and Intel).

1. Extract the download.
2. Double-click **The Shape of the Water.app**. You can also move it to Applications.
3. Click **Play**. The game opens in your usual browser. No Python, Node or terminal commands are needed.

Play opens a separate tab. Return to the launcher's tab and click **Quit** when finished. Double-click the app again if you need to reopen the launcher.

The app is not Apple-notarized. If macOS blocks the first opening, use **System Settings → Privacy & Security → Open Anyway**, then confirm **Open**. See [Apple's instructions](https://support.apple.com/en-us/102445). The package was cross-built and inspected on Linux; native Finder/Gatekeeper/Safari execution has not been verified in this workspace.

When replacing an older app, quit its launcher and close all game and launcher tabs. If an offline browser still shows the previous look, close those tabs once more and reopen the app; the prepared update activates without clearing your saves.

Use the same browser to keep existing saves. The app uses the previous launcher's default local address; close an older running launcher before opening the app. Saves made on a different fallback port need an exported run imported into this app. Progress stays in the browser, and **Export encountered run** keeps an independent copy. After restarting, choose **Take over saving** if prompted.

Move with WASD, arrow keys, or a click on the floor. Press E for a nearby action. Every story action is also available beside the text. The header offers text size, a text-focused view, and the encountered-evidence notebook.

No account, live AI, paid API, or network service is needed to play. The browser caches the game for offline use. Content includes emotional manipulation, memory loss, religious coercion and a remembered life-threatening injury.

The [original cross-platform ZIP](releases/The-Shape-of-the-Water.zip) remains available for Python 3 users: extract it and run `python3 play.py` (Windows: `py -3 play.py`). Opening `index.html` directly is unsupported.

The Mac app contains the unchanged optimized game, version 1.0.1. See the [performance measurements](docs/execution/evidence/mercy-optimization/README.md) and [Mac launcher verification](docs/execution/evidence/mac-launcher/README.md).

## Develop and verify

Node 24+ and pnpm 11.19.0:

```sh
pnpm install --frozen-lockfile
pnpm dev:player
```

`pnpm dev:studio` starts the separate authoring interface. It edits and exports validated static content and keeps author projects and previews separate from player saves.

```sh
pnpm mercy:compile
pnpm mercy:verify
pnpm verify
pnpm mercy:package
```

The player uses React, TypeScript, Three.js, a deterministic narrative engine and IndexedDB. The Mercy world is original procedural geometry. The literary source is [narrative/mercy](narrative/mercy/); the selected compiled edition is `src/content/case-v7.json`. Compilation preserves the lead writer's exact prose. Retained earlier editions keep their own content identities and saves.

See [the delivery record](docs/execution/HANDOFF.md) for exact build, browser, offline and review evidence and their limits. Automated checks and AI editorial readings do not constitute human playtesting or an assessment of literary greatness. Graphics are stylized and restrained; this is a finished playable first release, open to further owner-directed revision.

## Research and preservation

[The philosophy map](narrative/mercy/PHILOSOPHY-MAP.md), [author notes](narrative/mercy/AUTHOR-NOTES.md), [name sources](narrative/mercy/NAMES.md) and [review dispositions](narrative/mercy/REVIEW-DISPOSITION.md) explain the work. Research into Hello Charlotte concerns psychological development, tonal changes and personal stakes; no characters, plot, signature devices or assets were copied. Its source limits are recorded in [the reassessment](research/reference/hello-charlotte/reassessment-2026-10-04/REASSESSMENT.md).

Earlier proposals, rejected drafts, exact voice anchors and source checks remain preserved. The older bodily-support story is not the current premise. [CONTINUE_PROMPT.md](CONTINUE_PROMPT.md) is a self-contained starting point for another chat. The repository and bundled dependencies retain their recorded licensing and provenance; the downloadable player includes third-party notices.
