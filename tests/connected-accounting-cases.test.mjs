import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateSchema} from '../scripts/validate.mjs';
const examples=JSON.parse(fs.readFileSync('data/corpus/example.json'));
const ids=['example-connected-purchase-to-payment','example-connected-processor-settlement'];
const cases=ids.map(id=>examples.find(r=>r.id===id));
function replay(data,cutoff){
 const accounts=new Set(Object.keys(data.chart_of_accounts));
 const balances=Object.fromEntries(Object.entries(data.opening_balances_minor).map(([key,value])=>{assert.ok(accounts.has(key)&&Number.isSafeInteger(value));return[key,BigInt(value)];}));
 const documents=new Map(data.documents.map(d=>[d.id,d]));assert.equal(documents.size,data.documents.length);
 const events=new Map(data.events.map(e=>[e.id,e]));assert.equal(events.size,data.events.length);
 assert.equal(new Set(data.journals.map(j=>j.id)).size,data.journals.length);
 for(const e of events.values())for(const id of e.document_ids)assert.ok(documents.has(id),`Missing event evidence ${id}`);
 for(const j of data.journals){
  const e=events.get(j.event_id);assert.ok(e,`Missing event ${j.event_id}`);assert.equal(j.date,e.date);
  assert.ok(j.document_ids.length);for(const id of j.document_ids)assert.ok(documents.has(id)&&e.document_ids.includes(id),`Missing journal evidence ${id}`);
  let total=0n;
  for(const line of j.lines){
   assert.ok(accounts.has(line.account));
   assert.ok(Number.isSafeInteger(line.debit_minor)&&Number.isSafeInteger(line.credit_minor));
   assert.ok(line.debit_minor>=0&&line.credit_minor>=0&&(line.debit_minor===0)!==(line.credit_minor===0));
   const amount=BigInt(line.debit_minor)-BigInt(line.credit_minor);total+=amount;
   if(j.date<=cutoff)balances[line.account]+=amount;
  }
  assert.equal(total,0n,`Unbalanced ${j.id}`);
 }
 assert.equal(Object.values(balances).reduce((sum,n)=>sum+n,0n),0n);
 return Object.fromEntries(Object.entries(balances).map(([key,value])=>{assert.ok(value<=BigInt(Number.MAX_SAFE_INTEGER)&&value>=BigInt(Number.MIN_SAFE_INTEGER));return[key,Number(value)];}));
}
test('connected case baselines replay exact declared period balances with document and event lineage',()=>{
 const schema=JSON.parse(fs.readFileSync('schemas/record.schema.json'));
 for(const record of cases){
  assert.ok(record);validateSchema(record,schema,record.id);
  assert.equal(record.data.observed_api_behavior,'none');assert.equal(record.data.professional_review,'not performed');
  for(const [date,expected]of Object.entries(record.data.expected_period_balances_minor))assert.deepEqual(replay(record.data,date),expected,`${record.id} at ${date}`);
  for(const r of record.data.reconciliations)for(const id of r.documents)assert.ok(record.data.documents.some(d=>d.id===id));
 }
});
test('purchase population, stock and bank controls reconcile independently of journal balancing',()=>{
 const data=cases[0].data,docs=Object.fromEntries(data.documents.map(d=>[d.id,d.content]));
 assert.equal(docs['A-R1'].accepted_units+docs['A-R2'].accepted_units,docs['A-PO1'].units);
 assert.equal((docs['A-R1'].accepted_units+docs['A-R2'].accepted_units-docs['A-RET1'].returned_units)*docs['A-PO1'].unit_price_minor,90000);
 assert.equal(docs['A-I1'].total_minor+docs['A-I2'].total_minor-docs['A-CN1'].amount_minor-docs['A-BANK1'].debit_minor-docs['A-BANK2'].debit_minor,0);
 assert.equal(docs['A-STMT-JUNE'].opening_minor-docs['A-BANK1'].debit_minor-docs['A-BANK2'].debit_minor,docs['A-STMT-JUNE'].closing_minor);
 assert.equal(replay(data,'2026-05-30').supplier_credit_receivable,10000);
 assert.equal(replay(data,'2026-05-31').supplier_credit_receivable,0);
 assert.equal(replay(data,'2026-06-02').bank,200000,'submitted instruction is not bank settlement');
});
test('processor controls separate refund request, availability, payout and bank settlement',()=>{
 const data=cases[1].data;
 assert.equal(replay(data,'2026-04-01').refund_payable,-10000);
 assert.equal(replay(data,'2026-04-01').processor_clearing,97000);
 assert.equal(replay(data,'2026-04-02').cash_in_transit,87000);
 assert.equal(replay(data,'2026-04-02').bank,0);
 assert.equal(replay(data,'2026-04-03').bank,87000);
 const final=replay(data,'2026-06-30');assert.equal(final.bank,100000-10000-3000-1500);
 assert.equal(final.disputed_claim,0);assert.equal(final.processor_clearing,0);assert.equal(final.cash_in_transit,0);
});
test('missing evidence, duplicate journals and unsafe arithmetic are rejected',()=>{
 for(const defect of ['document','duplicate','fraction']){
  const data=structuredClone(cases[0].data);
  if(defect==='document')data.documents=data.documents.filter(d=>d.id!=='A-R1');
  if(defect==='duplicate')data.journals.push(data.journals[0]);
  if(defect==='fraction')data.journals[0].lines[0].debit_minor=60000.1;
  assert.throws(()=>replay(data,'2026-06-30'));
 }
});

