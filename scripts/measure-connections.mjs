import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
const root = path.resolve(process.argv[2] || '.');
const read = file => fs.readFileSync(path.join(root, file));
const hash = file => createHash('sha256').update(read(file)).digest('hex');
const release = JSON.parse(read('dist/internal/release-meta.json'));
const index = JSON.parse(read('dist/internal/connections-index.json'));
const metadata = JSON.parse(read('dist/internal/client-build.json'));
const entry = source => Object.keys(metadata.outputs).find(file => metadata.outputs[file].entryPoint === source);
function closure(file, result = new Set()) {
  if (!file || result.has(file)) return result;
  result.add(file);
  for (const dependency of metadata.outputs[file].imports) if (dependency.kind !== 'dynamic-import' && metadata.outputs[dependency.path]) closure(dependency.path, result);
  return result;
}
const navigation = closure(entry('src/client/navigation.tsx'));
const graph = [...closure(entry('src/client/connections.tsx'))].filter(file => !navigation.has(file));
const assets = graph.map(file => ({ path: file, bytes: read(file).length, gzip_bytes: gzipSync(read(file)).length, sha256: hash(file) }));
const graphInNavigation = [...navigation].flatMap(file => Object.keys(metadata.outputs[file].inputs)).filter(file => /(?:connections|connection-canvas|cytoscape|react-resizable-panels)/u.test(file));
const { default: worker } = await import(pathToFileURL(path.join(root, 'dist/server/index.js')));
let reads = [];
const env = { ASSETS: { async fetch(request) {
  const pathname = new URL(request.url).pathname; reads.push(pathname);
  const filename = path.resolve(root, 'dist/client', '.' + pathname);
  if (!filename.startsWith(path.resolve(root, 'dist/client') + path.sep)) return new Response(null, { status: 404 });
  try { return new Response(fs.readFileSync(filename)); } catch { return new Response(null, { status: 404 }); }
} } };
const measurements = [];
for (const route of ['/records/wf-r2r-bank-reconciliations', ...Array(3).fill('/api/v1/connections?focus=src_roadmap_naics2022_manual'), '/api/v1/connections?focus=src_roadmap_naics2022_manual&budget=80', '/connections?focus=guide-xero-ledger-completeness&mode=graph']) {
  reads = []; const before = process.memoryUsage(), started = performance.now();
  const response = await worker.fetch(new Request('https://measurement.invalid' + route), env);
  const body = Buffer.from(await response.arrayBuffer());
  const result = response.headers.get('Content-Type')?.includes('application/json') ? JSON.parse(body) : null;
  measurements.push({ route, status: response.status, elapsed_ms: performance.now() - started, response_bytes: body.length, response_gzip_bytes: gzipSync(body).length, asset_reads: reads, counts: result?.counts, before, after: process.memoryUsage() });
}
console.log(JSON.stringify({ note: 'Local built-worker measurements with filesystem ASSETS. Includes index read/decompression/hash and response serialization; excludes network, hosted storage latency and browser rendering. Fresh process; first graph request cold, next two cached. Preview is not publication evidence.', node: process.version, platform: process.platform, arch: process.arch, release, index_version: index.index_version, lockfile_sha256: hash('package-lock.json'), server_sha256: hash('dist/server/index.js'), navigation_gzip_bytes: [...navigation].reduce((sum, file) => sum + gzipSync(read(file)).length, 0), graph_assets: assets, graph_incremental_gzip_bytes: assets.reduce((sum, item) => sum + item.gzip_bytes, 0), graph_modules_in_navigation: graphInNavigation, measurements }, null, 2));
