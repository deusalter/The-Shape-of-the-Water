import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, expect, test, afterAll } from 'vitest';
import fc from 'fast-check';
import { availableChoices, applyChoice, confirmationFor, contentHash, createGame, stateHash, validateContent, validateState, type Command, type Content, type GameState } from '../../src/engine/game';

const path = 'src/content/case.json';
const installed = existsSync(path);
const checked = installed ? validateContent(JSON.parse(readFileSync(path, 'utf8'))) : undefined;
if (checked && !checked.ok) throw new Error(checked.errors.join('\n'));
const content: Content | undefined = checked?.ok ? checked.value : undefined;
const traces: { name: string; commands: Command[]; terminalStateHash: string; observedIds: string[]; interpretationIds: string[]; relationshipIds: string[] }[] = [];
const live = ['arrival-miriam', 'bench-record', 'hub-workshop', 'workshop-record', 'hub-cabinet', 'cabinet-test', 'release-record', 'hub-shared', 'shared-optics'];
const recording = ['arrival-cabinet', 'cabinet-cautious', 'hub-gallery', 'gallery-recording', 'recording-keep', 'hub-shared', 'shared-optics'];
const suffix = { public: ['report-public', 'public-next'], private: ['report-private', 'private-next'] };
function play(ids: string[], name: string): { state: GameState; commands: Command[] } {
  if (!content) throw new Error('Authored content not installed');
  let state = createGame(content); const commands: Command[] = [];
  for (const choiceId of ids) {
    const choice = availableChoices(content, state).find(candidate => candidate.id === choiceId);
    expect(choice, `${name}: ${choiceId} at ${state.currentScene}`).toBeDefined();
    if (!choice) throw new Error(`Unavailable authored action ${choiceId}`);
    const base = { id: `authored.${state.revision}`, choiceId, expectedRevision: state.revision };
    const command = choice.ending || choice.irreversible ? { ...base, confirmation: confirmationFor(state, base) } : base;
    const result = applyChoice(content, state, command);
    if (!result.ok) throw new Error(`${choiceId}: ${result.error.code}`);
    state = result.state; commands.push(command);
  }
  const validated = validateState(content, JSON.parse(JSON.stringify(state)));
  expect(validated.ok).toBe(true);
  return { state, commands };
}
function retain(name: string, result: ReturnType<typeof play>): void {
  expect(result.state.ended).toBe(true);
  traces.push({ name, commands: result.commands, terminalStateHash: stateHash(result.state), observedIds: result.state.observations.map(item => item.id), interpretationIds: result.state.interpretations.map(item => item.id), relationshipIds: result.state.relationships.map(item => item.id) });
}
describe.skipIf(!installed)('authored guarded evidence routes (not v3 submitted-proof semantics)', () => {
  for (const [evidence, start] of [['live', live], ['continuous-recording', recording]] as const) for (const optics of ['optics-narrow', 'optics-measure']) for (const report of ['public', 'private'] as const) for (const ending of ['continue-stay', 'continue-supper-only', 'continue-leave']) {
    const name = `${evidence}/${optics}/${report}/${ending}`;
    test(name, () => {
      const result = play([...start, optics, 'cabinet-report', ...suffix[report], ending], name);
      expect(result.state.observations.map(item => item.id)).toContain(evidence === 'live' ? 'binding-test' : 'continuous-recording');
      expect(result.state.flags).toEqual(expect.arrayContaining(['proof_cut', 'proof_timing', 'proof_binding', 'heard_shared', 'optics_done']));
      if (evidence === 'continuous-recording') expect(result.state.observations.map(item => item.id)).not.toEqual(expect.arrayContaining(['ada-cut', 'request-before-cut', 'binding-test']));
      retain(name, result);
    });
  }
  test('pressing Miriam and shaming Simon still permits a complete authored case route', () => {
    const ids = ['arrival-miriam', 'bench-panic', 'miriam-account-record', 'hub-workshop', 'workshop-to-test', 'release-record', 'hub-gallery', 'gallery-accuse', 'simon-account-film', 'recording-account', 'simon-account-record', 'hub-simon-private', 'simon-ada-leave', 'hub-miriam-private', 'miriam-private-listen', 'hub-ada-private', 'ada-miriam-leave', 'hub-shared', 'shared-pause', 'hub-shared', 'shared-optics', 'optics-measure', 'cabinet-report', 'report-public', 'public-next', 'continue-leave'];
    const result = play(ids, 'relationship-failure');
    expect(result.state.relationships.map(item => item.id)).toEqual(expect.arrayContaining(['pressed-miriam', 'shamed-simon']));
    retain('relationship-failure', result);
  });
  test('early interpretation and later return preserve original observation and passage', () => {
    const first = play(['arrival-cabinet', 'cabinet-infer'], 'early-reading');
    const record = first.state.observations.find(item => item.id === 'latch-click');
    const originalPassage = first.state.transcript[2];
    const full = play(['arrival-cabinet', 'cabinet-infer', 'hub-test', 'release-film', 'recording-keep', 'hub-cabinet', 'cabinet-revise', 'hub-bench', 'bench-record', 'hub-miriam', 'miriam-account-record', 'hub-shared', 'shared-optics', 'optics-narrow', 'cabinet-report', 'report-private', 'private-next', 'continue-supper-only'], 'recontextualization');
    expect(full.state.observations.find(item => item.id === 'latch-click')).toEqual(record);
    expect(full.state.transcript[2]).toEqual(originalPassage);
    expect(full.state.interpretations.map(item => item.id)).toEqual(expect.arrayContaining(['early-exit', 'revised-exit']));
    retain('recontextualization', full);
  });
  test('unearned report is safely unavailable with no prerequisite or ending leak', () => {
    const state = createGame(content!);
    const result = applyChoice(content!, state, { id: 'unsupported-report', choiceId: 'hub-report', expectedRevision: 0 });
    expect(result.ok).toBe(false); expect(result.state).toBe(state);
    if (!result.ok) expect(result.error.message).not.toMatch(/proof_|binding|cut|timing|ending|supper/i);
  });
  for (const first of ['optics-narrow', 'optics-measure']) test(`returning to optics preserves ${first} and rejects contradictory commitment`, () => {
    const initialOptics = play(recording, `${first}/before-choice`).state;
    expect(availableChoices(content!, initialOptics).map(choice => choice.id)).toEqual(['optics-narrow', 'optics-measure']);
    const prematureReturn = applyChoice(content!, initialOptics, { id: 'optics.unearned-return', choiceId: 'optics-return', expectedRevision: initialOptics.revision });
    expect(prematureReturn.ok).toBe(false); expect(prematureReturn.state).toBe(initialOptics);
    const firstResult = play([...recording, first], `${first}/first-choice`);
    const firstObservation = firstResult.state.observations.find(item => item.id === 'stripe-control');
    const firstInterpretations = firstResult.state.interpretations.filter(item => ['scope-of-test', 'disputed-scope'].includes(item.id));
    const revisit = ['cabinet-revise', 'hub-shared', 'shared-optics'];
    const returned = play([...recording, first, ...revisit], `${first}/revisit`).state;
    expect(availableChoices(content!, returned).map(choice => choice.id)).toEqual(['optics-return']);
    for (const forbidden of ['optics-narrow', 'optics-measure']) {
      const result = applyChoice(content!, returned, { id: `optics.forbidden.${forbidden}`, choiceId: forbidden, expectedRevision: returned.revision });
      expect(result.ok).toBe(false); expect(result.state).toBe(returned);
      if (!result.ok) expect(result.error.code).toBe('unavailable-choice');
    }
    const result = play([...recording, first, ...revisit, 'optics-return', 'cabinet-report', 'report-private', 'private-next', 'continue-leave'], `${first}/revisit-ending`);
    expect(result.state.observations.filter(item => item.id === 'stripe-control')).toEqual([firstObservation]);
    expect(result.state.interpretations.filter(item => ['scope-of-test', 'disputed-scope'].includes(item.id))).toEqual(firstInterpretations);
    expect(result.state.transcript.slice(0, firstResult.state.transcript.length)).toEqual(firstResult.state.transcript);
    const selectedFlag = first === 'optics-narrow' ? 'narrow_card' : 'disputed_card';
    const otherFlag = first === 'optics-narrow' ? 'disputed_card' : 'narrow_card';
    expect(result.state.flags).toContain(selectedFlag); expect(result.state.flags).not.toContain(otherFlag);
    retain(`${first}/revisit-preservation`, result);
  });
  test('seeded authored programs preserve immutable history and replay exactly', () => {
    fc.assert(fc.property(fc.array(fc.nat({ max: 10000 }), { maxLength: 30 }), selectors => {
      const execute = () => {
        let state = createGame(content!);
        for (const selector of selectors) {
          const choices = availableChoices(content!, state); if (!choices.length) break;
          const choice = choices[selector % choices.length], before = JSON.stringify(state);
          const base = { id: `case-property.${state.revision}`, choiceId: choice.id, expectedRevision: state.revision };
          const command = choice.ending || choice.irreversible ? { ...base, confirmation: confirmationFor(state, base) } : base;
          const result = applyChoice(content!, state, command); if (!result.ok) throw new Error(result.error.code);
          expect(JSON.stringify(state)).toBe(before);
          expect(result.state.transcript.slice(0, state.transcript.length)).toEqual(state.transcript);
          expect(result.state.flags.includes('narrow_card') && result.state.flags.includes('disputed_card')).toBe(false);
          const duplicate = applyChoice(content!, result.state, command);
          expect(duplicate.ok).toBe(true); expect(duplicate.state).toBe(result.state);
          state = result.state;
        }
        expect(validateState(content!, JSON.parse(JSON.stringify(state))).ok).toBe(true);
        return state;
      };
      expect(execute()).toEqual(execute());
    }), { seed: Number(process.env.VERIFY_SEED ?? 20261003), numRuns: Number(process.env.VERIFY_RUNS ?? 120), verbose: true });
  });
});
afterAll(() => {
  if (!content) return;
  mkdirSync('tests/verification/artifacts', { recursive: true });
  const bytes = readFileSync(path);
  writeFileSync('tests/verification/artifacts/authored-traces.json', JSON.stringify({ claim: 'Explicit live/continuous-recording evidence paths, two interpretation responses, two report actions, three dispositions, and interpersonal failure. Flag gates are not a selected-reference factual proof evaluator.', contentHash: contentHash(content), contentFileSha256: createHash('sha256').update(bytes).digest('hex'), traces }, null, 2) + '\n');
});
