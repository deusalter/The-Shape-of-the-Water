import {build} from 'esbuild';
import {chromium,expect} from '@playwright/test';
import {mkdtempSync,readFileSync,writeFileSync,rmSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {createServer} from 'node:http';
import {createHash} from 'node:crypto';

const output=resolve(process.env.RENDERER_REPORT_DIR??'docs/execution/evidence/mercy-optimization/renderer');mkdirSync(output,{recursive:true});
const temporary=mkdtempSync(join(tmpdir(),'mercy-renderer-'));
const hash=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const report={status:'RUNNING',scope:'Actual Chromium renderer fixture; software WebGL, no hardware FPS claim. Visibility is simulated with document.hidden; offscreen suspension uses actual intersection/scroll.',contentSha256:hash('src/content/case-v7.json'),sourceSha256:hash('src/world/mercy/MercyWorld.tsx'),sourcePins:Object.fromEntries(['src/world/mercy/MercyWorld.tsx','src/world/mercy/geometry.ts','src/world/mercy/lighting.ts','src/world/mercy/mercy.css'].map(path=>[path,hash(path)])),checks:[],errors:[],metrics:{}};
const bundle=await build({stdin:{contents:`
 import React,{useState} from 'react';import {createRoot} from 'react-dom/client';
 import {MercyWorld} from './src/world/mercy/MercyWorld';import {sceneProfiles} from './src/world/mercy/profiles';import {physicalStageKey} from './src/world/mercy/physicalStage';
 window.fixtureProfiles=Object.entries(sceneProfiles).map(([key,p])=>({...p,key,physicalKey:physicalStageKey(p)}));
 window.chosen=[];
 function Fixture(){const [selection,setSelection]=useState({key:window.fixtureProfiles[0].key,disabled:false,label:'Visible',visible:true});window.fixtureSet=update=>setSelection(old=>({...old,...update}));const p=sceneProfiles[selection.key];return <><div id="top">{selection.visible&&<MercyWorld sceneId={p.id} variantId={p.variantId} choices={p.choiceIds.map(id=>({id,label:selection.label+' '+id}))} disabled={selection.disabled} onChoose={id=>window.chosen.push(id)}/>}</div><div style={{height:2500}}>Scroll fixture</div></>;}
 createRoot(document.getElementById('root')).render(<Fixture/>);
 `,resolveDir:process.cwd(),loader:'tsx'},bundle:true,platform:'browser',format:'esm',outfile:join(temporary,'fixture.js'),minify:true,define:{'process.env.NODE_ENV':'"production"'},logLevel:'silent'});
writeFileSync(join(temporary,'index.html'),'<html><head><link rel="stylesheet" href="/fixture.css"></head><body style="margin:0"><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>');
const server=createServer((req,res)=>{const name=req.url==='/fixture.js'?'fixture.js':req.url==='/fixture.css'?'fixture.css':'index.html';res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':'text/html');res.end(readFileSync(join(temporary,name)));});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1100,height:800}});
await page.addInitScript(()=>{
 const lifecycle=window.fixtureLifecycle={frames:0,resize:0,intersection:0,visibility:0,blur:0};
 const pending=new Set(),request=window.requestAnimationFrame,cancel=window.cancelAnimationFrame;
 window.requestAnimationFrame=callback=>{const id=request.call(window,now=>{pending.delete(id);lifecycle.frames=pending.size;callback(now);});pending.add(id);lifecycle.frames=pending.size;return id;};
 window.cancelAnimationFrame=id=>{pending.delete(id);lifecycle.frames=pending.size;cancel.call(window,id);};
 for(const [target,type,key] of [[document,'visibilitychange','visibility'],[window,'blur','blur']]){
  const listeners=new Set(),add=target.addEventListener,remove=target.removeEventListener;
  target.addEventListener=function(event,listener,options){if(event===type){listeners.add(listener);lifecycle[key]=listeners.size;}return add.call(this,event,listener,options);};
  target.removeEventListener=function(event,listener,options){if(event===type){listeners.delete(listener);lifecycle[key]=listeners.size;}return remove.call(this,event,listener,options);};
 }
 for(const [name,key] of [['ResizeObserver','resize'],['IntersectionObserver','intersection']]){
  const Original=window[name];window[name]=class extends Original{active=true;constructor(...args){super(...args);lifecycle[key]++;}disconnect(){if(this.active){lifecycle[key]--;this.active=false;}super.disconnect();}};
 }
});
page.on('pageerror',error=>report.errors.push(String(error)));
page.on('console',message=>{if(message.type()==='error')report.errors.push(message.text());});
const host=page.locator('.mercy-world-canvas');
const data=()=>host.evaluate(el=>({...el.dataset}));
async function settle(){let last=-1;for(let i=0;i<40;i++){const frames=Number((await data()).renderFrames);await page.waitForTimeout(150);const next=Number((await data()).renderFrames);if(frames===next&&next===last)return next;last=next;}throw Error('Renderer did not settle');}
async function select(p,extra={}){await page.evaluate(update=>window.fixtureSet(update),{key:p.key,...extra});await expect(host).toHaveAttribute('data-scene-id',p.id);await expect(host).toHaveAttribute('data-variant-id',p.variantId??'');}
async function check(name,fn){await fn();report.checks.push(name);}
try{
 await page.goto(`http://127.0.0.1:${server.address().port}/`);await expect(host).toHaveAttribute('data-render-frames',/^[1-9]/);await settle();
 const profiles=await page.evaluate(()=>window.fixtureProfiles);
 await check('idle performs zero repeated renders',async()=>{const before=await data();await page.waitForTimeout(1200);const after=await data();expect(after.renderFrames).toBe(before.renderFrames);expect(after.shadowUpdates).toBe(before.shadowUpdates);report.metrics.idle={intervalMs:1200,renderFrames:Number(after.renderFrames)-Number(before.renderFrames),shadowUpdates:Number(after.shadowUpdates)-Number(before.shadowUpdates)};});
 await check('camera controls wake at rest without recalculating shadows',async()=>{const before=await data();await page.getByRole('button',{name:'Turn camera right'}).click();await settle();const after=await data();expect(Number(after.renderFrames)).toBeGreaterThan(Number(before.renderFrames));expect(after.shadowUpdates).toBe(before.shadowUpdates);expect(after.targets).not.toBe(before.targets);await page.getByRole('button',{name:'Reset camera'}).click();await settle();});
 await check('keyboard movement, key release and camera settling remain active',async()=>{const before=await data();await host.focus();await page.keyboard.down('ArrowUp');await page.waitForTimeout(350);await page.keyboard.up('ArrowUp');await settle();const after=await data();expect(after.playerZ).not.toBe(before.playerZ);expect(Number(after.shadowUpdates)).toBeGreaterThan(Number(before.shadowUpdates));report.metrics.movement={renderFrames:Number(after.renderFrames)-Number(before.renderFrames),shadowUpdates:Number(after.shadowUpdates)-Number(before.shadowUpdates),before:{x:before.playerX,z:before.playerZ},after:{x:after.playerX,z:after.playerZ}};});
 const groups=new Map();for(const p of profiles){const group=groups.get(p.physicalKey)??[];group.push(p);groups.set(p.physicalKey,group);}
 const equivalent=[...groups.values()].find(group=>new Set(group.map(p=>p.id)).size>1);if(!equivalent)throw Error('No equivalent physical scene pair');
 const first=equivalent[0],second=equivalent.find(p=>p.id!==first.id);
 await check('identical physical scenes reuse their environment while refreshing choices',async()=>{await select(first);await settle();const before=await data();await select(second);await settle();const after=await data();expect(after.environmentBuilds).toBe(before.environmentBuilds);expect(after.visibleModels).toBe(second.actors.map(a=>a.name).join(','));expect(after.visibleProps).toBe(second.props.join(','));expect(JSON.parse(after.targets).map(t=>t.choiceId)).toEqual(second.choiceIds);report.metrics.reusedPair={first:first.key,second:second.key,environmentBuilds:Number(after.environmentBuilds)-Number(before.environmentBuilds)};});
 await check('changed physical staging replaces the environment',async()=>{const before=await data(),different=profiles.find(p=>p.physicalKey!==second.physicalKey);await select(different);await settle();expect(Number((await data()).environmentBuilds)).toBe(Number(before.environmentBuilds)+1);});
 await check('all current profiles publish exact offered targets, cast and props',async()=>{for(const p of profiles){const before=await data();await select(p);if(before.sceneId!==p.id||before.variantId!==(p.variantId??''))await expect.poll(async()=>Number((await data()).renderFrames)).toBeGreaterThan(Number(before.renderFrames));await expect.poll(async()=>JSON.parse((await data()).targets).map(t=>t.choiceId)).toEqual(p.choiceIds);const current=await data();expect(current.visibleModels,p.key).toBe(p.actors.map(a=>a.name).join(','));expect(current.visibleProps,p.key).toBe(p.props.join(','));}await settle();report.metrics.profiles=profiles.length;});
 const walking=profiles.find(p=>p.location==='theatre'&&p.choiceIds.length>0);
 await check('pointer walk and nearby E keep current proximity interaction',async()=>{await select(walking);await settle();await host.focus();await page.keyboard.press('KeyE');expect(await page.evaluate(()=>window.chosen.length)).toBe(0);const target=JSON.parse((await data()).targets)[0],bounds=await host.boundingBox();await page.mouse.click(bounds.x+target.screenX,bounds.y+target.screenY);await expect(page.locator('.mercy-world-near')).toBeVisible({timeout:10000});await page.keyboard.press('KeyE');expect(await page.evaluate(()=>window.chosen)).toEqual([walking.choiceIds[0]]);await settle();});
 await check('label changes refresh targets without rebuilding physical staging',async()=>{const before=await data();await select(walking,{label:'Revised visible'});await settle();const after=await data();expect(after.environmentBuilds).toBe(before.environmentBuilds);expect(JSON.parse(after.targets).map(({choiceId,x,z})=>({choiceId,x,z}))).toEqual(JSON.parse(before.targets).map(({choiceId,x,z})=>({choiceId,x,z})));expect(after.playerZ).toBe('1.000');});
 await check('disabling while moving stops movement and rejects E',async()=>{await host.focus();await page.keyboard.down('ArrowUp');await page.waitForTimeout(150);await select(walking,{disabled:true});await settle();const before=await data();await page.waitForTimeout(250);expect((await data()).playerZ).toBe(before.playerZ);await page.keyboard.press('KeyE');expect(await page.evaluate(()=>window.chosen.length)).toBe(1);await page.keyboard.up('ArrowUp');await select(walking,{disabled:false});await settle();});
 await check('offscreen progression updates logical metadata and builds only the final visible stage',async()=>{await page.evaluate(()=>window.scrollTo(0,1500));await page.waitForTimeout(300);const before=await data();const different=profiles.find(p=>p.physicalKey!==walking.physicalKey);await select(different);await page.waitForTimeout(200);expect((await data()).renderFrames).toBe(before.renderFrames);expect((await data()).environmentBuilds).toBe(before.environmentBuilds);expect(JSON.parse((await data()).targets).map(t=>t.choiceId)).toEqual(different.choiceIds);await select(walking);await page.evaluate(()=>window.scrollTo(0,0));await settle();expect((await data()).environmentBuilds).toBe(before.environmentBuilds);});
 await check('visibility suspension retains a pending camera wake',async()=>{await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});const before=await data();await page.evaluate(()=>document.querySelector('[aria-label="Turn camera left"]').click());await page.waitForTimeout(250);expect((await data()).renderFrames).toBe(before.renderFrames);await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});await settle();expect(Number((await data()).renderFrames)).toBeGreaterThan(Number(before.renderFrames));});
 await check('unmount cleans canvas, pending frames, observers and external listeners; remount works',async()=>{await page.evaluate(()=>window.fixtureSet({visible:false}));await expect(host).toHaveCount(0);await page.waitForTimeout(200);const cleanup=await page.evaluate(()=>window.fixtureLifecycle);expect(cleanup).toEqual({frames:0,resize:0,intersection:0,visibility:0,blur:0});report.metrics.cleanup=cleanup;await page.evaluate(()=>window.fixtureSet({visible:true}));await expect(host).toHaveAttribute('data-render-frames',/^[1-9]/);await settle();expect((await data()).environmentBuilds).toBe('1');expect(await page.evaluate(()=>window.fixtureLifecycle)).toEqual({frames:0,resize:1,intersection:1,visibility:1,blur:1});});
 for(const location of [...new Set(profiles.map(p=>p.location))]){const p=profiles.find(p=>p.location===location);await select(p);await settle();await page.locator('.mercy-world').screenshot({path:join(output,location+'.png')});}
 expect(report.errors).toEqual([]);report.status='PASS';
}catch(error){report.status='FAIL';report.errors.push(String(error));throw error;}
finally{writeFileSync(join(output,'browser-check.json'),JSON.stringify(report,null,2)+'\n');await browser.close();await new Promise(done=>server.close(done));rmSync(temporary,{recursive:true,force:true});}
console.log(JSON.stringify(report,null,2));
