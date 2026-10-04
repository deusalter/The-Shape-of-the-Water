// Lead-authored bounded content routes. This does not certify the whole graph.
import {registerHooks} from 'node:module';
import {existsSync,readFileSync,writeFileSync,mkdirSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
registerHooks({resolve(s,c,n){if(s.startsWith('.')&&!/\.[a-z]+$/.test(s)){const u=new URL(s+'.ts',c.parentURL);if(existsSync(u))return n(u.href,c)}return n(s,c)}});
const E=await import('../../src/engine/evidence-v2.ts');
const bytes=readFileSync('src/content/case-expanded.json');
const hash=createHash('sha256').update(bytes).digest('hex');
const checked=E.validateContentV2(JSON.parse(bytes));
if(!checked.ok){console.log(JSON.stringify(checked,null,2));process.exit(1)}
const c=checked.value;
const dir='narrative/loop/expanded-readings';mkdirSync(dir,{recursive:true});
const cases=[
 {id:'recording-refusal-no-private-history',first:['arrival-cabinet','cabinet-cautious','hub-gallery','gallery-recording','recording-keep'],refs:['continuous-recording'],extra:[],audience:'public',night:'continue-leave',expected:'o1.ending-front',overrides:{'o1.before-going':'o1.before-going.ordinary.choose','o1.keep-time':'o1.admit-new-loss'}},
 {id:'private-history-public-promise-repeat',first:['arrival-miriam','bench-record','hub-workshop','workshop-to-test','release-record'],refs:['request-before-cut','ada-cut','binding-test'],extra:['hub-gallery','gallery-hub','hub-ada-private','ada-miriam-leave','hub-simon-private','simon-ada-leave','hub-miriam-private','miriam-private-listen'],audience:'private',night:'continue-supper-only',expected:'o2.ending-return',localProof:true,overrides:{'o1.return':'o1.return.handle.choose','o1.ada-chair':'o1.ada-chair.ask-hand.choose','o1.water-hand':'o1.water-hand.confidence.choose','o1.water-return':'o1.water-return.thursday.choose','o1.promise-audience':'o1.tell-promise','o1.last-test':'o1.ask-ada-first','o1.route-decision':'o1.route-decision.discuss','o1.test-discussion':'o1.ask-positions','o1.test-ready':'o1.cross-empty'}},
 {id:'pressed-history-canceled-test',first:['arrival-miriam','bench-panic','miriam-account-record','hub-workshop','workshop-to-test','release-record','hub-gallery','gallery-accuse','simon-account-record'],refs:['request-before-cut','ada-cut','binding-test'],extra:['hub-miriam-private','miriam-private-listen','hub-simon-private','simon-ada-leave'],audience:'public',night:'continue-leave',expected:'o1.ending-front',overrides:{'o1.water-hand':'o1.water-hand.quiet.choose','o1.bread-thanks':'o1.bread-thanks.test.choose','o1.before-going':'o1.before-going.another.choose','o1.last-test':'o1.last-test.discuss','o1.test-discussion':'o1.ask-positions','o1.test-ready':'o1.stop-test'}},
 {id:'all-front-postponement',first:['arrival-ada','workshop-record','hub-gallery','gallery-recording','recording-keep'],refs:['continuous-recording'],extra:[],audience:'public',night:'continue-stay',expected:'o1.ending-front',overrides:{'o0.emmy-arrival':'o0.emmy-arrival.ask-simon.choose','o1.last-test':'o1.last-test.discuss','o1.test-discussion':'o1.postpone-together'}},
];
const fileHash=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const engineFiles=readdirSync('src/engine').filter(f=>f.startsWith('evidence-')&&f.endsWith('.ts')).sort().map(f=>({path:'src/engine/'+f,sha256:fileHash('src/engine/'+f)}));
const report={status:'RUNNING',scope:'Four lead-authored actual-engine routes; not exhaustive, independent, browser, human or measured-duration verification.',caseSha256:hash,contentId:c.id,contentVersion:c.version,engineFiles,routes:[],failures:[]};
const words=s=>(s.match(/\b\w+(?:[’'\-]\w+)*\b/gu)||[]).length;
for(const def of cases){
 let state=E.createGameV2(c);let steps=0;let firstOrdinary=false;let snapshotChecked=false;
 const doCommand=payload=>{
  const cmd={...payload,id:def.id+'.'+state.revision,expectedRevision:state.revision};
  if(cmd.type==='choose'){
   const option=E.availableChoicesV2(c,state).find(x=>x.id===cmd.choiceId);
   assert(option,`Unavailable ${cmd.choiceId} at ${state.currentScene}`);
   if(cmd.choiceId==='o0.carry-through'){
    assert(!option.ending&&!option.irreversible,'First crossing reveals an unknown consequence in a receipt');
    firstOrdinary=true;
    const hidden=E.exportPortableV2(state);assert(!hidden.includes('miriam_exterior'),'Hidden actor escaped into portable data');
    assert(!state.sources.some(x=>x.id==='o0.miriam-chair-perception'),'NPC-only exact perception leaked');
   }
   if(option.ending||option.irreversible)cmd.confirmation=E.confirmationForV2(state,cmd);
  }
  const result=E.applyCommandV2(c,state,cmd);
  assert(result.ok,`${state.currentScene} ${JSON.stringify(cmd)}: ${JSON.stringify(result.error)}`);
  state=result.state;steps++;
  if(state.currentOccasionId==='o1'&&!snapshotChecked){
   assert(!state.npcState.find(x=>x.id==='o1.ada').knows.includes('o0.accident-sequence'));
   assert(state.npcState.find(x=>x.id==='miriam_exterior').snapshot,'Exterior snapshot absent');
   assert(state.npcState.find(x=>x.id==='miriam_exterior').knows.includes('o0.miriam-chair-perception'));
   snapshotChecked=true;
  }
  if(state.currentScene==='o1.test-ready'){
   for(const id of ['o1.ada','o1.simon','o1.miriam','miriam_exterior'])assert(state.npcState.find(x=>x.id===id).knows.includes('o1.public-trial-discussion'),'Known participation risk missing before final decision: '+id);
   const discussion=state.transcript.find(x=>x.kind==='passage'&&x.sceneId==='o1.test-discussion');
   assert(discussion?.paragraphs.some(p=>p.includes('remains somewhere you cannot reach')),'Full availability risk absent from repeat route');
  }
 };
 const walk=ids=>ids.forEach(id=>doCommand({type:'choose',choiceId:'o0.'+id}));
 try{
  walk(def.first);walk(def.extra);
  doCommand({type:'submitDeduction',questionId:'o0.accident-sequence',candidateId:'o0.rescue-then-impact',selectedRefs:def.refs.map(x=>'o0.'+x)});
  walk(['finding-share','shared-optics','optics-narrow','cabinet-report','report-'+def.audience,def.audience+'-next',def.night]);
  assert(!state.ended,'First evening improperly ends expanded run');
  const prefix=structuredClone(state.transcript);
  while(!state.ended&&steps<240){
   if(state.currentScene==='o0.layout-folder'){
    const bad=E.applyCommandV2(c,state,{type:'submitDeduction',id:'negative.'+state.revision,expectedRevision:state.revision,questionId:'o0.picture-production',candidateId:'drawn-line',selectedRefs:['o0.linked-frame','o0.editable-layout']});
    assert(!bad.ok,'False drawn-line account accepted');
    doCommand({type:'submitDeduction',questionId:'o0.picture-production',candidateId:'whole-image',selectedRefs:['o0.received-invitation','o0.linked-frame','o0.editable-layout']});continue;
   }
   if(state.currentScene==='o1.wood-result'&&def.localProof&&!state.deductions.some(x=>x.id==='o1.local-continuation')){
    const falseClaim=E.applyCommandV2(c,state,{type:'submitDeduction',id:'negative.local.'+state.revision,expectedRevision:state.revision,questionId:'o1.local-continuation',candidateId:'only-recording',selectedRefs:['o1.two-miriams']});
    assert(!falseClaim.ok,'Co-presence dismissed as recording');
    doCommand({type:'submitDeduction',questionId:'o1.local-continuation',candidateId:'local-coexistence',selectedRefs:['o1.two-miriams','o1.sunday-account','o1.wood-pair','o0.marked-wood-preparation']});continue;
   }
   const choices=E.availableChoicesV2(c,state);
   assert(choices.length,`No route onward from ${state.currentScene}`);
   const next=def.overrides[state.currentScene]??choices[0].id;
   doCommand({type:'choose',choiceId:next});
  }
  assert(state.ended,'Route exceeded bound');assert.equal(state.currentScene,def.expected);
  assert(firstOrdinary&&snapshotChecked);
  assert.deepEqual(state.transcript.slice(0,prefix.length),prefix,'Earlier literal transcript changed');
  const text=state.transcript.filter(x=>x.kind==='passage').map(x=>`## ${x.sceneId} / ${x.variantId}\n\n${x.paragraphs.join('\n\n')}`).join('\n\n');
  assert(!text.includes('#### Common')&&!text.includes('Available only after')&&!text.includes('only if they actually were'),'Editorial material reached the player');
  const ext=state.npcState.find(x=>x.id==='miriam_exterior');
  assert(!ext.knows.includes('o1.mother-recollection'),'Current private disclosure reached exterior listener');
  assert(!ext.knows.includes('o1.kitchen-confidence'),'Current kitchen confidence reached exterior listener');
  assert(!state.npcState.find(x=>x.id==='o1.simon').knows.includes('o1.advance-notice-promise'),'Public promise imported the private conversation');
  if(state.currentOccasionId==='o2'){
   assert(ext.knows.includes('o1.promise-public'),'Actually public promise not retained');
   assert(state.sources.some(x=>x.id==='o2.promise-recalled'),'Guarded public callback absent');
   assert(!state.npcState.find(x=>x.id==='o2.ada').knows.includes('o1.shared-music'),'Renewed Ada inherited the music');
   assert(!state.sources.some(x=>x.id==='o2.present-sabotage-message'),'Hidden return phone screen acquired');
  }else assert(!state.sources.some(x=>x.occasionId==='o2'),'Unperformed second crossing acquired');
  if(def.id.includes('pressed')){
   assert(!state.sources.some(x=>x.id==='o0.present-miriam-confidence'),'Old refusal manufactured confidence');
   assert(state.sources.some(x=>x.id==='o1.kitchen-confidence'),'New present confidence unavailable after old refusal');
   assert(state.sources.some(x=>x.id==='o1.canceled-recording'),'Actual canceled recording missing');
  }
  if(def.id==='all-front-postponement'){
   const spoken=state.sources.find(x=>x.id==='o0.simon-emmy-account');
   assert(spoken&&spoken.speakerId==='o0.simon','Simon’s performed account carries another speaker');
   assert(!state.sources.some(x=>x.id==='o0.emmy-accident-report'),'Blaise acquired an unspoken account');
   assert(state.npcState.find(x=>x.id==='o0.emmy').knows.includes('o0.simon-emmy-account'),'Emmy did not receive the performed account');
   assert(state.transcript.some(x=>x.kind==='passage'&&x.variantId==='o1.refuse.postponed'),'Postponement did not preserve current coat/camera positions');
  }
  const portable=E.exportPortableV2(state);const round=E.importPortableV2(c,portable);
  assert(round.ok,'Portable replay failed: '+JSON.stringify(round.errors));
  writeFileSync(`${dir}/${def.id}.md`,`# Expanded captured route: ${def.id}\n\nActual engine output at ${hash}. A bounded authored route, not human timing or full-game acceptance.\n\n${text}\n`);
  writeFileSync(`${dir}/${def.id}.run.json`,portable);
  const passageWords=state.transcript.filter(x=>x.kind==='passage').reduce((n,p)=>n+words(p.paragraphs.join(' ')),0);
  const wordsByOccasion=Object.fromEntries(c.occasions.map(o=>[o.id,state.transcript.filter(x=>x.kind==='passage'&&x.occasionId===o.id).reduce((n,p)=>n+words(p.paragraphs.join(' ')),0)]));
  report.routes.push({id:def.id,finalScene:state.currentScene,occasion:state.currentOccasionId,commands:state.commands.length,passageWords,wordsByOccasion,portableBytes:Buffer.byteLength(portable),knownSources:state.sources.length,acceptedQuestions:state.deductions.map(x=>x.id),replay:'PASS',path:`${dir}/${def.id}.md`});
 }catch(error){report.failures.push({route:def.id,scene:state.currentScene,revision:state.revision,error:String(error)});break}
}
report.sourceStable=fileHash('src/content/case-expanded.json')===hash&&engineFiles.every(f=>fileHash(f.path)===f.sha256);
if(!report.sourceStable)report.failures.push({error:'Content or engine changed during checks; rerun against a stable input.'});
report.status=report.failures.length?'FAIL':'PASS';
writeFileSync('narrative/loop/EXPANDED-ROUTE-CHECK.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(report.failures.length)process.exit(1);
