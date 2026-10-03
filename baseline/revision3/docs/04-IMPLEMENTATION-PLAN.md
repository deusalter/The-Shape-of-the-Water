# Implementation plan
## A complete creative and engineering workflow

The coordinator is responsible for delivered work, integration, and truthful reporting. This is not an instruction to stop after planning. Create the story through the specified literary gates and implement the game through the product milestones.

## 1. Operating rules

Use only the authorized cloud workspace. No local-Mac fallback, personal filesystem access, billing change, paid API, public deployment, repository publication, or push is authorized by this brief. Preserve unrelated work and existing repository hooks. A cloud preview is acceptable; publishing beyond that requires permission.

Maximum four active subagents, fewer when tasks are not independent. Workers do not spawn workers. Each assignment names the task, required context, model/effort, owned write paths, excluded paths, dependencies, acceptance tests, and return format. A read-only reviewer inspects a pinned revision.

The coordinator owns root manifests, lockfile, integration, shared contracts, and the task board unless explicitly delegated. One lead writer owns final narrative files and canonical decisions. Other writers use separate draft paths. Nobody edits another worker's surface without coordination.

A task is Done only when its actual deliverable exists and its checks have run or exact blockers are reported. A writing task needs prose. An implementation task needs working code. An execution task needs command output. A critique needs specific findings, not generic praise.

## 2. Task board and handoff

Create `docs/execution/ENVIRONMENT.md`, `BOARD.md`, and `HANDOFF.md`. Record current revision, capability limits, selected/verified models, active workers, task states, dependencies, actual tests, editorial decisions, unresolved failures, and exact next actions.

Use Not started, Ready, In progress, In review, Done, Blocked. Distinguish a provisional editorial decision from owner approval. Do not require the user to approve every routine creative or engineering choice; proceed within the brief and expose consequential decisions.

## 3. Task cards

### T00: workspace and capability audit

Owner: coordinator. Dependencies: none. Scope: execution documentation.

Inspect selected cloud workspace, repository status, available runtime, package/network access, browser tools, available delegation controls, and actual model metadata when exposed. Preserve unrelated changes. Confirm which project configurations load. Do not treat an agent's self-description as model verification.

Acceptance: truthful environment report and safe workspace. Missing capabilities have exact effects on the plan. No invented agents, browser tests, or local fallback.

### T01: two dramatic treatments

Owner: lead writer with optional separately scoped challenger. Dependencies: T00. Scope: `narrative/drafts/treatments`.

Perform N0 from the narrative production plan. Produce two substantially different treatments and scene samples. Avoid the retired administrative case and a reskinned reference game. Select a provisional direction using concrete passages and play possibilities.

Acceptance: actual prose and a decision; no giant idea list, biography matrix, or lore encyclopedia.

### T02: toolchain and package boundaries

Owner: coordinator or exclusive systems worker. Dependencies: T00. Scope: root configuration, app/package scaffolds, tooling records.

Resolve current stable compatible React/TypeScript/Vite, schema and test libraries; pin versions and lockfile. Establish player, small author workspace, pure engine, schema, storage, validator, content, and UI boundaries.

Acceptance: real install/typecheck/build/test commands run, or precise environment blockers. No no-op scripts or unused backend.

### T03: minimal schema and interface freeze

Owner: systems worker under coordinator contract ownership. Dependencies: T02. Scope: `packages/schema`, contracts, ADRs.

Implement scene, text variant, choice, statement, observation, finite flag, factual proof, interpretation, transcript, event, save, and author-project schemas. Distinguish subjective commitments from factual support. Enforce safe data limits and stable IDs.

Acceptance: positive/negative fixtures; runtime validation; versioned contracts shared with workers. No arbitrary authored JavaScript.

### T04: tiny noncanonical engine fixture

Owner: lead writer or bounded drafting worker. Dependencies: T03. Scope: test content only.

Write a brief original situation containing a physical task, a statement initially misunderstood, a later clarification, a consequential response, and a repeat visit. It must not rely on paperwork or borrow the final story's answer. Keep it small enough to exhaustively test.

Acceptance: fully written fixture with explicitly supported factual claims, subjective choices, and alternate response paths. Label it test content, not completed main-game scenes.

### T05: pure engine and projections

Owner: systems worker. Dependencies: T03, T04. Scope: `packages/engine`.

Implement conditions, commands, events, immutable state, scene/choice transitions, actual-shown transcript variants, knowledge filtering, factual proof alternatives, interpretation history, and deterministic replay. Prohibit DOM, browser storage, network, wall clock, and randomness in the engine.

