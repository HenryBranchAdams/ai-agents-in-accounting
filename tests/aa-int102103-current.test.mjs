import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';
const base='b25458e744095e193eeee9d4644a920a6d50b249';
const payloadFiles=['data/research/aa-i102103-wholesale-retail-2026-09-19.json','data/research/aa-i102103-integration-records-2026-09-19.json'];
const files=['data/catalog.json',...['source','guide','example'].map(kind=>`data/corpus/${kind}.json`),...['research-questions','assessments','mapping-overrides','record-mappings','research-criteria','subsector-profiles','subsector-screening'].map(name=>`data/coverage/${name}.json`),...payloadFiles];
const read=file=>JSON.parse(fs.readFileSync(file));
const script=path.resolve('scripts/integrate-trade.mjs');
const run=root=>execFileSync(process.execPath,[script],{cwd:root,stdio:'pipe'});
const bytes=root=>files.map(file=>[file,fs.readFileSync(path.join(root,file))]);
function fixture(){const root=fs.mkdtempSync(path.join(os.tmpdir(),'aa-int102103-'));for(const file of files){const target=path.join(root,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,payloadFiles.includes(file)?fs.readFileSync(file):execFileSync('git',['show',`${base}:${file}`],{maxBuffer:24*1024*1024}));}return root;}
test('trade integration preserves all unrelated records, source primary fields and question IDs',()=>{
 const root=fixture();
 try{
  const prior=new Map(['source','guide','example'].map(kind=>[kind,read(path.join(root,`data/corpus/${kind}.json`))]));
  const oldQuestions=read(path.join(root,'data/coverage/research-questions.json')).questions;
  const payload=read(payloadFiles[1]);
  run(root);
  for(const [kind,rows]of prior){const now=new Map(read(path.join(root,`data/corpus/${kind}.json`)).map(r=>[r.id,r]));for(const old of rows){const current=now.get(old.id);assert.ok(current,old.id);if(old.id==='guide-wholesale-retail'){assert.deepEqual(current,payload.records.find(r=>r.id===old.id).after);assert.deepEqual(current.data.research_questions.map(q=>q.id),old.data.research_questions.map(q=>q.id));assert.deepEqual(current.rights,old.rights);}else if(old.id==='src_construction_fasb_2014_09'){const retained=structuredClone(current);retained.data.supplemental_reviews=retained.data.supplemental_reviews.filter(r=>r.batch!=='aa-i102103-wholesale-retail');assert.deepEqual(retained,old);}else assert.deepEqual(current,old,old.id);}}
  const questions=read(path.join(root,'data/coverage/research-questions.json')).questions;
  for(const old of oldQuestions)if(!payload.questions.some(q=>q.id===old.id))assert.deepEqual(questions.find(q=>q.id===old.id),old);
  assert.equal(questions.length,oldQuestions.length);
  const before=bytes(root);run(root);assert.deepEqual(bytes(root),before);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('trade conflicts and unsupported editions reject the complete write set',()=>{
 for(const defect of ['edition','guide','reused-source','question','mapping']){
  const root=fixture();
  try{
   const file=defect==='edition'?'data/catalog.json':defect==='guide'?'data/corpus/guide.json':defect==='reused-source'?'data/corpus/source.json':defect==='question'?'data/coverage/research-questions.json':'data/coverage/mapping-overrides.json';
   const target=path.join(root,file),value=read(target);
   if(defect==='edition')value.corpus_version='2099-01-01.1';
   if(defect==='guide')value.find(r=>r.id==='guide-wholesale-retail').summary='Concurrent unrelated edit';
   if(defect==='reused-source')value.find(r=>r.id==='src_construction_fasb_2014_09').source_url='https://example.invalid/different-document';
   if(defect==='question')value.questions.find(q=>q.id==='rq-trade-control').scope='Concurrent scope edit';
   if(defect==='mapping')value.records['guide-wholesale-retail'].industry_codes=['23'];
   fs.writeFileSync(target,JSON.stringify(value,null,2)+'\n');const before=bytes(root),result=spawnSync(process.execPath,[script],{cwd:root,encoding:'utf8'});assert.notEqual(result.status,0,defect);assert.deepEqual(bytes(root),before,defect);
  }finally{fs.rmSync(root,{recursive:true,force:true});}
 }
});
