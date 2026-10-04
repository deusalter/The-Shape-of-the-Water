# Finite authored occasions: root integration contract

Authorized implementation wave, 2026-10-04. This implements narrative/loop/OCCASION-REQUIREMENTS-L3.md without changing the meaning or serialized bytes of existing occasion-absent v2 runs. The fiction remains the lead writer's responsibility. Three-dimensional presentation is separate from this deterministic engine.

## Opt-in boundary

`ContentV2.occasions?: {id:string,label:string}[]` opts into a finite authored sequence, maximum 16 entries. Labels describe encountered visits, not world chronology or a theory of identity. Unknown/duplicate occasion IDs reject. In opted-in content every scene, source, factual question, interpretation rule and hint declares `occasionId`. Characters declare exactly one of `occasionId` or `persistent:true`; absence alone never confers persistence. IDs remain stable author identifiers. Source IDs designate authored occurrences; optional `sourceKey` connects occurrences of the same declared material, with a unique sourceKey/occasion pair. IDs never become independent provenance merely because their occasion differs.

The ordinary v2 content/state/portable paths must retain exactly their prior representation when occasions is absent: no new default field, new empty array, changed hash, receipt or replay. All new occasion-only metadata, actions and guards reject in non-opted-in bundles. Existing v1 remains untouched. Internal state gains `currentOccasionId` only for opted-in content. Encountered passages, sources, conclusions and action records carry only their actual occasion ID and captured label; future occasion lists and actor identities do not enter the player projection or portable save.

The 64-flag aggregate bound becomes at most 64 times the declared occasion count in opted-in bundles, bounded by 1024 overall. Existing per-list bounds, total authored-entity limits, proof expansion, 10 MiB and command limits remain. The actual expanded story should stay well below these limits; increasing bounds is not a license to add arbitrary complexity.

## Transition and state ownership

A choice crossing from one scene occasion to another explicitly declares `enterOccasion: targetOccasionId`, which must match its destination. Ordinary choices cannot silently cross occasions. Question targets cannot cross occasions. A transition moves to the immediately next declared occasion; no skipping, earlier or repeated occasion is permitted. Earlier history is visited through transcript, not by reverting runtime. An explicit later occasion models the optional second traversal.

Choice requirements/actions run against the departure state. Then the target occasion becomes current before destination entry guards, variants and source capture. Eligibility simulation uses a clone and cannot change live NPCs, transcript or source history. Rejected transitions leave the prior state byte-for-byte intact.

The first service crossing is an ordinary action whose extraordinary consequence is not known to Blaise. It MUST NOT present a modal revealing that consequence. The author controls `irreversible:true`; the informed optional second crossing uses it and therefore requires the existing fresh state/payload-bound receipt. Canceling that receipt changes nothing.

Flags, sources, deductions and literal transcript are retained, not reset or deleted. New current permissions use distinct occasion-scoped IDs and actor states. A remembered private conversation is not new consent. Interior o1/o2 actors begin from authored anchor initial state; they cannot inherit later o0 knowledge by matching display names. Reacquiring the film uses a new source ID with the same underlying account provenance. Earlier source records never mutate.

## Current evidence and historical use

In opted-in content `hasSource`, `hasDeduction` and `flag` guards and every proof `ref` explicitly declare `scope: 'current' | 'historical' | 'encountered'`. Current requires the captured occurrence's occasion to equal currentOccasionId; historical requires an actually encountered earlier occasion; encountered accepts either. Add `{op:'occasionIs',id}` for an explicit occasion guard. Old guards/proofs without scope retain their exact old behavior only in old bundles. Occasion-scoped scene/source/question/reading/hint/interior-actor IDs and permission flags use the exact `occasionId.` prefix; metadata establishes membership and validation checks the namespace. Ordinary requires/unless/effects lists use only their entity's current-occasion permission flags. Historical flags require explicitly scoped guards. Persistent actor IDs are exempt.

Questions and hints are offered only in their declared current occasion. Interpretation closure gains eligibility only in its declared occasion, never refires prior effects, and retains already-earned availability/history. Retained reading text must carry its originating label when encountered later. Scope-sensitive predicates and occasionIs are not monotonic across transitions; closure must treat the declared occasion as its evaluation window rather than asserting timeless monotonic truth. The root notebook will distinguish captured visit labels using encountered metadata only.

