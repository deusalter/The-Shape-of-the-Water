# Independent engine verification, 2026-10-03

The implemented compact engine passes **55 independent automated tests**. The small noncanonical fixture has a complete conditional navigation search. The authored case has explicit completed routes and full scene/choice coverage in the bounded navigation search, but universal completion is **INCONCLUSIVE**. This report does not certify the full revision-3 engine specification, literary quality, owner approval, or human playtesting.

## Tested revision and evidence

Workspace: `/workspace/literary-detective`, authorized cloud Linux x64, Node `v24.19.0`. The test runner recorded `2026-10-03T21:04:38.435Z`; the exploration runner recorded `2026-10-03T21:05:09.616Z`. Each recorded SHA-256 hashes before and after execution; both reported `sourceStable=true`. Full hashes, stdout, seeds, budgets, frontier samples and command traces are retained in:

- `tests/verification/artifacts/tests.json`
- `tests/verification/artifacts/exploration-all.json`
- `tests/verification/artifacts/authored-traces.json`

The authored compiled-content hash is `0bd022ad793897d6a92c6dbd7054951c7ca8e07ea5d8158ad786d6e3279be432`. Its JSON file SHA-256 is `267c334773b0883d18b481e3c15b730ce1d840410298ec0cb7d882b79b08b086`. The two hashes intentionally cover different representations.

| Tested source or contract | SHA-256 in final independent test run |
| --- | --- |
| `src/engine/game.ts` | `03e6dc0be8b1612ddc57c6f8384b975ca8c83f96195e606b1c01afc4c91e5434` |
| `src/engine/types.ts` | `667836d8e23d2fdd94e53a4f925dc1643b7b394ee426f14e69f9d19353678611` |
| `src/engine/hash.ts` | `eaac5792696012f9291d5ba937835ce1f1ef0196e3e0e35262813775ba2a028b` |
| `src/engine/schema.ts` | `d32024095103744199d0e675e17e3ce7c8c3d7edafd4688f75476c16300886ae` |
| `src/engine/validate.ts` | `ebdf96f237c196354e26e27652a82a8ae9c96626530a492e7fc0aebd31539463` |
| `src/persistence/store.ts` | `97ae10529f780f8bd4ecfe92d41ba66a3a53b58bd91cb6a14d4cd9ba88ee59d4` |
| `src/content/fixture.ts` | `b54c7d91b96cb5f7f369fd91c77d5846eed001f5771545d3689650ea2226ded1` |
| `src/content/case.json` | `267c334773b0883d18b481e3c15b730ce1d840410298ec0cb7d882b79b08b086` |
| `docs/contracts/ENGINE-API.md` | `6d41eaba6ca4d2b94ebb5d5fd337b62bd2be072dca4516a6098a0395537d5fe7` |
| `package.json` | `905c4efe332f583f3c899107e53cb72135301f4aef22eef73911882f87a88a5a` |
| `pnpm-lock.yaml` | `4ecf0990a9acab360c58bffb27346ed1e3a5751aaab7f612a69186cd93ee82f4` |

The test and exploration artifacts contain the complete source lists, including verification code. The final rerun includes the engineer’s change requiring every supplied confirmation receipt to match, the frozen 50-choice authored case with a guarded optics return, and the final API documentation. An earlier rerun was conservatively marked INCONCLUSIVE when ENGINE-API.md changed during execution; the final runs below have stable pins. The earlier standalone fixture evidence is preserved under artifacts/history/exploration-fixture-earlier.json and is not the final revision evidence. These results apply to those bytes; later edits require the affected checks again.

## Exact executed commands

All commands ran with working directory `/workspace/literary-detective`.

| Command | Final outcome | Evidence and scope |
| --- | --- | --- |
| `node tools/verify-tests.mjs` | PASS, exit 0 | 5 files, 55 tests; child command `node node_modules/vitest/vitest.mjs run tests/verification --reporter=verbose`; seed 20261003, 120 runs per property |
| `node tools/verify-engine.mjs all` | INCONCLUSIVE overall, exit 2 | Results in table below; `exploration-all.json` |
| `pnpm typecheck` | PASS, exit 0 | TypeScript checks current project including independent tests |

