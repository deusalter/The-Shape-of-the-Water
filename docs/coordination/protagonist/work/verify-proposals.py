"""Check proposal artifacts and ownership; does not execute game routes."""
from pathlib import Path
import hashlib
import json
import subprocess

root = Path(__file__).resolve().parents[4]
work = Path(__file__).parent


def git(*args):
    return subprocess.check_output(['git', *args], cwd=root)


def digest(data):
    return hashlib.sha256(data).hexdigest()


manifest = json.loads((work / 'P-002-INPUTS.json').read_text())
for item in manifest['files'] + manifest['primaryAndScholarship']:
    original = git('show', manifest['inputCommit'] + ':' + item['path'])
    assert digest(original) == item['sha256'], item['path']
for checkpoint in manifest['checkpoints']:
    for item in checkpoint.get('changedInputs', []):
        original = git('show', checkpoint['originMain'] + ':' + item['path'])
        assert digest(original) == item['sha256'], item['path']

allowed = 'docs/coordination/protagonist/'
paths = set(git('diff', '--name-only', 'origin/main').decode().splitlines())
paths.update(git('ls-files', '--others', '--exclude-standard').decode().splitlines())
assert all(p in {allowed + 'STATUS.json', allowed + 'RESPONSE.md'} or
           p.startswith(allowed + 'work/') for p in paths), paths

drafts = []
for name in ['P-002-A.md', 'P-002-B.md']:
    data = (work / name).read_bytes()
    text = data.decode()
    assert '\u2014' not in text, name
    assert 'Henrietta' not in text, name
    drafts.append({'path': name, 'sha256': digest(data),
                   'whitespaceWordsIncludingHeadingsAndAlternatives': len(text.split())})

packet = json.loads((work / 'READER-PACKET-MANIFEST.json').read_text())
assert digest((work / packet['packet']).read_bytes()) == packet['sha256']
review = json.loads((work / 'child/metadata.json').read_text())
assert review['reading_file_sha256_observed'] == packet['sha256']
original_a = digest((work / 'history/P-002-A-before-critique.md').read_bytes())
assert {x['sha256'] for x in packet['extractionSources']
        if x['file'].endswith('P-002-A.md')} == {original_a}

ending = (root / 'narrative/loop/ENDING-L3-AUDITIONS.md').read_text()
for anchor in [
    '“I want to ask you something about Ada,”',
    'They redden while you watch.',
    'The Miriam by the door moves the peas away from her hand.',
    '“I think it\'s the reason you have.”',
    'Ada says she is going back to the table. You ask her to wait.',
    'This time it is your own voice.',
    'The hand giving it is no steadier.',
    '“I didn\'t say without a body.”',
]:
    assert anchor in ending, anchor

report = {
    'status': 'PASS',
    'scope': 'Input-hash reproducibility, current diff ownership, punctuation, '
             'pinned blind-packet integrity and exact inherited splice anchors only',
    'originMain': git('rev-parse', 'origin/main').decode().strip(),
    'inputRecordsVerified': len(manifest['files']) + len(manifest['primaryAndScholarship']),
    'changedOrNewPathsChecked': sorted(paths),
    'drafts': drafts,
    'blindPacketSha256': packet['sha256'],
    'notTested': ['runtime branches and occasion guards', 'browser or 3D behavior',
                  'save migration', 'human response', 'duration', 'backend model identity'],
}
(work / 'checks').mkdir(exist_ok=True)
(work / 'checks/proposal-check.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({k: v for k, v in report.items() if k != 'changedOrNewPathsChecked'}, indent=2))
