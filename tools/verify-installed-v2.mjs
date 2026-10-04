import { spawnSync } from 'node:child_process';
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { build } from 'esbuild';

const artifactDir = resolve('tests/verification/artifacts/installed-v2');
await mkdir(artifactDir, { recursive: true });
const testFiles = (await readdir('tests/verification')).filter(name => /^installed-v2-.*\.test\.ts$/.test(name)).sort().map(name => `tests/verification/${name}`);
const engineFiles = (await readdir('src/engine')).filter(name => name.endsWith('.ts')).sort().map(name => `src/engine/${name}`);
const sourceFiles = [...engineFiles, ...testFiles, 'src/content/case-v2.json', 'src/content/legacy/case-v1.json', 'src/content/compatibility/short-case-v1-to-blaise-v2.json', 'src/content/load-evidence.ts', 'src/main.tsx', 'src/Release.tsx', 'docs/contracts/EVIDENCE-KNOWLEDGE-V2.md', 'package.json', 'pnpm-lock.yaml', 'tools/verify-installed-v2.mjs'];
const capture = async () => Object.fromEntries(await Promise.all(sourceFiles.map(async path => [path, createHash('sha256').update(await readFile(path)).digest('hex')])));
const before = await capture();
const childArgs = ['node_modules/vitest/vitest.mjs', 'run', ...testFiles, '--reporter=verbose'];
const child = spawnSync(process.execPath, childArgs, { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
process.stdout.write(child.stdout ?? ''); process.stderr.write(child.stderr ?? '');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const testOutcome = child.status === 0 ? 'PASS' : 'FAIL';
const count = /Tests\s+(\d+) passed \((\d+)\)/.exec(child.stdout ?? '');

const scope = 'Conditional accepted-navigation reachability from a fresh installed first-night case. Fresh command IDs/current receipts and sufficient revision/byte budget assumed. Not transcript/UI/rejection equivalence, legacy-seed universality, full history, time loop or final game.';
let exploration = { outcome: 'INCONCLUSIVE', scope, states: 0, transitions: 0, expanded: 0, frontier: 0, stopReason: 'not-run', failures: [] };
if (before['src/content/case-v2.json'] !== '8b87c77df304f5bcccaa5f7ae6407997eaa9b0f1a40dca54b7bfde08e1b95751' || before['src/engine/evidence-runtime.ts'] !== '7084f4240416b1283bbaa9270797b0d4e0f373dad88e8b112f88f4add2979948') {
  exploration.stopReason = 'unreviewed-content-or-runtime-hash';
} else if (child.status === 0) {
  const bundled = await build({ stdin: { contents: "export * from './src/engine/evidence-v2'; export {contentHash,stateHash,canonicalJSON} from './src/engine/hash'; export {firstNightCase as installedCase,replayContext,migrationInstalled} from './src/content/load-evidence';", resolveDir: process.cwd(), sourcefile: 'installed-verification-entry.ts' }, bundle: true, write: false, platform: 'node', format: 'esm', target: 'node24', logLevel: 'silent' });
  const runtime = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`);
  if (!runtime.installedCase.ok) throw new Error(runtime.installedCase.errors.join('\n'));
  const content = runtime.installedCase.value;
  const budget = { states: Number(process.env.INSTALLED_VERIFY_STATES ?? 25000), transitions: Number(process.env.INSTALLED_VERIFY_TRANSITIONS ?? 500000), milliseconds: Number(process.env.INSTALLED_VERIFY_MS ?? 60000) };
  if (Object.values(budget).some(value => !Number.isInteger(value) || value < 1)) throw new Error('Budgets must be positive integers.');
  const guardFlags = new Set(), conditionOps = new Set(), proofRefs = new Set();
  const inspect = condition => { if (!condition) return; conditionOps.add(condition.op); if (condition.op === 'flag') guardFlags.add(condition.id); for (const arg of condition.args ?? []) inspect(arg); if (condition.arg) inspect(condition.arg); };
  for (const scene of content.scenes) {
    for (const flag of scene.requires ?? []) guardFlags.add(flag); inspect(scene.when);
    for (const choice of scene.choices) { for (const flag of [...(choice.requires ?? []), ...(choice.unless ?? [])]) guardFlags.add(flag); inspect(choice.when); }
    // A variant affects future acquisition when its delivered source IDs differ.
    for (const variant of scene.variants ?? []) if (runtime.canonicalJSON(variant.sourceIds ?? scene.sourceIds ?? []) !== runtime.canonicalJSON(scene.sourceIds ?? [])) { for (const flag of variant.requires) guardFlags.add(flag); inspect(variant.when); }
  }
  for (const question of content.questions) { inspect(question.when); for (const candidate of question.candidates) inspect(candidate.when); for (const feedback of question.feedback) inspect(feedback.when); }
  for (const rule of content.interpretationRules) inspect(rule.when);
  for (const hint of content.hints) inspect(hint.when);
  const inspectProof = node => { if (node.op === 'ref') proofRefs.add(node.refId); else for (const child of node.args) inspectProof(child); };
  for (const question of content.questions) inspectProof(question.proof);
  const fixedWitnesses = [ ['continuous-recording'], ['request-before-cut', 'ada-cut', 'binding-test'], ['request-before-cut', 'ada-cut', 'present-empty-release-test', 'present-impact-geometry', 'present-simon-binding'], ['request-before-cut', 'ada-cut', 'present-empty-release-test', 'present-impact-geometry', 'simon-account'] ];
  const sourceIds = new Set(content.sources.map(source => source.id));
  if (content.questions.length !== 1 || content.questions[0].id !== 'accident-sequence' || [...proofRefs].some(id => !sourceIds.has(id))) throw new Error('Proof projection requires a fresh audit: this case must use source-only proofs.');
  const ids = records => records.map(record => record.id).sort();
  const key = state => runtime.canonicalJSON({ contentHash: state.contentHash, contentId: state.contentId, contentVersion: state.contentVersion, schemaVersion: state.schemaVersion, engineVersion: state.engineVersion, scene: state.currentScene, ended: state.ended, flags: state.flags.filter(flag => guardFlags.has(flag)).sort(), sources: ids(state.sources), deductions: ids(state.deductions), eligibleReadings: ids(state.eligibleInterpretations), encounteredReadings: ids(state.interpretations), hints: ids(state.hints), npc: state.npcState.map(npc => ({ id: npc.id, knows: [...npc.knows].sort(), believes: [...npc.believes].sort(), claims: npc.claims.map(claim => claim.sourceId).sort() })).sort((a, b) => a.id.localeCompare(b.id, 'en')) });
  function descriptors(state) {
    const result = runtime.availableChoicesV2(content, state).map(choice => ({ token: `choice:${choice.id}`, body: { type: 'choose', choiceId: choice.id }, confirm: choice.ending || choice.irreversible }));
    if (runtime.availableQuestionsV2(content, state).some(question => question.id === 'accident-sequence')) for (const refs of fixedWitnesses) if (refs.every(ref => state.sources.some(source => source.id === ref))) result.push({ token: `proof:${[...refs].sort().join(',')}`, body: { type: 'submitDeduction', questionId: 'accident-sequence', candidateId: 'rescue-then-impact', selectedRefs: refs }, confirm: false });
    for (const hint of runtime.availableHintsV2(content, state)) result.push({ token: `hint:${hint.id}`, body: { type: 'requestHint', hintId: hint.id }, confirm: hint.reveals });
    for (const reading of runtime.availableInterpretationsV2(content, state)) result.push({ token: `reading:${reading.id}`, body: { type: 'reviewInterpretation', interpretationId: reading.id }, confirm: false });
    return result;
  }
  let serial = 0;
  function dispatch(state, descriptor) { const command = { ...descriptor.body, id: `navigation.${serial++}`, expectedRevision: state.revision }; if (descriptor.confirm) command.confirmation = runtime.confirmationForV2(state, command); return { command, result: runtime.applyCommandV2(content, state, command) }; }
  const initial = runtime.createGameV2(content), initialKey = key(initial);
  const nodes = [{ state: initial, key: initialKey, parent: null, command: null, successors: new Set(), tokens: null }], seen = new Map([[initialKey, 0]]), terminalIds = [], failures = [], scenes = new Set([initial.currentScene]), choices = new Set();
  const started = Date.now(); let head = 0, transitions = 0, equivalencePairs = 0, availabilityComparisons = 0, stopReason = 'complete';
  const traceFor = index => { const commands = []; while (nodes[index].parent !== null) { commands.push(nodes[index].command); index = nodes[index].parent; } return commands.reverse(); };
  outer: while (head < nodes.length) {
    if (Date.now() - started >= budget.milliseconds) { stopReason = 'time-budget'; break; }
    const node = nodes[head], offered = descriptors(node.state); node.tokens = offered.map(action => action.token).sort();
    if (node.state.ended) terminalIds.push(head);
    if (!node.state.ended && offered.length === 0) { failures.push({ kind: 'nonterminal-dead-end', commands: traceFor(head), stateHash: runtime.stateHash(node.state), currentScene: node.state.currentScene }); stopReason = 'concrete-failure'; break; }
    for (const action of offered) {
      if (transitions >= budget.transitions) { stopReason = 'transition-budget'; break outer; }
      if (Date.now() - started >= budget.milliseconds) { stopReason = 'time-budget'; break outer; }
      const { command, result } = dispatch(node.state, action); transitions++;
      if (!result.ok) { failures.push({ kind: 'advertised-action-rejected', action: action.token, error: result.error, commands: [...traceFor(head), command] }); stopReason = result.error.code === 'resource-limit' ? 'resource-budget-outside-quotient' : 'concrete-failure'; break outer; }
      scenes.add(result.state.currentScene); if (command.type === 'choose') choices.add(command.choiceId);
      const nextKey = key(result.state); let nextIndex = seen.get(nextKey);
      if (nextIndex === undefined) {
        if (nodes.length >= budget.states) { stopReason = 'state-budget'; break outer; }
        nextIndex = nodes.length; seen.set(nextKey, nextIndex); nodes.push({ state: result.state, key: nextKey, parent: head, command, successors: new Set(), tokens: null });
      } else {
        equivalencePairs++;
        const original = nodes[nextIndex];
        const tokens = descriptors(result.state).map(descriptor => descriptor.token).sort();
        const originalTokens = original.tokens ?? descriptors(original.state).map(descriptor => descriptor.token).sort(); original.tokens = originalTokens;
        availabilityComparisons++;
        if (runtime.canonicalJSON(tokens) !== runtime.canonicalJSON(originalTokens)) { failures.push({ kind: 'invalid-guard-projection', original: traceFor(nextIndex), alternate: [...traceFor(head), command], originalTokens, alternateTokens: tokens }); stopReason = 'concrete-failure'; break outer; }
      }
      node.successors.add(nextIndex);
    }
    head++;
  }
  let outcome = failures.some(failure => failure.kind !== 'advertised-action-rejected' || failure.error?.code !== 'resource-limit') ? 'FAIL' : stopReason === 'complete' ? 'PASS' : 'INCONCLUSIVE';
  let maximumMinimumTerminalDistance = null;
  if (stopReason === 'complete') {
    const reverse = nodes.map(() => []); nodes.forEach((node, index) => { for (const successor of node.successors) reverse[successor].push(index); });
    const distance = new Map(terminalIds.map(index => [index, 0])), queue = [...terminalIds];
    for (let cursor = 0; cursor < queue.length; cursor++) for (const predecessor of reverse[queue[cursor]]) if (!distance.has(predecessor)) { distance.set(predecessor, distance.get(queue[cursor]) + 1); queue.push(predecessor); }
    const stranded = nodes.findIndex((_, index) => !distance.has(index));
    if (stranded >= 0) { failures.push({ kind: 'complete-component-with-no-terminal-path', commands: traceFor(stranded), stateHash: runtime.stateHash(nodes[stranded].state) }); outcome = 'FAIL'; }
    else maximumMinimumTerminalDistance = Math.max(...distance.values());
  }
  const terminalWitnesses = [];
  for (const index of terminalIds) if (!terminalWitnesses.some(witness => witness.scene === nodes[index].state.currentScene)) {
    const commands = traceFor(index); let replay = runtime.createGameV2(content);
    for (const command of commands) { const result = runtime.applyCommandV2(content, replay, command); if (!result.ok) throw new Error('Terminal witness failed exact replay'); replay = result.state; }
    if (runtime.stateHash(replay) !== runtime.stateHash(nodes[index].state)) throw new Error('Terminal replay checksum differs');
    terminalWitnesses.push({ scene: replay.currentScene, commands, stateHash: runtime.stateHash(replay) });
  }
  exploration = { outcome, scope, budget, states: nodes.length, transitions, expanded: head, frontier: nodes.length - head, stopReason, milliseconds: Date.now() - started, guardFlags: [...guardFlags].sort(), conditionOps: [...conditionOps].sort(), proofReferences: [...proofRefs].sort(), projectionFields: ['content identity/version', 'current scene', 'ended', 'guard and source-delivery flags', 'all known source IDs', 'accepted deduction IDs (source-only proof audit)', 'eligible and encountered interpretation IDs', 'received hint IDs', 'NPC knowledge/belief/claim IDs'], omittedFields: ['revision/resource budgets under explicit assumption', 'transcript and accepted history', 'source/record acquisition timestamps and literal copies', 'relationship records and prose-only flags', 'selected/witness refs because no proof references a deduction and no guard reads ancestry'], representativeMaximumRevision: Math.max(...nodes.map(node => node.state.revision)), equivalencePairs, availabilityComparisons, maximumMinimumTerminalDistance, scenesReached: [...scenes].sort(), choicesUsed: [...choices].sort(), terminalWitnesses, frontierSample: nodes.slice(head, head + 3).map(node => ({ currentScene: node.state.currentScene, revision: node.state.revision, projectedKey: node.key })), failures };
  console.log(`${exploration.outcome} conditional navigation: states=${exploration.states}, transitions=${exploration.transitions}, frontier=${exploration.frontier}, stop=${exploration.stopReason}`);
}
const after = await capture(), sourceStable = JSON.stringify(before) === JSON.stringify(after);
const report = { outcome: testOutcome === 'FAIL' || exploration.outcome === 'FAIL' ? 'FAIL' : !sourceStable || exploration.outcome === 'INCONCLUSIVE' ? 'INCONCLUSIVE' : 'PASS', testedAt: new Date().toISOString(), command: 'node tools/verify-installed-v2.mjs', childCommand: [process.execPath, ...childArgs].join(' '), environment: { node: process.version, platform: process.platform, arch: process.arch }, sourceStable, sourceHashes: before, sourceHashesAfter: after, changedSources: sourceFiles.filter(path => before[path] !== after[path]), tests: { outcome: testOutcome, passed: count ? Number(count[1]) : null, exitStatus: child.status, stdout: child.stdout, stderr: child.stderr }, exploration };
await writeFile(resolve(artifactDir, `run-${stamp}.json`), JSON.stringify(report, null, 2) + '\n');
await writeFile(resolve(artifactDir, 'latest.json'), JSON.stringify(report, null, 2) + '\n');
console.log(`${report.outcome} installed-case verification; tests=${report.tests.outcome}; sourceStable=${sourceStable}`);
process.exitCode = report.outcome === 'FAIL' ? 1 : report.outcome === 'INCONCLUSIVE' ? 2 : 0;
