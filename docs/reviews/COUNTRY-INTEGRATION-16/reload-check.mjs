import {chromium,expect} from '@playwright/test';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
const folder='docs/reviews/COUNTRY-INTEGRATION-16';
const base=process.env.RELOAD_PLAYER_URL??'http://localhost:4190/';
const hash=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const manifest=JSON.parse(readFileSync('dist-player/asset-manifest.json','utf8'));
expect(manifest.version).toBe('c55a98a279612e95');
const files=['src/components/EvidencePlayer.tsx','src/content/editions.ts','src/content/selection.json','src/content/load-evidence.ts','src/content/case-v5.json','src/content/case-v4.json','src/content/case-v2.json','src/persistence/checkpoint-store.ts','src/persistence/evidence-store.ts','src/persistence/ownership.ts','src/offline.ts','public/sw.js','dist-player/asset-manifest.json','dist-player/sw.js',...manifest.files.map(path=>`dist-player/${path}`)];
const pins=()=>Object.fromEntries(files.map(path=>[path,hash(path)]));
const content=JSON.parse(readFileSync('src/content/case-v5.json','utf8'));
const old4=JSON.parse(readFileSync('src/content/case-v4.json','utf8')),old2=JSON.parse(readFileSync('src/content/case-v2.json','utf8'));
const bundled=await build({stdin:{contents:"export * from './src/engine/evidence-v2.ts'; export {contentHash} from './src/engine/hash.ts';",resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'});
const e=await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`);
const report={status:'RUNNING',date:new Date().toISOString(),scope:'Actual frozen built Chromium reload/explicit ownership recovery and offline retained-edition roundtrip, followed by newly persisted v5 actions. No production mutation or full route regression.',manifestVersion:manifest.version,url:base,pinsBefore:pins(),checkpoints:[],checks:[],pageErrors:[]};
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const context=await browser.newContext({viewport:{width:1440,height:1100},reducedMotion:'reduce'}),page=await context.newPage();
page.setDefaultTimeout(20000);expect.configure({timeout:20000});page.on('pageerror',error=>report.pageErrors.push(error.message));
let count=0;
const ready=()=>expect(page.getByRole('button',{name:'Load saved progress',exact:true})).toBeEnabled({timeout:20000});
async function claim(label,{expectTakeover=false}={}){
 await ready();
 const button=page.getByRole('button',{name:'Take over saving',exact:true});
 const offered=await button.isVisible();
 if(expectTakeover)expect(offered,`${label}: expected explicit recovery after document replacement`).toBe(true);
 const before=await page.locator('.save-status').textContent();
 if(offered){
  await expect(page.locator('.choices button').first()).toBeDisabled();
  await expect(button).toBeEnabled();await button.click();await page.getByRole('button',{name:'Confirm action',exact:true}).click();
  await ready();await expect(button).toBeHidden();
  await expect(page.locator('.save-status')).toHaveText('Saving taken over. The latest committed progress is loaded.');
 }
 await expect(page.getByText('This tab is read-only because another tab or prior session controls saving. The active run remains exportable.',{exact:true})).toBeHidden();
 await expect(page.getByRole('button',{name:'Retry saving',exact:true})).toBeEnabled();
 await expect(page.locator('.choices button').first()).toBeEnabled();
 report.checkpoints.push({label,takeoverOffered:offered,statusBefore:before,statusAfter:await page.locator('.save-status').textContent(),actionsEnabled:true});
}
async function exported(label,selected=content){
 const event=page.waitForEvent('download');await page.getByRole('button',{name:'Export encountered run',exact:true}).click();const path=`${folder}/reload-${label}.json`;await(await event).saveAs(path);const run=JSON.parse(readFileSync(path,'utf8'));
 const restored=e.importPortableV2(selected,run);expect(restored.ok,`${label}: exact edition replay`).toBe(true);
 return {run,state:restored.value};
}
async function durable(label,snapshot,selected=content){
 await ready();const key=`${selected.id}@${selected.version}:${e.contentHash(selected)}`;
 const slot=await page.evaluate(async key=>{
  const db=await new Promise((resolve,reject)=>{const request=indexedDB.open('literary-detective-v1');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
  try{return await new Promise((resolve,reject)=>{const request=db.transaction('slots','readonly').objectStore('slots').get(key);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}finally{db.close();}
 },key);
 expect(JSON.parse(slot.portable)).toEqual(snapshot.run);expect(slot.current.state).toEqual(snapshot.state);
 report.checkpoints.push({label,durable:true,version:selected.version,revision:slot.current.state.revision,commit:slot.commit,ownershipEpoch:slot.ownership?.epoch,portableMatchesCurrentExport:true});
 return slot.ownership;
}
async function action(id,label){
 const definition=content.scenes.flatMap(scene=>scene.choices).find(choice=>choice.id===id);
 await page.getByRole('button',{name:definition.label,exact:true}).click();count++;
 await ready();await expect(page.locator('.save-status')).toHaveText('Progress saved in this browser.');
 const snapshot=await exported(label);expect(snapshot.run.commands).toHaveLength(count);expect(snapshot.run.commands.at(-1).choiceId).toBe(id);await durable(label,snapshot);return snapshot;
}
try{
 await page.goto(base);await claim('fresh v5');await expect(page.locator('.offline-status')).toContainText('Ready for offline play',{timeout:30000});
 const opening=await exported('opening');expect(opening.run.commands).toHaveLength(0);expect(opening.run.content.version).toBe(5);expect(opening.run.content.hash).toBe(manifest.contentHash);
 const first=await action('o0.hear-noor','online-action-1');const firstOwner=await durable('before reload',first);
 await page.reload();await claim('online reload',{expectTakeover:true});const afterReload=await exported('after-online-claim');expect(afterReload.run).toEqual(first.run);const nextOwner=await durable('after online claim',afterReload);expect(nextOwner.ownerId).not.toBe(firstOwner.ownerId);expect(nextOwner.epoch).toBeGreaterThan(firstOwner.epoch);
 const second=await action('o0.keep-promise','online-action-2');
 report.checks.push('After ready settles, reload visibly requires explicit takeover; confirmation removes read-only state, changes ownership epoch and allows a second action that matches the persisted slot.');
 await expect(page.locator('.offline-status')).toContainText('Ready for offline play',{timeout:30000});await context.setOffline(true);
 await page.getByRole('link',{name:'Open the retained first movement',exact:true}).click();await claim('offline retained v4');await expect(page.locator('.offline-status')).toContainText('Ready for offline play');const v4=await exported('offline-v4',old4);expect(v4.run.content.version).toBe(4);expect(v4.run.commands).toHaveLength(0);await durable('v4 distinct saved slot',v4,old4);await expect(page.locator('.rebuild-world-canvas')).toHaveAttribute('data-loaded','true');
 await page.getByRole('link',{name:'Open the earlier bath prototype',exact:true}).click();await claim('offline retained v2');await expect(page.locator('.offline-status')).toContainText('Ready for offline play');const v2=await exported('offline-v2',old2);expect(v2.run.content.version).toBe(2);expect(v2.run.commands).toHaveLength(0);await durable('v2 distinct saved slot',v2,old2);await expect(page.locator('.bath-world-canvas')).toHaveAttribute('data-loaded','true');
 await page.getByRole('link',{name:'Open the current story',exact:true}).click();await claim('offline return to v5',{expectTakeover:true});await expect(page.locator('.offline-status')).toContainText('Ready for offline play');const returned=await exported('offline-returned-v5');expect(returned.run).toEqual(second.run);await durable('unchanged v5 on return',returned);
 const third=await action('o0.watch-release','offline-action-3');
 report.checks.push('Offline v5 → v4 → v2 → v5 navigation preserves distinct exact editions and saved slots; explicit claim on return enables the next real v5 action and persists it.');
 await page.reload();await claim('offline reload',{expectTakeover:true});const offlineReload=await exported('offline-reloaded');expect(offlineReload.run).toEqual(third.run);await durable('offline third action survives reload',offlineReload);
 const fourth=await action('o0.hold-root-kept','offline-action-4');
 await page.reload();await claim('final offline reload',{expectTakeover:true});const final=await exported('final');expect(final.run).toEqual(fourth.run);await durable('final exact persisted replay',final);
 await page.screenshot({path:`${folder}/reload-final-owned.png`,fullPage:true});
 report.checks.push('A further offline reload/claim enables another action; a final reload/claim retains its exact four-command run and leaves saving owned with the next action enabled.');
 expect(report.pageErrors).toEqual([]);report.status='PASS';
}catch(error){report.status='FAIL';report.failure=String(error);process.exitCode=1;await page.screenshot({path:`${folder}/reload-failure.png`,fullPage:true}).catch(()=>{});}
finally{report.pinsAfter=pins();report.stable=JSON.stringify(report.pinsBefore)===JSON.stringify(report.pinsAfter);await browser.close();writeFileSync(`${folder}/reload-check.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:report.status,checks:report.checks,checkpoints:report.checkpoints,pageErrors:report.pageErrors,failure:report.failure,stable:report.stable},null,2));}
