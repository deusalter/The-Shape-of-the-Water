import {chromium,expect} from '@playwright/test';
import {readFileSync,writeFileSync,readdirSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';

const folder='docs/execution/evidence/country-integration';
mkdirSync(folder,{recursive:true});
const base=process.env.REVIEW_STUDIO_URL??'http://localhost:4191/studio.html';
const hash=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const walk=path=>readdirSync(path,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(`${path}/${entry.name}`):[`${path}/${entry.name}`]);
const files=['src/studio-main.tsx','src/studio/EvidenceStudio.tsx','src/studio/preview-scenario.ts','src/studio/project.ts','src/persistence/author-project.ts','src/components/EvidencePlayer.tsx','src/content/load-evidence.ts','src/content/selection.json','src/content/case-v5.json','src/content/case-v4.json','src/content/case-v2.json','src/content/editions.ts','src/world/country/CountryWorld.tsx','src/world/country/profiles.ts','src/world/rebuild/RebuildWorld.tsx','src/world/rebuild/profiles.ts',...walk('dist-studio')];
const pins=()=>Object.fromEntries(files.map(file=>[file,hash(file)]));
const current=JSON.parse(readFileSync('src/content/case-v5.json','utf8')),earlier=JSON.parse(readFileSync('src/content/case-v2.json','utf8'));
const opening=current.scenes.find(scene=>scene.id===current.start),oldOpening=earlier.scenes.find(scene=>scene.id===earlier.start);
const changed=`${opening.paragraphs[0]} [Noncanonical studio persistence check country.]`;
const engineBuild=await build({entryPoints:['src/engine/evidence-v2.ts'],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'});
const engine=await import(`data:text/javascript;base64,${Buffer.from(engineBuild.outputFiles[0].text).toString('base64')}`);
const report={status:'RUNNING',date:new Date().toISOString(),scope:'Bounded actual built studio selection, one valid scene-prose edit, saved draft reload, ordinary changed-v5 preview, occasion injection guard and retained-v2 noncanonical preview. No broad regression, accessibility or literary claim.',url:base,pinsBefore:pins(),checks:[],pageErrors:[],externalRequests:[]};
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const context=await browser.newContext({viewport:{width:1440,height:1050},reducedMotion:'reduce'}),page=await context.newPage();
page.setDefaultTimeout(20000);page.on('pageerror',error=>report.pageErrors.push(error.message));
page.on('request',request=>{const url=request.url();if(/^https?:/.test(url)&&!['localhost','127.0.0.1'].includes(new URL(url).hostname))report.externalRequests.push(url);});
async function exportFrom(label,name){const event=page.waitForEvent('download');await page.getByRole('button',{name:label,exact:true}).click();const path=`${folder}/studio-${name}.json`;await(await event).saveAs(path);return JSON.parse(readFileSync(path,'utf8'));}
const acknowledge=()=>page.getByLabel('I want to view author content and spoilers.',{exact:true}).check();
const valid=()=>expect(page.getByRole('region',{name:'Content diagnostics'})).toContainText('Content validation passed.');
const saved=()=>expect(page.locator('.save-status')).toContainText(/Progress saved|Saved progress loaded|Saving taken over|new run for this text revision/);
try{
 await page.goto(base);await acknowledge();await valid();
 await expect(page.getByLabel('Stable scene ID',{exact:true})).toHaveValue(current.start);await expect(page.getByLabel('Scene title',{exact:true})).toHaveValue(opening.title);await expect(page.getByRole('textbox',{name:'Paragraph 1',exact:true})).toHaveValue(opening.paragraphs[0]);
 expect(await exportFrom('Export compiled player content','installed-v5')).toEqual(current);
 report.checks.push('Default built studio exports the exact installed case-v5 (63 scenes, version 5) and selects its opening.');
 await page.getByRole('textbox',{name:'Paragraph 1',exact:true}).fill(changed);await page.getByRole('textbox',{name:'Paragraph 1',exact:true}).press('Tab');await valid();
 await page.getByRole('button',{name:'Save author project',exact:true}).click();await expect(page.getByRole('status').first()).toHaveText('Author project saved separately from player runs.');
 const authored=await exportFrom('Export author project','edited-author-project');expect(authored.content.scenes.find(scene=>scene.id===current.start).paragraphs[0]).toBe(changed);
 const expected=structuredClone(current);expected.scenes.find(scene=>scene.id===current.start).paragraphs[0]=changed;expect(authored.content).toEqual(expected);
 await page.reload();await acknowledge();await valid();await expect(page.getByRole('textbox',{name:'Paragraph 1',exact:true})).toHaveValue(opening.paragraphs[0]);
 await page.getByRole('button',{name:'Load author project',exact:true}).click();await expect(page.getByRole('status').first()).toHaveText('Saved author project loaded.');await valid();await expect(page.getByRole('textbox',{name:'Paragraph 1',exact:true})).toHaveValue(changed);
 expect((await exportFrom('Export author project','reloaded-author-project')).content).toEqual(expected);
 report.checks.push('Exactly one valid opening paragraph edit survives explicit save, document reload, and explicit draft load; installed default initially remains unchanged.');
 await page.getByRole('button',{name:'Preview last valid content',exact:true}).click();await saved();await expect(page.locator('#passage-title')).toHaveText(opening.title);await expect(page.locator('.prose p').first()).toHaveText(changed);await expect(page.locator('.rebuild-world-canvas')).toHaveAttribute('data-loaded','true');await expect(page.locator('.rebuild-world-canvas')).toHaveAttribute('data-scene-id',current.start);await expect(page.locator('.bath-world-canvas')).toHaveCount(0);
 const editedRun=await exportFrom('Export encountered run','edited-preview-run');expect(editedRun.content.version).toBe(5);expect(engine.importPortableV2(current,editedRun).ok).toBe(false);expect(engine.importPortableV2(expected,editedRun).ok).toBe(true);
 await page.getByText('Inject a noncanonical author scenario',{exact:true}).click();await expect(page.getByText(/Scenario injection is unavailable for occasion content/)).toBeVisible();await expect(page.getByRole('button',{name:'Create noncanonical scenario',exact:true})).toBeDisabled();
 await page.screenshot({path:`${folder}/studio-v5-edited-preview.png`,fullPage:true});
 report.checks.push('Reloaded edited v5 preview shows the exact changed prose and loaded rebuild world; its export replays only against edited content. Arbitrary occasion injection is visibly disabled.');
 const firstMovementUrl=new URL(base);firstMovementUrl.searchParams.set('edition','second-mouth-v4');await page.goto(firstMovementUrl.href);await acknowledge();await valid();expect(await exportFrom('Export compiled player content','retained-v4')).toEqual(JSON.parse(readFileSync('src/content/case-v4.json','utf8')));report.checks.push('Retained first-movement URL exports the exact frozen v4 separately.');
 const retained=new URL(base);retained.searchParams.set('edition','first-night');await page.goto(retained.href);await acknowledge();await valid();await expect(page.getByLabel('Stable scene ID',{exact:true})).toHaveValue(earlier.start);await expect(page.getByRole('textbox',{name:'Paragraph 1',exact:true})).toHaveValue(oldOpening.paragraphs[0]);expect(await exportFrom('Export compiled player content','retained-v2')).toEqual(earlier);
 await page.getByRole('button',{name:'Preview last valid content',exact:true}).click();await saved();await expect(page.locator('.bath-world-canvas')).toHaveAttribute('data-loaded','true');await expect(page.locator('.rebuild-world-canvas')).toHaveCount(0);
 await page.getByText('Inject a noncanonical author scenario',{exact:true}).click();await expect(page.getByRole('button',{name:'Create noncanonical scenario',exact:true})).toBeEnabled();await page.getByRole('button',{name:'Create noncanonical scenario',exact:true}).click();await expect(page.locator('#passage-title')).toHaveText('Noncanonical author scenario');await saved();await page.getByRole('button',{name:'Enter the selected scene with these conditions.',exact:true}).click();await saved();await expect(page.locator('#passage-title')).toHaveText(oldOpening.title);await expect(page.locator('.prose p').first()).toHaveText(oldOpening.paragraphs[0]);await expect(page.locator('.bath-world-canvas')).toHaveAttribute('data-loaded','true');
 const scenarioRun=await exportFrom('Export encountered run','retained-noncanonical-run');expect(scenarioRun.content.id).toMatch(/^preview\./);expect(engine.importPortableV2(earlier,scenarioRun).ok).toBe(false);expect(engine.importPortableV2(current,scenarioRun).ok).toBe(false);
 await page.screenshot({path:`${folder}/studio-retained-noncanonical-preview.png`,fullPage:true});
 report.checks.push('Retained first-night URL selects the exact v2 source and old world; an actual separately identified noncanonical scenario enters its opening and cannot import as either installed edition.');
 report.databases=await page.evaluate(async()=>(await indexedDB.databases()).map(database=>database.name).sort());expect(report.databases).toEqual(['literary-detective-author-projects-v2','literary-detective-studio-preview-v2']);
 await page.goto(base);await acknowledge();await valid();await expect(page.getByLabel('Stable scene ID',{exact:true})).toHaveValue(current.start);await expect(page.getByRole('textbox',{name:'Paragraph 1',exact:true})).toHaveValue(opening.paragraphs[0]);
 expect(report.pageErrors).toEqual([]);expect(report.externalRequests).toEqual([]);report.checks.push('Only author-draft and studio-preview databases were created; returning to the default URL selects pristine installed v5.');report.status='PASS';
}catch(error){report.status='FAIL';report.failure=String(error);process.exitCode=1;}
finally{report.pinsAfter=pins();report.stable=JSON.stringify(report.pinsBefore)===JSON.stringify(report.pinsAfter);report.productionCaseUnchanged=report.pinsBefore['src/content/case-v5.json']===report.pinsAfter['src/content/case-v5.json']&&report.pinsBefore['src/content/case-v2.json']===report.pinsAfter['src/content/case-v2.json'];await browser.close();writeFileSync(`${folder}/studio-check.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));}
