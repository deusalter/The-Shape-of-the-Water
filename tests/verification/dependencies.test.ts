import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve, relative } from 'node:path';
import ts from 'typescript';
import { expect, test, vi } from 'vitest';
import { applyChoice, createGame, serializePlayerExport, validateContent, validateState } from '../../src/engine/game';
import { fixtureContent } from '../../src/content/fixture';

/** AST-based transitive import audit, not a text search fooled by comments/strings. */
function auditClosure(entrypoints: string[]) {
  const engine = resolve('src/engine');
  const queue = entrypoints.map(name => join(engine, name));
  const visited = new Set<string>(), violations: string[] = [];
  const forbidden = new Set(['Date', 'fetch', 'window', 'document', 'navigator', 'indexedDB', 'localStorage', 'sessionStorage', 'XMLHttpRequest', 'WebSocket', 'BroadcastChannel', 'Worker', 'SharedWorker', 'performance', 'setTimeout', 'setInterval', 'requestAnimationFrame', 'crypto', 'process', 'eval', 'Function', 'require', 'globalThis', 'global']);
  while (queue.length) {
    const file = queue.pop()!; if (visited.has(file)) continue; visited.add(file);
    const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    function visit(node: ts.Node): void {
      if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
        const specifier = node.moduleSpecifier;
        if (specifier && ts.isStringLiteral(specifier)) {
          const target = specifier.text;
          if (!target.startsWith('.')) { if (target !== 'zod') violations.push(`${relative(process.cwd(), file)} imports unreviewed external dependency ${target}`); }
          else { const path = resolve(dirname(file), `${target.replace(/\.ts$/, '')}.ts`); if (!path.startsWith(engine + '/')) violations.push(`${file} imports outside engine: ${target}`); else queue.push(path); }
        }
      }
      if (ts.isIdentifier(node) && forbidden.has(node.text)) violations.push(`${relative(process.cwd(), file)}:${source.getLineAndCharacterOfPosition(node.getStart()).line + 1} ambient ${node.text}`);
      if (ts.isPropertyAccessExpression(node) && node.expression.getText(source) === 'Math' && node.name.text === 'random') violations.push(`${file}: Math.random`);
      if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) violations.push(`${file}: dynamic import`);
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
  return { files: [...visited].map(file => relative(engine, file)).sort(), violations };
}
const legacyModules = ['game.ts', 'hash.ts', 'schema.ts', 'types.ts', 'validate.ts'];
const evidenceRuntimeModules = ['evidence-budget.ts', 'evidence-migration.ts', 'evidence-portable.ts', 'evidence-proof.ts', 'evidence-runtime.ts', 'evidence-schema.ts', 'evidence-types.ts', 'evidence-v2.ts', 'evidence-validate.ts'];
test('legacy runtime preserves its explicit pure five-module dependency closure', () => {
  const result = auditClosure(['game.ts']);
  expect(result.files).toEqual(legacyModules);
  expect(result.violations).toEqual([]);
});
test('v2 facade dependency closure contains only the explicitly reviewed pure engine modules', () => {
  const result = auditClosure(['evidence-v2.ts']);
  expect(result.files).toEqual([...legacyModules, ...evidenceRuntimeModules].sort());
  expect(result.violations).toEqual([]);
});
test('every engine source including noncanonical fixture is audited and unexpected modules fail inventory', () => {
  const result = auditClosure(readdirSync(resolve('src/engine')).filter(name => name.endsWith('.ts')));
  expect(result.files).toEqual([...legacyModules, ...evidenceRuntimeModules, 'evidence-fixture.ts'].sort());
  expect(result.violations).toEqual([]);
});
test('exercised engine and Zod validation need no ambient time/random/DOM/storage/network', () => {
  const trap = () => { throw new Error('Engine called a forbidden ambient API'); };
  let successful = false;
  const randomness = vi.spyOn(Math, 'random').mockImplementation(trap);
  try {
    for (const name of ['Date', 'fetch', 'window', 'document', 'navigator', 'indexedDB', 'localStorage', 'sessionStorage', 'performance', 'XMLHttpRequest', 'WebSocket']) vi.stubGlobal(name, trap);
    const checked = validateContent(fixtureContent);
    if (!checked.ok) throw new Error(checked.errors.join('\n'));
    const initial = createGame(checked.value);
    const result = applyChoice(checked.value, initial, { id: 'purity.cup', choiceId: 'cup', expectedRevision: 0 });
    if (!result.ok) throw new Error(result.error.code);
    const exported = JSON.parse(serializePlayerExport(result.state));
    successful = validateState(checked.value, exported.state).ok;
  } finally { randomness.mockRestore(); vi.unstubAllGlobals(); }
  expect(successful).toBe(true);
});
