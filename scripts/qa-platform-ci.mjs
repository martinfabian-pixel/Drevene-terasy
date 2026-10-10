import { createServer } from 'node:http';
import { readFile, mkdir, writeFile, stat } from 'node:fs/promises';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = join(root, 'dist'), output = join(root, 'qa', 'ci-platform');
await mkdir(output, { recursive: true });
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.json': 'application/json' };
const server = createServer(async (req, res) => {
  try { const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); const relative = pathname.replace(/^\/Drevene-terasy\/?/, ''); const file = resolve(dist, relative || 'index.html'); if (!file.startsWith(dist + sep) && file !== join(dist, 'index.html')) throw new Error(); if (!(await stat(file)).isFile()) throw new Error(); res.setHeader('Content-Type', mime[extname(file)] || 'application/octet-stream'); res.end(await readFile(file)); } catch { res.writeHead(404); res.end('Not found'); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const origin = `http://127.0.0.1:${server.address().port}/Drevene-terasy/`;
const report = { passed: false, layouts: [], interactions: [], failures: [], pageErrors: [], console: [] };
let browser;
const check = async (name, operation) => { try { const result = await operation(); report.interactions.push({ name, passed: true, result }); } catch (e) { report.failures.push({ name, error: e.stack || e.message }); } };
try {
  browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage();
  page.on('pageerror', error => report.pageErrors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') report.console.push(message.text()); });
  const goto = async route => { await page.goto('about:blank'); await page.goto(`${origin}#${route}`); await page.locator('h1').first().waitFor(); await page.evaluate(() => document.fonts.ready); };
  const routes = ['/terasove-dosky', '/prislusenstvo', '/produkt/demo-massive', '/planovac', '/realizacie', '/realizacia-na-kluc', '/poradna', '/o-nas', '/kontakt', '/kosik', '/pokladna', '/admin'];
  for (const width of [320, 375, 402, 430, 768, 1280, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      await check(`layout ${width} ${route}`, async () => {
        await goto(route);
        const data = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth - innerWidth, mains: document.querySelectorAll('main').length, headings: document.querySelectorAll('h1').length, images: [...document.images].filter(i => i.complete && !i.naturalWidth).map(i => i.src) }));
        assert.ok(data.overflow <= 1, `Horizontal overflow ${data.overflow}px`); assert.equal(data.mains, 1); assert.equal(data.headings, 1); assert.deepEqual(data.images, []);
        if ([402, 1280].includes(width)) await page.screenshot({ path: join(output, `${width}-${route.replaceAll('/', '-').slice(1)}.png`), fullPage: true });
        report.layouts.push({ width, route, ...data }); return data;
      });
    }
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  await check('catalog search, category, comparison', async () => {
    await goto('/terasove-dosky'); assert.equal(await page.locator('[data-testid^="product-demo-"]').count(), 3);
    await page.getByTestId('catalog-search').fill('WPC'); await page.waitForFunction(() => document.querySelectorAll('[data-testid^=\"product-demo-\"]').length === 1); assert.equal(await page.locator('[data-testid^="product-demo-"]').count(), 1); await page.getByTestId('catalog-search').fill(''); await page.waitForFunction(() => document.querySelectorAll('[data-testid^=\"product-demo-\"]').length === 3);
    await page.getByRole('button', { name: 'Thermowood', exact: true }).click(); await page.waitForFunction(() => document.querySelectorAll('[data-testid^=\"product-demo-\"]').length === 1); assert.equal(await page.locator('[data-testid^="product-demo-"]').count(), 1);
    await page.getByRole('button', { name: 'Všetko', exact: true }).click(); await page.waitForFunction(() => document.querySelectorAll('[data-testid^=\"product-demo-\"]').length === 3); await page.getByLabel('Porovnať materiál').first().check(); assert.equal(await page.getByRole('region', { name: 'Porovnanie materiálov' }).count(), 1);
  });
  await check('product variant, area, cart persistence and removal', async () => {
    await goto('/produkt/demo-massive'); await page.getByTestId('product-variant').selectOption('demo-massive-140-4000'); await page.getByTestId('product-quantity').fill('3'); await page.getByTestId('product-add-cart').click();
    await goto('/kosik'); assert.equal(await page.getByTestId('cart-row').count(), 1); await page.getByRole('spinbutton').first().fill('5'); await page.reload(); assert.equal(await page.getByRole('spinbutton').first().inputValue(), '5');
    await page.getByRole('button', { name: 'Odstrániť Masívne terasové drevo · DEMO' }).click(); assert.equal(await page.getByTestId('cart-row').count(), 0);
  });
  await check('planner dimensions, orientation, actual 2D/3D synchronization', async () => {
    await goto('/planovac'); assert.equal(Number(await page.getByTestId('planner-sync').getAttribute('data-area')), 10);
    await page.getByRole('button', { name: '02 Rozmery' }).click(); await page.getByTestId('planner-length').fill('5000'); assert.equal(Number(await page.getByTestId('planner-sync').getAttribute('data-area')), 12.5);
    await page.getByRole('button', { name: '04 Konštrukcia' }).click(); await page.getByTestId('planner-orientation').selectOption('y');
    await page.getByTestId('planner-3d').click(); const scene = page.getByTestId('planner-scene'); await scene.waitFor(); assert.equal(await scene.getAttribute('data-board-count'), await page.getByTestId('planner-sync').getAttribute('data-boards')); await page.waitForFunction(() => document.querySelector('[data-testid=planner-scene]')?.getAttribute('data-three-ready') === 'true'); assert.ok(await scene.locator('canvas').count() > 0); const signature = await scene.getAttribute('data-geometry-signature'); await page.getByRole('button', { name: '02 Rozmery' }).click(); await page.getByTestId('planner-length').fill('5400'); await page.waitForFunction(previous => document.querySelector('[data-testid=planner-scene]')?.getAttribute('data-geometry-signature') !== previous, signature); assert.equal(await scene.getAttribute('data-board-count'), await page.getByTestId('planner-sync').getAttribute('data-boards'));
    await page.getByRole('button', { name: 'Pohľad zhora', exact: true }).click(); await page.getByLabel('Rozložená konštrukcia').check(); await page.getByLabel('Rošt a terče', { exact: true }).uncheck();
    await page.getByTestId('planner-2d').click(); assert.equal(await page.getByTestId('plan-editor').count(), 1);
    await page.getByRole('button', { name: 'Uložiť návrh', exact: true }).click(); const download = page.waitForEvent('download'); await page.getByRole('button', { name: 'Stiahnuť projekt JSON', exact: true }).click(); assert.equal((await download).suggestedFilename(), 'moja-terasa.json');
  });
  await check('planner invalid polygon, custom numerical editor and cutout', async () => {
    await goto('/planovac'); await page.getByTestId('planner-shape-custom').click(); await page.getByRole('button', { name: '02 Rozmery' }).click();
    await page.getByLabel('Obvod bod 2 X', { exact: true }).fill('0'); await page.getByLabel('Obvod bod 2 Y', { exact: true }).fill('0'); assert.match(await page.getByTestId('planner-status').innerText(), /Návrh treba opraviť/); assert.equal(await page.getByTestId('planner-add-cart').isDisabled(), true);
    await page.getByRole('button', { name: '01 Tvar' }).click(); await page.getByTestId('planner-shape-rectangle').click(); await page.getByRole('button', { name: '02 Rozmery' }).click(); await page.getByTestId('planner-cutout').click(); assert.equal(Number(await page.getByTestId('planner-sync').getAttribute('data-area')), 9.75);
  });
  await check('planner vertex pointer and material package quote basket', async () => {
    await goto('/planovac'); const point = page.getByTestId('plan-vertex--1-1'); const box = await point.boundingBox(); await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down(); await page.mouse.move(box.x + box.width / 2 - 30, box.y + box.height / 2 + 15, { steps: 4 }); await page.mouse.up(); assert.notEqual(Number(await page.getByTestId('planner-sync').getAttribute('data-area')), 10);
    await goto('/planovac'); assert.equal(await page.getByTestId('planner-add-cart').isDisabled(), false); await page.getByTestId('planner-add-cart').click(); await goto('/kosik'); assert.ok(await page.getByTestId('cart-row').count() >= 3); await goto('/pokladna'); assert.equal(await page.getByTestId('checkout-export').count(), 1); assert.equal(await page.getByRole('button', { name: /Zaplatiť|Záväzne objednať/ }).count(), 0);
  });
  await check('mobile touch-compatible drawing and navigation', async () => {
    await page.setViewportSize({ width: 402, height: 874 }); await goto('/planovac'); await page.getByTestId('homepage-menu').click(); const menu = page.getByTestId('homepage-nav'); await menu.waitFor(); await menu.getByRole('link', { name: 'Terasové dosky', exact: true }).click(); assert.equal(await page.getByTestId('homepage-nav').count(), 0); assert.ok(page.url().endsWith('/terasove-dosky'));
  });
  await check('no runtime failures', async () => { assert.deepEqual(report.pageErrors, []); assert.deepEqual(report.console.filter(m => !/webgl|swiftshader|gpu process|context[_ ]lost/i.test(m)), []); });
} catch (e) { report.failures.push({ name: 'browser setup', error: e.stack || e.message }); }
finally { await browser?.close(); await new Promise(r => server.close(r)); report.passed = report.failures.length === 0; await writeFile(join(output, 'report.json'), JSON.stringify(report, null, 2)); console.log(JSON.stringify({ passed: report.passed, layouts: report.layouts.length, checks: report.interactions.length, failures: report.failures }, null, 2)); if (!report.passed) process.exitCode = 1; }
