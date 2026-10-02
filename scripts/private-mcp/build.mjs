import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
const destination = path.resolve(process.argv[2] || path.join(root, 'dist'));
const result = await build({
  entryPoints: [path.join(root, 'server.mjs')], outfile: path.join(destination, 'server/index.js'),
  bundle: true, format: 'esm', platform: 'neutral', target: 'es2023', minify: true,
  mainFields: ['module', 'main'], conditions: ['workerd', 'browser'], legalComments: 'eof', metafile: true,
});
const inputs = Object.keys(result.metafile.inputs);
if (inputs.some(file => /(?:data\/corpus|dist\/internal\/agent|agent-client\.mjs)/.test(file))) throw Error('Private adapter must not bundle corpus data or the local client fallback.');
fs.mkdirSync(destination, { recursive: true });
fs.writeFileSync(path.join(destination, 'bundle-inputs.json'), JSON.stringify(inputs, null, 2) + '\n');
console.log(JSON.stringify({ output: path.join(destination, 'server/index.js'), inputs: inputs.length, corpus_bundled: false }));