test('purchase alternatives remain separate and expose unresolved facts without plugs',()=>{
 const data=cases[0].data;
 assert.equal(data.alternative_branches.length,7);
 for(const branch of data.alternative_branches){
  const selected=structuredClone(data);
  selected.journals=branch.baseline_journal_ids.map(id=>data.journals.find(j=>j.id===id));assert.ok(selected.journals.every(Boolean));
  selected.journals.push(...(branch.additional_journals||[]));
  selected.documents=selected.documents.filter(doc=>!(branch.excluded_baseline_document_ids||[]).includes(doc.id));
  selected.documents.push(...(branch.additional_documents||[]));
  selected.events.push(...(branch.additional_events||[]));
  const usedEvents=new Set(selected.journals.map(j=>j.event_id));
  selected.events=selected.events.filter(event=>usedEvents.has(event.id));
  assert.deepEqual(replay(selected,branch.as_of),branch.expected_balances_minor,branch.id);
  assert.ok(branch.unresolved_item&&branch.decision&&branch.changed_fact);
  for(const id of branch.evidence_document_ids)assert.ok(selected.documents.some(d=>d.id===id));
  if(branch.prior_period_state)assert.deepEqual(replay(selected,branch.prior_period_state.as_of),branch.prior_period_state.expected_balances_minor);
 }
 const uncertain=data.alternative_branches.find(b=>b.id==='A-ALT-UNCERTAIN-PAYMENT');
 assert.equal(uncertain.synthetic_exchange.known_result,'unknown');
 assert.equal(uncertain.synthetic_exchange.response,null);
});

test('processor alternatives preserve settlement timing, duplicate identity and unresolved valuation',()=>{
 const data=cases[1].data;
 assert.equal(data.alternative_branches.length,6);
 for(const branch of data.alternative_branches){
  const selected=structuredClone(data);
  selected.journals=branch.baseline_journal_ids.map(id=>data.journals.find(j=>j.id===id));assert.ok(selected.journals.every(Boolean));
  selected.journals.push(...(branch.additional_journals||[]));
  selected.documents=selected.documents.filter(doc=>!(branch.excluded_baseline_document_ids||[]).includes(doc.id));
  selected.documents.push(...(branch.additional_documents||[]));selected.events.push(...(branch.additional_events||[]));
  const usedEvents=new Set(selected.journals.map(j=>j.event_id));selected.events=selected.events.filter(event=>usedEvents.has(event.id));
  assert.deepEqual(replay(selected,branch.as_of),branch.expected_balances_minor,branch.id);
  for(const id of branch.evidence_document_ids)assert.ok(selected.documents.some(doc=>doc.id===id));
  assert.ok(branch.unresolved_item&&branch.changed_fact&&branch.decision);
 }
 const byId=Object.fromEntries(data.alternative_branches.map(b=>[b.id,b]));
 assert.equal(byId['B-ALT-DELAYED-BANK'].expected_balances_minor.cash_in_transit,87000);
 assert.equal(byId['B-ALT-DISPUTE-LOST'].expected_balances_minor.bank,64000);
 assert.equal(byId['B-ALT-DISPUTE-LOST'].expected_balances_minor.dispute_loss,20000);
 assert.equal(byId['B-ALT-DISPUTE-UNRESOLVED'].expected_balances_minor.disputed_claim,20000);
 const duplicate=byId['B-ALT-DUPLICATE-NOTIFICATION'].synthetic_exchange;
 assert.equal(duplicate.original_event_id,duplicate.redelivered_event_id);assert.equal(duplicate.second_delivery_journal,null);
});

