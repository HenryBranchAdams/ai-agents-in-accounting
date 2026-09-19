import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync, spawnSync} from 'node:child_process';
const base='f3d7fb2d56e09d7a3af8ed602e7d0238c763e9e8';
const packetFile='data/research/capital-financing-2026-09-18.json';
const files=['data/catalog.json', 'data/corpus/source.json', 'data/corpus/guide.json', 'data/corpus/example.json', ...['research-questions','assessments','mapping-overrides','record-mappings','research-criteria','subsector-profiles','subsector-screening'].map(name=>`data/coverage/${name}.json`),packetFile];
const read=file=>JSON.parse(fs.readFileSync(file));
const bytes=root=>files.map(file=>[file,fs.readFileSync(path.join(root,file))]);
const script=path.resolve('scripts/integrate-capital-financing.mjs');
const run=root=>execFileSync(process.execPath,[script,'--current'],{cwd:root,stdio:'pipe'});
function fixture(){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'aa-int121-'));
  for(const file of files){const target=path.join(root,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,file===packetFile?fs.readFileSync(file):execFileSync('git',['show',`${base}:${file}`],{maxBuffer:24*1024*1024}));}
  return root;
}
test('capital integration preserves prior primary source metadata, questions, mappings and replay',()=>{
  const root=fixture();
  try{
    const packet=read(packetFile),guideIds=new Set(packet.families.map(f=>`guide-${f.family_id}`));
    const prior=new Map(['source','guide','example'].map(kind=>[kind,read(path.join(root,`data/corpus/${kind}.json`))]));
    const questions=read(path.join(root,'data/coverage/research-questions.json')).questions;
    const oldOverrides=read(path.join(root,'data/coverage/mapping-overrides.json'));
    // An explicit industry association on a reused source must survive, even if
    // the new package treats its own use of the source as shared context.
    oldOverrides.records.src_asu202308={...(oldOverrides.records.src_asu202308||{}),industry_scope:'specific',industry_codes:['52'],question_ids:['q-controls']};
    fs.writeFileSync(path.join(root,'data/coverage/mapping-overrides.json'),JSON.stringify(oldOverrides,null,2)+'\n');
    run(root);
    for(const [kind,rows] of prior){
      const actual=new Map(read(path.join(root,`data/corpus/${kind}.json`)).map(r=>[r.id,r]));
      for(const old of rows){
        const value=actual.get(old.id);assert.ok(value,old.id);
        if(kind==='source'&&['src_asu202308','src_secsab122'].includes(old.id)){
          const retained=structuredClone(value);retained.data.supplemental_reviews=retained.data.supplemental_reviews.filter(r=>r.batch!=='AA-I121');
          if(!Object.hasOwn(old.data,'supplemental_reviews'))delete retained.data.supplemental_reviews;
          assert.deepEqual(retained,old,old.id);
        }else if(kind==='guide'&&guideIds.has(old.id)){
          for(const field of ['summary','jurisdiction','reviewed_at','review_status','provenance','rights'])assert.deepEqual(value[field],old[field],`${old.id}:${field}`);
          for(const question of old.data.research_questions)assert.deepEqual(value.data.research_questions.find(q=>q.id===question.id),question);
          for(const id of old.source_ids)assert.ok(value.source_ids.includes(id));
        }else assert.deepEqual(value,old,old.id);
      }
    }
    const currentQuestions=read(path.join(root,'data/coverage/research-questions.json')).questions;
    for(const old of questions)assert.deepEqual(currentQuestions.find(q=>q.id===old.id),old,old.id);
    const overrides=read(path.join(root,'data/coverage/mapping-overrides.json')).records;
    assert.equal(overrides.src_asu202308.industry_scope,'specific');assert.deepEqual(overrides.src_asu202308.industry_codes,['52']);assert.ok(overrides.src_asu202308.question_ids.includes('q-controls'));
    const first=bytes(root);run(root);assert.deepEqual(bytes(root),first);
  }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('capital edition, source, question and assessment conflicts fail before any writes',()=>{
  for(const defect of ['edition','new-source','reused-source','question','assessment']){
    const root=fixture();
    try{
      if(defect!=='edition'&&defect!=='reused-source')run(root);
      const file=defect==='edition'?'data/catalog.json':defect==='question'?'data/corpus/guide.json':defect==='assessment'?'data/coverage/assessments.json':'data/corpus/source.json';
      const target=path.join(root,file),value=read(target),packet=read(packetFile);
      if(defect==='edition')value.corpus_version='2099-01-01.1';
      if(defect==='new-source')value.find(r=>r.id===packet.sources[0].id).summary='Deliberate conflicting source';
      if(defect==='reused-source')value.find(r=>r.id==='src_asu202308').source_url='https://example.invalid/different-document';
      if(defect==='question')value.find(r=>r.id===`guide-${packet.families[0].family_id}`).data.research_questions.find(q=>q.id===packet.families[0].questions[0].id).answer='Deliberate conflicting answer';
      if(defect==='assessment')value.assessments.find(r=>r.id===packet.assessments[0].id).status='sufficient';
      fs.writeFileSync(target,JSON.stringify(value,null,2)+'\n');
      const before=bytes(root),result=spawnSync(process.execPath,[script,'--current'],{cwd:root,encoding:'utf8'});
      assert.notEqual(result.status,0,defect);assert.deepEqual(bytes(root),before,defect);
    }finally{fs.rmSync(root,{recursive:true,force:true});}
  }
});
