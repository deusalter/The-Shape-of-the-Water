import { expect, test } from 'vitest';
import { validateContent, type Content } from '../../src/engine/game';
import { explore, replayTrace } from '../../tools/verify-explorer';

function fixture(kind: 'ending' | 'softlock' | 'cycle'): Content {
  const checked = validateContent({ id: `search-${kind}`, title: 'Noncanonical explorer self-test', version: 1, start: 'start', scenes: [
    { id: 'start', title: 'Start', paragraphs: ['An artificial state.'], choices: [{ id: 'continue', label: 'Continue.', target: kind === 'cycle' ? 'start' : 'last', ...(kind === 'ending' ? { ending: true } : {}) }] },
    ...(kind === 'cycle' ? [] : [{ id: 'last', title: 'Last', paragraphs: ['The final artificial state.'], choices: [] }]),
  ] });
  if (!checked.ok) throw new Error(checked.errors.join('\n'));
  return checked.value;
}
test('actual-engine terminal witness yields an exhaustive exact PASS and replays', () => {
  const content = fixture('ending'), result = explore(content, 'exact');
  expect(result.outcome).toBe('PASS'); expect(result.states).toBe(2); expect(result.transitions).toBe(1); expect(result.frontier).toBe(0);
  expect(result.terminalTraces).toHaveLength(1); expect(replayTrace(content, result.terminalTraces[0].commands).ended).toBe(true);
});
test('concrete softlock is FAIL with a replayable witness', () => {
  const content = fixture('softlock'), result = explore(content, 'exact');
  expect(result.outcome).toBe('FAIL'); expect(result.frontier).toBe(0);
  const concrete = result.failures.find(item => item.message.includes('no available choice'));
  expect(concrete).toBeDefined(); if (concrete) expect(replayTrace(content, concrete.trace).currentScene).toBe('last');
});
test('exhaustion and cancellation produce INCONCLUSIVE with unexpanded frontier', () => {
  for (const budget of [{ states: 3 }, { transitions: 2 }]) {
    const result = explore(fixture('cycle'), 'exact', budget);
    expect(result.outcome).toBe('INCONCLUSIVE'); expect(result.frontier).toBeGreaterThan(0); expect(result.terminalTraces).toHaveLength(0);
  }
  const cancelled = explore(fixture('cycle'), 'exact', {}, () => true);
  expect(cancelled.outcome).toBe('INCONCLUSIVE'); expect(cancelled.stopReason).toBe('cancelled'); expect(cancelled.frontier).toBe(1);
});
test('a terminal-free complete navigation component cannot pass', () => {
  const result = explore(fixture('cycle'), 'guard-abstraction');
  expect(result.outcome).toBe('FAIL'); expect(result.states).toBe(1); expect(result.frontier).toBe(0);
  expect(result.failures[0].message).toContain('No terminal path');
});
