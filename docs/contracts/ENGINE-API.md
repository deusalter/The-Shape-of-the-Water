# Engine API v1

The content format is defined by CONTENT.md. `version` is a positive integer. Scene and choice IDs use letters, digits, `_`, `.`, `:`, or `-`; choice IDs are globally unique. Repeated observation, interpretation or relationship IDs must have identical text. Every referenced flag must occur in an effect somewhere. Start requires no flags. Validation checks graph reachability, not the satisfiability of every possible flag combination; route tests cover authored progression.

From `src/engine/game.ts`:

- `validateContent(unknown): {ok:true,value:Content} | {ok:false,errors:string[]}` validates and freezes a copied document.
- `createGame(content): GameState` creates revision zero and captures the start passage.
- `availableChoices(content,state): Choice[]` returns eligible choices whose destination requirements are satisfied after their effects.
- `applyChoice(content,state,{id,choiceId,expectedRevision}): {ok:true,state,duplicate} | {ok:false,state,error:{code,message}}`. Commands require unique IDs. Duplicate IDs return the same state, even with an old expected revision. Other stale commands conflict explicitly. A choice marked ending renders its target and ends the run.
- `validateState(content,unknown)` returns the same validation shape and reconstructs the state by replay. It rejects changed passages, unearned facts, extra fields and mismatched content revisions.
- `currentPassage(state)` gives the captured passage, including the exact variant selected when entered.
- `serializePlayerExport(state)` exports only encountered state. No Content argument is accepted.

GameState contains contentId, contentVersion, revision, currentScene, ended, sorted flags, observations, interpretations, relationships, transcript and processedCommandIds. Encountered records carry id, text, sceneId and revision. Transcript alternates a captured passage with chosen-action events and subsequent captured passages. Every state and nested value is frozen. Revisit appends a new passage without rewriting earlier text. Interpretation records never replace observations.

The noncanonical cup fixture in `src/content/fixture.ts` exercises observation, different interpersonal approaches, a later reading, changed revisit text and completion. It is fallback content only. The app discovers `src/content/case.json` if available and validates it before playing.

Persistence, player interface, author interface, tests and offline details are documented below as implemented.
