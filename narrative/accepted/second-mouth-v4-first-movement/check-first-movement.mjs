import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { build } from 'esbuild';
const root=path.resolve(import.meta.dirname,'../..');
const contentPath=path.join(root,'src/content/case-v4.json');
const bytes=fs.readFileSync(contentPath);
const hash=crypto.createHash('sha256').update(bytes).digest('hex');
const out=path.join(import.meta.dirname,'readings');fs.mkdirSync(out,{recursive:true});
const enginePath='/tmp/second-mouth-route-engine.mjs';
await build({entryPoints:[path.join(root,'src/engine/evidence-v2.ts')],outfile:enginePath,bundle:true,platform:'node',format:'esm'});
const e=await import(enginePath+'?'+Date.now());
const validation=e.validateContentV2(JSON.parse(bytes));
assert.equal(validation.ok,true,JSON.stringify(validation.errors));
const c=validation.value;
const f=x=>'o0.'+x;
const variants=[
 {name:'kept-test-dry',closed:false,test:true,table:'table-want',root:true,confess:'none',reach:'offer-new-reach',end:'dry',support:'release-source'},
 {name:'closed-declined-private-proof-orchard',closed:true,test:false,table:'table-memory-test',root:false,confess:'none',reach:'ask-handover',end:'orchard',support:'wedge-source',extraPrivate:true},
 {name:'closed-private-confession-dry',closed:true,test:true,table:'table-affection-choice',root:true,confess:'private',reach:'offer-old-body',end:'dry',support:'wedge-source'},
 {name:'closed-public-confession-orchard',closed:true,test:true,table:null,root:false,confess:'public',reach:'offer-new-reach',end:'orchard',support:'wedge-source'},
 {name:'kept-declined-orchard',closed:false,test:false,table:null,root:false,confess:'none',reach:'offer-old-body',end:'orchard',support:'wedge-source'}
];
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
 choose('go-below');choose('look-under-place');choose('look-niche');choose(r.test?'operate-empty-return':'decline-empty-return');choose(r.test?'test-back':'decline-test-back');choose('organize-finding');
 snapshots.push(state.transcript.map(x=>JSON.stringify(x)));
 const selected=[f('p-cut'),f(r.support),f('cast-source'),...(r.extraPrivate?[f('closed-source')]:[])];
 const beforeBad=JSON.stringify(state);
 const bad=e.applyCommandV2(c,state,{type:'submitDeduction',id:r.name+'.bad',expectedRevision:state.revision,questionId:f('preparation-question'),candidateId:f('tree-alone'),selectedRefs:selected});
 assert.equal(bad.ok,false);assert.equal(JSON.stringify(state),beforeBad,'wrong conclusion changed state');
 const premature=e.applyCommandV2(c,state,{type:'submitDeduction',id:r.name+'.incomplete',expectedRevision:state.revision,questionId:f('preparation-question'),candidateId:f('prepared-return'),selectedRefs:[f('p-cut')]});
 assert.equal(premature.ok,false);assert.equal(JSON.stringify(state),beforeBad);
 command({type:'submitDeduction',questionId:f('preparation-question'),candidateId:f('prepared-return'),selectedRefs:selected});
 assert.equal(state.currentScene,f('finding-private'));
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
 assert.equal(state.ended,true);
 assert.equal(state.currentScene,f(r.end==='dry'?'dry-departure':'orchard-departure'));
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
 fs.writeFileSync(path.join(out,r.name+'.md'),'# '+r.name+'\n\n'+state.transcript.map(x=>x.kind==='passage'?'## '+x.title+'\n\n'+x.paragraphs.join('\n\n'):'> '+x.label).join('\n\n')+'\n');
 fs.writeFileSync(path.join(out,r.name+'.run.json'),exported);
 results.push({name:r.name,commands:state.commands.length,passageWords:words,ending:state.currentScene,passed:true});
}
const engineFiles=fs.readdirSync(path.join(root,'src/engine')).filter(x=>x.startsWith('evidence-')&&x.endsWith('.ts')).sort();
const report={contentSha256:hash,validation:true,engineSources:engineFiles.map(file=>({file:'src/engine/'+file,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'src/engine',file))).digest('hex')})),routes:results,limits:['Automated authored routes, not human playtests.','First movement only; no claim to a completed long-form game or measured duration.','No browser or 3D assertions in this script.']};
fs.writeFileSync(path.join(import.meta.dirname,'ROUTE-CHECK-V4.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
