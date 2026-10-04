import { describe, expect, it } from 'vitest';
import { evidenceFixture as content } from '../src/engine/evidence-fixture';
import {
  applyCommandV2, availableChoicesV2, availableHintsV2, availableInterpretationsV2,
  availableQuestionsV2, confirmationForV2, createGameV2, currentPassageV2,
  exportPortableV2, importPortableV2, projectPlayerV2, validateContentV2, validateStateV2,
  type CommandV2, type GameStateV2,
} from '../src/engine/evidence-v2';
import { canonicalJSON, stateHash } from '../src/engine/hash';

const start = () => createGameV2(content);
function run(state: GameStateV2, payload: Omit<CommandV2, 'id' | 'expectedRevision'> | Record<string, unknown>, confirm = false): GameStateV2 {
  const command = { ...payload, id: `v2.${state.revision}`, expectedRevision: state.revision } as CommandV2;
  const result = applyCommandV2(content, state, confirm ? { ...command, confirmation: confirmationForV2(state, command) } : command);
  if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
  return result.state;
}
const choose = (state: GameStateV2, choiceId: string) => run(state, { type: 'choose', choiceId });
const physical = () => choose(choose(start(), 'test-rinse'), 'return-sink');
const submit = (state: GameStateV2, selectedRefs: string[], candidateId = 'rinsing', questionId = 'ring-account') => applyCommandV2(content, state, { type: 'submitDeduction', id: `proof.${state.revision}`, expectedRevision: state.revision, questionId, candidateId, selectedRefs });
function accepted(state: GameStateV2, selectedRefs: string[], candidateId = 'rinsing', questionId = 'ring-account') {
  const result = submit(state, selectedRefs, candidateId, questionId);
  if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
  return result.state;
}
function rejected(state: GameStateV2, refs: string[], code: string, candidateId = 'rinsing', questionId = 'ring-account') {
  const before = canonicalJSON(state), result = submit(state, refs, candidateId, questionId);
  expect(result.ok).toBe(false);
  if (result.ok) throw new Error('Expected rejection');
  expect(result.error.code).toBe(code);
  expect(result.state).toBe(state);
  expect(canonicalJSON(state)).toBe(before);
  return result.error.message;
}

