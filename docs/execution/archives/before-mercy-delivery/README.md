# The Shape of the Water

**Current production: The Mercy of Morning.** The owner rejected the bodily-support premise and has now asked to finish its replacement. Blaise Bloom investigates a missing lover in Aubade, a city whose patron can restore a familiar morning. The full proposal and source research are preserved in `narrative/replacement-proposal-2026-10-04/`; actual production scenes are in `narrative/mercy/`. Third-person faceless 3D, deterministic narrative, saves and authoring tools are being integrated around the complete shared story and earned endings.

The replacement is not yet the selected build. `src/content/selection.json` still names the preserved earlier edition until the whole new content bundle validates. Read `docs/OWNER-RESUME-PRODUCTION.md` and `CONTINUE_PROMPT.md` for the controlling current task. The older README below describes that retained implementation, not the replacement story.

## Earlier implementation documentation

An original literary psychological detective game in active development, following male protagonist Blaise Bloom through a surreal living country. The selected rewrite, **The Second Mouth**, concerns bodily transformation, local recurrence and a deliberately prepared restoration that leaves two independently living continuations. Its concrete investigation and metaphysical arguments must each earn their conclusions.

The owner reopened the earlier bath premise. Read `docs/OWNER-WORLD-REBUILD-2026-10-04.md` and `narrative/rebuild/SELECTION-AND-DISPOSITIONS.md`. The default player now continues through either the orchard or the shed-room theatre to Emil’s house: 63 scenes and 86 authored choices. Six engine-executed routes encounter 7,609–8,131 passage words each; alternatives and notes are not added together as play length. The earlier first movement and bath prototype remain available through edition links with separate saves. The six-movement 65–82k encountered-word structure is a projection, not written length or measured playtime. This is not a completed game.

Actual Hello Charlotte reference research is in `research/reference/hello-charlotte/`. Primary-source Kant and Spinoza inquiry is in `research/philosophy/`, with renewed world research in `world-rebuild/`. Kant concerns phenomena, noumena and the conditions and limits of experience; Spinoza concerns God or Nature and the Ethics through freedom, intellectual love and blessedness. Historical doctrine and original fictional laws remain distinct. No researcher claims to have played Hello Charlotte.

The game uses React/TypeScript/Vite, a deterministic evidence engine, IndexedDB, Three.js and original Blender geometry: third-person exploration with faceless block figures. No live AI or paid API is needed to play. Earlier work is preserved, including its runnable edition and exact encountered transcripts.

## Run in the authorized cloud workspace

Requires Node 24 and pnpm 11.19.0.

```sh
pnpm install --frozen-lockfile
pnpm dev:player
```

Player: port 4173. Run `pnpm dev:studio` for the author application at port 4174 `/studio.html`. The studio edits the actual version-2 evidence schema, validates in a separate worker, preserves incomplete drafts, and has isolated ordinary and explicitly noncanonical scenario previews. It contains spoilers.

```sh
pnpm verify
pnpm preview:player
pnpm preview:studio
```

Builds are in `dist-player` and `dist-studio`. Use localhost or HTTPS; directly opening HTML files is unsupported. Offline play is ready only when the built player's interface confirms verified assets for the installed story hash. No live AI or paid service is required to play.

## Verify and continue

`pnpm verify` runs typecheck, tests, current content validation and both builds. For the current country chapter, serve `dist-player` at port 4190 and run `node tools/browser-country-check.mjs` with the six `narrative/rebuild/readings-v5/*.run.json` files, putting `kept-test-dry-tracing-pipe-written.run.json` first for its spatial-action check. `tools/browser-country-studio.mjs` checks the built studio at port 4191. The earlier first-movement runner needs its retained `?edition=second-mouth-v4` URL. The retained-edition/author regression runner is `tools/browser-v2-check.mjs`, using player/studio ports 4183/4184 and `?edition=first-night`. Earlier runners and exact historical reports remain preserved. `/usr/bin/chromium` is expected. `test:a11y` runs the same suite, not a separate accessibility certification.

Read `RESUME.md`, `docs/execution/HANDOFF.md`, `docs/execution/STATE.json`, and `CONTINUE_PROMPT.md` before editing. Newer explicit owner instructions control, followed by `docs/OWNER-KICKOFF-v4.md`, then compatible revision 3 specifications. `baseline/revision3` is the untouched planning package, not an earlier implementation.

`src/content/selection.json` installs case-v5; case-v4 is the retained first movement, and case-v2 the retained bath prototype. There is no automatic cross-edition save migration. The untouched v1 bundle is retained under `src/content/legacy/`, and `src/content/case.json` remains historical. Read `narrative/rebuild/SELECTION-AND-DISPOSITIONS.md` and its linked new prose; older reading orders describe the preserved bath iteration. Earlier transcripts and accepted/rejected drafts remain preserved.

Separate chats coordinate through the owner-selected GitHub repository and `docs/coordination/GITHUB-WORKFLOW.md`. Each team has its own branch and proposal/report directory. One lead writer integrates final prose. No public deployment or human playtest is claimed. The latest executed checks and remaining gaps are in the handoff and reviews. Current compilation passes 496 automated tests, typecheck, content validation and both builds. Current browser and source evidence is under `docs/execution/evidence/country-integration/`; historical v4 verification remains under `second-mouth-integration/`. The country and first house visits are installed. The deliberate bodily return, washing/Ethics V encounter, comparisons/confrontation and endings remain separate manuscript work with explicit setup debts. The projected full game is unfinished.
