# Q-003 author draft durability repair

**PASS for the two reported defects and the bounded regressions below. Code is ready for root integration; no commit was made.** Final focused tests: **20/20 PASS**. Typecheck and isolated production studio build: **PASS**. Actual built Chromium verification: **6/6 groups PASS**, no page errors. No full-suite run was made while the engineer was changing the occasion runtime.

## Reproduction and repair

Both external Q-002 defects were reproduced in a newly built studio on `127.0.0.1:4344`, using the normal author controls on the then-current 3D revision. The baseline browser report's PASS means the expected defect was observed, not that the original behavior was acceptable.

- **Q2-01:** importing a differently identified author project with a blank opening title succeeded, but saving failed because its preview belonged to the previous project. Author export worked. The repaired studio now tracks verified previews by project identity. A never-valid independent draft has `lastValid: null`, can save and export, and cannot activate a preview. Importing it while the previous project's preview is open closes that preview; undo/redo restores only a matching baseline. After the new project validates, subsequent invalid edits preserve its own verified preview.
- **Q2-02:** clearing the first source's provenance field correctly produced compile diagnostics but also rejected both author save and export. No download occurred. The author document now permits bounded unfinished strings in provenance, references, flags, condition/proof operands, and other editable text. Its structural kinds, collection limits and stable project identity remain checked. Runtime validation and compiled player export remain strict. The cleared value survives save/reload and export/import exactly, while the prior matching valid preview remains separate.

Author storage still rejects invalid or differently identified nonnull previews. A stored null baseline does not discard a subsequently verified same-ID preview already in memory. Its existing database and envelope format remain readable; nullable preview is an explicit new alternative, not an unchecked object. Author saves use the checked envelope's identity as their key. Toolbar save/export use the latest committed draft reference, including blur edits. A no-op load/import now reports success instead of leaving an earlier status message.

The author format retains its 10 MiB UTF-8 and 50,000-character field bounds and now rejects nesting beyond 64 before recursive schema parsing. Pretty author export falls back to compact JSON when indentation alone would exceed the import budget; this preserves roundtrip at the boundary. Failed save advice recommends author export only when that draft is exportable; unsupported shapes instead point to copying the current draft from Advanced full project JSON. Author annotations and fixed events remain outside compiled player content.

No evidence engine, case, player, or world source was edited by this worker. The committed `worldContentId={lastValid.id}` preview forwarding remains present. Root owns 3D rendering and occasion integration acceptance.

## Executed evidence

All commands were run from `/workspace/literary-detective` unless another directory is shown.

| Command | Actual result |
| --- | --- |
| `pnpm exec vite build --mode studio --config docs/reviews/AUTHOR-DURABILITY-03/vite.config.mjs --outDir docs/reviews/AUTHOR-DURABILITY-03/baseline-dist` | PASS; isolated original-defect build |
| `pnpm exec vite preview --host 127.0.0.1 --port 4344 --strictPort --outDir docs/reviews/AUTHOR-DURABILITY-03/baseline-dist` | Started private baseline server |
| `node docs/reviews/AUTHOR-DURABILITY-03/browser.mjs baseline` | Exit 0; both expected original defects reproduced, 01:22:56–01:22:59 UTC |
| `pnpm exec vitest run tests/author-draft-durability.test.ts --reporter=verbose` | Before repair: 3 PASS / 9 FAIL, exit 1; real durability failures captured |
| `pnpm exec vitest run tests/author-draft-durability.test.ts tests/author-project.test.ts tests/preview-scenario.test.ts --reporter=verbose` | Final: 20 PASS, exit 0; final timing in `focused-unit.txt` |
| `pnpm typecheck` | Exit 0; final output in `typecheck.txt` |
| `/workspace/literary-detective/node_modules/.bin/vite build --mode studio --config ../vite.config.mjs --outDir ../fixed-dist`, from `docs/reviews/AUTHOR-DURABILITY-03/runtime` | Exit 0; frozen snapshot build, timing in `fixed-build.txt` |
| `cp -r docs/reviews/AUTHOR-DURABILITY-03/runtime/public/world docs/reviews/AUTHOR-DURABILITY-03/fixed-dist/world` | Copied pinned world assets to this isolated build only |
| `pnpm exec vite preview --host 127.0.0.1 --port 4345 --strictPort --outDir docs/reviews/AUTHOR-DURABILITY-03/fixed-dist` | Started private repaired-build server |
| `node docs/reviews/AUTHOR-DURABILITY-03/browser.mjs fixed` | Final exit 0; 6/6 PASS, final times recorded in `fixed-browser.json` |
| `git diff --check -- src/studio src/persistence/author-project.ts tests/author-draft-durability.test.ts` | Exit 0 |

