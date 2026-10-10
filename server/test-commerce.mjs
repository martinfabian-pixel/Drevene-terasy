import { build } from 'vite';
const result = await build({ configFile: false, logLevel: 'error', build: { write: false, minify: false, lib: { entry: 'src/commerce/tests.ts', formats: ['es'], fileName: 'commerce-tests' } } });
const compiled = (Array.isArray(result) ? result[0] : result).output.find(output => output.type === 'chunk');
const { runCommerceTests } = await import(`data:text/javascript;base64,${Buffer.from(compiled.code).toString('base64')}`);
process.stdout.write(`Commerce tests: ${JSON.stringify(runCommerceTests())}\n`);
