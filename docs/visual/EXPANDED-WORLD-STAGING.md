W-002 assets are now retained at visual/world/retained-bath-w002. Production public/world/bath-faceless.glb and the active builder were restored to the earlier first-night model after owner rejection of the bath foundation. Paths below describe the frozen W-002 build, not the installed world.

# W-002 expanded bath: geometry and renderer handoff

Retention status: the owner reopened the entire story/world on 2026-10-04, citing Hello Charlotte and rejecting the ordinary bath premise. Root stopped expanded-bath installation. W-002 is frozen technical work on the earlier prototype, preserved for recovery/reuse; it is not the newly selected creative direction or owner acceptance. No further bath development is underway in this task.

Original editable Blender production, 2026-10-04. The owner requires faceless block figures and an elevated third-person camera following Blaise, with Disco Elysium as the presentation reference. This scene uses original project geometry and materials. Blender 4.3.2 executes Python; no GUI operation or imported game asset is claimed. Root owns the Three.js renderer, navigation, scene selection and browser acceptance.

The accepted first-night script, `.blend` and GLB were compared byte-for-byte with Git revision `828db5c` before replacement, then copied to `visual/world/accepted/first-night/`. Its `MANIFEST.json` records all hashes. The archive is outside production public assets. W-002 is a spatial upgrade requiring fresh browser checks; prior first-night PASS results do not certify it.

## Build and inspected artifacts

Run from the repository root:

```sh
/usr/bin/blender -b --python tools/blender/build-bath.py
python3 visual/world/inspect-w002.py
```

The first command writes `visual/world/bath-faceless.blend`, `public/world/bath-faceless.glb`, `public/world/bath-spatial.json`, a build hash record, executed coarse clearance checks and an overview render. The second reads actual glTF buffers and verifies staged roots, absence of images/textures, one Miriam root, and unchanged Miriam geometry/materials/local transforms against the accepted GLB. Durable evidence is in `visual/world/W-002-BUILD.json`, `W-002-CLEARANCE.json`, `W-002-GLB-INSPECTION.json`, `W-002-BLENDER.log` and `expanded-overview.png`.

The render is an asset inspection with named walls/decks hidden to expose rooms. The saved `.blend` and GLB retain those walls and decks. It is not a runtime screenshot, a physics prototype, or hardware/performance acceptance.

## Coordinate contract

`bath-spatial.json` schemaVersion 2 is the machine-readable contract. Coordinates are game Y-up: +Z points toward the front street/laundry; -X points toward the service yard. Blender stores game `(x,y,z)` as `(x,-z,y)`. Units and positions are rough production proportions. They do not establish measured apparatus dimensions, chronology, a fracture count or a new clue.

`surfaces[]` gives bounded rectangles with `id`, `layer`, `height`, `minX/maxX/minZ/maxZ`. Layers are `ground`, `gallery`, `exterior`, `yard`. The gallery physically overlaps the workshop and cabinet floor in X/Z. Keep the player's current layer during walking; a global maximum-height lookup would wrongly lift him from the workshop onto its roof. Switch between ground/gallery through the stair connector or an actual authored travel action. The narrow street curb drops about 0.07 production units.

`groundSolids`, `gallerySolids`, `exteriorSolids`, `yardSolids` are conservative, inflated center obstacles. They include the pool, cabinet, cabinet pier, workshop walls/open door, moved worktable, sink, shelf, benches, bucket, standing concrete piers and yard bins. Rail boundaries are represented by inset walkable surface bounds. Staged chairs/parcel/bearers remain dynamic props; the renderer must add any needed obstruction when showing them. The two exterior door boundaries remain gated even while their mesh is opened. Walking cannot perform an unrepresented experiment or acquire evidence.

`stairs` gives `GalleryStairs`, 19 modeled steps, X range 5.55–7.05, bottom `(6.3,0,-2.55)`, top `(6.3,2.66,-8.65)`, slope extent Z -2.8 to -8.31, step rise 0.14 and run 0.29. Nineteen stairs comes from the manuscript; the chosen rise/run are production values. Railings prevent lateral entry: do not teleport from the ground into the middle of the staircase.

## Spaces and safe anchors

The original shell and pool stay in place. A north gallery at Y 2.66 and west catwalk now explain the pier supporting the cabinet's overhead structure. The workshop is enclosed beneath the northwest deck, with a real opening in its south wall. Its open door and table allow entry and private staging. The front opening leads to pavement, street and the laundry opposite. A separate west opening leads through a short service passage to an enclosed yard with two bins. The laundry cannot see into that yard.

| Narrative area | Spatial anchor | Position X, Y, Z | Layer |
| --- | --- | --- | --- |
| entrance / arrival | `arrival` | 0, 0, 10.5 | ground |
| front entrance inside | `frontInterior` | 0, 0, 12.4 | ground |
| street-front | `frontExterior` | 0, 0, 15.15 | exterior |
| street-opposite | `laundryWaiting` | 0, 0, 23 | exterior |
| concourse / gathering | `gathering` | 1.8, 0, 8 | ground |
| spectators-bench approach | `bench` | 5.6, 0, 3 | ground |
| shallow-water chairs | `waterChairs` | 5.45, 0, 6.8 | ground |
| workshop conversation | `workshop` | -6.25, 0, -10 | ground |
| workshop-doorway | `workshopDoorway` | -6.05, 0, -7.6 | ground |
| gallery conversation | `gallery` | 5.8, 2.66, -10.4 | gallery |
| cabinet approach | `cabinet` | -5.1, 0, -2 | ground |
| service-passage inside | `serviceInterior` | -8.9, 0, -5.95 | ground |
| service-yard | `yard` | -13.25, 0, -5.95 | yard |

