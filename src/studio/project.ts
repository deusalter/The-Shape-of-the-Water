import { z } from 'zod';
import { contentSchemaV2 } from '../engine/evidence-schema';
import { validateContentV2, type ContentV2, type ConditionV2 } from '../engine/evidence-v2';
import { deepFreeze } from '../engine/validate';

export interface AuthorAnnotation { id:string; text:string; sceneId?:string; sourceId?:string }
export interface AuthorProject { schemaVersion:1; kind:'author-project'; content:ContentV2; annotations:AuthorAnnotation[]; fixedEvents:{id:string;text:string}[] }
const text=z.string().max(50000),id=contentSchemaV2.shape.id;
const annotation=z.strictObject({id,text,sceneId:id.optional(),sourceId:id.optional()});
const scene=contentSchemaV2.shape.scenes.element;
const draftScene=scene.extend({title:text,paragraphs:z.array(text).min(1).max(200),choices:z.array(scene.shape.choices.element.extend({label:text})).max(200),variants:z.array(scene.shape.variants.unwrap().element.extend({paragraphs:z.array(text).min(1).max(200)})).max(100).optional()});
const question=contentSchemaV2.shape.questions.element;
export const draftContentSchemaV2=contentSchemaV2.extend({
  title:text,version:z.number().int().min(-Number.MAX_SAFE_INTEGER).max(Number.MAX_SAFE_INTEGER),scenes:z.array(draftScene).min(1).max(2000),
  sources:z.array(contentSchemaV2.shape.sources.element.extend({title:text,text})).max(2000),
  characters:z.array(contentSchemaV2.shape.characters.element.extend({name:text})).max(100),
  questions:z.array(question.extend({text,candidates:z.array(question.shape.candidates.element.extend({text})).min(1).max(64),feedback:z.array(question.shape.feedback.element.extend({text})).max(50)})).max(200),
  interpretationRules:z.array(contentSchemaV2.shape.interpretationRules.element.extend({title:text,text})).max(1000),
  hints:z.array(contentSchemaV2.shape.hints.element.extend({label:text,text})).max(1000),
});
const projectSchema=z.strictObject({schemaVersion:z.literal(1),kind:z.literal('author-project'),content:draftContentSchemaV2,annotations:z.array(annotation).max(5000),fixedEvents:z.array(z.strictObject({id,text})).max(2000)});
export function checkedProject(input:unknown):AuthorProject{
  const raw=typeof input==='string'?input:JSON.stringify(input);
  if(!raw||new TextEncoder().encode(raw).byteLength>10*1024*1024)throw Error('Author project exceeds the10 MB limit.');
  const parsed=projectSchema.safeParse(JSON.parse(raw));
  if(!parsed.success)throw Error(parsed.error.issues.slice(0,20).map(issue=>`${issue.path.join('.')}: ${issue.message}`).join('\n'));
  return parsed.data as AuthorProject;
}
export function newProject(content:ContentV2):AuthorProject{return{schemaVersion:1,kind:'author-project',content:structuredClone(content),annotations:[],fixedEvents:[]};}
export function compileProject(project:AuthorProject){return validateContentV2(project.content);}
export function exportProject(project:AuthorProject){return JSON.stringify(checkedProject(project),null,2);}
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
