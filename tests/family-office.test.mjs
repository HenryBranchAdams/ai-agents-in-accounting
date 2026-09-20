import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {validateSchema} from '../scripts/validate.mjs';
import {applyToRoot,packetFile} from '../scripts/integrate-family-office.mjs';
const root=process.cwd();
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const packet=read(packetFile);
const example=packet.records.find(r=>r.kind==='example').data.case;
const signed=l=>l.debit_cents-l.credit_cents;
const sum=a=>a.reduce((s,n)=>s+n,0);
const totals=rows=>Object.fromEntries([...new Set(rows.map(l=>l.account))].map(a=>[a,sum(rows.filter(l=>l.account===a).map(signed))]));
function ledger(entity){return totals([...entity.opening,...example.journals.filter(j=>j.entity_id===entity.id).flatMap(j=>j.lines)]);}
function harness(){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'family-office-source-'));
 const archive=path.join(dir,'baseline.tar');
 execFileSync('git',['archive','-o',archive,packet.base_commit,'data'],{cwd:root});
 execFileSync('tar',['-xf',archive],{cwd:dir});fs.rmSync(archive);
 for(const folder of ['src','scripts','schemas'])fs.cpSync(path.join(root,folder),path.join(dir,folder),{recursive:true});
 for(const f of [packetFile,'scripts/integrate-family-office.mjs']){fs.mkdirSync(path.dirname(path.join(dir,f)),{recursive:true});fs.copyFileSync(f,path.join(dir,f));}
 fs.symlinkSync(path.join(root,'node_modules'),path.join(dir,'node_modules'),'dir');return dir;
}
const targetFiles=['data/catalog.json',...fs.readdirSync('data/corpus').filter(f=>f.endsWith('.json')).map(f=>`data/corpus/${f}`),'data/coverage/research-questions.json','data/coverage/assessments.json','data/coverage/mapping-overrides.json','data/coverage/research-criteria.json'];
const snapshot=dir=>new Map(targetFiles.map(f=>[f,fs.readFileSync(path.join(dir,f))]));
function resolve(v,schema){if(Array.isArray(v))return v.map(x=>resolve(x,schema));if(!v||typeof v!=='object')return v;if(v.$ref)return resolve(schema.$defs[v.$ref.split('/').at(-1)],schema);return Object.fromEntries(Object.entries(v).filter(([k])=>k!=='$defs').map(([k,x])=>[k,resolve(x,schema)]));}

test('family office six named answers retain source identity, dates, rights and partial review',()=>{
 const rs=read('schemas/record.schema.json'), cs=read('schemas/coverage.schema.json');
 const index=new Map([...read('data/corpus/source.json'),...packet.sources].map(r=>[r.id,r]));
 assert.equal(packet.question_rows.length,6);assert.equal(packet.assessments.length,6);
 for(const r of [...packet.sources,...packet.records]){validateSchema(r,rs,r.id);assert.equal(r.rights.full_text_stored,false);assert.equal(r.data.id,r.id);}
 for(const a of packet.assessments){validateSchema(a,resolve(cs.$defs.assessment,cs),a.id);assert.equal(a.scope_kind,'shared-context');assert.equal(a.industry_code,null);assert.equal(a.status,'partial');assert.equal(a.professional_review,'not-performed');}
 for(const q of packet.question_rows){assert.deepEqual(packet.records.find(r=>r.id===q.record_id).data.research_questions[Number(q.pointer.split('/').at(-1))],q);for(const l of q.source_locators){assert.equal(index.get(l.source_id)?.source_url,l.url);assert.ok(l.locator&&l.effective_period&&l.access_limits);}}
 for(const r of packet.sources)assert.equal(r.data.source_license,'unknown');
 for(const id of ['guide-aa-i106-finance-insurance','guide-real-estate-us-roles','guide-holding-management-us-close','guide-us-nonprofit-cross-industry-routing'])assert.ok(packet.baseline.reused_record_ids.includes(id));
 assert.equal(packet.mapping_overrides[packet.records[0].id].industry_mappings.length,0);
});

