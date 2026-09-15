import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {executeAgent} from '../dist/internal/agent.mjs';
import worker from '../dist/server/index.js';
const read=p=>JSON.parse(fs.readFileSync(p));
const data=read('data/corpus/example.json').find(r=>r.id==='example-construction-contract-ledger').data;
const branch=id=>data.examples.find(x=>x.id===id);
const cents=n=>Math.round(n*100);

test('same-job reported facts retain unresolved differences, actor boundaries and original synthetic journals',()=>{
 const c=data.same_job_case;
 const [price,invoice2,invoice3,payments]=c.observations, calc=c.editorial_calculations;
 assert.equal(calc.price_change,price.modified_price-price.original_price);
 assert.equal(cents(calc.invoice_2_cash_less_invoice),cents(invoice2.cash)-cents(invoice2.invoice));
 assert.equal(calc.invoice_3_implied_withholding,invoice3.invoice-invoice3.cash);
 assert.equal(cents(calc.invoice_3_rounding_difference),cents(calc.invoice_3_implied_withholding)-cents(invoice3.invoice*invoice3.reported_retention_rate));
 assert.equal(cents(calc.supplier_checks_total),[payments.contractor_check,...payments.surety_related_checks].reduce((s,n)=>s+cents(n),0));
 assert.equal(cents(calc.checks_less_initial_order_unexplained),cents(calc.supplier_checks_total)-cents(invoice2.order));
 assert.match(c.analysis,/not contractor cash/);assert.match(c.analysis,/not two payments/);assert.match(c.transfer_limit,/Not developer\/owner/);
 assert.equal(c.missing_links.length,5);
 const preserved=read('data/releases/2026-09-14.1/corpus.json').records.find(r=>r.id==='example-construction-contract-ledger');
 assert.deepEqual(data.journals,preserved.data.journals);
 assert.deepEqual(data.examples,preserved.data.examples,'reported historical facts must not rewrite synthetic branches');
});

test('four-gap outcomes cannot promote packets, portal access or interpretation into external review',()=>{
 const g=read('data/corpus/guide.json').find(x=>x.id==='guide-construction-connected-close').data;
 assert.equal(g.four_gap_ledger.length,4);
 assert.ok(g.four_gap_ledger.every(x=>/open|not-performed/.test(x.outcome)));
 assert.equal(g.authority_matrix.length,6);assert.ok(g.authority_matrix.every(x=>x.consolidated_review==='not-performed'&&x.authoritative_paragraphs_to_verify&&x.applicable_period));
 assert.match(g.professional_review_packet.status,/not-sent/);
 const t=read('data/corpus/guide.json').find(x=>x.id==='guide-construction-tax-transitions').data.conflict_resolution;
 assert.deepEqual(t.individual_disagreements.map(x=>x.id),['T01','T02','T03','T04']);
 assert.ok(t.individual_disagreements.every(x=>x.publisher_correction==='not-located'&&x.comparison_locator&&x.inquiry_question));
 for(const [id,section,term] of [
  ['guide-construction-connected-close','data.professional_review_packet','not-performed'],
  ['example-construction-contract-ledger','data.same_job_case','16514.1'],
  ['guide-construction-tax-transitions','data.conflict_resolution','T01']]){
  let cursor, found=false, count=0;
  do {
   const result=executeAgent('get',{id,section,limit:20,...(cursor?{cursor}:{})});
   assert.ok(result.record.citation&&result.record.rights&&!result.record.rights.full_text_stored);
   assert.ok(result.passages.every(p=>p.source_pointers.every(x=>x.startsWith('/'+section.replaceAll('.','/')+'/'))));
   found ||= result.passages.some(p=>p.text.includes(term));
   count+=result.passages.length;cursor=result.next_cursor;
   assert.ok(count<1000,'bounded section traversal');
  } while(cursor);
  assert.ok(found,section);
 }
});

