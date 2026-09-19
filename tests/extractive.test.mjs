import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const f=read('data/research/extractive-2026-09-18.json').fixture;
test('synthetic production and joint costs retain ownership denominators',()=>{
 const p=f.production,j=f.joint_cost;
 assert.equal(p.sold_bbl*p.price_cents_per_bbl,p.gross_proceeds_cents);
 assert.equal(p.gross_proceeds_cents*p.royalty_rate_basis_points/10000,p.royalty_obligation_cents);
 assert.equal(p.gross_proceeds_cents-p.royalty_obligation_cents-p.transport_cents,p.working_interest_pool_cash_cents);
 assert.equal(p.working_interest_pool_cash_cents*p.operator_working_interest_basis_points/10000,p.operator_distribution_cents);
 assert.equal(p.working_interest_pool_cash_cents*p.partner_working_interest_basis_points/10000,p.partner_distribution_cents);
 assert.equal(j.invoice_cents*p.operator_working_interest_basis_points/10000,j.operator_cost_cents);
 assert.equal(j.invoice_cents*p.partner_working_interest_basis_points/10000,j.partner_receivable_cents);
 assert.equal(j.partner_receivable_cents-j.partner_paid_cents,j.partner_balance_cents);
 assert.notEqual(p.operator_distribution_cents,p.gross_proceeds_cents);
});
test('reserve scenarios and nonowner service cannot silently become production entitlement',()=>{
 const d=f.depletion_sensitivity,s=f.support;
 for(const v of ['v1','v2']) assert.equal(d.eligible_cost_base_cents*d.current_production_bbl/d['proved_reserves_including_current_production_bbl_'+v],d['expense_cents_'+v]);
 assert.ok(d.expense_cents_v2>d.expense_cents_v1);
 assert.equal(s.hours*s.rate_cents,s.fee_cents);
 assert.equal(s.production_entitlement_bbl,0);
 assert.equal(f.suspense.disputed_cash_cents-f.suspense.released_cents,f.suspense.unresolved_cents);
 assert.equal(f.suspense.released_cents,0);
});
test('discovery mappings distinguish oil-gas rules from other mining',()=>{
 const mappings=read('data/coverage/record-mappings.json').mappings;
 const oil=mappings.find(r=>r.record_id==='src_us_extractive_sec_410_2025');
 const mining=mappings.find(r=>r.record_id==='src_us_extractive_sec_mining_letter_2001');
 assert.deepEqual(oil.industry_mappings.map(x=>x.industry_code),['211']);
 assert.deepEqual(mining.industry_mappings.map(x=>x.industry_code),['212']);
 const sources=read('data/corpus/source.json');
 for(const id of [oil.record_id,mining.record_id,'src_us_extractive_fas143_historical']){
  const r=sources.find(x=>x.id===id);
  assert.equal(r.rights.full_text_stored,false);
  assert.equal(r.rights.source_status,'unknown');
  assert.equal(r.data.effective_period.current_applicability,'unverified');
 }
});

test('built search retrieves settlement guide and retains exact source locators',async()=>{
 const {executeAgent}=await import('../dist/internal/agent.mjs');
 const result=executeAgent('search',{q:'production royalty joint-interest settlement',kind:'guide',limit:10});
 assert.ok(result.results.some(r=>r.id==='guide-us-extractive-production-settlement'));
 const oil=executeAgent('get',{id:'src_us_extractive_sec_410_2025',section:'data.locators',limit:20});
 assert.match(JSON.stringify(oil),/210\.4-10\(c\)/);
 const g=read('data/corpus/guide.json').find(r=>r.id==='guide-us-extractive-production-settlement');
 const registry=read('data/coverage/research-questions.json').questions;
 for(const q of g.data.research_questions)assert.deepEqual(registry.find(r=>r.id===q.id).source_locators,q.source_locators);
 assert.match(g.data.research_questions.find(q=>q.id==='rq-us-extractive-other-mining').answer,/No such extension/);
});

test('collection and joint-cost ledger entries balance without manufacturing revenue',()=>{
 const entries=[...f.settlement_ledger.entries,...f.joint_cost.ledger_entries];
 for(const e of entries){
  assert.equal(Object.values(e.debit).reduce((a,b)=>a+b,0),Object.values(e.credit).reduce((a,b)=>a+b,0),e.id);
  assert.ok(!Object.keys(e.credit).some(k=>k.includes('revenue')),e.id);
 }
 const balances={};
 for(const e of f.settlement_ledger.entries){
  for(const [a,n] of Object.entries(e.debit))balances[a]=(balances[a]||0)+n;
  for(const [a,n] of Object.entries(e.credit))balances[a]=(balances[a]||0)-n;
 }
 assert.equal(balances.cash,f.production.operator_distribution_cents);
 assert.equal(balances.production_settlement_clearing,0);
 assert.equal(balances.partner_payable,0);
 assert.equal(balances.royalty_payable,0);
 assert.equal(balances.transport_payable,0);
 assert.equal(balances.own_interest_settlement_clearing,-balances.cash);
});

