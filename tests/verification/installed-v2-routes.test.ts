import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { afterAll, describe, expect, test } from 'vitest';
import { installedCase, migrationInstalled, replayContext } from '../../src/content/load-evidence';
import {
  applyCommandV2, availableChoicesV2, availableHintsV2, availableInterpretationsV2, availableQuestionsV2,
  confirmationForV2, createGameV2, exportPortableV2, importPortableV2, projectPlayerV2, validateStateV2,
  type CommandV2, type GameStateV2,
} from '../../src/engine/evidence-v2';
import { applyChoice, availableChoices, confirmationFor, createGame, type GameState } from '../../src/engine/game';
import { canonicalJSON, contentHash, stateHash } from '../../src/engine/hash';

if (!installedCase.ok) throw new Error(installedCase.errors.join('\n'));
const content = installedCase.value;
const traces: { name: string; kind: string; commands: CommandV2[]; stateHash: string; ended: boolean }[] = [];
const migrationTraces: { name: string; oldChoices: string[]; oldStateHash: string; migratedStateHash: string; continuedStateHash?: string; ended: boolean }[] = [];
const expectedCaseSHA = '8b87c77df304f5bcccaa5f7ae6407997eaa9b0f1a40dca54b7bfde08e1b95751';

const proofRoutes = [
  { name: 'continuous-recording', prefix: ['arrival-cabinet', 'cabinet-cautious', 'hub-gallery', 'gallery-recording', 'recording-keep'], refs: ['continuous-recording'] },
  { name: 'kept-reconstruction', prefix: ['arrival-miriam', 'bench-record', 'hub-workshop', 'workshop-to-test', 'release-record'], refs: ['request-before-cut', 'ada-cut', 'binding-test'] },
  { name: 'atomic-acknowledgment', prefix: ['arrival-miriam', 'bench-record', 'hub-workshop', 'workshop-to-test', 'release-record'], refs: ['request-before-cut', 'ada-cut', 'present-empty-release-test', 'present-impact-geometry', 'present-simon-binding'] },
  { name: 'atomic-fuller-account', prefix: ['arrival-miriam', 'bench-record', 'hub-workshop', 'workshop-to-test', 'release-record', 'hub-gallery', 'gallery-direct', 'simon-account-record'], refs: ['request-before-cut', 'ada-cut', 'present-empty-release-test', 'present-impact-geometry', 'simon-account'] },
] as const;

function choose(state: GameStateV2, choiceId: string): GameStateV2 {
  const option = availableChoicesV2(content, state).find(choice => choice.id === choiceId);
  expect(option, `${state.currentScene} offers ${choiceId}`).toBeDefined();
  const command: CommandV2 = { type: 'choose', choiceId, id: `independent-installed.${state.revision}.${choiceId}`, expectedRevision: state.revision };
  if (option?.ending || option?.irreversible) command.confirmation = confirmationForV2(state, command);
  const before = canonicalJSON(state), result = applyCommandV2(content, state, command);
  if (!result.ok) throw new Error(`${choiceId}: ${result.error.code}: ${result.error.message}`);
  expect(result.duplicate).toBe(false); expect(canonicalJSON(state)).toBe(before);
  expect(result.state.transcript.slice(0, state.transcript.length)).toEqual(state.transcript);
  return result.state;
}
function walk(ids: readonly string[], state = createGameV2(content)): GameStateV2 { return ids.reduce(choose, state); }
function deduction(state: GameStateV2, refs: readonly string[], candidateId = 'rescue-then-impact') {
  return applyCommandV2(content, state, { type: 'submitDeduction', id: `independent-installed.proof.${state.revision}`, expectedRevision: state.revision, questionId: 'accident-sequence', candidateId, selectedRefs: [...refs] });
}
function support(state: GameStateV2, refs: readonly string[]): GameStateV2 {
  const result = deduction(state, refs);
  if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
  expect(result.state.deductions).toHaveLength(1);
  expect(result.state.deductions[0].selectedRefs).toEqual([...refs].sort());
  expect(result.state.deductions[0].witnessRefs).toEqual([...refs].sort());
  return result.state;
}
function finish(state: GameStateV2, optics = 'optics-narrow', account = 'report-public', disposition = 'continue-stay'): GameStateV2 {
  return walk(['finding-share', 'shared-optics', optics, 'cabinet-report', account, account === 'report-public' ? 'public-next' : 'private-next', disposition], state);
}
function replayAndRecord(name: string, kind: string, state: GameStateV2): void {
  const loaded = importPortableV2(content, exportPortableV2(state), replayContext);
  expect(loaded.ok, loaded.ok ? '' : loaded.errors.join('\n')).toBe(true);
  if (loaded.ok) expect(loaded.value).toEqual(state);
  expect(validateStateV2(content, state, replayContext).ok).toBe(true);
  traces.push({ name, kind, commands: state.commands, stateHash: stateHash(state), ended: state.ended });
}
afterAll(() => {
  mkdirSync('tests/verification/artifacts/installed-v2', { recursive: true });
  writeFileSync('tests/verification/artifacts/installed-v2/route-traces.json', JSON.stringify({ scope: 'Actual installed case; direct engine routes, not UI or loop verification', rawCaseSha256: expectedCaseSHA, canonicalContentHash: contentHash(content), traces, migrationTraces }, null, 2) + '\n');
});

