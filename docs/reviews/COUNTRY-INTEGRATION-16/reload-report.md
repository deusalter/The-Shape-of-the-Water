# Built reload and offline ownership recovery

PASS on 2026-10-04 at `http://localhost:4190/`, using a fresh Chromium context and the frozen player build. No product defect was observed in this bounded check. The existing broad runner's screenshot of a read-only reload does not establish failed recovery: this check waits for initialization, explicitly claims saving, and proves subsequent actions reach the durable saved slot.

## Exact pins

| Input | SHA-256 or build identifier |
| --- | --- |
| Build manifest version | `c55a98a279612e95` |
| `dist-player/asset-manifest.json` | `9db51c2c44c122b2f6b4f2abf905ecd1493228320d8aa834e5106790567c6b9a` |
| `dist-player/assets/index-DqB-BfKt.js` | `21a9d4c1d942a5869183b2630f6bcc07948268586017224316d7486238d06f36` |
| `src/content/case-v5.json` | `d4b4cea49996aaa28d2e40a2a56577c833d2235b7c2fa9d0aa59ee27339c24e8` |
| Exact v5 runtime content hash | `cf2af7418826e5bcbd9797e6d2b1822e63f242ae3e4adf97cd3d5d64abc75622` |
| `src/components/EvidencePlayer.tsx` | `6beb0b5b11632f7d18a713e6447f25b9e0312009b5bdaa37d69746d10e274b9e` |

All recorded source and build hashes matched before and after execution. The complete pins, ownership epochs and commit receipts are in [reload-check.json](reload-check.json).

## Actual browser sequence

The check first waits until **Load saved progress** is enabled. On each document reload or return to the existing v5 run, **Take over saving** is then visibly offered and the next choice is disabled. Clicking that button and **Confirm action** hides the takeover control and read-only warning, enables **Retry saving** and the next choice, and reports: “Saving taken over. The latest committed progress is loaded.” No unsaved-play acknowledgement is used.

| Step | Observed durable result |
| --- | --- |
| Choose `o0.hear-noor`, reload online, explicitly claim | Revision 1 retained; ownership epoch rises from 1 to 2 with a new owner ID. |
| Choose `o0.keep-promise` | Revision 2 saved under the new owner. |
| Wait for offline readiness, disconnect browser networking, follow the actual edition links v5 → v4 → v2 → v5 | Both retained editions load their world assets offline, export their own exact version and create separate saved slots. Returning to v5 preserves the exact two-command run. Explicit claim grants epoch 3. |
| Choose `o0.watch-release` while offline | Revision 3 saved; another offline reload/claim retains it and grants epoch 4. |
| Choose `o0.hold-root-kept` while offline | Revision 4 saved. A final offline reload/claim retains the exact four-command run, grants epoch 5, and leaves “Check how both women are doing.” enabled. |

Every exported run was imported through the real exact-content engine. At every durable checkpoint, the actual IndexedDB slot's portable run equalled the UI download, and its saved state equalled the engine's replayed state. This checks new writes after ownership recovery, beyond merely loading or exporting the old state. No page errors occurred.

## Reproduction and limits

Run `node docs/reviews/COUNTRY-INTEGRATION-16/reload-check.mjs` from the repository root with the frozen player served at port 4190. Evidence includes [the executable check](reload-check.mjs), [the console result](reload-output.txt), [the final exported run](reload-final.json), and [the final owned/offline screenshot](reload-final-owned.png).

This check covers a short real v5 run, explicit ownership recovery, offline edition separation, and subsequent durable saves. It does not repeat completed or protected country routes, simulate simultaneous tab races, or certify a broader browser matrix. The earlier content/engine review remains preserved separately. The old broad helper's timing race was not independently reproduced; these passing results support correcting its readiness wait and ownership assertions. No production source, shared tests, or build files were changed.
