import { resolve } from 'node:path';
import { createApi } from './app.mjs';
const encryptionKey = Buffer.from(process.env.DATA_ENCRYPTION_KEY || '', 'hex');
const config = {
  dataPath: resolve(process.env.DATA_PATH || './private-data/store.enc.json'), encryptionKey,
  adminUser: process.env.ADMIN_USER, passwordHash: process.env.ADMIN_PASSWORD_SCRYPT,
  allowedOrigins: (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean),
  commerceApproved: process.env.COMMERCE_OWNER_APPROVED === 'yes', commerceLive: process.env.COMMERCE_LIVE === 'yes',
  acceptInquiries: process.env.ACCEPT_INQUIRIES === 'yes', secureCookies: process.env.NODE_ENV === 'production',
};
const host = process.env.API_HOST || '127.0.0.1';
if (process.env.NODE_ENV !== 'production' && !['127.0.0.1', 'localhost', '::1'].includes(host)) throw new Error('Development API must bind to loopback.');
const { server, ready } = createApi(config);
await ready;
server.listen(Number(process.env.API_PORT || 8787), host, () => process.stdout.write('Drevené terasy API ready with the approved PDF catalog. Real commerce stays disabled pending tax, stock and backend review.\n'));
