import { afterEach, describe, expect, it, vi } from 'vitest';
import { IDBFactory, IDBObjectStore } from 'fake-indexeddb';
import { fixtureContent } from '../src/content/fixture';
import { createGame, currentPassage, serializePlayerExport, validateState } from '../src/engine/game';
import { GameStore, slotKey } from '../src/persistence/store';
import { stateHash } from '../src/engine/hash';
import { move } from './helpers';

let sequence=0;
const opened:GameStore[]=[];
function setup() {const factory=new IDBFactory(),name=`fixture-${sequence++}`,store=new GameStore(factory,name);opened.push(store);return{factory,name,store};}
async function changeSlot(factory:IDBFactory,name:string,mutate:(raw:any)=>void) {
  const db:IDBDatabase=await new Promise((resolve,reject)=>{const request=factory.open(name,2);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
  await new Promise<void>((resolve,reject)=>{const tx=db.transaction('slots','readwrite'),slots=tx.objectStore('slots'),request=slots.get(slotKey(fixtureContent));request.onsuccess=()=>{const raw=request.result;mutate(raw);slots.put(raw,slotKey(fixtureContent));};tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});db.close();
}
afterEach(async()=>{vi.restoreAllMocks();await Promise.all(opened.splice(0).map(store=>store.close()));});
describe('validated IndexedDB saves',()=>{
  it('saves, reloads and revisits with exact original observations and earlier text',async()=>{
    const{store}=setup();let state=createGame(fixtureContent);for(const id of ['cup','accuse','return-worker','inspect-drain','return-sink','propose-rinse'])state=move(state,id);
    expect(await store.save(fixtureContent,state,0)).toEqual({ok:true,commit:1});
    const restored=await store.load(fixtureContent);expect(restored.kind).toBe('loaded');if(restored.kind!=='loaded')return;
    expect(restored.state).toEqual(state);expect(validateState(fixtureContent,restored.state).ok).toBe(true);
    const revisit=move(move(restored.state,'inspect-drain'),'return-sink');expect(currentPassage(revisit).paragraphs.join(' ')).toContain('rinse water');expect(revisit.transcript[0]).toEqual(state.transcript[0]);expect(revisit.observations[0].text).toBe('The blue cup stood beside a dry ring.');
  });
  it('serializes competing tab writes and refuses to overwrite the winner',async()=>{
    const{factory,name,store}=setup(),other=new GameStore(factory,name);opened.push(other);
    const initial=createGame(fixtureContent),a=move(initial,'cup'),b=move(initial,'accuse');
    const results=await Promise.all([store.save(fixtureContent,a,0),other.save(fixtureContent,b,0)]);
    expect(results.filter(r=>r.ok)).toHaveLength(1);expect(results.filter(r=>!r.ok&&r.code==='conflict')).toHaveLength(1);
    const loaded=await store.load(fixtureContent);expect(loaded.kind).toBe('loaded');if(loaded.kind==='loaded')expect([a,b]).toContainEqual(loaded.state);
  });
  it('retains three valid checkpoints and recovers from corrupted current plus corrupt newest backup',async()=>{
    const{factory,name,store}=setup();let state=createGame(fixtureContent);await store.save(fixtureContent,state,0);
    let commit=1;const history=[state];for(const id of ['cup','accuse','return-worker','inspect-drain']){state=move(state,id);history.push(state);const result=await store.save(fixtureContent,state,commit);if(!result.ok)throw new Error(result.message);commit=result.commit;}
    await changeSlot(factory,name,raw=>{expect(raw.backups).toHaveLength(3);raw.current.state.transcript[0].paragraphs[0]='damaged';raw.backups[0].stateChecksum='broken';});
    const loaded=await store.load(fixtureContent);expect(loaded.kind).toBe('recovered');if(loaded.kind==='recovered'){expect(loaded.state).toEqual(history[2]);expect(loaded.commit).toBe(commit+1);}
  });
  it('quarantines completely corrupt data instead of trusting it',async()=>{
    const{factory,name,store}=setup();const active=move(createGame(fixtureContent),'cup');await store.save(fixtureContent,active,0);
    await changeSlot(factory,name,raw=>{raw.current={schemaVersion:999};raw.backups=[];raw.preEnding=null;});
    const loaded=await store.load(fixtureContent);expect(loaded.kind).toBe('corrupt');expect(active.revision).toBe(1);expect(serializePlayerExport(active)).toContain('dry ring');
    if(loaded.kind==='corrupt')expect((await store.save(fixtureContent,active,loaded.commit)).ok).toBe(true);
  });
  it.each([false,true])('preserves ordered recovery and protected history on ending save (forged backup: %s)',async forged=>{
    const {factory,name,store}=setup();let state=createGame(fixtureContent),commit=0;
    const history=[state];
    for(const id of ['cup','inspect-drain','return-sink','propose-rinse'])history.push(state=move(state,id));
    for(const checkpoint of history){const saved=await store.save(fixtureContent,checkpoint,commit);expect(saved.ok).toBe(true);if(saved.ok)commit=saved.commit;}
    if(forged)await changeSlot(factory,name,raw=>{
      raw.backups[0].state.transcript[0].paragraphs[0]='Forged text with a matching checksum';
      raw.backups[0].stateChecksum=stateHash(raw.backups[0].state);
    });
    expect(await store.save(fixtureContent,move(state,'finish-fixture'),commit)).toEqual({ok:true,commit:commit+1});
    await changeSlot(factory,name,raw=>{
      expect(raw.backups.map((entry:any)=>entry.state)).toEqual(forged?[history[4],history[2],history[1]]:[history[4],history[3],history[2]]);
      expect(raw.preEnding.state).toEqual(history[4]);
      expect(raw.checkpointRuns.map((entry:any)=>entry.stateChecksum)).toEqual([raw.current,...raw.backups,raw.preEnding].map((entry:any)=>entry.stateChecksum));
      // Previously valid data must be replayed again in a later transaction.
      raw.current.state.transcript[0].paragraphs[0]='Changed after saving';
      raw.current.stateChecksum=stateHash(raw.current.state);
    });
    const recovered=await store.load(fixtureContent);
    expect(recovered.kind).toBe('recovered');
    if(recovered.kind==='recovered')expect(recovered.state).toEqual(history[4]);
  });
  it('reports quota failure, leaves the previous save intact and does not erase the candidate',async()=>{
    const{store}=setup(),initial=createGame(fixtureContent);await store.save(fixtureContent,initial,0);const candidate=move(initial,'cup');
    const put=vi.spyOn(IDBObjectStore.prototype,'put').mockImplementation(()=>{throw new DOMException('Storage full','QuotaExceededError');});
    const result=await store.save(fixtureContent,candidate,1);expect(result).toMatchObject({ok:false,code:'quota'});put.mockRestore();
    const loaded=await store.load(fixtureContent);expect(loaded.kind==='loaded'&&loaded.state).toEqual(initial);expect(candidate.observations).toHaveLength(1);
  });
  it('archives a prior run on replacement and completed runs, with protected pre-ending state',async()=>{
    const{factory,name,store}=setup();let state=createGame(fixtureContent);for(const id of ['cup','inspect-drain','return-sink','propose-rinse'])state=move(state,id);
    await store.save(fixtureContent,state,0);const ending=move(state,'finish-fixture');await store.save(fixtureContent,ending,1);
    await changeSlot(factory,name,raw=>{expect(raw.preEnding.state).toEqual(state);});
    await store.save(fixtureContent,createGame(fixtureContent),2,{archiveCurrent:true});const archives=await store.listArchives(fixtureContent);expect(archives.some(a=>a.ended)).toBe(true);
    const completed=archives.find(a=>a.ended)!;expect(await store.loadArchive(fixtureContent,completed.id)).toEqual(ending);
  });
  it('preserves and offers export of a run belonging to another exact text hash',async()=>{
    const{store}=setup(),state=move(createGame(fixtureContent),'cup');await store.save(fixtureContent,state,0);
    const changed=structuredClone(fixtureContent);changed.scenes[0].paragraphs[0]+=' Changed.';
    const loaded=await store.load(changed);expect(loaded.kind).toBe('incompatible');if(loaded.kind==='incompatible')expect(JSON.parse(loaded.retained[0].json).state).toEqual(state);
    const original=await store.load(fixtureContent);expect(original.kind==='loaded'&&original.state).toEqual(state);
  });
});
