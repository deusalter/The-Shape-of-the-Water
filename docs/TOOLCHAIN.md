# Toolchain inspected 2026-10-03

Cloud Linux, Node `v24.19.0`, npm `11.9.0` initially, pnpm `11.19.0` active. Source-control checkpoints are local only; no remote is configured.

- `react`: `19.3.0`
- `react-dom`: `19.3.0`
- `zod`: `4.6.5`
- `@axe-core/playwright`: `4.13.0`
- `@playwright/test`: `1.63.0`
- `@types/node`: `26.6.4`
- `@types/react`: `19.3.0`
- `@types/react-dom`: `19.3.0`
- `@vitejs/plugin-react`: `5.2.0`
- `esbuild`: `0.28.2`
- `fake-indexeddb`: `6.2.5`
- `fast-check`: `4.10.2`
- `typescript`: `5.9.3`
- `vite`: `7.3.6`
- `vitest`: `3.2.7`

Dependencies use exact versions and pnpm-lock.yaml. The initial npm lock is retained in docs/archive/pre-pnpm-package-lock.json, not an active second lock. pnpm frozen installation passed after explicit project-scoped approval of the existing esbuild install script; no global settings or blanket script approval. Node/pnpm package engine compatibility and real typecheck/build/tests are used rather than a claim that newest automatically means compatible.

Official references are baseline docs/08-SOURCES.md; package versions were resolved from package metadata in this workspace. Chromium executable /usr/bin/chromium is available; Firefox/WebKit availability and execution are not claimed. Backend worker model identity remains unverified; docs/execution/CAPABILITIES.md distinguishes requested accepted controls from attested execution.
