# Occasion integration review 06: repair recheck

2026-10-04. **OI-06-1 and OI-06-2 are resolved in the reviewed repairs. No remaining blocker found in this bounded recheck.** Original report, failing reproductions, results and hashes remain unchanged.

- The exact one-field film provenance mutation now fails validation with `repeated sourceKey material must retain the same originating provenance`.
- The exact historical-reading arrival repro now selects `o1.remembered-variant` on the first crossing, both with and without the destination flag gate. Availability simulation leaves departure state unchanged; accepted crossings preserve earlier transcript and replay exactly.
- A reading dependent on a source supplied only by the destination still cannot unlock that destination's own entry. The rejected crossing returns the identical prior state and does not acquire destination evidence.
- For repeated source keys derived through an accepted deduction, matching actual film ancestry acquires normally and replays exactly; a selected ring/rinse route rejects the repeated-key acquisition. A preceding `setBelief` action in that rejected command does not leak into live actor state.
- A separate independent-proof probe accepts the film plus a recollection of the selected ring/rinse route, and rejects the same pair when the selected route used the film. Unused alternatives are not unioned into a false rejection.

Independent script: `recheck.ts`, executed through esbuild and Node; eight probe groups pass. Results: `recheck-results.json`. New source hashes and the preservation hashes of the earlier review artifacts: `recheck-source-hashes.json`. All recorded source files were stable during the probe.

Executed the four `tests/occasion-*.test.ts` suites plus `tests/notebook-occasion.test.ts`: **145/145 PASS**, including the six repair regressions and all 55 exact legacy trace byte pins. Full output is in `recheck-test-results.json`. No typecheck rerun was needed for this review-only change; root's reported typecheck is not counted as independently executed here.

Reviewed repaired runtime SHA-256: `72b633806f93320e2f987d67b6a000d0ba6c370f30fced9bc6006022a838e7f9`. Repaired occasion validator: `6e1479185c899933dc9236ba820f5f6895b94498fd49745b462cad742fab8bee`. Frozen first-night bundle remains `8b87c77df304f5bcccaa5f7ae6407997eaa9b0f1a40dca54b7bfde08e1b95751`.

Limits remain: no exhaustive state search, browser/IndexedDB verification or certification of expanded narrative/content. No production/shared-test/root-manifest edits, commits or child agents. This recheck clears the two reported engine defects only.
