# Fresh bounded checkpoint review, 2026-10-03

Status: two reproducible recovery findings were repaired and independently rechecked against rebuilt applications. Both findings are closed within the tested scope below; no additional bounded-checkpoint blocker was established. This is not final acceptance of revision 3, literary quality, philosophy, accessibility or all possible game histories.

The requested reviewer configuration was Astra, Extra High, accepted by the delegation tool. Actual backend model identity was not independently exposed. This reviewer wrote only this report and spawned no agents. Browser probes used disposable Chromium contexts in the authorized cloud workspace; production content and user data were not changed.

## Scope and revision

Read AGENTS.md, the full controlling v4 kickoff, README.md, RESUME.md, the current HANDOFF/STATE and baseline reconciliation; CONTENT/ENGINE-API contracts; selected persistence/studio clauses of the technical specification; the actual engine, validation/schema, player, studio and persistence implementation; the browser harness and relevant tests; recorded command/browser/independent-verification evidence; AUTHOR-NOTES.md and CANON.md; and all 21 current scenes, choices and variants. This was a bounded implementation and disclosure review, not a new primary-source philosophy audit or complete baseline-specification audit.

The 21-scene, 50-choice case remained at file SHA-256 `267c334773b0883d18b481e3c15b730ce1d840410298ec0cb7d882b79b08b086`, canonical content hash `0bd022ad793897d6a92c6dbd7054951c7ca8e07ea5d8158ad786d6e3279be432`. Final literary authority remains the completed sole lead writer; no canon changes are proposed by this review.

Hashes below identify the pre-repair source and built applications used for the reproductions. Root was still updating handoff files and static hash/rehearsal tooling; those moving artifacts were not treated as completed fresh-session evidence.

| Reviewed file | SHA-256 before repairs |
| --- | --- |
| src/App.tsx | `d7dbed156f9cd6dd8d7aa2b1fc48baf687f192ae451e03beaba2a4b139bd240b` |
| src/Studio.tsx | `4212e6687ffef21475e779375dd7fc095e090cbc6bcbe0f08151dfe8c296db97` |
| src/persistence/store.ts | `97ae10529f780f8bd4ecfe92d41ba66a3a53b58bd91cb6a14d4cd9ba88ee59d4` |
| src/persistence/studio.ts | `9c5bd8a81076b4807c60cf7256a7dd84a9106fa83692a3dcee0ef869a6daec06` |
| src/engine/game.ts | `03e6dc0be8b1612ddc57c6f8384b975ca8c83f96195e606b1c01afc4c91e5434` |
| src/engine/validate.ts | `ebdf96f237c196354e26e27652a82a8ae9c96626530a492e7fc0aebd31539463` |
| docs/contracts/ENGINE-API.md | `6d41eaba6ca4d2b94ebb5d5fd337b62bd2be072dca4516a6098a0395537d5fe7` |
| narrative/AUTHOR-NOTES.md | `3bd6c885f09f68f258c5251b00375e88aa4a9e4d49904c48b149dbd901a8e7df` |
| dist-player/asset-manifest.json | `3363b6266c1035f004e1a779dc4843ff90700dbc482098d04fadfed80f6b5c10` |
| dist-player/assets/index-BbmsO8sa.js | `9cc4eb2bb2545a4ea33601039edcf5cafa45f1f03815b4660bf59e86f3265d28` |
| dist-studio/assets/studio-DrYUlv_h.js | `fd0599df2c2ea914c0bb54687d9db81ef38c3fc601b0d471fe863e29acfa255a` |

## Findings

### CR-01 — P2: retrying a failed replacement loses the promised archive

Location at the reviewed revision: `src/App.tsx:47–55`, replacement calls at lines 71/81/96, and the Retry saving handler at line 94. The store correctly archives only when its `archiveCurrent` option is true. The controller passes that option during replacement, but does not retain it after failure. Retry saving calls `saveProgress(gameRef.current)` with the default false value.

Reproduced through the production player at `http://localhost:4183` in an isolated Chromium context:

1. Start fresh; choose `arrival-cabinet`, then `cabinet-infer`, waiting for each successful save. The committed prior run has revision 2.
2. Open Start or import a run. Temporarily replace `IDBObjectStore.prototype.put` in this page with a function that throws `new DOMException('Injected full storage', 'QuotaExceededError')`, retaining the original function for restoration.
3. Click Start a new run and Confirm action. The new initial state remains active in memory and the quota warning appears; the prior committed run remains intact at this point.
4. Restore the original `put` function. Click Retry saving and wait for Progress saved.
5. Inspect the player's `slots` and `archives` object stores, or the Archived runs summary.

