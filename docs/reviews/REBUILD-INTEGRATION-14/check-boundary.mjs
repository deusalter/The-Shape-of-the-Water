import {chromium,expect} from '@playwright/test';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const folder='docs/reviews/REBUILD-INTEGRATION-14';
const files=['src/components/EvidencePlayer.tsx','src/world/rebuild/RebuildWorld.tsx','src/world/rebuild/profiles.ts','src/world/rebuild/navigation.ts','src/world/rebuild/rebuild.css','src/Release.tsx','src/content/load-evidence.ts','src/content/selection.json','src/content/case-v4.json','src/content/case-v2.json','src/offline.ts','public/sw.js','tools/engine-offline-manifest.mjs','tools/blender/build-rebuild.py','public/world/rebuild/second-mouth-supper.glb','visual/rebuild/asset-manifest.json'];
const pins=()=>Object.fromEntries(files.map(file=>[file,createHash('sha256').update(readFileSync(file)).digest('hex')]));
const report={status:'RUNNING',date:new Date().toISOString(),scope:'Independent actual renderer boundary fixture. Production source and GLB; controlled props; no engine-gameplay, broad route, offline, performance, or accessibility claim.',pinsBefore:pins(),checks:[],pageErrors:[]};
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1250,height:1000},reducedMotion:'reduce'});
page.setDefaultTimeout(15000);page.on('pageerror',error=>report.pageErrors.push(error.message));
const url=`${process.env.REVIEW_DEV_URL??'http://localhost:4175'}/${folder}/renderer-fixture.html`;
const world=page.locator('.rebuild-world-canvas');
const set=patch=>page.evaluate(patch=>window.integration.set(patch),patch);
const snap=()=>page.evaluate(()=>window.integration.snapshot);
try{
 await page.goto(url);await expect(world).toHaveAttribute('data-loaded','true');await expect(page.locator('.rebuild-world-near')).toContainText('Leave the mouth open');
 // Events arrive after prop changes but before the next animation frame.
 await page.evaluate(()=>{window.integration.set({disabled:true});document.querySelector('.rebuild-world-canvas').dispatchEvent(new KeyboardEvent('keydown',{code:'KeyE',bubbles:true}));});
 expect(await page.evaluate(()=>window.integration.log)).toEqual([]);
 await page.evaluate(()=>{window.integration.set({disabled:false,offered:false});document.querySelector('.rebuild-world-canvas').dispatchEvent(new KeyboardEvent('keydown',{code:'KeyE',bubbles:true}));});
 expect(await page.evaluate(()=>window.integration.log)).toEqual([]);
 await set({offered:true});await expect(page.locator('.rebuild-world-near')).toBeVisible();await world.focus();await page.keyboard.press('KeyE');expect(await page.evaluate(()=>window.integration.log)).toEqual(['o0.keep-promise']);
 await page.evaluate(()=>{window.integration.set({sceneId:'o0.supper',variantId:'o0.supper.base'});document.querySelector('.rebuild-world-canvas').dispatchEvent(new KeyboardEvent('keydown',{code:'KeyE',bubbles:true}));});
 expect(await page.evaluate(()=>window.integration.log)).toEqual(['o0.keep-promise']);
 report.checks.push('Disabled, withdrawn, and prior-scene E actions rejected synchronously; offered nearby action dispatches its exact ID.');
 await set({sceneId:'o0.niche',variantId:'o0.niche.base',encounteredSourceIds:[]});await expect(world).toHaveAttribute('data-scene-id','o0.niche');
 const lowerBefore=await snap();expect(lowerBefore.DoraPlaceCast.position).toEqual([0,0,-2.35]);
 for(const name of ['Dora','DoraStanding','DoraKneeling','SpeakingPiece','NoorPanel','NoorWindow','SupperRoom'])expect(lowerBefore[name]?.visible,name).toBe(false);
 expect(lowerBefore.NoorLower.visible).toBe(true);expect(lowerBefore.LowerPassage.visible).toBe(true);
 await set({encounteredSourceIds:['o0.cast-removed']});await expect.poll(async()=>(await snap()).DoraPlaceCast.position).toEqual([2.1,-1.05,-3.6]);
 await set({encounteredSourceIds:[]});await expect.poll(async()=>(await snap()).DoraPlaceCast.position).toEqual([0,0,-2.35]);
 report.checks.push('Actual GLB lower scene excludes upstairs actors; encountered cast-removal source restages the cast in both directions without changing scene/variant.');
 await page.screenshot({path:`${folder}/lower-before.png`,fullPage:true});
 await set({sceneId:'o0.dry-departure',variantId:'o0.dry-departure.base',encounteredSourceIds:['o0.cast-removed']});await expect(world).toHaveAttribute('data-scene-id','o0.dry-departure');
 const dry=await snap();expect(dry.DoraStanding.visible).toBe(true);expect(dry.NoorLower.visible).toBe(false);expect(dry.NoorWindow.visible).toBe(false);expect(dry.SpeakingPiece.visible).toBe(false);
 report.checks.push('Dry departure stages the accompanying woman and does not carry Noor or the orchard speaking piece downstairs.');
 await set({sceneId:'o0.promise',variantId:'not-encountered'});await expect(world).toHaveCount(0);await expect(page.getByText('This passage is presented in text. Continue with the actions below.')).toBeVisible();
 await set({sceneId:'unknown-scene',variantId:'unknown-scene.base'});await expect(world).toHaveCount(0);
 await set({sceneId:'o0.promise',variantId:'o0.promise.base'});await expect(world).toHaveAttribute('data-loaded','true');await expect(page.locator('.rebuild-world-near')).toBeVisible();
 await world.focus();await page.keyboard.press('KeyE');expect(await page.evaluate(()=>window.integration.log)).toEqual(['o0.keep-promise','o0.keep-promise']);
 report.checks.push('Unknown scene and unknown variant use text-only fallback; remount dispatches only one callback.');
 // Keep one obsolete model load in flight, then resolve it after its renderer was cleaned up.
 let delayed,releaseDelayed,completed;const requested=new Promise(resolve=>{delayed=resolve;});const released=new Promise(resolve=>{releaseDelayed=resolve;});const handled=new Promise(resolve=>{completed=resolve;});
 await set({mounted:false});await expect(world).toHaveCount(0);
 await page.route('**/world/rebuild/second-mouth-supper.glb',async route=>{delayed();await released;await route.continue();completed();});
 await set({mounted:true});await requested;
 await set({mounted:false});await expect(world).toHaveCount(0);releaseDelayed();await handled;await page.unroute('**/world/rebuild/second-mouth-supper.glb');
 await set({mounted:true});await expect(world).toHaveAttribute('data-loaded','true');await expect(page.locator('.rebuild-world-canvas canvas')).toHaveCount(1);
 await world.focus();await page.keyboard.press('KeyE');expect(await page.evaluate(()=>window.integration.log)).toEqual(['o0.keep-promise','o0.keep-promise','o0.keep-promise']);
 report.checks.push('In-flight load resolved after unmount cannot revive obsolete renderer; remount has one canvas and one action callback.');
 expect(report.pageErrors).toEqual([]);report.status='PASS';
}catch(error){report.status='FAIL';report.failure=String(error);process.exitCode=1;}
finally{report.pinsAfter=pins();report.stable=JSON.stringify(report.pinsBefore)===JSON.stringify(report.pinsAfter);await browser.close();writeFileSync(`${folder}/boundary-check.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));}