test('construction event history rejects equal-total wrong-job completeness and reconstructs active versions',()=>{
 const t=data.transaction_evidence, versions=new Map(), latest=new Map();
 for(const e of t.events){
  const {delivery_id,...payload}=e;
  const identity=[e.entity,e.system,e.source_id].join('/');
  const version=identity+'/'+e.version;
  if(versions.has(version))assert.deepEqual(payload,versions.get(version),'same source version cannot carry conflicting content');
  versions.set(version,payload);
  if(!latest.has(identity)||latest.get(identity).version<e.version)latest.set(identity,e);
 }
 const rows=[...latest.values()].filter(x=>x.operation!=='delete'&&x.job_id==='J01'&&x.effective_period==='2026-07');
 assert.deepEqual(rows.map(x=>x.source_id).sort(),[...t.independent_population_manifest.expected_ids].sort());
 assert.equal(rows.length,4);assert.equal(rows.reduce((s,x)=>s+x.amount,0),280000);
 assert.equal(t.counterexample.amount,t.independent_population_manifest.expected_amount);
 assert.equal(t.counterexample.count,t.independent_population_manifest.expected_count);
 assert.notDeepEqual([...t.counterexample.ids].sort(),[...t.independent_population_manifest.expected_ids].sort());
 assert.equal(latest.get('CONTRACTOR-SYNTHETIC/job-cost-fixture/DRAFT-COST').operation,'delete');
});

test('corrected construction population ties through actual illustrative debit-credit entries',()=>{
 const b=branch('construction-corrected-population'), balances={};
 for(const j of [...data.journals.filter(x=>['opening','2026-07'].includes(x.period)),...b.journals]){
  balances[j.debit]=(balances[j.debit]||0)+cents(j.amount);
  balances[j.credit]=(balances[j.credit]||0)-cents(j.amount);
 }
 assert.equal(Object.values(balances).reduce((a,b)=>a+b),0);
 assert.equal(cents(b.result.cumulative_revenue),Math.round(b.input.corrected_cost/b.input.estimated_total_cost*b.input.price*100));
 for(const a of ['cash','ar','contract_asset'])assert.equal(balances[a],cents(b.result[a]));
 for(const a of ['ap','payroll_payable'])assert.equal(-balances[a],cents(b.result[a]));
 assert.equal(balances.job_cost,cents(b.result.cumulative_cost));assert.equal(-balances.revenue,cents(b.result.cumulative_revenue));
 assert.equal(cents(b.result.assets),cents(b.result.liabilities)+cents(b.result.capital_and_profit));
 assert.equal(cents(b.result.cumulative_profit),-balances.revenue-balances.job_cost);
 const estimate=branch('construction-estimate-revision');assert.equal(estimate.result.cumulative_revenue,estimate.input.cost/estimate.input.new_estimate*estimate.input.price);
 assert.equal(estimate.result.catch_up,estimate.result.cumulative_revenue-estimate.input.prior_revenue);
 const retainage=branch('construction-retainage-liability');assert.equal(retainage.result.contract_liability,retainage.input.unconditional_billed_rights-retainage.input.revenue);
 assert.equal(retainage.result.contract_liability,retainage.input.other_advance_position-retainage.input.conditional_retainage);
 assert.equal(retainage.result.ar,retainage.input.unconditional_billed_rights-retainage.input.cash_collected);
});

test('construction tax conflicts retain precise locators, substantive checks and distinct procedures',()=>{
 const g=read('data/corpus/guide.json').find(x=>x.id==='guide-construction-tax-transitions');
 assert.equal(g.data.conflict_resolution.checked_at,'2026-09-14');
 assert.match(JSON.stringify(g.data.conflict_resolution),/70340/);assert.match(JSON.stringify(g.data.conflict_resolution),/Small Contract Exception/);
 assert.match(JSON.stringify(g.data.method_change_path),/DCN275/);assert.match(JSON.stringify(g.data.method_change_path),/September4,2026/);
 assert.match(g.data.conflict_resolution.status,/remain open/);
 const assessments=read('data/coverage/assessments.json').assessments;
 assert.equal(assessments.find(x=>x.id==='coverage-construction-wip-2026-09-11').dimensions['worked-material'],'missing','historical assessment preserved');
 assert.equal(assessments.find(x=>x.id==='coverage-construction-connected-2026-09-14').dimensions['worked-material'],'present');
 assert.ok(assessments.every(x=>x.status!=='sufficient'));
});

