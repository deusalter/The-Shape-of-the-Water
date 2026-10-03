import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { validateContent, type Content } from '../src/engine/game';
import { fixtureContent } from '../src/content/fixture';
import { explore } from './verify-explorer';

const root = process.cwd();
const option = process.argv[2] ?? 'all';
if (!['fixture', 'case', 'all'].includes(option)) throw new Error('Usage: node tools/verify-engine.mjs [fixture|case|all]');
const requested = {
  states: Number(process.env.VERIFY_STATES ?? 25000),
  transitions: Number(process.env.VERIFY_TRANSITIONS ?? 500000),
  milliseconds: Number(process.env.VERIFY_TIME_MS ?? 60000),
};
const sources = ['package.json', 'pnpm-lock.yaml', 'src/engine/game.ts', 'src/engine/types.ts', 'src/engine/validate.ts', 'src/engine/schema.ts', 'src/engine/hash.ts', 'src/persistence/store.ts', 'src/content/fixture.ts', 'docs/contracts/ENGINE-API.md', 'docs/03-TECHNICAL-SPEC.md', 'docs/05-ACCEPTANCE-TESTS.md', 'docs/OWNER-KICKOFF-v4.md', 'tools/verify-explorer.ts', 'tools/verify-runner.ts', 'tools/verify-engine.mjs'];
const digest = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const captureHashes = async () => Object.fromEntries(await Promise.all(sources.map(async path => [path, digest(await readFile(resolve(root, path)))])));
const contents: { name: string; content: Content }[] = [];
if (option !== 'case') contents.push({ name: 'fixture', content: fixtureContent });
if (option !== 'fixture') {
  try {
    const bytes = await readFile(resolve(root, 'src/content/case.json'));
    const checked = validateContent(JSON.parse(bytes.toString('utf8')));
    if (!checked.ok) throw new Error(checked.errors.join('\n'));
    sources.push('src/content/case.json'); contents.push({ name: 'case', content: checked.value });
  } catch (error) {
    if (option === 'case' || !(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error;
    console.log('INCONCLUSIVE case: src/content/case.json is not installed; no authored-case route claim.');
  }
}
const before = await captureHashes();
const runs = [];
for (const { name, content } of contents) for (const mode of ['guard-abstraction', 'exact'] as const) {
  const result = explore(content, mode, requested);
  console.log(`${result.outcome} ${name} ${mode}: states=${result.states} transitions=${result.transitions} expanded=${result.expanded} frontier=${result.frontier} stop=${result.stopReason} terminals=${result.terminalTraces.length}`);
  runs.push({ name, ...result });
}
const after = await captureHashes(), sourceStable = JSON.stringify(before) === JSON.stringify(after);
if (!sourceStable) console.log('INCONCLUSIVE source changed while verification ran; rerun required.');
const artifact = { testedAt: new Date().toISOString(), environment: { node: process.version, platform: process.platform, arch: process.arch }, command: `node tools/verify-engine.mjs ${option}`, sourceStable, sourceHashes: before, sourceHashesAfter: after, runs };
await mkdir(resolve(root, 'tests/verification/artifacts'), { recursive: true });
await writeFile(resolve(root, `tests/verification/artifacts/exploration-${option}.json`), JSON.stringify(artifact, null, 2) + '\n');
if (runs.some(run => run.outcome === 'FAIL')) process.exitCode = 1;
else if (!sourceStable || runs.some(run => run.outcome === 'INCONCLUSIVE')) process.exitCode = 2;
