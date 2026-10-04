import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { occasionFixture } from '../../../src/engine/evidence-occasion-fixture';
import { applyCommandV2, availableChoicesV2, createGameV2, exportPortableV2, importPortableV2, validateContentV2 } from '../../../src/engine/evidence-v2';
import { ancestralOriginsV2 } from '../../../src/engine/evidence-occasions';
import type { CommandV2, ContentV2, GameStateV2 } from '../../../src/engine/evidence-types';

const out='docs/reviews/OCCASION-INTEGRATION-06';
const sha=(data:Buffer|string)=>createHash('sha256').update(data).digest('hex');
const sourcePaths=[...readdirSync('src/engine').filter(name=>name.startsWith('evidence-')).map(name=>`src/engine/${name}`),...readdirSync('tests').filter(name=>name.startsWith('occasion-')).map(name=>`tests/${name}`),'docs/contracts/OCCASIONS-V2.md','src/content/case-v2.json'];
const previousPaths=['probe.ts','probe.mjs','probe-results.json','probe.stdout.json','source-hashes.json','bounded-test-results.json','REPORT.md'].map(path=>`${out}/${path}`);
const hashes=(paths:string[])=>Object.fromEntries(paths.map(path=>[path,sha(readFileSync(path))]));
const before=hashes(sourcePaths),earlierEvidence=hashes(previousPaths);
const checked=(raw:ContentV2)=>{const result=validateContentV2(raw);assert.equal(result.ok,true,!result.ok?result.errors.join('\n'):'');if(!result.ok)throw new Error('unreachable');return result.value;};
const input=(state:GameStateV2,action:Record<string,unknown>)=>({id:`recheck-${state.revision}`,expectedRevision:state.revision,...action}) as CommandV2;
const run=(content:ContentV2,state:GameStateV2,action:Record<string,unknown>)=>{const result=applyCommandV2(content,state,input(state,action));assert.equal(result.ok,true,!result.ok?result.error.message:'');return result.state;};
const choose=(content:ContentV2,state:GameStateV2,choiceId:string)=>run(content,state,{type:'choose',choiceId});
const trace=(content:ContentV2,state:GameStateV2,ids:string[])=>ids.reduce((s,id)=>choose(content,s,id),state);
const finding=(content:ContentV2,state:GameStateV2,refs:string[])=>run(content,state,{type:'submitDeduction',questionId:'o0.finding',candidateId:'supported',selectedRefs:refs});
const filmRoute=['inspect-old-film','prepare-chair','front-departure','first-crossing','inspect-current-film'];
const replay=(content:ContentV2,state:GameStateV2)=>{const imported=importPortableV2(content,exportPortableV2(state));assert.equal(imported.ok,true);if(imported.ok)assert.equal(JSON.stringify(imported.value),JSON.stringify(state));};
const results:Record<string,unknown>={};

// Exact original one-field provenance failure must now reject during validation.
const provenanceRaw=structuredClone(occasionFixture);
provenanceRaw.sources.find(source=>source.id==='o1.film')!.provenanceId='new-origin-from-occasion-only';
const provenance=validateContentV2(provenanceRaw);
assert.equal(provenance.ok,false);
assert.match(!provenance.ok?provenance.errors.join(' '):'',/originating provenance/);
results.originalProvenanceRepro={validationAccepted:provenance.ok,errors:!provenance.ok?provenance.errors:[]};

// Exact original base/variant and gate cases must now use pre-entry closure.
for(const gated of [false,true]){
  const raw=structuredClone(occasionFixture);
  raw.interpretationRules.push({id:'o1.on-arrival',occasionId:'o1',title:'Remember at arrival',text:'Earlier evidence is remembered.',when:{op:'hasSource',id:'o0.film',scope:'historical'},relatedRefs:['o0.film'],effects:['o1.remembered-on-arrival']});
  const destination=raw.scenes.find(scene=>scene.id==='o1.arrival')!;
  destination.variants=[{id:'o1.remembered-variant',requires:['o1.remembered-on-arrival'],paragraphs:['HISTORICAL_READING_VARIANT']}];
  if(gated)destination.requires=['o1.remembered-on-arrival'];
  const content=checked(raw),state=trace(content,createGameV2(content),filmRoute.slice(0,3)),beforeState=JSON.stringify(state);
  assert.equal(availableChoicesV2(content,state).some(choice=>choice.id==='first-crossing'),true);
  assert.equal(JSON.stringify(state),beforeState);
  const arrived=choose(content,state,'first-crossing'),passage=arrived.transcript.at(-1) as any;
  assert.equal(passage.variantId,'o1.remembered-variant');
  assert.deepEqual(arrived.transcript.slice(0,state.transcript.length),state.transcript);
  assert.equal(JSON.stringify(state),beforeState);replay(content,arrived);
  results[`originalClosureRepro-gated-${gated}`]={firstVariant:passage.variantId,transitionAccepted:true,previewAndDepartureStateUnchanged:true,portableReplayExact:true};
}