Acceptance: determinism, rejection without mutation, idempotence, hidden-content projection, and immutable prior text tested. Moral positions never have a supported-candidate answer.

### T06: opening draft and literary review

Owner: lead writer. Dependencies: T01, T26. Scope: `narrative/opening`, `narrative/VOICE.md`, review drafts.

Perform N1. Write the whole opening and two versions of a central exchange. Obtain an independent blind read and a separate dramatic/line critique, sequentially if necessary. Select and integrate one voice.

Acceptance: scene-driven playable design, actual prose, explicit choices and revisits, specific review findings, and a revised version. No claim of human approval without actual feedback. This completes L0.

### T07: persistence foundation

Owner: persistence worker. Dependencies: T03, T05. Scope: `packages/storage`.

Implement atomic IndexedDB commits, revision checks, duplicate-command handling, last-good checkpoints, separate notes/UI metadata, run branching, and honest save state. Keep author preview storage separate.

Acceptance: commit/failure boundaries, duplicate delivery, stale revision, reload, and valid-run preservation tested.

### T08: readable UI and interaction shell

Owner: player UI worker. Dependencies: T02, T03, T05, T07 for integrated acceptance. Scope: `packages/ui`, assigned player views.

Primitive layout work may begin after T03, but this task cannot be accepted before engine and storage integration. Build reading layout, dialogue choices, location list, transcript, notebook drawer, settings, focus restoration, and content notes. Use restrained style and actual engine projections. No dashboard card wall or mandatory animations.

Acceptance: tiny fixture playable by keyboard, text reflow, instant text, persistent mute, correct choice labels, real save/reload. This completes M0 with T05/T07.

### T09: story lock and disclosure contracts

Owner: lead writer with independent causal review. Dependencies: T06, T25, T26. Scope: canonical narrative documents and scene inventory.

Perform N2. Write fixed history, protagonist knowledge, relationship incidents, source visibility, factual proof routes, return moments, final scenes, ending consequences, and representative walkthroughs. Remove circular clue dependencies and any paper-trail replacement for human drama.

Acceptance: coherent written ending, complete causal reconstruction, traceable disclosure paths, supported alternative access where necessary. This completes L1. Full-case implementation cannot precede it.

### T10: integrate the literary opening

Owner: content implementer and player UI worker on disjoint paths. Dependencies: T05, T06, T07, T08, T09, T27. Scope: opening content and assigned UI integration.

Compile and play the selected opening through the actual interface. Implement its branch consequences, transcript, notebook behavior, and revisit. Preserve the literary draft's important rhythms instead of turning every sentence into a pop-up.

Acceptance: end-to-end opening routes, actual save/reload, changed reading and preserved original text, no critical placeholders. This completes M1.

### T11: whole first draft

Owner: lead writer, with bounded scene commissions in separate draft paths. Dependencies: T09, T27. Scope: narrative prose and canonical scene data.

Perform N3. Write the whole first game, including endings, alternate responses, losses, and revisits. Keep evidence-bearing lines traceable. Integrate all commissioned prose through the lead writer.

Acceptance: actual text for every mandatory scene and ending. Character histories, knowledge, and consequences align. Stage directions asking a later model to supply dialogue do not count.

### T12: content compilation and validation

Owner: systems/verification worker. Dependencies: T03, T05, T09. Scope: `packages/content` compiler and `packages/validator`.

Implement reference, guard, proof, asset, transcription, and unsafe-content validation. Generate exact diagnostic locations. Add an advisory style scan for narrative fields without automatic rewriting or AI-authorship claims.

Acceptance: valid cases compile, malformed fixtures fail safely, moral choices stay outside factual grading, and style warnings include precise spans. Unknown fields do not silently vanish.

### T13: full story integration

Owner: content implementer and coordinator. Dependencies: T10, T11, T12. Scope: canonical runtime content and integration fixtures.

Implement all locations, conversations, observations, interpretations, and ending conditions. Verify scene entry/exit states against the locked story. Make major scene transitions reachable without pixel hunts or hidden UI knowledge.

Acceptance: full story playable to all supported endings with no required placeholder text. This completes M2, not final literary quality.

### T14: knowledge and consequence exploration

Owner: verification worker. Dependencies: T05, T09, T12, T13. Scope: test/exploration tools, fixtures, reports.

Explore the actual engine across representative disclosure orders and consequential choices. Keep history fields that affect future behavior in the state hash. Test every required alternate proof route. Return witness traces and explicit incomplete coverage when budgets expire.

