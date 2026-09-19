import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {records} from '../dist/internal/corpus.mjs';
import {executeAgent} from '../dist/internal/agent.mjs';
import {readSourceArchiveMembers} from '../scripts/source-archive.mjs';
const read=p=>JSON.parse(fs.readFileSync(p));
const packet=read('data/research/aa-i123-entity-events.json');
const byId=new Map(records.map(r=>[r.id,r]));
const fixture=byId.get('example-aa-i123-entity-events');
const cases=new Map(fixture.data.examples.map(c=>[c.id,c]));
const sha=b=>createHash('sha256').update(b).digest('hex');

test('AA-I123 preserves the original 14-question population and source/role limits',()=>{
  const inventory=read('data/research/aa-i123-inventory.json');
  assert.equal(inventory.existing_named_questions.length,14);
  assert.equal(inventory.associated_records.length,89);
  const registry=read('data/coverage/research-questions.json').questions;
  for(const old of inventory.existing_named_questions)assert.deepEqual(registry.find(q=>q.id===old.id),old);
  const assessments=read('data/coverage/assessments.json').assessments;
  for(const q of packet.questions){
    const row=registry.find(r=>r.id===q.id);
    const guide=byId.get(row.record_id);
    const actual=row.pointer.split('/').slice(1).reduce((v,k)=>v[k],guide);
    assert.equal(actual.id,q.id);
    assert.deepEqual(new Set(actual.source_locators.map(l=>l.source_id)),new Set(q.source_ids));
    for(const l of actual.source_locators){assert.equal(l.url,byId.get(l.source_id).source_url);assert.ok(l.locator.length>20&&l.effective_period);}
    const assessment=assessments.find(a=>a.named_question_id===q.id);
    assert.equal(assessment.status,'partial');assert.equal(assessment.industry_code,null);
    assert.ok(assessment.gaps.some(g=>/current|Current/.test(g)));
    assert.equal(actual.assessment.professional_review,'not-performed');
    assert.equal(assessment.dimensions['empirical-support'],'not-assessed');
  }
});

test('AA-I123 representative search and source-pointer retrieval find the new bounded answers',()=>{
  for(const [q,id] of [['US business versus asset acquisition','guide-q-business-combinations'],['policyholder insurance recovery','guide-q-insurance-policyholder'],['retirement versus remediation','guide-q-environmental']]){
    const result=executeAgent('search',{q,limit:25});
    assert.ok(result.results.some(r=>r.id===id),`${q}: expected ${id}`);
    const passages=[];
    let cursor;
    do {
      const page=executeAgent('get',{id,section:'data.research_questions',limit:20,...(cursor?{cursor}:{})});
      passages.push(...page.passages);
      cursor=page.next_cursor;
      assert.ok(passages.length<1000,'research-question pagination must terminate');
    } while(cursor);
    assert.ok(passages.some(p=>p.text.includes('rq-aa-i123')));
    assert.ok(passages.every(p=>p.source_pointers.every(s=>s.startsWith('/data/research_questions/'))));
  }
  const insurer=executeAgent('search',{q:'',question_family:'q-insurer',kind:'guide',limit:25});
  assert.ok(!insurer.results.some(r=>r.id==='guide-q-insurance-policyholder'),'policyholder must not inherit insurer applicability');
});

