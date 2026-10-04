# The Shape of the Water

**The Mercy of Morning** is a complete playable literary psychological mystery. Blaise Bloom lives in Aubade, a city whose patron can restore one particular morning. When Julian disappears, Blaise investigates a miracle he has already used to change their life together. The shared story follows the disappearance through its explanation, Blaise's own loss of memory, a public performance, and consequential endings.

Third-person 3D follows Blaise through an uncanny city populated by faceless figures. Sustained dialogue and inner monologues investigate causality, identity, knowledge, God and recurrence. The story draws on research into Kant and Spinoza while keeping its invented rules distinct from their historical arguments.

## Play

Download [The-Shape-of-the-Water.zip](releases/The-Shape-of-the-Water.zip), extract it, and run `python3 play.py` inside the extracted folder. On Windows, use `py -3 play.py`. Python 3 and a modern browser are required. The launcher opens the game and serves it only on your own computer. Keep that terminal open while playing.

Move with WASD, arrow keys, or a click on the floor. Press E for a nearby action. Every story action is also available beside the text. The header offers text size, a text-focused view, and the encountered-evidence notebook. Progress saves in this browser; export your encountered run to keep an independent copy. After restarting, use **Take over saving** if prompted. Opening `index.html` directly is unsupported.

No account, live AI, paid API, or network service is needed to play. The browser caches the game for offline use. Content includes emotional manipulation, memory loss, religious coercion and a remembered life-threatening injury.

Version 1.0.1 improves selected-story loading, stops idle 3D rendering and reduces repeated save validation. Existing text editions and save identities are unchanged. See the [performance measurements and limits](docs/execution/evidence/mercy-optimization/README.md).

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
