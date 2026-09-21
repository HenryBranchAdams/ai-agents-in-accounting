import { execFileSync } from "node:child_process";
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { hash } from './release-storage.mjs';
// Stage only executable code and small static UI assets. Keep storage outside dist.
const manifestBody = fs.readFileSync('dist/storage/manifest.json');
const manifest = JSON.parse(manifestBody);
const qualification = JSON.parse(fs.readFileSync('dist/storage/qualification.json'));
assert.equal(qualification.source_revision, execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), 'Qualified revision is stale');
assert.equal(qualification.storage_manifest, hash(manifestBody), 'Qualification is stale');
const local = process.argv.includes('--local');
if (!local) {
  const receipt = JSON.parse(fs.readFileSync('dist/storage/import-receipt.json'));
  assert.equal(receipt.manifest, hash(manifestBody), 'Import is incomplete or stale');
}
const destination = process.argv[2] || 'outputs/release';
assert.ok(!fs.existsSync(destination), 'Use a fresh staging destination');
fs.mkdirSync(`${destination}/dist`, { recursive: true });
fs.cpSync('dist/server', `${destination}/dist/server`, { recursive: true });
fs.cpSync('dist/.openai', `${destination}/dist/.openai`, { recursive: true });
fs.mkdirSync(`${destination}/.openai`, { recursive: true });
fs.copyFileSync('.openai/hosting.json', `${destination}/.openai/hosting.json`);
for (const name of fs.readdirSync('dist/client', { recursive: true })) {
  const file = `dist/client/${name}`;
  if (!fs.statSync(file).isFile() || /^(downloads|releases|assets\/objects)(\/|$)/.test(name)) continue;
  const target = `${destination}/dist/client/${name}`;
  fs.mkdirSync(path.dirname(target), { recursive: true }); fs.copyFileSync(file, target);
}
if (local) {
  const configPath = `${destination}/dist/server/wrangler.json`;
  const config = JSON.parse(fs.readFileSync(configPath));
  config.find_additional_modules = true;
  config.rules = [{ type: 'ESModule', globs: ['**/*.js'] }];
  fs.writeFileSync(configPath, JSON.stringify(config));
}
if (local) fs.cpSync('dist/client/assets/objects', `${destination}/dist/client/assets/objects`, { recursive: true });
for (const [key, size] of Object.entries(manifest.objects)) {
  const body = fs.readFileSync(`dist/client/assets/objects/${key}`);
  assert.equal(body.length, size); assert.equal(hash(body), key);
}
console.log(JSON.stringify({ staged: destination, storage_manifest: hash(manifestBody), objects: Object.keys(manifest.objects).length }));
