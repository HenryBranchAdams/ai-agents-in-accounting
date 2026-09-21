import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { build } from 'esbuild';
const result = await build({ entryPoints: ['src/release-storage.ts'], bundle: true, write: false, format: 'esm', platform: 'neutral' });
const { storedDownload, importRelease } = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
const hash = b => createHash('sha256').update(b).digest('hex');
const chunk = gzipSync(Buffer.from('preserved evidence\n'));
const key = hash(chunk);
const manifest = { id: 'fixture', files: { '/downloads/history.json': { bytes: 19, sha256: 'logical-digest', chunks: [key, key] } } };
const req = (method='GET', headers={}) => new Request('https://example.test/downloads/history.json', {method, headers});
test('downloads stream sequentially and conditional/HEAD reads fetch no objects', async () => {
  let reads = 0;
  const env = { BUCKET: { get: async k => { assert.equal(k, `objects/${key}`); reads++; return { body: new Response(chunk).body }; } } };
  const response = await storedDownload(req(), env, manifest);
  assert.equal(await response.text(), 'preserved evidence\npreserved evidence\n');
  assert.equal(reads, 2);
  assert.equal((await storedDownload(req('HEAD'), env, manifest)).body, null);
  assert.equal((await storedDownload(req('GET', {'If-None-Match':'W/"logical-digest"'}), env, manifest)).status, 304);
  assert.equal(reads, 2);
});
test('missing storage returns unavailable without falling back to a different release', async () => {
  assert.equal((await storedDownload(req(), { BUCKET: {get:async()=>null}}, manifest)).status, 503);
});
test('import requires a secret, verifies hashes, retries safely and rejects incomplete manifests', async () => {
  const objects = new Map();
  const env = { RELEASE_IMPORT_TOKEN:'test-secret', BUCKET: { head: async key => objects.has(key) ? {size:objects.get(key).length}:null, put:async(key,body)=>objects.set(key,body) } };
  const put = (kind,key,body,token='test-secret') => importRelease(new Request(`https://example.test/_release/${kind}/${key}`, {method:'PUT',headers:{Authorization:`Bearer ${token}`},body}),env);
  assert.equal((await put('objects',key,chunk,'wrong')).status,404);
  assert.equal((await put('objects',key,Buffer.from('wrong'))).status,422);
  const body=Buffer.from(JSON.stringify({objects:{[key]:chunk.length}}));
  assert.equal((await put('manifests',hash(body),body)).status,409);
  assert.equal((await put('objects',key,chunk)).status,201);
  assert.equal((await put('objects',key,chunk)).status,201);
  assert.equal((await put('manifests',hash(body),body)).status,201);
  assert.equal(objects.size,2);
});
test('every generated historical and current download reconstructs to its original bytes', async () => {
  const manifest=JSON.parse(fs.readFileSync('dist/storage/manifest.json'));
  const env={ ASSETS:{fetch:async r=>new Response(fs.readFileSync('dist/client'+new URL(r.url).pathname))} };
  for(const [path,file] of Object.entries(manifest.files)) {
    const expected=fs.readFileSync('dist/client'+path);
    assert.equal(expected.length,file.bytes,path);
    assert.equal(hash(expected),file.sha256,path);
    const response=await storedDownload(new Request('https://example.test'+path),env,manifest);
    const digest=createHash('sha256');let bytes=0;
    for await(const chunk of response.body){digest.update(chunk);bytes+=chunk.length;}
    assert.equal(bytes,file.bytes,path);assert.equal(digest.digest('hex'),file.sha256,path);
  }
});
test('server bundle has no full snapshots or release payload imports', () => {
  const meta=JSON.parse(fs.readFileSync('dist/internal/server-meta.json'));
  assert.ok(!Object.keys(meta.inputs).some(p=>/data\/(coverage\/snapshots[/.]|releases\/)/.test(p)));
});
test('content boundaries preserve source archive chunks after insertion', async () => {
  const { chunks, CHUNK_BYTES }=await import('../scripts/release-storage.mjs');
  const body=Buffer.alloc(12*1024*1024);let state=1234567;
  for(let i=0;i<body.length;i++){state^=state<<13;state^=state>>>17;state^=state<<5;body[i]=state&255;}
  const before=[...chunks(body)];const after=[...chunks(Buffer.concat([Buffer.from('new source entry'),body]))];
  assert.ok(before.every(b=>b.length<=CHUNK_BYTES));
  assert.deepEqual(Buffer.concat(before),body);
  const hashes=new Set(before.map(hash));
  assert.ok(after.filter(b=>hashes.has(hash(b))).length>=before.length-2,'Unchanged archive tail must reuse storage');
});
