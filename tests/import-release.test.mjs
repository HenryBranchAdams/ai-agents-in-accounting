import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {gzipSync} from 'node:zlib';
import {sha256} from '../scripts/release-inputs.mjs';
import {importStorage,importOrigin} from '../scripts/import-release.mjs';
const token='fixture-credential-never-log-this-value';
function fixture(){
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'aa-import-'));
 fs.mkdirSync(path.join(directory,'objects'));
 const objects={},files={};
 for(let i=0;i<5;i++){
  const plain=Buffer.from(`fixture ${i}`),bytes=gzipSync(plain),key=sha256(bytes);
  fs.writeFileSync(path.join(directory,'objects',key),bytes);objects[key]=bytes.length;files[`/downloads/${i}.txt`]={bytes:plain.length,sha256:sha256(plain),chunks:[key]};
 }
 fs.writeFileSync(path.join(directory,'manifest.json'),JSON.stringify({schema_version:'1.0.0',files,objects}));
 return {directory,objects};
}
function remote({lostObject=false,lostSeal=false,status}={}){
 const stored=new Map(),calls=[];let active=0,peak=0,lost=false,sealLost=false;
 const fetchImpl=async(url,options)=>{
  assert.equal(options.headers.Authorization,`Bearer ${token}`);assert.equal(options.redirect,'manual');
  assert.equal(new URL(url).origin,'https://fixture.invalid');
  const key=new URL(url).pathname;calls.push({key,method:options.method});
  active++;peak=Math.max(peak,active);await new Promise(resolve=>setImmediate(resolve));active--;
  if(status)return new Response(token,{status});
  if(options.method==='HEAD')return new Response(null,{status:stored.has(key)?200:404});
  if(key.includes('/manifests/')){
   const manifest=JSON.parse(options.body);
   for(const [id,size]of Object.entries(manifest.objects))if(stored.get(`/_release/objects/${id}`)?.length!==size)return new Response(null,{status:409});
  }
  stored.set(key,Buffer.from(options.body));
  if(lostObject&&!lost&&key.includes('/objects/')){lost=true;throw new Error(token);}
  if(lostSeal&&!sealLost&&key.includes('/manifests/')){sealLost=true;throw new Error(token);}
  return new Response(null,{status:201});
 };
 return {stored,calls,fetchImpl,peak:()=>peak};
}
test('imports validate all bytes before networking and reject redirects without exposing credentials',async()=>{
 const {directory,objects}=fixture();
 try{
  const mock=remote({status:302});
  await assert.rejects(importStorage({origin:'https://fixture.invalid',directory,token,fetchImpl:mock.fetchImpl,delay:async()=>{}}),error=>!error.message.includes(token)&&/302/.test(error.message));
  assert.equal(mock.calls.some(call=>call.method==='PUT'),false);
  fs.writeFileSync(path.join(directory,'objects',Object.keys(objects).at(-1)),'corrupt');
  let called=false;
  await assert.rejects(importStorage({origin:'https://fixture.invalid',directory,token,fetchImpl:async()=>{called=true;}}));
  assert.equal(called,false);
  for(const value of ['http://fixture.invalid','https://user:password@fixture.invalid','https://fixture.invalid/path','https://fixture.invalid?token=x'])assert.throws(()=>importOrigin(value));
 }finally{fs.rmSync(directory,{recursive:true,force:true});}
});
test('lost PUT responses reconcile before retry; seal is revalidated on every resumed import',async()=>{
 const {directory,objects}=fixture(),mock=remote({lostObject:true,lostSeal:true});
 try{
  const options={origin:'https://fixture.invalid',directory,token,fetchImpl:mock.fetchImpl,delay:async()=>{}};
  const first=await importStorage(options);
  assert.equal(first.sealed,true);assert.equal(first.activation_authority,false);assert.equal(first.retries,2);assert.ok(mock.peak()<=4);
  for(const key of Object.keys(objects))assert.equal(mock.calls.filter(call=>call.key===`/_release/objects/${key}`&&call.method==='PUT').length,1);
  const before=mock.calls.length,again=await importStorage(options);
  assert.equal(again.objects_confirmed_by_initial_head,5);assert.equal(again.object_put_acknowledgments,0);
  assert.equal(mock.calls.slice(before).filter(call=>call.key.includes('/manifests/')&&call.method==='PUT').length,1);
  assert.equal(JSON.stringify(first).includes(token),false);
 }finally{fs.rmSync(directory,{recursive:true,force:true});}
});
test('fatal authentication stops new work, waits for in-flight requests and never seals',async()=>{
 const {directory}=fixture(),mock=remote({status:401});
 try{
  await assert.rejects(importStorage({origin:'https://fixture.invalid',directory,token,fetchImpl:mock.fetchImpl,delay:async()=>{}}),/401/);
  assert.ok(mock.calls.length<=4);assert.equal(mock.calls.some(call=>call.key.includes('/manifests/')),false);
 }finally{fs.rmSync(directory,{recursive:true,force:true});}
});
test('transport retries are bounded and redact failures including reflected secrets',async()=>{
 const {directory}=fixture();let calls=0;
 try{
  await assert.rejects(importStorage({origin:'https://fixture.invalid',directory,token,concurrency:1,delay:async()=>{},fetchImpl:async()=>{calls++;throw new Error(`secret=${token}`);}}),error=>!error.message.includes(token)&&/uncertain/.test(error.message));
  assert.equal(calls,3);
 }finally{fs.rmSync(directory,{recursive:true,force:true});}
});