test('agent sections retain event evidence, rights, source links, qualifications and exact pointers',()=>{
 for(const [id,section,term] of [['example-construction-contract-ledger','data.transaction_evidence','OTHER-JOB'],['guide-construction-tax-transitions','data.conflict_resolution','70340'],['example-construction-contract-ledger','data.observed_evidence','FY2023']]){
  const get=executeAgent('get',{id,section,limit:20});
  assert.ok(get.record.rights&&get.record.citation&&get.record.source_ids.length);
  assert.ok(get.passages.some(p=>p.text.includes(term)),`${section}: missing ${term}`);
  assert.ok(get.passages.every(p=>p.source_pointers.every(x=>x.startsWith('/'+section.replaceAll('.','/')+'/'))));
 }
 const source=executeAgent('get',{id:'src_construction_gao_25107258',limit:20});
 assert.match(source.record.citation.original_source_url,/gao/);assert.equal(source.record.rights.full_text_stored,false);
 assert.match(JSON.stringify(source),/not.*ledger|does not expose/i);
});

test('reading pages expose construction limits, new sources and original branch calculations',async()=>{
 for(const [id,terms] of [['example-construction-contract-ledger',['280,000','OTHER-JOB','373,333.33','conditional retainage']],['guide-construction-connected-close',['Twelve selected','operational','src_construction_gao_25107258','href="#detail-local_completion"','id="detail-local_completion"']],['guide-construction-tax-transitions',['70340','DCN275','publisher discrepancies']]]){
  const response=await worker.fetch(new Request('https://corpus.test/records/'+id));assert.equal(response.status,200);
  const html=await response.text();for(const term of terms)assert.ok(html.includes(term),`${id}: missing ${term}`);
  for(const match of html.matchAll(/href="#([^"]+)"/g))assert.ok(html.includes(`id="${match[1]}"`),`missing anchor ${match[1]}`);
 }
});

test('local construction completion preserves evidence boundaries and actionable retrieval paths',()=>{
 const guides=read('data/corpus/guide.json'), g=guides.find(x=>x.id==='guide-construction-connected-close').data;
 assert.equal(g.local_completion.status,'locally-complete-with-qualified-conclusions');
 assert.deepEqual(g.local_completion.local_blockers,[]);
 assert.match(g.assessment.empirical_support,/ASBCA/);
 assert.match(data.limitations[0],/Synthetic.*GAO.*ASBCA/);
 assert.ok(data.source_locators.some(x=>x.source_id==='src_construction_asbca_51759'&&/exhibits were not obtained/.test(x.locator)));
 assert.match(g.reading_path[3].step,/unavailable/);
 assert.equal(g.professional_review_packet.corpus_version,g.local_completion.corpus_version);
 const previous=read('data/releases/2026-09-14.2/corpus.json').records;
 for(const id of ['guide-construction-connected-close','example-construction-contract-ledger','guide-construction-tax-transitions']){
  const current=[...guides,...read('data/corpus/example.json')].find(r=>r.id===id);
  assert.deepEqual(current.rights,previous.find(r=>r.id===id).rights);
 }
 for(const p of g.local_completion.reading_and_retrieval){
  const result=executeAgent('get',{id:p.record_id,section:p.section,limit:20});
  assert.ok(result.passages.length&&result.record.citation&&result.record.rights);
  assert.ok(result.record.source_ids.length);
 }
 const local=executeAgent('get',{id:'guide-construction-connected-close',section:'data.local_completion',limit:20});
 assert.match(JSON.stringify(local),/not mean accounting sufficiency/);
 assert.match(JSON.stringify(local),/contractor/);
 const a=read('data/coverage/assessments.json').assessments.at(-1);
 assert.equal(a.id,'coverage-construction-local-2026-09-14');assert.equal(a.status,'partial');
 assert.equal(a.source_currency,'not-reverified-for-this-assessment');
});
