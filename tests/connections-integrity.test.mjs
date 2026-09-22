import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { gunzipSync, gzipSync } from 'node:zlib';
import { build } from 'esbuild';
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'aa-graph-integrity-'));
const metadata = JSON.parse(fs.readFileSync('dist/internal/connections-index.json'));
await build({ entryPoints: ['src/connections/service.ts'], outfile: path.join(directory, 'service.mjs'), bundle: true, format: 'esm', define: { CONNECTION_INDEX: JSON.stringify(metadata) } });
const { loadConnectionIndex } = await import(pathToFileURL(path.join(directory, 'service.mjs')));
process.on('exit', () => fs.rmSync(directory, { recursive: true, force: true }));

test('index loading rejects absence, decompression errors, stale bytes and same-size corruption before retaining immutable data', async () => {
  const request = new Request('https://corpus.example/connections');
  await assert.rejects(loadConnectionIndex(request), /temporarily unavailable/);
  const valid = fs.readFileSync('dist/client' + metadata.path);
  for (const response of [() => new Response(null, { status: 404 }), () => new Response('not gzip'), () => new Response(gzipSync('{}'))]) {
    await assert.rejects(loadConnectionIndex(request, { fetch: async () => response() }), /temporarily unavailable/);
  }
  await assert.rejects(loadConnectionIndex(request, { fetch: async () => new Response(gzipSync(Buffer.alloc(metadata.bytes + 65536))) }), /temporarily unavailable/);
  const corrupted = gunzipSync(valid); corrupted[30] = corrupted[30] === 32 ? 33 : 32;
  await assert.rejects(loadConnectionIndex(request, { fetch: async () => new Response(gzipSync(corrupted)) }), /temporarily unavailable/);
  let calls = 0;
  const index = await loadConnectionIndex(request, { fetch: async r => { calls++; assert.equal(new URL(r.url).pathname, metadata.path); return new Response(valid); } });
  assert.ok(index.node('wf-r2r-bank-reconciliations'));
  assert.equal(await loadConnectionIndex(new Request('https://another.example/connections'), { fetch() { throw new Error('must not retain or reuse request environment'); } }), index);
  assert.equal(calls, 1);
});
