import { canonicalJSON, contentHash, sha256, stateHash } from './hash';
import { deepFreeze } from './validate';
import { commandSchemaV2 } from './evidence-schema';
import { compileProofV2 } from './evidence-proof';
import type { Confirmation, EncounteredRecord } from './types';
import type { ActionV2, ChoiceV2, CommandV2, ConditionV2, ContentV2, ErrorCodeV2, GameStateV2, LegacySeedV2, PassageV2, QuestionV2, ReplayContextV2, ResultV2, WitnessV2 } from './evidence-types';
import { applyLegacySeedV2 } from './evidence-migration';
import { assertRunBudgetV2, seenProjectionV2 } from './evidence-budget';
import { activeCharacterV2,ancestralOriginsV2,captureOccasionV2,currentEntityV2,referenceScopeV2,transitionOccasionV2 } from './evidence-occasions';
export { seenProjectionV2 } from './evidence-budget';

const sorted=(values:string[])=>[...new Set(values)].sort();
const compare=(a:string,b:string)=>a<b?-1:a>b?1:0;
const sceneFor=(content:ContentV2,id:string)=>{const scene=content.scenes.find(scene=>scene.id===id);if(!scene)throw new Error('Scene is missing from the validated bundle');return scene;};
const known=(state:GameStateV2,id:string)=>state.sources.some(source=>source.id===id)||state.deductions.some(deduction=>deduction.id===id);
export function evaluateConditionV2(condition:ConditionV2|undefined,state:GameStateV2):boolean {
  if(!condition||condition.op==='always')return true;
  switch(condition.op){
    case 'all':return condition.args.every(arg=>evaluateConditionV2(arg,state));
    case 'any':return condition.args.some(arg=>evaluateConditionV2(arg,state));
    case 'not':return !evaluateConditionV2(condition.arg,state);
    case 'hasSource':return state.sources.some(source=>source.id===condition.id&&referenceScopeV2(state,source.occasionId,condition.scope));
    case 'hasDeduction':return state.deductions.some(deduction=>deduction.id===condition.id&&referenceScopeV2(state,deduction.occasionId,condition.scope));
    case 'flag':return state.flags.includes(condition.id)&&(condition.scope===undefined||!!state.currentOccasionId&&(condition.scope==='encountered'||(condition.scope==='current'?condition.id.startsWith(`${state.currentOccasionId}.`):!condition.id.startsWith(`${state.currentOccasionId}.`))));
    case 'interpretationAvailable':return state.eligibleInterpretations.some(reading=>reading.id===condition.id);
    case 'occasionIs':return state.currentOccasionId===condition.id;
    case 'npcKnows':return !!state.npcState.find(npc=>npc.id===condition.characterId)?.knows.includes(condition.refId);
    case 'npcBelieves':return !!state.npcState.find(npc=>npc.id===condition.characterId)?.believes.includes(condition.beliefId);
  }
}
function acquire(content:ContentV2,state:GameStateV2,id:string):boolean {
  if(!content.occasions&&state.sources.some(source=>source.id===id))return true;
  const source=content.sources.find(source=>source.id===id);if(!source)throw new Error('Source is missing from the validated bundle');
  if(content.occasions&&(!currentEntityV2(content,state,source.occasionId)||(source.derivedFrom!==undefined&&!source.derivedFrom.every(parent=>known(state,parent)))||(source.speakerId!==undefined&&!activeCharacterV2(content,state,source.speakerId))))return false;
  if(state.sources.some(source=>source.id===id))return true;
  state.sources.push({...source,sceneId:state.currentScene,revision:state.revision,...captureOccasionV2(content,state)});
  if(source.kind!=='statement'&&!state.observations.some(record=>record.id===id))state.observations.push({id,text:source.text,sceneId:state.currentScene,revision:state.revision,...captureOccasionV2(content,state)});
  if(source.kind==='statement'){
    const npc=state.npcState.find(npc=>npc.id===source.speakerId)!;
    if(!npc.claims.some(claim=>claim.sourceId===id))npc.claims.push({sourceId:id,revision:state.revision});
  }return true;
}
function runActions(content:ContentV2,state:GameStateV2,actions:ActionV2[]|undefined):boolean {
  for(const action of actions??[]){
    if(action.type==='acquireSource'){if(!acquire(content,state,action.sourceId))return false;}
    else if(action.type==='snapshotCharacter'){
      const from=state.npcState.find(npc=>npc.id===action.fromCharacterId),to=state.npcState.find(npc=>npc.id===action.toCharacterId),definition=content.characters.find(character=>character.id===action.toCharacterId),sourceDefinition=content.characters.find(character=>character.id===action.fromCharacterId);
      if(!content.occasions||!from||!to||from.id===to.id||sourceDefinition?.occasionId!==state.currentOccasionId||definition?.persistent!==true||definition.requiresSnapshot!==true||to.snapshot)return false;
      to.knows=[...from.knows];to.believes=[...from.believes];to.claims=structuredClone(from.claims);to.snapshot={fromCharacterId:from.id,occasionId:state.currentOccasionId!,revision:state.revision};
    }else {const npc=state.npcState.find(npc=>npc.id===action.characterId)!;
      if(!npc||!activeCharacterV2(content,state,action.characterId))return false;
      if(action.type==='disclose'){const reference=state.sources.find(source=>source.id===action.refId)??state.deductions.find(deduction=>deduction.id===action.refId);if(!known(state,action.refId)||content.occasions&&reference?.occasionId!==state.currentOccasionId)return false;npc.knows=sorted([...npc.knows,action.refId]);}
      else if(action.type==='witnessSource'){if(!content.occasions||content.sources.find(source=>source.id===action.sourceId)?.occasionId!==state.currentOccasionId)return false;npc.knows=sorted([...npc.knows,action.sourceId]);}
      else npc.believes=action.value?sorted([...npc.believes,action.beliefId]):npc.believes.filter(id=>id!==action.beliefId);
    }
  }return true;
}
function interpretationClosureV2(content:ContentV2,state:GameStateV2):void {
  const rules=[...content.interpretationRules].sort((a,b)=>compare(a.id,b.id));
  for(let changed=true;changed;){changed=false;for(const rule of rules){
    if(!currentEntityV2(content,state,rule.occasionId)||state.eligibleInterpretations.some(reading=>reading.id===rule.id)||!rule.relatedRefs.every(ref=>known(state,ref))||!evaluateConditionV2(rule.when,state))continue;
    state.eligibleInterpretations.push({id:rule.id,revision:state.revision,...captureOccasionV2(content,state)});state.flags=sorted([...state.flags,...(rule.effects??[])]);changed=true;
  }}
}
function enter(content:ContentV2,state:GameStateV2,target:string):boolean {
  state.currentScene=target;const scene=sceneFor(content,target);
  let paragraphs=scene.paragraphs,paragraphIds=scene.paragraphIds,sourceIds=scene.sourceIds,variantId=`${scene.id}.base`;
  for(const variant of scene.variants??[])if(variant.requires.every(flag=>state.flags.includes(flag))&&evaluateConditionV2(variant.when,state)){
    paragraphs=variant.paragraphs;paragraphIds=variant.paragraphIds;sourceIds=variant.sourceIds??scene.sourceIds;variantId=variant.id;
  }
  const passage:PassageV2={kind:'passage',revision:state.revision,sceneId:scene.id,title:scene.title,paragraphs:[...paragraphs],contentHash:state.contentHash,variantId,blocks:paragraphs.map((text,index)=>({id:paragraphIds?.[index]??`${scene.id}.text.${sha256(text).slice(0,16)}`,text})),...captureOccasionV2(content,state)};
  state.transcript.push(passage);for(const id of sourceIds??[])if(!acquire(content,state,id))return false;interpretationClosureV2(content,state);return true;
}
export function createGameV2(content:ContentV2,seed:LegacySeedV2|null=null,context?:ReplayContextV2):GameStateV2 {
  if(content.occasions&&seed)throw new Error('Migration into authored occasions requires a separately reviewed continuation contract.');
  const state:GameStateV2={schemaVersion:2,engineVersion:2,contentId:content.id,contentVersion:content.version,contentHash:contentHash(content),revision:0,currentScene:content.start,ended:false,flags:[],observations:[],interpretations:[],relationships:[],sources:[],deductions:[],eligibleInterpretations:[],hints:[],transcript:[],processedCommandIds:[],commands:[],migrationSeed:null,npcState:content.characters.map(character=>({id:character.id,knows:sorted(character.initial.knows),believes:sorted(character.initial.believes),claims:character.initial.claims.map(sourceId=>({sourceId,revision:-1}))}))};
  if(content.occasions)state.currentOccasionId=sceneFor(content,content.start).occasionId;
  if(seed)applyLegacySeedV2(content,state,seed,context);else if(!enter(content,state,content.start))throw new Error('Opening encounters require unavailable material or an inactive speaker.');
  interpretationClosureV2(content,state);assertRunBudgetV2(state);return deepFreeze(state);
}
export function confirmationForV2(state:GameStateV2,command:CommandV2):Confirmation {
  const {confirmation:_,...payload}=command;return{stateHash:stateHash(state),actionHash:sha256(canonicalJSON(payload)),acknowledged:true};
}
const matches=(requires:string[]|undefined,state:GameStateV2)=>(requires??[]).every(flag=>state.flags.includes(flag));
function eligibleChoice(content:ContentV2,state:GameStateV2,choice:ChoiceV2):boolean {
  if(!matches(choice.requires,state)||(choice.unless??[]).some(flag=>state.flags.includes(flag))||!evaluateConditionV2(choice.when,state))return false;
  const copy=structuredClone(state);copy.flags=sorted([...copy.flags,...(choice.effects??[])]);
  if(content.occasions)copy.revision+=1;
  if(choice.observation&&!acquire(content,copy,choice.observation.id))return false;
  if(!runActions(content,copy,choice.actions))return false;interpretationClosureV2(content,copy);
  if(!transitionOccasionV2(content,copy,choice))return false;
  const target=sceneFor(content,choice.target);return matches(target.requires,copy)&&evaluateConditionV2(target.when,copy)&&(!content.occasions||enter(content,copy,choice.target));
}
function compatible(content:ContentV2,state:GameStateV2):boolean{return state.schemaVersion===2&&state.engineVersion===2&&state.contentId===content.id&&state.contentVersion===content.version&&state.contentHash===contentHash(content);}
export function availableChoicesV2(content:ContentV2,state:GameStateV2){if(state.ended||!compatible(content,state))return[];return sceneFor(content,state.currentScene).choices.filter(choice=>eligibleChoice(content,state,choice)).map(({id,label,ending,irreversible})=>({id,label,ending:ending===true,irreversible:irreversible===true}));}
export function availableQuestionsV2(content:ContentV2,state:GameStateV2){if(state.ended||!compatible(content,state))return[];return content.questions.filter(question=>currentEntityV2(content,state,question.occasionId)&&!state.deductions.some(deduction=>deduction.id===question.id)&&evaluateConditionV2(question.when,state)).map(question=>({id:question.id,text:question.text,candidates:question.candidates.filter(candidate=>evaluateConditionV2(candidate.when,state)).map(({id,text})=>({id,text}))}));}
export function availableHintsV2(content:ContentV2,state:GameStateV2){if(state.ended||!compatible(content,state))return[];return content.hints.filter(hint=>{
  if(!currentEntityV2(content,state,hint.occasionId)||state.hints.some(received=>received.id===hint.id)||!evaluateConditionV2(hint.when,state)||!hint.mentions.every(ref=>known(state,ref))||!evaluateConditionV2(content.questions.find(question=>question.id===hint.questionId)!.when,state))return false;
  if(!content.occasions)return true;
  const copy=structuredClone(state);copy.revision+=1;return(hint.sourceIds??[]).every(id=>acquire(content,copy,id));
}).map(({id,label,reveals})=>({id,label,reveals}));}
export function availableInterpretationsV2(content:ContentV2,state:GameStateV2){if(state.ended||!compatible(content,state))return[];return content.interpretationRules.filter(rule=>state.eligibleInterpretations.some(reading=>reading.id===rule.id)&&!state.interpretations.some(reading=>reading.id===rule.id)).map(({id,title})=>({id,title,...(content.occasions?state.eligibleInterpretations.find(reading=>reading.id===id):{})}));}
export function currentPassageV2(state:GameStateV2){const passage=[...state.transcript].reverse().find(entry=>entry.kind==='passage');if(!passage||passage.kind!=='passage')throw new Error('No captured passage');return passage;}
function addRecord(state:GameStateV2,field:'interpretations'|'relationships',record:GameStateV2['interpretations'][number]):void{if(!state[field].some(existing=>existing.id===record.id))state[field].push(record);}
function safeFeedback(question:QuestionV2,code:'supported'|'unsupported'|'premature'|'contradictory'|'irrelevant',state:GameStateV2):string {
  const defaults={supported:'The selected material supports this factual account.',unsupported:'The selected material does not support that account.',premature:'The selected material does not yet form a complete support route.',contradictory:'Some selected material contradicts that account.',irrelevant:'Some selected material does not support this claim.'};
  let text=defaults[code];for(const response of question.feedback)if(response.code===code&&evaluateConditionV2(response.when,state)&&(response.mentions??[]).every(ref=>known(state,ref)))text=response.text;return text;
}
const proofCache=new WeakMap<ContentV2,Map<string,WitnessV2[]>>();
function witnesses(content:ContentV2,question:QuestionV2):WitnessV2[]{let map=proofCache.get(content);if(!map){map=new Map();proofCache.set(content,map);}let result=map.get(question.id);if(!result){result=compileProofV2(question.proof);map.set(question.id,result);}return result;}
function provenance(state:GameStateV2,ref:string,depth=0):string[]{if(depth>200)throw new Error('Invalid deduction ancestry');const source=state.sources.find(source=>source.id===ref);if(source)return[source.provenanceId];const deduction=state.deductions.find(deduction=>deduction.id===ref);return deduction?deduction.witnessRefs.flatMap(child=>provenance(state,child,depth+1)):[];}
function independent(witness:WitnessV2,state:GameStateV2):boolean{const memo=new Map<string,Set<string>>();return witness.independent.every(group=>{
  const seen=new Set<string>();
  for(const ref of group){const origins=state.currentOccasionId?ancestralOriginsV2(state,ref,memo):new Set(provenance(state,ref));for(const origin of origins){if(seen.has(origin))return false;seen.add(origin);}}
  return true;
});}
export function applyCommandV2(content:ContentV2,state:GameStateV2,input:unknown):ResultV2 {
  const fail=(code:ErrorCodeV2,message:string):ResultV2=>({ok:false,state,error:{code,message}});
  const parsed=commandSchemaV2.safeParse(input);if(!parsed.success)return fail('invalid-command','The command is malformed.');const command=parsed.data as CommandV2;
  if(!compatible(content,state))return fail('content-mismatch','This run belongs to a different exact content revision.');
  if(state.processedCommandIds.includes(command.id))return{ok:true,state,duplicate:true};
  if(command.expectedRevision!==state.revision)return fail('stale-command','The passage changed before this command was applied.');
  if(state.ended)return fail('ended','This run has ended.');if(state.revision>=10000)return fail('resource-limit','The 10,000-command limit has been reached. Export this run.');
  if(command.confirmation!==undefined&&canonicalJSON(command.confirmation)!==canonicalJSON(confirmationForV2(state,command)))return fail('confirmation-required','Confirm this action again for the current state.');
  const next=structuredClone(state);next.revision+=1;let label='',feedback:string|undefined,target:string|undefined,transition:ChoiceV2|undefined;
  if(command.type==='choose'){
    const choice=sceneFor(content,state.currentScene).choices.find(choice=>choice.id===command.choiceId);if(!choice||!eligibleChoice(content,state,choice))return fail('unavailable-choice','That action is not available here.');
    if((choice.ending||choice.irreversible)&&!command.confirmation)return fail('confirmation-required','Confirm this action for the current state.');
    label=choice.label;next.flags=sorted([...next.flags,...(choice.effects??[])]);
    if(choice.observation&&!acquire(content,next,choice.observation.id))return fail('unknown-reference','That source is not available in the current occasion.');
    if(choice.interpretation)addRecord(next,'interpretations',{...choice.interpretation,sceneId:state.currentScene,revision:next.revision,...captureOccasionV2(content,state)});
    if(choice.relationship)addRecord(next,'relationships',{...choice.relationship,sceneId:state.currentScene,revision:next.revision,...captureOccasionV2(content,state)});
    if(!runActions(content,next,choice.actions))return fail('unknown-reference','That disclosure is not available from encountered material.');
    target=choice.target;transition=choice;next.ended=choice.ending===true;
  }else if(command.type==='submitDeduction'){
    const question=content.questions.find(question=>question.id===command.questionId),candidate=question?.candidates.find(candidate=>candidate.id===command.candidateId);
    if(!question||!candidate||!currentEntityV2(content,state,question.occasionId)||!evaluateConditionV2(question.when,state)||!evaluateConditionV2(candidate.when,state))return fail('unavailable-question','That factual question or claim is not available.');
    if(new Set(command.selectedRefs).size!==command.selectedRefs.length)return fail('invalid-command','Select each reference at most once.');
    if(!command.selectedRefs.every(ref=>known(state,ref)))return fail('unknown-reference','A selected reference is not among your encountered sources or recorded deductions.');
    if(state.deductions.some(deduction=>deduction.id===question.id))return fail('unsupported','This factual account is already recorded.');
    const reject=(code:'unsupported'|'premature'|'contradictory'|'irrelevant')=>fail(code,safeFeedback(question,code,state));
    if((candidate.contradictedBy??[]).some(ref=>command.selectedRefs.includes(ref)))return reject('contradictory');
    if(candidate.id!==question.supportedCandidateId)return reject('unsupported');
    const routes=witnesses(content,question),complete=routes.filter(witness=>witness.refs.every(ref=>command.selectedRefs.includes(ref))&&(witness.scopes??[]).every(({refId,scope})=>referenceScopeV2(state,(state.sources.find(source=>source.id===refId)??state.deductions.find(deduction=>deduction.id===refId))?.occasionId,scope))),valid=complete.filter(witness=>independent(witness,state));
    const matching=valid.find(witness=>command.selectedRefs.every(ref=>witness.refs.includes(ref)||question.allowedCorroborators.includes(ref)));
    if(!matching){if(valid.length)return reject('irrelevant');if(complete.length)return reject('unsupported');const relevant=new Set([...routes.flatMap(witness=>witness.refs),...question.allowedCorroborators]);return reject(command.selectedRefs.some(ref=>!relevant.has(ref))?'irrelevant':'premature');}
    next.deductions.push({id:question.id,candidateId:candidate.id,text:candidate.text,selectedRefs:sorted(command.selectedRefs),witnessRefs:[...matching.refs],sceneId:state.currentScene,revision:next.revision,...captureOccasionV2(content,state)});
    next.flags=sorted([...next.flags,...(question.effects??[])]);if(!runActions(content,next,question.actions))return fail('unknown-reference','A disclosure requires encountered material.');
    label=candidate.text;feedback=safeFeedback(question,'supported',next);target=question.target;
  }else if(command.type==='requestHint'){
    const hint=content.hints.find(hint=>hint.id===command.hintId);if(!hint||!availableHintsV2(content,state).some(available=>available.id===hint.id))return fail('unavailable-hint','No such hint is available for the material you have encountered.');
    if(hint.reveals&&!command.confirmation)return fail('confirmation-required','Confirm this explicit factual reveal before receiving it.');
    label=hint.label;feedback=hint.text;next.hints.push({id:hint.id,text:hint.text,revision:next.revision,...captureOccasionV2(content,state)});for(const id of hint.sourceIds??[])if(!acquire(content,next,id))return fail('unknown-reference','The hinted material is not available from encountered sources.');
  }else{
    const rule=content.interpretationRules.find(rule=>rule.id===command.interpretationId);if(!rule||!availableInterpretationsV2(content,state).some(available=>available.id===rule.id))return fail('unavailable-reading','No such reading is available from your encountered material.');
    label=rule.title;feedback=rule.text;addRecord(next,'interpretations',{id:rule.id,text:rule.text,sceneId:state.currentScene,revision:next.revision,...captureOccasionV2(content,state),...(content.occasions&&rule.occasionId!==state.currentOccasionId?{originOccasionId:rule.occasionId,originOccasionLabel:content.occasions.find(occasion=>occasion.id===rule.occasionId)!.label}:{})});
  }
  interpretationClosureV2(content,next);
  if(transition&&!transitionOccasionV2(content,next,transition))return fail('unavailable-choice','That occasion transition is unavailable.');
  if(target){const destination=sceneFor(content,target);if(!matches(destination.requires,next)||!evaluateConditionV2(destination.when,next))return fail('unavailable-choice','The destination is not available.');}
  next.commands.push(command);next.processedCommandIds.push(command.id);next.transcript.push({kind:'action',revision:next.revision,sceneId:state.currentScene,label,command,...(feedback!==undefined?{feedback}:{}),...captureOccasionV2(content,state)});
  if(target&&!enter(content,next,target))return fail('unknown-reference','The passage requires unavailable encountered material.');
  try{assertRunBudgetV2(next);}catch{return fail('resource-limit','This action would exceed the 10 MB run limit. Your existing progress is intact and can be exported.');}
  return{ok:true,state:deepFreeze(next),duplicate:false,...(feedback!==undefined?{feedback}:{})};
}
export function projectPlayerV2(content:ContentV2,state:GameStateV2){return deepFreeze({schemaVersion:2 as const,contentId:state.contentId,contentVersion:state.contentVersion,contentHash:state.contentHash,revision:state.revision,ended:state.ended,title:content.title,passage:currentPassageV2(state),observations:state.observations,...seenProjectionV2(state),choices:availableChoicesV2(content,state),questions:availableQuestionsV2(content,state),hintsAvailable:availableHintsV2(content,state),readingsAvailable:availableInterpretationsV2(content,state)});}
