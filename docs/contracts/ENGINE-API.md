# Engine API v1, implemented checkpoint

The shared content format is defined by CONTENT.md. src/engine/schema.ts supplies strict Zod shape validation; validate.ts adds graph/flag/record semantics. version is a positive integer. Scene and choice IDs use letters, digits, underscore, period, colon or hyphen; choice IDs are globally unique. Repeated observation, interpretation or relationship IDs must have identical text. Every referenced flag must occur in an effect somewhere. Start requires no flags. Validation checks graph reachability, not satisfiability of every flag combination; authored route tests cover selected progression paths.

## Pure engine

Exports from src/engine/game.ts:

- validateContent(unknown): {ok:true,value:Content} | {ok:false,errors:string[]} validates and freezes a copied document.
- createGame(content): GameState creates revision zero and captures the start passage.
- availableChoices(content,state): Choice[] returns eligible choices whose destination requirements are satisfied after their effects. It rejects a mismatched content hash.
- applyChoice(content,state,{id,choiceId,expectedRevision,confirmation?}): {ok:true,state,duplicate} | {ok:false,state,error:{code,message}}. Commands require unique IDs. Duplicate IDs return the same state, even with an old expected revision. Other stale commands conflict explicitly. An ending renders its target and ends the run.
- confirmationFor(state,command) creates a receipt binding the canonical state SHA-256, action payload SHA-256 and explicit acknowledgement. ending:true or irreversible:true requires a matching receipt. The player controller obtains acknowledgement in a modal before submitting; the receipt is a correctness check, not security/authentication. Replay preserves and verifies it.
- validateState(content,unknown) reconstructs state by deterministic replay. It rejects changed passages, unearned facts, extra fields, unsupported history and mismatched exact content hashes.
- currentPassage(state) gives the captured passage, including the exact variant selected when entered.
- serializePlayerExport(state) exports only encountered state with schemaVersion, engineVersion, kind and stateChecksum. No Content argument is accepted.
- contentHash(content) and stateHash(state) return canonical SHA-256 values. Object keys sort; meaningful array order stays intact. Hashes are checksums, not signatures. ENGINE_VERSION is 1.

GameState contains contentId, contentVersion, contentHash, revision, currentScene, ended, sorted flags, observations, interpretations, relationships, transcript and processedCommandIds. Encountered records carry id, text, sceneId and revision. Transcript alternates captured passages with chosen-action events and subsequent captured passages. Each irreversible choice event also stores its confirmation receipt. Every engine state and nested value is frozen. Revisit appends a new passage without rewriting earlier text. Interpretation records never replace observations.

Engine input content must come from validateContent. Engine state must come from createGame/applyChoice/validateState, not arbitrary object injection. The engine performs no browser, storage, network, clock or randomness calls. Its SHA-256 implementation is synchronous and independently compared with Node crypto in tests.

Supported limits: 10 MB imported document/run, 10,000 accepted commands per run, 2,000 scenes, 200 choices per scene, 8,000 total scenes/choices, 64 distinct state flags, 100 variants per scene, 200 paragraphs per passage and 50,000 characters per text field. These limits are a conservative subset of the baseline specification. No executable DSL, markup HTML rendering, external assets or live AI is supported.

## Persistence

src/persistence/store.ts exports GameStore, validateEnvelope and slotKey.

new GameStore(factory = globalThis.indexedDB, name = 'literary-detective-v1') uses database version 2, with slots, recovery and archives stores. Slot identity is content ID + version + exact canonical content hash. Changed text never automatically loads an older hash.

- load(content) returns {kind:'empty',commit:0}, {kind:'loaded'|'recovered',commit,state}, {kind:'corrupt',commit,message}, {kind:'incompatible',commit:0,message,retained} or {kind:'error',code,message}. Incompatible retained runs can be exported without migration. A damaged newest save is quarantined locally and replaced by the newest verified backup, incrementing the storage commit. If all backups fail, the damaged data is retained and the controller keeps its in-memory state.
- save(content,state,expectedCommit,{archiveCurrent?:boolean}={}) returns {ok:true,commit} or {ok:false,code,message}. Validation precedes the transaction. One IndexedDB readwrite transaction compares expectedCommit, preserves earlier checkpoints and atomically commits the new state. Stale writes, storage denial, transaction abort and quota failure leave the prior committed save intact. The caller retains the candidate in memory. An engine revision differs from this external storage commit.
- listArchives(content) returns verified {id,revision,ended}[]; loadArchive(content,id) returns a verified state or undefined. Successful restart/import/branch replacement archives the prior committed state. Successful ending saves archive the completed run. Loading an archive creates a new active branch without deleting its archived source.
- close() closes the connection, primarily for tests.