// Sources held only by the destination cannot supply its own admission guard.
{
  const raw=structuredClone(occasionFixture);
  raw.interpretationRules.push({id:'o1.destination-only',occasionId:'o1',title:'An arrival-based reading',text:'Only after entry.',when:{op:'hasSource',id:'o1.tableau',scope:'current'},relatedRefs:['o1.tableau'],effects:['o1.destination-gate']});
  raw.scenes.find(scene=>scene.id==='o1.arrival')!.requires=['o1.destination-gate'];
  const content=checked(raw),state=trace(content,createGameV2(content),filmRoute.slice(0,3)),beforeState=JSON.stringify(state);
  assert.equal(availableChoicesV2(content,state).some(choice=>choice.id==='first-crossing'),false);
  const result=applyCommandV2(content,state,input(state,{type:'choose',choiceId:'first-crossing'}));
  assert.equal(result.ok,false);assert.equal(result.state,state);assert.equal(JSON.stringify(state),beforeState);
  results.destinationAcquisitionOrdering={transitionAccepted:false,exactRollback:true,destinationSourceStillAbsent:!state.sources.some(source=>source.id==='o1.tableau')};
}

// A repeated key whose ancestry goes through a deduction must use the selected
// route. Include an earlier action mutation to exercise rejection rollback.
for(const same of [true,false]){
  const raw=structuredClone(occasionFixture);
  raw.sources.find(source=>source.id==='o1.film')!.derivedFrom=['o0.finding'];
  raw.scenes.find(scene=>scene.id==='o1.arrival')!.choices.find(choice=>choice.id==='inspect-current-film')!.actions!.unshift({type:'setBelief',characterId:'blaise',beliefId:'current-belief',value:true});
  const content=checked(raw);
  let state=trace(content,createGameV2(content),['inspect-old-film','test-old-rinse']);
  state=finding(content,state,same?['o0.film']:['o0.ring','o0.rinse']);
  state=trace(content,state,['prepare-chair','front-departure','first-crossing']);
  const beforeState=JSON.stringify(state);
  assert.equal(availableChoicesV2(content,state).some(choice=>choice.id==='inspect-current-film'),same);
  assert.equal(JSON.stringify(state),beforeState);
  const result=applyCommandV2(content,state,input(state,{type:'choose',choiceId:'inspect-current-film'}));
  assert.equal(result.ok,same);assert.equal(JSON.stringify(state),beforeState);
  if(!same){assert.equal(result.state,state);assert.equal(state.npcState.find(npc=>npc.id==='blaise')!.believes.includes('current-belief'),false);}
  else{
    assert.deepEqual([...ancestralOriginsV2(result.state,'o1.film')],['incident-film']);replay(content,result.state);
    const independent=applyCommandV2(content,result.state,input(result.state,{type:'submitDeduction',questionId:'o1.independent-film',candidateId:'supported',selectedRefs:['o0.film','o1.film']}));
    assert.equal(independent.ok,false);
  }
  results[`runtimeRepeatedKey-same-${same}`]={acquisitionAccepted:result.ok,departureUnchanged:true,actualFindingOrigins:[...ancestralOriginsV2(state,'o0.finding')].sort(),replayExactWhenAccepted:same};
}

// Legitimately independent evidence must remain independent when a deduction
// chose a route not sharing the film. The unused film alternative cannot count.
for(const usedFilm of [false,true]){
  const raw=structuredClone(occasionFixture);
  raw.questions.push({id:'o1.route-independence',occasionId:'o1',text:'Do these actual routes differ?',candidates:[{id:'supported',text:'The chosen origins are distinct.'}],supportedCandidateId:'supported',proof:{op:'all',independent:true,args:[{op:'ref',refId:'o0.film',scope:'historical'},{op:'ref',refId:'o1.memory-finding',scope:'current'}]},allowedCorroborators:[],feedback:[]});
  const content=checked(raw);
  let state=trace(content,createGameV2(content),['inspect-old-film','test-old-rinse']);
  state=finding(content,state,usedFilm?['o0.film']:['o0.ring','o0.rinse']);
  state=trace(content,state,['prepare-chair','front-departure','first-crossing','recall-finding']);
  const result=applyCommandV2(content,state,input(state,{type:'submitDeduction',questionId:'o1.route-independence',candidateId:'supported',selectedRefs:['o0.film','o1.memory-finding']}));
  assert.equal(result.ok,!usedFilm);if(result.ok)replay(content,result.state);
  results[`legitimateIndependence-usedFilm-${usedFilm}`]={accepted:result.ok,actualReportOrigins:[...ancestralOriginsV2(state,'o1.memory-finding')].sort(),unusedRoutesNotUnioned:true};
}

assert.deepEqual(hashes(sourcePaths),before);assert.deepEqual(hashes(previousPaths),earlierEvidence);
writeFileSync(`${out}/recheck-source-hashes.json`,JSON.stringify({capturedAt:new Date().toISOString(),hashes:before,stableDuringProbe:true,earlierEvidencePreserved:earlierEvidence},null,2)+'\n');
writeFileSync(`${out}/recheck-results.json`,JSON.stringify(results,null,2)+'\n');
console.log(JSON.stringify(results,null,2));
