import {chromium, expect} from '@playwright/test';
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {spawn, execFile} from 'node:child_process';
import {once} from 'node:events';
import {promisify} from 'node:util';
import http from 'node:http';
import {createHash} from 'node:crypto';

const [baseline, launcher, packagePath] = process.argv.slice(2);
if (!baseline || !launcher || !packagePath) throw Error('Pass extracted original game directory, Linux diagnostic launcher in extracted .app layout, and original Mac ZIP path.');
const dest = process.env.MAC_SMOKE_DIR??'docs/execution/evidence/visual-design/mac-smoke';
mkdirSync(dest,{recursive:true});
const expectedBuild=JSON.parse(readFileSync('releases/MAC-PACKAGE.json','utf8')).assetBuild;
const origin = 'http://127.0.0.1:4173';
const report = {status:'RUNNING', scope:'Actual Chromium migration from original ZIP to exact Mac ZIP game resources, served by Linux compilation of the same Go launcher source. No native Mac execution.', packageSha256:createHash('sha256').update(readFileSync(packagePath)).digest('hex'), linuxDiagnosticSha256:createHash('sha256').update(readFileSync(launcher)).digest('hex'), checks:[], errors:[], externalRequests:[], subprocessLogs:[]};
let server, browser;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
function request(path='/', method='GET', headers={}, body='') {
  return new Promise((resolve,reject)=>{
    const req=http.request(origin+path,{method,headers,timeout:3000},res=>{let text='';res.on('data',chunk=>text+=chunk);res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,text}));});
    req.on('error',reject);req.on('timeout',()=>req.destroy(Error('HTTP timeout')));req.end(body);
  });
}
async function ready(path) {
  for(let i=0;i<100;i++){try{if((await request(path)).status===200)return;}catch{}await delay(50);}
  throw Error('Server failed readiness: '+path);
}
function start(command,args) {
  server=spawn(command,args,{stdio:['ignore','pipe','pipe']});
  const log={command,args,stdout:'',stderr:''};report.subprocessLogs.push(log);
  server.stdout.on('data',chunk=>log.stdout+=chunk);server.stderr.on('data',chunk=>log.stderr+=chunk);
  return server;
}
async function stop() {
  if(server&&server.exitCode===null){const done=once(server,'exit');server.kill('SIGTERM');await done;}
  server=null;
}
async function exportRun(page) {
  const wait=page.waitForEvent('download');await page.getByRole('button',{name:'Export encountered run',exact:true}).click();
  const download=await wait;return JSON.parse(readFileSync(await download.path(),'utf8'));
}
function same(a,b,label){if(JSON.stringify(a)!==JSON.stringify(b))throw Error(label);}
async function takeOver(page) {
  const button=page.getByRole('button',{name:'Take over saving',exact:true});
  if(await button.isVisible()){await button.click();await page.getByRole('button',{name:'Confirm action',exact:true}).click();await expect(page.locator('.save-status')).toHaveText('Saving taken over. The latest committed progress is loaded.');}
  await expect(page.locator('.choices button').first()).toBeEnabled();
}

