import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {validateSchema} from '../scripts/validate.mjs';
import {applyToRoot,packetFile} from '../scripts/integrate-holding-management.mjs';

const root=process.cwd(),read=file=>JSON.parse(fs.readFileSync(path.join(root,file)));
const p=read(packetFile),fixture=p.records.find(r=>r.kind==='example').data;
const canonical=fs.readdirSync('data/corpus').filter(n=>n.endsWith('.json')).map(n=>`data/corpus/${n}`);
const files=['data/catalog.json',...canonical,'data/coverage/research-questions.json','data/coverage/assessments.json','data/coverage/mapping-overrides.json'];
function harness(){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'holding-source-'));
  for(const file of files){fs.mkdirSync(path.dirname(path.join(dir,file)),{recursive:true});fs.writeFileSync(path.join(dir,file),execFileSync('git',['show',`${p.base_commit}:${file}`],{maxBuffer:64*1024*1024}));}
  fs.mkdirSync(path.join(dir,'data/research'),{recursive:true});fs.copyFileSync(packetFile,path.join(dir,packetFile));return dir;
}
const snap=dir=>new Map(files.map(f=>[f,fs.readFileSync(path.join(dir,f))]));
const unchanged=(dir,before)=>{for(const[f,b]of before)assert.deepEqual(fs.readFileSync(path.join(dir,f)),b,f);};
const write=(dir,f,v)=>fs.writeFileSync(path.join(dir,f),JSON.stringify(v,null,2)+'\n');

test('holding packet declares the one-record baseline, existing questions, selected roles and dated evidence',()=>{
  assert.equal(p.baseline.associated_record_count,1);assert.equal(p.baseline.associated_records[0].id,'guide-industry-naics2022-551');
  const registry=JSON.parse(execFileSync('git',['show',`${p.base_commit}:data/coverage/research-questions.json`],{maxBuffer:64*1024*1024}));
  const families=new Set(p.question_rows.flatMap(q=>q.family_ids));
  const linked=registry.questions.filter(q=>q.record_id==='guide-industry-naics2022-551'||q.family_ids?.some(f=>families.has(f)));
  assert.deepEqual(p.baseline.linked_questions.map(q=>q.id),linked.map(q=>q.id));
  assert.equal(p.question_rows.length,6);assert.equal(p.scope.selected_roles.length,4);
  assert.ok(p.sources.find(r=>r.id==='src_aa_i109_arb51_amended').data.limitations.includes('Historical pre-Codification'));
  assert.ok(p.sources.find(r=>r.id==='src_aa_i109_cfr_14829_2025').data.edition.includes('April 1, 2025'));
});

test('holding records and resolved assessment schemas preserve source identity and unknown currency',()=>{
  const schema=read('schemas/coverage.schema.json');
  const resolve=value=>Array.isArray(value)?value.map(resolve):value&&typeof value==='object'?value.$ref?resolve(value.$ref.split('/').slice(1).reduce((v,k)=>v[k],schema)):Object.fromEntries(Object.entries(value).map(([k,v])=>[k,resolve(v)])):value;
  for(const r of [...p.sources,...p.records])validateSchema(r,read('schemas/record.schema.json'),r.id);
  for(const a of p.assessments){validateSchema(a,resolve(schema.$defs.assessment),a.id);assert.equal(a.status,'partial');assert.equal(a.source_currency,'unknown');}
  const sources=new Map([...read('data/corpus/source.json'),...p.sources].map(r=>[r.id,r]));
  for(const q of p.question_rows)for(const l of q.source_locators){assert.equal(l.url,sources.get(l.source_id)?.source_url);assert.ok(l.locator&&l.effective_period&&l.access_limits);}
  for(const r of p.sources){assert.equal(r.rights.full_text_stored,false);assert.equal(r.rights.source_status,'unknown');}
});

