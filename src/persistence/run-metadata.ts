import { sha256 } from '../engine/hash';
import { isObject } from '../engine/validate';

export interface BranchParent { runId: string; revision: number; stateChecksum: string }
export interface RunMetadata {
  runId: string;
  origin: 'new' | 'restart' | 'import' | 'branch' | 'migration' | 'legacy';
  parent: BranchParent | null;
  replacesRunId?: string;
}
const id = (value: unknown): value is string => typeof value === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,199}$/.test(value);
export function validRunMetadata(value: unknown): value is RunMetadata {
  if (!isObject(value) || !id(value.runId) || !['new','restart','import','branch','migration','legacy'].includes(String(value.origin)) || Object.keys(value).some(key=>!['runId','origin','parent','replacesRunId'].includes(key))) return false;
  if (value.replacesRunId !== undefined && !id(value.replacesRunId)) return false;
  const parent=value.parent;
  return parent===null || (isObject(parent) && Object.keys(parent).length===3 && id(parent.runId) && Number.isSafeInteger(parent.revision) && Number(parent.revision)>=0 && typeof parent.stateChecksum==='string' && /^[a-f0-9]{64}$/.test(parent.stateChecksum));
}
/** Old saves did not record lineage. Give them stable identities, never guessed parents. */
export function legacyRunMetadata(storageIdentity: string): RunMetadata {
  return {runId:`legacy-${sha256(storageIdentity).slice(0,32)}`,origin:'legacy',parent:null};
}
export function runMetadata(value: unknown, storageIdentity: string): RunMetadata {
  return validRunMetadata(value) ? structuredClone(value) : legacyRunMetadata(storageIdentity);
}
