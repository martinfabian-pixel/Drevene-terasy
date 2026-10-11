import { createServer } from 'node:http';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { chromium, webkit } from 'playwright';

// This serves the actual Vite production build. No React, router, storage or
// Three mocks are used. Synthetic contacts/images exist only in isolated tests.
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const stock = JSON.parse(await readFile(join(root, 'src', 'data', 'jaf-stock-2026-10-10.json'), 'utf8'));
const fixtures = JSON.parse(await readFile(join(root, 'scripts', 'qa-stock-fixtures.json'), 'utf8'));
const board = fixtures.find(row => row.articleNumber === '55990/2640');
assert.ok(board);
const productRoute = `/produkt/${board.productId}`;
assert.equal(fixtures.length, 137);
assert.equal(new Set(fixtures.map(row => row.productId)).size, 83);
assert.equal(stock.articles.reduce((sum, article) => sum + article.priceGrossCents, 0), 495999);
const dist = join(root, 'dist');
const output = join(root, 'qa', 'ci-platform-extra');
await mkdir(output, { recursive: true });
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.json': 'application/json' };
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const relative = pathname.replace(/^\/Drevene-terasy\/?/, '');
    const file = resolve(dist, relative || 'index.html');
    if ((!file.startsWith(dist + sep) && file !== join(dist, 'index.html')) || !(await stat(file)).isFile()) throw new Error('Invalid path');
    response.setHeader('Content-Type', mime[extname(file)] || 'application/octet-stream');
    response.end(await readFile(file));
  } catch { response.writeHead(404); response.end('Not found'); }
});
await new Promise(resolveReady => server.listen(0, '127.0.0.1', resolveReady));
const origin = `http://127.0.0.1:${server.address().port}/Drevene-terasy/`;
const report = { passed: false, scope: 'Actual production ReactDOM and Three in Chromium; no application mocks.', checks: [], failures: [], pageErrors: [], consoleErrors: [], artifacts: [] };
const photoBytes = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3ioAAAAASUVORK5CYII=', 'base64');
const photo = { name: 'ci-terrace.png', mimeType: 'image/png', buffer: photoBytes };
const expectedPhotoUrl = `data:image/png;base64,${photoBytes.toString('base64')}`;
let browser;
let latestPage;
const contexts = [];

async function check(name, operation) {
  const startedAt = Date.now();
  console.log(`START ${name}`);
  let deadlineTimer;
  try {
    const details = await Promise.race([operation(), new Promise((_, reject) => { deadlineTimer = setTimeout(() => reject(Object.assign(new Error(`Browser group exceeded 120 seconds: ${name}`), { browserDeadline: true })), 120_000); })]);
    report.checks.push({ name, passed: true, durationMs: Date.now() - startedAt, details });
    console.log(`PASS ${name}`);
  } catch (error) {
    const screenshot = `failure-${report.failures.length + 1}.png`;
    await latestPage?.screenshot({ path: join(output, screenshot), fullPage: false }).catch(() => {});
    report.failures.push({ name, error: error.stack || error.message, screenshot, durationMs: Date.now() - startedAt });
    console.error(`FAIL ${name}: ${error.message}`);
    if (error.browserDeadline) throw error;
  } finally { clearTimeout(deadlineTimer); }
}
async function newPage(options = {}) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true, reducedMotion: 'reduce', ...options });
  contexts.push(context);
  const page = await context.newPage();
  latestPage = page;
  page.setDefaultTimeout(15_000);
  page.on('pageerror', error => report.pageErrors.push({ message: error.message, route: page.url() }));
  page.on('console', message => { if (message.type() === 'error') report.consoleErrors.push({ message: message.text(), route: page.url() }); });
  return page;
}
async function open(page, route, ready) {
  // Keep the SPA alive when navigating: locally imported catalog data is
  // deliberately in memory and must not be discarded by about:blank/reloads.
  if (page.url().startsWith(origin)) await page.evaluate(next => { location.hash = next; }, route);
  else await page.goto(`${origin}#${route}`);
  await page.waitForURL(url => url.hash === `#${route}`);
  await ready.waitFor({ state: 'visible' });
  await page.evaluate(() => document.fonts.ready);
  assert.equal(await page.evaluate(() => Object.keys(document.getElementById('root') || {}).some(key => key.startsWith('__reactContainer$'))), true, 'ReactDOM must own the actual application root');
}
async function waitValue(locator, value) {
  await locator.evaluate((element, expected) => new Promise((resolveValue, reject) => {
    const started = performance.now();
    function tick() { if (element.value === expected) resolveValue(true); else if (performance.now() - started > 12_000) reject(new Error(`Expected value ${expected}, received ${element.value}`)); else requestAnimationFrame(tick); }
    tick();
  }), value);
}
async function jsonDownload(page, trigger, filename, suggestedFilename) {
  const downloading = page.waitForEvent('download');
  await trigger();
  const download = await downloading;
  if (suggestedFilename) assert.equal(download.suggestedFilename(), suggestedFilename);
  assert.equal(await download.failure(), null);
  await download.saveAs(join(output, filename));
  report.artifacts.push(filename);
  return JSON.parse(await readFile(join(output, filename), 'utf8'));
}
async function screenshot(page, filename, fullPage = false) {
  await page.screenshot({ path: join(output, filename), fullPage });
  report.artifacts.push(filename);
}
const storageText = page => page.evaluate(() => JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage } }));
const hash = buffer => createHash('sha256').update(buffer).digest('hex');

