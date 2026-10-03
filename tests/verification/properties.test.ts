import { describe, expect, test } from 'vitest';
import fc from 'fast-check';
import { createHash } from 'node:crypto';
import { availableChoices, applyChoice, confirmationFor, createGame, currentPassage, serializePlayerExport, validateContent, validateState, stateHash, type Command, type Content, type GameState } from '../../src/engine/game';
import { canonicalJSON, sha256 } from '../../src/engine/hash';
import { fixtureContent } from '../../src/content/fixture';
import { guardKey } from '../../tools/verify-explorer';

const seed = Number(process.env.VERIFY_SEED ?? 20261003);
const numRuns = Number(process.env.VERIFY_RUNS ?? 120);
const parameters = { seed, numRuns, verbose: true } as const;
const programs = fc.array(fc.nat({ max: 10000 }), { minLength: 0, maxLength: 35 });
function command(state: GameState, choiceId: string, suffix = 'step'): Command {
  const base = { id: `property.${state.revision}.${suffix}`, choiceId, expectedRevision: state.revision };
  return { ...base, confirmation: confirmationFor(state, base) };
}
function run(content: Content, selectors: number[]): GameState {
  let state = createGame(content);
  for (const selector of selectors) {
    const choices = availableChoices(content, state);
    if (!choices.length) break;
    const result = applyChoice(content, state, command(state, choices[selector % choices.length].id));
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error.code);
    state = result.state;
  }
  return state;
}
function assertFrozen(value: unknown): void {
  if (value && typeof value === 'object') {
    expect(Object.isFrozen(value)).toBe(true);
    for (const child of Object.values(value)) assertFrozen(child);
  }
}

describe(`independent properties seed=${seed} runs=${numRuns}`, () => {
  test('replay and save roundtrip deterministically preserve every consequential field', () => {
    fc.assert(fc.property(programs, selectors => {
      const first = run(fixtureContent, selectors), second = run(fixtureContent, selectors);
      expect(canonicalJSON(first)).toBe(canonicalJSON(second));
      const parsed: unknown = JSON.parse(serializePlayerExport(first));
      const saved = (parsed as { state: unknown }).state;
      const validated = validateState(fixtureContent, saved);
      expect(validated.ok).toBe(true);
      if (validated.ok) expect(validated.value).toEqual(first);
    }), parameters);
  });
  test('frozen input bytes and literal record/passage occurrences never change', () => {
    fc.assert(fc.property(programs, selectors => {
      const contentBefore = canonicalJSON(fixtureContent);
      let state = createGame(fixtureContent);
      assertFrozen(fixtureContent);
      for (const selector of selectors) {
        const choices = availableChoices(fixtureContent, state);
        if (!choices.length) break;
        const old = state, oldBytes = canonicalJSON(old);
        const result = applyChoice(fixtureContent, old, command(old, choices[selector % choices.length].id));
        expect(result.ok).toBe(true);
        if (!result.ok) throw new Error(result.error.code);
        state = result.state;
        expect(canonicalJSON(old)).toBe(oldBytes);
        expect(state.transcript.slice(0, old.transcript.length)).toEqual(old.transcript);
        for (const field of ['observations', 'interpretations', 'relationships'] as const) for (const record of old[field]) expect(state[field].find(item => item.id === record.id)).toEqual(record);
        assertFrozen(old); assertFrozen(state);
      }
      expect(canonicalJSON(fixtureContent)).toBe(contentBefore);
    }), parameters);
  });
  test('delivering any prior committed ID is idempotent despite changed payload/revision', () => {
    fc.assert(fc.property(programs.filter(selectors => selectors.length > 0), selectors => {
      const state = run(fixtureContent, selectors);
      const event = state.transcript.find(item => item.kind === 'choice');
      expect(event).toBeDefined();
      if (!event || event.kind !== 'choice') return;
      const before = canonicalJSON(state);
      const duplicate = applyChoice(fixtureContent, state, { id: event.commandId, choiceId: 'unseen.invalid-choice', expectedRevision: 0 });
      expect(duplicate.ok).toBe(true);
      if (duplicate.ok) { expect(duplicate.duplicate).toBe(true); expect(duplicate.state).toBe(state); }
      expect(canonicalJSON(state)).toBe(before);
    }), parameters);
  });
  test('arbitrary JSON commands and guaranteed unknown IDs reject safely and consistently', () => {
    fc.assert(fc.property(programs, fc.jsonValue(), (selectors, input) => {
      const state = run(fixtureContent, selectors), before = canonicalJSON(state);
      const arbitrary = applyChoice(fixtureContent, state, input as unknown as Command);
      expect(arbitrary.ok).toBe(false);
      expect(arbitrary).toEqual(applyChoice(fixtureContent, state, input as unknown as Command));
      expect(arbitrary.state).toBe(state);
      const unknown = applyChoice(fixtureContent, state, { id: `unknown.${state.revision}`, choiceId: 'unseen.unknown', expectedRevision: state.revision });
      expect(unknown.ok).toBe(false); expect(unknown.state).toBe(state);
      expect(canonicalJSON(state)).toBe(before);
    }), parameters);
  });
  test('fresh invalid revision never progresses the fiction', () => {
    fc.assert(fc.property(programs, fc.integer({ min: 1, max: 10000 }), (selectors, delta) => {
      const state = run(fixtureContent, selectors), choice = availableChoices(fixtureContent, state)[0];
      if (!choice) return;
      const wrong = applyChoice(fixtureContent, state, { id: 'stale.fresh', choiceId: choice.id, expectedRevision: state.revision + delta });
      expect(wrong.ok).toBe(false); expect(wrong.state).toBe(state);
      if (!wrong.ok) expect(wrong.error.code).toBe('stale-command');
    }), parameters);
  });
  test('record acquisition is monotonic and deduplicated under repeatable actions', () => {
    const selectors = ['cup', 'inspect-drain', 'return-sink', 'inspect-drain', 'return-sink'];
    let state = createGame(fixtureContent);
    for (const id of selectors) {
      const result = applyChoice(fixtureContent, state, command(state, id));
      expect(result.ok).toBe(true); if (!result.ok) throw new Error(result.error.code); state = result.state;
    }
    expect(state.observations.map(item => item.id)).toEqual(['ring', 'rinse']);
    expect(state.observations[1].revision).toBe(2);
    expect(state.transcript.filter(item => item.kind === 'choice' && item.choiceId === 'inspect-drain')).toHaveLength(2);
  });
  test('hash implementation agrees with independent SHA-256 including Unicode', () => {
    fc.assert(fc.property(fc.string({ maxLength: 400 }), text => { expect(sha256(text)).toBe(createHash('sha256').update(text).digest('hex')); }), parameters);
    for (const text of ['', 'abc', 'Kant: Erscheinung; Spinoza: beatitudo', '🙂海\u0000']) expect(sha256(text)).toBe(createHash('sha256').update(text).digest('hex'));
  });
});