test('the activated player entrypoint and installed legacy compatibility refer to the pinned authored v2 bundle', () => {
  expect(createHash('sha256').update(readFileSync('src/content/case-v2.json')).digest('hex')).toBe(expectedCaseSHA);
  expect(content.schemaVersion).toBe(2); expect(content.scenes).toHaveLength(22);
  expect(content.scenes.flatMap(scene => scene.choices)).toHaveLength(52);
  expect(content.characters.find(character => character.id === 'blaise')?.name).toBe('Blaise Bloom');
  expect(readFileSync('src/main.tsx', 'utf8')).toContain('<Release />');
  expect(readFileSync('src/Release.tsx', 'utf8')).toContain("from './content/load-evidence'");
  expect(migrationInstalled).toBe(true);
  const manifest = Object.values(replayContext.manifests)[0];
  expect(manifest.toHash).toBe(contentHash(content));
  expect(contentHash(replayContext.legacyBundles[manifest.fromHash])).toBe(manifest.fromHash);
});

describe('four declared minimal factual routes and all first-night dispositions', () => {
  for (const route of proofRoutes) for (const optics of ['optics-narrow', 'optics-measure']) for (const account of ['report-public', 'report-private']) for (const disposition of ['continue-stay', 'continue-supper-only', 'continue-leave']) {
    const name = `${route.name}/${optics}/${account}/${disposition}`;
    test(name, () => {
      const notebook = walk(route.prefix), prefix = structuredClone(notebook.transcript);
      expect(notebook.deductions).toEqual([]);
      const finding = support(notebook, route.refs);
      expect(finding.npcState.every(npc => !npc.knows.includes('accident-sequence'))).toBe(true);
      const ended = finish(finding, optics, account, disposition);
      expect(ended.ended).toBe(true); expect(ended.currentScene).toBe(disposition === 'continue-leave' ? 'leave' : 'supper');
      expect(ended.transcript.slice(0, prefix.length)).toEqual(prefix);
      expect(ended.sources.some(source => source.id === 'present-miriam-confidence')).toBe(false);
      expect(ended.sources.find(source => source.id === 'bounded-finding')?.text).toBe(content.sources.find(source => source.id === 'bounded-finding')?.text);
      expect(ended.flags.includes('future_help')).toBe(disposition === 'continue-stay');
      expect(ended.flags.includes('left')).toBe(disposition === 'continue-leave');
      expect(ended.flags.includes('stayed')).toBe(disposition !== 'continue-leave');
      expect(ended.flags.includes('public_correction')).toBe(account === 'report-public');
      expect(ended.flags.includes('private_finding')).toBe(account === 'report-private');
      expect(ended.flags.includes('narrow_card')).toBe(optics === 'optics-narrow');
      expect(ended.flags.includes('disputed_card')).toBe(optics === 'optics-measure');
      expect(availableChoicesV2(content, ended)).toEqual([]); expect(availableQuestionsV2(content, ended)).toEqual([]);
      replayAndRecord(name, '48-proof-optics-audience-disposition-combinations', ended);
    });
  }
  test.each(proofRoutes)('every proper selected subset of $name fails without using other notebook possessions', route => {
    const state = walk(route.prefix), before = canonicalJSON(state);
    for (let mask = 0; mask < (1 << route.refs.length) - 1; mask++) {
      const refs = route.refs.filter((_, i) => mask & (1 << i)), result = deduction(state, refs);
      expect(result.ok, `subset ${refs}`).toBe(false); expect(result.state).toBe(state);
      expect(canonicalJSON(state)).toBe(before);
    }
  });
});

