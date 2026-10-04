import type { ActionV2, ConditionV2, ContentV2, ProofV2 } from './evidence-types';

/** Question origins depend on the accepted route; never union their alternatives. */
export function fixedSourceOriginsV2(content:ContentV2,id:string,memo=new Map<string,Set<string>|undefined>(),visiting=new Set<string>()):Set<string>|undefined {
  if(memo.has(id))return memo.get(id);
  const source=content.sources.find(item=>item.id===id);if(!source||visiting.has(id)||visiting.size>200)return undefined;
  visiting.add(id);const origins=new Set<string>();let fixed=true;
  if(source.derivedFrom){for(const parent of source.derivedFrom){const inherited=fixedSourceOriginsV2(content,parent,memo,visiting);if(!inherited){fixed=false;break;}for(const origin of inherited)origins.add(origin);}}
  else origins.add(source.provenanceId);
  visiting.delete(id);const result=fixed?origins:undefined;memo.set(id,result);return result;
}

/** Semantic feature gate: optional schema fields never opt old bundles in silently. */
export function validateOccasionsV2(content:ContentV2,flags:Set<string>,fail:(path:string,message:string)=>void):void {
  const enabled=content.occasions!==undefined,occasions=content.occasions??[],order=new Map(occasions.map((item,index)=>[item.id,index]));
  if(new Set(occasions.map(item=>item.id)).size!==occasions.length)fail('occasions','duplicate occasion IDs');
  for(const item of occasions)if(occasions.some(other=>other.id!==item.id&&other.id.startsWith(`${item.id}.`)))fail('occasions','occasion IDs have ambiguous overlapping namespaces');
  const fields=['scenes','sources','questions','interpretationRules','hints']as const;
  for(const field of fields)for(const entity of content[field]){
    if(!enabled){if(entity.occasionId!==undefined)fail(`${field}.${entity.id}`,'occasion metadata requires content.occasions');}
    else if(!entity.occasionId||!order.has(entity.occasionId)||!entity.id.startsWith(`${entity.occasionId}.`))fail(`${field}.${entity.id}`,'declare a valid occasionId and matching occasionId. namespace');
  }
  const scenes=new Map(content.scenes.map(item=>[item.id,item])),sources=new Map(content.sources.map(item=>[item.id,item])),questions=new Map(content.questions.map(item=>[item.id,item])),actors=new Map(content.characters.map(item=>[item.id,item]));
  const refOccasion=(id:string)=>sources.get(id)?.occasionId??questions.get(id)?.occasionId;
  const flagOccasion=(id:string)=>occasions.find(item=>id.startsWith(`${item.id}.`))?.id;
  const permitted=(from:string|undefined,to:string|undefined,scope:string)=>!!from&&!!to&&(scope==='current'?from===to:scope==='historical'?(order.get(to)??Infinity)<(order.get(from)??-1):(order.get(to)??Infinity)<=(order.get(from)??-1));
  const guard=(node:ConditionV2|undefined,occasionId:string|undefined,path:string)=>{
    if(!node)return;
    if(node.op==='all'||node.op==='any'){for(const child of node.args)guard(child,occasionId,path);return;}
    if(node.op==='not'){guard(node.arg,occasionId,path);return;}
    if(node.op==='occasionIs'){if(!enabled||!order.has(node.id))fail(path,'occasionIs requires a declared authored occasion');return;}
    if(node.op==='hasSource'||node.op==='hasDeduction'||node.op==='flag'){
      if(!enabled&&node.scope!==undefined)fail(path,'scoped guards require content.occasions');
      if(enabled&&node.scope===undefined)fail(path,'source, deduction and flag guards require an explicit scope');
      if(enabled&&node.scope){const owner=node.op==='flag'?flagOccasion(node.id):refOccasion(node.id);if(owner&&!permitted(occasionId,owner,node.scope))fail(path,'guard reference has an impossible occasion scope');}
    }
    if(enabled&&(node.op==='npcKnows'||node.op==='npcBelieves')){const actor=actors.get(node.characterId);if(actor&&actor.persistent!==true&&actor.occasionId!==occasionId)fail(path,'NPC guards must address the current interior or a persistent actor');}
  };
  const localFlags=(ids:string[]|undefined,occasionId:string|undefined,path:string)=>{if(enabled)for(const id of ids??[])if(!occasionId||!id.startsWith(`${occasionId}.`))fail(path,'current permission flags must use this occasion namespace');};
  for(const flag of flags)if(enabled&&!flagOccasion(flag))fail('effects',`flag ${flag} has no declared occasion namespace`);
  for(const occasion of occasions)if([...flags].filter(flag=>flagOccasion(flag)===occasion.id).length>64)fail('effects',`occasion ${occasion.id} exceeds 64 declared flags`);
  const actions=(values:ActionV2[]|undefined,occasionId:string|undefined,path:string)=>{
    for(const action of values??[]){
      if(action.type==='snapshotCharacter'){
        if(!enabled){fail(path,'snapshotCharacter requires content.occasions');continue;}
        const from=actors.get(action.fromCharacterId),to=actors.get(action.toCharacterId);
        if(!from||!to||from.id===to.id||from.occasionId!==occasionId||from.persistent===true||to.persistent!==true||to.requiresSnapshot!==true)fail(path,'snapshot requires a current interior source and a distinct persistent requiresSnapshot destination');
      }else if(action.type==='witnessSource'){
        if(!enabled)fail(path,'witnessSource requires content.occasions');
        if(!sources.has(action.sourceId))fail(path,'witnessSource names a missing source');
        if(enabled&&sources.get(action.sourceId)?.occasionId!==occasionId)fail(path,'witnessed source must belong to the current occasion');
        const actor=actors.get(action.characterId);if(!actor||enabled&&actor.persistent!==true&&actor.occasionId!==occasionId)fail(path,'witness requires a current interior or persistent actor');
      }else if(enabled){
        if(action.type==='acquireSource'){if(sources.get(action.sourceId)?.occasionId!==occasionId)fail(path,'source acquisition must belong to the current occasion');}
        else {const actor=actors.get(action.characterId);if(actor&&actor.persistent!==true&&actor.occasionId!==occasionId)fail(path,'character action must address the current interior or persistent actor');if(action.type==='disclose'&&refOccasion(action.refId)!==occasionId)fail(path,'historical disclosure requires a current recollection source');}
      }
    }
  };
  const captureSources=(ids:string[]|undefined,occasionId:string|undefined,path:string)=>{if(enabled)for(const id of ids??[])if(sources.get(id)?.occasionId!==occasionId)fail(path,'scene/hint acquisition must belong to its occasion');};
  for(const scene of content.scenes){
    guard(scene.when,scene.occasionId,`scenes.${scene.id}.when`);localFlags(scene.requires,scene.occasionId,`scenes.${scene.id}.requires`);captureSources(scene.sourceIds,scene.occasionId,`scenes.${scene.id}.sourceIds`);
    for(const variant of scene.variants??[]){guard(variant.when,scene.occasionId,`variants.${variant.id}.when`);localFlags(variant.requires,scene.occasionId,`variants.${variant.id}.requires`);captureSources(variant.sourceIds,scene.occasionId,`variants.${variant.id}.sourceIds`);}
    for(const choice of scene.choices){
      const path=`choices.${choice.id}`,target=scenes.get(choice.target);guard(choice.when,scene.occasionId,`${path}.when`);actions(choice.actions,scene.occasionId,`${path}.actions`);
      for(const field of ['requires','unless','effects']as const)localFlags(choice[field],scene.occasionId,`${path}.${field}`);
      if(choice.observation)captureSources([choice.observation.id],scene.occasionId,`${path}.observation`);
      if(!enabled&&choice.enterOccasion!==undefined)fail(path,'enterOccasion requires content.occasions');
      if(enabled&&target){
        if(target.occasionId===scene.occasionId){if(choice.enterOccasion!==undefined)fail(path,'same-occasion choices cannot declare enterOccasion');}
        else if(choice.enterOccasion!==target.occasionId||(order.get(target.occasionId!)??-1)!==(order.get(scene.occasionId!)??-2)+1)fail(path,'cross-occasion choices must explicitly enter the immediately next occasion');
      }
    }
  }
  const parentGraph=new Map<string,string[]>();
  for(const source of content.sources){
    if(!enabled&&(source.sourceKey!==undefined||source.derivedFrom!==undefined))fail(`sources.${source.id}`,'sourceKey and derivedFrom require content.occasions');
    if(source.derivedFrom){if(new Set(source.derivedFrom).size!==source.derivedFrom.length)fail(`sources.${source.id}`,'duplicate derivedFrom parents');for(const parent of source.derivedFrom){if(!sources.has(parent)&&!questions.has(parent))fail(`sources.${source.id}`,'missing derivedFrom parent');else if(enabled&&!permitted(source.occasionId,refOccasion(parent),'encountered'))fail(`sources.${source.id}`,'derivedFrom parent belongs to a future occasion');}}
    parentGraph.set(source.id,source.derivedFrom??[]);
    if(enabled&&source.speakerId){const actor=actors.get(source.speakerId);if(actor&&actor.persistent!==true&&actor.occasionId!==source.occasionId)fail(`sources.${source.id}`,'statement speaker must be current or persistent');}
  }
  const keys=content.sources.filter(source=>source.sourceKey!==undefined).map(source=>`${source.occasionId}:${source.sourceKey}`);if(new Set(keys).size!==keys.length)fail('sources','duplicate sourceKey/occasion pair');
  const repeatedOrigins=new Map<string,Set<string>>(),originMemo=new Map<string,Set<string>|undefined>();
  for(const source of content.sources){
    if(!source.sourceKey)continue;
    const origins=fixedSourceOriginsV2(content,source.id,originMemo);
    if(!origins)continue; // A conclusion's selected route is checked on actual acquisition.
    const previous=repeatedOrigins.get(source.sourceKey);
    if(previous&&(previous.size!==origins.size||[...previous].some(origin=>!origins.has(origin))))fail(`sources.${source.id}`,'repeated sourceKey material must retain the same originating provenance');
    else repeatedOrigins.set(source.sourceKey,origins);
  }
  for(const actor of content.characters){
    if(!enabled){if(actor.occasionId!==undefined||actor.persistent!==undefined||actor.requiresSnapshot!==undefined)fail(`characters.${actor.id}`,'character occasion/persistence metadata requires content.occasions');}
    else if((actor.occasionId!==undefined)===(actor.persistent===true)||actor.occasionId!==undefined&&(!order.has(actor.occasionId)||!actor.id.startsWith(`${actor.occasionId}.`)))fail(`characters.${actor.id}`,'declare exactly one valid namespaced occasionId or persistent:true');
    if(actor.requiresSnapshot&&(actor.persistent!==true||actor.initial.knows.length||actor.initial.believes.length||actor.initial.claims.length))fail(`characters.${actor.id}`,'requiresSnapshot must name a persistent target with empty initial arrays');
    if(enabled){
      const initialOccasion=actor.occasionId??occasions[0]?.id;
      for(const ref of [...actor.initial.knows,...actor.initial.claims]){const owner=refOccasion(ref);if(owner&&!permitted(initialOccasion,owner,'encountered'))fail(`characters.${actor.id}.initial`,'initial knowledge/claims cannot name a future source or deduction occurrence');}
    }
  }
  const proofRefs=(proof:ProofV2,occasionId:string|undefined,path:string):string[]=>{
    if(proof.op!=='ref')return proof.args.flatMap(child=>proofRefs(child,occasionId,path));
    if(!enabled&&proof.scope!==undefined)fail(path,'scoped proof references require content.occasions');
    if(enabled&&(!proof.scope||!permitted(occasionId,refOccasion(proof.refId),proof.scope)))fail(path,'proof references require an explicit possible occasion scope');
    return[proof.refId];
  };
  for(const question of content.questions){
    const path=`questions.${question.id}`;guard(question.when,question.occasionId,`${path}.when`);actions(question.actions,question.occasionId,`${path}.actions`);localFlags(question.effects,question.occasionId,`${path}.effects`);
    if(enabled&&question.target&&scenes.get(question.target)?.occasionId!==question.occasionId)fail(path,'question targets cannot cross occasions');
    for(const candidate of question.candidates)guard(candidate.when,question.occasionId,`${path}.candidates`);
    for(const feedback of question.feedback)guard(feedback.when,question.occasionId,`${path}.feedback`);
    parentGraph.set(question.id,proofRefs(question.proof,question.occasionId,`${path}.proof`));
  }
  for(const rule of content.interpretationRules){guard(rule.when,rule.occasionId,`interpretationRules.${rule.id}.when`);localFlags(rule.effects,rule.occasionId,`interpretationRules.${rule.id}.effects`);}
  for(const hint of content.hints){guard(hint.when,hint.occasionId,`hints.${hint.id}.when`);captureSources(hint.sourceIds,hint.occasionId,`hints.${hint.id}.sourceIds`);if(enabled&&questions.get(hint.questionId)?.occasionId!==hint.occasionId)fail(`hints.${hint.id}`,'hint and factual question must belong to the same occasion');}
  if(enabled){
    const visiting=new Set<string>(),depths=new Map<string,number>();
    const depth=(id:string):number=>{const cached=depths.get(id);if(cached!==undefined)return cached;if(visiting.has(id)){fail('ancestry','source/deduction ancestry contains a cycle');return 201;}if(visiting.size>200){fail('ancestry','exceeds 200 ancestry edges');return 201;}visiting.add(id);let value=0;for(const parent of parentGraph.get(id)??[])value=Math.max(value,1+depth(parent));visiting.delete(id);depths.set(id,value);return value;};
    for(const id of parentGraph.keys())if(depth(id)>200)fail('ancestry','exceeds 200 ancestry edges');
  }
}
