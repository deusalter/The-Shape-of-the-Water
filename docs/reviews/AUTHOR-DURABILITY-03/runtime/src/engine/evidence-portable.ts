import { canonicalJSON, contentHash, stateHash } from './hash';
import { portableSchemaV2 } from './evidence-schema';
import { applyCommandV2, createGameV2, seenProjectionV2 } from './evidence-runtime';
import { assertRunBudgetV2, fitsRunBytesV2, portableJSONV2 } from './evidence-budget';
import type { Validation } from './types';
import type { CommandV2, ContentV2, GameStateV2, LegacySeedV2, PortableV2, ReplayContextV2 } from './evidence-types';

function boundedJSON(input: unknown): { value: unknown; text: string } {
  const text = typeof input === 'string' ? input : JSON.stringify(input);
  if (typeof text !== 'string' || !fitsRunBytesV2(text)) throw new Error('The run exceeds the 10 MB import limit.');
  return { value: JSON.parse(text), text };
}
function replay(content: ContentV2, commands: CommandV2[], seed: LegacySeedV2 | null, context?: ReplayContextV2): GameStateV2 {
  let state = createGameV2(content, seed, context);
  if (state.revision + commands.length > 10000) throw new Error('The run exceeds the 10,000-command limit.');
  for (const command of commands) {
    const result = applyCommandV2(content, state, command);
    if (!result.ok || result.duplicate) throw new Error('The run contains an invalid, repeated, stale or unconfirmed command.');
    state = result.state;
  }
  return state;
}

/** Only encountered material and accepted commands leave the internal runtime. */
export function exportPortableV2(state: GameStateV2): string {
  assertRunBudgetV2(state);
  return portableJSONV2(state);
}

export function importPortableV2(content: ContentV2, input: unknown, context?: ReplayContextV2): Validation<GameStateV2> {
  try {
    const parsed = portableSchemaV2.safeParse(boundedJSON(input).value);
    if (!parsed.success) return { ok: false, errors: ['The v2 encountered-run envelope is malformed or unsupported.'] };
    const envelope = parsed.data as PortableV2;
    if (envelope.content.id !== content.id || envelope.content.version !== content.version || envelope.content.hash !== contentHash(content)) return { ok: false, errors: ['The run requires a different exact content revision.'] };
    if (envelope.seenChecksum !== stateHash(envelope.seen)) return { ok: false, errors: ['The encountered-material checksum does not match.'] };
    const state = replay(content, envelope.commands, envelope.migrationSeed, context);
    if (canonicalJSON(seenProjectionV2(state)) !== canonicalJSON(envelope.seen)) return { ok: false, errors: ['The encountered material does not match deterministic replay.'] };
    return { ok: true, value: state };
  } catch (error) {
    return { ok: false, errors: [error instanceof Error ? error.message : 'The run could not be validated.'] };
  }
}

/** Internal checkpoints are accepted only when every field equals replay. */
export function validateStateV2(content: ContentV2, input: unknown, context?: ReplayContextV2): Validation<GameStateV2> {
  try {
    const value = boundedJSON(input).value;
    if (!value || typeof value !== 'object' || Array.isArray(value)) return { ok: false, errors: ['The v2 checkpoint is malformed.'] };
    const state = value as GameStateV2;
    if (state.schemaVersion !== 2 || state.engineVersion !== 2 || state.contentId !== content.id || state.contentVersion !== content.version || state.contentHash !== contentHash(content)) return { ok: false, errors: ['The checkpoint requires a different exact content revision.'] };
    if (!Array.isArray(state.commands) || state.commands.length > 10000 || !Object.hasOwn(state, 'migrationSeed')) return { ok: false, errors: ['The checkpoint has no bounded v2 replay history.'] };
    const derived = replay(content, state.commands, state.migrationSeed, context);
    if (canonicalJSON(derived) !== canonicalJSON(value)) return { ok: false, errors: ['The checkpoint does not match deterministic replay.'] };
    return { ok: true, value: derived };
  } catch (error) {
    return { ok: false, errors: [error instanceof Error ? error.message : 'The checkpoint could not be validated.'] };
  }
}
