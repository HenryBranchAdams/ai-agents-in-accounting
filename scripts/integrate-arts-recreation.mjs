import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';

export const packetFile='data/research/arts-recreation-2026-09-19.json';
const rootOf=()=>path.resolve(process.env.ARTS_RECREATION_ROOT||process.cwd());
const read=(root,file)=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
const json=value=>JSON.stringify(value,null,2)+'\n';
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const clone=value=>JSON.parse(JSON.stringify(value));
const fail=message=>{throw new Error(message);};
const corpusKinds=['source','guide','workflow','control','example'];

function appendExact(rows,incoming,target){
  const index=new Map(rows.map(row=>[row.id,row]));
  for(const row of incoming){
    const old=index.get(row.id);
    if(old&&!same(old,row))fail(`${target}:${row.id}: existing object differs; refusing overwrite`);
    if(!old){rows.push(clone(row));index.set(row.id,row);}
  }
}
function assertGitHead(root,pkg){
  if(!fs.existsSync(path.join(root,'.git')))return;
  assert.equal(execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),pkg.base_commit,'source validation must use the exact package base');
}
function planWrite(planned,root,file,value){
  const original=fs.readFileSync(path.join(root,file),'utf8');
  let body=json(value);
  if(!/[^\x00-\x7f]/.test(original)&&/\\u[0-9a-f]{4}/i.test(original))body=body.replace(/[\u007f-\uFFFF]/g,c=>`\\u${c.charCodeAt(0).toString(16).padStart(4,'0')}`);
  planned.set(file,body);
}
function sourceIndex(root,pkg){
  const index=new Map();
  for(const kind of corpusKinds){for(const row of read(root,`data/corpus/${kind}.json`)){if(index.has(row.id))fail(`Duplicate stable record ${row.id}`);index.set(row.id,row);}}
  for(const row of [pkg.sources,...corpusKinds.flatMap(kind=>pkg.records.filter(record=>record.kind===kind))].flat()){
    const old=index.get(row.id);if(old&&!same(old,row))fail(`Packet object conflicts with base record ${row.id}`);index.set(row.id,row);
  }
  return index;
}
function assertSourceIdentity(index,pkg){
  const urls=new Map();
  for(const row of index.values())if(row.kind==='source'&&row.source_url&&!urls.has(row.source_url))urls.set(row.source_url,row.id);
  for(const row of pkg.sources){
    const old=urls.get(row.source_url);
    if(old&&old!==row.id)fail(`Proposed publisher URL identity conflict: ${row.source_url} (${old}, ${row.id})`);
    urls.set(row.source_url,row.id);
    for(const locator of row.data?.locators||[])assert.equal(locator.url||row.source_url,row.source_url,`${row.id}: source locator URL identity`);
  }
  return urls;
}
function resolvePointer(object,pointer){return pointer.split('/').slice(1).reduce((value,key)=>value?.[key.replaceAll('~1','/').replaceAll('~0','~')],object);}

