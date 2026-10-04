import type { ContentV2, ProofV2 } from '../engine/evidence-v2';

/** New author entities follow the selected scene; existing IDs are never rewritten. */
export function occasionDefaults(content:ContentV2, selectedSceneId:string) {
  if(!content.occasions)return {};
  return {occasionId:content.scenes.find(scene=>scene.id===selectedSceneId)?.occasionId??content.occasions[0].id};
}
export function authorIdPrefix(content:ContentV2, selectedSceneId:string, kind:string) {
  const occasion=occasionDefaults(content,selectedSceneId).occasionId;
  return occasion?`${occasion}.${kind}`:kind;
}
export function newProofReference(refId:string, optedIn:boolean):ProofV2 {
  return {op:'ref',refId,...(optedIn?{scope:'current' as const}:{})};
}
