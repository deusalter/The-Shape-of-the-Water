# The Shape of the Water

A playable literary detective game about a borrowed mirror, an obstructed door, and a claim to see reality without conditions. Three people have a material dispute to settle and reasons to keep arguing after its answer is known. Working title and canon are accepted by the session's sole lead writer as a provisional baseline; they are not owner-approved.

The current game contains 21 scenes and 50 choices, two material evidence routes, consequential public/private disclosure, optional personal encounters, revisits, and two closing scenes. Kant's conditions and limits of experience and Spinoza's God or Nature and ethical development changed the actual arguments and discoveries. See narrative/MANUSCRIPT.md for the full derived reading copy; src/content/case.json is authoritative. The two rejected alternatives, earlier versions, exact voice anchors and editorial decisions are preserved.

## Run in the authorized cloud workspace

Requires Node 24 and pnpm 11.19.0. From the project directory:

```sh
pnpm install --frozen-lockfile
pnpm dev:player
```

The player is served on port 4173. For the author application, run `pnpm dev:studio` and open `/studio.html` on port 4174. The studio contains spoilers. It edits the real format and uses separate draft/preview storage.

```sh
pnpm build
pnpm preview:player
pnpm preview:studio
```

Player and studio builds are in dist-player and dist-studio. The player supports offline play after its interface reports verified readiness. Serve the build over localhost or an HTTPS origin; opening index.html directly as a file is not supported. The supplied archive includes both built applications and a history/local-history.bundle containing local Git checkpoints. These are cloud preview instructions, not a published site or a claim that a cloud localhost URL reaches another machine.

To serve the supplied player build without installing JavaScript dependencies, run `python3 -m http.server 4173 --bind 127.0.0.1 --directory dist-player` in the authorized workspace. The studio can likewise be served from dist-studio on a separate port; open its `/studio.html` path.

## Verify and continue

```sh
pnpm verify
python3 tools/check_packet.py
node tools/verify-tests.mjs
node tools/verify-engine.mjs all
```

Exploration exits 2 when its budget is exhausted; that is INCONCLUSIVE. It is not a test pass. Browser checks require built previews at ports 4183 and 4184: start `pnpm preview:player --port 4183` and `pnpm preview:studio --port 4184`, then run `pnpm test:e2e`. Chromium is expected at /usr/bin/chromium. `test:a11y` runs the same suite, not a separate accessibility certification.

Read RESUME.md, docs/execution/HANDOFF.md and CONTINUE_PROMPT.md before editing. Newer explicit owner instructions control, then docs/OWNER-KICKOFF-v4.md, then compatible revision-3 specifications. baseline/revision3 is the unchanged specification package, not an older implementation. Never reset this project to its unstarted seed.

This is a tested playable checkpoint, not full revision-3 acceptance. Remaining work includes the explicit selected-evidence deduction and NPC knowledge models, migrations/branch metadata, further studio operations, and human-paced literary/accessibility review. Exact executed checks and limits are in docs/execution/HANDOFF.md. No human playtest or measured duration is claimed. Player execution requires no live AI, login or paid service.
