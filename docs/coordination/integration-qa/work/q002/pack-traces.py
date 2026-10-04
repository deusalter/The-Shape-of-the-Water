"""Retain every trace entry while deduplicating repeated built assets across contexts."""
from pathlib import Path
import hashlib,json,sys,zipfile
root=Path(__file__).resolve().parent
packed=root/'playwright-traces.zip'
if len(sys.argv)>1 and sys.argv[1]=='restore':
    name=sys.argv[2]
    with zipfile.ZipFile(packed) as src:
        index=json.loads(src.read('index.json'))
        archive=index['archives'][name]
        with zipfile.ZipFile(root/name,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as out:
            for entry,info in archive['entries'].items():
                body=src.read(info['storedPath'])
                assert hashlib.sha256(body).hexdigest()==info['sha256']
                zi=zipfile.ZipInfo(entry,tuple(info['dateTime']))
                zi.compress_type=zipfile.ZIP_DEFLATED
                out.writestr(zi,body)
    print(root/name)
    raise SystemExit
index={'scope':'All original decompressed trace entries retained exactly; ZIP container repacked.', 'archives':{}}
seen={}
with zipfile.ZipFile(packed,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as out:
    for path in sorted(root.glob('*-context-*.zip')):
        archive={'originalArchiveSha256':hashlib.sha256(path.read_bytes()).hexdigest(),'entries':{}}
        with zipfile.ZipFile(path) as src:
            for entry in src.infolist():
                if entry.is_dir():continue
                body=src.read(entry.filename);digest=hashlib.sha256(body).hexdigest()
                stored='objects/'+digest
                if stored not in seen:
                    out.writestr(stored,body);seen[stored]=True
                archive['entries'][entry.filename]={'storedPath':stored,'sha256':digest,'dateTime':entry.date_time}
        index['archives'][path.name]=archive
    out.writestr('index.json',json.dumps(index,indent=2))
(root/'trace-index.json').write_text(json.dumps(index,indent=2)+'\n')
print(json.dumps({'archives':len(index['archives']),'uniqueEntries':len(seen),'packedBytes':packed.stat().st_size}))
