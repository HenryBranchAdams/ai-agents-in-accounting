import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { search, getRecord, coverage, meta } from '../dist/internal/corpus.mjs';
import { executeAgent } from '../dist/internal/agent.mjs';
const pkg = JSON.parse(fs.readFileSync('data/research/agriculture-i97.json'));
const ex = getRecord('example-i97-crop-support-close').data;
const sum = rows => rows.reduce((n,r)=>n+r.amount,0);
const ledger = (journals, initial={}) => {
  const result={...initial};
  for (const j of journals) { result[j.debit]=(result[j.debit]||0)+j.amount; result[j.credit]=(result[j.credit]||0)-j.amount; }
  return result;
};
test('producer and contractor independently reconcile through the same invoice and cash payment',()=>{
  for (const input of [...ex.producer_cost_inputs,...ex.contractor_cost_inputs]) assert.equal(input.quantity*input.unit_cost,input.amount,input.id);
  assert.equal(sum(ex.producer_cost_inputs),50000);
  assert.equal(sum(ex.contractor_cost_inputs),4800);
  const b=ex.base;
  assert.equal(b.harvest_units*b.unit_cost,b.cost_pool);
  assert.equal(b.sold_units+b.ending_units,b.harvest_units);
  assert.equal(b.cogs+b.ending_inventory,b.cost_pool);
  assert.equal(b.sold_units*b.price,b.revenue);
  const p=ledger(ex.producer_journals,{cash:60000,equity:-60000});
  assert.equal(p.growing_crop,0); assert.equal(p.customer_receivable,0); assert.equal(p.contractor_payable,0);
  assert.equal(p.cash,58000); assert.equal(p.harvested_inventory,20000);
  assert.equal(Object.values(p).reduce((a,b)=>a+b,0),0);
  const c=ledger(ex.contractor_journals,{cash:10000,equity:-10000});
  assert.equal(c.cash,11200); assert.equal(c.producer_receivable,0); assert.equal(c.service_cost+c.service_revenue,-1200);
  assert.equal(Object.values(c).reduce((a,b)=>a+b,0),0);
  assert.ok(!Object.hasOwn(c,'harvested_inventory'));
  const invoice=ex.producer_journals.find(j=>j.event_id==='HARVEST-200');
  assert.equal(invoice.amount,ex.contractor_journals.find(j=>j.event_id===invoice.event_id).amount);
  assert.equal(ex.unit_basis.gross_scale_equivalent-ex.unit_basis.moisture_and_foreign_material_adjustment,b.harvest_units);
});
test('spoilage, monetary quality deduction and January shipment cannot disappear into a plug',()=>{
  const branch=ex.branches.find(b=>b.id==='loss-quality-cutoff'),q=branch.quantity,c=branch.cost,s=branch.sales;
  assert.equal(q.sold_regular+q.sold_quality+q.spoiled+q.ending_december,q.harvested);
  assert.equal(c.regular_cogs+c.quality_cogs+c.spoilage_loss+c.ending_december,c.available);
  assert.equal(q.spoiled*5,c.spoilage_loss);
  assert.equal(q.sold_quality*8-s.quality_deduction,s.quality_net);
  assert.equal(s.regular+s.quality_net,s.december_revenue);
  assert.equal(q.of_ending_shipped_january+q.remaining_after_january,q.ending_december);
  assert.equal(q.of_ending_shipped_january*7.25,s.january_revenue);
  assert.equal(c.january_cogs+c.remaining_after_january,c.ending_december);
  const cash=branch.cash;
  assert.equal(cash.opening-cash.production_paid+cash.customer_receipts_january-cash.contractor_paid_january,cash.cash_after_collections);
  assert.ok(branch.journals.filter(j=>j.event_id==='JAN-SHIP-1500').every(j=>j.date>'2026-12-31'));
});
test('incomplete service, unapproved claims and wild catch retain changed facts and unknowns',()=>{
  const service=ex.branches.find(b=>b.id==='incomplete-service');
  assert.equal(service.completed_acres+service.uncompleted_acres,service.approved_acres);
  assert.equal(service.completed_acres*service.price_per_acre,service.conditional_earned);
  assert.equal(service.invoice-service.conditional_earned,1200);
  assert.equal(service.customer_crop_inventory_in_contractor,0);
  assert.match(service.recognition_limit,/unresolved/);
  const claim=ex.branches.find(b=>b.id==='insurance-and-award');
  assert.equal(claim.approved_insurance,null); assert.equal(claim.book_recognition,null);
  assert.equal(claim.program_book_recognition,null);
  const wild=ex.branches.find(b=>b.id==='wild-catch-counterexample');
  assert.equal(wild.recorded_catch_pounds-wild.discarded_pounds,wild.landed_pounds);
  assert.equal(wild.owned_pre_catch_biomass,null); assert.equal(wild.quota_carrying_value,null);
});
test('ordinary queries retrieve scoped guides and their original source links',()=>{
  for (const [query,id,code,excluded] of [
    ['US crop harvest inventory cutoff','guide-i97-crop-producer','111','guide-i97-harvesting-contractor'],
    ['harvesting contractor service revenue','guide-i97-harvesting-contractor','115','guide-i97-crop-producer'],
    ['wild catch scope dispositions','guide-i97-resource-dispositions','114','guide-i97-crop-producer']
  ]) {
    const hits=search(new URLSearchParams({q:query,kind:'guide',limit:'5'})).records;
    assert.ok(hits.some(r=>r.id===id),`${query}: ${hits.map(r=>r.id)}`);
    const scoped=search(new URLSearchParams({q:query,kind:'guide',naics:code,limit:'100'})).records;
    assert.ok(scoped.some(r=>r.id===id)); assert.ok(!scoped.some(r=>r.id===excluded));
    const context=executeAgent('context',{ids:[id],include_sources:true,max_chars:40000});
    assert.ok(context.records.some(x=>x.record.kind==='source' && x.record.citation.original_source_url));
    const guide=getRecord(id);
    for (const q of guide.data.research_questions) for (const locator of q.source_locators) {
      const source=getRecord(locator.source_id); assert.equal(source.kind,'source');
      assert.match(source.source_url,/^https:\/\//); assert.ok(locator.locator.length>20);
      assert.ok(locator.effective_period.length>20); assert.equal(source.rights.full_text_stored,false);
    }
  }
});
test('canonical assessments preserve all five role dispositions and do not assess descendants',()=>{
  assert.equal(pkg.baseline_inventory.leaf_exceptions.length,64);
  assert.equal(pkg.baseline_inventory.linked_questions.length,10);
  for (const a of pkg.assessments) {
    assert.ok(coverage.cell(a.industry_code,a.question_id).assessments.some(x=>x.id===a.id));
    assert.equal(a.status,'partial'); assert.ok(a.gaps.length);
    assert.equal(a.dimensions['empirical-support'],'not-assessed');
  }
  assert.ok(!coverage.cell('111150','q-inventory').assessments.some(x=>x.id.startsWith('coverage-i97')));
  assert.match(getRecord('guide-q-natural-resources').data.scope,/IFRS/);
  assert.equal(pkg.families.flatMap(f=>f.questions).length,8);
});
test('same-build corpus download preserves every issue artifact and unknown right',()=>{
  const download=JSON.parse(fs.readFileSync('dist/client/downloads/corpus.json'));
  for (const id of [...pkg.records.map(r=>r.id),...pkg.families.map(f=>f.guide_id)]) {
    assert.deepEqual(download.records.find(r=>r.id===id),getRecord(id));
  }
  assert.equal(download.corpus_version,meta.corpus_version);
});
