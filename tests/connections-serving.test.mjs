import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
import os from 'node:os';
import path from 'node:path';
import worker, { ASSETS } from './worker-fixture.mjs';
const origin = 'https://corpus.example';
const get = (path, options) => worker.fetch(new Request(origin + path, options));
const metadata = JSON.parse(fs.readFileSync('dist/internal/connections-index.json'));

test('ordinary reading and unfocused connection search do not fetch the generated graph index', async () => {
  const requested = [];
  const env = { ASSETS: { fetch(request) { requested.push(new URL(request.url).pathname); return ASSETS.fetch(request); } } };
  const record = await worker.fetch(new Request(origin + '/records/wf-r2r-bank-reconciliations'), env);
  assert.equal(record.status, 200); assert.ok((await record.text()).includes('Explore connections'));
  const page = await worker.fetch(new Request(origin + '/connections?q=bank+reconciliation'), env);
  assert.equal(page.status, 200); assert.ok((await page.text()).includes('wf-r2r-bank-reconciliations'));
  assert.ok(!requested.some(path => path.includes('/assets/connections/')));
  assert.equal((await get('/connections?q=')).status, 200);
});

test('generated index identity matches its bytes and bounded API/List facts agree on the integrated corpus', async () => {
  const bytes = gunzipSync(fs.readFileSync('dist/client' + metadata.path));
  assert.equal(bytes.length, metadata.bytes); assert.equal(createHash('sha256').update(bytes).digest('hex'), metadata.sha256);
  const snapshot = JSON.parse(bytes); assert.equal(snapshot.index_version, metadata.index_version);
  for (const focus of ['wf-r2r-bank-reconciliations', 'guide-construction-connected-close', 'guide-accounting-claim-counterexamples', 'collection-family-office-reference', 'src_roadmap_naics2022_manual']) {
    const params = new URLSearchParams({ focus });
    const response = await get('/api/v1/connections?' + params); assert.equal(response.status, 200, focus);
    const body = await response.text(), view = JSON.parse(body);
    assert.equal(view.corpus_version, '2026-09-22.2'); assert.equal(view.index_version, metadata.index_version);
    assert.ok(Buffer.byteLength(body) <= 150 * 1024, `${focus}: default payload budget`);
    assert.ok(view.nodes.length <= 25); assert.ok(view.edges.length <= 160);
    const page = (await (await get('/connections?' + params)).text()).replaceAll('<!-- -->', '');
    assert.ok(page.includes(`${view.counts.visible_records} visible records of ${view.counts.matching_records} matching records`));
    for (const node of view.nodes) assert.ok(page.includes(node.id));
    for (const edge of view.edges) { assert.ok(view.nodes.some(node => node.id === edge.from)); assert.ok(view.nodes.some(node => node.id === edge.to)); }
    console.log(JSON.stringify({ focus, response_bytes: Buffer.byteLength(body), visible_records: view.nodes.length, visible_edges: view.edges.length }));
    const head = await get('/api/v1/connections?' + params, { method: 'HEAD' }); assert.equal(await head.text(), ''); assert.equal(head.headers.get('ETag'), response.headers.get('ETag'));
    assert.equal((await get('/api/v1/connections?' + params, { headers: { 'If-None-Match': response.headers.get('ETag') } })).status, 304);
  }
});

test('connection routing rejects malformed state and stale identities and offers direct provenance inspection', async () => {
  for (const query of ['focus=a&focus=b', 'focus=a&budget=999', 'focus=a&types=inferred', 'focus=a&unknown=1']) assert.equal((await get('/connections?' + query)).status, 400, query);
  const unknown = await get('/connections?focus=unknown'); assert.equal(unknown.status, 404); assert.ok((await unknown.text()).includes('Find a current record'));
  const stalePage = await get('/connections?focus=wf-r2r-bank-reconciliations&index=stale'); assert.equal(stalePage.status, 409); const staleHTML = await stalePage.text(); assert.ok(staleHTML.includes('Reload against the current corpus edition')); assert.ok(staleHTML.includes('focus=wf-r2r-bank-reconciliations&amp;mode=graph'));
  const stale = await get('/api/v1/connections?focus=wf-r2r-bank-reconciliations&index=stale'); assert.equal(stale.status, 409); assert.equal(stale.headers.get('Cache-Control'), 'no-store');
  const filtered = await (await get('/api/v1/connections?focus=guide-accounting-claim-counterexamples&types=cites')).json();
  assert.ok(filtered.hidden_material.length >= 5);
  const edge = filtered.hidden_material[0]; const page = await get('/connections/edge?' + new URLSearchParams({ id: edge.id }));
  assert.equal(page.status, 200);
  const evidence = await get('/api/v1/connections/edge?' + new URLSearchParams({ id: edge.id, index: metadata.index_version }));
  assert.equal(evidence.status, 200); assert.ok((await evidence.json()).edge.assertions.length);
  assert.equal((await get('/api/v1/connections/edge?' + new URLSearchParams({ id: edge.id, index: 'stale' }))).status, 409);
  const html = await page.text(); assert.ok(html.includes('Corpus JSON pointer')); assert.ok(html.includes('guide-accounting-claim-counterexamples'));
  assert.equal((await get('/connections/edge?id=missing')).status, 404);
  assert.equal((await get('/connections/edge?id=x&id=y')).status, 400);
  assert.equal((await get('/api/v1/connections?focus=a', { method: 'POST' })).status, 405);
  assert.equal((await get(metadata.path)).status, 404, 'internal graph snapshot is not a browser API');
});

test('every current default neighborhood fits the overview payload budget without discarding exact evidence', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'aa-graph-budget-'));
  try {
    await build({ entryPoints: ['src/connections/select.ts', 'src/connections/state.ts', 'src/connections/view.ts'], outdir: directory, bundle: true, format: 'esm', outExtension: { '.js': '.mjs' } });
    const { createConnectionIndex } = await import(pathToFileURL(path.join(directory, 'select.mjs')));
    const { parseConnectionState } = await import(pathToFileURL(path.join(directory, 'state.mjs')));
    const { connectionViewDTO } = await import(pathToFileURL(path.join(directory, 'view.mjs')));
    const snapshot = JSON.parse(gunzipSync(fs.readFileSync('dist/client' + metadata.path)));
    const index = createConnectionIndex(snapshot), kinds = [...new Set(snapshot.nodes.map(node => node.kind))];
    let maximum = { bytes: 0, id: '' };
    for (const node of snapshot.nodes) {
      const view = index.select(parseConnectionState(new URLSearchParams({ focus: node.id }), kinds));
      const dto = connectionViewDTO(view), bytes = Buffer.byteLength(JSON.stringify(dto, null, 2) + '\n');
      if (bytes > maximum.bytes) maximum = { bytes, id: node.id };
      assert.ok(bytes <= 150 * 1024, `${node.id}: ${bytes} exceeds 150KiB`);
      assert.equal(dto.edges.reduce((sum, edge) => sum + edge.assertion_count, 0), view.counts.assertions);
      for (const edge of dto.edges) assert.equal(index.edge(edge.id).assertions.length, edge.assertion_count);
    }
    console.log(JSON.stringify({ corpus_version: metadata.corpus_version, index_version: metadata.index_version, default_neighborhoods: snapshot.nodes.length, largest_overview: maximum }));
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});
