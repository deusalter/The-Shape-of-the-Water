# First country locations — original source and bounded runtime

This production adds the first orchard visit, shed-room theatre visit and low-house visit. It preserves the installed v4 supper/underfloor world. It does not implement the later bodily-return audition or a complete country. Narrative, evidence, hearing and disclosure remain the authored player's responsibility.

The contract was checked against candidate `case-v5.json` SHA-256 `1ff7b7d98abdf20428bb80dcd0436377422505c3e6622bf6c1c9c1dde51ddb8f`: 24 new scenes containing 27 choices, four explicit new variants and 24 base aliases. The edition adds 29 choices overall; its two onward controls in the retained departure scenes use the passage buttons. All older scene IDs remain outside this renderer. Unknown scene or variant IDs return no profile and retain the text fallback. The later written-account revision changes no staging IDs or actions; root integration records its separate exact source pin.

## Editable original asset

- Generator: `tools/blender/build-country.py`.
- Editable source: `visual/country/first-country-locations.blend`.
- Runtime export: `public/world/country/first-country-locations.glb`.
- Exact hashes and structural counts: `visual/country/ASSET-MANIFEST.json`.
- CLI build record: `visual/country/build.log`.

The asset was authored and exported with Blender 4.3.2 CLI. No Blender GUI computer use, downloaded art, borrowed assets or bath geometry was used. Generic mesh and faceless figure construction follows the original project's established family proportions; all country rooms, surfaces, household props and object relationships are newly constructed here. Source meshes remain editable. Repeated decorative cake, flower, rain, seed and plank families are batched to reduce draw calls; interaction roots stay separate.

The final export is 3,108,896 bytes, with 416 nodes, 371 meshes, 36 materials and 84,896 indexed triangles across all three location groups and alternate actors. No image textures or external images are required. All people have closed, unmarked block heads; speaking wood uses an abstract slit. Male Blaise has the established coat, collar and proportions. Actors have distinct widths, heights, clothes and postures without portraits or faces. No material marks a person or testimony as true.

| Artifact | SHA-256 |
| --- | --- |
| Blender source | `f73dad2688c92ed1c9b937e6b5af35c981989e73abbbab0b9a8fd619565369a5` |
| GLB export | `7430d726d32d892fbfe1dc01555884c6bea96dded6b45986785bd99537cd01a7` |
| Generator | `6ada1accc72b08e8d34e7174482b92ea6e0edf7dce2e6c74f5c1be3ec831a05b` |

Rebuild from the project root with `blender -b --python tools/blender/build-country.py`. Add `-- --no-preview` to skip the three reference stills. `.blend` is saved in the orchard reference arrangement; the export includes all authored staging roots. These root groups deliberately share local coordinates: only the explicit current area is visible at runtime.

## Exact scene coverage

| Geometry group | Exact authored scenes |
| --- | --- |
| `OrchardWedding` | `o0.orchard-roof`, `o0.rain-strip`, `o0.cradle-account`, `o0.cradle-rubbing`, `o0.cradle-loan`, `o0.orchard-report`, `o0.orchard-house-departure` |
| `DryTheatre` | `o0.dry-rehearsal`, `o0.source-floor`, `o0.floor-tracing`, `o0.panel-arrangement`, `o0.pipe-discovery`, `o0.pipe-rehearsal`, `o0.whistle-invitation`, `o0.dry-house-lead`, `o0.dry-house-departure` |
| `LowHouse` | `o0.house-window`, `o0.emil-account`, `o0.account-written`, `o0.account-oral`, `o0.leaf-return`, `o0.emil-control`, `o0.house-door`, `o0.rene-arrival` |

Every entry also has the exact `${sceneId}.base` alias. Additional variant keys are:

- `o0.orchard-report:o0.orchard-report-with-cradle`: actual cradle beside Blaise, no rubbing representation.
- `o0.orchard-house-departure:o0.orchard-departure-with-frame`: borrowed frame accompanies Blaise.
- `o0.house-window:o0.house-window-with-cradle`: borrowed frame and wrapped cakes are beside the exterior step, clear of the door and local return.
- `o0.house-window:o0.house-window-with-lamp`: lamp is beneath the exterior overhang, clear of the door.

Mappings are explicit ID tables. Paragraphs, choice labels and hidden engine conditions do not instruct staging. `profileFor(sceneId, variantId?, encounteredSourceIds = [])` returns only an exact profile. `hasStaging(sceneId, variantId?)` is the integration query. `CountryWorld` accepts the same props as `RebuildWorld`: `sceneId`, optional `variantId`, optional `encounteredSourceIds`, offered `choices`, `disabled`, and `onChoose`. The source array is intentionally unused here; captured historical evidence alone cannot establish current inventory or audience.