Proof compilation must retain each leaf's scope constraints through nested AND/OR expansion and deduplication. A remembered film cannot satisfy a current-film leaf. Static checking should diagnose impossible scope references, without unioning alternate deduction routes into a false independence rejection. At runtime, only the actual selected witness ancestry counts.

## Recollection and provenance

`SourceV2.derivedFrom?: string[]` identifies exact already-encountered source/conclusion parents. A derived report is a separately delivered present statement or document; it cannot appear unless all parents were encountered. The declaration does not acquire parents or reveal missing parent names. For derived reports the runtime provenance is the union of their parents' actual ancestry, replacing their fresh provenanceId contribution. Repeated retelling cannot add an independent origin. Parent sources remain unchanged.

Validate a bounded acyclic combined graph of source derivations and question dependencies. Bound traversal and expansion before recursion; reject self/cross cycles, unknown references, excessive depth and malformed parents. State reconstruction is the authority for acquired history. Do not infer that any source statement is true merely because it has parents.

## Actor actions

`{type:'snapshotCharacter',fromCharacterId,toCharacterId}` copies the actual departing actor's knows/believes/claims to a distinct persistent exterior actor. It runs at the witnessed departure, not retrospectively at the crossing. Deep-copy the actual arrays, preserve historical source attribution and never add the player's entire notebook. Snapshot source must be a current interior actor; destination must be a distinct persistent actor. A hidden destination snapshot receipt records fromCharacterId, occasionId and revision; initialize that target at most once. Repeated snapshot/eligibility calls cannot mutate the source or overwrite the exterior's subsequent state. An exterior actor's later acquired state persists into o2; no implicit reinitialization. Snapshot receipts never enter the encountered projection/export.

`{type:'witnessSource',characterId,sourceId}` grants an active NPC knowledge of a declared current-occasion source. It acquires no player evidence, claim, conclusion, reading or disclosure. This is an explicit author-staged witnessing event, not automatic inference. The prose/source must fit what that person could actually perceive; Miriam can see the chair contact without hearing its exact words. Hidden NPC-only source text remains absent from exports until actually delivered to the player. Existing disclose requires player encounter and applies only to an active/persistent recipient; setBelief has the same recipient restriction.

In opted-in bundles disclose requires a currently encountered source or deduction, and an active interior or persistent recipient. A historical exhibit must first become a separately encountered current recollection source; disclosure delivers that report only and does not deliver its ancestral exhibit. setBelief/witnessSource use the same active-recipient restriction. Ordinary persistent actors, including Blaise, are active from the start. Only explicit `persistent:true, requiresSnapshot:true` targets start inactive; their initial knows/believes/claims arrays must be empty, and they become active after their one-time snapshot. Snapshot destinations must declare requiresSnapshot:true. Actor names confer none of these properties.

Actor display names never select state. Current and exterior Miriams remain separately addressable without a real/copy verdict. Future hidden actor names do not enter the DOM through knowledge controls or snapshots.

## Preservation and required checks

No v2-to-expanded migration is approved in this wave. Existing ended runs stay ended under their exact bundle. Root will preserve the first-night bundle and use an explicit new content revision for expanded play. No new transition is appended to a previously completed run without a separately reviewed continuation contract.

Implement a noncanonical three-occasion fixture and meaningful tests covering: retained exact o0 text after two transitions; current-vs-historical proofs; old-film/current-film separation; explicit recollection acquisition/ancestry; independence failure across retellings and shared pre-anchor testimony; actual departing actor snapshot and later exterior learning; fresh interior ignorance; NPC-only witnessing privacy; first ordinary crossing without a spoiler receipt; second crossing cancellation/stale receipt/replay; refusal ending without o2; hidden future labels absent; malformed cycles/scopes/oversized inputs; and ordinary v2 byte identity for pinned real traces. Existing migration, budgets and proof ancestry tests remain in force. Full-game reachability is not proven by fixture tests.

Engineer owns src/engine/evidence-* and new tests/occasion-*.test.ts for this wave. Root owns UI, studio support, installed bundle choice, shared manifests and integration. Lead_writer owns canonical scenes and content. This contract authorizes implementation now; report concrete deviations before broadening scope.