Actual fresh-probe output:

```json
{"step":"failed-restart","heading":"The Shape of the Water","notice":"Browser storage is full. Your active run is still in memory; export it before closing this page."}
{"step":"retry-saved","activeRevision":0,"backupRevisions":[2,1,1],"archiveCount":0,"archiveUI":"Archived runs (0)"}
```

The previous run survives only in rolling backups, without the promised accessible archive, and is eligible for pruning after subsequent successful saves. The same controller path is used by import and loading an archived branch; those fault variants were inferred from code, not separately executed in the initial probe.

Repair requirement: retain replacement/archive intent until a successful atomic save or an explicit abandonment of that candidate. It must survive both Retry saving and continued acknowledged unsaved play. Verify the exact prior committed state in archives, not merely a nonzero archive count.

Status: closed after repair and independent direct-retry/continued-unsaved-retry browser checks below. The original reproduction is preserved above.

### CR-02 — P2: a successfully saved incomplete studio draft cannot be loaded

Location at the reviewed revision: `src/persistence/studio.ts` save/load methods and the Save studio draft action in `src/Studio.tsx`. Save accepts the structured editor's current draft without validating its shape, while load rejects the saved draft through strict `contentSchema.safeParse`. Empty required text is an ordinary intermediate state permitted by the editor.

Reproduced through `http://localhost:4184/studio.html` in another isolated Chromium context:

1. Acknowledge spoilers. Clear Scene title and press Tab to commit the edit.
2. Confirm diagnostics say the draft is invalid and preview retains the last valid content.
3. Click Save studio draft and observe the success message.
4. Reload, acknowledge spoilers again, and click Load studio draft.

Actual fresh-probe output:

```json
{"step":"before-reload","title":"","notice":"Studio draft saved in its separate browser database."}
{"step":"after-load","title":"The Shape of the Water","notice":"Studio load failed validation or storage access. Your active draft remains in memory."}
```

The saved incomplete draft still exists in IndexedDB but cannot be resumed through the studio. The restored editor instead contains the shipped content. This is a recovery defect and misleading success state; it is distinct from the already documented absence of complete studio operations.

Repair requirement: persist and restore a safely bounded editor draft representation that permits ordinary incomplete text while separately validating the last valid playable preview, or refuse that save truthfully without implying the draft is recoverable. Preserve the previous valid preview and the draft's incomplete fields across reload.

Status: closed after repair and independent invalid-title save/reload/last-valid-preview browser check below. The original reproduction is preserved above.

## Executed and inspected checks

Fresh command executed by this reviewer before repairs:

```sh
pnpm exec vitest run tests/engine.test.ts tests/storage.test.ts tests/case.test.ts tests/verification/authored-routes.test.ts tests/verification/persistence.test.ts --reporter=dot
```

Result: exit 0, 57 tests passed in 5 files. This passes the selected existing tests, including the two evidence paths, relationship failures, replay/confirmation and persistence cases; it did not cover the two controller/studio failures above.

A separate fresh browser probe exported a two-action player run, restarted, rejected a changed-transcript import with a stale checksum while retaining the current initial passage, imported the intact run after confirmation, and reloaded the same saved passage. It reported `normalImportRoundTrip=PASS`, `tamperedImportRefused=PASS`, `importAfterReload=PASS`, and `Archived runs (2)`. The positive import path is therefore not broadly broken at the reviewed revision.

Inspected initial evidence reported 78 tests across 9 files in `pnpm verify`, 55 independent tests, and 11 Chromium checks at the accepted case hash. Their scopes and limits are stated in the handoff and independent report. The browser harness actually exercises the named controls; its prior suite did not exercise failed replacement retry or invalid studio draft recovery. Its accessibility results are automated Chromium findings, not manual certification. The bounded explorer's remaining frontier is explicitly INCONCLUSIVE and has not been promoted to a pass. Updated repair evidence is recorded below.

## Narrative and completion assessment

No additional blocking route or disclosure defect was established in this bounded read. The live-evidence and continuous-recording routes lead to appropriately different source statements in the report passage. The factual sequence remains separate from inaccessible intentions, an undiagnosed medical state and competing metaphysical claims. Public/private disclosure has an intelligible cost rather than forcing Ada to keep the player's silence. Damaging relationship choices restrict private encounters while preserving factual access. The guarded optics revisit preserves the earlier interpretation instead of allowing both opposing commitments.

