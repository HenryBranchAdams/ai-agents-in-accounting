import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import { pathToFileURL } from 'node:url';

// Additive, scoped intake like the existing industry integrators. Prior source
// reviews, discovery annotations, mappings and immutable editions are untouched.
export function applyToRoot(root, {dryRun=false}={}) {
  const read=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
  const packet=read('data/research/partnership-foundations-2026-09-27.json');
  const stage=new Map();
  const load=file=>{const value=read(file);stage.set(file,value);return value;};
  const corpus=Object.fromEntries(['source','guide','example','term'].map(kind=>[kind,load(`data/corpus/${kind}.json`)]));
  const all=fs.readdirSync(path.join(root,'data/corpus')).flatMap(file=>read(`data/corpus/${file}`));
  const index=new Map(all.map(r=>[r.id,r]));
  const urls=new Map(corpus.source.map(r=>[r.source_url,r.id]));
  const append=(rows,row)=>{
    const old=rows.find(r=>r.id===row.id);
    assert.ok(!old||isDeepStrictEqual(old,row),`Intake conflict: ${row.id}`);
    if(!old)rows.push(structuredClone(row));
  };
  for(const row of [...packet.sources,...packet.records]) {
    assert.ok(corpus[row.kind],`Unsupported kind: ${row.kind}`);
    assert.equal(row.rights.full_text_stored,false);
    assert.ok(!index.has(row.id)||isDeepStrictEqual(index.get(row.id),row),`Identity conflict: ${row.id}`);
    if(row.kind==='source') {
      assert.ok(!urls.has(row.source_url)||urls.get(row.source_url)===row.id,`URL conflict: ${row.id}`);
      urls.set(row.source_url,row.id);
    }
    append(corpus[row.kind],row);index.set(row.id,row);
  }
  for(const {record_id,expected_source_url,review} of packet.supplemental_reviews) {
    const source=corpus.source.find(r=>r.id===record_id);
    assert.equal(source?.source_url,expected_source_url,`Supplement identity: ${record_id}`);
    assert.equal(review.checked_url,expected_source_url);
    const reviews=source.data.supplemental_reviews||[];
    const old=reviews.find(r=>r.batch===review.batch);
    assert.ok(!old||isDeepStrictEqual(old,review),`Supplement conflict: ${record_id}`);
    if(!old)source.data.supplemental_reviews=[...reviews,structuredClone(review)];
  }
  for(const row of packet.records) {
    for(const id of row.source_ids)assert.equal(index.get(id)?.kind,'source',`Source: ${id}`);
    for(const id of row.related_ids)assert.ok(index.has(id),`Related: ${id}`);
  }
  const questions=load('data/coverage/research-questions.json');
  for(const row of packet.question_rows) {
    const pointed=row.pointer.slice(1).split('/').reduce((value,key)=>value?.[key],index.get(row.record_id));
    assert.deepEqual(pointed,row,`Question pointer: ${row.id}`);
    for(const locator of row.source_locators)assert.equal(locator.url,index.get(locator.source_id)?.source_url);
    append(questions.questions,row);
  }
  const assessments=load('data/coverage/assessments.json');
  for(const row of packet.assessments)append(assessments.assessments,row);
  const mappings=load('data/coverage/mapping-overrides.json');
  for(const [id,row] of Object.entries(packet.mapping_overrides)) {
    assert.ok(!mappings.records[id]||isDeepStrictEqual(mappings.records[id],row),`Mapping conflict: ${id}`);
    mappings.records[id]=structuredClone(row);
  }
  const fixtures=load('data/research-questions.json');
  for(const row of read('data/research/partnership-foundations-retrieval-2026-09-27.json'))append(fixtures,row);
  const criteria=load('data/coverage/research-criteria.json');
  criteria.population.named_research_questions=questions.questions.length;
  let changed=0;
  for(const [file,value] of stage) {
    if(isDeepStrictEqual(read(file),value))continue;
    if(!dryRun)fs.writeFileSync(path.join(root,file),JSON.stringify(value,null,2)+'\n');
    changed++;
  }
  return {changed,dryRun,sources:packet.sources.length,questions:packet.question_rows.length};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href) {
  assert.ok(process.argv.includes('--apply')||process.argv.includes('--dry-run'),'Use --apply or --dry-run');
  console.log(applyToRoot(process.cwd(),{dryRun:process.argv.includes('--dry-run')}));
}
