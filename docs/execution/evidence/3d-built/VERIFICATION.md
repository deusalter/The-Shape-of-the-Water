# Built faceless 3D verification

Executed in detached worktree /workspace/literary-3d-verification, isolated from active occasion/studio edits.

- Full pnpm verify at 2e8b3c9: 310 tests in 24 files, typecheck, content validation and both builds PASS.
- Presentation/build repairs at 3526cb4 and 828db5c: camera toolbar wraps under narrow CSS zoom; author preview receives the GLB; supported Three.js shadow type. Both builds PASS at 828db5c.
- Actual built 3D movement/proximity/action check at 828db5c PASS. Model and source hashes recorded in report.json.
- Seven built player/studio browser groups PASS at 828db5c. Includes actual offline GLB loading, no rejected portraits in build manifest, diagram, selected evidence, ending/branch, author preview GLB, draft/undo and scenario isolation. Complete report in ../browser-3d-integration/report.json.
- Earlier 5-second model expectation failed while the harness kept completed software-WebGL contexts alive. Isolated offline reload succeeded; final harness closes completed contexts and allows 20 seconds for model startup. That earlier failure is preserved, not misreported as a runtime repair.

Chromium software WebGL only; zero page errors or external requests. Axe zero violations with two incomplete items. No measured hardware performance, other browser, human accessibility, human playtime or complete-game acceptance. External Q-002 found two additional author durability defects; their separate Q-003 repair is not covered by this snapshot. New occasion engine and expanded prose remain active work outside this frozen verification tree.
