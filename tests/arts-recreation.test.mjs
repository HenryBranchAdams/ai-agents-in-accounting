import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {validateSchema} from '../scripts/validate.mjs';
import {applyToRoot,packetFile,runAppliedValidation} from '../scripts/integrate-arts-recreation.mjs';

const root=process.cwd();
const read=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
const packet=read(packetFile);
const examples=packet.records.filter(r=>r.kind==='example');
const cases=examples.flatMap(r=>r.data.cases);
const accounts=examples[0].data.accounts;
const canonical=fs.readdirSync('data/corpus').filter(n=>n.endsWith('.json')).map(n=>`data/corpus/${n}`);
const files=['data/catalog.json',...canonical,'data/coverage/research-questions.json','data/coverage/assessments.json','data/coverage/mapping-overrides.json','data/coverage/research-criteria.json'];
const show=file=>execFileSync('git',['show',`${packet.base_commit}:${file}`],{maxBuffer:64*1024*1024});
const write=(dir,file,value)=>fs.writeFileSync(path.join(dir,file),JSON.stringify(value,null,2)+'\n');
function harness(){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'arts-recreation-source-'));for(const file of files){fs.mkdirSync(path.dirname(path.join(dir,file)),{recursive:true});fs.writeFileSync(path.join(dir,file),show(file));}fs.mkdirSync(path.join(dir,'data/research'),{recursive:true});fs.copyFileSync(packetFile,path.join(dir,packetFile));fs.mkdirSync(path.join(dir,'scripts'),{recursive:true});fs.copyFileSync('scripts/integrate-arts-recreation.mjs',path.join(dir,'scripts/integrate-arts-recreation.mjs'));return dir;}
const snap=dir=>new Map(files.map(file=>[file,fs.readFileSync(path.join(dir,file))]));
const unchanged=(dir,before)=>{for(const [file,bytes] of before)assert.deepEqual(fs.readFileSync(path.join(dir,file)),bytes,file);};
function trial(entries){const balance={};for(const entry of entries){assert.equal(entry.lines.reduce((n,line)=>n+line.debit_cents-line.credit_cents,0),0,entry.id);for(const line of entry.lines){assert.ok(Number.isSafeInteger(line.debit_cents)&&Number.isSafeInteger(line.credit_cents));assert.ok(line.debit_cents>=0&&line.credit_cents>=0);assert.ok(accounts[line.account],line.account);balance[line.account]=(balance[line.account]||0)+line.debit_cents-line.credit_cents;}}return Object.fromEntries(Object.entries(balance).filter(([,value])=>value));}
const withoutZero=value=>Object.fromEntries(Object.entries(value).filter(([,number])=>number));
function totals(balance){const cat=kind=>Object.entries(balance).filter(([account])=>accounts[account]===kind).reduce((n,[,value])=>n+value,0);const income=-cat('revenue')-cat('expense');return {assets:cat('asset'),liabilities:-cat('liability'),income:Object.is(income,-0)?0:income,equity:-cat('equity')};}

test('arts/recreation baseline pins the three NAICS 71 records and selected question population',()=>{
 const mappings=JSON.parse(show('data/coverage/record-mappings.json')).mappings;
 const ids=['guide-industry-naics2022-711','guide-industry-naics2022-712','guide-industry-naics2022-713'];
 assert.deepEqual(packet.baseline.associated_records.map(r=>r.id),ids);
 assert.equal(packet.baseline.associated_record_count,3);
 assert.equal(packet.scope.selected_roles.length,4);
 const families=new Set(packet.question_rows.flatMap(q=>q.family_ids));
 const registry=JSON.parse(show('data/coverage/research-questions.json')).questions;
 const linked=registry.filter(q=>ids.includes(q.record_id)||q.family_ids?.some(f=>families.has(f)));
 assert.deepEqual(packet.baseline.linked_questions.map(q=>q.id),linked.map(q=>q.id));
 assert.equal(packet.question_rows.length,6);
});

