# Acceptance gaps, expanded owner goal, 2026-10-03

This is the **exact 88-item acceptance inventory** from `docs/05-ACCEPTANCE-TESTS.md`, evaluated against the reproduced compact baseline `c6c6845` / runtime `c90f1e1`, case file SHA-256 `267c334773b0883d18b481e3c15b730ce1d840410298ec0cb7d882b79b08b086`. It is not acceptance of the evolving expansion. The JSON companion is `tests/verification/artifacts/acceptance-inventory-02.json`; it includes the acceptance document hash and full evidence paths.

There are **87 mandatory items and one conditional item, AC-X06**. Audio/autoplay does not exist, so that setup is legitimately N/A. Private notes are optional under S07, but safe transfer/import is mandatory. No other missing feature is declared optional to reach completion.

`Passed` means the identified baseline requirement and scope have actual inspection or executed evidence. Literary passes are historical agent/editorial reviews plus manuscript inspection, not human reactions or excellence. `Blocked` identifies a baseline feature absent as specified. `Inconclusive` identifies partial evidence insufficient for the entire requirement. `Not run` identifies an unperformed exercise; supporting source inspection is not a test result. `N/A` describes only an untriggered conditional setup. All affected requirements must be reassessed on the final integrated expansion; the last column records that work even for baseline passes.

The baseline reproduction passed 91 tests in 11 files and 13 actual Chromium checks. Complete historical-state exploration remains INCONCLUSIVE. The newly completed 420-state/1,051-transition navigation quotient is a conditional baseline PASS with fresh IDs/current receipts/sufficient command budget; it is not a v2 proof/knowledge or history certificate. Details, exact commands, route counts and limitations are in `BASELINE-REPRODUCTION-02.md`.

## Evidence keys

All historical prose/source references below mean their `c6c6845` bytes, accessible with `git show c6c6845:<path>`, rather than later edits. Fresh artifacts have baseline-prefixed names. The dated history preserves previous independent output and route traces.

- **BASE**: `tests/verification/artifacts/baseline-reproduction.json`, `tests/verification/artifacts/baseline-verify-output.txt`.
- **UI**: `tests/verification/artifacts/baseline-browser/report.json`, `tests/verification/artifacts/baseline-browser/axe-player.json`.
- **PROP**: `tests/verification/properties.test.ts`, `tests/verification/dependencies.test.ts`, `tests/verification/artifacts/baseline-verify-output.txt`.
- **ROUTE**: `tests/verification/authored-routes.test.ts`, `tests/verification/artifacts/history/baseline-reproduction-2026-10-03T22-29-48Z/verification/authored-traces.json`, `tests/verification/artifacts/baseline-route-words.json`.
- **SAVE**: `tests/verification/persistence.test.ts`, `tests/storage.test.ts`, `tests/verification/artifacts/baseline-verify-output.txt`.
- **EXPLORE**: `tests/verification/explorer.test.ts`, `tests/verification/artifacts/baseline-guard-core.json`, `tests/verification/artifacts/history/baseline-reproduction-2026-10-03T22-29-48Z/verification/exploration-all.json`.
- **LIT**: `narrative/TREATMENTS.md`, `narrative/CANON.md`, `narrative/MANUSCRIPT.md`, `narrative/REVISION-LOG.md`, `docs/reviews/PHILOSOPHY-DRAMA-01.md`, `docs/reviews/ROOT-DISCLOSURE-01.md`.
- **PHIL**: `research/philosophy/KANT.md`, `research/philosophy/SPINOZA.md`, `research/philosophy/SOURCES.json`, `research/philosophy/INFERENCE-METHOD.md`, `narrative/PHILOSOPHY-MAP.md`, `narrative/AUTHOR-NOTES.md`, `docs/reviews/PHILOSOPHY-DRAMA-01.md`.
- **VOICE**: `narrative/NAMES.md`, `narrative/VOICE.md`, `narrative/reviews/VOICE-BLIND-PACKET.md`, `narrative/reviews/VOICE-KEY.md`, `docs/reviews/VOICE-01.md`, `narrative/accepted/MANIFEST.json`.
- **STUDIO**: `src/Studio.tsx`, `tests/studio-storage.test.ts`, `tests/verification/artifacts/baseline-browser/report.json`.
- **OFFLINE**: `tests/offline.test.ts`, `tests/verification/artifacts/baseline-browser/report.json`.
- **ASSET**: `docs/ASSETS-AND-LICENSES.md`, `licenses/DEPENDENCIES.json`, `tests/verification/artifacts/baseline-browser/report.json`.
- **CONT**: `docs/archive/checkpoint-c6c6845`, `docs/execution/DECISIONS.md`, `tests/verification/artifacts/history/baseline-reproduction-2026-10-03T22-29-48Z/checkpoint-evidence/handoff-rehearsal.json`, `tests/verification/artifacts/baseline-reproduction.json`.
- **BLIND**: `tests/verification/artifacts/history/baseline-reproduction-2026-10-03T22-29-48Z/checkpoint-evidence/reader-packet-provenance.json`, `narrative/reviews/VOICE-BLIND-PACKET.md`.
- **V1**: `docs/contracts/ENGINE-API.md`, `src/engine/schema.ts`, `src/engine/game.ts`, `src/persistence/store.ts`.

