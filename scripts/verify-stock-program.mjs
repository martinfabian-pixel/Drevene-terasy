import { build } from 'vite';
const result = await build({ configFile: false, logLevel: 'error', build: { write: false, minify: false, lib: { entry: 'src/commerce/stock-tests.ts', formats: ['es'], fileName: 'stock-tests' } } });
const compiled = (Array.isArray(result) ? result[0] : result).output.find(output => output.type === 'chunk');
const { runStockTests } = await import(`data:text/javascript;base64,${Buffer.from(compiled.code).toString('base64')}`);
console.log(`Stock program audit: ${JSON.stringify(runStockTests())}`);
