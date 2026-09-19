import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import {pathToFileURL} from 'node:url';

export const packetFile='data/research/healthcare-2026-09-19.json';
export function applyToRoot(root,{expectedVersion,dryRun=false}={}) {
  const read=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
  const packet=read(packetFile),catalog=read('data/catalog.json');
  assert.equal(packet.status,'source-only-pending-integration');
  assert.equal(catalog.corpus_version,expectedVersion||packet.current_corpus_version,'Refuse unexpected health care integration edition before writes');
  assert.equal(packet.integration_contract.catalog_write,false);
  assert.equal(packet.integration_contract.release_write,false);
  const stage=new Map(), index=new Map();
  for(const name of fs.readdirSync(path.join(root,'data/corpus')).filter(name=>name.endsWith('.json'))){
    const file=`data/corpus/${name}`, rows=read(file);stage.set(file,rows);
    for(const row of rows){assert.ok(!index.has(row.id),`Duplicate stable record ${row.id}`);index.set(row.id,row);}
  }
  const urls=new Map([...index.values()].filter(r=>r.kind==='source'&&r.source_url).map(r=>[r.source_url,r.id]));
  const add=(rows,row,label)=>{const old=rows.find(r=>r.id===row.id);assert.ok(!old||isDeepStrictEqual(old,row),`Health care preflight conflict: ${label}:${row.id}`);if(!old)rows.push(structuredClone(row));};
  for(const row of [...packet.sources,...packet.records]){
    assert.ok(stage.has(`data/corpus/${row.kind}.json`),`Unsupported kind ${row.kind}`);
    const old=index.get(row.id);assert.ok(!old||isDeepStrictEqual(old,row),`Health care preflight conflict: record:${row.id}`);
    if(row.kind==='source'){
      assert.ok(!urls.has(row.source_url)||urls.get(row.source_url)===row.id,`Health care source URL identity conflict: ${row.id}`);
      urls.set(row.source_url,row.id);
      for(const loc of row.data.locators||[])if(loc.url)assert.equal(loc.url,row.source_url,'Source locator URL identity');
    }
    add(stage.get(`data/corpus/${row.kind}.json`),row,'record');index.set(row.id,row);
  }
  for(const row of [...packet.records,...packet.sources]){
    for(const id of row.source_ids)assert.equal(index.get(id)?.kind,'source',`Missing health care source ${id}`);
    for(const id of row.related_ids)assert.ok(index.has(id),`Missing health care related record ${id}`);
  }
  for(const q of packet.question_rows){
    const guide=index.get(q.record_id);assert.ok(guide,`Missing question record ${q.record_id}`);
    const pointed=q.pointer.split('/').slice(1).reduce((node,key)=>node?.[key],guide);
    assert.deepEqual(pointed,q,`Question pointer differs ${q.id}`);
    for(const loc of q.source_locators){assert.equal(index.get(loc.source_id)?.kind,'source');assert.equal(loc.url,index.get(loc.source_id).source_url,`Question source URL identity ${q.id}`);assert.ok(loc.effective_period&&loc.access_limits);}
  }
  for(const [file,key,incoming] of [['data/coverage/research-questions.json','questions',packet.question_rows],['data/coverage/assessments.json','assessments',packet.assessments]]){
    const value=read(file);for(const row of incoming)add(value[key],row,key);stage.set(file,value);
  }
  const file='data/coverage/mapping-overrides.json',mappings=read(file);
  for(const [id,row] of Object.entries(packet.mapping_overrides)){const old=mappings.records[id];assert.ok(!old||isDeepStrictEqual(old,row),`Health care preflight conflict: mapping:${id}`);mappings.records[id]=row;}
  stage.set(file,mappings);
  let changed=0;
  for(const [file,value] of stage){
    const original=fs.readFileSync(path.join(root,file),'utf8');if(isDeepStrictEqual(JSON.parse(original),value))continue;
    let body=JSON.stringify(value,null,2)+'\n';
    if(!/[^\x00-\x7f]/.test(original)&&/\\u[0-9a-f]{4}/i.test(original))body=body.replace(/[\u007f-\uFFFF]/g,c=>`\\u${c.charCodeAt(0).toString(16).padStart(4,'0')}`);
    if(!dryRun)fs.writeFileSync(path.join(root,file),body);changed++;
  }
  return {dryRun,changed,catalog_version:catalog.corpus_version,sources:packet.sources.length,records:packet.records.length,questions:packet.question_rows.length,assessments:packet.assessments.length};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  const value=flag=>{const i=process.argv.indexOf(flag);return i<0?undefined:process.argv[i+1];};
  console.log(JSON.stringify(applyToRoot(value('--root')||process.cwd(),{expectedVersion:value('--expected-version'),dryRun:process.argv.includes('--dry-run')}),null,2));
}
