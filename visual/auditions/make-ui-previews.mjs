import { readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const root = '/workspace/literary-detective';
const content = JSON.parse(await readFile(`${root}/src/content/case.json`, 'utf8'));
const scene = content.scenes.find(scene => scene.id === 'release');
const esc = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1120 } });
for (const [letter,file] of [['a','release-a-mineral-gouache.png'],['b','release-b-graphite-wash.png']]) {
  const data = (await readFile(`${root}/visual/auditions/${file}`)).toString('base64');
  const html = `<!doctype html><html lang="en"><meta charset="utf-8"><title>Release visual audition ${letter}</title><style>
    body{margin:0;background:#efeee7;color:#243633;font:19px/1.6 Georgia,serif}header{max-width:1040px;margin:0 auto;padding:22px 0;border-bottom:1px solid #bcc7bc}header p{font:11px system-ui;letter-spacing:2px;text-transform:uppercase}header h1{font-size:30px;font-weight:400;margin:0}main{max-width:880px;margin:26px auto;padding:30px 36px;background:#faf9f3;border:1px solid #c9d1c6;border-top:4px solid #376653}h2{font-size:34px;font-weight:400;margin:0 0 22px}figure{margin:0 0 26px}img{width:100%;height:355px;object-fit:cover;display:block;border:1px solid #bac4b7}figcaption{padding:8px 0;color:#53645e;font:12px/1.4 system-ui}.body{max-width:68ch}button{display:block;width:100%;margin:12px 0;background:#edf0e7;border:1px solid #b9c7b8;color:#23483e;padding:15px;text-align:left;font:17px/1.4 Georgia}p{margin:0 0 16px}</style><header><p>A provisional literary investigation</p><h1>The Shape of the Water</h1></header><main><h2>${esc(scene.title)}</h2><figure><img src="data:image/png;base64,${data}" alt="Ada and Simon at the shallow end of the saltwater bath"><figcaption>At the shallow end · Ada March and Simon Vane · visual audition ${letter.toUpperCase()}</figcaption></figure><div class="body">${scene.paragraphs.slice(0,5).map(p=>`<p>${esc(p)}</p>`).join('')}</div>${scene.choices.map(c=>`<button>${esc(c.label)}</button>`).join('')}</main></html>`;
  await writeFile(`${root}/visual/auditions/release-${letter}-ui.html`,html);
  await page.setContent(html);
  await page.screenshot({path:`${root}/visual/auditions/release-${letter}-ui-1440.png`,fullPage:true});
}
await browser.close();
