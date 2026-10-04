import * as THREE from 'three';
import {chromium,expect} from '@playwright/test';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
const folder='docs/execution/evidence/second-mouth-integration/browser';
const pin=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const inputs=['src/components/EvidencePlayer.tsx','src/world/rebuild/RebuildWorld.tsx','src/world/rebuild/profiles.ts','src/content/case-v4.json','dist-player/asset-manifest.json'];
const report={status:'RUNNING',scope:'Built player spatial action to actual engine/save, one opening route only',sourcePins:Object.fromEntries(inputs.map(p=>[p,pin(p)])),checks:[],errors:[]};
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});page.setDefaultTimeout(20000);page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto(process.env.PLAYER_TEST_URL??'http://localhost:4190/');const world=page.locator('.rebuild-world-canvas');await expect(world).toHaveAttribute('data-loaded','true');await expect(world).toHaveAttribute('data-scene-id','o0.supper');await expect(page.locator('.save-status')).toContainText('Progress saved');
 await world.focus();await page.keyboard.press('KeyE');await expect(page.locator('#passage-title')).toHaveText('The difficult note');
 const rect=await world.boundingBox(),camera=new THREE.OrthographicCamera(-8.8*rect.width/rect.height,8.8*rect.width/rect.height,8.8,-8.8,.1,120);
 camera.position.set(-3.15+Math.sin(Math.PI/4)*20,18.9,2.5+Math.cos(Math.PI/4)*20);camera.lookAt(-3.15,.9,2.5);camera.updateMatrixWorld();
 report.beforeClick=await world.evaluate(e=>({...e.dataset,rect:e.getBoundingClientRect().toJSON()}));
 const floorPoint=new THREE.Vector3(-2.4,0,-3.7).project(camera);report.click={x:rect.x+(floorPoint.x+1)/2*rect.width,y:rect.y+(1-floorPoint.y)/2*rect.height};await page.mouse.click(report.click.x,report.click.y);await page.waitForTimeout(4000);report.afterClick=await world.evaluate(e=>({...e.dataset,rect:e.getBoundingClientRect().toJSON()}));await page.screenshot({path:`${folder}/spatial-click-diagnostic.png`,fullPage:true});
 await expect(page.locator('.rebuild-world-near')).toContainText('Listen to Noor',{timeout:15000});await world.focus();await page.keyboard.press('KeyE');await expect(page.locator('#passage-title')).toHaveText('Three screws');await expect(page.locator('.save-status')).toContainText('Progress saved');
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'Export encountered run',exact:true}).click();await(await download).saveAs(`${folder}/spatial-opening.run.json`);
 const run=JSON.parse(readFileSync(`${folder}/spatial-opening.run.json`));expect(run.commands).toHaveLength(1);expect(run.commands[0].choiceId).toBe('o0.hear-noor');
 const bundle=await build({entryPoints:['src/engine/evidence-v2.ts'],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'});const engine=await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);const content=engine.validateContentV2(JSON.parse(readFileSync('src/content/case-v4.json')));expect(content.ok).toBe(true);expect(engine.importPortableV2(content.value,run).ok).toBe(true);
 await page.screenshot({path:`${folder}/spatial-opening-action.png`,fullPage:true});expect(report.errors).toEqual([]);report.checks=['Far E leaves opening unchanged','Floor click navigates to currently offered action','Near E advances actual engine to Three screws','Saved export has exactly one authored command and replays'];report.status='PASS';
}catch(error){report.failure=String(error);report.status='FAIL';}finally{report.sourceStable=inputs.every(p=>pin(p)===report.sourcePins[p]);await browser.close();writeFileSync(`${folder}/spatial-check.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));if(report.status!=='PASS')process.exitCode=1;}
