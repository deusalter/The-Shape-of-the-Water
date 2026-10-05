import urllib.request,concurrent.futures,hashlib,json,datetime,html,re,pathlib,sys
ROOT=pathlib.Path(__file__).resolve().parent
CACHE=pathlib.Path('/tmp/ontology-games'); CACHE.mkdir(exist_ok=True)
def fetch(item):
 id,url=item;d=dict(id=id,url=url,retrieved_utc=datetime.datetime.now(datetime.timezone.utc).isoformat())
 try:
  with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'}),timeout=25) as r:body=r.read();d.update(status=r.status,final_url=r.url)
  raw=body.decode(errors='replace');t=html.unescape(re.sub('<[^>]+>','\n',re.sub(r'<(script|style)\b[^>]*>.*?</\1>','',raw,flags=re.S)));t=re.sub(r'\n\s*\n','\n',t)
  (CACHE/(id+'.html')).write_bytes(body);(CACHE/(id+'.txt')).write_text(t)
  d.update(sha256=hashlib.sha256(body).hexdigest(),bytes=len(body))
 except Exception as e:d['error']=str(e)
 (ROOT/(id+'-receipt.json')).write_text(json.dumps(d,indent=2)+'\n');return d
if __name__=='__main__':
 with concurrent.futures.ThreadPoolExecutor(max_workers=6) as ex:
  for d in ex.map(fetch,json.loads(sys.argv[1]).items()):print(json.dumps(d))
