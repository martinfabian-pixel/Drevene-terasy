// Real React DOM checks of the built, approved homepage only.
// Runs after npm install + npm run build in CI; never downloads dependencies itself.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const output = path.join(root, 'qa', 'ci');
const basePath = process.env.HOMEPAGE_QA_BASE || '/Drevene-terasy/';
const route = process.env.HOMEPAGE_QA_ROUTE || '#/2027';
const widths = [320, 375, 402, 430, 768, 1280, 1440, 1920];
const report = { scope: 'Approved Homepage2027 only; actual built React DOM', route, basePath, layouts: [], interactions: [], console: [], pageErrors: [], failedRequests: [], failures: [] };
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.json': 'application/json; charset=utf-8' };
await fs.mkdir(output, { recursive: true });
await fs.access(path.join(dist, 'index.html'));

const server = http.createServer(async (request, response) => {
  try {
    if (request.method !== 'GET' && request.method !== 'HEAD') { response.writeHead(405); response.end(); return; }
    let name = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
    if (name.startsWith(basePath)) name = name.slice(basePath.length);
    else if (name === '/' || name === basePath.replace(/\/$/, '')) name = 'index.html';
    else { response.writeHead(404); response.end('Not found'); return; }
    if (!name || name.endsWith('/')) name += 'index.html';
    const target = path.resolve(dist, name);
    if (!target.startsWith(dist + path.sep)) { response.writeHead(403); response.end(); return; }
    const bytes = await fs.readFile(target);
    response.writeHead(200, { 'Content-Type': mime[path.extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    response.end(request.method === 'HEAD' ? undefined : bytes);
  } catch { response.writeHead(404); response.end('Not found'); }
});
await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
const address = server.address();
const url = `http://127.0.0.1:${address.port}${basePath}${route}`;

async function catchCheck(name, run) {
  try { const details = await run(); return { name, passed: true, ...(details || {}) }; }
  catch (error) { const failure = { name, passed: false, error: error.message }; report.failures.push(failure); return failure; }
}
async function loadImages(page) {
  await page.evaluate(async () => {
    for (const image of document.images) image.loading = 'eager';
    await document.fonts.ready;
    const step = Math.max(400, innerHeight * .8);
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      scrollTo(0, y);
      await new Promise(resolve => setTimeout(resolve, 55));
    }
    await Promise.all([...document.images].map(image => Promise.race([image.decode().catch(() => {}), new Promise(resolve => setTimeout(resolve, 5000))])));
    scrollTo(0, 0);
  });
  await page.waitForTimeout(120);
}
async function layout(page, width, suffix = '') {
  await page.setViewportSize({ width, height: width < 768 ? 900 : 1080 });
  // Each viewport starts with a fresh React mount. Hash-only navigation otherwise preserves prior controls.
  await page.goto('about:blank');
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.locator('main').waitFor({ state: 'visible' });
  await loadImages(page);
  const result = await page.evaluate(() => ({
    width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
    overflow: document.documentElement.scrollWidth > innerWidth + 2,
    brokenImages: [...document.images].filter(image => !image.complete || image.naturalWidth === 0).map(image => image.currentSrc || image.src),
    heading: document.querySelector('h1')?.textContent?.trim(),
    mainCount: document.querySelectorAll('main').length,
    modelVisual: !!document.querySelector('.deck-scene-2027 img')?.naturalWidth,
    canvasCount: document.querySelectorAll('.deck-scene-2027 canvas').length,
  }));
  await page.screenshot({ path: path.join(output, `${width}${suffix}.png`), fullPage: true });
  const entry = { ...result, reducedMotion: suffix.includes('reduced'), screenshot: `${width}${suffix}.png` };
  report.layouts.push(entry);
  await catchCheck(`layout ${width}${suffix}`, async () => {
    assert.ok(result.heading, 'Homepage h1 missing');
    assert.equal(result.mainCount, 1, 'Expected one main landmark');
    assert.equal(result.overflow, false, `Horizontal document overflow: ${result.scrollWidth}px at ${width}px`);
    assert.deepEqual(result.brokenImages, [], 'Images failed to load');
    assert.equal(result.modelVisual, true, 'Labelled model image is missing; WebGL canvas is optional');
  });
}

async function selectedState(locator) {
  return locator.evaluate(element => ({
    pressed: element.getAttribute('aria-pressed'), selected: element.getAttribute('aria-selected'), expanded: element.getAttribute('aria-expanded'),
    className: element.className,
  }));
}
function isSelected(state) { return state.pressed === 'true' || state.selected === 'true' || state.expanded === 'true' || /(^|\s)(active|is-active|selected)(\s|$)/.test(state.className); }

async function interactions(page, width) {
  const checks = [];
  const test = async (name, run) => checks.push(await catchCheck(`${width}: ${name}`, run));
  await test('keyboard focus', async () => {
    await page.evaluate(() => { document.activeElement?.blur(); scrollTo(0, 0); });
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => ({ tag: document.activeElement?.tagName, text: document.activeElement?.textContent?.trim(), visible: !!document.activeElement?.getBoundingClientRect().width }));
    assert.ok(['A', 'BUTTON', 'INPUT'].includes(focused.tag), 'Tab did not focus an interactive element');
    assert.equal(focused.visible, true, 'Focused control is hidden');
    return { focused };
  });
  if (width < 768) await test('mobile dialog focus trap, scroll lock, Escape and focus return', async () => {
    const menu = page.getByTestId('homepage-menu');
    const previousOverflow = await page.evaluate(() => document.body.style.overflow);
    await menu.click();
    assert.equal(await menu.getAttribute('aria-expanded'), 'true', 'Menu did not open');
    const nav = page.getByTestId('homepage-nav');
    await nav.waitFor({ state: 'visible' });
    assert.equal(await nav.getAttribute('role'), 'dialog', 'Mobile menu must be a dialog');
    assert.equal(await nav.getAttribute('aria-modal'), 'true', 'Mobile navigation must be modal');
    assert.ok(await nav.locator('a').count(), 'Open menu has no links');
    assert.equal(await page.evaluate(() => document.body.style.overflow), 'hidden', 'Background scroll is not locked');
    const focusable = nav.locator('a[href],button:not([disabled])');
    await focusable.last().focus();
    await page.keyboard.press('Tab');
    assert.equal(await focusable.first().evaluate(element => element === document.activeElement), true, 'Tab escaped the modal at its last control');
    await page.keyboard.press('Shift+Tab');
    assert.equal(await focusable.last().evaluate(element => element === document.activeElement), true, 'Shift+Tab escaped the modal at its first control');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(120);
    assert.equal(await menu.getAttribute('aria-expanded'), 'false', 'Escape did not close menu');
    assert.equal(await nav.count(), 0, 'Mobile dialog remains in the DOM after Escape');
    assert.equal(await menu.evaluate(element => element === document.activeElement), true, 'Escape did not return focus to menu toggle');
    assert.equal(await page.evaluate(() => document.body.style.overflow), previousOverflow, 'Background scroll did not restore');
  });
  await test('four model layers, next-layer cycle and discovery assembly toggle', async () => {
    const states = [];
    for (let i = 1; i <= 4; i++) {
      const control = page.getByTestId(`deck-layer-${i}`);
      await control.click();
      const state = await selectedState(control);
      assert.equal(state.pressed, 'true', `Layer ${i} is not selected after click`);
      assert.equal(await page.locator('button[data-testid^="deck-layer-"][aria-pressed="true"]').count(), 1, 'Only one layer should be selected');
      assert.ok(await page.locator('.arch2027-hero-model-note').textContent(), 'Selected layer annotation missing');
      states.push({ label: await control.getAttribute('aria-label') || await control.textContent(), ...state });
    }
    const nextLayer = page.getByTestId('deck-layer-next');
    await nextLayer.click(); // layer 4 -> whole construction (0)
    assert.equal(await page.locator('button[data-testid^="deck-layer-"][aria-pressed="true"]').count(), 0, 'Next-layer cycle should include whole construction');
    await nextLayer.click(); // whole construction -> boards (1)
    assert.equal(await page.getByTestId('deck-layer-1').getAttribute('aria-pressed'), 'true', 'Plus did not cycle to boards');
    const discovery = page.getByTestId('deck-discovery');
    if (await discovery.isVisible()) {
    await discovery.click();
    assert.equal(await discovery.getAttribute('aria-pressed'), 'true', 'Discovery did not select assembly');
    assert.match(await discovery.textContent(), /ROZLOŽIŤ/, 'Assembly toggle label did not change');
    await discovery.click();
    assert.equal(await discovery.getAttribute('aria-pressed'), 'false', 'Discovery did not return to exploded construction');
    }
    const visual = page.locator('.arch2027-hero-model .deck-scene-2027');
    await visual.scrollIntoViewIfNeeded();
    await page.waitForTimeout(250);
    await visual.screenshot({ path: path.join(output, `${width}-model-interaction.png`) });
    return { states, nextLayerCycle: '5 → 0 → 1', discovery: 'exploded → assembled → exploded' };
  });
  await test('shape-specific 2D previews preserve L, U and custom selection', async () => {
    const view2d = page.getByTestId('deck-view2d');
    const view3d = page.getByTestId('deck-view3d');
    await view2d.click();
    const states = [];
    const outlines = [];
    for (const shape of ['rectangle', 'l', 'u', 'custom']) {
      const control = page.getByTestId(`deck-shape-${shape}`);
      await control.click();
      const state = await selectedState(control);
      assert.equal(state.pressed, 'true', `${shape} did not become selected`);
      assert.equal(await view2d.getAttribute('aria-pressed'), 'true', `${shape} is not shown in 2D`);
      const drawing = page.locator('.arch2027-plan-drawing');
      await drawing.waitFor({ state: 'visible' });
      const outline = await drawing.locator(':scope > path').first().getAttribute('d');
      assert.ok(outline, `${shape} outline missing`);
      outlines.push(outline);
      if (shape !== 'rectangle') {
        // An unavailable nonrectangular 3D view must not silently replace the selected shape.
        if (!await view3d.isDisabled()) await view3d.click();
        assert.equal(await control.getAttribute('aria-pressed'), 'true', `3D control silently replaced ${shape} with rectangle`);
        assert.equal(await view2d.getAttribute('aria-pressed'), 'true', `Unsupported ${shape} 3D must retain its truthful 2D preview`);
        assert.equal(await page.locator('.arch2027-planner-model').count(), 0, `Rectangle 3D model is misleading for ${shape}`);
      }
      states.push({ shape, label: await drawing.getAttribute('aria-label'), outline, ...state });
    }
    assert.equal(new Set(outlines).size, 4, 'Four shapes must have four distinct outlines');
    return { states };
  });
  await test('explicit rectangle selection before 2D/3D switching', async () => {
    await page.getByTestId('deck-shape-rectangle').click();
    const states = [];
    for (const mode of ['2d', '3d']) {
      const control = page.getByTestId(`deck-view${mode}`);
      await control.click();
      const state = await selectedState(control);
      assert.equal(state.pressed, 'true', `${mode} view did not become selected`);
      assert.equal(await page.getByTestId('deck-shape-rectangle').getAttribute('aria-pressed'), 'true', 'Rectangle selection changed during view switch');
      assert.equal(await page.locator(mode === '2d' ? '.arch2027-plan-drawing' : '.arch2027-planner-model').isVisible(), true, `${mode} visual missing`);
      states.push({ mode, ...state });
    }
    return { states };
  });
  await test('gallery next, previous and thumbnail controls', async () => {
    const image = page.getByTestId('homepage-gallery-image');
    const next = page.getByTestId('homepage-gallery-next');
    const previous = page.getByTestId('homepage-gallery-previous');
    const initial = await image.getAttribute('src');
    await next.click();
    await page.waitForTimeout(150);
    const changed = await image.getAttribute('src');
    assert.notEqual(changed, initial, 'Next gallery image did not change');
    await previous.click();
    await page.waitForTimeout(150);
    assert.equal(await image.getAttribute('src'), initial, 'Previous gallery image did not return to initial image');
    const thumbs = page.locator('button[data-testid^="homepage-gallery-thumb-"]');
    assert.equal(await thumbs.count(), 3, 'Three gallery thumbnails expected');
    await thumbs.nth(1).click();
    assert.ok(isSelected(await selectedState(thumbs.nth(1))), 'Selected thumbnail has no accessible state');
    assert.equal(await page.locator('button[data-testid^="homepage-gallery-thumb-"][aria-pressed="true"]').count(), 1, 'Only one thumbnail should be selected');
    await image.evaluate(async element => { if (element instanceof HTMLImageElement) await element.decode(); });
    return { initial, next: changed, selectedThumbnail: 1 };
  });
  report.interactions.push({ width, checks });
}

let browser;
try {
  browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const context = await browser.newContext({ deviceScaleFactor: 1 });
  const page = await context.newPage();
  page.on('console', message => { if (message.type() === 'error' || message.type() === 'warning') report.console.push({ type: message.type(), message: message.text(), width: page.viewportSize()?.width }); });
  page.on('pageerror', error => report.pageErrors.push({ message: error.message, width: page.viewportSize()?.width }));
  page.on('requestfailed', request => report.failedRequests.push({ url: request.url(), error: request.failure()?.errorText, width: page.viewportSize()?.width }));
  for (const width of widths) {
    await layout(page, width);
    if (width === 402 || width === 1440) await interactions(page, width);
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await layout(page, 430, '-reduced-motion');
  report.reducedMotionCheck = await catchCheck('reduced motion model fallback', async () => {
    const result = await page.evaluate(() => ({ matched: matchMedia('(prefers-reduced-motion: reduce)').matches, imageLoaded: !!document.querySelector('.deck-scene-2027 img')?.naturalWidth }));
    assert.equal(result.matched, true);
    assert.equal(result.imageLoaded, true);
    return result;
  });
  report.runtimeCheck = await catchCheck('console and runtime errors', async () => {
    // Graphics fallback is valid on CI machines without a WebGL context, provided the image rendered.
    const graphics = /webgl|swiftshader|gpu process|context[_ ]lost/i;
    const blockers = report.console.filter(item => item.type === 'error' && !graphics.test(item.message));
    assert.deepEqual(report.pageErrors, [], 'Unhandled React/browser exception');
    assert.deepEqual(blockers, [], 'Unexpected console errors');
    const failedAssets = report.failedRequests.filter(item => !/ERR_ABORTED|net::ERR_ABORTED/.test(item.error || ''));
    assert.deepEqual(failedAssets, [], 'Failed resource requests');
    return { acceptedGraphicsDiagnostics: report.console.filter(item => graphics.test(item.message)).length };
  });
} catch (error) {
  report.failures.push({ name: 'CI setup or page rendering', passed: false, error: error.stack || error.message });
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
  report.passed = report.failures.length === 0;
  await fs.writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ passed: report.passed, layouts: report.layouts.length, interactionRuns: report.interactions.length, failures: report.failures, artifacts: 'qa/ci' }, null, 2));
  if (!report.passed) process.exitCode = 1;
}
