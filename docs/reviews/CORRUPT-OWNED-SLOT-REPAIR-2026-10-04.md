# Confirmed corrupt-slot repair, 2026-10-04

Requested engineering configuration: GPT-6.1 Sol, xhigh. The actual backend identity is unavailable and is not independently verified. This report supersedes the specific open corrupt-owned-slot defect recorded in EVIDENCE-PLAYER-INTEGRATION.md; it does not supersede that report's other limits.

## Behavior and scope

The reproduced dead end is repaired through `repairAndTakeOwnership(content, state, expectedCommit, freshOwnerId)` on the shared CheckpointStore, inherited by EvidenceStore and GameStore. The API validates and replay-checks the supplied in-memory state and prepares its encountered-only portable export. One IndexedDB read/write transaction checks the observed commit, checks current, every backup and preEnding again, and refuses repair if any checkpoint is now verified. This also refuses a good checkpoint introduced without changing its commit. A stale commit or competing repair returns conflict.

The same transaction retains the exact raw slot in recovery, preserves all existing recovery and archive records, writes the validated run and portable copy, creates fresh run metadata, and changes the ownership receipt and storage commit. Recovery and completed-run archive inserts use unique fresh-run keys with `add`, so they cannot overwrite an existing record. A completed in-memory run receives a completed archive; no missing pre-ending checkpoint is invented. Fresh metadata uses origin `new` and parent `null`: an unverified predecessor supplies no trustworthy lineage.

Repair accepts a malformed ownership record only through this explicit path. A recoverable safe integer epoch advances beyond both that epoch and the observed commit; otherwise the observed commit supplies the progression floor. The new identity must differ from the damaged record's identity. The player generates a fresh crypto UUID for repair and updates its document identity only after successful commit. Every old receipt remains invalid, including a former document using the latest commit. Ordinary save and claim validation remain strict.

The player distinguishes **Repair saving with this run** from ordinary **Take over saving**. A corrupt load keeps the exact current in-memory run and disables ordinary retry; it no longer tries to claim the abandoned corrupt slot automatically. The repair modal names the content version, accepted action count and captured passage, and explains retained damage, retained archives, and control of saving. Its action binds the previewed state hash and observed storage commit. A changed in-memory run requires a fresh preview. The database independently checks the commit and checkpoint condition at confirmation time.

Cancel performs no writes. Failure keeps memory unchanged and exportable, requires renewed acknowledgement before unsaved play, and permits a new repair preview. A successful repair saves exactly the confirmed run without adopting or reconstructing another history. Ordinary takeover of a good checkpoint still loads the verified committed run, with its distinct confirmation. Load recovery now inspects all stored backups before declaring the slot unrecoverable; successful recovery still retains at most three verified backups.

The root-requested author-preview adjustment is included: the reading wrapper and initialization error wrapper render as `div` in preview and `main` in the ordinary player. The skip target and aria relationships remain intact.

Changed source/test paths are only src/persistence/checkpoint-store.ts, src/components/EvidencePlayer.tsx, tests/ownership.test.ts and tests/evidence-player-controller.test.ts. No engine, content, CSS, manifest, entrypoint or studio source was edited.

## Executed verification

`pnpm typecheck` passed.

`pnpm exec vitest run tests/ownership.test.ts tests/evidence-player-controller.test.ts tests/storage.test.ts tests/versioned-persistence.test.ts tests/run-metadata.test.ts` passed **58 tests in five files**: ownership 18, actual player controller 22, existing storage 7, existing versioned persistence 8 and existing run metadata 3. The repair adds 14 ownership cases and four actual-controller cases to their prior counts.

The tests reproduce the corrupt foreign/prior-owner slot and verify exact memory, original damage, pre-existing recovery and archive retention; valid current/backup/preEnding refusal; a valid fourth backup; malformed ownership; stale and concurrent repairs; invalid memory and reused identity rejection; completed-run retention; and quota aborts at recovery, archive and slot writes. Controller tests exercise the actual implementation's state-bound confirmation, competing repair conflict, acknowledgement, continued unsaved actions, retry refusal, new preview after failure, current document receipt rotation and former identity rejection.

Actual Chromium (`/usr/bin/chromium`, Playwright) passed **nine browser groups** against the current source component in a clearly labeled noncanonical esbuild fixture with real IndexedDB:

- Preview inside an outer main has one main landmark and the original skip target.
- A completely corrupt owned slot offers repair without automatic takeover or memory replacement.
- The modal names the exact current run; Cancel leaves all stored records unchanged.
- Explicitly acknowledged unsaved continuation leaves damaged storage unchanged.
- An injected quota failure at the final slot write aborts the already queued recovery insertion and preserves all bytes, ownership and active memory.
- Fresh confirmation saves the continued run exactly, rotates ownership and retains every prior recovery/archive record.
- A reloaded good checkpoint offers ordinary takeover and no repair action.
- The exercised repaired preview has zero axe violations.
- A competing repair committed between preview and confirmation causes a CAS conflict and does not overwrite either run.

The final browser run recorded no page errors. The first temporary harness run omitted Vite's BASE_URL definition required by the separately changed art module and failed before mounting. The harness definition was corrected, then all nine groups passed; that first failure is retained as harness-first-failure.json.

Durable evidence is under [evidence-player-repair](evidence-player-repair/): report.json, axe.json, encountered-run.json, storage-image.json, three screenshots, source harness, browser-check.mjs, the first harness failure, the exact compiled harness and source-and-artifact-hashes.json. storage-image.json is diagnostic raw storage from the noncanonical fixture, including its internal state; it is not a player export. encountered-run.json is the actual encountered-only download. The historical compiled harness can be viewed with `python3 -m http.server 4291 --bind 127.0.0.1 --directory docs/reviews/evidence-player-repair/harness`. browser-check.mjs records the exact exercised steps; its artifact output directory is the original temporary directory. Rebuild current source when using it for fresh verification.

## Frozen hashes and limits

| File | SHA-256 |
| --- | --- |
| src/persistence/checkpoint-store.ts | 0fc1adb12415cf90084e298827e34ccc9460750b22cdd6d30369ecbbaacd487e |
| src/components/EvidencePlayer.tsx | 74e3d6c4e21ecf95b9f26f84d81c33884e534f6388e3c21fe78596541991d934 |
| tests/ownership.test.ts | 600f96c95ee9926f4543f9d418df22b4d20153b33334b97e5e118c8263f13d5e |
| tests/evidence-player-controller.test.ts | 3ef41312455cbe266a49783d235ad4cb0c512639075fa21610de8c6597d40fc6 |

The frozen engine runtime remains 7084f4240416b1283bbaa9270797b0d4e0f373dad88e8b112f88f4add2979948; the player CSS remains 0016ef4fbaec7fce62a8c222b085c6e63936559edfbdf330608a2c79b899d77f.

Repair requires a safely observed commit. Invalid slot metadata first goes through the existing load quarantine path; exhausted safe-integer commit/epoch limits fail explicitly. This path intentionally refuses repair if a good checkpoint exists, including when its ownership metadata alone is damaged. It reconstructs no lost predecessor or pre-ending history. Recovery and archive retention can itself hit browser quota; abort preserves all data rather than deleting damage to force success. Raw recovery browsing/deletion, broad archive growth stress and other-browser testing remain outside this repair.

The browser harness used preview/development mode and noncanonical content. It is not a production offline check, canonical case acceptance, screen-reader assessment, enjoyment/duration measurement or human playtest. Root owns the broader production build and browser verification.
