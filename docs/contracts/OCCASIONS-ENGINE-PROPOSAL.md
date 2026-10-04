# Optional authored occasions: bounded engine proposal

Proposal, 2026-10-04. Root owns approval and the final contract. This is a design for the requirements in narrative/loop/OCCASION-REQUIREMENTS-L3.md, not implemented behavior or approval of the new fiction. The currently installed case remains pinned. Requested engineering configuration is GPT-6.1 Sol, xhigh; actual backend identity is unverified.

## Recommended contract

Extend the existing v2 facade with an optional authored feature. Keep v1 unchanged and preserve exact old v2 state, command, confirmation, transcript and portable bytes when `content.occasions` is absent. No general reset command, generated loop, world simulation or separate duplicate engine is needed.

Use these additions only in opted-in content:

| Field or operation | Meaning |
| --- | --- |
| `content.occasions: {id,label}[]` | One to three finite authored occasions, in experience order; this case uses o0, o1 and optional o2. Labels appear only for encountered occasions. |
| `scene.occasionId` | Required membership; the start scene determines the initial current occasion. |
| `source.occasionId`, optional `source.sourceKey` | A declared source occurrence, with optional stable object/account key. Each source ID is unique; each declared sourceKey/occasion pair is unique. |
| `question.occasionId`, `interpretationRule.occasionId`, `hint.occasionId` | Explicit membership for globally iterated content. Availability and new closure eligibility are restricted to the current occasion. |
| `character.occasionId` or `character.persistent:true` | Interior actors belong to one occasion; a deliberately persistent exterior conversation target has its own ID. Common names never join actors. |
| `choice.enterOccasion` | Explicit target occasion on a cross-occasion scene edge. Source-side actions run first; then the target occasion becomes current before target guards, variants and acquisition. |
| `source.derivedFrom: string[]` | Exact already-encountered source or accepted-deduction parents. A current recollection is a new statement occurrence, not the earlier physical exhibit. |
| `hasSource`, `hasDeduction`, `flag` with `scope` | In opted-in bundles, require explicit `current`, `historical` or `encountered` scope. Historical means an earlier authored occasion, not an earlier revision of the current occasion. |
| `proof` reference leaf with `scope` | `{op:'ref',refId,scope}` carries the same explicit scope. Submitted selectedRefs remain exact encountered IDs. |
| `snapshotCharacter` action | `{type:'snapshotCharacter',fromCharacterId,toCharacterId}` copies the actual departing actor's knows/believes/claims into the distinct persistent actor. |
| `witnessSource` action | `{type:'witnessSource',characterId,sourceId}` gives that actor knowledge of an authored current-occasion perception only. It does not acquire a player source, add a claim, submit a deduction or perform a disclosure. |

All additions are optional in the legacy schema and become required or constrained only when occasions are declared. An occasionId does not silently redefine an existing ID. Expanded content gets a new content version and exact hash. The unchanged old v2 API names remain: validateContentV2, createGameV2, applyCommandV2, confirmationForV2, projectPlayerV2, exportPortableV2, importPortableV2 and validateStateV2. No new public command type is necessary: a normal choose command selects the authored transition or witnessing/snapshot action.

Namespaces such as `o0.recording`, `o1.recording`, `o1.simon` and `o2.accident-question` name distinct occurrences/interior actors. Metadata establishes membership; validation checks namespace agreement rather than using a common character name as identity. A persistent exterior actor, provisionally `miriam_exterior`, is exempt from interior namespacing. Its identity is an internal conversation target, never an upfront player label or a claim that one Miriam is more real.

## State and event semantics

Add `state.occasionId` only for opted-in runs. Captured passages, action events, sources, deductions, selected interpretations, relationship records and hints gain their actual capture occasionId only in those runs. A source's declared occasion must equal the current occasion at its acquisition. The first captured instance of a source ID remains immutable; a corresponding occurrence in another occasion has another declared ID and does not overwrite it. Repeated visits within an occasion preserve existing first-source behavior and append exact passages as today.

Keep historical flags, encounters, choices, accepted deductions with exact selected/witness references, readings and interpersonal records. Use distinct namespaced permissions instead of removing history. Scene requires/unless, choice effects, question effects and reading effects must belong to their current entity's occasion. An old o0 permission cannot appear as an ordinary o1 requires/unless condition. Historical outcome tests use an explicit scoped guard. Interior actor IDs likewise prevent o0 disclosures from teaching o1/o2 actors.

The current engine initializes declared NPC state once. New interior IDs therefore begin with independently declared anchor knows/believes/claims; no action copies the departing interior state into renewed interior actors. Persistent exterior state is never reinitialized on entering o1 or o2. Initial state must represent the anchor, not contain Sunday's not-yet-witnessed chair event.