## Exact inventory

### Literary production

| ID / requirement | Applicability | Baseline outcome | Evidence and actual coverage | Remaining expanded-goal work |
| --- | --- | --- | --- | --- |
| AC-L01 — Inspect L0 outputs | Mandatory | Passed | LIT: Different treatments, actual openings and documented lead revision exist. | Apply the same scene-specific process to the expansion; no excellence certification. |
| AC-L02 — Inspect narrative premise and source history | Mandatory | Passed | LIT: Broken-mirror case and apparatus history inspected; retired registry plot absent. | Check expanded scenes do not introduce an administrative equivalent. |
| AC-L03 — Read major-character scenes without dossiers | Mandatory | Passed | LIT, VOICE: Actual dialogue supports distinct wants and tactics in historical reviews and fresh manuscript inspection. | Review new repeated encounters without character dossiers; address underwritten ordinary lives. |
| AC-L04 — Trace a central intellectual question | Mandatory | Passed | LIT, PHIL: Optics argument, serious objections and disclosure consequences occur in enacted scenes. | Trace the central question through the substantial new middle and endings. |
| AC-L05 — Read opening after each ending | Mandatory | Passed | LIT, ROUTE: Recontextualization and all ending variants preserve the fixed causal account; earlier passages inspected. | Reread the expanded opening after every new ending and trace each changed significance. |
| AC-L06 — Compare integrated prose with reviewer edits | Mandatory | Passed | LIT, VOICE: Revision log preserves lead decisions, alternatives and two surgical voice cuts. | Record decisions on expansion criticism; do not silently homogenize voices. |
| AC-L07 — Inspect story lock | Mandatory | Passed | LIT, ROUTE: Canon, disclosure map, endings and concrete representative command routes exist. | Lock expanded chronology and knowledge limits after integration, then verify its routes. |
| AC-L08 — Inspect final required scenes and branches | Mandatory | Passed | LIT, BASE: Compact required scenes and actual endings contain no critical placeholder. | Substantial middle and endings are not yet accepted or verified; inspect the full integrated candidate. |
| AC-L09 — Run narrative style checks and editorial review | Mandatory | Passed | LIT, BASE: Actual content punctuation check passes; contextual editorial reviews are retained. | Run style checks and contextual review on integrated new prose; no automatic synonym cleanup. |
| AC-L10 — Audit claims of excellence or approval | Mandatory | Passed | CONT, BASE: Evidence identifies simulations and scope; no owner approval, human duration or greatness score claimed. | Continue truthful claims; 4–6 hours remains a design target. |

### Player behavior

