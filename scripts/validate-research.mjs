import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=f=>JSON.parse(fs.readFileSync(f));
export function validateResearch(records){
 const ids=new Map(records.map(r=>[r.id,r])),t=read('data/coverage/topology.json');
 const families=new Set(t.question_families.map(q=>q.id)),subsectors=new Set(t.industry_backbone.nodes.filter(n=>n.level==='subsector').map(n=>n.code)),leaves=new Set(t.industry_backbone.nodes.filter(n=>n.level==='us-industry').map(n=>n.code));
 const questions=read('data/coverage/research-questions.json').questions,profiles=read('data/coverage/subsector-profiles.json').profiles,screen=read('data/coverage/subsector-screening.json'),leafReviews=read('data/coverage/industry-exception-reviews.json').reviews;
 assert.equal(new Set(questions.map(q=>q.id)).size,questions.length);
 const qids=new Set(questions.map(q=>q.id));
 for(const q of questions){
  assert.ok(ids.has(q.record_id));q.family_ids.forEach(f=>assert.ok(families.has(f),`${q.id}: ${f}`));
  const actual=q.pointer.split('/').slice(1).reduce((x,k)=>x?.[k],ids.get(q.record_id));
  assert.equal(actual?.id,q.id);assert.equal(actual.question,q.question);assert.ok(actual.answer&&q.scope&&q.remaining_gaps.length,`Incomplete question ${q.id}`);
  q.source_ids.forEach(id=>assert.equal(ids.get(id)?.kind,'source',`${q.id}: missing source ${id}`));
  for(const d of t.depth_dimensions)assert.ok(['present','partial','missing','not-assessed','not-applicable'].includes(q.dimensions[d.id]));
 }
 assert.deepEqual(new Set(profiles.map(p=>p.code)),subsectors);assert.equal(profiles.length,96);
 for(const p of profiles)assert.ok(ids.has(p.guide_id)&&p.source_locator&&p.priority_questions.length);
 assert.equal(screen.cells.length,5952);assert.equal(new Set(screen.cells.map(c=>c.id)).size,5952);
 for(const code of subsectors)assert.deepEqual(new Set(screen.cells.filter(c=>c.industry_code===code).map(c=>c.family_id)),families);
 const leafIds=new Set(leafReviews.map(l=>l.id));
 for(const c of screen.cells){assert.ok(c.rationale&&c.required_facts.length&&c.scope_counterexample);c.named_question_ids.forEach(id=>assert.ok(qids.has(id)));c.leaf_review_ids.forEach(id=>assert.ok(leafIds.has(id)));if(c.applicability==='excluded-for-stated-role')assert.ok(c.exclusion_reopen_trigger&&!c.open_question);else assert.ok(c.open_question&&c.evidence_outcome&&c.named_question_ids.length);}
 assert.equal(leafReviews.length,1012);assert.deepEqual(new Set(leafReviews.map(l=>l.industry_code)),leaves);
 for(const l of leafReviews){assert.ok(subsectors.has(l.subsector_code));assert.ok(l.definition_locator&&l.rationale&&l.classification_facts&&l.accounting_evidence_outcome);l.question_ids.forEach(q=>assert.ok(families.has(q),`${l.id}: ${q}`));l.evidence_record_ids.forEach(id=>assert.ok(ids.has(id)));assert.ok(l.remaining_gaps.length);}
 const source=read('data/reviews/source-reviews.json').reviews,editorial=read('data/reviews/editorial-reviews.json').reviews;
 assert.equal(source.length,488);assert.equal(editorial.length,227);assert.equal(new Set([...source,...editorial].map(r=>r.record_id)).size,715);
 for(const r of [...source,...editorial])assert.ok(ids.has(r.record_id)&&r.disposition);
 for(const r of read('data/coverage/classification-relationships.json').relationships){assert.ok(r.left.edition&&r.right.edition&&r.relationship_type&&r.limits.length);r.source_ids.forEach(id=>assert.equal(ids.get(id)?.kind,'source'));}
 return{named_questions:questions.length,profiles:profiles.length,screening_pairs:screen.cells.length,leaf_reviews:leafReviews.length,inherited_dispositions:715};
}
