import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { posix } from 'node:path';

// This audit is tied to a reviewed historical engine. It cannot silently bless
// the new proof/knowledge engine under construction in the working directory.
const revision = process.argv[2] ?? 'c6c6845';
const auditedGameSha256 = '03e6dc0be8b1612ddc57c6f8384b975ca8c83f96195e606b1c01afc4c91e5434';
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const sources = new Map();
function historical(path) {
  if (!sources.has(path)) sources.set(path, execFileSync('git', ['show', `${revision}:${path}`], { maxBuffer: 16 * 1024 * 1024 }));
  return sources.get(path);
}
const budget = { states: Number(process.env.VERIFY_STATES ?? 25000), transitions: Number(process.env.VERIFY_TRANSITIONS ?? 500000), milliseconds: Number(process.env.VERIFY_TIME_MS ?? 60000) };
for (const [name, value] of Object.entries(budget)) if (!Number.isSafeInteger(value) || value < 1) throw Error(`Invalid ${name} budget`);
if (digest(historical('src/engine/game.ts')) !== auditedGameSha256) {
  console.log('INCONCLUSIVE: engine differs from the reviewed navigation-only guard audit; a new projection review is required.');
  process.exit(2);
}
const baselinePackage = JSON.parse(historical('package.json'));
const currentZod = createRequire(import.meta.url)('zod/package.json').version;
if (currentZod !== baselinePackage.dependencies.zod) throw Error(`Historical engine requires Zod ${baselinePackage.dependencies.zod}, installed ${currentZod}`);
const bundled = await build({
  entryPoints: ['baseline:src/engine/game.ts'], bundle: true, platform: 'node', format: 'esm', write: false, logLevel: 'silent',
  plugins: [{ name: 'pinned-git-source', setup(build) {
    build.onResolve({ filter: /^baseline:/ }, args => ({ path: args.path.slice(9), namespace: 'baseline-git' }));
    build.onResolve({ filter: /^\./, namespace: 'baseline-git' }, args => ({ path: posix.normalize(posix.join(posix.dirname(args.importer), `${args.path}.ts`)), namespace: 'baseline-git' }));
    build.onLoad({ filter: /.*/, namespace: 'baseline-git' }, args => ({ contents: historical(args.path).toString('utf8'), loader: 'ts', resolveDir: process.cwd() }));
  } }],
});
const engine = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`);
const checked = engine.validateContent(JSON.parse(historical('src/content/case.json')));
if (!checked.ok) throw Error(checked.errors.join('\n'));
const content = checked.value;
const guardFlags = new Set(content.scenes.flatMap(scene => [...(scene.requires ?? []), ...scene.choices.flatMap(choice => [...(choice.requires ?? []), ...(choice.unless ?? [])])]));
const omittedFlags = [...new Set(content.scenes.flatMap(scene => scene.choices.flatMap(choice => choice.effects ?? [])))].filter(flag => !guardFlags.has(flag)).sort();
const key = state => JSON.stringify({ contentId: state.contentId, contentVersion: state.contentVersion, contentHash: state.contentHash, scene: state.currentScene, ended: state.ended, flags: state.flags.filter(flag => guardFlags.has(flag)) });
const command = (state, choice, id) => { const base = { id, choiceId: choice.id, expectedRevision: state.revision }; return choice.ending || choice.irreversible ? { ...base, confirmation: engine.confirmationFor(state, base) } : base; };
const nodes = [{ state: engine.createGame(content), parent: -1 }], byKey = new Map([[key(nodes[0].state), 0]]), predecessors = [[]];
const trace = index => { const result = []; for (let i = index; nodes[i].parent >= 0; i = nodes[i].parent) result.push(nodes[i].command); return result.reverse(); };
const terminal = new Set(), witnesses = new Map(), scenes = new Set([content.start]), choices = new Set(), failures = [];
const started = performance.now();
let expanded = 0, transitions = 0, equivalencePairs = 0, equivalenceTransitions = 0, stop = 'complete';
outer: for (let head = 0; head < nodes.length; head++) {
  if (performance.now() - started >= budget.milliseconds) { stop = 'time-budget'; break; }
  const state = nodes[head].state;
  if (state.ended) {
    terminal.add(head);
    if (!witnesses.has(state.currentScene)) {
      const commands = trace(head); let replay = engine.createGame(content);
      for (const action of commands) { const result = engine.applyChoice(content, replay, action); if (!result.ok || result.duplicate) throw Error('Terminal trace failed replay'); replay = result.state; }
      if (!replay.ended || engine.stateHash(replay) !== engine.stateHash(state)) throw Error('Terminal trace hash differs');
      witnesses.set(state.currentScene, { endingScene: state.currentScene, commands, stateHash: engine.stateHash(replay) });
    }
    expanded++; continue;
  }
  const offered = engine.availableChoices(content, state);
  if (!offered.length) failures.push({ reason: 'Concrete nonterminal state has no offered choice', commands: trace(head) });
  for (const choice of offered) {
    if (transitions >= budget.transitions) { stop = 'transition-budget'; break outer; }
    if (performance.now() - started >= budget.milliseconds) { stop = 'time-budget'; break outer; }
    const action = command(state, choice, `core.${head}.${transitions}`), result = engine.applyChoice(content, state, action); transitions++;
    if (!result.ok || result.duplicate) { failures.push({ reason: `Advertised choice rejected: ${choice.id}`, commands: [...trace(head), action] }); continue; }
    choices.add(choice.id); scenes.add(result.state.currentScene);
    const projected = key(result.state), known = byKey.get(projected);
    if (known !== undefined) {
      predecessors[known].push(head);
      const representative = nodes[known].state;
      const a = engine.availableChoices(content, result.state), b = engine.availableChoices(content, representative);
      if (JSON.stringify(a.map(choice => choice.id)) !== JSON.stringify(b.map(choice => choice.id))) throw Error('Merged states offer different choices');
      equivalencePairs++;
      for (const next of a) {
        const actual = engine.applyChoice(content, result.state, command(result.state, next, `equiv.a.${equivalenceTransitions}`));
        const prior = engine.applyChoice(content, representative, command(representative, next, `equiv.b.${equivalenceTransitions}`));
        equivalenceTransitions++;
        if (!actual.ok || !prior.ok || key(actual.state) !== key(prior.state)) throw Error('Merged states have different projected successors');
      }
      continue;
    }
    if (nodes.length >= budget.states) { stop = 'state-budget'; break outer; }
    byKey.set(projected, nodes.length); predecessors.push([head]); nodes.push({ state: result.state, parent: head, command: action });
  }
  expanded++;
}
let maximumMinimumTerminalDistance = null;
if (stop === 'complete') {
  const distances = new Map([...terminal].map(index => [index, 0])), queue = [...terminal];
  for (let i = 0; i < queue.length; i++) for (const parent of predecessors[queue[i]]) if (!distances.has(parent)) { distances.set(parent, distances.get(queue[i]) + 1); queue.push(parent); }
  maximumMinimumTerminalDistance = Math.max(...distances.values());
  for (let i = 0; i < nodes.length; i++) if (!distances.has(i)) failures.push({ reason: 'No terminal path in the completely explored navigation component', commands: trace(i) });
}
const outcome = failures.length ? 'FAIL' : stop === 'complete' ? 'PASS' : 'INCONCLUSIVE';
const report = {
  outcome, scope: 'Pinned baseline navigation reachability only. Fresh IDs, current confirmations and enough remaining command budget are assumptions. Not full transcript, optional prose, knowledge, selected-proof, migration or 10,000-command-cap verification.',
  testedAt: new Date().toISOString(), command: `node tools/verify-guard-core.mjs ${revision}`, baselineRevision: revision, auditedGameSha256, contentHash: engine.contentHash(content), contentFileSha256: digest(historical('src/content/case.json')),
  guardFlags: [...guardFlags].sort(), omittedFlags, omittedState: ['observations', 'interpretations', 'relationships', 'transcript', 'processedCommandIds', 'revision'], projectionArgument: 'All baseline navigation predicates use scene/content identity/ended and finite requires/unless flag membership. Choice effects only add flags. Unreferenced flags and record/history data cannot alter these predicates. Supplied receipts are freshly computed. Revision cap remains outside this conditional claim; the tool refuses unreviewed game.ts hashes.',
  budget, states: nodes.length, transitions, expanded, frontier: nodes.length - expanded, stopReason: stop, milliseconds: Math.round(performance.now() - started), maximumMinimumTerminalDistance,
  scenesReached: [...scenes].sort(), choicesUsed: [...choices].sort(), equivalencePairs, equivalenceTransitions, terminalWitnesses: [...witnesses.values()], failures,
  sourceHashes: Object.fromEntries([...sources].map(([path, bytes]) => [path, digest(bytes)])), installedZod: currentZod, toolSha256: digest(readFileSync('tools/verify-guard-core.mjs')),
};
mkdirSync('tests/verification/artifacts', { recursive: true });
writeFileSync('tests/verification/artifacts/baseline-guard-core.json', JSON.stringify(report, null, 2) + '\n');
console.log(`${outcome} pinned baseline navigation: states=${report.states} transitions=${transitions} frontier=${report.frontier} equivalent-pairs=${equivalencePairs} equivalent-transitions=${equivalenceTransitions} max-terminal-distance=${maximumMinimumTerminalDistance} stop=${stop}`);
process.exitCode = outcome === 'FAIL' ? 1 : outcome === 'INCONCLUSIVE' ? 2 : 0;