`snapshotCharacter` requires a current interior source actor and a distinct persistent target. It deep-copies knows, believes and claims, preserving their actual reference IDs and claim revisions while retaining the target ID. Store a hidden snapshot receipt on the target with source actor, occasion and capture revision; reject a second initialization of that persistent target. Ordinary later disclosures/witnessing may modify the exterior actor, and that actually acquired state persists into o2. Snapshotting occurs at the witnessed front departure, not retrospectively at the service crossing. Choice eligibility simulates this action on a clone and must never initialize or mutate the real target.

`witnessSource` requires a source declared for the current occasion and a current interior or initialized persistent actor. It adds only the reference to NPC knows. The author must stage presence and write a source limited to that witness's perception. Miriam's distant sight of the chair movement needs its own bounded source; it must not grant Ada's exact words from Blaise's closer encounter. The engine does not infer a witness, truth, hearing range or physical presence from a scene name. A hidden witnessed reference can later support an authored character response without appearing in player history until the player actually encounters that response/source.

For transitions, use this exact order in the clone that will become the accepted next state:

1. Check current choice guards and any required existing confirmation receipt.
2. Increment revision; apply source-occasion effects, captures, chosen records, witnessing/snapshot/disclosure actions and closure.
3. Append the encountered action event with the source occasionId.
4. Change current occasionId if enterOccasion is declared; validate the target entry under that occasion.
5. Capture only the actual target passage/variant, acquire its current sources and run current-occasion closure.
6. Validate both checkpoint and portable byte budgets; commit the frozen next state only if all steps succeed.

The first service crossing is an ordinary authored action without a spoiler confirmation. `enterOccasion` makes its transition explicit and atomic without implying informed consent to an unknown return. The optional second crossing sets `irreversible:true` and uses the existing fresh state/payload-bound confirmation after its actual in-story disclosure. Cancel changes no state. No transition is allowed through question.target. Cross-occasion choice edges must move to the next declared occasion and name enterOccasion; same-occasion edges must not name it. There is no authored edge back to an earlier occasion or an implicit fourth trial.

Old eligible readings remain historical encounter metadata. Historical selected readings stay visible; an earlier eligible title can remain as historical notebook availability. They never rerun closure effects or create current permissions. Any option to read an old eligible interpretation later must capture the newly read text at the actual current revision, keep its originating occasion distinct, and apply no new effects. The smallest first implementation may expose only already selected historical readings and current review actions; it must report that limitation rather than display unencountered historical reading prose automatically.

## Proof, disclosure and provenance

Current proof leaves require their selected captured source/deduction to belong to the current occasion. Historical leaves require an earlier declared occasion that has actually been encountered. Encountered scope explicitly permits either. Availability guards and proof matching use these distinctions, not object-key similarity, source titles or shared names. Unknown/unearned references still produce generic feedback without listing missing answers. Existing complete-route selection, declared corroborator policy and irrelevant-superset rejection remain intact.

A current recollection source must be a statement with the current Blaise speaker ID and authored memory wording. Its derivedFrom parents must all already occur in the player's captured sources or accepted deductions. Acquiring it never reacquires those parents as current exhibits. In opted-in content, ordinary disclose requires a current source/deduction; telling a listener about a historical exhibit requires a current recollection statement. The listener receives that statement reference only, not access to its ancestral film, paper or screen and not a factual deduction by fiat. Initial/snapshotted exterior knowledge may contain earlier references without converting them into current player exhibits.

For independence, a root source contributes its provenanceId. A derived source contributes the union of its parents' transitive origins and **replaces its fresh provenance contribution entirely**. An accepted deduction contributes its actual witnessRefs ancestry, never all declared alternate routes or selected extra corroborators. Deduplicate within each participating reference; require disjoint origin sets across references selected for an independent group. This preserves the previously repaired ancestry-set behavior.

The two Miriams' overlapping pre-anchor accident testimony must share the same provenanceId even when neither statement is derived from a player-encountered parent. Distinct occasion IDs, bodies, names, acquisitions and fresh report IDs do not make an already shared originating account independent. Miriam's separately witnessed Sunday chair movement may have a distinct genuine observation origin; it must not be fabricated by giving a derived Blaise report a new origin.

Validate a bounded acyclic combined ancestry graph of source derivedFrom references and question proof references for opted-in bundles. All parent references must exist, no source may derive from itself, and no question/source cycle may manufacture an origin. Runtime acquisition still checks actual encountered parents. Existing legacy question-cycle/grounding semantics remain unchanged in bundles without occasions. Keep current expression depth/node and 256-route bounds; statically bound ancestry depth before runtime recursion. Independence diagnostics must account for derived ancestry and remain conservative for questions whose actual selected witness route is not yet known.

