import { contentHash, stateHash, canonicalJSON } from '../engine/hash';
import { isObject } from '../engine/validate';
import type { Validation } from '../engine/types';
import { runMetadata, type RunMetadata } from './run-metadata';
import { validOwnerId, validOwnership, type OwnershipReceipt } from './ownership';

export interface ContentIdentity { id: string; version: number }
export interface PersistableState { contentId: string; contentVersion: number; contentHash: string; revision: number; ended: boolean; transcript: unknown[] }
export interface StoreRuntime<C extends ContentIdentity, S extends PersistableState> {
  schemaVersion: number;
  engineVersion: number;
  validateState(content: C, input: unknown): Validation<S>;
  exportPortable(state: S): string;
  /** Fallback for historical slots written before portable snapshots existed. */
  retainedExport?(envelope: unknown): string | undefined;
}
export type OwnershipResult = {ok:true;commit:number;ownership:OwnershipReceipt} | Extract<SaveResult,{ok:false}>;
interface CheckpointEnvelope<S> { saveVersion: number; schemaVersion: number; engineVersion: number; contentHash: string; stateChecksum: string; state: S }
interface Slot { commit: number; current: unknown; backups: unknown[]; preEnding: unknown; run?: unknown; checkpointRuns?: unknown; portable?: string; ownership?: unknown }
export interface BranchSource { kind: 'archive' | 'protected'; id?: string }
export interface SaveOptions { archiveCurrent?: boolean; origin?: 'restart' | 'import' | 'migration'; branchFrom?: BranchSource; ownership?: OwnershipReceipt }
function validSaveOptions(value: unknown): value is SaveOptions {
  if (!isObject(value) || Object.keys(value).some(key => !['archiveCurrent', 'origin', 'branchFrom', 'ownership'].includes(key))) return false;
  if (value.archiveCurrent !== undefined && typeof value.archiveCurrent !== 'boolean') return false;
  if (value.origin !== undefined && (typeof value.origin !== 'string' || !['restart', 'import', 'migration'].includes(value.origin))) return false;
  if (value.ownership !== undefined && !validOwnership(value.ownership)) return false;
  if (value.branchFrom === undefined) return true;
  const branch = value.branchFrom;
  if (!isObject(branch) || Object.keys(branch).some(key => !['kind', 'id'].includes(key))) return false;
  if (branch.kind === 'archive') return typeof branch.id === 'string' && branch.id.length > 0 && branch.id.length <= 1000;
  return branch.kind === 'protected' && branch.id === undefined;
}
export type LoadResult<S extends PersistableState = PersistableState> =
  | { kind: 'empty'; commit: number }
  | { kind: 'loaded' | 'recovered'; commit: number; state: S }
  | { kind: 'corrupt'; commit: number; message: string }
  | { kind: 'incompatible'; commit: 0; message: string; retained: { id: string; contentVersion: unknown; contentHash: unknown; json: string }[] }
  | { kind: 'error'; code: 'unavailable' | 'quota' | 'storage'; message: string };
export type SaveResult = { ok: true; commit: number } | { ok: false; code: 'conflict' | 'invalid' | 'quota' | 'unavailable' | 'storage' | 'corrupt'; message: string };
function failure(error: unknown): { code: 'quota' | 'unavailable' | 'storage'; message: string } {
  const name = isObject(error) && typeof error.name === 'string' ? error.name : error instanceof Error ? error.name : '';
  if (name === 'QuotaExceededError') return { code: 'quota', message: 'Browser storage is full. Your active run is still in memory; export it before closing this page.' };
  if (name === 'SecurityError' || name === 'InvalidStateError' || name === 'NotSupportedError') return { code: 'unavailable', message: 'Browser storage is unavailable. Your active run remains in memory; you can export it.' };
  return { code: 'storage', message: 'The browser could not save or load this run. Your active run remains in memory.' };
}
export const slotKey = (content: ContentIdentity) => `${content.id}@${content.version}:${contentHash(content)}`;
function validCommit(value: unknown): value is Slot { return isObject(value) && Number.isSafeInteger(value.commit) && Number(value.commit) >= 1; }
function checkpointRun(slot: Slot, state: PersistableState, key: string): RunMetadata {
  const checksum=stateHash(state);
  const match=Array.isArray(slot.checkpointRuns) ? slot.checkpointRuns.find(item=>isObject(item)&&item.stateChecksum===checksum) : undefined;
  return runMetadata(isObject(match)?match.run:slot.current&&isObject(slot.current)&&slot.current.stateChecksum===checksum?slot.run:undefined,`${key}:${checksum}`);
}