test('supplied owner-control branch reconciles recognition without duplicating settlement cash',()=>{
 const r=f.recognition_branch,p=f.production;
 assert.equal(r.roles.reduce((s,x)=>s+x.entitlement_bbl,0),p.sold_bbl);
 assert.equal(r.roles.reduce((s,x)=>s+x.revenue_cents,0),p.gross_proceeds_cents);
 for(const role of r.roles){assert.equal(role.revenue_cents,role.entitlement_bbl*p.price_cents_per_bbl);assert.equal(role.revenue_cents-role.transport_expense_cents,role.cash_cents);}
 const e=r.operator_reclassification;
 assert.equal(e.debit.own_interest_settlement_clearing,p.operator_distribution_cents);
 assert.equal(Object.values(e.debit).reduce((s,n)=>s+n,0),e.credit.own_production_revenue);
 assert.equal(e.debit.cash,undefined);
 assert.ok(e.credit.own_production_revenue<p.gross_proceeds_cents);
 assert.match(r.counterexample,/leave.*clearing balance unresolved/);
});

test('retirement liability and asset layers reconcile without equating funding to settlement',()=>{
 const r=f.retirement;
 assert.equal(r.accretion_cents,r.opening_liability_cents*r.original_rate_basis_points/10000);
 assert.equal(r.closing_liability_cents,r.opening_liability_cents+r.accretion_cents+r.upward_revision_present_value_cents);
 assert.equal(r.annual_asset_allocation_cents,r.opening_retirement_asset_cents/r.useful_life_years);
 assert.equal(r.closing_retirement_asset_net_cents,r.opening_retirement_asset_cents+r.upward_revision_present_value_cents-r.annual_asset_allocation_cents);
 for(const e of r.entries)assert.equal(Object.values(e.debit).reduce((s,n)=>s+n,0),Object.values(e.credit).reduce((s,n)=>s+n,0));
 assert.match(r.counterexamples.join(' '),/surety bond is not settlement/);
 assert.match(r.assumptions.join(' '),/excluded from the other depletion/);
 assert.notEqual(r.closing_liability_cents,r.closing_retirement_asset_net_cents);
});

test('royalty reporting distinguishes rate and eligible allowance from collection percentages and invoices',()=>{
 const r=f.royalty_reporting;
 assert.equal(r.sales_value_cents*r.supplied_lease_rate_basis_points/10000,r.royalty_prior_to_allowances_cents);
 assert.equal(r.royalty_prior_to_allowances_cents-r.supplied_eligible_royalty_allowance_cents,r.royalty_due_cents);
 assert.notEqual(r.sales_value_cents*r.different_division_order_basis_points/10000,r.royalty_prior_to_allowances_cents);
 assert.notEqual(r.royalty_prior_to_allowances_cents-r.gross_transport_invoice_cents,r.royalty_due_cents);
 assert.match(r.scope,/Separate.*synthetic/);
});


test('public example views retain every supplied fixture branch',()=>{
 const example=read('data/corpus/example.json').find(r=>r.id==='example-us-extractive-production-settlement');
 assert.deepEqual(example.data.fixture,f);
 assert.deepEqual(Object.fromEntries(example.data.examples.map(e=>[e.id,e.data])),f);
});

test('cost-stage facts determine classification separately from ownership allocation',()=>{
 const c=f.cost_stage;
 assert.equal(c.items.filter(x=>x.capitalized).reduce((s,x)=>s+x.cents,0),c.capitalized_cents);
 assert.equal(c.items.filter(x=>!x.capitalized).reduce((s,x)=>s+x.cents,0),c.expense_cents);
 assert.equal(c.capitalized_cents+c.expense_cents,c.invoice_total_cents);
 const j=f.joint_cost,entry=j.classification_branch.entry;
 assert.equal(entry.credit.own_cost_pending_classification,j.operator_cost_cents);
 assert.equal(entry.debit.own_production_maintenance_expense,j.operator_cost_cents);
 assert.match(j.classification_branch.counterexample,/retain pending classification/);
 assert.ok(c.items.some(x=>x.category==='own-account exploration'&&x.capitalized));
 assert.ok(c.items.some(x=>x.category==='production maintenance'&&!x.capitalized));
});
