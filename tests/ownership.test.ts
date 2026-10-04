import { describe,it,expect,vi } from 'vitest';
import { IDBFactory,IDBObjectStore } from 'fake-indexeddb';
import { fixtureContent as content } from '../src/content/fixture';
import { createGame } from '../src/engine/game';
import { GameStore } from '../src/persistence/store';
import { slotKey } from '../src/persistence/checkpoint-store';
import { move } from './helpers';

describe('atomic tab ownership without broadcasts or clocks',()=>{
  it('makes the second tab read-only, permits explicit takeover, and rejects the old owner even with a current commit',async()=>{
    const factory=new IDBFactory(),first=new GameStore(factory,'owners'),second=new GameStore(factory,'owners'),initial=createGame(content);
    await first.save(content,initial,0);const a=await first.claimOwnership(content,1,'tab-a');expect(a.ok).toBe(true);if(!a.ok)throw Error(a.message);
    expect(await second.claimOwnership(content,a.commit,'tab-b')).toMatchObject({ok:false,code:'conflict'});
    expect(await second.save(content,move(initial,'cup'),a.commit)).toMatchObject({ok:false,code:'conflict'});
    const b=await second.claimOwnership(content,a.commit,'tab-b',true);if(!b.ok)throw Error(b.message);expect(b.ownership.epoch).toBe(a.ownership.epoch+1);
    const before=await second.load(content);expect(before.kind==='loaded'&&before.state).toEqual(initial);
    expect(await first.save(content,move(initial,'cup'),b.commit,{ownership:a.ownership})).toMatchObject({ok:false,code:'conflict'});
    expect(await second.save(content,move(initial,'cup'),b.commit,{ownership:b.ownership})).toEqual({ok:true,commit:b.commit+1});
    expect(await first.getOwnership(content)).toEqual(b.ownership);await first.close();await second.close();
  });
  it('has exactly one winner when two tabs claim the same unowned commit',async()=>{
    const factory=new IDBFactory(),a=new GameStore(factory,'race'),b=new GameStore(factory,'race');await a.save(content,createGame(content),0);
    const results=await Promise.all([a.claimOwnership(content,1,'a'),b.claimOwnership(content,1,'b')]);expect(results.filter(result=>result.ok)).toHaveLength(1);expect(results.filter(result=>!result.ok)).toHaveLength(1);await a.close();await b.close();
  });
  it('keeps the old owner and exact fiction if takeover cannot commit',async()=>{
    const factory=new IDBFactory(),store=new GameStore(factory,'quota-owner'),initial=createGame(content);await store.save(content,initial,0);const owner=await store.claimOwnership(content,1,'a');if(!owner.ok)throw Error(owner.message);
    const fault=vi.spyOn(IDBObjectStore.prototype,'put').mockImplementation(()=>{throw new DOMException('full','QuotaExceededError');});
    try{expect(await store.claimOwnership(content,owner.commit,'b',true)).toMatchObject({ok:false,code:'quota'});}finally{fault.mockRestore();}
    expect(await store.getOwnership(content)).toEqual(owner.ownership);const loaded=await store.load(content);expect(loaded.kind==='loaded'&&loaded.state).toEqual(initial);expect(loaded.kind==='loaded'&&loaded.commit).toBe(owner.commit);await store.close();
  });
  it('retains ownership through replacement saves and rejects forged receipts',async()=>{
    const factory=new IDBFactory(),store=new GameStore(factory,'replacement-owner'),initial=createGame(content);await store.save(content,initial,0);const owner=await store.claimOwnership(content,1,'a');if(!owner.ok)throw Error(owner.message);
    expect(await store.save(content,initial,owner.commit,{archiveCurrent:true,origin:'restart',ownership:owner.ownership})).toEqual({ok:true,commit:owner.commit+1});expect(await store.getOwnership(content)).toEqual(owner.ownership);
    expect(await store.save(content,initial,owner.commit+1,{ownership:{...owner.ownership,epoch:owner.ownership.epoch+1}})).toMatchObject({ok:false,code:'conflict'});await store.close();
  });
});

