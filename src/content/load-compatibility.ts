import legacyInput from './legacy/case-v1.json';
import manifestInput from './compatibility/short-case-v1-to-blaise-v2.json';
import { validateContentV2, type ReplayContextV2 } from '../engine/evidence-v2';
import { manifestSchemaV2 } from '../engine/evidence-schema';
import { validateContent } from '../engine/game';
import { contentHash } from '../engine/hash';

export function contextFor(firstNight: ReturnType<typeof validateContentV2>): ReplayContextV2 {
  const legacy = validateContent(legacyInput);
  const manifest = manifestSchemaV2.safeParse(manifestInput);
  if (!firstNight.ok || !legacy.ok || !manifest.success ||
    manifest.data.fromHash !== contentHash(legacy.value) ||
    manifest.data.toHash !== contentHash(firstNight.value)) return { legacyBundles: {}, manifests: {} };
  return {
    legacyBundles: { [manifest.data.fromHash]: legacy.value },
    manifests: { [manifest.data.id]: manifest.data },
  };
}
