import {chromium,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
const output='docs/execution/evidence/visual-design/final-ui';mkdirSync(output,{recursive:true});
const manifest=JSON.parse(readFileSync('dist-player/asset-manifest.json','utf8'));
const report={status:'RUNNING',scope:'Final CSS-only contrast revision: actual built player with open notebook, save takeover alert, text-focus/large reading controls, narrow layout, browser axe and exact saved-action reload. Earlier four full story witnesses retain unchanged renderer/story/engine inputs.',assetBuild:manifest.version,cssSha256:createHash('sha256').update(readFileSync('src/components/evidence-player.css')).digest('hex'),checks:[],accessibility:[],errors:[]};
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const context=await browser.newContext({viewport:{width:1440,height:1000}});
const page=await context.newPage();page.on('pageerror',error=>report.errors.push(error.message));
async function exportRun(){const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Export encountered run',exact:true}).click();return JSON.parse(readFileSync(await (await pending).path(),'utf8'));}
try{
 await page.goto('http://127.0.0.1:4187');await expect(page.locator('.mercy-world-canvas')).toHaveAttribute('data-loaded','true');await expect(page.locator('.save-status')).toContainText('Progress saved');
 await expect(page.locator('.offline-status')).toContainText('Ready for offline play');
 expect(await page.evaluate(async()=>(await (await fetch('asset-manifest.json')).json()).version)).toBe(manifest.version);
 await page.screenshot({path:output+'/opening.png'});await page.locator('.mercy-world').screenshot({path:output+'/opening-world.png'});
 await page.getByRole('button',{name:'Open notebook',exact:true}).click();await expect(page.locator('#investigation-notebook')).toBeVisible();
 for(const width of [1440,390,320]){await page.setViewportSize({width,height:950});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);const axe=await new AxeBuilder({page}).analyze();report.accessibility.push({width,violations:axe.violations,incomplete:axe.incomplete.map(item=>item.id)});expect(axe.violations).toEqual([]);await page.screenshot({path:output+'/notebook-'+width+'.png',fullPage:true});}
 report.checks.push('New build verified in browser; notebook open at1440/390/320 has no overflow or axe violations. Incomplete checks remain manual limits.');
 await page.getByLabel('Text size').selectOption('large');await page.getByRole('button',{name:'Focus on text',exact:true}).click();await expect(page.locator('.mercy-world')).toHaveCount(0);await expect(page.locator('.reader-large')).toHaveCount(1);await page.getByRole('button',{name:'Show the world',exact:true}).click();await expect(page.locator('.mercy-world-canvas')).toHaveAttribute('data-loaded','true');
 await page.getByRole('button',{name:'Close notebook',exact:true}).click();await page.setViewportSize({width:1440,height:1000});
 await page.locator('.choices button').first().click();const confirm=page.getByRole('button',{name:'Confirm action',exact:true});if(await confirm.isVisible())await confirm.click();await expect(page.locator('.save-status')).toContainText('Progress saved');const saved=await exportRun();
 await page.reload();await expect(page.locator('.saving-warning')).toBeVisible();const alertColor=await page.locator('.saving-warning').evaluate(el=>getComputedStyle(el).color);expect(alertColor).toBe('rgb(49, 45, 50)');
 await page.getByRole('button',{name:'Take over saving',exact:true}).click();await page.getByRole('button',{name:'Confirm action',exact:true}).click();await expect(page.locator('.saving-warning')).toHaveCount(0);expect(await exportRun()).toEqual(saved);
 report.checks.push('Large reading/text-focus and world remount work; actual saved action reload/takeover preserves exact export and readable pale alert.');
 await page.context().setOffline(true);await page.reload();expect(await exportRun()).toEqual(saved);report.checks.push('Final build reloads offline with the exact saved run.');
 expect(report.errors).toEqual([]);report.status='PASS';
}catch(error){report.status='FAIL';report.failure=String(error);process.exitCode=1;}
finally{await browser.close();writeFileSync(output+'/CHECK.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));}