function trial(entries,entity){
  const result={};for(const e of entries){assert.equal(e.lines.reduce((n,l)=>n+l.debit_cents-l.credit_cents,0),0,e.id);for(const l of e.lines){assert.ok(Number.isSafeInteger(l.debit_cents)&&Number.isSafeInteger(l.credit_cents));assert.ok(l.debit_cents>=0&&l.credit_cents>=0);if(!entity||l.entity===entity)result[l.account]=(result[l.account]||0)+l.debit_cents-l.credit_cents;}}
  return Object.fromEntries(Object.entries(result).filter(([,v])=>v));
}
test('holding standalone journals and elimination columns independently reconcile all four balances',()=>{
  const expected={parent:[2550000,0,50000],subsidiary:[2200000,650000,650000],combined:[4750000,650000,700000],consolidated:[3100000,0,600000]};
  for(const [name,entity,entries]of [['parent','P',fixture.journals],['subsidiary','S',fixture.journals],['combined',null,fixture.journals],['consolidated',null,[...fixture.journals,...fixture.elimination_journals]]]){
    const b=trial(entries,entity);assert.deepEqual(b,fixture.trial_balances[name]);assert.equal(Object.values(b).reduce((a,b)=>a+b,0),0);
    const category=kind=>Object.entries(b).filter(([a])=>fixture.accounts[a]===kind).reduce((n,[,v])=>n+v,0);
    const assets=category('asset'),liabilities=-category('liability')||0,income=-category('revenue')-category('expense');
    assert.deepEqual([assets,liabilities,income],expected[name]);assert.equal(assets-liabilities,-category('equity')+income-category('distribution'));
    assert.equal(fixture.reconciliation[name].assets_cents,assets);assert.equal(fixture.reconciliation[name].net_income_cents,income);
  }
  assert.deepEqual(fixture.trial_balances.consolidated,{cash:3100000,parent_capital:-2500000,external_revenue:-2000000,external_operating_expense:1200000,shared_service_cost:200000});
  assert.equal(fixture.interest_case.principal_cents*fixture.interest_case.annual_rate_basis_points/10000,30000);
  assert.equal(fixture.allocation_case.pool_cents*600/1000,120000);assert.equal(Object.values(fixture.allocation_case.allocated_cents).reduce((a,b)=>a+b),200000);
});

test('holding counterexamples retain outside revenue and reject unmatched or out-of-scope assumptions',()=>{
  assert.ok(fixture.examples.some(e=>e.synthetic&&e.scenario_type==='positive'));
  assert.ok(fixture.examples.some(e=>e.synthetic&&e.scenario_type==='negative'));
  const branch=fixture.scope_counterexamples.find(c=>c.id==='OUTSIDE-CUSTOMER');
  const b=trial([...fixture.journals,...fixture.elimination_journals,...branch.entries]);
  assert.equal(b.cash,branch.expected_group_cash_cents);assert.equal(-b.external_revenue-b.external_operating_expense-b.shared_service_cost,branch.expected_group_net_income_cents);
  assert.equal(fixture.scope_counterexamples.find(c=>c.id==='UNMATCHED-LOAN').difference_cents,500000-480000);
  for(const id of ['PASSIVE-HOLDING','MINORITY-INVESTEE','BOOK-TAX-PERIMETER'])assert.ok(fixture.scope_counterexamples.find(c=>c.id===id)?.outcome);
  assert.ok(fixture.assumptions.some(t=>t.includes('cost-method bookkeeping worksheet')));
});

