# T-002 requirements for the coordinator's occasion contract

Proposal only. Do not import this document or route-graph.json as runtime content. Root owns the schema/engine; lead_writer decides fictional events. Read OCCASION-LEDGER.md together with the existing OCCASION-REQUIREMENTS-L3.md. These are additional acceptance requirements, not implemented passes.

## Current code inspected and the actual gap

At input `69ec3ca`, `src/engine/evidence-types.ts` identifies encountered sources by source ID, scene and revision, with one `provenanceId`. It has distinct NPC `knows`, `believes`, and `claims`, but no occasion or occurrence selector. In `evidence-runtime.ts`, `acquire` returns when that source ID already exists, `hasSource` searches the global acquired list, and NPC disclosure names a character ID. `independent` resolves provenance through the selected deduction witnesses. `evidence-proof.ts` expands bounded nested AND/OR witnesses. These useful existing mechanisms must be preserved, not silently reinterpreted to mean “current occasion.”

The missing operation is not ordinary scene revisit or clearing global flags. It is an authored transition that preserves encountered history and creates a new current availability/actor situation. An engineer must version that contract and test it. No changes to runtime, content, manifests, tests outside this directory or canonical narrative are made here.

## Required distinctions

1. **Stable definition versus immutable occurrence.** Retain a content source definition, but give every acquired occurrence its own ID, encounter occasion, acquisition revision and captured literal text. A current reading of a carried paper is a new encounter with an old record. Keep its inscription occasion separate from its reading occasion and its asserted event scope. `current` cannot mean that the events described happened now.
2. **Historical availability versus present access.** Preserve all transcripts, selected proofs, memories and concrete relationship actions across a transition. An old camera playback stays historical; a current question needing an inspected film requires current access. A written retained report may qualify for a question about what was recorded, not automatically for one requiring direct evidence of the original event.
3. **Testimony and disclosure.** “Blaise tells Ada what he remembers” acquires a current statement linked to the historical occurrence and delivers that statement to Ada. It neither gives her the missing exhibit nor makes her remember participating. Recollection, agreement, first-person experience, and reading a document need separate authored effects.
4. **Provenance is claim-specific.** A paper can aggregate different origins; a future extension cannot assign one fresh independent origin to the whole sheet and launder every claim through it. Separate witnesses to the Sunday chair can corroborate visual contact, while E lacks the exact words. Duplicate/remembered/retold accident testimony from the two Miriams must preserve overlapping history. The author must declare which observational contribution is independent, not derive it from speaker count or occasion count.
5. **Actor instances and presence.** Current interior actors use their authored anchor snapshots. E carries the actual departure snapshot plus her own performed exterior account and later disclosures. Snapshot only after the shown departure action. Display-name equality never merges actors. In `o2`, archive the unavailable `o1` interior targets; do not silently transfer their current promises, participation choices or consent to A2/S2/I2. “Unavailable to the current scene” does not encode “dead.”
6. **A finite, atomic transition.** Capture the crossing text and choice, preserve history, advance to one explicitly authored occasion, install its scene/actor state and acquire only its displayed sources. Reject third crossings unless authored. No wall-clock, network fetch, random result or metaphysical-belief flag controls the fictional result.
7. **Branch-bound confirmation.** Final crossing requires the existing state/action-bound receipt after risk, individual decisions, E's actual front departure, and camera start. The all-front postponement and cancellation do not reuse that receipt or advance occasion. Duplicate command delivery must produce one crossing. Cancel/reload/stale-tab behavior needs tests using the real storage/engine flow, not a diagram.
8. **No future leakage.** Don't expose E, an `o2` label, unseen source titles, a third Miriam, or a list of possible endings before encounter. Notebook descriptors should say “first visit,” “told from memory,” “read now; written before this return,” and recognizable speaker context. A current lack of access is not a tooltip revealing hidden fate.
9. **Legacy protection.** Old v1/v2 ended saves stay ended under their hashes. A new expanded content identity and reviewed migration/continuation branch are needed. Do not unset `ended`, rewrite old text or import old flags as present permissions.

## Fictional proof questions worth implementing

