import test from 'node:test';
import assert from 'node:assert/strict';
import {executeAgent} from '../dist/internal/agent.mjs';

const guideId='guide-us-partnership-capital-basis';
const getSection=(id,section)=>executeAgent('get',{id,section,limit:20});
test('K-1 capital research retrieves the bounded answer and its missing-context dependency',()=>{
  const result=executeAgent('search',{q:'partnership capital outside basis',kind:'guide',limit:5});
  assert.ok(result.results.some(r=>r.id===guideId));
  const packet=getSection(guideId,'data.research_questions');
  const text=packet.passages.map(p=>p.text).join('\n');
  assert.match(text,/K-1 capital alone cannot establish outside basis/);
  assert.match(text,/liability/);
  assert.match(text,/LPA/);
  assert.match(text,/GAAP.*(gap|unresolved)/);
});

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {getRecord, knowledge} from '../dist/internal/corpus.mjs';
import {applyToRoot} from '../scripts/integrate-partnership-foundations.mjs';
const exampleId='example-us-partnership-capital-basis';
const textOf=(id,section)=>getSection(id,section).passages.map(p=>p.text).join('\n');

test('traditional allocation, sale and liquidation reconcile distinct capital and basis measures',()=>{
  const d=getRecord(exampleId).data.contribution_branch;
  const [formation,depreciation,income,sale,liquidation]=d.events;
  assert.equal(d.contributed_property.value-d.contributed_property.tax_basis,12000);
  assert.deepEqual(depreciation.tax_depreciation,[0,800]);
  assert.deepEqual(depreciation.capital_704b,[19000,19000]);
  assert.equal(depreciation.property_704c_layer,10800);
  assert.deepEqual(income.outside_basis,[8500,19700]);
  assert.equal(sale.proceeds-sale.asset_tax_basis_before_sale,10800);
  assert.deepEqual(sale.outside_basis,[19300,19700]);
  assert.equal(sale.cash_after_sale,39000);
  assert.equal(liquidation.cash_distributed.reduce((a,b)=>a+b),sale.cash_after_sale);
  assert.deepEqual(liquidation.cash_distributed.map((cash,i)=>cash-sale.outside_basis[i]),[200,-200]);
  assert.deepEqual(liquidation.section731_gain_loss,[200,-200]);
  assert.deepEqual(liquidation.outside_basis_after,[0,0]);
  assert.notDeepEqual(liquidation.tax_capital_before_final_return_adjustments,liquidation.outside_basis_after);
  for(const event of [formation,depreciation,income,sale])assert.equal(event.tax_capital.reduce((a,b)=>a+b),event.common_asset_tax_basis);
});

test('transferee adjustment changes special tax result while preserving common basis and capital',()=>{
  const t=getRecord(exampleId).data.transfer_branch;
  assert.equal(t.section743b_adjustment,30000);
  assert.equal(t.transferee_price_and_outside_basis-t.transferee_share_common_basis,t.section743b_adjustment);
  assert.equal(t.common_inside_basis_after,100000);
  assert.equal(t.common_inside_basis_after,t.common_inside_basis_before);
  assert.equal(t.transferred_tax_capital,50000);
  assert.equal(t.transferred_704b_capital,50000);
  assert.equal(t.transferee_common_gain+t.transferee_special_offset,0);
  assert.equal(t.transferee_net_gain,0);
  const text=textOf(guideId,'data.research_questions');
  assert.match(text,/cannot change common inside basis or capital/);
  assert.match(text,/No section 754 election does not mean no adjustment/);
  assert.match(text,/734.*mandatory/s);
});

test('missing agreements, elections and liabilities remain unresolved; tax evidence cannot fill GAAP gap',()=>{
  const d=getRecord(exampleId).data;
  assert.equal(d.financial_reporting_capital,null);
  const [capital,election,mandatory,gaap,retirement]=d.missing_context_cases;
  assert.equal(capital.outside_basis,null);
  assert.equal(election.adjustment,null);
  assert.equal(mandatory.mandatory_trigger,true);
  assert.equal(mandatory.adjustment_amount,null);
  assert.equal(gaap.gaap_equity,null);
  assert.equal(retirement.section736_classification,null);
  const text=textOf(exampleId,'data.missing_context_cases');
  for(const dependency of ['liability allocation','election evidence','LPA','general-partner status'])assert.ok(text.includes(dependency));
  assert.match(textOf(guideId,'data.research_questions'),/None of these tax methods establishes GAAP measurement/);
});