const bothDamages = ['arrival-miriam', 'bench-panic', 'miriam-account-record', 'hub-workshop', 'workshop-record', 'hub-gallery', 'gallery-accuse', 'simon-account-record', 'hub-simon-private', 'simon-ada-leave', 'hub-miriam-private', 'miriam-private-listen', 'hub-cabinet', 'cabinet-test', 'release-record', 'hub-recording', 'recording-keep'];
describe('signaled interpersonal failure retains plausible factual access', () => {
  test('pressing Miriam leads to a private refusal but a completed physical route', () => {
    const state = walk(['arrival-miriam', 'bench-panic', 'miriam-account-record', 'hub-miriam-private']);
    expect(projectPlayerV2(content, state).passage).toMatchObject({ sceneId: 'miriam_private', variantId: 'miriam_private.variant1' });
    expect(state.sources.some(source => source.id === 'present-miriam-confidence')).toBe(false);
    const notebook = walk(['miriam-private-listen', 'hub-workshop', 'workshop-to-test', 'release-record'], state);
    const ended = finish(support(notebook, proofRoutes[1].refs), 'optics-measure', 'report-private', 'continue-leave');
    expect(ended.ended).toBe(true); replayAndRecord('pressed-miriam/refusal/physical/private/leave', 'interpersonal-failure', ended);
  });
  test('accusing Simon closes private address but retains the actual recording and an ending', () => {
    const state = walk(['arrival-ada', 'workshop-record', 'hub-gallery', 'gallery-accuse', 'simon-account-record', 'hub-simon-private']);
    expect(projectPlayerV2(content, state).passage).toMatchObject({ sceneId: 'simon_ada', variantId: 'simon_ada.variant1' });
    const notebook = walk(['simon-ada-leave', 'hub-recording', 'recording-keep'], state);
    const ended = finish(support(notebook, proofRoutes[0].refs), 'optics-narrow', 'report-public', 'continue-stay');
    expect(ended.ended).toBe(true); replayAndRecord('shamed-simon/refusal/recording/public/stay', 'interpersonal-failure', ended);
  });
  test.each(proofRoutes)('both failures and private refusals still allow $name', route => {
    const notebook = walk(bothDamages);
    expect(notebook.flags).toEqual(expect.arrayContaining(['pressed_miriam', 'shamed_simon']));
    expect(notebook.sources.some(source => source.id === 'present-miriam-confidence')).toBe(false);
    const ended = finish(support(notebook, route.refs), 'optics-measure', 'report-public', 'continue-supper-only');
    expect(ended.ended).toBe(true);
    expect(ended.transcript.some(entry => entry.kind === 'passage' && 'variantId' in entry && entry.variantId === 'supper.variant2')).toBe(true);
    replayAndRecord(`both-failures/refusals/${route.name}/supper`, 'interpersonal-failure', ended);
  });
});