test('holding importer preserves all old objects, defaults to no catalog edit and replays without byte changes',()=>{
  const dir=harness();try{
    const before=snap(dir);applyToRoot(dir,{dryRun:true});unchanged(dir,before);applyToRoot(dir);
    assert.deepEqual(fs.readFileSync(path.join(dir,'data/catalog.json')),before.get('data/catalog.json'));
    for(const f of canonical){const after=JSON.parse(fs.readFileSync(path.join(dir,f)));for(const old of JSON.parse(before.get(f)))assert.deepEqual(after.find(r=>r.id===old.id),old,old.id);}
    for(const [f,key]of [['data/coverage/research-questions.json','questions'],['data/coverage/assessments.json','assessments']]){const after=JSON.parse(fs.readFileSync(path.join(dir,f)));for(const old of JSON.parse(before.get(f))[key])assert.deepEqual(after[key].find(r=>r.id===old.id),old);}
    const first=snap(dir);applyToRoot(dir);unchanged(dir,first);
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('holding preflight rejects late conflicts, unknown editions and changed source identities before any write',()=>{
  for(const kind of ['mapping','url','pointer','edition']){
    const dir=harness();try{
      if(kind==='mapping'){const f='data/coverage/mapping-overrides.json',v=JSON.parse(fs.readFileSync(path.join(dir,f)));v.records[p.records[0].id]={conflicting:true};write(dir,f,v);}
      if(kind==='url'){const f='data/corpus/source.json',v=JSON.parse(fs.readFileSync(path.join(dir,f)));v.push({...p.sources[0],id:'conflicting-stable-source'});write(dir,f,v);}
      if(kind==='pointer'){const v=structuredClone(p);v.question_rows[0].source_locators[0].url='https://example.invalid/wrong';write(dir,packetFile,v);}
      if(kind==='edition'){const f='data/catalog.json',v=JSON.parse(fs.readFileSync(path.join(dir,f)));v.corpus_version='unknown';write(dir,f,v);}
      const before=snap(dir);assert.throws(()=>applyToRoot(dir));unchanged(dir,before);
    }finally{fs.rmSync(dir,{recursive:true,force:true});}
  }
});

test('holding applied fixture retrieves the dedicated route and scoped source citations through the real agent',async()=>{
  const dir=harness();try{
    fs.cpSync('src',path.join(dir,'src'),{recursive:true});
    fs.cpSync('scripts',path.join(dir,'scripts'),{recursive:true});
    fs.cpSync('schemas',path.join(dir,'schemas'),{recursive:true});
    const baselineFiles=execFileSync('git',['ls-tree','-r','--name-only',p.base_commit,'data'],{encoding:'utf8'}).trim().split('\n');
    for(const file of baselineFiles){
      if(/^data\/(corpus|research|releases)\//.test(file)||file.startsWith('data/coverage/snapshots/'))continue;
      fs.mkdirSync(path.dirname(path.join(dir,file)),{recursive:true});
      fs.writeFileSync(path.join(dir,file),execFileSync('git',['show',`${p.base_commit}:${file}`],{maxBuffer:64*1024*1024}));
    }
    fs.symlinkSync(path.join(root,'data/coverage/snapshots'),path.join(dir,'data/coverage/snapshots'));
    fs.symlinkSync(path.join(root,'node_modules'),path.join(dir,'node_modules'));
    applyToRoot(dir);
    const criteriaFile='data/coverage/research-criteria.json',criteria=JSON.parse(fs.readFileSync(path.join(dir,criteriaFile)));
    criteria.population.named_research_questions=JSON.parse(fs.readFileSync(path.join(dir,'data/coverage/research-questions.json'))).questions.length;
    write(dir,criteriaFile,criteria);
    execFileSync(process.execPath,['scripts/coverage-mappings.mjs'],{cwd:dir,stdio:'pipe'});
    execFileSync(process.execPath,['scripts/validate.mjs'],{cwd:dir,stdio:'pipe'});
    const bundled=path.join(dir,'agent.mjs');
    execFileSync(path.join(root,'node_modules/.bin/esbuild'),['src/agent.ts','--bundle','--platform=node','--format=esm',`--outfile=${bundled}`],{cwd:dir,stdio:'pipe'});
    const {executeAgent}=await import(pathToFileURL(bundled));
    for(const f of p.retrieval_fixtures.search){assert.ok(f.limit<=20);const result=executeAgent('search',{q:f.query,limit:f.limit});for(const id of f.expected_record_ids)assert.ok(result.results.some(r=>r.id===id),`${id}: ${result.results.map(r=>r.id)}`);}
    const context=executeAgent('context',{ids:[p.records[0].id],include_sources:true,max_chars:40000});
    assert.ok(context.records.some(e=>e.record.id==='src_aa_i109_arb51_amended'&&e.record.citation.original_source_url));
    const got=executeAgent('get',{id:p.records[0].id,limit:20});assert.ok(got.record.research.naics_codes.includes('551'));
    assert.ok(got.passages.length);assert.equal(got.record.rights.full_text_stored,false);
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
