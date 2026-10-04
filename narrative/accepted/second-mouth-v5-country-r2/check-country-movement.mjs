import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { build } from 'esbuild';
const root=path.resolve(import.meta.dirname,'../..');
const contentPath=path.join(root,'src/content/case-v5.json');
const bytes=fs.readFileSync(contentPath);
const hash=crypto.createHash('sha256').update(bytes).digest('hex');
const out=path.join(import.meta.dirname,'readings-v5');fs.mkdirSync(out,{recursive:true});
const enginePath='/tmp/second-mouth-country-route-engine.mjs';
await build({entryPoints:[path.join(root,'src/engine/evidence-v2.ts')],outfile:enginePath,bundle:true,platform:'node',format:'esm'});
const e=await import(enginePath+'?'+Date.now());
const validation=e.validateContentV2(JSON.parse(bytes));
assert.equal(validation.ok,true,JSON.stringify(validation.errors));
const c=validation.value;
const f=x=>'o0.'+x;
const variants=[
 {name:'kept-test-dry-tracing-pipe-written',closed:false,test:true,table:'table-want',root:true,confess:'none',reach:'offer-new-reach',end:'dry',support:'release-source',postponeRemoval:true,material:'tracing',pipe:true,written:true},
 {name:'closed-private-proof-orchard-loan-oral',closed:true,test:false,table:'table-memory-test',root:false,confess:'none',reach:'ask-handover',end:'orchard',support:'wedge-source',extraPrivate:true,material:'loan',written:false},
 {name:'closed-private-confession-dry-panel-invitation-written',closed:true,test:true,table:'table-affection-choice',root:true,confess:'private',reach:'offer-old-body',end:'dry',support:'wedge-source',material:'panel',pipe:false,written:true},
 {name:'closed-public-confession-orchard-rubbing-written',closed:true,test:true,table:null,root:false,confess:'public',reach:'offer-new-reach',end:'orchard',support:'wedge-source',material:'rubbing',written:true},
 {name:'kept-declined-orchard-loan-written',closed:false,test:false,table:null,root:false,confess:'none',reach:'offer-old-body',end:'orchard',support:'wedge-source',material:'loan',written:true},
 {name:'kept-declined-dry-panel-pipe-oral',closed:false,test:false,table:null,root:false,confess:'none',reach:'offer-new-reach',end:'dry',support:'wedge-source',material:'panel',pipe:true,written:false}
];
const preserveReadings=process.argv.includes('--preserve-readings');
const results=[];
for(const r of variants){
 let state=e.createGameV2(c),counter=0;
 const snapshots=[];
 function command(part){
  const input={id:r.name+'.'+(++counter),expectedRevision:state.revision,...part};
  const before=JSON.stringify(state);
  let result=e.applyCommandV2(c,state,input);
  if(!result.ok&&result.error.code==='confirmation-required'){
   assert.equal(JSON.stringify(state),before,'unconfirmed command changed state');
   input.confirmation=e.confirmationForV2(state,input);
   result=e.applyCommandV2(c,state,input);
  }
  assert.equal(result.ok,true,JSON.stringify({at:state.currentScene,input,error:result.error}));
  state=result.state;
 }
 function choose(id){
  assert.ok(e.availableChoicesV2(c,state).some(x=>x.id===f(id)),`Unavailable ${id} at ${state.currentScene}`);
  command({type:'choose',choiceId:f(id)});
 }
 choose('hear-noor');choose(r.closed?'break-promise':'keep-promise');
 choose(r.closed?'look-after-touch':'watch-release');
 const exposure=JSON.stringify(e.currentPassageV2(state));
 if(!r.closed)assert.ok(!exposure.includes('remember the mouth under your hand'),'kept route invented covert touch');
 choose(r.closed?'rope-touched':'hold-root-kept');choose(r.closed?'rope-secured':'root-secured');choose('sill-investigate');
 if(r.table){choose('talk-table');choose(r.table);choose(r.table==='table-want'?'table-want-back':r.table==='table-affection-choice'?'table-affection-back':'table-refusal-back');}
 if(r.root){choose('talk-root');if(r.confess==='private'){choose('private-confession');choose('confession-back');}else choose('root-back');}
 choose('inspect-p');choose('p-back');choose('inspect-wedge');choose('q-back');
 choose('go-below');choose('look-under-place');
 assert.ok(!state.sources.some(x=>x.id===f('cast-removed')),'inspection silently removed cast');
 if(r.postponeRemoval){choose('niche-before-removal');}
 else{choose('isolate-occupied-cast');choose('look-niche');}
 choose(r.test?'operate-empty-return':'decline-empty-return');choose(r.test?'test-back':'decline-test-back');
 if(r.postponeRemoval){choose('remove-cast-later');choose('removed-after-test');}
 choose('organize-finding');
 snapshots.push(state.transcript.map(x=>JSON.stringify(x)));
 const selected=[f('p-cut'),f(r.support),f('cast-source'),...(r.extraPrivate?[f('closed-source')]:[])];
 const beforeBad=JSON.stringify(state);
 const bad=e.applyCommandV2(c,state,{type:'submitDeduction',id:r.name+'.bad',expectedRevision:state.revision,questionId:f('preparation-question'),candidateId:f('tree-alone'),selectedRefs:selected});
 assert.equal(bad.ok,false);assert.equal(JSON.stringify(state),beforeBad,'wrong conclusion changed state');
 const premature=e.applyCommandV2(c,state,{type:'submitDeduction',id:r.name+'.incomplete',expectedRevision:state.revision,questionId:f('preparation-question'),candidateId:f('prepared-return'),selectedRefs:[f('p-cut')]});
 assert.equal(premature.ok,false);assert.equal(JSON.stringify(state),beforeBad);
 command({type:'submitDeduction',questionId:f('preparation-question'),candidateId:f('prepared-return'),selectedRefs:selected});
 assert.equal(state.currentScene,f('finding-private'));
 if(r.extraPrivate)assert.ok(state.deductions.find(d=>d.id===f('preparation-question')).selectedRefs.includes(f('closed-source')),'private-reference test did not actually select private evidence');
 choose('tell-finding');
 const npc=id=>state.npcState.find(x=>x.id===f(id));
 if(r.extraPrivate){
  for(const actor of ['noor','dora-table','dora-orchard']){
   assert.ok(!npc(actor).knows.includes(f('closed-source')),`${actor} learned private proof support from public report`);
   assert.ok(!npc(actor).knows.includes(f('confession-source')),`${actor} received unspoken confession`);
  }
 }
 if(r.confess==='private'){
  assert.ok(npc('dora-orchard').knows.includes(f('confession-source')));
  assert.ok(!npc('noor').knows.includes(f('confession-source')));
  assert.ok(!npc('dora-table').knows.includes(f('confession-source')));
 }
 if(r.confess==='public'){choose('report-confess');choose('confessed-go-transfer');}else choose('report-go-transfer');
 choose(r.reach);choose(r.reach==='offer-new-reach'?'offer-to-argument':r.reach==='offer-old-body'?'reconstruction-to-argument':'handover-to-argument');
 const argument=e.currentPassageV2(state);
 assert.equal(argument.variantId,r.reach==='ask-handover'?f('argument-handover'):f('god-argument.base'));
 choose('after-argument');choose(r.end==='dry'?'choose-dry':'choose-orchard');choose(r.end==='dry'?'leave-for-dry':'leave-for-orchard');
 assert.equal(state.ended,false,'former chapter departure still ended the new edition');
 assert.equal(state.currentScene,f(r.end==='dry'?'dry-departure':'orchard-departure'));
 const frozenPrefix=state.transcript.map(x=>JSON.stringify(x));
 const has=id=>state.sources.some(x=>x.id===f(id));
 const knows=(actor,id)=>npc(actor).knows.includes(f(id));
 if(r.end==='orchard'){
  choose('continue-orchard-departure');choose('follow-rain-strip');choose('ask-about-cradle');
  assert.ok(has('rain-present')&&has('rain-strip-test')&&has('alma-account'));
  assert.ok(!knows('dora-orchard','alma-account'),'distant root overheard private cradle witness');
  choose(r.material==='loan'?'borrow-cradle':'make-cradle-rubbing');
  assert.equal(has('cradle-loan'),r.material==='loan');
  assert.equal(has('cradle-rubbing'),r.material==='rubbing');
  choose(r.material==='loan'?'loan-to-root':'rubbing-to-root');
  assert.equal(e.currentPassageV2(state).variantId,r.material==='loan'?f('orchard-report-with-cradle'):f('orchard-report.base'));
  assert.ok(!knows('dora-orchard','orchard-tool-report'),'report knowledge installed before explicit report choice');
  choose('tell-orchard-departure');
  assert.ok(knows('dora-orchard','orchard-tool-report'));
  assert.ok(!knows('dora-table','orchard-tool-report')&&!knows('noor','orchard-tool-report'));
  choose('orchard-reach-house');
  assert.ok(!has('floor-source')&&!has('basil-account')&&!has('pipe-sound'));
 }else{
  choose('continue-dry-departure');choose('inspect-source-floor');
  assert.ok(has('floor-source')&&has('basil-account'));
  choose(r.material==='panel'?'arrange-panel':'trace-floor');
  assert.equal(has('panel-arranged'),r.material==='panel');
  assert.equal(has('floor-tracing'),r.material==='tracing');
  choose(r.material==='panel'?'panel-to-pipe':'tracing-to-pipe');
  choose(r.pipe?'accept-pipe-part':'prefer-bodily-whistle');
  choose(r.pipe?'rehearsal-next':'invitation-next');
  assert.equal(has('pipe-rehearsed'),r.pipe);
  assert.equal(has('whistle-invitation'),!r.pipe);
  assert.equal(state.flags.includes(f('borrowed_pipe')),r.pipe);
  assert.equal(state.flags.includes(f('promised_performance')),r.pipe);
  assert.ok(!state.sources.some(x=>/recovered.{0,12}whistle/i.test(x.title)),'pipe silently restored bodily capacity');
  choose('tell-dry-departure');choose('dry-reach-house');
  assert.ok(!has('rain-present')&&!has('rain-strip-test')&&!has('alma-account'));
  assert.ok(!knows('dora-orchard','basil-account')&&!knows('noor','basil-account'));
 }
 assert.equal(state.currentScene,f('house-window'));
 assert.equal(e.currentPassageV2(state).variantId,r.end==='dry'?f('house-window-with-lamp'):r.material==='loan'?f('house-window-with-cradle'):f('house-window.base'));
 for(const actor of ['emil','rene'])assert.ok(!knows(actor,'closed-source')&&!knows(actor,'confession-source'));
 choose('tell-emil-mechanism');
 assert.ok(knows('emil','house-report'));
 assert.ok(!knows('emil','closed-source')&&!knows('emil','confession-source'),'house report disclosed private earlier conduct');
 assert.ok(has('emil-cut-account')&&has('emil-consent-account'));
 assert.ok(!has('emil-written')&&!has('emil-oral-offer'));
 choose(r.written?'write-emil-account':'keep-emil-oral');
 assert.equal(has('emil-written'),r.written);
 assert.equal(has('emil-oral-offer'),!r.written);
 choose(r.written?'written-to-leaf':'oral-to-leaf');
 assert.ok(has('emil-leaf-return')&&has('emil-outside-account'));
 assert.ok(!has('emil-earlier-control'),'an earlier unwitnessed trial was acquired before Emil reported it');
 choose('ask-emil-drawing');
 assert.ok(has('emil-earlier-control')&&has('emil-control-condition')&&has('emil-relationship'));
 choose('wait-house-door');
 for(const actor of ['noor','dora-table','dora-orchard','alma','basil','rene']){
  for(const id of ['emil-cut-account','emil-consent-account','emil-written','emil-oral-offer','emil-relationship'])assert.ok(!knows(actor,id),`${actor} received private house item ${id}`);
 }
 choose('tell-rene-cast');
 assert.equal(state.ended,true);
 assert.equal(state.currentScene,f('rene-arrival'));
 assert.ok(knows('emil','rene-arrival-account')&&knows('rene','rene-arrival-account'));
 assert.ok(!knows('rene','house-report')&&!knows('rene','emil-relationship'));
 function ancestry(id,seen=new Set()){
  assert.ok(!seen.has(id),'cyclic captured source ancestry');seen.add(id);
  const item=state.sources.find(x=>x.id===id)??state.deductions.find(x=>x.id===id);
  assert.ok(item,`unencountered parent ${id}`);
  const parents=item.derivedFrom??item.witnessRefs;
  return parents?[...new Set(parents.flatMap(parent=>ancestry(parent,new Set(seen))))].sort():[item.provenanceId];
 }
 assert.deepEqual(ancestry(f('house-report')),[f('cast-installation'),f('cast-removed'),f('direct-braid-material'),f('release-mechanism')].sort());
 assert.ok(!ancestry(f('house-report')).includes(f('closed-source')),'physical spoken report acquired private proof origin');
 assert.deepEqual(ancestry(f('emil-cut-account')),[f('emil-cut-memory')]);
 assert.deepEqual(ancestry(f('emil-consent-account')),[f('emil-cut-memory')]);
 if(r.written)assert.deepEqual(ancestry(f('emil-written')),[f('emil-cut-memory')],'transcription manufactured independent witness origin');
 else assert.deepEqual(ancestry(f('emil-oral-offer')),[f('emil-cut-memory')]);
 if(r.end==='orchard'){
  assert.deepEqual(ancestry(f('orchard-tool-report')),[f('alma-memory'),f('cradle-material')]);
  if(r.material==='rubbing')assert.deepEqual(ancestry(f('cradle-rubbing')),[f('alma-memory'),f('cradle-material')]);
 }else if(r.material==='tracing')assert.deepEqual(ancestry(f('floor-tracing')),[f('basil-memory'),f('source-floor-material')]);

 for(const actor of ['alma','basil','emil','rene'])assert.ok(!knows(actor,'closed-source')&&!knows(actor,'confession-source'),'earlier disclosure became global');
 assert.deepEqual(state.transcript.map(x=>JSON.stringify(x)).slice(0,frozenPrefix.length),frozenPrefix,'earlier chapter transcript changed');
 const visible=JSON.stringify(e.projectPlayerV2(c,state));
 assert.ok(!visible.includes('supportedCandidateId')&&!visible.includes('npcState'),'player projection leaked author/NPC state');
 if(r.end==='orchard')assert.ok(!visible.includes('Basil’s account of taking the square'),'unvisited-route evidence leaked');
 else assert.ok(!visible.includes('Alma’s bounded account'),'unvisited-route evidence leaked');
 if(!r.test){assert.ok(!state.sources.some(x=>x.id===f('cup-return')));assert.ok(state.sources.some(x=>x.id===f('cup-declined')));}
 if(!r.closed){assert.ok(!state.sources.some(x=>x.id===f('closed-source')));assert.ok(!state.sources.some(x=>x.id===f('confession-source')));}
 const exported=e.exportPortableV2(state);
 const restored=e.importPortableV2(c,exported);assert.equal(restored.ok,true,JSON.stringify(restored.errors));
 assert.deepEqual(restored.value,state);
 const current=state.transcript.map(x=>JSON.stringify(x));
 assert.deepEqual(current.slice(0,snapshots[0].length),snapshots[0],'captured passage history changed');
 assert.equal(fs.readFileSync(contentPath).toString(),bytes.toString(),'content changed during route check');
 const paragraphs=state.transcript.filter(x=>x.kind==='passage').flatMap(x=>x.paragraphs);
 const words=paragraphs.join(' ').match(/\b[\p{L}\p{N}’'-]+\b/gu)?.length??0;
 if(!preserveReadings)fs.writeFileSync(path.join(out,r.name+'.md'),'# '+r.name+'\n\n'+state.transcript.map(x=>x.kind==='passage'?'## '+x.title+'\n\n'+x.paragraphs.join('\n\n'):'> '+x.label).join('\n\n')+'\n');
 if(!preserveReadings)fs.writeFileSync(path.join(out,r.name+'.run.json'),exported);
 results.push({name:r.name,commands:state.commands.length,passageWords:words,ending:state.currentScene,passed:true});
}
const engineFiles=fs.readdirSync(path.join(root,'src/engine')).filter(x=>x.startsWith('evidence-')&&x.endsWith('.ts')).sort();
const report={contentSha256:hash,validation:true,engineSources:engineFiles.map(file=>({file:'src/engine/'+file,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'src/engine',file))).digest('hex')})),routes:results,checks:['Explicit selected private proof remains private in later reports.','Checked and oral Emil accounts retain one witness origin.','Rubbings/tracings inherit actual encountered material and account ancestry.','No unperformed physical fit, borrowed object, bodily recovery or opposite-route source is acquired.','Private audiences and current house-arrival variants are checked.','Wrong/incomplete proof rejects without mutation; exact old passage history and portable replay preserved.'],limits:['Automated authored routes, not human playtests.','First country journey and house chapter only; no physical-fit/confrontation, bodily-return, later washing or ending implementation claim.','No browser or 3D assertions in this script.']};
fs.writeFileSync(path.join(import.meta.dirname,'ROUTE-CHECK-V5.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({contentSha256:hash,validation:report.validation,routes:results,checks:['Explicit selected private proof remains private in later reports.','Checked and oral Emil accounts retain one witness origin.','Rubbings/tracings inherit actual encountered material and account ancestry.','No unperformed physical fit, borrowed object, bodily recovery or opposite-route source is acquired.','Private audiences and current house-arrival variants are checked.','Wrong/incomplete proof rejects without mutation; exact old passage history and portable replay preserved.'],limits:report.limits},null,2));