/** One read/write transaction provides a compare-and-swap across browser tabs. */
export class CheckpointStore<C extends ContentIdentity, S extends PersistableState> {
  private dbPromise: Promise<IDBDatabase> | undefined;
  constructor(private readonly runtime: StoreRuntime<C,S>, private readonly factory: IDBFactory | undefined = globalThis.indexedDB, private readonly name = 'literary-detective-v1') {}
  private envelope(state: S): CheckpointEnvelope<S> { return {saveVersion:this.runtime.schemaVersion,schemaVersion:this.runtime.schemaVersion,engineVersion:this.runtime.engineVersion,contentHash:state.contentHash,stateChecksum:stateHash(state),state}; }
  private validateEnvelope(content: C, value: unknown): Validation<S> {
    try {
      if (!isObject(value) || value.saveVersion !== this.runtime.schemaVersion || value.schemaVersion !== this.runtime.schemaVersion || value.engineVersion !== this.runtime.engineVersion || value.contentHash !== contentHash(content) || Object.keys(value).length !== 6 || value.stateChecksum !== stateHash(value.state)) return {ok:false,errors:['Save envelope version, exact bundle hash or checksum is invalid.']};
      return this.runtime.validateState(content,value.state);
    } catch {return {ok:false,errors:['Save envelope could not be validated.']};}
  }
  private open(): Promise<IDBDatabase> {
    if (!this.factory) return Promise.reject(new DOMException('IndexedDB unavailable', 'NotSupportedError'));
    if (!this.dbPromise) {
      this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
        const request = this.factory!.open(this.name, 2);
        request.onupgradeneeded = () => { for (const name of ['slots','recovery','archives']) if (!request.result.objectStoreNames.contains(name)) request.result.createObjectStore(name); };
        request.onsuccess = () => { const db = request.result; db.onversionchange = () => { db.close(); this.dbPromise = undefined; }; resolve(db); };
        request.onerror = () => reject(request.error);
        request.onblocked = () => reject(new DOMException('Database upgrade blocked by another tab', 'InvalidStateError'));
      }).catch(error => { this.dbPromise = undefined; throw error; });
    }
    return this.dbPromise!;
  }
  async load(content: C): Promise<LoadResult<S>> {
    try {
      const db = await this.open();
      return await new Promise<LoadResult<S>>((resolve, reject) => {
        const tx = db.transaction(['slots', 'recovery'], 'readwrite');
        const slots = tx.objectStore('slots');
        const request = slots.get(slotKey(content));
        let result: LoadResult<S>;
        tx.oncomplete = () => resolve(result);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error ?? new Error('Load transaction aborted'));
        request.onsuccess = () => {
          try {
            const raw: unknown = request.result;
            if (raw === undefined) {
              const existing = slots.getAll();
              existing.onsuccess = () => {
                try {
                const retained = (existing.result as unknown[]).flatMap(item => {
                  if (!validCommit(item) || !isObject(item.current) || !isObject(item.current.state) || item.current.state.contentId !== content.id) return [];
                  const oldState = item.current.state;
                  const json = typeof item.portable === 'string' ? item.portable : this.runtime.retainedExport?.(item.current);
                  return json ? [{ id: String(oldState.contentId), contentVersion: oldState.contentVersion, contentHash: oldState.contentHash, json }] : [];
                });
                result = retained.length ? {kind:'incompatible',commit:0,message:'Saved progress exists for a different content hash or version. It has been preserved and cannot be loaded into this text revision. Export it for a compatible installation.',retained} : {kind:'empty',commit:0};
                } catch (error) {tx.abort();reject(error);}
              };
              return;
            }
            const current = validCommit(raw) ? this.validateEnvelope(content, raw.current) : { ok: false as const, errors: ['Invalid slot metadata'] };
            if (validCommit(raw) && current.ok) { result = { kind: 'loaded', commit: raw.commit, state: current.value }; return; }
            const candidates = validCommit(raw) ? [...(Array.isArray(raw.backups) ? raw.backups : []), raw.preEnding] : [];
            const validBackups = candidates.map(candidate => this.validateEnvelope(content, candidate)).filter(candidate => candidate.ok);
            const backup = validBackups[0];
            const commit = validCommit(raw) && raw.commit < Number.MAX_SAFE_INTEGER ? raw.commit + 1 : 1;
            // Keep the corrupt bytes for local recovery. A quota failure aborts all repairs.
            tx.objectStore('recovery').put({ slot: slotKey(content), previous: raw }, `${slotKey(content)}:${commit}`);
            if (backup?.ok) {
              slots.put({ commit, portable:this.runtime.exportPortable(backup.value), ownership:validCommit(raw)?raw.ownership:undefined, current: this.envelope(backup.value), backups: validBackups.slice(0,3).map(candidate => this.envelope(candidate.value)), preEnding: validCommit(raw) && this.validateEnvelope(content, raw.preEnding).ok ? raw.preEnding : null, run: validCommit(raw)?checkpointRun(raw,backup.value,slotKey(content)):undefined, checkpointRuns:validCommit(raw)?raw.checkpointRuns:[] }, slotKey(content));
              result = { kind: 'recovered', commit, state: backup.value };
            } else {
              slots.put({ commit, current: null, backups: [], preEnding: null, ownership:validCommit(raw)?raw.ownership:undefined }, slotKey(content));
              result = { kind: 'corrupt', commit, message: 'The saved run and backup failed validation. The damaged data has been retained locally; a new run is active in memory.' };
            }
          } catch (error) { tx.abort(); reject(error); }
        };
      });
    } catch (error) { return { kind: 'error', ...failure(error) }; }
  }
  async save(content: C, state: S, expectedCommit: number, options: SaveOptions = {}): Promise<SaveResult> {
    if (!validSaveOptions(options)) return { ok: false, code: 'invalid', message: 'Replacement or branch options are malformed.' };
    const checked = this.runtime.validateState(content, state);
    if (!checked.ok) return { ok: false, code: 'invalid', message: checked.errors.join(' ') };
    if (!Number.isSafeInteger(expectedCommit) || expectedCommit < 0) return { ok: false, code: 'invalid', message: 'Invalid save revision.' };
    try {
      const db = await this.open();
      return await new Promise<SaveResult>((resolve, reject) => {
        const tx = db.transaction(['slots','archives'], 'readwrite');
        const slots = tx.objectStore('slots');
        const request = slots.get(slotKey(content));
        let result: SaveResult;
        tx.oncomplete = () => resolve(result);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error ?? new Error('Save transaction aborted'));
        request.onsuccess = () => {
          try {
            const raw: unknown = request.result;
            if (raw !== undefined && !validCommit(raw)) { result = { ok: false, code: 'corrupt', message: 'Saved metadata is corrupt. Reload saved progress to recover it; your active run is still in memory.' }; return; }
            const actual = validCommit(raw) ? raw.commit : 0;
            if (actual !== expectedCommit) { result = { ok: false, code: 'conflict', message: 'Another tab saved newer progress. Your current run remains in memory. Export it, or load the saved run before continuing.' }; return; }
            if (actual === Number.MAX_SAFE_INTEGER) { result = { ok: false, code: 'storage', message: 'The saved revision limit has been reached.' }; return; }
            if (validCommit(raw) && raw.ownership !== undefined && !validOwnership(raw.ownership)) {result={ok:false,code:'corrupt',message:'The saving ownership record is damaged. Your current run remains exportable.'};return;}
            const owner=validCommit(raw)&&validOwnership(raw.ownership)?raw.ownership:undefined;
            if ((owner && (!options.ownership || owner.ownerId!==options.ownership.ownerId || owner.epoch!==options.ownership.epoch)) || (!owner && options.ownership)) {result={ok:false,code:'conflict',message:'Another tab or session controls saving. This run remains in memory. Export it or explicitly take over saving.'};return;}
            const previous = validCommit(raw) ? this.validateEnvelope(content, raw.current) : undefined;
            const previousRun=validCommit(raw)&&previous?.ok?checkpointRun(raw,previous.value,slotKey(content)):undefined;
            const finish=(parentState?:S,parentRun?:RunMetadata)=>{
            if(options.branchFrom && (!parentState||!parentRun||canonicalJSON(checked.value.transcript.slice(0,parentState.transcript.length))!==canonicalJSON(parentState.transcript))){result={ok:false,code:'invalid',message:'The requested branch is unavailable or does not share the selected checkpoint history.'};return;}
            const replacing=options.archiveCurrent===true||options.branchFrom!==undefined;
            const run:RunMetadata=replacing||!previousRun?{runId:`run-${crypto.randomUUID()}`,origin:options.branchFrom?'branch':(options.origin??(previousRun?'restart':'new')),parent:parentState&&parentRun?{runId:parentRun.runId,revision:parentState.revision,stateChecksum:stateHash(parentState)}:null,...(previousRun?{replacesRunId:previousRun.runId}:{})}:previousRun;
            // Reuse only results validated inside this transaction. Every retained
            // persisted checkpoint still passes its checksum and full replay.
            const backupStates:S[]=previous?.ok?[previous.value]:[];
            if(validCommit(raw)&&Array.isArray(raw.backups))for(const candidate of raw.backups.slice(0,3)){
              if(backupStates.length===3)break;
              const valid=this.validateEnvelope(content,candidate);
              if(valid.ok)backupStates.push(valid.value);
            }
            if(!backupStates.length)backupStates.push(checked.value);
            const backups=backupStates.map(value=>this.envelope(value));
            let preEnding:unknown=null,protectedState:S|undefined;
            if(checked.value.ended&&previous?.ok&&!previous.value.ended){
              protectedState=previous.value;preEnding=this.envelope(previous.value);
            }else if(validCommit(raw)){
              const valid=this.validateEnvelope(content,raw.preEnding);
              if(valid.ok){protectedState=valid.value;preEnding=raw.preEnding;}
            }
            if (replacing && previous?.ok) tx.objectStore('archives').put({slot:slotKey(content),commit:actual,envelope:this.envelope(previous.value),run:previousRun},`${slotKey(content)}:${actual}`);
            if (checked.value.ended) tx.objectStore('archives').put({slot:slotKey(content),commit:actual+1,envelope:this.envelope(checked.value),run},`${slotKey(content)}:${actual+1}`);
            const checkpoints=[...backupStates,...(protectedState?[protectedState]:[])].map(value=>({stateChecksum:stateHash(value),run:validCommit(raw)?checkpointRun(raw,value,slotKey(content)):run}));
            const checkpointRuns=[{stateChecksum:stateHash(checked.value),run},...checkpoints];
            slots.put({ commit: actual + 1, portable:this.runtime.exportPortable(checked.value), ownership:owner, current: this.envelope(checked.value), backups, preEnding,run,checkpointRuns }, slotKey(content));
            result = { ok: true, commit: actual + 1 };
            };
            if(options.branchFrom?.kind==='archive'){
              if(typeof options.branchFrom.id!=='string'){result={ok:false,code:'invalid',message:'Select an archived checkpoint.'};return;}
              const source=tx.objectStore('archives').get(options.branchFrom.id);
              source.onsuccess=()=>{try{const archived:unknown=source.result;if(!isObject(archived)||archived.slot!==slotKey(content)){finish();return;}const valid=this.validateEnvelope(content,archived.envelope);if(!valid.ok){finish();return;}finish(valid.value,runMetadata(archived.run,String(options.branchFrom?.id)));}catch(error){tx.abort();reject(error);}};
            }else if(options.branchFrom?.kind==='protected'){
              const valid=validCommit(raw)?this.validateEnvelope(content,raw.preEnding):undefined;
              finish(valid?.ok?valid.value:undefined,valid?.ok&&validCommit(raw)?checkpointRun(raw,valid.value,slotKey(content)):undefined);
            }else finish();
          } catch (error) { tx.abort(); reject(error); }
        };
      });
    } catch (error) { return { ok: false, ...failure(error) }; }
  }
  async listArchives(content: C): Promise<{id:string;revision:number;ended:boolean}[]> {
    const db = await this.open();
    return new Promise((resolve,reject) => {
      const tx=db.transaction('archives'), object=tx.objectStore('archives'), values=object.getAll(), keys=object.getAllKeys();
      tx.oncomplete=()=>resolve(values.result.flatMap((raw:unknown,index)=>{if(!isObject(raw)||raw.slot!==slotKey(content))return[];const checked=this.validateEnvelope(content,raw.envelope);return checked.ok?[{id:String(keys.result[index]),revision:checked.value.revision,ended:checked.value.ended}]:[];}).reverse());
      tx.onerror=()=>reject(tx.error);
    });
  }
  async loadArchive(content: C,id: string): Promise<S | undefined> {
    const db=await this.open();
    const raw:unknown=await new Promise((resolve,reject)=>{const request=db.transaction('archives').objectStore('archives').get(id);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
    if(!isObject(raw)||raw.slot!==slotKey(content))return;
    const checked=this.validateEnvelope(content,raw.envelope);return checked.ok?checked.value:undefined;
  }
  async getRunMetadata(content:C,archiveId?:string):Promise<RunMetadata|undefined>{
    const db=await this.open();const raw:unknown=await new Promise((resolve,reject)=>{const request=db.transaction(archiveId?'archives':'slots').objectStore(archiveId?'archives':'slots').get(archiveId??slotKey(content));request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
    if(!isObject(raw))return;const checked=this.validateEnvelope(content,archiveId?raw.envelope:raw.current);if(!checked.ok||(archiveId&&raw.slot!==slotKey(content)))return;
    return archiveId?runMetadata(raw.run,archiveId):checkpointRun(raw as unknown as Slot,checked.value,slotKey(content));
  }
  async loadProtectedCheckpoint(content:C):Promise<S|undefined>{
    const db=await this.open();const raw:unknown=await new Promise((resolve,reject)=>{const request=db.transaction('slots').objectStore('slots').get(slotKey(content));request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
    if(!validCommit(raw))return;const checked=this.validateEnvelope(content,raw.preEnding);return checked.ok?checked.value:undefined;
  }
  async getOwnership(content:C):Promise<OwnershipReceipt|undefined>{
    const db=await this.open();
    const raw:unknown=await new Promise((resolve,reject)=>{const request=db.transaction('slots').objectStore('slots').get(slotKey(content));request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
    if(!validCommit(raw))return;
    if(raw.ownership!==undefined&&!validOwnership(raw.ownership))throw new Error('The saving ownership record is damaged.');
    return validOwnership(raw.ownership)?{...raw.ownership}:undefined;
  }
  /** The transaction receipt, not a broadcast or timer, decides who may save. */
  async claimOwnership(content:C,expectedCommit:number,ownerId:string,takeOver=false):Promise<OwnershipResult>{
    if(!validOwnerId(ownerId)||!Number.isSafeInteger(expectedCommit)||expectedCommit<1||typeof takeOver!=='boolean')return{ok:false,code:'invalid',message:'A saved checkpoint and valid tab identity are required before claiming saving.'};
    try{
      const db=await this.open();
      return await new Promise<OwnershipResult>((resolve,reject)=>{
        const tx=db.transaction('slots','readwrite'),slots=tx.objectStore('slots'),request=slots.get(slotKey(content));let result:OwnershipResult;
        tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error??new Error('Ownership transaction aborted'));
        request.onsuccess=()=>{try{
          const raw:unknown=request.result;
          if(!validCommit(raw)||!this.validateEnvelope(content,raw.current).ok||(raw.ownership!==undefined&&!validOwnership(raw.ownership))){result={ok:false,code:'corrupt',message:'Load a verified saved checkpoint before claiming saving.'};return;}
          if(raw.commit!==expectedCommit){result={ok:false,code:'conflict',message:'Saved progress changed before the ownership request. Reload it before trying again.'};return;}
          const owner=validOwnership(raw.ownership)?raw.ownership:undefined;
          if(owner?.ownerId===ownerId){result={ok:true,commit:raw.commit,ownership:{...owner}};return;}
          if(owner&&!takeOver){result={ok:false,code:'conflict',message:'Another tab or prior session controls saving. This tab is read-only until you explicitly take over.'};return;}
          if(raw.commit===Number.MAX_SAFE_INTEGER||owner?.epoch===Number.MAX_SAFE_INTEGER){result={ok:false,code:'storage',message:'The saving ownership revision limit has been reached.'};return;}
          const ownership={ownerId,epoch:(owner?.epoch??0)+1},commit=raw.commit+1;
          slots.put({...raw,commit,ownership},slotKey(content));result={ok:true,commit,ownership};
        }catch(error){tx.abort();reject(error);}};
      });
    }catch(error){return{ok:false,...failure(error)};}
  }
  /** Explicitly confirmed recovery only when no stored checkpoint is verified. */
  async repairAndTakeOwnership(content:C,state:S,expectedCommit:number,ownerId:string):Promise<OwnershipResult>{
    if(!validOwnerId(ownerId)||!Number.isSafeInteger(expectedCommit)||expectedCommit<1)return{ok:false,code:'invalid',message:'A valid repair preview, observed storage commit and fresh tab identity are required.'};
    let checked:Validation<S>,portable:string;
    try{checked=this.runtime.validateState(content,state);if(!checked.ok)return{ok:false,code:'invalid',message:checked.errors.join(' ')};portable=this.runtime.exportPortable(checked.value);}
    catch{return{ok:false,code:'invalid',message:'The in-memory run failed validation before repair. No stored data was changed.'};}
    const candidate=checked.value;
    try{
      const db=await this.open();
      return await new Promise<OwnershipResult>((resolve,reject)=>{
        const tx=db.transaction(['slots','recovery','archives'],'readwrite'),slots=tx.objectStore('slots'),key=slotKey(content),request=slots.get(key);let result:OwnershipResult;
        tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error??new Error('Repair transaction aborted'));
        request.onsuccess=()=>{try{
          const raw:unknown=request.result;
          if(!validCommit(raw)||raw.commit!==expectedCommit){result={ok:false,code:'conflict',message:'Saved progress changed after the repair preview. Load it and preview the repair again.'};return;}
          const candidates=[raw.current,...(Array.isArray(raw.backups)?raw.backups:[]),raw.preEnding];
          if(candidates.some(checkpoint=>this.validateEnvelope(content,checkpoint).ok)){result={ok:false,code:'conflict',message:'Verified saved progress now exists. Load it and use the ordinary saving takeover instead of repairing.'};return;}
          const damagedOwner=isObject(raw.ownership)?raw.ownership:undefined;
          if(damagedOwner?.ownerId===ownerId){result={ok:false,code:'invalid',message:'Explicit repair requires a fresh saving identity so all previous receipts are invalidated.'};return;}
          const recoverableEpoch=Number.isSafeInteger(damagedOwner?.epoch)&&Number(damagedOwner?.epoch)>=1?Number(damagedOwner?.epoch):0;
          const epochBase=Math.max(raw.commit,recoverableEpoch);
          if(raw.commit===Number.MAX_SAFE_INTEGER||epochBase===Number.MAX_SAFE_INTEGER){result={ok:false,code:'storage',message:'The repair ownership or storage revision limit has been reached.'};return;}
          const commit=raw.commit+1,ownership={ownerId,epoch:epochBase+1};
          const run:RunMetadata={runId:`run-${crypto.randomUUID()}`,origin:'new',parent:null};
          const envelope=this.envelope(candidate),checksum=stateHash(candidate);
          tx.objectStore('recovery').add({slot:key,previous:raw,reason:'confirmed-repair'},`${key}:${commit}:repair:${run.runId}`);
          if(candidate.ended)tx.objectStore('archives').add({slot:key,commit,envelope,run},`${key}:repair:${commit}:${run.runId}`);
          slots.put({commit,current:envelope,portable,backups:[envelope],preEnding:null,ownership,run,checkpointRuns:[{stateChecksum:checksum,run}]},key);
          result={ok:true,commit,ownership};
        }catch(error){tx.abort();reject(error);}};
      });
    }catch(error){return{ok:false,...failure(error)};}
  }
  async close(): Promise<void> { if (this.dbPromise) (await this.dbPromise).close(); this.dbPromise = undefined; }
}
