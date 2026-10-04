#!/usr/bin/env python3
"""Independent structural inspection; this does not execute a Mac application."""
import hashlib
import json
import plistlib
import stat
import struct
import sys
import zipfile
from pathlib import Path, PurePosixPath


def sha(data):
    return hashlib.sha256(data).hexdigest()


def ver(value):
    return '.'.join(map(str, (value >> 16, (value >> 8) & 255, value & 255)))


def inspect_slice(data, fat_cpu, fat_subtype):
    magic, cpu, subtype, filetype, commands, size, flags, reserved = struct.unpack_from('<8I', data)
    assert magic == 0xfeedfacf and cpu == fat_cpu and subtype == fat_subtype
    assert filetype == 2
    result = {'cpu': hex(cpu), 'cpuSubtype': hex(subtype), 'bytes': len(data), 'sha256': sha(data)}
    pos = 32
    for unused in range(commands):
        command, length = struct.unpack_from('<2I', data, pos)
        assert length >= 8 and pos + length <= 32 + size
        if command == 0x32:
            platform, minimum, sdk, tools = struct.unpack_from('<4I', data, pos + 8)
            assert platform == 1 and minimum == 0x000d0000
            result['minimumMacOS'] = ver(minimum)
            result['sdk'] = ver(sdk)
        if command == 0x1d:
            offset, count = struct.unpack_from('<2I', data, pos + 8)
            signature = data[offset:offset + count]
            assert len(signature) == count
            magic, signature_length, blobs = struct.unpack_from('>3I', signature)
            assert magic == 0xfade0cc0 and signature_length <= count
            directories = []
            for index in range(blobs):
                kind, relative = struct.unpack_from('>2I', signature, 12 + 8 * index)
                if kind != 0:
                    continue
                directory = signature[relative:]
                magic, total, version, codeflags, hashoff, identoff, special, slots, limit = struct.unpack_from('>9I', directory)
                hashsize, hashtype, unused, pagebits = struct.unpack_from('>4B', directory, 36)
                assert magic == 0xfade0c02 and total <= len(directory)
                assert codeflags & 2 and hashsize == 32 and hashtype == 2
                assert limit == offset and special == 0 and pagebits == 12
                assert slots == (limit + 4095) // 4096
                assert hashoff + slots * hashsize <= total
                for slot in range(slots):
                    page = data[slot * 4096:min((slot + 1) * 4096, limit)]
                    expected = directory[hashoff + slot * hashsize:hashoff + (slot + 1) * hashsize]
                    assert hashlib.sha256(page).digest() == expected, 'Executable signature page mismatch'
                directories.append({'flags': hex(codeflags), 'version': hex(version), 'sha256PagesVerified': slots})
            assert directories
            result['adHocSignature'] = directories
        pos += length
    assert pos == 32 + size and result['minimumMacOS'] == '13.0.0'
    if cpu == 0x100000c:
        assert result.get('adHocSignature'), 'arm64 requires a preserved ad-hoc signature'
    return result


def inspect_universal(data):
    magic, count = struct.unpack_from('>2I', data)
    assert magic == 0xcafebabe and count == 2
    slices = []
    end = 8 + count * 20
    for index in range(count):
        cpu, subtype, offset, length, alignment = struct.unpack_from('>5I', data, 8 + index * 20)
        assert alignment >= 14 and offset % (1 << alignment) == 0
        assert offset >= end and offset + length <= len(data)
        end = offset + length
        result = inspect_slice(data[offset:end], cpu, subtype)
        result.update({'offset': offset, 'alignment': 1 << alignment})
        slices.append(result)
    assert {item['cpu'] for item in slices} == {'0x1000007', '0x100000c'}
    return slices


package = Path(sys.argv[1])
original = Path(sys.argv[2])
report = {'status': 'RUNNING', 'scope': 'Linux structural and cryptographic inspection, not native macOS execution',
          'path': str(package), 'sha256': sha(package.read_bytes()), 'bytes': package.stat().st_size}
with zipfile.ZipFile(package) as archive, zipfile.ZipFile(original) as baseline:
    names = archive.namelist()
    assert len(names) == len(set(names))
    for item in archive.infolist():
        path = PurePosixPath(item.filename)
        assert not path.is_absolute() and '..' not in path.parts and '\\' not in item.filename
        mode = item.external_attr >> 16
        assert not stat.S_ISLNK(mode)
        if item.is_dir():
            assert mode & 0o555 == 0o555
    plist_name, = [name for name in names if name.endswith('.app/Contents/Info.plist')]
    info = plistlib.loads(archive.read(plist_name))
    app = plist_name.removesuffix('Contents/Info.plist')
    executable = app + 'Contents/MacOS/' + info['CFBundleExecutable']
    executable_mode = archive.getinfo(executable).external_attr >> 16
    assert executable_mode & 0o111 == 0o111 and archive.getinfo(executable).create_system == 3
    assert info['CFBundlePackageType'] == 'APPL'
    assert info['LSMinimumSystemVersion'] in ['13.0', '13.0.0'] and info['LSUIElement'] is True
    game = app + 'Contents/Resources/game/'
    game_names = sorted(name.removeprefix(game) for name in names if name.startswith(game) and not name.endswith('/'))
    original_names = {name.partition('/')[2]: name for name in baseline.namelist() if not name.endswith('/')}
    expected_names = sorted(name for name in original_names if name not in ['play.py', 'START-HERE.txt', 'THIRD-PARTY-NOTICES.txt'])
    assert game_names == expected_names, (game_names, expected_names)
    for name in game_names:
        assert archive.read(game + name) == baseline.read(original_names[name]), 'Changed game asset: ' + name
    manifest = json.loads(archive.read(game + 'asset-manifest.json'))
    assert sorted(manifest['files']) == sorted(manifest['hashes'])
    for name, digest in manifest['hashes'].items():
        assert sha(archive.read(game + name)) == digest
    report.update({'entries': len(names), 'bundle': app, 'infoPlist': info, 'launcherMode': oct(executable_mode),
                   'assetBuild': manifest['version'], 'contentHash': manifest['contentHash'],
                   'exactPublishedGameFiles': len(game_names), 'verifiedManifestAssets': len(manifest['hashes']),
                   'executable': inspect_universal(archive.read(executable)), 'status': 'PASS'})
output = Path(__file__).parent / 'PACKAGE-CHECK.json'
output.write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report, indent=2))
