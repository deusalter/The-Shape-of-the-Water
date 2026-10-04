# Evidence and knowledge v2: integration contract

Root-authorized Wave 1 contract, 2026-10-03. This is an additive runtime; existing schema-absent v1 content, engine functions, hashes, states and replay remain unchanged. The baseline reproduction gate is open: independent verification reproduced 91 tests and 13 Chromium checks. The implementation is isolated under src/engine; engine readiness is not a claim of production integration or expanded canon.

## Version boundary and API

A runtime document opts in with schemaVersion:2. Its content version remains a positive authored integer. V2 exposes validateContentV2, createGameV2, applyCommandV2, availableChoicesV2, availableQuestionsV2, availableHintsV2, projectPlayerV2, confirmationForV2, validateStateV2, exportPortableV2 and importPortableV2 from src/engine/evidence-v2.ts. Validation returns the existing {ok:true,value}|{ok:false,errors} shape. Commands return {ok:true,state,duplicate,feedback?}|{ok:false,state,error:{code,message}}. A rejection changes no fictional state.

V2 leaves src/engine/game.ts and the legacy schema untouched. Root's controller/storage/compiler will select the runtime by explicit schema version. Unknown versions are rejected. Engine/save version 1 is retained for v1. V2 uses engineVersion:2, schemaVersion:2 and portable saveVersion:2. No implicit cross-hash load or rewrite is permitted.

Storage-facing signatures are `validateStateV2(content:ContentV2,input:unknown,context?:ReplayContextV2):Validation<GameStateV2>`, `importPortableV2(content,input,context?):Validation<GameStateV2>` and `exportPortableV2(state:GameStateV2):string`. Both validators reconstruct the state through replay; the internal validator additionally compares every internal field. `createGameV2(content,seed:LegacySeedV2|null=null,context?)` accepts an explicit migration seed only with the installed compatibility context. The facade also exports `currentPassageV2`, `availableInterpretationsV2`, `evaluateConditionV2` and encountered-only `seenProjectionV2`. Controllers must pass validated frozen content and state to transition/projection/export functions.

## Runtime document

Keep id, title, version, start, scenes and the familiar paragraphs, choices, flag requires/unless/effects, observation/interpretation/relationship records and ending/irreversible fields. Add required arrays sources, characters, beliefIds, questions, interpretationRules and hints. Each v2 scene/choice/variant can use a when condition; scenes/variants can list sourceIds actually delivered with that passage. A choice can have actions in addition to its legacy flag effects. Source acquisition is first-occurrence immutable.

A source is {id,title,text,kind,provenanceId,speakerId?,claimIds?}. kind is observation, document or statement. Statement sources name their speaker and declared belief/claim tags. A source's provenance identifies the originating account; a transcript and its originating oral account need not count as independent sources. Literal text is copied into encountered records and never replaced by a later reading. Declared record IDs are distinct from question IDs.

A character is {id,name,initial:{knows,believes,claims}}. knows contains source/question reference IDs, believes contains declared beliefIds, and claims contains statement source IDs attributable to that speaker. These structures are independent: a statement need not match a belief, knowledge of a reported statement does not make the statement true, and author events do not automatically enter either NPC or player knowledge.

Underlying fixed events and hidden history belong to a separate author project maintained by the lead, with source/event mappings and chronology. They are compiled out of the playable runtime document and player assets. They do not belong in GameState, public projections or portable exports. No global isTrue flag is attached to notebook items.

Conditions are bounded declarative objects: always; all/any with args; not with arg; hasSource/id; hasDeduction/id; flag/id; npcKnows/characterId/refId; npcBelieves/characterId/beliefId; interpretationAvailable/id. Depth is at most 8, with at most 64 nodes. No scripts, arithmetic, dynamic paths, eval, clock or random primitives exist. Feedback and ordinary hints additionally declare mentions reference IDs; each mentioned reference must already be encountered before that response can be emitted.

