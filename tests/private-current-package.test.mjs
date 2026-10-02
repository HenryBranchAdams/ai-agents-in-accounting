import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { buildCurrent } from '../scripts/private-mcp/build-current.mjs';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const write = (root, file, value) => { const target = path.join(root, file); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value)); };
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'private-current-package-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const artifact = path.join(root, 'artifact'), destination = path.join(root, 'derivative');
  const sourceRevision = 'a'.repeat(40), corpusVersion = 'fixture-edition';
  const data = Buffer.from(JSON.stringify([{ id: 'fixture-source', kind: 'source' }]));
  const compressedData = gzipSync(data), key = hash(data);
  const storage = { files: {}, objects: {} };
  function store(route, bytes) {
    const object = gzipSync(bytes), objectKey = hash(object);
    write(artifact, `storage/objects/${objectKey}`, object);
    storage.files[route] = { bytes: bytes.length, sha256: hash(bytes), chunks: [objectKey] };
    storage.objects[objectKey] = object.length;
    return objectKey;
  }
  const objectKey = store(`/_runtime/data/${key}.gz`, compressedData);
  const schema = { agent_schema_version: '1.4.1', $defs: Object.fromEntries(['describe', 'search', 'get', 'context'].flatMap(op => [[op + 'Input', { type: 'object' }], [op + 'Output', { type: 'object' }]])) };
  store('/downloads/agent.schema.json', Buffer.from(JSON.stringify(schema)));
  const storageBody = JSON.stringify(storage);
  write(artifact, 'storage/manifest.json', storageBody);
  write(artifact, 'evidence/qualification.json', { source_revision: sourceRevision, corpus_version: corpusVersion, record_count: 1, storage_manifest: hash(storageBody) });
  write(artifact, 'evidence/release-meta.json', { source_revision: sourceRevision, corpus_version: corpusVersion, build_mode: 'release', storage_manifest: hash(storageBody) });
  const factory = 'export function createApplication(data) { return { async fetch() { return Response.json({ agent_schema_version: "1.4.1", corpus_version: "fixture-edition", record_count: 1 }); } }; }';
  write(artifact, 'application/dist/server/application-TEST.js', factory);
  const files = fs.readdirSync(artifact, { recursive: true }).filter(file => fs.statSync(path.join(artifact, file)).isFile()).map(file => {
    const bytes = fs.readFileSync(path.join(artifact, file)); return { path: file, bytes: bytes.length, sha256: hash(bytes) };
  });
  write(artifact, 'release-package.json', { contract: 'accounting-agents-ci-release', source_revision: sourceRevision, corpus_version: corpusVersion, files,
    lockfile_sha256: hash(fs.readFileSync('package-lock.json')) });
  return { artifact, destination, sourceRevision, objectKey };
}
test('private derivative packages only sealed modules with pinned inventory and bounded size', async t => {
  const setup = fixture(t), report = await buildCurrent(setup);
  assert.equal(report.source_revision, setup.sourceRevision);
  assert.equal(report.record_count, 1); assert.equal(report.source_count, 1);
  assert.ok(report.worker_bytes < 64 * 1024 * 1024);
  assert.deepEqual(fs.readdirSync(setup.destination).sort(), ['ATTRIBUTION.md', 'LICENSE', 'LICENSE-CONTENT.md', 'LICENSE-DATA.md', 'LICENSE_POLICY.md', 'NOTICE.md', 'THIRD_PARTY_NOTICES.md', 'private-qualification.json', 'server']);
  assert.match(fs.readFileSync(path.join(setup.destination, 'THIRD_PARTY_NOTICES.md'), 'utf8'), /react-remove-scroll-bar 2.3.8/);
  assert.equal(report.notices.length, 7);
  assert.ok(report.modules.every(module => module.file.startsWith('server/') && /^[a-f0-9]{64}$/.test(module.sha256)));
  assert.ok(report.compressed_data_bytes > 0);
});
test('private packaging rejects wrong source pin, corrupt assets and missing runtime objects', async t => {
  const wrong = fixture(t);
  await assert.rejects(buildCurrent({ ...wrong, sourceRevision: 'b'.repeat(40) }), /source pin differs/);
  const corrupt = fixture(t);
  fs.writeFileSync(path.join(corrupt.artifact, 'storage/objects', corrupt.objectKey), 'corrupt');
  await assert.rejects(buildCurrent(corrupt), /Package member hash differs/);
  const missing = fixture(t);
  fs.rmSync(path.join(missing.artifact, 'storage/objects', missing.objectKey));
  await assert.rejects(buildCurrent(missing), /ENOENT/);
  for (const setup of [wrong, corrupt, missing]) assert.ok(!fs.existsSync(setup.destination));
});
