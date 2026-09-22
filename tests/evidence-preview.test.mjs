import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
const directory=fs.mkdtempSync(path.join(os.tmpdir(),'aa-evidence-adapter-'));
await build({entryPoints:['src/evidence-preview.ts'],outfile:path.join(directory,'adapter.mjs'),bundle:true,platform:'node',format:'esm'});
const {buildEvidencePreview,safeOriginalUrl}=await import(pathToFileURL(path.join(directory,'adapter.mjs')));
process.on('exit',()=>fs.rmSync(directory,{recursive:true,force:true}));
const source={id:'source-a',title:'A complete source title '.repeat(12),publisher:'Publisher',summary:'A source summary, not support for a particular claim.',source_url:'https://publisher.example/paper',review_status:'unknown',reviewed_at:null,rights:{external_content:'Publisher rights apply',source_license:null,full_text_stored:false},data:{access_note:'Full text not obtained',limitations:['Unreviewed methods'],source_review:{review_scope:'abstract only',source_locator:'Abstract paragraph 2',limitations:['No independent replication']}}};

test('finding provenance preserves ordered unique sources, scope and complete qualifications',()=>{
 const f={claim:'Claim <script>alert(1)</script>',classification:'Proposed synthesis',qualification:'Only applies under the stated assumptions.',locator:'Combined finding: sections 2 and 3',source_ids:['source-a','source-b','source-a']};
 const before=structuredClone(f);const dto=buildEvidencePreview('owner','edition',f,id=>id==='source-a'?source:undefined);
 assert.deepEqual(f,before);assert.deepEqual(dto.sources.map(s=>s.id),['source-a','source-b']);
 assert.equal(dto.locator_scope,'finding');assert.equal(dto.locator,f.locator);assert.equal(dto.qualification,f.qualification);
 assert.equal(dto.sources[0].title,source.title);assert.equal(dto.sources[0].summary,source.summary);assert.equal(dto.sources[0].review_locator,'Abstract paragraph 2');
 assert.deepEqual(dto.sources[0].limitations,['Unreviewed methods','No independent replication']);
 assert.equal(dto.sources[0].reviewed_at,'Unknown or not recorded');assert.ok(dto.sources[0].rights.some(r=>r.label==='source license'&&r.value==='Unknown or not recorded'));
 assert.equal(dto.sources[1].available,false);assert.equal(dto.sources[1].title,null);assert.equal(dto.owner_href,'/records/owner');
 assert.equal('data' in dto.sources[0],false);
});

test('missing metadata and malformed original URLs never invent access or throw',()=>{
 for(const input of [null,{},'',42,[],{source_ids:['missing'],locator:null}])assert.doesNotThrow(()=>buildEvidencePreview('owner','edition',input,()=>undefined));
 for(const url of [null,'not a url','javascript:alert(1)','data:text/html,hi','/relative','https://user:secret@example.test'])assert.equal(safeOriginalUrl(url),null);
 assert.equal(safeOriginalUrl('https://publisher.example/a?b=1'),'https://publisher.example/a?b=1');
 const dto=buildEvidencePreview('owner','edition',{source_ids:['x']},()=>({...source,source_url:'javascript:evil()',rights:{},data:{}}));
 assert.equal(dto.sources[0].original_url,null);assert.match(dto.locator,/not recorded/);assert.match(dto.sources[0].access,/unknown/i);assert.deepEqual(dto.sources[0].rights,[{label:'Source permissions',value:'Unknown or not recorded'}]);
});
