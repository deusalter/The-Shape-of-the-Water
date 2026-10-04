# Independent evidence/knowledge v2 verification, 2026-10-03

**PASS for the tested isolated runtime.** The final pinned run passed 34 independent tests in two files: 30 new v2 tests and four dependency/purity checks. `pnpm typecheck` also passed. Independent testing found a real provenance defect, the engineer repaired it, and both the positive regression and overlap negatives now pass. This does not accept the player interface, author workspace, actual case, migrations in browser storage, time-loop structure, or the expanded game.

## Actual execution and source pins

Working directory: `/workspace/literary-detective`. Environment: authorized cloud Linux x64, Node v24.19.0, locked dependencies, Vitest v3.2.7. The fixture is independently authored, noncanonical, and defined in `tests/verification/evidence-v2-independent.test.ts`. It investigates a latch using inspection, photograph, maintenance entry, receipt, private testimony and a copied account. It does not import the engineer's cup fixture or engineer-owned tests.

| Executed command | Actual outcome |
| --- | --- |
| `pnpm exec vitest run tests/verification/evidence-v2-independent.test.ts --reporter=verbose` | Initial FAIL: 28 passed / 1 failed; original runtime hash below |
| `node tools/verify-evidence-v2.mjs` | Initial pinned FAIL: 32 passed / 1 failed, source stable; full stdout/stderr retained |
| `node tools/verify-evidence-v2.mjs` | Final PASS: 34 / 34 tests, exit 0, source stable; run completed `2026-10-03T23:30:14.244Z` |
| `pnpm typecheck` | PASS, exit 0, after final independent run |

Intermediate passes remain separate dated artifacts. The final child command is recorded verbatim in `tests/verification/artifacts/evidence-v2/run-2026-10-03T23-30-14-244Z.json`. It runs the independent v2 file plus `tests/verification/dependencies.test.ts`, not the full application test suite. Exact before/after hashes cover all 15 engine files, the executed test files, both contracts, package/lock files and harness. No pinned source changed during the final run. The property seeds are 2026100303 (60 program runs) and 2026100304 (100 arbitrary-JSON commands).

| Tested dependency or verification source | Final SHA-256 |
| --- | --- |
| `evidence-runtime.ts` | `7084f4240416b1283bbaa9270797b0d4e0f373dad88e8b112f88f4add2979948` |
| `evidence-proof.ts` | `639882a3792a10aba7160ea2c14ac23a15a7dbab9201f5226f7fcc88b555a0d2` |
| `evidence-validate.ts` | `e679959c2b6e1ebb07d47a7980c7266a2555c8e3b5aa6a9c249cb890791960af` |
| `evidence-schema.ts` | `9e8e261fd95037a8f75e30861aa4d408bd3b02b662e2c4570f0926198df44583` |
| `evidence-types.ts` | `e1528422d8e02da6e89d8173a570df8aedf35db455f226409bcc9450bdd4db8b` |
| `evidence-budget.ts` | `31de32f49420577b6a14b2e433275b5ecb3c433e106ffd32612a3ae721f174a1` |
| `evidence-portable.ts` | `e862e2e2acb7242b1b7895fbf948c002496b81500c216c34db4ae937e9946227` |
| `evidence-migration.ts` | `7da526e04438178f7e3cb36f996ea458369dbd50ea1f814d93f1621ef8fead07` |
| `evidence-v2.ts` facade | `e23776590b33f0d188bd85529e77dc2270a69da31e4c3099036b87e35275db47` |
| Legacy `game.ts` | `03e6dc0be8b1612ddc57c6f8384b975ca8c83f96195e606b1c01afc4c91e5434` |
| `EVIDENCE-KNOWLEDGE-V2.md` contract | `7f5347aad51c416def4b7ede0a6a228cb74fe185a5723355b23dc04c73a69c53` |
| Independent v2 test file | `7aa3e6c0a9d228e8d519e6b86b94e0fc8cfe0d3792c1e8861ff5a71ebbb41461` |
| Dependency audit test file | `66e53862b21e052a77cb547eba885586219b4137f7a1c679ab03286b9065e016` |
| Verification harness | `7f991b15c3601bbd9e74207c7d746bb783c1d1af4e2d4810736d1079fc77e02d` |

