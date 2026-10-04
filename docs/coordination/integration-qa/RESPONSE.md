# Q-002: independent integration QA

**15 browser groups PASS; 2 authoring durability groups FAIL.** Both failures are reproduced through the built studio's normal controls. No player durability/privacy blocker was found in the exercised routes. This is a bounded integration report, not complete-game acceptance.

Tested source: `69ec3ca3b22238612a5c806c992ed5e212ed2006`. Team branch includes coordinator checkpoint `70a495a8b6e7a9ec9ed64c281c302b14e0d0ae60`. That checkpoint changes instructions, not tested runtime bytes. All tracked `src/` and `public/` bytes remained unchanged and the QA runtime copy matches the input exactly. Case raw SHA-256: `8b87c77df304f5bcccaa5f7ae6407997eaa9b0f1a40dca54b7bfde08e1b95751`; canonical content identity: `8b4e0336af32273c756c3442281ee992e166ed774575e3e483442cd3260d651d`.

The new owner direction is acknowledged: **the tested application is the earlier 2D build, not the requested 3D game with faceless figures.** Painted portraits are superseded. No 3D navigation, rendering or interaction acceptance is claimed. The L3 recurrence/occasion runtime also does not exist in this input and is not certified.

## Authoring durability blockers

**Q2-01 / A04: an imported invalid project with a different project ID cannot be saved.** Start the studio, acknowledge spoilers, import `work/q002/A04-input.json`, wait for invalid-title diagnostics, and choose **Save author project**. Import succeeds and **Export author project** still works, but saving reports: “The saved last-valid preview failed validation or belongs to another project.” The studio keeps the old project's last-valid content while the persistence envelope requires the new project's ID. Reproduced in the initial run, recheck, final exit-code check, and minimal reproduction. See `screenshots/A04-viewport.png` and the A04 reports.

**Q2-02 / D01: a normal structured edit can make the draft unsaveable and unexportable.** In a fresh studio, select **sources**, clear the first **Provenance origin ID**, and leave the field. Validation correctly marks the draft invalid. **Save author project** fails and advises downloading the draft; **Export author project** then fails with the same `content.sources.0.provenanceId` schema error and produces no download. Reload and **Load author project** reports no saved draft; the original provenance returns. Exact observations are in `D01-observations.json`, the raw current project in `D01-unsaveable-project.json`, and the screenshot in `screenshots/D01-viewport.png`. The advanced JSON editor remains a manual rescue path; the advertised save/export path does not preserve this unfinished edit. Existing committed content is not corrupted.

These block blanket author invalid-draft durability acceptance. Proposed repair directions are in `work/q002/PROPOSED-REPAIR.md`; no shared source or tests were edited and no proposed fix is claimed verified.

## Effective browser results

| ID | Result | Actual coverage |
| --- | --- | --- |
| A01 | PASS | Pending title blur directly into toolbar; paragraph/title undo and redo; pending export/save; reload recovery. |
| A02 | PASS | Start-scene rename updates references; referenced deletion refuses; undo/redo retain exact content. |
| A03 | PASS | Same-project blank title and negative version save/load exactly; previous valid preview remains distinct. |
| A04 | FAIL | Invalid imported project with a new identity cannot save. |
| A05 | PASS | Actual worker cancellation, replacement of pending work, worker-fetch failure and fresh-edit recovery. Deterministic latency injection is identified explicitly. |
| A06 | PASS | Ordinary preview survives injection, restoration and remount; preview DB stays separate; annotations and fixed events excluded from compiled content. |
| P01 | PASS | Real private encounter; possessed-but-unselected evidence and irrelevant private extras reject without save/export changes; accepted finding remains private until actual sharing. |
| P02 | PASS | Two live tabs with BroadcastChannel unavailable; saving tab advances during takeover preview; latest committed history loads; former writer's save rejects without overwrite. |
| P03 | PASS | Canonical completed ending; protected branch cancellation; quota rollback; unsaved alternate ending; retry preserves parent lineage and original archive. |
| P04 | PASS | Tampered portable import rejects unchanged; valid import cancellation preserves bytes; confirmation archives exact previous run. |
| P05 | PASS | Canonical owned-slot corruption preserves current memory; repair cancellation and slot-write quota preserve quarantined data; explicit fresh repair rotates ownership and saves exact history. |
| E01 | PASS | UI-authored nested independent AND inside OR, undo/redo, file export/import, compiled export, and actual preview submissions. Incomplete pair rejects, full pair accepts. |
| E02 | PASS | Actual studio at 320 CSS px: document width 320; keyboard edit/Undo; axe zero violations and zero incomplete items. |
| E03 | PASS | Canonical empty test: four decoded illustrated assets; CSS zoom 400% with large text; offline reload/play/save; missing cached image withdraws readiness. Axe zero violations, **one incomplete item**. |
| E04 | PASS | Legacy authored history played with real v1 engine, seeded in IndexedDB, then migrated through installed UI/mapping. Cancel/quota preserve old slot; retry preserves legacy transcript and creates no deduction. |
| U01 | PASS | Synthetic HTML-only same-story build update waits while old client plays; closing old clients permits new worker activation without changing save history. |

P01–P05 and E03 use actual installed first-night routes. E04 uses an exact engine-played **legacy authored route** seeded into storage to exercise migration. E01 is an explicitly **noncanonical edited proof**, A06 includes a labeled injected scenario, and U01 is a **synthetic update fixture**. None substitutes for an authored L3 route.

## Evidence, commands and limits

Cloud Linux, Node `v24.19.0`, pnpm `11.19.0`, system Chromium `151.0.7922.173`, locked Playwright/axe/esbuild dependencies. `pnpm build` passed, including TypeScript build and both Vite builds. New independent scripts are `author-adversarial.mjs`, `player-adversarial.mjs`, `extended-integration.mjs`, `offline-update.mjs`, `draft-boundaries.mjs` and `minimal-repros.mjs`. Commands, outputs, input/build/artifact hashes, JSON exports, raw diagnostic storage, screenshots, reports and complete trace contents are in `work/q002/`. See its README for reproduction and trace restoration.

Initial startup dependency-path failure, A05's faulty worker-delay injection, E01's exact-label locator, and D01's advanced-editor locator are **harness errors**, preserved separately. A05/E01 passed after correction; D01 then demonstrated the product failure. Minimal-repro PASS means the recorded defect was confirmed, not repaired. Final failing-driver checks exit 1; earlier drivers retained report FAIL while returning exit 0, so historical reports are authoritative. No page errors or external requests were recorded in completed suites.

The player axe incomplete item is `aria-prohibited-attr`, targeting `.encounter-cast` and `.choices`. CSS zoom is an approximation, not a native browser zoom or screen-reader assessment. Firefox, WebKit, real assistive technology, broad performance/quota stress, exhaustive reachability, all proof/ending combinations, revealing-hint UI (the installed case has only a nonrevealing hint), a newer 3D build and L3 runtime remain **INCONCLUSIVE / untested**. Existing pure-engine passes were read, not counted as this team's execution. Narrative context was inspected selectively; no complete literary reread, human duration, enjoyment or owner approval is claimed.

Fetched coordinator follow-ups at checkpoints; snapshots are in `coordinator-checkpoints.json`. QA permit remained 0. No children were spawned. Actual exposed configuration: Codex identified as based on GPT-6; exact backend variant and reasoning effort are unavailable. Requested Sol 6.1 / Extra High was not independently attested and no model/effort control was changed. Commit author/committer is repository-local `deusalter <212029343+deusalter@users.noreply.github.com>`; no coauthor trailers.