Actions are acquireSource/sourceId, disclose/characterId/refId, and setBelief/characterId/beliefId/value. Disclose requires the player's encountered source or accepted deduction. Reading a private source does not update an uninformed NPC; a real disclose action does. NPC knowledge can guard future passages and choices. Belief changes are explicit authored effects, not engine inference or correctness scores.

## Explicit factual submission

A question is {id,text,when?,candidates,supportedCandidateId,proof,allowedCorroborators,feedback,effects?,actions?,target?}. It is factual only. A candidate is {id,text,when?,contradictedBy?}. A proof is a nonempty tree: {op:'ref',refId} or {op:'all'|'any',args:[...]}. References point to sources or other accepted question IDs. Trees preserve nested AND/OR semantics. Validation limits expansion to at most 256 candidate complete witness sets before duplicate elimination; excessive complexity is a diagnostic, not a search pass.

An `all` node may add `independent:true`. The references participating in that AND must have disjoint originating provenance IDs. A statement and its transcription with the same provenance do not satisfy independence. An accepted deduction inherits the originating provenance of its recorded matching witness, recursively; reusing its underlying source cannot manufacture a new independent origin. Repeated references within an independent AND also fail. `independent:true` on an OR node is invalid. Validation diagnoses proof trees with no possible route through distinct declared source origins; runtime checks the actual ancestry of accepted deductions.

A submission is {type:'submitDeduction',id,expectedRevision,questionId,candidateId,selectedRefs}. Only the explicit selectedRefs are evaluated. Possessing other material somewhere in the notebook does not count. A complete proof witness succeeds only if every extra selected reference is a declared allowedCorroborator. Selecting all notebook items cannot bypass this rule. Witness selection is deterministic by canonical sorted IDs. Duplicate selected IDs are malformed. Unknown/unencountered references reject generically without enumerating expected or missing evidence.

Feedback codes distinguish unknown-reference/unavailable-question, unsupported, premature, contradictory and irrelevant selections. Candidate contradictions apply only to references actually selected and known. Incomplete support is premature; irrelevant additions to an otherwise complete route are irrelevant. An unsupported candidate does not reveal the supported candidate. Authored feedback is {code,text,when?,mentions?}; only a matching guard with all mentions known can appear, otherwise a neutral generic response is used. Feedback prose remains the lead's responsibility; static checks cannot prove prose contains no unstated hint.

A supported submission records the selected references, matching witness, candidate text and acquisition revision, then applies authored effects/actions. It does not settle a moral or metaphysical judgment. Rejections do not advance revision or world state; root's controller can retain rejected-response text in a separate UX history rather than fictional command history.

## Interpretation closure and hints

An interpretation rule is {id,title,text,when,relatedRefs,effects?}. Its condition must be positive and monotonic: no not or npcBelieves predicates. It adds an available reading, never an accepted deduction, source or moral judgment. Closure processes stable IDs in sorted order until no new reading/monotonic flag is added; each rule fires at most once, making termination finite. Related references must be encountered. Chained interpretationAvailable dependencies are permitted; unseeded cycles remain unavailable and are diagnosed where determinable.

The player explicitly uses {type:'reviewInterpretation',id,expectedRevision,interpretationId} to encounter the reading's text. Automatically eligible IDs are internal availability metadata; unseen reading text is absent from exports. Player-selected legacy interpretation records remain separate from factual observations.

A hint is {id,label,questionId,when,mentions,text,reveals,sourceIds?}. Availability reveals only its safe label and whether it is an explicit reveal. A nonrevealing hint mentions only known references and cannot acquire hidden sources. A revealing hint requires a state/payload-bound acknowledgement receipt; it can deliver declared sources, but never auto-submit a deduction. requestHint has id, expectedRevision and hintId. Hint text is captured exactly in accepted transcript/action history.

## State, replay and portable privacy

