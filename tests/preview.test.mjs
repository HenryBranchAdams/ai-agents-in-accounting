import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {once} from 'node:events';
import {execFileSync} from 'node:child_process';
import {previewInventory,inputInventory} from '../scripts/release-inputs.mjs';
import {buildPreview,startPreview} from '../scripts/preview.mjs';
function fixture(){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'aa-preview-'));
 const files={
  'package.json':'{"type":"module"}','package-lock.json':'{}','tsconfig.json':'{}','components.json':'{}','eslint.config.mjs':'','LICENSE':'fixture','.gitignore':'outputs/\nnode_modules/\n','data/catalog.json':'{"corpus_version":"2099-01-01.1"}','src/text.txt':'first',
  'scripts/serve.mjs':fs.readFileSync('scripts/serve.mjs','utf8'),
  'scripts/build.mjs':`import fs from 'node:fs';
const value=fs.readFileSync('src/text.txt','utf8');if(value==='fail')throw new Error('deliberate failed rebuild');
fs.mkdirSync('dist/internal',{recursive:true});fs.mkdirSync('dist/server',{recursive:true});fs.mkdirSync('dist/client',{recursive:true});
const meta={build_mode:'preview',source_revision:process.env.PREVIEW_SOURCE_REVISION,input_digest:process.env.PREVIEW_INPUT_DIGEST};
fs.writeFileSync('dist/internal/release-meta.json',JSON.stringify(meta));
fs.writeFileSync('dist/server/index.js','export default {fetch:async r=>new URL(r.url).pathname==="/api/v1/release"?Response.json('+JSON.stringify(meta)+'):new Response('+JSON.stringify(value)+')};');`
 };
 for(const [file,body] of Object.entries(files)){fs.mkdirSync(path.dirname(path.join(root,file)),{recursive:true});fs.writeFileSync(path.join(root,file),body);}
 fs.mkdirSync(path.join(root,'node_modules'));
 const git=args=>execFileSync('git',['-C',root,...args],{encoding:'utf8',stdio:'pipe'}).trim();
 git(['init']);git(['add','.']);git(['-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-m','fixture']);
 return {root,git};
}
test('preview cache binds source, revision and output bytes; failed candidates preserve prior output',async()=>{
 const {root,git}=fixture();try{
  fs.mkdirSync(path.join(root,'data/releases/2098-01-01.1'),{recursive:true});fs.writeFileSync(path.join(root,'data/releases/2098-01-01.1/corpus.json.gz'),'history');
  const previewDigest=previewInventory(root).digest,fullDigest=inputInventory(root).digest;
  fs.writeFileSync(path.join(root,'data/releases/2098-01-01.1/corpus.json.gz'),'historical edit');
  assert.equal(previewInventory(root).digest,previewDigest);assert.notEqual(inputInventory(root).digest,fullDigest);
  const initial=await buildPreview({root});assert.equal(initial.reused,false);assert.equal(initial.publishable,false);assert.equal(initial.source_exports,0);
  assert.equal((await buildPreview({root})).reused,true);
  fs.writeFileSync(path.join(initial.directory,'dist/server/index.js'),'corruption');
  assert.equal((await buildPreview({root})).reused,false);
  assert.ok(fs.readdirSync(path.join(root,'outputs/previews')).some(name=>name.includes('.invalid-')));
  git(['-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','--allow-empty','-m','new identity']);
  const newRevision=await buildPreview({root});assert.notEqual(newRevision.identity,initial.identity);
  fs.writeFileSync(path.join(root,'src/text.txt'),'fail');await assert.rejects(buildPreview({root}),/build failed/);
  assert.ok(fs.existsSync(path.join(newRevision.directory,'dist/server/index.js')));
  fs.writeFileSync(path.join(root,'src/text.txt'),'second');const changed=await buildPreview({root});assert.notEqual(changed.identity,newRevision.identity);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('owned previews use available ports, refresh working files, survive failed rebuilds and never stop another server',async()=>{
 const {root}=fixture();let first,second,occupied;
 try{
  occupied=http.createServer((_,res)=>res.end('unrelated'));occupied.listen(0,'127.0.0.1');await once(occupied,'listening');
  await assert.rejects(startPreview({root,port:occupied.address().port}),/EADDRINUSE/);
  assert.equal(fs.existsSync(path.join(root,'outputs/previews')),false,'occupied port must fail before build');
  first=await startPreview({root,watch:true});second=await startPreview({root,watch:false});assert.notEqual(first.origin,second.origin);
  assert.equal(await (await fetch(first.origin)).text(),'first');
  fs.writeFileSync(path.join(root,'src/text.txt'),'second');
  const until=Date.now()+10000;let observed;
  while(Date.now()<until){observed=await (await fetch(first.origin)).text();if(observed==='second')break;await new Promise(resolve=>setTimeout(resolve,100));}
  assert.equal(observed,'second','source watcher must publish a fresh ready build');
  assert.equal(await (await fetch(second.origin)).text(),'first','independent preview stays on its own build');
  fs.writeFileSync(path.join(root,'src/text.txt'),'fail');await first.rebuild();
  assert.equal(await (await fetch(first.origin)).text(),'second','failed rebuild preserves last good preview');
  await first.close();first=null;
  assert.equal(await (await fetch(`http://127.0.0.1:${occupied.address().port}`)).text(),'unrelated');
  assert.equal(await (await fetch(second.origin)).text(),'first');
 }finally{await first?.close();await second?.close();if(occupied){occupied.closeAllConnections();await new Promise(resolve=>occupied.close(resolve));}fs.rmSync(root,{recursive:true,force:true});}
});
