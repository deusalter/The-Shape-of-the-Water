# Baseline reproduction, 2026-10-03

**BASELINE REPRODUCED.** Before production changes, `pnpm verify` passed 91 tests in 11 files, type checking, content validation, and both application builds. Actual Chromium execution passed all 13 browser checks using player controls, the real engine, and browser IndexedDB. The source snapshot did not change during those runs. This establishes the existing compact checkpoint, not completion of the newly authorized substantial game.

## Revision, environment, and preservation

The working repository was at `c6c6845`; its runtime implementation included `c90f1e1`. Execution used cloud Linux x64, Node v24.19.0, installed locked dependencies, and `/usr/bin/chromium`. No human reader, human timing, physical device, Firefox, WebKit, or real screen reader was involved. Requested model configuration is not evidence of an attested backend.

| Pin | SHA-256 |
| --- | --- |
| Baseline `src/content/case.json` | `267c334773b0883d18b481e3c15b730ce1d840410298ec0cb7d882b79b08b086` |
| Canonical compiled content | `0bd022ad793897d6a92c6dbd7054951c7ca8e07ea5d8158ad786d6e3279be432` |
| Baseline `src/engine/game.ts` | `03e6dc0be8b1612ddc57c6f8384b975ca8c83f96195e606b1c01afc4c91e5434` |
| Baseline `package.json` | `905c4efe332f583f3c899107e53cb72135301f4aef22eef73911882f87a88a5a` |
| Baseline `pnpm-lock.yaml` | `4ecf0990a9acab360c58bffb27346ed1e3a5751aaab7f612a69186cd93ee82f4` |

Full production-source and contract hashes are in `tests/verification/artifacts/baseline-reproduction.json`. `changedSourceFiles` is empty. Active continuity documents subsequently changed to record the new owner goal; these expected updates do not invalidate the reproduced runtime. After the reproduction gate, engineering changes began. This report's results remain attached to the baseline bytes.

Before rerunning anything, previous verification artifacts and checkpoint evidence were copied to `tests/verification/artifacts/history/baseline-reproduction-2026-10-03T22-29-48Z/`. Its `source-hashes.json` records the original snapshot. The fresh browser outputs were separately retained in `tests/verification/artifacts/baseline-browser/`. Existing evidence was not silently relabeled as a fresh run.

## Executed commands and actual outcomes

All commands ran from `/workspace/literary-detective`.

| Command | Outcome | Retained evidence |
| --- | --- | --- |
| `ss -ltnp` | No existing listeners on 4183 or 4184 | Initial execution output; previews were then started |
| `node tools/check-handoff.mjs` | PASS before continuity updates; 267 pinned files, no integrity or claim-consistency error | Preserved checkpoint evidence and initial tool output; static check, not fresh-session execution |
| `pnpm verify` | PASS, exit 0; 91 tests / 11 files; typecheck, content checks, player and studio builds | `tests/verification/artifacts/baseline-verify-output.txt` |
| `pnpm exec vite preview --host 127.0.0.1 --port 4183 --outDir dist-player --strictPort` | Fresh local player preview | Preview execution; no deployment |
| `pnpm exec vite preview --host 127.0.0.1 --port 4184 --outDir dist-studio --strictPort` | Fresh separate studio preview | Preview execution; no deployment |
| `PLAYER_TEST_URL=http://127.0.0.1:4183 STUDIO_TEST_URL=http://127.0.0.1:4184/studio.html node tools/browser-check.mjs` | PASS, exit 0; 13 / 13 checks; case source stable | `tests/verification/artifacts/baseline-browser-output.txt`, `baseline-browser/report.json` and screenshots |
| `node tools/verify-route-words.mjs` | PASS; 27 separately dispatched representative routes, including 24 ending combinations | `tests/verification/artifacts/baseline-route-words.json` and `baseline-route-words-output.txt` |
| `node tools/verify-guard-core.mjs c6c6845` | PASS for conditional baseline navigation; 420 states / 1,051 transitions / frontier 0 | `tests/verification/artifacts/baseline-guard-core.json` |

The test suite began at 22:29:54 UTC. Content validation confirmed 21 scenes, 50 choices, 357 authored paragraphs, and no reported schema, graph-reference, or prohibited-punctuation issue. Its 12,456 authored words include mutually exclusive variants, choices, and notes and are **not** a route-length or playtime result. The player offline manifest identifies build `d101e5860c588e8d` and hashes its three local release files. Third-party Zod annotation-position warnings did not fail either build.

The 13 actual browser checks covered initial player/spoiler boundaries; four viewport widths and enlarged text/CSS 200% zoom; automated accessibility; keyboard investigation and reload; a real second-tab stale write; a keyboard disclosure and closing route; encountered-only export; prior-run archiving; installed offline reload and play; corrupted-cache readiness refusal; separate studio editing/undo/preview; failed replacement retry retaining the prior archive; and incomplete studio-draft save/reload with valid preview preservation. Axe found zero violations in the sampled player and studio states, with one player item requiring manual judgment. This does not establish comprehensive accessibility or every author operation.

## Actual route material

