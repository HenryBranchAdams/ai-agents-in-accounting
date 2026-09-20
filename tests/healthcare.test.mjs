import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {validateSchema} from '../scripts/validate.mjs';
import {applyToRoot,packetFile} from '../scripts/integrate-healthcare.mjs';
const root=process.cwd(),read=f=>JSON.parse(fs.readFileSync(f)),p=read(packetFile);
const examples=p.records.filter(r=>r.kind==='example'),cases=examples.flatMap(r=>r.data.cases),accounts=examples[0].data.accounts;
const canonical=fs.readdirSync('data/corpus').filter(n=>n.endsWith('.json')).map(n=>`data/corpus/${n}`);
const files=['data/catalog.json',...canonical,'data/coverage/research-questions.json','data/coverage/assessments.json','data/coverage/mapping-overrides.json'];
const show=f=>execFileSync('git',['show',`${p.base_commit}:${f}`],{maxBuffer:64*1024*1024});
function harness(){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'healthcare-source-'));for(const f of files){fs.mkdirSync(path.dirname(path.join(dir,f)),{recursive:true});fs.writeFileSync(path.join(dir,f),show(f));}fs.mkdirSync(path.join(dir,'data/research'),{recursive:true});fs.copyFileSync(packetFile,path.join(dir,packetFile));return dir;}
const snap=dir=>new Map(files.map(f=>[f,fs.readFileSync(path.join(dir,f))]));
const same=(dir,before)=>{for(const[f,b]of before)assert.deepEqual(fs.readFileSync(path.join(dir,f)),b,f);};
const write=(dir,f,v)=>fs.writeFileSync(path.join(dir,f),JSON.stringify(v,null,2)+'\n');
test('healthcare baseline and selected question population match the pinned corpus',()=>{
 const maps=JSON.parse(show('data/coverage/record-mappings.json')).mappings;
 const ids=maps.filter(m=>m.industry_mappings.some(i=>i.industry_code.startsWith('62'))).map(m=>m.record_id);
 assert.deepEqual(p.baseline.associated_records.map(r=>r.id),ids);assert.equal(ids.length,6);
 const family=new Set(p.question_rows.flatMap(q=>q.family_ids));
 const qs=JSON.parse(show('data/coverage/research-questions.json')).questions.filter(q=>ids.includes(q.record_id)||q.family_ids.some(f=>family.has(f)));
 assert.deepEqual(p.baseline.linked_questions.map(q=>q.id),qs.map(q=>q.id));assert.equal(qs.length,93);
 assert.equal(p.question_rows.length,6);assert.equal(p.scope.selected_roles.length,4);
});
test('healthcare schemas and source locators preserve rights, scope and example identity',()=>{
 const schema=read('schemas/coverage.schema.json');const resolve=v=>Array.isArray(v)?v.map(resolve):v&&typeof v==='object'?v.$ref?resolve(v.$ref.split('/').slice(1).reduce((a,k)=>a[k],schema)):Object.fromEntries(Object.entries(v).map(([k,x])=>[k,resolve(x)])):v;
 for(const r of [...p.sources,...p.records])validateSchema(r,read('schemas/record.schema.json'),r.id);
 for(const a of p.assessments){validateSchema(a,resolve(schema.$defs.assessment),a.id);assert.equal(a.status,'partial');assert.equal(a.source_currency,'unknown');}
 const sources=new Map([...read('data/corpus/source.json'),...p.sources].map(r=>[r.id,r]));
 for(const q of p.question_rows){assert.ok(examples.some(r=>r.id===q.example_id));for(const l of q.source_locators){assert.equal(l.url,sources.get(l.source_id)?.source_url);assert.ok(l.effective_period&&l.access_limits&&l.locator);}}
 for(const r of p.sources){assert.equal(r.rights.full_text_stored,false);assert.equal(r.rights.source_status,'unknown');}
});
function trial(entries){const b={};for(const e of entries){assert.equal(e.lines.reduce((n,l)=>n+l.debit_cents-l.credit_cents,0),0,e.id);for(const l of e.lines){assert.ok(Number.isSafeInteger(l.debit_cents)&&Number.isSafeInteger(l.credit_cents));assert.ok(l.debit_cents>=0&&l.credit_cents>=0);assert.ok(accounts[l.account]);b[l.account]=(b[l.account]||0)+l.debit_cents-l.credit_cents;}}return Object.fromEntries(Object.entries(b).filter(([,n])=>n));}
test('five distinct provider ledgers independently balance and reconcile',()=>{
 const expected={'hospital-claim-remittance':[12500000,500000,2000000],'ambulatory-subcapitation':[7500000,6300000,1200000],'residential-private-pay':[550000,500000,50000],'social-assistance-conditional-award':[600000,500000,100000],'institutional-cost-report-settlement':[440000,0,-60000]};
 assert.equal(cases.length,5);
 for(const c of cases){const b=trial(c.journals);assert.deepEqual(b,c.trial_balance);assert.equal(Object.values(b).reduce((a,b)=>a+b,0),0);const cat=t=>Object.entries(b).filter(([a])=>accounts[a]===t).reduce((n,[,v])=>n+v,0);const assets=cat('asset')+cat('contra_asset'),liabilities=-cat('liability')||0,income=-cat('revenue')-cat('expense');assert.deepEqual([assets,liabilities,income],expected[c.id]);assert.equal(assets,liabilities-cat('equity')+income);assert.deepEqual(c.reconciliation,{assets_cents:assets,liabilities_cents:liabilities,net_income_cents:income,opening_equity_cents:-cat('equity')||0});}
});
test('claim to bank, member months, resident days, awards and cost-report estimates recompute from inputs',()=>{
 const by=id=>cases.find(c=>c.id===id),h=by('hospital-claim-remittance'),x=h.inputs;
 assert.equal(x.charge_cents-x.contractual_reduction_cents,x.payer_initial_responsibility_cents+x.patient_initial_responsibility_cents);
 assert.equal(x.charge_cents-x.contractual_reduction_cents-x.implicit_patient_concession_cents-x.payer_entitlement_reduction_cents,-h.trial_balance.service_revenue);
 assert.equal(x.claim_payment_cents-x.provider_level_offset_cents,x.net_bank_deposit_cents);
 assert.equal(x.payer_initial_responsibility_cents-x.payer_entitlement_reduction_cents-x.claim_payment_cents,h.trial_balance.payer_receivable);
 assert.equal(x.patient_initial_responsibility_cents-x.implicit_patient_concession_cents,h.trial_balance.patient_receivable);assert.equal(-h.trial_balance.allowance,x.patient_credit_loss_cents);assert.ok(!h.trial_balance.prior_payer_overpayment);
 assert.equal(h.evidence_chain[0].encounter,x.encounter_id);assert.equal(h.evidence_chain[1].claim,x.claim_id);assert.equal(h.evidence_chain[1].bank_trace,x.bank_trace);for(const row of h.evidence_chain)for(const id of row.journal_ids)assert.ok(h.journals.some(j=>j.id===id));
 const d=h.charity_disclosure;assert.equal(d.separate_charity_charge_memorandum_cents*d.cost_ratio_basis_points/10000,d.charity_cost_cents);assert.equal(d.charity_direct_cost_cents+d.charity_indirect_cost_cents,d.charity_cost_cents);assert.equal(d.charity_service_revenue_cents,0);assert.ok(d.charity_cost_cents<x.service_cost_cents);
 const m=by('ambulatory-subcapitation'),mi=m.inputs;assert.equal(mi.members*mi.monthly_rate_cents*mi.completed_months,-m.trial_balance.service_revenue);assert.equal(mi.members*mi.monthly_rate_cents*(mi.advance_months-mi.completed_months),-m.trial_balance.contract_liability);
 const n=by('residential-private-pay'),ni=n.inputs;assert.equal(ni.completed_days*ni.daily_rate_cents,-n.trial_balance.service_revenue);assert.equal((ni.advance_days-ni.completed_days)*ni.daily_rate_cents,-n.trial_balance.contract_liability);assert.equal(ni.refundable_deposit_cents,-n.trial_balance.resident_deposit);
 const g=by('social-assistance-conditional-award'),gi=g.inputs;assert.equal(gi.verified_meals*gi.award_per_meal_cents,-g.trial_balance.contribution_revenue);assert.equal(gi.advance_cents-gi.verified_meals*gi.award_per_meal_cents,-g.trial_balance.refundable_award);
 const c=by('institutional-cost-report-settlement'),ci=c.inputs;assert.equal(ci.opening_estimate_cents-ci.final_supported_settlement_cents,c.trial_balance.service_revenue);assert.equal(Object.values(ci.cost_centers_cents).reduce((a,b)=>a+b,0),ci.book_cost_cents);assert.ok(!c.trial_balance.settlement_receivable);
 const negative=examples[0].data.scope_counterexamples;for(const id of ['PROVIDER-TO-PATIENT','PLB-AS-DENIAL','PRICE-VS-CREDIT','CAPITATION-PLUS-ENCOUNTER','GOVERNMENTAL-PROVIDER','SNF-AS-HOSPITAL','CHARITY-AS-BAD-DEBT','RESIDENT-DEPOSIT','AWARD-AS-PATIENT-REVENUE'])assert.ok(negative.some(c=>c.id===id&&c.outcome));
});
test('healthcare source application preserves every old object and replays without byte changes',()=>{const dir=harness();try{const before=snap(dir);applyToRoot(dir,{dryRun:true});same(dir,before);applyToRoot(dir);assert.deepEqual(fs.readFileSync(path.join(dir,'data/catalog.json')),before.get('data/catalog.json'));for(const f of canonical){const after=JSON.parse(fs.readFileSync(path.join(dir,f)));for(const old of JSON.parse(before.get(f)))assert.deepEqual(after.find(r=>r.id===old.id),old,old.id);}for(const[f,key]of [['data/coverage/research-questions.json','questions'],['data/coverage/assessments.json','assessments']]){const now=JSON.parse(fs.readFileSync(path.join(dir,f)))[key];for(const old of JSON.parse(before.get(f))[key])assert.deepEqual(now.find(q=>q.id===old.id),old);}const first=snap(dir);applyToRoot(dir);same(dir,first);}finally{fs.rmSync(dir,{recursive:true,force:true});}});
test('healthcare late conflicts, source identity and unknown editions fail before any write',()=>{for(const type of ['mapping','url','pointer','edition']){const dir=harness();try{if(type==='mapping'){const f='data/coverage/mapping-overrides.json',v=JSON.parse(fs.readFileSync(path.join(dir,f)));v.records[p.records[0].id]={conflicting:true};write(dir,f,v);}if(type==='url'){const f='data/corpus/source.json',v=JSON.parse(fs.readFileSync(path.join(dir,f)));v.push({...p.sources[0],id:'conflicting-source'});write(dir,f,v);}if(type==='pointer'){const v=structuredClone(p);v.question_rows[0].pointer='/data/missing';write(dir,packetFile,v);}if(type==='edition'){const f='data/catalog.json',v=JSON.parse(fs.readFileSync(path.join(dir,f)));v.corpus_version='unknown';write(dir,f,v);}const before=snap(dir);assert.throws(()=>applyToRoot(dir));same(dir,before);}finally{fs.rmSync(dir,{recursive:true,force:true});}}});
test('healthcare applied corpus validates and uses real agent search, context and get',async()=>{const dir=harness();try{
 for(const name of ['src','scripts','schemas'])fs.cpSync(name,path.join(dir,name),{recursive:true});
 const baseline=execFileSync('git',['ls-tree','-r','--name-only',p.base_commit,'data'],{encoding:'utf8'}).trim().split('\n');for(const f of baseline){if(/^data\/(corpus|research|releases)\//.test(f)||f.startsWith('data/coverage/snapshots/'))continue;fs.mkdirSync(path.dirname(path.join(dir,f)),{recursive:true});fs.writeFileSync(path.join(dir,f),show(f));}
 fs.symlinkSync(path.join(root,'data/coverage/snapshots'),path.join(dir,'data/coverage/snapshots'));fs.symlinkSync(path.join(root,'node_modules'),path.join(dir,'node_modules'));applyToRoot(dir);const file='data/coverage/research-criteria.json',c=JSON.parse(fs.readFileSync(path.join(dir,file)));c.population.named_research_questions=JSON.parse(fs.readFileSync(path.join(dir,'data/coverage/research-questions.json'))).questions.length;write(dir,file,c);
 execFileSync(process.execPath,['scripts/coverage-mappings.mjs'],{cwd:dir,stdio:'pipe'});execFileSync(process.execPath,['scripts/validate.mjs'],{cwd:dir,stdio:'pipe'});
 const bundle=path.join(dir,'agent.mjs');execFileSync(path.join(root,'node_modules/.bin/esbuild'),['src/agent.ts','--bundle','--platform=node','--format=esm',`--outfile=${bundle}`],{cwd:dir,stdio:'pipe'});const {executeAgent}=await import(pathToFileURL(bundle));
 for(const f of p.retrieval_fixtures.search){assert.ok(f.limit<=20);const result=executeAgent('search',{q:f.query,limit:f.limit});for(const id of f.expected_record_ids)assert.ok(result.results.some(r=>r.id===id),`${id}: ${result.results.map(r=>r.id)}`);}
 const context=executeAgent('context',{ids:[p.records[0].id],include_sources:true,max_chars:40000});assert.ok(context.records.some(e=>e.record.id==='src_aa_i112_cms_remittance'&&e.record.citation.original_source_url));
 const got=executeAgent('get',{id:p.records[0].id,limit:20});assert.ok(['621','622','623','624'].every(code=>got.record.research.naics_codes.includes(code)));assert.equal(got.record.rights.full_text_stored,false);
 for(const id of examples.map(r=>r.id)){const result=executeAgent('get',{id,limit:20});assert.ok(result.passages.some(p=>JSON.stringify(p).includes('Synthetic')||JSON.stringify(p).includes('synthetic')));}
 }finally{fs.rmSync(dir,{recursive:true,force:true});}});
