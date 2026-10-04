import { describe, expect, it } from 'vitest';
import { occasionFixture as content } from '../src/engine/evidence-occasion-fixture';
import {
  applyCommandV2, availableChoicesV2, availableHintsV2, availableInterpretationsV2,
  availableQuestionsV2, confirmationForV2, createGameV2, currentPassageV2,
  evaluateConditionV2, exportPortableV2, importPortableV2, projectPlayerV2,
  validateContentV2, validateStateV2,
} from '../src/engine/evidence-v2';
import { ancestralOriginsV2 } from '../src/engine/evidence-occasions';
import { canonicalJSON, stateHash } from '../src/engine/hash';
import type { CommandV2, ContentV2, GameStateV2 } from '../src/engine/evidence-types';

function command(state:GameStateV2, action:Record<string,unknown>):CommandV2 {
  return {id:`occasion.${state.revision}.${action.type}.${action.choiceId??action.questionId??action.interpretationId??action.hintId}`,expectedRevision:state.revision,...action} as CommandV2;
}
function run(state:GameStateV2,action:Record<string,unknown>,confirm=false,bundle:ContentV2=content):GameStateV2 {
  const input=command(state,action),result=applyCommandV2(bundle,state,confirm?{...input,confirmation:confirmationForV2(state,input)}:input);
  if(!result.ok)throw new Error(`${result.error.code}: ${result.error.message}`);
  return result.state;
}
const choose=(state:GameStateV2,choiceId:string,confirm=false,bundle:ContentV2=content)=>run(state,{type:'choose',choiceId},confirm,bundle);
const submit=(state:GameStateV2,questionId:string,selectedRefs:string[])=>run(state,{type:'submitDeduction',questionId,candidateId:'supported',selectedRefs});
function rejected(state:GameStateV2,action:Record<string,unknown>,code:string) {
  const before=JSON.stringify(state),result=applyCommandV2(content,state,command(state,action));
  expect(result.ok).toBe(false);
  if(result.ok)throw new Error('Expected rejection');
  expect(result.error.code).toBe(code);expect(result.state).toBe(state);expect(JSON.stringify(state)).toBe(before);
  return result.error.message;
}
function beforeCrossing(state=createGameV2(content)) {
  return choose(choose(state,'prepare-chair'),'front-departure');
}
const renewed=(state=createGameV2(content))=>choose(beforeCrossing(state),'first-crossing');
const remembered=()=>renewed(choose(createGameV2(content),'inspect-old-film'));
const npc=(state:GameStateV2,id:string)=>state.npcState.find(actor=>actor.id===id)!;

