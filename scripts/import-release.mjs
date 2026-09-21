import { spawn } from "node:child_process";
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { hash } from './release-storage.mjs';
const origin = process.argv[2];
assert.equal(new URL(origin).protocol, 'https:', 'Imports require HTTPS');
const token = process.env.RELEASE_IMPORT_TOKEN;
assert.ok(token, 'RELEASE_IMPORT_TOKEN is required');
async function transfer(url, method, body) {
  return new Promise((resolve, reject) => {
    const args = ['--silent', '--show-error', '--max-time', '120', '--request', method, '--header', `Authorization: Bearer ${token}`, '--write-out', '\n%{http_code}'];
    if (method === 'HEAD') args.push('--head');
    if (body) args.push('--data-binary', '@-');
    args.push(url);
    const child = spawn('curl', args, { stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '', error = '';
    child.stdout.on('data', data => { out += data; });
    child.stderr.on('data', data => { error += data; });
    child.on('error', reject);
    child.on('close', code => {
      if (code) return reject(new Error(`Transfer failed (${code}): ${error}`));
      const status = Number(out.trim().split('\n').at(-1));
      resolve({ status, ok: status >= 200 && status < 300, text: async () => out.slice(0, -4) });
    });
    child.stdin.on('error', () => {});
    child.stdin.end(body);
  });
}
const body = fs.readFileSync('dist/storage/manifest.json');
const manifest = JSON.parse(body);
async function upload(kind, key, bytes) {
  assert.equal(hash(bytes), key);
  const url = `${origin}/_release/${kind}/${key}`;
  const existing = await transfer(url, 'HEAD');
  if (existing.ok) return;
  assert.equal(existing.status, 404, `Import preflight returned ${existing.status}`);
  for (let attempt = 0; attempt < 3; attempt++) {
    const result = await transfer(url, 'PUT', bytes);
    if (result.ok) return;
    if (![429, 502, 503, 504].includes(result.status) || attempt === 2) throw new Error(`Import returned ${result.status}: ${await result.text()}`);
    await new Promise(resolve => setTimeout(resolve, 1000 * 2 ** attempt));
  }
}
let completed = 0;
const entries = Object.entries(manifest.objects);
let cursor = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (cursor < entries.length) {
    const [key, size] = entries[cursor++];
    const bytes = fs.readFileSync(`dist/client/assets/objects/${key}`);
    assert.equal(bytes.length, size);
    await upload('objects', key, bytes);
    if (++completed % 25 === 0) console.log(`Verified ${completed}/${entries.length} objects`);
  }
}));
await upload('manifests', hash(body), body);
fs.writeFileSync('dist/storage/import-receipt.json', JSON.stringify({ origin, manifest: hash(body), verified_objects: completed, completed_at: new Date().toISOString() }, null, 2));
console.log(`Import sealed: ${hash(body)}`);