test('source, question and assessment schemas preserve URL identity, periods, rights and partial status',()=>{
 const coverage=read('schemas/coverage.schema.json');
 const resolve=value=>Array.isArray(value)?value.map(resolve):value&&typeof value==='object'?value.$ref?resolve(value.$ref.split('/').slice(1).reduce((v,k)=>v[k],coverage)):Object.fromEntries(Object.entries(value).map(([k,v])=>[k,resolve(v)])):value;
 const recordSchema=read('schemas/record.schema.json');
 for(const row of [...packet.sources,...packet.records])validateSchema(row,recordSchema,row.id);
 for(const assessment of packet.assessments){validateSchema(assessment,resolve(coverage.$defs.assessment),assessment.id);assert.equal(assessment.status,'partial');assert.equal(assessment.source_currency,'unknown');}
 const sources=new Map([...read('data/corpus/source.json'),...packet.sources].map(row=>[row.id,row]));
 for(const question of packet.question_rows){for(const locator of question.source_locators){assert.equal(locator.url,sources.get(locator.source_id)?.source_url);assert.ok(locator.locator&&locator.effective_period&&locator.access_limits);}}
 for(const source of packet.sources){assert.equal(source.rights.full_text_stored,false);assert.equal(source.rights.source_status,'unknown');}
 assert.equal(packet.sources.length,1);assert.equal(packet.records.length,5);
});

test('event, museum, gaming and custody ledgers balance from connected inputs',()=>{
 const event=cases.find(c=>c.id==='event-producer-ticket-refund');const eb=trial(event.journals);assert.deepEqual(eb,withoutZero(event.trial_balance));
 assert.equal(event.inputs.tickets_sold*event.inputs.ticket_price_cents,event.inputs.tickets_sold*event.inputs.ticket_price_cents);
 const delivered=event.inputs.delivered_tickets*event.inputs.ticket_price_cents;const refunded=event.inputs.refunded_tickets*event.inputs.ticket_price_cents;
 assert.equal(delivered+refunded,event.inputs.tickets_sold*event.inputs.ticket_price_cents);assert.equal(-eb.ticket_revenue,delivered);assert.equal(eb.contract_liability||0,event.inputs.tickets_sold*event.inputs.ticket_price_cents-refunded-delivered);assert.equal(eb.event_expense,event.inputs.event_cost_cents);assert.equal(-eb.accounts_payable,event.inputs.event_cost_cents-event.inputs.event_cost_paid_cents);
 const et=totals(eb);assert.deepEqual(event.reconciliation,{assets_cents:et.assets,liabilities_cents:et.liabilities,net_income_cents:et.income});assert.equal(et.assets-et.liabilities,et.equity+et.income);
 const museum=cases.find(c=>c.id==='museum-membership-restricted-donor');const mb=trial(museum.journals);assert.deepEqual(mb,withoutZero(museum.trial_balance));const membership=museum.inputs.membership_cash_cents*museum.inputs.months_delivered/museum.inputs.membership_months;assert.equal(-mb.membership_revenue,membership);assert.equal(-mb.contribution_revenue_with_restrictions,museum.inputs.donor_restricted_cash_cents);assert.equal(mb.program_expense,museum.inputs.eligible_program_spend_cents);assert.equal(museum.inputs.donor_restricted_cash_cents-museum.inputs.eligible_program_spend_cents,500000);const mt=totals(mb);assert.deepEqual(museum.reconciliation,{assets_cents:mt.assets,liabilities_cents:mt.liabilities,net_income_cents:mt.income,net_assets_cents:mt.equity,restricted_unreleased_cents:museum.inputs.donor_restricted_cash_cents-museum.inputs.eligible_program_spend_cents});assert.equal(mt.assets-mt.liabilities,mt.equity+mt.income);
 const gaming=cases.find(c=>c.id==='charitable-gaming-tax-route');const gb=trial(gaming.journals);assert.deepEqual(gb,withoutZero(gaming.trial_balance));assert.equal(-gb.gross_gaming_receipts,gaming.inputs.gross_gaming_receipts_cents);assert.equal(gb.prizes_expense,gaming.inputs.prizes_paid_cents);assert.equal(gb.gaming_tax_expense,gaming.inputs.estimated_gaming_tax_cents);assert.equal(-gb.gaming_tax_payable,gaming.inputs.estimated_gaming_tax_cents-gaming.inputs.tax_paid_cents);const gt=totals(gb);assert.deepEqual(gaming.reconciliation,{assets_cents:gt.assets,liabilities_cents:gt.liabilities,net_income_cents:gt.income});assert.equal(gt.assets-gt.liabilities,gt.equity+gt.income);
 const custody=cases.find(c=>c.id==='gaming-custody-counterrole');const cb=trial(custody.journals);assert.deepEqual(cb,withoutZero(custody.trial_balance));assert.equal(cb.cash,custody.inputs.opening_capital_cents+custody.inputs.customer_wagers_received_cents-custody.inputs.customer_wagers_remitted_cents);assert.equal(-cb.wager_liability,custody.inputs.customer_wagers_received_cents-custody.inputs.customer_wagers_remitted_cents);const ct=totals(cb);assert.deepEqual(custody.reconciliation,{assets_cents:ct.assets,liabilities_cents:ct.liabilities,net_income_cents:ct.income});assert.equal(ct.income,0);
});

