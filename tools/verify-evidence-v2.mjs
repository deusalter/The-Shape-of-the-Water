import { spawnSync } from 'node:child_process';
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const output = resolve('tests/verification/artifacts/evidence-v2');
await mkdir(output, { recursive: true });
const engineFiles = (await readdir(resolve('src/engine'))).filter(name => name.endsWith('.ts')).sort().map(name => `src/engine/${name}`);
const testFiles = (await readdir(resolve('tests/verification'))).filter(name => /^evidence-v2-.*\.test\.ts$/.test(name)).sort().map(name => `tests/verification/${name}`);
const sourceFiles = [...engineFiles, ...testFiles, 'tests/verification/dependencies.test.ts', 'docs/contracts/EVIDENCE-KNOWLEDGE-V2.md', 'docs/contracts/ENGINE-API.md', 'package.json', 'pnpm-lock.yaml', 'tools/verify-evidence-v2.mjs'];
const capture = async () => Object.fromEntries(await Promise.all(sourceFiles.map(async path => [path, createHash('sha256').update(await readFile(resolve(path))).digest('hex')])));
const before = await capture();
const args = ['node_modules/vitest/vitest.mjs', 'run', ...testFiles, 'tests/verification/dependencies.test.ts', '--reporter=verbose'];
const result = spawnSync(process.execPath, args, { cwd: process.cwd(), encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, env: process.env });
process.stdout.write(result.stdout ?? ''); process.stderr.write(result.stderr ?? '');
const after = await capture(), sourceStable = JSON.stringify(before) === JSON.stringify(after);
const outcome = result.status !== 0 ? 'FAIL' : sourceStable ? 'PASS' : 'INCONCLUSIVE';
const countMatch = /Tests\s+(\d+) passed \((\d+)\)/.exec(result.stdout ?? '');
const report = {
  outcome, testedAt: new Date().toISOString(), command: 'node tools/verify-evidence-v2.mjs',
  childCommand: [process.execPath, ...args].join(' '), environment: { node: process.version, platform: process.platform, arch: process.arch },
  scope: 'Independent noncanonical V2 fixture tests and explicit engine dependency audit. No player UI, authored case, universal exploration, human review or final-game claim.',
  propertySeeds: [2026100303, 2026100304], propertyRuns: [60, 100],
  sourceStable, changedSources: sourceFiles.filter(path => before[path] !== after[path]), sourceHashes: before, sourceHashesAfter: after,
  passedTests: countMatch ? Number(countMatch[1]) : null, exitStatus: result.status, error: result.error?.message,
  stdout: result.stdout, stderr: result.stderr,
};
const stamp = report.testedAt.replace(/[:.]/g, '-');
await writeFile(resolve(output, `run-${stamp}.json`), JSON.stringify(report, null, 2) + '\n');
await writeFile(resolve(output, 'latest.json'), JSON.stringify(report, null, 2) + '\n');
console.log(`${outcome} independent V2 checks; sourceStable=${sourceStable}; evidence=${output}`);
process.exitCode = outcome === 'FAIL' ? 1 : outcome === 'INCONCLUSIVE' ? 2 : 0;