## Small authored example

These fragments show schema shape, not canonical prose or a complete valid bundle:

```json
{
  "occasions": [
    { "id": "o0", "label": "First visit" },
    { "id": "o1", "label": "After the return" },
    { "id": "o2", "label": "After the second crossing" }
  ]
}
```

```json
{
  "id": "o1.blaise-recording-recollection",
  "occasionId": "o1",
  "sourceKey": "blaise-recording-recollection",
  "title": "Told from memory",
  "text": "An authored statement clearly identifies the earlier inspection as remembered.",
  "kind": "statement",
  "speakerId": "o1.blaise",
  "provenanceId": "report-origin-is-not-independent",
  "derivedFrom": ["o0.continuous-recording"]
}
```

```json
{
  "type": "snapshotCharacter",
  "fromCharacterId": "o0.miriam",
  "toCharacterId": "miriam_exterior"
}
```

```json
{
  "id": "o0.take-weight-through-service",
  "label": "Take the weight through the service door.",
  "target": "o1.return-tableau",
  "enterOccasion": "o1",
  "actions": [{"type":"acquireSource","sourceId":"o0.service-crossing"}]
}
```

```json
{
  "op": "all",
  "args": [
    {"op":"ref","refId":"o0.accident-sequence","scope":"historical"},
    {"op":"ref","refId":"o1.blaise-recording-recollection","scope":"current"}
  ]
}
```

This last example declares historical support plus a current report. It does not assert independent corroboration or a newly performed experiment.

## Privacy, replay and compatibility boundaries

projectPlayerV2/exportPortableV2 may include only encountered occasion labels/IDs and actual captured records. They must not emit content.occasions wholesale, future counts, unused actor declarations, NPC knows/believes/claims, snapshot receipts, hidden witnessed references, proof trees or future source titles. A derived source's parent IDs are safe to export only because acquisition has verified that every parent is already player-encountered. Never spread internal NPC/snapshot metadata into a portable seen record.

Commands retain current IDs, revisions and confirmation behavior. Replay derives the actual occasion sequence, snapshot and witnessing operations; it consults no clock, randomness or live AI. A duplicate crossing command returns the unchanged already accepted state; it cannot enter another occasion, repeat a snapshot or append another passage. Checkpoint validation compares full replay including hidden actor state; portable validation compares exact encountered-only projection and checksum as today. Both accepted checkpoint and portable bytes remain within 10 MiB and 10,000 commands, with no prose/history truncation.

The facade must produce exactly the old state/export bytes for occasion-absent v2 fixtures and pinned old commands. Do not insert undefined/default occasion properties, change old proof-witness ordering, alter old source provenance or create a new seed automatically. Legacy v1 files stay untouched. Expanded saves have another content hash; earlier ended saves stay ended under their installed pinned bundle.

The current LegacySeedV2 accepts v1 state only. It is not a v2-to-v2 continuation format. Explicit continuation/migration of an ended v2 run needs a separate reviewed seed/manifest design that preserves its old prefix and ending; this minimal occasion extension does not fabricate one. Starting a new expanded run remains available while old runs are retained. Future migration must set the occasion from its reviewed mapped scene/occurrences, not blindly from the new start.

## Bounds and required verification before installation

Keep current authored entity/array limits. Raise the aggregate flag limit only for opted-in content to at most 64 per declared occasion, with each flag assigned to exactly one namespace; old content keeps its global 64 limit. Three authored namespaces otherwise fail before runtime. No unexplained cap increase is needed for sources or actors at this size. Root owns the preview injector adaptation: its synthetic start scene must have an occasion and an explicit transition when needed, and the preview remains separately identified with separate saves.

Meaningful tests must demonstrate all ten L3 acceptance cases, including exact o0 export/reload after o1; distinct reacquired occurrences; rejection of old recording in current proof; accepted explicitly historical support; current recollection disclosure without old exhibit access; private refusal; actual departure snapshot with optional private knowledge present/absent; renewed interiors retaining anchor ignorance; exterior o1 knowledge persisting into o2; shared pre-anchor testimony failing independence; derived recollection ancestry failing false independence; refusal ending without o2; fresh irreversible second-crossing receipt and cancel; deterministic replay; malformed namespaces/crossings/ancestry rejection; source/target guard order; immutable eligibility dry-run; hidden witnessed/snapshot sentinels excluded from export; resource limits; and old v1/v2 byte-equivalent replay.

This proposal authorizes no source or canon change. Implement only after root's final contract and scope approval; narrative occurrence/provenance assignments and staged witness presence remain lead decisions.
