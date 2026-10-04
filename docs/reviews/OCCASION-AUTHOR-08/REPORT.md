# Bounded occasion author support

PASS for the bounded reusable author controls. Focused behavioral tests: 27/27 PASS. Typecheck: PASS. Frozen production studio build: PASS. Actual Chromium: 4/4 groups PASS, no page errors. No commit, deployment, content installation or story rewrite was made. Ownership returns to root. The owner redirected the story/world during this task; these controls apply to generic authored occasion content and are not an acceptance of the prior expanded fiction.

## Changes

ConditionEditor offers occasionIs and explicit current/historical/encountered scopes on flags, sources and deductions. Reference edits and recursive group edits preserve leaf scope. New occasion guards default to the containing entity's occasion; source/deduction defaults select that occasion's references. ProofEditor exposes each leaf's scope, retains nested scope metadata, and adds explicitly current leaves in opted-in projects. Missing scopes are displayed rather than repaired during rendering. Unknown occasion IDs remain visible for unfinished drafts. Explicit accessible select labels avoid names concatenating every option.

The studio exposes scene, source, question and reading occasion membership; choice enterOccasion; sourceKey and derivedFrom; actor occasion/persistent membership and requiresSnapshot. The selected scene's occasion is displayed in the author sidebar. New scene/source/question/reading/interior actor scaffolds use its occasion metadata and ID prefix. Ordinary legacy defaults add no occasion fields or proof scopes. The project section permits editing the finite occasion declarations as JSON and explains required namespace/scope diagnostics. Membership changes preserve existing stable IDs, references and actor initial arrays. A user may intentionally create an invalid draft, which remains saveable/exportable and cannot replace its last valid compiled preview.

Scenario injection is explicitly unavailable for occasion content, both through disabled UI controls and an early injectedPreview rejection. Its former synthetic opening cannot establish witnessed transitions, selected evidence ancestry or actual departing actor snapshots. Ordinary preview and importing a real encountered run remain available. The browser imported a replay containing inspect-old-film, prepare-chair, front-departure and first-crossing, reached o1, and exported the portable run identically. No actor state or canonical history was fabricated.

Q-003's project.ts and persistence/author-project.ts match their exact frozen repair hashes and were not edited. EvidenceStudio retains the project identity preview cache, nullable-baseline handling, committed-draft toolbar references, save/export behavior, validation isolation and worldContentId forwarding. Its existing author tests all passed after these edits.

## Evidence

- `pnpm exec vitest run tests/occasion-author-ui.test.ts tests/author-draft-durability.test.ts tests/author-project.test.ts tests/preview-scenario.test.ts --reporter=verbose`: exit 0, 27 PASS, final output in focused-tests.txt.
- `pnpm typecheck`: exit 0, final output in typecheck.txt.
- `/workspace/literary-detective/node_modules/.bin/vite build --mode studio --config ../vite.config.mjs`, from this directory's runtime/: exit 0; isolated build in dist/, output in build.txt. Standard Zod annotation and bundle-size warnings remain.
- Frozen preview on 127.0.0.1:4368; `node docs/reviews/OCCASION-AUTHOR-08/browser.mjs`: exit 0, four groups PASS, Chromium 151.0.7922.173, 01:59:42–01:59:50 UTC. Preview process stopped after checks.
- `git diff --check -- src/studio tests/occasion-author-ui.test.ts`: exit 0.

The seven new tests exercise actual React control handlers, recursive scope preservation, scope creation, nonmutating missing/unknown metadata rendering, legacy defaults, real IndexedDB unfinished-draft roundtrip, and injection rejection without bundle mutation. Three unchanged test files provide twenty additional Q-003/author/preview regressions. The browser groups cover legacy controls; scoped proof/guard/occasionIs/source metadata edit/save/export/reload; selected-occasion defaults and durable invalid actor membership with preserved actual initial arrays and undo; and normal preview plus replay import/export while injection is disabled. Exported projects, portable run and screenshots are retained here.

The first two browser attempts are retained in history/. They exposed harness issues (select label text included options; import completion was not awaited; a gate was assigned to the opening; newly created unlinked scaffolds were incorrectly expected to validate; the portable JSON string was encoded twice and its replacement confirmation omitted). Explicit select labels were improved in source; the harness now waits for adoption, uses a nonopening guard, expects unfinished scaffolds to remain diagnostic, and imports/confirms the actual portable JSON. No engine validation was weakened.

## Limits

Finite occasion declarations can be edited here, but there is no automatic conversion/migration of an old bundle, namespace renaming, arbitrary-history seeding or route synthesis. New entity scaffolds still need authored acquisition paths, choices, proof references and narrative text before compilation succeeds. Changing membership can expose namespace or initial-reference errors; diagnostics and last-valid preview remain the authority. Hints and advanced fields use Advanced full project JSON. Snapshot and witnessing actions use the existing actions JSON field, with the supported action names shown; no specialized action wizard or invented snapshot is provided.

These checks do not certify complete story reachability, the installed expanded bundle, world staging, offline behavior, exhaustive malformed inputs, quota failures, accessibility conformance or a human playtest. Only the isolated source snapshot, generic fixture behavior and bounded author paths are certified. Concurrent engine/player/world revisions copied into runtime/ are pinned evidence inputs, not certified sibling-owned changes. Requested allocation was Sol 6.1 High; that task configuration is not independent backend attestation.

## Exact source pins

| File | SHA-256 |
| --- | --- |
| `src/studio/EvidenceStudio.tsx` | `7c00806e276fd14401c4a9592d3a24a223098a4e9e96ed829592bc1dab9a14c2` |
| `src/studio/LogicEditors.tsx` | `4de949034848ae0f89552f11f01941d159e94de83271c7ec0608a834f9fd86e0` |
| `src/studio/occasion-author.ts` | `15c02662254ce0d28f79ff1c3c2c759ff566c486288139b124f197303bf58632` |
| `src/studio/preview-scenario.ts` | `5d8b7106c236ec258bb7322f8ea98dadea603d21dd1950b9ef423d72730ae5c0` |
| `src/studio/project.ts` | `51a4b2a1cf3047aa9c09e586faf6a87def4b8f24924795e3a0d82c34e4c5f4f8` |
| `src/persistence/author-project.ts` | `db167d23f76da5ef29b14765e184af4bef39640c38965954c5e78a853989ad33` |
| `tests/occasion-author-ui.test.ts` | `e01a52d954b78e428d9880009fdb0c3ef4aa471fe4f1ce18d0eab56d85345697` |

source-pins.json records the final workspace author pins. snapshot-source-pins.json records every copied source/dependency/world input used by the frozen browser build. All four edited author sources and the two preserved Q-003 repair sources match that snapshot. Source outside this ownership may change after the snapshot.
