import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import worker from './worker-fixture.mjs';
import { records, meta } from '../dist/internal/corpus.mjs';
const fetchPage = p => worker.fetch(new Request('https://corpus.example'+p));
const sha256 = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
test('new reading surfaces preserve evidence and publication boundaries', async () => {
  for (const route of ['/briefs','/changes','/maintenance','/records/src_1os761s/history']) {
    const response=await fetchPage(route); assert.equal(response.status,200,route);
    assert.match(await response.text(), /<h1>/);
  }
  const source = await (await fetchPage('/records/src_1os761s')).text();
  for(const heading of ['What this source establishes','Applicability','Limitations and unknowns','Complete record details','Source access, editions and review locators']) assert.ok(source.includes(heading),heading);
  assert.doesNotMatch(source,/href="\/jurisdiction"/);
  const brief = await (await fetchPage('/records/guide-journal-extraction-completeness')).text();
  for(const heading of ['Findings across sources','Differences and qualifications','What remains unknown','Suggested reading order']) assert.ok(brief.includes(heading));
});
test('current release and downloads contain the same canonical records and preserved baseline',()=>{
  const queue=JSON.parse(fs.readFileSync('dist/client/downloads/maintenance.json'));
  const releaseIndex=JSON.parse(fs.readFileSync('data/releases/index.json'));
  assert.equal(queue.previous_version,releaseIndex.versions.at(-2));
  const previous=JSON.parse(gunzipSync(fs.readFileSync(`data/releases/${queue.previous_version}/corpus.json.gz`)));
  const current=JSON.parse(fs.readFileSync('dist/client/downloads/corpus.json'));
  const archived=JSON.parse(gunzipSync(fs.readFileSync(`dist/client/releases/${meta.corpus_version}/corpus.json.gz`)));
  assert.deepEqual(archived,current);
  const byId=new Map(records.map(r=>[r.id,r]));
  for(const r of previous.records) assert.ok(byId.has(r.id),`Stable baseline ID ${r.id}`);
  const added=records.filter(r=>!previous.records.some(p=>p.id===r.id));
  const modified=records.filter(r=>previous.records.some(p=>p.id===r.id&&JSON.stringify(p)!==JSON.stringify(r)));
  const knowledge=JSON.parse(fs.readFileSync('dist/client/downloads/knowledge.json'));
  assert.equal(Object.keys(knowledge.profiles).length,records.length);
  assert.equal(knowledge.corpus_version,meta.corpus_version);
  assert.ok(queue.queue.length>0);
  assert.equal(queue.changes.filter(c=>c.change==='added').length,added.length);
  assert.equal(queue.changes.filter(c=>c.change==='modified').length,modified.length);
  assert.deepEqual(queue.versions,releaseIndex.versions);
});

test('historical release artifacts preserve exact bytes across source and generated release trees',()=>{
  const expected={
    '2026-09-14.3':{
      'changes.json':[752,'cb22b4b516a656462e05ef8b0f08824389824eb8a15ba68e8b28a399a5815a32'],
      'corpus.json':[9500318,'31a6a95a6b23f7e3cef116adecff37c28e8de1c5a739548666fb6306f4bd9d05'],
      'corpus.json.gz':[766994,'a796ead4275fe5fedbbeb92fe848b588fa6d0927f3f9c882ac6bbe0ba4e7b44a'],
      'corpus.jsonl':[7482077,'add7c59ce1fc4120e2640addb0672b75844a3081e41c82a6be11c5fe94c0fc40'],
      'manifest.json':[891,'f6129498482daaa2fcd1702cf4689424b9b2b7e863ea656fedfaf426f9906510'],
      'record-history.jsonl':[557,'f3a378e4f48321e55ffc72fd3800feba1f9f3aa6fc2cf8ea4afdaac666f1b9f9'],
    },
    '2026-09-16.1':{
      'changes.json':[631,'8aab98123353bf9cdad3cc02ad2a986664c820025ae5a36c3fce36c4b5457936'],
      'corpus.json':[9524758,'6dc3b531fe6eb3387c2847088e2358ef99b08c5e8a899a49b0e46b6164d2014c'],
      'corpus.json.gz':[771864,'4fa90e11ce6ab78717755c2c0a775719c350f7e8817097514402e73c9c3ef562'],
      'corpus.jsonl':[7500396,'771ca29e96d65e77d63b2f8ba9903e7a08aa4e979f68eaa13aab74985b98281e'],
      'manifest.json':[891,'8d9b36fe63efd50e6f99803e83201bf4e382e064edde9fa5637f331512beec26'],
      'record-history.jsonl':[534,'ab548114da5f7bdf3887bdd8f330298b314c373704355c13c5255703a962c3db'],
    },
  };
  for(const [version,files] of Object.entries(expected)) for(const [name,[bytes,digest]] of Object.entries(files)){
    for(const root of ['data/releases','dist/client/releases']){
      const file=`${root}/${version}/${name}`;
      assert.equal(fs.statSync(file).size,bytes,file);
      assert.equal(sha256(file),digest,file);
    }
  }
});
