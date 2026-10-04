import { stateHash } from './hash';
import type { GameStateV2, PortableV2, SeenV2 } from './evidence-types';

export const MAX_RUN_BYTES_V2 = 10 * 1024 * 1024;
export function seenProjectionV2(state: GameStateV2): SeenV2 {
  return { transcript: state.transcript, sources: state.sources, deductions: state.deductions, interpretations: state.interpretations, relationships: state.relationships, hints: state.hints };
}
export function portableEnvelopeV2(state: GameStateV2): PortableV2 {
  const seen = seenProjectionV2(state);
  return {
    saveVersion: 2, schemaVersion: 2, engineVersion: 2, kind: 'encountered-run',
    content: { id: state.contentId, version: state.contentVersion, hash: state.contentHash },
    commands: state.commands, seen, seenChecksum: stateHash(seen), migrationSeed: state.migrationSeed,
  };
}
export function portableJSONV2(state: GameStateV2): string { return JSON.stringify(portableEnvelopeV2(state)); }
export function fitsRunBytesV2(text: string): boolean { return text.length <= MAX_RUN_BYTES_V2 && new TextEncoder().encode(text).byteLength <= MAX_RUN_BYTES_V2; }
/** Both stored checkpoint and compact portable replay must remain importable. */
export function assertRunBudgetV2(state: GameStateV2): void {
  if (!fitsRunBytesV2(JSON.stringify(state)) || !fitsRunBytesV2(portableJSONV2(state))) throw new Error('The run would exceed the 10 MB checkpoint or encountered-export limit. No history was truncated.');
}
