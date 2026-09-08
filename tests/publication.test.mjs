import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { gunzipSync } from 'node:zlib';
import worker from '../dist/server/index.js';
import { records, meta } from '../dist/internal/corpus.mjs';
const fetchPage = p => worker.fetch(new Request('https://corpus.example'+p));
test('new reading surfaces preserve evidence and publication boundaries', async () => {
  for (const route of ['/briefs','/changes','/maintenance','/records/src_1os761s/history']) {
    const response=await fetchPage(route); assert.equal(response.status,200,route);
    assert.match(await response.text(), /<h1>/);
  }
  const source = await (await fetchPage('/records/src_1os761s')).text();
  for(const heading of ['What this source establishes','Applicability','Limitations and unknowns','Complete record details','not reverified']) assert.ok(source.includes(heading),heading);
  assert.doesNotMatch(source,/href="\/jurisdiction"/);
  const brief = await (await fetchPage('/records/guide-journal-extraction-completeness')).text();
  for(const heading of ['Findings across sources','Differences and qualifications','What remains unknown','Suggested reading order']) assert.ok(brief.includes(heading));
});
test('current release and downloads contain the same canonical records and preserved baseline',()=>{
  const previous=JSON.parse(gunzipSync(fs.readFileSync('data/releases/2026-09-07.3/corpus.json.gz')));
  const current=JSON.parse(fs.readFileSync('dist/client/downloads/corpus.json'));
  const archived=JSON.parse(gunzipSync(fs.readFileSync(`dist/client/releases/${meta.corpus_version}/corpus.json.gz`)));
  assert.deepEqual(archived,current);
  const byId=new Map(records.map(r=>[r.id,r]));
  for(const r of previous.records) assert.deepEqual(byId.get(r.id),r,`Preserve baseline record ${r.id}`);
  assert.equal(records.length-previous.records.length,3);
  const knowledge=JSON.parse(fs.readFileSync('dist/client/downloads/knowledge.json'));
  assert.equal(Object.keys(knowledge.profiles).length,records.length);
  assert.equal(knowledge.corpus_version,meta.corpus_version);
  const queue=JSON.parse(fs.readFileSync('dist/client/downloads/maintenance.json'));
  assert.ok(queue.queue.length>0);
  assert.equal(queue.changes.length,3);
});
