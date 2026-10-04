# Q-002 browser evidence

The durable result is `../../RESPONSE.md`. Effective result: 15 passing browser groups and two authoring durability failures. `minimal-repros-report.json` verifies that both failures reproduce; its PASS does not mean the defects are fixed.

`source-hashes-before.json` pins input commit `69ec3ca3b22238612a5c806c992ed5e212ed2006`, runtime, assets, contracts and package inputs. `source-hashes-after.json` proves unchanged tracked runtime/assets and an exact QA copy; changes to AGENTS/request/board came from coordinator checkpoint `70a495a`. `build-hashes.json` pins both builds. `sources-inspected.json` distinguishes full reads from selective inspection. These are earlier 2D bytes, not a 3D or L3 test certificate.

## Reproduce

Run from this directory in a clone containing the pinned Git commit. Runtime source/build/dependencies are ignored and recreated inside `runtime/`. System Chromium is expected at `/usr/bin/chromium`.

```sh
python3 prepare-runtime.py
pnpm --dir runtime --ignore-workspace install --frozen-lockfile --ignore-scripts
pnpm --dir runtime --ignore-workspace build
python3 -m http.server 4313 --bind 127.0.0.1 --directory runtime/dist-player
```

In a second terminal, start the separate studio:

```sh
python3 -m http.server 4314 --bind 127.0.0.1 --directory runtime/dist-studio
```

Then run the independent scripts in order; E04 seeds an actual legacy-engine history and P04 uses the earlier P02 export. Each suite uses fresh browser contexts.

```sh
node author-adversarial.mjs
node player-adversarial.mjs
node extended-integration.mjs
node offline-update.mjs
node draft-boundaries.mjs
node minimal-repros.mjs
```

The author and draft-boundary scripts intentionally report FAIL/exit 1 until the defects are repaired. Use `QA_ONLY=A04 QA_SUFFIX=-new` to run one group into a separate report; artifact exports retain their base filenames, so use a separate checkout/directory to preserve this captured evidence when repeating a run. The executed commands and historical exits are in `commands.json`. Build/install logs and stdout logs remain unchanged.

`A04-input.json` is the smallest supplied import reproduction using the real case format: its content ID changes and the first scene title is empty. D01 is a normal structured source edit, not an imported hostile fixture. Both are preserved by `minimal-repros.mjs` with viewport screenshots.

## Trace restoration

`playwright-traces.zip` retains every decompressed entry from every original Playwright trace. Repeated built assets are stored once by SHA-256. `trace-index.json` maps original filenames and records original container hashes, entry hashes and metadata; container compression is repacked. No trace entries, screenshots or network response bodies were omitted.

```sh
python3 pack-traces.py restore author-context-3.zip
pnpm --dir runtime --ignore-workspace exec playwright show-trace ../author-context-3.zip
```

Restoration recreates a trace-viewer-compatible ZIP with identical entry bytes; its new ZIP container hash may differ. `pack-traces.py` without arguments packs local originals; do not run that in a clean clone before restoring traces, because originals are intentionally ignored.

Raw `*-db.json` files are diagnostic IndexedDB captures containing engine internals, not player portable exports. Encountered-run exports are separately named and tested. A05 uses actual worker code with only deterministic handler latency added; U01 serves a synthetic HTML-only update on local port 4315. These injections are described in their reports and fixture manifests. Initial harness failures remain in original reports/logs; corrected outcomes are in recheck reports.
