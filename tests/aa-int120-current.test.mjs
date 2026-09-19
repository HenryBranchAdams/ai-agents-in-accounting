import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';
const base='f393fd5a451bbfda6251be55dd420f03eddf3b3d';
const files=['data/catalog.json','data/corpus/source.json','data/corpus/guide.json','data/corpus/example.json','data/research/foundations.json','data/coverage/research-questions.json','data/coverage/mapping-overrides.json','data/coverage/assessments.json','data/research-questions.json','data/coverage/research-criteria.json','data/coverage/subsector-profiles.json','data/coverage/subsector-screening.json','data/research/assets-workforce-2026-09-18.json'];
const read=file=>JSON.parse(fs.readFileSync(file)),script=path.resolve('scripts/integrate-assets-workforce.mjs');
function fixture(){const root=fs.mkdtempSync(path.join(os.tmpdir(),'aa-int120-'));for(const file of files){fs.mkdirSync(path.dirname(path.join(root,file)),{recursive:true});fs.writeFileSync(path.join(root,file),file.includes('assets-workforce')?fs.readFileSync(file):execFileSync('git',['show',`${base}:${file}`],{maxBuffer:32*1024*1024}));}return root;}
const bytes=root=>files.map(file=>[file,fs.readFileSync(path.join(root,file))]);
const run=(root,...args)=>execFileSync(process.execPath,[script,...args],{cwd:root,stdio:'pipe'});
test('assets integration preserves international questions, prior rights and mappings, and dry-run/replay bytes',()=>{
 const root=fixture();try{
  const p=read(path.join(root,files.at(-1))),before=bytes(root),sources=read(path.join(root,'data/corpus/source.json')),guides=read(path.join(root,'data/corpus/guide.json')),questions=read(path.join(root,'data/coverage/research-questions.json')).questions,mappings=read(path.join(root,'data/coverage/mapping-overrides.json')).records,foundations=read(path.join(root,'data/research/foundations.json'));
  run(root,'--dry-run');assert.deepEqual(bytes(root),before);run(root);
  const currentSources=read(path.join(root,'data/corpus/source.json')),currentGuides=read(path.join(root,'data/corpus/guide.json')),currentQuestions=read(path.join(root,'data/coverage/research-questions.json')).questions;
  for(const old of sources){const actual=structuredClone(currentSources.find(s=>s.id===old.id));if(p.source_updates.some(s=>s.id===old.id)){actual.data.supplemental_reviews=actual.data.supplemental_reviews.filter(r=>r.batch!=='AA-I120');if(!Object.hasOwn(old.data,'supplemental_reviews'))delete actual.data.supplemental_reviews;}assert.deepEqual(actual,old,old.id);}
  for(const old of guides){const actual=currentGuides.find(g=>g.id===old.id);assert.deepEqual(actual.rights,old.rights);assert.deepEqual(actual.provenance,old.provenance);assert.equal(actual.reviewed_at,old.reviewed_at);for(const question of old.data.research_questions||[])assert.deepEqual(actual.data.research_questions.find(q=>q.id===question.id),question);for(const id of old.source_ids)assert.ok(actual.source_ids.includes(id));}
  for(const old of questions)assert.deepEqual(currentQuestions.find(q=>q.id===old.id),old,old.id);
  const currentMappings=read(path.join(root,'data/coverage/mapping-overrides.json')).records;for(const[id,value]of Object.entries(mappings))assert.deepEqual(currentMappings[id],value,id);
  const currentFoundations=read(path.join(root,'data/research/foundations.json'));delete currentFoundations.aa_i120;assert.deepEqual(currentFoundations,foundations);
  const first=bytes(root);run(root);assert.deepEqual(bytes(root),first);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('assets integration rejects late conflicts and unknown editions before writing',()=>{
 for(const defect of ['edition','source','question','mapping','foundation']){const root=fixture();try{
  if(defect!=='edition')run(root);
  const file=defect==='edition'?'data/catalog.json':defect==='source'?'data/corpus/source.json':defect==='question'?'data/corpus/guide.json':defect==='mapping'?'data/coverage/mapping-overrides.json':'data/research/foundations.json';
  const p=read(path.join(root,files.at(-1))),value=read(path.join(root,file));
  if(defect==='edition')value.corpus_version='2099-01-01.1';
  if(defect==='source')value.find(s=>s.id===p.source_updates[0].id).data.supplemental_reviews.find(r=>r.batch==='AA-I120').locator='Conflicting review';
  if(defect==='question')value.find(g=>g.id===p.families[0].guide_id).data.research_questions.find(q=>q.id===p.families[0].questions[0].id).answer='Conflicting answer';
  if(defect==='mapping')value.records[p.example.id].industry_codes=['23'];
  if(defect==='foundation')value.aa_i120.note='Conflicting provenance';
  fs.writeFileSync(path.join(root,file),JSON.stringify(value,null,2)+'\n');const before=bytes(root);const result=spawnSync(process.execPath,[script],{cwd:root,encoding:'utf8'});assert.notEqual(result.status,0,defect);assert.deepEqual(bytes(root),before,defect);
 }finally{fs.rmSync(root,{recursive:true,force:true});}}
});
