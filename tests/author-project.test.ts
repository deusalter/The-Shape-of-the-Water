import { describe,it,expect } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { evidenceFixture as content } from '../src/engine/evidence-fixture';
import { applyCommandV2,createGameV2,validateContentV2 } from '../src/engine/evidence-v2';
import { newProject,checkedProject,exportProject,exportPlayerContent,renameScene,deleteScene } from '../src/studio/project';
import { AuthorProjectStore } from '../src/persistence/author-project';
import { ValidationTask,type ValidationWorker } from '../src/studio/validation-task';

describe('author project preservation and compiled player boundary',()=>{
  it('round-trips author annotations and fixed events while excluding them from compiled content',()=>{
    const project=newProject(content);project.annotations=[{id:'note',sceneId:'bench',text:'AUTHOR_ONLY_SECRET'}];project.fixedEvents=[{id:'truth',text:'UNSEEN_AUTHOR_HISTORY'}];
    expect(checkedProject(exportProject(project))).toEqual(project);const compiled=exportPlayerContent(project);expect(compiled).not.toContain('AUTHOR_ONLY_SECRET');expect(compiled).not.toContain('UNSEEN_AUTHOR_HISTORY');expect(validateContentV2(JSON.parse(compiled)).ok).toBe(true);
  });
  it('preserves a blank-prose broken draft and a separately valid preview through storage',async()=>{
    const project=newProject(content);project.content.sources[0].text='';project.content.scenes[0].paragraphs[0]='';const store=new AuthorProjectStore(new IDBFactory(),'author-draft');await store.save(project,content);const loaded=await store.load(content.id);expect(loaded?.project).toEqual(project);expect(loaded?.lastValid).toEqual(content);expect(()=>exportPlayerContent(project)).toThrow();
  });
  it('retains an added OR proof alternative through export and accepts that support in actual runtime',()=>{
    const project=newProject(content),question=project.content.questions[0];question.proof={op:'any',args:[question.proof,{op:'ref',refId:'aside'}]};
    const checked=validateContentV2(JSON.parse(exportPlayerContent(checkedProject(exportProject(project)))));if(!checked.ok)throw Error(checked.errors.join('\n'));
    let state=createGameV2(checked.value);const first=applyCommandV2(checked.value,state,{type:'choose',id:'inspect',expectedRevision:0,choiceId:'inspect-aside'});if(!first.ok)throw Error(first.error.message);state=first.state;
    const result=applyCommandV2(checked.value,state,{type:'submitDeduction',id:'support',expectedRevision:1,questionId:'ring-account',candidateId:'rinsing',selectedRefs:['aside']});expect(result.ok).toBe(true);
  });
  it('renames scene references while preserving prose and cancels a referenced deletion',()=>{
    const project=newProject(content);project.annotations=[{id:'note',sceneId:'bench',text:'The word bench must stay here.'}];project.content.questions[0].target='bench';
    const renamed=renameScene(project,'bench','new-bench');expect(renamed.content.start).toBe('new-bench');expect(renamed.content.questions[0].target).toBe('new-bench');expect(renamed.annotations[0]).toEqual({id:'note',sceneId:'new-bench',text:'The word bench must stay here.'});expect(renamed.content.scenes[1].choices[0].target).toBe('new-bench');expect(project.content.start).toBe('bench');expect(()=>deleteScene(renamed,'new-bench')).toThrow('repair these references');
  });
});
describe('cancellable author validation',()=>{
  it('never publishes cancelled or superseded worker results, even if a terminated worker sends a late message',()=>{
    const workers:(ValidationWorker&{last?:any;terminated:boolean})[]=[],accepted:unknown[]=[];
    const task=new ValidationTask(()=>{const worker={onmessage:null,onerror:null,last:undefined,terminated:false,postMessage(value:unknown){this.last=value;},terminate(){this.terminated=true;}} as ValidationWorker&{last?:any;terminated:boolean};workers.push(worker);return worker;});
    task.run(content,result=>accepted.push(result));const first=workers[0];task.cancel();first.onmessage?.({data:{generation:first.last.generation,result:{ok:true,value:content}}} as MessageEvent);expect(accepted).toEqual([]);expect(first.terminated).toBe(true);
    task.run(content,result=>accepted.push(result));const second=workers[1];task.run(content,result=>accepted.push(result));const third=workers[2];second.onmessage?.({data:{generation:second.last.generation,result:{ok:true,value:content}}} as MessageEvent);expect(accepted).toEqual([]);third.onmessage?.({data:{generation:third.last.generation,result:{ok:true,value:content}}} as MessageEvent);expect(accepted).toHaveLength(1);expect(third.terminated).toBe(true);
  });
});
