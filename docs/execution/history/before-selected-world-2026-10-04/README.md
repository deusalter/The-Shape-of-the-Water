# The Shape of the Water

An original literary psychological mystery in active development. Male protagonist Blaise Bloom investigates an obstructed cabinet, an optical claim, and a recurrence that unsettles the continuity of his own life and the people he remembers. Kant concerns conditions and limits of experience; Spinoza concerns God or Nature and the ethical development of understanding, freedom and intellectual love. Historical doctrine and fictional commitments are documented separately. The title remains provisional.

The default application now runs the v2 first-night case: 22 scenes, 52 choices, explicit selected-evidence proofs, private disclosures, illustrated investigation, historical transcripts, and reviewed legacy migration. This is a short implemented opening case, not the completed expanded game. The recurrence scenes and developed endings are under active literary/engineering integration. The4–6-hour first-play target is unmeasured.

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

Current playable content is `src/content/case-v2.json`; `src/content/selection.json` identifies the active format. The untouched v1 bundle is retained under `src/content/legacy/`, and `src/content/case.json` remains historical. See `narrative/CURRENT-READING-ORDER.md` for current prose and selected expansion scenes. Earlier transcripts and accepted/rejected drafts remain preserved.

Separate chats coordinate through the owner-selected GitHub repository and `docs/coordination/GITHUB-WORKFLOW.md`. Each team has its own branch and proposal/report directory. One lead writer integrates final prose. No public deployment or human playtest is claimed. The latest executed checks and remaining gaps are in the handoff and reviews.