V2 state is immutable and hash-pinned, with contentId/contentVersion/contentHash, schemaVersion:2, engineVersion:2, revision/currentScene/ended, flags, encountered sources, observations, selected interpretations, interpersonal records, accepted deductions, eligible interpretation IDs, received hints, internal NPC knowledge/beliefs/claims, accepted command history, transcript and processed command IDs. Each accepted command is one atomic logical step. Duplicate command IDs return the identical state before stale checks. Other expectedRevision mismatches reject. Ending/irreversible actions and revealing hints require receipts tied to canonical state SHA-256 plus the full typed action payload. Changing selectedRefs, hint, target or revision invalidates the receipt.

The player projection exposes current captured passage, eligible action labels, known sources, accepted deductions, encountered readings/hints/relationships and immutable seen transcript. It omits author events, proof trees, supportedCandidateId, unmet references, hidden source titles/text, undisclosed NPC initial states and unseen variants. Availability APIs return projections, never raw author definitions.

Portable v2 envelope:

```json
{
  "saveVersion": 2,
  "schemaVersion": 2,
  "engineVersion": 2,
  "kind": "encountered-run",
  "content": {"id": "case-id", "version": 2, "hash": "canonical-sha256"},
  "commands": [],
  "seen": {"transcript": [], "sources": [], "deductions": [], "interpretations": [], "relationships": [], "hints": []},
  "seenChecksum": "canonical-sha256",
  "migrationSeed": null
}
```

No hidden NPC state is serialized. importPortableV2 replays the accepted typed commands against the installed exact bundle and verifies all seen snapshots/checksums before returning reconstructed internal state. Wrong content hashes, extra fields, changed delivered prose and forged receipts reject. Exports use compact JSON. The maximum is 10 MiB (10 × 1024 × 1024 UTF-8 bytes) and 10,000 total accepted commands, including the legacy prefix. A shared budget guard checks both serialized internal checkpoint state and the exact compact portable envelope. A command that would exceed either budget rejects with resource-limit and retains the prior state. Initial or migrated states that already exceed the budget throw a clear bounded error; author previews and migration controllers must catch it. No text, history or source is truncated. Internal IndexedDB checkpoints may retain validated internal state, but controller export must use this portable projection rather than raw JSON.stringify(state).

A v1-to-v2 migration remains explicit and reviewed. The portable migrationSeed retains the validated encountered-only legacy state plus an approved manifest ID and receipt hashes; the old bundle and manifest are supplied by the installed replay context, never by embedding unseen old content in the export. Root owns concrete compatibility manifests and storage transactions. The engine seed adapter must validate the legacy state with the legacy runtime, pin fromHash/toHash/manifest hash, preserve old seen text and receipts, map only declared encountered sources/flags/scenes, and derive NPC disclosures only from named actual legacy choices. It cannot invent previously selected proof references or a factual submission from old progression flags. Old receipts validate only within the legacy prefix; new typed commands require fresh v2 receipts. Missing context or undeclared compatibility is a refusal, not a reset.

The exact integration types are:

```ts
type ReplayContextV2 = {
  legacyBundles: Record<string, ContentV1>; // keyed by exact fromHash
  manifests: Record<string, MigrationManifestV2>; // keyed by manifest ID
};
type MigrationManifestV2 = {
  id: string; fromHash: string; toHash: string;
  sceneMap: Record<string, string>;
  flagMap: Record<string, string>;
  sourceMap: Record<string, string>;
  disclosures: {choiceId: string; characterId: string; refId: string}[];
};
type LegacySeedV2 = {
  manifestId: string; manifestHash: string;
  legacyState: GameStateV1; legacyStateHash: string;
};
```

