import { spawnSync } from 'node:child_process';
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const sources = ['package.json', 'pnpm-lock.yaml', 'src/engine/game.ts', 'src/engine/types.ts', 'src/engine/hash.ts', 'src/engine/schema.ts', 'src/engine/validate.ts', 'src/persistence/store.ts', 'src/content/fixture.ts', 'docs/contracts/ENGINE-API.md', 'tools/verify-explorer.ts', ...((await readdir(resolve('tests/verification'))).filter(path => path.endsWith('.test.ts')).map(path => `tests/verification/${path}`))];
try { await readFile(resolve('src/content/case.json')); sources.push('src/content/case.json'); } catch {}
const capture = async () => Object.fromEntries(await Promise.all(sources.map(async path => [path, createHash('sha256').update(await readFile(resolve(path))).digest('hex')])));
const before = await capture();
const args = ['node_modules/vitest/vitest.mjs', 'run', 'tests/verification', '--reporter=verbose'];
const result = spawnSync(process.execPath, args, { cwd: process.cwd(), encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, env: process.env });
process.stdout.write(result.stdout ?? ''); process.stderr.write(result.stderr ?? '');
const after = await capture(), sourceStable = JSON.stringify(before) === JSON.stringify(after);
const outcome = result.status !== 0 ? 'FAIL' : sourceStable ? 'PASS' : 'INCONCLUSIVE';
console.log(`${outcome} independent tests; seed=${process.env.VERIFY_SEED ?? 20261003} runs=${process.env.VERIFY_RUNS ?? 120}; sourceStable=${sourceStable}`);
await mkdir(resolve('tests/verification/artifacts'), { recursive: true });
await writeFile(resolve('tests/verification/artifacts/tests.json'), JSON.stringify({ outcome, testedAt: new Date().toISOString(), command: 'node tools/verify-tests.mjs', childCommand: [process.execPath, ...args].join(' '), environment: { node: process.version, platform: process.platform, arch: process.arch }, seed: Number(process.env.VERIFY_SEED ?? 20261003), propertyRuns: Number(process.env.VERIFY_RUNS ?? 120), sourceStable, sourceHashes: before, sourceHashesAfter: after, exitStatus: result.status, error: result.error?.message, stdout: result.stdout, stderr: result.stderr }, null, 2) + '\n');
process.exitCode = outcome === 'FAIL' ? 1 : outcome === 'INCONCLUSIVE' ? 2 : 0;
