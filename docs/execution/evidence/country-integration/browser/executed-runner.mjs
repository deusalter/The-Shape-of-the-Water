import {chromium,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';

// Supply actual, replayable author-route captures. Every command is performed through UI controls.
const routeFiles=process.argv.slice(2);
if(!routeFiles.length)throw Error('Supply at least one real encountered-run route file.');
const base=process.env.PLAYER_TEST_URL??'http://localhost:4190/';
const folder=process.env.BROWSER_REPORT_DIR??'docs/execution/evidence/country-integration/browser';
const sourcePath=process.env.CASE_FILE??'src/content/case-v5.json';
const countryStaging=JSON.parse(readFileSync('narrative/rebuild/STAGING-V5.json','utf8'));
const countryScenes=new Map(countryStaging.newScenes.map(scene=>[scene.sceneId,scene]));
mkdirSync(folder,{recursive:true});
const hash=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const raw=JSON.parse(readFileSync(sourcePath,'utf8'));
const bundled=await build({entryPoints:['src/engine/evidence-v2.ts'],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'});
const engine=await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`);
const checked=engine.validateContentV2(raw);if(!checked.ok)throw Error(checked.errors.join('\n'));const content=checked.value;
const report={status:'RUNNING',scope:'Actual built Chromium routes performed through controls; automated verification, not human playtesting or duration evidence.',caseSha256:hash(sourcePath),routePins:routeFiles.map(path=>({path,sha256:hash(path)})),manifest:JSON.parse(readFileSync('dist-player/asset-manifest.json','utf8')),checks:[],errors:[],externalRequests:[],limits:['Only supplied routes','Software WebGL in Chromium','No human timing or literary acceptance','No hardware graphics benchmark']};
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const write=()=>writeFileSync(`${folder}/report.json`,JSON.stringify(report,null,2)+'\n');
function narrativeSeen(seen){
 // Separate real runs generate different command nonces and receipt hashes.
 // Keep every narrative/evidence field and command payload; exact receipts are replay-validated separately.
 const result=structuredClone(seen);
 for(const entry of result.transcript){if(entry.kind==='action'&&entry.command){delete entry.command.id;if(entry.command.confirmation){delete entry.command.confirmation.actionHash;delete entry.command.confirmation.stateHash;}}}
 return result;
}
async function saved(page){await expect(page.locator('.save-status')).toContainText(/Progress saved|Saved progress loaded|Saving taken over|new run for this text revision/,{timeout:20000});}
async function exportRun(page,name){const event=page.waitForEvent('download');await page.getByRole('button',{name:'Export encountered run',exact:true}).click();await(await event).saveAs(`${folder}/${name}.json`);return JSON.parse(readFileSync(`${folder}/${name}.json`,'utf8'));}
async function takeover(page){const button=page.getByRole('button',{name:'Take over saving',exact:true});if(await button.isVisible()){await button.click();await page.getByRole('button',{name:'Confirm action',exact:true}).click();}await saved(page);}
try{
 for(const [routeIndex,routeFile]of routeFiles.entries()){
  const route=JSON.parse(readFileSync(routeFile,'utf8'));if(!engine.importPortableV2(content,route).ok)throw Error(`Current source cannot replay ${routeFile}`);
  const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'}),page=await context.newPage();page.setDefaultTimeout(15000);
  page.on('pageerror',error=>report.errors.push(error.message));
  page.on('request',request=>{const url=request.url();if(/^https?:/.test(url)&&!['localhost','127.0.0.1'].includes(new URL(url).hostname))report.externalRequests.push(url);});
  let state=engine.createGameV2(content),canceledConfirmation=false;
  const visitedCountryScenes=new Set();
  await page.goto(base);await saved(page);await expect(page.locator('.rebuild-world-canvas')).toHaveAttribute('data-loaded','true',{timeout:30000});
  const start=await exportRun(page,`route-${routeIndex}-opening`);expect(start.content).toEqual(route.content);expect(start.commands).toHaveLength(0);
  await expect(page.locator('.rebuild-world-canvas')).toHaveAttribute('data-dora-left-hand','false');
  if(routeIndex===0){
   const world=page.locator('.rebuild-world-canvas');const before=await world.getAttribute('data-player-x');
   await world.focus();await page.keyboard.down('KeyA');await page.waitForTimeout(400);await page.keyboard.up('KeyA');
   await expect(world).not.toHaveAttribute('data-player-x',before);expect(await exportRun(page,'after-exploration')).toEqual(start);
   report.checks.push({name:'Actual keyboard exploration does not grant evidence or dispatch story actions',status:'PASS'});
  }
  await page.screenshot({path:`${folder}/route-${routeIndex}-opening.png`,fullPage:true});
  console.log(`Playing ${routeFile}: ${route.commands.length} controls`);
  for(const [index,command]of route.commands.entries()){
   const view=engine.projectPlayerV2(content,state);
   if(command.type==='choose'){
    const choice=view.choices.find(item=>item.id===command.choiceId);if(!choice)throw Error(`Route offers no ${command.choiceId}`);
    let before;
    if((choice.ending||choice.irreversible)&&!canceledConfirmation)before=await exportRun(page,`route-${routeIndex}-before-cancel`);
    if(routeIndex===0&&command.choiceId==='o0.inspect-source-floor'){
     const world=page.locator('.country-world-canvas');
     await expect(world).toHaveAttribute('data-loaded','true');
     await expect(page.locator('.country-world-near')).toContainText(choice.label);
     await world.focus();await page.keyboard.press('KeyE');
     report.checks.push({name:'Country near-E action dispatches to the actual story engine and replayed save',status:'PASS',choiceId:command.choiceId});
    }else await page.getByRole('button',{name:choice.label,exact:true}).click();
    if(choice.ending||choice.irreversible){
     if(before){await page.getByRole('button',{name:'Cancel',exact:true}).click();expect(await exportRun(page,`route-${routeIndex}-after-cancel`)).toEqual(before);canceledConfirmation=true;await page.getByRole('button',{name:choice.label,exact:true}).click();}
     await page.getByRole('button',{name:'Confirm action',exact:true}).click();
    }else await expect(page.getByRole('dialog')).toHaveCount(0);
   }else{
    const open=page.getByRole('button',{name:'Open notebook',exact:true});if(await open.isVisible())await open.click();
    if(command.type==='submitDeduction'){
     const question=view.questions.find(item=>item.id===command.questionId);if(!question)throw Error(`Question unavailable: ${command.questionId}`);
     const form=page.locator('.investigation-notebook form').filter({has:page.getByRole('group',{name:question.text,exact:true})});
     await form.getByLabel(question.candidates.find(item=>item.id===command.candidateId).text,{exact:true}).check();
     const details=form.locator('details');if(await details.getAttribute('open')===null)await details.locator('summary').click();
     const refs=[...view.sources,...view.deductions];const options=details.getByRole('checkbox');await expect(options).toHaveCount(refs.length);
     // Selection order is preserved in the recorded command. Reproduce the authored action order.
     for(let i=0;i<refs.length;i++)await options.nth(i).uncheck();
     for(const id of command.selectedRefs){const index=refs.findIndex(ref=>ref.id===id);if(index<0)throw Error(`Support unavailable: ${id}`);await options.nth(index).check();}
     await form.getByRole('button',{name:'Submit this claim and evidence',exact:true}).click();
    }else if(command.type==='reviewInterpretation'){
     const reading=view.readingsAvailable.find(item=>item.id===command.interpretationId);if(!reading)throw Error('Unavailable reading');await page.getByRole('button',{name:reading.title+(reading.occasionLabel?reading.occasionLabel:''),exact:true}).click();
    }else if(command.type==='requestHint'){
     const hint=view.hintsAvailable.find(item=>item.id===command.hintId);if(!hint)throw Error('Unavailable hint');await page.getByRole('button',{name:hint.label+(hint.reveals?' (reveals evidence)':''),exact:true}).click();if(hint.reveals)await page.getByRole('button',{name:'Confirm action',exact:true}).click();
    }else throw Error(`Unsupported UI action ${command.type}`);
   }
   const result=engine.applyCommandV2(content,state,command);if(!result.ok)throw Error(result.error.message);state=result.state;
   const next=engine.projectPlayerV2(content,state);await expect(page.locator('#passage-title')).toHaveText(next.passage.title);await expect(page.locator('.prose p')).toHaveText(next.passage.paragraphs);await saved(page);
   if(countryScenes.has(next.passage.sceneId)){
    const world=page.locator('.country-world-canvas');
    await expect(world).toHaveAttribute('data-loaded','true',{timeout:30000});
    await expect(world).toHaveAttribute('data-scene',next.passage.sceneId);
    await expect(page.locator('.rebuild-world-canvas')).toHaveCount(0);
    visitedCountryScenes.add(next.passage.sceneId);
    await page.screenshot({path:`${folder}/route-${routeIndex}-${next.passage.sceneId}.png`});
   }
   if(['o0.exposure-kept','o0.exposure-touched'].includes(next.passage.sceneId))await expect(page.locator('.rebuild-world-canvas')).toHaveAttribute('data-dora-left-hand','true');
   if(index%10===9)console.log(`Route ${routeIndex}: ${index+1}/${route.commands.length}`);
   if((routeIndex===0&&index<10)||next.passage.sceneId==='o0.exposure-touched'||next.passage.sceneId==='o0.lower-passage')await page.screenshot({path:`${folder}/route-${routeIndex}-step-${index+1}.png`});
  }
  const exported=await exportRun(page,`route-${routeIndex}-completed`);expect(engine.importPortableV2(content,exported).ok).toBe(true);expect(narrativeSeen(exported.seen)).toEqual(narrativeSeen(route.seen));expect(exported.commands).toHaveLength(route.commands.length);expect(exported).not.toHaveProperty('npcState');
  await page.reload();await takeover(page);expect(await exportRun(page,`route-${routeIndex}-reloaded`)).toEqual(exported);
  if(routeIndex===0){
   await expect(page.locator('.offline-status')).toContainText('Ready for offline play',{timeout:30000});await context.setOffline(true);await page.reload();await takeover(page);expect(await exportRun(page,'offline-new-world')).toEqual(exported);
   await expect(page.locator('.country-world-canvas')).toHaveAttribute('data-loaded','true',{timeout:30000});
   const retained=new URL(base);retained.searchParams.set('edition','second-mouth-v4');await page.goto(retained.href);await takeover(page);
   await expect(page.locator('.rebuild-world-canvas')).toHaveAttribute('data-loaded','true',{timeout:30000});
   const firstMovement=await exportRun(page,'retained-first-movement');expect(firstMovement.content.version).toBe(4);expect(firstMovement.commands).toHaveLength(0);
   expect(engine.importPortableV2(content,firstMovement).ok).toBe(false);
   const earlier=new URL(base);earlier.searchParams.set('edition','first-night');await page.goto(earlier.href);await takeover(page);await expect(page.locator('.bath-world-canvas')).toHaveAttribute('data-loaded','true',{timeout:30000});await expect(page.locator('.offline-status')).toContainText('Ready for offline play',{timeout:30000});
   await page.getByText('Help, content note and credits',{exact:true}).click();await expect(page.getByText('Content note: includes temporary confinement, a hand injury, and discussion of a parent’s death.',{exact:true})).toBeVisible();
   const old=await exportRun(page,'retained-first-night');expect(old.content.version).toBe(2);expect(old.commands).toHaveLength(0);await page.goto(base);await takeover(page);expect(await exportRun(page,'returned-new-world')).toEqual(exported);await context.setOffline(false);await page.getByText('Help, content note and credits',{exact:true}).click();await expect(page.getByText('Content note: bodily separation and reconstruction, injury, and threatened loss of a continuing person.',{exact:true})).toBeVisible();
   for(const width of [1440,390,320]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await page.screenshot({path:`${folder}/new-world-${width}.png`,fullPage:true});}
   await page.setViewportSize({width:1440,height:900});const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();writeFileSync(`${folder}/axe.json`,JSON.stringify(axe,null,2));expect(axe.violations.map(item=>({id:item.id,nodes:item.nodes.length}))).toEqual([]);report.checks.push({name:'Offline retained editions, exact save/reload, responsive widths and axe',status:'PASS',violations:0,incomplete:axe.incomplete.length});
  }
  report.checks.push({name:routeFile,status:'PASS',commands:route.commands.length,countryScenes:[...visitedCountryScenes],narrativeMatchAfterCommandReceiptNormalization:true,exactBrowserExportReplays:true,canceledConfirmation});write();await context.close();
 }
 expect(report.errors).toEqual([]);expect(report.externalRequests).toEqual([]);report.status='PASS';
}catch(error){report.status='FAIL';report.failure=String(error);}finally{report.caseSha256After=hash(sourcePath);report.sourceStable=report.caseSha256After===report.caseSha256;await browser.close();write();console.log(JSON.stringify(report.checks,null,2));if(report.status!=='PASS')process.exitCode=1;}