| ID / requirement | Applicability | Baseline outcome | Evidence and actual coverage | Remaining expanded-goal work |
| --- | --- | --- | --- | --- |
| AC-G01 — Complete tiny fixture, reload, revisit | Mandatory | Passed | BASE, UI, SAVE: Fixture reload/revisit tests and real keyboard investigation/reload preserve prior state. | Rerun against v2 state and actual new route controls. |
| AC-G02 — Observe an item, later learn a relevant fact | Mandatory | Passed | PROP, ROUTE: Early cabinet observation and later reinterpretation preserve exact earlier occurrences and literal records. | Exercise new interpretation availability/review and return behavior in integrated UI. |
| AC-G03 — Choose two approaches to an encounter in separate runs | Mandatory | Passed | ROUTE, UI: Distinct authored encounter choices produce their own flag/variant consequences. | Test new approach differences and exact UI actions across required encounters. |
| AC-G04 — Hear a private statement, speak to an uninformed NPC | Mandatory | Blocked | V1: Private encounters are flag-driven; independent NPC knowledge, beliefs and claims are absent. | Implement explicit disclosure and test uninformed NPC behavior with actual authored encounters. |
| AC-G05 — Change interpretation without new objective evidence | Mandatory | Passed | PROP, ROUTE: Separate observation/interpretation records; interpretation choice does not create an objective fact. | Reversible interpretive commitments and new readings need verification; never award facts for opinions. |
| AC-G06 — Submit a factual conclusion through each valid proof route | Mandatory | Blocked | V1, ROUTE: Both present evidence flag routes complete, but no selected-reference submission exists. | Verify each explicit nested proof alternative through actual submissions and UI. |
| AC-G07 — Submit correct claim with unsupported or unknown references | Mandatory | Blocked | V1: No factual-submission API exists; unavailable report guard is only a smaller protection. | Reject unsupported, unknown and unearned selected references without state mutation or answer leakage. |
| AC-G08 — Select every notebook item | Mandatory | Blocked | V1: There is no submitted-reference superset validation. | Reject irrelevant notebook supersets; allow only declared earned corroborators. |
| AC-G09 — Return after a consequential disclosure | Mandatory | Passed | ROUTE, PROP: Public/private consequences and state-dependent returns preserve prior dialogue and observations. | Verify expanded NPC disclosures and changed encounters without rewriting historical snapshots. |
| AC-G10 — Make a signaled relationship-damaging choice | Mandatory | Passed | ROUTE, EXPLORE: Pressing Miriam and shaming Simon has a completed authored route; scoped baseline navigation has terminal paths. | Test new relationship failures, source alternatives and plausible interpersonal recovery in UI. |
| AC-G11 — Request help at early/late states | Mandatory | Blocked | V1: Guarded hints and factual-reveal commands absent. | Test early/late known-material hints, fresh reveal confirmation and no moral prescription. |
| AC-G12 — Search for hidden titles and use locked URLs | Mandatory | Inconclusive | PROP, UI: Initial passage/export and sampled DOM exclude injected future markers; broad labels/URLs/search matrix not run. | Audit all normal projections, accessible names, locked navigation and previews for v2 hidden content. |
| AC-G13 — Reopen transcript after state-dependent text changes | Mandatory | Passed | PROP, ROUTE, SAVE: Frozen-history, repeat visits and save replay retain each originally shown variant. | Rerun after interpretation and migration changes, including mixed historical/current text. |
| AC-G14 — Open a major-action confirmation, change state/payload, submit | Mandatory | Passed | PROP, UI: Old state/payload receipts rejected; current irreversible receipt accepted; forged extras rejected. | Extend receipt binding to deduction-associated major actions and hint reveal. |
| AC-G15 — Leave tab, change device clock, return | Mandatory | Inconclusive | PROP: Audited engine and exercised paths use no wall clock; actual device-clock-change browser exercise not run. | Run leave-tab/time-change/resume test and verify new engine dependencies remain pure. |
| AC-G16 — Play all ending routes | Mandatory | Inconclusive | ROUTE, UI: 24 ending combinations and additional engine traces complete; one normal keyboard ending route tested in browser. | Play every supported ending route through actual UI and compare fixed history/consequences. |
| AC-G17 — Revisit ending checkpoint and complete another branch | Mandatory | Blocked | SAVE, UI: Completed prior run retained and two ending states archived; full checkpoint branch model absent. | Restore protected checkpoint, complete second branch through UI and retain original branch metadata. |
| AC-G18 — Remove images/audio from necessary clues | Mandatory | Passed | ASSET, LIT: Necessary clues are original text; no distributed image/audio clue information exists. | Keep textual reasoning equivalents for any new visual or optional media. |

### Engine correctness

