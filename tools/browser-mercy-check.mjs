import { chromium, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { build } from 'esbuild';

// Execute real whole-story witnesses through the built player's ordinary controls.
const paths = process.argv.slice(2);
if (!paths.length) throw new Error('Supply completed Mercy encountered-run JSON witnesses.');
const base = process.env.PLAYER_TEST_URL ?? 'http://localhost:4190/';
const folder = process.env.BROWSER_REPORT_DIR ?? 'docs/execution/evidence/mercy-browser';
mkdirSync(folder, { recursive: true });
const hash = path => createHash('sha256').update(readFileSync(path)).digest('hex');
const bundle = await build({ entryPoints: ['src/engine/evidence-v2.ts'], bundle: true, platform: 'node', format: 'esm', write: false, logLevel: 'silent' });
const engine = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
const checked = engine.validateContentV2(JSON.parse(readFileSync('src/content/case-v7.json', 'utf8')));
if (!checked.ok) throw new Error(checked.errors.join('\n'));
const content = checked.value;
const report = {
  status: 'RUNNING', scope: 'Actual built Chromium UI witnesses, saving, replay, offline and layout; not human playtesting or literary acceptance.',
  contentSha256: hash('src/content/case-v7.json'), harnessSha256: hash(new URL(import.meta.url)),
  assetManifestSha256: hash('dist-player/asset-manifest.json'),
  assetManifest: JSON.parse(readFileSync('dist-player/asset-manifest.json', 'utf8')),
  witnesses: paths.map(path => ({ path, sha256: hash(path) })),
  checks: [], scenes: [], errors: [], externalRequests: [], accessibility: [],
  limits: ['Supplied witnesses, not every input permutation', 'Software WebGL in Chromium', 'No human duration measurement'],
};
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const scenes = new Set();
const seenNarrative = seen => {
  const copy = structuredClone(seen);
  for (const entry of copy.transcript) if (entry.kind === 'action' && entry.command) {
    delete entry.command.id;
    if (entry.command.confirmation) { delete entry.command.confirmation.actionHash; delete entry.command.confirmation.stateHash; }
  }
  return copy;
};
async function saved(page) {
  await expect(page.getByRole('button', { name: 'Load saved progress', exact: true })).toBeEnabled();
  await expect(page.locator('.save-status')).toContainText(/Progress saved|Saved progress loaded|Saving taken over|new run for this text revision/, { timeout: 30000 });
}
async function takeover(page) {
  await expect(page.getByRole('button', { name: 'Load saved progress', exact: true })).toBeEnabled();
  const button = page.getByRole('button', { name: 'Take over saving', exact: true });
  if (await button.isVisible()) { await button.click(); await page.getByRole('button', { name: 'Confirm action', exact: true }).click(); await expect(button).toBeHidden(); }
  await saved(page);
}
async function exportRun(page, name) {
  const wait = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export encountered run', exact: true }).click();
  await (await wait).saveAs(`${folder}/${name}.json`);
  return JSON.parse(readFileSync(`${folder}/${name}.json`, 'utf8'));
}
async function notebook(page) {
  const open = page.getByRole('button', { name: 'Open notebook', exact: true });
  if (await open.isVisible()) await open.click();
}
async function chooseThroughWorld(page, choiceId) {
  const world = page.locator('.mercy-world-canvas');
  const target = JSON.parse(await world.getAttribute('data-targets')).find(item => item.choiceId === choiceId);
  if (!target) throw new Error(`No current spatial target for ${choiceId}`);
  await world.click({ position: { x: target.screenX, y: target.screenY } });
  await expect.poll(async () => {
    const x = Number(await world.getAttribute('data-player-x')), z = Number(await world.getAttribute('data-player-z'));
    return Math.hypot(x - target.x, z - target.z);
  }, { timeout: 15000 }).toBeLessThan(.3);
  await world.focus(); await page.keyboard.press('KeyE');
}
try {
  for (const [routeIndex, path] of paths.entries()) {
    const route = JSON.parse(readFileSync(path, 'utf8'));
    const replayed = engine.importPortableV2(content, route);
    if (!replayed.ok || !replayed.value.ended) throw new Error(`Witness is not a completed current story: ${path}`);
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    const page = await context.newPage(); page.setDefaultTimeout(20000);
    page.on('pageerror', error => report.errors.push(error.message));
    page.on('request', request => {
      const url = request.url();
      if (/^https?:/.test(url) && !['localhost', '127.0.0.1'].includes(new URL(url).hostname)) report.externalRequests.push(url);
    });
    expect(await (await page.request.get(new URL('asset-manifest.json', base).href)).json()).toEqual(report.assetManifest);
    await page.goto(base); await saved(page);
    await expect(page.locator('.mercy-world-canvas')).toHaveAttribute('data-loaded', 'true');
    const opening = await exportRun(page, `route-${routeIndex}-opening`);
    expect(opening.content).toEqual(route.content); expect(opening.commands).toHaveLength(0);
    if (routeIndex === 0) {
      const world = page.locator('.mercy-world-canvas'), initialX = await world.getAttribute('data-player-x');
      await world.focus(); await page.keyboard.down('KeyA'); await page.waitForTimeout(350); await page.keyboard.up('KeyA');
      await expect(world).not.toHaveAttribute('data-player-x', initialX);
      expect(await exportRun(page, 'walked-opening')).toEqual(opening);
      await page.getByRole('button', { name: 'Focus on text', exact: true }).click();
      await expect(world).toHaveCount(0);
      await page.getByRole('button', { name: 'Show the world', exact: true }).click();
      await expect(world).toHaveAttribute('data-loaded', 'true');
      report.checks.push('Keyboard exploration and reading-mode changes do not acquire evidence or dispatch story actions.');
    }
    await page.screenshot({ path: `${folder}/route-${routeIndex}-opening.png`, fullPage: true });
    let state = engine.createGameV2(content), checkedCancellation = false, spatial = false;
    for (const [index, command] of route.commands.entries()) {
      const view = engine.projectPlayerV2(content, state);
      if (command.type === 'choose') {
        const choice = view.choices.find(item => item.id === command.choiceId);
        if (!choice) throw new Error(`Not offered: ${command.choiceId}`);
        const before = (choice.ending || choice.irreversible) && !checkedCancellation ? await exportRun(page, `route-${routeIndex}-before-cancel`) : undefined;
        if (routeIndex === 0 && !spatial && !choice.ending && !choice.irreversible) {
          await chooseThroughWorld(page, choice.id); spatial = true;
          report.checks.push(`Actual pointer walk and nearby E dispatched ${choice.id} to the game.`);
        } else await page.locator('.choices').getByRole('button', { name: choice.label, exact: true }).click();
        if (choice.ending || choice.irreversible) {
          if (before) {
            await page.getByRole('button', { name: 'Cancel', exact: true }).click();
            expect(await exportRun(page, `route-${routeIndex}-after-cancel`)).toEqual(before);
            checkedCancellation = true;
            await page.locator('.choices').getByRole('button', { name: choice.label, exact: true }).click();
          }
          await page.getByRole('button', { name: 'Confirm action', exact: true }).click();
        }
      } else {
        await notebook(page);
        if (command.type === 'submitDeduction') {
          const question = view.questions.find(item => item.id === command.questionId);
          if (!question) throw new Error(`Not offered: ${command.questionId}`);
          const form = page.locator('.investigation-notebook form').filter({ has: page.getByRole('group', { name: question.text, exact: true }) });
          await form.getByLabel(question.candidates.find(item => item.id === command.candidateId).text, { exact: true }).check();
          const details = form.locator('details');
          if (await details.getAttribute('open') === null) await details.locator('summary').click();
          const refs = [...view.sources, ...view.deductions], options = details.getByRole('checkbox');
          await expect(options).toHaveCount(refs.length);
          for (let i = 0; i < refs.length; i++) await options.nth(i).uncheck();
          for (const id of command.selectedRefs) {
            const n = refs.findIndex(ref => ref.id === id); if (n < 0) throw new Error(`Unencountered support ${id}`);
            await options.nth(n).check();
          }
          await form.getByRole('button', { name: 'Submit this claim and evidence', exact: true }).click();
        } else if (command.type === 'reviewInterpretation') {
          const reading = view.readingsAvailable.find(item => item.id === command.interpretationId);
          await page.getByRole('button', { name: reading.title + (reading.occasionLabel ?? ''), exact: true }).click();
        } else if (command.type === 'requestHint') {
          const hint = view.hintsAvailable.find(item => item.id === command.hintId);
          await page.getByRole('button', { name: hint.label + (hint.reveals ? ' (reveals evidence)' : ''), exact: true }).click();
          if (hint.reveals) await page.getByRole('button', { name: 'Confirm action', exact: true }).click();
        } else throw new Error(`Unknown witness command: ${command.type}`);
      }
      const result = engine.applyCommandV2(content, state, command);
      if (!result.ok) throw new Error(result.error.message); state = result.state;
      const next = engine.projectPlayerV2(content, state);
      await expect(page.locator('#passage-title')).toHaveText(next.passage.title);
      await expect(page.locator('.prose p')).toHaveText(next.passage.paragraphs);
      await expect(page.locator('.mercy-world-canvas')).toHaveAttribute('data-scene', next.passage.sceneId);
      await saved(page); scenes.add(next.passage.sceneId);
      if (routeIndex === 0 && /first-return|found|reading|intellectual|new-morning/.test(next.passage.sceneId)) await page.screenshot({ path: `${folder}/${next.passage.sceneId}.png`, fullPage: true });
      if (index % 15 === 14) console.log(`Witness ${routeIndex + 1}: ${index + 1}/${route.commands.length} actions`);
    }
    let final = await exportRun(page, `route-${routeIndex}-complete`);
    expect(seenNarrative(final.seen)).toEqual(seenNarrative(route.seen));
    expect(engine.importPortableV2(content, final).ok).toBe(true);
    await page.reload(); await takeover(page);
    expect(await exportRun(page, `route-${routeIndex}-reload`)).toEqual(final);
    report.checks.push(`Whole witness ${routeIndex + 1} completed through ordinary controls; exact prose/evidence and reload checked.`);
    if (routeIndex === 0) {
      await expect(page.locator('.offline-status')).toContainText('Ready for offline play', { timeout: 45000 });
      await context.setOffline(true); await page.reload(); await takeover(page);
      await expect(page.locator('.mercy-world-canvas')).toHaveAttribute('data-loaded', 'true');
      expect(await exportRun(page, 'offline-complete')).toEqual(final);
      await page.getByRole('button', { name: 'Return to the closing scene', exact: true }).click();
      await page.getByRole('button', { name: 'Confirm action', exact: true }).click(); await saved(page);
      const closing = await exportRun(page, 'offline-closing-checkpoint');
      const closingState = engine.importPortableV2(content, closing);
      if (!closingState.ok || closingState.value.ended) throw new Error('Closing checkpoint did not reopen a playable state offline.');
      const closingChoice = engine.availableChoicesV2(content, closingState.value).find(choice => choice.id === route.commands.at(-1).choiceId);
      if (!closingChoice) throw new Error('The witnessed closing action is unavailable.');
      await page.locator('.choices').getByRole('button', { name: closingChoice.label, exact: true }).click();
      await page.getByRole('button', { name: 'Confirm action', exact: true }).click(); await saved(page);
      const offlineFinal = await exportRun(page, 'offline-action-saved');
      expect(seenNarrative(offlineFinal.seen)).toEqual(seenNarrative(final.seen));
      const offlineReplayed = engine.importPortableV2(content, offlineFinal);
      if (!offlineReplayed.ok || !offlineReplayed.value.ended) throw new Error('The offline closing action did not produce a replayable completed run.');
      final = offlineFinal;
      await page.reload(); await takeover(page);
      expect(await exportRun(page, 'offline-action-reloaded')).toEqual(final);
      for (const [edition, version] of [['second-mouth-v5', 5], ['second-mouth-v4', 4], ['first-night', 2]]) {
        const url = new URL(base); url.searchParams.set('edition', edition); await page.goto(url.href); await takeover(page);
        const retained = await exportRun(page, `offline-${edition}`); expect(retained.content.version).toBe(version);
        expect(retained.commands).toHaveLength(0);
      }
      await page.goto(base); await takeover(page); expect(await exportRun(page, 'offline-return-to-mercy')).toEqual(final);
      await context.setOffline(false);
      for (const width of [1440, 390, 320]) {
        await page.setViewportSize({ width, height: 950 }); await page.screenshot({ path: `${folder}/ending-${width}.png`, fullPage: true });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
        const axe = await new AxeBuilder({ page }).analyze(); report.accessibility.push({ width, violations: axe.violations, incomplete: axe.incomplete.map(item => item.id) });
        expect(axe.violations).toEqual([]);
      }
      report.checks.push('Completed-run offline reload, accepted closing action with save/reload, retained v5/v4/v2 isolation, and return to Mercy verified. Three widths checked for overflow and axe violations.');
    }
    await context.close();
  }
  expect(report.errors).toEqual([]); expect(report.externalRequests).toEqual([]);
  expect(hash('src/content/case-v7.json')).toBe(report.contentSha256);
  expect(hash('dist-player/asset-manifest.json')).toBe(report.assetManifestSha256);
  report.sourceAndBuildStable = true;
  report.status = 'PASS';
} catch (error) { report.status = 'FAIL'; report.failure = String(error); process.exitCode = 1; }
finally {
  report.scenes = [...scenes]; await browser.close();
  writeFileSync(`${folder}/report.json`, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ status: report.status, checks: report.checks, sceneCount: report.scenes.length, failure: report.failure }, null, 2));
}
