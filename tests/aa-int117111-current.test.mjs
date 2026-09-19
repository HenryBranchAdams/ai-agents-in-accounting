import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const base='a122d3b58607aa4bf8adfa101f011fe612d378f0';
const kinds=['source','guide','workflow','control','example'];
const files=['data/catalog.json',...kinds.map(k=>`data/corpus/${k}.json`),...['research-questions','research-criteria','assessments','mapping-overrides','subsector-profiles','subsector-screening'].map(k=>`data/coverage/${k}.json`),'data/research-questions.json','data/research/foundations.json','data/research/management-accounting-2026-09-17.json'];
const proposals=['nonprofit','education'].flatMap(n=>[`${n}-completion-2026-09-19.json`,`${n}-completion-inventory-2026-09-19.json`,`${n}-retrieval-2026-09-19.json`]).map(n=>`data/research/${n}`);
const read=f=>JSON.parse(fs.readFileSync(f));
const bytes=root=>files.map(f=>[f,fs.readFileSync(path.join(root,f))]);
function fixture(){const root=fs.mkdtempSync(path.join(os.tmpdir(),'aa-int117111-'));for(const f of [...files,...proposals]){const dest=path.join(root,f);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,proposals.includes(f)?fs.readFileSync(f):execFileSync('git',['show',`${base}:${f}`],{maxBuffer:32*1024*1024}));}return root;}
const run=(root,name,...args)=>spawnSync(process.execPath,[path.resolve(`scripts/integrate-${name}-completion.mjs`),'--current',...args],{cwd:root,env:{...process.env,NONPROFIT_COMPLETION_ROOT:root,EDUCATION_COMPLETION_ROOT:root},encoding:'utf8'});
function apply(root){for(const name of ['nonprofit','education']){const r=run(root,name);assert.equal(r.status,0,r.stderr);}}

test('current nonprofit and education preserve earlier records except the four exact reviewed source revisions',()=>{
  const root=fixture();try{
    const before=bytes(root),old=kinds.flatMap(k=>read(path.join(root,`data/corpus/${k}.json`))),oldQuestions=read(path.join(root,'data/coverage/research-questions.json')).questions;
    let r=run(root,'nonprofit','--dry-run');assert.equal(r.status,0,r.stderr);assert.deepEqual(bytes(root),before);apply(root);
    const revisions=['nonprofit','education'].flatMap(n=>read(path.join(root,`data/research/${n}-completion-2026-09-19.json`)).source_revisions),records=new Map(kinds.flatMap(k=>read(path.join(root,`data/corpus/${k}.json`))).map(r=>[r.id,r]));
    assert.equal(revisions.length,4);for(const prior of old){const revision=revisions.find(r=>r.id===prior.id);if(revision){assert.deepEqual(prior,revision.before);assert.deepEqual(records.get(prior.id),revision.after);assert.deepEqual(records.get(prior.id).rights,prior.rights);}else assert.deepEqual(records.get(prior.id),prior,prior.id);}
    assert.equal(records.size,old.length+32);const questions=read(path.join(root,'data/coverage/research-questions.json')).questions;for(const prior of oldQuestions)assert.deepEqual(questions.find(q=>q.id===prior.id),prior,prior.id);
    const applied=bytes(root);apply(root);assert.deepEqual(bytes(root),applied);
  }finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('current nonprofit and education refuse absent dependencies, unknown editions and changed review or retrieval evidence before writes',()=>{
  for(const defect of ['dependency','edition','review','retrieval']){const root=fixture();try{
    if(['review','retrieval'].includes(defect))apply(root);
    if(defect!=='dependency'){const file=defect==='edition'?'data/catalog.json':defect==='review'?'data/corpus/source.json':'data/research-questions.json',value=read(path.join(root,file));
      if(defect==='edition')value.corpus_version='2099-01-01.1';
      if(defect==='review')value.find(s=>s.id==='src_cfr200grants').data.supplemental_reviews=value.find(s=>s.id==='src_cfr200grants').data.supplemental_reviews.filter(r=>r.batch!=='AA-I125');
      if(defect==='retrieval')value.find(r=>r.id==='rq-education-completion-endowment').expected_ids=['guide-q-leases'];
      fs.writeFileSync(path.join(root,file),JSON.stringify(value,null,2)+'\n');
    }
    const before=bytes(root),r=run(root,['dependency','retrieval'].includes(defect)?'education':'nonprofit');assert.notEqual(r.status,0,defect);assert.deepEqual(bytes(root),before,defect);
  }finally{fs.rmSync(root,{recursive:true,force:true});}}
});

test('management replay preserves the later nonprofit review and refuses a changed or missing own review before writes',()=>{
  const root=fixture();try{apply(root);const script=path.resolve('scripts/integrate-management-accounting.mjs'),legacy=()=>spawnSync(process.execPath,[script,'--integrate-into-newer-corpus'],{cwd:root,encoding:'utf8'}),before=bytes(root);let result=legacy();assert.equal(result.status,0,result.stderr);assert.deepEqual(bytes(root),before);
    const file=path.join(root,'data/corpus/source.json'),accepted=read(file);
    for(const defect of ['changed','missing']){const sources=structuredClone(accepted),source=sources.find(s=>s.id==='src_cfr200grants');if(defect==='changed')source.data.supplemental_reviews.find(r=>r.batch==='AA-I125').locator='Conflicting review';else source.data.supplemental_reviews=source.data.supplemental_reviews.filter(r=>r.batch!=='AA-I125');fs.writeFileSync(file,JSON.stringify(sources,null,2)+'\n');const conflict=bytes(root);result=legacy();assert.notEqual(result.status,0,defect);assert.match(result.stderr,/refusing overwrite/);assert.deepEqual(bytes(root),conflict,defect);}
  }finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('colliding original nonprofit draft is preserved separately from accepted tax release identity',()=>{
  const root='data/research/preserved-drafts/nonprofit-2026-09-19.1',manifest=read(`${root}/manifest.json`);assert.equal(manifest.status,'preserved-unaccepted-nonprofit-draft');assert.equal(manifest.files.length,7);
  for(const file of manifest.files){const body=fs.readFileSync(`${root}/${file.path}`);assert.equal(body.length,file.bytes);assert.equal(createHash('sha256').update(body).digest('hex'),file.sha256);}
  const current='data/coverage/snapshots/2026-09-19.1.json';assert.deepEqual(fs.readFileSync(current),execFileSync('git',['show',`${base}:${current}`],{maxBuffer:32*1024*1024}));assert.notDeepEqual(read(`${root}/coverage-snapshot.json`),read(current));
  for(const name of fs.readdirSync('data/releases/2026-09-19.1')){const file=`data/releases/2026-09-19.1/${name}`;assert.deepEqual(fs.readFileSync(file),execFileSync('git',['show',`${base}:${file}`],{maxBuffer:32*1024*1024}));}
});
