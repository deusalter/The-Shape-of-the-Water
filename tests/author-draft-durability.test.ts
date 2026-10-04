import {describe,it,expect} from 'vitest';
import {IDBFactory} from 'fake-indexeddb';
import {evidenceFixture} from '../src/engine/evidence-fixture';
import {validateContentV2,applyCommandV2,createGameV2} from '../src/engine/evidence-v2';
import {AuthorProjectStore} from '../src/persistence/author-project';
import {newProject,checkedProject,exportProject,exportPlayerContent,compileProject} from '../src/studio/project';

const content=evidenceFixture;
const savedDraft=()=>{const project=newProject(content);project.content.sources[0].provenanceId='';return project;};
describe('unfinished author draft durability',()=>{
  it('saves an independently imported invalid project without borrowing another project preview',async()=>{
    const factory=new IDBFactory(),store=new AuthorProjectStore(factory,'independent-draft');
    const project=newProject(content);project.content.id='independent-unfinished';project.content.scenes[0].title='';
    expect(compileProject(project).ok).toBe(false);
    await store.save(project,null);
    const loaded=await new AuthorProjectStore(factory,'independent-draft').load(project.content.id);
    expect(loaded).toEqual({project,lastValid:null});
    expect(checkedProject(exportProject(loaded!.project))).toEqual(project);
    expect(()=>exportPlayerContent(project)).toThrow();
    await expect(store.save(project,content)).rejects.toThrow('another project');
    expect(await store.load(project.content.id)).toEqual(loaded);
  });
  it('preserves empty provenance through export/import and reopening while retaining a matching valid preview',async()=>{
    const factory=new IDBFactory(),store=new AuthorProjectStore(factory,'empty-provenance');
    const project=savedDraft(),before=JSON.stringify(project),previewBefore=JSON.stringify(content);
    expect(compileProject(project).ok).toBe(false);
    const imported=checkedProject(exportProject(project));expect(imported).toEqual(project);
    await store.save(imported,content);
    const loaded=await new AuthorProjectStore(factory,'empty-provenance').load(content.id);
    expect(loaded?.project).toEqual(project);expect(loaded?.lastValid).toEqual(content);
    expect(()=>exportPlayerContent(loaded!.project)).toThrow('provenanceId');
    expect(JSON.stringify(project)).toBe(before);expect(JSON.stringify(content)).toBe(previewBefore);
  });
  it.each(['reference','condition','proof','flags','record','version','occasion'])('retains unfinished %s values while strict player compilation rejects them',async field=>{
    const project=newProject(content),choice=project.content.scenes[0].choices[0];
    if(field==='reference')choice.target='unfinished target spelling';
    if(field==='condition')choice.when={op:'flag',id:''};
    if(field==='proof')project.content.questions[0].proof={op:'ref',refId:''};
    if(field==='flags')choice.requires=['unfinished flag spelling'];
    if(field==='record')choice.relationship={id:'',text:''};
    if(field==='version')project.content.version=-1;
    if(field==='occasion'){project.content.sources[0].occasionId='';}
    expect(checkedProject(exportProject(project))).toEqual(project);
    expect(compileProject(project).ok).toBe(false);expect(()=>exportPlayerContent(project)).toThrow();
    const store=new AuthorProjectStore(new IDBFactory(),'draft-'+field);await store.save(project,content);expect((await store.load(content.id))?.project).toEqual(project);
  });
  it('can save a repaired draft and strict player export retains actual OR/provenance semantics',async()=>{
    const project=savedDraft();project.content.sources[0].provenanceId='repaired-origin';
    const question=project.content.questions[0];question.proof={op:'any',args:[question.proof,{op:'ref',refId:'aside'}]};
    const valid=validateContentV2(JSON.parse(exportPlayerContent(project)));if(!valid.ok)throw Error(valid.errors.join('\n'));
    const store=new AuthorProjectStore(new IDBFactory(),'repaired');await store.save(project,valid.value);
    expect((await store.load(content.id))?.lastValid?.sources[0].provenanceId).toBe('repaired-origin');
    const first=applyCommandV2(valid.value,createGameV2(valid.value),{type:'choose',id:'inspect',expectedRevision:0,choiceId:'inspect-aside'});if(!first.ok)throw Error(first.error.message);
    expect(applyCommandV2(valid.value,first.state,{type:'submitDeduction',id:'or-proof',expectedRevision:1,questionId:'ring-account',candidateId:'rinsing',selectedRefs:['aside']}).ok).toBe(true);
  });
  it('exports an importable compact draft when readable indentation would exceed the byte limit',()=>{
    const project=newProject(content),limit=10*1024*1024;
    project.content.scenes[0].paragraphs=Array.from({length:200},()=> 'x'.repeat(50000));
    project.content.sources=Array.from({length:2000},(_,i)=>({id:`draft.${i}`,title:'x',text:'',kind:'observation',provenanceId:''}));
    let remaining=limit-500-new TextEncoder().encode(JSON.stringify(project)).byteLength;
    for(const source of project.content.sources){const count=Math.min(remaining,50000);if(count<=0)break;source.text='x'.repeat(count);remaining-=count;}
    expect(new TextEncoder().encode(JSON.stringify(project,null,2)).byteLength).toBeGreaterThan(limit);
    const exported=exportProject(project);expect(new TextEncoder().encode(exported).byteLength).toBeLessThanOrEqual(limit);expect(checkedProject(exported)).toEqual(project);
  });
  it('still reads previously saved nonnullable previews and rejects invalid or foreign previews',async()=>{
    const store=new AuthorProjectStore(new IDBFactory(),'existing-envelope'),project=newProject(content);await store.save(project,content);expect((await store.load(content.id))?.lastValid).toEqual(content);
    const invalid=structuredClone(content);invalid.sources[0].provenanceId='';await expect(store.save(project,invalid)).rejects.toThrow('preview');
    const foreign=structuredClone(content);foreign.id='foreign';await expect(store.save(project,foreign)).rejects.toThrow('another project');
    expect((await store.load(content.id))?.lastValid).toEqual(content);
  });
  it('rejects unsupported shape, unsafe project identity and bounds without replacing a saved draft',async()=>{
    const store=new AuthorProjectStore(new IDBFactory(),'draft-bounds'),project=savedDraft();await store.save(project,content);
    const unknown=JSON.parse(exportProject(project));unknown.content.sources[0].execute='arbitrary';expect(()=>checkedProject(unknown)).toThrow();
    const badId=structuredClone(project);badId.content.id='';expect(()=>checkedProject(badId)).toThrow();
    const oversized=structuredClone(project);oversized.content.sources[0].provenanceId='x'.repeat(50001);await expect(store.save(oversized,content)).rejects.toThrow();
    expect(()=>checkedProject(' '.repeat(10*1024*1024+1))).toThrow('10 MB');
    const nested=structuredClone(project);let condition:any={op:'always'};for(let i=0;i<70;i++)condition={op:'not',arg:condition};nested.content.scenes[0].when=condition;expect(()=>checkedProject(nested)).toThrow('nesting limit');
    expect((await store.load(content.id))?.project).toEqual(project);
  });
});
