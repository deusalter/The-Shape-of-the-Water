import { contentSchemaV2 } from './evidence-schema';
import { compileProofV2 } from './evidence-proof';
import { deepFreeze, isObject } from './validate';
import type { Validation } from './types';
import type { ActionV2, ConditionV2, ContentV2 } from './evidence-types';

export function boundedTreeV2(value: unknown, path: string): string[] {
  let nodes=0;const errors:string[]=[];
  const visit=(node:unknown,depth:number):void=>{
    if(++nodes>64){if(!errors.length)errors.push(`${path}: exceeds 64 expression nodes`);return;}
    if(depth>8){if(!errors.length)errors.push(`${path}: exceeds expression depth 8`);return;}
    if(!isObject(node))return;
    if(node.op==='not')visit(node.arg,depth+1);
    if((node.op==='all'||node.op==='any')&&Array.isArray(node.args)){if(node.args.length>64){errors.push(`${path}: exceeds 64 expression arguments`);return;}for(const arg of node.args){if(nodes>64)break;visit(arg,depth+1);}}
  };visit(value,1);return errors;
}
export function walkConditionV2(condition:ConditionV2,visit:(condition:ConditionV2)=>void):void { visit(condition);if(condition.op==='all'||condition.op==='any')condition.args.forEach(child=>walkConditionV2(child,visit));else if(condition.op==='not')walkConditionV2(condition.arg,visit); }
function preflight(input:unknown):string[] {
  if(!isObject(input))return['content: must be an object'];
  const errors:string[]=[];
  for(const [field,max]of Object.entries({scenes:2000,sources:2000,characters:100,questions:200,interpretationRules:1000,hints:1000})){const array=input[field];if(Array.isArray(array)&&array.length>max)return[`${field}: exceeds ${max} entries`];}
  const guard=(entity:unknown,path:string)=>{if(isObject(entity)&&entity.when!==undefined)errors.push(...boundedTreeV2(entity.when,`${path}.when`));};
  for(const [index,scene]of (Array.isArray(input.scenes)?input.scenes:[]).entries())if(isObject(scene)){
    guard(scene,`scenes.${index}`);
    for(const field of ['choices','variants'])if(Array.isArray(scene[field])){if(scene[field].length>200)return[`scenes.${index}.${field}: too many entries`];scene[field].forEach((entity,j)=>guard(entity,`scenes.${index}.${field}.${j}`));}
  }
  for(const [index,question]of (Array.isArray(input.questions)?input.questions:[]).entries())if(isObject(question)){
    guard(question,`questions.${index}`);errors.push(...boundedTreeV2(question.proof,`questions.${index}.proof`));
    for(const field of ['candidates','feedback'])if(Array.isArray(question[field])){if(question[field].length>64)return[`questions.${index}.${field}: too many entries`];question[field].forEach((entity,j)=>guard(entity,`questions.${index}.${field}.${j}`));}
  }
  for(const field of ['interpretationRules','hints'])if(Array.isArray(input[field]))input[field].forEach((entity,index)=>guard(entity,`${field}.${index}`));
  return errors.slice(0,100);
}
export function validateContentV2(input:unknown):Validation<ContentV2> {
  const early=preflight(input);if(early.length)return{ok:false,errors:early};
  try{const json=JSON.stringify(input);if(typeof json!=='string'||json.length>10*1024*1024||new TextEncoder().encode(json).byteLength>10*1024*1024)return{ok:false,errors:['content: exceeds 10 MB']};}catch{return{ok:false,errors:['content: must be finite JSON data']};}
  const shape=contentSchemaV2.safeParse(input);if(!shape.success)return{ok:false,errors:shape.error.issues.slice(0,100).map(issue=>`${issue.path.join('.')}: ${issue.message}`)};
  const content=shape.data as ContentV2,errors:string[]=[];
  const fail=(path:string,message:string)=>{if(errors.length<100)errors.push(`${path}: ${message}`);};
  const unique=(ids:string[],path:string)=>{if(new Set(ids).size!==ids.length)fail(path,'duplicate IDs');};
  unique(content.scenes.map(scene=>scene.id),'scenes');unique(content.scenes.flatMap(scene=>scene.choices.map(choice=>choice.id)),'choices');
  for(const field of ['sources','characters','questions','interpretationRules','hints']as const)unique(content[field].map(entity=>entity.id),field);
  unique(content.beliefIds,'beliefIds');
  const scenes=new Set(content.scenes.map(scene=>scene.id)),sources=new Map(content.sources.map(source=>[source.id,source])),questions=new Set(content.questions.map(question=>question.id)),characters=new Set(content.characters.map(character=>character.id)),beliefs=new Set(content.beliefIds),readings=new Set(content.interpretationRules.map(rule=>rule.id));
  for(const id of sources.keys())if(questions.has(id))fail('sources',`source/question reference ID ${id} is ambiguous`);
  const references=new Set([...sources.keys(),...questions]);
  const flags=new Set([...content.scenes.flatMap(scene=>scene.choices.flatMap(choice=>choice.effects??[])),...content.questions.flatMap(question=>question.effects??[]),...content.interpretationRules.flatMap(rule=>rule.effects??[])]);
  if(flags.size>64)fail('effects','exceeds 64 declared flags');
  const total=content.scenes.length+content.scenes.reduce((sum,scene)=>sum+scene.choices.length,0)+content.sources.length+content.characters.length+content.questions.length+content.interpretationRules.length+content.hints.length;
  if(total>8000)fail('content','exceeds 8000 authored entities');
  const reference=(id:string,path:string)=>{if(!references.has(id))fail(path,`missing reference ${id}`);};
  const flagList=(ids:string[]|undefined,path:string)=>{if(!ids)return;unique(ids,path);for(const id of ids)if(!flags.has(id))fail(path,`flag ${id} is never produced`);};
  const condition=(value:ConditionV2|undefined,path:string,mode:'normal'|'closure'|'player'='normal')=>{if(!value)return;walkConditionV2(value,node=>{
    if(mode==='closure'&&(node.op==='not'||node.op==='npcBelieves'))fail(path,'interpretation closure requires monotonic positive conditions');
    if(mode==='player'&&(node.op==='npcKnows'||node.op==='npcBelieves'))fail(path,'feedback/hint guards must use player-known material');
    if(node.op==='hasSource'&&!sources.has(node.id))fail(path,`missing source ${node.id}`);
    if(node.op==='hasDeduction'&&!questions.has(node.id))fail(path,`missing question ${node.id}`);
    if(node.op==='flag'&&!flags.has(node.id))fail(path,`flag ${node.id} is never produced`);
    if(node.op==='interpretationAvailable'&&!readings.has(node.id))fail(path,`missing reading ${node.id}`);
    if(node.op==='npcKnows'){if(!characters.has(node.characterId))fail(path,'missing character');reference(node.refId,path);}
    if(node.op==='npcBelieves'){if(!characters.has(node.characterId)||!beliefs.has(node.beliefId))fail(path,'missing character or belief');}
  });};
  const actions=(values:ActionV2[]|undefined,path:string)=>{for(const action of values??[]){if(action.type==='acquireSource'){if(!sources.has(action.sourceId))fail(path,`missing source ${action.sourceId}`);}else{if(!characters.has(action.characterId))fail(path,'missing character');if(action.type==='disclose')reference(action.refId,path);else if(!beliefs.has(action.beliefId))fail(path,'missing belief');}}};
  const acquired=new Set(content.scenes.flatMap(scene=>[...(scene.sourceIds??[]),...(scene.variants??[]).flatMap(variant=>variant.sourceIds??[]),...scene.choices.flatMap(choice=>[...(choice.actions??[]).filter(action=>action.type==='acquireSource').map(action=>action.sourceId),...(choice.observation?[choice.observation.id]:[])])]).concat(content.hints.flatMap(hint=>hint.sourceIds??[]),content.questions.flatMap(question=>(question.actions??[]).filter(action=>action.type==='acquireSource').map(action=>action.sourceId))));
  for(const source of content.sources){if(source.kind==='statement'){if(!source.speakerId||!characters.has(source.speakerId))fail(`sources.${source.id}`,'statement must name a declared speaker');}else if(source.speakerId!==undefined||source.claimIds?.length)fail(`sources.${source.id}`,'only statement sources can make speaker claims');for(const claim of source.claimIds??[])if(!beliefs.has(claim))fail(`sources.${source.id}`,'missing claim/belief tag');}
  for(const character of content.characters){for(const id of character.initial.knows)reference(id,`characters.${character.id}.knows`);for(const id of character.initial.believes)if(!beliefs.has(id))fail(`characters.${character.id}.believes`,'missing belief');for(const id of character.initial.claims){const source=sources.get(id);if(!source||source.kind!=='statement'||source.speakerId!==character.id)fail(`characters.${character.id}.claims`,'claim must name this character\'s statement');}unique(character.initial.knows,`characters.${character.id}.knows`);unique(character.initial.believes,`characters.${character.id}.believes`);unique(character.initial.claims,`characters.${character.id}.claims`);}
  const recordTexts={observation:new Map<string,string>(),interpretation:new Map<string,string>(),relationship:new Map<string,string>()};
  const graph=new Map(content.scenes.map(scene=>[scene.id,scene.choices.map(choice=>choice.target)]));
  for(const scene of content.scenes){
    flagList(scene.requires,`scenes.${scene.id}.requires`);condition(scene.when,`scenes.${scene.id}.when`);
    for(const id of scene.sourceIds??[])if(!sources.has(id))fail(`scenes.${scene.id}.sourceIds`,'missing source');
    const checkBlocks=(paragraphs:string[],ids:string[]|undefined,path:string)=>{if(ids){unique(ids,path);if(ids.length!==paragraphs.length)fail(path,'paragraphIds must match paragraph count');}};checkBlocks(scene.paragraphs,scene.paragraphIds,`scenes.${scene.id}.paragraphIds`);
    unique((scene.variants??[]).map(variant=>variant.id),`scenes.${scene.id}.variants`);
    for(const variant of scene.variants??[]){flagList(variant.requires,`variants.${variant.id}.requires`);condition(variant.when,`variants.${variant.id}.when`);checkBlocks(variant.paragraphs,variant.paragraphIds,`variants.${variant.id}.paragraphIds`);for(const id of variant.sourceIds??[])if(!sources.has(id))fail(`variants.${variant.id}`,'missing source');}
    for(const choice of scene.choices){if(!scenes.has(choice.target))fail(`choices.${choice.id}.target`,'missing scene');flagList(choice.requires,`choices.${choice.id}.requires`);flagList(choice.unless,`choices.${choice.id}.unless`);flagList(choice.effects,`choices.${choice.id}.effects`);condition(choice.when,`choices.${choice.id}.when`);actions(choice.actions,`choices.${choice.id}.actions`);
      for(const field of ['observation','interpretation','relationship']as const){const record=choice[field];if(!record)continue;const previous=recordTexts[field].get(record.id);if(previous!==undefined&&previous!==record.text)fail(`choices.${choice.id}.${field}`,'repeated record ID changes literal text');recordTexts[field].set(record.id,record.text);if(field==='observation'&&(!sources.has(record.id)||sources.get(record.id)!.text!==record.text))fail(`choices.${choice.id}.observation`,'observation must match a declared source literal');}
    }
  }
  const grounded=new Set<string>(sources.keys()),proofs=new Map<string,ReturnType<typeof compileProofV2>>();
  for(const question of content.questions){unique(question.candidates.map(candidate=>candidate.id),`questions.${question.id}.candidates`);if(!question.candidates.some(candidate=>candidate.id===question.supportedCandidateId))fail(`questions.${question.id}`,'supported candidate is missing');condition(question.when,`questions.${question.id}.when`);flagList(question.effects,`questions.${question.id}.effects`);actions(question.actions,`questions.${question.id}.actions`);
    if(question.target){if(!scenes.has(question.target))fail(`questions.${question.id}.target`,'missing target scene');else for(const edges of graph.values())edges.push(question.target);}
    for(const candidate of question.candidates){condition(candidate.when,`candidates.${candidate.id}.when`);for(const ref of candidate.contradictedBy??[])reference(ref,`candidates.${candidate.id}.contradictedBy`);}
    for(const feedback of question.feedback){condition(feedback.when,`questions.${question.id}.feedback`,'player');for(const ref of feedback.mentions??[])reference(ref,`questions.${question.id}.feedback.mentions`);}
    unique(question.allowedCorroborators,`questions.${question.id}.allowedCorroborators`);question.allowedCorroborators.forEach(ref=>reference(ref,`questions.${question.id}.allowedCorroborators`));
    try{const witnesses=compileProofV2(question.proof);proofs.set(question.id,witnesses);for(const witness of witnesses)for(const ref of witness.refs){reference(ref,`questions.${question.id}.proof`);if(sources.has(ref)&&!acquired.has(ref))fail(`questions.${question.id}.proof`,`source ${ref} has no acquisition path`);}
      if(witnesses.every(witness=>witness.independent.some(group=>{const provenance=group.map(ref=>sources.get(ref)?.provenanceId).filter((value):value is string=>value!==undefined);return new Set(provenance).size!==provenance.length;})))fail(`questions.${question.id}.proof`,'no route satisfies independent source provenance');
    }catch(error){fail(`questions.${question.id}.proof`,error instanceof Error?error.message:'invalid proof');}
  }
  for(let changed=true;changed;){changed=false;for(const[id,witnesses]of proofs)if(!grounded.has(id)&&witnesses.some(witness=>witness.refs.every(ref=>grounded.has(ref)))){grounded.add(id);changed=true;}}
  for(const id of questions)if(!grounded.has(id))fail(`questions.${id}.proof`,'unseeded deduction cycle has no grounded source route');
  for(const rule of content.interpretationRules){condition(rule.when,`interpretationRules.${rule.id}.when`,'closure');for(const ref of rule.relatedRefs)reference(ref,`interpretationRules.${rule.id}.relatedRefs`);flagList(rule.effects,`interpretationRules.${rule.id}.effects`);}
  // Author diagnostics use an optimistic finite abstraction. Failure here proves
  // an unseeded reading/flag cycle; success does not prove a playable route.
  const possibleReadings=new Set<string>(),possibleFlags=new Set([...content.scenes.flatMap(scene=>scene.choices.flatMap(choice=>choice.effects??[])),...content.questions.flatMap(question=>question.effects??[])]);
  const possible=(node:ConditionV2):boolean=>{switch(node.op){case'always':return true;case'all':return node.args.every(possible);case'any':return node.args.some(possible);case'not':return true;case'interpretationAvailable':return possibleReadings.has(node.id);case'flag':return possibleFlags.has(node.id);default:return true;}};
  for(let changed=true;changed;){changed=false;for(const rule of content.interpretationRules)if(!possibleReadings.has(rule.id)&&possible(rule.when)){possibleReadings.add(rule.id);for(const flag of rule.effects??[])possibleFlags.add(flag);changed=true;}}
  for(const rule of content.interpretationRules)if(!possibleReadings.has(rule.id))fail(`interpretationRules.${rule.id}`,'unseeded interpretation/flag cycle cannot become available');
  for(const hint of content.hints){if(!questions.has(hint.questionId))fail(`hints.${hint.id}.questionId`,'missing question');condition(hint.when,`hints.${hint.id}.when`,'player');for(const ref of hint.mentions)reference(ref,`hints.${hint.id}.mentions`);for(const id of hint.sourceIds??[])if(!sources.has(id))fail(`hints.${hint.id}.sourceIds`,'missing source');if(!hint.reveals&&hint.sourceIds?.length)fail(`hints.${hint.id}`,'nonrevealing hints cannot acquire unseen sources');}
  if(!scenes.has(content.start))fail('start','missing scene');const start=content.scenes.find(scene=>scene.id===content.start);if(start?.requires?.length||start?.when&&start.when.op!=='always')fail('start','start scene must have no entry gate');
  const reached=new Set([content.start]);for(let changed=true;changed;){changed=false;for(const[from,edges]of graph)if(reached.has(from))for(const target of edges)if(!reached.has(target)){reached.add(target);changed=true;}}
  for(const id of scenes)if(!reached.has(id))fail('scenes',`scene ${id} has no graph route`);
  if(new TextEncoder().encode(JSON.stringify(content)).byteLength>10*1024*1024)fail('content','exceeds 10 MB');
  return errors.length?{ok:false,errors}:{ok:true,value:deepFreeze(JSON.parse(JSON.stringify(content)) as ContentV2)};
}
