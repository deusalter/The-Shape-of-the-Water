# W-002 runtime prototype stopped after owner redirect

Status: preserved, uninstalled technical prototype. The owner reopened the entire story/world during this task and rejected the bath narrative and supporting names. This is not the next production target and is not approval of the 145-scene draft.

The worker had begun layered navigation and a projection of the lead writer's earlier staging map. The Three.js renderer had not been integrated when the redirect arrived. To avoid leaving a partially integrated world in production source, the worker preserved the new modules under `prototype/` and restored `src/world/navigation.ts` and `src/world/staging.ts` to their exact pre-task form. The root's occasion-prefix support remains. This worker did not edit `BathWorld.tsx`, content, engine, asset files, or selection.

The archived navigation separates ground, gallery, stairs, front exterior and service yard. The workshop remains at ground height beneath the gallery. Only top/bottom stair landings connect the two floors; no front/service doorway graph edge exists. Bounded motion substeps prevent crossing a whole obstacle in one delta. These ideas may be reused independently of this rejected setting.

Executed checks:

- `node docs/reviews/EXPANDED-WORLD-RUNTIME/probe.mjs`: ten bounded navigation checks passed. The probe covers workshop and bench routes, ascent and descent, independent overlapping-floor heights, blocked ordinary front/service crossings, exterior walking, stair side rail and movement tunnelling. An initial descent probe found a gap between the gallery surface and stair landing; the archived module now explicitly includes that landing, and the full probe passed afterward.
- `pnpm exec vitest run tests/world-navigation.test.ts tests/world-staging.test.ts`: five existing production-source checks passed after restoration.
- `pnpm typecheck`: passed after restoration. Archived files are outside the application's TypeScript include set; this does not certify the draft staging module.

The archived staging module and scene map are unfinished and unverified. No new actor poses, material cloning, prop hiding, cutaway rendering, browser interaction, or full 3D route was accepted. No new content was installed. The source map was derived from the lead's earlier candidate hash recorded inside `prototype/scene-staging.json`; it is retained as historical work only.

Rebuild the navigation probe from the preserved source with:

```sh
pnpm exec esbuild docs/reviews/EXPANDED-WORLD-RUNTIME/prototype/navigation.ts --bundle --platform=node --format=cjs --outfile=docs/reviews/EXPANDED-WORLD-RUNTIME/navigation-probe.cjs
node docs/reviews/EXPANDED-WORLD-RUNTIME/probe.mjs
```

`RESULT.json` records exact preserved source/data and executed bundle hashes. The root was notified that W-002's new GLB requires its own archived location and the original first-night GLB should be restored if retaining the old playable renderer. Asset files are the engineer's ownership, so this worker did not restore them.