## Current staging and audiences

The orchard has a large leaf canopy with a central hole, overflow bowl, forty flowered cakes, unfinished yellow dress, three tables, trough, ditch, living rain strip and altered cradle. Dora continues at the active root/speaking piece. Cradle conversation moves Blaise and Alma more than ten local units from her; she stays at the trough. Return for an account is the exact report passage. Her distant visibility does not make her an audience member. Root-focused stages use a camera angle that exposes the rooted speaking piece beyond the canopy. Rubbing and loan variants show distinct physical objects. Cakes accompany the report/departure stages.

The theatre contains dry rooms, painted fragment scenery, a rehearsal platform, tray/seeds, source-floor board, repair/groove/overrun, tracing, split pipe and Dora's picture. Only Blaise, table Dora and Basil are present. The same source-board model is painted on one side, upright in the rehearsal opening, then unpainted-side up on trestles for inspection. The arrangement passage places it on low blocks beside the door. Later pipe and departure views omit that board; they do not depict an unperformed reinstall or a completed remote comparison. Dora and Basil remain to place the painting at departure; Blaise carries the lamp. A wooden pipe is never presented as Blaise's restored bodily whistle.

The house starts with Blaise and seated Emil, the open floor leaf/mound, two chairs, dishes moved to the sill, a through-window band, tilting window/plant, two roofs, step and slow door. The loose flake appears after its described removal; the returned counterpart appears only after the return passage. Drawing and meal props are exposed in their encountered stages. René is absent until `o0.house-door`, then standing; `o0.rene-arrival` puts him in the formerly empty chair and moves the clean strips aside. Noor and both Doras are absent. No implicit remote hearing or personal confession is conveyed by this renderer.

## Controls and safety

WASD/arrows move Blaise within the bounded current area. Floor clicks request a collision-aware local route; clicking an eligible visible object also requests a walk. Movement never acquires a clue, chooses an action or crosses an authored location gate. E and the nearby action button re-check the latest scene, exact offered IDs, disabled state and current distance before invoking the callback. Choice labels are displayed verbatim from the visible player projection.

The third-person orthographic camera follows Blaise and has keyboard-accessible turn/reset buttons. `THREE.PCFShadowMap` preserves the verified pinned-Three shadow mode. Reduced motion stops limb oscillation and the minimal leaf-mound breathing; camera follow becomes immediate. Cleanup cancels animation frames, listeners, observer, renderer and model resources. Unsupported WebGL or missing models leave the passage/action text available. Desktop sticky placement and quiet-button contrast are explicitly scoped; narrow layouts span the available column.

The canvas exposes `data-loaded`, `data-scene`, `data-scene-id`, `data-variant-id`, `data-player-x`, `data-player-z`, `data-geometry-group` and `data-visible-models` for bounded browser verification. These are diagnostic projections, not gameplay APIs.

## Recorded evidence and limitations

`pnpm typecheck` passed. `pnpm exec vitest run tests/country-world-assets.test.ts` passed all five focused tests: exact compiled coverage; real self-contained GLB joins and bounded routes; orchard distance/loan differences; source-floor and house actor staging; offered-ID/proximity/no-traversal rules.

`node visual/country/verify-renderer.mjs` passed against the actual component and compiled offered choice IDs. `visual/country/renderer-check.json` pins the checked source hashes. It records loaded keyboard movement, far E rejection, floor-click route and near E callback, disabled and withdrawn/stale choice rejection, all 24 scenes/28 scene-variant projections, 390/320px widths, unknown fallback, and cleanup/remount without page errors. The fixture loads the global styles. Desktop runtime captures cover orchard, root report, source floor, initial house and seated René; mobile house captures cover both widths. The separate CLI reference stills cover each original location.

This fixture does not execute engine actions, certify character hearing, provide human playtesting, certify assistive-technology use or establish hardware performance. Parent integration must test the actual player, exported evidence invariance under movement, offline GLB loading and full authored routes. Canopy and roof covers are deliberate production cutaways; distant country fragments are scenery, not extra traversable locations. Some folded/pocketed portable props are omitted in later views instead of inferring their present placement from historical records. This is a bounded first-country visit implementation; later returns and changing possession/audience require new exact current staging contracts.