The independently constructed fixture's canonical content hash is `56005c491074c5363b795103de2f75fa180770f26dbc1207062466ff9453fbd3`. This is a canonical content hash, not a raw JSON-file hash; the fixture's source pin is the test file above. The original runtime that failed was `13ccffec8cc5f3a0dd359664a471f40d4f5d195eccbaba6cd522106e8277096c`.

## Defect found and resolved

The first independent run accepted a non-independent proof using testimony and its transcription, both from `porter-account`. It then rejected an independent AND between that accepted deduction and a photograph from `camera`. The two participating references have disjoint originating sets, `{porter-account}` and `{camera}`. Repeated origin entries *inside* one deduction are not a cross-reference overlap.

The original runtime flattened ancestry entries and rejected any repeated origin anywhere in the resulting array. It therefore rejected valid independent corroboration. The defect was reported to root and engineer with the exact fixture and failing command. The engineer now deduplicates origins within each participating reference and rejects intersection between participating references. The unchanged regression passes. Negative tests still reject a deduction combined with its own source, repeated direct references, two same-origin direct sources, and a photograph reused from the actual accepted deduction witness. The repair does not promote copies to independent sources.

Initial evidence is preserved in `artifacts/evidence-v2/history/first-run-failure.json` and `run-2026-10-03T23-25-07-077Z.json`. The first direct run's summary is labeled as observed tool output rather than a retained full log; the first pinned run contains complete stdout/stderr. A TypeScript inference issue in the verifier's invalid-map test was separately corrected; it was a test typing problem, not another engine defect.

## What was checked independently

The selected-proof fixture has a nested AND of two ORs, giving four explicit factual witness alternatives. A manually enumerated set of eight acceptable selections includes those four witnesses with or without one declared corroborator. All **64 subsets** of six earned references were dispatched through the real engine and compared to this independent oracle. Possessing the other sources cannot satisfy a missing selection, alternative-route extras cannot silently bypass support, and a copied statement remains an irrelevant extra unless authored as part of a witness. Unknown, unearned and duplicate selected IDs reject with the same old state. Contradictory feedback depends on selected known material; an unsupported claim does not name the supported answer. Guarded feedback requiring an unseen reference remains absent.

Provenance tests cover direct copied origins, repeated references, accepted-deduction ancestry, and a valid distinct-origin corroboration after the repair. Two states with the same accepted deduction ID have different future outcomes when their recorded witnesses differ: a photograph adds a fresh origin after the inspection/log route, but overlaps after the photograph/log route. Consequently, a v2 search cannot soundly collapse accepted deductions to IDs while ignoring relevant ancestry.

Actual knowledge tests hear a private claim, then disclose it to one chosen character. Hearing does not inform that character or change the speaker's belief. The speaker can claim that nothing moved while believing that something did; the records remain separate. An explicit disclosure changes the chosen NPC's knowledge and a guarded returned passage without informing another NPC or rewriting the earlier occurrence. Explicit belief revision leaves claims, encountered source text and accepted factual deductions intact. An unearned disclosure is neither advertised nor accepted.

Initial player projection and portable export are searched for distinct hidden source IDs/titles/text, NPC belief markers, proof fields, supported-answer metadata, future paragraph text, unavailable hint labels and unseen reading prose. Those markers are absent before the relevant encounter. A reading may become internally eligible without exposing its text; explicit review captures the text. A factual hint reveal requires a fresh receipt, acquires only its declared source, and does not submit a deduction. These are engine/projection checks, not DOM, accessible-name, network or authored-prose audits.

Closure runs under three different authored rule orders and waits for related references before extending its chain. Reacquisition does not duplicate sources or eligible readings. Unseeded cycles, negative/NPC-belief closure predicates, empty proofs, invalid independent OR, excessive depth/nodes, cyclic malformed input and 512 witness expansions safely reject. The valid 64-expression-node and 256-pre-dedup-expansion boundaries remain executable; the next expression node rejects. This checks concrete validation bounds and finite small closure, not performance of every maximum-size author project.

