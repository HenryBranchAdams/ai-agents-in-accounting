import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { gzipSync, gunzipSync } from 'node:zlib';
import { createCurrentPrivateMcp } from '../scripts/private-mcp/current-server.mjs';
import { createPinnedCaller } from '../scripts/private-mcp/current-runtime.mjs';
import { agentJsonSchema as contract } from '../dist/internal/agent-contract.mjs';
import { executeAgent } from '../dist/internal/agent.mjs';
import { createApplication } from '../dist/internal/runtime-application.mjs';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const env = { OWNER_EMAIL: 'owner@example.test' };
const identity = { 'oai-authenticated-user-id': 'synthetic-owner', 'oai-authenticated-user-email': env.OWNER_EMAIL };
const request = (method, params = {}, headers = {}) => new Request('https://private.test/mcp', {
  method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', ...headers },
  body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
});
const rpc = async response => {
  assert.equal(response.status, 200, await response.clone().text());
  const text = await response.text();
  return response.headers.get('Content-Type').includes('text/event-stream') ? JSON.parse(text.split('\n').find(line => line.startsWith('data:')).slice(5)) : JSON.parse(text);
};
const call = (worker, op, args = {}) => worker.fetch(request('tools/call', { name: `corpus_${op}`, arguments: args }, identity), env).then(rpc);
const basePin = { corpus_version: 'fixture-edition', source_revision: 'a'.repeat(40), record_count: 1, source_count: 1,
  agent_schema_version: '1.4.1', factory_sha256: 'b'.repeat(64), assets_sha256: 'c'.repeat(64) };
function fixture({ asset = gzipSync(JSON.stringify({ fixture: true })), expectedAsset = asset, version = basePin.corpus_version } = {}) {
  let loads = 0, creations = 0; const requests = [];
  const key = hash(gunzipSync(expectedAsset));
  const pin = { ...basePin, assets: { [key]: { bytes: expectedAsset.length, sha256: hash(expectedAsset), expanded_bytes: gunzipSync(expectedAsset).length } } };
  const loadBundle = async () => {
    loads++;
    return { assets: { [key]: asset.toString('base64') }, createApplication: data => {
      creations++; assert.deepEqual(data, { [key]: { fixture: true } });
      return { async fetch(request) {
        requests.push(request);
        return Response.json({ agent_schema_version: '1.4.1', corpus_version: version, content_trust: 'untrusted-research-data', record_count: 1 });
      } };
    } };
  };
  return { pin, loadBundle, seen: () => ({ loads, creations, requests }) };
}

test('current discovery is schema-only and owner gate precedes every data/module read', async () => {
  const f = fixture(), worker = createCurrentPrivateMcp({ ...f, contract });
  const init = await rpc(await worker.fetch(request('initialize', { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'test', version: '1' } }), env));
  assert.match(init.result.instructions, /Canonical public links may serve an older edition/);
  const discovery = await rpc(await worker.fetch(request('tools/list'), env));
  assert.deepEqual(discovery.result.tools.map(tool => tool.name), ['corpus_describe', 'corpus_search', 'corpus_get', 'corpus_context']);
  for (const tool of discovery.result.tools) assert.deepEqual(tool.inputSchema, contract.$defs[tool.name.slice(7) + 'Input']);
  assert.ok(!JSON.stringify(discovery).includes('fixture-edition'));
  for (const op of ['describe', 'search', 'get', 'context']) {
    const params = { name: `corpus_${op}`, arguments: {} };
    assert.equal((await worker.fetch(request('tools/call', params), env)).status, 401);
    assert.equal((await worker.fetch(request('tools/call', params, { 'OAI-Sites-Authorization': 'fixture-service-token' }), env)).status, 401);
    assert.equal((await worker.fetch(request('tools/call', params, { ...identity, 'oai-authenticated-user-email': 'other@example.test' }), env)).status, 403);
    assert.equal((await worker.fetch(request('tools/call', params, identity), {})).status, 403);
  }
  for (const route of ['/_runtime/data/fixture.gz', '/assets/objects/fixture', '/downloads/corpus.json', '/_release/import', '/records/fixture'])
    assert.equal((await worker.fetch(new Request('https://private.test' + route), env)).status, 404);
  assert.deepEqual(f.seen(), { loads: 0, creations: 0, requests: [] });
});

test('wrong pins and invalid calendar dates fail before loading private data', async () => {
  const f = fixture(), caller = createPinnedCaller(f);
  await assert.rejects(caller('search', { corpus_version: 'other' }), error => error.code === 'VERSION_MISMATCH');
  await assert.rejects(caller('search', { as_of: '2025-02-30' }), error => error.code === 'INVALID_ARGUMENT');
  await assert.rejects(caller('write', {}), error => error.code === 'UNKNOWN_OPERATION');
  assert.equal(f.seen().loads, 0);
  const worker = createCurrentPrivateMcp({ ...f, contract });
  const result = await call(worker, 'search', { q: 'test', corpus_version: 'other' });
  assert.equal(JSON.parse(result.result.content[0].text).error.code, 'VERSION_MISMATCH');
  assert.equal(f.seen().loads, 0);
});