test('source citations preserve exact URLs, edition distinctions and separate rights from access',()=>{
  const g=getRecord(guideId);
  for(const question of g.data.research_questions)for(const loc of question.source_locators){
    const retrieved=executeAgent('get',{id:loc.source_id,limit:1});
    assert.equal(retrieved.record.citation.original_source_url,loc.url);
    assert.equal(retrieved.record.rights.full_text_stored,false);
    assert.equal(retrieved.record.rights.source_status,'unknown');
    const r=getRecord(loc.source_id);
    const evidence=r.data.supplemental_reviews?.find(x=>x.batch==='partnership-foundations-2026-09-27')||r.data.source_review;
    assert.equal(evidence.review_level,'substantive-excerpt');
    assert.equal(evidence.rights_review.status,'unresolved');
    assert.ok(evidence.checks.every(c=>c.material_read));
    assert.ok(evidence.publication_or_edition);
  }
  assert.notEqual(getRecord('src_partnership_704c_cfr2025').source_url,getRecord('src_fo_ref_tax_contributed_property').source_url);
  assert.equal(getRecord('src_fo_ref_tax_contributed_property').reviewed_at,null);
});

test('intake replay is idempotent and a conflicting source identity writes nothing',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'partnership-intake-'));
  try{
    for(const dir of ['data/corpus','data/coverage'])fs.cpSync(dir,path.join(root,dir),{recursive:true});
    fs.mkdirSync(path.join(root,'data/research'),{recursive:true});
    const file='data/research/partnership-foundations-2026-09-27.json';
    fs.copyFileSync(file,path.join(root,file));
    for(const extra of ['data/research-questions.json','data/research/partnership-foundations-retrieval-2026-09-27.json'])fs.copyFileSync(extra,path.join(root,extra));
    assert.equal(applyToRoot(root).changed,0);
    const before=fs.readFileSync(path.join(root,'data/corpus/source.json'),'utf8');
    const packet=JSON.parse(fs.readFileSync(path.join(root,file)));
    packet.supplemental_reviews[0].expected_source_url='https://example.org/wrong-edition';
    fs.writeFileSync(path.join(root,file),JSON.stringify(packet));
    assert.throws(()=>applyToRoot(root),/Supplement identity/);
    assert.equal(fs.readFileSync(path.join(root,'data/corpus/source.json'),'utf8'),before);
  }finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('explicit Partnership entity scope supports filtering without inferring partner roles',()=>{
  assert.deepEqual(knowledge.profile(guideId).scope.entities,['Partnership']);
  assert.deepEqual(knowledge.profile(guideId).scope.basis.entities,{pointers:['/data/entity_scope'],status:'recorded'});
  const result=executeAgent('search',{q:'partnership capital',entity:'Partnership',kind:'guide',limit:5});
  assert.ok(result.results.some(r=>r.id===guideId));
  assert.ok(!result.results.some(r=>r.id==='guide-family-office-us-accounting'));
  // Mentioning partnerships/partners in IRS prose alone does not declare the entity facet.
  assert.ok(!knowledge.profile('src_family_office_irs_k1_1065_2025').scope.entities.includes('Partnership'));
  for(const role of ['Partner','General partner','Trustee'])assert.throws(()=>executeAgent('search',{q:'capital',entity:role}),e=>e.code==='INVALID_FILTER');
});

import {execFileSync} from 'node:child_process';
test('the intake preserves previous source history and unrelated mapping associations',()=>{
  const packet=JSON.parse(fs.readFileSync('data/research/partnership-foundations-2026-09-27.json'));
  const atBase=file=>JSON.parse(execFileSync('git',['show',`${packet.base_sha}:${file}`],{encoding:'utf8',maxBuffer:32*1024*1024}));
  for(const old of atBase('data/corpus/source.json')){
    const current=structuredClone(getRecord(old.id));
    if(packet.supplemental_reviews.some(s=>s.record_id===old.id)){
      current.data.supplemental_reviews=current.data.supplemental_reviews.filter(r=>r.batch!==packet.id);
      if(!Object.hasOwn(old.data,'supplemental_reviews'))delete current.data.supplemental_reviews;
    }
    assert.deepEqual(current,old,`${old.id}: historical source changed beyond appended evidence`);
  }
  const current=JSON.parse(fs.readFileSync('data/coverage/mapping-overrides.json'));
  for(const [id,mapping] of Object.entries(atBase('data/coverage/mapping-overrides.json').records))assert.deepEqual(current.records[id],mapping,id);
  assert.deepEqual(JSON.parse(fs.readFileSync('data/research/source-aliases.json')),atBase('data/research/source-aliases.json'));
});
