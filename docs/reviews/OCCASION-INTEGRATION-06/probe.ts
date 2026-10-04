import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { occasionFixture } from '../../../src/engine/evidence-occasion-fixture';
import { applyCommandV2, availableChoicesV2, createGameV2, exportPortableV2, importPortableV2, projectPlayerV2, validateContentV2 } from '../../../src/engine/evidence-v2';
import { ancestralOriginsV2 } from '../../../src/engine/evidence-occasions';
import type { CommandV2, ContentV2, GameStateV2 } from '../../../src/engine/evidence-types';

const out='docs/reviews/OCCASION-INTEGRATION-06';
const sha=(data:Buffer|string)=>createHash('sha256').update(data).digest('hex');
const sourcePaths=[...readdirSync('src/engine').filter(name=>name.startsWith('evidence-')).map(name=>`src/engine/${name}`),...readdirSync('tests').filter(name=>name.startsWith('occasion-')).map(name=>`tests/${name}`),'docs/contracts/OCCASIONS-V2.md','src/content/case-v2.json'];
const hashes=()=>Object.fromEntries(sourcePaths.map(path=>[path,sha(readFileSync(path))]));
const before=hashes();
const checked=(raw:ContentV2)=>{const result=validateContentV2(raw);assert.equal(result.ok,true,!result.ok?result.errors.join('\n'):'');if(!result.ok)throw new Error('unreachable');return result.value;};
const input=(state:GameStateV2,action:Record<string,unknown>)=>({id:`review-${state.revision}`,expectedRevision:state.revision,...action}) as CommandV2;
const choose=(content:ContentV2,state:GameStateV2,choiceId:string)=>{const result=applyCommandV2(content,state,input(state,{type:'choose',choiceId}));assert.equal(result.ok,true,!result.ok?result.error.message:'');return result.state;};
const trace=(content:ContentV2,ids:string[])=>ids.reduce((state,id)=>choose(content,state,id),createGameV2(content));
const filmRoute=['inspect-old-film','prepare-chair','front-departure','first-crossing','inspect-current-film'];
const submitIndependentFilm=(content:ContentV2,state:GameStateV2)=>applyCommandV2(content,state,input(state,{type:'submitDeduction',questionId:'o1.independent-film',candidateId:'supported',selectedRefs:['o0.film','o1.film']}));
const results:Record<string,unknown>={};

// Control: reinspection of unchanged same-origin film must not become independent.
const ordinary=trace(occasionFixture,filmRoute);
const control=submitIndependentFilm(occasionFixture,ordinary);
assert.equal(control.ok,false);
assert.equal(!control.ok&&control.error.code,'unsupported');
results.sameOriginControl={accepted:control.ok,error:!control.ok?control.error.code:null};

// Only one content field changes. Same sourceKey still declares the same material.
const raw=structuredClone(occasionFixture);
raw.sources.find(source=>source.id==='o1.film')!.provenanceId='new-origin-from-occasion-only';
const bundle=checked(raw),state=trace(bundle,filmRoute),laundered=submitIndependentFilm(bundle,state);
assert.equal(laundered.ok,true);
assert.deepEqual(laundered.state.deductions.at(-1)?.witnessRefs,['o0.film','o1.film']);
assert.equal(importPortableV2(bundle,exportPortableV2(laundered.state)).ok,true);
results.sourceKeyLaundering={validationAccepted:true,sourceKey:state.sources.filter(source=>source.id.endsWith('.film')).map(({id,sourceKey,provenanceId})=>({id,sourceKey,provenanceId})),accepted:laundered.ok,deduction:laundered.state.deductions.at(-1),origins:['o0.film','o1.film'].map(ref=>({ref,origins:[...ancestralOriginsV2(state,ref)]})),portableReplayAccepted:true,commands:laundered.state.commands};

