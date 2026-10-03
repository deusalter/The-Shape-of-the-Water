import { ENGINE_VERSION, contentHash, stateHash, validateState, type Content, type GameState } from '../engine/game';
import { isObject } from '../engine/validate';

export interface SaveEnvelope { saveVersion: 1; schemaVersion: 1; engineVersion: number; contentHash: string; stateChecksum: string; state: GameState }
interface Slot { commit: number; current: unknown; backups: unknown[]; preEnding: unknown }
export type LoadResult =
  | { kind: 'empty'; commit: number }
  | { kind: 'loaded' | 'recovered'; commit: number; state: GameState }
  | { kind: 'corrupt'; commit: number; message: string }
  | { kind: 'incompatible'; commit: 0; message: string; retained: { id: string; contentVersion: unknown; contentHash: unknown; json: string }[] }
  | { kind: 'error'; code: 'unavailable' | 'quota' | 'storage'; message: string };
export type SaveResult = { ok: true; commit: number } | { ok: false; code: 'conflict' | 'invalid' | 'quota' | 'unavailable' | 'storage' | 'corrupt'; message: string };
const envelope = (state: GameState): SaveEnvelope => ({ saveVersion: 1, schemaVersion: 1, engineVersion: ENGINE_VERSION, contentHash: state.contentHash, stateChecksum: stateHash(state), state });
export function validateEnvelope(content: Content, value: unknown) {
  try {
    if (!isObject(value) || value.saveVersion !== 1 || value.schemaVersion !== 1 || value.engineVersion !== ENGINE_VERSION || value.contentHash !== contentHash(content) || Object.keys(value).length !== 6 || value.stateChecksum !== stateHash(value.state)) return { ok: false as const, errors: ['Save envelope version, exact bundle hash or checksum is invalid.'] };
    return validateState(content, value.state);
  } catch { return { ok: false as const, errors: ['Save envelope could not be validated.'] }; }
}
function failure(error: unknown): { code: 'quota' | 'unavailable' | 'storage'; message: string } {
  const name = isObject(error) && typeof error.name === 'string' ? error.name : error instanceof Error ? error.name : '';
  if (name === 'QuotaExceededError') return { code: 'quota', message: 'Browser storage is full. Your active run is still in memory; export it before closing this page.' };
  if (name === 'SecurityError' || name === 'InvalidStateError' || name === 'NotSupportedError') return { code: 'unavailable', message: 'Browser storage is unavailable. Your active run remains in memory; you can export it.' };
  return { code: 'storage', message: 'The browser could not save or load this run. Your active run remains in memory.' };
}
export const slotKey = (content: Content) => `${content.id}@${content.version}:${contentHash(content)}`;
function validCommit(value: unknown): value is Slot { return isObject(value) && Number.isSafeInteger(value.commit) && Number(value.commit) >= 1; }

