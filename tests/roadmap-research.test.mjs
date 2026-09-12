import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {records,coverage,search} from '../dist/internal/corpus.mjs';
import {executeAgent} from '../dist/internal/agent.mjs';
import worker from '../dist/server/index.js';
import {validateResearch} from '../scripts/validate-research.mjs';
import {validateSchema} from '../scripts/validate.mjs';
import {checkSources} from '../scripts/maintenance.mjs';
const read=f=>JSON.parse(fs.readFileSync(f));
const byId=new Map(records.map(r=>[r.id,r]));
const request=p=>worker.fetch(new Request('https://corpus.example'+p));

test('declared research population resolves to answers, sources and actual individual reviews',()=>{
 const counts=validateResearch(records);assert.equal(counts.inherited_dispositions,715);assert.equal(counts.named_questions,178);
 const schema=read('schemas/research.schema.json');
 const resolve=v=>Array.isArray(v)?v.map(resolve):v&&typeof v==='object'?(v.$ref?resolve(schema.$defs[v.$ref.split('/').at(-1)]):Object.fromEntries(Object.entries(v).filter(([k])=>k!=='$defs').map(([k,x])=>[k,resolve(x)]))):v;
 for(const file of ['research-questions','subsector-profiles','subsector-screening','industry-exception-reviews'])validateSchema(read(`data/coverage/${file}.json`),resolve(schema));
});

test('role gates and industry descendants do not gain automatic accounting authority',()=>{
 const cell=(code,family)=>coverage.cell(code,family).screening;
 assert.equal(cell('524','q-insurer').applicability,'conditional');
 assert.equal(cell('921','q-federal-sovereign').applicability,'conditional');
 assert.equal(cell('311','q-insurer').applicability,'excluded-for-stated-role');
 assert.ok(cell('311','q-insurer').exclusion_reopen_trigger);
 assert.ok(cell('311','q-inventory').named_question_ids.includes('rq-mfg-cost'),'Sector range 31-33 must connect to reviewed manufacturing questions');
 assert.ok(cell('236','q-project-wip').named_question_ids.includes('rq-construction-connected-progress'));
 const leaf=coverage.select(new URLSearchParams('industry=524210&question=q-insurer')).research;
 assert.equal(leaf.leaf_reviews.length,1);assert.match(leaf.screening_scope,/Parent subsector context only/);
 assert.equal(coverage.cell('524210','q-insurer').screening,null);
 assert.equal(coverage.summary.research.whole_scope_sufficiency.whole_detailed_industries,0);
});

test('exact industry and question filters preserve rights and source pointers in agent results',()=>{
 const result=executeAgent('search',{q:'',kind:'guide',naics:'236',question_family:'q-project-wip'});
 assert.ok(result.results.some(r=>r.id==='guide-industry-naics2022-236'));
 assert.ok(result.results.every(r=>r.research.naics_codes.includes('236')&&r.research.question_family_ids.includes('q-project-wip')&&r.rights&&r.citation));
 const child=executeAgent('search',{q:'',naics:'236115',question_family:'q-project-wip'});
 assert.ok(!child.results.some(r=>r.id==='guide-industry-naics2022-236'));
 assert.throws(()=>executeAgent('search',{q:'',naics:'999999'}));
 const get=executeAgent('get',{id:'guide-software-subscriptions',section:'data.research_questions',limit:20});
 assert.ok(get.passages.some(p=>p.text.includes('2027')));assert.ok(get.passages.every(p=>p.source_pointers.every(x=>x.startsWith('/data/research_questions/'))));
 assert.ok(get.record.source_ids.length&&get.record.rights&&get.record.research_review.question_count===6);
 const credit=executeAgent('search',{q:'IFRS 9',kind:'source',question_family:'q-credit-intermediation',limit:25});
 assert.ok(credit.results.some(r=>r.id==='src_ifrs09a'),'Cited shared authority must retain the question association');
 const human=search(new URLSearchParams('naics=236&question_family=q-project-wip&kind=guide'));
 assert.deepEqual(new Set(human.records.map(r=>r.id)),new Set(result.results.map(r=>r.id)));
});

test('named question links, review locators and a leaf review are visible on reading pages',async()=>{
 const record=await(await request('/records/guide-construction-connected-close')).text();
 assert.ok(record.includes('id="rq-construction-connected-progress"'));assert.ok(record.includes('650,000'));assert.ok(record.includes('/records/src_roadmap_ey_revenue_2026'));
 assert.ok(!record.includes('href="/data/'));
 for(const href of record.matchAll(/href="#([^"]+)"/g))assert.ok(record.includes(`id="${href[1]}"`),`Missing section target ${href[1]}`);
 const leaf=await(await request('/coverage?industry=111110')).text();assert.ok(leaf.includes('shared treatment justified'));assert.ok(leaf.includes('seed-production'));assert.ok(leaf.includes('Parent subsector context only'));
 const schema=await request('/schemas/research.schema.json');assert.equal(schema.status,200);
});

test('original worked arithmetic and legal cohort examples retain their stated scope',()=>{
 const software=byId.get('guide-software-subscriptions').data.worked_examples[0];
 assert.match(JSON.stringify(software),/24-month/);assert.match(JSON.stringify(software),/13,500/);assert.equal(18000-(18000/24)*6,13500);
 const services=byId.get('guide-professional-services').data.worked_examples[0];assert.equal(services.entries.length,5);assert.match(services.tieout,/6,545.45/);assert.equal(Math.round((48000/88000*100000-48000)*100)/100,6545.45);
 const cases=byId.get('guide-construction-tax-transitions').data.worked_examples[0].cases;
 for(const c of cases){assert.ok(c.contract_date>=c.tax_year_start);assert.equal(c.new_amendment_cohort,c.tax_year_start>'2025-07-04');}
 const tax=byId.get('guide-construction-tax-transitions').data.research_questions;
 assert.match(tax[1].answer,/not a blanket three-year/);assert.match(tax[2].answer,/apparent conflict/);
 const mba=byId.get('src_15oku59');assert.match(mba.title,/MBABench/);assert.match(mba.data.published_or_status,/2026-08-19/);assert.equal(mba.data.source_review.review_level,'abstract-or-landing');
});

test('new research downloads are exact build inputs covered by the manifest',()=>{
 const manifest=read('dist/client/downloads/manifest.json');
 for(const name of ['research-questions','subsector-profiles','subsector-screening','industry-exception-reviews','research-criteria','classification-relationships']){
  const body=fs.readFileSync(`dist/client/downloads/${name}.json`);assert.deepEqual(body,fs.readFileSync(`data/coverage/${name}.json`));
  const entry=manifest.files.find(f=>f.path===`/downloads/${name}.json`);assert.ok(entry);assert.equal(entry.sha256,createHash('sha256').update(body).digest('hex'));
 }
});

test('weekly source checks rotate beyond the first batch without upgrading review status',async()=>{
 const population=Array.from({length:15},(_,i)=>({id:`source-${String(i).padStart(2,'0')}`,kind:'source',source_url:`https://example.com/${i}`,review_status:'inherited-not-reverified'}));
 const options={limit:5,rotateWeekly:true,fetchImpl:async()=>new Response('publisher landing page')};
 const seen=new Set();for(const date of ['2026-09-07','2026-09-14','2026-09-21'])for(const row of await checkSources(population,{...options,now:new Date(date)}))seen.add(row.record_id);
 assert.equal(seen.size,15);assert.ok(population.every(r=>r.review_status==='inherited-not-reverified'));
});