describe('security boundaries and conditional guard equivalence', () => {
  test('old confirmation cannot authorize a changed ending payload or state', () => {
    let state = createGame(fixtureContent);
    for (const id of ['cup', 'inspect-drain', 'return-sink', 'propose-rinse']) {
      const result = applyChoice(fixtureContent, state, command(state, id));
      if (!result.ok) throw new Error(result.error.code); state = result.state;
    }
    const ending = command(state, 'finish-fixture', 'ending');
    const changed = applyChoice(fixtureContent, state, { ...ending, id: 'different.action' });
    expect(changed.ok).toBe(false); if (!changed.ok) expect(changed.error.code).toBe('confirmation-required');
    const moved = applyChoice(fixtureContent, state, command(state, 'inspect-drain'));
    if (!moved.ok) throw new Error(moved.error.code);
    const returned = applyChoice(fixtureContent, moved.state, command(moved.state, 'return-sink'));
    if (!returned.ok) throw new Error(returned.error.code);
    const stale = applyChoice(fixtureContent, returned.state, { ...ending, expectedRevision: returned.state.revision });
    expect(stale.ok).toBe(false); if (!stale.ok) expect(stale.error.code).toBe('confirmation-required');
    expect(applyChoice(fixtureContent, state, ending).ok).toBe(true);
  });
  test('player passage/export excludes unseen titles, variants and future observations', () => {
    const raw = JSON.parse(JSON.stringify(fixtureContent)) as Content;
    raw.id = 'projection-fixture'; raw.scenes[3].title = 'SECRET-FUTURE-TITLE'; raw.scenes[3].paragraphs = ['SECRET-FUTURE-ENDING'];
    raw.scenes[0].variants![0].paragraphs = ['SECRET-UNSEEN-VARIANT'];
    raw.scenes[0].choices[3].observation!.text = 'SECRET-UNSEEN-OBSERVATION';
    const valid = validateContent(raw); if (!valid.ok) throw new Error(valid.errors.join('\n'));
    const state = createGame(valid.value);
    for (const projection of [JSON.stringify(currentPassage(state)), serializePlayerExport(state)]) expect(projection).not.toMatch(/SECRET-/);
    // This tests exposed engine projections, not DOM, URL/search or production-asset stripping.
  });
  test('content schema rejects unknown nested DSL rather than pretending to execute it', () => {
    const raw = JSON.parse(JSON.stringify(fixtureContent));
    raw.scenes[0].choices[0].condition = { op: 'any', args: Array.from({ length: 100 }, () => ({ op: 'script', value: 'alert(1)' })) };
    const checked = validateContent(raw); expect(checked.ok).toBe(false);
    if (!checked.ok) { expect(checked.errors.some(message => message.includes('condition') && message.includes('choices'))).toBe(true); expect(checked.errors.length).toBeLessThanOrEqual(100); }
  });
  test('navigation abstraction preserves transitions across differing history under its assumptions', () => {
    const first = run(fixtureContent, [0, 2, 0]);
    let second = first;
    for (const id of ['inspect-drain', 'return-sink']) {
      const result = applyChoice(fixtureContent, second, command(second, id));
      if (!result.ok) throw new Error(result.error.code); second = result.state;
    }
    expect(guardKey(first)).toBe(guardKey(second));
    expect(stateHash(first)).not.toBe(stateHash(second));
    const ids = availableChoices(fixtureContent, first).map(choice => choice.id);
    expect(availableChoices(fixtureContent, second).map(choice => choice.id)).toEqual(ids);
    for (const id of ids) {
      const a = applyChoice(fixtureContent, first, command(first, id, 'a'));
      const b = applyChoice(fixtureContent, second, command(second, id, 'b'));
      expect(a.ok).toBe(true); expect(b.ok).toBe(true);
      if (a.ok && b.ok) expect(guardKey(a.state)).toBe(guardKey(b.state));
    }
  });
});
