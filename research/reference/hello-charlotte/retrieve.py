"""Reproducible public-source retrieval; no gameplay or authorship attested."""
import urllib.request, urllib.parse, pathlib, hashlib, json, datetime, concurrent.futures
from html.parser import HTMLParser
ROOT=pathlib.Path(__file__).parent
(ROOT/".local-evidence").mkdir(exist_ok=True)
(ROOT/"sources").mkdir(exist_ok=True)
class Text(HTMLParser):
 def __init__(self):super().__init__();self.skip=0;self.parts=[];self.title=False;self.titleparts=[];self.active=None;self.links=[]
 def handle_starttag(self,t,a):
  if t in ('script','style'):self.skip+=1
  elif t in ('div','p','h1','h2','h3','br','li','section','article'):self.parts.append('\n')
  if t=='title':self.title=True
  if t=='a':self.active=[dict(a),[]]
 def handle_endtag(self,t):
  if t in ('script','style'):self.skip=max(0,self.skip-1)
  elif t in ('div','p','h1','h2','h3','li','section','article'):self.parts.append('\n')
  if t=='title':self.title=False
  if t=='a' and self.active:self.links.append({'attributes':self.active[0],'text':''.join(self.active[1]).strip()});self.active=None
 def handle_data(self,d):
  if not self.skip:self.parts.append(d)
  if self.title:self.titleparts.append(d)
  if self.active:self.active[1].append(d)
def fetch(pair):
 key,url=pair;entry={'id':key,'url':url,'retrieved_utc':datetime.datetime.now(datetime.timezone.utc).isoformat()}
 try:
  req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0 (public literary reference retrieval)'})
  with urllib.request.urlopen(req,timeout=30) as r:data=r.read();entry.update(resolved_url=r.url,status=r.status)
  raw=ROOT/'.local-evidence'/(key+'.html');raw.write_bytes(data);p=Text();p.feed(data.decode('utf-8','replace'));txt='\n'.join(x.strip() for x in ''.join(p.parts).splitlines() if x.strip());(ROOT/'.local-evidence'/(key+'.txt')).write_text(txt)
  (ROOT/'.local-evidence'/(key+'-links.json')).write_text(json.dumps(p.links,indent=2)+'\n')
  entry.update(title=''.join(p.titleparts),sha256=hashlib.sha256(data).hexdigest(),text_sha256=hashlib.sha256(txt.encode()).hexdigest(),bytes=len(data),raw_path='.local-evidence/'+key+'.html',text_path='.local-evidence/'+key+'.txt');print(key,entry['status'],len(data),entry['title'])
 except Exception as e:entry['error']=str(e);print(key,str(e))
 (ROOT/'sources'/(key+'-retrieval.json')).write_text(json.dumps(entry,indent=2)+'\n')
 return entry
if __name__=='__main__':
 import sys
 urls=json.loads(pathlib.Path(sys.argv[1]).read_text())
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as ex:list(ex.map(fetch,urls.items()))
