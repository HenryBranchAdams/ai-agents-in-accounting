import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {inputInventory, sha256, editionProblems} from '../scripts/release-inputs.mjs';
import {editionNeeded, finalizeEdition, prepareEdition} from '../scripts/edition.mjs';

function fixture() {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'aa-edition-'));
  const write=(file,body)=>{fs.mkdirSync(path.dirname(path.join(root,file)),{recursive:true});fs.writeFileSync(path.join(root,file),body);};
  for(const file of ['package.json','package-lock.json','tsconfig.json','eslint.config.mjs','components.json','LICENSE'])write(file,'{}');
  write('.gitignore','outputs/\n');write('data/catalog.json','{"corpus_version":"2099-01-01.1"}');
  write('data/releases/2099-01-01.1/manifest.json','{"historical":true}');
  write('src/entry.ts','export default 1;');
  const git=args=>execFileSync('git',['-C',root,...args],{encoding:'utf8',stdio:'pipe'}).trim();
  git(['init']);git(['add','.']);git(['-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-m','baseline']);
  return {root,write,git};
}
function preparedFixture() {
  const f=fixture(), {root,write,git}=f;
  const before=inputInventory(root),id=sha256('fixture');
  const directory=`outputs/editions/${id}`;
  for(const file of before.files)write(`${directory}/source/${file.path}`,fs.readFileSync(path.join(root,file.path)));
  write(`${directory}/source/data/catalog.json`,'{"corpus_version":"2099-01-01.2"}');
  write(`${directory}/source/data/releases/2099-01-01.2/manifest.json`,'{"new":true}');
  const after=inputInventory(path.join(root,directory,'source'));
  const changes=after.files.filter(file=>!before.files.some(old=>JSON.stringify(old)===JSON.stringify(file))).map(file=>({path:file.path,before:before.files.find(old=>old.path===file.path)||null,after:file}));
  write(`${directory}/prepared.json`,JSON.stringify({id,status:'prepared',publishable:false,version:'2099-01-01.2',source_revision:git(['rev-parse','HEAD']),input_digest:before.digest,prepared_digest:after.digest,inputs:before.files,changes}));
  write('outputs/editions/2099-01-01.2.json',JSON.stringify({id,status:'prepared'}));
  return {...f,id,before,after,directory};
}
test('presentation-only edits do not allocate an edition; new canonical data does',()=>{
  const {root,write}=fixture();
  try {
    write('src/entry.ts','export default 2;');
    assert.equal(editionNeeded(root).needed,false);
    assert.equal(prepareEdition({root}).status,'no-edition-needed');
    assert.equal(fs.existsSync(path.join(root,'outputs/editions')),false);
    write('data/corpus/new.json','[]');
    assert.equal(editionNeeded(root).needed,true);
  }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('finalization resumes interrupted promotion, is idempotent and preserves history',()=>{
  const {root,id,after}=preparedFixture();
  try {
    const history=fs.readFileSync(path.join(root,'data/releases/2099-01-01.1/manifest.json'));
    assert.throws(()=>finalizeEdition({root,id,afterWrite:()=>{throw new Error('simulated interruption');}}),/simulated interruption/);
    assert.equal(finalizeEdition({root,id}).status,'finalized');
    assert.equal(inputInventory(root).digest,after.digest);
    assert.equal(finalizeEdition({root,id}).status,'finalized');
    assert.deepEqual(fs.readFileSync(path.join(root,'data/releases/2099-01-01.1/manifest.json')),history);
  }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('finalization detects all conflicts before any canonical write',()=>{
  for(const defect of ['new','changed','missing','candidate','superseded']) {
    const {root,id,write,directory}=preparedFixture();
    try {
      if(defect==='new')write('src/added.ts','new');
      if(defect==='changed')write('src/entry.ts','changed');
      if(defect==='missing')fs.unlinkSync(path.join(root,'src/entry.ts'));
      if(defect==='candidate')write(`${directory}/source/src/entry.ts`,'tampered');
      if(defect==='superseded')write('outputs/editions/2099-01-01.2.json',JSON.stringify({id:sha256('other')}));
      const before=inputInventory(root).digest;
      assert.throws(()=>finalizeEdition({root,id}),/change|Missing|superseded/);
      assert.equal(inputInventory(root).digest,before);
      assert.equal(fs.existsSync(path.join(root,'data/releases/2099-01-01.2')),false);
    }finally{fs.rmSync(root,{recursive:true,force:true});}
  }
});
test('resuming an interruption never overwrites a subsequent edit',()=>{
  const {root,id,write}=preparedFixture();
  try {
    assert.throws(()=>finalizeEdition({root,id,afterWrite:()=>{throw new Error('stop');}}),/stop/);
    write('data/catalog.json','{"corpus_version":"user-edit"}');
    const before=inputInventory(root).digest;
    assert.throws(()=>finalizeEdition({root,id}),/Concurrent input change/);
    assert.equal(inputInventory(root).digest,before);
  }finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('interrupted promotion is an explicit cheap verification blocker',()=>{
  const {root,id}=preparedFixture();
  try {
    assert.throws(()=>finalizeEdition({root,id,afterWrite:()=>{throw new Error('stop');}}),/stop/);
    assert.ok(editionProblems(root).some(problem=>problem.includes('Interrupted edition finalization')));
  }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('an active operation lock prevents promotion without changing inputs',()=>{
  const {root,id,write}=preparedFixture();
  try {
    write('outputs/editions/operation.lock',JSON.stringify({pid:process.pid,id:'other'}));
    const before=inputInventory(root).digest;
    assert.throws(()=>finalizeEdition({root,id}),/EEXIST/);
    assert.equal(inputInventory(root).digest,before);
    assert.equal(JSON.parse(fs.readFileSync(path.join(root,'outputs/editions/operation.lock'))).id,'other');
  }finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('tampered finalization paths and duplicate targets are rejected before writes',()=>{
  for(const defect of ['traversal','duplicate','identity']){
    const {root,id,directory}=preparedFixture();
    try{
      const receipt=path.join(root,directory,'prepared.json'),saved=JSON.parse(fs.readFileSync(receipt));
      if(defect==='traversal')saved.changes[0].path='data/releases/2099-01-01.2/../../catalog.json';
      if(defect==='duplicate')saved.changes.push(saved.changes[0]);
      if(defect==='identity')saved.changes[0].after.path='data/catalog-other.json';
      fs.writeFileSync(receipt,JSON.stringify(saved));
      const before=inputInventory(root).digest;
      assert.throws(()=>finalizeEdition({root,id}),/Unsafe|Duplicate/);
      assert.equal(inputInventory(root).digest,before);
    }finally{fs.rmSync(root,{recursive:true,force:true});}
  }
});
