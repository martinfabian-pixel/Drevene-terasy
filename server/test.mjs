import assert from 'node:assert/strict';
import { randomBytes, scryptSync } from 'node:crypto';
import { mkdir, readFile, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createApi } from './app.mjs';
import { calculateOrder, validateInquiry, validateProductCatalog } from './domain.mjs';
import { backendCatalogPolicy, buildApprovedStockCatalog, approvedStockManifest, createTestOnlyCatalogPolicy } from './stock-policy.mjs';
import { createStore } from './store.mjs';
const salt = randomBytes(24).toString('hex'), password = randomBytes(30).toString('hex'), key = randomBytes(32);
const folder = resolve('qa/server-tests'); await mkdir(folder, { recursive: true });
const dataPath = resolve(folder, `test-${Date.now()}.enc.json`);
const origin = 'http://localhost:4173';
const config = { dataPath, encryptionKey: key, adminUser: 'test-admin', passwordHash: `${salt}:${scryptSync(password, salt, 64).toString('hex')}`, allowedOrigins: [origin], secureCookies: false, acceptInquiries: true, commerceApproved: false, commerceLive: false };
const api = createApi(config);
await api.ready;
await new Promise(resolve => api.server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${api.server.address().port}`;
let passed = 0;
const check = (condition, text) => { assert.ok(condition, text); passed++; };
const request = (route, method = 'GET', body, extras = {}) => fetch(base + route, { method, headers: { ...(method !== 'GET' ? { Origin: origin, 'Content-Type': 'application/json' } : {}), ...extras }, body: body === undefined ? undefined : JSON.stringify(body) });
try {
  const capabilities = await (await request('/api/capabilities')).json(); check(capabilities.orders === false && capabilities.payments === false, 'Live orders and payments default disabled.');
  check((await request('/api/admin/orders')).status === 401, 'Admin data require authentication.');
  check((await request('/api/admin/products', 'PUT', { items: [] })).status === 401, 'Admin mutation requires authentication.');
  check((await request('/api/orders', 'POST', {})).status === 503, 'Disabled real orders reject all submissions.');
  check((await request('/api/inquiries', 'POST', {}, { Origin: 'https://evil.invalid' })).status === 403, 'Origin allowlist rejects other sites.');
  check((await request('/api/inquiries', 'POST', { contact: { name: 'Test', email: 'bad' } }, { 'Idempotency-Key': 'test-invalid-request-key' })).status === 400, 'Email validated.');
  const inquiry = { contact: { name: 'Test Person', email: 'test@example.invalid', message: 'Local automated test only.' } }, idempotencyKey = `test-inquiry-${randomBytes(12).toString('hex')}`;
  const first = await request('/api/inquiries', 'POST', inquiry, { 'Idempotency-Key': idempotencyKey }); check(first.status === 201, 'Validated inquiry persisted.'); const result = await first.json();
  const repeated = await (await request('/api/inquiries', 'POST', inquiry, { 'Idempotency-Key': idempotencyKey })).json(); check(repeated.id === result.id, 'Idempotency avoids duplicate inquiries.');
  check((await request('/api/inquiries', 'POST', { ...inquiry, note: 'different' }, { 'Idempotency-Key': idempotencyKey })).status === 409, 'Idempotency key rejects changed payload.');
  const login = await request('/api/admin/login', 'POST', { user: 'test-admin', password }); check(login.status === 200, 'Configured scrypt credentials authenticate.');
  const cookie = login.headers.get('set-cookie').split(';')[0], session = await login.json();
  check(login.headers.get('set-cookie').includes('HttpOnly') && login.headers.get('set-cookie').includes('SameSite=Strict'), 'Session is HttpOnly and SameSite strict.');
  check((await request('/api/admin/products', 'PUT', { items: [] }, { Cookie: cookie })).status === 403, 'Admin mutation requires CSRF token.');
  const credentials = { Cookie: cookie, 'X-CSRF-Token': session.csrf };
  const approved = buildApprovedStockCatalog(), normalized = validateProductCatalog(approved), policy = backendCatalogPolicy({});
  check(normalized.length === 83 && normalized.flatMap(product => product.variants).length === 137, 'All 137 approved PDF articles are accepted with gross prices and unknown VAT.');
  check(normalized.every(product => product.stockSource.sha256 === approvedStockManifest.source.sha256 && product.sourceUrls.length === 0 && product.variants.every(variant => variant.priceGross !== null && variant.vatRate === null && variant.stock === null)), 'PDF provenance replaces invented URLs and VAT/current stock remain unknown.');
  const fixtures = JSON.parse(await readFile(new URL('../scripts/qa-stock-fixtures.json', import.meta.url), 'utf8'));
  for (const fixture of fixtures) { const product = normalized.find(row => row.id === fixture.productId), variant = product?.variants.find(row => row.id === fixture.variantId); assert.ok(variant); assert.deepEqual(Object.fromEntries(['articleNumber', 'priceGross', 'lengthMm', 'widthMm', 'thicknessMm'].map(field => [field, variant[field]])), Object.fromEntries(['articleNumber', 'priceGross', 'lengthMm', 'widthMm', 'thicknessMm'].map(field => [field, fixture[field]]))); } passed++;
  check(normalized.flatMap(product => product.variants).reduce((sum, variant) => sum + Math.round(variant.priceGross * 100), 0) === 495999 && normalized.flatMap(product => product.variants).filter(variant => variant.stockProgramStatus === 'while-stocks-last').length === 13, 'All PDF prices and 13 clearance labels survive backend normalization.');
  check(policy.enforce(normalized).flatMap(product => product.variants).length === 137, 'Exact approved catalog passes the backend policy.');
  for (const [label, mutate] of [
    ['price', products => { products[0].variants[0].priceGross += 1; }],
    ['unit', products => { products[0].variants[0].unit = 'bal'; }],
    ['rebate', products => { products[0].variants[0].rebateGroup = 'R999'; }],
    ['fingerprint', products => { products[0].stockSource.sha256 = '0'.repeat(64); }],
    ['article', products => { products[0].variants[0].articleNumber = '99999/9999'; }],
  ]) { const altered = structuredClone(normalized); mutate(altered); assert.throws(() => policy.enforce(altered), error => error.status === 409, `${label} must be locked to PDF`); passed++; }
  const isolated = createTestOnlyCatalogPolicy([]);
  assert.throws(() => backendCatalogPolicy({ testOnlyCatalogPolicy: isolated })); passed++;
  assert.throws(() => backendCatalogPolicy({ testOnly: true, testOnlyCatalogPolicy: { approved: [] } })); passed++;
  check(backendCatalogPolicy({ testOnly: true, testOnlyCatalogPolicy: isolated }).enforce([]).length === 0, 'Trusted isolated test policy requires an explicit code-only flag and private brand.');
  check((await request('/api/admin/products', 'PUT', { items: [] }, credentials)).status === 409, 'Authenticated admin cannot remove the approved assortment.');
  check((await request('/api/admin/products', 'PUT', { items: approved }, credentials)).status === 200, 'Authenticated CSRF-protected exact PDF catalog update works.');
  const protectedProducts = await (await request('/api/admin/products', 'GET', undefined, { Cookie: cookie })).json(); check(protectedProducts.items.flatMap(product => product.variants).length === 137, 'Admin GET exposes only the complete approved PDF assortment.');
  const altered = structuredClone(approved); altered[0].variants[0].priceGross = 0.01;
  check((await request('/api/admin/products', 'PUT', { items: altered }, credentials)).status === 409, 'Admin price override is rejected.');
  const outside = structuredClone(approved); outside.push({ ...structuredClone(outside[0]), id: 'unapproved-board', variants: [{ ...structuredClone(outside[0].variants[0]), id: 'unapproved-variant', articleNumber: '99999/9999' }] });
  check((await request('/api/admin/products', 'PUT', { items: outside }, credentials)).status === 409, 'New products outside the PDF cannot be stored.');
  const afterRejected = await (await request('/api/admin/products', 'GET', undefined, { Cookie: cookie })).json(); check(afterRejected.items[0].variants[0].priceGross === 23.12 && afterRejected.items.flatMap(product => product.variants).length === 137, 'Rejected changes leave exact source prices and assortment intact.');
  await api.store.mutate(data => { data.products = outside; });
  const unsafeRead = await request('/api/admin/products', 'GET', undefined, { Cookie: cookie }); check(unsafeRead.status === 409 && !Object.hasOwn(await unsafeRead.json(), 'items'), 'A persisted out-of-policy catalog is never exposed.');
  await api.store.mutate(data => { data.products = approved; });
  const protectedInquiries = await (await request('/api/admin/inquiries', 'GET', undefined, { Cookie: cookie })).json(); check(protectedInquiries.items.length === 1, 'Only one inquiry persisted, accessible to admin.');
  const encrypted = await readFile(dataPath, 'utf8'); check(!encrypted.includes('test@example.invalid') && !encrypted.includes('Test Person'), 'Durable data are encrypted at rest.');
  check((await request('/api/admin/logout', 'POST', {}, { Cookie: cookie, 'X-CSRF-Token': session.csrf })).status === 200, 'Logout destroys session.');
  check((await request('/api/admin/orders', 'GET', undefined, { Cookie: cookie })).status === 401, 'Expired/logout token cannot access records.');
  assert.throws(() => validateInquiry({ contact: inquiry.contact, attachments: [{ name: 'x.png', type: 'image/png', dataUrl: 'data:image/png;base64,YWJj' }] })); passed++;
  assert.throws(() => validateProductCatalog([{ id: 'duplicate', name: 'A', status: 'demo', variants: [] }])); passed++;
  const product = { id: 'board', name: 'Verified test board', status: 'verified', variants: [{ id: 'board-4m', unit: 'ks', lengthMm: 4000, widthMm: 140, thicknessMm: 26, priceGross: 12.30, vatRate: 23, availability: 'Test inventory', stock: { status: 'available', availableQuantity: 100 } }] };
  const order = calculateOrder({ contact: { ...inquiry.contact, billingStreet: 'Test 1', billingCity: 'Test', billingPostcode: '00000' }, delivery: 'pickup', items: [{ productId: 'board', variantId: 'board-4m', quantity: 2, price: .01 }] }, [product]);
  check(order.grossCents === 2460 && order.netCents === 2000 && order.paymentStatus === 'not-initiated', 'Server recalculates price/VAT and ignores client price.');
  const oil = { ...product, variants: [{ ...product.variants[0], unit: 'l', lengthMm: null, widthMm: null, thicknessMm: null }] };
  const oilOrder = calculateOrder({ contact: { ...inquiry.contact, billingStreet: 'Test 1', billingCity: 'Test', billingPostcode: '00000' }, delivery: 'pickup', items: [{ productId: 'board', variantId: 'board-4m', quantity: .5 }] }, [oil]);
  check(oilOrder.grossCents === 615, 'Fractional litres are accepted with exact monetary rounding.');
  assert.throws(() => calculateOrder({ contact: inquiry.contact, items: [{ productId: 'board', variantId: 'board-4m', quantity: .5 }] }, [product])); passed++;
  assert.throws(() => calculateOrder({ contact: inquiry.contact, items: [{ productId: 'board', variantId: 'board-4m', quantity: 2 }] }, [{ ...product, status: 'demo' }])); passed++;
  const sourceProduct = buildApprovedStockCatalog()[0], sourceVariant = sourceProduct.variants[0];
  const sourceOrder = { contact: { ...inquiry.contact, billingStreet: 'Test 1', billingCity: 'Test', billingPostcode: '00000' }, delivery: 'pickup', items: [{ productId: sourceProduct.id, variantId: sourceVariant.id, quantity: 1 }] };
  assert.throws(() => calculateOrder(sourceOrder, [{ ...sourceProduct, variants: [{ ...sourceVariant, stock: { status: 'available', availableQuantity: 100 } }] }]), error => error.status === 409); passed++;
  assert.throws(() => calculateOrder(sourceOrder, [{ ...sourceProduct, variants: [{ ...sourceVariant, vatRate: 23 }] }]), error => error.status === 409); passed++;
  const configuredPath = resolve(folder, `configured-${Date.now()}.enc.json`), configured = createApi({ ...config, dataPath: configuredPath, commerceApproved: true, commerceLive: true });
  try {
    await configured.ready; await new Promise(resolveReady => configured.server.listen(0, '127.0.0.1', resolveReady));
    const configuredBase = `http://127.0.0.1:${configured.server.address().port}`;
    const configuredCapabilities = await (await fetch(configuredBase + '/api/capabilities')).json(); check(configuredCapabilities.orders === false && configuredCapabilities.payments === false, 'Environment-style live flags cannot activate the PDF catalog with missing tax/stock setup.');
    check((await fetch(configuredBase + '/api/orders', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify(sourceOrder) })).status === 503, 'Real stock ordering remains disabled even when both live flags are true.');
  } finally { if (configured.server.listening) await new Promise(resolveClosed => configured.server.close(resolveClosed)); await unlink(configuredPath).catch(() => {}); }
  const legacyPath = resolve(folder, `legacy-${Date.now()}.enc.json`), legacyStore = createStore(legacyPath, key);
  try {
    await legacyStore.mutate(data => { data.products = [{ ...product, category: 'massive', sourceUrls: ['https://example.invalid/legacy'], images: [] }]; });
    const legacy = createApi({ ...config, dataPath: legacyPath }); await assert.rejects(legacy.ready, error => error.status === 409); passed++;
  } finally { await unlink(legacyPath).catch(() => {}); }
  process.stdout.write(`Backend tests: ${JSON.stringify({ passed, failed: 0 })}\n`);
} finally { await new Promise(resolve => api.server.close(resolve)); await unlink(dataPath).catch(() => {}); }
