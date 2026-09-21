import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fixture} from './fixtures/release-package.mjs';
import {createReleasePackage,validatePackage} from '../scripts/release-package.mjs';
import {sha256} from '../scripts/release-inputs.mjs';
import {stageRelease} from '../scripts/stage-release.mjs';

test('staging binds exact application bytes and rechecks authority after import without running artifact code',async()=>{
 const f=fixture();
 try{
  const directory=path.join(f.root,'outputs/package'),destination=path.join(f.root,'outputs/stage');
  createReleasePackage({...f,destination:directory});
  const checked=validatePackage(directory),proof={revision:f.env.GITHUB_SHA,artifact_id:42};
  const bound={...checked,proof,package_sha256:sha256(fs.readFileSync(path.join(directory,'release-package.json')))};
  let imports=0,reads=0;
  const dependencies={authenticate:async()=>bound,importObjects:async()=>{imports++;return {...checked.storage,sealed:true};},inspect:()=>{reads++;return{proof};}};
  const options={directory,destination,projectId:'fixture',origin:'https://fixture.invalid',revision:f.env.GITHUB_SHA};
  const result=await stageRelease(options,dependencies);
  assert.equal(result.status,'staged');assert.equal(result.activation_authority,false);assert.equal(imports,1);assert.equal(reads,1);
  for(const file of result.staged_files)assert.equal(sha256(fs.readFileSync(path.join(destination,file.path))),file.sha256);
  assert.equal(fs.existsSync(path.join(destination,'storage')),false);
  assert.equal(fs.existsSync(path.join(destination,'dist/client/downloads')),false);
  await assert.rejects(stageRelease(options,dependencies),/fresh staging destination/);
 }finally{fs.rmSync(f.root,{recursive:true,force:true});}
});
test('staging refuses wrong project, changed authority, changed package and failed seal',async()=>{
 for(const defect of ['project','authority','package','seal']){
  const f=fixture();
  try{
   const directory=path.join(f.root,'outputs/package'),destination=path.join(f.root,'outputs/stage');
   createReleasePackage({...f,destination:directory});
   const checked=validatePackage(directory),proof={revision:f.env.GITHUB_SHA};let imports=0;
   const bound={...checked,proof,package_sha256:sha256(fs.readFileSync(path.join(directory,'release-package.json')))};
   const dependencies={authenticate:async()=>bound,importObjects:async()=>{
    imports++;if(defect==='seal')throw new Error('seal incomplete');
    if(defect==='package')fs.appendFileSync(path.join(directory,'application/dist/server/index.js'),'changed');
    return {...checked.storage,sealed:true};
   },inspect:()=>({proof:defect==='authority'?{revision:'newer'}:proof})};
   await assert.rejects(stageRelease({directory,destination,projectId:defect==='project'?'other':'fixture'},dependencies));
   assert.equal(fs.existsSync(destination),false);
   if(defect==='project')assert.equal(imports,0);
  }finally{fs.rmSync(f.root,{recursive:true,force:true});}
 }
});
