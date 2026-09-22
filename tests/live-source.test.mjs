import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {execFileSync} from 'node:child_process';
import {readLiveSource,firstSuggestionHref} from '../scripts/live-source.mjs';
test('live comparison uses published ancestor records and separately identifies the verifier revision',()=>{
 const cwd=fs.mkdtempSync(path.join(os.tmpdir(),'aa-live-source-'));const git=(...args)=>execFileSync('git',['-c','user.name=Fixture','-c','user.email=fixture@example.invalid',...args],{cwd,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 try{
  git('init');fs.mkdirSync(path.join(cwd,'data/corpus'),{recursive:true});for(const kind of ['guide','collection','workflow'])fs.writeFileSync(path.join(cwd,`data/corpus/${kind}.json`),JSON.stringify([{id:kind,title:'Published'}]));fs.writeFileSync(path.join(cwd,'package-lock.json'),'{}\n');git('add','.');git('commit','-m','published');const published=git('rev-parse','HEAD');
  fs.writeFileSync(path.join(cwd,'data/corpus/guide.json'),JSON.stringify([{id:'guide',title:'Unpublished change'}]));git('add','.');git('commit','-m','verifier');const verifier=git('rev-parse','HEAD');
  const result=readLiveSource(published,{cwd});assert.equal(result.source_revision,published);assert.equal(result.verifier_revision,verifier);assert.equal(result.records.find(r=>r.id==='guide').title,'Published');
  const unrelated=git('commit-tree',git('rev-parse','HEAD^{tree}'),'-m','unrelated root');assert.throws(()=>readLiveSource(unrelated,{cwd}));assert.throws(()=>readLiveSource('main; malicious',{cwd}));
 }finally{fs.rmSync(cwd,{recursive:true,force:true});}
});
test('live command search follows canonical ranking regardless of the first record kind',()=>{
 for(const id of ['src_qbo_cdc_reference','guide-qbo-recovery'])assert.equal(firstSuggestionHref({items:[{id,href:'/records/'+id}]}),'/records/'+id);
 assert.throws(()=>firstSuggestionHref({items:[]}));assert.throws(()=>firstSuggestionHref({items:[{id:'valid',href:'https://external.example/'}]}));
});
