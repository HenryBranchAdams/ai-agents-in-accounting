import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {runVerification,requiredPhases} from '../scripts/verify.mjs';
import {inputInventory} from '../scripts/release-inputs.mjs';
const revision='a'.repeat(40);
function fixture(){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'aa-runner-'));
 for(const file of ['package.json','package-lock.json','tsconfig.json','components.json','eslint.config.mjs','.gitignore','LICENSE','data/catalog.json','src/new.ts','tests/example.test.mjs']){
  fs.mkdirSync(path.dirname(path.join(root,file)),{recursive:true});fs.writeFileSync(path.join(root,file),file==='data/catalog.json'?'{"corpus_version":"2099-01-01.1"}':'{}');
 }
 const check=async()=>({ok:true,input_digest:inputInventory(root).digest,lockfile_sha256:'fixture'});
 const run=async()=>{fs.mkdirSync(path.join(root,'dist/internal'),{recursive:true});fs.mkdirSync(path.join(root,'dist/storage'),{recursive:true});fs.writeFileSync(path.join(root,'dist/internal/release-meta.json'),JSON.stringify({source_revision:revision,build_mode:'release'}));fs.writeFileSync(path.join(root,'dist/storage/qualification.json'),'{}');return {status:0};};
 return {root,check,run,revision};
}
test('shared verification phases fail closed, discover every test and refuse changed inputs or an old phase receipt',async()=>{
 for(const fail of [...requiredPhases.map(p=>p.name),'none','mutation']){
  const options=fixture(),calls=[];try{
   const run=async command=>{const phase=requiredPhases.find(p=>p.command.join(' ')===command.join(' ')).name;calls.push(phase);await options.run();if(fail==='mutation')fs.appendFileSync(path.join(options.root,'src/new.ts'),'changed');return {status:phase===fail?37:0};};
   if(fail==='none'){
    fs.writeFileSync(path.join(options.root,'tests/new.test.mjs'),'{}');
    const result=await runVerification({...options,run});assert.equal(result.status,'passed');assert.deepEqual(result.test_inventory,['example.test.mjs','new.test.mjs']);assert.equal(result.publishable,false);
   }else await assert.rejects(runVerification({...options,run}));
   const expected=fail==='none'?4:fail==='mutation'?1:requiredPhases.findIndex(p=>p.name===fail)+1;assert.equal(calls.length,expected);
   assert.equal(fs.existsSync(path.join(options.root,'outputs/verification/active.lock')),false);
  }finally{fs.rmSync(options.root,{recursive:true,force:true});}
 }
 const options=fixture();try{
  await assert.rejects(runVerification({...options,phase:'tests'}));
  await runVerification({...options,phase:'lint'});
  await assert.rejects(runVerification({...options,phase:'tests'}),/predecessor/);
  await runVerification({...options,phase:'lint'});
  fs.writeFileSync(path.join(options.root,'src/new.ts'),'changed');
  await assert.rejects(runVerification({...options,phase:'build'}),/stale/);
  await assert.rejects(runVerification({...options,mode:'working-copy'}));
 }finally{fs.rmSync(options.root,{recursive:true,force:true});}
});
test('preflight failures never invoke expensive phases or create a build',async()=>{
 const options=fixture();try{
  let called=false;await assert.rejects(runVerification({...options,check:async()=>({ok:false,problems:['Loopback EPERM','Stale edition']}),run:async()=>{called=true;return{status:0};}}),/Preflight refused/);
  assert.equal(called,false);assert.equal(fs.existsSync(path.join(options.root,'dist')),false);
 }finally{fs.rmSync(options.root,{recursive:true,force:true});}
});
