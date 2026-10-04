"""Restore the exact tested source from Git into QA-owned ignored runtime/ only."""
from pathlib import Path
import hashlib,json,subprocess
root=Path(__file__).resolve().parent
repo=root.parents[4]
pins=json.loads((root/'source-hashes-before.json').read_text())
commit=pins['inputCommit']
prefixes=['src','public','tools/engine-offline-manifest.mjs','package.json','pnpm-lock.yaml','index.html','studio.html','vite.config.ts','tsconfig.json','tsconfig.app.json','tsconfig.node.json']
paths=subprocess.check_output(['git','ls-tree','-r','--name-only',commit,'--',*prefixes],cwd=repo,text=True).splitlines()
for name in paths:
    target=root/'runtime'/name
    if not target.resolve().is_relative_to((root/'runtime').resolve()):raise SystemExit('Unsafe Git path')
    body=subprocess.check_output(['git','show',commit+':'+name],cwd=repo)
    if name in pins['files'] and hashlib.sha256(body).hexdigest()!=pins['files'][name]:raise SystemExit('Pinned source mismatch: '+name)
    target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(body)
print(json.dumps({'commit':commit,'files':len(paths),'runtime':str(root/'runtime')}))
