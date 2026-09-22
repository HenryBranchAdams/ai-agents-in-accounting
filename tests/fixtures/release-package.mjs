import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {gzipSync} from 'node:zlib';
import {execFileSync} from 'node:child_process';
import {createReleasePackage,validatePackage,repository} from '../../scripts/release-package.mjs';
import {inputInventory,buildInventory,sha256} from '../../scripts/release-inputs.mjs';
import {requiredPhases} from '../../scripts/verify.mjs';
export function fixture({privateRuntime=false}={}){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'aa-package-'));
 const write=(name,body)=>{fs.mkdirSync(path.dirname(path.join(root,name)),{recursive:true});fs.writeFileSync(path.join(root,name),typeof body==='string'||Buffer.isBuffer(body)?body:JSON.stringify(body));};
 for(const name of ['package.json','package-lock.json','tsconfig.json','components.json','eslint.config.mjs','LICENSE'])write(name,'{}');
 write('.gitignore','outputs/\ndist/\n');write('data/catalog.json',{corpus_version:'2099-01-01.1'});write('.openai/hosting.json',{project_id:'fixture',r2:'BUCKET',d1:null});
 const git=args=>execFileSync('git',['-C',root,...args],{encoding:'utf8',stdio:'pipe'}).trim();git(['init']);git(['add','.']);git(['-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-m','fixture']);const revision=git(['rev-parse','HEAD']);
 const files={},objects={};
 for(const [name,body] of [['manifest.json','{"files":[]}'],['accounting-agents-source.manifest.json','{"source_membership":[]}'],['corpus.json','{"records":[]}']]){
  const raw=Buffer.from(body),compressed=gzipSync(raw),key=sha256(compressed);write('dist/client/assets/objects/'+key,compressed);objects[key]=compressed.length;files['/downloads/'+name]={bytes:raw.length,sha256:sha256(raw),chunks:[key]};write('dist/client/downloads/'+name,raw);
 }
 if(privateRuntime){const name='/_runtime/data/'+ 'a'.repeat(64)+'.gz',raw=gzipSync(Buffer.from('{"private":true}')),compressed=gzipSync(raw),key=sha256(compressed);write('dist/client'+name,raw);write('dist/client/assets/objects/'+key,compressed);objects[key]=compressed.length;files[name]={bytes:raw.length,sha256:sha256(raw),chunks:[key]};}
 const storage=JSON.stringify({schema_version:'1.0.0',files,objects});write('dist/storage/manifest.json',storage);
 const meta={source_revision:revision,corpus_version:'2099-01-01.1',storage_manifest:sha256(storage),build_mode:'release'};write('dist/internal/release-meta.json',meta);write('dist/storage/qualification.json',meta);
 write('dist/server/index.js','throw new Error("artifact code must not execute during validation");');write('dist/server/runtime-chunk.js','export default 42;');write('dist/server/wrangler.json',{});write('dist/client/style.css','body{}');write('dist/client/assets/shared-chunk.js','export const runtime=42;');write('dist/.openai/hosting.json',{project_id:'fixture',r2:'BUCKET',d1:null});
 const inputs=inputInventory(root);write('outputs/verification/current.json',{status:'passed',mode:'release',source_revision:revision,input_digest:inputs.digest,build_digest:buildInventory(root).digest,node:process.version,phases:requiredPhases.map(p=>({name:p.name,exit_code:0})),qualification_sha256:sha256(fs.readFileSync(path.join(root,'dist/storage/qualification.json'))),lockfile_sha256:inputs.files.find(f=>f.path==='package-lock.json').sha256,test_inventory:['example.test.mjs']});
 const env={GITHUB_REPOSITORY:repository,GITHUB_EVENT_NAME:'push',GITHUB_REF:'refs/heads/main',GITHUB_SHA:revision,GITHUB_RUN_ID:'10',GITHUB_RUN_ATTEMPT:'1'};
 return {root,env,write};
}
