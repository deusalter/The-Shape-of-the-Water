# Occasion integration review 06

2026-10-04. Two reproduced integration blockers in the uncommitted finite-occasion engine against HEAD `6562484e09e2f13d4f16462bf7c60e3d0ef1a94f`. Root confirmed the intended semantics below before repair. This report describes the frozen reviewed source, not subsequent fixes.

## OI-06-1: repeated material can gain false independent provenance

**Location:** `src/engine/evidence-occasion-validation.ts:81`; the resulting runtime origin is read at `src/engine/evidence-occasions.ts:40`.

The validator only enforces uniqueness of each sourceKey/occasion pair. It permits two occurrences with the same `sourceKey` to declare different fresh `provenanceId` values. Runtime then counts them as independent origins.

**Reproduction:** Clone `occasionFixture` and change only `o1.film.provenanceId` to `new-origin-from-occasion-only`, keeping both films' `sourceKey: incident-film`. Validation succeeds. Choose `inspect-old-film`, `prepare-chair`, `front-departure`, `first-crossing`, `inspect-current-film`, then submit `o1.independent-film` with candidate `supported` and selected refs `[o0.film, o1.film]`. The engine records “Two independent origins are selected.” with both films as witness refs; portable export/import accepts the result. The unchanged fixture rejects the same submission as `unsupported`.

**Narrow repair:** Validate the provenance consistency of repeated material keys. At minimum, nonderived occurrences sharing a sourceKey must share their originating provenanceId. Derived reports must continue to use actual encountered parent ancestry; do not replace selected deduction ancestry with a union of possible routes. A new claim on the same physical object can use a distinct source definition/key. Do not merge independently perceived accounts merely because they concern one event.

## OI-06-2: crossing evaluates new-occasion closure after arrival guards and variants

**Locations:** `src/engine/evidence-runtime.ts:90` and `:158` run departure closure, transition, then destination guards without current-occasion closure. `:68` chooses the destination variant before `:72` eventually computes closure.

**Reproduction:** Add an `o1.on-arrival` reading whose guard is `{op:'hasSource', id:'o0.film', scope:'historical'}`, relatedRefs `[o0.film]`, and effect `o1.remembered-on-arrival`. Add an `o1.arrival` variant requiring that effect. Inspect the old film and take the first crossing. The captured arrival is `o1.arrival.base`, although the new reading and flag are earned at that same revision from evidence already available before destination acquisition. An immediate same-scene revisit selects the remembered variant. If `o1.arrival.requires` instead includes that flag, the validated bundle deadlocks: no crossing choice is offered and the crossing command rejects `unavailable-choice`, despite the already-encountered film.

**Narrow repair:** In both eligibility simulation and actual execution, set the target occasion, run closure for already-supported readings in that occasion, then evaluate destination guards/variants. Acquire destination sources only upon entry and retain the post-acquisition closure. Preserve the cloned-state rollback boundary. Limit this ordering change to opted-in transitions to retain occasion-absent byte identity.

## Evidence and limits

- `probe.ts` contains the exact reproductions and a rollback/privacy control. `probe-results.json` records commands and results. The control confirms that a simulated snapshot followed by unavailable destination acquisition neither changes live state nor exposes blocked prose.
- Executed `pnpm exec vitest run tests/occasion-runtime.test.ts tests/occasion-validation.test.ts tests/occasion-legacy.test.ts --reporter=json --outputFile=docs/reviews/OCCASION-INTEGRATION-06/bounded-test-results.json`: **136/136 PASS**, including all 55 legacy trace byte pins and the frozen first-night content hash assertion.
- Executed the probe through esbuild and Node; all assertions reproduced the reported defects and passed the controls. `source-hashes.json` records all engine evidence files, occasion tests, contract and frozen first-night bundle, unchanged during the probe. `probe.mjs` is the bundled reproduction against the reviewed implementation; its hash collection reads the workspace at execution time, so the saved manifest, not a later rerun's manifest, identifies this review.
- No other blocker found in the bounded inspection of actor snapshots, explicit recollection ancestry, current/historical proof scopes, replay authority and atomicity. This is not exhaustive state exploration, browser/IndexedDB verification, or certification of `case-expanded.json`, which was still being authored and was excluded. No production, narrative, shared-test or root-manifest edits were made. No commits or child agents were used. Requested Astra Extra High configuration is not independent backend attestation.
