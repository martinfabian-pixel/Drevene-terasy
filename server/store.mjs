import { mkdir, readFile, open, rename } from 'node:fs/promises';
import { dirname } from 'node:path';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
export function createStore(path, encryptionKey) {
  if (!Buffer.isBuffer(encryptionKey) || encryptionKey.length !== 32) throw new Error('DATA_ENCRYPTION_KEY must contain 32 bytes.');
  let queue = Promise.resolve();
  const empty = () => ({ version: 1, products: [], articles: [], realizations: [], orders: [], inquiries: [], idempotency: [] });
  async function read() {
    try {
      const envelope = JSON.parse(await readFile(path, 'utf8'));
      const cipher = createDecipheriv('aes-256-gcm', encryptionKey, Buffer.from(envelope.iv, 'base64')); cipher.setAuthTag(Buffer.from(envelope.tag, 'base64'));
      const result = JSON.parse(Buffer.concat([cipher.update(Buffer.from(envelope.data, 'base64')), cipher.final()]).toString('utf8'));
      if (result.version !== 1) throw new Error('Unsupported database version.'); return result;
    } catch (error) { if (error.code === 'ENOENT') return empty(); throw error; }
  }
  async function write(data) {
    await mkdir(dirname(path), { recursive: true, mode: 0o700 });
    const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', encryptionKey, iv);
    const bytes = Buffer.concat([cipher.update(JSON.stringify(data), 'utf8'), cipher.final()]);
    const envelope = JSON.stringify({ version: 1, iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), data: bytes.toString('base64') });
    const temporary = `${path}.tmp`; const file = await open(temporary, 'w', 0o600);
    try { await file.writeFile(envelope, 'utf8'); await file.sync(); } finally { await file.close(); }
    await rename(temporary, path);
  }
  function mutate(callback) {
    const operation = queue.then(async () => { const data = await read(); const result = await callback(data); await write(data); return result; });
    queue = operation.catch(() => {}); return operation;
  }
  return { read, mutate };
}
