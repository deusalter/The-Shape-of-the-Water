# Transaction-local persistence optimization review

Result: no correctness blocker found in the reviewed patch to `src/persistence/checkpoint-store.ts`, SHA-256 `1537ac200a60987296db7f5c827323b83031b6a31cb4ad18b13bdc458acad28c`.

The patch preserves incoming-state full deterministic replay, stored-envelope checksum and replay validation, content identity, commit comparison, saving ownership, branch-source validation, archive creation, and exact protected-checkpoint retention. It reuses validated state results only within the same synchronous transaction callback. No trust result survives into another transaction. The removed fourth backup read concerns a checkpoint that would already be dropped after the three retained slots are filled. Corrupt candidates are still scanned until three valid retained states exist or the original three-candidate limit is exhausted.

## Behavioral comparison

`persistence-equivalence.json` records 18 independent cases against the HEAD implementation. For each case, the save result, entire raw saved slot, and archive contents were exactly JSON-equal. Cases include one/two corrupt backups, corrupt current, all-corrupt fallback, current/backup transcript tampering with recomputed checksums, valid/corrupt protected checkpoints, ending protection, import replacement, valid/invalid protected branching, missing/damaged run metadata and ownership acceptance/rejection. UUID generation was held constant only in the isolated diagnostic process so run metadata could be compared exactly. The fixtures are mechanical, not story edits.

The source diagnosis and differential harness are retained. To reproduce the comparison, write `git show 915243fe2b56c0d4ead1f3b275aac2d053f8bf4a:src/persistence/checkpoint-store.ts` to `/tmp/mercy-opt-review/checkpoint-store-baseline.ts`, copy `persistence-equivalence.ts` as `/tmp/mercy-opt-review/equivalence.ts`, and run `build-equivalence.mjs` then the generated `/tmp/mercy-opt-review/equivalence.mjs`. The absolute workspace imports are intentional for this captured execution environment.

## Measured effect

The same exact final Mercy invitation witness was replayed before and after. At revision 48, a mature save changed from eight full replay validations to four. The recorded transaction duration changed from 2,737 ms to 1,524 ms, approximately 44% lower. This is a bounded, one-sample transaction diagnostic using fake IndexedDB on the same machine, not a physical disk or hardware-device claim. Opening revision-4 save changed from 26.35 ms to 18.45 ms. Post-save refresh still performs full validation and is not claimed to be eliminated.

The complete selected story, checkpoint/export formats and engine sources were unchanged during measurement. Source pins and raw observations are in `hotpaths-baseline.json` and `hotpaths-optimized.json`. Root maintains separate browser measurements and full regression results.
