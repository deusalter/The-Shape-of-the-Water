import { z } from 'zod';
import { contentSchemaV2 } from '../engine/evidence-schema';
import { validateContentV2, type ContentV2, type ConditionV2 } from '../engine/evidence-v2';
import { deepFreeze } from '../engine/validate';

export interface AuthorAnnotation { id:string; text:string; sceneId?:string; sourceId?:string }
export interface AuthorProject { schemaVersion:1; kind:'author-project'; content:ContentV2; annotations:AuthorAnnotation[]; fixedEvents:{id:string;text:string}[] }
// Author documents preserve unfinished values; player compilation is a separate,
// strict boundary. Keep the same structural kinds and collection limits.
const text=z.string().max(50000),id=contentSchemaV2.shape.id,draftId=text;
const ids=z.array(draftId).max(64),scope=z.enum(['current','historical','encountered']).optional();
const condition:z.ZodType<ConditionV2>=z.lazy(()=>z.discriminatedUnion('op',[
  z.strictObject({op:z.literal('always')}),
  z.strictObject({op:z.enum(['all','any']),args:z.array(condition).min(1).max(64)}),
  z.strictObject({op:z.literal('not'),arg:condition}),
  z.strictObject({op:z.enum(['hasSource','hasDeduction','flag']),id:draftId,scope}),
  z.strictObject({op:z.enum(['interpretationAvailable','occasionIs']),id:draftId}),
  z.strictObject({op:z.literal('npcKnows'),characterId:draftId,refId:draftId}),
  z.strictObject({op:z.literal('npcBelieves'),characterId:draftId,beliefId:draftId}),
]));
const proof:z.ZodType<import('../engine/evidence-v2').ProofV2>=z.lazy(()=>z.discriminatedUnion('op',[
  z.strictObject({op:z.literal('ref'),refId:draftId,scope}),
  z.strictObject({op:z.enum(['all','any']),args:z.array(proof).min(1).max(64),independent:z.boolean().optional()}),
]));
const action=z.discriminatedUnion('type',[
  z.strictObject({type:z.literal('acquireSource'),sourceId:draftId}),
  z.strictObject({type:z.literal('disclose'),characterId:draftId,refId:draftId}),
  z.strictObject({type:z.literal('setBelief'),characterId:draftId,beliefId:draftId,value:z.boolean()}),
  z.strictObject({type:z.literal('snapshotCharacter'),fromCharacterId:draftId,toCharacterId:draftId}),
  z.strictObject({type:z.literal('witnessSource'),characterId:draftId,sourceId:draftId}),
]);
const actions=z.array(action).max(64),when=condition.optional(),occasionId=draftId.optional();
const record=z.strictObject({id:draftId,text});
const scene=contentSchemaV2.shape.scenes.element;
const choice=scene.shape.choices.element.extend({id:draftId,label:text,target:draftId,requires:ids.optional(),unless:ids.optional(),effects:ids.optional(),observation:record.optional(),interpretation:record.optional(),relationship:record.optional(),when,actions:actions.optional(),enterOccasion:occasionId});
const paragraphs=z.array(text).min(1).max(200);
const variant=scene.shape.variants.unwrap().element.extend({id:draftId,requires:ids,when,paragraphs,paragraphIds:z.array(draftId).max(200).optional(),sourceIds:ids.optional()});
const draftScene=scene.extend({id:draftId,title:text,paragraphs,choices:z.array(choice).max(200),requires:ids.optional(),variants:z.array(variant).max(100).optional(),when,paragraphIds:z.array(draftId).max(200).optional(),sourceIds:ids.optional(),occasionId});
const question=contentSchemaV2.shape.questions.element;
export const draftContentSchemaV2=contentSchemaV2.extend({
  // Project identity stays strict so draft storage cannot acquire ambiguous keys.
  title:text,version:z.number().int().min(-Number.MAX_SAFE_INTEGER).max(Number.MAX_SAFE_INTEGER),start:draftId,scenes:z.array(draftScene).min(1).max(2000),beliefIds:ids,
  sources:z.array(contentSchemaV2.shape.sources.element.extend({id:draftId,title:text,text,provenanceId:draftId,speakerId:draftId.optional(),claimIds:ids.optional(),occasionId,sourceKey:draftId.optional(),derivedFrom:ids.min(1).optional()})).max(2000),
  characters:z.array(contentSchemaV2.shape.characters.element.extend({id:draftId,name:text,initial:z.strictObject({knows:ids,believes:ids,claims:ids}),occasionId})).max(100),
  questions:z.array(question.extend({id:draftId,text,when,candidates:z.array(question.shape.candidates.element.extend({id:draftId,text,when,contradictedBy:ids.optional()})).min(1).max(64),supportedCandidateId:draftId,proof,allowedCorroborators:ids,feedback:z.array(question.shape.feedback.element.extend({text,when,mentions:ids.optional()})).max(50),effects:ids.optional(),actions:actions.optional(),target:draftId.optional(),occasionId})).max(200),
  interpretationRules:z.array(contentSchemaV2.shape.interpretationRules.element.extend({id:draftId,title:text,text,when:condition,relatedRefs:ids,effects:ids.optional(),occasionId})).max(1000),
  hints:z.array(contentSchemaV2.shape.hints.element.extend({id:draftId,label:text,text,questionId:draftId,when:condition,mentions:ids,sourceIds:ids.optional(),occasionId})).max(1000),
  occasions:z.array(z.strictObject({id:draftId,label:text})).min(1).max(16).optional(),
});
const annotation=z.strictObject({id:draftId,text,sceneId:draftId.optional(),sourceId:draftId.optional()});
const projectSchema=z.strictObject({schemaVersion:z.literal(1),kind:z.literal('author-project'),content:draftContentSchemaV2,annotations:z.array(annotation).max(5000),fixedEvents:z.array(z.strictObject({id:draftId,text})).max(2000)});
export function checkedProject(input:unknown):AuthorProject{
  const raw=typeof input==='string'?input:JSON.stringify(input);
  if(!raw||new TextEncoder().encode(raw).byteLength>10*1024*1024)throw Error('Author project exceeds the 10 MB limit.');
  const value:unknown=JSON.parse(raw);
  // Bound nesting before recursive expression validation can consume the stack.
  const pending:{value:unknown;depth:number}[]=[{value,depth:0}];
  while(pending.length){const item=pending.pop()!;if(item.depth>64)throw Error('Author project exceeds the nesting limit of 64.');if(item.value&&typeof item.value==='object')for(const child of Object.values(item.value))pending.push({value:child,depth:item.depth+1});}
  const parsed=projectSchema.safeParse(value);
  if(!parsed.success)throw Error(parsed.error.issues.slice(0,20).map(issue=>`${issue.path.join('.')}: ${issue.message}`).join('\n'));
  return parsed.data as AuthorProject;
}
export function newProject(content:ContentV2):AuthorProject{return{schemaVersion:1,kind:'author-project',content:structuredClone(content),annotations:[],fixedEvents:[]};}
export function compileProject(project:AuthorProject){return validateContentV2(project.content);}
export function exportProject(project:AuthorProject){const checked=checkedProject(project),pretty=JSON.stringify(checked,null,2);return new TextEncoder().encode(pretty).byteLength<=10*1024*1024?pretty:JSON.stringify(checked);}
export function exportPlayerContent(project:AuthorProject){const result=compileProject(project);if(!result.ok)throw Error(result.errors.join('\n'));return JSON.stringify(result.value,null,2);}

