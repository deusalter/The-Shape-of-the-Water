# Faceless 3D world, 2026-10-04

The owner rejected the painted face portraits and explicitly selected a 3D game with a third-person camera following Blaise, citing Disco Elysium's spatial/dialogue presentation. This supersedes the earlier illustrated-2D milestone. The new scene is original block geometry; it does not import reference-game assets or characters.

## Actual production

Blender 4.3.2 is installed at /usr/bin/blender. Root executed `blender -b --python tools/blender/build-bath.py`. The script constructs the bath, a cutaway shell, lowered pool basin/water, benches, worktable, black-cloth cabinet, door frames and four faceless figures. All geometry/materials are original project source. The editable file is `visual/world/bath-faceless.blend`; the production GLB is `public/world/bath-faceless.glb`. No graphical computer-use tool was available or used. Rebuild the assets with that exact script, not by editing an image.

Three.js 0.186.1 loads the actual GLB in `src/world/BathWorld.tsx`. React owns the accessible dialogue and save UI; the existing deterministic engine owns story/evidence state. Elevation and angled projection follow Blaise. Mouse floor clicks request bounded paths around the pool and furnishings; WASD/arrows move him; E performs the presently offered nearby authored action. Object clicks direct walking to an eligible interaction. Authored travel choices also remain ordinary accessible buttons. The same controller handles either action path, including confirmation and storage ownership. Movement alone grants no clues or NPC knowledge.

Characters have closed block heads, ordinary geometric clothes and distinct proportions. They have no face meshes, facial textures, eyes or mouths. The two Miriams will use the same base model when the expanded story is installed. Positions/poses are staged per actual encounter; the first scene seats Ada by the bucket and Miriam at the bench. The present renderer does not claim a complete locomotion/animation system or exact forensic apparatus dimensions.

The diagnostic cabinet drawing remains a separately authored accessible reconstruction. The 3D model supplies spatial presentation; visual omissions never become clues, and required findings remain grounded in explicit encounters. Further apparatus details, gallery elevation, outdoor rooms and recurrence-specific staging need review with the expanded content. The world is an implemented first-night environment, not the complete game.

## Verification

Three navigation tests pass, including routes around the pool and collision sliding. The actual Chromium 3D check at `tools/browser-3d-check.mjs` loads the GLB, moves Blaise with real keys, performs a proximity action through the real engine, checks travel staging and controlled evidence, and captures 1440/390/320 layouts. The latest report has no page errors, zero axe violations and two incomplete axe items. It uses software WebGL in the cloud; that is not a hardware/performance or human-accessibility certification. Exact source/model pins and screenshots are in docs/execution/evidence/3d-first-bath/. Built/offline verification passed at 828db5c; see docs/execution/evidence/3d-built/VERIFICATION.md for exact scope, repaired zoom issue and harness limits.

## Preserved rejected work

Original face portraits of Ada and Simon and the two later generated portraits of Miriam and Blaise are under `visual/rejected/facial-portraits/`. The earlier bath painting is under `visual/rejected/bath-shallow-end-2d.png`. They are excluded from public assets and the runtime build. Original generation outputs remain in the cloud generation folder. The new direction does not add the portraits' proposed ages or facial features to prose canon. The old visual production report remains historical evidence, not current art approval.