test('AA-I123 transaction, claim, cost and retirement bridges expose independent counterexamples',()=>{
  const a=cases.get('acquisition');assert.equal(a.consideration-(a.identifiable_assets-a.assumed_liabilities),a.residual);
  assert.equal(a.counterexample.same_cash_price,a.consideration);assert.equal(a.counterexample.goodwill_from_residual,false);
  assert.match(a.treatment,/requires/);
  const j=cases.get('jv');assert.ok(j.counterexample.formation_date<'2025-01-01');assert.equal(j.counterexample.automatic_2025_model,false);
  const r=cases.get('related-party');assert.equal(r.service_charge-r.cash_paid,r.closing_due);assert.equal(r.counterexample.private_common_control_alternative_eligible,false);
  const c=cases.get('claim');assert.equal(c.claim_liability,100000);assert.equal(c.recognized_recovery,0);assert.equal(c.potential_recovery,60000);assert.equal(c.net_liability_plug_allowed,false);
  assert.equal(c.independent_revision.new_claim_estimate-c.claim_liability,c.independent_revision.additional_expense);assert.equal(c.independent_revision.recognized_recovery,c.recognized_recovery);
  assert.notEqual(c.journals[0].amount,c.claim_liability-c.potential_recovery);
  const g=cases.get('guarantee');assert.equal(g.premium,g.initial_liability);assert.match(g.counterexample,/exceptions/);
  const e=cases.get('exit');assert.equal(e.received_relocation_services-e.cash_paid,e.closing_payable);assert.equal(e.budget-e.received_relocation_services,e.unreceived_budget);
  const d=cases.get('disposal');assert.equal(d.held_for_sale_supported,false);assert.equal(d.discontinued_operation_supported,false);
  const t=cases.get('retirement');assert.ok(Math.abs(t.opening_cash_flow/(1+t.original_rate)**t.opening_years-t.opening)<0.01);
  assert.ok(Math.abs(t.revision_future_cash_flow/(1+t.revision_rate)**t.revision_years-t.upward_revision)<0.01);
  assert.equal(t.opening*t.original_rate,t.accretion);assert.equal(t.opening+t.accretion+t.upward_revision-t.settlement,t.closing);
  assert.match(t.counterexample,/remediation/);
  assert.ok(fixture.data.examples.every(e=>e.source_ids.length&&e.approval.status!=='approved'));
});

test('AA-I123 source rights and same-build export/archive membership remain exact',()=>{
  const manifest=read('dist/client/downloads/accounting-agents-source.manifest.json');
  assert.equal(manifest.corpus_version,packet.version);
  const archive=manifest.mode==='single'?fs.readFileSync(`dist/client${manifest.archive_path}`):Buffer.concat(manifest.parts.map(p=>fs.readFileSync(`dist/client${p.path}`)));
  assert.equal(sha(archive),manifest.archive_sha256);
  const members=readSourceArchiveMembers(archive);
  for(const file of ['data/research/aa-i123-entity-events.json','data/research/aa-i123-inventory.json','scripts/integrate-aa-i123.mjs','data/corpus/guide.json','data/corpus/example.json']){
    const member=members.find(m=>m.path===file);assert.ok(member,file);assert.equal(member.sha256,sha(fs.readFileSync(file)));
  }
  const release=read(`data/releases/${packet.version}/corpus.json`);
  const exported=release.records;
  for(const id of [...packet.sources.map(s=>s.id),fixture.id]){
    const r=byId.get(id);assert.equal(r.rights.full_text_stored,false);
    assert.deepEqual(exported.find(x=>x.id===id).rights,r.rights);
  }
  const snapshot=read('data/coverage/snapshots.json').snapshots.find(s=>s.id===packet.version);
  assert.deepEqual(snapshot.summary,read('dist/client/downloads/coverage.json').summary);
});

test('AA-I123 replay is byte-stable and does not touch unrelated importer packages',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'aa-i123-replay-'));
  try{
    for(const dir of ['data/corpus','data/coverage','data/research']){fs.mkdirSync(path.join(root,dir),{recursive:true});for(const file of fs.readdirSync(dir))if(file.endsWith('.json'))fs.copyFileSync(path.join(dir,file),path.join(root,dir,file));}
    fs.copyFileSync('data/catalog.json',path.join(root,'data/catalog.json'));
    const before=new Map();
    for(const dir of ['data/corpus','data/coverage','data/research'])for(const file of fs.readdirSync(path.join(root,dir)))before.set(`${dir}/${file}`,fs.readFileSync(path.join(root,dir,file)));
    const result=spawnSync(process.execPath,[path.resolve('scripts/integrate-aa-i123.mjs')],{cwd:root,encoding:'utf8'});
    assert.equal(result.status,0,result.stderr);
    for(const [file,bytes] of before)assert.deepEqual(fs.readFileSync(path.join(root,file)),bytes,file);
  }finally{fs.rmSync(root,{recursive:true,force:true});}
});