describe('explicit factual proofs', () => {
  it('accepts the physical AND route without implicitly selecting notebook items', () => {
    const state = physical();
    rejected(state, ['ring'], 'premature');
    const next = accepted(state, ['rinse', 'ring']);
    expect(next.deductions[0]).toMatchObject({ id: 'ring-account', candidateId: 'rinsing', selectedRefs: ['ring', 'rinse'], witnessRefs: ['ring', 'rinse'] });
    expect(next.sources).toHaveLength(2);
    expect(next.npcState[0].knows).not.toContain('ring-account');
  });
  it('accepts the alternate recording route after interpersonal failure', () => {
    let state = choose(start(), 'accuse');
    state = choose(state, 'return-worker');
    expect(availableChoicesV2(content, state).map(choice => choice.id)).not.toContain('ask-gently');
    state = accepted(choose(state, 'record-film'), ['film']);
    expect(state.deductions[0].witnessRefs).toEqual(['film']);
    expect(state.relationships[0].id).toBe('accusation');
    const command: CommandV2 = { type: 'choose', id: 'finish-after-failure', expectedRevision: state.revision, choiceId: 'finish' };
    const result = applyCommandV2(content, state, { ...command, confirmation: confirmationForV2(state, command) });
    expect(result.ok && result.state.ended).toBe(true);
  });
  it.each([{ refs: ['ring', 'nonexistent'] }, { refs: ['ring', 'film'] }, { refs: ['worker-private'] }])('rejects unknown or unearned references without naming expected material: $refs', ({ refs }) => {
    const message = rejected(start(), refs, 'unknown-reference');
    for (const hidden of ['rinse', 'film', 'worker-private', 'rinsing', 'PRIVATE']) expect(message).not.toContain(hidden);
  });
  it('rejects wrong candidates and distinguishes explicitly selected contradictions', () => {
    const message = rejected(start(), ['ring'], 'unsupported', 'drinking');
    expect(message).not.toContain('rinsing');
    expect(message).not.toContain('UNSEEN_FEEDBACK');
    rejected(physical(), ['ring', 'rinse'], 'contradictory', 'drinking');
  });
  it('rejects irrelevant supersets and accepts only declared corroborators', () => {
    let state = choose(physical(), 'inspect-aside');
    rejected(state, ['ring', 'rinse', 'aside'], 'irrelevant');
    state = choose(state, 'inspect-bottle');
    expect(accepted(state, ['ring', 'rinse', 'corroboration']).deductions).toHaveLength(1);
    rejected(state, state.sources.map(source => source.id), 'irrelevant');
  });
  it('rejects extras from another route unless authored as corroboration', () => {
    const state = choose(physical(), 'record-film');
    rejected(state, ['ring', 'rinse', 'film'], 'irrelevant');
  });
  it('distinguishes premature and irrelevant incomplete selections', () => {
    rejected(start(), [], 'premature');
    rejected(choose(start(), 'inspect-aside'), ['ring', 'aside'], 'irrelevant');
  });
  it('requires independent origins rather than testimony plus its transcription', () => {
    let state = choose(choose(start(), 'ask-gently'), 'read-copy');
    rejected(state, ['testimony', 'copy'], 'unsupported', 'independent', 'independence-account');
    state = choose(state, 'record-film');
    expect(accepted(state, ['film', 'copy'], 'independent', 'independence-account').deductions[0].witnessRefs).toEqual(['copy', 'film']);
  });
  it('checks transitive proof ancestry for duplicated provenance', () => {
    rejected(accepted(physical(), ['ring', 'rinse']), ['ring-account', 'ring'], 'unsupported', 'independent-ancestry', 'ancestry-account');
    const state = accepted(choose(start(), 'record-film'), ['film']);
    expect(accepted(state, ['ring-account', 'ring'], 'independent-ancestry', 'ancestry-account').deductions).toHaveLength(2);
  });
  it('allows a repeated internal origin in one deduction to be corroborated by a different origin', () => {
    const raw = structuredClone(content);
    raw.questions[0].proof = { op: 'all', args: [{ op: 'ref', refId: 'testimony' }, { op: 'ref', refId: 'copy' }] };
    const checked = validateContentV2(raw);
    if (!checked.ok) throw new Error(checked.errors.join('\n'));
    let state = createGameV2(checked.value);
    const actions: Record<string, unknown>[] = [
      { type: 'choose', choiceId: 'ask-gently' }, { type: 'choose', choiceId: 'read-copy' },
      { type: 'submitDeduction', questionId: 'ring-account', candidateId: 'rinsing', selectedRefs: ['testimony', 'copy'] },
      { type: 'submitDeduction', questionId: 'ancestry-account', candidateId: 'independent-ancestry', selectedRefs: ['ring-account', 'ring'] },
    ];
    for (const action of actions) { const result = applyCommandV2(checked.value, state, { ...action, id: `origin-set.${state.revision}`, expectedRevision: state.revision }); if (!result.ok) throw new Error(result.error.message); state = result.state; }
    expect(state.deductions).toHaveLength(2);
  });
  it('does not treat interpretation or relationship records as factual references', () => {
    let state = run(physical(), { type: 'reviewInterpretation', interpretationId: 'ring-reading' });
    state = choose(state, 'accuse');
    rejected(state, ['ring-reading'], 'unknown-reference');
    rejected(state, ['accusation'], 'unknown-reference');
    expect(state.deductions).toEqual([]);
  });
  it('rejects duplicate selected IDs and unavailable claim identifiers generically', () => {
    rejected(physical(), ['ring', 'ring', 'rinse'], 'invalid-command');
    rejected(start(), ['ring'], 'unavailable-question', 'hidden-candidate');
  });
});

