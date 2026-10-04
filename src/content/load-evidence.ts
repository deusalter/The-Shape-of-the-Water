import input from './case-v5.json';
import firstMovementInput from './case-v4.json';
import firstNightInput from './case-v2.json';
import legacyInput from './legacy/case-v1.json';
import manifestInput from './compatibility/short-case-v1-to-blaise-v2.json';
import { validateContentV2, type ReplayContextV2 } from '../engine/evidence-v2';
import { manifestSchemaV2 } from '../engine/evidence-schema';
import { validateContent } from '../engine/game';
import { contentHash } from '../engine/hash';

export const firstNightCase = validateContentV2(firstNightInput);
export const firstMovementCase = validateContentV2(firstMovementInput);
// The rejected expanded bath candidate is archived, not part of the playable build.
export const installedCase = validateContentV2(input);
const legacy = validateContent(legacyInput);
const manifest = manifestSchemaV2.safeParse(manifestInput);
export const migrationInstalled = firstNightCase.ok && legacy.ok && manifest.success &&
  manifest.data.fromHash === contentHash(legacy.value) && manifest.data.toHash === contentHash(firstNightCase.value);
export const replayContext: ReplayContextV2 = migrationInstalled && legacy.ok && manifest.success ? {
  legacyBundles: { [manifest.data.fromHash]: legacy.value },
  manifests: { [manifest.data.id]: manifest.data },
} : { legacyBundles: {}, manifests: {} };
