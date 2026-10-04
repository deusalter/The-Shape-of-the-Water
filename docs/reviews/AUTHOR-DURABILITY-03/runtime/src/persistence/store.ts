import { ENGINE_VERSION, contentHash, stateHash, validateState, serializePlayerExport, type Content, type GameState } from '../engine/game';
import { isObject } from '../engine/validate';
import { CheckpointStore, type StoreRuntime } from './checkpoint-store';
export { slotKey } from './checkpoint-store';
export type { BranchSource, SaveOptions, SaveResult } from './checkpoint-store';
export type LoadResult = import('./checkpoint-store').LoadResult<GameState>;

export interface SaveEnvelope { saveVersion: 1; schemaVersion: 1; engineVersion: number; contentHash: string; stateChecksum: string; state: GameState }
export function validateEnvelope(content: Content, value: unknown) {
  try {
    if (!isObject(value) || value.saveVersion !== 1 || value.schemaVersion !== 1 || value.engineVersion !== ENGINE_VERSION || value.contentHash !== contentHash(content) || Object.keys(value).length !== 6 || value.stateChecksum !== stateHash(value.state)) return { ok: false as const, errors: ['Save envelope version, exact bundle hash or checksum is invalid.'] };
    return validateState(content, value.state);
  } catch { return { ok: false as const, errors: ['Save envelope could not be validated.'] }; }
}
export function retainedLegacyExport(value:unknown):string|undefined {
  if (!isObject(value)||value.saveVersion!==1||value.schemaVersion!==1||value.engineVersion!==1||!isObject(value.state)||value.stateChecksum!==stateHash(value.state))return;
  return JSON.stringify({schemaVersion:1,engineVersion:1,kind:'encountered-run',stateChecksum:value.stateChecksum,state:value.state},null,2);
}
const legacyRuntime:StoreRuntime<Content,GameState> = {schemaVersion:1,engineVersion:ENGINE_VERSION,validateState,exportPortable:serializePlayerExport,retainedExport:retainedLegacyExport};
/** Legacy API backed by the shared transactional checkpoint store. */
export class GameStore extends CheckpointStore<Content,GameState> {
  constructor(factory:IDBFactory|undefined=globalThis.indexedDB,name='literary-detective-v1'){super(legacyRuntime,factory,name);}
}
