"""Reproduce selected static event inspection from the official free EP1 download.

Usage: PYTHONPATH=/path/to/temp/dependencies python inspect_ep1.py /path/to/official.zip
Dependencies: libarchive-c (system libarchive) and rubymarshal.
No executable or Ruby code is run. The program reads the Windows cabinet's game
archive and Ruby Marshal data, then prints ONLY selected event dialogue/control
records for research inspection. Redirecting its output creates copyrighted text;
do not add such output or the original game to this research repository.

SOURCE: https://etherane.itch.io/hello-charlotte-ep1, English upload 513960.
ZIP SHA-256 f1f092fa1d393f94cd62109bd7b8e013ce466b76f7b09a5c2d6891a90e69bc4d.
The publisher may replace uploads. Verify SHA before asserting identical locators.
"""
import hashlib
import io
from pathlib import Path
import struct
import sys
import zipfile
import libarchive
from rubymarshal.reader import loads

SELECTIONS = {
    'Data/Map010.rvdata2': [(13, 1, 39, 76), (18, 1, 2, 41)],
    'Data/Map039.rvdata2': [(1, 1, 22, 66)],
    'Data/Map046.rvdata2': [(4, 1, 4, 127)],
    'Data/Map129.rvdata2': [(6, 1, 20, 143)],
    'Data/Map148.rvdata2': [(2, 1, 2, 55)],
}

zip_bytes = Path(sys.argv[1]).read_bytes()
print('zip_sha256', hashlib.sha256(zip_bytes).hexdigest())
with zipfile.ZipFile(io.BytesIO(zip_bytes)) as z:
    exe = z.read('HC_EP1.exe')
# Locate the PE overlay; earlier MSCF byte strings belong to executable code.
pe = struct.unpack_from('<I', exe, 60)[0]
sections = struct.unpack_from('<H', exe, pe + 6)[0]
opt_size = struct.unpack_from('<H', exe, pe + 20)[0]
section_pos = pe + 24 + opt_size
end = 0
for i in range(sections):
    size, start = struct.unpack_from('<II', exe, section_pos + i * 40 + 16)
    end = max(end, start + size)
assert exe[end:end+4] == b'MSCF'
game_archive = None
with libarchive.memory_reader(exe[end:]) as cabinet:
    for entry in cabinet:
        if entry.pathname.replace('\\', '/') == 'Game.rgss3a':
            game_archive = b''.join(entry.get_blocks())
assert game_archive and game_archive[:8] == b'RGSSAD\x00\x03'
print('game_archive_sha256', hashlib.sha256(game_archive).hexdigest())
# Standard RGSS v3 packaging: directory and payload use their stored XOR keys.
# This is local inspection of the publisher's freely distributed game package.
key = (struct.unpack_from('<I', game_archive, 8)[0] * 9 + 3) & 0xffffffff
pos = 12
while True:
    offset, size, file_key, name_size = [v ^ key for v in struct.unpack_from('<4I', game_archive, pos)]
    pos += 16
    if not offset:
        break
    name = bytes(c ^ ((key >> (i % 4 * 8)) & 255) for i, c in enumerate(game_archive[pos:pos+name_size])).decode().replace('\\', '/')
    pos += name_size
    if name not in SELECTIONS:
        continue
    source = game_archive[offset:offset+size]
    unpacked = bytearray(size)
    for i in range(0, size, 4):
        for j, char in enumerate(source[i:i+4]):
            unpacked[i+j] = char ^ ((file_key >> (8*j)) & 255)
        file_key = (file_key * 7 + 3) & 0xffffffff
    print(name, 'sha256', hashlib.sha256(unpacked).hexdigest())
    game_map = loads(bytes(unpacked))
    for event_id, page_number, start, stop in SELECTIONS[name]:
        event = game_map.attributes['@events'][event_id]
        page = event.attributes['@pages'][page_number - 1]
        for command_number, command in enumerate(page.attributes['@list'], 1):
            if start <= command_number <= stop:
                print(name, 'event', event_id, 'page', page_number, 'command', command_number, command.attributes)
