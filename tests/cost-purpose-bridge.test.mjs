import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {executeAgent} from '../dist/internal/agent.mjs';
import {getRecord} from '../dist/internal/corpus.mjs';

const guideId='guide-cost-purpose-bridge', exampleId='example-cost-purpose-bridge';
const base='c1029b36f76b74a9e5a6bf44cc798c81cddcc9cf';
const read=file=>JSON.parse(fs.readFileSync(file));
const guide=()=>getRecord(guideId);
const textOf=section=>executeAgent('get',{id:guideId,section,limit:20}).passages.map(p=>p.text).join('\n');

test('four purpose questions retrieve their evidence and retain separate tax and authority gaps',()=>{
  for(const query of ['cost purpose normal capacity','cost purpose standard costs','cost purpose avoidable common','cost purpose federal contract']) {
    assert.ok(executeAgent('search',{q:query,kind:'guide',limit:5}).results.some(r=>r.id===guideId),query);
  }
  const questions=guide().data.research_questions;
  assert.equal(questions.length,4);
  for(const q of questions) {
    assert.equal(q.assessment_status,'partial');
    assert.equal(q.professional_review,'not-performed');
    assert.equal(q.empirical_support,'not-established');
    assert.ok(q.source_ids.length);
    for(const loc of q.source_locators)assert.equal(loc.url,getRecord(loc.source_id).source_url);
    assert.deepEqual(read('data/coverage/research-questions.json').questions.find(r=>r.id===q.id),q);
  }
  assert.match(textOf('data.research_questions'),/Current consolidated ASC 330 was not independently reviewed/);
  const tax=guide().data.purpose_routes.find(p=>p.purpose==='Tax cost');
  assert.equal(tax.status,'unresolved');assert.equal(tax.answer,null);
});

test('normal capacity and allocation reuse the existing bounded answers without replacing them',()=>{
  const route=guide().data.research_questions[0].reuses;
  assert.equal(route.record_id,'guide-manufacturing-conversion');
  const answer=route.pointer.slice(1).split('/').reduce((v,k)=>v[k],getRecord(route.record_id));
  assert.match(answer.answer,/historical original US amendment/);
  assert.equal(guide().data.research_questions[0].example_id,'example-aa-i101-manufacturing-conversion');
  assert.ok(guide().related_ids.includes('guide-q-cost-allocation'));
  assert.ok(guide().source_ids.includes('src_far_31203_indirect_costs'));
});

test('normal and abnormal variances reconcile for unfavorable and favorable cases; missing attribution stays unknown',()=>{
  const d=getRecord(exampleId).data.standard_cost;
  assert.equal(d.units_sold+d.units_remaining,d.units_completed);
  for(const v of [d,d.favorable_sensitivity]) {
    const unit=d.standard_unit_cost+v.normal_variance/d.units_completed;
    assert.equal(v.ending_inventory,d.units_remaining*unit);
    assert.equal(v.cost_of_sales,d.units_sold*unit);
    assert.equal(v.total_period_expense,v.cost_of_sales+d.abnormal_period_cost);
    assert.equal(v.ending_inventory+v.total_period_expense,v.actual_total);
    assert.notEqual(v.ending_inventory,d.units_remaining/d.units_completed*v.actual_total,'abnormal cost must not be spread to stock');
  }
  assert.equal(d.missing_variance_classification.inventory_adjustment,null);
});

test('continuing common costs are not closure savings; explicit alternative use can reverse the decision',()=>{
  const d=getRecord(exampleId).data.decision;
  assert.equal(d.revenue-d.variable_cost,d.contribution_margin);
  assert.equal(d.avoidable_fixed_cost+d.continuing_traceable_fixed_cost,d.traceable_fixed_cost);
  assert.equal(d.contribution_margin-d.traceable_fixed_cost-d.allocated_common_cost,d.fully_allocated_profit);
  assert.equal(d.avoidable_fixed_cost-d.contribution_margin,d.closure_income_change);
  assert.equal(d.continuing_common_cost,d.allocated_common_cost);
  assert.equal(d.closure_income_change,-260000);
  assert.equal(d.closure_income_change+d.alternative_use_sensitivity.additional_contribution,d.alternative_use_sensitivity.closure_income_change);
  assert.ok(d.alternative_use_sensitivity.closure_income_change>0);
  assert.equal(d.missing_avoidability.closure_income_change,null);
});

test('contract arithmetic cannot approve a claim, billing, revenue or tax result',()=>{
  const d=getRecord(exampleId).data, c=d.contract;
  assert.equal(c.standard_cost+c.variance,c.total_allocable_cost);
  assert.equal(c.total_allocable_cost-c.assumed_exclusion,c.candidate_after_exclusion);
  assert.notEqual(c.candidate_after_exclusion,c.total_allocable_cost);
  for(const key of ['approved_claim','billing_amount','revenue'])assert.equal(c[key],null);
  assert.equal(d.tax_cost.amount,null);
  assert.match(guide().data.research_questions[3].answer,/selected CAS.*without full CAS coverage/);
  assert.match(guide().data.research_questions[3].answer,/federal-assistance awards are separate/);
});

