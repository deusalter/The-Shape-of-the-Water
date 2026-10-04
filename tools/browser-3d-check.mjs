import {chromium,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const folder=process.env.BROWSER_REPORT_DIR??'docs/execution/evidence/3d-first-bath';mkdirSync(folder,{recursive:true});
const hash=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const report={status:'RUNNING',model:hash('public/world/bath-faceless.glb'),sourceHashes:Object.fromEntries(['src/world/BathWorld.tsx','src/world/navigation.ts','src/world/staging.ts','src/components/EvidencePlayer.tsx'].map(path=>[path,hash(path)])),checks:[],errors:[],limits:['first-night world only','Blender scene is provisional spatial staging, not a measured apparatus','no human playtest','Chromium only']};
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),page=await context.newPage();page.setDefaultTimeout(15000);page.on('pageerror',error=>report.errors.push(error.message));
 await page.goto(process.env.PLAYER_TEST_URL??'http://localhost:4175');
 const world=page.locator('.bath-world-canvas');await expect(world).toHaveAttribute('data-loaded','true');await expect(world.locator('canvas')).toBeVisible();await expect(page.locator('img[src*="march"],img[src*="vane"],img[src*="verney"],img[src*="bloom"]')).toHaveCount(0);
 await expect(page.locator('.save-status')).toContainText(/saved|loaded/i);
 await page.screenshot({path:`${folder}/bath-1440.png`,fullPage:true});
 const before=await world.getAttribute('data-player-z');await world.focus();await page.keyboard.down('ArrowUp');try{await expect(page.locator('.world-near')).toContainText('Ask Ada to show you the cut cord.',{timeout:8000});}finally{await page.keyboard.up('ArrowUp');}expect(await world.getAttribute('data-player-z')).not.toBe(before);report.checks.push('Real keyboard movement in loaded Blender model');
 await page.getByRole('button',{name:'Turn camera right',exact:true}).click();await page.screenshot({path:`${folder}/camera-turned.png`});
 await page.getByRole('button',{name:'Reset camera angle',exact:true}).click();
 // Approach the actual arrival position and perform the offered engine action from the world.
 await world.focus();await expect(page.locator('.world-near')).toContainText('Ask Ada to show you the cut cord.');await page.keyboard.press('KeyE');await expect(page.locator('#passage-title')).toHaveText('The missing alto');report.checks.push('Proximity interaction dispatches a real authored choice through the existing engine');
 await expect(world).toHaveAttribute('data-player-x','-6.30');report.checks.push('Authored travel stages Blaise at the current conversation');
 await page.getByRole('button',{name:'Take the cord to the empty cabinet for a test.',exact:true}).click();await expect(page.locator('#passage-title')).toHaveText('An empty test');
 await page.getByText('Inspect the empty test',{exact:true}).click();await expect(page.locator('.encounter-art img')).toHaveCount(1);report.checks.push('Controlled evidence diagram remains accessible without portraits');
 for(const width of [1440,390,320]){await page.setViewportSize({width,height:1000});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await page.screenshot({path:`${folder}/release-${width}.png`,fullPage:true});}
 const axe=await new AxeBuilder({page}).analyze();writeFileSync(`${folder}/axe.json`,JSON.stringify(axe,null,2));expect(axe.violations).toEqual([]);report.checks.push({accessibilityViolations:0,incomplete:axe.incomplete.length});
 expect(report.errors).toEqual([]);report.status='PASS';
}catch(error){report.status='FAIL';report.failure=String(error);}finally{await browser.close();writeFileSync(`${folder}/report.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));if(report.status!=='PASS')process.exitCode=1;}