| ID / requirement | Applicability | Baseline outcome | Evidence and actual coverage | Remaining expanded-goal work |
| --- | --- | --- | --- | --- |
| AC-E01 — Replay same commands against pinned bundle | Mandatory | Passed | PROP, ROUTE: Seeded deterministic replay compares every consequential field and exact command history. | Extend properties to v2 commands, accepted witnesses, NPC states and closure order. |
| AC-E02 — Freeze input state/content and dispatch | Mandatory | Passed | PROP: Deep-frozen inputs and literal records/transcript prefixes survive actual dispatch. | Apply frozen-input properties to v2 proof evaluation, closure and migration. |
| AC-E03 — Repeat acquisition, choice, and committed command ID | Mandatory | Passed | PROP: Repeated committed IDs and acquisitions are idempotent under tested defined behavior. | Cover all new command kinds, rejection retry IDs and duplicate accepted deductions. |
| AC-E04 — Fuzz invalid IDs/types/enums/deep conditions | Mandatory | Passed | PROP, BASE: Arbitrary JSON, invalid IDs/revisions and unsupported nested DSL safely reject in v1. | Fuzz actual v2 enums, bounded conditions/proofs and malformed imports; v1 rejection is not v2 coverage. |
| AC-E05 — Test nested AND/OR factual proofs | Mandatory | Blocked | V1: Nested AND/OR factual-proof evaluator absent. | Test nested alternatives, independent provenance, empty/malformed proofs and bounded witness explosion. |
| AC-E06 — Trigger multiple new interpretations | Mandatory | Blocked | V1: Interpretations are explicit choice records; automatic fixed-point closure absent. | Test deterministic finite positive closure, review separation and no automatic factual/moral conclusion. |
| AC-E07 — Project author truth, hidden beliefs, future text | Mandatory | Blocked | PROP, UI, V1: Encountered-only v1 projections pass; hidden NPC/proof data model absent. | Test hidden truth/belief/proof/answer markers across v2 projection, UI and portable exports. |
| AC-E08 — Inspect engine dependencies | Mandatory | Passed | PROP: AST dependency audit and throwing ambient traps pass for local v1 engine closure. | Audit all new modules and exercised v2 paths; third-party Zod source is not exhaustively audited. |
| AC-E09 — Exhaust exploration budget | Mandatory | Passed | EXPLORE: Actual exhausted searches and sentinels report INCONCLUSIVE with states, transitions and frontier. | New proof/knowledge search must retain all future-relevant fields and report actual remaining frontier. |
| AC-E10 — Reproduce softlock fixture and valid ending trace | Mandatory | Passed | EXPLORE, ROUTE: Concrete dead-end sentinel fails with replay; real terminal witnesses replay exactly. | Run v2 softlock sentinel and valid authored witnesses; conditional baseline quotient cannot certify v2. |

### Saves and updates

| ID / requirement | Applicability | Baseline outcome | Evidence and actual coverage | Remaining expanded-goal work |
| --- | --- | --- | --- | --- |
| AC-S01 — committed durability | Mandatory | Inconclusive | SAVE, UI: Injected abort retains previous commit; real quota/retry keeps candidate; delayed Saved-label timing not fully exercised. | Delay/abort actual consequential writes in browser and verify truthful status before/after commit. |
| AC-S02 — latest checkpoint corruption | Mandatory | Inconclusive | SAVE: Corrupt current plus backups recover independently validated older state and retain damaged bytes in fake IndexedDB. | Exercise browser recovery offer and no-overwrite behavior for v2 envelopes and retained copies. |
| AC-S03 — safe import | Mandatory | Inconclusive | SAVE, PROP: Malformed/unknown/hash-mismatched state validation precedes store replacement in tested paths. | Run full size/hostile/reference browser import matrix and valid explicit slot/overwrite selection. |
| AC-S04 — migration and historical transcript | Mandatory | Blocked | SAVE, V1: Unknown exact hash refused and original retained/exportable; declared compatible migrations absent. | Test each declared old-save mapping and parse/transform/validation/commit failure, preserving old literal transcript. |
| AC-S05 — stale tabs | Mandatory | Blocked | SAVE, UI: Actual stale tab and no-notification CAS tests protect newer save; ownership takeover model absent. | Test explicit takeover/read-only ownership with notifications disabled as well as stale CAS. |
| AC-S06 — storage unavailable | Mandatory | Passed | UI, SAVE: Actual quota failure, acknowledged unsaved continuation and retry preserve memory/export and prior archive. | Retest storage denial, no false Saved status and no retry loop for new state/save paths. |
| AC-S07 — export privacy and transfer | Mandatory | Inconclusive | UI, PROP: Encountered export omits future text; state roundtrip tested; fresh-profile UI transfer not run. | Export/import fresh profile and compare state/privacy; private notes remain an optional feature. |
| AC-S08 — protected ending branches | Mandatory | Blocked | SAVE: Common history and distinct ending records retained; explicit parent/run metadata absent. | Finish two endings from one protected checkpoint, with correct parent graph and retained separate branches. |