describe('installed knowledge, selection and historical reading boundaries', () => {
  test('factual support remains private until actual disclosure, with belief and prior claim separate', () => {
    const initial = createGameV2(content), notebook = walk(proofRoutes[0].prefix), finding = support(notebook, proofRoutes[0].refs);
    expect(finding.npcState.find(npc => npc.id === 'simon')?.believes).toContain('simon_sabotage');
    expect(finding.npcState.filter(npc => ['ada', 'simon', 'miriam'].includes(npc.id)).every(npc => !npc.knows.includes('accident-sequence'))).toBe(true);
    const kept = choose(finding, 'finding-keep');
    expect(kept.npcState).toEqual(finding.npcState);
    const shared = choose(kept, 'hub-shared');
    for (const id of ['ada', 'simon', 'miriam']) expect(shared.npcState.find(npc => npc.id === id)?.knows).toContain('accident-sequence');
    expect(shared.npcState.find(npc => npc.id === 'simon')?.believes).not.toContain('simon_sabotage');
    expect(shared.npcState.find(npc => npc.id === 'simon')?.claims).toEqual(finding.npcState.find(npc => npc.id === 'simon')?.claims);
    expect(shared.sources.find(source => source.id === 'present-sabotage-message')).toEqual(initial.sources.find(source => source.id === 'present-sabotage-message'));
    expect(shared.transcript.slice(0, finding.transcript.length)).toEqual(finding.transcript);
  });
  test('earned private confidence is not disclosed by sharing the factual account or reporting publicly', () => {
    let state = walk(['arrival-miriam', 'bench-record', 'hub-miriam-private', 'miriam-private-listen', 'hub-workshop', 'workshop-to-test', 'release-record']);
    expect(state.sources.some(source => source.id === 'present-miriam-confidence')).toBe(true);
    state = finish(support(state, proofRoutes[1].refs), 'optics-narrow', 'report-public', 'continue-supper-only');
    for (const id of ['ada', 'simon', 'blaise']) expect(state.npcState.find(npc => npc.id === id)?.knows).not.toContain('present-miriam-confidence');
    expect(state.npcState.find(npc => npc.id === 'miriam')?.knows).toContain('present-miriam-confidence');
    expect(exportPortableV2(state)).toContain(content.sources.find(source => source.id === 'present-miriam-confidence')!.text);
    replayAndRecord('earned-private-confidence/public-report/supper', 'privacy-after-real-encounter', state);
  });
  test('selecting the whole notebook cannot turn private confidence or intent claims into factual proof', () => {
    const state = walk(['arrival-miriam', 'bench-record', 'hub-miriam-private', 'miriam-private-listen', 'hub-workshop', 'workshop-to-test', 'release-record', 'hub-gallery', 'gallery-direct', 'simon-account-record', 'hub-recording', 'recording-keep']);
    const result = deduction(state, state.sources.map(source => source.id));
    expect(result).toMatchObject({ ok: false, error: { code: 'irrelevant' } }); expect(result.state).toBe(state);
    expect(state.npcState.every(npc => !npc.knows.includes('accident-sequence'))).toBe(true);
    expect(deduction(state, ['continuous-recording'], 'proven-intended-injury')).toMatchObject({ ok: false, error: { code: 'unsupported' } });
    expect(deduction(state, ['continuous-recording'], 'cut-before-request')).toMatchObject({ ok: false, error: { code: 'contradictory' } });
  });
  test('progression flags alone cannot share a finding, and unavailable source IDs reject generically', () => {
    const state = walk(proofRoutes[1].prefix);
    expect(state.flags).toEqual(expect.arrayContaining(['proof_cut', 'proof_timing', 'proof_binding']));
    expect(availableChoicesV2(content, state).map(choice => choice.id)).not.toContain('hub-shared');
    const forbidden = applyCommandV2(content, state, { type: 'choose', id: 'unearned.shared', expectedRevision: state.revision, choiceId: 'hub-shared' });
    expect(forbidden).toMatchObject({ ok: false, error: { code: 'unavailable-choice' } }); expect(forbidden.state).toBe(state);
    expect(deduction(state, ['present-miriam-confidence'])).toMatchObject({ ok: false, error: { code: 'unknown-reference' } });
  });
  test('initial projection/export omit hidden literal sources, NPC internals, ending paragraphs and unavailable readings', () => {
    const state = createGameV2(content), projection = projectPlayerV2(content, state), text = JSON.stringify(projection), portable = exportPortableV2(state);
    for (const value of [text, portable]) {
      expect(value).not.toContain('"npcState"'); expect(value).not.toContain('"supportedCandidateId"'); expect(value).not.toContain('"proof"'); expect(value).not.toContain('"eligibleInterpretations"');
      for (const source of content.sources.filter(source => !state.sources.some(seen => seen.id === source.id))) expect(value).not.toContain(JSON.stringify(source.text).slice(1, -1));
      for (const id of ['supper', 'leave', 'miriam_private']) for (const paragraph of content.scenes.find(scene => scene.id === id)!.paragraphs) expect(value).not.toContain(JSON.stringify(paragraph).slice(1, -1));
      expect(value).not.toContain(content.interpretationRules[0].text);
    }
    expect(projection.questions).toEqual([]); expect(projection.hintsAvailable).toEqual([]); expect(projection.readingsAvailable).toEqual([]);
  });
  test('early inference, literal latch record and past passage survive test, explicit reading and return', () => {
    const early = walk(['arrival-cabinet', 'cabinet-infer']), old = structuredClone(early.transcript), latch = early.sources.find(source => source.id === 'latch-click');
    let state = walk(['hub-test', 'release-record'], early);
    expect(availableInterpretationsV2(content, state).map(reading => reading.id)).toContain('latch-read-again');
    expect(exportPortableV2(state)).not.toContain(content.interpretationRules[0].text);
    const reviewed = applyCommandV2(content, state, { type: 'reviewInterpretation', id: `installed.reading.${state.revision}`, expectedRevision: state.revision, interpretationId: 'latch-read-again' });
    expect(reviewed.ok).toBe(true); state = reviewed.state;
    state = walk(['hub-cabinet', 'cabinet-revise'], state);
    expect(state.sources.find(source => source.id === 'latch-click')).toEqual(latch);
    expect(state.transcript.slice(0, old.length)).toEqual(old); expect(state.deductions).toEqual([]);
    expect(state.interpretations.map(reading => reading.id)).toEqual(expect.arrayContaining(['early-exit', 'latch-read-again', 'revised-exit']));
    const loaded = importPortableV2(content, exportPortableV2(state), replayContext); expect(loaded.ok && loaded.value).toEqual(state);
  });
  test.each(['optics-narrow', 'optics-measure'])('revisiting after %s cannot acquire the contradictory card commitment', optics => {
    let state = support(walk(proofRoutes[0].prefix), proofRoutes[0].refs);
    state = walk(['finding-share', 'shared-optics', optics], state);
    const stripe = state.sources.find(source => source.id === 'stripe-control'), readings = structuredClone(state.interpretations), prefix = structuredClone(state.transcript);
    state = walk(['cabinet-revise', 'hub-shared', 'shared-optics'], state);
    expect(availableChoicesV2(content, state).map(choice => choice.id)).toEqual(['optics-return']);
    const beforeReturn = structuredClone(state.interpretations);
    state = choose(state, 'optics-return');
    expect(state.sources.find(source => source.id === 'stripe-control')).toEqual(stripe);
    expect(state.interpretations).toEqual(beforeReturn);
    expect(state.interpretations.filter(reading => readings.some(original => original.id === reading.id))).toEqual(readings);
    expect(state.transcript.slice(0, prefix.length)).toEqual(prefix);
    expect(state.flags.includes('narrow_card') && state.flags.includes('disputed_card')).toBe(false);
  });
  test('actual hint stays unavailable until a source is encountered and never submits the answer', () => {
    const initial = createGameV2(content); expect(availableHintsV2(content, initial)).toEqual([]);
    const state = choose(initial, 'arrival-miriam'); expect(availableHintsV2(content, state).map(hint => hint.id)).toEqual(['accident-known-order']);
    const result = applyCommandV2(content, state, { type: 'requestHint', id: 'installed.hint', expectedRevision: state.revision, hintId: 'accident-known-order' });
    expect(result.ok).toBe(true); expect(result.state.sources).toEqual(state.sources); expect(result.state.deductions).toEqual([]);
    const loaded = importPortableV2(content, exportPortableV2(result.state), replayContext); expect(loaded.ok && loaded.value).toEqual(result.state);
  });
});

