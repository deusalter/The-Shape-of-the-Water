# Visual design review 32

Status: PASS for final rendered visual design, resource lifecycle and independent package structure. No remaining visual or packaging blocker identified. Root-owned broader browser and performance checks are separate requirements.

Scope: read-only inspection of baseline and actual software-WebGL screenshots, renderer lifecycle receipt, lighting/resource ownership and packaging source. This is not a hardware performance test, native Mac test or human usability study.

## Visual assessment

The opening-v2 screenshot is a meaningful improvement over the optimized release baseline. The dark blue frame supports the cream reading panel; warmer paving and cooler facade shadows give the square depth, and added facade surrounds, lanterns and paving joints provide scale without faces or photorealism. The seven renderer views establish distinct warm morning, rose evening, amber/cool theatre and teal rain moods. The theatre stage has a clearer focal pool of warm light.

The first rain-market fixture was too dark: distant counters merged into near-black surroundings. The final fixture increases cool fill while retaining warm practical pools. Counters, central paths and Blaise now remain distinguishable. Final faceted trees, wooden bench slats, theatre chair legs and stage floorboards strengthen the coherent geometric style. No story or movement staging changes are requested.

## Readability issues identified

The new dark frame inherits pale foreground text. The `.saving-warning` alert and `.migration-preview` keep pale surfaces but initially lacked dark text overrides. The new `.save-warning` override did not address the actual `.saving-warning` class. Initial contrast ratios from stylesheet colors were 1.08:1 for that alert and 1.21:1 for the migration panel. The initial stylesheet-only review also raised edition navigation and default green links. Source inspection then confirmed that `Release.tsx` renders edition navigation outside the dark reader on the original pale body background, so that concern is not an actual defect. Root corrected the warning/migration surfaces with `.mercy-reader .warning,.mercy-reader .migration-preview{color:#312d32}`. Those two blockers are resolved in final source. The final full-page opening screenshot also confirms that edition navigation retains its pale surface and appropriate dark links. Main prose, frame text, captions and controls retain strong contrast, approximately 10.44:1, 12.26:1, 13.10:1 and 9.13:1 respectively. These color calculations are not a complete accessibility certification.

## Resource and integration observations

The 2048-square shadow map contains four times the prior 1024-square texels. Only the key directional light casts shadows; practical lights and the theatrical spot do not create additional shadow passes. Demand rendering and explicit shadow invalidation remain in place. Lighting changes occur at scene staging; static sky gradient, fog and point lights do not schedule perpetual animation. The fixture reports all 130 profiles rendered, no browser errors, zero idle renders/shadow updates and complete listener/observer cleanup.

The background sphere uses a small shader and no textures. Existing mesh disposal covers it; the directional shadow map has explicit disposal. Geometry batching now groups by material appearance properties rather than color alone, preserving emissive and shadow behavior. Generated atmosphere does not introduce texture downloads or image licensing requirements.

The generic packager checks built content, every asset digest and the service-worker build identity. The Mac packager extracts and verifies game assets from that exact generic ZIP. Independent structural inspection of the new archives passed. Both receipts and the inspected Mac game manifest use asset build `e4eb157aa0fc60a4`. All 25 game files in the Mac app are byte-identical to the generic ZIP; all 23 manifest assets match digests. Both Intel and Apple Silicon Mach-O slices target macOS 13. The arm64 slice preserves and verifies 2,293 ad-hoc SHA-256 signature pages. The app executable retains its executable mode. Native Finder/Gatekeeper/Safari remain unverified on this Linux machine. See `PACKAGE-CHECK.json` and the copied independent checker.

## Final evidence inspected

- Baseline `docs/reviews/MERCY-OPTIMIZATION-30/package/opening.png`.
- New full-page `docs/execution/evidence/visual-design/player/route-0-opening.png`.
- All seven final location screenshots under `docs/execution/evidence/visual-design/final-renderer/`.
- Final renderer receipt: all 130 authored profiles, all 12 lifecycle/control checks, no page errors, zero idle frames/shadows, complete unmount cleanup. Its four source pins match current files.
- Clean tracked-tree verification receipt: 530 tests across 41 files, typecheck, content validation and both builds passed; rejected untracked v6 excluded.
- Exact generic and universal-Mac archives named in `FINAL-PINS.json`.

Limitations: no live GPU hardware or native Mac execution. A software-WebGL screenshot review cannot establish hardware frame rate. Root is running the bounded before/after performance diagnostic and packaged player/migration browser checks separately; their final receipts should govern those claims. The 2048-square key shadow map increases active-render work and should not be described as free merely because idle rendering remains zero.
