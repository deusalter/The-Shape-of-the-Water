import { validateContentV2,type ContentV2,type CharacterV2 } from '../engine/evidence-v2';
import { contentHash } from '../engine/hash';

export interface PreviewScenario {sceneId:string;flags:string[];sourceIds:string[];characters?:{id:string;initial:CharacterV2['initial']}[]}
/** An injected scenario is a different validated bundle, so its export cannot load as a real run. */
export function injectedPreview(content:ContentV2,scenario:PreviewScenario):ContentV2{
  if(!content.scenes.some(scene=>scene.id===scenario.sceneId))throw Error('Choose a declared scene.');
  const flags=new Set([...content.scenes.flatMap(scene=>scene.choices.flatMap(choice=>choice.effects??[])),...content.questions.flatMap(question=>question.effects??[]),...content.interpretationRules.flatMap(rule=>rule.effects??[])]);
  if(scenario.flags.some(flag=>!flags.has(flag)))throw Error('Injected flags must already be declared by the project.');
  if(scenario.sourceIds.some(id=>!content.sources.some(source=>source.id===id)))throw Error('Injected evidence must name declared sources.');
  if(new Set(scenario.characters?.map(person=>person.id)).size!==(scenario.characters?.length??0))throw Error('Specify each character once.');
  const next=structuredClone(content);
  next.id=`preview.${contentHash({content,scenario}).slice(0,24)}`;
  next.title=`Noncanonical scenario: ${content.title}`;
  let start='author-preview-entry';while(next.scenes.some(scene=>scene.id===start))start+='-x';
  let choice='author-preview-enter';while(next.scenes.some(scene=>scene.choices.some(item=>item.id===choice)))choice+='-x';
  next.start=start;
  for(const person of scenario.characters??[]){const target=next.characters.find(item=>item.id===person.id);if(!target)throw Error(`Unknown preview character: ${person.id}`);target.initial=structuredClone(person.initial);}
  const openingChoice=`${choice}-opening`;
  next.scenes.unshift({id:start,title:'Noncanonical author scenario',paragraphs:['This scenario injects author-selected evidence and conditions. It uses a different content identity and separate preview storage. Its exported run cannot replace an ordinary player run.','Enter the selected scene to apply the supplied flags. Its normal entry conditions still apply. Factual conclusions require an actual submission in this preview.'],sourceIds:[...new Set(scenario.sourceIds)],choices:[{id:choice,label:'Enter the selected scene with these conditions.',target:scenario.sceneId,effects:[...new Set(scenario.flags)]},{id:openingChoice,label:'Visit the original opening within this injected scenario.',target:content.start,effects:[...new Set(scenario.flags)]}]});
  const checked=validateContentV2(next);if(!checked.ok)throw Error(checked.errors.join('\n'));return checked.value;
}
