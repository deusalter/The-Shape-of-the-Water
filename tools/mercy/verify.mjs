import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { root, loadEngine } from './runtime.mjs';
import { compileMercy } from './compile.mjs';

const sha = value => createHash('sha256').update(value).digest('hex');
const json = value => JSON.stringify(value, null, 2) + '\n';
const evidenceRoot = resolve(root, 'docs/execution/evidence/mercy-content');
const walk = (condition, visit) => {
  if (!condition) return;
  visit(condition);
  if (condition.op === 'all' || condition.op === 'any') condition.args.forEach(child => walk(child, visit));
  else if (condition.op === 'not') walk(condition.arg, visit);
};

function semanticProjection(content) {
  const flags = new Set(), refs = new Set(), npcRefs = new Set(), npcBeliefs = new Set(), readings = new Set();
  const consume = condition => walk(condition, node => {
    if (node.op === 'flag') flags.add(node.id);
    if (node.op === 'hasSource' || node.op === 'hasDeduction') refs.add(node.id);
    if (node.op === 'npcKnows') npcRefs.add(`${node.characterId}:${node.refId}`);
    if (node.op === 'npcBelieves') npcBeliefs.add(`${node.characterId}:${node.beliefId}`);
    if (node.op === 'interpretationAvailable') readings.add(node.id);
  });
  for (const scene of content.scenes) {
    scene.requires?.forEach(flag => flags.add(flag)); consume(scene.when);
    for (const variant of scene.variants ?? []) { variant.requires.forEach(flag => flags.add(flag)); consume(variant.when); }
    for (const choice of scene.choices) {
      choice.requires?.forEach(flag => flags.add(flag)); choice.unless?.forEach(flag => flags.add(flag)); consume(choice.when);
      for (const action of choice.actions ?? []) if (action.type === 'disclose') refs.add(action.refId);
    }
  }
  for (const question of content.questions) {
    refs.add(question.id); consume(question.when);
    for (const candidate of question.candidates) { consume(candidate.when); candidate.contradictedBy?.forEach(ref => refs.add(ref)); }
    question.allowedCorroborators.forEach(ref => refs.add(ref));
    walk(question.proof, node => { if (node.op === 'ref') refs.add(node.refId); });
    for (const action of question.actions ?? []) if (action.type === 'disclose') refs.add(action.refId);
  }
  for (const rule of content.interpretationRules) { consume(rule.when); rule.relatedRefs.forEach(ref => refs.add(ref)); }
  for (const hint of content.hints) { consume(hint.when); hint.mentions.forEach(ref => refs.add(ref)); }
  return state => JSON.stringify({
    scene: state.currentScene, ended: state.ended,
    flags: state.flags.filter(flag => flags.has(flag)),
    sources: state.sources.map(source => source.id).filter(ref => refs.has(ref)).sort(),
    deductions: state.deductions.filter(deduction => refs.has(deduction.id)).map(deduction => ({
      id: deduction.id, witnessRefs: deduction.witnessRefs,
    })).sort((left, right) => left.id.localeCompare(right.id)),
    npc: state.npcState.map(npc => ({ id: npc.id,
      knows: npc.knows.filter(ref => npcRefs.has(`${npc.id}:${ref}`)),
      believes: npc.believes.filter(belief => npcBeliefs.has(`${npc.id}:${belief}`)),
    })).filter(npc => npc.knows.length || npc.believes.length),
    readings: state.eligibleInterpretations.map(reading => reading.id).filter(id => readings.has(id)).sort(),
    revealingHints: state.hints.map(hint => hint.id).filter(id => content.hints.find(hint => hint.id === id)?.reveals).sort(),
  });
}