test('four family entity books balance and close bank cash independently from stated journals',()=>{
 const documents=new Set(example.synthetic_documents.map(d=>d.id));
 for(const j of example.journals){assert.equal(sum(j.lines.map(signed)),0,j.id);assert.ok(documents.has(j.evidence_id));for(const l of j.lines){assert.ok(Number.isSafeInteger(l.debit_cents)&&Number.isSafeInteger(l.credit_cents));assert.ok(l.debit_cents>=0&&l.credit_cents>=0);}}
 for(const en of example.entities){assert.equal(sum(en.opening.map(signed)),0,en.id);const derived=ledger(en);assert.equal(sum(Object.values(derived)),0,en.id);assert.deepEqual(Object.fromEntries(Object.entries(derived).sort()),Object.fromEntries(Object.entries(totals(en.closing_trial_balance)).sort()));assert.equal(derived.cash+sum(en.bank_reconciling_items.map(i=>i.amount_cents)),en.closing_bank_statement_cents);assert.ok(Object.keys(derived).every(a=>en.account_types[a]),en.id);}
 const O=ledger(example.entities.find(e=>e.id==='O')),I=ledger(example.entities.find(e=>e.id==='I'));
 assert.equal(O.due_I,-I.due_O);assert.equal(O.due_I,100000);
 assert.equal(O.due_T,0);assert.equal(O.due_P,0);
});

test('family investment quantity, commitments, provisional carry and separate tax basis recompute',()=>{
 const inp=example.evidence_inputs, liquid=inp.liquid_investment,fund=inp.private_fund,I=ledger(example.entities.find(e=>e.id==='I'));
 assert.equal(liquid.opening_shares+liquid.purchased_shares,liquid.closing_shares);
 const cost=liquid.opening_shares*liquid.opening_price_cents+liquid.purchased_shares*liquid.purchase_price_cents;
 const market=liquid.closing_shares*liquid.closing_price_cents;
 assert.equal(market,liquid.closing_statement_value_cents);assert.equal(market,I.quoted_equity);assert.equal(market-cost,-I.unrealized_gain);
 assert.equal(fund.opening_funded_cents+fund.call_cents,fund.ending_funded_cents);
 assert.equal(fund.commitment_cents-fund.ending_funded_cents,fund.unfunded_cents);
 assert.equal(fund.supplied_return_of_capital_cents+fund.supplied_income_cents,fund.distribution_cash_cents);
 assert.equal(fund.opening_funded_cents+fund.call_cents-fund.supplied_return_of_capital_cents,I.private_fund_provisional);
 assert.equal(I.private_fund_provisional,fund.provisional_book_carry_cents);
 assert.equal(fund.last_nav_statement_cents-I.private_fund_provisional,fund.unposted_measurement_difference_cents);
 assert.ok(fund.last_nav_statement_date<'2026-09-30');assert.equal(fund.measurement_status,'unresolved-stale-valuation');
 const basis=fund.tax_basis_workpaper;
 assert.equal(basis.opening_basis_cents+basis.contribution_cents+basis.assumed_allocable_tax_income_cents-basis.distribution_cents,basis.illustrative_ending_basis_cents);
 assert.notEqual(basis.illustrative_ending_basis_cents,I.private_fund_provisional);
 assert.ok(!example.journals.some(j=>j.evidence_id==='STALE-NAV-POST'));
});

