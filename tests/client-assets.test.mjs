import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';
import worker from './worker-fixture.mjs';
test('every emitted eager, shared and lazy browser chunk is served exactly through the worker',async()=>{
 const meta=JSON.parse(fs.readFileSync('dist/internal/client-build.json'));const files=Object.keys(meta.outputs).filter(f=>f.endsWith('.js'));assert.ok(files.length>=3,'Exercise shared and lazy assets');
 for(const file of files){const url='https://corpus.example/assets/'+path.basename(file),response=await worker.fetch(new Request(url));assert.equal(response.status,200,file);assert.deepEqual(Buffer.from(await response.arrayBuffer()),fs.readFileSync(file));assert.equal((await worker.fetch(new Request(url,{method:'HEAD'}))).status,200);}
 for(const suffix of ['chunk-NOTBUILT.js','navigation-NOTBUILT.js','../internal/client-build.json','data/secrets.json'])assert.equal((await worker.fetch(new Request('https://corpus.example/assets/'+suffix))).status,404,suffix);
});
