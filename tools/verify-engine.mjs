import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const project = dirname(dirname(fileURLToPath(import.meta.url)));
const temporary = await mkdtemp(join(tmpdir(), 'literary-verification-'));
try {
  const output = join(temporary, 'runner.mjs');
  await build({ entryPoints: [join(project, 'tools/verify-runner.ts')], outfile: output, bundle: true, platform: 'node', format: 'esm', target: 'node24' });
  await import(pathToFileURL(output).href);
} finally { await rm(temporary, { recursive: true, force: true }); }
