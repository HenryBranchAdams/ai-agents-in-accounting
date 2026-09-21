import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {applyIntegration, packetPath, loadPacket} from './integrate-family-office-reference.mjs';

const run = (...args) => execFileSync(process.execPath, args, {stdio: 'inherit'});
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const intake = 'data/research/family-office-reference-intake';
// The transport holds JSON annotations only, not executable code or external full text.
if (fs.existsSync(intake)) {
  const names = Array.from({length: 11}, (_, i) => `part-${String(i + 1).padStart(2, '0')}.b64`);
  assert.deepEqual(fs.readdirSync(intake).sort(), names);
  const parts = names.map(name => fs.readFileSync(path.join(intake, name), 'utf8'));
  // Correct the single documented transcription error in the connector transport.
  // The entire decoded payload must still match the independently recorded digest.
  parts[6] = parts[6].replace('NcSPrrrXUI', 'NcSPrrXUI');
  const encoded = parts.join('');
  assert.match(encoded, /^[A-Za-z0-9+/]+={0,2}$/);
  const bytes = gunzipSync(Buffer.from(encoded, 'base64'), {maxOutputLength: 400000});
  assert.equal(hash(bytes), '4a14a7160d88470b17e5a3dd49e27d9a73fba507712e3aadd229ad510b2da958');
  const files = JSON.parse(bytes.toString('utf8'));
  const allowed = ['package.json','sources-a.json','sources-b.json','topics-a.json','topics-b.json','context_packets.json','research_gaps.json','asc_locator_map.json','access_issues.json','reconciliation.json'];
  assert.deepEqual(Object.keys(files).sort(), allowed.sort());
  for (const [name, content] of Object.entries(files)) {
    assert.equal(typeof content, 'string'); JSON.parse(content);
    const target = path.join(packetPath, name);
    if (fs.existsSync(target)) assert.equal(fs.readFileSync(target, 'utf8'), content, `Existing intake conflict: ${name}`);
  }
  fs.mkdirSync(packetPath, {recursive: true});
  for (const [name, content] of Object.entries(files)) fs.writeFileSync(path.join(packetPath, name), content);
  loadPacket();
  fs.rmSync(intake, {recursive: true});
}

const before = JSON.parse(fs.readFileSync('data/releases/2026-09-21.3/corpus.json', 'utf8'));
const historical = execFileSync('git', ['ls-files', '-z', 'data/releases', 'data/coverage/snapshots'], {encoding: 'utf8'}).split('\0').filter(Boolean).filter(p => p !== 'data/releases/index.json');
const previousHashes = new Map(historical.map(p => [p, hash(fs.readFileSync(p))]));
const questions = JSON.parse(fs.readFileSync('data/coverage/research-questions.json')).questions;
const assessments = JSON.parse(fs.readFileSync('data/coverage/assessments.json')).assessments;
run('--test', 'tests/family-office-reference-import.test.mjs');
console.log(applyIntegration(process.cwd(), {apply: true}).counts);
const page = 'src/pages/record.tsx';
let source = fs.readFileSync(page, 'utf8');
if (!source.includes('<FamilyOfficeReference record={r} />')) {
  const anchor = '{r.kind === "collection" ? (\n            <>\n              <section>';
  assert.equal(source.split(anchor).length, 2, 'Record renderer changed; reconcile the integration point');
  source = 'import { FamilyOfficeReference } from "../components/family-office-reference";\n' + source.replace(anchor, '<FamilyOfficeReference record={r} />\n          {r.kind === "collection" && !r.data.family_office_reference ? (\n            <>\n              <section>');
  fs.writeFileSync(page, source);
}
run('scripts/coverage-mappings.mjs');
run('scripts/coverage-snapshot.mjs', '2026-09-21.5');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'fo-reference-export-'));
try {
  const {build} = await import('esbuild');
  const output = path.join(temporary, 'corpus.mjs');
  await build({entryPoints: ['src/corpus.ts'], outfile: output, bundle: true, format: 'esm', platform: 'node', target: 'es2023'});
  const {corpusExport} = await import(pathToFileURL(output));
  const current = corpusExport();
  assert.equal(current.records.length, 1479);
  for (const old of before.records) assert.deepEqual(current.records.find(r => r.id === old.id), old, `Existing record changed: ${old.id}`);
  const {writeReleaseArtifacts} = await import('./release-history.mjs');
  writeReleaseArtifacts(current, 'data/releases', {previousExport: JSON.parse(fs.readFileSync('data/releases/2026-09-21.4/corpus.json', 'utf8'))});
} finally {fs.rmSync(temporary, {recursive: true, force: true});}
assert.deepEqual(JSON.parse(fs.readFileSync('data/coverage/research-questions.json')).questions, questions);
assert.deepEqual(JSON.parse(fs.readFileSync('data/coverage/assessments.json')).assessments, assessments);
for (const [file, value] of previousHashes) assert.equal(hash(fs.readFileSync(file)), value, `Historical artifact changed: ${file}`);
run('scripts/validate.mjs');
run('--test', 'tests/family-office-reference-import.test.mjs');
console.log('Prepared canonical family-office edition. Full committed verification, PR review and deployment are separate.');
