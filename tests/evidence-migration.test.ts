import { describe, expect, it } from 'vitest';
import { fixtureContent as legacy } from '../src/content/fixture';
import { evidenceFixture as content } from '../src/engine/evidence-fixture';
import { createGame, serializePlayerExport, validateContent, validateState } from '../src/engine/game';
import {
  applyCommandV2, createGameV2, currentPassageV2, exportPortableV2, importPortableV2, validateStateV2,
  type LegacySeedV2, type MigrationManifestV2, type ReplayContextV2,
} from '../src/engine/evidence-v2';
import { contentHash, stateHash } from '../src/engine/hash';
import { move } from './helpers';

function setup() {
  const legacyState = move(move(createGame(legacy), 'cup'), 'inspect-drain');
  const manifest: MigrationManifestV2 = {
    id: 'fixture-v1-to-v2', fromHash: contentHash(legacy), toHash: contentHash(content),
    sceneMap: { bench: 'bench', worker: 'worker', sink: 'sink', finish: 'finish' },
    flagMap: { 'cup-seen': 'cup-seen', water: 'water' }, sourceMap: { ring: 'ring', rinse: 'rinse' }, disclosures: [],
  };
  const seed: LegacySeedV2 = { manifestId: manifest.id, manifestHash: stateHash(manifest), legacyState, legacyStateHash: stateHash(legacyState) };
  const context: ReplayContextV2 = { legacyBundles: { [manifest.fromHash]: legacy }, manifests: { [manifest.id]: manifest } };
  return { legacyState, manifest, seed, context };
}

