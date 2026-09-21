import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {captureCandidate, inputInventory, sha256, editionProblems} from './release-inputs.mjs';

const read = file => JSON.parse(fs.readFileSync(file));
const atomic = (file, value) => {
  const temporary = `${file}.tmp-${process.pid}`;
  fs.writeFileSync(temporary, JSON.stringify(value, null, 2) + '\n', {flag:'wx'});
  fs.renameSync(temporary, file);
};
const git = (root, args) => execFileSync('git', ['-C', root, ...args], {encoding:'utf8'}).trim();
const area = root => path.join(root, 'outputs/editions');
const mutable = new Set(['data/catalog.json','data/coverage/mapping-overrides.json','data/coverage/assessments.json','data/coverage/research-questions.json','data/coverage/subsector-profiles.json','data/coverage/subsector-screening.json','data/coverage/record-mappings.json','data/coverage/snapshots.json','data/coverage/snapshots.generated.ts','data/releases/index.json']);
const allowed = (file, version) => typeof file === 'string' && !file.includes('\\') && file.split('/').every(part=>part && part!=='.' && part!=='..') && (mutable.has(file) || file.startsWith(`data/releases/${version}/`) || file === `data/coverage/snapshots/${version}.json`);
const entryEqual = (a,b) => JSON.stringify(a) === JSON.stringify(b);

// The commit that incorporated the current immutable release is the baseline
// for data changes. Rendering/tooling changes alone never allocate an edition.
export function editionNeeded(root = process.cwd()) {
  const version = read(path.join(root,'data/catalog.json')).corpus_version;
  const baseline = git(root,['log','-1','--format=%H','--',`data/releases/${version}/manifest.json`]);
  if (!baseline) throw new Error('Current finalized release has no source-history baseline');
  const changed = git(root,['diff',baseline,'--name-only','--','data/catalog.json','data/corpus','data/coverage']);
  const added = git(root,['ls-files','--others','--exclude-standard','--','data/catalog.json','data/corpus','data/coverage']);
  return {needed:Boolean(changed || added),version,baseline,changed:[...new Set(`${changed}\n${added}`.split('\n').filter(Boolean))]};
}

export function prepareEdition({root=process.cwd(),version,date=new Date().toISOString().slice(0,10),supersedes}={}) {
  const plan = editionNeeded(root);
  if (!plan.needed) return {status:'no-edition-needed',...plan};
  if (!/^\d{4}-\d{2}-\d{2}\.\d+$/.test(version || '') || version.localeCompare(plan.version,'en',{numeric:true}) <= 0) throw new Error('Supply a new prospective edition after the finalized version');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || new Date(date).toISOString().slice(0,10)!==date) throw new Error('Invalid preparation date');
  const before = inputInventory(root);
  const revision = git(root,['rev-parse','HEAD']);
  const id = sha256(JSON.stringify({digest:before.digest,revision,version,date,node:process.version}));
  fs.mkdirSync(area(root),{recursive:true});
  const lock = path.join(area(root),'operation.lock');
  const fd = fs.openSync(lock,'wx');fs.writeFileSync(fd,JSON.stringify({pid:process.pid,id}));fs.closeSync(fd);
  try {
    const reservation = path.join(area(root),`${version}.json`);
    const previous = fs.existsSync(reservation) ? read(reservation) : null;
    if (previous && previous.id !== id && previous.id !== supersedes) throw new Error(`Edition reserved by candidate ${previous.id}; explicitly supersede that candidate`);
    const directory = path.join(area(root),id);
    const receipt = path.join(directory,'prepared.json');
    if (fs.existsSync(receipt)) {
      const saved=read(receipt);
      if (saved.status!=='prepared' || inputInventory(path.join(directory,'source')).digest!==saved.prepared_digest) throw new Error('Prepared candidate is modified; preserve it and prepare a new input identity');
      atomic(reservation,{id,status:'prepared'});
      return saved;
    }
    if (fs.existsSync(directory)) fs.renameSync(directory,`${directory}.failed-${Date.now()}`);
    atomic(reservation,{id,status:'preparing'});
    const destination=path.join(directory,'source');
    captureCandidate({root,destination});
    const log=fs.openSync(path.join(directory,'prepare.log'),'wx');
    try {
      execFileSync('npm',['ci','--offline'],{cwd:destination,stdio:['ignore',log,log]});
      execFileSync(process.execPath,['scripts/prepare-edition-inputs.mjs',version,date],{cwd:destination,stdio:['ignore',log,log]});
    } catch(error) {
      throw new Error(`Preparation failed; see ${path.join(directory,'prepare.log')}. For a missing npm cache, run npm ci in the source checkout with the same npm cache setting, then repeat preparation. Failed attempts are retained. Cause: ${error.message}`);
    } finally {fs.closeSync(log);}
    const problems=editionProblems(destination);
    if(problems.length) throw new Error(problems.join('; '));
    const after=inputInventory(destination);
    const old=new Map(before.files.map(f=>[f.path,f]));
    const changes=after.files.filter(f=>!entryEqual(f,old.get(f.path))).map(f=>({path:f.path,before:old.get(f.path)||null,after:f}));
    for(const change of changes) {
      if(!allowed(change.path,version)) throw new Error(`Unexpected generated change: ${change.path}`);
      if(!mutable.has(change.path) && change.before) throw new Error(`Historical object already exists: ${change.path}`);
    }
    if(before.files.some(f=>!after.files.some(a=>a.path===f.path))) throw new Error('Preparation removed a source input');
    if(inputInventory(root).digest!==before.digest || git(root,['rev-parse','HEAD'])!==revision) throw new Error('Editing checkout changed during preparation; candidate cannot be finalized');
    const saved={schema_version:1,id,status:'prepared',publishable:false,version,predecessor:plan.version,date,source_revision:revision,input_digest:before.digest,prepared_digest:after.digest,node:process.version,inputs:before.files,changes};
    const capture=read(path.join(destination,'outputs/candidate.json'));
    atomic(path.join(destination,'outputs/candidate.json'),{...capture,input_digest:after.digest,edition_candidate:id});
    atomic(receipt,saved);atomic(reservation,{id,status:'prepared'});
    return saved;
  } finally {fs.unlinkSync(lock);}
}

