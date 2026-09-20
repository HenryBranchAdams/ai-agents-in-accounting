import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {validateSchema} from '../scripts/validate.mjs';
import {applyToRoot,packetFile,runAppliedValidation} from '../scripts/integrate-other-services.mjs';

const root=process.cwd();
const read=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
const packet=read(packetFile);
const examples=packet.records.filter(r=>r.kind==='example');
const cases=examples.flatMap(r=>r.data.examples);
const canonical=fs.readdirSync('data/corpus').filter(n=>n.endsWith('.json')).map(n=>`data/corpus/${n}`);
const files=['data/catalog.json',...canonical,'data/coverage/research-questions.json','data/coverage/assessments.json','data/coverage/mapping-overrides.json','data/coverage/research-criteria.json'];
const show=file=>execFileSync('git',['show',`${packet.base_commit}:${file}`],{maxBuffer:64*1024*1024});
const write=(dir,file,value)=>fs.writeFileSync(path.join(dir,file),JSON.stringify(value,null,2)+'\n');
function harness(){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'other-services-source-'));for(const file of files){fs.mkdirSync(path.dirname(path.join(dir,file)),{recursive:true});fs.writeFileSync(path.join(dir,file),show(file));}fs.mkdirSync(path.join(dir,'data/research'),{recursive:true});fs.copyFileSync(packetFile,path.join(dir,packetFile));fs.mkdirSync(path.join(dir,'scripts'),{recursive:true});fs.copyFileSync('scripts/integrate-other-services.mjs',path.join(dir,'scripts/integrate-other-services.mjs'));return dir;}
const snap=dir=>new Map(files.map(file=>[file,fs.readFileSync(path.join(dir,file))]));
const unchanged=(dir,before)=>{for(const [file,bytes] of before)assert.deepEqual(fs.readFileSync(path.join(dir,file)),bytes,file);};
function trial(entries,accounts){const balance={};for(const entry of entries){assert.equal(entry.lines.reduce((n,line)=>n+line.debit_cents-line.credit_cents,0),0,entry.id);for(const line of entry.lines){assert.ok(Number.isSafeInteger(line.debit_cents)&&Number.isSafeInteger(line.credit_cents));assert.ok(line.debit_cents>=0&&line.credit_cents>=0);assert.ok(accounts[line.account],line.account);balance[line.account]=(balance[line.account]||0)+line.debit_cents-line.credit_cents;}}return Object.fromEntries(Object.entries(balance).filter(([,value])=>value));}

test('other-services baseline pins the four NAICS 81 records and selected residual population',()=>{
  const ids=['guide-industry-naics2022-811','guide-industry-naics2022-812','guide-industry-naics2022-813','guide-industry-naics2022-814'];
  assert.deepEqual(packet.baseline.associated_records.map(r=>r.id),ids);
  assert.equal(packet.baseline.associated_record_count,4);
  assert.equal(packet.scope.selected_roles.length,5);
  const families=new Set(packet.question_rows.flatMap(q=>q.family_ids));
  const registry=JSON.parse(show('data/coverage/research-questions.json')).questions;
  const linked=registry.filter(q=>ids.includes(q.record_id)||q.family_ids?.some(f=>families.has(f)));
  assert.deepEqual(packet.baseline.linked_questions.map(q=>q.id),linked.map(q=>q.id));
  assert.equal(packet.question_rows.length,6);
});

test('source, question and assessment schemas preserve URL identity, periods, rights and partial status',()=>{
  const coverage=read('schemas/coverage.schema.json');
  const resolve=value=>Array.isArray(value)?value.map(resolve):value&&typeof value==='object'?value.$ref?resolve(value.$ref.split('/').slice(1).reduce((v,k)=>v[k],coverage)):Object.fromEntries(Object.entries(value).map(([k,v])=>[k,resolve(v)])):value;
  for(const row of [...packet.sources,...packet.records])validateSchema(row,read('schemas/record.schema.json'),row.id);
  for(const assessment of packet.assessments){validateSchema(assessment,resolve(coverage.$defs.assessment),assessment.id);assert.equal(assessment.status,'partial');assert.equal(assessment.source_currency,'unknown');}
  const sources=new Map([...read('data/corpus/source.json'),...packet.sources].map(row=>[row.id,row]));
  for(const question of packet.question_rows){assert.deepEqual(packet.records[0].data.research_questions.find(q=>q.id===question.id),question);for(const locator of question.source_locators){assert.equal(locator.url,sources.get(locator.source_id)?.source_url);assert.ok(locator.locator&&locator.effective_period&&locator.access_limits);}}
  for(const source of packet.sources){assert.equal(source.rights.full_text_stored,false);assert.equal(source.rights.source_status,'unknown');}
  assert.equal(packet.sources.length,2);assert.equal(packet.records.length,5);
});

