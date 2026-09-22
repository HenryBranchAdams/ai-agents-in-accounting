import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import{pathToFileURL}from'node:url';import{build}from'esbuild';import{gunzipSync}from'node:zlib';
const directory=fs.mkdtempSync(path.join(os.tmpdir(),'aa-graph-client-'));
await build({entryPoints:['src/connections/layout.ts','src/connections/client-contract.ts','src/connections/select.ts','src/connections/state.ts','src/connections/view.ts'],outdir:directory,bundle:true,format:'esm',outExtension:{'.js':'.mjs'}});
const load=async name=>import(pathToFileURL(path.join(directory,name+'.mjs')));
const{placeConnections}=await load('layout'),{isConnectionView,isConnectionEvidence}=await load('client-contract'),{createConnectionIndex}=await load('select'),{parseConnectionState}=await load('state'),{connectionViewDTO}=await load('view');
process.on('exit',()=>fs.rmSync(directory,{recursive:true,force:true}));

test('preset placement preserves existing and restored branch positions without a force layout',()=>{
 const initial=placeConnections(['focus','a','b','c'],'focus');const before=structuredClone(initial);
 placeConnections(['focus','a','b','c','d','e'],'focus',initial);for(const[id,point]of before)assert.deepEqual(initial.get(id),point);
 placeConnections(['focus','b','e'],'focus',initial);placeConnections(['focus','a','b','c','d','e'],'focus',initial);for(const[id,point]of before)assert.deepEqual(initial.get(id),point);
 assert.deepEqual(initial.get('focus'),{x:0,y:0});assert.deepEqual(placeConnections(['c','focus','b','a'],'focus'),before);
 const eighty=placeConnections(Array.from({length:80},(_,i)=>String(i)),'0');assert.equal(eighty.size,80);assert.equal(new Set([...eighty.values()].map(p=>`${p.x},${p.y}`)).size,80);
});

test('browser contracts reject malformed, foreign-edition and foreign-origin responses while retaining exact assertions',()=>{
 const metadata=JSON.parse(fs.readFileSync('dist/internal/connections-index.json')),snapshot=JSON.parse(gunzipSync(fs.readFileSync('dist/client'+metadata.path))),index=createConnectionIndex(snapshot),kinds=[...new Set(snapshot.nodes.map(n=>n.kind))];
 const view=connectionViewDTO(index.select(parseConnectionState(new URLSearchParams({focus:'wf-r2r-bank-reconciliations'}),kinds)));
 assert.ok(isConnectionView(view,metadata.corpus_version,kinds));assert.equal(isConnectionView(view,'old-edition',kinds),false);
 for(const change of [v=>v.nodes[0].href='https://outside.example',v=>v.edges[0].evidence_href='//outside.example/x',v=>v.state.budget=1000,v=>v.counts={},v=>v.nodes.push(v.nodes[0]),v=>v.edges[0].to='absent',v=>v.state.index='old']){
  const bad=structuredClone(view);change(bad);assert.equal(isConnectionView(bad,metadata.corpus_version,kinds),false);
 }
 const evidence={corpus_version:metadata.corpus_version,index_version:metadata.index_version,edge:index.edge(view.edges[0].id)};assert.ok(isConnectionEvidence(evidence));
 const bad=structuredClone(evidence);bad.edge.assertions[0].locators[0].kind='unsupported';assert.equal(isConnectionEvidence(bad),false);
});