The first harness runs exposed test-construction errors: a property callback returned a matcher result; a pending ending reused an ID subsequently committed by another action; an inspection helper specified the old database version; and one proposed route addressed Miriam before the player had met her. These were corrected in the verification harness. No engine source was edited and no reproducible engine defect was established by those failures.

## Real-engine exploration

Default budgets are 25,000 discovered states, 500,000 transitions and 60,000 ms **per search**. Every edge dispatches `applyChoice` with an eligible production choice, a fresh deterministic command ID, the current revision and, where needed, `confirmationFor`. Rejected advertised actions and concrete nonterminal states without choices are failures. For a completely explored component, reverse reachability from real terminal states identifies configurations without a terminal path. Incomplete components cannot support a universal softlock/completion claim.

| Content | State identity | Outcome | States | Transitions | Expanded | Frontier | Replayed terminal scene witnesses | Stop |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| fixture | guard-abstraction | PASS | 29 | 40 | 29 | 0 | 1 | complete |
| fixture | exact | INCONCLUSIVE | 25,000 | 25,000 | 23,620 | 1,380 | 1 | state-budget |
| case | guard-abstraction | INCONCLUSIVE | 25,000 | 43,845 | 15,514 | 9,486 | 2 | state-budget |
| case | exact | INCONCLUSIVE | 25,000 | 25,000 | 7,586 | 17,414 | 0 | state-budget |

No concrete softlock or advertised-choice rejection was observed in these searches. The authored navigation search reached **all 21 scenes and all 50 choices**. The exact authored search remained too shallow to reach a terminal, which is not a claim that no terminal exists. Its independent authored-route suite replayed 28 completed traces.

**Exact search** hashes the complete `GameState`: content identity/hash, revision, scene, ending, every flag and encountered record, complete transcript and processed command IDs. Histories are not merged. It enumerates representative fresh-command delivery paths; arbitrary ID spelling and duplicate/invalid delivery are separately property-tested. Cyclic return paths therefore consume the state budget.

**Guard abstraction** retains exact content identity/hash, current scene, ended, all flags and each observation/interpretation/relationship's ID, literal text and source scene. It ignores acquisition order/revision, transcript history and past command IDs. Inspection of current `availableChoices`, `matches`, scene requirements and choice guards confirms that navigation reads content identity, scene, ended and flags. Record sets are retained conservatively. Fresh command IDs, current expected revision and newly computed confirmation receipts are assumptions. A test compares eligible choices and successor keys between differing histories that share a guard key.

This abstraction is **not full behavior equivalence**: `applyChoice` rejects at revision 10,000, confirmation receipts bind the full state, and historical UI/save text matters. Its reachability claim assumes sufficient remaining command budget. The completed fixture abstraction has terminal witnesses from every navigation configuration, not a guarantee that a player who loops until the resource cap can finish. Re-audit the projection whenever guards or state semantics change.

Explorer self-tests deliberately provide an acyclic terminal fixture (exact PASS with replay), a concrete dead-end fixture (FAIL with replay), a cyclic fixture with state/transition exhaustion (INCONCLUSIVE with frontier), cancellation (INCONCLUSIVE), and a completely explored terminal-free navigation component (FAIL). A budget-exhausted run never becomes PASS.

## Implemented behavior checked independently

Seeded properties cover deterministic command replay, frozen source/state preservation, literal observation preservation, immutable transcript prefixes, monotonic acquired records, idempotent committed-ID redelivery, arbitrary JSON/unknown-ID safe rejection, stale revision rejection, save/export replay equivalence, and SHA-256 agreement with Node's independent implementation including Unicode. Seeded programs run against both the software fixture and authored case. Fast-check's seed and minimized counterexample are retained in failure stdout when a property fails.

Confirmation tests reject a changed action ID and a receipt obtained before an intervening move. The accepted ending has a current receipt. Unknown future passage titles, variant text and observation text remain absent from the initial `currentPassage` and encountered-only export. This is an engine-projection check; it does not test DOM, accessible labels, direct URLs, search, or production asset exposure.

The 28 authored terminal traces include 24 combinations of:

- separately collected live evidence or the continuous recording;
- each of the two authored responses to the optics demonstration;
- public or private factual reporting;
- staying to help, staying only for supper, or leaving.

