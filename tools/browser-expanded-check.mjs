import {chromium,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';

const base=process.env.PLAYER_TEST_URL??'http://localhost:4190/';
const folder=process.env.BROWSER_REPORT_DIR??'docs/execution/evidence/browser-expanded';
mkdirSync(folder,{recursive:true});
const digest=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const sourcePath='src/content/case-expanded.json';
const content=JSON.parse(readFileSync(sourcePath,'utf8'));
const routeName='private-history-public-promise-repeat';
const route=JSON.parse(readFileSync(`narrative/loop/expanded-readings/${routeName}.run.json`,'utf8'));
const bundled=await build({entryPoints:['src/engine/evidence-v2.ts'],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'});
const engine=await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`);
const valid=engine.validateContentV2(content);if(!valid.ok)throw Error(valid.errors.join('\n'));
const reference=engine.importPortableV2(valid.value,route);if(!reference.ok)throw Error('Route capture does not replay against the current candidate.');
const report={status:'RUNNING',scope:'Built Chromium UI; one complete 102-command route through both crossings, plus explicitly imported route-prefix branch checks. Automated, not human playtesting.',sourceCaseSha256:digest(sourcePath),worldSha256:digest('public/world/bath-faceless.glb'),manifest:JSON.parse(readFileSync('dist-player/asset-manifest.json','utf8')),checks:[],pageErrors:[],externalRequests:[],notTested:['human duration','hardware graphics performance','Firefox','WebKit','all possible branches','whole-game literary acceptance']};
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
const page=await context.newPage();page.setDefaultTimeout(15000);
page.on('pageerror',error=>report.pageErrors.push(error.message));
page.on('request',request=>{const url=request.url();if(/^https?:/.test(url)&&!['localhost','127.0.0.1'].includes(new URL(url).hostname))report.externalRequests.push(url);});
let expected=engine.createGameV2(valid.value);
const write=()=>writeFileSync(`${folder}/report.json`,JSON.stringify(report,null,2)+'\n');
async function check(name,fn){console.log('Checking: '+name);try{report.checks.push({name,status:'PASS',detail:await fn()});write();}catch(error){report.checks.push({name,status:'FAIL',error:String(error)});throw error;}}
async function saved(){await expect(page.locator('.save-status')).toContainText(/Progress saved|Saved progress loaded|Saving taken over|new run for this text revision/,{timeout:20000});}
async function exported(name){const event=page.waitForEvent('download');await page.getByRole('button',{name:'Export encountered run',exact:true}).click();await(await event).saveAs(`${folder}/${name}.json`);return JSON.parse(readFileSync(`${folder}/${name}.json`,'utf8'));}
async function takeOver(){const button=page.getByRole('button',{name:'Take over saving',exact:true});if(await button.isVisible()){await button.click();await page.getByRole('button',{name:'Confirm action',exact:true}).click();}await saved();}
async function act(command,{cancelFirst=false}={}){
 const view=engine.projectPlayerV2(valid.value,expected);
 if(command.type==='choose'){
  const choice=view.choices.find(item=>item.id===command.choiceId);if(!choice)throw Error(`Unavailable reference choice ${command.choiceId}`);
  await page.getByRole('button',{name:choice.label,exact:true}).click();
  if(choice.irreversible||choice.ending){
   if(cancelFirst){const before=await exported('before-canceled-confirmation');await page.getByRole('button',{name:'Cancel',exact:true}).click();expect(await exported('after-canceled-confirmation')).toEqual(before);await page.getByRole('button',{name:choice.label,exact:true}).click();}
   await page.getByRole('button',{name:'Confirm action',exact:true}).click();
  }else await expect(page.getByRole('dialog')).toHaveCount(0);
 }else if(command.type==='submitDeduction'){
  const open=page.getByRole('button',{name:'Open notebook',exact:true});if(await open.isVisible())await open.click();
  const question=view.questions.find(item=>item.id===command.questionId);if(!question)throw Error('Missing current question');
  const form=page.locator('.investigation-notebook form').filter({has:page.getByRole('group',{name:question.text,exact:true})});
  await form.getByLabel(question.candidates.find(item=>item.id===command.candidateId).text,{exact:true}).check();
  const selection=form.locator('details');if(await selection.getAttribute('open')===null)await selection.locator('summary').click();
  const refs=[...view.sources.map(item=>({id:item.id,label:item.title+(item.occasionLabel?` (${item.occasionLabel})`:'')})),...view.deductions.map(item=>({id:item.id,label:item.text+(item.occasionLabel?` (${item.occasionLabel})`:'')}))];
  for(const ref of refs)await form.getByLabel(ref.label,{exact:true}).setChecked(command.selectedRefs.includes(ref.id));
  await form.getByRole('button',{name:'Submit this claim and evidence',exact:true}).click();
 }else throw Error(`Browser route command not supported: ${command.type}`);
 const result=engine.applyCommandV2(valid.value,expected,command);if(!result.ok)throw Error(result.error.message);expected=result.state;
 const next=engine.projectPlayerV2(valid.value,expected);
 await expect(page.locator('#passage-title')).toHaveText(next.passage.title);
 await expect(page.locator('.prose p')).toHaveText(next.passage.paragraphs);
 await saved();
}
async function importPrefix(name,count){
 const original=JSON.parse(readFileSync(`narrative/loop/expanded-readings/${name}.run.json`,'utf8'));
 let state=engine.createGameV2(valid.value);
 for(const command of original.commands.slice(0,count)){const result=engine.applyCommandV2(valid.value,state,command);if(!result.ok)throw Error(result.error.message);state=result.state;}
 writeFileSync(`${folder}/branch-prefix.json`,JSON.stringify(engine.exportPortableV2(valid.value,state)));
 await page.getByText('Start or import a run',{exact:true}).click();
 await page.getByLabel('Import encountered run',{exact:true}).setInputFiles(`${folder}/branch-prefix.json`);
 await page.getByRole('button',{name:'Confirm action',exact:true}).click();await saved();expected=state;
 return original.commands.slice(count);
}
try{
 await page.goto(base);await saved();
 await check('Opening has no future occasion labels or extra people in notebook',async()=>{
  await expect(page.locator('.bath-world-canvas')).toHaveAttribute('data-loaded','true',{timeout:30000});
  const body=await page.locator('body').innerText();expect(body).not.toContain('After the return');expect(body).not.toContain('After another crossing');
  const initial=await exported('opening');expect(initial.commands).toHaveLength(0);expect(initial.seen.transcript).toEqual(engine.exportPortableV2(valid.value,expected).seen.transcript);
  return 'Actual initialized player projection and world load.';
 });
 await check('Complete authored route through both crossings using visible controls',async()=>{
  let completed=0;
  for(const command of route.commands){
   // Export is outside the modal: cancellation must leave the last accepted run unchanged.
   if(command.choiceId==='o1.cross-empty'){
    const before=await exported('before-canceled-crossing');const choice=engine.projectPlayerV2(valid.value,expected).choices.find(item=>item.id===command.choiceId);
    await page.getByRole('button',{name:choice.label,exact:true}).click();await page.getByRole('button',{name:'Cancel',exact:true}).click();expect(await exported('after-canceled-crossing')).toEqual(before);
   }
   await act(command);completed++;
   if(completed%10===0)console.log(`Accepted ${completed}/${route.commands.length}`);
   if(['o1.return','o1.copresence','o1.two-miriams','o1.test-positions','o2.return'].includes(expected.sceneId))await page.screenshot({path:`${folder}/${expected.sceneId}.png`,fullPage:true});
  }
  const result=await exported('completed-expanded-route');expect(result.seen).toEqual(route.seen);expect(result.commands).toHaveLength(route.commands.length);expect(engine.importPortableV2(valid.value,result).ok).toBe(true);expect(result).not.toHaveProperty('npcState');await expect(page.locator('.ending-note')).toBeVisible();
  await page.screenshot({path:`${folder}/expanded-ending.png`,fullPage:true});
  return{acceptedCommands:completed,acceptedQuestions:result.seen.deductions.length,seenExactlyMatchesEngineCapture:true,secondCrossingCancelLeavesRunUnchanged:true};
 });
 await check('Expanded ending survives reload; first-night edition keeps separate history offline',async()=>{
  const expanded=await exported('before-reload');await expect(page.locator('.offline-status')).toContainText('Ready for offline play',{timeout:30000});
  await context.setOffline(true);await page.reload();await takeOver();await expect(page.locator('.bath-world-canvas')).toHaveAttribute('data-loaded','true',{timeout:30000});expect(await exported('after-reload')).toEqual(expanded);
  const earlier=new URL(base);earlier.searchParams.set('edition','first-night');await page.goto(earlier.href);await takeOver();await expect(page.locator('.offline-status')).toContainText('Ready for offline play',{timeout:20000});
  const old=await exported('first-night-separate');expect(old.content.version).toBe(2);expect(old.commands).toHaveLength(0);await page.getByRole('button',{name:'Go to Miriam at the pool.',exact:true}).count().then(()=>{});
  await page.goto(base);await takeOver();expect(await exported('returned-expanded')).toEqual(expanded);await context.setOffline(false);
  return{expandedVersion:expanded.content.version,firstNightVersion:old.content.version,separateSaves:true,offlineBothEditions:true};
 });
 await check('Imported real route prefixes preserve cancellation and all-front alternatives',async()=>{
  const details=[];
  for(const name of ['pressed-history-canceled-test','all-front-postponement']){
   const original=JSON.parse(readFileSync(`narrative/loop/expanded-readings/${name}.run.json`,'utf8'));
   const remaining=await importPrefix(name,original.commands.length-3);
   for(const command of remaining)await act(command);
   const result=await exported(name);expect(result.seen).toEqual(original.seen);await expect(page.locator('.ending-note')).toBeVisible();details.push({route:name,importedCommands:original.commands.length-3,performedBrowserCommands:3});
  }
  return details;
 });
 await check('Expanded notebook responsive layout and automated accessibility scan',async()=>{
  const open=page.getByRole('button',{name:'Open notebook',exact:true});if(await open.isVisible())await open.click();
  for(const width of [1440,390,320]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await page.screenshot({path:`${folder}/expanded-${width}.png`,fullPage:true});}
  await page.setViewportSize({width:1440,height:900});const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();writeFileSync(`${folder}/axe.json`,JSON.stringify(result,null,2));expect(result.violations.map(item=>({id:item.id,nodes:item.nodes.length}))).toEqual([]);
  return{violations:0,incomplete:result.incomplete.length,widths:[1440,390,320]};
 });
 expect(report.pageErrors).toEqual([]);expect(report.externalRequests).toEqual([]);report.status='PASS';
}catch(error){report.status='FAIL';report.failure=String(error);}finally{report.sourceCaseSha256After=digest(sourcePath);report.sourceStable=report.sourceCaseSha256After===report.sourceCaseSha256;await browser.close();write();console.log(JSON.stringify(report.checks,null,2));if(report.status!=='PASS')process.exitCode=1;}
