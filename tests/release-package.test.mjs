import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {gzipSync} from 'node:zlib';
import {execFileSync} from 'node:child_process';
import {createReleasePackage,validatePackage,validateStorage,repository} from '../scripts/release-package.mjs';
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

test('private runtime bytes are sealed in storage and excluded from an asset-first public application',()=>{
 const {root,env}=fixture({privateRuntime:true});try{
  const destination=path.join(root,'outputs/private-package');const result=createReleasePackage({root,destination,env});assert.equal(result.storage.logical_files,4);
  assert.equal(fs.existsSync(path.join(destination,'application/dist/client/_runtime')),false);
  const manifest=JSON.parse(fs.readFileSync(path.join(destination,'storage/manifest.json')));assert.ok(Object.keys(manifest.files).some(name=>name.startsWith('/_runtime/data/')));
  assert.equal(validatePackage(destination).storage.objects,4);
  const leaked='application/dist/client/_runtime/data/'+ 'a'.repeat(64)+'.gz',body=Buffer.from('private');fs.mkdirSync(path.dirname(path.join(destination,leaked)),{recursive:true});fs.writeFileSync(path.join(destination,leaked),body);
  const packagePath=path.join(destination,'release-package.json'),packageManifest=JSON.parse(fs.readFileSync(packagePath));packageManifest.files.push({path:leaked,bytes:body.length,sha256:sha256(body),mode:0o644});fs.writeFileSync(packagePath,JSON.stringify(packageManifest));assert.throws(()=>validatePackage(destination),/cannot be public application assets/);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});


test('the actual production storage manifest admits the private library map and rejects unknown runtime paths',()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'aa-real-storage-'));
 try{
  fs.mkdirSync(path.join(directory,'objects'));
  const manifest=JSON.parse(fs.readFileSync('dist/storage/manifest.json'));
  const map=JSON.parse(fs.readFileSync('dist/internal/library-map.json'));
  assert.ok(manifest.files[map.path],'Map must be in the sealed storage inventory');
  for(const key of Object.keys(manifest.objects))fs.linkSync(path.resolve('dist/client/assets/objects',key),path.join(directory,'objects',key));
  fs.writeFileSync(path.join(directory,'manifest.json'),JSON.stringify(manifest));
  assert.equal(validateStorage(directory).logical_files,Object.keys(manifest.files).length);
  const file=manifest.files[map.path];delete manifest.files[map.path];
  for(const invalid of ['/_runtime/unknown/'+ 'a'.repeat(64)+'.json.gz','/_runtime/library-map/../map.json.gz','/_runtime/library-map/not-a-digest.json.gz']){
   manifest.files[invalid]=file;fs.writeFileSync(path.join(directory,'manifest.json'),JSON.stringify(manifest));
   assert.throws(()=>validateStorage(directory),/Unexpected logical storage path/);delete manifest.files[invalid];
  }
 }finally{fs.rmSync(directory,{recursive:true,force:true});}
});
