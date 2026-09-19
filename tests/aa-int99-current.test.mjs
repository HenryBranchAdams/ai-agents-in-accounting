import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';
const base='9f1d3e2b6ed648f2823d9a8b52771657ebabd811',packageFile='data/research/utilities-2026-09-19.json';
const files=['data/catalog.json',...['source','guide','example','workflow','control'].map(kind=>`data/corpus/${kind}.json`),...['research-questions','assessments','mapping-overrides','research-criteria','subsector-profiles','subsector-screening'].map(name=>`data/coverage/${name}.json`),packageFile];
const read=file=>JSON.parse(fs.readFileSync(file)),script=path.resolve('scripts/integrate-utilities.mjs');
const bytes=root=>files.map(file=>[file,fs.readFileSync(path.join(root,file))]);
const run=(root,...args)=>execFileSync(process.execPath,[script,...args],{cwd:root,env:{...process.env,AA_UTILITIES_ROOT:root},stdio:'pipe'});
function fixture(){const root=fs.mkdtempSync(path.join(os.tmpdir(),'aa-int99-'));for(const file of files){const target=path.join(root,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,file===packageFile?fs.readFileSync(file):execFileSync('git',['show',`${base}:${file}`],{maxBuffer:24*1024*1024}));}return root;}
test('utilities current application preserves prior records and questions, dry-run and replay bytes',()=>{
 const root=fixture();
 try{
  const before=bytes(root),prior=new Map(['source','guide','example','workflow','control'].map(kind=>[kind,read(path.join(root,`data/corpus/${kind}.json`))]));
  const priorQuestions=read(path.join(root,'data/coverage/research-questions.json')).questions;
  run(root,'--current','--dry-run');assert.deepEqual(bytes(root),before);
  run(root,'--current');assert.equal(read(path.join(root,'data/catalog.json')).corpus_version,'2026-09-19.12411');
  for(const [kind,rows]of prior){const actual=new Map(read(path.join(root,`data/corpus/${kind}.json`)).map(r=>[r.id,r]));for(const old of rows)assert.deepEqual(actual.get(old.id),old,old.id);}
  const questions=read(path.join(root,'data/coverage/research-questions.json')).questions;for(const old of priorQuestions)assert.deepEqual(questions.find(q=>q.id===old.id),old,old.id);
  const first=bytes(root);run(root,'--current');assert.deepEqual(bytes(root),first);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('utilities rejects unsupported editions, numeric older versions and ownership conflicts before writes',()=>{
 for(const defect of ['edition','older','guide','mapping']){
  const root=fixture();
  try{
   if(defect==='guide'||defect==='mapping')run(root,'--current');
   const file=defect==='guide'?'data/corpus/guide.json':defect==='mapping'?'data/coverage/mapping-overrides.json':'data/catalog.json';
   const target=path.join(root,file),value=read(target);
   if(defect==='edition')value.corpus_version='2099-01-01.1';
   if(defect==='older')value.corpus_version='2026-09-19.9';
   if(defect==='guide')value.find(r=>r.id==='guide-utilities-us-regulated-close').summary='Concurrent record edit';
   if(defect==='mapping')value.records['guide-utilities-us-regulated-close'].industry_codes=['23'];
   fs.writeFileSync(target,JSON.stringify(value,null,2)+'\n');const before=bytes(root);
   const result=spawnSync(process.execPath,[script,...(defect==='older'?[]:['--current'])],{cwd:root,env:{...process.env,AA_UTILITIES_ROOT:root},encoding:'utf8'});
   assert.notEqual(result.status,0,defect);assert.deepEqual(bytes(root),before,defect);
  }finally{fs.rmSync(root,{recursive:true,force:true});}
 }
});