describe('knowledge, readings and guarded hints', () => {
  it('hearing a private statement changes player heard-state and speaker claims, not the listener', () => {
    const first = start(), heard = choose(first, 'ask-gently');
    expect(heard.sources.some(source => source.id === 'testimony')).toBe(true);
    expect(heard.observations.some(source => source.id === 'testimony')).toBe(false);
    expect(heard.npcState.find(npc => npc.id === 'worker')).toEqual(first.npcState.find(npc => npc.id === 'worker'));
    expect(heard.npcState.find(npc => npc.id === 'witness')?.claims).toEqual([{ sourceId: 'testimony', revision: 1 }]);
    expect(heard.npcState.find(npc => npc.id === 'witness')?.believes).toEqual(['cup-was-drunk-from']);
    expect(JSON.stringify(projectPlayerV2(content, heard))).not.toContain('isTrue');
    expect(currentPassageV2(choose(heard, 'visit-worker')).paragraphs).toEqual(currentPassageV2(choose(first, 'visit-worker')).paragraphs);
  });
  it('actual disclosure changes listener knowledge and a later guarded scene', () => {
    const heard = choose(start(), 'ask-gently');
    const shared = choose(heard, 'disclose-worker');
    expect(shared.npcState.find(npc => npc.id === 'worker')?.knows).toContain('testimony');
    expect(shared.npcState.find(npc => npc.id === 'worker')?.believes).toContain('cup-was-drunk-from');
    expect(currentPassageV2(shared).paragraphs[0]).toContain('DISCLOSED_RESPONSE');
    expect(currentPassageV2(heard).paragraphs[0]).not.toContain('DISCLOSED_RESPONSE');
    const unavailable = applyCommandV2(content, start(), { type: 'choose', id: 'unearned-disclosure', expectedRevision: 0, choiceId: 'disclose-worker' });
    expect(unavailable.ok).toBe(false);
  });
  it('computes finite chained interpretation availability without submitting any judgment', () => {
    const initial = start(), state = physical();
    expect(availableInterpretationsV2(content, initial)).toEqual([]);
    expect(state.eligibleInterpretations.map(rule => rule.id)).toEqual(['ring-reading', 'second-reading']);
    expect(state.interpretations).toEqual([]);
    expect(state.deductions).toEqual([]);
    expect(state.sources.map(source => source.id)).toEqual(['ring', 'rinse']);
    expect(exportPortableV2(state)).not.toContain('UNSEEN_READING');
    const reviewed = run(state, { type: 'reviewInterpretation', interpretationId: 'ring-reading' });
    expect(reviewed.interpretations[0].text).toContain('UNSEEN_READING');
    expect(reviewed.deductions).toEqual([]);
    expect(availableInterpretationsV2(content, choose(reviewed, 'cup')).map(rule => rule.id)).toEqual(['second-reading']);
  });
  it('keeps unavailable hint text hidden and requires a state-bound reveal receipt', () => {
    const initial = start();
    expect(availableHintsV2(content, initial).map(hint => hint.id)).not.toContain('later-hint');
    expect(exportPortableV2(initial)).not.toContain('LATER_HINT');
    const locked = applyCommandV2(content, initial, { type: 'requestHint', id: 'locked-hint', expectedRevision: 0, hintId: 'later-hint' });
    expect(locked.ok).toBe(false);
    const command: CommandV2 = { type: 'requestHint', id: 'reveal', expectedRevision: 0, hintId: 'film-reveal' };
    const missing = applyCommandV2(content, initial, command);
    expect(!missing.ok && missing.error.code).toBe('confirmation-required');
    const revealed = applyCommandV2(content, initial, { ...command, confirmation: confirmationForV2(initial, command) });
    expect(revealed.ok).toBe(true);
    if (!revealed.ok) return;
    expect(revealed.state.sources.map(source => source.id)).toEqual(['ring', 'film']);
    expect(revealed.state.deductions).toEqual([]);
    expect(exportPortableV2(revealed.state)).toContain('EXPLICIT_REVEAL');
  });
  it('captures an ordinary hint without acquiring unseen material', () => {
    const state = run(start(), { type: 'requestHint', hintId: 'ring-hint' });
    expect(state.sources.map(source => source.id)).toEqual(['ring']);
    expect(state.hints).toHaveLength(1);
    expect(availableHintsV2(content, state).map(hint => hint.id)).not.toContain('ring-hint');
  });
});

