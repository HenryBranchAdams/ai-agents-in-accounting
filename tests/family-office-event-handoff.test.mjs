import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {editorialHash} from '../scripts/editorial-review.mjs';
const id='control-family-office-ownership-payments';
const control=JSON.parse(readFileSync(new URL('../data/corpus/control.json',import.meta.url))).find(r=>r.id===id);
const packet=control.data.event_handoff;

test('event packet preserves the accepted control and marks original proposal scope',()=>{
 const baseline=JSON.parse(execFileSync('git',['show','caf023cbed4cd651274201708b45501ddc1aa0ad:data/corpus/control.json'],{encoding:'utf8',maxBuffer:32*1024*1024})).find(r=>r.id===id);
 const retained=structuredClone(control);delete retained.data.event_handoff;delete retained.data.editorial_brief;
 assert.deepEqual(retained,baseline);
 assert.equal(packet.classification,'original-editorial-proposal');
 assert.equal(control.rights.full_text_stored,false);
 assert.match(packet.completion_boundary,/only its expressly covered question/);
 const self=control.data.editorial_brief.reading.review.dependencies.find(d=>d.record_id===id);
 assert.ok(self);assert.equal(self.sha256,editorialHash(control));
});

test('proposed transfer keeps unsubstantiated facts unknown and does not invent a percentage or classification',()=>{
 const transfer=packet.synthetic_cases.find(c=>c.id==='EVENT-TRANSFER');assert.ok(transfer);
 assert.equal(transfer.event_status,'proposal-only');assert.equal(transfer.disposition,'incomplete-evidence');
 for(const field of ['executed_effective_date','total_units_outstanding','ownership_percentage','fair_value_cents','tax_basis_cents','legal_classification','accounting_treatment'])assert.equal(transfer.unknowns[field],null,field);
 assert.equal(transfer.responses.length,0);
 assert.deepEqual(transfer.open_question_ids,transfer.questions.map(q=>q.id));
 assert.equal(transfer.next_review_date,null);
 assert.match(transfer.conclusion,/no ownership change, recognition-date rule/);
});

test('partial event response closes only referenced questions and retains evidence history',()=>{
 for(const c of packet.synthetic_cases){
  const questions=new Set(c.questions.map(q=>q.id));assert.equal(questions.size,c.questions.length);
  assert.ok(c.questions.every(q=>q.recipient_roles.length>0));
  const evidence=[...c.evidence_register,...(c.additional_evidence??[])];
  const evidenceIds=new Set(evidence.map(e=>e.id));assert.equal(evidenceIds.size,evidence.length);
  assert.ok(evidence.every(e=>e.synthetic===true));
  for(const response of c.responses){
   assert.ok(response.respondent_role&&response.respondent_capacity);
   assert.ok(response.covered_question_ids.length>0);assert.ok(response.evidence_ids.length>0);
   for(const q of response.covered_question_ids)assert.ok(questions.has(q),q);
   for(const e of response.evidence_ids)assert.ok(evidenceIds.has(e),e);
  }
 }
 const d=packet.synthetic_cases.find(c=>c.id==='EVENT-DISTRIBUTION');assert.ok(d);
 assert.equal(d.amount_cents,400000);
 assert.deepEqual(d.initial_state.open_question_ids,d.questions.map(q=>q.id));
 assert.equal(d.initial_state.response_ids.length,0);
 const applied=d.reviewed_state.response_ids.map(id=>{const response=d.responses.find(r=>r.id===id);assert.ok(response,id);return response;});
 const answered=new Set(applied.flatMap(r=>r.covered_question_ids));
 assert.deepEqual([...answered],['DIST-INSTRUCTION']);
 assert.deepEqual(d.reviewed_state.open_question_ids,d.initial_state.open_question_ids.filter(q=>!answered.has(q)));
 assert.deepEqual(d.reviewed_state.open_question_ids,['DIST-ACCOUNTING','DIST-TAX','DIST-EXECUTION']);
 for(const field of ['payment_executed','principal_income_treatment','taxable_amount_cents'])assert.equal(d.reviewed_state[field],null,field);
 assert.equal(d.reviewed_state.disposition,'partially-reviewed');
 assert.equal(d.evidence_register.length,3);assert.equal(d.additional_evidence.length,2);
 const text=JSON.stringify(control.data.editorial_brief.reading.example.rows);
 assert.match(text,/10-unit/);assert.match(text,/\$4,000/);assert.match(text,/execution remain unknown/);
});

test('event handoff exports and bounded retrieval preserve partial response and discovery boundaries',async()=>{
 const [{getRecord,recordMarkdown,records},{executeAgent},{default:worker}]=await Promise.all([import('../dist/internal/corpus.mjs'),import('../dist/internal/agent.mjs'),import('./worker-fixture.mjs')]);
 const built=getRecord(id);assert.deepEqual(built,control);
 const byId=new Map(records.map(r=>[r.id,r]));
 for(const d of built.data.editorial_brief.reading.review.dependencies){assert.ok(byId.has(d.record_id),d.record_id);assert.equal(d.sha256,editorialHash(byId.get(d.record_id)),d.record_id);}
 for(const route of packet.event_routes)for(const routeId of route.record_ids)assert.ok(byId.has(routeId),routeId);
 for(const routeId of ['guide-fo-reference-fo-21','guide-fo-reference-fo-23','guide-fo-reference-fo-24'])assert.ok(byId.get(routeId).data.family_office_reference.questions.every(q=>q.status==='discovery-question-not-answered'));
 const response=await worker.fetch(new Request(`https://corpus.example/records/${id}`));assert.equal(response.status,200);
 const html=await response.text(),md=recordMarkdown(built);
 assert.ok(html.includes(built.data.editorial_brief.question));
 const anchor=built.data.editorial_brief.reading.example.anchor;assert.ok(html.includes(`id="${anchor}"`));assert.ok(html.includes(`/records/${id}#${anchor}`));
 for(const value of ['$4,000','Principal/income','execution remain unknown']){assert.ok(html.includes(value),value);assert.ok(md.includes(value),value);}
 let cursor;const passages=[];const seen=new Set();
 do{
  const result=executeAgent('get',{id,section:'data.event_handoff',limit:3,...(cursor?{cursor}:{})});
  passages.push(...result.passages);cursor=result.next_cursor;
  if(cursor){assert.ok(!seen.has(cursor),'pagination must advance');seen.add(cursor);assert.ok(seen.size<100);}
 }while(cursor);
 assert.ok(passages.some(p=>p.source_pointers.some(s=>s.startsWith('/data/event_handoff/'))));
 const retrieved=passages.map(p=>p.text).join('\n');
 for(const marker of ['proposal-only','partially-reviewed','DIST-ACCOUNTING','DIST-TAX','DIST-EXECUTION'])assert.ok(retrieved.includes(marker),marker);
});