describe('finite occasion transition and exact history',()=>{
  it('performs departure actions before a plain first crossing and evaluates destination in its new occasion',()=>{
    const departure=beforeCrossing(),before=canonicalJSON(departure);
    expect(departure.currentOccasionId).toBe('o0');
    expect(npc(departure,'miriam_exterior').snapshot).toEqual({fromCharacterId:'o0.miriam',occasionId:'o0',revision:2});
    for(let index=0;index<3;index++)expect(availableChoicesV2(content,departure)).toContainEqual({id:'first-crossing',label:'Take the weight through the service door.',ending:false,irreversible:false});
    expect(canonicalJSON(departure)).toBe(before);
    const next=choose(departure,'first-crossing');
    expect(next.currentOccasionId).toBe('o1');
    expect(currentPassageV2(next)).toMatchObject({sceneId:'o1.arrival',occasionId:'o1',occasionLabel:'After the return'});
    expect(next.sources.find(source=>source.id==='o0.service-crossing')).toMatchObject({occasionId:'o0',revision:3});
    expect(next.sources.find(source=>source.id==='o1.tableau')).toMatchObject({occasionId:'o1',revision:3});
    expect(next.transcript.find(event=>event.kind==='action'&&event.revision===3)).toMatchObject({occasionId:'o0',sceneId:'o0.crossing'});
    expect(next.commands.at(-1)).not.toHaveProperty('confirmation');
  });

  it('retains exact source, selected proof route, relationship, reading and old passages through two transitions and reload',()=>{
    const raw=structuredClone(content);
    raw.scenes[0].choices.find(choice=>choice.id==='hear-confidence')!.relationship={id:'o0.trust',text:'A bounded interpersonal consequence.'};
    const checked=validateContentV2(raw);if(!checked.ok)throw new Error(checked.errors.join('\n'));
    const bundle=checked.value;
    let state=choose(choose(createGameV2(bundle),'inspect-old-film',false,bundle),'hear-confidence',false,bundle);
    state=run(state,{type:'submitDeduction',questionId:'o0.finding',candidateId:'supported',selectedRefs:['o0.film']},false,bundle);
    state=run(state,{type:'reviewInterpretation',interpretationId:'o0.reading'},false,bundle);
    const prefix=structuredClone(state),source=structuredClone(state.sources.find(source=>source.id==='o0.film'));
    state=choose(choose(choose(state,'prepare-chair',false,bundle),'front-departure',false,bundle),'first-crossing',false,bundle);
    state=choose(choose(state,'discuss-second-trial',false,bundle),'second-crossing',true,bundle);
    expect(state.currentOccasionId).toBe('o2');
    expect(state.transcript.slice(0,prefix.transcript.length)).toEqual(prefix.transcript);
    expect(state.sources.find(item=>item.id==='o0.film')).toEqual(source);
    expect(state.deductions[0]).toEqual(prefix.deductions[0]);
    expect(state.relationships).toEqual(prefix.relationships);
    expect(state.interpretations).toEqual(prefix.interpretations);
    expect(exportPortableV2(state)).toContain('ORIGINAL_OCCASION_TEXT');
    expect(exportPortableV2(state)).toContain('OLD_READING_TEXT');
    const imported=importPortableV2(bundle,exportPortableV2(state));
    expect(imported.ok).toBe(true);if(!imported.ok)return;
    expect(JSON.stringify(imported.value)).toBe(JSON.stringify(state));
    expect(validateStateV2(bundle,imported.value).ok).toBe(true);
    expect(Object.isFrozen(imported.value.sources[0])).toBe(true);
  });

  it('requires a fresh informed second receipt, preserves cancellation, and invalidates it after any accepted command',()=>{
    const initial=renewed();
    expect(availableChoicesV2(content,initial).some(choice=>choice.id==='second-crossing')).toBe(false);
    const state=choose(initial,'discuss-second-trial'),input=command(state,{type:'choose',choiceId:'second-crossing'}),before=JSON.stringify(state);
    rejected(state,{type:'choose',choiceId:'second-crossing'},'confirmation-required');
    const receipt=confirmationForV2(state,input);
    expect(JSON.stringify(state)).toBe(before); // Creating and canceling a dialog is not a command.
    const changed=choose(state,'new-photo');
    const stale=applyCommandV2(content,changed,{...input,expectedRevision:changed.revision,confirmation:receipt});
    expect(!stale.ok&&stale.error.code).toBe('confirmation-required');expect(stale.state).toBe(changed);
    const next=choose(changed,'second-crossing',true);
    expect(next.currentOccasionId).toBe('o2');
    expect(next.commands.at(-1)).toHaveProperty('confirmation');
    const duplicate=applyCommandV2(content,next,next.commands.at(-1));
    expect(duplicate.ok&&duplicate.duplicate).toBe(true);expect(duplicate.state).toBe(next);
  });

  it('supports a refusal ending after private-conversation failure without requiring a second occasion or factual theory',()=>{
    let state=renewed(choose(createGameV2(content),'refuse-confidence'));
    state=choose(state,'decline-second',true);
    expect(state.ended).toBe(true);expect(state.currentOccasionId).toBe('o1');
    expect(state.deductions).toEqual([]);expect(state.interpretations).toEqual([]);
    expect(state.sources.some(source=>source.occasionId==='o2')).toBe(false);
    expect(exportPortableV2(state)).not.toContain('UNSEEN_OCCASION_LABEL');
    expect(importPortableV2(content,exportPortableV2(state)).ok).toBe(true);
  });

  it('never offers past or future factual questions/hints or unearned future reading titles',()=>{
    const state=remembered();
    expect(availableQuestionsV2(content,state).every(question=>question.id.startsWith('o1.'))).toBe(true);
    expect(availableHintsV2(content,state)).toEqual([]);
    const portable=exportPortableV2(state),view=JSON.stringify(projectPlayerV2(content,state));
    for(const sentinel of ['UNSEEN_OCCASION_LABEL','UNSEEN_FUTURE_QUESTION','UNSEEN_FUTURE_HINT','UNSEEN_FUTURE_READING','UNSEEN_OLD_UNEARNED_READING','UNSEEN_OLD_UNEARNED_PROSE','UNSEEN_NPC_ANCHOR_SECRET','UNSEEN_EXTERIOR_NAME','UNSEEN_WITNESS_SECRET','UNSEEN_PRIOR_CLAIM','snapshot','npcState']){
      expect(portable).not.toContain(sentinel);expect(view).not.toContain(sentinel);
    }
    rejected(state,{type:'submitDeduction',questionId:'o0.finding',candidateId:'supported',selectedRefs:['o0.film']},'unavailable-question');
    rejected(state,{type:'requestHint',hintId:'o2.hint'},'unavailable-hint');
  });

  it('retains an earned historical reading without rerunning its permissions or acquiring unread prose automatically',()=>{
    const state=remembered(),eligible=state.eligibleInterpretations.find(rule=>rule.id==='o0.reading');
    expect(eligible).toMatchObject({occasionId:'o0',occasionLabel:'First visit',revision:1});
    expect(availableInterpretationsV2(content,state)).toContainEqual({id:'o0.reading',title:'Reconsider the earlier film',...eligible});
    expect(exportPortableV2(state)).not.toContain('OLD_READING_TEXT');
    expect(evaluateConditionV2({op:'flag',id:'o0.reading-ready',scope:'current'},state)).toBe(false);
    expect(evaluateConditionV2({op:'flag',id:'o0.reading-ready',scope:'historical'},state)).toBe(true);
    const reviewed=run(state,{type:'reviewInterpretation',interpretationId:'o0.reading'});
    expect(reviewed.interpretations[0]).toMatchObject({occasionId:'o1',occasionLabel:'After the return',originOccasionId:'o0',originOccasionLabel:'First visit'});
    expect(reviewed.eligibleInterpretations).toEqual(state.eligibleInterpretations);expect(reviewed.flags).toEqual(state.flags);
    expect(reviewed.deductions).toEqual([]);
  });

  it('offers a revealing recollection hint only once all its parents are encountered, without changing live state during availability checks',()=>{
    const raw=structuredClone(content);
    raw.hints.push({id:'o1.memory-hint',occasionId:'o1',label:'Explicitly recover a recollection.',questionId:'o1.current-film',when:{op:'always'},mentions:[],text:'A selected recollection is delivered.',reveals:true,sourceIds:['o1.memory-film']});
    const checked=validateContentV2(raw);if(!checked.ok)throw new Error(checked.errors.join('\n'));
    const bundle=checked.value;
    const absent=choose(choose(choose(createGameV2(bundle),'prepare-chair',false,bundle),'front-departure',false,bundle),'first-crossing',false,bundle);
    expect(availableHintsV2(bundle,absent).some(hint=>hint.id==='o1.memory-hint')).toBe(false);
    let state=choose(createGameV2(bundle),'inspect-old-film',false,bundle);
    state=choose(choose(choose(state,'prepare-chair',false,bundle),'front-departure',false,bundle),'first-crossing',false,bundle);
    const before=JSON.stringify(state);expect(availableHintsV2(bundle,state)).toContainEqual({id:'o1.memory-hint',label:'Explicitly recover a recollection.',reveals:true});
    expect(JSON.stringify(state)).toBe(before);
    const input=command(state,{type:'requestHint',hintId:'o1.memory-hint'}),rejected=applyCommandV2(bundle,state,input);
    expect(!rejected.ok&&rejected.error.code).toBe('confirmation-required');expect(rejected.state).toBe(state);
    const revealed=run(state,{type:'requestHint',hintId:'o1.memory-hint'},true,bundle);
    expect(revealed.sources.find(source=>source.id==='o1.memory-film')?.derivedFrom).toEqual(['o0.film']);expect(revealed.deductions).toEqual([]);
  });
});

