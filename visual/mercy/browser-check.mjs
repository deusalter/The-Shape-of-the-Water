import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const stagingBytes=await readFile('src/world/mercy/staging.json');const staging=JSON.parse(stagingBytes);const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const rendererFiles=['src/world/mercy/MercyWorld.tsx','src/world/mercy/profiles.ts','src/world/mercy/navigation.ts','src/world/mercy/geometry.ts','src/world/mercy/mercy.css'];const rendererSourceHashes=Object.fromEntries(await Promise.all(rendererFiles.map(async file=>[file,hash(await readFile(file))])));

const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1120,height:850},deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://localhost:4173/visual/mercy/fixture.html');await page.waitForFunction(()=>document.querySelector('.mercy-world-canvas')?.dataset.loaded==='true');
const output='visual/mercy/screenshots';await mkdir(output,{recursive:true});const profiles=await page.evaluate(()=>window.mercyFixture.profiles),coverage=[];const captured=new Set();
for(const profile of profiles){
 await page.evaluate(({scene,variant})=>window.mercyFixture.setScene(scene,variant),profile);await page.waitForFunction(({scene,variant})=>{const el=document.querySelector('.mercy-world-canvas');return el?.dataset.sceneId===scene&&el.dataset.variantId===(variant??'');},profile);
 const result=await page.locator('.mercy-world-canvas').evaluate(el=>({scene:el.dataset.sceneId,variant:el.dataset.variantId,location:el.dataset.location,models:el.dataset.visibleModels,props:el.dataset.visibleProps,drawCalls:Number(el.dataset.drawCalls),triangles:Number(el.dataset.triangles)}));
 expect(result.models).toBe(profile.actors.map(a=>a.name).join(','));expect(result.props).toBe(profile.props.join(','));coverage.push(result);
 if(!captured.has(profile.location)){captured.add(profile.location);await page.screenshot({path:`${output}/${profile.location}.png`});}
}
const playable=profiles.find(p=>p.targets.length&&!p.variant);await page.evaluate(p=>window.mercyFixture.setScene(p.scene),playable);await page.waitForFunction(id=>document.querySelector('.mercy-world-canvas')?.dataset.sceneId===id,playable.scene);
const host=page.locator('.mercy-world-canvas');await host.focus();const before=await host.evaluate(el=>({x:Number(el.dataset.playerX),z:Number(el.dataset.playerZ)}));await page.keyboard.down('KeyW');await page.waitForTimeout(450);await page.keyboard.up('KeyW');const moved=await host.evaluate(el=>({x:Number(el.dataset.playerX),z:Number(el.dataset.playerZ)}));expect(Math.hypot(moved.x-before.x,moved.z-before.z)).toBeGreaterThan(.2);
const target=await host.evaluate(el=>JSON.parse(el.dataset.targets)[0]);const bounds=await host.boundingBox();await page.mouse.click(bounds.x+target.screenX,bounds.y+target.screenY);await expect(page.locator('.mercy-world-near')).toBeVisible({timeout:10000});await page.keyboard.press('KeyE');const dispatch=await page.evaluate(()=>window.mercyFixture.dispatches.slice());expect(dispatch).toEqual([target.choiceId]);
await page.evaluate(()=>window.mercyFixture.setDisabled(true));await expect(page.locator('.mercy-world-near')).toHaveCount(0);await page.keyboard.press('KeyE');const disabledDispatch=await page.evaluate(()=>window.mercyFixture.dispatches.length);expect(disabledDispatch).toBe(1);
await page.evaluate(()=>{window.mercyFixture.setDisabled(false);window.mercyFixture.setChoices(['unknown.hidden']);});await page.waitForFunction(()=>JSON.parse(document.querySelector('.mercy-world-canvas').dataset.targets).length===0);await page.keyboard.press('KeyE');const hiddenDispatch=await page.evaluate(()=>window.mercyFixture.dispatches.length);expect(hiddenDispatch).toBe(1);
let overflow=false;for(const width of [320,390]){await page.setViewportSize({width,height:760});await page.evaluate(id=>window.mercyFixture.setScene(id),playable.scene);await page.waitForTimeout(150);await page.screenshot({path:`${output}/mobile-${width}.png`});overflow ||=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);}
await page.locator('button[aria-label="Turn camera left"]').click();await page.locator('button[aria-label="Reset camera"]').click();
if(hash(await readFile('src/world/mercy/staging.json'))!==hash(stagingBytes))throw new Error('Staging changed during capture');
await writeFile('visual/mercy/BROWSER-CHECK.json',JSON.stringify({contentSha256:staging.contentSha256,stagingSha256:staging.sourceSha256,rendererStagingSha256:hash(stagingBytes),rendererSourceHashes,checkedAt:new Date().toISOString(),fixture:'isolated renderer, exact current compiler staging; no engine progression',profileCount:coverage.length,coverage,moved,dispatch,disabledDispatch,hiddenDispatch,errors,overflow},null,2)+'\n');await browser.close();
if(errors.length||overflow)throw new Error('Fixture rendering failed');console.log({profiles:coverage.length,moved,dispatch,errors,overflow});
