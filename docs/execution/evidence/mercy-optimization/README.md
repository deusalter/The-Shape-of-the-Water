# Performance update 1.0.1

The owner requested optimization of the delivered game. This update changes loading, rendering and save work, preserving the exact selected literary content, retained editions, deterministic engine and save format. The earlier release is pinned in BASELINE.json and its continuity/package receipts are preserved under previous-release/.

## Measured results

COMPARISON.json compares three fresh-context runs of the previous published build and the optimized production build in the same Chromium/SwiftShader environment, at 1440×1000 / DPR 1. The service worker was blocked in this diagnostic to measure opening work separately from offline prefetch.

| Measurement | Before | After |
| --- | ---: | ---: |
| JavaScript loaded through opening and two actions | 1,737,169 bytes | 1,275,892 bytes |
| First readable passage, median | 306 ms | 248 ms |
| First world render, median | 947 ms | 789 ms |
| WebGL draw calls during 2.5 seconds initially idle, median | 1,692 | 0 |
| First opening transition and saved progress, median | 719 ms | 125 ms |
| Second opening transition and saved progress, median | 1,015 ms | 407 ms |

The renderer stops requesting frames at rest, pauses drawing when hidden or offscreen, wakes for interactions and stage changes, and refreshes shadows only when needed. It retains one physical environment when the next passage uses exactly the same visible geometry. Scene metadata updates even offscreen. Geometry, lighting quality, shadow resolution, pixel-ratio cap, story staging and navigation are unchanged. The renderer fixture separately verifies eventual rest after motion, all 130 profiles and disposal of frames/listeners/observers.

Selected-edition chunks and 3D modules load on demand. The prose can open before the renderer and remains usable if that download fails. Failed initial story downloads can retry by reloading the document. Projections are shared; the notebook mounts on first opening and retains drafts across closing, while the encountered transcript creates its paragraph DOM only when opened. The studio still loads the installed legacy migration context.

The save transaction reuses states already fully validated inside that transaction. The mature revision 48 diagnostic fell from 8 full replays to 4, and from 2,737 ms to 1,524 ms in a single fake-IndexedDB sample. All retained persisted checkpoints still undergo checksum and deterministic replay; no trusted result is cached across transactions. Independent comparison found exact save-result, raw-slot and archive equality in 18 cases, including recomputed-checksum forgery and corrupt recovery candidates. See [the persistence review](../../../reviews/MERCY-OPTIMIZATION-30/PERSISTENCE-REVIEW.md) for the exact diagnostic scope.

## Verification and limits

VERIFY.json records 530 tests in 41 files, typecheck, content validation and both production builds from a clean tracked export. SOURCE-PINS.json compares 202 runtime/build/test inputs with that export. The current canonical content SHA256 remains b7b1a30575d90493f3a4d34a24fcd647955f663b6044337625f9b1460e930475. The asset build is 7524dd0797af0673.

The four complete built-player witnesses passed all 198 commands with exact prose/evidence and reload, including offline closing action/save/reload, retained editions and three viewport widths with zero axe violations. The studio, seven independent fault/notebook/transcript checks and extracted-package offline smoke also passed. Reports are retained under player/, studio/ and ../../../reviews/MERCY-OPTIMIZATION-30/. Prior literary and finite-engine reviews apply to the unchanged story, not to performance claims. No human playtest or physical-device benchmark is implied.

Timing medians are diagnostic and vary with hardware. The post-movement 2.5 second sample still includes camera settling in software rendering; only initial idle is claimed as zero in this comparison. Heap snapshots do not establish a retained-memory reduction. Offline readiness still fetches every installed edition: reduced initial JavaScript does not mean reduced total offline download. The ZIP grows from 1,267,120 to 1,286,133 bytes because splitting changes compression and adds module boundaries. No public site was deployed.
