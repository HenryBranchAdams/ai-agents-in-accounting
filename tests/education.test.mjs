import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {records,coverage} from '../dist/internal/corpus.mjs';
import {executeAgent} from '../dist/internal/agent.mjs';
const byId=new Map(records.map(r=>[r.id,r]));
const guide=byId.get('guide-us-education-tuition-aid');
const fixture=byId.get('example-us-education-tuition-aid-clearing').data;
test('education billing, student aid and month-end ledger reconcile independently',()=>{
 const i=fixture.inputs,c=fixture.calculation;
 assert.equal(c.gross_billing,i.students*i.tuition_each);
 assert.equal(c.net_tuition_consideration,c.gross_billing-i.institutional_discount);
 assert.equal(c.earned_month_one,c.net_tuition_consideration*i.months_delivered/i.term_months);
 assert.equal(c.unearned_tuition,c.net_tuition_consideration-c.earned_month_one);
 assert.equal(c.student_receivable,c.net_tuition_consideration-i.student_cash-i.third_party_aid_applied);
 assert.equal(c.aid_clearing_end,i.aid_cash_received-i.third_party_aid_applied-i.aid_excess_disbursed);
 assert.equal(c.cash_net,i.student_cash+i.aid_cash_received-i.aid_excess_disbursed);
 assert.equal(c.cash_net+c.student_receivable,c.earned_month_one+c.unearned_tuition);
 const w=fixture.withdrawal_branch;
 assert.equal(w.tuition_refund_per_assumed_policy,w.independent_program_return_input+w.student_credit_paid);
 assert.equal(w.aid_payment-w.independent_program_return_input-w.student_credit_paid,w.tuition_retained);
 assert.notEqual(w.tuition_refund_per_assumed_policy,w.independent_program_return_input);
 assert.match(w.limit,/Not an R2T4 calculator/);
});
test('education source and framework retrieval preserve program-year and authority boundaries',()=>{
 const result=executeAgent('get',{id:guide.id,limit:20});
 assert.equal(result.record.id,guide.id);
 for(const q of guide.data.research_questions){
  assert.ok(q.source_locators.length);
  for(const loc of q.source_locators)assert.ok(byId.get(loc.source_id)?.source_url);
 }
 assert.ok(guide.data.roles.some(r=>r.role==='public state/local institution'&&r.framework.includes('GASB')));
 const publicQuestion=guide.data.research_questions.find(q=>q.id==='rq-us-education-framework-routing');
 assert.match(publicQuestion.answer,/No\./);
 assert.match(publicQuestion.answer,/do not automatically apply/);
 const tuition=guide.data.research_questions.find(q=>q.id==='rq-us-education-tuition-term');
 assert.match(tuition.answer,/assumes/);
 assert.match(guide.data.remaining_gaps.join(' '),/2026-2027/);
 for(const id of ['src_education_fsa_2526_disbursement','src_education_fsa_2526_withdrawal','src_education_gasb35']){
  const s=byId.get(id); assert.equal(s.rights.full_text_stored,false);assert.equal(s.rights.source_status,'unknown');
 }
 const education=coverage.cell('611','q-revenue');
 assert.ok(education.assessments.some(a=>a.id==='coverage-us-education-q-revenue-2026-09-18'&&a.status==='partial'));
 assert.ok(!coverage.cell('23','q-revenue').assessments.some(a=>a.id==='coverage-us-education-q-revenue-2026-09-18'));
 const registry=JSON.parse(fs.readFileSync('data/coverage/research-questions.json','utf8')).questions;
 for(const q of guide.data.research_questions){const r=registry.find(x=>x.id===q.id);assert.deepEqual(r.source_locators,q.source_locators);assert.equal(r.record_id,guide.id);}
});