### Author workspace

| ID / requirement | Applicability | Baseline outcome | Evidence and actual coverage | Remaining expanded-goal work |
| --- | --- | --- | --- | --- |
| AC-A01 — Edit prose, choice, guard, and observation through controls | Mandatory | Inconclusive | STUDIO, UI: Real title edit/undo/preview tested; prose, choice, guard and observation controls inspected but not all exercised. | Exercise every required field on actual v2 compiled preview without source edits. |
| AC-A02 — Add alternative factual support route | Mandatory | Blocked | STUDIO, V1: Studio's bounded format has no factual proof route editor. | Create OR evidence route, export/reimport and submit both routes through the real engine. |
| AC-A03 — Rename/delete referenced ID | Mandatory | Not run | STUDIO: Baseline prevents deleting start/referenced scene and reports incoming choices; no full action matrix run. | Test rename/delete references, repair/cancel and all v2 dependency types. |
| AC-A04 — Make draft invalid | Mandatory | Passed | STUDIO, UI: Actual empty-title invalid draft survives reload; diagnostics and separate last-valid preview are visible. | Retest exact v2 diagnostics and last-valid behavior for malformed proof/knowledge drafts. |
| AC-A05 — Export/reimport project | Mandatory | Blocked | STUDIO: JSON draft roundtrip exists; full provenance/annotation author-project model absent. | Roundtrip canonical prose, conditions, provenance and author annotations with proper compilation boundary. |
| AC-A06 — Create a second tiny fixture from UI | Mandatory | Not run | STUDIO: Add-scene/add-choice controls exist; second fixture entirely made via UI has not been demonstrated. | Build and play a second tiny v2 fixture using controls alone and retain its project/export evidence. |
| AC-A07 — Inject author-preview state | Mandatory | Blocked | STUDIO, UI: Preview is clearly noncanonical and uses separate database; injected-preview-state tooling absent. | Inject author state, verify labels and isolation from player Continue/export. |
| AC-A08 — Start and cancel large validation | Mandatory | Blocked | STUDIO: Validation is synchronous and there is no cancellable large-work validation path. | Exercise responsive large validation, cancel it and prove stale/cancelled work cannot report success. |

### Offline, access and security