A coordinator review found a further concrete timing edge: importing a valid new-ID project and saving before worker completion stores a null baseline. After that same draft validates, loading its identical saved envelope previously cleared the newly verified preview without triggering another content effect. `AUTHOR_QA_ONLY=Q003-null-baseline-load node docs/reviews/AUTHOR-DURABILITY-03/browser.mjs null-edge-before` reproduced this in Chromium with the actual built validation worker delayed by two seconds: exit 1, preview disabled after load. The repair now keeps an already verified same-ID cached baseline on null-envelope loads. The final sixth browser group verifies this exact timing. Earlier 5/5 PASS evidence and the report before this edge are preserved in `history/before-null-load/`.

The first repaired browser attempt, preserved under `history/first-fixed/`, had 3 PASS / 2 FAIL. One failure exposed unchanged-draft Load leaving a stale status; production feedback was repaired. The other was a harness error: it attempted a second Undo after loading a draft and reimporting exactly the same document, which adds no history entry. That assertion was corrected to the actual single load edit. Save/export roundtrips had already succeeded in that attempt. An intermediate focused 19-test PASS is superseded by the final 20-test PASS, which adds the near-limit compact-export regression.

The baseline build was produced from the live working tree before these repairs. `baseline-source-pins.json` was captured after that build and before browser execution; it is not a claim that all concurrent engine edits were frozen throughout bundling. Its author files were unchanged before the original failures were reproduced. The final browser build uses the complete frozen `runtime/` source snapshot recorded in `fixed-source-pins.json`, so later sibling edits cannot alter this browser evidence. The development engine occasion code present in that snapshot is recorded, not certified by these author checks. Build warnings concern Zod comment annotations and bundle size; the build completed.

## Tested behavior and boundaries

The thirteen new behavioral tests independently cover independent-project null-baseline durability; empty provenance exact roundtrip; unfinished reference/condition/proof/flag/record/version/occasion values; repaired content executing an added OR proof route in the actual engine; export byte-budget roundtrip; previously saved nonnull preview compatibility; rejection of foreign/invalid previews, unsupported fields, bad project identities, oversized fields/documents, and excessive nesting without replacing the saved draft. Seven existing author/preview tests cover annotations, fixed events, OR support, rename/delete safeguards, worker cancellation/supersession, and isolated injected scenario semantics.

The six built-browser groups cover:

1. Q2-01: independent invalid import while the old preview is open; save, export, reload/reimport/load, preview/compiled-export disabled, old preview absent, identity-safe undo/redo.
2. Q2-02: clear provenance; invalid diagnostics and compiled export disabled; save/reload, exact export/import; prior matching preview retained; undo/redo of the saved draft.
3. Pending blur followed directly by toolbar export/save and two-level undo/redo; saved edited title recovered after reload.
4. Ordinary preview accepts one action; injected scenario accepts its own action under another identity; restoring and remounting ordinary preview preserves its exact exported command history. Only the separate studio preview database was created, not the ordinary player database.
5. An independent project's first successful validation enables its own preview; a later invalid edit preserves that project's opening and accurately labels it as the last valid content.
6. Delay delivery of the actual worker's result; save a valid new-ID project while its envelope baseline is null; let validation succeed; load the identical saved draft; its own newly verified preview remains available and accurately identified.

Limits: structurally unsupported JSON and over-budget documents remain rejected author imports/saves; Advanced full project JSON is a manual textual rescue path for unsupported edits. No exhaustive malformed-input testing, IndexedDB quota/transaction fault injection, new worker network-failure browser experiment, accessibility audit, full-game run, complete 3D/offline validation, or human playtest is claimed. Worker cancellation/supersession is covered by the existing focused test; external Q-002's later A05 recheck remains separate evidence. Existing compile validation is deliberately not weakened.

## Exact repair pins

| File | SHA-256 |
| --- | --- |
| `src/studio/project.ts` | `51a4b2a1cf3047aa9c09e586faf6a87def4b8f24924795e3a0d82c34e4c5f4f8` |
| `src/studio/EvidenceStudio.tsx` | `5f160e4b0d3139585fb06d99f284156b0ce51a5816f9f8f506f64e849ad9022d` |
| `src/persistence/author-project.ts` | `db167d23f76da5ef29b14765e184af4bef39640c38965954c5e78a853989ad33` |
| `tests/author-draft-durability.test.ts` | `963da59b1222bf417aafc4f852e6c171de14b1a8e4a0577b55c7a9517d30639e` |

`RESULT.json` confirms the three repair source files still match the exact final browser snapshot. Full source/dependency pins, downloaded roundtrips, screenshots, build logs and browser observations are retained in this directory. No source-stability claim is made for sibling-owned files after the snapshot. Private preview servers used ports 4344/4345 and were stopped after verification (see `server-cleanup.json`); root's separate 3D verification workspace and servers were untouched.
