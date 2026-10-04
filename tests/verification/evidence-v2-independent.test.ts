import { mkdirSync, writeFileSync } from 'node:fs';
import { describe, expect, test, vi } from 'vitest';
import fc from 'fast-check';
import {
  applyCommandV2, availableChoicesV2, availableHintsV2, availableInterpretationsV2,
  availableQuestionsV2, confirmationForV2, createGameV2, exportPortableV2,
  importPortableV2, projectPlayerV2, validateContentV2, validateStateV2,
  type CommandV2, type ContentV2, type GameStateV2, type LegacySeedV2,
  type MigrationManifestV2, type ProofV2, type ReplayContextV2,
} from '../../src/engine/evidence-v2';
import { applyChoice, confirmationFor, createGame, validateContent, type Content, type GameState } from '../../src/engine/game';
import { canonicalJSON, contentHash, stateHash } from '../../src/engine/hash';

// Independent, noncanonical latch investigation. This is not the engineer's cup fixture.
function draft(): ContentV2 {
  return {
    schemaVersion: 2, id: 'verification-latch', title: 'Noncanonical latch experiment', version: 2, start: 'room',
    beliefIds: ['saw-move', 'alleged-no-move', 'NPC-BELIEF-SECRET'],
    characters: [
      { id: 'porter', name: 'Porter', initial: { knows: ['photo'], believes: ['saw-move'], claims: [] } },
      { id: 'caretaker', name: 'Caretaker', initial: { knows: [], believes: [], claims: [] } },
      { id: 'archivist', name: 'Archivist', initial: { knows: ['SEALED-SOURCE-ID'], believes: ['NPC-BELIEF-SECRET'], claims: [] } },
    ],
    sources: [
      { id: 'smudge', title: 'Grease on the latch', text: 'Fresh grease marks the latch.', kind: 'observation', provenanceId: 'inspection' },
      { id: 'photo', title: 'A photograph', text: 'The photograph shows the latch displaced.', kind: 'document', provenanceId: 'camera' },
      { id: 'log', title: 'The maintenance entry', text: 'The entry records work on the latch.', kind: 'document', provenanceId: 'maintenance' },
      { id: 'receipt', title: 'The delivery receipt', text: 'Replacement grease arrived that morning.', kind: 'document', provenanceId: 'delivery' },
      { id: 'testimony', title: 'Private statement', text: 'The porter says nobody moved the latch.', kind: 'statement', provenanceId: 'porter-account', speakerId: 'porter', claimIds: ['alleged-no-move'] },
      { id: 'copy', title: 'A copied statement', text: 'This is a copy of the porter account.', kind: 'document', provenanceId: 'porter-account' },
      { id: 'SEALED-SOURCE-ID', title: 'SEALED-TITLE-SECRET', text: 'SEALED-LITERAL-SECRET', kind: 'document', provenanceId: 'sealed-origin' },
    ],
    questions: [
      {
        id: 'latch-event', text: 'What supports the account of recent work?',
        candidates: [{ id: 'worked', text: 'The latch was recently worked on.' }, { id: 'untouched', text: 'The latch was untouched.', contradictedBy: ['photo'] }],
        supportedCandidateId: 'worked',
        proof: { op: 'all', args: [
          { op: 'any', args: [{ op: 'ref', refId: 'smudge' }, { op: 'ref', refId: 'photo' }] },
          { op: 'any', args: [{ op: 'ref', refId: 'log' }, { op: 'ref', refId: 'receipt' }] },
        ] },
        allowedCorroborators: ['testimony'], feedback: [{ code: 'premature', text: 'FEEDBACK-SEALED-SECRET', mentions: ['SEALED-SOURCE-ID'] }], effects: ['finding'],
      },
      { id: 'story', text: 'Is the copied account supported as an account?', candidates: [{ id: 'account', text: 'The written and spoken accounts agree.' }], supportedCandidateId: 'account', proof: { op: 'all', args: [{ op: 'ref', refId: 'testimony' }, { op: 'ref', refId: 'copy' }] }, allowedCorroborators: [], feedback: [] },
      { id: 'independent-story', text: 'Is there independent corroboration?', candidates: [{ id: 'corroborated', text: 'The account has an independent source.' }], supportedCandidateId: 'corroborated', proof: { op: 'all', independent: true, args: [{ op: 'ref', refId: 'story' }, { op: 'ref', refId: 'photo' }] }, allowedCorroborators: [], feedback: [] },
      { id: 'reused-story', text: 'Does the original account add another origin?', candidates: [{ id: 'separate', text: 'The original is a separate origin.' }], supportedCandidateId: 'separate', proof: { op: 'all', independent: true, args: [{ op: 'ref', refId: 'story' }, { op: 'ref', refId: 'testimony' }] }, allowedCorroborators: [], feedback: [] },
      { id: 'ancestry', text: 'Does the photograph add a fresh origin?', candidates: [{ id: 'fresh', text: 'The photograph adds a fresh origin.' }], supportedCandidateId: 'fresh', proof: { op: 'all', independent: true, args: [{ op: 'ref', refId: 'latch-event' }, { op: 'ref', refId: 'photo' }] }, allowedCorroborators: [], feedback: [] },
      { id: 'SEALED-QUESTION-ID', text: 'SEALED-QUESTION-TEXT', when: { op: 'hasSource', id: 'SEALED-SOURCE-ID' }, candidates: [{ id: 'sealed', text: 'SEALED-CANDIDATE-TEXT' }], supportedCandidateId: 'sealed', proof: { op: 'ref', refId: 'SEALED-SOURCE-ID' }, allowedCorroborators: [], feedback: [] },
    ],
    interpretationRules: [
      { id: 'c-chain', title: 'A further reading', text: 'UNSEEN-READING-SECRET-C', when: { op: 'flag', id: 'reading-ready' }, relatedRefs: ['smudge'] },
      { id: 'b-chain', title: 'Compare the entry', text: 'UNSEEN-READING-SECRET-B', when: { op: 'interpretationAvailable', id: 'a-seed' }, relatedRefs: ['log'], effects: ['reading-ready'] },
      { id: 'a-seed', title: 'Reconsider the grease', text: 'UNSEEN-READING-SECRET-A', when: { op: 'hasSource', id: 'smudge' }, relatedRefs: ['smudge'] },
      { id: 'sealed-reading', title: 'SEALED-READING-TITLE', text: 'SEALED-READING-TEXT', when: { op: 'always' }, relatedRefs: ['SEALED-SOURCE-ID'] },
    ],
    hints: [
      { id: 'ordinary-help', label: 'Consider what you have inspected', questionId: 'latch-event', when: { op: 'always' }, mentions: ['smudge'], text: 'Compare the material you selected.', reveals: false },
      { id: 'sealed-help', label: 'HIDDEN-HINT-LABEL', questionId: 'latch-event', when: { op: 'always' }, mentions: ['SEALED-SOURCE-ID'], text: 'HIDDEN-HINT-TEXT', reveals: false },
      { id: 'reveal-note', label: 'Reveal an archived note', questionId: 'latch-event', when: { op: 'always' }, mentions: ['smudge'], text: 'The archived note is now available.', reveals: true, sourceIds: ['SEALED-SOURCE-ID'] },
    ],
    scenes: [{
      id: 'room', title: 'The work room', paragraphs: ['The latch stands beside the work bench.'], sourceIds: ['smudge'],
      variants: [
        { id: 'informed', requires: [], when: { op: 'npcKnows', characterId: 'caretaker', refId: 'testimony' }, paragraphs: ['The caretaker answers about the statement you disclosed.'] },
        { id: 'sealed', requires: [], when: { op: 'hasSource', id: 'SEALED-SOURCE-ID' }, paragraphs: ['FUTURE-PARAGRAPH-SECRET'] },
      ],
      choices: [
        ...['photo', 'log', 'receipt', 'testimony', 'copy'].map(id => ({ id: `get-${id}`, label: `Inspect ${id}`, target: 'room', actions: [{ type: 'acquireSource' as const, sourceId: id }] })),
        { id: 'disclose', label: 'Tell the caretaker the private account', target: 'room', actions: [{ type: 'disclose', characterId: 'caretaker', refId: 'testimony' }] },
        { id: 'persuade', label: 'Invite the porter to revise a belief', target: 'room', actions: [{ type: 'setBelief', characterId: 'porter', beliefId: 'saw-move', value: false }] },
        { id: 'unguarded-disclose', label: 'Disclose unseen archive material', target: 'room', actions: [{ type: 'disclose', characterId: 'caretaker', refId: 'SEALED-SOURCE-ID' }] },
        { id: 'finish', label: 'Finish this noncanonical run', target: 'room', ending: true, when: { op: 'hasDeduction', id: 'latch-event' } },
      ],
    }],
  };
}
function checked(value: unknown = draft()): ContentV2 {
  const result = validateContentV2(value);
  if (!result.ok) throw new Error(result.errors.join('\n'));
  return result.value;
}
function command(state: GameStateV2, body: Omit<Extract<CommandV2, { type: 'choose' }>, 'id' | 'expectedRevision'> | Omit<Extract<CommandV2, { type: 'submitDeduction' }>, 'id' | 'expectedRevision'> | Omit<Extract<CommandV2, { type: 'requestHint' }>, 'id' | 'expectedRevision'> | Omit<Extract<CommandV2, { type: 'reviewInterpretation' }>, 'id' | 'expectedRevision'>): CommandV2 {
  return { ...body, id: `independent.${state.revision}`, expectedRevision: state.revision } as CommandV2;
}
function advance(content: ContentV2, state: GameStateV2, body: Parameters<typeof command>[1], confirm = false): GameStateV2 {
  const payload = command(state, body);
  const result = applyCommandV2(content, state, confirm ? { ...payload, confirmation: confirmationForV2(state, payload) } : payload);
  if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
  expect(result.duplicate).toBe(false);
  return result.state;
}
function collect(content: ContentV2, ids = ['photo', 'log', 'receipt', 'testimony', 'copy']): GameStateV2 {
  return ids.reduce((state, id) => advance(content, state, { type: 'choose', choiceId: `get-${id}` }), createGameV2(content));
}
function submit(content: ContentV2, state: GameStateV2, refs: string[], questionId = 'latch-event', candidateId = 'worked') {
  return applyCommandV2(content, state, command(state, { type: 'submitDeduction', questionId, candidateId, selectedRefs: refs }));
}
function accepted(content: ContentV2, state: GameStateV2, refs: string[], questionId = 'latch-event', candidateId = 'worked'): GameStateV2 {
  const result = submit(content, state, refs, questionId, candidateId);
  if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
  return result.state;
}
function expectRejected(content: ContentV2, state: GameStateV2, input: unknown, code?: string): void {
  const before = canonicalJSON(state), result = applyCommandV2(content, state, input);
  expect(result.ok).toBe(false);
  expect(result.state).toBe(state);
  expect(canonicalJSON(state)).toBe(before);
  if (!result.ok && code) expect(result.error.code).toBe(code);
}

