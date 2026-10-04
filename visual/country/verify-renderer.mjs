import * as THREE from 'three';
import {chromium,expect} from '@playwright/test';
import {writeFileSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const dir='visual/country',hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const staging=JSON.parse(readFileSync('narrative/rebuild/STAGING-V5.json'));
const groups={'orchard-roof':'OrchardWedding','orchard-cradle':'OrchardWedding','orchard-root':'OrchardWedding','orchard-path':'OrchardWedding',theatre:'DryTheatre','theatre-floor':'DryTheatre','theatre-stage':'DryTheatre','theatre-door':'DryTheatre',house:'LowHouse'};
const report={scope:'Actual CountryWorld fixture with compiled offered ids, not integrated narrative playthrough',status:'RUNNING',checks:[],errors:[],limits:['Chromium software WebGL only','No engine action dispatch or human playtesting in this fixture','No assistive technology or hardware performance certification'],sourceHashes:Object.fromEntries(['src/world/country/CountryWorld.tsx','src/world/country/profiles.ts','src/world/country/navigation.ts','public/world/country/first-country-locations.glb','src/content/case-v5.json'].map(p=>[p,hash(p)]))};
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});page.setDefaultTimeout(20000);page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto(`${process.env.COUNTRY_PREVIEW_URL??'http://localhost:4192'}/visual/country/runtime-preview.html`);
 const world=page.locator('.country-world-canvas');await expect(world).toHaveAttribute('data-loaded','true');await expect(world).toHaveAttribute('data-geometry-group','OrchardWedding');
 await page.screenshot({path:`${dir}/runtime-orchard-1440.png`,fullPage:true});
 const before=await world.getAttribute('data-player-x');await world.focus();await page.keyboard.down('KeyD');await expect(world).not.toHaveAttribute('data-player-x',before);await page.keyboard.up('KeyD');report.checks.push('Keyboard moves male faceless Blaise in the original GLB');
 await world.focus();await page.keyboard.press('KeyE');await expect(page.getByLabel('Fixture callbacks')).toHaveText('[]');report.checks.push('Far offered action rejects E');
 const rect=await world.boundingBox(),x=Number(await world.getAttribute('data-player-x')),z=Number(await world.getAttribute('data-player-z'));
 const camera=new THREE.OrthographicCamera(-8.8*rect.width/rect.height,8.8*rect.width/rect.height,8.8,-8.8,.1,120);camera.position.set(x+Math.sin(Math.PI/4)*20,18.9,z+Math.cos(Math.PI/4)*20);camera.lookAt(x,.9,z);camera.updateMatrixWorld();
 const point=new THREE.Vector3(-5,0,-3.25).project(camera);await page.mouse.click(rect.x+(point.x+1)/2*rect.width,rect.y+(1-point.y)/2*rect.height);
 await expect(page.locator('.country-world-near')).toBeVisible({timeout:20000});await world.focus();await page.keyboard.press('KeyE');await expect(page.getByLabel('Fixture callbacks')).toHaveText('["o0.follow-rain-strip"]');report.checks.push('Floor click routes around furniture; near E dispatches exact offered choice');
 await page.getByRole('button',{name:'o0.cradle-account',exact:true}).click();await expect(page.locator('.country-world-near')).toBeVisible({timeout:20000});await world.focus();await page.keyboard.press('KeyE');await expect(page.getByLabel('Fixture callbacks')).toHaveText('["o0.follow-rain-strip","o0.make-cradle-rubbing"]');
 await page.getByRole('button',{name:'Toggle disabled',exact:true}).click();await world.focus();await page.keyboard.press('KeyE');await expect(page.getByLabel('Fixture callbacks')).toHaveText('["o0.follow-rain-strip","o0.make-cradle-rubbing"]');
 await page.getByRole('button',{name:'Toggle disabled',exact:true}).click();await page.getByRole('button',{name:'Toggle offered choices',exact:true}).click();await world.focus();await page.keyboard.press('KeyE');await expect(page.getByLabel('Fixture callbacks')).toHaveText('["o0.follow-rain-strip","o0.make-cradle-rubbing"]');await expect(page.locator('.country-world-near')).toHaveCount(0);await page.getByRole('button',{name:'Toggle offered choices',exact:true}).click();report.checks.push('Disabled and withdrawn stale actions reject E');
 let variantCount=0;
 for(const entry of staging.newScenes){for(const variant of [`${entry.sceneId}.base`,...entry.variantIds]){
  await page.evaluate(({id,variant})=>window.stageFixture(id,variant),{id:entry.sceneId,variant});await expect(world).toHaveAttribute('data-scene-id',entry.sceneId);await expect(world).toHaveAttribute('data-geometry-group',groups[entry.area]);await expect(world).toHaveAttribute('data-variant-id',variant);variantCount++;
  if(entry.sceneId==='o0.house-window')expect(await world.getAttribute('data-visible-models')).not.toMatch(/Rene|Basil|TableDora|DoraRoot/);
  if(entry.sceneId==='o0.house-door')expect(await world.getAttribute('data-visible-models')).toContain('Rene');
 }}report.checks.push(`All ${staging.newScenes.length} exact new scenes and ${variantCount} scene/variant projections use their actual authored area`);
 for(const id of ['o0.orchard-report','o0.source-floor','o0.house-window','o0.rene-arrival']){await page.evaluate(id=>window.stageFixture(id),id);await expect(world).toHaveAttribute('data-scene-id',id);await page.screenshot({path:`${dir}/runtime-${id.slice(3)}-1440.png`,fullPage:true});}
 for(const width of [390,320]){await page.setViewportSize({width,height:1000});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await page.screenshot({path:`${dir}/runtime-house-${width}.png`,fullPage:true});}report.checks.push('Global-styles fixture fits 390px and 320px widths');
 await page.getByRole('button',{name:'unmapped-passage',exact:true}).click();await expect(world).toHaveCount(0);await expect(page.getByText('This passage is presented in text. Continue with the actions below.')).toBeVisible();
 await page.getByRole('button',{name:'o0.house-window',exact:true}).click();await expect(world).toHaveAttribute('data-loaded','true');await page.getByRole('button',{name:'Toggle mounted',exact:true}).click();await expect(world).toHaveCount(0);await page.getByRole('button',{name:'Toggle mounted',exact:true}).click();await expect(world).toHaveAttribute('data-loaded','true');report.checks.push('Unknown scene fallback and cleanup/remount succeed');
 expect(report.errors).toEqual([]);report.status='PASS';
}catch(e){report.status='FAIL';report.failure=String(e);process.exitCode=1;}finally{await browser.close();writeFileSync(`${dir}/renderer-check.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));}