/** One read/write transaction provides a compare-and-swap across browser tabs. */
export class GameStore {
  private dbPromise: Promise<IDBDatabase> | undefined;
  constructor(private readonly factory: IDBFactory | undefined = globalThis.indexedDB, private readonly name = 'literary-detective-v1') {}
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
  async load(content: Content): Promise<LoadResult> {
    try {
      const db = await this.open();
      return await new Promise<LoadResult>((resolve, reject) => {
        const tx = db.transaction(['slots', 'recovery'], 'readwrite');
        const slots = tx.objectStore('slots');
        const request = slots.get(slotKey(content));
        let result: LoadResult;
        tx.oncomplete = () => resolve(result);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error ?? new Error('Load transaction aborted'));
        request.onsuccess = () => {
          try {
            const raw: unknown = request.result;
            if (raw === undefined) {
              const existing = slots.getAll();
              existing.onsuccess = () => {
                const retained = (existing.result as unknown[]).flatMap(item => {
                  if (!validCommit(item) || !isObject(item.current) || !isObject(item.current.state) || item.current.state.contentId !== content.id) return [];
                  const oldState = item.current.state;
                  return [{ id: String(oldState.contentId), contentVersion: oldState.contentVersion, contentHash: oldState.contentHash, json: JSON.stringify({schemaVersion:1,engineVersion:ENGINE_VERSION,kind:'encountered-run',stateChecksum:item.current.stateChecksum,state:oldState},null,2) }];
                });
                result = retained.length ? {kind:'incompatible',commit:0,message:'Saved progress exists for a different content hash or version. It has been preserved and cannot be loaded into this text revision. Export it for a compatible installation.',retained} : {kind:'empty',commit:0};
              };
              return;
            }
            const current = validCommit(raw) ? validateEnvelope(content, raw.current) : { ok: false as const, errors: ['Invalid slot metadata'] };
            if (validCommit(raw) && current.ok) { result = { kind: 'loaded', commit: raw.commit, state: current.value }; return; }
            const candidates = validCommit(raw) ? [...(Array.isArray(raw.backups) ? raw.backups.slice(0, 3) : []), raw.preEnding] : [];
            const validBackups = candidates.map(candidate => validateEnvelope(content, candidate)).filter(candidate => candidate.ok);
            const backup = validBackups[0];
            const commit = validCommit(raw) && raw.commit < Number.MAX_SAFE_INTEGER ? raw.commit + 1 : 1;
            // Keep the corrupt bytes for local recovery. A quota failure aborts all repairs.
            tx.objectStore('recovery').put({ slot: slotKey(content), previous: raw }, `${slotKey(content)}:${commit}`);
            if (backup?.ok) {
              slots.put({ commit, current: envelope(backup.value), backups: validBackups.slice(0,3).map(candidate => envelope(candidate.value)), preEnding: validCommit(raw) && validateEnvelope(content, raw.preEnding).ok ? raw.preEnding : null }, slotKey(content));
              result = { kind: 'recovered', commit, state: backup.value };
            } else {
              slots.put({ commit, current: null, backups: [], preEnding: null }, slotKey(content));
              result = { kind: 'corrupt', commit, message: 'The saved run and backup failed validation. The damaged data has been retained locally; a new run is active in memory.' };
            }
          } catch (error) { tx.abort(); reject(error); }
        };
      });
    } catch (error) { return { kind: 'error', ...failure(error) }; }
  }
  async save(content: Content, state: GameState, expectedCommit: number, options: { archiveCurrent?: boolean } = {}): Promise<SaveResult> {
    const checked = validateState(content, state);
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
            const previous = validCommit(raw) ? validateEnvelope(content, raw.current) : undefined;
            const earlier = validCommit(raw) && Array.isArray(raw.backups) ? raw.backups.slice(0,3).map(value => validateEnvelope(content,value)).filter(value => value.ok).map(value => envelope(value.value)) : [];
            const backups = (previous?.ok ? [envelope(previous.value), ...earlier] : earlier).slice(0,3);
            if (!backups.length) backups.push(envelope(checked.value));
            const preEnding = checked.value.ended && previous?.ok && !previous.value.ended ? envelope(previous.value) : validCommit(raw) && validateEnvelope(content,raw.preEnding).ok ? raw.preEnding : null;
            if (options.archiveCurrent && previous?.ok) tx.objectStore('archives').put({slot:slotKey(content),commit:actual,envelope:envelope(previous.value)},`${slotKey(content)}:${actual}`);
            if (checked.value.ended) tx.objectStore('archives').put({slot:slotKey(content),commit:actual+1,envelope:envelope(checked.value)},`${slotKey(content)}:${actual+1}`);
            slots.put({ commit: actual + 1, current: envelope(checked.value), backups, preEnding }, slotKey(content));
            result = { ok: true, commit: actual + 1 };
          } catch (error) { tx.abort(); reject(error); }
        };
      });
    } catch (error) { return { ok: false, ...failure(error) }; }
  }
  async listArchives(content: Content): Promise<{id:string;revision:number;ended:boolean}[]> {
    const db = await this.open();
    return new Promise((resolve,reject) => {
      const tx=db.transaction('archives'), object=tx.objectStore('archives'), values=object.getAll(), keys=object.getAllKeys();
      tx.oncomplete=()=>resolve(values.result.flatMap((raw:unknown,index)=>{if(!isObject(raw)||raw.slot!==slotKey(content))return[];const checked=validateEnvelope(content,raw.envelope);return checked.ok?[{id:String(keys.result[index]),revision:checked.value.revision,ended:checked.value.ended}]:[];}).reverse());
      tx.onerror=()=>reject(tx.error);
    });
  }
  async loadArchive(content: Content,id: string): Promise<GameState | undefined> {
    const db=await this.open();
    const raw:unknown=await new Promise((resolve,reject)=>{const request=db.transaction('archives').objectStore('archives').get(id);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
    if(!isObject(raw)||raw.slot!==slotKey(content))return;
    const checked=validateEnvelope(content,raw.envelope);return checked.ok?checked.value:undefined;
  }
  async close(): Promise<void> { if (this.dbPromise) (await this.dbPromise).close(); this.dbPromise = undefined; }
}
