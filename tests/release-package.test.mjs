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
function fixture(){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'aa-package-'));
 const write=(name,body)=>{fs.mkdirSync(path.dirname(path.join(root,name)),{recursive:true});fs.writeFileSync(path.join(root,name),typeof body==='string'||Buffer.isBuffer(body)?body:JSON.stringify(body));};
 for(const name of ['package.json','package-lock.json','tsconfig.json','components.json','eslint.config.mjs','LICENSE'])write(name,'{}');
 write('.gitignore','outputs/\ndist/\n');write('data/catalog.json',{corpus_version:'2099-01-01.1'});write('.openai/hosting.json',{project_id:'fixture',r2:'BUCKET',d1:null});
 const git=args=>execFileSync('git',['-C',root,...args],{encoding:'utf8',stdio:'pipe'}).trim();git(['init']);git(['add','.']);git(['-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-m','fixture']);const revision=git(['rev-parse','HEAD']);
 const files={},objects={};
 for(const [name,body] of [['manifest.json','{"files":[]}'],['accounting-agents-source.manifest.json','{"source_membership":[]}'],['corpus.json','{"records":[]}']]){
  const raw=Buffer.from(body),compressed=gzipSync(raw),key=sha256(compressed);write('dist/client/assets/objects/'+key,compressed);objects[key]=compressed.length;files['/downloads/'+name]={bytes:raw.length,sha256:sha256(raw),chunks:[key]};write('dist/client/downloads/'+name,raw);
 }
 const storage=JSON.stringify({schema_version:'1.0.0',files,objects});write('dist/storage/manifest.json',storage);
 const meta={source_revision:revision,corpus_version:'2099-01-01.1',storage_manifest:sha256(storage),build_mode:'release'};write('dist/internal/release-meta.json',meta);write('dist/storage/qualification.json',meta);
 write('dist/server/index.js','throw new Error("artifact code must not execute during validation");');write('dist/server/runtime-chunk.js','export default 42;');write('dist/server/wrangler.json',{});write('dist/client/style.css','body{}');write('dist/client/assets/shared-chunk.js','export const runtime=42;');write('dist/.openai/hosting.json',{project_id:'fixture',r2:'BUCKET',d1:null});
 const inputs=inputInventory(root);write('outputs/verification/current.json',{status:'passed',mode:'release',source_revision:revision,input_digest:inputs.digest,build_digest:buildInventory(root).digest,node:process.version,phases:requiredPhases.map(p=>({name:p.name,exit_code:0})),qualification_sha256:sha256(fs.readFileSync(path.join(root,'dist/storage/qualification.json'))),lockfile_sha256:inputs.files.find(f=>f.path==='package-lock.json').sha256,test_inventory:['example.test.mjs']});
 const env={GITHUB_REPOSITORY:repository,GITHUB_EVENT_NAME:'push',GITHUB_REF:'refs/heads/main',GITHUB_SHA:revision,GITHUB_RUN_ID:'10',GITHUB_RUN_ATTEMPT:'1'};
 return {root,env,write};
}
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
