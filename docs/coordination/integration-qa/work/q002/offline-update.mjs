import {suite,expect,folder,saved,choose,exportRun,write,hash} from './browser-common.mjs';
import {createServer} from 'node:http';
import {cpSync,readFileSync,appendFileSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import {execFileSync} from 'node:child_process';
const oldRoot=folder+'runtime/dist-player',newRoot=folder+'runtime/dist-update';
cpSync(oldRoot,newRoot,{recursive:true});appendFileSync(newRoot+'/index.html','\n<!-- QA HTML-only update fixture; unchanged story and runtime -->\n');
const generation=execFileSync('node',['tools/engine-offline-manifest.mjs','dist-update'],{cwd:folder+'runtime',encoding:'utf8'});
const oldManifest=JSON.parse(readFileSync(oldRoot+'/asset-manifest.json')),newManifest=JSON.parse(readFileSync(newRoot+'/asset-manifest.json'));
write('offline-update-fixture.json',{generation,oldManifest,newManifest,scope:'Synthetic HTML-only build identity update; canonical story/runtime assets remain byte-identical.'});
let selectedRoot=oldRoot;
const server=createServer((req,res)=>{const path=resolve(selectedRoot,'.'+new URL(req.url,'http://127.0.0.1').pathname);if(!path.startsWith(selectedRoot+'/')&&path!==selectedRoot){res.writeHead(403).end();return;}const file=path===selectedRoot?path+'/index.html':path;try{const body=readFileSync(file);res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.svg':'image/svg+xml'})[extname(file)]??'application/octet-stream','Cache-Control':'no-store'});res.end(body);}catch{res.writeHead(404).end();}});
await new Promise(res=>server.listen(4315,'127.0.0.1',res));
const s=await suite('update');
await s.check('U01','Verified old build remains active while an update waits; new build activates after old clients close',async()=>{
 const {context,page}=await s.open('http://127.0.0.1:4315/');await saved(page);await expect(page.locator('.offline-status')).toContainText('Ready for offline play',{timeout:20000});await choose(page,'arrival-miriam');const before=await exportRun(page,'U01-original-run.json');
 s.step('Switch same-origin server to HTML-only update and explicitly request worker update');selectedRoot=newRoot;await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();await r.update();});await expect.poll(()=>page.evaluate(async()=>!!(await navigator.serviceWorker.getRegistration()).waiting),{timeout:15000}).toBe(true);
 const pending=await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration(),c=new MessageChannel();const status=await new Promise(res=>{c.port1.onmessage=e=>res(e.data);r.active.postMessage({type:'CHECK_READY',contentHash:window.qaHash},[c.port2]);});return {hasWaiting:!!r.waiting,caches:await caches.keys(),activeStatus:status};});
 // The initial contentHash field in the first diagnostic call is intentionally omitted;
 // re-query with the exact exported story identity before asserting readiness.
 const oldReady=await page.evaluate(async contentHash=>{const r=await navigator.serviceWorker.getRegistration(),c=new MessageChannel();return await new Promise(res=>{c.port1.onmessage=e=>res(e.data);r.active.postMessage({type:'CHECK_READY',contentHash},[c.port2]);});},before.content.hash);
 expect(oldReady.version).toBe(oldManifest.version);expect(oldReady.ready).toBe(true);expect(pending.hasWaiting).toBe(true);expect(await exportRun(page,'U01-during-update.json')).toEqual(before);write('U01-waiting-status.json',{pending,oldReady});
 s.step('Old page still plays while waiting; close final old client');await choose(page,'bench-record');const advanced=await exportRun(page,'U01-advanced-old-run.json');await page.close();
 const next=await context.newPage();await next.goto('http://127.0.0.1:4315/');await expect(next.locator('.offline-status')).toContainText('Ready for offline play',{timeout:20000});await next.getByRole('button',{name:'Take over saving',exact:true}).click();await next.getByRole('button',{name:'Confirm action',exact:true}).click();await saved(next);expect(await exportRun(next,'U01-after-activation.json')).toEqual(advanced);
 const newReady=await next.evaluate(async contentHash=>{const r=await navigator.serviceWorker.getRegistration(),c=new MessageChannel();return await new Promise(res=>{c.port1.onmessage=e=>res(e.data);r.active.postMessage({type:'CHECK_READY',contentHash},[c.port2]);});},before.content.hash);expect(newReady.ready).toBe(true);expect(newReady.version).toBe(newManifest.version);write('U01-activated-status.json',newReady);return {oldVersion:oldManifest.version,newVersion:newManifest.version,contentHashUnchanged:oldManifest.contentHash===newManifest.contentHash,scope:'Synthetic same-story update; no new 3D code or content-version migration is certified.'};
});
await s.finish();await new Promise(res=>server.close(res));
