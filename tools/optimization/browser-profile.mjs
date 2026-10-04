import { chromium, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

const [url, output, repetitions = '3'] = process.argv.slice(2);
if (!url || !output) throw Error('Usage: browser-profile.mjs URL OUTPUT.json [repetitions]');
mkdirSync(output.slice(0, output.lastIndexOf('/')), { recursive: true });
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const report = { url, scope: 'Same-machine headless Chromium with software WebGL, 1440x1000 at DPR1. Fresh contexts; service worker blocked to isolate startup from offline prefetch. Timing is diagnostic, not a hardware FPS claim.', runs: [] };
async function metrics(page, cdp) {
  const result = await cdp.send('Performance.getMetrics');
  return { ...(await page.evaluate(() => ({ ...window.__optimizationMetrics,
    nodes: document.getElementsByTagName('*').length,
    environmentBuilds: Number(document.querySelector('.mercy-world-canvas')?.dataset.environmentBuilds ?? 0),
    renderFrames: Number(document.querySelector('.mercy-world-canvas')?.dataset.renderFrames ?? 0),
  }))), cdp: Object.fromEntries(result.metrics.map(item => [item.name, item.value])) };
}
async function settle(world,page){
  let prior=-1,stable=0;
  for(let i=0;i<75;i++){const frame=Number(await world.getAttribute('data-render-frames'));stable=frame===prior?stable+1:0;if(stable>=3)return;prior=frame;await page.waitForTimeout(200);}
  throw Error('Renderer did not settle in15seconds');
}
const delta = (a, b) => ({ milliseconds: b.now - a.now, drawCalls: b.drawCalls - a.drawCalls,
  animationCallbacks: b.animationCallbacks - a.animationCallbacks,
  scriptMilliseconds: (b.cdp.ScriptDuration - a.cdp.ScriptDuration) * 1000,
  taskMilliseconds: (b.cdp.TaskDuration - a.cdp.TaskDuration) * 1000,
  heapBytes: b.cdp.JSHeapUsedSize, nodes: b.nodes });
try {
  for (let index = 0; index < Number(repetitions); index++) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1, serviceWorkers: 'block' });
    await context.addInitScript(() => {
      window.__optimizationMetrics = { drawCalls: 0, animationCallbacks: 0, firstPassage: null, firstWorld: null, longTasks: [], now: 0 };
      const original = window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = callback => original(time => { window.__optimizationMetrics.animationCallbacks++; callback(time); });
      for (const type of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) {
        if (!type) continue;
        for (const method of ['drawArrays', 'drawElements', 'drawArraysInstanced', 'drawElementsInstanced']) {
          const fn = type.prototype[method]; if (!fn) continue;
          type.prototype[method] = function (...args) { window.__optimizationMetrics.drawCalls++; return fn.apply(this, args); };
        }
      }
      const observe = () => {
        const m = window.__optimizationMetrics;
        if (m.firstPassage === null && document.querySelector('#passage-title')) m.firstPassage = performance.now();
        if (m.firstWorld === null && document.querySelector('.mercy-world-canvas')?.dataset.loaded === 'true') m.firstWorld = performance.now();
      };
      new MutationObserver(observe).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-loaded'] });
      try { new PerformanceObserver(list => { for (const task of list.getEntries()) window.__optimizationMetrics.longTasks.push({ start: task.startTime, duration: task.duration }); }).observe({ type: 'longtask', buffered: true }); } catch { /* Diagnostic API is optional. */ }
      Object.defineProperty(window.__optimizationMetrics, 'now', { get: () => performance.now(), enumerable: true });
    });
    const page = await context.newPage(); page.setDefaultTimeout(30000);
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    const cdp = await context.newCDPSession(page); await cdp.send('Performance.enable');
    await page.goto(url);
    await expect(page.locator('#passage-title')).toBeVisible();
    const world = page.locator('.mercy-world-canvas');
    await expect(world).toHaveAttribute('data-loaded', 'true');
    await expect(page.locator('.save-status')).toContainText('Progress saved');
    await settle(world,page);
    const start = await metrics(page, cdp);
    await page.waitForTimeout(2500);
    const rested = await metrics(page, cdp);
    await world.focus(); const x = await world.getAttribute('data-player-x');
    await page.keyboard.down('KeyA'); await page.waitForTimeout(450); await page.keyboard.up('KeyA');
    await expect(world).not.toHaveAttribute('data-player-x', x);
    await settle(world,page);
    const settled = await metrics(page, cdp);
    await page.waitForTimeout(2500);
    const afterMovement = await metrics(page, cdp);
    const transitions = [];
    for (let step = 0; step < 2; step++) {
      const oldTitle = await page.locator('#passage-title').textContent();
      const oldScene = await world.getAttribute('data-scene');
      const then = await page.evaluate(() => performance.now());
      await page.locator('.choices button').first().click();
      const confirm = page.getByRole('button', { name: 'Confirm action', exact: true });
      if (await confirm.isVisible()) await confirm.click();
      await expect(page.locator('#passage-title')).not.toHaveText(oldTitle);
      await expect(world).not.toHaveAttribute('data-scene', oldScene);
      await expect(page.locator('.save-status')).toContainText('Progress saved');
      transitions.push(await page.evaluate(then => performance.now() - then, then));
    }
    const final = await metrics(page, cdp);
    const resources = await page.evaluate(() => performance.getEntriesByType('resource').filter(entry => /\.js(?:\?|$)/.test(entry.name)).map(entry => ({ name: new URL(entry.name).pathname, bytes: entry.decodedBodySize, transferBytes: entry.transferSize })));
    const run = { index, firstPassageMs: start.firstPassage, firstWorldMs: start.firstWorld,
      jsBytes: resources.reduce((sum, resource) => sum + resource.bytes, 0), resources,
      idle: delta(start, rested), movementAndSettling:delta(rested,settled), idleAfterMovement: delta(settled, afterMovement), transitionsMs: transitions,
      afterTwoTransitions: { environmentBuilds: final.environmentBuilds, nodes: final.nodes },
      longTasks: final.longTasks, errors };
    expect(errors).toEqual([]); report.runs.push(run);
    console.log(JSON.stringify({ run: index, jsBytes: run.jsBytes, firstPassageMs: run.firstPassageMs, firstWorldMs: run.firstWorldMs, idleDraws: run.idle.drawCalls, afterMovementDraws: run.idleAfterMovement.drawCalls }));
    await context.close();
  }
  report.status = 'PASS';
} catch (error) { report.status = 'FAIL'; report.failure = String(error); process.exitCode = 1; }
finally { await browser.close(); writeFileSync(output, JSON.stringify(report, null, 2) + '\n'); }
