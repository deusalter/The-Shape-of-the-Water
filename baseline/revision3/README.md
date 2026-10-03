# The City That Remembers Wrong
## Literary-first Codex production brief, revision 3

Prepared for Dawg on 3 October 2026. Original game, separate from Hêrte.

This is a production specification and development plan, not an implemented game, a finished screenplay, or a promise of masterpiece-level results. It directs the implementation agent to create and revise the literary work as well as build the software. The story-development milestone is deliberate, not permission to stop after another plan.

The newest direction supersedes the earlier registry/identity-plate case. Its 24-clue inventory, 12 deductions, three fixed endings, and reduced-model test results are not carried forward. None is evidence for the new fiction.

## Revision 3 additions

Substantial Kant/Spinoza research, provenance-based names, strongly idiosyncratic voices, and recoverable ongoing multi-chat revision are integrated into the dependency plan. Read docs/09-PHILOSOPHY-INVESTIGATION.md, docs/10-NAMING-AND-VOICES.md, and docs/11-CONTINUOUS-REVISION-AND-HANDOFF.md before narrative work. Existing approved work takes precedence over the packet's audition examples.

For an active project use prompts/PHILOSOPHY_AND_VOICE_UPDATE.md. For a new project use CODEX_START_PROMPT.md. For a subsequent session use CONTINUE_PROMPT.md with the actual current working files. This ZIP alone cannot contain changes made after it was generated.

## Start

Read `docs/00-CREATIVE-DIRECTION.md`, then the product requirements and narrative production plan. Use `CODEX_START_PROMPT.md` in the authorized cloud workspace. Choose GPT-6 Astra for coordination, with Ultra when actually available. The lead literary work stays with one Astra writer using Max when supported, otherwise Extra High. Code workers use GPT-6.1 Sol. Exact capability caveats and inert configuration templates are included.

## Reading order

1. `AGENTS.md`: permissions, coordination, and product invariants.
2. `docs/00-CREATIVE-DIRECTION.md`: artistic priorities and exclusions.
3. `docs/01-PRD.md`: product requirements and release boundaries.
4. `docs/02-NARRATIVE-PRODUCTION.md`: how to develop, lock, write, and revise the actual story.
5. `docs/03-TECHNICAL-SPEC.md`: engine, data, save, authoring, and testing contracts.
6. `docs/04-IMPLEMENTATION-PLAN.md`: dependency-ordered executable work.
7. `docs/05-ACCEPTANCE-TESTS.md`: observable verification requirements.
8. `docs/06-MODELS-AND-AGENTS.md`: model selection and delegation.
9. `docs/07-REVIEW-REPORT.md`: historical revision-2 specification review.
10. `docs/08-SOURCES.md`: external source register.
11. `docs/09-PHILOSOPHY-INVESTIGATION.md`: primary research, disagreements, and scene integration.
12. `docs/10-NAMING-AND-VOICES.md`: sourced names and specific, variable voices.
13. `docs/11-CONTINUOUS-REVISION-AND-HANDOFF.md`: iteration, ownership, and actual continuation.
14. `docs/12-REVISION-3-REVIEW.md`: this revision's checks and limitations.

`examples/OPENING-AUDITION.md` illustrates a dramatic test. It is not settled story canon and must not silently determine the protagonist or whole game.

## Priority and conflict resolution

Current explicit owner instructions control. Within this package, the creative direction controls artistic priorities; the PRD controls scope; technical contracts control runtime correctness. Do not let a convenient technical constraint turn fiction into a bureaucracy. Do not break save safety or player knowledge boundaries to preserve an attractive line. Resolve a real conflict explicitly and update the affected sources together.

## Deliverables

A complete compact literary game with a coherent authored history, meaningful dialogue and revisits, reliable local saves, a restrained readable interface, and a small writer-facing preview/editor. A full generalized authoring studio is post-game scope. Development should leave a runnable build and a truthful handoff after each milestone.

No paid runtime AI, account system, public deployment, local-Mac access, or use of personal files is authorized. Cloud-only execution is the safe default for this project. A model or configuration file does not grant missing permissions.

## Packet-check boundary

`python3 tools/check_packet.py` validates the specification and immutable `tools/seed-execution-state.json`. The live `docs/execution/STATE.json` must evolve with actual work. Never reset it to unstarted in order to pass the packet checker. No static packet check certifies live cross-chat recovery.
