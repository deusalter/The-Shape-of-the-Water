import {readFileSync,writeFileSync} from 'node:fs';
import {validateContentV2,createGameV2,applyCommandV2,confirmationForV2,availableChoicesV2,exportPortableV2,importPortableV2} from '../../src/engine/evidence-v2';
import type {GameStateV2,CommandV2} from '../../src/engine/evidence-types';
const raw=JSON.parse(readFileSync('src/content/case-v2.json','utf8'));
const checked=validateContentV2(raw);
if(!checked.ok){console.log(JSON.stringify(checked,null,2));process.exit(1);}
const c=checked.value;
const findings:any[]=[];
function assert(test:boolean,message:string){if(!test)throw new Error(message);}
function choice(s:GameStateV2,id:string){
 const option=availableChoicesV2(c,s).find(x=>x.id===id);assert(!!option,'Unavailable '+id+' at '+s.currentScene);
 const cmd:CommandV2={type:'choose',id:'check.'+s.revision+'.'+id,expectedRevision:s.revision,choiceId:id};
 if(option!.ending||option!.irreversible)cmd.confirmation=confirmationForV2(s,cmd);
 const r=applyCommandV2(c,s,cmd);if(!r.ok)throw new Error(id+': '+r.error.message);return r.state;
}
function proof(s:GameStateV2,refs:string[],candidateId='rescue-then-impact'){
 return applyCommandV2(c,s,{type:'submitDeduction',id:'proof.'+s.revision,expectedRevision:s.revision,questionId:'accident-sequence',candidateId,selectedRefs:refs});
}
function finish(s:GameStateV2){
 for(const id of ['finding-share','shared-optics','optics-narrow','cabinet-report','report-public','public-next','continue-supper-only'])s=choice(s,id);
 assert(s.ended,'Ending missing');
 const round=importPortableV2(c,exportPortableV2(s));assert(round.ok,'Portable replay failed');return s;
}
let p=createGameV2(c);
for(const id of ['arrival-miriam','bench-record','hub-workshop','workshop-to-test'])p=choice(p,id);
assert(!availableChoicesV2(c,p).some(x=>x.id==='hub-shared'),'Progression unlocked without submission');
const incomplete=proof(p,['request-before-cut','ada-cut']);assert(!incomplete.ok&&incomplete.error.code==='premature','Incomplete proof must be premature');
const pr=proof(p,['request-before-cut','ada-cut','present-empty-release-test','present-impact-geometry','present-simon-binding']);assert(pr.ok,'Physical route rejected');
if(pr.ok){
 assert(!pr.state.npcState.find(x=>x.id==='simon')!.knows.includes('accident-sequence'),'Submission automatically disclosed finding');
 const end=finish(pr.state);findings.push({route:'physical-selected-test',ended:end.ended,revision:end.revision,words:end.transcript.filter(x=>x.kind==='passage').reduce((n,x)=>n+('paragraphs'in x?x.paragraphs.join(' ').split(/\s+/).length:0),0)});
}
let f=createGameV2(c);for(const id of ['arrival-ada','workshop-record','hub-gallery','gallery-recording'])f=choice(f,id);
const wrong=proof(f,['continuous-recording'],'cut-before-request');assert(!wrong.ok&&wrong.error.code==='contradictory','Known contradictory order must reject');
const fr=proof(f,['continuous-recording']);assert(fr.ok,'Recording route rejected');if(fr.ok){const end=finish(fr.state);findings.push({route:'recording-selected',ended:end.ended,revision:end.revision});}
let privateRoute=createGameV2(c);for(const id of ['arrival-miriam','bench-record','hub-miriam-private','miriam-private-listen','hub-gallery','gallery-recording'])privateRoute=choice(privateRoute,id);
assert(privateRoute.sources.some(x=>x.id==='present-miriam-confidence'),'Actual confidence not acquired');
const extra=proof(privateRoute,['continuous-recording','present-miriam-confidence']);assert(!extra.ok&&extra.error.code==='irrelevant','Private confidence must not pad proof');
assert(!privateRoute.npcState.find(x=>x.id==='simon')!.knows.includes('present-miriam-confidence'),'Private source leaked to Simon');
let refusal=createGameV2(c);for(const id of ['arrival-miriam','bench-panic','miriam-account-record','hub-miriam-private'])refusal=choice(refusal,id);
assert(!refusal.sources.some(x=>x.id==='present-miriam-confidence'),'Withheld private scene acquired a source');
findings.push({privacy:'private source absent on refused branch; known private source rejected as irrelevant; no automatic NPC disclosure'});
const report={status:'PASS',scope:'lead-authored candidate routes, not whole graph exploration or human test',scenes:c.scenes.length,sources:c.sources.length,questions:c.questions.length,findings};
writeFileSync('narrative/loop/V2-CANDIDATE-CHECK.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
