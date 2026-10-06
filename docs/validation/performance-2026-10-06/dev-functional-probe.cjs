// Functional runtime diagnostics; CPU throttling is not a physical-device benchmark.
const { chromium } = require('/Users/c171017/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const origin = process.argv[2] || 'http://127.0.0.1:3000';
const output = path.join(__dirname, 'dev-functional-checks.json');
const results = { origin, viewport: { width: 900, height: 750 }, deviceScaleFactor: 1.5, checks: [], errors: [] };
const save = () => fs.writeFileSync(output, JSON.stringify(results, null, 2));
const snapshot = page => page.evaluate(() => ({
  phase: document.querySelector('main')?.dataset.introPhase,
  selection: document.querySelector('main')?.classList.contains('has-selection'),
  width: document.querySelector('canvas')?.width,
  height: document.querySelector('canvas')?.height,
  ...document.querySelector('canvas')?.dataset,
}));

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const context = await browser.newContext({ viewport: results.viewport, deviceScaleFactor: results.deviceScaleFactor });
    const page = await context.newPage();
    page.on('pageerror', error => results.errors.push(String(error)));
    const cloudRequests = [];
    page.on('request', request => { if (/\/layers\/(?:cumulus|cirrus)/.test(request.url())) cloudRequests.push(request.url()); });
    await page.addInitScript(() => {
      window.__readinessProbe = [];
      let last = '';
      const record = () => {
        const canvas = document.querySelector('canvas');
        const sample = {
          phase: document.querySelector('main')?.dataset.introPhase,
          sky: canvas?.dataset.skyReady,
          reflection: canvas?.dataset.reflectionReady,
          optional: canvas?.dataset.skyOptionalEffects,
        };
        const signature = JSON.stringify(sample);
        if (last !== signature) { window.__readinessProbe.push({ ms: performance.now(), ...sample }); last = signature; }
        requestAnimationFrame(record);
      };
      requestAnimationFrame(record);
    });
    await page.goto(origin + '/?reviewSeed=8', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('main[data-intro-phase="active"]', { timeout: 60000 });
    await page.waitForFunction(() => document.querySelector('canvas')?.dataset.skyOptionalEffects === 'ready', { timeout: 20000 });
    const readiness = await page.evaluate(() => window.__readinessProbe);
    const handoff = readiness.find(sample => sample.phase === 'awaitClick');
    assert.ok(handoff && handoff.sky === 'true' && handoff.reflection === 'true', 'core sky and reflection must be ready before handoff');
    assert.ok(readiness.some(sample => sample.optional === 'deferred'));
    assert.ok(readiness.some(sample => sample.optional === 'ready'));
    results.checks.push({ name: 'readiness-and-deferred-effects', passed: true, sequence: readiness }); save();
    console.log('readiness-and-deferred-effects: PASS');

    await page.waitForTimeout(1200);
    const beforeScroll = await snapshot(page);
    for (let i = 0; i < 10; i++) { await page.mouse.wheel(0, 180); await page.waitForTimeout(160); }
    await page.waitForTimeout(800);
    const afterScroll = await snapshot(page);
    assert.ok(Number(afterScroll.reflectionCaptures) > Number(beforeScroll.reflectionCaptures), 'scroll must update environment');
    assert.equal(afterScroll.reflectionSkyClones, beforeScroll.reflectionSkyClones, 'scroll must reuse reflection graph');
    results.checks.push({ name: 'reflection-reuse-during-scroll', passed: true, before: beforeScroll, after: afterScroll }); save();
    console.log('reflection-reuse-during-scroll: PASS');

    const requestsBeforeResize = [...cloudRequests];
    await page.setViewportSize({ width: 600, height: 900 }); await page.waitForTimeout(1600);
    const portrait = await snapshot(page);
    await page.setViewportSize(results.viewport); await page.waitForTimeout(1600);
    const landscape = await snapshot(page);
    assert.deepEqual(cloudRequests, requestsBeforeResize, 'orientation/layout change must not fetch replacement artwork');
    assert.equal(landscape.renderDpr, landscape.renderDprTarget);
    results.checks.push({ name: 'resize-keeps-artwork-and-render-budget', passed: true, requests: cloudRequests, portrait, landscape }); save();
    console.log('resize-keeps-artwork-and-render-budget: PASS');

    const buttons = page.locator('.artifact-label:not([disabled])');
    for (let i = 0; i < await buttons.count(); i++) {
      // These are the actual scene-linked HTML controls; no store mutation.
      await buttons.nth(i).evaluate(button => button.click());
      if (await page.locator('main.has-selection').count()) break;
    }
    await page.waitForSelector('main.has-selection', { timeout: 6000 });
    await page.waitForTimeout(600);
    const selected = await snapshot(page);
    await page.keyboard.press('Escape'); await page.waitForTimeout(600);
    const deselected = await snapshot(page);
    assert.equal(selected.renderDpr, selected.renderDprTarget);
    assert.equal(deselected.renderDpr, deselected.renderDprTarget);
    assert.equal(deselected.selection, false);
    results.checks.push({ name: 'selection-preserves-effective-budget', passed: true, selected, deselected }); save();
    console.log('selection-preserves-effective-budget: PASS');

    await page.emulateMedia({ reducedMotion: 'reduce' });
    // Cruise easing continues with subpixel changes for several seconds.
    await page.waitForTimeout(8500);
    const frozenStart = await snapshot(page);
    await page.waitForTimeout(1800);
    const frozenEnd = await snapshot(page);
    results.checks.push({ name: 'reduced-motion-reuses-static-composite', passed: frozenEnd.cloudPaused === 'true' && frozenEnd.skyCompositeRenders === frozenStart.skyCompositeRenders, before: frozenStart, after: frozenEnd }); save();
    assert.equal(frozenEnd.cloudPaused, 'true');
    assert.equal(frozenEnd.skyCompositeRenders, frozenStart.skyCompositeRenders, 'static reduced-motion sky should reuse its composite');
    console.log('reduced-motion-reuses-static-composite: PASS');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.waitForTimeout(1200);

    const cdp = await context.newCDPSession(page);
    const throttleSamples = [];
    async function observe(rate, seconds) {
      await cdp.send('Emulation.setCPUThrottlingRate', { rate });
      for (let second = 0; second < seconds; second++) {
        await page.waitForTimeout(1000);
        throttleSamples.push({ cpuThrottle: rate, second, ...await snapshot(page) });
      }
      console.log('throttle phase complete: ' + rate + 'x');
      results.throttleSamples = throttleSamples; save();
    }
    await observe(6, 38);
    if (!throttleSamples.some(sample => sample.renderQuality !== 'full')) await observe(12, 38);
    const changed = throttleSamples.filter(sample => sample.renderQuality !== 'full');
    assert.ok(changed.length > 0, 'sustained CPU constraint should exercise at least one quality decision');
    assert.ok(throttleSamples.every(sample => sample.renderDpr === sample.renderDprTarget), 'actual rendering must follow each trial');
    await observe(1, 28);
    const decisions = throttleSamples.filter((sample, i) => !i || sample.renderQuality !== throttleSamples[i - 1].renderQuality || sample.renderQualityDecision !== throttleSamples[i - 1].renderQualityDecision);
    results.checks.push({ name: 'runtime-throttle-budget-application', passed: true, decisions,
      note: 'Synthetic CPU throttling verifies decisions and renderer state only; it does not represent a physical phone GPU.' }); save();
    console.log('runtime-throttle-budget-application: PASS');
    await context.close();
  } catch (error) {
    results.checks.push({ name: 'probe', passed: false, error: String(error) }); save();
    throw error;
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