| Claim | Sufficient bounded support | Reject as insufficient |
| --- | --- | --- |
| Two separately acting people are now present | Complete shared interaction and its actual current source occurrence | A remembered image, similar names, two retellings or a single photograph |
| A marked long strip and close counterpart are currently available | Both observed in one comparison, with attributed retrievals | Pre-return marking alone, shorter bearer mistaken for counterpart |
| Present pair can be altered separately | Ada's new circle drawn with other strip beside it, only if selected | Mere resemblance or narrator belief in duplication |
| B's front out-and-back did not produce represented return in this test | LP-R06 exterior-retrieval route | Box-watching route grants only Ada's departure/return plus retrieval account |
| The empty-handed repeat occurred | Actual confirmed crossing and current return tableau | Intention, camera start, cancellation, or choosing a metaphysical belief |
| A prior occasion's inscription is presently readable | Proposed `o2` paper reinspection with current object access | `o1` paper remembered, exterior witness's unverified possession claim alone |
| A parcel was unnecessary for that repeat | Empty hands before crossing + represented result | Claim that mirror never mattered, or that same causes were repeated |

Keep the local descriptive findings separate from interpretation candidates such as branch-world creation, a restored region or divine favor. The finite case does not yet supply sufficient evidence to select a unique generative mechanism. That remaining limitation is an editorial decision the coordinator must see, not a hidden green deduction.

## Concrete acceptance scenarios for later implementation

These are proposed scenario requirements, **not executed engine tests**.

| ID | Setup / command | Expected behavior |
| --- | --- | --- |
| OC-01 | Enter `o1`, export, reload, reopen original arrival | Exact `o0` photo/read-count text survives as historical; hidden `o1` screen not acquired. |
| OC-02 | Submit `o0` film to a current-film question | Guarded rejection; historical finding remains visible. No missing-source spoiler. |
| OC-03 | Tell A1 about chair; then ask if she remembers | She knows B's report only; neither memory nor consent is created. |
| OC-04 | Two Miriams submit overlapping pre-anchor accounts as independent origins | Independence condition fails where origins overlap, without denying their current co-presence. |
| OC-05 | E testifies to distant chair movement | Corroborates contact; cannot supply exact words. |
| OC-06 | Choose LP-R06 box-watching versus exterior retrieval | Both can compare objects; only exterior-retrieval route gets B's own front trial. |
| OC-07 | Never hear original intimate confidence | No later E continuation reconstructs it from a flag or supplies its contents. |
| OC-08 | Private Ada offer encountered, then optional repeat | E says she was absent; alternate public callback only uses words heard before departure. |
| OC-09 | Take direct refusal or all-front postponement | End in `o1`; no second-return record, no philosophical guard, no promise of third trial. |
| OC-10 | Cancel after E departs and camera starts | Camera setup record retained; E explicitly returns with coat/paper; no `o2` facts. |
| OC-11 | Confirm repeat twice, or retry after reload | One occasion change only; state-bound receipt and processed command identity enforced. |
| OC-12 | Inspect retained paper in `o2`, then disclose to S2 | Readable occurrence stays tied to original inscription and claims; only explicit disclosure teaches S2. It never grants camera playback. |
| OC-13 | Query current participation permission after repeat | I1's decision remains historical and readable; I2 has not consented. |
| OC-14 | Change all belief choices while keeping physical actions fixed | Physical findings and transition outcome unchanged; dialogue/relationship history may differ. |
| OC-15 | Attempt all-outside service crossing or third crossing without authored outcome | Action is not offered in this finite content; no generic reset or invented new actor. |

The prose all-outside postponement makes the omitted experiment visible, rather than pretending that nobody thought of it. If the lead selects an all-outside **crossing**, OC-15 must be replaced with authored propagation and new tests, including potential extra continuations. A new state identifier is not a substitute for that writing decision.

## Coordinator follow-up: 3D faceless presentation

Fetched and read `docs/OWNER-3D-FACELESS-2026-10-04.md` at `70a495a8b6e7a9ec9ed64c281c302b14e0d0ae60`. Root owns Three.js implementation; faceless block-like figures supersede painted facial portraits. This does not change the narrative identity of either Miriam or make one a ghost. No rendering changes are made here.

Co-presence must remain legible through two separately placed and moving figures, their cups/chairs, heard replies and accessible text. No facial texture, darker material, supernatural effect or model ID may disclose which continuation is supposedly real. A character's spoken breath or expression in prose need not become an illustrated face; follow the correction without reducing the prose to geometry.

Renderer proximity/collision must not itself trigger an unconfirmed second crossing, award a source the player has not inspected, synchronize the two conversation targets, or establish the pencil/camera mark as a proven metaphysical boundary. The authored event and irreversible confirmation drive the transition; scene geometry communicates its staging. Any 3D build tests belong to that new revision, not this proposal's static validation.