describe('reviewed legacy migration and replay', () => {
  it('preserves the validated legacy prefix and only maps actually encountered evidence', () => {
    const { legacyState, seed, context } = setup(), state = createGameV2(content, seed, context);
    expect(state.revision).toBe(legacyState.revision);
    expect(state.currentScene).toBe('sink');
    expect(state.transcript).toEqual(legacyState.transcript);
    expect(state.observations).toEqual(legacyState.observations);
    expect(state.sources.map(source => ({ id: source.id, text: source.text, revision: source.revision }))).toEqual(legacyState.observations.map(({ id, text, revision }) => ({ id, text, revision })));
    expect(state.deductions).toEqual([]);
    expect(state.flags).not.toContain('account-supported');
    expect(state.npcState[0].knows).not.toContain('rinse');
    expect(currentPassageV2(state)).toEqual(legacyState.transcript.at(-1));
    expect(validateState(legacy, legacyState).ok).toBe(true);
  });
  it('keeps literal old prose when the installed v2 paragraph changed', () => {
    const { seed, context } = setup();
    const old = createGameV2(content, seed, context);
    expect(JSON.stringify(old.transcript)).toContain('A blue cup sits beside a dry ring.');
    const result = applyCommandV2(content, old, { type: 'choose', id: 'new-runtime.2', expectedRevision: 2, choiceId: 'return-sink' });
    if (!result.ok) throw new Error(result.error.message);
    expect(currentPassageV2(result.state).paragraphs[0]).toContain('REVISIT_PASSAGE');
    expect(JSON.stringify(result.state.transcript)).toContain('A blue cup sits beside a dry ring.');
    const imported = importPortableV2(content, exportPortableV2(result.state), context);
    expect(imported.ok && stateHash(imported.value)).toBe(stateHash(result.state));
    expect(validateStateV2(content, result.state, context).ok).toBe(true);
  });
  it('derives an NPC disclosure only from a named actual legacy choice', () => {
    const { manifest, seed, context } = setup();
    manifest.disclosures = [{ choiceId: 'inspect-drain', characterId: 'worker', refId: 'rinse' }, { choiceId: 'ask-gently', characterId: 'worker', refId: 'ring' }];
    seed.manifestHash = stateHash(manifest);
    const state = createGameV2(content, seed, context);
    expect(state.npcState[0].knows).toContain('rinse');
    expect(state.npcState[0].knows).not.toContain('ring');
  });
  it('requires installed pinned legacy content and reviewed manifest receipts', () => {
    const { seed, context } = setup();
    expect(() => createGameV2(content, seed)).toThrow('installed compatibility context');
    expect(importPortableV2(content, exportPortableV2(createGameV2(content, seed, context))).ok).toBe(false);
    const changed = structuredClone(context);
    changed.legacyBundles[contentHash(legacy)].scenes[0].paragraphs[0] += ' changed';
    expect(() => createGameV2(content, seed, changed)).toThrow('legacy bundle');
    expect(() => createGameV2(content, { ...seed, manifestHash: '0'.repeat(64) }, context)).toThrow('receipt');
    expect(() => createGameV2(content, { ...seed, legacyStateHash: '0'.repeat(64) }, context)).toThrow('seed failed');
  });
  it('rejects an altered legacy transcript even with a recomputed outer seed hash', () => {
    const { seed, context } = setup();
    seed.legacyState = structuredClone(seed.legacyState);
    const passage = seed.legacyState.transcript[0];
    if (passage.kind !== 'passage') throw new Error('Expected passage');
    passage.paragraphs[0] = 'Forged old prose';
    seed.legacyStateHash = stateHash(seed.legacyState);
    expect(() => createGameV2(content, seed, context)).toThrow('legacy seed failed');
  });
  it.each(['scene', 'flag', 'source', 'identity', 'disclosure'])('rejects undeclared %s mappings even when their manifest receipt matches', kind => {
    const { manifest, seed, context } = setup();
    if (kind === 'scene') manifest.sceneMap.nonexistent = 'bench';
    if (kind === 'flag') manifest.flagMap.nonexistent = 'water';
    if (kind === 'source') manifest.sourceMap.nonexistent = 'rinse';
    if (kind === 'identity') manifest.id = 'mismatched-manifest-id';
    if (kind === 'disclosure') manifest.disclosures = [{ choiceId: 'nonexistent', characterId: 'worker', refId: 'rinse' }];
    seed.manifestHash = stateHash(manifest);
    expect(() => createGameV2(content, seed, context)).toThrow();
  });
  it('omits hidden NPC state and unencountered content from a migrated export', () => {
    const { seed, context } = setup(), text = exportPortableV2(createGameV2(content, seed, context));
    for (const sentinel of ['npcState', 'PRIVATE_NPC', 'PRIVATE_TITLE', 'worker-private-belief', 'UNSEEN_FILM', 'UNSEEN_READING', 'DISCLOSED_RESPONSE']) expect(text).not.toContain(sentinel);
    expect(JSON.parse(text).migrationSeed.legacyState).toEqual(seed.legacyState);
    const legacyExport = JSON.parse(serializePlayerExport(seed.legacyState));
    expect(legacyExport).toMatchObject({ schemaVersion: 1, engineVersion: 1 });
    expect(legacyExport.state).toEqual(seed.legacyState);
  });
  it('does not treat inherited object properties as declared mappings', () => {
    const raw = structuredClone(legacy);
    raw.scenes[0].choices[0].observation!.id = 'constructor';
    raw.scenes[0].choices[0].effects!.push('toString');
    const parsed = validateContent(raw);
    if (!parsed.ok) throw new Error(parsed.errors.join('\n'));
    const legacyState = move(createGame(parsed.value), 'cup', parsed.value);
    const manifest: MigrationManifestV2 = { id: 'prototype-safe', fromHash: contentHash(parsed.value), toHash: contentHash(content), sceneMap: { bench: 'bench' }, flagMap: {}, sourceMap: {}, disclosures: [] };
    const seed: LegacySeedV2 = { manifestId: manifest.id, manifestHash: stateHash(manifest), legacyState, legacyStateHash: stateHash(legacyState) };
    const context: ReplayContextV2 = { legacyBundles: { [manifest.fromHash]: parsed.value }, manifests: { [manifest.id]: manifest } };
    const state = createGameV2(content, seed, context);
    expect(state.sources).toEqual([]);
    expect(state.flags).toEqual([]);
    expect(state.observations[0].id).toBe('constructor');
    expect(validateStateV2(content, state, context).ok).toBe(true);
  });
});
