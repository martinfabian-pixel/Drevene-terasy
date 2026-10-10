import { randomBytes, scryptSync } from 'node:crypto';
import { readFileSync } from 'node:fs';
// Read a password from stdin, never from a command-line argument or source code.
const password = readFileSync(0, 'utf8').trim();
if (password.length < 14 || password.length > 200) throw new Error('Use a unique password with at least 14 characters.');
const salt = randomBytes(24).toString('hex');
process.stdout.write(`${salt}:${scryptSync(password, salt, 64).toString('hex')}\n`);