test('repair, laundry, funeral, membership and household cases independently balance',()=>{
  const accounts=examples[0].data.accounts;
  for(const entry of cases){const actual=trial(entry.journals,accounts);assert.deepEqual(actual,entry.trial_balance,entry.id);assert.equal(Object.values(actual).reduce((a,b)=>a+b,0),0,entry.id);assert.equal(entry.reconciliation.assets_cents-entry.reconciliation.liabilities_cents,entry.reconciliation.equity_cents+entry.reconciliation.net_income_cents,entry.id);}
  const repair=cases.find(c=>c.id==='repair-parts-labor-warranty');assert.equal(repair.inputs.parts_revenue_cents+repair.inputs.service_revenue_cents,1300000);assert.equal(-repair.trial_balance.parts_revenue,repair.inputs.parts_revenue_cents);assert.equal(-repair.trial_balance.repair_revenue,repair.inputs.service_revenue_cents);assert.equal(-repair.trial_balance.warranty_liability,repair.inputs.warranty_estimate_cents);
  const funeral=cases.find(c=>c.id==='funeral-preneed-deposit');assert.equal(-funeral.trial_balance.preneed_liability,400000);assert.equal(-funeral.trial_balance.funeral_revenue,100000);assert.equal(funeral.inputs.provider_owned_restricted_deposit,true);assert.match(funeral.assumptions.join(' '),/third party owns.*custody/i);assert.match(funeral.assumptions.join(' '),/milestone.*completed/i);
  const membership=cases.find(c=>c.id==='membership-dues-restricted-support');assert.equal(-membership.trial_balance.membership_revenue,membership.inputs.membership_benefit_value_cents);assert.equal(-membership.trial_balance.contribution_revenue,membership.inputs.membership_contribution_cents);assert.equal(-membership.trial_balance.restricted_contribution,membership.inputs.restricted_support_cents);assert.equal(membership.trial_balance.net_assets_without_donor_restrictions,-300000);assert.equal(membership.reconciliation.net_income_cents,1500000);assert.equal(membership.reconciliation.equity_cents,0);assert.equal(membership.inputs.membership_months_delivered,4);
  const household=cases.find(c=>c.id==='household-employer-payroll');assert.equal(household.inputs.gross_wages_cents-household.inputs.employee_fica_cents-household.inputs.federal_withholding_cents,524100);assert.equal(-household.trial_balance.employee_tax_payable,household.inputs.employee_fica_cents);assert.equal(-household.trial_balance.employer_tax_payable,household.inputs.employer_fica_cents);assert.equal(household.inputs.tax_year,2026);assert.equal(household.inputs.federal_withholding_agreed,true);assert.match(household.assumptions.join(' '),/not automatic withholding/i);
  assert.ok(cases.some(c=>c.scenario_type==='positive')&&cases.every(c=>c.synthetic));
  assert.ok(cases.flatMap(c=>c.counterexamples).some(c=>c.id==='PRENEED-AS-IMMEDIATE-REVENUE'));
  assert.ok(cases.flatMap(c=>c.counterexamples).some(c=>c.id==='HOUSEHOLD-CONTRACTOR-AS-EMPLOYEE'));
});

test('source application stages, preserves old objects, rejects conflicts and replays byte-stably',()=>{
  const dir=harness();try{const before=snap(dir);applyToRoot(dir,{dryRun:true});unchanged(dir,before);applyToRoot(dir);assert.deepEqual(fs.readFileSync(path.join(dir,'data/catalog.json')),before.get('data/catalog.json'));for(const file of canonical){const after=JSON.parse(fs.readFileSync(path.join(dir,file)));for(const old of JSON.parse(before.get(file)))assert.deepEqual(after.find(row=>row.id===old.id),old,old.id);}for(const [file,key] of [['data/coverage/research-questions.json','questions'],['data/coverage/assessments.json','assessments']]){const after=JSON.parse(fs.readFileSync(path.join(dir,file)));for(const old of JSON.parse(before.get(file))[key])assert.deepEqual(after[key].find(row=>row.id===old.id),old);}const first=snap(dir);applyToRoot(dir);unchanged(dir,first);}finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('late mapping, URL, pointer and edition conflicts fail before any write',()=>{
  for(const type of ['mapping','url','pointer','edition']){const dir=harness();try{if(type==='mapping'){const file='data/coverage/mapping-overrides.json',value=JSON.parse(fs.readFileSync(path.join(dir,file)));value.records[packet.records[0].id]={conflicting:true};write(dir,file,value);}if(type==='url'){const file='data/corpus/source.json',value=JSON.parse(fs.readFileSync(path.join(dir,file)));value.push({...packet.sources[0],id:'conflicting-other-services-source'});write(dir,file,value);}if(type==='pointer'){const value=structuredClone(packet);value.question_rows[0].pointer='/data/missing';write(dir,packetFile,value);}if(type==='edition'){const file='data/catalog.json',value=JSON.parse(fs.readFileSync(path.join(dir,file)));value.corpus_version='unknown';write(dir,file,value);}const before=snap(dir);assert.throws(()=>applyToRoot(dir));unchanged(dir,before);}finally{fs.rmSync(dir,{recursive:true,force:true});}}
});

test('applied disposable Git fixture validates and exercises bundled agent search, context and get',async()=>{const result=await runAppliedValidation(root);assert.equal(result.temp_git_worktree,true);assert.match(result.validator_output,/Corpus integrity verified|Validated/);assert.match(result.retrieval_output,/searches/);});
