import { describe, expect, it } from 'vitest';
import { applyCommandV2, createGameV2, exportPortableV2, importPortableV2, validateContentV2, validateStateV2, type ContentV2, type LegacySeedV2, type MigrationManifestV2 } from '../src/engine/evidence-v2';
import { MAX_RUN_BYTES_V2 } from '../src/engine/evidence-budget';
import { createGame, validateContent, applyChoice } from '../src/engine/game';
import { contentHash, stateHash } from '../src/engine/hash';

function largeContent(paragraphs: string[]): ContentV2 {
  const result = validateContentV2({ schemaVersion: 2, id: 'bounded-size-fixture', title: 'Noncanonical size fixture', version: 2, start: 'room', sources: [], characters: [], beliefIds: [], questions: [], interpretationRules: [], hints: [], scenes: [{ id: 'room', title: 'Room', paragraphs, choices: [{ id: 'again', label: 'Read the room again.', target: 'room' }] }] });
  if (!result.ok) throw new Error(result.errors.join('\n'));
  return result.value;
}

describe('bounded replayable run resources', () => {
  it('rejects a would-exceed command, preserves its prior state and permits actual export/reimport', () => {
    const content = largeContent(Array.from({ length: 50 }, () => 'é'.repeat(20000)));
    const first = createGameV2(content);
    const accepted = applyCommandV2(content, first, { type: 'choose', id: 'size.0', expectedRevision: 0, choiceId: 'again' });
    if (!accepted.ok) throw new Error(accepted.error.message);
    const prior = accepted.state, rejected = applyCommandV2(content, prior, { type: 'choose', id: 'size.1', expectedRevision: 1, choiceId: 'again' });
    expect(!rejected.ok && rejected.error.code).toBe('resource-limit');
    expect(rejected.state).toBe(prior);
    expect(prior.revision).toBe(1);
    expect(new TextEncoder().encode(JSON.stringify(prior)).byteLength).toBeLessThanOrEqual(MAX_RUN_BYTES_V2);
    const portable = exportPortableV2(prior);
    expect(new TextEncoder().encode(portable).byteLength).toBeLessThanOrEqual(MAX_RUN_BYTES_V2);
    const restored = importPortableV2(content, portable);
    expect(restored.ok && restored.value.transcript).toEqual(prior.transcript);
    expect(validateStateV2(content, prior).ok).toBe(true);
  });
  it('refuses oversized initial state without truncating any authored paragraph', () => {
    const content = largeContent(Array.from({ length: 200 }, () => 'x'.repeat(30000)));
    expect(() => createGameV2(content)).toThrow('10 MB');
    expect(content.scenes[0].paragraphs).toHaveLength(200);
    expect(content.scenes[0].paragraphs[0]).toHaveLength(30000);
  });
  it('refuses a migrated prefix that cannot fit both checkpoint and encountered export', () => {
    const v1 = validateContent({ id: 'large-legacy', title: 'Noncanonical old size fixture', version: 1, start: 'room', scenes: [{ id: 'room', title: 'Room', paragraphs: Array.from({ length: 100 }, () => 'x'.repeat(30000)), choices: [{ id: 'again', label: 'Return.', target: 'room' }] }] });
    if (!v1.ok) throw new Error(v1.errors.join('\n'));
    let legacy = createGame(v1.value);
    for (let step = 0; step < 2; step++) { const result = applyChoice(v1.value, legacy, { id: `old.${step}`, expectedRevision: step, choiceId: 'again' }); if (!result.ok) throw new Error(result.error.message); legacy = result.state; }
    const target = largeContent(['Small target paragraph.']);
    const manifest: MigrationManifestV2 = { id: 'oversize-migration', fromHash: contentHash(v1.value), toHash: contentHash(target), sceneMap: { room: 'room' }, flagMap: {}, sourceMap: {}, disclosures: [] };
    const seed: LegacySeedV2 = { manifestId: manifest.id, manifestHash: stateHash(manifest), legacyState: legacy, legacyStateHash: stateHash(legacy) };
    expect(() => createGameV2(target, seed, { legacyBundles: { [manifest.fromHash]: v1.value }, manifests: { [manifest.id]: manifest } })).toThrow('10 MB');
    expect(legacy.revision).toBe(2);
    expect(legacy.transcript).toHaveLength(5);
  });
});