test('family shared cost allocations, payroll and Texas principal-income schedules recompute',()=>{
 const i=example.evidence_inputs;
 const units=sum(Object.values(i.time_units));
 for(const [en,n] of Object.entries(i.time_units))assert.equal(i.vendor_bill_cents*n/units,i.allocated_cents[en]);
 assert.equal(sum(Object.values(i.allocated_cents)),i.vendor_bill_cents);
 assert.equal(i.payroll.gross_cents-i.payroll.employee_withholding_cents,i.payroll.net_cash_cents);
 const O=ledger(example.entities.find(e=>e.id==='O'));
 assert.equal(O.wages_expense,i.payroll.gross_cents);assert.equal(-O.withholding_payable,i.payroll.employee_withholding_cents);assert.equal(-O.employer_tax_payable,i.payroll.employer_tax_cents);
 const t=i.trust,T=ledger(example.entities.find(e=>e.id==='T'));
 assert.equal(t.income_fee_cents+t.principal_fee_cents,t.accounting_fee_cents);
 assert.equal(t.income_fee_cents,t.accounting_fee_cents/2);
 assert.equal(t.interest_cash_cents-t.income_fee_cents-t.authorized_income_distribution_cents,t.ending_undistributed_income_cents);
 assert.equal(-T.opening_principal+(t.sale_cash_cents-t.sold_carry_cents)-t.principal_fee_cents,t.ending_principal_cents);
 assert.equal(t.ending_principal_cents+t.ending_undistributed_income_cents,T.cash+T.bonds+T.interest_I);
 assert.ok(Date.parse(t.bond_sale)-Date.parse(t.bond_acquired)>365*86400000);
 assert.match(i.vendor_scope,/both income and remainder/);
});

test('two-sided transfers and supplemental adjustments remove duplicates without changing entity books',()=>{
 const before=JSON.stringify(example.entities);
 for(const t of example.internal_matching){const pair=example.journals.filter(j=>j.internal_transfer_id===t.id);assert.equal(pair.length,2,t.id);const payer=pair.find(j=>j.entity_id===t.payer),payee=pair.find(j=>j.entity_id===t.payee);assert.equal(-sum(payer.lines.filter(l=>l.account==='cash').map(signed)),t.amount_cents);assert.equal(sum(payee.lines.filter(l=>l.account==='cash').map(signed)),t.amount_cents);}
 const raw=new Map(example.entities.map(e=>[e.id,ledger(e)]));
 const type=(en,a)=>example.entities.find(e=>e.id===en).account_types[a];
 const category=(books,wanted)=>sum([...books].flatMap(([id,b])=>Object.entries(b).filter(([a])=>type(id,a)===wanted).map(([,v])=>v)));
 const sup=example.supplemental_view,ex=sup.expected;
 const opening=new Map(example.entities.map(e=>[e.id,totals(e.opening)]));
 assert.equal(category(opening,'asset'),ex.opening_raw_assets_cents);
 assert.equal(sum([...opening.values()].map(b=>b.cash)),ex.opening_cash_cents);
 assert.equal(opening.get('P').interest_O+opening.get('P').interest_I+opening.get('T').interest_I,ex.opening_duplicate_interests_cents);
 assert.equal(ex.opening_raw_assets_cents-ex.opening_duplicate_interests_cents,ex.opening_supplemental_net_assets_cents);
 assert.equal(category(raw,'asset'),ex.ending_raw_assets_cents);assert.equal(-category(raw,'liability'),ex.ending_raw_liabilities_cents);
 const adjusted=new Map([...raw].map(([id,b])=>[id,{...b}]));
 for(const j of sup.adjustments){assert.equal(sum(j.lines.map(signed)),0,j.id);for(const l of j.lines)adjusted.get(l.entity_id)[l.account]+=signed(l);}
 assert.equal(category(adjusted,'asset'),ex.ending_assets_cents);assert.equal(-category(adjusted,'liability'),ex.ending_external_liabilities_cents);
 assert.equal(category(adjusted,'asset')+category(adjusted,'liability'),ex.ending_net_assets_cents);
 assert.equal(ex.ending_net_assets_cents-ex.opening_supplemental_net_assets_cents,ex.net_change_cents);
 assert.equal(-category(adjusted,'income'),ex.external_income_and_gains_cents);assert.equal(category(adjusted,'expense'),ex.external_costs_cents);assert.equal(category(adjusted,'distribution'),0);
 assert.equal(ex.external_income_and_gains_cents-ex.external_costs_cents,ex.net_change_cents);
 assert.equal(sum([...raw.values()].map(b=>b.cash)),ex.ending_cash_cents);
 const external=example.journals.filter(j=>!j.internal_transfer_id).flatMap(j=>j.lines.filter(l=>l.account==='cash'));
 assert.equal(sum(external.map(l=>l.debit_cents)),ex.external_cash_inflows_cents);assert.equal(sum(external.map(l=>l.credit_cents)),ex.external_cash_outflows_cents);
 assert.equal(ex.opening_cash_cents+ex.external_cash_inflows_cents-ex.external_cash_outflows_cents,ex.ending_cash_cents);
 assert.equal(sum(Object.values(sup.asset_components_cents)),ex.ending_assets_cents);
 assert.equal(before,JSON.stringify(example.entities));
 assert.match(sup.purpose,/Not P-owned wealth/);
});

