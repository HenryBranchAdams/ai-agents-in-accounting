import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createPrivateMcp, callCorpus, corpusOrigin } from '../scripts/private-mcp/server.mjs';

const contract = JSON.parse(fs.readFileSync(new URL('../scripts/private-mcp/upstream-contract.json', import.meta.url)));
function fixture(schema) {
  if (Object.hasOwn(schema, 'const')) return schema.const;
  if (schema.enum) return schema.enum[0];
  if (schema.anyOf) return fixture(schema.anyOf[0]);
  if (schema.type === 'null') return null;
  if (schema.type === 'array') return [];
  if (schema.type === 'object') return Object.fromEntries((schema.required || []).map(key => [key, fixture(schema.properties[key])]));
  if (schema.type === 'boolean') return false;
  if (schema.type === 'integer' || schema.type === 'number') return schema.minimum ?? 0;
  return 'synthetic-test-value';
}
const env = { OWNER_EMAIL: 'owner@example.test' };
const identity = { 'oai-authenticated-user-id': 'synthetic-owner', 'oai-authenticated-user-email': env.OWNER_EMAIL };
const request = (method, params = {}, headers = {}) => new Request('https://private.test/mcp', {
  method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', ...headers },
  body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
});
async function rpc(response) {
  assert.equal(response.status, 200, await response.clone().text());
  const text = await response.text();
  return response.headers.get('Content-Type').includes('text/event-stream') ? JSON.parse(text.split('\n').find(line => line.startsWith('data:')).slice(5)) : JSON.parse(text);
}

test('stateless SDK initialization and discovery expose schemas without reading the corpus', async () => {
  let calls = 0;
  const worker = createPrivateMcp({ fetcher: () => { calls++; throw Error('Discovery must not fetch data'); } });
  const init = await rpc(await worker.fetch(request('initialize', { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'test', version: '1' } }), env));
  assert.equal(init.result.serverInfo.name, 'accounting-agents-private');
  const discovery = await rpc(await worker.fetch(request('tools/list'), env));
  assert.deepEqual(discovery.result.tools.map(tool => tool.name), ['corpus_describe', 'corpus_search', 'corpus_get', 'corpus_context']);
  for (const tool of discovery.result.tools) {
    assert.equal(tool.annotations.readOnlyHint, true);
    assert.equal(tool.annotations.destructiveHint, false);
    assert.deepEqual(tool.inputSchema, contract.$defs[tool.name.slice(7) + 'Input']);
  }
  assert.equal(calls, 0);
});

test('data calls require trusted owner identity even when service access could reach the Site', async () => {
  let calls = 0;
  const worker = createPrivateMcp({ fetcher: () => { calls++; throw Error('Denied request forwarded'); } });
  for (const op of ['describe', 'search', 'get', 'context']) {
    const params = { name: `corpus_${op}`, arguments: {} };
    assert.equal((await worker.fetch(request('tools/call', params), env)).status, 401);
    assert.equal((await worker.fetch(request('tools/call', params, { 'OAI-Sites-Authorization': 'synthetic-service-access' }), env)).status, 401);
    assert.equal((await worker.fetch(request('tools/call', params, { ...identity, 'oai-authenticated-user-email': 'other@example.test' }), env)).status, 403);
    assert.equal((await worker.fetch(request('tools/call', params, identity), {})).status, 403);
  }
  assert.equal(calls, 0);
});

test('all tools forward only fixed-origin GETs and preserve successful responses', async () => {
  const seen = [];
  const worker = createPrivateMcp({ fetcher: async (url, options) => {
    seen.push({ url, options });
    return Response.json(fixture(contract.$defs[url.pathname.split('/').at(-1) + 'Output']));
  } });
  for (const [op, args] of [['describe', {}], ['search', { q: 'synthetic', limit: 1 }], ['get', { id: 'synthetic-record' }], ['context', { ids: ['synthetic-first', 'synthetic-second'] }]]) {
    const response = await rpc(await worker.fetch(request('tools/call', { name: `corpus_${op}`, arguments: args }, identity), env));
    assert.ok(!response.result.isError, JSON.stringify(response));
    assert.deepEqual(response.result.structuredContent, fixture(contract.$defs[op + 'Output']));
    assert.deepEqual(JSON.parse(response.result.content[0].text), response.result.structuredContent);
    const { url, options } = seen.at(-1);
    assert.equal(url.origin, corpusOrigin);
    assert.equal(url.pathname, `/api/v1/agent/${op}`);
    assert.equal(options.method, 'GET');
    assert.equal(options.redirect, 'error');
    assert.deepEqual(options.headers, { Accept: 'application/json' });
    if (op === 'context') assert.deepEqual(url.searchParams.getAll('ids'), args.ids);
  }
});

test('invalid input and unsupported corpus contract fail without silently changing versions', async () => {
  let calls = 0;
  const worker = createPrivateMcp({ fetcher: async () => { calls++; return Response.json({ ...fixture(contract.$defs.searchOutput), agent_schema_version: '1.4.1' }); } });
  for (const args of [{ q: 'test', random: true }, { q: 'test', as_of: '2025-02-30' }]) {
    const response = await rpc(await worker.fetch(request('tools/call', { name: 'corpus_search', arguments: args }, identity), env));
    assert.equal(response.result.isError, true);
  }
  assert.equal(calls, 0);
  const changed = await rpc(await worker.fetch(request('tools/call', { name: 'corpus_search', arguments: { q: 'test' } }, identity), env));
  assert.equal(changed.result.isError, true);
  assert.equal(calls, 1);
});

test('remote response errors, size limits, redirects and version pins remain explicit', async () => {
  for (const [fetcher, code] of [
    [async () => { throw Error('redirect or timeout'); }, 'NETWORK_ERROR'],
    [async () => new Response('<html>error</html>'), 'INVALID_RESPONSE'],
    [async () => new Response('{', { headers: { 'Content-Type': 'application/json' } }), 'INVALID_RESPONSE'],
    [async () => Response.json({ error: { code: 'VERSION_MISMATCH', message: 'old edition' } }, { status: 409 }), 'VERSION_MISMATCH'],
    [async () => Response.json({ corpus_version: 'other' }), 'VERSION_MISMATCH'],
    [async () => new Response('x'.repeat(2_000_001), { headers: { 'Content-Type': 'application/json' } }), 'BODY_TOO_LARGE'],
  ]) await assert.rejects(callCorpus('search', { corpus_version: 'pinned' }, fetcher), failure => failure.code === code);
  await assert.rejects(callCorpus('write', {}, () => { throw Error('Unexpected fetch'); }), failure => failure.code === 'UNKNOWN_OPERATION');
});

test('single stateless POST surface rejects unsupported routes and oversized or malformed requests', async () => {
  const worker = createPrivateMcp();
  assert.equal((await worker.fetch(new Request('https://private.test/mcp'))).status, 405);
  assert.equal((await worker.fetch(new Request('https://private.test/unknown'))).status, 404);
  for (const [body, status] of [['{', 400], ['[]', 400], ['x'.repeat(65537), 413]])
    assert.equal((await worker.fetch(new Request('https://private.test/mcp', { method: 'POST', body }))).status, status);
});
