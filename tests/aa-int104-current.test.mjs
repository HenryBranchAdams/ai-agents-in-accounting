import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync, spawnSync} from 'node:child_process';

const base = 'a3173ff92b1ef586fa3ba1b25be4f337ded82f95';
const helper = path.resolve('scripts/integrate-transport.mjs');
const proposal = 'data/research/transport-2026-09-19.json';
const kinds = ['source', 'guide', 'workflow', 'control', 'example'];
const files = ['data/catalog.json', ...kinds.map(k=>`data/corpus/${k}.json`), ...['research-questions','research-criteria','assessments','mapping-overrides','subsector-profiles','subsector-screening'].map(k=>`data/coverage/${k}.json`), 'data/research-questions.json'];
const read = f=>JSON.parse(fs.readFileSync(f));
const bytes = root=>files.map(f=>[f,fs.readFileSync(path.join(root,f))]);
function fixture() {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'aa-int104-'));
  for(const file of [...files,proposal]) {
    const dest=path.join(root,file); fs.mkdirSync(path.dirname(dest),{recursive:true});
    fs.writeFileSync(dest,file===proposal?fs.readFileSync(file):execFileSync('git',['show',`${base}:${file}`],{maxBuffer:32*1024*1024}));
  }
  return root;
}
const run=(root,...args)=>spawnSync(process.execPath,[helper,'--current',...args],{cwd:root,encoding:'utf8'});

test('current transport application preserves all previous records and questions and replays without changing bytes',()=>{
  const root=fixture();
  try {
    const before=bytes(root), oldRecords=kinds.flatMap(k=>read(path.join(root,`data/corpus/${k}.json`))), oldQuestions=read(path.join(root,'data/coverage/research-questions.json')).questions;
    let result=run(root,'--dry-run'); assert.equal(result.status,0,result.stderr); assert.deepEqual(bytes(root),before);
    result=run(root); assert.equal(result.status,0,result.stderr);
    const records=new Map(kinds.flatMap(k=>read(path.join(root,`data/corpus/${k}.json`))).map(r=>[r.id,r]));
    for(const old of oldRecords) assert.deepEqual(records.get(old.id),old,old.id);
    const questions=read(path.join(root,'data/coverage/research-questions.json')).questions;
    for(const old of oldQuestions) assert.deepEqual(questions.find(q=>q.id===old.id),old,old.id);
    assert.equal(records.size,oldRecords.length+13);
    assert.equal(questions.length,oldQuestions.length+5);
    const applied=bytes(root); result=run(root); assert.equal(result.status,0,result.stderr); assert.deepEqual(bytes(root),applied);
  } finally {fs.rmSync(root,{recursive:true,force:true});}
});

test('unknown editions and late retrieval or mapping conflicts are refused before any transport write',()=>{
  for(const defect of ['edition','retrieval','mapping']) {
    const root=fixture();
    try {
      if(defect!=='edition') {const r=run(root);assert.equal(r.status,0,r.stderr);}
      const file=defect==='edition'?'data/catalog.json':defect==='retrieval'?'data/research-questions.json':'data/coverage/mapping-overrides.json';
      const value=read(path.join(root,file)), packet=read(path.join(root,proposal));
      if(defect==='edition') value.corpus_version='2099-01-01.1';
      if(defect==='retrieval') value.find(row=>row.id===packet.retrieval_fixtures[0].id).expected_ids=['guide-q-leases'];
      if(defect==='mapping') value.records[Object.keys(packet.mapping_overrides.records)[0]].reason='Conflicting source basis';
      fs.writeFileSync(path.join(root,file),JSON.stringify(value,null,2)+'\n');
      const before=bytes(root), result=run(root); assert.notEqual(result.status,0,defect); assert.deepEqual(bytes(root),before,defect);
    } finally {fs.rmSync(root,{recursive:true,force:true});}
  }
});