describe('current evidence, recollection and actual ancestry',()=>{
  it('cannot use an earlier film as the currently inspected film but accepts the explicitly historical proof',()=>{
    const state=remembered();
    expect(evaluateConditionV2({op:'hasSource',id:'o0.film',scope:'current'},state)).toBe(false);
    expect(evaluateConditionV2({op:'hasSource',id:'o0.film',scope:'historical'},state)).toBe(true);
    const message=rejected(state,{type:'submitDeduction',questionId:'o1.current-film',candidateId:'supported',selectedRefs:['o0.film']},'irrelevant');
    expect(message).not.toContain('o1.film');
    expect(submit(state,'o1.historical-film',['o0.film']).deductions.at(-1)).toMatchObject({occasionId:'o1',witnessRefs:['o0.film']});
    const inspected=choose(state,'inspect-current-film');
    expect(inspected.sources.filter(source=>source.sourceKey==='incident-film')).toHaveLength(2);
    expect(submit(inspected,'o1.current-film',['o1.film']).deductions.at(-1)?.witnessRefs).toEqual(['o1.film']);
  });

  it('requires encountered parents for current recollection and discloses only the current report to a fresh listener',()=>{
    const withoutFilm=renewed();
    expect(availableChoicesV2(content,withoutFilm).some(choice=>choice.id==='recall-film')).toBe(false);
    const message=rejected(withoutFilm,{type:'choose',choiceId:'recall-film'},'unavailable-choice');
    expect(message).not.toContain('o0.film');
    const state=remembered(),recalled=choose(state,'recall-film');
    expect(recalled.sources.find(source=>source.id==='o1.memory-film')).toMatchObject({occasionId:'o1',derivedFrom:['o0.film'],speakerId:'blaise'});
    expect(npc(recalled,'blaise').claims).toContainEqual({sourceId:'o1.memory-film',revision:recalled.revision});
    expect(npc(recalled,'o1.simon').knows).toEqual([]);
    const disclosed=choose(recalled,'tell-simon-memory');
    expect(npc(disclosed,'o1.simon').knows).toEqual(['o1.memory-film']);
    expect(npc(disclosed,'o1.simon').knows).not.toContain('o0.film');
    expect(disclosed.deductions).toEqual([]);
  });

  it.each(['recall-film','inspect-current-film'])('rejects an independent proof when %s retells or reinspects the same origin',choiceId=>{
    const state=choose(remembered(),choiceId),ref=choiceId==='recall-film'?'o1.memory-film':'o1.film';
    rejected(state,{type:'submitDeduction',questionId:'o1.independent-film',candidateId:'supported',selectedRefs:['o0.film',ref]},'unsupported');
    expect(submit(choose(state,'new-photo'),'o1.independent-film',['o0.film','o1.photo']).deductions.at(-1)?.witnessRefs).toEqual(['o0.film','o1.photo']);
  });

  it.each([{refs:['o0.film']},{refs:['o0.ring','o0.rinse']}])('uses the accepted route rather than unioning alternate ancestry: $refs',({refs})=>{
    let state=choose(choose(createGameV2(content),'inspect-old-film'),'test-old-rinse');
    state=renewed(submit(state,'o0.finding',refs));state=choose(state,'recall-finding');
    expect([...ancestralOriginsV2(state,'o1.memory-finding')].sort()).toEqual(refs.length===1?['incident-film']:['ring-inspection','rinse-test']);
    rejected(state,{type:'submitDeduction',questionId:'o1.independent-finding',candidateId:'supported',selectedRefs:['o0.finding','o1.memory-finding']},'unsupported');
    expect(submit(choose(state,'new-photo'),'o1.independent-finding',['o0.finding','o1.photo']).deductions.at(-1)?.witnessRefs).toEqual(['o0.finding','o1.photo']);
  });

  it('rejects two current Miriams as independent witnesses when their testimony shares a pre-anchor origin',()=>{
    const state=choose(renewed(),'meet-speakers');
    rejected(state,{type:'submitDeduction',questionId:'o1.independent-speakers',candidateId:'supported',selectedRefs:['o1.interior-testimony','o1.exterior-testimony']},'unsupported');
    expect(submit(choose(state,'new-photo'),'o1.independent-speakers',['o1.interior-testimony','o1.photo']).deductions.at(-1)?.witnessRefs).toEqual(['o1.interior-testimony','o1.photo']);
  });
});