describe('independent nested selected proofs and origins', () => {
  test('all 64 selected subsets obey four authored witness alternatives and only one permitted extra', () => {
    const content = checked(), state = collect(content);
    const ids = ['smudge', 'photo', 'log', 'receipt', 'testimony', 'copy'];
    const acceptable = new Set(['log,smudge', 'receipt,smudge', 'log,photo', 'photo,receipt', 'log,smudge,testimony', 'receipt,smudge,testimony', 'log,photo,testimony', 'photo,receipt,testimony']);
    for (let mask = 0; mask < 64; mask++) {
      const selected = ids.filter((_, i) => mask & (1 << i)), before = canonicalJSON(state);
      const result = submit(content, state, selected);
      expect(result.ok, `selection ${selected}`).toBe(acceptable.has([...selected].sort().join(',')));
      if (result.ok) {
        expect(result.state.deductions[0].selectedRefs).toEqual([...selected].sort());
        expect(result.state.deductions[0].witnessRefs).toHaveLength(2);
        expect(validateStateV2(content, result.state).ok).toBe(true);
      } else expect(result.state).toBe(state);
      expect(canonicalJSON(state)).toBe(before);
    }
  });
  test('notebook possession cannot substitute for explicitly selected evidence', () => {
    const content = checked(), state = collect(content);
    expectRejected(content, state, command(state, { type: 'submitDeduction', questionId: 'latch-event', candidateId: 'worked', selectedRefs: [] }), 'premature');
    expectRejected(content, state, command(state, { type: 'submitDeduction', questionId: 'latch-event', candidateId: 'worked', selectedRefs: ['smudge'] }), 'premature');
  });
  test('unknown, unseen and duplicate references reject without exposing guarded feedback', () => {
    const content = checked(), state = createGameV2(content);
    for (const refs of [['does-not-exist'], ['SEALED-SOURCE-ID'], ['smudge', 'smudge']]) {
      const result = submit(content, state, refs);
      expect(result.ok).toBe(false); expect(result.state).toBe(state);
      expect(JSON.stringify(result)).not.toContain('FEEDBACK-SEALED-SECRET');
    }
    expect(submit(content, state, ['smudge'])).toMatchObject({ ok: false, error: { code: 'premature' } });
  });
  test('contradiction depends on selected known evidence; unsupported claim does not name the answer', () => {
    const content = checked(), state = collect(content);
    expect(submit(content, state, ['photo'], 'latch-event', 'untouched')).toMatchObject({ ok: false, error: { code: 'contradictory' } });
    const result = submit(content, state, ['smudge'], 'latch-event', 'untouched');
    expect(result).toMatchObject({ ok: false, error: { code: 'unsupported' } });
    if (!result.ok) expect(result.error.message).not.toContain('worked');
  });
  test('a deduction with internally repeated origin can be independently corroborated by a new origin', () => {
    const content = checked();
    const state = accepted(content, collect(content), ['testimony', 'copy'], 'story', 'account');
    const result = submit(content, state, ['story', 'photo'], 'independent-story', 'corroborated');
    expect(result.ok, JSON.stringify(result.ok ? result.state.deductions : result.error)).toBe(true);
  });
  test('a deduction plus its own source cannot manufacture independent support', () => {
    const content = checked(), state = accepted(content, collect(content), ['testimony', 'copy'], 'story', 'account');
    expectRejected(content, state, command(state, { type: 'submitDeduction', questionId: 'reused-story', candidateId: 'separate', selectedRefs: ['story', 'testimony'] }), 'unsupported');
  });
  test('the actual recorded ancestry matters even when accepted deduction IDs match', () => {
    const content = checked(), notebook = collect(content);
    const independent = accepted(content, notebook, ['smudge', 'log']);
    const overlapping = accepted(content, notebook, ['photo', 'log']);
    expect(submit(content, independent, ['latch-event', 'photo'], 'ancestry', 'fresh').ok).toBe(true);
    expect(submit(content, overlapping, ['latch-event', 'photo'], 'ancestry', 'fresh')).toMatchObject({ ok: false, error: { code: 'unsupported' } });
  });
  test('direct copied origins and repeated refs cannot satisfy an independent AND', () => {
    for (const refs of [['testimony', 'copy'], ['photo', 'photo']]) {
      const value = draft(); value.questions[0].proof = { op: 'all', independent: true, args: refs.map(refId => ({ op: 'ref', refId })) };
      expect(validateContentV2(value)).toMatchObject({ ok: false });
    }
  });
});

