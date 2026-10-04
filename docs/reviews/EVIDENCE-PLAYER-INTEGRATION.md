# EvidencePlayer integration, 2026-10-03

Engineering request: GPT-6.1 Sol, xhigh. Actual backend identity is not exposed and is not independently verified. This report covers the new v2 player component and its controller, not owner acceptance of the case or a human playtest.

## Scope and integration

New owned files are src/components/EvidencePlayer.tsx, src/components/evidence-player.css, tests/evidence-player-controller.test.ts and this report. The engine remains frozen after the separately authorized provenance-set repair: runtime SHA-256 is 7084f4240416b1283bbaa9270797b0d4e0f373dad88e8b112f88f4add2979948. That repair deduplicates ancestry inside each participating reference while retaining rejection of overlap across independent references. Its own regression and the independent suite passed. No existing App, store, notebook, entrypoint, content, manifest or package file was edited by this assignment.

The exported component is `EvidencePlayer({content:ContentV2,persistence?:EvidenceStore,context?:ReplayContextV2,preview?:boolean})`. The caller must remount it when the exact content hash or installed context changes. Content must come from validateContentV2. Default player persistence uses the existing player database; preview persistence uses literary-detective-studio-preview-v2. Supplied persistence remains caller-owned.

All fictional rendering uses projectPlayerV2, including the captured passage, available choices, notebook, hints/readings, and accumulated transcript. EncounterArt receives only the encountered scene ID. No proof trees, expected references, supported-candidate IDs or NPC internal knowledge/belief structures enter the DOM or encountered-run download. Rejected responses appear in an atomic polite live region without advancing or saving the fictional state. Accepted response text remains in the engine-captured action transcript.

The controller uses the same engine facade, EvidenceStore transactions, ReplacementIntent and shared RunControls modal used by the UI. Tests exercise this actual controller rather than a separate imitation. Every save merges the current ownership receipt at execution time. Saving is serialized, and the UI says Saved only after a successful commit. Initial checkpoint creation and ownership claim finish before ordinary actions become enabled.

Document ownership uses a fresh crypto UUID, cached only within the current module/document lifetime. Player and preview scopes are separate. It does not trust copied sessionStorage as a unique tab identity. A second document or a reload starts read-only when another tab or prior session owns the slot. Explicit takeover loads the latest verified checkpoint and claims ownership through the root-owned database protocol. The confirmation explains that unsaved in-memory actions will be replaced. A former owner retains an exportable in-memory run when its next save is rejected. No clock, expiry or competing ownership protocol was added. There is no BroadcastChannel hint, so a formerly owning tab learns about takeover on its next rejected save.

Storage failure requires explicit acknowledgement before further unsaved actions. Restart, import, archive branch, protected-ending branch and migration metadata survive a failed save and later unsaved actions until successful retry. A verified committed load abandons the superseded replacement intent. Branch metadata comes from the store's exact source checkpoint and is never guessed from the player's current revision.

Run import is bounded, replay-validated and previewed before confirmation. Migration preview accepts only a verified legacy encountered-run envelope plus an installed exact legacy bundle and matching reviewed manifest. It displays source/target versions, preserved encountered passage and mapped encountered counts before explicit confirmation. A missing context leaves the retained export available. Migration never silently invents a factual submission. The old legacy slot remains intact; new typed commands replay after its preserved prefix.

## Executed checks

`pnpm typecheck` passed.

`pnpm exec vitest run tests/evidence-player-controller.test.ts tests/versioned-persistence.test.ts tests/ownership.test.ts` passed 30 tests: 18 new actual-controller tests, 8 root-owned versioned-store tests and 4 root-owned ownership tests. Controller coverage includes initial ownership, rapid serialized commands, rejected and supported proofs, stale reveal receipts, duplicate commands without duplicate writes, protected/archive lineage, restart/import/branch/migration quota failures followed by unsaved continuation and retry, reload of committed progress, import corruption, unavailable storage, distinct-controller takeover, reload read-only behavior, failed takeover preservation, and reviewed/missing-context migration paths.

