import { contentHash,stateHash } from './hash';
import { validateContent,validateState } from './game';
import { manifestSchemaV2,seedSchemaV2 } from './evidence-schema';
import type { ContentV2,GameStateV2,LegacySeedV2,ReplayContextV2 } from './evidence-types';
export function applyLegacySeedV2(content:ContentV2,state:GameStateV2,input:LegacySeedV2,context:ReplayContextV2|undefined):void {
  const seed=seedSchemaV2.safeParse(input);if(!seed.success||!context)throw new Error('Migration seed requires an installed compatibility context.');
  const manifest=manifestSchemaV2.safeParse(context.manifests[seed.data.manifestId]);if(!manifest.success||manifest.data.id!==seed.data.manifestId||stateHash(manifest.data)!==seed.data.manifestHash||manifest.data.toHash!==contentHash(content))throw new Error('Migration manifest receipt or target hash does not match.');
  const old=validateContent(context.legacyBundles[manifest.data.fromHash]);if(!old.ok||contentHash(old.value)!==manifest.data.fromHash)throw new Error('The installed legacy bundle does not match the manifest.');
  const legacy=validateState(old.value,seed.data.legacyState);if(!legacy.ok||stateHash(legacy.value)!==seed.data.legacyStateHash)throw new Error('The legacy seed failed validation.');
  const sourceMap=manifest.data.sourceMap,sceneMap=manifest.data.sceneMap,flagMap=manifest.data.flagMap;
  const lookup=(map:Record<string,string>,key:string)=>Object.hasOwn(map,key)?map[key]:undefined;
  const target=lookup(sceneMap,legacy.value.currentScene);if(!target||!content.scenes.some(scene=>scene.id===target))throw new Error('The current legacy scene has no declared compatibility mapping.');
  const declaredFlags=new Set([...content.scenes.flatMap(scene=>scene.choices.flatMap(choice=>choice.effects??[])),...content.questions.flatMap(question=>question.effects??[]),...content.interpretationRules.flatMap(rule=>rule.effects??[])]);
  const oldChoices=old.value.scenes.flatMap(scene=>scene.choices),oldFlags=new Set(oldChoices.flatMap(choice=>choice.effects??[])),oldSources=new Set(oldChoices.flatMap(choice=>choice.observation?[choice.observation.id]:[]));
  for(const [from,to] of Object.entries(sceneMap))if(!old.value.scenes.some(scene=>scene.id===from)||!content.scenes.some(scene=>scene.id===to))throw new Error('Migration maps an undeclared scene.');
  for(const flag of Object.keys(flagMap))if(!oldFlags.has(flag))throw new Error('Migration maps an undeclared legacy flag.');
  for(const id of Object.keys(sourceMap))if(!oldSources.has(id))throw new Error('Migration maps an undeclared legacy source.');
  for(const flag of Object.values(flagMap))if(!declaredFlags.has(flag))throw new Error('Migration maps an undeclared target flag.');
  for(const id of Object.values(sourceMap))if(!content.sources.some(source=>source.id===id))throw new Error('Migration maps an undeclared target source.');
  const mapped=legacy.value.observations.filter(record=>lookup(sourceMap,record.id)).map(record=>{const definition=content.sources.find(source=>source.id===lookup(sourceMap,record.id))!;return{...definition,title:record.id,text:record.text,sceneId:record.sceneId,revision:record.revision};});
  if(new Set(mapped.map(source=>source.id)).size!==mapped.length)throw new Error('Migration combines distinct observed source instances.');
  state.revision=legacy.value.revision;state.currentScene=target;state.ended=legacy.value.ended;state.flags=[...new Set(legacy.value.flags.flatMap(flag=>{const mapped=lookup(flagMap,flag);return mapped?[mapped]:[];}))].sort();
  state.observations=structuredClone(legacy.value.observations);state.interpretations=structuredClone(legacy.value.interpretations);state.relationships=structuredClone(legacy.value.relationships);state.transcript=structuredClone(legacy.value.transcript);state.processedCommandIds=[...legacy.value.processedCommandIds];state.sources=mapped;state.migrationSeed=structuredClone(input);
  for(const source of mapped)if(source.kind==='statement'){const npc=state.npcState.find(npc=>npc.id===source.speakerId)!;if(!npc.claims.some(claim=>claim.sourceId===source.id))npc.claims.push({sourceId:source.id,revision:source.revision});}
  const made=new Set(legacy.value.transcript.filter(event=>event.kind==='choice').map(event=>event.choiceId));
  for(const disclosure of manifest.data.disclosures){const npc=state.npcState.find(npc=>npc.id===disclosure.characterId);if(!oldChoices.some(choice=>choice.id===disclosure.choiceId)||!npc||!content.sources.some(source=>source.id===disclosure.refId))throw new Error('Migration disclosure has an invalid choice, target or source.');if(!made.has(disclosure.choiceId))continue;if(!state.sources.some(source=>source.id===disclosure.refId))throw new Error('Migration disclosure requires a genuinely encountered source.');npc.knows=[...new Set([...npc.knows,disclosure.refId])].sort();}
}