describe('independent knowledge and projection boundaries', () => {
  test('hearing a claim changes neither an uninformed NPC nor the speaker belief', () => {
    const content = checked(), initial = createGameV2(content);
    const heard = advance(content, initial, { type: 'choose', choiceId: 'get-testimony' });
    expect(heard.npcState.find(npc => npc.id === 'caretaker')).toEqual(initial.npcState.find(npc => npc.id === 'caretaker'));
    expect(heard.npcState.find(npc => npc.id === 'porter')?.believes).toEqual(['saw-move']);
    expect(heard.npcState.find(npc => npc.id === 'porter')?.claims).toEqual([{ sourceId: 'testimony', revision: 1 }]);
    expect(heard.deductions).toEqual([]);
    expect(heard.observations.map(record => record.id)).not.toContain('testimony');
    expect(projectPlayerV2(content, heard).passage.paragraphs[0]).toBe('The latch stands beside the work bench.');
  });
  test('only an actual disclosure informs the chosen NPC and changes an authored response', () => {
    const content = checked(), heard = collect(content, ['testimony']);
    const disclosed = advance(content, heard, { type: 'choose', choiceId: 'disclose' });
    expect(disclosed.npcState.find(npc => npc.id === 'caretaker')?.knows).toEqual(['testimony']);
    expect(disclosed.npcState.find(npc => npc.id === 'archivist')).toEqual(heard.npcState.find(npc => npc.id === 'archivist'));
    expect(projectPlayerV2(content, disclosed).passage.paragraphs).toEqual(['The caretaker answers about the statement you disclosed.']);
    expect(disclosed.transcript.slice(0, heard.transcript.length)).toEqual(heard.transcript);
    const repeated = advance(content, disclosed, { type: 'choose', choiceId: 'disclose' });
    expect(repeated.npcState.find(npc => npc.id === 'caretaker')?.knows).toEqual(['testimony']);
  });
  test('unearned disclosure is unavailable and cannot be dispatched', () => {
    const content = checked(), state = createGameV2(content);
    expect(availableChoicesV2(content, state).map(choice => choice.id)).not.toContain('unguarded-disclose');
    expectRejected(content, state, command(state, { type: 'choose', choiceId: 'unguarded-disclose' }), 'unavailable-choice');
  });
  test('belief revision leaves claim, source, player history and factual deductions distinct', () => {
    const content = checked(), heard = collect(content, ['testimony']);
    const revised = advance(content, heard, { type: 'choose', choiceId: 'persuade' });
    expect(revised.npcState.find(npc => npc.id === 'porter')?.believes).toEqual([]);
    expect(revised.npcState.find(npc => npc.id === 'porter')?.claims).toEqual(heard.npcState.find(npc => npc.id === 'porter')?.claims);
    expect(revised.sources).toEqual(heard.sources); expect(revised.deductions).toEqual([]);
    expect(revised.transcript.slice(0, heard.transcript.length)).toEqual(heard.transcript);
  });
  test('projection and portable export omit hidden source, NPC, proof and unseen reading sentinels', () => {
    const content = checked(), state = createGameV2(content);
    const texts = [JSON.stringify(projectPlayerV2(content, state)), exportPortableV2(state)];
    for (const text of texts) for (const marker of ['SEALED-SOURCE-ID', 'SEALED-TITLE-SECRET', 'SEALED-LITERAL-SECRET', 'SEALED-QUESTION-TEXT', 'SEALED-CANDIDATE-TEXT', 'NPC-BELIEF-SECRET', 'UNSEEN-READING-SECRET', 'FUTURE-PARAGRAPH-SECRET', 'HIDDEN-HINT-LABEL', 'supportedCandidateId', '"proof"', '"npcState"']) expect(text).not.toContain(marker);
    expect(availableQuestionsV2(content, state).map(question => question.id)).not.toContain('SEALED-QUESTION-ID');
    expect(availableHintsV2(content, state).map(hint => hint.id)).not.toContain('sealed-help');
    expect(availableInterpretationsV2(content, state).map(rule => rule.id)).not.toContain('sealed-reading');
  });
  test('eligible reading does not expose its prose before explicit review', () => {
    const content = checked(), state = createGameV2(content);
    expect(state.eligibleInterpretations.map(reading => reading.id)).toEqual(['a-seed']);
    const reviewed = advance(content, state, { type: 'reviewInterpretation', interpretationId: 'a-seed' });
    expect(exportPortableV2(reviewed)).toContain('UNSEEN-READING-SECRET-A');
    expect(reviewed.sources).toEqual(state.sources); expect(reviewed.deductions).toEqual([]);
  });
  test('explicit hint reveal needs a fresh state/payload receipt and never auto-deduces', () => {
    const content = checked(), state = createGameV2(content), payload = command(state, { type: 'requestHint', hintId: 'reveal-note' });
    expectRejected(content, state, payload, 'confirmation-required');
    const after = advance(content, state, { type: 'requestHint', hintId: 'ordinary-help' });
    expectRejected(content, after, { ...payload, id: 'new-reveal', expectedRevision: after.revision, confirmation: confirmationForV2(state, payload) }, 'confirmation-required');
    const revealed = advance(content, after, { type: 'requestHint', hintId: 'reveal-note' }, true);
    expect(revealed.sources.map(source => source.id)).toContain('SEALED-SOURCE-ID'); expect(revealed.deductions).toEqual([]);
    expect(exportPortableV2(revealed)).toContain('SEALED-LITERAL-SECRET');
  });
});

