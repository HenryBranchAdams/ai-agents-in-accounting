import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { build } from 'esbuild';
import { privateNotices } from './notices.mjs';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const read = file => JSON.parse(fs.readFileSync(file));
const assert = (condition, message) => { if (!condition) throw Error(message); };

// The caller authenticates the CI artifact before invoking this derivative build.
// No Git/source build, network, credentials or canonical writes occur here.
export async function buildCurrent({ artifact, destination, sourceRevision }) {
  assert(/^[a-f0-9]{40}$/.test(sourceRevision), 'An exact source SHA is required.');
  artifact = path.resolve(artifact); destination = path.resolve(destination);
  assert(destination !== artifact && !destination.startsWith(artifact + path.sep), 'Derivative output must be separate from the consumed artifact.');
  assert(!fs.existsSync(destination), 'Use a fresh private output directory.');
  const packageManifest = read(path.join(artifact, 'release-package.json'));
  assert(packageManifest.contract === 'accounting-agents-ci-release' && packageManifest.source_revision === sourceRevision, 'Qualified artifact source pin differs.');
  const promised = new Map(packageManifest.files.map(file => [file.path, file]));
  assert(promised.size === packageManifest.files.length, 'Duplicate package member.');
  function packageBytes(relative) {
    const expected = promised.get(relative);
    assert(expected && !path.isAbsolute(relative) && !relative.split('/').some(part => !part || part === '.' || part === '..'), 'Unpromised package member.');
    const file = path.join(artifact, relative);
    assert(fs.lstatSync(file).isFile() && !fs.lstatSync(file).isSymbolicLink(), 'Nonregular package member.');
    const bytes = fs.readFileSync(file);
    assert(bytes.length === expected.bytes && hash(bytes) === expected.sha256, 'Package member hash differs.');
    return bytes;
  }
  const qualification = JSON.parse(packageBytes('evidence/qualification.json'));
  const release = JSON.parse(packageBytes('evidence/release-meta.json'));
  assert(qualification.source_revision === sourceRevision && release.source_revision === sourceRevision && release.build_mode === 'release', 'Qualified artifact source pin differs.');
  assert(qualification.corpus_version === release.corpus_version && packageManifest.corpus_version === release.corpus_version && Number.isInteger(qualification.record_count), 'Qualified artifact edition differs.');
  const storageBytes = packageBytes('storage/manifest.json');
  assert(hash(storageBytes) === qualification.storage_manifest && release.storage_manifest === qualification.storage_manifest, 'Storage manifest hash differs.');
  const storage = JSON.parse(storageBytes);
  function logicalBytes(route, limit) {
    const entry = storage.files[route];
    assert(entry && Number.isSafeInteger(entry.bytes) && entry.bytes > 0 && entry.bytes <= limit, 'Logical input missing or oversized.');
    const chunks = entry.chunks.map(key => {
      assert(/^[a-f0-9]{64}$/.test(key), 'Invalid object key.');
      const compressed = packageBytes(`storage/objects/${key}`);
      assert(hash(compressed) === key && compressed.length === storage.objects[key], 'Storage object hash differs.');
      return gunzipSync(compressed, { maxOutputLength: 4 * 1024 * 1024 });
    });
    const bytes = Buffer.concat(chunks);
    assert(bytes.length === entry.bytes && hash(bytes) === entry.sha256, 'Logical input hash differs.');
    return bytes;
  }
  const contract = JSON.parse(logicalBytes('/downloads/agent.schema.json', 2_000_000));
  assert(contract.agent_schema_version === '1.4.1', 'Retrieval contract must be 1.4.1.');
  const assets = {}, inventory = {};
  let sourceCount = 0;
  for (const [route, entry] of Object.entries(storage.files).sort(([a], [b]) => a.localeCompare(b))) {
    if (!route.startsWith('/_runtime/data/')) continue;
    const match = route.match(/^\/_runtime\/data\/([a-f0-9]{64})\.gz$/);
    assert(match, 'Unexpected private runtime path.');
    const bytes = logicalBytes(route, 16 * 1024 * 1024);
    const expanded = gunzipSync(bytes, { maxOutputLength: 128 * 1024 * 1024 });
    assert(hash(expanded) === match[1], 'Runtime data key differs.');
    const value = JSON.parse(expanded);
    if (Array.isArray(value) && value.length && value.every(row => row.kind === 'source')) sourceCount += value.length;
    assets[match[1]] = bytes.toString('base64');
    inventory[match[1]] = { bytes: bytes.length, sha256: hash(bytes), expanded_bytes: expanded.length };
  }
  assert(sourceCount > 0 && Object.keys(assets).length > 0, 'Private runtime source data is missing.');
  const serverFiles = [...promised.keys()].filter(file => /^application\/dist\/server\/[^/]+\.js$/.test(file));
  for (const file of serverFiles) packageBytes(file);
  // esbuild parses exports and imports without executing artifact JavaScript.
  const parsed = await build({ entryPoints: serverFiles.map(file => path.join(artifact, file)), bundle: false, format: 'esm',
    outdir: path.join(destination, 'probe'), write: false, metafile: true });
  const factoryOutputs = Object.entries(parsed.metafile.outputs).filter(([, meta]) => meta.exports?.includes('createApplication'));
  assert(factoryOutputs.length === 1, 'Expected one qualified application factory.');
  const factoryName = path.basename(factoryOutputs[0][0]);
  const factoryRelative = `application/dist/server/${factoryName}`;
  const factory = path.join(artifact, factoryRelative);
  const factoryBytes = packageBytes(factoryRelative);
  const pin = { corpus_version: release.corpus_version, source_revision: sourceRevision,
    agent_schema_version: contract.agent_schema_version, record_count: qualification.record_count, source_count: sourceCount,
    factory_sha256: hash(factoryBytes), assets_sha256: hash(JSON.stringify(inventory)), assets: inventory };
  const root = path.dirname(fileURLToPath(import.meta.url));
  const notices = privateNotices(path.resolve(root, '../..'), packageManifest.lockfile_sha256);
  const result = await build({
    stdin: { contents: `import { createCurrentPrivateMcp } from ${JSON.stringify(path.join(root, 'current-server.mjs'))};\nexport default createCurrentPrivateMcp({ pin: ${JSON.stringify(pin)}, contract: ${JSON.stringify(contract)}, loadBundle: () => import('sealed-current-bundle') });`, resolveDir: root },
    plugins: [{ name: 'sealed-current-bundle', setup(builder) {
      builder.onResolve({ filter: /.*/ }, args => {
        if (!args.importer.startsWith(artifact + path.sep)) return;
        assert(/^\.\/[^/]+\.js$/.test(args.path), 'Qualified module imports must name packaged sibling modules.');
        const resolved = path.resolve(path.dirname(args.importer), args.path);
        assert(serverFiles.includes(path.relative(artifact, resolved)), 'Qualified module dependency is not packaged.');
        return { path: resolved };
      });
      builder.onResolve({ filter: /^sealed-current-bundle$/ }, () => ({ path: 'sealed-current-bundle', namespace: 'private-edition' }));
      builder.onLoad({ filter: /.*/, namespace: 'private-edition' }, () => ({ contents: `export { createApplication } from ${JSON.stringify(factory)}; export const assets = ${JSON.stringify(assets)};`, resolveDir: root }));
    } }],
    outdir: path.join(destination, 'server'), entryNames: 'index', chunkNames: 'private-[hash]', splitting: true,
    bundle: true, format: 'esm', platform: 'neutral', target: 'es2023', minify: true,
    mainFields: ['module', 'main'], conditions: ['workerd', 'browser'], legalComments: 'eof', metafile: true, write: false,
  });
  assert(Object.keys(result.metafile.inputs).every(file => !/(?:data\/corpus|dist\/internal\/agent|agent-client\.mjs)/.test(file)), 'Derivative imported canonical source or local fallback.');
  assert(Object.values(result.metafile.outputs).every(output => output.imports.every(item => !item.external)), 'Derivative has an external module dependency.');
  const noticeText = Object.entries(notices).map(([file, body]) => `${file}\n\n${body}`).join('\n\n');
  assert(!noticeText.includes('*/'), 'Permission text contains a JavaScript comment terminator.');
  const legalComment = Buffer.from(`\n/*! Private derivative licenses and attribution\n\n${noticeText}\n*/\n`);
  const outputFiles = result.outputFiles.map(output => ({ path: output.path,
    contents: path.relative(destination, output.path) === 'server/index.js' ? Buffer.concat([output.contents, legalComment]) : output.contents }));
  assert(outputFiles.some(output => path.relative(destination, output.path) === 'server/index.js'), 'Private entry module missing.');
  const workerBytes = outputFiles.reduce((total, output) => total + output.contents.length, 0);
  assert(workerBytes < 64 * 1024 * 1024, 'Private Worker exceeds 64 MiB.');
  for (const output of outputFiles) { fs.mkdirSync(path.dirname(output.path), { recursive: true }); fs.writeFileSync(output.path, output.contents); }
  for (const [file, body] of Object.entries(notices)) fs.writeFileSync(path.join(destination, file), body);
  const report = { ...pin, worker_bytes: workerBytes, compressed_data_bytes: Object.values(inventory).reduce((sum, asset) => sum + asset.bytes, 0),
    modules: Object.keys(result.metafile.outputs).map(file => ({ file: path.relative(destination, file), sha256: hash(fs.readFileSync(file)) })),
    notices: Object.entries(notices).map(([file, body]) => ({ file, sha256: hash(body) })),
    embedded_notices_sha256: hash(legalComment), embedded_notices_bytes: legalComment.length,
    limitations: 'Private deployment derivative only; artifact provenance must be authenticated by the integration owner. Canonical public URLs may serve an older edition.' };
  fs.writeFileSync(path.join(destination, 'private-qualification.json'), JSON.stringify(report, null, 2) + '\n');
  return report;
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const [artifact, destination, sourceRevision, ...extra] = process.argv.slice(2);
  assert(artifact && destination && sourceRevision && !extra.length, 'Usage: build-current.mjs <qualified-ci-package> <private-output> <exact-source-sha>');
  console.log(JSON.stringify(await buildCurrent({ artifact, destination, sourceRevision })));
}