try {
  browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });

  await check('every public stock variant matches all 137 PDF article prices, units, rebates and stock-program labels', async () => {
    const page = await newPage();
    const groups = new Map(); for (const fixture of fixtures) { if (!groups.has(fixture.productId)) groups.set(fixture.productId, []); groups.get(fixture.productId).push(fixture); }
    let reviewed = 0, clearance = 0;
    for (const [productId, group] of groups) {
      await open(page, `/produkt/${productId}`, page.getByRole('heading', { level: 1, name: group[0].productName, exact: true }));
      assert.equal(await page.getByTestId('product-variant').locator('option').count(), group.length);
      assert.equal(await page.getByRole('heading', { level: 1 }).innerText(), group[0].productName);
      for (const fixture of group) {
        const source = stock.articles.find(article => article.article === fixture.articleNumber); assert.ok(source);
        await page.getByTestId('product-variant').selectOption(fixture.variantId); await waitValue(page.getByTestId('product-variant'), fixture.variantId);
        await page.waitForFunction(article => document.querySelector('.platform-article-meta')?.textContent.includes(`ARTIKEL ${article} /`), source.article);
        const price = await page.locator('.platform-price').evaluate(element => element.firstChild.textContent.replace(/\s/g, ''));
        const expectedMoney = new Intl.NumberFormat('sk-SK', { style: 'currency', currency: 'EUR' }).format(source.priceGrossCents / 100).replace(/\s/g, '');
        assert.equal(price, `${expectedMoney}/${source.salesUnit}`, `${source.article}: authoritative whole-unit gross price`);
        assert.match(await page.locator('.platform-article-meta').innerText(), new RegExp(`RS ${source.rebateGroup} / STRANA ${source.page}`));
        assert.equal(await page.getByTestId('stock-program-status').locator('strong').innerText(), source.stockStatus);
        assert.match(await page.getByTestId('stock-program-status').innerText(), /nie potvrdená aktuálna dostupnosť/);
        if (source.stockStatus === 'Skladom do vypredania zásob') clearance++;
        if (source.referenceUnit === 'bm') {
          const expectedInfo = new Intl.NumberFormat('sk-SK', { style: 'currency', currency: 'EUR' }).format(source.referenceGrossCents / 100).replace(/\s/g, '');
          const info = await page.locator('.platform-area-note').first().innerText(); assert.ok(info.replace(/\s/g, '').startsWith(`${expectedInfo}/bm`));
        }
        reviewed++;
      }
    }
    assert.equal(reviewed, 137); assert.equal(clearance, 13); assert.equal(groups.size, 83);
    return { articlesReviewed: reviewed, groups: groups.size, sellUntilExhausted: clearance, grossChecksumCents: 495999 };
  });

  await check('whole package prices and source status survive cart export while old demo cart entries are removed', async () => {
    const page = await newPage();
    await page.addInitScript(() => localStorage.setItem('drevene-terasy.cart.v1', JSON.stringify({ version: 1, items: [{ key: 'demo-massive:demo-massive-140-4000', productId: 'demo-massive', variantId: 'demo-massive-140-4000', quantity: 5 }] })));
    await open(page, '/kosik', page.getByRole('heading', { name: 'Košík je prázdny.', exact: true }));
    const packaged = fixtures.find(row => row.articleNumber === '55013/0277'); assert.ok(packaged);
    await open(page, `/produkt/${packaged.productId}`, page.getByTestId('product-variant')); await page.getByTestId('product-variant').selectOption(packaged.variantId);
    assert.match(await page.locator('.platform-product-config').innerText(), /Obsah balenia cenník neuvádza/);
    await page.getByTestId('product-quantity').fill('2'); await page.getByTestId('product-quantity').fill('1.5'); await waitValue(page.getByTestId('product-quantity'), '2'); await page.getByTestId('product-add-cart').click();
    await open(page, '/kosik', page.getByTestId('cart-row')); assert.equal(await page.getByTestId('cart-row').count(), 1); assert.match(await page.getByTestId('cart-row').locator('strong').innerText(), /156,22/);
    const exported = await jsonDownload(page, () => page.getByRole('button', { name: 'EXPORT MATERIÁLOVÉHO ZOZNAMU ↓', exact: true }).click(), 'stock-package-quote.json');
    assert.equal(exported.lines[0].articleNumber, packaged.articleNumber); assert.equal(exported.lines[0].unit, 'bal'); assert.equal(exported.lines[0].sourceUnit, 'balenie'); assert.equal(exported.lines[0].physicalQuantity, 2); assert.equal(exported.lines[0].saleQuantity, 2); assert.equal(exported.lines[0].priceGross, 78.11); assert.equal(exported.lines[0].subtotalGross, 156.22); assert.equal(exported.lines[0].packageQuantity, null);
    assert.equal(exported.lines[0].vatRate, null); assert.equal(exported.lines[0].subtotalNet, null); assert.equal(exported.lines[0].availabilityBasis, 'pricelist');
    return { oldDemoRemoved: true, wholePackages: 2, sourcePricePerPackageEur: 78.11, grossEur: 156.22, piecesPerPackNotInvented: true };
  });

  await check('checkout complete company, billing, shipping, consent and JSON download', async () => {
    const page = await newPage();
    await open(page, productRoute, page.getByTestId('product-variant'));
    await page.getByTestId('product-variant').selectOption(board.variantId);
    await page.getByTestId('product-quantity').fill('3');
    await page.getByTestId('product-add-cart').click();
    await open(page, '/pokladna', page.getByTestId('checkout-export'));
    const contact = {
      name: 'CI Synthetic Buyer', email: 'ci-synthetic@example.invalid', phone: '+421900000000',
      company: 'CI Synthetic Company', companyId: '12345678', taxId: '1234567890', vatId: 'SK1234567890',
      billingStreet: 'CI Billing 12', billingCity: 'CI Billing City', billingPostcode: '010 01', billingCountry: 'Slovensko',
      deliveryStreet: 'CI Delivery 34', deliveryCity: 'CI Delivery City', deliveryPostcode: '811 01',
      note: 'CI synthetic quote: no order and no payment.',
    };
    await page.getByLabel('Nakupujem na firmu').check();
    for (const [name, value] of Object.entries(contact)) {
      const field = page.locator(`form [name="${name}"]`);
      if (name === 'billingCountry') await field.selectOption({ label: value }); else await field.fill(value);
    }
    const consent = page.getByLabel('Rozumiem, že vytváram lokálny súbor nezáväzného dopytu, nie objednávku.');
    assert.equal(await consent.isChecked(), false);
    assert.equal(await consent.getAttribute('required'), '');
    const premature = [];
    const observeDownload = download => premature.push(download.suggestedFilename());
    page.on('download', observeDownload);
    await page.getByTestId('checkout-export').click();
    assert.equal(await page.locator('form').evaluate(form => form.checkValidity()), false);
    await page.evaluate(() => new Promise(resolveFrame => requestAnimationFrame(() => requestAnimationFrame(resolveFrame))));
    assert.deepEqual(premature, [], 'Consent must block export');
    page.off('download', observeDownload);
    await consent.check();
    const writes = [];
    page.on('request', request => { if (!['GET', 'HEAD'].includes(request.method())) writes.push(request.url()); });
    const exported = await jsonDownload(page, () => page.getByTestId('checkout-export').click(), 'checkout-business.json', 'drevene-terasy-dopyt.json');
    await page.getByRole('heading', { name: 'Súbor dopytu bol stiahnutý.', exact: true }).waitFor();
    assert.equal(exported.version, 1); assert.equal(exported.type, 'quote-draft'); assert.equal(exported.delivery, 'delivery');
    assert.ok(Number.isFinite(Date.parse(exported.createdAt)));
    assert.deepEqual(exported.contact, { ...contact, deliveryMode: 'delivery' });
    assert.equal(exported.items.length, 1); assert.equal(exported.items[0].variantId, board.variantId); assert.equal(exported.items[0].quantity, 3);
    assert.equal(exported.lines.length, 1); assert.equal(exported.lines[0].variantId, board.variantId); assert.deepEqual(exported.lines[0].dimensionsMm, { length: 4000, width: 145, thickness: 28 }); assert.equal(exported.lines[0].physicalQuantity, 3); assert.equal(exported.lines[0].priceGross, 23.12); assert.equal(exported.lines[0].subtotalGross, 69.36); assert.equal(exported.lines[0].articleNumber, board.articleNumber); assert.equal(exported.lines[0].vatRate, null); assert.equal(exported.lines[0].priceNet, null);
    assert.match(exported.notice, /Nebol odoslaný/);
    assert.deepEqual(writes, [], 'No customer data may be sent to a server');
    const persisted = await storageText(page);
    for (const marker of [contact.name, contact.email, contact.company, contact.billingStreet, contact.deliveryStreet]) assert.ok(!persisted.includes(marker), `PII must not enter browser storage: ${marker}`);
    await screenshot(page, 'checkout-export-confirmation.png');
    await page.reload();
    await page.getByTestId('checkout-export').waitFor();
    for (const name of ['name', 'email', 'phone', 'billingStreet', 'billingCity', 'billingPostcode', 'deliveryStreet', 'deliveryCity', 'deliveryPostcode', 'note']) assert.equal(await page.locator(`form [name="${name}"]`).inputValue(), '', `${name} must not auto-load`);
    assert.equal(await page.getByLabel('Nakupujem na firmu').isChecked(), false);
    assert.equal(await page.locator('input[name="company"]').count(), 0);
    return { exportedFields: Object.keys(exported.contact), itemCount: exported.items.length, consentBlocked: true, networkWrites: writes.length, piiAutoLoaded: false };
  });

  await check('checkout personal pickup removes shipping fields from the exported draft', async () => {
    const page = await newPage();
    await open(page, productRoute, page.getByTestId('product-add-cart'));
    await page.getByTestId('product-add-cart').click();
    await open(page, '/pokladna', page.getByTestId('checkout-export'));
    await page.locator('[name="name"]').fill('CI Pickup Buyer');
    await page.locator('[name="email"]').fill('ci-pickup@example.invalid');
    await page.locator('[name="billingStreet"]').fill('CI Pickup Street 1');
    await page.locator('[name="billingCity"]').fill('CI Pickup City');
    await page.locator('[name="billingPostcode"]').fill('01001');
    await page.getByLabel('Osobný odber po dohode').check();
    await page.locator('[name="deliveryStreet"]').waitFor({ state: 'detached' });
    await page.getByLabel('Rozumiem, že vytváram lokálny súbor nezáväzného dopytu, nie objednávku.').check();
    const exported = await jsonDownload(page, () => page.getByTestId('checkout-export').click(), 'checkout-pickup.json');
    assert.equal(exported.delivery, 'pickup'); assert.equal(exported.contact.deliveryMode, 'pickup');
    for (const key of ['deliveryStreet', 'deliveryCity', 'deliveryPostcode', 'company', 'companyId', 'taxId', 'vatId']) assert.equal(Object.hasOwn(exported.contact, key), false, `${key} must not be fabricated`);
    return { delivery: exported.delivery, hiddenShippingFields: true };
  });

  await check('service inquiry validates files, attaches saved planner project and exports photo bytes', async () => {
    const page = await newPage();
    await open(page, '/planovac', page.getByTestId('planner-page'));
    await page.getByRole('button', { name: '02 Rozmery', exact: true }).click();
    await page.getByTestId('planner-length').fill('4500');
    await page.waitForFunction(() => document.querySelector('[data-testid="planner-sync"]')?.getAttribute('data-area') === '11.25');
    await page.getByRole('button', { name: 'Uložiť návrh', exact: true }).click();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('dt-project-v1') || 'null')?.input?.outline?.[1]?.x === 4500);
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('dt-project-v1')));
    await open(page, '/realizacia-na-kluc', page.getByRole('heading', { name: 'POVEDZTE NÁM O PRIESTORE.', exact: true }));
    const form = page.locator('form.platform-inquiry');
    await form.getByLabel('Priložiť uložený návrh z plánovača · JSON').setInputFiles({ name: 'invalid-project.json', mimeType: 'application/json', buffer: Buffer.from('{"version":1,"input":{}}') });
    await form.getByRole('status').filter({ hasText: 'Neplatný JSON projektu.' }).waitFor();
    const photographs = form.getByLabel('Fotografie priestoru · JPG / PNG / WebP');
    await photographs.setInputFiles({ name: 'invalid-photo.txt', mimeType: 'text/plain', buffer: Buffer.from('not a photograph') });
    await form.getByRole('status').filter({ hasText: 'Najviac 6 fotografií' }).waitFor();
    await photographs.setInputFiles(photo);
    await form.getByRole('button', { name: 'PRILOŽIŤ ULOŽENÝ NÁVRH Z PLÁNOVAČA +', exact: true }).click();
    await form.getByRole('status').filter({ hasText: 'Uložený návrh z plánovača priložený k dopytu.' }).waitFor();
    const contact = { name: 'CI Service Contact', email: 'ci-service@example.invalid', phone: '+421900000001', location: 'CI Test Location', lengthM: '4.5', widthM: '2.5', message: 'CI synthetic inquiry with a local photo and saved plan.' };
    for (const [name, value] of Object.entries(contact)) await form.locator(`[name="${name}"]`).fill(value);
    await form.getByLabel('Rozumiem, že formulár pripraví lokálny súbor a neodosiela údaje firme.').check();
    const writes = [];
    page.on('request', request => { if (!['GET', 'HEAD'].includes(request.method())) writes.push(request.url()); });
    const exported = await jsonDownload(page, () => form.getByRole('button', { name: 'STIAHNUŤ DOPYT S PRÍLOHAMI ↓', exact: true }).click(), 'service-with-attachments.json', 'drevene-terasy-realizacia-dopyt.json');
    await form.getByRole('status').filter({ hasText: 'Dopyt bol stiahnutý ako súbor.' }).waitFor();
    assert.equal(exported.type, 'service'); assert.deepEqual(exported.plannerProject, saved);
    for (const [key, value] of Object.entries(contact)) assert.equal(exported.contact[key], value);
    assert.deepEqual(exported.attachments, [{ name: photo.name, type: photo.mimeType, dataUrl: expectedPhotoUrl }]);
    assert.deepEqual(writes, []);
    const persisted = await storageText(page);
    for (const marker of [contact.name, contact.email, contact.location, expectedPhotoUrl]) assert.ok(!persisted.includes(marker), 'Inquiry contact/photo must not be persisted automatically');
    await screenshot(page, 'service-attachment-export.png');
    return { rejectedInvalidProject: true, rejectedInvalidPhoto: true, photos: exported.attachments.length, savedProjectLengthMm: exported.plannerProject.input.outline[1].x, networkWrites: writes.length };
  });

  await check('admin complete stock CSV review, forbidden article rejection, price/photo draft and immutable public catalog', async () => {
    const page = await newPage();
    await open(page, '/admin', page.getByRole('button', { name: 'OTVORIŤ LOKÁLNE DEMO →', exact: true }));
    assert.equal(await page.locator('.platform-admin-products aside select').count(), 0);
    assert.equal(await page.locator('.platform-admin-gate').count(), 1);
    await page.getByRole('button', { name: 'OTVORIŤ LOKÁLNE DEMO →', exact: true }).click();
    const productSelect = page.getByLabel('Vybrať produkt', { exact: true });
    await productSelect.waitFor();
    const originalCount = await productSelect.locator('option').count();
    assert.equal(originalCount, 83);
    assert.equal(await page.getByLabel('Názov podľa PDF', { exact: true }).getAttribute('readonly'), '');
    assert.equal(await page.getByRole('button', { name: /Pridať produkt|Pridať variant/i }).count(), 0);
    await page.getByRole('button', { name: 'Objednávky a dopyty', exact: true }).click();
    await page.getByRole('heading', { name: 'Produkčné dáta sú chránené.', exact: true }).waitFor();
    const downloading = page.waitForEvent('download');
    await page.getByRole('button', { name: 'EXPORTOVAŤ NÁVRH CSV ↓', exact: true }).click();
    const downloaded = await downloading; assert.equal(await downloaded.failure(), null);
    await downloaded.saveAs(join(output, 'admin-approved-stock.csv')); report.artifacts.push('admin-approved-stock.csv');
    const csv = await readFile(join(output, 'admin-approved-stock.csv'), 'utf8');
    const parseCsv = source => { const rows = []; let row = [], cell = '', quoted = false; for (let i = 0; i < source.length; i++) { const c = source[i]; if (c === '"') { if (quoted && source[i + 1] === '"') { cell += '"'; i++; } else quoted = !quoted; } else if (!quoted && c === ';') { row.push(cell); cell = ''; } else if (!quoted && (c === '\n' || c === '\r')) { if (c === '\r' && source[i + 1] === '\n') i++; row.push(cell); if (row.some(Boolean)) rows.push(row); row = []; cell = ''; } else cell += c; } row.push(cell); if (row.some(Boolean)) rows.push(row); assert.equal(quoted, false); return rows; };
    const rows = parseCsv(csv), columns = rows[0]; assert.equal(rows.length - 1, 137);
    const serializeCsv = data => data.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(';')).join('\n') + '\n';
    const articleColumn = columns.indexOf('article_number'), priceColumn = columns.indexOf('price_gross_eur'); assert.ok(articleColumn >= 0 && priceColumn >= 0);
    const firstSource = rows.find(row => row[articleColumn] === board.articleNumber); assert.ok(firstSource);
    await page.getByRole('button', { name: 'CSV import', exact: true }).click();
    const forbidden = [...firstSource]; forbidden[columns.indexOf('product_id')] = 'ci-forbidden'; forbidden[columns.indexOf('variant_id')] = 'ci-forbidden-variant'; forbidden[articleColumn] = '99999/9999';
    await page.getByLabel('CSV obsah', { exact: true }).fill(serializeCsv([...rows, forbidden]));
    await page.getByRole('button', { name: 'OVERIŤ A PRIPRAVIŤ NÁVRH →', exact: true }).click();
    await page.getByRole('status').filter({ hasText: /nie je.*schválen|nie je.*skladového|artikel nie je.*skladov/i }).waitFor();
    await page.getByRole('button', { name: 'Produkty a varianty', exact: true }).click();
    assert.equal(await productSelect.locator('option').count(), originalCount);
    assert.equal(await productSelect.locator('option[value="ci-forbidden"]').count(), 0);
    await page.getByRole('button', { name: 'CSV import', exact: true }).click();
    await page.getByLabel('CSV obsah', { exact: true }).fill(serializeCsv([columns, firstSource]));
    await page.getByRole('button', { name: 'OVERIŤ A PRIPRAVIŤ NÁVRH →', exact: true }).click();
    await page.getByRole('status').filter({ hasText: /Chýba artikel/ }).waitFor();
    const draftRows = rows.map(row => [...row]); draftRows.find(row => row[articleColumn] === board.articleNumber)[priceColumn] = '30.00';
    const draftCsv = serializeCsv(draftRows);
    await page.getByLabel('Vybrať CSV', { exact: true }).setInputFiles({ name: 'ci-stock-update.csv', mimeType: 'text/csv', buffer: Buffer.from(draftCsv) });
    await waitValue(page.getByLabel('CSV obsah', { exact: true }), draftCsv);
    await page.getByRole('button', { name: 'OVERIŤ A PRIPRAVIŤ NÁVRH →', exact: true }).click();
    await page.getByRole('status').filter({ hasText: /Overených 137 artiklov.*1 cenových zmien/ }).waitFor();
    await page.getByRole('heading', { name: /CENOVÉ ZMENY NA KONTROLU \/ 1/ }).waitFor();
    await page.getByRole('button', { name: 'Produkty a varianty', exact: true }).click();
    await productSelect.selectOption(board.productId); await waitValue(productSelect, board.productId);
    const photoInput = page.getByLabel('Fotografia · vlastný lokálny návrh', { exact: true });
    await photoInput.scrollIntoViewIfNeeded(); const scrollBefore = await page.evaluate(() => scrollY);
    await photoInput.setInputFiles(photo);
    await page.getByRole('status').filter({ hasText: /Obrázok vložený iba do lokálneho návrhu/ }).waitFor();
    await page.waitForFunction(expected => document.querySelector('.platform-admin-photo-preview')?.getAttribute('src') === expected, expectedPhotoUrl);
    assert.ok(Math.abs(await page.evaluate(() => scrollY) - scrollBefore) < 2, 'Draft edits must preserve scroll position');
    const exported = await jsonDownload(page, () => page.getByRole('button', { name: 'EXPORTOVAŤ NÁVRH JSON ↓', exact: true }).click(), 'admin-stock-draft.json', 'jaf-skladovy-program-navrh.json');
    assert.equal(exported.version, 1); assert.equal(exported.type, 'stock-update-draft'); assert.equal(exported.publicationRequiresReview, true); assert.equal(exported.products.length, 83);
    assert.equal(exported.products.reduce((sum, product) => sum + product.variants.length, 0), 137);
    const edited = exported.products.find(product => product.id === board.productId);
    assert.equal(edited.name, board.productName); assert.deepEqual(edited.images, [expectedPhotoUrl]); assert.equal(edited.imageKind, 'product'); assert.equal(edited.variants[0].priceGross, 30); assert.equal(edited.variants[0].vatRate, null);
    await page.getByRole('button', { name: 'ULOŽIŤ NÁVRH LOKÁLNE', exact: true }).click();
    await page.getByRole('status').filter({ hasText: 'Návrh uložený iba v tomto prehliadači.' }).waitFor();
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('drevene-terasy.stock-draft.v1'))), exported);
    await page.getByRole('button', { name: 'Obnoviť schválený skladový program', exact: true }).click();
    await page.getByRole('status').filter({ hasText: 'Návrh obnovený zo schváleného cenníka.' }).waitFor();
    assert.notEqual(await page.locator('.platform-admin-photo-preview').getAttribute('src'), expectedPhotoUrl);
    await page.getByRole('button', { name: 'NAČÍTAŤ NÁVRH', exact: true }).click();
    await page.getByRole('status').filter({ hasText: 'Návrh obnovený iba v administrácii.' }).waitFor();
    await productSelect.selectOption(board.productId);
    await page.waitForFunction(expected => document.querySelector('.platform-admin-photo-preview')?.getAttribute('src') === expected, expectedPhotoUrl);
    await page.getByRole('button', { name: 'Obnoviť schválený skladový program', exact: true }).click();
    await page.getByLabel('Obnoviť JSON zo súboru', { exact: true }).setInputFiles({ name: 'stock-draft.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(exported)) });
    await page.getByRole('status').filter({ hasText: 'Návrh obnovený iba v administrácii.' }).waitFor();
    await productSelect.selectOption(board.productId);
    await page.waitForFunction(expected => document.querySelector('.platform-admin-photo-preview')?.getAttribute('src') === expected, expectedPhotoUrl);
    const restored = await jsonDownload(page, () => page.getByRole('button', { name: 'EXPORTOVAŤ NÁVRH JSON ↓', exact: true }).click(), 'admin-restored-stock-draft.json');
    assert.deepEqual(restored.products.find(product => product.id === board.productId), edited);
    await screenshot(page, 'admin-stock-update-draft.png');
    await open(page, productRoute, page.getByTestId('product-variant'));
    assert.equal(await page.getByRole('heading', { level: 1 }).innerText(), board.productName);
    assert.notEqual(await page.locator('.platform-detail-image img').getAttribute('src'), expectedPhotoUrl);
    assert.match(await page.locator('.platform-price').innerText(), /23,12/);
    await page.getByTestId('product-quantity').fill('3'); await page.getByTestId('product-add-cart').click();
    await open(page, '/kosik', page.getByTestId('cart-row')); assert.match(await page.getByTestId('cart-row').locator('strong').innerText(), /69,36/);
    const publicQuote = await jsonDownload(page, () => page.getByRole('button', { name: 'EXPORT MATERIÁLOVÉHO ZOZNAMU ↓', exact: true }).click(), 'public-stock-after-draft.json');
    assert.equal(publicQuote.lines[0].priceGross, 23.12); assert.equal(publicQuote.lines[0].subtotalGross, 69.36); assert.equal(publicQuote.lines[0].articleNumber, board.articleNumber);
    await open(page, '/terasove-dosky', page.getByTestId('catalog-search')); await page.getByTestId('catalog-search').fill('99999/9999'); await page.getByRole('heading', { name: 'Nič sa nenašlo.', exact: true }).waitFor(); assert.equal(await page.locator('.platform-product-grid article').count(), 0);
    await open(page, '/planovac', page.getByTestId('planner-page')); await page.getByRole('button', { name: '03 Materiál', exact: true }).click(); await page.getByTestId('planner-product').selectOption(board.productId); await page.getByTestId('planner-variant').selectOption(board.variantId);
    assert.equal(await page.getByTestId('planner-stock-article-number').innerText(), board.articleNumber); assert.match(await page.getByTestId('planner-stock-price').innerText(), /23,12/); assert.equal(await page.getByTestId('planner-add-cart').isDisabled(), false);
    return { unapprovedArticleRejected: true, incompleteCsvRejected: true, completeDraftArticles: 137, stagedPriceEur: 30, publicPriceEur: 23.12, photoPreservedInDraft: true, localAndFileBackupsRestored: true, publicPlannerUnaffected: true };
  });

  await check('selected product variant survives product-to-planner query and project export', async () => {
    const page = await newPage();
    await open(page, productRoute, page.getByTestId('product-variant'));
    await page.getByTestId('product-variant').selectOption(board.variantId);
    await page.getByRole('link', { name: 'NAVRHNÚŤ S TÝMTO MATERIÁLOM ↗', exact: true }).click();
    await page.getByTestId('planner-page').waitFor();
    const query = new URLSearchParams(page.url().split('?').at(-1));
    assert.equal(query.get('product'), board.productId); assert.equal(query.get('variant'), board.variantId);
    await page.getByRole('button', { name: '03 Materiál', exact: true }).click();
    await waitValue(page.getByTestId('planner-product'), board.productId);
    await waitValue(page.getByTestId('planner-variant'), board.variantId);
    const exported = await jsonDownload(page, () => page.getByRole('button', { name: 'Stiahnuť projekt JSON', exact: true }).click(), 'product-selected-planner.json', 'moja-terasa.json');
    assert.equal(exported.input.productId, board.productId); assert.equal(exported.input.variantId, board.variantId);
    return { productId: exported.input.productId, variantId: exported.input.variantId };
  });

  const mobile = await newPage({ viewport: { width: 402, height: 874 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
  const cdp = await mobile.context().newCDPSession(mobile);
  await mobile.addInitScript(() => {
    window.__qaTouchEvents = [];
    for (const type of ['pointerdown', 'pointermove', 'pointerup']) document.addEventListener(type, event => { if (event.pointerType === 'touch') window.__qaTouchEvents.push({ type, target: event.target.tagName }); }, true);
  });
  const touch = async (type, points) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points.map((point, index) => ({ x: point.x, y: point.y, id: index + 1, radiusX: 3, radiusY: 3, force: 1 })) });
  async function touchDrag(start, end) {
    await touch('touchStart', [start]);
    for (let index = 1; index <= 8; index++) {
      await touch('touchMove', [{ x: start.x + (end.x - start.x) * index / 8, y: start.y + (end.y - start.y) * index / 8 }]);
      await mobile.evaluate(() => new Promise(requestAnimationFrame));
    }
    await touch('touchEnd', []);
  }
  await check('real Chromium touch pointers edit and pan the 2D terrace', async () => {
    await open(mobile, '/planovac', mobile.getByTestId('planner-page'));
    const vertex = mobile.getByTestId('plan-vertex--1-1');
    await vertex.scrollIntoViewIfNeeded();
    const box = await vertex.boundingBox(); assert.ok(box);
    const beforeArea = await mobile.getByTestId('planner-sync').getAttribute('data-area');
    await touchDrag({ x: box.x + box.width / 2, y: box.y + box.height / 2 }, { x: box.x + box.width / 2 - 24, y: box.y + box.height / 2 + 26 });
    await mobile.waitForFunction(previous => document.querySelector('[data-testid="planner-sync"]')?.getAttribute('data-area') !== previous, beforeArea);
    const afterArea = await mobile.getByTestId('planner-sync').getAttribute('data-area');
    const drawing = mobile.getByTestId('plan-editor');
    await drawing.getByRole('button', { name: 'Posun', exact: true }).tap();
    const svg = drawing.locator('svg').first();
    await svg.scrollIntoViewIfNeeded();
    const svgBox = await svg.boundingBox(); assert.ok(svgBox);
    const beforeView = await svg.getAttribute('viewBox');
    await touchDrag({ x: svgBox.x + svgBox.width / 2, y: svgBox.y + svgBox.height / 2 }, { x: svgBox.x + svgBox.width / 2 + 22, y: svgBox.y + svgBox.height / 2 + 15 });
    await mobile.waitForFunction(previous => document.querySelector('[data-testid="plan-editor"] svg')?.getAttribute('viewBox') !== previous, beforeView);
    const events = await mobile.evaluate(() => window.__qaTouchEvents);
    assert.ok(events.some(event => event.type === 'pointerdown' && event.target === 'circle'));
    assert.ok(events.filter(event => event.type === 'pointermove').length >= 4);
    assert.ok(events.some(event => event.type === 'pointerup'));
    assert.ok(await mobile.evaluate(() => document.documentElement.scrollWidth - innerWidth <= 1));
    await screenshot(mobile, 'mobile-real-touch-2d.png');
    return { beforeArea, afterArea, touchPointerEvents: events.length, panned: true };
  });

  await check('real touch 3D orbit and pinch, WebGL loss, exact fallback and retry', async () => {
    await mobile.getByRole('button', { name: '01 Tvar', exact: true }).tap();
    await mobile.getByTestId('planner-shape-rectangle').tap();
    await mobile.getByTestId('planner-3d').tap();
    const scene = mobile.getByTestId('planner-scene');
    await scene.scrollIntoViewIfNeeded();
    await mobile.waitForFunction(() => document.querySelector('[data-testid="planner-scene"]')?.getAttribute('data-three-ready') === 'true', null, { timeout: 30_000 });
    const canvas = scene.locator('canvas');
    const box = await canvas.boundingBox(); assert.ok(box);
    const center = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    const beforeOrbit = hash(await canvas.screenshot());
    await touchDrag(center, { x: center.x + 58, y: center.y + 28 });
    const afterOrbit = hash(await canvas.screenshot());
    assert.notEqual(afterOrbit, beforeOrbit, 'Actual rendered canvas must change after a touch orbit');
    const beforePinch = afterOrbit;
    await touch('touchStart', [{ x: center.x - 25, y: center.y }, { x: center.x + 25, y: center.y }]);
    for (let index = 1; index <= 6; index++) {
      await touch('touchMove', [{ x: center.x - 25 - index * 5, y: center.y }, { x: center.x + 25 + index * 5, y: center.y }]);
      await mobile.evaluate(() => new Promise(requestAnimationFrame));
    }
    await touch('touchEnd', []);
    assert.notEqual(hash(await canvas.screenshot()), beforePinch, 'Actual rendered canvas must change after a two-finger pinch');
    const dimensions = await canvas.evaluate(element => ({ cssWidth: element.clientWidth, bufferWidth: element.width }));
    assert.ok(dimensions.bufferWidth / dimensions.cssWidth <= 1.51, 'Mobile rendering DPR must be capped');
    await screenshot(mobile, 'mobile-real-touch-3d.png');
    const canLoseContext = await canvas.evaluate(element => {
      const gl = element.getContext('webgl2') || element.getContext('webgl');
      const extension = gl?.getExtension('WEBGL_lose_context');
      if (!extension) return false;
      extension.loseContext(); return true;
    });
    if (canLoseContext) {
      await mobile.waitForFunction(() => document.querySelector('[data-testid="planner-scene"]')?.getAttribute('data-three-ready') === 'false');
      await scene.getByRole('button', { name: 'Znovu spustiť 3D', exact: true }).waitFor();
      assert.equal(await scene.locator('svg').count(), 1, 'The exact engine 2D SVG must replace lost WebGL');
      assert.ok(await scene.locator('svg polygon').count() > 0);
      await screenshot(mobile, 'mobile-webgl-loss-fallback.png');
      await scene.getByRole('button', { name: 'Znovu spustiť 3D', exact: true }).tap();
      await mobile.waitForFunction(() => document.querySelector('[data-testid="planner-scene"]')?.getAttribute('data-three-ready') === 'true', null, { timeout: 30_000 });
      assert.equal(await scene.locator('canvas').count(), 1); assert.equal(await scene.locator('svg').count(), 0);
    }
    const events = await mobile.evaluate(() => window.__qaTouchEvents);
    assert.ok(events.some(event => event.type === 'pointerdown' && event.target === 'CANVAS'));
    return { touchOrbitChangedCanvas: true, touchPinchChangedCanvas: true, dpr: dimensions.bufferWidth / dimensions.cssWidth, webglLossAndRetry: canLoseContext ? 'passed' : 'unsupported extension, not tested' };
  });


  await check('saved project dimensions, custom resizing and square dimensions stay synchronized', async () => {
    const page = await newPage();
    await open(page, '/planovac', page.getByTestId('planner-page'));
    await page.getByRole('button', { name: '02 Rozmery', exact: true }).click();
    await page.getByTestId('planner-length').fill('5400'); await waitValue(page.getByTestId('planner-length'), '5400');
    await page.getByTestId('planner-width').fill('3200'); await waitValue(page.getByTestId('planner-width'), '3200');
    await page.getByTestId('planner-cutout').click();
    await page.getByRole('button', { name: 'Uložiť návrh', exact: true }).click();
    await page.getByTestId('planner-length').fill('4000'); await waitValue(page.getByTestId('planner-length'), '4000');
    await page.getByRole('button', { name: 'Načítať uložený', exact: true }).click();
    await waitValue(page.getByTestId('planner-length'), '5400'); await waitValue(page.getByTestId('planner-width'), '3200');
    const before = await jsonDownload(page, () => page.getByRole('button', { name: 'Stiahnuť projekt JSON', exact: true }).click(), 'restored-project.json', 'moja-terasa.json');
    assert.equal(before.input.holes.length, 1); assert.equal(before.input.outline.length, 4);
    await page.getByTestId('planner-length').fill('6000'); await waitValue(page.getByTestId('planner-length'), '6000');
    const resized = await jsonDownload(page, () => page.getByRole('button', { name: 'Stiahnuť projekt JSON', exact: true }).click(), 'resized-project.json', 'moja-terasa.json');
    assert.equal(resized.input.holes.length, 1); assert.equal(resized.input.holes[0].length, 4); assert.equal(resized.input.outline.length, 4);
    assert.equal(Math.max(...resized.input.outline.map(p => p.x)) - Math.min(...resized.input.outline.map(p => p.x)), 6000);
    assert.ok(Math.abs(resized.input.holes[0][1].x - before.input.holes[0][1].x * 6000 / 5400) < 0.001);
    await page.getByRole('button', { name: '01 Tvar', exact: true }).click(); await page.getByTestId('planner-shape-square').click();
    await page.getByRole('button', { name: '02 Rozmery', exact: true }).click(); await waitValue(page.getByTestId('planner-width'), '6000');
    await page.getByTestId('planner-width').fill('3800'); await waitValue(page.getByTestId('planner-width'), '3800'); await waitValue(page.getByTestId('planner-length'), '3800');
    return { restoredBounds: [5400, 3200], resizedBounds: [6000, 3200], preservedHole: true, squareSide: 3800 };
  });
  await check('actual planner print stylesheet and generated PDF', async () => {
    const page = await newPage();
    await open(page, '/planovac', page.getByTestId('planner-page'));
    await page.getByRole('button', { name: '06 Výsledok', exact: true }).click();
    await page.locator('.planner-report tbody tr').first().waitFor();
    assert.equal(await page.getByTestId('planner-add-cart').isDisabled(), false);
    assert.ok(await page.locator('.planner-cuts').count() > 0);
    await page.emulateMedia({ media: 'print' });
    const print = await page.evaluate(() => ({
      planVisible: getComputedStyle(document.querySelector('.planner-print-plan')).display !== 'none',
      editorHidden: getComputedStyle(document.querySelector('.planner-workspace')).display === 'none',
      actionButtonsHidden: getComputedStyle(document.querySelector('.planner-report-actions')).display === 'none',
      boardPolygons: document.querySelectorAll('.planner-print-plan svg path').length,
      materialRows: document.querySelectorAll('.planner-report tbody tr').length,
      hasDisclaimer: document.querySelector('.planner-print-plan').textContent.includes('Nejde o statický posudok'),
    }));
    assert.equal(print.planVisible, true); assert.equal(print.editorHidden, true); assert.equal(print.actionButtonsHidden, true);
    assert.ok(print.boardPolygons > 1); assert.ok(print.materialRows > 0); assert.equal(print.hasDisclaimer, true);
    const pdf = await page.pdf({ path: join(output, 'planner-technical-report.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true, margin: { top: '12mm', bottom: '12mm', left: '12mm', right: '12mm' } });
    assert.equal(pdf.subarray(0, 5).toString(), '%PDF-'); assert.ok(pdf.length > 5000);
    report.artifacts.push('planner-technical-report.pdf');
    await screenshot(page, 'planner-print-layout.png');
    return { ...print, pdfBytes: pdf.length };
  });

  await check('actual ReactDOM overview screenshots for artifact and sanctioned log inspection', async () => {
    const desktop = await newPage({ viewport: { width: 1280, height: 900 } });
    await open(desktop, '/terasove-dosky', desktop.getByTestId('catalog-search'));
    await desktop.getByTestId(`product-${board.productId}`).waitFor();
    // Images below the viewport remain lazy; their decode promises must not block a viewport screenshot.
    await desktop.evaluate(async () => {
      const visible = [...document.images].filter(image => { const rect = image.getBoundingClientRect(); return rect.width > 0 && rect.height > 0 && rect.top < innerHeight && rect.bottom > 0 && rect.left < innerWidth && rect.right > 0; });
      await Promise.all(visible.map(async image => { let timer; try { await Promise.race([image.decode(), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`Visible image did not decode: ${image.src}`)), 5000); })]); if (!image.complete || !image.naturalWidth) throw new Error(`Visible image failed: ${image.src}`); } finally { clearTimeout(timer); } }));
    });
    await screenshot(desktop, 'overview-1280-catalog.png');
    await mobile.getByTestId('planner-scene').scrollIntoViewIfNeeded();
    await screenshot(mobile, 'overview-402-planner.png');
    const emitted = [];
    for (const [page, filename] of [[desktop, 'overview-1280-catalog.jpg'], [mobile, 'overview-402-planner.jpg']]) {
      let jpeg;
      for (const quality of [55, 40, 25, 15]) { jpeg = await page.screenshot({ type: 'jpeg', quality, fullPage: false }); if (jpeg.length <= 100_000) break; }
      assert.ok(jpeg.length <= 100_000, `${filename} exceeds the bounded CI overview size`);
      await writeFile(join(output, filename), jpeg); report.artifacts.push(filename);
      // Compact images are intentionally only CI log markers. The artifact
      // remains the primary output; local tool output must not echo base64.
      console.log(`QA_IMAGE_START:${filename}`);
      console.log(jpeg.toString('base64'));
      console.log('QA_IMAGE_END');
      emitted.push({ filename, bytes: jpeg.length });
    }
    return { emitted };
  });

  await check('real WebKit mobile smoke: homepage, catalog, planner, cart and menu', async () => {
    const webkitBrowser = await webkit.launch({ headless: true });
    const smoke = [];
    try {
      for (const viewport of [{ width: 402, height: 874 }, { width: 375, height: 812 }]) {
        const context = await webkitBrowser.newContext({ viewport, isMobile: true, hasTouch: true, deviceScaleFactor: 3, reducedMotion: 'reduce' });
        const page = await context.newPage(); latestPage = page; page.setDefaultTimeout(15_000);
        page.on('pageerror', error => report.pageErrors.push({ message: error.message, route: page.url(), engine: 'WebKit' }));
        for (const route of ['/2027', '/terasove-dosky', '/planovac', '/kosik']) {
          const ready = route === '/2027' ? page.getByTestId('homepage-menu') : route === '/terasove-dosky' ? page.getByTestId('catalog-search') : route === '/planovac' ? page.getByTestId('planner-page') : page.getByRole('heading', { name: 'Košík je prázdny.', exact: true });
          await open(page, route, ready);
          assert.ok(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth <= 1), `WebKit ${viewport.width} ${route} overflows`);
          await screenshot(page, `webkit-${viewport.width}-${route.slice(1)}.png`);
          smoke.push({ width: viewport.width, route, noOverflow: true });
          if (route === '/terasove-dosky') {
            await page.getByTestId('homepage-menu').tap();
            const menu = page.getByTestId('homepage-nav'); await menu.waitFor();
            await menu.getByRole('link', { name: 'Plánovač', exact: true }).tap();
            await page.getByTestId('planner-page').waitFor();
            assert.equal(await page.getByTestId('homepage-nav').count(), 0, 'WebKit menu closes after route selection');
          }
          if (route === '/planovac') {
            await page.getByRole('button', { name: '02 Rozmery', exact: true }).tap();
            await page.getByTestId('planner-length').fill('4600');
            await page.waitForFunction(() => document.querySelector('[data-testid="planner-sync"]')?.getAttribute('data-area') === '11.5');
            assert.equal(Number(await page.getByTestId('planner-sync').getAttribute('data-area')), 11.5);
            await page.getByTestId('planner-3d').tap();
            const scene = page.getByTestId('planner-scene'); await scene.scrollIntoViewIfNeeded();
            await page.waitForFunction(() => {
              const element = document.querySelector('[data-testid="planner-scene"]');
              return element?.getAttribute('data-three-ready') === 'true' || !!element?.querySelector('button');
            }, null, { timeout: 30_000 });
            const rendered3d = await scene.getAttribute('data-three-ready') === 'true';
            if (!rendered3d) {
              assert.equal(await scene.locator('svg').count(), 1, 'Unavailable WebGL must provide the exact 2D engine fallback');
              await scene.getByRole('button', { name: 'Znovu spustiť 3D', exact: true }).waitFor();
            }
            assert.ok(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth <= 1));
            smoke.push({ width: viewport.width, dimensionsChanged: true, model: rendered3d ? 'genuine Three canvas' : 'honest WebGL unavailable fallback' });
            await screenshot(page, `webkit-${viewport.width}-planner-model.png`);
          }
        }
        await context.close();
      }
    } finally { await webkitBrowser.close(); }
    return { engine: 'WebKit, not a physical iPhone', smoke };
  });

  await check('future machine-generated PDF manifest upload stages exact price changes without public publication', async () => {
    const page = await newPage({ viewport: { width: 1280, height: 900 } });
    await open(page, '/admin', page.getByRole('button', { name: 'OTVORIŤ LOKÁLNE DEMO →', exact: true }));
    await page.getByRole('button', { name: 'OTVORIŤ LOKÁLNE DEMO →', exact: true }).click();
    await page.getByRole('button', { name: 'CSV import', exact: true }).click();
    const manifest = JSON.parse(await readFile(join(root, 'src/data/jaf-stock-2026-10-10.json'), 'utf8'));
    manifest.source.id = 'jaf-stock-test-future'; manifest.source.date = '2026-11-10'; manifest.source.sha256 = 'b'.repeat(64);
    manifest.articles[0].priceGrossCents = 2500; manifest.articles[0].referenceGrossCents = 600;
    await page.getByTestId('stock-manifest-upload').setInputFiles({ name: 'future-pricelist-test.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(manifest)) });
    await page.getByTestId('stock-pending-source').waitFor();
    assert.match(await page.getByTestId('stock-pending-source').innerText(), /2026-11-10/);
    const draft = await jsonDownload(page, () => page.getByRole('button', { name: 'EXPORTOVAŤ NÁVRH JSON ↓', exact: true }).click(), 'future-pricelist-draft.json');
    assert.equal(draft.pendingSource.sha256, 'b'.repeat(64)); assert.equal(draft.publicationRequiresReview, true);
    const variant = draft.products.flatMap(product => product.variants).find(row => row.articleNumber === board.articleNumber);
    assert.equal(variant.priceGross, 25); assert.equal(variant.pricePerBmGross, 6);
    await open(page, '/produkt/'+board.productId, page.getByTestId('product-variant'));
    assert.match(await page.locator('.platform-price').innerText(), /23,12/);
    await open(page, '/planovac', page.getByTestId('planner-page'));
    assert.equal(await page.getByTestId('planner-add-cart').isDisabled(), false);
    return { updatedDraftGross: 25, publicGross: 23.12, articles: 137, publication: false };
  });

  await check('technical SKU rules, cuts, source citations, settings persistence and exact BOM cart integration', async () => {
    const page=await newPage({viewport:{width:1280,height:900}});
    const fixture=fixtures.find(v=>v.articleNumber==='55978/0230');
    await open(page,'/planovac?product='+fixture.productId+'&variant='+fixture.variantId,page.getByTestId('planner-page'));
    await page.getByRole('button',{name:'02 Rozmery',exact:true}).click();
    await page.getByTestId('planner-length').fill('8000');
    await page.getByRole('button',{name:'04 Konštrukcia',exact:true}).click();
    await page.getByTestId('technical-fixing').selectOption('profix-x');
    assert.match(await page.getByTestId('technical-spacing').innerText(),/450 mm/);
    await page.getByText('Pokročilé technické nastavenia',{exact:true}).click();
    await page.getByTestId('technical-trimEachEndMm').fill('10');
    await page.getByTestId('technical-sawKerfMm').fill('3');
    assert.ok(Number(await page.getByTestId('planner-sync').getAttribute('data-joists'))>0);
    assert.match(await page.getByTestId('planner-status').innerText(),/PDF s\./);
    await page.getByTestId('planner-3d').click();
    const scene=page.getByTestId('planner-scene');await scene.scrollIntoViewIfNeeded();
    await page.waitForFunction(()=>document.querySelector('[data-testid="planner-scene"]')?.getAttribute('data-three-ready')==='true');
    assert.equal(await scene.getAttribute('data-joist-count'),await page.getByTestId('planner-sync').getAttribute('data-joists'));
    assert.equal(await scene.getAttribute('data-pedestal-count'),'0');
    const saved=await jsonDownload(page,()=>page.getByRole('button',{name:'Stiahnuť projekt JSON',exact:true}).click(),'technical-project.json','moja-terasa.json');
    assert.equal(saved.input.technical.trimEachEndMm,10);assert.equal(saved.input.technical.fixing,'profix-x');
    await page.getByTestId('planner-add-cart').click();
    assert.match(await page.locator('.planner-message').innerText(),/položiek bolo pridaných/);
    await open(page,'/kosik',page.getByRole('button',{name:'EXPORT MATERIÁLOVÉHO ZOZNAMU ↓',exact:true}));
    const quote=await jsonDownload(page,()=>page.getByRole('button',{name:'EXPORT MATERIÁLOVÉHO ZOZNAMU ↓',exact:true}).click(),'technical-bom-quote.json');
    assert.ok(JSON.stringify(quote).includes('55985/0003'));assert.ok(!JSON.stringify(quote).includes('demo-'));
    return {sourceRules:true,doubleJoists:true,noInventedPedestals:true,exactClipPack:true,projectRoundTrip:true};
  });

  await check('RAPI-TEC reference stays outside commerce and persists exposure', async()=>{
    const page=await newPage({viewport:{width:402,height:874},isMobile:true,hasTouch:true});
    const fixture=fixtures.find(v=>v.articleNumber==='55954/2183');
    await open(page,'/planovac?product='+fixture.productId+'&variant='+fixture.variantId,page.getByTestId('planner-page'));
    await page.getByRole('button',{name:'04 Konštrukcia',exact:true}).click();
    await page.getByText('Pokročilé technické nastavenia',{exact:true}).click();
    await page.getByTestId('technical-reference').selectOption('plus');
    await page.getByTestId('technical-exposure').selectOption('chlorine');
    await page.getByRole('button',{name:'06 Výsledok',exact:true}).click();
    assert.match(await page.getByTestId('fastener-reference').innerText(),/Mimo sortimentu, bez ceny/);
    assert.match(await page.getByTestId('fastener-reference').innerText(),/Nevhodná/);
    const saved=await jsonDownload(page,()=>page.getByRole('button',{name:'Stiahnuť projekt JSON',exact:true}).click(),'rapitec-project.json','moja-terasa.json');
    assert.equal(saved.input.technical.exposure,'chlorine');assert.equal(saved.input.technical.fastenerReference,'plus');
    return {referenceOnly:true,environmentPersisted:true};
  });

  await check('no application runtime or non-WebGL console errors', async () => {
    assert.deepEqual(report.pageErrors, []);
    assert.deepEqual(report.consoleErrors.filter(error => !/webgl|swiftshader|gpu process|context[_ ]lost/i.test(error.message)), []);
    return { pageErrors: report.pageErrors.length };
  });
} catch (error) { report.failures.push({ name: 'browser setup', error: error.stack || error.message }); }
finally {
  for (const context of contexts) await context.close().catch(() => {});
  await browser?.close();
  await new Promise(resolveClosed => server.close(resolveClosed));
  report.passed = report.failures.length === 0;
  await writeFile(join(output, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ passed: report.passed, checks: report.checks.length, artifacts: report.artifacts.length, failures: report.failures }, null, 2));
  if (!report.passed) process.exitCode = 1;
}
