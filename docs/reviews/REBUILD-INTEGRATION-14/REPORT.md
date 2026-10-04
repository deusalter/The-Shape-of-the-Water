# Independent rebuild integration review 14

2026-10-04. No reproducible functional defect or integration blocker found in the reviewed final boundary. This is a bounded source review and actual-renderer check, not acceptance of the whole game.

Requested model/effort: GPT-6 Astra / xhigh. Configuration requested by the coordinator; backend identity was not independently attested. No children, commits, canon changes, runtime changes, or shared-test changes were made. Review files are confined to this directory.

## Revision inspected

The initial working-tree base was `7a05f7a60ddf46cb02646f8006d3be06f2a2715b`; the new files and integration edits were uncommitted. The story was already at the final `0d20a628…` pin. Initial renderer/profile reads were `5bc370db…` / `bc993a36…` while their revised cast joins were explicitly still being integrated; those incomplete joins are not final findings.

The coordinator then froze these final files, which were reread and checked:

| File | Final SHA-256 |
| --- | --- |
| `src/content/case-v4.json` | `0d20a628b21556e1ef143d9ce84773205e85987e46f059694a7c71caf5b8a25c` |
| `src/world/rebuild/profiles.ts` | `4d48f58ffed98368069436afbb5958ac88fac0095ca92b80c5c4aefe1975ebdf` |
| `src/world/rebuild/RebuildWorld.tsx` | `638012df72f023274419fdc0c9622d3b28071e3360a80494c2fd2f787619bd1b` |
| `src/components/EvidencePlayer.tsx` | `ae526c96711537c59e517a878f81b7ea6285ab4f5210f1b723c329c547f30101` |
| `public/world/rebuild/second-mouth-supper.glb` | `114ddc2339ab2d3293a7dfbdf31ccdbb92757cb961005a7723fc702ecb6762b4` |

`boundary-check.json` contains complete before/after pins for all 16 inspected boundary/asset inputs; they remained identical during execution. `model-manifest-check.json` confirms every file hash declared by the final visual asset manifest and its coverage of 39 scenes / 57 authored choices. The owner rebuild direction, architecture, AGENTS, relevant owner instructions and current handoff were read.

## Boundary conclusions

- Movement and camera operations change only renderer-local coordinates. The only story callback is `onChoose` after recomputing the current profile, currently offered choice, current distance and disabled state. `EvidencePlayer` supplies projected choices and disables world actions while loading, blocked, confirming or ended. Its controller and existing deterministic engine remain the authority for the command and revision.
- Both unknown scenes and unknown variants receive a text fallback. Transitioning out of staged geometry cleans up its animation loop, listeners and renderer. Late model completion checks the disposed flag before attaching assets.
- Final optional cast staging consumes only the already encountered `o0.cast-removed` source. The tick key includes its presence, so source-only state changes restage the actual model. Inspection no longer visually removes the cast before the explicit action. Lower scenes exclude the upstairs women/speaking piece; the dry departure includes the accompanying woman while Noor stays upstairs.
- The current loader validates v4 and retained v2 separately. The selected manifest agrees with the loader; `Release` uses a full document navigation for `?edition=first-night`. Existing save slots include exact content hashes. Migration options also require a manifest whose target matches the active hash, so the installed v1-to-v2 mapping does not authorize migration into v4. The offline generator declares both installed edition hashes, and the worker checks the requested edition against that list and verifies the cached file hashes. These are source conclusions; the coordinator owns fresh built offline/save-route verification.
- The v4 header, departure confirmation, closing note and protected-branch button describe a first-movement development boundary. They do not claim that the later country or complete game is delivered.

## Actual narrow verification

Command: `node docs/reviews/REBUILD-INTEGRATION-14/check-boundary.mjs`, using the existing Vite server at port 4175 and headless Chromium with software WebGL. Final result: **PASS**, five focused check groups, no page errors, stable source pins. The fixture renders the production component and actual GLB; supplied props and callback logs are controlled test inputs. It inspects actual Three.js scene objects, not only profile declarations or DOM labels.

1. Disabled, withdrawn and prior-scene E events dispatched immediately after prop changes cannot trigger a stale choice. A nearby offered action produces its exact ID.
2. The actual lower-scene cast moves to the dry ledge when the removal source appears, and returns to its original position when that source is withdrawn, without a scene/variant change. Upstairs actors remain hidden.
3. Dry departure has the accompanying woman and no downstairs Noor or orchard speaking piece.
4. Unknown scene/variant fallback followed by remount produces one callback.
5. Unmounting during a delayed GLB load, resolving the obsolete request and remounting leaves one canvas and one callback.

An initial harness attempt hit Playwright's `route.continue: Route is already handled!` because it removed its route handler before awaiting continuation. The review harness was corrected to await handler completion; this was a harness sequencing error, not a product finding. `boundary-output.txt` and `boundary-check.json` preserve the successful rerun; `lower-before.png` is a fixture screenshot, not integrated gameplay evidence.

## Limits and future scope

The coordinator's broader built routes, offline, responsive and axe checks were deliberately not duplicated. This review does not certify human literary reception, duration, hardware performance, all browsers or assistive technology. Existing engine internals were not rereviewed wholesale.

The current content has one occasion. The removal-source join is appropriate for this installed movement; later recurrences must supply the current captured scope rather than assume that a historically encountered source describes present geometry. Full-country geography and animated action choreography remain future production scope, not blockers for this bounded first movement.
