import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {gzipSync} from 'node:zlib';
import {execFileSync} from 'node:child_process';
import {createReleasePackage,validatePackage,repository} from '../scripts/release-package.mjs';
import {inputInventory,buildInventory,sha256} from '../scripts/release-inputs.mjs';
import {requiredPhases} from '../scripts/verify.mjs';
import {fixture} from './fixtures/release-package.mjs';
test('complete release package reconstructs logical storage in a fresh directory without executing runtime code',()=>{
 const {root,env}=fixture();try{
  const destination=path.join(root,'outputs/package');const built=createReleasePackage({root,destination,env});assert.equal(built.storage.logical_files,3);
  const result=validatePackage(destination);assert.ok(result.manifest.files.some(f=>f.path.endsWith('shared-chunk.js')));assert.ok(result.manifest.files.some(f=>f.path.endsWith('runtime-chunk.js')));
  assert.equal(fs.existsSync(path.join(destination,'application/dist/client/downloads')),false);
  fs.rmSync(path.join(root,'dist'),{recursive:true});assert.equal(validatePackage(destination).storage.objects,3,'local build/cache is not required');
  const object=path.join(destination,'storage/objects',fs.readdirSync(path.join(destination,'storage/objects'))[0]);fs.writeFileSync(object,'corrupt');assert.throws(()=>validatePackage(destination));
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('packaging refuses a preview, changed build, changed input, missing object, skipped test gate or PR origin',()=>{
 const changes=[
  x=>x.write('dist/internal/release-meta.json',{build_mode:'preview'}),
  x=>x.write('dist/client/assets/shared-chunk.js','changed output'),
  x=>x.write('src/untracked.ts','new input'),
  x=>fs.unlinkSync(path.join(x.root,'dist/client/assets/objects',fs.readdirSync(path.join(x.root,'dist/client/assets/objects'))[0])),
  x=>{const p=path.join(x.root,'outputs/verification/current.json');const s=JSON.parse(fs.readFileSync(p));s.phases[2].exit_code=1;fs.writeFileSync(p,JSON.stringify(s));},
  x=>x.env.GITHUB_EVENT_NAME='pull_request'
 ];
 for(const change of changes){const x=fixture();try{change(x);assert.throws(()=>createReleasePackage({...x,destination:path.join(x.root,'outputs/package')}));assert.equal(fs.existsSync(path.join(x.root,'outputs/package')),false);}finally{fs.rmSync(x.root,{recursive:true,force:true});}}
});
