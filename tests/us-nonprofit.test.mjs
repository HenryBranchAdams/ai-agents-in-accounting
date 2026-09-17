import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {records, coverage, meta} from '../dist/internal/corpus.mjs';
import {executeAgent} from '../dist/internal/agent.mjs';
import worker from '../dist/server/index.js';

const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const byId=new Map(records.map(record=>[record.id,record]));
const guideId='guide-us-nonprofit-contributions-close';
const exampleId='example-us-nonprofit-restricted-award-close';
const sources=['src_nonprofit_fasb_2018_08','src_nonprofit_fasb_2016_14','src_nonprofit_irs_990_2025'];

test('nonprofit source links preserve publisher identity, locators, access depth and unknown reuse rights',()=>{
 const guide=byId.get(guideId);
 assert.deepEqual(guide.source_ids,sources);
 for(const id of sources){
  const source=byId.get(id);
  assert.equal(source.kind,'source');
  assert.ok(source.source_url.startsWith('https://'));
  assert.ok(source.data.locators.length&&source.provenance.scope&&source.data.access_note);
  assert.equal(source.data.review_level,'substantive-excerpt');
  assert.equal(source.rights.full_text_stored,false);
  assert.equal(source.rights.source_status,'unknown');
  assert.equal(source.rights.source_license,null);
  const result=executeAgent('get',{id,limit:20});
  assert.equal(result.record.citation.original_source_url,source.source_url);
  assert.deepEqual(result.record.rights,source.rights);
  assert.ok(result.passages.every(p=>p.source_pointers.length));
 }
 assert.match(guide.provenance.note,/No professional review/);
 assert.match(guide.provenance.note,/current consolidated Codification/);
});

test('a governmental framework counterexample returns GASB sources and cannot inherit the nonprofit US GAAP guide',()=>{
 const result=executeAgent('search',{q:'',framework:'GASB',limit:25});
 assert.ok(result.results.some(r=>r.id==='src_roadmap_gasb34_basis'));
 assert.ok(result.results.some(r=>r.id==='src_roadmap_gasb103'));
 assert.ok(!result.results.some(r=>[guideId,exampleId].includes(r.id)));
 const scope=executeAgent('get',{id:guideId,section:'data.scope',limit:20});
 assert.match(scope.passages.map(p=>p.text).join(' '),/Governmental entities.*separate analysis/);
});

test('the nonprofit scoped assessment is partial and does not become construction or descendant sufficiency',()=>{
 const a=coverage.cell('813','q-grants-contributions').assessments.find(a=>a.id==='coverage-us-nonprofit-2026-09-16');
 assert.ok(a);assert.equal(a.status,'partial');
 const canonical=read('data/coverage/assessments.json').assessments.find(row=>row.id===a.id);
 assert.ok(canonical);assert.equal(canonical.status,a.status);
 assert.ok(canonical.gaps.some(g=>/endowment/.test(g)));
 assert.ok(canonical.gaps.some(g=>/Professional/.test(g)));
 for(const code of ['23','236','236115','813110']){
  assert.ok(!coverage.cell(code,'q-grants-contributions').assessments.some(x=>x.id===a.id));
 }
 assert.equal(coverage.summary.assessment_status_counts['sufficient-for-stated-scope'],0);
 const q=read('data/coverage/research-questions.json').questions.find(q=>q.id==='rq-us-nonprofit-award-close');
 assert.equal(q.record_id,guideId);assert.equal(q.assessment_status,'partial');
 assert.equal(q.professional_review,'not-performed');assert.equal(q.empirical_support,'not-established');
 assert.equal(byId.get(guideId).data.research_questions[0].id,q.id);
});

test('the original nonprofit arithmetic reconciles the advance, restriction and separate allocation without inventing ledger evidence',()=>{
 const d=byId.get(exampleId).data, input=d.inputs, result=d.calculation;
 assert.match(d.origin,/Original synthetic/);
 assert.equal(result.recognized_contribution,input.award_amount);
 assert.equal(result.restriction_release,input.qualifying_program_expense);
 assert.equal(result.ending_restricted_net_assets,input.award_amount-input.qualifying_program_expense);
 assert.ok(Math.abs(Object.values(input.allocation_driver).reduce((a,b)=>a+b,0)-1)<1e-12);
 for(const [name,ratio] of Object.entries(input.allocation_driver)){
  assert.equal(result.shared_cost_allocation[name],input.shared_cost_pool*ratio);
 }
 assert.equal(Object.values(result.shared_cost_allocation).reduce((a,b)=>a+b,0),input.shared_cost_pool);
 const balances={};for(const row of d.journals){
  assert.ok(Number.isFinite(row.amount)&&row.amount>0&&row.debit!==row.credit);
  balances[row.debit]=(balances[row.debit]||0)+row.amount;
  balances[row.credit]=(balances[row.credit]||0)-row.amount;
 }
 assert.equal(balances.refundable_advance,0);
 assert.equal(Object.values(balances).reduce((a,b)=>a+b,0),0);
 assert.match(d.examples[0].calculation,/separate 20,000 shared-cost pool/);
 assert.ok(d.limitations.some(x=>/not operational evidence/.test(x)));
 // cash_or_payables is an explicit illustrative alternative, not proof of a cash balance.
 assert.equal(d.journals.find(j=>j.id==='N3').credit,'cash_or_payables');
});

test('nonprofit reading pages and exports expose the same record IDs, source links and unfinished research',async()=>{
 for(const id of [guideId,exampleId]){
  const response=await worker.fetch(new Request('https://corpus.example/records/'+id));
  assert.equal(response.status,200);const html=await response.text();
  for(const source of sources)assert.ok(html.includes('/records/'+source));
  assert.ok(html.includes(id));
 }
 const guideHtml=await(await worker.fetch(new Request('https://corpus.example/records/'+guideId))).text();
 assert.match(guideHtml,/Professional review not performed/);assert.match(guideHtml,/endowment/);
 const output=read('dist/client/downloads/corpus.json');assert.equal(output.corpus_version,meta.corpus_version);
 for(const id of [guideId,exampleId,...sources])assert.deepEqual(output.records.find(r=>r.id===id),byId.get(id));
 assert.deepEqual(read('dist/client/downloads/research-questions.json'),read('data/coverage/research-questions.json'));
 assert.ok(read('dist/client/downloads/manifest.json').files.some(f=>f.path==='/downloads/accounting-agents-source.zip'));
});
