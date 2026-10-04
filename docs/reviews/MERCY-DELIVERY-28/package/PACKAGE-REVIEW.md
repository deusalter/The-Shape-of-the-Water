# Final release package smoke receipt

**PASS** for the independent static archive check and the bounded extracted-package browser smoke on 2026-10-04.

- ZIP SHA256: `8b9a51cf64966f621d470613036c4dc3c78a414abebe72442e1c1d3a140c44e1`
- ZIP bytes: `1267120`
- Asset build: `f50d4556622bbc4d`
- Exact content hash: `09fc3576b1c788c95989c18b2fafa3fd53c8ad540549b904a995e54bf03f504b`

Independently extracted the delivered ZIP to a fresh temporary directory. All 12 entries have safe relative paths, unique names, no symlinks and passing ZIP CRCs. The archive contains exactly the seven manifest assets plus the manifest, service worker, launcher, start instructions and third-party notices. Every manifest asset matches its SHA256. The build/content identity matches `releases/PACKAGE.json`, and the service worker contains the exact substituted build version. The rejected `world/return/maintained-body-return.glb` asset and return asset directory are absent. React, React DOM, Three, Zod, Vite and Scheduler notices are present.

Ran the ZIP's provided `play.py` unchanged with Python 3. Its browser-opening request was directed to `/usr/bin/true` because the smoke uses a controlled headless Chromium context. The actual launcher served the extracted files at `http://127.0.0.1:4173/`. The 3D opening loaded. Real keyboard movement changed Blaise's position and left the complete encountered export unchanged. The first ordinary action, `a0.decline-purpose`, reached “The part he cannot say,” saved, and replayed against the exact current content. After reload and explicit saving takeover, the full export was identical to the saved pre-reload export. The screenshot shows the rendered 3D world, readable passage, next ordinary action, and loaded save status.

All observed runtime HTTP requests stayed on the local launcher. External HTTP requests were blocked and none were attempted. No page errors occurred. The local automatic `favicon.ico` request returned 404; it did not affect loading, movement or saving. The launcher terminated normally with exit code 0, and the temporary extraction was removed. A final rehash confirmed that the delivery ZIP still has the tested SHA256.

Evidence: `ARCHIVE-CHECK.json`, `BROWSER-SMOKE.json`, `opening.png`, `saved-reloaded.png`, and the four exact encountered-run JSON snapshots in this directory.

This is one opening action and a durable save/reload smoke, not whole-game verification. It uses headless Chromium with software WebGL and Python 3 already installed in this workspace. It does not establish Windows/macOS installation behavior, measured duration, hardware performance, accessibility certification or human playtest results. The coordinator's separate complete browser witnesses remain the evidence for whole-story behavior.