Acceptance: reproductions of detected failures, replayable ending traces, and no unqualified PASS from an exhausted search budget. Human fairness remains a separate review.

### T15: sequential literary revision

Owner: lead writer; independent reviewers read pinned outputs. Dependencies: T11, T13, T28. Scope: narrative and coordinated content edits.

Perform N4: causal/disclosure, dramatic, character, intellectual, line/rhythm, and ending-return passes. Review full relationships, not isolated quotable passages. Preserve deliberate roughness, humor, and unresolved tension.

Acceptance: consequential edits documented, actual revised prose integrated, dependent tests rerun. No forced flaw quota or numerical masterpiece rating.

### T16: minimal author workspace

Owner: author UI worker. Dependencies: T12, T13. Scope: `apps/studio`.

Implement text-centered structured editing, references, diagnostics, last-valid preview, guarded delete/rename, undo/redo, and export/reimport. Use the actual engine. A readable dependency table is sufficient; defer a full node graph.

Acceptance: create and play a second tiny fixture without source-code edits. Injected author states are visibly noncanonical and cannot enter player saves.

### T17: save recovery and import failure handling

Owner: persistence worker. Dependencies: T07, T13. Scope: storage, migrations, assigned UI errors.

Implement corruption recovery, quota/denied-storage behavior, staged import/export, content compatibility, old-save fixtures, multiple tabs, pre-ending branch protection, and historical transcript retention.

Acceptance: failure injection preserves valid originals, stale writes cannot overwrite newer choices, and Saved appears only after commit.

### T18: presentation and accessibility review

Owner: UI implementer and separate reviewer. Dependencies: T13, T15. Scope: assigned UI changes; reviewer artifacts only.

Inspect actual browser output at target sizes, text settings, keyboard navigation, and reduced motion. Refine typography, static visual treatment, and optional original/licensed sound. Preserve readability and content equivalence.

Acceptance: concrete screenshots/traces, repaired defects, complete transcriptions, and truthful untested-device list. No mandatory image or voice-generation dependency. This contributes to M3.

### T19: offline and asset packaging

Owner: persistence/UI worker. Dependencies: T13, T17, T18. Scope: release caching, update lifecycle, asset manifest.

Implement verified cache readiness, safe update activation, offline reload, missing optional audio, bundle hash checks, and separate player/author builds. Include only original or appropriately licensed assets.

Acceptance: interrupted caching never shows Ready; offline installed play works; unknown content changes do not silently reset a run.

### T20: independent final review

Owner: fresh reviewer, read-only. Dependencies: T14, T15, T16, T17, T18, T19, T29. Scope: reports only.

Review the pinned build against creative direction, product scope, actual source, story routes, disclosure, saves, and presentation evidence. Distinguish mechanical correctness, editorial judgment, browser testing, and human playtests.

Acceptance: exact findings, severity/confidence, reproduction where applicable, and evidence gaps. The reviewer may find no new blocker but cannot invent tests or certify literary greatness.

### T21: repair and handoff

Owner: coordinator and assigned owners. Dependencies: T20. Scope: identified defects and release documentation.

Repair valid findings, rerun affected tests, preserve unresolved editorial disagreements, build artifacts, and write a resumable handoff. Include story sources, player build, small author workspace, license inventory, compatibility data, and tested/not-tested report.

Acceptance: M4 or a clearly marked incomplete release with exact blockers. No unauthorized publish/push. Stop padding completed tasks.

### T22: persistent working-state bootstrap

Owner: coordinator. Dependencies: T00. Scope: execution state, root RESUME, continuation material.

Reconcile any existing project with the seed files. Establish STATE, BOARD, HANDOFF, decisions, critique queue, revision history, and explicit write ownership. Record exact available project revision or snapshot; do not invent a Git commit. Preserve current canon and approved work.

Acceptance: The working state identifies what really exists and the next dependency-ready task. Seed documents alone do not establish execution. No external chat or worker is claimed inspected without evidence.

### T23: Kant source investigation

Owner: kant_researcher. Dependencies: T22. Scope: research/philosophy/KANT.md and research/philosophy/sources/KANT.json.

Execute PH-K01 through PH-K04 in doc 09. Read the selected primary passages, locate claims accurately, distinguish empirical uncertainty from transcendental limits, and investigate causal explanation, practical freedom, autonomy, and humanity. Produce arguments, objections, errors to avoid, and dramatic experiments.

Acceptance: Source-backed dossiers with traceable locations, accurate quotation/paraphrase labels, serious difficulties, and applicable scene proposals. No final prose/canon write ownership.

### T24: Spinoza source investigation