Another trace presses Miriam and shames Simon, then completes the case through authored access. Another revisits the cabinet after an early interpretation, preserves the original literal observation and passage occurrence, and adds a revised interpretation. Two additional traces select each optics commitment in turn, revisit the demonstration and complete through optics-return. They prove that the return is unavailable before the first commitment, that both commitment actions are unavailable on revisit, and that the original stripe observation, interpretation and transcript occurrence remain unchanged. Seeded authored programs also assert that narrow_card and disputed_card are never both recorded. Every trace uses actual engine dispatch and save replay validation. These are direct engine routes, **not browser routes**. The two evidence paths verify present flag gates, **not** submitted-reference AND/OR proof semantics.

Independent persistence tests use `fake-indexeddb`, not a browser durability simulation. They verify transaction abort retaining the prior commit; injected quota error retaining prior progress and exportable candidate; two concurrent stores with one CAS winner and one conflict without BroadcastChannel; current-checksum corruption recovering a validated prior checkpoint while retaining exact damaged bytes; third-backup recovery after current plus two newer backups are corrupted; invalid/unearned state refusing replacement; same-version changed text returning incompatibility while retaining the original/export; and two completed ending archives preserving their common history and distinct disposition records. They do not establish real browser crash durability or correct visual Saved/Unsaved labels.

The AST audit traverses all local engine modules (`game`, `hash`, `schema`, `types`, `validate`), permits the declared Zod validation dependency and rejects unreviewed external/engine-outside imports, ambient DOM/storage/network/time/random APIs, executable DSL APIs and dynamic imports. Zod's entire library implementation is not claimed to be exhaustively audited. A separate exercised path runs engine operations and Zod validation with throwing Date, Math.random, DOM, storage and network traps. Both checks pass. Engine modules import no React, persistence or studio code.

## Remaining revision-3 checks and limits

| Requirement | Status | Reason |
| --- | --- | --- |
| AC-E01–E04, implemented command subset | PASS within tested scope | Seeded replay/freeze/redelivery/rejection properties; this format has no enum or nested condition DSL |
| AC-E05 and AC-G06–G08 submitted proof routes/supersets/provenance | NOT IMPLEMENTED | No `submitDeduction`, selected references, `DeductionDefinition` or nested proof evaluator; flag gates cannot certify these |
| AC-E06 deterministic automatic interpretation closure | NOT IMPLEMENTED | Interpretations are authored explicit choices; no automatic closure API |
| AC-G04 NPC knowledge/disclosure | NOT IMPLEMENTED as specified | Concrete relationship flags exist; no independent character-belief/statement knowledge model |
| AC-G11 guarded/reveal-confirmed hints | NOT IMPLEMENTED | No hint command/model |
| AC-E07 normal engine projections | PASS within tested scope | Initial passage/export excludes injected unseen markers; browser/asset boundary checked separately by root |
| AC-E08 source dependency purity | PASS within audited scope | AST local dependency audit plus exercised ambient traps; no exhaustive third-party source claim |
| AC-E09 budget reporting | PASS | Search self-tests and actual bounded runs report INCONCLUSIVE/frontier |
| AC-E10 terminal/dead-end trace replay | PASS within tested scope | Sentinels and authored terminal traces use production engine |
| AC-S01–S03/S05–S06 transaction and validation behavior | PASS within fake-indexeddb scope | Abort/quota/CAS/corruption/invalid candidate tests; UI policy and actual browser shutdown not tested here |
| AC-S04 supported-version migration fault injection | NOT IMPLEMENTED | Unknown text hashes are refused/preserved; no declared cross-hash transformation/compatibility manifest |
| AC-S08 ending preservation | PARTIAL | Ending bytes and common history retained; explicit runId/branchParent graph metadata absent |
| AC-G12 DOM/URL/search spoiler leak checks | NOT RUN here | Root owns browser validation |
| Author workspace, offline, accessibility, hostile browser rendering | NOT RUN here | Root/engineer own relevant browser/build checks; this report does not infer passes |
| Full authored-game universal fairness | INCONCLUSIVE | Both bounded authored searches retain frontier states |
| Human reasoning, voice, philosophy, pacing and duration | NOT RUN by this suite | Automated engine checks and agent simulations cannot establish human playtest findings |

No production source, canonical prose, root manifest or existing engineer test was modified by the verifier. Verification files are restricted to `tests/verification/**`, `tools/verify-*` and this report.
