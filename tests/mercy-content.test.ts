import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  applyCommandV2, availableChoicesV2, availableQuestionsV2, confirmationForV2, createGameV2, currentPassageV2,
  exportPortableV2, importPortableV2, validateContentV2, validateStateV2,
  type CommandV2, type ContentV2, type GameStateV2,
} from '../src/engine/evidence-v2';
import { stateHash } from '../src/engine/hash';

const root = process.cwd();
const readJSON = (path: string) => JSON.parse(readFileSync(resolve(root, path), 'utf8'));
const input = readJSON('src/content/case-v7.json');
const validated = validateContentV2(input);
if (!validated.ok) throw new Error(validated.errors.join('\n'));
const content: ContentV2 = validated.value;
const evidence = 'docs/execution/evidence/mercy-content';
const verification = readJSON(`${evidence}/verification.json`);
const witnessFile = readJSON(`${evidence}/witnesses.json`);
interface Witness { kind: string; id: string; sceneId: string; variantId: string; terminal: boolean; commands: Record<string, unknown>[] }
const witnesses: Witness[] = witnessFile.witnesses;
const witnessFor = (kind: string, id: string) => {
  const witness = witnesses.find(item => item.kind === kind && item.id === id);
  if (!witness) throw new Error(`Missing witnessed route ${kind}:${id}`);
  return witness;
};
function step(state: GameStateV2, payload: Record<string, unknown>): GameStateV2 {
  let command = { ...payload, id: `test.mercy.${state.revision}`, expectedRevision: state.revision } as CommandV2;
  const choiceId = command.type === 'choose' ? command.choiceId : undefined;
  const hintId = command.type === 'requestHint' ? command.hintId : undefined;
  const choice = choiceId
    ? content.scenes.find(scene => scene.id === state.currentScene)?.choices.find(choice => choice.id === choiceId)
    : undefined;
  const hint = hintId ? content.hints.find(hint => hint.id === hintId) : undefined;
  if (choice?.ending || choice?.irreversible || hint?.reveals) command = { ...command, confirmation: confirmationForV2(state, command) };
  const result = applyCommandV2(content, state, command);
  if (!result.ok) throw new Error(`${state.currentScene}: ${result.error.code}: ${JSON.stringify(payload)}`);
  return result.state;
}
function play(commands: Record<string, unknown>[]) {
  let state = createGameV2(content);
  const opening = state.transcript[0];
  for (const payload of commands) state = step(state, payload);
  expect(state.transcript[0]).toEqual(opening);
  return state;
}

