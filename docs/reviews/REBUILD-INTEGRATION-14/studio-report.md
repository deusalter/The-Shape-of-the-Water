# Bounded built-studio review

2026-10-04. **PASS. No reproducible defect found in the requested workflow.** Actual built UI at `http://localhost:4191/studio.html`, headless Chromium with software WebGL. No app, canon, shared-test, or production asset changes were made. This follow-up wrote only `studio-*` review artifacts.

The reviewer inspected `src/studio-main.tsx`, `src/studio/EvidenceStudio.tsx`, the author-project store/project helpers and preview-scenario helper before executing `node docs/reviews/REBUILD-INTEGRATION-14/studio-check.mjs`. The old seven-group regression was not rerun. Requested GPT-6 Astra/xhigh configuration remains unverified as backend identity.

## Executed result

1. The default built studio selected `o0.supper`, “The difficult note.” Its actual downloaded compiled content exactly equaled installed version 4, including all 39 scenes and the complete JSON structure.
2. The first opening paragraph received one explicitly noncanonical test suffix through its real editor control. After worker validation, **Save author project**, document reload and **Load author project** restored the exact edit. Downloaded author content differed from installed content only in that paragraph. Reload initially showed the pristine installed opening until the explicit draft load.
3. **Preview last valid content** showed the edited paragraph and loaded the actual rebuild GLB at `o0.supper`. The encountered-run export validated against the edited bundle and was rejected against pristine installed v4.
4. Arbitrary noncanonical scenario injection is intentionally unavailable for occasion content. The built v4 preview displayed that explanation and disabled creation. This is the implemented scope boundary, not a failed scenario workflow.
5. `studio.html?edition=first-night` separately selected the exact retained v2 content and loaded its bath GLB. Creating a real noncanonical scenario there produced a `preview.*` identity and entered the retained opening. Its export was rejected against both installed editions.
6. The browser created only `literary-detective-author-projects-v2` and `literary-detective-studio-preview-v2`, with no release-player database. Returning to the default studio URL again showed pristine installed v4. There were no page errors or external requests.

Source and build hashes stayed unchanged before/after, including both production case files. `studio-check.json` and `studio-output.txt` contain all 19 source/build pins and the five grouped outcomes. Actual exported drafts/runs and two screenshots are retained beside them.

## Exact primary pins

| Artifact | SHA-256 |
| --- | --- |
| `src/content/case-v4.json` | `0d20a628b21556e1ef143d9ce84773205e85987e46f059694a7c71caf5b8a25c` |
| `src/studio-main.tsx` | `9f3092c47a0e180214a3971d4cd819252ef26be3ad4a69fdbfc2a8c598b6e63b` |
| `dist-studio/studio.html` | `8b59752c4a505a9e095cd91da8c89d9e69e29e08591c649a8862aab68ebf95db` |
| `dist-studio/assets/studio-BufJ3txu.js` | `3c9e9d7420d79136e38b27e35e66578b027afe09eec11a262daf4abaf3042ee0` |
| `dist-studio/assets/validation-worker-D_3bKwGY.js` | `3156e3e871a7299ed40957ff8ea10f3600e0065948ca7b9f1a61c5b7b3539c8b` |
| `dist-studio/world/rebuild/second-mouth-supper.glb` | `114ddc2339ab2d3293a7dfbdf31ccdbb92757cb961005a7723fc702ecb6762b4` |

## Harness correction and limits

The initial attempt used Playwright's exact `getByLabel('Paragraph 1')`; its nested-label text matcher included the textarea's default text and found no element. Browser accessibility inspection showed the correct textbox name “Paragraph 1.” Changing the harness to the exact textbox role/name resolved it. That initial failed attempt is preserved in `studio-initial-harness.json`; it was not a product defect.

This check covers one valid paragraph edit and explicit draft load, not every editor operation, invalid-draft recovery, worker failure, or concurrent author session. Author drafts are keyed by content ID; this report does not claim simultaneous per-edition author-draft isolation. Player save editions remain the coordinator's independently checked boundary. No occasion seed injection, full-game acceptance, human usability/accessibility certification, duration claim, hardware performance claim, or offline studio support is asserted.
