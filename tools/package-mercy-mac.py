#!/usr/bin/env python3
"""Build a universal, dependency-free Mac launcher around the verified player ZIP.

Build on Linux or macOS with the official Go 1.27.1 toolchain. This does not
rebuild or edit the game, sign with an Apple identity, or claim notarization.
"""
from pathlib import Path, PurePosixPath
import argparse
import hashlib
import json
import os
import plistlib
import shutil
import stat
import struct
import subprocess
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parent.parent
VERSION = '1.0.0'
GO_VERSION = 'go1.27.1'
APP_NAME = 'The Shape of the Water.app'
PLAYER_PREFIX = 'The-Shape-of-the-Water/'


def digest(data):
    return hashlib.sha256(data).hexdigest()


def universal(slices):
    """Wrap byte-identical Mach-O slices; preserve each Go linker signature."""
    alignment = 1 << 14
    offset = alignment
    records, blocks, pins = [], [], {}
    for architecture, data in slices:
        if data[:4] != b'\xcf\xfa\xed\xfe':
            raise ValueError(f'{architecture} is not a 64-bit little-endian Mach-O')
        cpu, subtype = struct.unpack_from('<II', data, 4)
        expected = {'amd64': 0x01000007, 'arm64': 0x0100000c}[architecture]
        if cpu != expected:
            raise ValueError(f'Wrong CPU type for {architecture}')
        records.append(struct.pack('>IIIII', cpu, subtype, offset, len(data), 14))
        blocks.append((offset, data))
        pins[architecture] = {'offset': offset, 'bytes': len(data), 'sha256': digest(data)}
        offset = ((offset + len(data) + alignment - 1) // alignment) * alignment
    result = bytearray(struct.pack('>II', 0xcafebabe, len(records)) + b''.join(records))
    for offset, data in blocks:
        result.extend(b'\0' * (offset - len(result)))
        result.extend(data)
    return bytes(result), pins


def player_files():
    receipt = json.loads((ROOT / 'releases/PACKAGE.json').read_text())
    archive = ROOT / receipt['path']
    if digest(archive.read_bytes()) != receipt['sha256']:
        raise ValueError('The verified player archive differs from its receipt')
    with zipfile.ZipFile(archive) as player:
        names = player.namelist()
        if len(names) != len(set(names)):
            raise ValueError('Duplicate player archive entries')
        manifest_bytes = player.read(PLAYER_PREFIX + 'asset-manifest.json')
        manifest = json.loads(manifest_bytes)
        if manifest['version'] != receipt['assetBuild'] or manifest['contentHash'] != receipt['contentHash']:
            raise ValueError('Player manifest and release receipt differ')
        if sorted(manifest['files']) != sorted(manifest['hashes']):
            raise ValueError('Player manifest inventory differs from its hashes')
        files = {'asset-manifest.json': manifest_bytes}
        for name, expected in manifest['hashes'].items():
            path = PurePosixPath(name)
            if path.is_absolute() or '..' in path.parts or '\\' in name or name in files:
                raise ValueError('Unsafe or duplicate manifest path')
            data = player.read(PLAYER_PREFIX + name)
            if digest(data) != expected:
                raise ValueError(f'Player asset checksum failed: {name}')
            files[name] = data
        worker = (ROOT / 'public/sw.js').read_bytes()
        build_hash = hashlib.sha256(worker)
        for name in sorted(manifest['files']):
            build_hash.update(name.encode())
            build_hash.update(files[name])
        if build_hash.hexdigest()[:16] != manifest['version']:
            raise ValueError('Player build identity is invalid')
        files['sw.js'] = player.read(PLAYER_PREFIX + 'sw.js')
        if files['sw.js'] != worker.replace(b'__BUILD_VERSION__', manifest['version'].encode()):
            raise ValueError('Player service worker differs from the verified build')
        notices = player.read(PLAYER_PREFIX + 'THIRD-PARTY-NOTICES.txt').decode()
    return files, notices, receipt


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--go', default=shutil.which('go'), help='Path to official Go 1.27.1 compiler')
    args = parser.parse_args()
    if not args.go:
        raise SystemExit('Supply the official Go compiler with --go')
    compiler = str(Path(args.go).resolve())
    toolchain = subprocess.check_output([compiler, 'version'], text=True).strip()
    if not toolchain.startswith(f'go version {GO_VERSION} '):
        raise SystemExit(f'Expected official {GO_VERSION}; found {toolchain}')
    files, notices, player_receipt = player_files()
    env = dict(os.environ, GOTOOLCHAIN='local', CGO_ENABLED='0', GOOS='darwin')
    go_root = Path(subprocess.check_output([compiler, 'env', 'GOROOT'], env=env, text=True).strip())
    notices += '\n\nGO RUNTIME\n' + (go_root / 'LICENSE').read_text()
    notices += '\n\nGO PATENT GRANT\n' + (go_root / 'PATENTS').read_text()
    for notice in sorted((go_root / 'src/vendor').rglob('*')):
        if notice.is_file() and notice.name in ('LICENSE', 'PATENTS'):
            notices += '\n\n' + str(notice.relative_to(go_root)) + '\n' + notice.read_text()
    module = ROOT / 'desktop/launcher'
    with tempfile.TemporaryDirectory(prefix='mercy-mac-build-') as temp:
        folder = Path(temp)
        slices = []
        for architecture in ('amd64', 'arm64'):
            output = folder / f'launcher-{architecture}'
            subprocess.run([compiler, 'build', '-trimpath', '-buildvcs=false',
                            '-ldflags', f'-s -w -X main.version={VERSION}', '-o', str(output), '.'],
                           cwd=module, env=dict(env, GOARCH=architecture), check=True)
            slices.append((architecture, output.read_bytes()))
        executable, slice_pins = universal(slices)
        plist = {
            'CFBundleName': 'The Shape of the Water',
            'CFBundleDisplayName': 'The Shape of the Water',
            'CFBundleIdentifier': 'io.github.deusalter.the-shape-of-the-water',
            'CFBundleExecutable': 'launcher',
            'CFBundlePackageType': 'APPL',
            'CFBundleInfoDictionaryVersion': '6.0',
            'CFBundleShortVersionString': VERSION,
            'CFBundleVersion': '1',
            'CFBundleSupportedPlatforms': ['MacOSX'],
            'LSMinimumSystemVersion': '13.0',
            'LSUIElement': True,
            'NSHighResolutionCapable': True,
        }
        instructions = '''THE SHAPE OF THE WATER
The Mercy of Morning

MAC: macOS 13 Ventura or later, Apple silicon or Intel.

1. Extract this ZIP.
2. Double-click The Shape of the Water.app.
3. Click Play. The game opens in your usual browser.

You can move the app to Applications. No Python, Node, or terminal commands
are needed. Keep the app intact; its game files are inside the app bundle.

Play opens another browser tab. Return to the launcher's tab to Quit when done.
If you closed that tab, double-click the app again to reopen it.

This independent build is not Apple-notarized. If macOS blocks opening it,
open System Settings > Privacy & Security, choose Open Anyway for this app,
and confirm Open. You do not need to disable Gatekeeper or use the terminal.
See Apple's instructions: https://support.apple.com/en-us/102445

Your progress stays in the browser. Use the same browser as before to keep
existing saves. The game uses the same local address as the previous launcher.
If an older launcher is already running, close it before starting this app.
Export your encountered run for an independent backup.

WASD or arrow keys move Blaise. Click the floor to walk; E takes a nearby
action. Every action is also available beside the prose.

The app and game work locally without an account, paid services or live AI.
The Mac binaries were cross-built and inspected in Linux; the shared launcher
and game were tested there. Native Finder/Gatekeeper/Safari execution has not
been verified on a Mac in this workspace.

Source and verification:
https://github.com/deusalter/The-Shape-of-the-Water
'''
        entries = {
            f'{APP_NAME}/Contents/Info.plist': (plistlib.dumps(plist), 0o644),
            f'{APP_NAME}/Contents/PkgInfo': (b'APPL????', 0o644),
            f'{APP_NAME}/Contents/MacOS/launcher': (executable, 0o755),
            f'{APP_NAME}/Contents/Resources/THIRD-PARTY-NOTICES.txt': (notices.encode(), 0o644),
            'START-HERE.txt': (instructions.encode(), 0o644),
        }
        for name, data in files.items():
            entries[f'{APP_NAME}/Contents/Resources/game/{name}'] = (data, 0o644)
        output = ROOT / 'releases/The-Shape-of-the-Water-Mac.zip'
        with zipfile.ZipFile(output, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
            directories = {str(parent) + '/' for name in entries
                           for parent in PurePosixPath(name).parents if str(parent) != '.'}
            for name in sorted(directories):
                info = zipfile.ZipInfo(name, (2026, 10, 4, 0, 0, 0))
                info.create_system = 3
                info.external_attr = ((stat.S_IFDIR | 0o755) << 16) | 0x10
                archive.writestr(info, b'')
            for name, (data, permissions) in sorted(entries.items()):
                info = zipfile.ZipInfo(name, (2026, 10, 4, 0, 0, 0))
                info.create_system = 3
                info.external_attr = (stat.S_IFREG | permissions) << 16
                info.compress_type = zipfile.ZIP_DEFLATED
                archive.writestr(info, data)
        receipt = {
            'path': str(output.relative_to(ROOT)), 'bytes': output.stat().st_size,
            'sha256': digest(output.read_bytes()), 'launcherVersion': VERSION,
            'assetBuild': player_receipt['assetBuild'], 'contentHash': player_receipt['contentHash'],
            'sourcePlayerArchiveSha256': player_receipt['sha256'], 'gameFilesCopiedUnchanged': len(files),
            'minimumMacOS': '13.0', 'architectures': ['x86_64', 'arm64'],
            'compiler': toolchain, 'slices': slice_pins,
            'universalExecutableSha256': digest(executable),
            'notarized': False, 'nativeMacExecutionVerified': False,
            'scope': 'Universal Mac launcher around exact optimized player assets; local browser, no runtime installation or terminal commands required.',
        }
        (ROOT / 'releases/MAC-PACKAGE.json').write_text(json.dumps(receipt, indent=2) + '\n')
        print(json.dumps(receipt, indent=2))


if __name__ == '__main__':
    main()
