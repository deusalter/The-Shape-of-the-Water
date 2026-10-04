# The Shape of the Water

An original literary psychological detective game in active development, following male protagonist Blaise Bloom through a surreal living country. The selected rewrite, **The Second Mouth**, concerns bodily transformation, local recurrence and a deliberately prepared restoration that leaves two independently living continuations. Its concrete investigation and metaphysical arguments must each earn their conclusions.

The owner reopened the earlier bath premise. Read `docs/OWNER-WORLD-REBUILD-2026-10-04.md` and `narrative/rebuild/SELECTION-AND-DISPOSITIONS.md`. The new first movement is being compiled and integrated; the default currently preserves the old v2 prototype until that integration passes. The five-movement 65–85k encountered-word structure is a projection, not written length or measured playtime. This is not a completed game.

Actual Hello Charlotte reference research is in `research/reference/hello-charlotte/`. Primary-source Kant and Spinoza inquiry is in `research/philosophy/`, with renewed world research in `world-rebuild/`. Kant concerns phenomena, noumena and the conditions and limits of experience; Spinoza concerns God or Nature and the Ethics through freedom, intellectual love and blessedness. Historical doctrine and original fictional laws remain distinct. No researcher claims to have played Hello Charlotte.

The game uses React/TypeScript/Vite, a deterministic evidence engine, IndexedDB, Three.js and original Blender geometry: third-person exploration with faceless block figures. No live AI or paid API is needed to play. Earlier work is preserved, including its runnable edition and exact encountered transcripts.

## Run in the authorized cloud workspace

Requires Node24 and pnpm11.19.0.

```sh
pnpm install --frozen-lockfile
pnpm dev:player
```

Player: port4173. Run `pnpm dev:studio` for the author application at port4174 `/studio.html`. The studio edits the real v2 format, validates in a separate worker, preserves incomplete drafts, and has isolated ordinary and explicitly noncanonical scenario previews. It contains spoilers.

```sh
pnpm verify
pnpm preview:player
pnpm preview:studio
```

Builds are in `dist-player` and `dist-studio`. Use localhost or HTTPS; directly opening HTML files is unsupported. Offline play is ready only when the built player's interface confirms verified assets for the installed story hash. No live AI or paid service is required to play.

## Verify and continue

`pnpm verify` runs typecheck, tests, current content validation and both builds. For actual Chromium checks, serve the builds at ports4183 and4184, then run `pnpm test:e2e`. The v2 browser runner is `tools/browser-v2-check.mjs`; the old runner and historical reports are preserved as legacy evidence. `/usr/bin/chromium` is expected. `test:a11y` runs the same suite, not a separate accessibility certification.

Read `RESUME.md`, `docs/execution/HANDOFF.md`, `docs/execution/STATE.json`, and `CONTINUE_PROMPT.md` before editing. Newer explicit owner instructions control, followed by `docs/OWNER-KICKOFF-v4.md`, then compatible revision3 specifications. `baseline/revision3` is the untouched planning package, not an earlier implementation.

`src/content/selection.json` identifies the current playable bundle; `src/content/case-v2.json` is the retained bath prototype. The untouched v1 bundle is retained under `src/content/legacy/`, and `src/content/case.json` remains historical. Read `narrative/rebuild/SELECTION-AND-DISPOSITIONS.md` and its linked new prose; older reading orders describe the preserved bath iteration. Earlier transcripts and accepted/rejected drafts remain preserved.

Separate chats coordinate through the owner-selected GitHub repository and `docs/coordination/GITHUB-WORKFLOW.md`. Each team has its own branch and proposal/report directory. One lead writer integrates final prose. No public deployment or human playtest is claimed. The latest executed checks and remaining gaps are in the handoff and reviews.