// Every expected byte is checked before promotion. A journal is written first;
// interruption is recoverable by the same command and never overwrites drift.
export function finalizeEdition({root=process.cwd(),id,afterWrite=()=>{}}={}) {
  if(!/^[a-f0-9]{64}$/.test(id||''))throw new Error('Expected full candidate identity');
  const directory=path.join(area(root),id), source=path.join(directory,'source');
  const prepared=read(path.join(directory,'prepared.json'));
  if(!/^\d{4}-\d{2}-\d{2}\.\d+$/.test(prepared.version||'') || prepared.id!==id || prepared.status!=='prepared' || prepared.publishable!==false)throw new Error('Invalid preparation');
  if(git(root,['rev-parse','HEAD'])!==prepared.source_revision)throw new Error('Source revision changed; prepare again');
  if(inputInventory(source).digest!==prepared.prepared_digest)throw new Error('Prepared source changed; evidence is invalid');
  const reservation=read(path.join(area(root),`${prepared.version}.json`));
  if(reservation.id!==id)throw new Error('Candidate has been superseded');
  const lock=path.join(area(root),'operation.lock');
  const fd=fs.openSync(lock,'wx');fs.writeFileSync(fd,JSON.stringify({pid:process.pid,id}));fs.closeSync(fd);
  try {
    const journal=path.join(directory,'finalization.json');
    const prior=fs.existsSync(journal)?read(journal):null;
    if(prior && prior.id!==id)throw new Error('Finalization identity mismatch');
    const actual=inputInventory(root);
    const original=new Map(prepared.inputs.map(f=>[f.path,f]));
    const updates=new Map(prepared.changes.map(c=>[c.path,c]));
    if(updates.size!==prepared.changes.length)throw new Error('Duplicate finalization target');
    for(const change of updates.values())if(!allowed(change.path,prepared.version) || change.after.path!==change.path || (change.before && change.before.path!==change.path) || (!mutable.has(change.path)&&change.before))throw new Error('Unsafe finalization target');
    // A prior journal permits exactly old or new bytes for changed paths. It
    // never permits an unrelated changed, new, missing or executable input.
    for(const file of actual.files) {
      const change=updates.get(file.path);
      if(!entryEqual(file,original.get(file.path)) && !(prior && change && entryEqual(file,change.after))) throw new Error(`Concurrent input change: ${file.path}`);
    }
    for(const file of prepared.inputs)if(!actual.files.some(f=>f.path===file.path))throw new Error(`Missing original input: ${file.path}`);
    const state={schema_version:1,id,status:'promoting',input_digest:prepared.input_digest,prepared_digest:prepared.prepared_digest};
    atomic(journal,state);
    atomic(path.join(area(root),`${prepared.version}.json`),{id,status:'promoting'});
    for(const change of prepared.changes) {
      const target=path.join(root,change.path), bytes=fs.readFileSync(path.join(source,change.path));
      if(sha256(bytes)!==change.after.sha256)throw new Error('Candidate changed during promotion');
      if(fs.existsSync(target)&&sha256(fs.readFileSync(target))===change.after.sha256)continue;
      // Recheck each target immediately before replacing it.
      if(fs.existsSync(target) ? !change.before || sha256(fs.readFileSync(target))!==change.before.sha256 : Boolean(change.before)) throw new Error(`Concurrent target change: ${change.path}`);
      fs.mkdirSync(path.dirname(target),{recursive:true});
      const temporary=path.join(directory,`promote-${process.pid}`);
      fs.writeFileSync(temporary,bytes,{flag:'wx',mode:change.after.executable?0o755:0o644});
      fs.renameSync(temporary,target);
      afterWrite(change.path);
    }
    if(inputInventory(root).digest!==prepared.prepared_digest)throw new Error('Finalized input identity differs; inspect retained journal');
    atomic(journal,{...state,status:'finalized'});
    atomic(path.join(area(root),`${prepared.version}.json`),{id,status:'finalized'});
    return {id,status:'finalized',version:prepared.version,input_digest:prepared.prepared_digest,publishable:false};
  } finally {fs.unlinkSync(lock);}
}

if(import.meta.url===pathToFileURL(process.argv[1]||'').href) {
  try {
    const [command,value,supersedes]=process.argv.slice(2);
    const result=command==='plan'?editionNeeded():command==='prepare'?prepareEdition({version:value,supersedes}):command==='finalize'?finalizeEdition({id:value}):null;
    if(!result)throw new Error('Usage: edition.mjs plan | prepare VERSION [SUPERSEDED_ID] | finalize CANDIDATE_ID');
    console.log(JSON.stringify(result,null,2));
  }catch(error){console.error(error.message);process.exitCode=1;}
}