Safe standing defaults are `adaWorkshop` (-8.5,0,-10.1), `simonGallery` (6.3,2.66,-11), `emmyWorkshop` (-7.25,0,-10.1), `ruthFront` (1.5,0,11.8). The table moved to (-7.4,-11.8), width 2.7, so it no longer blocks the workshop door. The recording table moved to (8.6,2.66,-12.1). `arrivalAdaApproach` (-3.5,0,8.4) stands beside the arrival bucket rather than in it. `miriamBench` intentionally overlaps the bench for a seated pose; it is not a standing/player waypoint. Thresholds and structural/prop anchors likewise are not ordinary navigable foot positions.

These are default anchors, not a declaration that every actor is present. The lead's scene staging manifest controls which bodies the player actually encounters and which nearby speakers are audible. Current/interior and exterior Miriam can occupy different places without any visual verdict about their identity.

## Cabinet and controlled evidence

`Cabinet` remains at (-6.5,0,-3.4). `CabinetDoor` is now a rigid hinge group, not a loose decorative board. Its world hinge is (-7.15,0,-2.81), left when facing the closed front; negative Three.js Y yaw swings its free edge outward toward +Z. Frame and inside mirror mount move together. The inside release ring/cable/latch and a separate shallow water tray are modeled; the pool is not the optical tray.

`CabinetGalleryPier` at (-6.25,0,-1.67) interrupts the later swing arc and supports the west catwalk. `PropPaddedTestChair` is staged at (-5.92,0,-2.32), yaw 0.55, before that pier. The producer checks the ordering with coarse planar proxies. Root should respect those stops when choosing an illustrative door pose. This check does not simulate cord tension, body forces, damage or optical reflection. The mirror mount is a stylized backing, not a reconstruction of individual surviving shards. No accident dent/chip or measured impact height is generated as visual proof. `public/art/release-binding.svg` and encountered prose remain the controlled factual reconstruction.

`PropBindingTest` is staged at the cabinet origin only during the actually encountered empty test. It crosses the door and wraps the cabinet; it must not appear as an intact binding at the ordinary post-accident arrival. No actor enters the apparatus because movement alone reaches it.

## Roots, visibility and camera

Actor roots are exactly `Blaise`, `Ada`, `Simon`, `Miriam`, `Emmy`, `Ruth`. All heads are closed beveled blocks without facial features or image textures. Existing limb child names stay usable for restrained posing. Emmy has an ochre clothing mass and bag; Ruth has muted green clothing and a canvas bag. These original forms do not introduce ages or facial canon.

There is exactly one Miriam base root. The GLB inspector compares its six children, vertex attributes, indices, materials and local transforms with the preserved first-night model. Clone that same hierarchy for encountered co-presence. Preserve the same geometry/materials; no transparency, evil palette, unique face or original/copy coding. Distinguish actual coat/held items/posture/location only when the prose has established them.

Emmy/Ruth and `stagedProps` roots carry glTF extras `encounterStaged:true`, `initialVisibility:false` and are parked at Y -24 in the editable library. The runtime must hide them before its first render, then stage only actual encountered items. Empty roots/metadata do not grant NPC knowledge or player sources. Prop names are `PropPaddedTestChair`, `PropSoundChair`, `PropLooseChair`, `PropWaterCup`, `PropBenchShoe`, `PropFootballBoot`, `PropExteriorBearer`, `PropInteriorBearer`, `PropWrappedGlass`, `PropBindingTest`. The exterior long bearer includes the witnessed burn/side mark and points toward the laundry at yaw zero. Keep it hidden until the actual preparation has been encountered.

`cutawayRoots` lists hideable outer walls, workshop walls, roofs/catwalk, yard walls and laundry facade. Windows are parented to their wall, so hiding a wall does not leave floating panes. Hide `WorkshopCeiling` for a workshop camera and `GalleryWestCatwalk` where it occludes the cabinet undercroft. Preserve layers while hiding decks. The saved camera is an overview reference; root retains the elevated oblique camera following Blaise and camera controls. Visibility/cutaways are presentation only.

`FrontDoor` and `ServiceDoor` have `authoredTraversalOnly` extras. Front gate is Z 14 with X opening -1.1 to 1.1; service gate is X -10 with Z opening -6.87 to -5.03. Both open outward with negative Y yaw. `WorkshopDoor` is already posed open at negative pi/2. Root controls an actual authored crossing: ordinary first service passage without a spoiler receipt, informed second passage with the engine's fresh confirmation. No geometry callback may invent that fictional action.

## Remaining verification

Executed producer clearance/reachability checks and actual GLB inspection are bounded asset evidence. Root must still verify the integrated layer transitions, camera cutaways, present-only actors/props, keyboard/proximity interactions, narrow screens and offline loading in the built browser. Coarse proxy clearance is not exact avatar collision or human usability certification. No browser PASS or expanded-game acceptance is claimed by W-002.
