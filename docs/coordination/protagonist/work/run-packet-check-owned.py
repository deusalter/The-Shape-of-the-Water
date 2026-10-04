"""Run the unchanged repository packet checker with its report in team ownership.

No checker predicate is replaced. The sole fixed report destination is redirected.
"""
from pathlib import Path
import runpy

root = Path(__file__).resolve().parents[4]
destination = Path(__file__).parent / 'checks' / 'packet-check.json'
destination.parent.mkdir(exist_ok=True)
original_write = Path.write_text
expected = root / 'reviews' / 'packet-check.json'


def owned_report(path, *args, **kwargs):
    if path == expected:
        return original_write(destination, *args, **kwargs)
    raise RuntimeError(f'Unexpected checker write: {path}')


Path.write_text = owned_report
try:
    print(f'Report write redirected to {destination}')
    runpy.run_path(str(root / 'tools' / 'check_packet.py'), run_name='__main__')
finally:
    Path.write_text = original_write
