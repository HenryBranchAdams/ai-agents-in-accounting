import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {editorialHash} from '../scripts/editorial-review.mjs';
const id='example-family-office-four-entity-close';
const example=JSON.parse(readFileSync(new URL('../data/corpus/example.json',import.meta.url))).find(r=>r.id===id),lineage=example.data.tax_document_lineage;
const fields=['issuer_id','recipient_id','form_family','issuer_period_start','issuer_period_end'];
const keyOf=row=>fields.every(k=>row[k]!==null&&row[k]!==undefined)?JSON.stringify(fields.map(k=>row[k])):null;
// Test-side population derivation, not a shipped ingestion or tax decision engine.
function population(documents,decision){
 if(decision.selected_document_id===null)return {selected:null,amount:null};
 const reviewed=documents.filter(d=>decision.document_ids.includes(d.document_id));
 const matches=reviewed.filter(d=>keyOf(d)===keyOf(decision.key));
 const superseded=new Set(matches.map(d=>d.supersedes).filter(Boolean));
 const candidates=matches.filter(d=>!d.duplicate_of&&!superseded.has(d.document_id));
 assert.equal(candidates.length,1,'exactly one supported terminal version');
 assert.equal(candidates[0].document_id,decision.selected_document_id,'review and derived identity/version population agree');
 return {selected:candidates[0].document_id,amount:candidates[0].transcribed_item.amount_cents};
}

test('tax document lineage preserves the entire original family-office example',()=>{
 const baseline=JSON.parse(execFileSync('git',['show','caf023cbed4cd651274201708b45501ddc1aa0ad:data/corpus/example.json'],{encoding:'utf8',maxBuffer:32*1024*1024})).find(r=>r.id===id);
 const retained=structuredClone(example);delete retained.data.tax_document_lineage;delete retained.data.editorial_brief;
 assert.deepEqual(retained,baseline);assert.equal(lineage.classification,'original-synthetic');assert.equal(example.rights.full_text_stored,false);
 const self=example.data.editorial_brief.reading.review.dependencies.find(d=>d.record_id===id);assert.ok(self);assert.equal(self.sha256,editorialHash(example));
});

test('lineage derives one selected value independently of delivery order and preserves exclusions',()=>{
 const decision=lineage.review_decisions.find(d=>d.id==='REVIEW-CLEAN-2025'),handoff=lineage.handoff_populations.find(h=>h.id==='HANDOFF-CLEAN');assert.ok(decision&&handoff);
 const derived=population(lineage.documents,decision);
 assert.equal(derived.selected,handoff.selected_document_id);assert.equal(derived.amount,handoff.selected_transcribed_item_cents);
 assert.deepEqual(population([...lineage.documents].reverse(),decision),derived);
 assert.deepEqual(population([...lineage.documents].sort((a,b)=>b.received_on.localeCompare(a.received_on)),decision),derived);
 const previous=lineage.documents.find(d=>d.document_id===handoff.previous_handoff_document_id);assert.ok(previous);
 assert.equal(derived.amount-previous.transcribed_item.amount_cents,handoff.comparison_delta_cents);
 const sameKey=lineage.documents.filter(d=>keyOf(d)===keyOf(decision.key));
 assert.equal(sameKey.reduce((sum,d)=>sum+d.transcribed_item.amount_cents,0),3200000);
 assert.equal(derived.amount,1200000);assert.equal(handoff.comparison_delta_cents,200000);
 assert.deepEqual(new Set([handoff.selected_document_id,...handoff.retained_exclusions.map(e=>e.document_id)]),new Set(handoff.considered_document_ids));
 const byId=new Map(lineage.documents.map(d=>[d.document_id,d]));
 for(const exclusion of handoff.retained_exclusions){
  const doc=byId.get(exclusion.document_id);assert.ok(doc);
  if(exclusion.reason==='different-recipient')assert.notEqual(doc.recipient_id,handoff.key.recipient_id);
  else if(exclusion.reason==='different-issuer-period')assert.notEqual(doc.issuer_period_end,handoff.key.issuer_period_end);
  else if(exclusion.reason==='superseded-version')assert.equal(byId.get(derived.selected).supersedes,doc.document_id);
  else if(exclusion.reason==='duplicate-delivery-of-superseded-version')assert.equal(doc.duplicate_of,byId.get(derived.selected).supersedes);
  else assert.fail(`unknown exclusion ${exclusion.reason}`);
 }
 const later=byId.get('I-P-2024-v1');assert.ok(later.received_on>byId.get(derived.selected).received_on);assert.notEqual(keyOf(later),keyOf(decision.key));
 // Remove recipient or period discrimination: the mixed population becomes ambiguous.
 const wrongRecipient=structuredClone(lineage.documents);wrongRecipient.find(d=>d.document_id==='I-T-2025-v1').recipient_id='P';assert.throws(()=>population(wrongRecipient,decision),/terminal version/);
 const missingCorrection=structuredClone(lineage.documents);missingCorrection.find(d=>d.document_id==='I-P-2025-v2').supersedes=null;assert.throws(()=>population(missingCorrection,decision),/terminal version/);
});

