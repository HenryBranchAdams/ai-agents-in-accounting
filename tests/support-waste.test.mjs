import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {validateSchema} from '../scripts/validate.mjs';
import {applyToRoot,packetFile} from '../scripts/integrate-support-waste.mjs';
const root=process.cwd(),read=f=>JSON.parse(fs.readFileSync(f)),p=read(packetFile);
const examples=p.records.filter(r=>r.kind==='example'),cases=examples.flatMap(r=>r.data.cases),accounts=examples[0].data.accounts;
const canonical=fs.readdirSync('data/corpus').filter(n=>n.endsWith('.json')).map(n=>`data/corpus/${n}`);
const files=['data/catalog.json',...canonical,'data/coverage/research-questions.json','data/coverage/assessments.json','data/coverage/mapping-overrides.json'];
const show=f=>execFileSync('git',['show',`${p.base_commit}:${f}`],{maxBuffer:64*1024*1024});
function harness(){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'support-waste-source-'));for(const f of files){fs.mkdirSync(path.dirname(path.join(dir,f)),{recursive:true});fs.writeFileSync(path.join(dir,f),show(f));}fs.mkdirSync(path.join(dir,'data/research'),{recursive:true});fs.copyFileSync(packetFile,path.join(dir,packetFile));return dir;}
const snap=dir=>new Map(files.map(f=>[f,fs.readFileSync(path.join(dir,f))]));
const same=(dir,before)=>{for(const[f,b]of before)assert.deepEqual(fs.readFileSync(path.join(dir,f)),b,f);};
const write=(dir,f,v)=>fs.writeFileSync(path.join(dir,f),JSON.stringify(v,null,2)+'\n');
test('support/waste baseline and selected question population match the pinned corpus',()=>{
 const maps=JSON.parse(show('data/coverage/record-mappings.json')).mappings;
 const ids=maps.filter(m=>m.industry_mappings.some(i=>i.industry_code.startsWith('56'))).map(m=>m.record_id);
 assert.deepEqual(p.baseline.associated_records.map(r=>r.id),ids);assert.equal(ids.length,3);
 const family=new Set(p.question_rows.flatMap(q=>q.family_ids));
 const qs=JSON.parse(show('data/coverage/research-questions.json')).questions.filter(q=>ids.includes(q.record_id)||q.family_ids.some(f=>family.has(f)));
 assert.deepEqual(p.baseline.linked_questions.map(q=>q.id),qs.map(q=>q.id));assert.equal(qs.length,103);
 assert.equal(p.question_rows.length,6);assert.equal(p.scope.selected_roles.length,6);
});
test('support/waste schemas and source locators preserve rights, scope and example identity',()=>{
 const schema=read('schemas/coverage.schema.json');const resolve=v=>Array.isArray(v)?v.map(resolve):v&&typeof v==='object'?v.$ref?resolve(v.$ref.split('/').slice(1).reduce((a,k)=>a[k],schema)):Object.fromEntries(Object.entries(v).map(([k,x])=>[k,resolve(x)])):v;
 for(const r of [...p.sources,...p.records])validateSchema(r,read('schemas/record.schema.json'),r.id);
 for(const a of p.assessments){validateSchema(a,resolve(schema.$defs.assessment),a.id);assert.equal(a.status,'partial');assert.equal(a.source_currency,'unknown');}
 const sources=new Map([...read('data/corpus/source.json'),...p.sources].map(r=>[r.id,r]));
 for(const q of p.question_rows){assert.ok(examples.some(r=>r.id===q.example_id));for(const l of q.source_locators){assert.equal(l.url,sources.get(l.source_id)?.source_url);assert.ok(l.effective_period&&l.access_limits&&l.locator);}}
 for(const r of p.sources){assert.equal(r.rights.full_text_stored,false);assert.equal(r.rights.source_status,'unknown');}
});
function trial(entries){const b={};for(const e of entries){assert.equal(e.lines.reduce((n,l)=>n+l.debit_cents-l.credit_cents,0),0,e.id);for(const l of e.lines){assert.ok(Number.isSafeInteger(l.debit_cents)&&Number.isSafeInteger(l.credit_cents));assert.ok(l.debit_cents>=0&&l.credit_cents>=0);assert.ok(accounts[l.account]);b[l.account]=(b[l.account]||0)+l.debit_cents-l.credit_cents;}}return Object.fromEntries(Object.entries(b).filter(([,n])=>n));}
test('seven separate service and waste ledgers independently balance and reconcile',()=>{
 const expected={'staffing-principal':[6700000,0,1700000],'payroll-disbursing-agent':[50000,0,50000],'recurring-support':[900000,800000,100000],'waste-collection':[1550000,200000,350000],'tsdf-retirement-and-assurance':[3090000,1250000,-160000],'remediation-obligor':[1800000,400000,-600000],'remediation-service-contractor':[200000,120000,80000]};
 assert.equal(cases.length,7);
 for(const c of cases){const b=trial(c.journals);assert.deepEqual(b,c.trial_balance);assert.equal(Object.values(b).reduce((a,b)=>a+b,0),0);const cat=t=>Object.entries(b).filter(([a])=>accounts[a]===t).reduce((n,[,v])=>n+v,0);const assets=cat('asset')+cat('contra_asset'),liabilities=-cat('liability')||0,income=-cat('revenue')-cat('expense');assert.deepEqual([assets,liabilities,income],expected[c.id]);assert.equal(assets,liabilities-cat('equity')+income);assert.deepEqual(c.reconciliation,{assets_cents:assets,liabilities_cents:liabilities,net_income_cents:income,contributed_capital_cents:-cat('equity')||0});}
});
test('hours, tonnage, estimate revisions and assurance recompute from inputs with role counterexamples',()=>{
 const by=id=>cases.find(c=>c.id===id),s=by('staffing-principal');assert.equal(s.inputs.hours*s.inputs.bill_rate_cents,5000000);assert.equal(s.inputs.hours*s.inputs.wage_rate_cents,3000000);
 const a=by('payroll-disbursing-agent');assert.equal(a.inputs.net_wages_cents+a.inputs.tax_remittance_cents,a.inputs.client_funding_cents);assert.ok(!a.trial_balance.client_cash&&!a.trial_balance.client_funds_payable);assert.equal(-a.trial_balance.fee_revenue,a.inputs.fee_cents);
 const j=by('recurring-support');assert.equal(j.inputs.advance_cents*j.inputs.completed_months/j.inputs.months,-j.trial_balance.revenue);
 const w=by('waste-collection');assert.equal(w.inputs.completed_tons*w.inputs.rate_cents_per_ton,-w.trial_balance.revenue);assert.equal((w.inputs.completed_tons-w.inputs.paid_tons)*w.inputs.rate_cents_per_ton,w.trial_balance.billed_receivable+w.trial_balance.unbilled_receivable);
 const t=by('tsdf-retirement-and-assurance'),x=t.inputs;assert.equal(x.initial_aro_cents*x.accretion_rate_basis_points/10000,t.trial_balance.accretion_expense);assert.equal(x.initial_aro_cents/x.initial_cost_life_years,t.trial_balance.depreciation_expense);assert.equal(x.initial_aro_cents+t.trial_balance.accretion_expense+x.year_end_upward_revision_fair_value_cents,-t.trial_balance.aro_liability);assert.equal(x.closure_estimate_before_inflation_cents*(10000+x.inflation_basis_points)/10000,t.assurance_schedule.updated_third_party_estimate_cents);assert.equal(t.assurance_schedule.updated_third_party_estimate_cents-x.assurance_face_cents,t.assurance_schedule.shortfall_cents);
 const r=by('remediation-service-contractor'),z=r.inputs,b=r.estimate_bridge;assert.equal(z.contract_price_cents*z.cost_to_date_cents/z.original_total_cost_cents,b.original_cumulative_revenue_cents);assert.equal(z.contract_price_cents*z.cost_to_date_cents/z.revised_total_cost_cents,b.revised_cumulative_revenue_cents);assert.equal(b.revised_cumulative_revenue_cents-b.original_cumulative_revenue_cents,b.revenue_catchup_cents);assert.equal(z.billed_cents-b.revised_cumulative_revenue_cents,-r.trial_balance.contract_liability);
 const o=by('remediation-obligor');assert.equal(o.inputs.estimated_loss_cents-o.inputs.settled_cents,-o.trial_balance.remediation_liability);assert.equal(o.inputs.recognized_recovery_cents,0);
 const negative=examples.flatMap(r=>r.data.scope_counterexamples);for(const id of ['PEO-LABEL','CLIENT-FUNDS-AS-REVENUE','COLLECTOR-AS-TSDF','ASSURANCE-AS-OFFSET','CONTRACTOR-AS-OBLIGOR','DISPUTED-RECOVERY'])assert.ok(negative.some(c=>c.id===id&&c.outcome));const cutoff=negative.find(c=>c.id==='AFTER-CUTOFF-TONNAGE');assert.equal(cutoff.next_period_tons*cutoff.rate_cents_per_ton,cutoff.excluded_current_revenue_cents);
});
test('support/waste source application preserves every old object and replays without byte changes',()=>{const dir=harness();try{const before=snap(dir);applyToRoot(dir,{dryRun:true});same(dir,before);applyToRoot(dir);assert.deepEqual(fs.readFileSync(path.join(dir,'data/catalog.json')),before.get('data/catalog.json'));for(const f of canonical){const after=JSON.parse(fs.readFileSync(path.join(dir,f)));for(const old of JSON.parse(before.get(f)))assert.deepEqual(after.find(r=>r.id===old.id),old,old.id);}for(const[f,key]of [['data/coverage/research-questions.json','questions'],['data/coverage/assessments.json','assessments']]){const now=JSON.parse(fs.readFileSync(path.join(dir,f)))[key];for(const old of JSON.parse(before.get(f))[key])assert.deepEqual(now.find(q=>q.id===old.id),old);}const first=snap(dir);applyToRoot(dir);same(dir,first);}finally{fs.rmSync(dir,{recursive:true,force:true});}});
test('support/waste late conflicts, source identity and unknown editions fail before any write',()=>{for(const type of ['mapping','url','pointer','edition']){const dir=harness();try{if(type==='mapping'){const f='data/coverage/mapping-overrides.json',v=JSON.parse(fs.readFileSync(path.join(dir,f)));v.records[p.records[0].id]={conflicting:true};write(dir,f,v);}if(type==='url'){const f='data/corpus/source.json',v=JSON.parse(fs.readFileSync(path.join(dir,f)));v.push({...p.sources[0],id:'conflicting-source'});write(dir,f,v);}if(type==='pointer'){const v=structuredClone(p);v.question_rows[0].pointer='/data/missing';write(dir,packetFile,v);}if(type==='edition'){const f='data/catalog.json',v=JSON.parse(fs.readFileSync(path.join(dir,f)));v.corpus_version='unknown';write(dir,f,v);}const before=snap(dir);assert.throws(()=>applyToRoot(dir));same(dir,before);}finally{fs.rmSync(dir,{recursive:true,force:true});}}});
test('support/waste applied corpus validates and uses real agent search, context and get',async()=>{const dir=harness();try{
 for(const name of ['src','scripts','schemas'])fs.cpSync(name,path.join(dir,name),{recursive:true});
 const baseline=execFileSync('git',['ls-tree','-r','--name-only',p.base_commit,'data'],{encoding:'utf8'}).trim().split('\n');for(const f of baseline){if(/^data\/(corpus|research|releases)\//.test(f)||f.startsWith('data/coverage/snapshots/'))continue;fs.mkdirSync(path.dirname(path.join(dir,f)),{recursive:true});fs.writeFileSync(path.join(dir,f),show(f));}
 fs.symlinkSync(path.join(root,'data/coverage/snapshots'),path.join(dir,'data/coverage/snapshots'));fs.symlinkSync(path.join(root,'node_modules'),path.join(dir,'node_modules'));applyToRoot(dir);const file='data/coverage/research-criteria.json',c=JSON.parse(fs.readFileSync(path.join(dir,file)));c.population.named_research_questions=JSON.parse(fs.readFileSync(path.join(dir,'data/coverage/research-questions.json'))).questions.length;write(dir,file,c);
 execFileSync(process.execPath,['scripts/coverage-mappings.mjs'],{cwd:dir,stdio:'pipe'});execFileSync(process.execPath,['scripts/validate.mjs'],{cwd:dir,stdio:'pipe'});
 const bundle=path.join(dir,'agent.mjs');execFileSync(path.join(root,'node_modules/.bin/esbuild'),['src/agent.ts','--bundle','--platform=node','--format=esm',`--outfile=${bundle}`],{cwd:dir,stdio:'pipe'});const {executeAgent}=await import(pathToFileURL(bundle));
 for(const f of p.retrieval_fixtures.search){assert.ok(f.limit<=20);const result=executeAgent('search',{q:f.query,limit:f.limit});for(const id of f.expected_record_ids)assert.ok(result.results.some(r=>r.id===id),`${id}: ${result.results.map(r=>r.id)}`);}
 const context=executeAgent('context',{ids:[p.records[0].id],include_sources:true,max_chars:40000});assert.ok(context.records.some(e=>e.record.id==='src_aa_i110_epa_tsdf_assurance'&&e.record.citation.original_source_url));
 const got=executeAgent('get',{id:p.records[0].id,limit:20});assert.ok(got.record.research.naics_codes.includes('561')&&got.record.research.naics_codes.includes('562'));assert.equal(got.record.rights.full_text_stored,false);
 for(const id of examples.map(r=>r.id)){const result=executeAgent('get',{id,limit:20});assert.ok(result.passages.some(p=>JSON.stringify(p).includes('Synthetic')||JSON.stringify(p).includes('synthetic')));}
 }finally{fs.rmSync(dir,{recursive:true,force:true});}});
