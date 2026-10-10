import { createServer } from 'node:http';
import { randomBytes, randomUUID, createHash, scryptSync, timingSafeEqual } from 'node:crypto';
import { ApiError, calculateOrder, requestHash, validateInquiry, validateProductCatalog } from './domain.mjs';
import { createStore } from './store.mjs';
import { backendCatalogPolicy } from './stock-policy.mjs';
export function createApi(config) {
  const store = createStore(config.dataPath, config.encryptionKey), sessions = new Map(), attempts = new Map();
  const allowedOrigins = new Set(config.allowedOrigins || []), now = config.now || (() => Date.now());
  if (!config.passwordHash || !/^[a-f0-9]{32,128}:[a-f0-9]{128}$/.test(config.passwordHash)) throw new Error('A salted scrypt admin password hash is required.');
  if (!config.adminUser || allowedOrigins.size === 0) throw new Error('Admin user and origin allowlist are required.');
  const [salt, digest] = config.passwordHash.split(':');
  const catalogPolicy = backendCatalogPolicy(config);
  const approvedProducts = items => catalogPolicy.enforce(validateProductCatalog(items));
  const commerceEnabled = config.commerceApproved === true && config.commerceLive === true && catalogPolicy.allowLiveOrders === true;
  const ready = store.mutate(data => {
    if (!Array.isArray(data.products)) throw new ApiError(409, 'Stored catalog is invalid.');
    data.products = approvedProducts(data.products.length ? data.products : catalogPolicy.approved);
  });
  // start.mjs awaits this; requests also fail closed until initialization succeeds.
  void ready.catch(() => {});
  const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'" };
  const hash = value => createHash('sha256').update(value).digest('hex');
  function reply(response, status, value, extra = {}) { response.writeHead(status, { ...headers, ...extra }); response.end(JSON.stringify(value)); }
  function limited(request, suffix, maximum) {
    const key = `${request.socket.remoteAddress}:${suffix}`, time = now();
    let item = attempts.get(key); if (!item || item.reset <= time) item = { count: 0, reset: time + 60000 };
    item.count++; attempts.set(key, item); if (item.count > maximum) throw new ApiError(429, 'Too many requests.');
    if (attempts.size > 10000) for (const [entry, record] of attempts) if (record.reset <= time) attempts.delete(entry);
  }
  async function json(request) {
    if (!String(request.headers['content-type'] || '').startsWith('application/json')) throw new ApiError(415, 'JSON body required.');
    const chunks = []; let size = 0;
    for await (const chunk of request) { size += chunk.length; if (size > 15_000_000) throw new ApiError(413, 'Request too large.'); chunks.push(chunk); }
    try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new ApiError(400, 'Invalid JSON.'); }
  }
  function admin(request, mutation = false) {
    const token = String(request.headers.cookie || '').split(';').map(item => item.trim()).find(item => item.startsWith('dt_session='))?.slice(11);
    const session = token && sessions.get(hash(token));
    if (!session || session.expires <= now()) throw new ApiError(401, 'Authentication required.');
    if (session.role !== 'admin') throw new ApiError(403, 'Forbidden.');
    if (mutation && request.headers['x-csrf-token'] !== session.csrf) throw new ApiError(403, 'Invalid CSRF token.');
    return session;
  }
  async function idempotent(request, body, operation) {
    const key = request.headers['idempotency-key']; if (typeof key !== 'string' || !/^[a-zA-Z0-9_-]{16,100}$/.test(key)) throw new ApiError(400, 'Idempotency-Key is required.');
    const payloadHash = requestHash(body), scopedKey = `${request.method}:${new URL(request.url, 'http://localhost').pathname}:${key}`;
    return store.mutate(async data => {
      data.idempotency = data.idempotency.filter(entry => entry.expires > now());
      const previous = data.idempotency.find(entry => entry.key === scopedKey);
      if (previous) { if (previous.hash !== payloadHash) throw new ApiError(409, 'Idempotency key reused with a different request.'); return previous.result; }
      const result = await operation(data); data.idempotency.push({ key: scopedKey, hash: payloadHash, result, expires: now() + 86400000 }); return result;
    });
  }
  const server = createServer(async (request, response) => {
    try {
      await ready;
      const origin = request.headers.origin;
      if (origin && !allowedOrigins.has(origin)) throw new ApiError(403, 'Origin not allowed.');
      if (origin) { response.setHeader('Access-Control-Allow-Origin', origin); response.setHeader('Access-Control-Allow-Credentials', 'true'); response.setHeader('Vary', 'Origin'); }
      if (request.method === 'OPTIONS') { if (!origin) throw new ApiError(403, 'Origin required.'); return reply(response, 204, null, { 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type,X-CSRF-Token,Idempotency-Key' }); }
      const route = new URL(request.url, 'http://localhost').pathname;
      if (request.method !== 'GET' && !origin) throw new ApiError(403, 'Origin required.');
      limited(request, 'global', 120);
      if (request.method === 'GET' && route === '/api/capabilities') return reply(response, 200, { inquiries: config.acceptInquiries === true, orders: commerceEnabled, payments: false, adminRequiresAuthentication: true });
      if (request.method === 'POST' && route === '/api/admin/login') {
        limited(request, 'login', 5); const input = await json(request);
        if (typeof input.password !== 'string' || input.password.length > 200) throw new ApiError(401, 'Invalid credentials.');
        const actual = scryptSync(input.password, salt, 64), expected = Buffer.from(digest, 'hex');
        if (!timingSafeEqual(actual, expected) || input.user !== config.adminUser) throw new ApiError(401, 'Invalid credentials.');
        const token = randomBytes(32).toString('hex'), csrf = randomBytes(24).toString('hex');
        for (const [key, session] of sessions) if (session.expires <= now()) sessions.delete(key);
        if (sessions.size >= 1000) throw new ApiError(503, 'Session capacity exceeded.');
        sessions.set(hash(token), { role: 'admin', csrf, expires: now() + 1800000 });
        return reply(response, 200, { role: 'admin', csrf }, { 'Set-Cookie': `dt_session=${token}; HttpOnly; SameSite=Strict; Path=/api; Max-Age=1800${config.secureCookies !== false ? '; Secure' : ''}` });
      }
      if (request.method === 'POST' && route === '/api/admin/logout') { const session = admin(request, true); for (const [key, item] of sessions) if (item === session) sessions.delete(key); return reply(response, 200, { loggedOut: true }, { 'Set-Cookie': 'dt_session=; HttpOnly; SameSite=Strict; Path=/api; Max-Age=0; Secure' }); }
      if (route.startsWith('/api/admin/')) {
        admin(request, request.method !== 'GET');
        const collection = route.slice('/api/admin/'.length);
        if (!['products', 'articles', 'realizations', 'orders', 'inquiries'].includes(collection)) throw new ApiError(404, 'Not found.');
        if (request.method === 'GET') { const data = await store.read(); return reply(response, 200, { items: collection === 'products' ? approvedProducts(data.products) : data[collection] }); }
        if (request.method === 'PUT' && ['products', 'articles', 'realizations'].includes(collection)) {
          const body = await json(request), items = collection === 'products' ? approvedProducts(body.items) : body.items;
          if (!Array.isArray(items) || items.length > 1000 || JSON.stringify(items).length > 2_000_000) throw new ApiError(400, 'Invalid content.');
          await store.mutate(data => { data[collection] = items; }); return reply(response, 200, { saved: true, count: items.length });
        }
        throw new ApiError(405, 'Method not allowed.');
      }
      if (request.method === 'POST' && route === '/api/inquiries') {
        if (!config.acceptInquiries) throw new ApiError(503, 'Inquiry delivery is not configured.');
        limited(request, 'inquiry', 5); const body = await json(request), inquiry = validateInquiry(body);
        const result = await idempotent(request, body, data => { const id = randomUUID(); data.inquiries.push({ id, createdAt: new Date().toISOString(), status: 'new', ...inquiry }); return { id, status: 'received' }; }); return reply(response, 201, result);
      }
      if (request.method === 'POST' && route === '/api/orders') {
        if (!commerceEnabled) throw new ApiError(503, 'Real orders are disabled.');
        limited(request, 'order', 5); const body = await json(request);
        const result = await idempotent(request, body, data => { data.products = approvedProducts(data.products); const order = calculateOrder(body, data.products); for (const item of order.items) { const variant = data.products.find(product => product.id === item.productId).variants.find(variant => variant.id === item.variantId); variant.stock.availableQuantity -= item.quantity; } data.orders.push(order); return { id: order.id, status: order.status, paymentStatus: order.paymentStatus }; }); return reply(response, 201, result);
      }
      throw new ApiError(404, 'Not found.');
    } catch (error) { reply(response, error instanceof ApiError ? error.status : 500, { error: error instanceof ApiError ? error.message : 'Internal server error.' }); }
  });
  server.requestTimeout = 30000; server.headersTimeout = 10000; server.maxHeadersCount = 50;
  return { server, store, ready };
}