Actual Chromium used /usr/bin/chromium through @playwright/test. A temporary esbuild harness mounted the new component with clearly labeled noncanonical content and the real browser IndexedDB. It imported the source component directly and did not alter the production entrypoint. The harness used development/preview mode, so these checks do not establish production offline readiness.

The final workflow report passed 8 groups:

- Hidden-source sentinel absence from the initial DOM.
- Keyboard activation of the notebook and premature factual feedback.
- Explicit physical proof submission and preservation of both original and revisited passages.
- Bound ending confirmation and encountered-only downloaded JSON.
- Fresh-document reload read-only behavior followed by explicit takeover.
- Protected-ending branching while retaining a completed archive.
- Actual browser quota injection during restart, acknowledgement, continued unsaved action, retry, and exact original committed archive preservation.
- Zero axe violations in the exercised state, plus large text at 320px and CSS zoom 200% with document scrollWidth 320 and viewport innerWidth 320.

A separate real-browser migration harness passed 3 groups: preview without adoption, confirmed migration preserving the exact original legacy slot and old seen prose, and zero axe violations in the migrated state. Both final browser reports recorded no page errors. An earlier axe run flagged only the temporary harness's unlabeled standalone verification paragraph; the harness label was put in a named region and the final workflow reran successfully. An earlier layout locator timed out because the test used an overly exact implicit-label match; the final check selected the real combobox and passed. Neither was hidden as a product pass.

Durable browser evidence is preserved under docs/reviews/evidence-player/: report.json, migration-report.json, layout-report.json, final-screenshots.json, axe.json, encountered-run.json, player-320-zoom.png, player-320-notebook-zoom.png, player-1280.png and migration.png. Final screenshots also check the open notebook at 320px, large text and CSS zoom 200%, with scrollWidth and innerWidth both 320. source-and-artifact-hashes.json pins component, CSS, controller test, repaired engine and each artifact. The exact final fixture bundle is preserved under its harness/ directory with app.js, app.css and index.html.

To reproduce that historical noncanonical browser fixture locally, run `python3 -m http.server 4288 --bind 127.0.0.1 --directory docs/reviews/evidence-player/harness` and open http://127.0.0.1:4288. `/?migration` selects the reviewed legacy migration fixture. The preserved bundle is verification material, not a player release and not a replacement for rebuilding current source. The source controller tests remain reproducible with the pnpm command above.

## Remaining integration and limits

Root still owns the actual App/version dispatch, canonical v2 content, compatibility manifest approval, final production build, offline manifest and broader browser checks. The component supplies no protagonist/time-loop reset behavior beyond the frozen v2 engine. Final narrative and content notes remain the lead's responsibility. Browser checks cover Chromium only; no screen-reader/manual accessibility, enjoyment, measured duration or human playtest was performed. The temporary harness is not evidence that a complete authored case uses every new mechanic.

A concrete open storage recovery defect was reported to root: when every checkpoint is corrupt and the slot retains a foreign or prior-session ownership record, load quarantines the bad data and leaves current:null. The current claim/takeover API requires a valid current checkpoint, so it cannot claim that abandoned damaged slot to commit a fresh validated run. The UI supports export and explicitly acknowledged in-memory play; it does not invent a bypass. A safe atomic fresh-checkpoint takeover/repair API belongs to the shared store owner.

Bounded reproduction: save a valid v2 run and claim ownership as tab-a; corrupt current, all backups and preEnding while preserving the valid ownership receipt and commit; initialize another controller with ownerId tab-b. Its store load quarantines corruption and returns a corrupt slot, after which getOwnership still reports tab-a. establishCheckpoint refuses foreign ownership. Take over saving calls load followed by claimOwnership, but load has no verified current checkpoint and takeover is refused. The active fresh state remains exportable and acknowledged unsaved play works, but no fresh durable checkpoint can be committed through the present API. This finding is an open defect, not a passed recovery acceptance.

Archive growth, broad performance stress, canonical-route exploration and production update/offline policy remain outside this component verification. The supported byte limit is enforced by the frozen engine; the component does not truncate history to make saving succeed.