The baseline manuscript and its major variants were inspected, including the private encounters, the shared exchange, the optics demonstration, the report, and each ending. The measurement harness validates the content and dispatches the actual engine with eligible choice IDs, current revisions, and current confirmation receipts. It counts whitespace-separated words in the **rendered passage paragraphs**. Selected labels and notebook text are recorded separately. Repeated hub visits count as rendered occurrences; distinct paragraph totals expose their contribution. The opening is a prefix of later routes and is not added to them again.

| Separately played route | Rendered passage words | Distinct rendered paragraph words | First scene-occurrence words | Chosen label words |
| --- | ---: | ---: | ---: | ---: |
| Selected seven-action opening | 2,033 | 1,981 | 1,929 | 63 |
| Physical evidence / narrow optics response / public account / stay | 4,751 | 4,751 | 4,446 | 153 |
| Recorded evidence / measure optics response / private account / leave | 4,492 | 4,492 | 4,239 | 127 |
| Physical evidence plus compatible optional encounters / public account / stay | 7,471 | 7,096 | 6,791 | 252 |
| Physical evidence plus interpersonal failures and optional encounters / public account / stay | 6,891 | 6,591 | 6,286 | 243 |

Across the 24 evidence/optics/disclosure/disposition combinations, rendered passage length ranges from 4,489 to 4,797 words. One compatible optional tour adds 2,720 rendered words, of which 2,345 are distinct paragraph words, to the comparable required physical route. The rich failure route has shorter exclusive private variants. These alternatives were played separately and never summed. The JSON retains every action and passage occurrence, its count, terminal state hash, and the definitions used.

As a plainly hypothetical reading-only calculation, uninterrupted reading at 180–250 words per minute would put required-route prose at roughly 18–27 minutes and the rich optional route at roughly 30–42 minutes. Investigation, reflection, rereading, accessibility, and choice time are unmeasured. There is no measured first-playthrough duration and no evidence that this baseline achieves the new 4–6-hour design target.

The working causal sequence is already concrete: the apparent sabotage involves Ada's cut, Miriam's pressure, Simon's inference, the apparatus test, and a separately available continuous recording. Later findings change the significance of earlier literally preserved passages. The player can reach the factual account without obtaining private grief or intimacy. The current shared scene states the factual reconstruction after flag acquisition; it does not yet ask the player to select its supporting references. That is a real gameplay gap.

The mandatory optics encounter contains much of the sustained explicit argument. A substantial share of ordinary relational experience lives in the optional Ada/Miriam, Simon/Ada, and Miriam-private scenes. The public/private account and three dispositions produce concrete closing differences while preserving history. The expansion should develop investigation and repeated relationships around these strengths. Counting exclusive endings together, splitting scenes, or adding lectures would not address the observed route length or the owner goal.

## Better-scoped exploration

The preserved previous searches remain honestly labeled. The conservative authored guard search stopped at 25,000 states, 43,845 transitions and frontier 9,486; exact authored-history search stopped at 25,000 states, 25,000 transitions and frontier 17,414. Both are **INCONCLUSIVE**. Their existing evidence is preserved in the dated history above. The 28 authored terminal traces establish those particular completed routes, not universal completion.

The new `verify-guard-core.mjs` loads historical source through `git show c6c6845`, not the evolving engine. It refuses a `game.ts` hash other than the audited baseline. Inspection establishes that this engine's navigation predicates depend only on content identity, current scene, ended state, and membership of flags referenced by scene/choice `requires` or `unless`. Effects add flags; unreferenced flags and record/history arrays do not control these predicates. The key therefore retains exactly that navigation information. It explicitly omits prose/history/save fields and assumes fresh command IDs, current confirmation receipts, and enough commands remaining before the 10,000-revision cap.

Every edge calls the real historical `applyChoice`. Every collision compares offered choices and projected successors under fresh commands. The completed run visited all 21 scenes and all 50 choices, compared 632 merged-state pairs and 2,913 successor transitions, and replayed two terminal-scene witnesses with exact final state hashes. Reverse reachability found a terminal path from each of the 420 projected states. The largest shortest terminal distance was 11 actions. Budgets were 25,000 states, 500,000 transitions, and 60 seconds; this run finished with no frontier.

This is a **conditional navigation PASS**, not equivalence of full player behavior. A player who exhausts the revision cap can still lose the ability to dispatch. Historical transcript, records, receipts, saves, optional text, and new evidence/knowledge semantics are not certified by this quotient. A v2 engine requires a new guard-dependency audit; accepted deductions, NPC knowledge/belief, source provenance, and interpretation closure must be retained wherever they affect future behavior. A timeout in that work must still report INCONCLUSIVE.

## Completion boundary

The exact 88-item baseline acceptance inventory and next-wave independent tests are in `docs/reviews/ACCEPTANCE-GAPS-02.md` and its machine-readable artifact. Missing selected-evidence proofs, NPC knowledge/belief separation, automatic interpretation closure, guarded hints, compatible migrations, branch metadata, and complete author tooling are not waived. Existing literary reviews remain historical baseline evidence; the substantial integrated expansion needs fresh route and philosophical review. Human enjoyment, measured duration, and owner approval remain unverified.