test('corrupt, missing and wrong-edition sealed data fail closed without network fallback', async () => {
  const f = fixture(), corrupt = fixture({ asset: gzipSync('{}'), expectedAsset: gzipSync(JSON.stringify({ fixture: true })) });
  const missing = { pin: f.pin, loadBundle: async () => ({ assets: {}, createApplication: () => { throw Error('must not initialize'); } }) };
  for (const setup of [corrupt, missing, fixture({ version: 'other-edition' })])
    await assert.rejects(createPinnedCaller(setup)('describe', {}), error => error.code === 'PRIVATE_EDITION_UNAVAILABLE');
  assert.equal(corrupt.seen().creations, 0);
});

test('local caller invokes only four exact GET routes and retains immutable factory after verification', async () => {
  const f = fixture(), caller = createPinnedCaller(f);
  for (const [op, args] of [['describe', {}], ['search', { q: 'test' }], ['get', { id: 'fixture' }], ['context', { ids: ['first', 'second'] }]]) await caller(op, args);
  const { requests, loads, creations } = f.seen();
  assert.equal(loads, 1); assert.equal(creations, 1);
  assert.deepEqual(requests.map(request => new URL(request.url).pathname), ['/api/v1/agent/describe', '/api/v1/agent/describe', '/api/v1/agent/search', '/api/v1/agent/get', '/api/v1/agent/context']);
  assert.ok(requests.every(request => request.method === 'GET' && new URL(request.url).origin === 'https://private-corpus.invalid'));
  assert.deepEqual(new URL(requests.at(-1).url).searchParams.getAll('ids'), ['first', 'second']);
});

test('concurrent authorized cold calls share one initialization and a failed load can retry', async () => {
  const f = fixture();
  let release;
  const ready = new Promise(resolve => { release = resolve; });
  let loads = 0;
  const caller = createPinnedCaller({ pin: f.pin, loadBundle: async () => { loads++; await ready; return f.loadBundle(); } });
  const calls = Array.from({ length: 8 }, () => caller('describe', {}));
  await Promise.resolve(); assert.equal(loads, 1); release();
  await Promise.all(calls); assert.equal(f.seen().creations, 1);
  let attempts = 0;
  const retry = createPinnedCaller({ pin: f.pin, loadBundle: async () => { if (++attempts === 1) throw Error('fixture failure'); return f.loadBundle(); } });
  await assert.rejects(retry('describe', {}), error => error.code === 'PRIVATE_EDITION_UNAVAILABLE');
  await retry('describe', {}); assert.equal(attempts, 2);
});

test('expanded bounds and JSON identity fail before factory creation', async () => {
  for (const change of ['bound', 'key']) {
    const f = fixture(), key = Object.keys(f.pin.assets)[0];
    if (change === 'bound') f.pin.assets[key].expanded_bytes--;
    else {
      f.pin.assets['d'.repeat(64)] = f.pin.assets[key]; delete f.pin.assets[key];
      const load = f.loadBundle;
      f.loadBundle = async () => { const bundle = await load(); bundle.assets['d'.repeat(64)] = bundle.assets[key]; delete bundle.assets[key]; return bundle; };
    }
    await assert.rejects(createPinnedCaller(f)('describe', {}), error => error.code === 'PRIVATE_EDITION_UNAVAILABLE');
    assert.equal(f.seen().creations, 0);
  }
});

test('qualified implementation parity preserves dates, provenance, rights, omissions and canonical URLs', async () => {
  const release = JSON.parse(fs.readFileSync('dist/internal/release-meta.json'));
  const storage = JSON.parse(fs.readFileSync('dist/storage/manifest.json'));
  const assets = {}, inventory = {};
  for (const [route, entry] of Object.entries(storage.files)) {
    if (!route.startsWith('/_runtime/data/')) continue;
    const bytes = Buffer.concat(entry.chunks.map(key => gunzipSync(fs.readFileSync('dist/client/assets/objects/' + key))));
    const key = route.split('/').at(-1).slice(0, -3);
    assets[key] = bytes.toString('base64'); inventory[key] = { bytes: bytes.length, sha256: hash(bytes), expanded_bytes: gunzipSync(bytes).length };
  }
  const pin = { ...basePin, corpus_version: release.corpus_version, source_revision: release.source_revision,
    record_count: executeAgent('describe', {}).record_count, assets: inventory };
  const worker = createCurrentPrivateMcp({ pin, contract, loadBundle: async () => ({ createApplication, assets }) });
  for (const [op, args] of [
    ['describe', {}],
    ['search', { q: 'Form 706', as_of: '2025-12-31', corpus_version: pin.corpus_version, limit: 3 }],
    ['get', { id: 'src_fo_ref_irs_i706', limit: 2 }],
    ['context', { ids: ['guide-fo-reference-fo-27'], include_sources: true, max_chars: 8000 }],
  ]) {
    const response = await call(worker, op, args);
    assert.ok(!response.result.isError, JSON.stringify(response));
    assert.deepEqual(response.result.structuredContent, executeAgent(op, args));
    assert.deepEqual(JSON.parse(response.result.content[0].text), response.result.structuredContent);
    assert.equal(response.result._meta.connector_meta.source_revision, pin.source_revision);
    assert.ok(!Object.hasOwn(response.result.structuredContent, 'connector_meta'));
  }
});
