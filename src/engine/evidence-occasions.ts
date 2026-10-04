import type { CapturedOccasionV2, ChoiceV2, ContentV2, GameStateV2, OccasionScopeV2 } from './evidence-types';

export function captureOccasionV2(content:ContentV2,state:GameStateV2):CapturedOccasionV2 {
  if(!content.occasions)return{};
  const occasion=content.occasions.find(item=>item.id===state.currentOccasionId);
  if(!occasion)throw new Error('The current authored occasion is missing.');
  return{occasionId:occasion.id,occasionLabel:occasion.label};
}
export function currentEntityV2(content:ContentV2,state:GameStateV2,occasionId:string|undefined):boolean {
  return !content.occasions||occasionId===state.currentOccasionId;
}
export function referenceScopeV2(state:GameStateV2,occasionId:string|undefined,scope:OccasionScopeV2|undefined):boolean {
  if(scope===undefined)return true;
  if(!state.currentOccasionId||!occasionId)return false;
  return scope==='encountered'||(scope==='current'?occasionId===state.currentOccasionId:occasionId!==state.currentOccasionId);
}
export function activeCharacterV2(content:ContentV2,state:GameStateV2,id:string):boolean {
  if(!content.occasions)return true;
  const character=content.characters.find(item=>item.id===id);
  return !!character&&(character.occasionId===state.currentOccasionId||(character.persistent===true&&(!character.requiresSnapshot||!!state.npcState.find(item=>item.id===id)?.snapshot)));
}
export function transitionOccasionV2(content:ContentV2,state:GameStateV2,choice:ChoiceV2):boolean {
  if(!content.occasions)return choice.enterOccasion===undefined;
  const target=content.scenes.find(scene=>scene.id===choice.target);
  if(target?.occasionId===state.currentOccasionId)return choice.enterOccasion===undefined;
  const current=content.occasions.findIndex(item=>item.id===state.currentOccasionId);
  if(current<0||content.occasions[current+1]?.id!==choice.enterOccasion||target?.occasionId!==choice.enterOccasion)return false;
  state.currentOccasionId=choice.enterOccasion;return true;
}

/** Memoized sets prevent repeated ancestry diamonds from expanding exponentially. */
export function ancestralOriginsV2(state:GameStateV2,ref:string,memo=new Map<string,Set<string>>(),visiting=new Set<string>(),depth=0):Set<string> {
  const cached=memo.get(ref);if(cached)return cached;
  if(depth>200||visiting.has(ref))throw new Error('Invalid bounded source ancestry.');
  visiting.add(ref);
  const source=state.sources.find(item=>item.id===ref),deduction=state.deductions.find(item=>item.id===ref);
  const parents=source?.derivedFrom??deduction?.witnessRefs;
  const origins=new Set<string>();
  if(parents)for(const parent of parents)for(const origin of ancestralOriginsV2(state,parent,memo,visiting,depth+1))origins.add(origin);
  else if(source)origins.add(source.provenanceId);
  visiting.delete(ref);memo.set(ref,origins);return origins;
}