README, RESUME, HANDOFF and STATE make the incomplete checkpoint status clear. The selected-evidence proof model, independent NPC knowledge, migration/branch metadata and other named baseline gaps are known unfinished work, not new findings. No owner approval, human-paced playtest or universal history safety is established. The two recovery findings have received the scoped closure below; broad save/recovery claims still need their documented limits.

## Residual limits and closure

Root's final hash manifest and handoff fault-injection rehearsal were still being prepared during the initial review. A static rehearsal cannot establish a new-chat continuation. This reviewer has not certified either as a fresh-session test.

No physical apparatus model, full philosophy-source rereading, human literary pacing, real assistive technology, Firefox/WebKit, physical-device crash/eviction durability, stress/performance testing or exhaustive state exploration was performed here. AUTHOR-NOTES already records the concentrated optics argument and unprototyped geometry/light response; those remain real limits, not newly discovered defects.

## Independent post-repair closure

Executed on 2026-10-03 after root rebuilt and froze the repaired source, player build version `d101e5860c588e8d`. The case, engine and narrative were unchanged. Root identified code commit `c90f1e1`; file hashes below are the direct checks used for this review.

Inspected the repair diff. `ReplacementIntent` tracks requested and persisted generations outside fictional state. Save jobs capture their generation; only a successful commit clears that generation, so an earlier queued save cannot erase a newer replacement request. A successful explicit load abandons the pending candidate. Studio persistence now uses the same strict, bounded draft-envelope boundary for save and load, permits incomplete text and supported intermediate editor values, and separately validates the playable preview.

Fresh independent Chromium checks used new isolated contexts and the rebuilt applications:

| Check | Observed result |
| --- | --- |
| Original failed restart, restore writes, direct Retry saving | PASS. Exactly one archive matched the entire original revision-2 state; active scene `arrival`, revision 0; reload restored that active run. |
| Failed restart, acknowledge unsaved mode, choose `arrival-miriam`, restore writes, Retry saving | PASS. Exactly one archive matched the entire original revision-2 state; active scene `bench`, revision 1; reload restored it. |
| Blank scene title, save studio draft, reload, load draft, preview | PASS. Blank title recovered exactly, invalid diagnostics remained, and separately validated preview showed `The Shape of the Water`. |

Fresh command `pnpm exec vitest run tests/replacement-intent.test.ts tests/studio-storage.test.ts --reporter=dot` passed 13 tests in 2 files, exit 0. The parameterized restart/import/archive-branch unit cases exercise their shared intent/store mechanism; they are not three separately executed UI fault paths. The independent browser closure above exercised restart. Normal player import/reload had separately passed before repair.

Inspected root's updated command evidence: `pnpm verify`, packet checker and `pnpm test:e2e` all report PASS/exit 0. Root reports the full verify run now contains 91 tests in 11 files. The browser report contains 13 passing checks, including both recovery regressions, with empty console/page-error arrays. These are root-executed results, distinguished from this reviewer's narrow independent reruns. Existing independent engine tests and exploration retain their original scope; the repaired files are outside those pinned engine/persistence dependencies.

| Rechecked file | SHA-256 after repairs |
| --- | --- |
| src/App.tsx | `1cfd47cdfbc233354aa8fdf8102aa535091f0da144f5e69ec20b22021045ee16` |
| src/persistence/studio.ts | `86a4e1f0a7bf2863b4fcf53f617aef881835eaee2dca3a7fe5465bd7c9940201` |
| tests/replacement-intent.test.ts | `a3651365f3d98ce1f367790a761ebd048289695a80bf0a4ece5c4085a04e3591` |
| tests/studio-storage.test.ts | `bc307b66ba56d066e18afb2d4cb437c4df886b1bfd82885801b00d0a99be6d53` |
| dist-player/asset-manifest.json | `af144926d14f0f06d246098ed151bcae9f20c06ca65b2a643dd658cb8dc50feb` |
| dist-player/assets/index-DK-hxVp4.js | `ee21569b287d2f270e6a02692cf3a986423b2a9d1e8bec751601c426a4b561fe` |
| dist-studio/assets/studio-DTOu170l.js | `622b8228c86fda951335dd9160996eebf5c6a6d7826098e842bc244350012a2a` |
| docs/execution/evidence/browser/report.json | `b11f0142e614ae4f91a044f646fa08b29350ca83e2133f2a181d57cd439f47d9` |

Final case SHA-256 recheck remained `267c334773b0883d18b481e3c15b730ce1d840410298ec0cb7d882b79b08b086`. Closure applies to the described recoveries at these bytes; it does not remove the residual limits above.