describe('independent closure, schema bounds and command properties', () => {
  test('all authored rule orders give the same finite closure after related material arrives', () => {
    const original = draft().interpretationRules;
    for (const order of [original, [...original].reverse(), [original[2], original[0], original[3], original[1]]]) {
      const value = draft(); value.interpretationRules = order;
      const content = checked(value), before = createGameV2(content), after = collect(content, ['log']);
      expect(before.eligibleInterpretations.map(rule => rule.id)).toEqual(['a-seed']);
      expect(after.eligibleInterpretations.map(rule => rule.id)).toEqual(['a-seed', 'b-chain', 'c-chain']);
      expect(after.deductions).toEqual([]);
      const repeated = advance(content, after, { type: 'choose', choiceId: 'get-log' });
      expect(repeated.eligibleInterpretations).toEqual(after.eligibleInterpretations);
      expect(repeated.sources).toEqual(after.sources);
    }
  });
  test('unseeded reading cycles and nonmonotonic closure predicates are rejected', () => {
    const cycle = draft(); cycle.interpretationRules = [
      { id: 'cycle-a', title: 'A', text: 'A', when: { op: 'interpretationAvailable', id: 'cycle-b' }, relatedRefs: [] },
      { id: 'cycle-b', title: 'B', text: 'B', when: { op: 'interpretationAvailable', id: 'cycle-a' }, relatedRefs: [] },
    ];
    expect(validateContentV2(cycle)).toMatchObject({ ok: false });
    for (const when of [{ op: 'not', arg: { op: 'hasSource', id: 'smudge' } }, { op: 'npcBelieves', characterId: 'porter', beliefId: 'saw-move' }]) {
      const value = draft(); value.interpretationRules[0].when = when as ContentV2['interpretationRules'][number]['when'];
      expect(validateContentV2(value)).toMatchObject({ ok: false });
    }
  });
  test('empty proofs, independent OR, depth/node excess and 512 witness expansion safely reject', () => {
    const cases: unknown[] = [{ op: 'all', args: [] }, { op: 'any', independent: true, args: [{ op: 'ref', refId: 'smudge' }] }, { op: 'all', args: Array.from({ length: 65 }, () => ({ op: 'ref', refId: 'smudge' })) }];
    let deep: ProofV2 = { op: 'ref', refId: 'smudge' }; for (let i = 0; i < 9; i++) deep = { op: 'all', args: [deep] }; cases.push(deep);
    cases.push({ op: 'all', args: Array.from({ length: 9 }, () => ({ op: 'any', args: [{ op: 'ref', refId: 'smudge' }, { op: 'ref', refId: 'photo' }] })) });
    for (const proof of cases) { const value = draft(); value.questions[0].proof = proof as ProofV2; expect(() => validateContentV2(value)).not.toThrow(); expect(validateContentV2(value).ok).toBe(false); }
    const cyclic: { op: string; arg?: unknown } = { op: 'not' }; cyclic.arg = cyclic;
    const value = draft(); value.scenes[0].when = cyclic as never;
    expect(() => validateContentV2(value)).not.toThrow(); expect(validateContentV2(value).ok).toBe(false);
  });
  test('valid expression and 256-expansion boundaries remain executable while the next expression node rejects', () => {
    const boundary = draft();
    boundary.scenes[0].choices[0].when = { op: 'all', args: Array.from({ length: 63 }, () => ({ op: 'always' as const })) };
    boundary.questions[0].proof = { op: 'all', args: Array.from({ length: 8 }, () => ({ op: 'any' as const, args: [{ op: 'ref' as const, refId: 'smudge' }, { op: 'ref' as const, refId: 'photo' }] })) };
    const content = checked(boundary), state = createGameV2(content);
    expect(availableChoicesV2(content, state).map(choice => choice.id)).toContain('get-photo');
    expect(submit(content, state, ['smudge']).ok).toBe(true);
    boundary.scenes[0].choices[0].when.args.push({ op: 'always' });
    const tooMany = validateContentV2(boundary);
    expect(tooMany.ok).toBe(false); if (!tooMany.ok) expect(tooMany.errors.join(' ')).toContain('64 expression nodes');
  });
  test('deterministic frozen-input programs roundtrip every internal field; accepted IDs deduplicate', () => {
    const content = checked();
    fc.assert(fc.property(fc.array(fc.constantFrom('get-log', 'get-photo', 'get-testimony', 'get-receipt', 'get-copy', 'persuade'), { minLength: 0, maxLength: 16 }), program => {
      let first = createGameV2(content), second = createGameV2(content);
      const original = canonicalJSON(content);
      for (const choiceId of program) {
        const old = first, before = canonicalJSON(old), payload = command(old, { type: 'choose', choiceId });
        const result = applyCommandV2(content, old, payload), replay = applyCommandV2(content, second, payload);
        expect(result.ok).toBe(true); expect(replay.ok).toBe(true);
        first = result.state; second = replay.state;
        expect(canonicalJSON(old)).toBe(before); expect(Object.isFrozen(old)).toBe(true); expect(Object.isFrozen(content)).toBe(true);
        expect(canonicalJSON(first)).toBe(canonicalJSON(second)); expect(first.transcript.slice(0, old.transcript.length)).toEqual(old.transcript);
        const duplicate = applyCommandV2(content, first, { ...payload, expectedRevision: 0, choiceId: 'unknown-choice' });
        expect(duplicate).toMatchObject({ ok: true, duplicate: true }); expect(duplicate.state).toBe(first);
      }
      expect(canonicalJSON(content)).toBe(original);
      const imported = importPortableV2(content, exportPortableV2(first)); expect(imported.ok).toBe(true);
      if (imported.ok) expect(imported.value).toEqual(first);
      expect(validateStateV2(content, first)).toMatchObject({ ok: true });
    }), { seed: 2026100303, numRuns: 60 });
  });
  test('invalid arbitrary JSON, stale and forged commands reject with the identical state', () => {
    const content = checked(), state = collect(content, ['log']);
    fc.assert(fc.property(fc.jsonValue(), input => { const result = applyCommandV2(content, state, input); expect(result.ok).toBe(false); expect(result.state).toBe(state); }), { seed: 2026100304, numRuns: 100 });
    expectRejected(content, state, { ...command(state, { type: 'choose', choiceId: 'get-log' }), expectedRevision: 0 }, 'stale-command');
    const payload = command(state, { type: 'choose', choiceId: 'get-photo' });
    expectRejected(content, state, { ...payload, confirmation: { ...confirmationForV2(state, payload), actionHash: '0'.repeat(64) } }, 'confirmation-required');
  });
  test('actual command trace ends, exports and replays with exact terminal state', () => {
    const content = checked(); let state = collect(content, ['log', 'testimony']);
    state = advance(content, state, { type: 'choose', choiceId: 'disclose' });
    state = advance(content, state, { type: 'reviewInterpretation', interpretationId: 'a-seed' });
    state = advance(content, state, { type: 'requestHint', hintId: 'ordinary-help' });
    state = advance(content, state, { type: 'requestHint', hintId: 'reveal-note' }, true);
    state = accepted(content, state, ['smudge', 'log']);
    state = advance(content, state, { type: 'choose', choiceId: 'finish' }, true);
    expect(state.ended).toBe(true); const replay = importPortableV2(content, exportPortableV2(state)); expect(replay.ok).toBe(true);
    if (replay.ok) expect(stateHash(replay.value)).toBe(stateHash(state));
    expect(validateStateV2(content, state).ok).toBe(true);
    mkdirSync('tests/verification/artifacts/evidence-v2', { recursive: true });
    writeFileSync('tests/verification/artifacts/evidence-v2/terminal-trace.json', JSON.stringify({ scope: 'Independent noncanonical fixture; direct engine, not browser', canonicalContentHash: contentHash(content), commands: state.commands, stateHash: stateHash(state), ended: state.ended }, null, 2) + '\n');
  });
  test('v2 exercised paths remain pure under throwing ambient time/random/DOM/network/storage', () => {
    const content = checked(), trap = () => { throw new Error('Forbidden ambient engine dependency'); };
    const randomness = vi.spyOn(Math, 'random').mockImplementation(trap);
    try {
      for (const name of ['Date', 'fetch', 'window', 'document', 'navigator', 'indexedDB', 'localStorage', 'sessionStorage', 'performance', 'XMLHttpRequest', 'WebSocket']) vi.stubGlobal(name, trap);
      const state = accepted(content, collect(content, ['log']), ['smudge', 'log']);
      expect(importPortableV2(content, exportPortableV2(state)).ok).toBe(true); expect(validateStateV2(content, state).ok).toBe(true);
    } finally { randomness.mockRestore(); vi.unstubAllGlobals(); }
  });
});