Receipts use `stateHash` from the unchanged hash module. Both sides of scene/source/flag mappings must name declared IDs. Only own mapping keys count. Omitted source/flag mappings preserve their literal historical records in the legacy transcript but do not fabricate a new reference or flag. Distinct old observations cannot merge into one new source ID. A disclosure derives only from an actual named old choice and a mapped source that the player really encountered. Legacy endings remain ended; migration never silently starts a new run. Root controls safe branch/archive transactions separately from fictional engine state.

## Noncanonical schema example for the lead

```json
{
  "schemaVersion": 2,
  "id": "cup-example",
  "title": "Noncanonical evidence example",
  "version": 2,
  "start": "bench",
  "beliefIds": ["cup-was-drunk-from"],
  "characters": [{"id":"worker","name":"Worker","initial":{"knows":[],"believes":["cup-was-drunk-from"],"claims":[]}}],
  "sources": [
    {"id":"ring","title":"The dry ring","text":"The cup stood beside a dry ring.","kind":"observation","provenanceId":"bench-inspection"},
    {"id":"rinse","title":"The rinse test","text":"Rinse water leaves the same ring.","kind":"observation","provenanceId":"sink-test"},
    {"id":"film","title":"Recorded rinse","text":"A recording shows the cup being rinsed.","kind":"document","provenanceId":"camera-recording"}
  ],
  "questions": [{
    "id":"ring-account","text":"What supports an account of the ring?",
    "candidates":[{"id":"rinsing","text":"Rinsing can explain the ring."},{"id":"drinking","text":"Only drinking can explain the ring.","contradictedBy":["rinse","film"]}],
    "supportedCandidateId":"rinsing",
    "proof":{"op":"any","args":[{"op":"all","args":[{"op":"ref","refId":"ring"},{"op":"ref","refId":"rinse"}]},{"op":"ref","refId":"film"}]},
    "allowedCorroborators":[],"feedback":[],"effects":["account-supported"]
  }],
  "interpretationRules":[{"id":"later-ring","title":"Reconsider the ring","text":"The ring need not come from drinking.","when":{"op":"hasSource","id":"rinse"},"relatedRefs":["ring","rinse"]}],
  "hints":[],
  "scenes":[{"id":"bench","title":"The bench","paragraphs":["A cup stands beside a ring."],"sourceIds":["ring"],"choices":[{"id":"test-rinse","label":"Test the rinse water and show the result to the worker.","target":"bench","actions":[{"type":"acquireSource","sourceId":"rinse"},{"type":"disclose","characterId":"worker","refId":"rinse"}]}]}]
}
```

A player's conclusion command is `{"type":"submitDeduction","id":"command.3","expectedRevision":3,"questionId":"ring-account","candidateId":"rinsing","selectedRefs":["ring","rinse"]}`. Doctrine and interpersonal decisions continue as ordinary choices.

## Wave 1 verification and limits

Own Wave 1 tests: `pnpm exec vitest run tests/evidence-engine.test.ts tests/evidence-migration.test.ts tests/evidence-budget.test.ts` passed 44 tests. They cover both proof routes, selected-reference negatives and supersets, direct/transitive provenance independence, contradictory feedback, guarded prose, private heard-state versus NPC disclosure, finite reading closure, hints/receipts, immutable revisit text, replay/idempotence, export leak sentinels, reviewed legacy seeds, undeclared/inherited mapping keys, hostile/deep inputs and an actual UTF-8 byte-budget boundary with export/reimport. `pnpm typecheck` passes. The legacy engine's 9 existing tests also passed in the affected run. These are automated checks, not human playtests.

Structural graph and optimistic grounding diagnostics are author checks, not complete state exploration. Feedback and hint prose requires editorial review; mentions/guards cannot prove a sentence contains no implicit spoiler. Fixed author events/history compilation, controller/storage/studio integration, compatibility manifest editorial approval, protagonist/time-loop rules, full authored use and complete bounded exploration are owned by later coordinated work. This wave supplies no automatic moral/metaphysical scoring, free-form inference, runtime AI, clock, randomness or network dependency.