test('family office import preserves prior objects, replays and refuses late conflicts before writes',()=>{
 const dir=harness();
 try{const before=snapshot(dir);applyToRoot(dir);for(const f of targetFiles.filter(f=>f.startsWith('data/corpus/'))){const now=read(path.join(dir,f));for(const old of JSON.parse(before.get(f)))assert.deepEqual(now.find(r=>r.id===old.id),old,old.id);}
 assert.deepEqual(fs.readFileSync(path.join(dir,'data/catalog.json')),before.get('data/catalog.json'));
 const first=snapshot(dir);assert.equal(applyToRoot(dir).changed,0);for(const[f,b]of first)assert.deepEqual(fs.readFileSync(path.join(dir,f)),b,f);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
 for(const kind of ['late-assessment','unknown-edition']){const d=harness();try{const f=kind==='late-assessment'?'data/coverage/assessments.json':'data/catalog.json',v=read(path.join(d,f));if(kind==='late-assessment')v.assessments.push({...packet.assessments.at(-1),scope:'Conflicting newer scope'});else v.corpus_version='unknown';fs.writeFileSync(path.join(d,f),JSON.stringify(v,null,2)+'\n');const before=snapshot(d);assert.throws(()=>applyToRoot(d));for(const[f,b]of before)assert.deepEqual(fs.readFileSync(path.join(d,f)),b,f);}finally{fs.rmSync(d,{recursive:true,force:true});}}
});

test('family office applied corpus validates and real agent retrieves answers and six scope counterexamples',async()=>{
 const dir=harness();try{applyToRoot(dir);execFileSync(process.execPath,['scripts/coverage-mappings.mjs'],{cwd:dir,stdio:'pipe'});execFileSync(process.execPath,['scripts/validate.mjs'],{cwd:dir,stdio:'pipe'});
 const bundle=path.join(dir,'family-agent.mjs');execFileSync(path.join(root,'node_modules/.bin/esbuild'),['src/agent.ts','--bundle','--platform=node','--format=esm',`--outfile=${bundle}`],{cwd:dir,stdio:'pipe'});
 const {executeAgent}=await import(pathToFileURL(bundle));
 for(const f of packet.retrieval_fixtures.search){const hits=executeAgent('search',{q:f.query,kind:f.kind,limit:f.limit}).results;for(const id of f.expected_record_ids)assert.ok(hits.some(r=>r.id===id),`${f.query}: ${hits.map(r=>r.id)}`);}
 const got=executeAgent('get',{id:'example-family-office-four-entity-close',section:'data.scope_counterexamples',limit:20});
 for(const c of packet.records.find(r=>r.kind==='example').data.scope_counterexamples)assert.ok(JSON.stringify(got).includes(c.rejected_inference),c.id);
 const context=executeAgent('context',{ids:['guide-family-office-us-accounting'],include_sources:true,max_chars:40000});
 assert.ok(context.records.some(r=>r.record.id==='guide-family-office-us-accounting'));
 for(const id of packet.records[0].source_ids){
   assert.ok(context.records.some(r=>r.record.id===id)||context.omitted.some(r=>r.id===id&&r.reason==='character-budget'),id);
   // Follow budget omissions explicitly, preserving each source's rights and citation.
   const source=executeAgent('get',{id,limit:1});
   assert.equal(source.record.id,id);assert.ok(source.record.rights);assert.ok(JSON.stringify(source.record).includes(packet.question_rows.flatMap(q=>q.source_locators).find(l=>l.source_id===id).url));
 }
 assert.ok(context.budget.used_chars<=40000);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
