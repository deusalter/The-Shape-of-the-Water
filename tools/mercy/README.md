# Mercy content integration

The lead writer owns `narrative/mercy/**`. These tools consume that directory's ordered `manifest.json` and JSON modules. They preserve every paragraph, choice, source and record verbatim; only stable paragraph IDs are added. There are no prose joins or runtime-generated narrative.

Run from the repository root:

```sh
node tools/mercy/compile.mjs --diagnose
node tools/mercy/compile.mjs --staging
node tools/mercy/compile.mjs
node tools/mercy/compile.mjs --check
node tools/mercy/index-sources.mjs
node tools/mercy/verify.mjs
pnpm exec vitest run tests/mercy-content.test.ts
```

`--diagnose` validates available modules and reports unresolved references without creating a playable content file. `--staging` publishes their physical staging for the world renderer. A normal compile requires every manifest module and valid complete content. It writes `src/content/case-v7.json`, exact source hashes and paragraph provenance, and final staging. It does not change the installed edition or retained earlier editions. `--check` requires all compiled outputs to match current inputs exactly.

`verify.mjs` uses the shipped V2 engine. It explores available choices and every supported minimal proof route, retaining only state properties that can affect subsequent engine guards. Decorative flags and alternate transcript histories do not multiply equivalent states. It checks source, scene, choice and variant coverage; wrong, incomplete and unearned proof rejection; paths to actual endings; ordinary hint/reading acceptance; and exact replay of both completed ending directions. It fails on the explicit state bound, missing content, offered actions rejected by the engine, inaccessible authored proof routes, or nonterminal states without a completion path. Its report states the limits: it does not enumerate all corroborator supersets, every transcript permutation or human comprehension.

The witness file contains actual command payloads from a fresh run for each covered item. Browser checks can read choice labels and evidence titles from the pinned content and execute these same payloads through the UI. Command IDs and expected revisions must be recreated for each run; consequential choices need the existing engine confirmation receipt.

Mercy does not call an engine occasion transition. Distinct scene and restored-character IDs express the two story returns and the chosen final return. The accumulated player notebook and seen transcript remain intact. NPC knowledge changes only through explicit actions. Source copies retain their original provenance; the compiler rejects derived material whose metadata would falsely supply a new independent origin in this engine mode.

`node tools/mercy/correction-input.mjs` builds the requested four-scene player-only correction excerpts from the final invitation and limited-account proof witnesses. It replays both routes through the shipped engine and pins the inputs separately under `docs/reviews/MERCY-WHOLE-29/correction-input/`. It verifies that the original blind reading matches its original pin before and after generation.
