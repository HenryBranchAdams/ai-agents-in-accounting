import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ASSETS} from './worker-fixture.mjs';
const manifest=JSON.parse(fs.readFileSync('dist/storage/manifest.json'));
const metadata=JSON.parse(fs.readFileSync('dist/internal/connections-index.json'));
const origin='https://corpus.example';
function environment(missing){
 const reads=[];
 const env={BUCKET:{async head(){return {size:1};},async get(key){reads.push(key);if(key===missing)return null;const body=fs.readFileSync('dist/client/assets/'+key);return {body:new Response(body).body};}},ASSETS:{async fetch(request){const path=new URL(request.url).pathname;if(path.startsWith('/_runtime/')||path.startsWith('/assets/objects/'))return new Response(null,{status:404});return ASSETS.fetch(request);}}};
 return {env,reads};
}
test('sealed private runtime works when the host serves public assets first and has no private static files',async()=>{
 const {default:worker}=await import('../dist/server/index.js?private-r2');const {env,reads}=environment();
 const host=async route=>{const request=new Request(origin+route);const asset=await env.ASSETS.fetch(request);return asset.ok?asset:worker.fetch(request,env);};
 for(const route of Object.keys(manifest.files).filter(p=>p.startsWith('/_runtime/'))){assert.equal((await host(route)).status,404,route);}
 assert.equal(reads.length,0,'Rejected private requests do not read storage');
 assert.equal((await host('/records/wf-r2r-bank-reconciliations')).status,200);
 const graphChunks=manifest.files[metadata.path].chunks.map(key=>'objects/'+key);assert.ok(graphChunks.every(key=>!reads.includes(key)),'ordinary reading does not load graph');
 const graph=await host('/api/v1/connections?focus=guide-construction-connected-close');assert.equal(graph.status,200);assert.equal((await graph.json()).index_version,metadata.index_version);assert.ok(graphChunks.every(key=>reads.includes(key)));
 for(const route of ['/assets/data/old.gz','/assets/connections/old.gz'])assert.equal((await host(route)).status,404);
});
test('missing private graph objects fail visibly without substituting another index',async()=>{
 const {default:worker}=await import('../dist/server/index.js?missing-private-r2');const {env}=environment('objects/'+manifest.files[metadata.path].chunks[0]);
 assert.equal((await worker.fetch(new Request(origin+'/records/wf-r2r-bank-reconciliations'),env)).status,200);
 const response=await worker.fetch(new Request(origin+'/api/v1/connections?focus=guide-construction-connected-close'),env);assert.equal(response.status,503);assert.match(await response.text(),/temporarily unavailable/);
});