test('ambiguous correction leaves current selection null while retaining prior handoff and unknown tax facts',()=>{
 const decision=lineage.review_decisions.find(d=>d.id==='REVIEW-CONFLICT'),conflict=lineage.handoff_populations.find(h=>h.id==='HANDOFF-CONFLICT');assert.ok(decision&&conflict);
 assert.deepEqual(population(lineage.documents,decision),{selected:null,amount:null});
 assert.equal(conflict.selected_document_id,null);assert.equal(conflict.selected_transcribed_item_cents,null);
 const history=lineage.handoff_populations.find(h=>h.id===conflict.historical_handoff_id);assert.ok(history);assert.equal(history.selected_document_id,conflict.prior_selected_document_id);
 const ambiguous=lineage.documents.find(d=>d.document_id===conflict.unresolved_document_ids[0]);assert.ok(ambiguous);
 assert.equal(keyOf(ambiguous),null);assert.equal(ambiguous.supersedes,null);assert.equal(ambiguous.reported_revision,'purported-correction');
 assert.ok(decision.unresolved_questions.length>=2);
 for(const handoff of lineage.handoff_populations)for(const field of ['recipient_reporting_year','taxable_amount_cents','outside_basis_cents'])assert.equal(handoff[field],null,field);
 const edition=lineage.negative_cases.find(c=>c.id==='edition-is-not-recipient-year');assert.ok(edition);assert.equal(edition.recipient_reporting_year,null);assert.notEqual(edition.form_edition,edition.issuer_period_end.slice(0,4));
});

test('lineage references are complete and duplicate and supersession relationships stay distinct and acyclic',()=>{
 const byId=new Map(lineage.documents.map(d=>[d.document_id,d]));assert.equal(byId.size,lineage.documents.length);
 const evidence=new Set(lineage.evidence_register.map(e=>e.id));assert.equal(evidence.size,lineage.evidence_register.length);assert.ok(lineage.evidence_register.every(e=>e.synthetic===true));
 assert.equal(new Set(lineage.documents.map(d=>d.delivery_id)).size,lineage.documents.length);
 for(const doc of lineage.documents){
  assert.ok(evidence.has(doc.synthetic_evidence_id));assert.ok(!(doc.duplicate_of&&doc.supersedes));
  for(const relation of ['duplicate_of','supersedes'])if(doc[relation]){const target=byId.get(doc[relation]);assert.ok(target);assert.notEqual(target.document_id,doc.document_id);assert.equal(keyOf(doc),keyOf(target));}
  const visited=new Set([doc.document_id]);let cursor=doc;
  while(cursor.duplicate_of||cursor.supersedes){const next=cursor.duplicate_of??cursor.supersedes;assert.ok(!visited.has(next),'acyclic version history');visited.add(next);cursor=byId.get(next);assert.ok(cursor);}
 }
 for(const decision of lineage.review_decisions){for(const docId of decision.document_ids)assert.ok(byId.has(docId));for(const evidenceId of decision.evidence_ids)assert.ok(evidence.has(evidenceId));}
 for(const handoff of lineage.handoff_populations){assert.ok(lineage.review_decisions.some(d=>d.id===handoff.review_decision_id));for(const docId of handoff.considered_document_ids)assert.ok(byId.has(docId));}
});

test('tax lineage exports and paginated retrieval retain amounts, identities and unresolved current selection',async()=>{
 const [{getRecord,recordMarkdown,records},{executeAgent},{default:worker}]=await Promise.all([import('../dist/internal/corpus.mjs'),import('../dist/internal/agent.mjs'),import('./worker-fixture.mjs')]);
 const built=getRecord(id);assert.deepEqual(built,example);const byId=new Map(records.map(r=>[r.id,r]));
 for(const d of built.data.editorial_brief.reading.review.dependencies){assert.ok(byId.has(d.record_id));assert.equal(editorialHash(byId.get(d.record_id)),d.sha256,d.record_id);}
 const response=await worker.fetch(new Request(`https://corpus.example/records/${id}`));assert.equal(response.status,200);const html=await response.text(),md=recordMarkdown(built);
 assert.ok(html.includes(built.data.editorial_brief.question));const anchor=built.data.editorial_brief.reading.example.anchor;assert.ok(html.includes(`id="${anchor}"`));assert.ok(html.includes(`/records/${id}#${anchor}`));
 for(const phrase of ['$12,000','$2,000','$32,000','current selection unknown']){assert.ok(html.includes(phrase),phrase);assert.ok(md.includes(phrase),phrase);}
 const passages=[];let cursor;const seen=new Set();
 do{const result=executeAgent('get',{id,section:'data.tax_document_lineage',limit:3,...(cursor?{cursor}:{})});passages.push(...result.passages);cursor=result.next_cursor;if(cursor){assert.ok(!seen.has(cursor));seen.add(cursor);assert.ok(seen.size<100);}}while(cursor);
 assert.ok(passages.some(p=>p.source_pointers.some(s=>s.startsWith('/data/tax_document_lineage/'))));
 const text=passages.map(p=>p.text).join('\n');for(const marker of ['I-P-2025-v1-copy','I-P-2025-v2','I-T-2025-v1','I-P-2024-v1','reassessment-required','outside_basis_cents'])assert.ok(text.includes(marker),marker);
});