| ID / requirement | Applicability | Baseline outcome | Evidence and actual coverage | Remaining expanded-goal work |
| --- | --- | --- | --- | --- |
| AC-X01 — Complete a required route using keyboard only | Mandatory | Passed | UI: Actual required investigation/disclosure/closing route completed by keyboard; reload context retained. | Rerun complete v2 required route and all new dialogs/controls with visible focus. |
| AC-X02 — Use 200% zoom, enlarged text, narrow viewport | Mandatory | Passed | UI: Four widths including 320/390, enlarged text and CSS 200% zoom pass sampled no-overflow checks. | Test new evidence controls at same sizes; physical-device/native-browser zoom remain unmeasured. |
| AC-X03 — Enable reduced motion and inspect announcements | Mandatory | Inconclusive | UI: Reduced-motion browser context and sampled accessibility scan run; real announcement behavior not established. | Inspect motion and status updates manually; avoid whole-scene repeated announcements. |
| AC-X04 — Install, go offline, reload, play | Mandatory | Passed | OFFLINE, UI: Installed built player actually reloads, chooses and saves offline without live AI/API. | Repeat with final content/engine and exact cache manifest after expansion. |
| AC-X05 — Interrupt cache/install/update | Mandatory | Inconclusive | OFFLINE, UI: Changed cached bytes/content hash cannot claim ready; no forced activation or cache deletion. | Interrupt install/update and verify old compatible run survives with truthful readiness. |
| AC-X06 — Block optional audio/autoplay | Conditional N/A | N/A | ASSET: No audio or autoplay feature exists; its conditional setup is not triggered. | If audio is introduced, blocking it and settings persistence become required; no other access test is waived. |
| AC-X07 — Inspect production network and assets | Mandatory | Inconclusive | ASSET, UI: Local assets, system fonts, no AI SDK/telemetry in inspected source; separate build excludes studio entry. | Run comprehensive actual production network/asset audit, including author research and hidden debug entrypoints. |
| AC-X08 — Render hostile notes/dialogue/imports | Mandatory | Inconclusive | PROP, V1: Strict state validation and text rendering inspected; complete hostile browser rendering matrix not run. | Render hostile dialogue/import text inertly; test any new asset-path traversal and no code execution. |
| AC-X09 — Inspect asset origin/license inventory | Mandatory | Passed | ASSET, UI: Baseline manifest, original text/CSS/system fonts and runtime license notices account for release assets. | Update inventory for all final assets; publication rights clearance is outside this undeployed task. |
| AC-X10 — Compare offered dialogue choice and actual response | Mandatory | Passed | LIT, ROUTE, UI: Offered actions and resultant actual passages inspected; route dispatch honors literal choice IDs. | Review new offered/actual dialogue pairs and ensure no intention-reversing paraphrase. |

### Philosophy

| ID / requirement | Applicability | Baseline outcome | Evidence and actual coverage | Remaining expanded-goal work |
| --- | --- | --- | --- | --- |
| AC-P01 — Primary-source inspection | Mandatory | Passed | PHIL: Historical dossiers retain inspected primary locations, editions and quotation/paraphrase labels. | Recheck consequential new commitments against actual primary passages; planned reading is not evidence. |
| AC-P02 — Kant distinctions | Mandatory | Passed | PHIL, LIT: Historical review corrects Kant distinctions and the optics scene investigates limits without using missing clues as noumena. | Review material integration throughout expanded encounters; label deliberate character errors. |
| AC-P03 — Spinoza distinctions | Mandatory | Passed | PHIL, LIT: Immanence and ethical development have baseline scene consequences; historical review addresses Ethics V and objections. | Develop ordinary ethical life and blessedness carefully; no fatalist mascot or reward doctrine. |
| AC-P04 — Comparative disagreement | Mandatory | Passed | PHIL, LIT: Serious surviving disagreements retained rather than unified doctrine or consensus. | Review the expanded argumentative arc and endings for substantive disagreement. |
| AC-P05 — Detection method | Mandatory | Passed | PHIL, LIT: Hypothesis, apparent explanation and apparatus/recording tests are distinguished in story and method notes. | New explicit proofs must not make pleasing explanations or subjective commitments count as facts. |
| AC-P06 — Dramatic consequence | Mandatory | Passed | PHIL, LIT: Philosophy map links questions to shared/optics/report/ending consequences. | Refresh map with actual accepted new scenes and returns; vocabulary alone does not satisfy expansion. |
| AC-P07 — Explicit thought and subtraction | Mandatory | Passed | PHIL, LIT: Developed optics conversation remains after label subtraction and serious objections survive. | Review expanded thought in routes; do not erase sustained argument or add length-only lectures. |
| AC-P08 — Ending and player truth | Mandatory | Passed | PHIL, ROUTE: Fixed author history survives both optics responses and dispositions; no correct-opinion score. | Check every v2 condition/proof/ending for unintended moral or philosopher-faction grading. |

### Naming and voice