test('examples and counterroles keep scope boundaries explicit',()=>{
 assert.ok(examples.every(example=>example.data.cases.every(c=>c.synthetic)));
 for(const id of ['VENUE-AGENT-CUSTODY','SPONSORSHIP-AS-DONATION','MEMBERSHIP-AS-DONOR-GIFT'])assert.ok(examples[0].data.scope_counterexamples.some(c=>c.id===id&&c.outcome));assert.match(examples[0].data.scope_counterexamples.find(c=>c.id==='SPONSORSHIP-AS-DONATION').outcome,/acknowledgment alone does not establish an exchange/i);
 for(const id of ['GAMING-CUSTODY-COUNTERROLE','BINGO-EXCEPTION-UNVERIFIED','PUBLIC-MEMBER-ROUTE'])assert.ok(examples[1].data.scope_counterexamples.some(c=>c.id===id&&c.outcome));
 assert.ok(examples[1].data.limitations.some(x=>x.includes('State/local')));assert.ok(packet.common_limits.some(x=>x.includes('professional')));
});

test('source application stages, preserves old objects, rejects conflicts and replays byte-stably',()=>{
 const dir=harness();try{const before=snap(dir);applyToRoot(dir,{dryRun:true});unchanged(dir,before);applyToRoot(dir);assert.deepEqual(fs.readFileSync(path.join(dir,'data/catalog.json')),before.get('data/catalog.json'));for(const file of canonical){const after=JSON.parse(fs.readFileSync(path.join(dir,file)));for(const old of JSON.parse(before.get(file)))assert.deepEqual(after.find(row=>row.id===old.id),old,old.id);}for(const [file,key] of [['data/coverage/research-questions.json','questions'],['data/coverage/assessments.json','assessments']]){const after=JSON.parse(fs.readFileSync(path.join(dir,file)));for(const old of JSON.parse(before.get(file))[key])assert.deepEqual(after[key].find(row=>row.id===old.id),old,old.id);}const first=snap(dir);applyToRoot(dir);unchanged(dir,first);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('late mapping, URL, pointer and edition conflicts fail before any write',()=>{
 for(const type of ['mapping','url','pointer','edition']){const dir=harness();try{if(type==='mapping'){const file='data/coverage/mapping-overrides.json',value=JSON.parse(fs.readFileSync(path.join(dir,file)));value.records[packet.records[0].id]={conflicting:true};write(dir,file,value);}if(type==='url'){const file='data/corpus/source.json',value=JSON.parse(fs.readFileSync(path.join(dir,file)));value.push({...packet.sources[0],id:'conflicting-arts-source'});write(dir,file,value);}if(type==='pointer'){const value=structuredClone(packet);value.question_rows[0].pointer='/data/missing';write(dir,packetFile,value);}if(type==='edition'){const file='data/catalog.json',value=JSON.parse(fs.readFileSync(path.join(dir,file)));value.corpus_version='unknown';write(dir,file,value);}const before=snap(dir);assert.throws(()=>applyToRoot(dir));unchanged(dir,before);}finally{fs.rmSync(dir,{recursive:true,force:true});}}
});

test('applied disposable Git fixture validates and exercises bundled agent search, context and get',async()=>{const result=await runAppliedValidation(root);assert.equal(result.temp_git_worktree,true);assert.match(result.validator_output,/Corpus integrity verified|Validated/);assert.match(result.retrieval_output,/searches/);});
