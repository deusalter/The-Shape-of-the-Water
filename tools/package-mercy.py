#!/usr/bin/env python3
"""Package the already-built, verified static player with a local-only launcher."""
from pathlib import Path
import hashlib
import json
import zipfile

root = Path(__file__).resolve().parent.parent
build = root / 'dist-player'
if not (build / 'asset-manifest.json').is_file():
    raise SystemExit('Build and verify the player before packaging it.')
selection = json.loads((root / 'src/content/selection.json').read_text())
if selection['file'] != 'case-v7.json':
    raise SystemExit('Mercy is not the selected edition.')
manifest = json.loads((build / 'asset-manifest.json').read_text())
selected = json.loads((root / 'src/content' / selection['file']).read_text())
canonical = json.dumps(selected, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()
if hashlib.sha256(canonical).hexdigest() != manifest['contentHash']:
    raise SystemExit('The build does not contain the selected current Mercy content. Rebuild before packaging.')
worker = (root / 'public/sw.js').read_bytes()
build_hash = hashlib.sha256(worker)
if sorted(manifest['files']) != sorted(manifest['hashes']):
    raise SystemExit('Manifest file list and hash list differ.')
for name, expected in manifest['hashes'].items():
    if hashlib.sha256((build / name).read_bytes()).hexdigest() != expected:
        raise SystemExit(f'Built asset differs from manifest: {name}')
for name in sorted(manifest['files']):
    build_hash.update(name.encode())
    build_hash.update((build / name).read_bytes())
if build_hash.hexdigest()[:16] != manifest['version']:
    raise SystemExit('The build version does not match its files and source service worker.')
if (build / 'sw.js').read_text() != worker.decode().replace('__BUILD_VERSION__', manifest['version']):
    raise SystemExit('The built service worker does not match this build.')

launcher = '''#!/usr/bin/env python3
"""Run this file with Python 3 to play in your own browser."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import webbrowser

folder = Path(__file__).resolve().parent
handler = partial(SimpleHTTPRequestHandler, directory=str(folder))
try:
    server = ThreadingHTTPServer(('127.0.0.1', 4173), handler)
except OSError:
    server = ThreadingHTTPServer(('127.0.0.1', 0), handler)
url = 'http://127.0.0.1:' + str(server.server_port) + '/'
print('The Shape of the Water: ' + url)
print('Keep this window open while playing. Ctrl+C closes the local server.')
print('Progress is saved in this browser. Export your run before moving browsers or ports.')
webbrowser.open(url)
try:
    server.serve_forever()
except KeyboardInterrupt:
    pass
finally:
    server.server_close()
'''
readme = '''THE SHAPE OF THE WATER
The Mercy of Morning

Play locally with Python 3:
    python3 play.py
On Windows:
    py -3 play.py

The launcher serves these files only on your own computer and opens your browser.
No account, live AI, network service or paid API is needed. Keep the launcher open.
Opening index.html directly is not supported by browser storage/security rules.

WASD / arrow keys move Blaise. Click the floor to walk. E takes a nearby action.
Every action is also available beside the prose. Text size and a text-focused view
are available in the header. The notebook contains only encountered material.

Progress stays in your browser. Export an encountered run for an independent copy.
After restarting, use Take over saving if prompted. Retained earlier drafts have
separate saves. Importing a run requires its exact matching text edition.

Content: emotional manipulation, memory loss, religious coercion and remembered
life-threatening injury. Third-person 3D with simplified faceless figures.

Source, authoring tools, research and acknowledgments:
https://github.com/deusalter/The-Shape-of-the-Water
'''
notices = []
# Vite's modulepreload polyfill is bundled in the player even though Vite is a dev dependency.
for name in ['react', 'react-dom', 'three', 'zod', 'vite']:
    package = root / 'node_modules' / name
    license_file = next((package / candidate for candidate in ['LICENSE', 'LICENSE.txt', 'LICENSE.md'] if (package / candidate).is_file()), None)
    if license_file is None:
        raise SystemExit(f'Missing distribution license for {name}')
    notices.append(name.upper() + '\n' + license_file.read_text())
# React DOM's bundled scheduler has its own MIT notice.
for license_file in sorted((root / 'node_modules/.pnpm').glob('scheduler@*/node_modules/scheduler/LICENSE')):
    notices.append('SCHEDULER\n' + license_file.read_text())
    break
else:
    raise SystemExit('Missing bundled scheduler license')
output = root / 'releases' / 'The-Shape-of-the-Water.zip'
output.parent.mkdir(exist_ok=True)
with zipfile.ZipFile(output, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    for file in sorted(build.rglob('*')):
        if file.is_file():
            archive.write(file, 'The-Shape-of-the-Water/' + file.relative_to(build).as_posix())
    archive.writestr('The-Shape-of-the-Water/play.py', launcher)
    archive.writestr('The-Shape-of-the-Water/START-HERE.txt', readme)
    archive.writestr('The-Shape-of-the-Water/THIRD-PARTY-NOTICES.txt', '\n\n'.join(notices))
receipt = {
    'path': str(output.relative_to(root)),
    'sha256': hashlib.sha256(output.read_bytes()).hexdigest(),
    'bytes': output.stat().st_size,
    'contentHash': manifest['contentHash'],
    'assetBuild': manifest['version'],
    'scope': 'Static player and local-only launcher; no public deployment.',
}
(output.parent / 'PACKAGE.json').write_text(json.dumps(receipt, indent=2) + '\n')
print(json.dumps(receipt, indent=2))