| ID / requirement | Applicability | Baseline outcome | Evidence and actual coverage | Remaining expanded-goal work |
| --- | --- | --- | --- | --- |
| AC-V01 — Naming provenance | Mandatory | Passed | VOICE: Existing historical-given/literary-surname provenance is recorded separately from provisional names. | Verify any new name sources and explicit owner naming clarification without casual cast renaming. |
| AC-V02 — Name usability and stability | Mandatory | Passed | VOICE, BASE: Display forms and stable IDs reviewed; existing names distinct and not hidden-role labels. | Test additions and any display-only change with stable IDs and spoiler safety. |
| AC-V03 — Actual voice auditions | Mandatory | Passed | VOICE, LIT: Actual ordinary, pressured and relational exchanges exist in auditions and manuscript. | Review repeated expanded encounters with listener-specific attention, syntax and tactics. |
| AC-V04 — Shared dialogue | Mandatory | Passed | VOICE, LIT: Shared scene shows mutual pressure and replies rather than isolated appended speeches. | Read all new shared scenes in route context and address homogenized eloquence. |
| AC-V05 — Anonymous diagnosis | Mandatory | Passed | VOICE: Historical blind model review used balanced extracts and uncertainty/reasons; no human reader was fabricated. | Prepare player-safe new blind extracts and investigate confusing pairs without a score threshold. |
| AC-V06 — Transfer and register | Mandatory | Passed | VOICE: Historical transfer/register review and subsequent surgical edits are retained. | Repeat affected speech-transfer/listener-pressure review on substantial new material. |
| AC-V07 — Caricature and cadence | Mandatory | Passed | VOICE, LIT: Historical cadence/caricature critique and full baseline scenes were inspected. | Audit expanded recurring metaphors, aphorisms and stereotyped social tactics with passage evidence. |
| AC-V08 — Exact continuity anchors | Mandatory | Passed | VOICE, CONT: Exact accepted passages, revisions and voice anchors are retained. | Compare new integrated voice to exact anchors and explain intentional departures. |

### Iteration and handoff

| ID / requirement | Applicability | Baseline outcome | Evidence and actual coverage | Remaining expanded-goal work |
| --- | --- | --- | --- | --- |
| AC-C01 — Honest working state | Mandatory | Passed | CONT, BASE: Baseline state accurately distinguishes compact completion from unmet requirements; new owner goal recorded separately. | Keep active state/current hashes/next task accurate during integration and final checkpoint. |
| AC-C02 — Single integration authority | Mandatory | Passed | CONT: One canonical writer and one integration coordinator, scoped ownership and baselines recorded. | Maintain distinct write surfaces and no recursive workers through final integration. |
| AC-C03 — Substantive iteration | Mandatory | Passed | LIT, VOICE, CONT: Real alternative candidates, independent critiques and accepted/revised decisions exist. | Complete the same substantive produce/review/decision cycle for expansion; self-evaluation alone fails. |
| AC-C04 — Regression protection | Mandatory | Passed | CONT, BASE: Recoverable Git/accepted drafts and dated test evidence preserved; actual baseline rechecks passed. | Preserve accepted expanded checkpoint and rerun affected checks after every consequential integration. |
| AC-C05 — Fresh-session continuation | Mandatory | Not run | CONT: Static 267-file snapshot integrity check passes; actual fresh-session continuation not performed. | Keep this distinction explicit; retain accessible final files and executable continuation, report a fresh recovery only if performed. |
| AC-C06 — Stale or missing context | Mandatory | Passed | CONT: Historical safe-copy handoff fault injection reports stale/missing/ambiguous context without invented reconstruction. | Rerun affected safe-copy checks against final continuity state, not obsolete manifest pins. |
| AC-C07 — Blind packet integrity | Mandatory | Passed | BLIND, PROP: Historical player-only reader packet provenance and anonymous voice packet retained; future-author truth excluded from supplied route text. | Prepare new packets solely from encountered v2 text and audit filenames/metadata/prompts for leakage. |
| AC-C08 — Deadline and runtime honesty | Mandatory | Passed | CONT, BASE: Unknown cutoff/backend facts not invented; no paid/reset/background/new-chat promise made. | Continue within actual supported runtime, preserve boundary handoff and do not promise post-session work. |

## Inventory outcome

16 Blocked; 12 Inconclusive; 1 N/A; 3 Not run; 56 Passed. These counts describe baseline requirements only and are not a progress percentage or a release decision. No full revision-3 semantics or substantial expanded game has been certified. The final completion gate requires actual evidence for mandatory feature gaps and a new integrated literary/philosophical review. Human enjoyment and measured duration remain unverified.

## Independent next-wave proof and knowledge checks

