import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {getRecord,recordMarkdown,records} from '../dist/internal/corpus.mjs';
import {executeAgent} from '../dist/internal/agent.mjs';
import {editorialReviewReport} from '../scripts/editorial-review.mjs';
import worker from './worker-fixture.mjs';
const id='workflow-family-office-entity-close',workflow=getRecord(id),bridge=workflow.data.reporting_bridge;
const sum=rows=>rows.reduce((a,b)=>a+b,0);

test('close policy extends the workflow without changing its accepted steps, sources or review',()=>{
 const original=JSON.parse(execFileSync('git',['show','caf023cbed4cd651274201708b45501ddc1aa0ad:data/corpus/workflow.json'],{encoding:'utf8',maxBuffer:32*1024*1024})).find(r=>r.id===id);
 const retained=structuredClone(workflow);
 for(const key of ['editorial_brief','reporting_policy','reporting_bridge'])delete retained.data[key];
 assert.deepEqual(retained,original);
 const reviews=editorialReviewReport(records).filter(r=>[id,'guide-family-office-us-accounting'].includes(r.record_id));
 assert.deepEqual(reviews.map(r=>r.record_id).sort(),[id,'guide-family-office-us-accounting'].sort());
 assert.ok(reviews.every(r=>r.status==='dependencies-unchanged'));
 const policy=workflow.data.reporting_policy;
 assert.equal(policy.classification,'original-editorial-proposal');
 assert.ok(policy.report_contract.every(field=>field.evidence&&field.stop));
 assert.ok(policy.specialist_triggers.length);
});

test('synthetic report derives totals from selected entity books and a matched reciprocal pair',()=>{
 const included=bridge.entities.filter(e=>e.included),p=bridge.presentation;
 assert.deepEqual(included.map(e=>e.id),['O','I']);
 const assets=sum(included.map(e=>e.cash_cents+e.interentity_receivable_cents+e.investment_carry_cents));
 const liabilities=sum(included.map(e=>e.external_liabilities_cents+e.interentity_payable_cents));
 assert.equal(p.before.assets_cents,assets);assert.equal(p.before.liabilities_cents,liabilities);
 assert.equal(p.before.net_assets_cents,assets-liabilities);
 const match=bridge.reciprocal_match;
 assert.equal(included.find(e=>e.id===match.receivable_entity).interentity_receivable_cents,match.amount_cents);
 assert.equal(included.find(e=>e.id===match.payable_entity).interentity_payable_cents,match.amount_cents);
 assert.equal(p.adjustment.asset_cents,-match.amount_cents);assert.equal(p.adjustment.liability_cents,-match.amount_cents);
 assert.equal(p.after.assets_cents,assets+p.adjustment.asset_cents);
 assert.equal(p.after.liabilities_cents,liabilities+p.adjustment.liability_cents);
 assert.equal(p.after.carrying_net_assets_cents,p.after.assets_cents-p.after.liabilities_cents);
 assert.equal(p.after.carrying_net_assets_cents,p.before.net_assets_cents);
 assert.equal(p.adjustment.entity_ledger_effect_cents,0);
 assert.equal(p.current_value_net_assets_cents,null);assert.equal(p.measurement_exception.current_value_cents,null);
 assert.ok(p.measurement_exception.source_date<bridge.period_end);
 const dollars=c=>`${c<0?'−':''}$${(Math.abs(c)/100).toLocaleString('en-US')}`;
 assert.deepEqual(workflow.data.editorial_brief.reading.example.rows,[
  ['Assets',dollars(p.before.assets_cents),dollars(p.adjustment.asset_cents),dollars(p.after.assets_cents)],
  ['Liabilities',dollars(p.before.liabilities_cents),dollars(p.adjustment.liability_cents),dollars(p.after.liabilities_cents)],
  ['Carrying-value net assets',dollars(p.before.net_assets_cents),'$0',dollars(p.after.carrying_net_assets_cents)],
  ['Current-value net assets','Unknown','Not inferred','Unknown']
 ]);
});

test('unmatched amounts, excluded counterparties and restricted cash do not become fabricated resolutions',()=>{
 const [mismatch,excluded,stale,visible]=bridge.counterexamples,l=bridge.liquidity;
 assert.equal(mismatch.receivable_cents-mismatch.payable_cents,mismatch.unexplained_difference_cents);
 assert.equal(mismatch.approved_elimination_cents,null);
 assert.ok(!excluded.included_entities.includes(excluded.payable_entity));assert.equal(excluded.elimination_cents,0);
 assert.equal(stale.current_value_net_assets_cents,null);
 assert.equal(l.opening_cash_cents+l.confirmed_inflows_cents-l.assumed_call_due_cents-l.external_debt_service_due_cents,l.projected_closing_cash_cents);
 assert.ok(l.projected_closing_cash_cents<0);
 assert.equal(visible.visible_cash_cents,sum(bridge.entities.map(e=>e.cash_cents)));
 assert.equal(visible.entity_I_projected_cash_cents,l.projected_closing_cash_cents);
 for(const value of [visible.authorized_transfer_cents,l.approved_external_funding_cents,l.office_cash_transfer_authority,l.trust_cash_transfer_authority])assert.equal(value,null);
 assert.ok(l.unfunded_commitment_cents>l.assumed_call_due_cents);
 // Commitment planning is not silently added to the recorded-liability bridge.
 assert.equal(bridge.presentation.after.liabilities_cents,sum(bridge.entities.filter(e=>e.included).map(e=>e.external_liabilities_cents)));
});

test('close-policy exports expose proposed practice, reconciled amounts and unresolved authority',async()=>{
 const response=await worker.fetch(new Request(`https://corpus.example/records/${id}`));assert.equal(response.status,200);
 const html=await response.text(),md=recordMarkdown(workflow);
 assert.ok(html.includes(workflow.data.editorial_brief.question));const anchor=workflow.data.editorial_brief.reading.example.anchor;assert.ok(html.includes(`id="${anchor}"`),'Worked example link target must exist');assert.ok(html.includes(`/records/${id}#${anchor}`));
 for(const value of ['$206,000','$200,000','$150,000','Unknown']){assert.ok(html.includes(value));assert.ok(md.includes(value));}
 const result=executeAgent('get',{id,section:'data.reporting_bridge',limit:20});
 assert.ok(result.passages.some(p=>p.source_pointers.some(s=>s.startsWith('/data/reporting_bridge/'))));
 const text=result.passages.map(p=>p.text).join('\n');
 assert.match(text,/unresolved-stale-value/);assert.match(text,/transfer_authority|transfer authority/);
 assert.equal(result.record.rights.full_text_stored,false);
});