test('additions preserve all prior records, source rights, mappings, assessments and release bytes',()=>{
  const atBase=file=>JSON.parse(execFileSync('git',['show',`${base}:${file}`],{encoding:'utf8',maxBuffer:64*1024*1024}));
  for(const kind of ['source','guide','example','term']) {
    const current=new Map(read(`data/corpus/${kind}.json`).map(r=>[r.id,r]));
    for(const old of atBase(`data/corpus/${kind}.json`)){
      const retained=structuredClone(current.get(old.id));
      // The later controller increment appends one separately reviewed brief;
      // all pre-existing fields still satisfy this exact preservation contract.
      if(old.id==='guide-family-office-us-accounting'){
        assert.deepEqual(retained.source_ids,[...old.source_ids,'src_fo_ref_sec_family_rule']);retained.source_ids.pop();
        assert.equal(retained.data.editorial_brief.reading.review.reviewed_at,'2026-09-30');
        delete retained.data.editorial_brief;
      }
      if(old.id==='src_fo_ref_sec_family_rule'){
        const batch='family-office-ecfr-2026-09-30';
        assert.equal(retained.data.supplemental_reviews.filter(r=>r.batch===batch).length,1);
        retained.data.supplemental_reviews=retained.data.supplemental_reviews.filter(r=>r.batch!==batch);
        if(!Object.hasOwn(old.data,'supplemental_reviews'))delete retained.data.supplemental_reviews;
      }
      assert.deepEqual(retained,old,old.id);
    }
  }
  const mappings=read('data/coverage/mapping-overrides.json').records;
  for(const [id,old] of Object.entries(atBase('data/coverage/mapping-overrides.json').records))assert.deepEqual(mappings[id],old,id);
  const assessments=read('data/coverage/assessments.json').assessments;
  for(const old of atBase('data/coverage/assessments.json').assessments)assert.deepEqual(assessments.find(a=>a.id===old.id),old,old.id);
  const added=assessments.filter(a=>a.named_question_id?.startsWith('rq-cost-purpose-'));
  assert.equal(added.length,4);
  for(const a of added){assert.equal(a.status,'partial');assert.equal(a.scope_kind,'shared-context');assert.equal(a.industry_code,null);}
  const changed=execFileSync('git',['diff',base,'--name-only','--','data/releases','data/coverage/snapshots'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
  const oldFiles=new Set(execFileSync('git',['ls-tree','-r','--name-only',base,'data/releases','data/coverage/snapshots'],{encoding:'utf8'}).trim().split('\n'));
  assert.deepEqual(changed.filter(f=>oldFiles.has(f)&&f!=='data/releases/index.json'),[]);
});

test('edition-distinct sources have dated passage evidence and no external reuse upgrade',()=>{
  const sources=read('data/corpus/source.json').filter(r=>r.id.startsWith('src_cost_'));
  assert.equal(sources.length,5);
  for(const source of sources) {
    assert.equal(source.reviewed_at,'2026-09-28');
    assert.equal(source.rights.full_text_stored,false);
    if(source.id!=='src_cost_openstax_keep_discontinue')assert.equal(source.rights.source_permission_scope,null);
    assert.equal(source.data.source_review.material_read,true);
    assert.equal(source.data.source_review.checked_url,source.source_url);
    assert.ok(source.data.source_review.locator);
  }
  const openstax=getRecord('src_cost_openstax_keep_discontinue');
  assert.equal(openstax.rights.source_status,'license-observed');
  assert.equal(openstax.rights.source_license,'CC-BY-NC-SA-4.0');
  assert.equal(openstax.rights.source_license_url,'https://creativecommons.org/licenses/by-nc-sa/4.0/');
  assert.match(openstax.rights.source_permission_scope,/no such permission is established/);
  assert.match(openstax.data.source_review.rights_note,/CC BY-NC-SA 4.0/);
  assert.match(openstax.data.source_review.rights_note,/prior written permission/);
  assert.match(getRecord('src_cost_kpmg_inventory_2025').data.edition,/October 2025/);
});

test('decision and contract questions and sources do not earn inventory-family coverage',()=>{
  const questions=guide().data.research_questions;
  for(const q of questions.slice(0,2))assert.ok(q.family_ids.includes('q-inventory'));
  for(const q of questions.slice(2))assert.deepEqual(q.family_ids,['q-cost-allocation']);
  const assessments=read('data/coverage/assessments.json').assessments;
  for(const q of questions.slice(2))assert.deepEqual(assessments.find(a=>a.named_question_id===q.id).family_ids,['q-cost-allocation']);
  const ids=['src_cost_openstax_keep_discontinue','src_cost_far_312011','src_cost_far_312012','src_cost_far_312014','term-avoidable-cost','term-continuing-common-cost','term-allocability-allowability'];
  const mappings=read('data/coverage/record-mappings.json').mappings;
  for(const id of ids){
    assert.deepEqual(mappings.find(m=>m.record_id===id).question_mappings.map(q=>q.question_id),['q-cost-allocation']);
    assert.ok(!getRecord(id).topics.includes('Inventory, conversion costs and cost of sales'));
  }
});
