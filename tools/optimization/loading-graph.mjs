import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const baselineRevision = execFileSync('git', ['rev-parse', process.argv[2] ?? 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
const destination = path.resolve(root, process.argv[3] ?? 'docs/execution/evidence/mercy-optimization/loading/entry-graph.json');
const baselineRoot = mkdtempSync(path.join(tmpdir(), 'mercy-loading-baseline-'));

function staticClosure(graph, entries) {
  const visited = new Set();
  function visit(key) {
    if (visited.has(key) || !graph[key]) return;
    visited.add(key);
    for (const dependency of graph[key].imports ?? []) {
      if (!dependency.external && dependency.kind !== 'dynamic-import') visit(dependency.path);
    }
  }
  entries.forEach(visit);
  return [...visited].sort();
}

async function inspect(sourceRoot) {
  const result = await build({
    absWorkingDir: sourceRoot, entryPoints: ['src/main.tsx', 'src/studio-main.tsx'],
    bundle: true, splitting: true, format: 'esm', platform: 'browser',
    target: 'es2022', minify: true, metafile: true, write: false,
    outdir: 'loading-analysis', logLevel: 'silent',
    nodePaths: [path.join(root, 'node_modules')],
    define: { 'import.meta.env.BASE_URL': '"./"' },
  });
  const files = new Map(result.outputFiles.map(file => [path.relative(sourceRoot, file.path), file.contents]));
  const entries = {};
  for (const sourceEntry of ['src/main.tsx', 'src/studio-main.tsx']) {
    const outputEntry = Object.entries(result.metafile.outputs).find(([, info]) => info.entryPoint === sourceEntry)?.[0];
    if (!outputEntry) throw Error(`No entry output for ${sourceEntry}`);
    const eagerInputs = staticClosure(result.metafile.inputs, [sourceEntry]);
    const eagerOutputs = staticClosure(result.metafile.outputs, [outputEntry]).filter(file => file.endsWith('.js'));
    entries[sourceEntry] = {
      eagerJavaScriptBytes: eagerOutputs.reduce((sum, file) => sum + result.metafile.outputs[file].bytes, 0),
      eagerJavaScriptGzipBytes: eagerOutputs.reduce((sum, file) => sum + gzipSync(files.get(file)).byteLength, 0),
      eagerOutputFiles: eagerOutputs,
      eagerStoryFiles: eagerInputs.filter(file => /^src\/content\/(?:legacy\/)?case-v\d+\.json$/.test(file)),
      eagerWorldFiles: eagerInputs.filter(file => /^src\/world\/.*(?:World\.tsx|\/profiles\.ts)$/.test(file)),
      eagerThreeFiles: eagerInputs.filter(file => /node_modules\/(?:\.pnpm\/.*\/node_modules\/)?three\//.test(file)),
      eagerInputCount: eagerInputs.length,
    };
  }
  return {
    entries,
    emittedJavaScript: Object.entries(result.metafile.outputs).filter(([file]) => file.endsWith('.js')).map(([file, info]) => ({
      file, bytes: info.bytes,
      storyFiles: Object.keys(info.inputs).filter(input => /^src\/content\/(?:legacy\/)?case-v\d+\.json$/.test(input)),
    })),
  };
}

try {
  const archive = execFileSync('git', ['archive', baselineRevision, 'src'], { cwd: root, maxBuffer: 64 * 1024 * 1024 });
  execFileSync('tar', ['-x', '-C', baselineRoot], { input: archive });
  const before = await inspect(baselineRoot);
  const after = await inspect(root);
  for (const [entry, info] of Object.entries(after.entries)) {
    if (info.eagerStoryFiles.length || info.eagerWorldFiles.length || info.eagerThreeFiles.length) {
      throw Error(`${entry} still eagerly imports story content or a world implementation`);
    }
  }
  const report = {
    status: 'PASS', scope: 'Independent minified esbuild module graph; not browser transfer/timing or the final Vite package.',
    baselineRevision, before, after,
    selectedContentSha256: createHash('sha256').update(readFileSync(path.join(root, 'src/content/case-v7.json'))).digest('hex'),
    playerEagerJavaScriptReduction: 1 - after.entries['src/main.tsx'].eagerJavaScriptBytes / before.entries['src/main.tsx'].eagerJavaScriptBytes,
  };
  mkdirSync(path.dirname(destination), { recursive: true });
  writeFileSync(destination, `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify({ status: report.status, evidence: path.relative(root, destination), before: before.entries, after: after.entries, playerEagerJavaScriptReduction: report.playerEagerJavaScriptReduction }, null, 2)}\n`);
} finally {
  rmSync(baselineRoot, { recursive: true, force: true });
}
