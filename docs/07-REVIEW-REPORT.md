# Specification review report
## Historical revision 2 review, 3 October 2026

This report describes the earlier packet only. Its 22-task, 64-check, 12-template inventory is superseded by revision 3. Use docs/12-REVISION-3-REVIEW.md and the current reviews/packet-check.json for this package.

This report concerns the planning packet. There is no implemented game or finished replacement screenplay in the packet. The review was performed by the drafting assistant, not by an independently executed subagent or human playtester.

## 1. Consequential issues found and repaired

| Issue | Why it mattered | Repair |
| --- | --- | --- |
| The original case relied on registries, authorizations, identity plates, and copied administrative records | Direct conflict with the owner's requested literary direction | Retired the whole case instead of renaming its objects; replacement story production now precedes full-case implementation |
| Fixed 24-clue/12-deduction counts shaped the story before its voice was demonstrated | Risk of mechanical completeness substituting for literary value | Removed those quotas; introduced scene auditions, a revised opening, and a causal story lock |
| The full authoring studio competed with the game for priority | A polished tool could become an excuse not to write and revise the fiction | Small text-centered author workspace after the complete playable draft; generalized graph tools deferred |
| Many agents could fragment the final voice | Separate competent passages need not form one convincing book | One final literary owner; challengers draft separately; critics diagnose rather than merge canon |
| A simple banned-word list could produce equally generic synonyms | It would leave the underlying conceptual shortcut intact | Added scene/psychology/intellectual standards, contextual rhetorical review, and anti-pattern examples |
| "Deep writing" could collapse into abstract speeches or universal solemnity | It would contradict the requested character-driven, varied experience | Explicit room for ordinary activity, humor, desire, ugliness, extended thought when earned, and unresolved disagreement |
| Factual proof mechanics could accidentally certify moral judgments | It would turn the player's interpretation into a scored right answer | Separate factual deductions from subjective choices and finite relationship consequences |
| State-dependent prose could be silently rewritten on revisiting the transcript | It would undermine fair recontextualization | Added stable actually-shown variants, content hashes, occurrence ordering, and historical transcript migration requirements |
| Passing checks for the retired story could be mistaken for proof of the new story | That would be a false verification claim | Removed old fixture/checker from the new bundle and explicitly rejected reuse of its results |
| UI acceptance depended on working storage but the initial task graph did not express that dependency | A worker could be marked Done against an unintegrated shell | Added engine/storage dependencies to integrated UI acceptance while allowing early primitive layout work |
| Model templates could be mistaken for verified runtime selections | Client support, account access, and inherited settings vary | Kept templates inert, documented support checks, model fallbacks, and Unverified metadata requirements |
| A numerical literary score could replace judgment | Test compliance cannot establish masterpiece quality | No literary certification or simulated human approval; actual passages, review findings, and readers' observations remain distinct |

## 2. Current mechanical checks

The revision-2 packet checker checked 22 task definitions, configuration syntax, source IDs, and acceptance identifiers. That historical inventory is superseded. Run the updated `python3 tools/check_packet.py` for revision 3; its current results are described in docs/12-REVISION-3-REVIEW.md and reviews/packet-check.json.

The machine-readable result is `reviews/packet-check.json`. These are packet checks only. They do not execute Codex, select a model, run a browser, evaluate a new story, validate a save implementation, or measure artistic quality.

## 3. Limits and deliberate production decisions

The replacement story's ending, cast, and clue paths must be created and locked at L1/T09. This is a specified creative deliverable, not a hidden claim that a solved story already exists. Full-story implementation depends on that task. Generic engine work and a small noncanonical fixture can proceed while the literary lead develops the opening.

The sample opening is illustrative and explicitly open to criticism. It is not approved canon. The lead may reject it.

Exact package versions must be resolved and pinned in the authorized cloud workspace. Model identifiers and custom-agent configuration fields were checked against official documentation; actual account availability and template loading remain unverified.

No human playtime measurement, accessibility conformance test, real player response, or independent literary review occurred while creating this packet. Those activities belong to the development and review milestones. Their absence must remain visible in future reports until they actually occur.

## 4. Handoff assessment

This packet is ready to serve as a detailed creative-production and engineering brief. It is not proof that the resulting game will be excellent. The next concrete work is to draft and compare actual openings while implementing the small deterministic fixture, then settle a coherent story worth building.
