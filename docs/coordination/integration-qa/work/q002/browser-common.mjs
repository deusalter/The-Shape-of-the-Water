import {createRequire} from 'node:module';
const require=createRequire(new URL('./runtime/package.json',import.meta.url));
const {chromium,expect}=require('@playwright/test');
const axeModule=require('@axe-core/playwright'),AxeBuilder=axeModule.default??axeModule;
const {build}=require('esbuild');
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
export {expect,AxeBuilder};
export const folder=fileURLToPath(new URL('.',import.meta.url));
export const content=JSON.parse(readFileSync(folder+'runtime/src/content/case-v2.json','utf8'));
export const hash=value=>createHash('sha256').update(value).digest('hex');
export const actions=new Map(content.scenes.flatMap(s=>s.choices.map(c=>[c.id,c])));
export const playerURL='http://127.0.0.1:4313/';
export const studioURL='http://127.0.0.1:4314/studio.html';
export const write=(name,value)=>writeFileSync(folder+name,JSON.stringify(value,null,2)+'\n');
export async function engineModule(path='src/engine/evidence-v2.ts'){
 const bundled=await build({entryPoints:[folder+'runtime/'+path],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'});
 return import('data:text/javascript;base64,'+Buffer.from(bundled.outputFiles[0].text).toString('base64'));
}
export async function suite(name){
 name+=process.env.QA_SUFFIX??'';
 mkdirSync(folder+'screenshots',{recursive:true});
 const report={suite:name,inputCommit:JSON.parse(readFileSync(folder+'source-hashes-before.json')).inputCommit,startedAt:new Date().toISOString(),checks:[],pageErrors:[],externalRequests:[],trace:[]};
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true});
 const contexts=[];let activePage;
 async function open(url=studioURL,init){
  const context=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce'});contexts.push(context);
  await context.tracing.start({screenshots:true,snapshots:true,sources:false});
  if(init)await context.addInitScript(init);
  const page=await context.newPage();activePage=page;page.setDefaultTimeout(7000);
  page.on('pageerror',error=>report.pageErrors.push({message:error.message,url:page.url()}));
  page.on('request',r=>{if(/^https?:/.test(r.url())&&!['127.0.0.1','localhost'].includes(new URL(r.url()).hostname))report.externalRequests.push(r.url());});
  await page.goto(url);if(url===studioURL)await page.getByLabel('I want to view author content and spoilers.').check();
  return {context,page};
 }
 async function check(id,name,fn){
  if(process.env.QA_ONLY&&!process.env.QA_ONLY.split(',').includes(id))return;
  console.log(id+' '+name);const start=new Date().toISOString();report.trace=[];
  try{const detail=await fn();report.checks.push({id,name,status:'PASS',startedAt:start,detail,trace:report.trace});}
  catch(error){report.checks.push({id,name,status:'FAIL',startedAt:start,error:String(error),stack:error.stack,trace:report.trace});if(activePage&&!activePage.isClosed())await activePage.screenshot({path:folder+'screenshots/'+id+'-failure.png',fullPage:true}).catch(()=>{});console.log(String(error));}
  write(nameForReport(),report);
 }
 function nameForReport(){return name+'-report.json';}
 function step(label){report.trace.push({at:new Date().toISOString(),label});}
 async function finish(){
  for(let i=0;i<contexts.length;i++)await contexts[i].tracing.stop({path:folder+name+'-context-'+i+'.zip'});
  report.finishedAt=new Date().toISOString();report.status=report.checks.some(x=>x.status==='FAIL')?'FAIL':'PASS';report.browserVersion=browser.version();
  await browser.close();write(nameForReport(),report);console.log(JSON.stringify({status:report.status,checks:report.checks.map(({id,status})=>({id,status})),pageErrors:report.pageErrors},null,2));
  if(report.status==='FAIL')process.exitCode=1;
 }
 return {browser,report,open,check,step,finish};
}
export async function valid(page){await expect(page.getByRole('region',{name:'Content diagnostics'})).toContainText('Content validation passed');await expect(page.getByRole('button',{name:'Export compiled player content',exact:true})).toBeEnabled();}
export async function saved(page){await expect(page.locator('.save-status')).toContainText(/Progress saved|Saved progress loaded|Saving taken over|new run for this text revision|Saving repaired/);}
export async function choose(page,id){const c=actions.get(id);await page.getByRole('button',{name:c.label,exact:true}).click();if(c.ending||c.irreversible)await page.getByRole('button',{name:'Confirm action',exact:true}).click();await saved(page);}
export async function downloadJSON(page,button,name){const event=page.waitForEvent('download');await page.getByRole('button',{name:button,exact:true}).click();await (await event).saveAs(folder+name);return JSON.parse(readFileSync(folder+name,'utf8'));}
export const exportAuthor=(p,n)=>downloadJSON(p,'Export author project',n);
export const exportRun=(p,n)=>downloadJSON(p,'Export encountered run',n);
export async function dumpDB(page,name='literary-detective-v1'){
 return page.evaluate(async name=>{const db=await new Promise((res,rej)=>{const r=indexedDB.open(name);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});const out={};for(const store of db.objectStoreNames){out[store]=await new Promise((res,rej)=>{const tx=db.transaction(store);const r=tx.objectStore(store).getAll();r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});}db.close();return out;},name);
}