// Rollback control: snapshot runs in eligibility simulation, but destination
// acquisition fails for an unencountered parent. No actor/history changes leak.
const rollbackRaw=structuredClone(occasionFixture);
rollbackRaw.sources.push({id:'o0.blocked-report',occasionId:'o0',title:'Unavailable report',text:'PRIVATE_BLOCKED_REPORT',kind:'document',provenanceId:'unused',derivedFrom:['o0.film']});
rollbackRaw.scenes.find(scene=>scene.id==='o0.crossing')!.sourceIds=['o0.blocked-report'];
const rollbackBundle=checked(rollbackRaw),rollbackState=trace(rollbackBundle,['prepare-chair']),rollbackBytes=JSON.stringify(rollbackState);
assert.equal(availableChoicesV2(rollbackBundle,rollbackState).some(choice=>choice.id==='front-departure'),false);
const rollback=applyCommandV2(rollbackBundle,rollbackState,input(rollbackState,{type:'choose',choiceId:'front-departure'}));
assert.equal(rollback.ok,false);assert.equal(rollback.state,rollbackState);assert.equal(JSON.stringify(rollbackState),rollbackBytes);
assert.equal(rollbackState.npcState.find(npc=>npc.id==='miriam_exterior')?.snapshot,undefined);
assert.equal(JSON.stringify(projectPlayerV2(rollbackBundle,rollbackState)).includes('PRIVATE_BLOCKED_REPORT'),false);
results.rollbackControl={accepted:rollback.ok,identicalState:true,snapshotAbsent:true,unavailableProseAbsent:true};

// Probe transition ordering: a reading whose only prerequisite is an already
// encountered historical film becomes eligible after destination variant choice.
const closureRaw=structuredClone(occasionFixture);
closureRaw.interpretationRules.push({id:'o1.on-arrival',occasionId:'o1',title:'Remember at arrival',text:'Earlier evidence is remembered.',when:{op:'hasSource',id:'o0.film',scope:'historical'},relatedRefs:['o0.film'],effects:['o1.remembered-on-arrival']});
closureRaw.scenes.find(scene=>scene.id==='o1.arrival')!.variants=[{id:'o1.remembered-variant',requires:['o1.remembered-on-arrival'],paragraphs:['HISTORICAL_READING_VARIANT']}];
const closureBundle=checked(closureRaw),arrived=trace(closureBundle,filmRoute.slice(0,-1));
const arrival=arrived.transcript.at(-1)!;
assert.equal(arrived.flags.includes('o1.remembered-on-arrival'),true);
assert.equal(arrival.kind==='passage'&&'variantId' in arrival&&arrival.variantId,'o1.arrival.base');
const revisited=choose(closureBundle,arrived,'inspect-current-film');
assert.equal(revisited.transcript.at(-1)!.kind==='passage'&&'variantId' in revisited.transcript.at(-1)!&&(revisited.transcript.at(-1) as any).variantId,'o1.remembered-variant');
results.closureOrderingProbe={firstVariant:arrival.kind==='passage'&&'variantId' in arrival?arrival.variantId:null,currentFlagAfterEntry:arrived.flags.includes('o1.remembered-on-arrival'),eligibleOnFirstEntry:arrived.eligibleInterpretations.find(rule=>rule.id==='o1.on-arrival'),revisitVariant:(revisited.transcript.at(-1) as any).variantId};

const gatedRaw=structuredClone(closureRaw);
gatedRaw.scenes.find(scene=>scene.id==='o1.arrival')!.requires=['o1.remembered-on-arrival'];
const gatedBundle=checked(gatedRaw),atCrossing=trace(gatedBundle,filmRoute.slice(0,3));
const available=availableChoicesV2(gatedBundle,atCrossing);
assert.equal(available.some(choice=>choice.id==='first-crossing'),false);
const gated=applyCommandV2(gatedBundle,atCrossing,input(atCrossing,{type:'choose',choiceId:'first-crossing'}));
assert.equal(gated.ok,false);assert.equal(gated.state,atCrossing);
results.closureGateProbe={validationAccepted:true,offeredChoiceIds:available.map(choice=>choice.id),accepted:gated.ok,error:!gated.ok?gated.error.code:null,currentOccasion:atCrossing.currentOccasionId,knownFilm:atCrossing.sources.some(source=>source.id==='o0.film')};

const after=hashes();assert.deepEqual(after,before);
writeFileSync(`${out}/source-hashes.json`,JSON.stringify({capturedAt:new Date().toISOString(),hashes:before,stableDuringProbe:true},null,2)+'\n');
writeFileSync(`${out}/probe-results.json`,JSON.stringify(results,null,2)+'\n');
console.log(JSON.stringify(results,null,2));