export function applyToRoot(root=rootOf(),{dryRun=false}={}){
  const pkg=read(root,packetFile);
  assert.equal(pkg.schema_version,'1.0.0');
  assertGitHead(root,pkg);
  const catalog=read(root,'data/catalog.json');
  assert.equal(catalog.corpus_version,pkg.current_corpus_version,'Refuse unexpected arts/recreation integration edition before writes');
  const index=sourceIndex(root,pkg);
  assertSourceIdentity(index,pkg);
  for(const row of pkg.sources)assert.equal(row.kind,'source');
  for(const row of pkg.records){
    assert.ok(index.has(row.id),`${row.id}: packet record not staged`);
    for(const sourceId of row.source_ids)assert.equal(index.get(sourceId)?.kind,'source',`${row.id}: missing source ${sourceId}`);
    for(const relatedId of row.related_ids)assert.ok(index.has(relatedId),`${row.id}: missing related record ${relatedId}`);
  }
  const guide=index.get(pkg.question_rows[0].record_id);
  for(const q of pkg.question_rows){
    const pointed=resolvePointer(guide,q.pointer);
    assert.deepEqual(pointed,q,`${q.id}: question pointer does not match guide record`);
    for(const locator of q.source_locators){
      const source=index.get(locator.source_id);assert.equal(source?.kind,'source',`${q.id}: missing locator source ${locator.source_id}`);assert.equal(locator.url,source.source_url,`${q.id}: locator URL identity`);assert.ok(locator.locator&&locator.effective_period&&locator.access_limits,`${q.id}: incomplete locator evidence`);
    }
  }
  for(const assessment of pkg.assessments){
    assert.equal(assessment.status,'partial',`${assessment.id}: source package must remain partial`);
    assert.equal(assessment.source_currency,'unknown',`${assessment.id}: source currency must remain unknown`);
    for(const id of assessment.evidence_record_ids)assert.ok(index.has(id),`${assessment.id}: missing evidence record ${id}`);
  }
  const planned=new Map();
  for(const kind of corpusKinds){const file=`data/corpus/${kind}.json`,rows=read(root,file);const incoming=kind==='source'?[...pkg.sources,...pkg.records.filter(row=>row.kind===kind)]:pkg.records.filter(row=>row.kind===kind);appendExact(rows,incoming,file);planWrite(planned,root,file,rows);}
  const questionsFile='data/coverage/research-questions.json',questions=read(root,questionsFile),beforeQuestionCount=questions.questions.length,existingQuestionIds=new Set(questions.questions.map(row=>row.id));appendExact(questions.questions,pkg.question_rows,`${questionsFile}.questions`);const newQuestionCount=pkg.question_rows.filter(row=>!existingQuestionIds.has(row.id)).length;assert.equal(questions.questions.length,beforeQuestionCount+newQuestionCount,`${questionsFile}: packet question IDs must be additive or already applied`);planWrite(planned,root,questionsFile,questions);
  const assessmentsFile='data/coverage/assessments.json',assessments=read(root,assessmentsFile);appendExact(assessments.assessments,pkg.assessments,`${assessmentsFile}.assessments`);planWrite(planned,root,assessmentsFile,assessments);
  const mappingFile='data/coverage/mapping-overrides.json',mapping=read(root,mappingFile);
  for(const [id,row] of Object.entries(pkg.mapping_overrides)){const old=mapping.records[id];if(old&&!same(old,row))fail(`${mappingFile}.records.${id}: existing mapping differs; refusing overwrite`);if(!old)mapping.records[id]=clone(row);}
  planWrite(planned,root,mappingFile,mapping);
  const criteriaFile='data/coverage/research-criteria.json',criteria=read(root,criteriaFile);criteria.population.named_research_questions=questions.questions.length;planWrite(planned,root,criteriaFile,criteria);
  if(!dryRun)for(const [file,body] of planned){if(fs.readFileSync(path.join(root,file),'utf8')!==body)fs.writeFileSync(path.join(root,file),body);}
  return {dryRun,files:[...planned.keys()],added_records:pkg.records.length+pkg.sources.length,questions:pkg.question_rows.length,assessments:pkg.assessments.length,corpus_version:catalog.corpus_version};
}

function copyPacketAndHelper(sourceRoot,targetRoot){
  for(const file of [packetFile,'scripts/integrate-arts-recreation.mjs']){const dest=path.join(targetRoot,file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(sourceRoot,file),dest);}
  const modules=path.join(sourceRoot,'node_modules');if(fs.existsSync(modules)&&!fs.existsSync(path.join(targetRoot,'node_modules')))fs.symlinkSync(modules,path.join(targetRoot,'node_modules'),'dir');
}

