import test from 'node:test';
import assert from 'node:assert/strict';
import {records,getRecord} from '../dist/internal/corpus.mjs';
import worker from './worker-fixture.mjs';
const decode=text=>text.replaceAll('&quot;','"').replaceAll('&#x27;',"'").replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&');
const ids=[...new Set([
 'wf-r2r-bank-reconciliations','guide-construction-wip','guide-construction-connected-close','guide-construction-tax-transitions','example-construction-contract-ledger',
 'guide-qbo-ledger-completeness','guide-independent-deployment-evidence','collection-accounting-failure-casebook',
 ...[...new Set(records.map(r=>r.kind))].map(kind=>records.find(r=>r.kind===kind).id),
])];

test('record outlines resolve unique real anchors across brief, source, collection and construction variants',async()=>{
 for(const id of ids){
  const response=await worker.fetch(new Request('https://corpus.example/records/'+id));assert.equal(response.status,200,id);const html=await response.text();
  const anchors=[...html.matchAll(/\sid="([^"]+)"/g)].map(m=>decode(m[1]));
  assert.equal(new Set(anchors).size,anchors.length,`${id}: duplicate IDs`);
  const outline=[...html.matchAll(/data-section-link="([^"]+)"/g)].map(m=>decode(m[1]));assert.ok(outline.length,id);
  for(const target of outline)assert.ok(anchors.includes(target),`${id}: missing ${target}`);
  const record=getRecord(id),brief=record.data.editorial_brief;
  if(brief?.reading){
    assert.ok(html.indexOf('On this page')>html.indexOf(decode(brief.reading.critical_limitation).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#x27;')),id);
    for(const target of ['worked-explanation','exception','suggested-reading'])assert.ok(outline.includes(target),`${id}: ${target}`);
  }
 }
});

test('evidence enhancement payloads preserve exact finding provenance while native source links remain',async()=>{
 for(const id of ['wf-r2r-bank-reconciliations','guide-construction-wip','guide-independent-deployment-evidence']){
  const r=getRecord(id),html=await(await worker.fetch(new Request('https://corpus.example/records/'+id))).text();
  const payloads=[...html.matchAll(/data-evidence-preview="([^"]+)"/g)].map(m=>JSON.parse(decode(m[1])));
  const findings=[...(r.data.editorial_brief.findings||[]),...(r.data.editorial_brief.disagreements||[])].filter(f=>f.source_ids?.length);
  assert.equal(payloads.length,findings.length,id);
  findings.forEach((f,i)=>{const p=payloads[i];assert.equal(p.owner_id,id);assert.equal(p.claim,f.claim);assert.equal(p.qualification,f.qualification);assert.equal(p.locator_scope,'finding');assert.deepEqual(p.sources.map(s=>s.id),[...new Set(f.source_ids)]);for(const s of p.sources)assert.ok(html.includes(`href="${s.href}"`));});
  assert.doesNotMatch(html,/<button[^>]*aria-label="Inspect .*referenced source/,'No dead preview buttons before enhancement');
 }
});
