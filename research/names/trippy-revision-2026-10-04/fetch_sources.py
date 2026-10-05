import urllib.request,concurrent.futures,json,datetime,hashlib,re
from pathlib import Path
from html.parser import HTMLParser
ROOT=Path(__file__).parent
class Plain(HTMLParser):
 def __init__(self):super().__init__();self.parts=[]
 def handle_data(self,data):self.parts.append(data)
urls={
'brunel':'https://www.bbc.co.uk/history/historic_figures/brunel_kingdom_isambard.shtml',
'dombey':'https://www.gutenberg.org/cache/epub/821/pg821.txt',
'hypatia':'https://mathshistory.st-andrews.ac.uk/Biographies/Hypatia/',
'honeychurch':'https://www.gutenberg.org/cache/epub/2641/pg2641.txt',
'earnest':'https://www.gutenberg.org/cache/epub/844/pg844.txt',
'emma':'https://www.gutenberg.org/cache/epub/158/pg158.txt',
'pilgrim':'https://www.gutenberg.org/cache/epub/131/pg131.txt',
'relapse':'https://www.gutenberg.org/cache/epub/51113/pg51113.txt',
'midsummer':'https://www.gutenberg.org/cache/epub/1514/pg1514.txt',
}
def f(kv):
 k,u=kv
 record={'key':k,'url':u,'retrieved_utc':datetime.datetime.now(datetime.timezone.utc).isoformat()}
 try:
  with urllib.request.urlopen(u,timeout=25) as r:
   raw=r.read();record.update(status=r.status,final_url=r.url,sha256=hashlib.sha256(raw).hexdigest(),bytes=len(raw))
   txt=raw.decode('utf-8',errors='replace')
   if '<html' in txt[:1000].lower():
    p=Plain();p.feed(txt);txt='\n'.join(x.strip() for x in p.parts if x.strip())
   (ROOT/(k+'.txt')).write_text(txt)
   record['retained_text']=k+'.txt';record['preview']=txt[:180]
 except Exception as e:record['error']=str(e)
 (ROOT/(k+'.json')).write_text(json.dumps(record,indent=2)+'\n')
 return record
if __name__=='__main__':
 for r in concurrent.futures.ThreadPoolExecutor(max_workers=8).map(f,urls.items()):print(json.dumps(r))
