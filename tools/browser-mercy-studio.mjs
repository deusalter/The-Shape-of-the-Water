import { chromium, expect } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { loadEngine } from './mercy/runtime.mjs';

const base = process.env.STUDIO_TEST_URL ?? 'http://localhost:4191/studio.html';
const folder = 'docs/execution/evidence/mercy-studio';
mkdirSync(folder, { recursive: true });
const content = JSON.parse(readFileSync('src/content/case-v7.json', 'utf8'));
const opening = content.scenes.find(scene => scene.id === content.start);
const changed = `${opening.paragraphs[0]} [Noncanonical studio persistence check.]`;
const expected = structuredClone(content);
expected.scenes.find(scene => scene.id === content.start).paragraphs[0] = changed;
const engine = await loadEngine();
const hash = path => createHash('sha256').update(readFileSync(path)).digest('hex');
const sourceHash = hash('src/content/case-v7.json');
const report = { status: 'RUNNING', contentSha256: sourceHash,
  scope: 'Built studio, exact installed and retained bundles, saved prose edit, separate preview and noncanonical injection. No literary acceptance claim.',
  checks: [], pageErrors: [], externalRequests: [] };
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 1050 }, reducedMotion: 'reduce' });
const page = await context.newPage();
page.setDefaultTimeout(30000);
page.on('pageerror', error => report.pageErrors.push(error.message));
page.on('request', request => {
  const url = request.url();
  if (/^https?:/.test(url) && !['localhost', '127.0.0.1'].includes(new URL(url).hostname)) report.externalRequests.push(url);
});
const acknowledge = () => page.getByLabel('I want to view author content and spoilers.', { exact: true }).check();
const valid = () => expect(page.getByRole('region', { name: 'Content diagnostics' })).toContainText('Content validation passed.');
const saved = () => expect(page.locator('.save-status')).toContainText(/Progress saved|Saved progress loaded|new run for this text revision/);
async function exportFrom(label, name) {
  const event = page.waitForEvent('download');
  await page.getByRole('button', { name: label, exact: true }).click();
  const path = `${folder}/${name}.json`;
  await (await event).saveAs(path);
  return JSON.parse(readFileSync(path, 'utf8'));
}
try {
  await page.goto(base); await acknowledge(); await valid();
  await expect(page.getByLabel('Stable scene ID', { exact: true })).toHaveValue(content.start);
  expect(await exportFrom('Export compiled player content', 'installed')).toEqual(content);
  await page.getByRole('textbox', { name: 'Paragraph 1', exact: true }).fill(changed);
  await page.getByRole('textbox', { name: 'Paragraph 1', exact: true }).press('Tab'); await valid();
  await page.getByRole('button', { name: 'Save author project', exact: true }).click();
  await expect(page.getByRole('status').first()).toHaveText('Author project saved separately from player runs.');
  expect((await exportFrom('Export author project', 'saved-project')).content).toEqual(expected);
  await page.reload(); await acknowledge(); await valid();
  await expect(page.getByRole('textbox', { name: 'Paragraph 1', exact: true })).toHaveValue(opening.paragraphs[0]);
  await page.getByRole('button', { name: 'Load author project', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Paragraph 1', exact: true })).toHaveValue(changed);
  await valid();
  expect((await exportFrom('Export author project', 'loaded-project')).content).toEqual(expected);
  report.checks.push('Installed content exports exactly. A saved one-paragraph edit survives explicit draft reload while the installed default remains unchanged.');
  await page.getByRole('button', { name: 'Preview last valid content', exact: true }).click(); await saved();
  await expect(page.locator('.prose p').first()).toHaveText(changed);
  await expect(page.locator('.mercy-world-canvas')).toHaveAttribute('data-loaded', 'true');
  await expect(page.locator('.mercy-world-canvas')).toHaveAttribute('data-scene-id', content.start);
  const editedRun = await exportFrom('Export encountered run', 'edited-preview');
  expect(engine.importPortableV2(content, editedRun).ok).toBe(false);
  expect(engine.importPortableV2(expected, editedRun).ok).toBe(true);
  await page.getByText('Inject a noncanonical author scenario', { exact: true }).click();
  await page.getByRole('button', { name: 'Create noncanonical scenario', exact: true }).click(); await saved();
  await expect(page.locator('#passage-title')).toHaveText('Noncanonical author scenario');
  await page.getByRole('button', { name: 'Enter the selected scene with these conditions.', exact: true }).click(); await saved();
  await expect(page.locator('#passage-title')).toHaveText(opening.title);
  await expect(page.locator('.mercy-world-canvas')).toHaveAttribute('data-scene-id', content.start);
  const scenario = await exportFrom('Export encountered run', 'noncanonical-preview');
  expect(scenario.content.id).toMatch(/^preview\./);
  expect(engine.importPortableV2(content, scenario).ok).toBe(false);
  await page.screenshot({ path: `${folder}/edited-preview.png`, fullPage: true });
  report.checks.push('Edited preview shows its exact prose and loaded Mercy world. Injected author scenario uses a different content identity; neither can replace the canonical run.');
  for (const [edition, version] of [['second-mouth-v5', 5], ['second-mouth-v4', 4], ['first-night', 2]]) {
    const url = new URL(base); url.searchParams.set('edition', edition);
    await page.goto(url.href); await acknowledge(); await valid();
    expect(await exportFrom('Export compiled player content', edition)).toEqual(JSON.parse(readFileSync(`src/content/case-v${version}.json`, 'utf8')));
  }
  report.checks.push('All three retained editions export their exact frozen bundles.');
  report.databases = await page.evaluate(async () => (await indexedDB.databases()).map(database => database.name).sort());
  expect(report.databases).toEqual(['literary-detective-author-projects-v2', 'literary-detective-studio-preview-v2']);
  expect(hash('src/content/case-v7.json')).toBe(sourceHash);
  expect(report.pageErrors).toEqual([]); expect(report.externalRequests).toEqual([]);
  report.status = 'PASS';
} catch (error) { report.status = 'FAIL'; report.failure = String(error); process.exitCode = 1; }
finally { await browser.close(); writeFileSync(`${folder}/CHECK.json`, JSON.stringify(report, null, 2) + '\n'); console.log(JSON.stringify(report, null, 2)); }
