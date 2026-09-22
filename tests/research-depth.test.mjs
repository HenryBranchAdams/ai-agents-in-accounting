import test from 'node:test';
import assert from 'node:assert/strict';
import {records,getRecord,recordMarkdown,search,knowledge} from '../dist/internal/corpus.mjs';
import worker from './worker-fixture.mjs';
import {editorialReviewReport} from '../scripts/editorial-review.mjs';
const journeys=[
 ['Xero journal population','guide','guide-xero-ledger-completeness'],
 ['QuickBooks recovery','guide','guide-qbo-ledger-completeness'],
 ['purchase payment','example','example-connected-purchase-to-payment'],
 ['processor settlement','example','example-connected-processor-settlement'],
 ['independent accounting outcomes','guide','guide-independent-deployment-evidence'],
 ['evaluation capability','guide','guide-select-accounting-evaluations'],
 ['accounting failures','collection','collection-accounting-failure-casebook'],
 ['approval boundaries','guide','guide-accounting-action-boundaries'],
 ['connected close review','guide','guide-connected-close-review'],
 ['claim counterexamples','guide','guide-accounting-claim-counterexamples'],
 ['research assets','collection','collection-usable-accounting-research-assets'],
];
const text=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#x27;');
const pointer=(r,p)=>p.slice(1).split('/').map(s=>s.replaceAll('~1','/').replaceAll('~0','~')).reduce((v,k)=>v?.[k],r);
test('nine-package research journeys are discoverable in full and compact retrieval',async()=>{
 for(const [q,kind,id]of journeys){
  assert.ok(search(new URLSearchParams({q,kind,limit:'10'})).records.some(r=>r.id===id),q);
  const response=await worker.fetch(new Request('https://corpus.example/api/v1/agent/search?'+new URLSearchParams({q,kind,limit:'10'})));
  assert.equal(response.status,200);assert.ok((await response.json()).results.some(r=>r.id===id),`compact: ${q}`);
 }
});
test('research briefs render the same scope and qualifications in HTML and Markdown',async()=>{
 for(const [,kind,id]of journeys.filter(([,kind])=>kind!=='example')){
  const r=getRecord(id),brief=r.data.editorial_brief;assert.ok(brief?.reading,id);
  const response=await worker.fetch(new Request('https://corpus.example/records/'+id));assert.equal(response.status,200);
  const html=await response.text(),markdown=recordMarkdown(r);
  for(const value of [brief.question,brief.answer,brief.reading.critical_limitation,...brief.findings.map(f=>f.qualification)]){
   assert.ok(html.includes(text(value)),`${kind} ${id}: HTML qualification`);
   assert.ok(markdown.includes(value),`${id}: Markdown qualification`);
  }
  for(const sourceId of new Set(brief.findings.flatMap(f=>f.source_ids)))assert.ok(html.includes('/records/'+sourceId),`${id}: source link`);
 }
});
test('scope counterexamples stay distinct from platform behavior and quality evidence',()=>{
 const x=getRecord('guide-xero-ledger-completeness').data;
 assert.equal(x.synthetic_counterexample.naive_short_page_stop_count,2);
 assert.equal(x.synthetic_counterexample.correct_empty_termination_count,4);
 const q=getRecord('guide-qbo-ledger-completeness').data;
 assert.equal(q.synthetic_counterexample.naive_observed_amount_minor,8000);
 assert.equal(q.synthetic_counterexample.full_fixture_amount_minor,20000);
 for(const d of [x,q])assert.match(d.authorized_test_protocol.status,/not run/);
 const empirical=getRecord('guide-independent-deployment-evidence').data.editorial_brief;
 assert.ok(empirical.findings.some(f=>/not statistically significant/.test(f.qualification)));
 assert.ok(empirical.unknowns.some(v=>/review and rework/.test(v)));
 const selection=getRecord('guide-select-accounting-evaluations').data.selection_matrix;
 assert.match(selection.find(r=>r.resource==='src_apexaccounting_paper2026').missing,/Private held-out/);
 assert.match(selection.find(r=>r.resource==='src_cord_receipt_parsing').missing,/unresolved/);
});
test('counterexample projection preserves five qualified edges and seven owned annotations',()=>{
 const id='guide-accounting-claim-counterexamples',r=getRecord(id);
 const incoming=knowledge.relations(id,{direction:'in'}).filter(e=>e.type==='qualifies');
 assert.equal(incoming.length,5);const seen=new Set();
 for(const edge of incoming){
  assert.equal(edge.to,id);assert.deepEqual(edge.provenance.source_ids,[id]);
  assert.ok(!knowledge.relations(edge.from,{direction:'out'}).some(e=>e.to===id&&e.type==='supports'));
  for(const p of edge.provenance.pointers){const pair=pointer(r,p);assert.ok(pair?.changed_fact);assert.equal(pair.relationship.from_record,edge.from);assert.equal(pair.relationship.to_record,id);seen.add(pair.id);}
 }
 assert.equal(seen.size,7);
 const outgoing=knowledge.relations('example-connected-purchase-to-payment',{direction:'out'}).filter(e=>e.to===id&&e.type==='qualifies');
 assert.equal(outgoing.length,1);assert.equal(outgoing[0].provenance.pointers.length,3);
});
test('casebook and asset matrix retain procedural and permission exclusions',()=>{
 const cases=getRecord('collection-accounting-failure-casebook').data.cases;
 assert.equal(cases.length,6);assert.ok(new Set(cases.map(c=>c.mechanism)).size>=4);
 const ua=cases.find(c=>c.source_id==='src_sec_under_armour_2021_order');assert.match(ua.dated_facts,/no finding.*GAAP/);
 for(const c of cases){assert.ok(c.primary_locators.length);assert.match(c.project_design_lesson.effectiveness,/Not tested/);assert.match(c.synthetic_variant.classification,/not executed/);}
 const assets=getRecord('collection-usable-accounting-research-assets').data.assets;
 assert.equal(assets.length,8);
 for(const a of assets)assert.deepEqual(Object.keys(a.permissions).sort(),['access','quotation','redistribution','modification','testing_evaluation','model_training','commercial_use'].sort());
 for(const id of ['tabformer','baf','fifar']){const a=assets.find(x=>x.id===id);assert.match(a.local_check,/Not run/);assert.ok(a.dependencies_and_limits.some(s=>/Not recommended/.test(s)));}
});
test('research brief freshness notices an altered evidence record without inventing a new review',()=>{
 const id='src_qbo_attachment_lineage_2026',guide='guide-qbo-ledger-completeness';
 assert.equal(editorialReviewReport(records).find(r=>r.record_id===guide).status,'dependencies-unchanged');
 const changed=records.map(r=>r.id===id?{...r,summary:r.summary+' Changed contract.'}:r);
 const report=editorialReviewReport(changed).find(r=>r.record_id===guide);
 assert.equal(report.status,'editorial-review-needed');assert.ok(report.changed_dependencies.includes(id));
 assert.equal(changed.find(r=>r.id===id).reviewed_at,getRecord(id).reviewed_at);
});