describe('The Mercy of Morning complete static candidate', () => {
  it('compiles exactly the lead modules, preserving prose and physical staging', () => {
    const result = spawnSync(process.execPath, ['tools/mercy/compile.mjs', '--check'], { cwd: root, encoding: 'utf8', timeout: 30000 });
    expect(result.status, result.stderr).toBe(0);
    expect(content).toMatchObject({ id: 'mercy-of-morning', version: 7, schemaVersion: 2, start: 'a0.tribute' });
    const manifest = readJSON('narrative/mercy/manifest.json');
    const modules = manifest.modules.map((name: string) => readJSON(`narrative/mercy/${name}`));
    const authoredScenes = modules.flatMap((module: { scenes?: unknown[] }) => module.scenes ?? []) as ContentV2['scenes'];
    expect(content.scenes.map(scene => scene.id)).toEqual(authoredScenes.map(scene => scene.id));
    for (const authored of authoredScenes) {
      const compiled = content.scenes.find(scene => scene.id === authored.id)!;
      expect(compiled.paragraphs).toEqual(authored.paragraphs);
      expect(compiled.choices).toEqual(authored.choices);
      for (const variant of authored.variants ?? []) expect(compiled.variants?.find(item => item.id === variant.id)?.paragraphs).toEqual(variant.paragraphs);
    }
    const staging = readJSON('tools/mercy/staging-v7.json');
    expect(staging.scenes.map((stage: { sceneId: string }) => stage.sceneId)).toEqual(content.scenes.map(scene => scene.id));
    const sourceMap = readJSON(`${evidence}/source-map.json`);
    expect(new Set(sourceMap.paragraphs.map((paragraph: { blockId: string }) => paragraph.blockId)).size).toBe(sourceMap.paragraphs.length);
    for (const paragraph of sourceMap.paragraphs) {
      let text: unknown = readJSON(paragraph.sourceFile);
      for (const part of paragraph.jsonPointer.slice(1).split('/')) text = (text as Record<string, unknown>)[part];
      expect(createHash('sha256').update(String(text)).digest('hex')).toBe(paragraph.textSha256);
    }
  });

  it('records finite complete-path coverage against this exact content', () => {
    const bytes = readFileSync(resolve(root, 'src/content/case-v7.json'));
    const pin = createHash('sha256').update(bytes).digest('hex');
    expect(verification.outcome).toBe('PASS');
    expect(verification.sourceStable).toBe(true);
    expect(verification.contentSha256).toBe(pin);
    expect(witnessFile.contentSha256).toBe(pin);
    expect(verification.contentHash).toBe(createGameV2(content).contentHash);
    expect(verification.nonterminalDeadEnds).toBe(0);
    expect(verification.statesWithoutEndingPath).toBe(0);
    expect(Object.values(verification.missing).flat()).toEqual([]);
    expect(verification.coverage.scenes).toEqual(content.scenes.map(scene => scene.id).sort());
    expect(verification.coverage.choices).toEqual(content.scenes.flatMap(scene => scene.choices.map(choice => choice.id)).sort());
  });

  const endingRoutes = witnesses.filter(witness => witness.kind === 'variants' && witness.terminal);
  it.each(endingRoutes)('replays the completed $id coda with exact seen text', witness => {
    const state = play(witness.commands);
    expect(state.ended).toBe(true);
    const passage = currentPassageV2(state);
    expect('variantId' in passage && passage.variantId).toBe(witness.variantId);
    expect(availableChoicesV2(content, state)).toEqual([]);
    expect(validateStateV2(content, state).ok).toBe(true);
    const imported = importPortableV2(content, exportPortableV2(state));
    expect(imported.ok).toBe(true);
    if (imported.ok) {
      expect(imported.value.transcript).toEqual(state.transcript);
      expect(stateHash(imported.value)).toBe(stateHash(state));
    }
    if (state.currentScene === 'a3.final-horse') {
      expect(state.npcState.find(npc => npc.id === 'blaise-final')?.knows).toEqual([]);
      expect(state.npcState.find(npc => npc.id === 'julian-restored')?.knows).toEqual([]);
      expect(state.sources.some(source => source.id.startsWith('src.public-final'))).toBe(true);
    }
  });

  it.each(witnesses.filter(witness => witness.kind === 'proofRoutes'))('requires actual selected support for $id', witness => {
    const prior = play(witness.commands.slice(0, -1));
    const payload = witness.commands.at(-1)!;
    expect(payload.type).toBe('submitDeduction');
    const command = { ...payload, selectedRefs: [], id: 'mercy.incomplete', expectedRevision: prior.revision };
    const incomplete = applyCommandV2(content, prior, command);
    expect(incomplete.ok).toBe(false);
    if (!incomplete.ok) expect(incomplete.error.code).toBe('premature');
    expect(incomplete.state).toBe(prior);
    const unearned = applyCommandV2(content, prior, { ...command, selectedRefs: ['mercy.unencountered'], id: 'mercy.unearned' });
    expect(unearned.ok).toBe(false);
    if (!unearned.ok) expect(unearned.error.code).toBe('unknown-reference');
    const accepted = step(prior, payload);
    expect(accepted.deductions.some(deduction => deduction.id === payload.questionId)).toBe(true);
  });

  it('completes the selected factual finding with the alternate written account and philosophical response', () => {
    const witness = witnessFor('completeProofEnding', 'q.julian-disappearance');
    const state = play(witness.commands);
    expect(state.ended).toBe(true);
    expect(state.deductions.some(deduction => deduction.id === 'q.julian-disappearance')).toBe(true);
    expect(state.sources.some(source => source.id === 'src.account-limited')).toBe(true);
    expect(state.transcript.some(event => event.kind === 'passage' && event.sceneId === 'a2.purpose')).toBe(true);
    expect(importPortableV2(content, exportPortableV2(state)).ok).toBe(true);
  });

  it('keeps the disappearance finding after both Julian disclosure responses and allows an optional continuation', () => {
    for (const sceneId of ['a1.rain-stage', 'a1.found-whole', 'a1.found-limited']) {
      const state = play(witnessFor('scenes', sceneId).commands);
      expect(availableQuestionsV2(content, state).map(question => question.id)).not.toContain('q.julian-disappearance');
      const premature = applyCommandV2(content, state, { type: 'submitDeduction', questionId: 'q.julian-disappearance',
        candidateId: 'julian-outside', selectedRefs: ['src.julian-alive', 'src.julian-outside-account'],
        id: 'mercy.early-finding', expectedRevision: state.revision });
      expect(premature.ok).toBe(false);
      if (!premature.ok) expect(premature.error.code).toBe('unavailable-question');
      expect(premature.state).toBe(state);
    }
    const found = play(witnessFor('scenes', 'a1.found').commands);
    expect(availableQuestionsV2(content, found).map(question => question.id)).toContain('q.julian-disappearance');
    const onward = step(found, { type: 'choose', choiceId: 'a1.continue-without-finding' });
    expect(onward.currentScene).toBe('a1.earlier-love');
    expect(onward.deductions.some(deduction => deduction.id === 'q.julian-disappearance')).toBe(false);
    expect(availableQuestionsV2(content, onward).map(question => question.id)).not.toContain('q.julian-disappearance');
  });

  it('preserves the player record while a restored Blaise learns the intervening history', () => {
    let after = createGameV2(content), before: GameStateV2 | undefined;
    for (const payload of witnessFor('scenes', 'a2.sequence').commands) {
      if (after.currentScene === 'a1.second-return') before = after;
      after = step(after, payload);
    }
    expect(before).toBeDefined();
    expect(after.transcript.slice(0, before!.transcript.length)).toEqual(before!.transcript);
    for (const source of before!.sources) expect(after.sources.find(item => item.id === source.id)).toEqual(source);
    expect(content.occasions).toBeUndefined();
    expect(content.scenes.flatMap(scene => scene.choices).every(choice => !choice.enterOccasion)).toBe(true);
    expect(createGameV2(content).npcState.find(npc => npc.id === 'blaise-restored')?.knows).toEqual([]);
    const waking = play(witnessFor('scenes', 'a2.reading').commands);
    expect(waking.sources.some(source => source.id === 'src.first-return')).toBe(true);
    expect(waking.npcState.find(npc => npc.id === 'blaise-restored')?.knows).not.toContain('src.first-return');
    expect(after.npcState.find(npc => npc.id === 'blaise-restored')?.knows.length).toBeGreaterThan(0);
    let limited = createGameV2(content);
    for (const payload of witnessFor('completeProofEnding', 'q.julian-disappearance').commands) {
      limited = step(limited, payload);
      if (limited.currentScene === 'a2.public-meal') break;
    }
    expect(limited.flags).toContain('account_limited');
    expect(limited.npcState.find(npc => npc.id === 'blaise-restored')?.knows).toContain('src.erasmus-second-confirmation');
    expect(limited.sources.find(source => source.id === 'src.erasmus-second-confirmation')).toMatchObject({
      kind: 'statement', speakerId: 'erasmus', sceneId: 'a2.confirmation',
    });
    expect(limited.npcState.find(npc => npc.id === 'blaise-restored')?.knows).not.toContain('src.first-return');
  });

  it('shares public testimony only after the player actually gives it', () => {
    const before = play(witnessFor('scenes', 'a2.testimony').commands);
    expect(before.sources.some(source => source.id === 'src.public-final-full')).toBe(false);
    expect(before.npcState.find(npc => npc.id === 'julian')?.knows).not.toContain('src.public-final-full');
    const after = play(witnessFor('choices', 'a2.full-to-offer').commands);
    for (const characterId of ['julian', 'erasmus', 'vera-witness']) {
      expect(after.npcState.find(npc => npc.id === characterId)?.knows).toContain('src.public-final-full');
    }
    const early = createGameV2(content);
    const rejected = applyCommandV2(content, early, { type: 'choose', choiceId: 'a2.full-to-offer', id: 'mercy.early', expectedRevision: 0 });
    expect(rejected.ok).toBe(false);
    expect(rejected.state).toBe(early);
    expect(exportPortableV2(early)).not.toContain('src.public-final-full');
  });

  it('tells the returning Julian which public inquiry occurred before its relationship consequence', () => {
    for (const sceneId of ['a2.public-correction', 'a2.public-interruption']) {
      const state = play(witnessFor('scenes', sceneId).commands);
      const knows = state.npcState.find(npc => npc.id === 'julian')!.knows;
      expect(knows).not.toContain('src.public-inquiry');
      expect(knows).not.toContain('src.public-inquiry-bounded');
    }
    const received = new Set<string>();
    for (const route of witnesses.filter(witness => witness.terminal && ['variants', 'completeProofEnding'].includes(witness.kind))) {
      let state = createGameV2(content);
      for (const payload of route.commands) {
        state = step(state, payload);
        if (state.currentScene !== 'a2.greenroom') continue;
        const actual = state.flags.includes('let_vera_finish') ? 'src.public-inquiry' : 'src.public-inquiry-bounded';
        const other = actual === 'src.public-inquiry' ? 'src.public-inquiry-bounded' : 'src.public-inquiry';
        const knows = state.npcState.find(npc => npc.id === 'julian')!.knows;
        expect(knows).toContain(actual);
        expect(knows).not.toContain(other);
        received.add(actual);
      }
    }
    expect([...received].sort()).toEqual(['src.public-inquiry', 'src.public-inquiry-bounded']);
  });
});