describe('actual actor snapshot and bounded NPC witnessing',()=>{
  it.each([false,true])('copies the actual departing state, including whether a confidence was heard and a finding disclosed: %s',heard=>{
    let state=choose(createGameV2(content),'inspect-old-film');
    state=submit(state,'o0.finding',['o0.film']);
    if(heard)state=choose(choose(state,'hear-confidence'),'tell-first-finding');
    state=choose(state,'prepare-chair');const departing=npc(state,'o0.miriam');
    expect(departing.knows).toContain('o0.chair-distant');
    expect(departing.knows).not.toContain('o0.chair-contact');
    const next=choose(state,'front-departure'),original=npc(next,'o0.miriam'),exterior=npc(next,'miriam_exterior');
    expect(exterior.knows).toEqual(original.knows);expect(exterior.believes).toEqual(original.believes);expect(exterior.claims).toEqual(original.claims);
    expect(exterior.knows).not.toBe(original.knows);expect(exterior.claims).not.toBe(original.claims);
    expect(exterior.knows.includes('o0.finding')).toBe(heard);
    expect(exterior.claims.some(claim=>claim.sourceId==='o0.confidence')).toBe(heard);
    expect(exterior.knows).not.toContain('o0.film'); // Player possession is not automatically copied.
  });

  it('keeps the renewed interior ignorant while exterior knowledge grows and persists through another occasion',()=>{
    let state=renewed(choose(createGameV2(content),'hear-confidence'));
    expect(npc(state,'o1.miriam')).toMatchObject({knows:['o1.private-anchor'],believes:['anchor-belief'],claims:[]});
    expect(npc(state,'o1.miriam').knows).not.toContain('o0.chair-distant');
    expect(npc(state,'o1.miriam').claims.some(claim=>claim.sourceId==='o0.confidence')).toBe(false);
    const receipt=structuredClone(npc(state,'miriam_exterior').snapshot);
    state=choose(state,'tell-exterior-current');expect(npc(state,'miriam_exterior').knows).toContain('o1.current-fact');
    state=choose(choose(state,'discuss-second-trial'),'second-crossing',true);
    expect(npc(state,'miriam_exterior').knows).toContain('o1.current-fact');expect(npc(state,'miriam_exterior').snapshot).toEqual(receipt);
    expect(npc(state,'o2.miriam')).toMatchObject({knows:['o2.private-anchor'],believes:['anchor-belief'],claims:[]});
  });

  it('keeps NPC-only witnessed source prose and snapshot internals out of player encountered data',()=>{
    const state=beforeCrossing();
    expect(npc(state,'o0.miriam').knows).toContain('o0.chair-distant');
    expect(state.sources.some(source=>source.id==='o0.chair-distant')).toBe(false);
    expect(state.deductions).toEqual([]);expect(state.hints).toEqual([]);expect(state.relationships).toEqual([]);
    const exported=exportPortableV2(state),view=JSON.stringify(projectPlayerV2(content,state));
    for(const sentinel of ['o0.chair-distant','UNSEEN_WITNESS_SECRET','UNSEEN_WITNESS_TITLE','UNSEEN_PRIOR_CLAIM','snapshot','UNSEEN_EXTERIOR_NAME']){expect(exported).not.toContain(sentinel);expect(view).not.toContain(sentinel);}
    expect(importPortableV2(content,exported).ok).toBe(true);
  });

  it('never overwrites a snapshot target through a repeated authored action',()=>{
    const raw=structuredClone(content);
    raw.scenes.find(scene=>scene.id==='o0.crossing')!.choices.push({id:'copy-again',label:'Attempt an impermissible second snapshot.',target:'o0.crossing',actions:[{type:'snapshotCharacter',fromCharacterId:'o0.miriam',toCharacterId:'miriam_exterior'}]});
    const checked=validateContentV2(raw);if(!checked.ok)throw new Error(checked.errors.join('\n'));
    const bundle=checked.value,state=choose(choose(createGameV2(bundle),'prepare-chair',false,bundle),'front-departure',false,bundle),before=JSON.stringify(state);
    expect(availableChoicesV2(bundle,state).some(choice=>choice.id==='copy-again')).toBe(false);
    const result=applyCommandV2(bundle,state,command(state,{type:'choose',choiceId:'copy-again'}));
    expect(!result.ok&&result.error.code).toBe('unavailable-choice');expect(result.state).toBe(state);expect(JSON.stringify(state)).toBe(before);
  });

  it('rejects replay forgeries of occasion membership, captured labels, snapshot ancestry and current identity',()=>{
    const state=remembered();
    const current=structuredClone(state);current.currentOccasionId='o0';expect(validateStateV2(content,current).ok).toBe(false);
    const snapshot=structuredClone(state);npc(snapshot,'miriam_exterior').snapshot!.revision=0;expect(validateStateV2(content,snapshot).ok).toBe(false);
    const envelope=JSON.parse(exportPortableV2(state));envelope.seen.sources[0].occasionLabel='Forged label';envelope.seenChecksum=stateHash(envelope.seen);
    expect(importPortableV2(content,envelope).ok).toBe(false);
    const ancestry=JSON.parse(exportPortableV2(choose(state,'recall-film')));ancestry.seen.sources.at(-1).derivedFrom=['o0.ring'];ancestry.seenChecksum=stateHash(ancestry.seen);
    expect(importPortableV2(content,ancestry).ok).toBe(false);
  });
});
