import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';

const base='d07dd357b9b8faa1ba32cb534c8397030364d3fd';
const kinds=['source','guide','workflow','control','example'];
const files=['data/catalog.json',...kinds.map(k=>`data/corpus/${k}.json`),...['research-questions','research-criteria','assessments','mapping-overrides','subsector-profiles','subsector-screening'].map(k=>`data/coverage/${k}.json`),'data/research-questions.json'];
const proposals=['manufacturing-conversion-2026-09-18.json','information-2026-09-19.json','information-retrieval-2026-09-19.json'].map(n=>`data/research/${n}`);
const read=f=>JSON.parse(fs.readFileSync(f));
const bytes=root=>files.map(f=>[f,fs.readFileSync(path.join(root,f))]);
function fixture(){const root=fs.mkdtempSync(path.join(os.tmpdir(),'aa-int101105-'));for(const f of [...files,...proposals]){const dest=path.join(root,f);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,proposals.includes(f)?fs.readFileSync(f):execFileSync('git',['show',`${base}:${f}`],{maxBuffer:32*1024*1024}));}return root;}
const run=(root,name,...args)=>spawnSync(process.execPath,[path.resolve(`scripts/integrate-${name}.mjs`),'--current',...args],{cwd:root,env:{...process.env,AA_INFORMATION_ROOT:root},encoding:'utf8'});

test('manufacturing and information preserve prior source metadata and guide answers through current application and replay',()=>{
  const root=fixture();
  try {
    const old=kinds.flatMap(k=>read(path.join(root,`data/corpus/${k}.json`))),before=bytes(root),p=read(path.join(root,proposals[0]));
    let r=run(root,'manufacturing-conversion','--dry-run');assert.equal(r.status,0,r.stderr);assert.deepEqual(bytes(root),before);
    for(const name of ['manufacturing-conversion','information']){r=run(root,name);assert.equal(r.status,0,r.stderr);}
    const records=new Map(kinds.flatMap(k=>read(path.join(root,`data/corpus/${k}.json`))).map(r=>[r.id,r]));
    for(const prior of old){const actual=structuredClone(records.get(prior.id));if(prior.id==='guide-manufacturing-conversion'){
      assert.deepEqual(actual.source_ids,[...new Set([...prior.source_ids,...p.application.required_source_ids])]);actual.source_ids=prior.source_ids;
      assert.deepEqual(actual.related_ids,[...new Set([...prior.related_ids,p.example.id,...p.baseline.reused_foundations])]);actual.related_ids=prior.related_ids;
      delete actual.provenance.manufacturing_us_supplement;delete actual.data.us_manufacturing;
      for(const q of actual.data.research_questions){const previous=prior.data.research_questions.find(x=>x.id===q.id),incoming=p.questions.find(x=>x.id===q.id);if(incoming){assert.deepEqual(q.source_ids,[...new Set([...previous.source_ids,...incoming.source_ids])]);assert.deepEqual(q.us_application,incoming);q.source_ids=previous.source_ids;delete q.us_application;}}
    }assert.deepEqual(actual,prior,prior.id);}
    assert.equal(records.size,old.length+9);
    const first=bytes(root);for(const name of ['manufacturing-conversion','information']){r=run(root,name);assert.equal(r.status,0,r.stderr);}assert.deepEqual(bytes(root),first);
  }finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('current combined import refuses source identity, edition and late retrieval conflicts before writes',()=>{
  for(const defect of ['edition','source-url','retrieval']){const root=fixture();try{
    if(defect==='retrieval')for(const name of ['manufacturing-conversion','information']){const r=run(root,name);assert.equal(r.status,0,r.stderr);}
    const file=defect==='edition'?'data/catalog.json':defect==='source-url'?proposals[0]:'data/research-questions.json',value=read(path.join(root,file));
    if(defect==='edition')value.corpus_version='2099-01-01.1';
    if(defect==='source-url')value.source_checks[0].url='https://example.invalid/unrelated';
    if(defect==='retrieval')value.find(r=>r.id==='rq-information-provider-role').expected_ids=['guide-q-leases'];
    fs.writeFileSync(path.join(root,file),JSON.stringify(value,null,2)+'\n');const before=bytes(root),r=run(root,defect==='retrieval'?'information':'manufacturing-conversion');assert.notEqual(r.status,0,defect);assert.deepEqual(bytes(root),before,defect);
  }finally{fs.rmSync(root,{recursive:true,force:true});}}
});