type Image = Record<string,{key:IDBValidKey;value:unknown}[]>;
async function databaseImage(factory:IDBFactory,name:string):Promise<Image>{
  const db=await new Promise<IDBDatabase>((resolve,reject)=>{const request=factory.open(name);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
  return new Promise((resolve,reject)=>{
    const names=['slots','recovery','archives'],tx=db.transaction(names),image:Image={};
    for(const name of names){const object=tx.objectStore(name),keys=object.getAllKeys(),values=object.getAll();values.onsuccess=()=>{image[name]=values.result.map((value,index)=>({key:keys.result[index],value}));};}
    tx.oncomplete=()=>{db.close();resolve(image);};tx.onerror=()=>{db.close();reject(tx.error);};
  });
}
async function writeRecord(factory:IDBFactory,name:string,object:string,key:IDBValidKey,value:unknown){
  const db=await new Promise<IDBDatabase>((resolve,reject)=>{const request=factory.open(name);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
  await new Promise<void>((resolve,reject)=>{const tx=db.transaction(object,'readwrite');tx.objectStore(object).put(value,key);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});db.close();
}
let repairDatabase=0;
async function damagedOwnedSlot(){
  const factory=new IDBFactory(),name=`repair-${++repairDatabase}`,store=new GameStore(factory,name),initial=createGame(content);
  await store.save(content,initial,0);const owner=await store.claimOwnership(content,1,'previous-owner');if(!owner.ok)throw Error(owner.message);
  const candidate=move(initial,'cup');await store.save(content,candidate,owner.commit,{ownership:owner.ownership});
  await store.save(content,initial,owner.commit+1,{archiveCurrent:true,origin:'restart',ownership:owner.ownership});
  const image=await databaseImage(factory,name),verified=image.slots[0].value as Record<string,unknown>,damaged=structuredClone(verified);
  const broken={stateChecksum:'corrupted',retainedBytes:['exact damaged text',17,{nested:true}]};
  damaged.current=broken;damaged.backups=[broken,structuredClone(broken)];damaged.preEnding=structuredClone(broken);damaged.extraRawField={preserve:'unverified predecessor'};
  await writeRecord(factory,name,'slots',slotKey(content),damaged);
  await writeRecord(factory,name,'recovery','existing-recovery',{untouched:['earlier damage']});
  await writeRecord(factory,name,'recovery',`${slotKey(content)}:${Number(damaged.commit)+1}:repair`,{untouched:'an existing repair record must not be overwritten'});
  return{factory,name,store,initial,candidate,owner,verified,damaged,commit:Number(damaged.commit)};
}

describe('confirmed repair and takeover of a fully corrupt owned slot',()=>{
  it('repairs the reproduced corrupt-owner dead end, preserves exact damage and archives, and invalidates old receipts',async()=>{
    const {factory,name,store,candidate,owner,damaged}=await damagedOwnedSlot();
    const loaded=await store.load(content);expect(loaded.kind).toBe('corrupt');if(loaded.kind!=='corrupt')throw Error('Expected corruption');
    expect(await store.claimOwnership(content,loaded.commit,'new-document',true)).toMatchObject({ok:false,code:'corrupt'});
    expect(await store.save(content,candidate,loaded.commit)).toMatchObject({ok:false,code:'conflict'});
    const before=await databaseImage(factory,name),raw=before.slots[0].value;
    const repaired=await store.repairAndTakeOwnership(content,candidate,loaded.commit,'fresh-repair-owner');if(!repaired.ok)throw Error(repaired.message);
    expect(repaired.commit).toBe(loaded.commit+1);expect(repaired.ownership.epoch).toBeGreaterThan(owner.ownership.epoch);
    const after=await databaseImage(factory,name);expect(after.archives).toEqual(before.archives);
    expect(after.recovery).toEqual(expect.arrayContaining(before.recovery));
    expect(after.recovery.some(item=>(item.value as {previous?:unknown}).previous&&JSON.stringify((item.value as {previous:unknown}).previous)===JSON.stringify(damaged))).toBe(true);
    expect(after.recovery.some(item=>(item.value as {reason?:string;previous?:unknown}).reason==='confirmed-repair'&&JSON.stringify((item.value as {previous:unknown}).previous)===JSON.stringify(raw))).toBe(true);
    const saved=await store.load(content);expect(saved).toEqual({kind:'loaded',commit:repaired.commit,state:candidate});
    expect(await store.getRunMetadata(content)).toMatchObject({origin:'new',parent:null});
    expect(await store.save(content,move(candidate,'inspect-drain'),repaired.commit,{ownership:owner.ownership})).toMatchObject({ok:false,code:'conflict'});
    expect(await store.save(content,move(candidate,'inspect-drain'),repaired.commit,{ownership:repaired.ownership})).toEqual({ok:true,commit:repaired.commit+1});await store.close();
  });
  it.each([
    {ownerId:'previous-owner',epoch:81,unexpected:'malformed extra field'},
    {ownerId:'invalid owner id',epoch:99},
    {ownerId:'previous-owner',epoch:'not a revision'},
  ])('repairs malformed ownership explicitly with a fresh identity and recoverable epoch progression (%j)',async ownership=>{
    const {factory,name,store,candidate,damaged,commit,owner}=await damagedOwnedSlot();damaged.ownership=ownership;
    await writeRecord(factory,name,'slots',slotKey(content),damaged);
    expect(await store.save(content,candidate,commit,{ownership:owner.ownership})).toMatchObject({ok:false,code:'corrupt'});
    const repaired=await store.repairAndTakeOwnership(content,candidate,commit,'fresh-owner');if(!repaired.ok)throw Error(repaired.message);
    expect(repaired.ownership).toEqual({ownerId:'fresh-owner',epoch:Math.max(commit,typeof ownership.epoch==='number'?ownership.epoch:0)+1});
    expect(await store.save(content,candidate,repaired.commit,{ownership:owner.ownership})).toMatchObject({ok:false,code:'conflict'});await store.close();
  });
  it.each(['current','fourth backup','preEnding'])('refuses repair when a verified %s exists, even at the previewed commit',async location=>{
    const {factory,name,store,candidate,damaged,verified,commit}=await damagedOwnedSlot();
    if(location==='current')damaged.current=verified.current;
    else if(location==='preEnding')damaged.preEnding=verified.current;
    else damaged.backups=[{}, {}, {}, verified.current];
    await writeRecord(factory,name,'slots',slotKey(content),damaged);const before=await databaseImage(factory,name);
    expect(await store.repairAndTakeOwnership(content,candidate,commit,'fresh-owner')).toMatchObject({ok:false,code:'conflict',message:expect.stringContaining('Verified')});
    expect(await databaseImage(factory,name)).toEqual(before);await store.close();
  });
  it('recovers a valid checkpoint beyond the ordinary three retained backups rather than destroying it during load',async()=>{
    const {factory,name,store,damaged,verified}=await damagedOwnedSlot();damaged.backups=[{}, {}, {}, verified.current];
    await writeRecord(factory,name,'slots',slotKey(content),damaged);
    expect(await store.load(content)).toMatchObject({kind:'recovered',state:createGame(content)});await store.close();
  });
  it('refuses stale repair previews and permits only one winner in a concurrent repair race',async()=>{
    const {factory,name,store,candidate,commit}=await damagedOwnedSlot(),second=new GameStore(factory,name);
    expect(await store.repairAndTakeOwnership(content,candidate,commit-1,'stale-preview')).toMatchObject({ok:false,code:'conflict'});
    const results=await Promise.all([store.repairAndTakeOwnership(content,candidate,commit,'repair-a'),second.repairAndTakeOwnership(content,candidate,commit,'repair-b')]);
    expect(results.filter(result=>result.ok)).toHaveLength(1);expect(results.filter(result=>!result.ok)).toEqual([expect.objectContaining({code:'conflict'})]);
    const winner=results.find(result=>result.ok);if(!winner?.ok)throw Error('No winner');expect(await store.getOwnership(content)).toEqual(winner.ownership);
    await store.close();await second.close();
  });
  it.each(['recovery','archives','slots'])('atomically aborts a quota failure in %s without changing any bytes or ownership',async object=>{
    const {factory,name,store,candidate,commit}=await damagedOwnedSlot(),before=await databaseImage(factory,name);
    const ended=move(move(move(move(candidate,'inspect-drain'),'return-sink'),'propose-rinse'),'finish-fixture');
    const method=object==='slots'?'put':'add',original=IDBObjectStore.prototype[method];
    const fault=vi.spyOn(IDBObjectStore.prototype,method).mockImplementation(function(this:IDBObjectStore,...args:Parameters<IDBObjectStore['put']>){if(this.name===object)throw new DOMException('Injected full storage','QuotaExceededError');return original.apply(this,args);});
    try{expect(await store.repairAndTakeOwnership(content,ended,commit,'fresh-owner')).toMatchObject({ok:false,code:'quota'});}finally{fault.mockRestore();}
    expect(await databaseImage(factory,name)).toEqual(before);await store.close();
  });
  it('retains a repaired completed run as an archive while preserving every pre-existing archive',async()=>{
    const {factory,name,store,candidate,commit}=await damagedOwnedSlot(),before=await databaseImage(factory,name);
    const ended=move(move(move(move(candidate,'inspect-drain'),'return-sink'),'propose-rinse'),'finish-fixture');
    const repaired=await store.repairAndTakeOwnership(content,ended,commit,'fresh-owner');expect(repaired.ok).toBe(true);
    const after=await databaseImage(factory,name);expect(after.archives).toHaveLength(before.archives.length+1);expect(after.archives).toEqual(expect.arrayContaining(before.archives));
    const ending=(await store.listArchives(content)).find(item=>item.ended)!;expect(await store.loadArchive(content,ending.id)).toEqual(ended);
    expect(await store.loadProtectedCheckpoint(content)).toBeUndefined();await store.close();
  });
  it('rejects invalid memory, invalid preview commits, and reuse of the damaged owner identity without mutation',async()=>{
    const {factory,name,store,candidate,commit}=await damagedOwnedSlot(),before=await databaseImage(factory,name);
    expect(await store.repairAndTakeOwnership(content,{...candidate,revision:99},commit,'fresh-owner')).toMatchObject({ok:false,code:'invalid'});
    expect(await store.repairAndTakeOwnership(content,candidate,0,'fresh-owner')).toMatchObject({ok:false,code:'invalid'});
    expect(await store.repairAndTakeOwnership(content,candidate,commit,'previous-owner')).toMatchObject({ok:false,code:'invalid'});
    expect(await databaseImage(factory,name)).toEqual(before);await store.close();
  });
});
