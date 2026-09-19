import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const payload=read('data/research/aa-i102103-integration-records-2026-09-19.json');
const packet=read(payload.package_path),version='2026-09-19.12410';
const catalog=read('data/catalog.json');
assert.ok(['2026-09-19.12409',version].includes(catalog.corpus_version),'Refuse an unrecognized trade integration edition before writes');
const outputs=new Map();
const stage=(file,value)=>{
  const original=fs.readFileSync(file,'utf8');let body=JSON.stringify(value,null,2)+'\n';
  if(!/[^\x00-\x7f]/.test(original)&&/\\u[0-9a-f]{4}/i.test(original))body=body.replace(/[\u007f-\uFFFF]/g,c=>`\\u${c.charCodeAt(0).toString(16).padStart(4,'0')}`);
  outputs.set(file,body);
};
const same=(a,b)=>{try{assert.deepEqual(a,b);return true;}catch{return false;}};
function apply(rows,change){
  const index=rows.findIndex(row=>row.id===change.id),current=index<0?null:rows[index];
  if(same(current,change.after))return;
  assert.deepEqual(current,change.before,`Conflicting reviewed trade target: ${change.id}`);
  if(index<0)rows.push(structuredClone(change.after));else rows[index]=structuredClone(change.after);
}
const corpus=Object.fromEntries(['source','guide','example'].map(kind=>[kind,read(`data/corpus/${kind}.json`)]));
for(const change of payload.records){
  if(change.kind==='source')assert.ok(corpus.source.every(record=>record.source_url!==change.after.source_url||record.id===change.id),'Duplicate trade source URL');
  apply(corpus[change.kind],change);
}
for(const supplement of payload.source_supplements){
  const source=corpus.source.find(record=>record.id===supplement.id);
  assert.equal(source?.source_url,supplement.source_url,`Reused trade source document mismatch: ${supplement.id}`);
  const reviews=source.data.supplemental_reviews||=[];
  for(const review of supplement.reviews){
    const existing=reviews.find(r=>r.batch===review.batch);
    if(existing)assert.deepEqual(existing,review,`Conflicting trade source review: ${supplement.id}`);
    else reviews.push(structuredClone(review));
  }
}
const registry=read('data/coverage/research-questions.json');
for(const change of payload.questions)apply(registry.questions,change);
registry.question_set_version=version;registry.corpus_version=version;
registry.reviewed_at=[registry.reviewed_at,packet.reviewed_at].sort().at(-1);
const assessments=read('data/coverage/assessments.json');
for(const change of payload.assessments)apply(assessments.assessments,change);
assessments.assessment_version=version;
const mapping=read('data/coverage/mapping-overrides.json');
for(const change of payload.mapping_changes){
  const current=mapping.records[change.id]??null;
  if(!same(current,change.after)){assert.deepEqual(current,change.before,`Conflicting trade mapping: ${change.id}`);mapping.records[change.id]=structuredClone(change.after);}
}
mapping.mapping_version=version;mapping.updated_at=[mapping.updated_at,packet.reviewed_at].sort().at(-1);
const criteria=read('data/coverage/research-criteria.json');criteria.population.named_research_questions=registry.questions.length;
if(catalog.corpus_version!==version){
  catalog.coverage_note+=` Edition${version} integrates the bounded US wholesale and retail application, deepening six existing questions and adding one source and one synthetic reconciliation example while preserving other records.`;
  catalog.review_note+=` Edition${version} integrates accepted trade sourcead83f983; source edition2026-09-18.102103 remains historical evidence. No current-authority, professional-review, empirical, rights or deployment claim is upgraded.`;
}
catalog.corpus_version=version;catalog.updated_at=[catalog.updated_at,packet.reviewed_at].sort().at(-1);
for(const kind of ['source','guide','example'])stage(`data/corpus/${kind}.json`,corpus[kind]);
for(const [file,value]of Object.entries({'data/catalog.json':catalog,'data/coverage/research-questions.json':registry,'data/coverage/assessments.json':assessments,'data/coverage/mapping-overrides.json':mapping,'data/coverage/research-criteria.json':criteria}))stage(file,value);
for(const file of ['data/coverage/subsector-profiles.json','data/coverage/subsector-screening.json']){const value=read(file);value.corpus_version=version;stage(file,value);}
for(const [file,body]of outputs)if(fs.readFileSync(file,'utf8')!==body)fs.writeFileSync(file,body);
console.log(`Integrated six trade questions and two new records as ${version}; historical package version remains ${packet.package_version}.`);
