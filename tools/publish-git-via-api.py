#!/usr/bin/env python3
"""Publish authorized Git objects through authenticated gh REST when smart HTTP is unavailable.

Preserves blob/tree/commit identities and updates the remote branch without force.
No credentials are read or printed. Existing remote work must be an ancestor.
"""
import argparse, base64, datetime, json, pathlib, re, subprocess

parser=argparse.ArgumentParser()
parser.add_argument('--repository',required=True)
parser.add_argument('--branch',required=True)
parser.add_argument('--ref',default='HEAD')
args=parser.parse_args()
if not re.fullmatch(r'[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+',args.repository): raise SystemExit('Invalid repository')
def git(*argv): return subprocess.check_output(['git',*argv])
def api(path,payload=None):
    command=['gh','api']
    if payload is not None: command+=['--method','POST']
    command+=[f'repos/{args.repository}/{path}']
    if payload is not None: command+=['--input','-']
    result=subprocess.run(command,input=json.dumps(payload) if payload is not None else None,text=True,capture_output=True)
    if result.returncode: raise RuntimeError(result.stderr.strip())
    return json.loads(result.stdout)
head=git('rev-parse',args.ref).decode().strip()
try: remote=api('git/ref/heads/'+args.branch)['object']['sha']
except RuntimeError as error:
    if '404' not in str(error): raise
    remote=None
if remote:
    check=subprocess.run(['git','merge-base','--is-ancestor',remote,head],capture_output=True)
    if check.returncode: raise SystemExit('Fetch and integrate the existing remote branch first; force updates are forbidden.')
cache_path=pathlib.Path(git('rev-parse','--git-dir').decode().strip())/'github-api-object-cache.json'
cache=json.loads(cache_path.read_text()) if cache_path.exists() else {}
known=set(cache.get(args.repository,[]))
if remote: known.update(git('rev-list','--objects','--no-object-names',remote).decode().splitlines())
def remember(oid):
    known.add(oid);cache[args.repository]=sorted(known);cache_path.write_text(json.dumps(cache)+'\n')
def identity(line):
    match=re.fullmatch(r'(.*) <(.*)> (\d+) ([+-]\d{4})',line)
    if not match: raise ValueError('Unsupported identity header')
    name,email,stamp,zone=match.groups();minutes=int(zone[1:3])*60+int(zone[3:]);minutes*=1 if zone[0]=='+' else -1
    when=datetime.datetime.fromtimestamp(int(stamp),datetime.timezone(datetime.timedelta(minutes=minutes)))
    return {'name':name,'email':email,'date':when.isoformat()}
counts={'blob':0,'tree':0,'commit':0}
def upload(oid):
    if oid in known: return
    kind=git('cat-file','-t',oid).decode().strip()
    raw=git('cat-file',kind,oid)
    if kind=='blob': result=api('git/blobs',{'encoding':'base64','content':base64.b64encode(raw).decode()})
    elif kind=='tree':
        entries=[]; embedded=[]
        for row in git('ls-tree','-z',oid).split(b'\0'):
            if not row: continue
            metadata,name=row.split(b'\t',1);mode,child_kind,child=metadata.decode().split()
            entry={'path':name.decode(),'mode':mode,'type':child_kind}
            if child_kind=='blob' and child not in known:
                try: content=git('cat-file','blob',child).decode('utf-8')
                except UnicodeDecodeError: content=None
                if content is not None:
                    entry['content']=content;embedded.append(child)
                else: upload(child);entry['sha']=child
            else: upload(child);entry['sha']=child
            entries.append(entry)
        result=api('git/trees',{'tree':entries})
        if result['sha']==oid:
            for child in embedded: remember(child)
            counts['blob']+=len(embedded)
    elif kind=='commit':
        headers,message=raw.decode().split('\n\n',1);payload={'message':message,'parents':[]}
        for line in headers.splitlines():
            key,value=line.split(' ',1)
            if key=='tree': upload(value);payload['tree']=value
            elif key=='parent': upload(value);payload['parents'].append(value)
            elif key in ('author','committer'): payload[key]=identity(value)
            else: raise ValueError('Unsupported commit header; refusing to rewrite history: '+key)
        result=api('git/commits',payload)
    else: raise ValueError('Unsupported object type: '+kind)
    if result['sha']!=oid: raise RuntimeError(f'{kind} identity changed: expected {oid}, received {result["sha"]}')
    remember(oid);counts[kind]+=1
    if sum(counts.values())%20==0 or kind=='commit': print(json.dumps({'uploaded':counts,'last':oid}),flush=True)
upload(head)
if remote:
    result=subprocess.run(['gh','api','--method','PATCH',f'repos/{args.repository}/git/refs/heads/{args.branch}','--input','-'],input=json.dumps({'sha':head,'force':False}),text=True,capture_output=True)
    if result.returncode: raise RuntimeError(result.stderr.strip())
else: api('git/refs',{'ref':'refs/heads/'+args.branch,'sha':head})
verified=api('git/ref/heads/'+args.branch)['object']['sha']
if verified!=head: raise RuntimeError('Remote verification mismatch')
print(json.dumps({'status':'PASS','repository':args.repository,'branch':args.branch,'commit':head,'uploaded':counts}),flush=True)