An envelope has exactly saveVersion:1, schemaVersion:1, engineVersion:1, contentHash, stateChecksum and state. Each slot retains up to three last-known-good ordinary backups plus a protected pre-ending checkpoint. Prior checkpoints are pruned only in a successful atomic commit. Corrupt quarantine data and completed/replaced archives are not automatically pruned.

The player uses a serialized save queue and labels Saved only after transaction completion. Storage failure leaves the active run exportable, shows a persistent warning and requires explicit acknowledgement before further unsaved choices. It does not silently merge stale tabs. The current checkpoint does not implement second-tab read-only ownership/BroadcastChannel takeover; optimistic transaction locking supplies correctness on writes.

## Player and studio boundaries

src/main.tsx is the ordinary player entry. It includes scene reading, keyboard buttons, notebook toggle, text size, transcript, local-save feedback, validated run import preview/confirmation, export, archives, help and credits. Ending/interpersonal confirmations name only the chosen action. The player does not import the studio editor or author research.

src/studio-main.tsx is the separate studio entry. It has a spoiler acknowledgement, structured scene/paragraph/choice forms, dependency table, diagnostics, guarded deletion, semantic undo/redo, optional advanced JSON editor and same-engine preview. Form changes commit on blur. Invalid drafts retain the last valid preview. Studio drafts use literary-detective-studio-drafts-v1; preview runs use literary-detective-studio-preview-v1, separate from player data. Drafts/downloads use the same real Content contract. Changes to the editor do not rewrite source files automatically.

The noncanonical cup fixture in src/content/fixture.ts exercises observation, interpersonal alternatives, a later reading, changed revisit text and completion. It is fallback content only. src/content/load.ts discovers and validates case.json. Authored case route tests cover the test/recording alternatives and progression after interpersonal failures.

## Offline

The build poststep node tools/engine-offline-manifest.mjs dist-player writes a versioned manifest with per-file SHA-256, the canonical case contentHash and a hash-injected worker. Install and readiness verify all local shell/bundle bytes. The worker caches only same-origin files and handles module request Vary headers in offline lookups. CHECK_READY carries the active game contentHash and rejects a mismatched cached case. Readiness also requires a controlling worker. The worker does not force an update over an active old tab or delete older caches; updates activate after prior tabs close. The studio has no offline worker. Offline behavior requires production-browser tests; passing engine tests alone is insufficient.

## Explicit remaining baseline gaps

This is the bounded flag/choice runtime, not the full revision-3 production architecture. It does not implement evidence-selection deduction submissions/proof supersets, belief/statement DSL, automatic interpretation closure, stable paragraph/block IDs, migration manifests, full run-header/command-batch stores, second-tab read-only takeover, notes/preferences persistence, broad author project annotations/assets/graph tooling, a user-chosen update/reload workflow, or browser eviction recovery beyond exported files. Archive/cache growth currently needs user browser-data management. Performance stress budgets and the complete multi-browser/manual accessibility acceptance matrix are not yet satisfied. Fictional interpretations are player choices, not graded doctrines.

## Engineer-executed checkpoint checks

2026-10-03: pnpm exec vitest run tests/engine.test.ts tests/storage.test.ts tests/case.test.ts tests/offline.test.ts passed 23 tests in 4 files. pnpm typecheck passed. Both player and studio builds passed. Root's production Chromium suite passed the final runtime source: keyboard investigation and reload, stale-tab preservation, completion/export/archive, offline reload and play, corrupt-cache readiness rejection, structured studio editing/undo/preview, four responsive sizes and CSS 200% enlarged-text checks. Player and studio automated axe scans reported zero violations. See docs/execution/evidence/browser/report.json for exact scope, incomplete scans and untested environments. Root also disabled studio public-directory copying so the studio artifact excludes the player worker. Independent verification tests are recorded separately by their owner. No simulated or automated checks constitute human playtesting.
