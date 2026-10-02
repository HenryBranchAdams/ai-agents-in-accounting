import {beforeApplicabilityAudit} from './fixtures/applicability-preservation.mjs';
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
 const routeLabels={'household-employment':'Household route only','office-employment':'Office route only','household-employment-with-stipulated-reporting-option':'Household; reporting choice stipulated'};
 assert.deepEqual(reading.example.rows.map(row=>row[0].split(':')[0]),[...cases.keys()]);
 assert.deepEqual(reading.example.rows.map(row=>row.slice(1)),guide.data.synthetic_cases.map(c=>[c.control_holder??'Unresolved',routeLabels[c.research_route]??'Unresolved']));
 assert.ok(reading.sections[0].paragraphs.some(p=>p.includes('supplied assumptions')));
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

test('payroll integration preserves prior guides and source evidence with one declared reading connection',()=>{
 const prior=JSON.parse(readFileSync('data/releases/2026-09-30.5/corpus.json','utf8')).records;
 const oldGuides=prior.filter(r=>r.kind==='guide'),oldGuideIds=new Set(oldGuides.map(r=>r.id));
 assert.equal(records.filter(r=>r.kind==='guide').length,oldGuides.length+2);
 // Payroll adds its declared guide; the later estate intake adds one separate discovery route.
 assert.deepEqual(records.filter(r=>r.kind==='guide'&&!oldGuideIds.has(r.id)).map(r=>r.id).sort(),[guide.id,'guide-estate-beneficiary-reporting-lineage'].sort());
 for(const old of oldGuides){
  const retained=structuredClone(byId.get(old.id));
  if(old.id==='guide-family-office-us-accounting'){
   const current=retained.data.editorial_brief,previous=old.data.editorial_brief;
   assert.deepEqual(current.reading_order,[...previous.reading_order,guide.id]);current.reading_order.pop();
   assert.deepEqual(current.reading.review.dependencies,[...previous.reading.review.dependencies,{record_id:guide.id,sha256:editorialHash(guide)}]);current.reading.review.dependencies.pop();
   assert.equal(current.reading.review.scope,previous.reading.review.scope+' The separately scoped payroll-role guide was checked for consistent household, company and payment-administrator boundaries; professional classification remains outside this orientation.');current.reading.review.scope=previous.reading.review.scope;
   const section=current.reading.sections.find(s=>s.title==='8. People and service operations'),priorSection=previous.reading.sections.find(s=>s.title===section.title);
   assert.deepEqual(section.paragraphs,[...priorSection.paragraphs,'The separate household and office payroll guide compares stipulated household work, company administration and unresolved mixed duties. Its selected 2026 IRS passages support research routing; home location, a paying account or Form 941 alone does not establish employer identity or a business deduction.']);section.paragraphs.pop();
  }
  assert.deepEqual(retained,old,old.id);
 }
 for(const old of prior.filter(r=>r.kind==='source'))assert.deepEqual(beforeApplicabilityAudit(byId.get(old.id),old),old,old.id);
});

test('payroll reading and bounded retrieval retain conditional roles and unresolved facts',async()=>{
 const[{getRecord,recordMarkdown},{executeAgent},{default:worker}]=await Promise.all([import('../dist/internal/corpus.mjs'),import('../dist/internal/agent.mjs'),import('./worker-fixture.mjs')]);
 const built=getRecord(guide.id);assert.deepEqual(built,guide);
 const response=await worker.fetch(new Request(`https://corpus.example/records/${guide.id}`));assert.equal(response.status,200);
 const html=await response.text(),md=recordMarkdown(built);
 for(const marker of ['Mixed or conflicting facts remain unresolved','U: mixed duties','Unresolved']){assert.ok(html.includes(marker),marker);assert.ok(md.includes(marker),marker);}
 const anchor=built.data.editorial_brief.reading.example.anchor;assert.ok(html.includes(`id="${anchor}"`));assert.ok(html.includes(`/records/${guide.id}#${anchor}`));
 for(const id of guide.source_ids)assert.ok(html.includes(`/records/${id}`),id);
 const directory=executeAgent('get',{id:guide.id,limit:1});assert.ok(directory.sections.some(s=>s.id==='data.synthetic_cases'));
 let cursor;const passages=[],seen=new Set();
 do{const result=executeAgent('get',{id:guide.id,section:'data.synthetic_cases',limit:2,...(cursor?{cursor}:{})});passages.push(...result.passages);cursor=result.next_cursor;if(cursor){assert.ok(!seen.has(cursor));seen.add(cursor);assert.ok(seen.size<100);}}while(cursor);
 const text=passages.map(p=>p.text).join('\n');for(const marker of ['conditional-on-stipulated-facts','unresolved','individual-H','company-O'])assert.ok(text.includes(marker),marker);
 assert.ok(passages.some(p=>p.source_pointers.some(pointer=>pointer.startsWith('/data/synthetic_cases/'))));
});
