import {chromium,expect} from '/workspace/literary-detective/node_modules/@playwright/test/index.mjs';
import {readFileSync,writeFileSync} from 'node:fs';
const url=process.argv[2]??'http://127.0.0.1:4190/';
const report={url,scope:'Independent final built-player Chromium checks of lazy chunk failure recovery and notebook/transcript state. Service worker disabled to isolate chunk-failure behavior; offline preparation/update acceptance belongs to root.',checks:[],expectedBlockedRequests:[],errors:[]};
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
function watch(page){page.setDefaultTimeout(30000);page.on('pageerror',e=>report.errors.push(e.message));}
async function saved(page){await expect(page.locator('.save-status')).toContainText(/Progress saved in this browser\./,{timeout:60000});}
try{
 const retryContext=await browser.newContext({serviceWorkers:'block'}),retry=await retryContext.newPage();watch(retry);let abort=true;
 await retry.route('**/assets/case-v7-*.js',route=>{if(abort){abort=false;report.expectedBlockedRequests.push(route.request().url());return route.abort('failed');}return route.continue();});
 await retry.goto(url);await expect(retry.getByRole('button',{name:'Try opening the story again'})).toBeVisible();
 await Promise.all([retry.waitForEvent('load'),retry.getByRole('button',{name:'Try opening the story again'}).click()]);
 await expect(retry.locator('#passage-title')).toBeVisible();await saved(retry);report.checks.push('A failed selected-story chunk exposes retry; retry reloads document and opens the same story successfully.');await retryContext.close();
 const fallbackContext=await browser.newContext({serviceWorkers:'block'}),page=await fallbackContext.newPage();watch(page);
 await page.route('**/assets/MercyWorld-*.js',route=>{report.expectedBlockedRequests.push(route.request().url());return route.abort('failed');});
 await page.goto(url);await expect(page.getByText('The 3D world could not be opened. The passage and story actions are available below.')).toBeVisible();await saved(page);
 const original=await page.locator('#passage-title').textContent();await page.locator('.choices button').first().click();await expect(page.locator('#passage-title')).not.toHaveText(original);await saved(page);report.checks.push('A failed world chunk leaves prose and ordinary story actions functional and saves progress.');
 await expect(page.locator('.investigation-notebook')).toHaveCount(0);
 const transcript=page.getByText(/^Read encountered transcript \(/).locator('..');await expect(transcript.locator('section')).toHaveCount(0);
 report.checks.push('Unopened notebook and closed transcript contain no deferred detail DOM.');
 await page.locator('details.restart summary').click();await page.locator('input[type=file]').setInputFiles('/tmp/mercy-opt-review/question-prefix.json');
 await page.getByRole('button',{name:'Confirm action',exact:true}).click();await saved(page);
 await page.getByRole('button',{name:'Open notebook',exact:true}).click();const notebook=page.locator('.investigation-notebook');
 const search=notebook.getByRole('searchbox');await search.fill('Julian');const radio=notebook.getByRole('radio').first();await radio.check();
 const evidence=notebook.locator('details.evidence-selection');await evidence.locator('summary').click();const checkbox=notebook.getByRole('checkbox').first();await checkbox.check();
 await page.getByRole('button',{name:'Close notebook',exact:true}).click();await page.getByRole('button',{name:'Open notebook',exact:true}).click();
 await expect(search).toHaveValue('Julian');await expect(radio).toBeChecked();await expect(checkbox).toBeChecked();await expect(evidence).toHaveAttribute('open','');report.checks.push('Notebook close/reopen preserves search, selected factual candidate, evidence checkbox and native evidence-details expansion.');
 await page.getByRole('button',{name:'Close notebook',exact:true}).click();const seen=JSON.parse(readFileSync('/tmp/mercy-opt-review/question-prefix.json','utf8')).seen;
 await transcript.locator('summary').click();await expect(transcript.locator('section')).toHaveCount(seen.transcript.filter(x=>x.kind==='passage').length);
 const actualParagraphs=await transcript.locator('section > p:not(.occasion-label)').allTextContents();
 const expectedParagraphs=seen.transcript.filter(x=>x.kind==='passage').flatMap(x=>x.paragraphs);if(JSON.stringify(actualParagraphs)!==JSON.stringify(expectedParagraphs))throw Error('Transcript paragraphs differ');
 await transcript.locator('summary').click();await expect(transcript.locator('section')).toHaveCount(0);report.checks.push('Opened transcript reproduces every captured passage paragraph exactly; closing removes its detail DOM.');
 await page.locator('.choices button').first().click();const dialog=page.getByRole('button',{name:'Confirm action',exact:true});if(await dialog.isVisible())await dialog.click();await saved(page);
 await page.getByRole('button',{name:'Open notebook',exact:true}).click();await expect(search).toHaveValue('Julian');await expect(notebook.getByRole('radio')).toHaveCount(0);report.checks.push('A story action while notebook is hidden refreshes available questions on reopen while preserving search.');
 await page.getByRole('button',{name:'Close notebook',exact:true}).click();const restart=page.locator('details.restart');if(await restart.getAttribute('open')===null)await restart.locator('summary').click();await page.getByRole('button',{name:'Start a new run',exact:true}).click();await page.getByRole('button',{name:'Confirm action',exact:true}).click();await saved(page);
 await page.getByRole('button',{name:'Open notebook',exact:true}).click();await expect(search).toHaveValue('');report.checks.push('Replacing the run while notebook is hidden resets its draft state when reopened.');
 await fallbackContext.close();report.status='PASS';
}catch(error){report.status='FAIL';report.failure=error.stack;throw error;}finally{await browser.close();writeFileSync('/tmp/mercy-opt-review/browser-review.json',JSON.stringify(report,null,2));}
console.log(JSON.stringify(report));