const manifest = Object.values(replayContext.manifests)[0];
const legacy = replayContext.legacyBundles[manifest.fromHash];
function oldWalk(ids: readonly string[]): GameState {
  return ids.reduce((state, choiceId) => {
    const offered = availableChoices(legacy, state).find(choice => choice.id === choiceId);
    expect(offered, `legacy ${state.currentScene} offers ${choiceId}`).toBeDefined();
    const command = { id: `independent-legacy.${state.revision}.${choiceId}`, expectedRevision: state.revision, choiceId };
    const result = applyChoice(legacy, state, offered?.ending || offered?.irreversible ? { ...command, confirmation: confirmationFor(state, command) } : command);
    if (!result.ok) throw new Error(result.error.message); return result.state;
  }, createGame(legacy));
}
const oldPhysical = ['arrival-miriam', 'bench-record', 'hub-workshop', 'workshop-record', 'hub-cabinet', 'cabinet-test', 'release-record'];
const oldClosing = ['hub-shared', 'shared-optics', 'optics-narrow', 'cabinet-report'];
const oldSeeds = [
  { name: 'early-wrong-latch-inference', choices: ['arrival-cabinet', 'cabinet-infer'], canContinueWith: 'recording' },
  { name: 'both-interpersonal-failures-and-private-refusals', choices: ['arrival-miriam', 'bench-panic', 'miriam-account-record', 'hub-workshop', 'workshop-record', 'hub-gallery', 'gallery-accuse', 'simon-account-record', 'hub-simon-private', 'simon-ada-leave', 'hub-miriam-private', 'miriam-private-listen'], canContinueWith: 'physical' },
  { name: 'heard-private-care-without-new-source-record', choices: ['arrival-miriam', 'bench-record', 'hub-miriam-private', 'miriam-private-listen'], canContinueWith: 'physical' },
  { name: 'old-implicit-factual-progress', choices: oldPhysical, canContinueWith: 'kept' },
  { name: 'committed-optics-before-report', choices: [...oldPhysical, ...oldClosing.slice(0, 3)], canContinueWith: 'kept' },
  { name: 'public-report-before-ending', choices: [...oldPhysical, ...oldClosing, 'report-public', 'public-next'], canContinueWith: 'ending' },
  { name: 'private-report-ended-leave', choices: [...oldPhysical, ...oldClosing, 'report-private', 'private-next', 'continue-leave'], canContinueWith: '' },
  { name: 'public-report-ended-supper', choices: [...oldPhysical, ...oldClosing, 'report-public', 'public-next', 'continue-supper-only'], canContinueWith: '' },
];
describe('installed exact legacy bundle and reviewed manifest on problematic histories', () => {
  test.each(oldSeeds)('$name preserves exact past and invents no selected proof', ({ name, choices, canContinueWith }) => {
    const old = oldWalk(choices), before = canonicalJSON(old);
    const state = createGameV2(content, { manifestId: manifest.id, manifestHash: stateHash(manifest), legacyState: old, legacyStateHash: stateHash(old) }, replayContext);
    expect(canonicalJSON(old)).toBe(before); expect(state.transcript).toEqual(old.transcript); expect(state.observations).toEqual(old.observations);
    expect(state.relationships).toEqual(old.relationships); expect(state.deductions).toEqual([]); expect(state.commands).toEqual([]);
    expect(state.revision).toBe(old.revision); expect(state.ended).toBe(old.ended);
    expect(state.sources.some(source => source.id === 'present-miriam-confidence')).toBe(false);
    for (const source of state.sources) expect(old.observations.find(record => record.id === source.id)?.text).toBe(source.text);
    for (const npc of state.npcState) expect(npc.knows).not.toContain('accident-sequence');
    const hadReport = choices.some(choice => ['report-public', 'report-private'].includes(choice));
    for (const id of ['ada', 'simon', 'miriam']) expect(state.npcState.find(npc => npc.id === id)?.knows.includes('bounded-finding')).toBe(hadReport);
    const loaded = importPortableV2(content, exportPortableV2(state), replayContext); expect(loaded.ok && loaded.value).toEqual(state);
    expect(validateStateV2(content, state, replayContext).ok).toBe(true);
    if (old.ended) { expect(availableChoicesV2(content, state)).toEqual([]); expect(availableQuestionsV2(content, state)).toEqual([]); }
    let continued = state;
    if (canContinueWith === 'recording') continued = walk(['hub-gallery', 'gallery-recording', 'recording-keep'], state);
    if (canContinueWith === 'physical') continued = walk(['hub-cabinet', 'cabinet-test', 'release-record', ...(state.flags.includes('heard_ada') ? [] : ['hub-workshop', 'workshop-record'])], state);
    if (['recording', 'physical', 'kept'].includes(canContinueWith)) {
      const refs = canContinueWith === 'recording' ? proofRoutes[0].refs : proofRoutes[1].refs;
      continued = support(continued, refs);
      if (state.flags.includes('optics_done')) continued = walk(['finding-share', 'shared-optics', 'optics-return', 'cabinet-report', 'report-public', 'public-next', 'continue-supper-only'], continued);
      else continued = finish(continued, 'optics-narrow', 'report-private', 'continue-leave');
      expect(continued.ended).toBe(true); expect(continued.transcript.slice(0, old.transcript.length)).toEqual(old.transcript);
      const roundtrip = importPortableV2(content, exportPortableV2(continued), replayContext); expect(roundtrip.ok && roundtrip.value).toEqual(continued);
    } else if (canContinueWith === 'ending') { continued = choose(state, 'continue-stay'); expect(continued.ended).toBe(true); }
    migrationTraces.push({ name, oldChoices: choices, oldStateHash: stateHash(old), migratedStateHash: stateHash(state), continuedStateHash: stateHash(continued), ended: continued.ended });
  });
});