describe('determinism, transcripts, portability and hostile inputs', () => {
  it('replays a proof, reading, consequence, ending and exact captured text', () => {
    let state = run(physical(), { type: 'reviewInterpretation', interpretationId: 'ring-reading' });
    state = accepted(state, ['ring', 'rinse']);
    state = run(state, { type: 'choose', choiceId: 'finish' }, true);
    const text = exportPortableV2(state), imported = importPortableV2(content, text);
    expect(imported.ok).toBe(true);
    if (!imported.ok) return;
    expect(stateHash(imported.value)).toBe(stateHash(state));
    expect(imported.value.transcript).toEqual(state.transcript);
    expect(validateStateV2(content, state).ok).toBe(true);
    expect(Object.isFrozen(imported.value)).toBe(true);
    expect(Object.isFrozen(imported.value.transcript)).toBe(true);
  });
  it('keeps originals on revisit and does not reacquire a changed observation', () => {
    const original = start(), firstSource = original.sources[0], revisited = physical();
    expect(revisited.sources[0]).toEqual(firstSource);
    expect(revisited.transcript.filter(event => event.kind === 'passage')[0]).toEqual(original.transcript[0]);
    expect(currentPassageV2(revisited).paragraphs[0]).toContain('REVISIT_PASSAGE');
    expect(exportPortableV2(revisited)).toContain('ORIGINAL_PASSAGE');
    const passage = currentPassageV2(revisited);
    expect('variantId' in passage && passage.variantId).toBe('bench.after-rinse');
    expect('blocks' in passage && passage.blocks[0].id).toBe('bench.revisited');
  });
  it('exports no unencountered bodies, NPC secrets, proof answers or variant prose', () => {
    const text = exportPortableV2(start()), view = JSON.stringify(projectPlayerV2(content, start()));
    for (const sentinel of ['PRIVATE_TITLE', 'PRIVATE_NPC', 'worker-private-belief', 'UNSEEN_FILM', 'UNSEEN_READING', 'UNSEEN_FEEDBACK', 'LATER_HINT', 'EXPLICIT_REVEAL', 'REVISIT_PASSAGE', 'DISCLOSED_RESPONSE', 'supportedCandidateId', 'npcState', 'proof']) {
      expect(text).not.toContain(sentinel);
      expect(view).not.toContain(sentinel);
    }
    expect(availableQuestionsV2(content, start())[0]).not.toHaveProperty('proof');
  });
  it('returns the identical state for duplicate IDs before stale or ending checks', () => {
    const state = physical(), command: CommandV2 = { type: 'submitDeduction', id: 'duplicate-proof', expectedRevision: state.revision, questionId: 'ring-account', candidateId: 'rinsing', selectedRefs: ['ring', 'rinse'] };
    const first = applyCommandV2(content, state, command);
    if (!first.ok) throw new Error(first.error.message);
    const next = run(first.state, { type: 'choose', choiceId: 'finish' }, true);
    const duplicate = applyCommandV2(content, next, command);
    expect(duplicate.ok && duplicate.duplicate).toBe(true);
    expect(duplicate.state).toBe(next);
    const stale = applyCommandV2(content, first.state, { ...command, id: 'other-id' });
    expect(!stale.ok && stale.error.code).toBe('stale-command');
  });
  it('binds confirmations to every typed payload field and exact state', () => {
    const initial = start(), command: CommandV2 = { type: 'requestHint', id: 'acknowledged', expectedRevision: 0, hintId: 'film-reveal' };
    const confirmation = confirmationForV2(initial, command);
    const changedHint = applyCommandV2(content, initial, { ...command, hintId: 'ring-hint', confirmation });
    expect(!changedHint.ok && changedHint.error.code).toBe('confirmation-required');
    const changedState = choose(initial, 'cup');
    const changedRevision = applyCommandV2(content, changedState, { ...command, expectedRevision: 1, confirmation });
    expect(!changedRevision.ok && changedRevision.error.code).toBe('confirmation-required');
    const proof: CommandV2 = { type: 'submitDeduction', id: 'bound-proof', expectedRevision: 2, questionId: 'ring-account', candidateId: 'rinsing', selectedRefs: ['ring', 'rinse'] };
    const state = physical();
    const changedRefs = applyCommandV2(content, state, { ...proof, selectedRefs: ['ring'], confirmation: confirmationForV2(state, proof) });
    expect(!changedRefs.ok && changedRefs.error.code).toBe('confirmation-required');
  });
  it('rejects seen-text forgery even when its checksum is recomputed', () => {
    const envelope = JSON.parse(exportPortableV2(physical()));
    envelope.seen.transcript[0].paragraphs[0] = 'Forged delivered text';
    envelope.seenChecksum = stateHash(envelope.seen);
    expect(importPortableV2(content, envelope).ok).toBe(false);
  });
  it('rejects tampered internal NPC state and replay commands', () => {
    const checkpoint = structuredClone(physical());
    checkpoint.npcState[0].knows.push('rinse');
    expect(validateStateV2(content, checkpoint).ok).toBe(false);
    const envelope = JSON.parse(exportPortableV2(physical()));
    envelope.commands[0].expectedRevision = 1;
    expect(importPortableV2(content, envelope).ok).toBe(false);
    envelope.commands = [envelope.commands[0], envelope.commands[0]];
    expect(importPortableV2(content, envelope).ok).toBe(false);
  });
  it('rejects corrupt, cross-hash, unsupported, oversized and cyclic envelopes', () => {
    expect(importPortableV2(content, '{broken').ok).toBe(false);
    const envelope = JSON.parse(exportPortableV2(start()));
    envelope.content.hash = '0'.repeat(64);
    expect(importPortableV2(content, envelope).ok).toBe(false);
    const unsupported = JSON.parse(exportPortableV2(start()));
    unsupported.authorEvents = [];
    expect(importPortableV2(content, unsupported).ok).toBe(false);
    expect(importPortableV2(content, ' '.repeat(10 * 1024 * 1024 + 1)).ok).toBe(false);
    const cyclic: Record<string, unknown> = {}; cyclic.self = cyclic;
    expect(importPortableV2(content, cyclic).ok).toBe(false);
  });
  it('rejects raw author events and bounded-expression violations', () => {
    const author = structuredClone(content) as unknown as Record<string, unknown>; author.authorEvents = [{ secret: 'hidden event' }];
    expect(validateContentV2(author).ok).toBe(false);
    const deep = structuredClone(content);
    let guard: unknown = { op: 'always' }; for (let index = 0; index < 9; index++) guard = { op: 'all', args: [guard] };
    deep.scenes[0].choices[0].when = guard as never;
    expect(validateContentV2(deep)).toMatchObject({ ok: false });
    const nonmonotonic = structuredClone(content);
    nonmonotonic.interpretationRules[0].when = { op: 'not', arg: { op: 'hasSource', id: 'rinse' } };
    expect(validateContentV2(nonmonotonic).ok).toBe(false);
    const cyclicReading = structuredClone(content);
    cyclicReading.interpretationRules[0].when = { op: 'interpretationAvailable', id: 'second-reading' };
    expect(validateContentV2(cyclicReading).ok).toBe(false);
  });
  it('rejects unsupported proof complexity, false independence, missing refs and unseeded cycles', () => {
    const complex = structuredClone(content);
    complex.questions[0].proof = { op: 'all', args: Array.from({ length: 9 }, () => ({ op: 'any' as const, args: [{ op: 'ref' as const, refId: 'ring' }, { op: 'ref' as const, refId: 'rinse' }] })) };
    expect(validateContentV2(complex).ok).toBe(false);
    const dependence = structuredClone(content);
    dependence.questions[1].proof = { op: 'all', independent: true, args: [{ op: 'ref', refId: 'testimony' }, { op: 'ref', refId: 'copy' }] };
    expect(validateContentV2(dependence).ok).toBe(false);
    const missing = structuredClone(content); missing.questions[0].proof = { op: 'ref', refId: 'missing' };
    expect(validateContentV2(missing).ok).toBe(false);
    const cycle = structuredClone(content); cycle.questions[0].proof = { op: 'ref', refId: 'ancestry-account' };
    expect(validateContentV2(cycle).ok).toBe(false);
  });
  it('validates content size before cloning and rejects cyclic authored data', () => {
    const huge = structuredClone(content);
    huge.scenes[0].paragraphs = Array.from({ length: 200 }, () => 'x'.repeat(50000));
    huge.scenes[1].paragraphs = Array.from({ length: 200 }, () => 'x'.repeat(50000));
    expect(validateContentV2(huge)).toMatchObject({ ok: false, errors: ['content: exceeds 10 MB'] });
    const cyclic = structuredClone(content) as unknown as Record<string, unknown>; cyclic.self = cyclic;
    expect(validateContentV2(cyclic).ok).toBe(false);
  });
});
