import test from 'node:test';
import assert from 'node:assert/strict';
import {executeAgent} from '../dist/internal/agent.mjs';
import {records,coverage} from '../dist/internal/corpus.mjs';
const byId=new Map(records.map(record=>[record.id,record]));
test('utilities retrieval exposes source pointers and keeps merchant and provider roles separate',()=>{
 for(const [q,id,kind]of [['FERC electric utility metered billing plant','guide-utilities-us-regulated-close','guide'],['Account 555 purchased power','src_utilities_ferc_account_555','source']])assert.ok(executeAgent('search',{q,kind,limit:10}).results.some(row=>row.id===id),id);
 const result=executeAgent('get',{id:'guide-utilities-us-regulated-close',limit:20});
 assert.ok(result.passages.some(p=>p.source_pointers.length));
 const example=byId.get('example-utilities-billing-plant-close').data;
 assert.ok(example.scope_counterexamples.some(row=>row.id==='UNREG-MERCHANT'&&/does not establish/.test(row.treatment)));
 assert.ok(example.scope_counterexamples.some(row=>row.id==='SERVICE-PROVIDER'&&/supplier\/service/.test(row.treatment)));
 assert.ok(!coverage.cell('23','q-rate-regulation').assessments.some(a=>a.evidence_record_ids.includes('guide-utilities-us-regulated-close')));
 for(const q of byId.get('guide-utilities-us-regulated-close').data.research_questions)for(const source of q.source_ids)assert.ok(byId.get(source)?.source_url,source);
});
test('utilities quantities and rates independently reproduce the proposed ledger bridges',()=>{
 const e=byId.get('example-utilities-billing-plant-close').data;
 for(const event of e.events.filter(row=>row.quantity!==undefined))assert.equal(event.quantity*event.rate,event.amount,event.id);
 const r=e.reconciliation;
 assert.equal(r.customer_sales_billed.quantity*r.customer_sales_billed.rate,r.customer_sales_billed.amount);
 assert.equal(r.customer_sales_billed.amount+r.customer_sales_unbilled.amount,r.customer_sales_total);
 assert.equal(e.numeric_counterexamples[0].difference.quantity*r.customer_sales_unbilled.rate,e.numeric_counterexamples[0].difference.amount_at_synthetic_rate);
 assert.equal(r.customer_sales_total-r.purchased_power,e.numeric_counterexamples[1].difference.net_if_wrongly_combined);
 assert.ok(e.proposed_entries.every(entry=>entry.status.includes('synthetic')&&entry.status.includes('hold')));
});
