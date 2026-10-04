import { describe,it,expect,vi } from 'vitest';
import { IDBFactory,IDBObjectStore } from 'fake-indexeddb';
import { fixtureContent } from '../src/content/fixture';
import { applyChoice,confirmationFor,createGame,stateHash,validateContent,type GameState } from '../src/engine/game';
import { GameStore } from '../src/persistence/store';

const raw=structuredClone(fixtureContent);
raw.scenes[0].choices.push({id:'finish-other',label:'Leave the cup on the bench.',target:'finish',requires:['water','read-ring'],ending:true,relationship:{id:'other-disposition',text:'The cup remains on the bench.'}});
const checked=validateContent(raw);if(!checked.ok)throw Error(checked.errors.join('\n'));const content=checked.value;
function move(state:GameState,id:string){const command={id:`metadata.${state.revision}.${id}`,choiceId:id,expectedRevision:state.revision};const result=applyChoice(content,state,{...command,confirmation:confirmationFor(state,command)});if(!result.ok)throw Error(result.error.message);return result.state;}
function beforeEnding(){return ['cup','inspect-drain','return-sink','propose-rinse'].reduce(move,createGame(content));}

describe('Run identity and protected branch lineage',()=>{
  it('retains two completed branches with verified shared checkpoint parent metadata',async()=>{
    const store=new GameStore(new IDBFactory(),'lineage');const before=beforeEnding();
    await store.save(content,before,0);const original=await store.getRunMetadata(content);expect(original?.origin).toBe('new');
    const first=move(before,'finish-fixture');await store.save(content,first,1);
    expect(await store.loadProtectedCheckpoint(content)).toEqual(before);
    expect(await store.save(content,before,2,{branchFrom:{kind:'protected'}})).toEqual({ok:true,commit:3});
    const branch=await store.getRunMetadata(content);expect(branch?.runId).not.toBe(original?.runId);expect(branch?.parent).toEqual({runId:original!.runId,revision:before.revision,stateChecksum:stateHash(before)});
    const second=move(before,'finish-other');await store.save(content,second,3);
    const archived=(await store.listArchives(content)).filter(x=>x.ended);expect(archived).toHaveLength(2);
    const states=await Promise.all(archived.map(x=>store.loadArchive(content,x.id)));expect(states).toContainEqual(first);expect(states).toContainEqual(second);
    for(const state of states)expect(state!.transcript.slice(0,before.transcript.length)).toEqual(before.transcript);
    const metadata=await Promise.all(archived.map(x=>store.getRunMetadata(content,x.id)));expect(metadata).toContainEqual(original);expect(metadata).toContainEqual(branch);await store.close();
  });
  it('rejects a forged branch source or unrelated history without replacing a valid completed run',async()=>{
    const store=new GameStore(new IDBFactory(),'bad-lineage');const before=beforeEnding(),end=move(before,'finish-fixture');await store.save(content,before,0);await store.save(content,end,1);
    expect(await store.save(content,createGame(content),2,{branchFrom:{kind:'protected'}})).toMatchObject({ok:false,code:'invalid'});
    expect(await store.save(content,before,2,{branchFrom:{kind:'archive',id:'missing'}})).toMatchObject({ok:false,code:'invalid'});
    const loaded=await store.load(content);expect(loaded.kind==='loaded'&&loaded.state).toEqual(end);await store.close();
  });
  it('preserves prior run identity and ending when branch transaction fails, then records one parent on retry',async()=>{
    const store=new GameStore(new IDBFactory(),'failed-lineage');const before=beforeEnding(),end=move(before,'finish-fixture');await store.save(content,before,0);await store.save(content,end,1);const original=await store.getRunMetadata(content);
    const fault=vi.spyOn(IDBObjectStore.prototype,'put').mockImplementationOnce(()=>{throw new DOMException('full','QuotaExceededError');});
    try{expect(await store.save(content,before,2,{branchFrom:{kind:'protected'}})).toMatchObject({ok:false,code:'quota'});}finally{fault.mockRestore();}
    expect(await store.getRunMetadata(content)).toEqual(original);expect((await store.listArchives(content)).filter(x=>x.ended)).toHaveLength(1);
    expect((await store.save(content,before,2,{branchFrom:{kind:'protected'}})).ok).toBe(true);expect((await store.getRunMetadata(content))?.parent?.runId).toBe(original?.runId);await store.close();
  });
});
