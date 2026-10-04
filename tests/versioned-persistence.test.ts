import { describe,it,expect,vi } from 'vitest';
import { IDBFactory,IDBObjectStore } from 'fake-indexeddb';
import { evidenceFixture as content } from '../src/engine/evidence-fixture';
import { fixtureContent as legacy } from '../src/content/fixture';
import { createGame } from '../src/engine/game';
import { createGameV2,applyCommandV2,confirmationForV2,importPortableV2,validateContentV2,type GameStateV2,type MigrationManifestV2,type LegacySeedV2,type ReplayContextV2 } from '../src/engine/evidence-v2';
import { contentHash,stateHash } from '../src/engine/hash';
import { GameStore } from '../src/persistence/store';
import { EvidenceStore } from '../src/persistence/evidence-store';
import { slotKey } from '../src/persistence/checkpoint-store';
import { move } from './helpers';

function choose(state:GameStateV2,id:string){const command={type:'choose' as const,id:`store.${state.revision}.${id}`,expectedRevision:state.revision,choiceId:id};const result=applyCommandV2(content,state,{...command,confirmation:confirmationForV2(state,command)});if(!result.ok)throw Error(result.error.message);return result.state;}
async function readSlot(factory:IDBFactory,name:string,key:string){const db=await new Promise<IDBDatabase>((resolve,reject)=>{const r=factory.open(name,2);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});try{return await new Promise<unknown>((resolve,reject)=>{const r=db.transaction('slots').objectStore('slots').get(key);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}finally{db.close();}}
function migration(){
  const legacyState=move(move(createGame(legacy),'cup'),'inspect-drain');
  const manifest:MigrationManifestV2={id:'persistence-migration',fromHash:contentHash(legacy),toHash:contentHash(content),sceneMap:{bench:'bench',sink:'sink',worker:'worker',finish:'finish'},flagMap:{'cup-seen':'cup-seen',water:'water'},sourceMap:{ring:'ring',rinse:'rinse'},disclosures:[]};
  const seed:LegacySeedV2={manifestId:manifest.id,manifestHash:stateHash(manifest),legacyState,legacyStateHash:stateHash(legacyState)};
  const context:ReplayContextV2={legacyBundles:{[manifest.fromHash]:legacy},manifests:{[manifest.id]:manifest}};
  return {legacyState,manifest,seed,context};
}

describe('versioned checkpoint transactions',()=>{
  it('round-trips v2 internal state while storing an encountered-only portable recovery copy',async()=>{
    const factory=new IDBFactory(),store=new EvidenceStore(factory,'v2-roundtrip');
    const state=choose(choose(createGameV2(content),'ask-gently'),'disclose-worker');
    expect(await store.save(content,state,0)).toEqual({ok:true,commit:1});
    const loaded=await store.load(content);expect(loaded.kind==='loaded'&&loaded.state).toEqual(state);
    const slot=await readSlot(factory,'v2-roundtrip',slotKey(content)) as {portable:string};
    for(const sentinel of ['npcState','PRIVATE_NPC','PRIVATE_TITLE','worker-private-belief','UNSEEN_FILM'])expect(slot.portable).not.toContain(sentinel);
    expect(importPortableV2(content,slot.portable).ok).toBe(true);await store.close();
  });
  it('retains v2 incompatible runs without exposing hidden internal state',async()=>{
    const factory=new IDBFactory(),store=new EvidenceStore(factory,'v2-incompatible');await store.save(content,createGameV2(content),0);
    const edited=structuredClone(content);edited.version=3;edited.scenes[0].paragraphs[0]='Changed opening';const checked=validateContentV2(edited);if(!checked.ok)throw Error(checked.errors.join('\n'));
    const loaded=await store.load(checked.value);expect(loaded.kind).toBe('incompatible');
    if(loaded.kind==='incompatible'){expect(loaded.retained).toHaveLength(1);expect(importPortableV2(content,loaded.retained[0].json).ok).toBe(true);expect(loaded.retained[0].json).not.toContain('npcState');expect(loaded.retained[0].json).not.toContain('PRIVATE_NPC');}
    await store.close();
  });
  it('commits an explicit migration while preserving exact source bytes and old transcript',async()=>{
    const {legacyState,seed,context}=migration(),factory=new IDBFactory(),old=new GameStore(factory,'migration-success'),store=new EvidenceStore(factory,'migration-success',context);
    await old.save(legacy,legacyState,0);const before=await readSlot(factory,'migration-success',slotKey(legacy));
    expect(await store.migrate(content,seed,0)).toEqual({ok:true,commit:1});
    expect(await readSlot(factory,'migration-success',slotKey(legacy))).toEqual(before);
    const loaded=await store.load(content);expect(loaded.kind==='loaded'&&loaded.state.transcript).toEqual(legacyState.transcript);expect(loaded.kind==='loaded'&&loaded.state.deductions).toEqual([]);
    expect((await store.getRunMetadata(content))?.origin).toBe('migration');await old.close();await store.close();
  });
  it.each(['receipt','transcript','missing-context','commit-quota'])('preserves original bytes on %s migration failure',async fault=>{
    const {legacyState,seed,context}=migration(),factory=new IDBFactory(),name=`migration-failure-${fault}`,old=new GameStore(factory,name),store=new EvidenceStore(factory,name,fault==='missing-context'?undefined:context);
    await old.save(legacy,legacyState,0);const before=await readSlot(factory,name,slotKey(legacy));
    if(fault==='receipt')seed.manifestHash='0'.repeat(64);
    if(fault==='transcript'){seed.legacyState=structuredClone(seed.legacyState);const first=seed.legacyState.transcript[0];if(first.kind==='passage')first.paragraphs[0]='Forged';seed.legacyStateHash=stateHash(seed.legacyState);}
    const injection=fault==='commit-quota'?vi.spyOn(IDBObjectStore.prototype,'put').mockImplementation(()=>{throw new DOMException('full','QuotaExceededError');}):undefined;
    try{expect((await store.migrate(content,seed,0)).ok).toBe(false);}finally{injection?.mockRestore();}
    expect(await readSlot(factory,name,slotKey(legacy))).toEqual(before);expect(await readSlot(factory,name,slotKey(content))).toBeUndefined();await old.close();await store.close();
  });
  it('rejects stale writers and forged v2 hidden state before replacing a checkpoint',async()=>{
    const factory=new IDBFactory(),a=new EvidenceStore(factory,'v2-conflict'),b=new EvidenceStore(factory,'v2-conflict');const initial=createGameV2(content);await a.save(content,initial,0);
    const altered=structuredClone(initial);altered.npcState[0].knows.push('film');expect(await b.save(content,altered,1)).toMatchObject({ok:false,code:'invalid'});
    await a.save(content,choose(initial,'test-rinse'),1);expect(await b.save(content,initial,1)).toMatchObject({ok:false,code:'conflict'});await a.close();await b.close();
  });
});
