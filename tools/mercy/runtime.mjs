import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
let pending;

/** Use the shipped engine, not a second implementation of its rules. */
export function loadEngine() {
  pending ??= build({
    absWorkingDir: root,
    entryPoints: ['src/engine/evidence-v2.ts'],
    bundle: true,
    write: false,
    platform: 'node',
    format: 'esm',
    logLevel: 'silent',
  }).then(result => import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].contents).toString('base64')}`));
  return pending;
}