try{
  try{await request();throw Error('Port4173 is already occupied; refusing to replace existing process.');}catch(error){if(error.message.startsWith('Port4173'))throw error;}
  start('python3',['-u','-m','http.server','4173','--bind','127.0.0.1','--directory',baseline]);await ready('/');
  browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  context.on('page',page=>{page.setDefaultTimeout(60000);page.on('pageerror',error=>report.errors.push(error.message));page.on('request',req=>{if(/^https?:/.test(req.url())&&new URL(req.url()).origin!==origin)report.externalRequests.push(req.url());});});
  let game=await context.newPage();await game.goto(origin+'/');
  await expect(game.locator('.mercy-world-canvas')).toHaveAttribute('data-loaded','true');
  await expect(game.locator('.save-status')).toContainText('Progress saved in this browser.');
  await expect(game.locator('.offline-status')).toHaveText('Ready for offline play on this device.');
  await game.locator('.choices button').first().click();await expect(game.locator('.save-status')).toContainText('Progress saved in this browser.');
  const originalRun=await exportRun(game);report.originalContent=originalRun.content;report.originalActions=originalRun.commands.length;
  await game.reload();same(originalRun,await exportRun(game),'Original baseline failed reload');
  await expect(game.locator('.offline-status')).toHaveText('Ready for offline play on this device.');
  const existingWorker=await game.evaluate(()=>navigator.serviceWorker.controller?.scriptURL);if(!existingWorker)throw Error('Baseline worker did not control the game');
  await game.close();await stop();
  report.checks.push('Published original package established an ordinary saved action and controlling service worker at the exact fixed origin.');

  start(launcher,['--headless']);await ready('/__launcher/');
  let control=await context.newPage();await control.goto(origin+'/__launcher/');
  await expect(control.getByRole('link',{name:/Play/})).toBeVisible();
  report.controlWorker=await control.evaluate(()=>navigator.serviceWorker.controller?.scriptURL);
  if(report.controlWorker!==existingWorker)throw Error('Control page not tested under original game worker');
  const popup=context.waitForEvent('page');await control.getByRole('link',{name:/Play/}).click();game=await popup;
  await expect(game.locator('.mercy-world-canvas')).toHaveAttribute('data-loaded','true');
  await expect(game.locator('#passage-title')).toHaveText(originalRun.seen.transcript.filter(x=>x.kind==='passage').at(-1).title);
  same(originalRun,await exportRun(game),'Go launcher changed existing saved run');
  // The old offline worker deliberately retains old assets until its tabs close.
  // Exercise a real update without clearing storage, unregistering or forcing activation.
  await game.evaluate(async()=>{const registration=await navigator.serviceWorker.getRegistration();await registration.update();});
  await expect.poll(()=>game.evaluate(async()=>!!(await navigator.serviceWorker.getRegistration()).waiting),{timeout:45000}).toBe(true);
  await game.close();await control.close();
  await new Promise(resolve=>setTimeout(resolve,300));
  control=await context.newPage();await control.goto(origin+'/__launcher/');
  const updatedPopup=context.waitForEvent('page');await control.getByRole('link',{name:/Play/}).click();game=await updatedPopup;
  await expect(game.locator('.mercy-world-canvas')).toHaveAttribute('data-loaded','true');
  await expect.poll(()=>game.evaluate(async()=>(await (await fetch('asset-manifest.json')).json()).version),{timeout:45000}).toBe(expectedBuild);
  same(originalRun,await exportRun(game),'Visual update changed existing saved run');
  report.actualUpdatedAssetBuild=expectedBuild;
  report.checks.push('Old offline worker installs the visual update; closing all controlled game/launcher tabs activates it. New assets render while the exact prior save survives. No storage clearing or forced worker activation.');
  await takeOver(game);
  await game.screenshot({path:dest+'/updated-game.png'});
  await control.screenshot({path:dest+'/launcher.png'});
  report.checks.push('Go-served control page remains live under the original SW, opens Play in a separate tab, and restores the original saved run byte-for-byte.');

  const world=game.locator('.mercy-world-canvas');await world.scrollIntoViewIfNeeded();await world.focus();const z=await world.getAttribute('data-player-z');
  await game.keyboard.down('KeyW');await game.waitForTimeout(350);await game.keyboard.up('KeyW');await expect(world).not.toHaveAttribute('data-player-z',z);
  same(originalRun,await exportRun(game),'Movement changed story record');
  await game.locator('.choices button').first().click();await expect(game.locator('.save-status')).toContainText('Progress saved in this browser.');
  const newRun=await exportRun(game);if(newRun.commands.length!==originalRun.commands.length+1)throw Error('Action count did not increment');
  await game.reload();same(newRun,await exportRun(game),'Go-served saved action failed reload');await takeOver(game);
  await game.getByText('Start or import a run',{exact:true}).click();
  await game.locator('input[type=file]').setInputFiles({name:'baseline-run.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(originalRun))});
  await game.getByRole('button',{name:'Confirm action',exact:true}).click();await expect(game.locator('.save-status')).toContainText('Progress saved in this browser.');
  same(originalRun,await exportRun(game),'Existing exact content export failed import');
  await game.reload();same(originalRun,await exportRun(game),'Imported run failed reload');
  report.checks.push('Actual movement, another saved action, reload, old-run import and imported-run reload preserve exact encountered exports and matching content identity.');

  const liveResponse=await request('/__launcher/');
  if(!String(liveResponse.headers['cache-control']).includes('no-store'))throw Error('Control page can be cached');
  const wrongHost=await request('/','GET',{Host:'attacker.example:4173'});
  if(wrongHost.status!==403)throw Error('Host guard failed: '+wrongHost.status);
  const nonce=liveResponse.text.match(/name="nonce" value="([a-f0-9]+)"/)?.[1];if(!nonce)throw Error('No Quit token found');
  for(const [name,method,headers,body,expected] of [
    ['GET Quit','GET',{},'',405],
    ['foreign Origin','POST',{'Origin':'https://attacker.example','Content-Type':'application/x-www-form-urlencoded'},'nonce='+nonce,403],
    ['missing Origin','POST',{'Content-Type':'application/x-www-form-urlencoded'},'nonce='+nonce,403],
    ['wrong token','POST',{'Origin':origin,'Content-Type':'application/x-www-form-urlencoded'},'nonce=wrong',403]
  ]){const response=await request('/__launcher/quit',method,headers,body);if(response.status!==expected)throw Error(name+' accepted unexpectedly: '+response.status);}
  const identityBefore=await request('/__launcher/status');
  const duplicate=await promisify(execFile)(launcher,['--headless'],{timeout:10000});
  report.duplicateLaunch={stdout:duplicate.stdout,stderr:duplicate.stderr};
  const identityAfter=await request('/__launcher/status');same(identityBefore.text,identityAfter.text,'Duplicate launch replaced server');
  if(!(await request('/__launcher/')).text.includes('value="'+nonce+'"'))throw Error('Duplicate launch changed server session');
  report.checks.push('Live control uses no-store; unrelated Host, GET Quit, foreign/missing Origin and wrong token are rejected. A second Linux launcher process reuses the same server session without changing its token or identity.');

  await control.reload();await expect(control.getByRole('link',{name:/Play/})).toBeVisible();
  await control.getByRole('button',{name:/Quit/}).click();
  await expect(control.locator('#status')).toHaveText('The launcher is closed. You can close this tab. Open the app to play again.');
  await expect(control.getByRole('link',{name:'Play',exact:true})).toBeHidden();
  for(let i=0;i<100&&server.exitCode===null;i++)await delay(50);
  if(server.exitCode===null)throw Error('Quit did not terminate server');
  const quitResponse=await control.locator('body').innerText();report.quitResponse=quitResponse;
  await game.reload();same(originalRun,await exportRun(game),'Saved game did not reopen offline after Quit');
  report.checks.push('Quit updates the live page from its successful POST, hides Play, and terminates the server; the existing game still reloads offline with an unchanged saved run.');
  server=null;
  start(launcher,['--headless']);await ready('/__launcher/');
  await control.goto(origin+'/__launcher/');await expect(control.getByRole('link',{name:/Play/})).toBeVisible();
  same(originalRun,await exportRun(game),'Restart changed saved run');
  report.checks.push('Fresh server restart reopens the live control page on the same origin after Quit.');
  if(report.errors.length||report.externalRequests.length)throw Error('Unexpected browser page errors or external requests');
  report.status='PASS';
}catch(error){report.status='FAIL';report.failure=error.stack;process.exitCode=1;}
finally{await browser?.close();await stop();writeFileSync(dest+'/BROWSER-SMOKE.json',JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify(report,null,2));
