"""Fetch public research sources; raw pages remain in an ignored evidence tree."""
import concurrent.futures
import datetime
import hashlib
import json
import pathlib
import sys
import urllib.request
from html.parser import HTMLParser

ROOT = pathlib.Path(__file__).resolve().parent
CACHE = ROOT.parent / '.local-evidence' / 'hello-charlotte-reassessment'
CACHE.mkdir(parents=True, exist_ok=True)
(ROOT / 'retrievals').mkdir(exist_ok=True)

class Text(HTMLParser):
    def __init__(self):
        super().__init__(); self.skip = 0; self.parts = []; self.links = []; self.link = None
    def handle_starttag(self, tag, attrs):
        if tag in ('script', 'style'): self.skip += 1
        if tag in ('p', 'div', 'h1', 'h2', 'h3', 'br', 'li', 'article'): self.parts.append('\n')
        if tag == 'a': self.link = [dict(attrs), []]
    def handle_endtag(self, tag):
        if tag in ('script', 'style'): self.skip = max(0, self.skip - 1)
        if tag in ('p', 'div', 'h1', 'h2', 'h3', 'li', 'article'): self.parts.append('\n')
        if tag == 'a' and self.link:
            self.links.append({'attributes':self.link[0], 'text':''.join(self.link[1]).strip()}); self.link = None
    def handle_data(self, data):
        if not self.skip: self.parts.append(data)
        if self.link: self.link[1].append(data)

def fetch(item):
    key, url = item
    entry = {'id':key, 'url':url, 'retrieved_utc':datetime.datetime.now(datetime.timezone.utc).isoformat()}
    try:
        request = urllib.request.Request(url, headers={'User-Agent':'Mozilla/5.0 (public literary research)'})
        with urllib.request.urlopen(request, timeout=25) as response:
            data = response.read(); entry.update(status=response.status, resolved_url=response.url)
        raw = CACHE / (key + '.html'); raw.write_bytes(data)
        parser = Text(); parser.feed(data.decode('utf-8', 'replace'))
        txt = '\n'.join(line.strip() for line in ''.join(parser.parts).splitlines() if line.strip())
        text_path = CACHE / (key + '.txt'); text_path.write_text(txt)
        (CACHE / (key + '-links.json')).write_text(json.dumps(parser.links, indent=2))
        entry.update(bytes=len(data), sha256=hashlib.sha256(data).hexdigest(), text_sha256=hashlib.sha256(txt.encode()).hexdigest(), raw_path=str(raw), text_path=str(text_path))
    except Exception as error:
        entry['error'] = str(error)
    (ROOT / 'retrievals' / (key + '.json')).write_text(json.dumps(entry, indent=2) + '\n')
    print(key, entry.get('status', entry.get('error')), entry.get('bytes', 0))
    return entry

if __name__ == '__main__':
    urls = json.loads(pathlib.Path(sys.argv[1]).read_text())
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        list(pool.map(fetch, urls.items()))
