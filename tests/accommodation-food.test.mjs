import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {validateSchema} from '../scripts/validate.mjs';
import {applyToRoot,packetFile} from '../scripts/integrate-accommodation-food.mjs';
const root=process.cwd(),read=f=>JSON.parse(fs.readFileSync(f)),p=read(packetFile);
const examples=p.records.filter(r=>r.kind==='example'),cases=examples.flatMap(r=>r.data.cases),accounts=examples[0].data.accounts;
const canonical=fs.readdirSync('data/corpus').filter(n=>n.endsWith('.json')).map(n=>`data/corpus/${n}`);
const files=['data/catalog.json',...canonical,'data/coverage/research-questions.json','data/coverage/assessments.json','data/coverage/mapping-overrides.json'];
const show=f=>execFileSync('git',['show',`${p.base_commit}:${f}`],{maxBuffer:64*1024*1024});
function harness(){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'accommodation-food-source-'));for(const f of files){fs.mkdirSync(path.dirname(path.join(dir,f)),{recursive:true});fs.writeFileSync(path.join(dir,f),show(f));}fs.mkdirSync(path.join(dir,'data/research'),{recursive:true});fs.copyFileSync(packetFile,path.join(dir,packetFile));return dir;}
const snap=dir=>new Map(files.map(f=>[f,fs.readFileSync(path.join(dir,f))]));
const same=(dir,before)=>{for(const[f,b]of before)assert.deepEqual(fs.readFileSync(path.join(dir,f)),b,f);};
const write=(dir,f,v)=>fs.writeFileSync(path.join(dir,f),JSON.stringify(v,null,2)+'\n');
test('accommodation-food baseline and selected question population match the pinned corpus',()=>{
 const maps=JSON.parse(show('data/coverage/record-mappings.json')).mappings;
 const ids=maps.filter(m=>m.industry_mappings.some(i=>i.industry_code.startsWith('72'))).map(m=>m.record_id);
 assert.deepEqual(p.baseline.associated_records.map(r=>r.id),ids);assert.equal(ids.length,2);
 const family=new Set(p.question_rows.flatMap(q=>q.family_ids));
 const qs=JSON.parse(show('data/coverage/research-questions.json')).questions.filter(q=>ids.includes(q.record_id)||q.family_ids.some(f=>family.has(f)));
 assert.deepEqual(p.baseline.linked_questions.map(q=>q.id),qs.map(q=>q.id));assert.equal(qs.length,98);
 assert.equal(p.question_rows.length,6);assert.equal(p.scope.selected_roles.length,4);
});
test('accommodation-food schemas and source locators preserve rights, scope and example identity',()=>{
 const schema=read('schemas/coverage.schema.json');const resolve=v=>Array.isArray(v)?v.map(resolve):v&&typeof v==='object'?v.$ref?resolve(v.$ref.split('/').slice(1).reduce((a,k)=>a[k],schema)):Object.fromEntries(Object.entries(v).map(([k,x])=>[k,resolve(x)])):v;
 for(const r of [...p.sources,...p.records])validateSchema(r,read('schemas/record.schema.json'),r.id);
 for(const a of p.assessments){validateSchema(a,resolve(schema.$defs.assessment),a.id);assert.equal(a.status,'partial');assert.equal(a.source_currency,'unknown');}
 const sources=new Map([...read('data/corpus/source.json'),...p.sources].map(r=>[r.id,r]));
 for(const q of p.question_rows){assert.ok(examples.some(r=>r.id===q.example_id));for(const l of q.source_locators){assert.equal(l.url,sources.get(l.source_id)?.source_url);assert.ok(l.effective_period&&l.access_limits&&l.locator);}}
 for(const r of p.sources){assert.equal(r.rights.full_text_stored,false);assert.equal(r.rights.source_status,'unknown');}
});
function trial(entries){const b={};for(const e of entries){assert.equal(e.lines.reduce((n,l)=>n+l.debit_cents-l.credit_cents,0),0,e.id);for(const l of e.lines){assert.ok(Number.isSafeInteger(l.debit_cents)&&Number.isSafeInteger(l.credit_cents));assert.ok(l.debit_cents>=0&&l.credit_cents>=0);assert.ok(accounts[l.account]);b[l.account]=(b[l.account]||0)+l.debit_cents-l.credit_cents;}}return Object.fromEntries(Object.entries(b).filter(([,n])=>n));}
test('eight separate hospitality ledgers recompute every journal and closing balance',()=>{
 const expected={"lodging-reservations": [140000, 30000, 110000], "restaurant-pos-payroll": [114900, 14283, 100617], "delivery-platform-restaurant": [150000, 0, 150000], "food-inventory-waste": [12000, 30000, -28000], "franchisor-license-training": [1250000, 920000, 330000], "franchisee-service-license": [920000, 50000, -330000], "managed-hotel-owner": [288000, 0, 288000], "managed-hotel-manager": [12000, 0, 12000]};
 assert.equal(cases.length,8);
 for(const c of cases){const b=trial(c.journals);assert.deepEqual(b,c.trial_balance);assert.equal(Object.values(b).reduce((a,b)=>a+b,0),0);const cat=t=>Object.entries(b).filter(([a])=>accounts[a]===t).reduce((n,[,v])=>n+v,0);const assets=cat('asset'),liabilities=-cat('liability')||0,income=-cat('revenue')-cat('expense');assert.deepEqual([assets,liabilities,income],expected[c.id]);assert.equal(assets,liabilities-cat('equity')+income);for(const row of c.evidence_chain)for(const id of row.journal_ids)assert.ok(c.journals.some(j=>j.id===id));}
 for(const q of p.question_rows){assert.ok(cases.some(c=>c.id===q.example_subcase));assert.deepEqual(p.records.find(r=>r.id===q.record_id).data.research_questions.find(x=>x.id===q.id),q);}
});
test('reservation, POS payroll, platform, stock and paired entity inputs reconcile',()=>{
 const by=id=>cases.find(c=>c.id===id),h=by('lodging-reservations'),x=h.inputs;
 assert.equal(x.reserved_nights*x.night_rate_cents,x.reservation_a_cents);assert.equal(x.delivered_nights*x.night_rate_cents,-h.trial_balance.room_revenue);assert.equal(x.reservation_b_cents-x.refund_cents,-h.trial_balance.cancellation_revenue);assert.equal((x.reserved_nights-x.delivered_nights)*x.night_rate_cents,-h.trial_balance.contract_liability);
 const p=by('restaurant-pos-payroll'),i=p.inputs;assert.equal(i.food_sales_cents+i.mandatory_service_cents+i.voluntary_tips_cents+i.collected_tax_cents,i.card_gross_cents);assert.equal(i.voluntary_tips_cents+i.service_charge_wages_cents-i.withholding_cents,i.employee_net_cents);assert.equal(i.card_gross_cents-i.processor_fee_cents-i.employee_net_cents,p.trial_balance.cash);assert.equal(i.withholding_cents+i.employer_taxes_cents,-p.trial_balance.payroll_taxes_payable);assert.ok(!p.trial_balance.tips_payable&&!p.trial_balance.wages_payable);
 const d=by('delivery-platform-restaurant'),di=d.inputs;assert.equal(di.gross_food_cents-di.refund_cents,-d.trial_balance.food_revenue);assert.equal(di.gross_food_cents-di.refund_cents-di.platform_fee_cents,d.trial_balance.cash);
 const s=by('food-inventory-waste'),si=s.inputs;assert.equal(si.opening_cost_cents+si.purchases_cents-si.consumed_cost_cents-si.disposed_cost_cents,si.remaining_cost_cents);assert.equal(Math.min(si.remaining_cost_cents,si.supported_nrv_cents),s.trial_balance.inventory);assert.equal(si.remaining_cost_cents-si.supported_nrv_cents,s.trial_balance.inventory_write_down);
 const f=by('franchisor-license-training'),e=by('franchisee-service-license'),fi=f.inputs;assert.equal(fi.training_allocation_cents+fi.license_allocation_cents,fi.fixed_fee_cents);assert.equal(fi.license_allocation_cents/fi.license_months*fi.completed_months,-f.trial_balance.license_revenue);assert.equal(fi.franchisee_sales_cents*fi.royalty_rate_bps/10000,f.trial_balance.royalty_receivable);assert.equal(f.trial_balance.royalty_receivable,-e.trial_balance.royalty_payable);assert.equal(-f.trial_balance.contract_liability,e.trial_balance.franchise_prepaid);
 const o=by('managed-hotel-owner'),m=by('managed-hotel-manager'),oi=o.inputs;assert.equal(oi.collected_room_cents*oi.fee_rate_bps/10000,oi.fee_cents);assert.equal(oi.collected_room_cents-oi.fee_cents,o.trial_balance.cash);assert.equal(o.trial_balance.management_fee_expense,-m.trial_balance.management_fee_revenue);assert.ok(!o.trial_balance.due_from_manager&&!m.trial_balance.owner_payable);
 assert.equal(examples[0].data.scope_counterexamples.length,8);
});
test('accommodation-food source application preserves every old object and replays without byte changes',()=>{const dir=harness();try{const before=snap(dir);applyToRoot(dir,{dryRun:true});same(dir,before);applyToRoot(dir);assert.deepEqual(fs.readFileSync(path.join(dir,'data/catalog.json')),before.get('data/catalog.json'));for(const f of canonical){const after=JSON.parse(fs.readFileSync(path.join(dir,f)));for(const old of JSON.parse(before.get(f)))assert.deepEqual(after.find(r=>r.id===old.id),old,old.id);}for(const[f,key]of [['data/coverage/research-questions.json','questions'],['data/coverage/assessments.json','assessments']]){const now=JSON.parse(fs.readFileSync(path.join(dir,f)))[key];for(const old of JSON.parse(before.get(f))[key])assert.deepEqual(now.find(q=>q.id===old.id),old);}const first=snap(dir);applyToRoot(dir);same(dir,first);}finally{fs.rmSync(dir,{recursive:true,force:true});}});
test('accommodation-food late conflicts, source identity and unknown editions fail before any write',()=>{for(const type of ['mapping','url','pointer','edition']){const dir=harness();try{if(type==='mapping'){const f='data/coverage/mapping-overrides.json',v=JSON.parse(fs.readFileSync(path.join(dir,f)));v.records[p.records[0].id]={conflicting:true};write(dir,f,v);}if(type==='url'){const f='data/corpus/source.json',v=JSON.parse(fs.readFileSync(path.join(dir,f)));v.push({...p.sources[0],id:'conflicting-source'});write(dir,f,v);}if(type==='pointer'){const v=structuredClone(p);v.question_rows[0].pointer='/data/missing';write(dir,packetFile,v);}if(type==='edition'){const f='data/catalog.json',v=JSON.parse(fs.readFileSync(path.join(dir,f)));v.corpus_version='unknown';write(dir,f,v);}const before=snap(dir);assert.throws(()=>applyToRoot(dir));same(dir,before);}finally{fs.rmSync(dir,{recursive:true,force:true});}}});
test('accommodation-food applied corpus validates and uses real agent search, context and get',async()=>{const dir=harness();try{
 for(const name of ['src','scripts','schemas'])fs.cpSync(name,path.join(dir,name),{recursive:true});
 const baseline=execFileSync('git',['ls-tree','-r','--name-only',p.base_commit,'data'],{encoding:'utf8'}).trim().split('\n');for(const f of baseline){if(/^data\/(corpus|research|releases)\//.test(f)||f.startsWith('data/coverage/snapshots/'))continue;fs.mkdirSync(path.dirname(path.join(dir,f)),{recursive:true});fs.writeFileSync(path.join(dir,f),show(f));}
 fs.symlinkSync(path.join(root,'data/coverage/snapshots'),path.join(dir,'data/coverage/snapshots'));fs.symlinkSync(path.join(root,'node_modules'),path.join(dir,'node_modules'));applyToRoot(dir);const file='data/coverage/research-criteria.json',c=JSON.parse(fs.readFileSync(path.join(dir,file)));c.population.named_research_questions=JSON.parse(fs.readFileSync(path.join(dir,'data/coverage/research-questions.json'))).questions.length;write(dir,file,c);
 execFileSync(process.execPath,['scripts/coverage-mappings.mjs'],{cwd:dir,stdio:'pipe'});execFileSync(process.execPath,['scripts/validate.mjs'],{cwd:dir,stdio:'pipe'});
 const bundle=path.join(dir,'agent.mjs');execFileSync(path.join(root,'node_modules/.bin/esbuild'),['src/agent.ts','--bundle','--platform=node','--format=esm',`--outfile=${bundle}`],{cwd:dir,stdio:'pipe'});const {executeAgent}=await import(pathToFileURL(bundle));
 for(const f of p.retrieval_fixtures.search){assert.ok(f.limit<=20);const result=executeAgent('search',{q:f.query,limit:f.limit});for(const id of f.expected_record_ids)assert.ok(result.results.some(r=>r.id===id),`${id}: ${result.results.map(r=>r.id)}`);}
 const context=executeAgent('context',{ids:[p.records[0].id],include_sources:true,max_chars:40000});assert.ok(context.records.some(e=>e.record.id==='src_aa_i114_irs_tips'&&e.record.citation.original_source_url));
 const got=executeAgent('get',{id:p.records[0].id,limit:20});assert.ok(['721','722'].every(code=>got.record.research.naics_codes.includes(code)));assert.equal(got.record.rights.full_text_stored,false);
 for(const id of examples.map(r=>r.id)){const result=executeAgent('get',{id,limit:20});assert.ok(result.passages.some(p=>JSON.stringify(p).includes('Synthetic')||JSON.stringify(p).includes('synthetic')));}
 }finally{fs.rmSync(dir,{recursive:true,force:true});}});