Seeded accepted programs compare deterministic replay, frozen inputs, literal history prefixes, duplicate committed IDs and every internal state field after portable/internal validation. Arbitrary JSON, stale revisions and forged receipts reject with identical old state. The retained eight-command terminal trace includes source collection, actual disclosure, explicit reading review, ordinary and confirmed revealing hints, factual submission, and confirmed ending. Portable replay and internal validation reproduce its terminal SHA-256 `6b5c9ca2e7b844dd846182e2defa29510b29bd81fae6e070df2453fbb1af673b`.

## Migration and resource limits

The independent old bundle is a separately validated v1 fixture. Migration requires its installed exact bundle and a hash-pinned manifest; missing context/bundle, changed manifest or old-state receipts, undeclared mappings, unmapped current scene and merging distinct old observations all refuse while preserving the old state bytes. Actual historical disclosure informs the declared recipient only when the named old choice occurred. Old literal passage/observation text survives as the transcript prefix. A mapped old progression flag does **not** invent selected deductions or unlock the deduction-gated ending. Old completed states remain ended, and an old confirmation cannot authorize a v2 action.

Continued migrated runs export and import only with the installed old bundle/manifest. Portable text tampering fails even after its seen checksum is recomputed; internal NPC tampering fails full replay comparison. Extra internal fields, repeated commands, unknown versions/hashes, malformed JSON, 10,001 accepted-command entries and oversized UTF-8 imports reject.

A valid initial run containing 100 paragraphs of 24,000 repeated `é` characters is exported and imported successfully. The test independently measures UTF-8 bytes, verifies that they exceed the JavaScript string length and remain within 10 MiB, then dispatches a choice whose next captured passage would exceed the run budget. The engine returns `resource-limit` with the identical original state and exactly unchanged export. A larger content document that validates but whose initial checkpoint exceeds the runtime byte budget throws clearly; no text is truncated. This is a real multibyte serialization boundary exercise, not a mocked budget helper. The exact 10,000th command at the end of a valid long replay was not separately stress-tested.

## Dependency inventory update

The previous directory-wide purity test correctly noticed new engine files, but its expected inventory still contained only five legacy modules. Its original source is preserved as `artifacts/evidence-v2/history/dependencies-before-v2.test.ts.txt`; the `.txt` suffix prevents archived code from being mistaken for a runnable test.

The updated audit retains the original AST prohibitions. Three explicit scopes are now tested:

- The actual legacy `game.ts` import closure is still exactly `game`, `hash`, `schema`, `types`, `validate`.
- The actual v2 facade import closure is exactly those five plus `evidence-budget`, `evidence-migration`, `evidence-portable`, `evidence-proof`, `evidence-runtime`, `evidence-schema`, `evidence-types`, `evidence-v2`, and `evidence-validate`.
- Every engine-directory source is audited, including the noncanonical `evidence-fixture` outside the runtime import closure. The exact inventory is 15 files; unexpected additions fail until reviewed.

Local imports outside the engine, undeclared external packages, ambient DOM/storage/network/time/random APIs, executable DSL APIs and dynamic imports remain failures. Zod is the only permitted external dependency; its entire third-party source is not exhaustively audited. Both legacy and v2 exercised paths also run under throwing ambient traps for time, randomness, DOM, storage and network. The inventory update strengthens the distinction between legacy, production v2 dependencies and fixture source rather than turning the assertion into an unconstrained directory listing.

## Explicit limits and next acceptance work

This wave performed no universal v2 state exploration. The selected-subset matrix is complete only for the specified six-reference fixture state. Global v2 reachability, maximum-sized closure performance, all authored proof alternatives, all future-relevant guard combinations and full-history resource-cap fairness are **INCONCLUSIVE / not established**. The earlier completed guard quotient is pinned to the old engine and cannot certify these new semantics.

The root-owned `EvidenceStore` adapter and shared transactional checkpoint API were inspected selectively; this verifier did not execute their storage tests or claim their reported 33 passes as its own result. No source/store/component code was edited here. Browser quota/crash/recovery, ownership takeover, branch-parent UI, actual cross-hash migration installation and slot replacement remain integration checks.

The new evidence player, complete author controls, production compiler exclusion of author history, the writer's actual v2 case, protagonist/time-loop rules and integrated literary/philosophical review are outside this isolated wave. Feedback prose may still imply an unstated spoiler even when declared mentions are safe, so actual authored text requires review. No full revision-3 acceptance, expanded-game completion, measured playtime, human reader response or owner approval is claimed.