export async function runAppliedValidation(sourceRoot=rootOf()){
  const pkg=read(sourceRoot,packetFile);const before=execFileSync('git',['-C',sourceRoot,'status','--porcelain'],{encoding:'utf8'});const temp=fs.mkdtempSync(path.join(os.tmpdir(),'aa-i113-applied-'));
  try{
    execFileSync('git',['clone','--local','--no-hardlinks',sourceRoot,temp],{stdio:'pipe'});
    execFileSync('git',['-C',temp,'checkout','--detach',pkg.base_commit],{stdio:'pipe'});
    copyPacketAndHelper(sourceRoot,temp);
    const result=applyToRoot(temp);
    const criteriaPath=path.join(temp,'data/coverage/research-criteria.json');const criteria=JSON.parse(fs.readFileSync(criteriaPath));criteria.population.named_research_questions=JSON.parse(fs.readFileSync(path.join(temp,'data/coverage/research-questions.json'))).questions.length;fs.writeFileSync(criteriaPath,json(criteria));
    execFileSync(process.execPath,['scripts/coverage-mappings.mjs'],{cwd:temp,stdio:'pipe'});
    const validated=execFileSync(process.execPath,['scripts/validate.mjs'],{cwd:temp,encoding:'utf8'});
    const bundle=path.join(temp,'agent.mjs');execFileSync(path.join(sourceRoot,'node_modules/.bin/esbuild'),['src/agent.ts','--bundle','--platform=node','--format=esm',`--outfile=${bundle}`],{cwd:temp,stdio:'pipe'});
    const {executeAgent}=await import(pathToFileURL(bundle).href);
    const retrieval=execFileSync(process.execPath,['--input-type=module','-e',`import {executeAgent} from ${JSON.stringify(pathToFileURL(bundle).href)};
const fixtures=${JSON.stringify(pkg.retrieval_fixtures)};
for(const f of fixtures.search){if(f.limit>20)throw new Error('search limit exceeds 20');const result=executeAgent('search',{q:f.query,limit:f.limit});for(const id of f.expected_record_ids)if(!result.results.some(r=>r.id===id))throw new Error('missing search result '+id);}
const context=executeAgent('context',{ids:[fixtures.context[0].id],include_sources:true,max_chars:40000});for(const id of fixtures.context[0].expected_source_ids)if(!context.records.some(x=>x.record.id===id&&x.record.citation?.original_source_url))throw new Error('missing contextual source '+id);
for(const f of fixtures.get){const got=executeAgent('get',{id:f.id,limit:f.limit});if(got.record.id!==f.id||!got.passages.length)throw new Error('get failed '+f.id);if(got.record.rights.full_text_stored!==false)throw new Error('rights boundary failed '+f.id);}
try{executeAgent('search',{q:'arts',limit:21});throw new Error('limit 21 unexpectedly accepted');}catch(error){if(!/limit|maximum|20/i.test(String(error.message)))throw error;}
console.log(JSON.stringify({searches:fixtures.search.length,gets:fixtures.get.length,context_sources:context.records.length}));`],{cwd:temp,encoding:'utf8'}).trim();
    assert.equal(execFileSync('git',['-C',sourceRoot,'status','--porcelain'],{encoding:'utf8'}),before,'applied validation changed source worktree');
    return {temp_git_worktree:true,apply:result,validator_output:validated.trim(),retrieval_output:retrieval};
  }finally{fs.rmSync(temp,{recursive:true,force:true});}
}

if(import.meta.url===pathToFileURL(process.argv[1]||'').href){
  const mode=process.argv[2]||'--describe';
  if(mode==='--dry-run')console.log(JSON.stringify(applyToRoot(rootOf(),{dryRun:true}),null,2));
  else if(mode==='--apply')console.log(JSON.stringify(applyToRoot(),null,2));
  else if(mode==='--validate-applied')console.log(JSON.stringify(await runAppliedValidation(),null,2));
  else if(mode==='--describe')console.log(JSON.stringify({packet:packetFile,base_commit:read(rootOf(),packetFile).base_commit,write_scope:'source packet and scoped canonical application only; no catalog or release writes'},null,2));
  else fail('Usage: node scripts/integrate-arts-recreation.mjs --describe|--dry-run|--apply|--validate-applied');
}