test('bounded extensions preserve dated knowledge, reciprocal scope and approved construction inputs',async()=>{
 const {createHash}=await import('node:crypto');
 const data=cases[0].data,extensions=data.bounded_extensions;assert.equal(extensions.length,3);
 const accrual=extensions.find(e=>e.id==='connected-accrual-resolution');
 const branch=data.alternative_branches.find(b=>b.id===accrual.linked_branch_id);
 const selected=structuredClone(data);
 selected.journals=branch.baseline_journal_ids.map(id=>data.journals.find(j=>j.id===id)).concat(branch.additional_journals);
 selected.documents.push(...branch.additional_documents);selected.events.push(...branch.additional_events);
 for(const knowledge of accrual.knowledge_by_date){
  const balances=replay(selected,knowledge.date);
  for(const [account,value]of Object.entries(knowledge.balances_minor))assert.equal(balances[account],value);
  for(const id of knowledge.known_document_ids){const doc=selected.documents.find(d=>d.id===id);assert.ok(doc&&doc.date<=knowledge.date);}
 }
 const ic=extensions.find(e=>e.id==='connected-intercompany-mismatch');
 const original=examples.find(r=>r.id===ic.linked_record_id).data;
 assert.deepEqual(ic.proposed_entity_correction,original.journals.find(j=>j.id==='S05'));
 assert.deepEqual(ic.consolidation_entries,original.elimination_journals.filter(j=>['E03','E04'].includes(j.id)));
 const combined={};
 for(const j of [original.journals.find(j=>j.id==='P05'),ic.proposed_entity_correction,...ic.consolidation_entries]){
  let total=0;for(const line of j.lines){const amount=line.debit_cents-line.credit_cents;combined[line.account]=(combined[line.account]||0)+amount;total+=amount;}assert.equal(total,0);
 }
 assert.deepEqual(combined,ic.expected_consolidated_service_balances_minor);
 assert.equal(ic.external_pool_cost_retained_minor,original.journals.find(j=>j.id==='P04').lines[0].debit_cents);
 const c=extensions.find(e=>e.id==='connected-construction-approval-change');
 const existing=examples.find(r=>r.id===c.linked_record_id).data.examples.find(e=>e.id===c.linked_example_id);
 assert.equal(existing.result.catch_up*100,c.expected.current_period_catch_up_minor);
 const approval=c.synthetic_approval,payload=JSON.parse(approval.serialized_payload);
 assert.equal(createHash('sha256').update(approval.serialized_payload).digest('hex'),approval.sha256);
 const revenue=BigInt(payload.cost_minor)*BigInt(payload.price_minor)/BigInt(payload.estimated_total_cost_minor);
 assert.equal(Number(revenue),c.expected.cumulative_revenue_minor);
 assert.equal(Number(revenue)-payload.prior_revenue_minor,c.expected.current_period_catch_up_minor);
 const changed=c.post_approval_change;
 assert.equal(Number(BigInt(payload.cost_minor)*BigInt(payload.price_minor)/BigInt(changed.estimated_total_cost_minor)),changed.cumulative_revenue_minor);
 assert.equal(changed.cumulative_revenue_minor-payload.prior_revenue_minor,changed.catch_up_minor);
 assert.notEqual(changed.catch_up_minor,payload.catch_up_minor);
 assert.notEqual(createHash('sha256').update(JSON.stringify({...payload,estimated_total_cost_minor:changed.estimated_total_cost_minor})).digest('hex'),approval.sha256);
});