export async function verifyMercy({ maxStates = 20000 } = {}) {
  const compiled = await compileMercy({ check: true });
  const engineFiles = (await readdir(resolve(root, 'src/engine'))).filter(name => name.endsWith('.ts')).sort().map(name => `src/engine/${name}`);
  const sourceFiles = [...Object.keys(compiled.sourceHashes), ...engineFiles,
    'tools/mercy/compile.mjs', 'tools/mercy/runtime.mjs', 'tools/mercy/verify.mjs', 'src/content/case-v7.json'];
  const capturePins = async () => Object.fromEntries(await Promise.all(sourceFiles.map(async path => [path, sha(await readFile(resolve(root, path)))])));
  const sourceHashes = await capturePins();
  const engine = await loadEngine();
  const content = JSON.parse(await readFile(resolve(root, 'src/content/case-v7.json'), 'utf8'));
  const checked = engine.validateContentV2(content);
  if (!checked.ok) throw new Error(checked.errors.join('\n'));
  const canonical = checked.value;
  const scenes = new Map(canonical.scenes.map(scene => [scene.id, scene]));
  const questions = new Map(canonical.questions.map(question => [question.id, question]));
  const keyFor = semanticProjection(canonical);
  const initial = engine.createGameV2(canonical);
  const nodes = [{ state: initial, scene: initial.currentScene, ended: false, edges: new Set(), parent: null, payload: null }];
  const indices = new Map([[keyFor(initial), 0]]);
  const witnesses = new Map();
  const completeProofWitnesses = new Map();
  const covered = { scenes: new Set(), choices: new Set(), variants: new Set(), sources: new Set(),
    questions: new Set(), proofRoutes: new Set(), endings: new Set(), relationships: new Set(), hints: new Set(), readings: new Set() };
  const conditions = new Map();
  const failedProofs = new Map();
  let transitions = 0, rejectedChecks = 0, optionalChecks = 0;

  const trace = state => state.commands.map(({ confirmation, id, expectedRevision, ...payload }) => payload);
  const remember = (kind, id, state) => {
    covered[kind].add(id);
    const name = `${kind}:${id}`;
    if (!witnesses.has(name)) witnesses.set(name, { kind, id, terminal: state.ended,
      sceneId: state.currentScene, commands: trace(state), variantId: engine.currentPassageV2(state).variantId });
  };
  const outcome = (name, value) => {
    if (!conditions.has(name)) conditions.set(name, new Set());
    conditions.get(name).add(value);
  };
  const rejected = (state, payload, expected) => {
    const command = { ...payload, id: `reject.${rejectedChecks++}`, expectedRevision: state.revision };
    const result = engine.applyCommandV2(canonical, state, command);
    if (result.ok || result.state !== state || expected && !expected.includes(result.error.code)) {
      throw new Error(`Rejection failed at ${state.currentScene}: ${JSON.stringify(payload)} (${result.ok ? 'accepted' : result.error.code})`);
    }
  };
  const execute = (state, payload, confirmed = true) => {
    let command = { ...payload, id: `mercy.${state.revision}`, expectedRevision: state.revision };
    const needsConfirmation = payload.type === 'choose'
      ? scenes.get(state.currentScene).choices.some(choice => choice.id === payload.choiceId && (choice.ending || choice.irreversible))
      : payload.type === 'requestHint' && canonical.hints.some(hint => hint.id === payload.hintId && hint.reveals);
    if (confirmed && needsConfirmation) command = { ...command, confirmation: engine.confirmationForV2(state, command) };
    return engine.applyCommandV2(canonical, state, command);
  };
  const capture = state => {
    const passage = engine.currentPassageV2(state);
    remember('scenes', state.currentScene, state); remember('variants', `${state.currentScene}::${passage.variantId}`, state);
    for (const source of state.sources) remember('sources', source.id, state);
    for (const relationship of state.relationships) remember('relationships', relationship.id, state);
    if (state.ended) {
      remember('endings', state.currentScene, state);
      for (const deduction of state.deductions) {
        const preference = (state.flags.includes('account_limited') ? 4 : 0) +
          (state.flags.includes('kept_withdrawal_private') ? 2 : 0) + (state.flags.includes('interrupted_vera') ? 1 : 0);
        if (!completeProofWitnesses.has(deduction.id) || completeProofWitnesses.get(deduction.id).preference < preference) {
          completeProofWitnesses.set(deduction.id, { kind: 'completeProofEnding', id: deduction.id,
            proofQuestionId: deduction.id, preference, terminal: true, sceneId: state.currentScene,
            commands: trace(state), variantId: passage.variantId });
        }
      }
    }
  };

  for (let cursor = 0; cursor < nodes.length; cursor++) {
    const node = nodes[cursor], state = node.state;
    capture(state);
    if (state.ended) { node.state = null; continue; }
    const scene = scenes.get(state.currentScene), choices = engine.availableChoicesV2(canonical, state);
    const availableChoiceIds = new Set(choices.map(choice => choice.id));
    for (const variant of scene.variants ?? []) {
      outcome(`variant:${scene.id}::${variant.id}`, variant.requires.every(flag => state.flags.includes(flag)) && engine.evaluateConditionV2(variant.when, state));
    }
    for (const choice of scene.choices) {
      outcome(`choice:${choice.id}`, availableChoiceIds.has(choice.id));
      if (!availableChoiceIds.has(choice.id)) rejected(state, { type: 'choose', choiceId: choice.id }, ['unavailable-choice']);
    }
    const transitionsHere = choices.map(choice => ({ payload: { type: 'choose', choiceId: choice.id }, coveredChoice: choice.id }));
    for (const question of engine.availableQuestionsV2(canonical, state)) {
      if (question.id === 'q.julian-disappearance' && state.currentScene !== 'a1.found') {
        throw new Error(`${question.id}: submission before the completed Julian disclosure would skip the shared story (${state.currentScene})`);
      }
      const definition = questions.get(question.id);
      if (!question.candidates.some(candidate => candidate.id === definition.supportedCandidateId)) continue;
      rejected(state, { type: 'submitDeduction', questionId: question.id, candidateId: definition.supportedCandidateId, selectedRefs: [] }, ['premature']);
      rejected(state, { type: 'submitDeduction', questionId: question.id, candidateId: definition.supportedCandidateId, selectedRefs: ['mercy.unencountered-reference'] }, ['unknown-reference']);
      for (const witness of engine.compileProofV2(definition.proof)) {
        if (!witness.refs.every(ref => state.sources.some(source => source.id === ref) || state.deductions.some(deduction => deduction.id === ref))) continue;
        transitionsHere.push({ payload: { type: 'submitDeduction', questionId: question.id,
          candidateId: definition.supportedCandidateId, selectedRefs: witness.refs }, proofRoute: `${question.id}:${witness.refs.join('+')}` });
        for (const candidate of question.candidates) if (candidate.id !== definition.supportedCandidateId) {
          rejected(state, { type: 'submitDeduction', questionId: question.id, candidateId: candidate.id, selectedRefs: witness.refs }, ['unsupported', 'contradictory']);
        }
      }
    }
    for (const hint of engine.availableHintsV2(canonical, state)) {
      if (hint.reveals) transitionsHere.push({ payload: { type: 'requestHint', hintId: hint.id } });
      else if (!covered.hints.has(hint.id)) {
        const result = execute(state, { type: 'requestHint', hintId: hint.id });
        if (!result.ok) throw new Error(`${hint.id}: ordinary hint rejected: ${result.error.code}`);
        remember('hints', hint.id, result.state); optionalChecks++;
      }
    }
    for (const reading of engine.availableInterpretationsV2(canonical, state)) if (!covered.readings.has(reading.id)) {
      const result = execute(state, { type: 'reviewInterpretation', interpretationId: reading.id });
      if (!result.ok) throw new Error(`${reading.id}: available interpretation rejected: ${result.error.code}`);
      remember('readings', reading.id, result.state); optionalChecks++;
    }
    let acceptedHere = 0;
    for (const action of transitionsHere) {
      const result = execute(state, action.payload);
      if (!result.ok) {
        if (action.proofRoute && ['unsupported', 'premature'].includes(result.error.code)) {
          failedProofs.set(action.proofRoute, result.error.code); continue;
        }
        throw new Error(`${state.currentScene}: offered action rejected (${result.error.code}): ${JSON.stringify(action.payload)}`);
      }
      transitions++; acceptedHere++;
      const next = result.state;
      if (action.coveredChoice) remember('choices', action.coveredChoice, next);
      if (action.proofRoute) { remember('questions', action.payload.questionId, next); remember('proofRoutes', action.proofRoute, next); }
      if (action.payload.type === 'requestHint') remember('hints', action.payload.hintId, next);
      capture(next);
      const key = keyFor(next);
      let nextIndex = indices.get(key);
      if (nextIndex === undefined) {
        if (nodes.length >= maxStates) throw new Error(`Mercy exploration reached its explicit ${maxStates}-state bound; no complete-path claim is available.`);
        nextIndex = nodes.length; indices.set(key, nextIndex);
        nodes.push({ state: next, scene: next.currentScene, ended: next.ended, edges: new Set(), parent: cursor, payload: action.payload });
      }
      node.edges.add(nextIndex);
    }
    if (!acceptedHere) throw new Error(`Nonterminal dead end at ${state.currentScene}: ${JSON.stringify(trace(state))}`);
    node.state = null;
    if (cursor && cursor % 100 === 0) console.log(`Mercy: ${cursor} semantic states verified, ${nodes.length} reached.`);
  }
  const canEnd = new Set(nodes.flatMap((node, index) => node.ended ? [index] : []));
  for (let changed = true; changed;) {
    changed = false;
    for (const [index, node] of nodes.entries()) if (!canEnd.has(index) && [...node.edges].some(next => canEnd.has(next))) {
      canEnd.add(index); changed = true;
    }
  }
  const trapped = nodes.flatMap((node, index) => canEnd.has(index) ? [] : [{ index, scene: node.scene }]);
  if (trapped.length) throw new Error(`Reachable states without an ending path: ${JSON.stringify(trapped.slice(0, 10))}`);
  const expected = {
    scenes: canonical.scenes.map(scene => scene.id), choices: canonical.scenes.flatMap(scene => scene.choices.map(choice => choice.id)),
    variants: canonical.scenes.flatMap(scene => [`${scene.id}::${scene.id}.base`, ...(scene.variants ?? []).map(variant => `${scene.id}::${variant.id}`)]),
    sources: canonical.sources.map(source => source.id), questions: canonical.questions.map(question => question.id),
    proofRoutes: canonical.questions.flatMap(question => engine.compileProofV2(question.proof).map(witness => `${question.id}:${witness.refs.join('+')}`)),
    endings: [...new Set(canonical.scenes.flatMap(scene => scene.choices.filter(choice => choice.ending).map(choice => choice.target)))],
    hints: canonical.hints.map(hint => hint.id), readings: canonical.interpretationRules.map(rule => rule.id),
  };
  const missing = Object.fromEntries(Object.entries(expected).map(([kind, ids]) => [kind, ids.filter(id => !covered[kind].has(id))]));
  // A base paragraph can deliberately be replaced by an unconditional final variant.
  missing.variants = missing.variants.filter(id => !id.endsWith('.base') || !scenes.get(id.split('::')[0]).variants?.some(variant =>
    !variant.requires.length && (!variant.when || variant.when.op === 'always')));
  if (Object.values(missing).some(ids => ids.length)) throw new Error(`Unwitnessed authored content: ${JSON.stringify(missing)}`);

  const terminalWitnesses = [...witnesses.values()].filter(witness => witness.kind === 'variants' && witness.terminal).concat([...completeProofWitnesses.values()]);
  const replayed = [];
  for (const witness of terminalWitnesses) {
    // A local dialogue branch has no later semantic effects, so the abstraction
    // can merge its onward state. Rebuild this concrete UI route to cover it.
    if (witness.proofQuestionId) {
      const position = witness.commands.findIndex(command => command.choiceId === 'a2.press-essence');
      if (position >= 0) {
        const purpose = scenes.get('a2.purpose');
        if (purpose?.choices.length !== 1 || purpose.choices[0].target !== 'a2.reason') throw new Error('The alternate philosophical response no longer converges as authored.');
        witness.commands[position] = { type: 'choose', choiceId: 'a2.press-purpose' };
        witness.commands[position + 1] = { type: 'choose', choiceId: purpose.choices[0].id };
      }
    }
    let state = engine.createGameV2(canonical);
    for (const payload of witness.commands) {
      const result = execute(state, payload);
      if (!result.ok) throw new Error(`Ending witness replay failed at ${state.currentScene}: ${result.error.code}`);
      state = result.state;
    }
    const exported = engine.exportPortableV2(state), imported = engine.importPortableV2(canonical, exported);
    if (!imported.ok || JSON.stringify(imported.value.transcript) !== JSON.stringify(state.transcript)) throw new Error(`${witness.id}: exact encountered replay failed`);
    const stateValidation = engine.validateStateV2(canonical, state);
    if (!stateValidation.ok) throw new Error(`${witness.id}: invalid terminal state ${stateValidation.errors.join('; ')}`);
    const variantName = witness.variantId.startsWith(`${witness.sceneId}.`) ? witness.variantId.slice(witness.sceneId.length + 1) : witness.variantId;
    const exportName = `${witness.sceneId}--${variantName}${witness.proofQuestionId ? `--proof-${witness.proofQuestionId}` : ''}`;
    const filename = exportName.replace(/[^a-zA-Z0-9_.-]/g, '_') + '.encountered-run.json';
    await writeFile(resolve(evidenceRoot, filename), exported + '\n');
    replayed.push({ sceneId: witness.sceneId, variantId: witness.variantId, exportFile: `docs/execution/evidence/mercy-content/${filename}`,
      revisions: state.revision, encounteredPassageWords: state.transcript.filter(event => event.kind === 'passage').reduce((sum, event) => sum + event.paragraphs.join(' ').trim().split(/\s+/).length, 0),
      transcriptSha256: sha(JSON.stringify(state.transcript)), exportBytes: Buffer.byteLength(exported) });
  }
  const sourceHashesAfter = await capturePins();
  if (JSON.stringify(sourceHashes) !== JSON.stringify(sourceHashesAfter)) throw new Error('Sources changed during Mercy verification; rerun after the lead correction batch.');
  const report = {
    outcome: 'PASS', contentSha256: compiled.contentSha256, contentHash: compiled.contentHash,
    semanticStates: nodes.length, transitions, maxStates, rejectedChecks, optionalChecks,
    sourceStable: true, sourceHashes,
    nonterminalDeadEnds: 0, statesWithoutEndingPath: 0,
    scope: 'All reachable content choices and supported minimal proof routes under a semantics-preserving projection of read guards, factual references, deduction ancestry and NPC guard knowledge. Cosmetic dialogue flags and optional already-available notebook readings do not multiply states. Ordinary hints/readings are accepted once each. Repeated transcripts, all corroborator supersets and human comprehension are outside this finite check.',
    coverage: Object.fromEntries(Object.entries(covered).map(([kind, ids]) => [kind, [...ids].sort()])),
    guardOutcomes: Object.fromEntries([...conditions].map(([name, values]) => [name, [...values].sort()])),
    unacceptedProofRoutes: Object.fromEntries([...failedProofs].filter(([id]) => !covered.proofRoutes.has(id))),
    missing, exactReplayedEndings: replayed,
  };
  await mkdir(evidenceRoot, { recursive: true });
  await writeFile(resolve(evidenceRoot, 'verification.json'), json(report));
  await writeFile(resolve(evidenceRoot, 'witnesses.json'), json({ contentSha256: compiled.contentSha256, contentHash: compiled.contentHash,
    commandContract: 'Recreate id/expectedRevision at each step; supply confirmationForV2 for ending and irreversible choices. Each witness starts from a fresh run.',
    witnesses: [...witnesses.values(), ...completeProofWitnesses.values()] }));
  return report;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const report = await verifyMercy();
    console.log(JSON.stringify({ outcome: report.outcome, semanticStates: report.semanticStates,
      transitions: report.transitions, exactReplayedEndings: report.exactReplayedEndings }, null, 2));
  } catch (error) { console.error(error.stack); process.exitCode = 1; }
}