function legacy(): Content {
  const value: Content = { id: 'independent-old-latch', title: 'Old noncanonical latch', version: 1, start: 'old-room', scenes: [{ id: 'old-room', title: 'Old room', paragraphs: ['OLD-LITERAL-PARAGRAPH'], choices: [
    { id: 'old-inspect', label: 'Inspect old mark', target: 'old-room', effects: ['old-progress'], observation: { id: 'old-mark', text: 'OLD-LITERAL-MARK' } },
    { id: 'old-second', label: 'Inspect second mark', target: 'old-room', observation: { id: 'old-other', text: 'OLD-LITERAL-OTHER' } },
    { id: 'old-disclose', label: 'Share the old mark', target: 'old-room', requires: ['old-progress'], irreversible: true },
    { id: 'old-finish', label: 'End old run', target: 'old-room', ending: true },
  ] }] };
  const result = validateContent(value); if (!result.ok) throw new Error(result.errors.join('\n')); return result.value;
}
function oldAdvance(content: Content, state: GameState, choiceId: string): GameState {
  const payload = { id: `legacy.${state.revision}`, expectedRevision: state.revision, choiceId };
  const result = applyChoice(content, state, ['old-disclose', 'old-finish'].includes(choiceId) ? { ...payload, confirmation: confirmationFor(state, payload) } : payload);
  if (!result.ok) throw new Error(result.error.message); return result.state;
}
function migration(content = checked(), withDisclosure = false) {
  const old = legacy(); let oldState = oldAdvance(old, createGame(old), 'old-inspect');
  if (withDisclosure) oldState = oldAdvance(old, oldState, 'old-disclose');
  const manifest: MigrationManifestV2 = { id: 'independent-reviewed-map', fromHash: contentHash(old), toHash: contentHash(content), sceneMap: { 'old-room': 'room' }, flagMap: { 'old-progress': 'finding' }, sourceMap: { 'old-mark': 'smudge' }, disclosures: [{ choiceId: 'old-disclose', characterId: 'caretaker', refId: 'smudge' }] };
  const seed: LegacySeedV2 = { manifestId: manifest.id, manifestHash: stateHash(manifest), legacyState: oldState, legacyStateHash: stateHash(oldState) };
  const context: ReplayContextV2 = { legacyBundles: { [contentHash(old)]: old }, manifests: { [manifest.id]: manifest } };
  return { content, old, oldState, manifest, seed, context };
}
describe('independent portable replay, reviewed migration and byte limits', () => {
  test('valid migration retains old literal prefix, adds no invented deduction and replays with installed context', () => {
    const { content, oldState, seed, context } = migration(); const migrated = createGameV2(content, seed, context);
    expect(migrated.transcript).toEqual(oldState.transcript); expect(migrated.sources[0].text).toBe('OLD-LITERAL-MARK');
    expect(migrated.deductions).toEqual([]); expect(migrated.flags).toContain('finding');
    expect(availableChoicesV2(content, migrated).map(choice => choice.id)).not.toContain('finish');
    const continued = advance(content, migrated, { type: 'choose', choiceId: 'get-log' });
    expect(continued.transcript.slice(0, oldState.transcript.length)).toEqual(oldState.transcript);
    const portable = exportPortableV2(continued); expect(portable).not.toContain('SEALED-LITERAL-SECRET');
    expect(importPortableV2(content, portable).ok).toBe(false);
    const imported = importPortableV2(content, portable, context); expect(imported.ok).toBe(true); if (imported.ok) expect(imported.value).toEqual(continued);
    expect(validateStateV2(content, continued, context).ok).toBe(true);
  });
  test('migration derives knowledge only from an actual named historical disclosure', () => {
    const absent = migration(), disclosed = migration(checked(), true);
    expect(createGameV2(absent.content, absent.seed, absent.context).npcState.find(npc => npc.id === 'caretaker')?.knows).toEqual([]);
    expect(createGameV2(disclosed.content, disclosed.seed, disclosed.context).npcState.find(npc => npc.id === 'caretaker')?.knows).toEqual(['smudge']);
  });
  test('missing bundle, altered manifest/legacy receipts, undeclared maps and merged sources refuse without changing old bytes', () => {
    const m = migration(), before = canonicalJSON(m.oldState);
    expect(() => createGameV2(m.content, m.seed)).toThrow();
    expect(() => createGameV2(m.content, m.seed, { ...m.context, legacyBundles: {} })).toThrow();
    expect(() => createGameV2(m.content, { ...m.seed, manifestHash: '0'.repeat(64) }, m.context)).toThrow();
    expect(() => createGameV2(m.content, { ...m.seed, legacyStateHash: '0'.repeat(64) }, m.context)).toThrow();
    const invalidMaps: Partial<MigrationManifestV2>[] = [{ sceneMap: {} }, { flagMap: { invented: 'finding' } }, { sourceMap: { invented: 'smudge' } }, { sourceMap: { 'old-mark': 'missing-new-source' } }];
    for (const changes of invalidMaps) {
      const manifest: MigrationManifestV2 = { ...m.manifest, ...changes };
      expect(() => createGameV2(m.content, { ...m.seed, manifestHash: stateHash(manifest) }, { ...m.context, manifests: { [manifest.id]: manifest } })).toThrow();
    }
    const oldState = oldAdvance(m.old, m.oldState, 'old-second'), manifest = { ...m.manifest, sourceMap: { 'old-mark': 'smudge', 'old-other': 'smudge' } };
    expect(() => createGameV2(m.content, { ...m.seed, manifestHash: stateHash(manifest), legacyState: oldState, legacyStateHash: stateHash(oldState) }, { ...m.context, manifests: { [manifest.id]: manifest } })).toThrow();
    expect(canonicalJSON(m.oldState)).toBe(before);
  });
  test('legacy endings remain ended and old confirmation cannot authorize a v2 action', () => {
    const m = migration(), oldEnded = oldAdvance(m.old, m.oldState, 'old-finish');
    const ended = createGameV2(m.content, { ...m.seed, legacyState: oldEnded, legacyStateHash: stateHash(oldEnded) }, m.context);
    expect(ended.ended).toBe(true); expect(availableChoicesV2(m.content, ended)).toEqual([]);
    const migrated = createGameV2(m.content, m.seed, m.context), oldPayload = { id: 'legacy-major', choiceId: 'old-disclose', expectedRevision: m.oldState.revision };
    expectRejected(m.content, migrated, { ...command(migrated, { type: 'choose', choiceId: 'get-log' }), confirmation: confirmationFor(m.oldState, oldPayload) }, 'confirmation-required');
  });
  test('portable snapshot tampering fails even with a recomputed checksum; internal NPC tampering fails replay', () => {
    const content = checked(), state = collect(content, ['log']); const exported = JSON.parse(exportPortableV2(state));
    exported.seen.transcript[0].paragraphs[0] = 'FORGED SEEN TEXT'; exported.seenChecksum = stateHash(exported.seen);
    expect(importPortableV2(content, exported).ok).toBe(false);
    const internal = structuredClone(state); internal.npcState[1].knows.push('SEALED-SOURCE-ID');
    expect(validateStateV2(content, internal).ok).toBe(false);
    const extra = JSON.parse(exportPortableV2(state)); extra.npcState = state.npcState;
    expect(importPortableV2(content, extra).ok).toBe(false);
    const repeated = JSON.parse(exportPortableV2(state)); repeated.commands.push(repeated.commands[0]);
    expect(importPortableV2(content, repeated).ok).toBe(false);
  });
  test('unknown version/hash, malformed JSON, excess accepted commands and oversized UTF-8 imports reject', () => {
    const content = checked(), state = createGameV2(content), exported = JSON.parse(exportPortableV2(state));
    for (const input of ['{broken', { ...exported, saveVersion: 77 }, { ...exported, content: { ...exported.content, hash: '0'.repeat(64) } }, { ...exported, commands: Array.from({ length: 10001 }, (_, i) => ({ type: 'choose', id: `large.${i}`, expectedRevision: 0, choiceId: 'get-log' })) }, 'é'.repeat(5 * 1024 * 1024 + 1)]) expect(importPortableV2(content, input).ok).toBe(false);
  });
  test('valid large multibyte run roundtrips; next passage exceeding byte budget rejects with original state intact', () => {
    const value = draft(); value.scenes[0].paragraphs = Array.from({ length: 100 }, () => 'é'.repeat(24000));
    const content = checked(value), state = createGameV2(content), portable = exportPortableV2(state);
    expect(new TextEncoder().encode(portable).byteLength).toBeLessThanOrEqual(10 * 1024 * 1024);
    expect(new TextEncoder().encode(portable).byteLength).toBeGreaterThan(portable.length);
    const roundtrip = importPortableV2(content, portable); expect(roundtrip.ok).toBe(true); if (roundtrip.ok) expect(roundtrip.value).toEqual(state);
    expectRejected(content, state, command(state, { type: 'choose', choiceId: 'get-log' }), 'resource-limit');
    expect(exportPortableV2(state)).toBe(portable);
    const oversize = draft(); oversize.scenes[0].paragraphs = Array.from({ length: 120 }, () => 'é'.repeat(24000));
    const validOversize = checked(oversize); expect(() => createGameV2(validOversize)).toThrow(/10 MB/);
  }, 30000);
});
