import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {editorialHash, editorialReviewReport} from '../scripts/editorial-review.mjs';
import {loadRecords, validateSchema} from '../scripts/validate.mjs';

const records=loadRecords(), byId=new Map(records.map(r=>[r.id,r]));
const guide=byId.get('guide-family-office-payroll-roles');
const cases=new Map(guide.data.synthetic_cases.map(c=>[c.id,c]));

test('payroll role guide resolves its schema, bounded source checks and rights',()=>{
 validateSchema(guide,JSON.parse(readFileSync('schemas/record.schema.json','utf8')),guide.id);
 assert.deepEqual(guide.source_ids,['src_aa_i115_irs_household_employer','src_irs_pub15_2026']);
 assert.equal(guide.data.professional_review,'not-performed');
 assert.equal(guide.data.empirical_support,'not-established');
 assert.equal(guide.data.coverage_status,'bounded-supplement-not-formally-assessed');
 assert.equal(guide.rights.full_text_stored,false);
 for(const check of guide.data.selected_source_checks){
  const source=byId.get(check.source_id);assert.equal(source.kind,'source');
  assert.equal(source.rights.full_text_stored,false);
  assert.equal(check.observed_at,'2026-09-30');assert.match(check.edition,/2026/);
  assert.equal(check.material_read,true);assert.ok(check.locators.length>=2);assert.ok(check.limit);
 }
 const household=guide.data.selected_source_checks.find(s=>s.source_id==='src_aa_i115_irs_household_employer');
 assert.equal(household.page_updated_at,'2026-04-30');
 assert.ok(household.locators.some(l=>l.includes('100086724')));
 assert.ok(household.locators.some(l=>l.includes('100086762')));
 assert.ok(household.locators.some(l=>l.includes('100086772')));
});

test('identical home location does not collapse office and household branches',()=>{
 const h=cases.get('H'),o=cases.get('O');assert.equal(h.work_location,o.work_location);
 assert.notEqual(h.service_nature,o.service_nature);assert.notEqual(h.research_route,o.research_route);
 assert.equal(h.conditional_employer,'individual-H');assert.equal(o.conditional_employer,'company-O');
 for(const c of [h,o]){
  assert.equal(c.conditional_employer,c.control_holder);
  assert.notEqual(c.conditional_employer,c.payment_administrator);
  assert.equal(c.route_status,'conditional-on-stipulated-facts');
  assert.equal(c.filing_route,null);assert.equal(c.business_deduction,null);
  assert.ok(c.facts.some(f=>f.includes('right to control')));
 }
 assert.match(h.facts.join(' '),/administrative-only/);
 assert.match(o.facts.join(' '),/household duties are expressly excluded/);
});

test('conflicting mixed-duty evidence retains unknown employer and filing route',()=>{
 const u=cases.get('U');
 assert.equal(u.route_status,'unresolved');
 for(const key of ['control_holder','payment_account_owner','conditional_employer','research_route','filing_route','business_deduction'])assert.equal(u[key],null,key);
 assert.match(u.facts.join(' '),/offer letter names O/);assert.match(u.facts.join(' '),/instructions come from H/);
 assert.ok(u.missing_evidence.some(e=>e.includes('right-to-control')));
 assert.ok(u.missing_evidence.some(e=>e.includes('task/location/time')));
 assert.ok(u.missing_evidence.some(e=>e.includes('specialist disposition')));
 assert.match(u.boundary,/Do not assign legal employers by an hours split/);
});

test('reporting-option counterexample does not decide business labor or deduction',()=>{
 const f=cases.get('F');assert.equal(f.conditional_employer,'individual-B');
 assert.equal(f.service_nature,'household work');
 assert.equal(f.route_status,'conditional-on-stipulated-facts');
 assert.equal(f.filing_route,'business-employment-tax-reporting-option-stipulated-not-determined');
 assert.equal(f.business_deduction,null);
 assert.match(f.facts.join(' '),/individual B owns a business/);
 assert.match(f.facts.join(' '),/No assumption transfers that option to company O/);
 assert.match(f.boundary,/not an instruction to file/);
 assert.ok(f.missing_evidence.some(e=>e.includes('eligibility')));
});

test('reading table preserves all cases and declared evidence dependencies',()=>{
 assert.deepEqual([...cases.keys()],['H','O','U','F']);
 const brief=guide.data.editorial_brief, reading=brief.reading;
 assert.equal(reading.example.classification,'original-synthetic');
 assert.deepEqual(reading.example.rows,guide.data.synthetic_cases.map(c=>[
  `${c.id}: ${c.title}`,c.facts.join(' '),`${c.research_route??'Unresolved'} — ${c.boundary}`
 ]));
 for(const row of reading.example.rows)assert.equal(row.length,reading.example.columns.length);
 const dependencies=new Map(reading.review.dependencies.map(d=>[d.record_id,d.sha256]));
 assert.equal(dependencies.size,reading.review.dependencies.length);
 for(const id of [guide.id,...guide.source_ids,...guide.related_ids]){
  assert.ok(byId.has(id),id);assert.equal(dependencies.get(id),editorialHash(byId.get(id)),id);
 }
 for(const f of brief.findings)for(const id of f.source_ids)assert.ok(dependencies.has(id)&&guide.source_ids.includes(id));
 for(const c of cases.values())for(const id of c.source_ids)assert.ok(guide.source_ids.includes(id));
 assert.equal(editorialReviewReport(records).find(r=>r.record_id===guide.id).status,'dependencies-unchanged');
});