The engineering draft is `docs/contracts/EVIDENCE-KNOWLEDGE-V2.md`. It is an explicit schema-version-2 API; a candidate file or test written against a draft is not an accepted implementation. The verifier will own separate tests under `tests/verification/` and will not edit engineer-owned unit tests. Use a small independently authored noncanonical fixture before the writer's actual case is stable; pin source, contract and content bytes on every executed run.

1. **Selected support and provenance.** Test physical AND support and independently collected recording alternatives with every proper subset, wrong candidate, unknown/unearned reference, duplicate selection and full-notebook superset. Only explicitly allowed earned corroborators may be extras. A repeated testimony and its copy must not become independent support. An accepted deduction's source ancestry must remain overlapping with its constituent sources; nested independent all-nodes must reject that laundering. Compare unchanged full state and generic feedback after every unsupported input, then test accepted witness/replay/duplicate delivery.
2. **Independent knowledge, belief and claims.** Give the player a private statement and prove an uninformed character's available response does not change until an explicit disclosure. Test one NPC who believes a false statement and another who knows a contrary source, with stable underlying events and separate public claims. Disclosing to one character must not inform all others. Test repeat disclosure, unearned disclosure and false-belief changes without inventing player observations or objective deductions. Use these states in actual encounter guards, not unused arrays.
3. **Interpretation closure and review.** Chain and fork positive eligibility rules, vary source acquisition order and content rule order where order is not semantically meaningful, and require the same finite closure. Exercise repeated closure and malformed negative/cyclic/budget-explosive rules according to contract. Eligibility must not expose unseen interpretive prose until a review action; neither closure nor a relationship flag can submit a factual conclusion or prescribe a moral opinion.
4. **Hidden-content and feedback projection.** Insert distinct sentinel strings into hidden NPC beliefs/claims, supported-candidate IDs, proof trees, future paragraph variants and unseen source titles. Assert permitted current projection, normal choices, hints, error feedback and portable export contain no sentinel before the relevant encounter. A malformed or premature submission must not disclose the expected support or a correct answer. Explicit factual hints need a fresh receipt bound to state and action.
5. **Persistence, migration and replay.** Test supported historical hashes individually, preserve the exact encountered v1 transcript prefix, and require no invented selected deduction merely because an old proof flag exists. Inject parse/transform/validation/commit failures and compare original stored bytes. Portable replay must reconstruct the accepted witnesses and NPC changes from valid commands; hostile extra internal state must be ignored/rejected before replacement. Test size, shape and command bounds, current-hash mismatch, duplicate commands and checksum tampering.
6. **Authored routes and relationships.** Once the actual v2 case is stable, enumerate each declared proof alternative independently and play required routes after every signaled interpersonal failure. Verify alternate evidence avoids forced intimacy, repeated optics cannot acquire contradictory commitments, facts remain common across endings, and each required ending is reachable. Engine traces complement actual UI play; injected author-preview state cannot substitute for a normal route.

## Scope a new reachability proof honestly

The baseline guard-core tool refuses an unaudited engine hash. For v2, inspect every guard and action dependency before choosing a quotient. At minimum include current scene, ended/content identity, every guard-relevant flag, earned source IDs with relevant provenance, accepted deduction IDs and relevant selected ancestry, NPC knowledge and beliefs used by guards, interpretation availability/review distinctions, and explicit hint/reveal state. Include any additional field read by transition eligibility or future effects. Do not omit history when a new predicate reads it.

Compare available commands and projected successors for every merged state pair while retaining the full representative state and command trace for replay. Fresh IDs, fresh receipts and remaining command budget remain explicit assumptions if revision/history are abstracted. A bounded selected-reference subset enumeration needs declared completeness bounds; a sampled property test is not exhaustive proof. Use real engine dispatch and reverse terminal reachability only on a complete component. Emit PASS/FAIL/INCONCLUSIVE with exact states/transitions/frontier and replayable terminal or failure witnesses. Preserve separate full-history stress results as INCONCLUSIVE whenever a frontier remains.

The prioritized release gaps are G04/G06–G08/G11, E05–E07, S04/S05/S08, and A02/A05/A07/A08, plus incomplete browser/import/offline/security exercises. The new writer's substantial middle, ordinary lives and repeated relationships need route-specific measurements and integrated criticism. No passing search or word-count target substitutes for that work.
