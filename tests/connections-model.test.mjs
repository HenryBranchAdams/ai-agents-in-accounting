import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import{pathToFileURL}from'node:url';import{build}from'esbuild';
const directory=fs.mkdtempSync(path.join(os.tmpdir(),'aa-graph-model-'));await build({entryPoints:['src/connections/model.ts'],outfile:path.join(directory,'model.mjs'),bundle:true,format:'esm',platform:'node'});const{projectConnections,edgeIdentity}=await import(pathToFileURL(path.join(directory,'model.mjs')));process.on('exit',()=>fs.rmSync(directory,{recursive:true,force:true}));
const record=(id,extra={})=>({id,kind:'guide',title:'Same title',summary:'A bounded description',source_ids:[],related_ids:[],review_status:'unknown',reviewed_at:null,rights:{source_license:null},data:{},...extra});

test('projection keeps canonical direction, parallel types, cycles, self references and all assertion provenance',async()=>{
 const a=record('a',{source_ids:['b','b'],related_ids:['b','a']}),b=record('b',{source_ids:['a']});
 const annotations={edges:[{from:'b',to:'a',type:'supports',provenance:{source_ids:['a','b'],pointers:['/summary'],reason:'Bibliography membership only'}},{from:'b',to:'a',type:'supports',provenance:{source_ids:['b'],pointers:['/data'],reason:'A second limited assertion'}}]};
 const graph=await projectConnections([a,b],annotations,'edition');assert.equal(graph.nodes.length,2);assert.equal(graph.edges.length,5);assert.equal(graph.counts.self_references,1);
 const cited=graph.edges.find(e=>e.id===edgeIdentity('a','b','cites'));assert.equal(cited.assertions.length,2);assert.ok(graph.edges.every(e=>e.type!=='cited_by'));
 const support=graph.edges.find(e=>e.type==='supports');assert.equal(support.assertions.length,2);assert.ok(support.assertions.some(a=>a.reason==='Bibliography membership only'));
 const ambiguous=support.assertions.find(a=>a.reason==='Bibliography membership only').locators[0];assert.equal(ambiguous.owner_id,null);assert.equal(ambiguous.status,'ambiguous');assert.deepEqual(ambiguous.candidate_owners,['a','b']);
 assert.ok(graph.diagnostics.some(d=>d.code==='ambiguous-locator'));
 const reverse=await projectConnections([b,a],annotations,'edition');assert.equal(reverse.index_version,graph.index_version);assert.deepEqual(reverse.edges,graph.edges);
 const changed=await projectConnections([a,{...b,summary:'Changed source description'}],annotations,'edition');assert.notEqual(changed.index_version,graph.index_version);assert.deepEqual(changed.edges.map(e=>e.id),graph.edges.map(e=>e.id));
});

test('allowlisted structured fields preserve local limitations without mining prose or inferring support',async()=>{
 const a=record('a',{data:{arbitrary_text:'b supports a',workflow_ids:['b','missing'],relationship_profile:{workflow_ids:['b']},editorial_brief:{findings:[{claim:'Scoped finding',qualification:'Only for the fixture',locator:'Joint comparison, not per-source',source_ids:['b']}],reading_order:['b'],reading_notes:[{record_id:'b',reason:'Suggested next context'}],reading:{example:{record_id:'b'}}}}});
 const graph=await projectConnections([a,record('b'),record('isolate')],{edges:[]},'edition');assert.equal(graph.edges.length,2);assert.ok(graph.edges.every(e=>['cites','related'].includes(e.type)));assert.equal(graph.nodes.length,3);
 assert.ok(graph.diagnostics.some(d=>d.code==='dangling-reference'&&d.target==='missing'));
 const finding=graph.edges.find(e=>e.type==='cites').assertions[0];assert.ok(finding.limitations.includes('Only for the fixture'));assert.equal(finding.locators[1].kind,'finding-locator');assert.equal(finding.locators[1].status,'unresolved');
 await assert.rejects(projectConnections([a],{edges:[{from:'a',to:'missing',type:'qualifies',provenance:{reason:'bad'}}]},'edition'),/Invalid explicit graph endpoint/);
 const odd=record('id"]:not(*)');const safe=await projectConnections([odd,record('target')],{edges:[{from:odd.id,to:'target',type:'qualifies',provenance:{reason:'Literal IDs',source_ids:[odd.id],pointers:['/summary']}}]},'edition');assert.equal(safe.edges[0].from,odd.id);assert.ok(safe.nodes.find(n=>n.id===odd.id).href.includes('%22'));
});

test('actual enlarged corpus has a deterministic projection and retains issue173 qualification ownership',async()=>{
 const records=fs.readdirSync('data/corpus').filter(f=>f.endsWith('.json')).flatMap(f=>JSON.parse(fs.readFileSync('data/corpus/'+f)));const annotations=JSON.parse(fs.readFileSync('data/relationships.json'));const edition=JSON.parse(fs.readFileSync('data/catalog.json')).corpus_version;
 const start=performance.now(),graph=await projectConnections(records,annotations,edition),projectionMs=performance.now()-start;assert.equal(graph.counts.records,records.length);assert.ok(graph.counts.canonical_edges>records.length);
 assert.equal(new Set(graph.edges.map(e=>e.id)).size,graph.edges.length);for(const e of graph.edges){assert.ok(records.some(r=>r.id===e.from));assert.ok(records.some(r=>r.id===e.to));}
 const qualified=graph.edges.filter(e=>e.type==='qualifies'&&e.to==='guide-accounting-claim-counterexamples');assert.ok(qualified.length>=5);for(const e of qualified)for(const a of e.assertions.filter(a=>a.origin==='editorial-annotation'))for(const locator of a.locators){assert.equal(locator.owner_id,'guide-accounting-claim-counterexamples');assert.equal(locator.status,'resolved');}
 const degrees=new Map(records.map(r=>[r.id,0]));for(const e of graph.edges){degrees.set(e.from,degrees.get(e.from)+1);if(e.to!==e.from)degrees.set(e.to,degrees.get(e.to)+1);}
 console.log(JSON.stringify({corpus_version:edition,index_version:graph.index_version,...graph.counts,diagnostics:graph.diagnostics.length,serialized_bytes:Buffer.byteLength(JSON.stringify(graph)),projection_ms:projectionMs,highest_degree:[...degrees].sort((a,b)=>b[1]-a[1]).slice(0,5)}));
});