Owner: spinoza_researcher. Dependencies: T22. Scope: research/philosophy/SPINOZA.md and research/philosophy/sources/SPINOZA.json.

Execute PH-S01 through PH-S04 in doc 09. Investigate necessity, adequacy, conatus, affects, and freedom in their connected system. Use exact Ethics references and retain points where the dramatic application exceeds the philosophical claim.

Acceptance: Source-backed dossiers and usable experiments without fatalism, a total-understanding meter, magical identity bookkeeping, or a one-trauma explanation of each person.

### T25: comparison and investigation-method synthesis

Owner: lead writer with philosophical critic. Dependencies: T23, T24. Scope: research comparison, inference note, provisional philosophy map; coordinator alone merges research/philosophy/SOURCES.json.

Read both completed investigations. Preserve disagreements about reason and freedom. Develop the bounded abduction/testing note using S21/S22. Select research discoveries that should change the developing story and map them to concrete situations. Do not add a philosopher faction.

Acceptance: Actual synthesis, at least one meaningful unresolved tension, explicit distinction between sourced interpretation and original artistic application, and concrete changes for story lock.

### T26: name provenance and voice auditions

Owner: lead writer with voice critic. Dependencies: T01, T22. Scope: narrative/NAMES.md, narrative/VOICE.md, assigned audition drafts.

Apply doc 10 to the small intended cast. Verify source name components; choose provisional readable combinations that fit the setting. Write ordinary, evasive/pressured, and intimate exchanges plus a shared scene. Derive concise voice anchors from actual passages.

Acceptance: Names with sources, stable IDs, differentiated speech beyond catchphrases, contrasting registers, and a lead selection. Packet examples remain optional. No unapproved existing names are silently replaced.

### T27: philosophy-to-scene calibration

Owner: lead writer and philosophical critic on separate surfaces. Dependencies: T09, T25, T26. Scope: narrative/PHILOSOPHY-MAP.md, targeted scene drafts and reviews.

Inspect the locked story and intended opening against the research. Draft or revise a sustained encounter that explores a genuine disagreement. Trace central questions through actual scene actions and later returns. Perform subtraction and over-suppression tests; check errors are attributed to characters where intentional.

Acceptance: Research changes the fiction rather than just epigraphs. Facts remain coherent across ethically different responses. Voice, philosophical accuracy, and dramatic action survive together. Update affected canon explicitly.

### T28: first recoverable integrated revision cycle

Owner: lead writer, coordinator, and bounded critics. Dependencies: T10, T27. Scope: assigned candidate/review paths and execution history.

Run doc 11 on the real integrated opening. Preserve baseline, identify a concrete weakness or uncertainty, produce a substantive candidate, obtain targeted critique, select through the lead, and rerun affected checks. Compare exact versions. Check voices across their available encounters.

Acceptance: An actual accepted or defensibly rejected candidate, exact critique evidence, regression results, and an actionable checkpoint. This initial task enables further runtime cycles; recurring cycles are not a dependency graph back-edge.

### T29: continuation rehearsal and recovery checks

Owner: coordinator with fresh bounded reviewer. Dependencies: T13, T22, T28. Scope: handoff bundle and rehearsal reports.

Create a current project snapshot and continuation instructions. Use a fresh authorized session for a resume rehearsal when available; otherwise run and label static completeness checks. Test stale baseline, missing critical file, unknown worker ownership, and unverified test claims in safe copies.

Acceptance: Exact distinction between actual fresh-session resume and static checking. Current work, names, voice anchors, remaining issues, and next action are locatable. No fictitious background execution or automatic future chats.

## 4. Suggested execution waves

Wave A: T00, then T22, with provisional T01 and generic T02 when safe. Wave B: T23/T24, T01/T26, and T02/T03 rotate through four slots. Wave C: T25/T06, T04/T05, then T09/T27 and T07/T08. Wave D: T10/T11/T12 and T28. Wave E: T13/T14 with T15/T16/T17 as their dependencies clear. Wave F: T18/T19 and T29. Wave G: T20/T21.

Task numbering preserves the previous IDs; it is not execution order. Consult the acyclic dependency file. Repeated editorial cycles are the active-work protocol from doc 11, not circular dependencies.

These are dependency-aware groupings, not a requirement to fill all four slots. In particular, do not let several agents rewrite the same prose or schema concurrently.

## 5. Interruption behavior

At each gate, leave a runnable or clearly described current build, exact files changed, tests executed, current content revision, active worker status, and the next executable step. Do not require the next session to reconstruct the plan from chat history. An interrupted task is not completed merely because it has a large report.