/** Stable-ID rename touches references, never similarly spelled prose or annotations. */
export function renameScene(project:AuthorProject,oldId:string,newId:string):AuthorProject{
  if(!id.safeParse(newId).success)throw Error('Use a valid stable scene ID.');
  if(!project.content.scenes.some(scene=>scene.id===oldId))throw Error('The scene no longer exists.');
  if(oldId!==newId&&project.content.scenes.some(scene=>scene.id===newId))throw Error('That scene ID already exists.');
  const next=structuredClone(project);
  for(const scene of next.content.scenes){if(scene.id===oldId)scene.id=newId;for(const choice of scene.choices)if(choice.target===oldId)choice.target=newId;}
  if(next.content.start===oldId)next.content.start=newId;
  for(const question of next.content.questions)if(question.target===oldId)question.target=newId;
  for(const note of next.annotations)if(note.sceneId===oldId)note.sceneId=newId;
  return next;
}
export function deleteScene(project:AuthorProject,sceneId:string):AuthorProject{
  const refs=project.content.scenes.flatMap(scene=>scene.choices.filter(choice=>choice.target===sceneId&&scene.id!==sceneId).map(choice=>`choice ${choice.id}`));
  refs.push(...project.content.questions.filter(question=>question.target===sceneId).map(question=>`question ${question.id}`));
  refs.push(...project.annotations.filter(note=>note.sceneId===sceneId).map(note=>`annotation ${note.id}`));
  if(project.content.start===sceneId)refs.push('project start');
  if(refs.length)throw Error(`Cancel deletion or repair these references first: ${refs.join(', ')}.`);
  const next=structuredClone(project);next.content.scenes=next.content.scenes.filter(scene=>scene.id!==sceneId);return next;
}
export function parseCondition(text:string):ConditionV2|undefined{
  if(!text.trim())return;
  const shape=contentSchemaV2.shape.scenes.element.shape.when.safeParse(JSON.parse(text));if(!shape.success)throw Error(shape.error.issues.map(issue=>`${issue.path.join('.')}: ${issue.message}`).join('\n'));return shape.data;
}
export function freezeValidated(content:ContentV2):ContentV2{return deepFreeze(content);}
