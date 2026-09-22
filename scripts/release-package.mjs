import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { inputInventory, buildInventory, sha256 } from "./release-inputs.mjs";
import { requiredPhases } from "./verify.mjs";

export const repository = "HenryBranchAdams/ai-agents-in-accounting";
export const workflowPath = ".github/workflows/corpus.yml";
const read = file=>JSON.parse(fs.readFileSync(file));
const hashPattern=/^[a-f0-9]{64}$/;
export function regularFiles(root) {
  return fs.readdirSync(root,{recursive:true}).sort().flatMap(name=>{
    const info=fs.lstatSync(path.join(root,name));
    if(info.isSymbolicLink()||(!info.isFile()&&!info.isDirectory()))throw new Error(`Nonregular package input: ${name}`);
    return info.isFile()?[name]:[];
  });
}
export function validateStorage(directory) {
  const body=fs.readFileSync(path.join(directory,"manifest.json"));const manifest=JSON.parse(body);
  assert.equal(manifest.schema_version,"1.0.0");
  assert.ok(manifest.objects && manifest.files && Object.keys(manifest.files).length);
  assert.deepEqual(regularFiles(path.join(directory,"objects")),Object.keys(manifest.objects).sort(),"Storage object membership differs");
  let bytes=0;const used=new Set();
  for(const [key,size] of Object.entries(manifest.objects)) {
    assert.match(key,hashPattern);assert.ok(Number.isSafeInteger(size)&&size>0&&size<=5*1024*1024);
    const compressed=fs.readFileSync(path.join(directory,"objects",key));
    assert.equal(compressed.length,size);assert.equal(sha256(compressed),key,"Corrupt storage object");bytes+=size;
  }
  // Validate logical files without loading a whole source archive into memory.
  for(const [name,file] of Object.entries(manifest.files)) {
    assert.ok(/^\/(downloads|releases)\//.test(name)||/^\/_runtime\/(data|connections)\/[a-f0-9]{64}\.(?:json\.)?gz$/.test(name),"Unexpected logical storage path");
    assert.ok(!name.includes("\\")&&!name.split("/").slice(1).some(p=>!p||p==="."||p===".."));
    assert.match(file.sha256,hashPattern);assert.ok(Number.isSafeInteger(file.bytes)&&file.bytes>=0);
    assert.ok(Array.isArray(file.chunks));let total=0;const digest=createHash("sha256");
    for(const key of file.chunks) {
      assert.ok(Object.hasOwn(manifest.objects,key),"Logical file references absent object");used.add(key);
      const chunk=gunzipSync(fs.readFileSync(path.join(directory,"objects",key)),{maxOutputLength:4*1024*1024});
      total+=chunk.length;digest.update(chunk);
    }
    assert.equal(total,file.bytes,`Logical file length: ${name}`);assert.equal(digest.digest("hex"),file.sha256,`Logical file digest: ${name}`);
  }
  assert.equal(used.size,Object.keys(manifest.objects).length,"Unreferenced objects are not accepted");
  return {manifest:sha256(body),objects:used.size,bytes,logical_files:Object.keys(manifest.files).length};
}
export function validatePackage(directory) {
  const manifest=read(path.join(directory,"release-package.json"));
  assert.equal(manifest.contract,"accounting-agents-ci-release");assert.equal(manifest.schema_version,1);
  const promised=manifest.files.map(file=>file.path);
  assert.equal(new Set(promised).size,promised.length);
  assert.ok(!promised.some(name=>/^application\/dist\/client\/(?:_runtime|assets\/(?:data|connections|objects))\//.test(name)),"Private runtime or storage objects cannot be public application assets");
  assert.deepEqual(regularFiles(directory),[...promised,"release-package.json"].sort());
  for(const file of manifest.files) {
    assert.ok(file.path&&!path.isAbsolute(file.path)&&!file.path.includes("\\")&&!file.path.split("/").some(p=>!p||p==="."||p===".."));
    const absolute=path.join(directory,file.path);const body=fs.readFileSync(absolute);
    assert.equal(body.length,file.bytes);assert.equal(sha256(body),file.sha256,`Package hash: ${file.path}`);
    assert.equal(fs.statSync(absolute).mode&0o777,file.mode);
  }
  const meta=read(path.join(directory,"evidence/release-meta.json"));
  const qualification=read(path.join(directory,"evidence/qualification.json"));
  assert.equal(meta.build_mode,"release","Preview cannot become release");
  assert.equal(meta.source_revision,manifest.source_revision);assert.equal(qualification.source_revision,manifest.source_revision);
  assert.equal(meta.corpus_version,manifest.corpus_version);assert.equal(qualification.corpus_version,manifest.corpus_version);
  const inputs=read(path.join(directory,"evidence/source-inputs.json"));
  assert.equal(sha256(JSON.stringify(inputs.files)),manifest.input_digest);
  assert.equal(inputs.digest,manifest.input_digest);
  assert.equal(inputs.files.find(file=>file.path==="package-lock.json")?.sha256,manifest.lockfile_sha256);
  const storage=validateStorage(path.join(directory,"storage"));
  assert.equal(meta.storage_manifest,storage.manifest);assert.equal(qualification.storage_manifest,storage.manifest);
  const stored=read(path.join(directory,"storage/manifest.json"));
  for(const [evidence,logical] of [["download-manifest","/downloads/manifest.json"],["source-export-manifest","/downloads/accounting-agents-source.manifest.json"]])
    assert.equal(sha256(fs.readFileSync(path.join(directory,`evidence/${evidence}.json`))),stored.files[logical]?.sha256);
  for(const required of ["application/dist/server/index.js","application/dist/server/wrangler.json","application/dist/.openai/hosting.json","application/.openai/hosting.json","application/dist/client/style.css"])
    assert.ok(promised.includes(required),`Missing runtime input: ${required}`);
  assert.deepEqual(read(path.join(directory,"application/.openai/hosting.json")),read(path.join(directory,"application/dist/.openai/hosting.json")));
  return {manifest,storage};
}
export function createReleasePackage({root=process.cwd(),destination=path.join(root,"outputs/ci-release"),env=process.env}={}) {
  const started=performance.now();
  assert.equal(env.GITHUB_REPOSITORY,repository);assert.equal(env.GITHUB_EVENT_NAME,"push");assert.equal(env.GITHUB_REF,"refs/heads/main");
  assert.match(env.GITHUB_SHA||"",/^[a-f0-9]{40}$/);assert.match(env.GITHUB_RUN_ID||"",/^\d+$/);assert.match(env.GITHUB_RUN_ATTEMPT||"",/^[1-9]\d*$/);
  assert.equal(execFileSync("git",["-C",root,"rev-parse","HEAD"],{encoding:"utf8"}).trim(),env.GITHUB_SHA);
  const verified=read(path.join(root,"outputs/verification/current.json"));const inputs=inputInventory(root);
  assert.equal(verified.status,"passed");assert.equal(verified.mode,"release");assert.equal(verified.source_revision,env.GITHUB_SHA);
  assert.equal(verified.build_digest,buildInventory(root).digest,"Verified build changed before packaging");
  assert.equal(verified.input_digest,inputs.digest);assert.equal(verified.node,process.version);
  assert.deepEqual(verified.phases.map(p=>p.name),requiredPhases.map(p=>p.name));assert.ok(verified.phases.every(p=>p.exit_code===0));
  assert.equal(verified.qualification_sha256,sha256(fs.readFileSync(path.join(root,"dist/storage/qualification.json"))));
  assert.ok(!fs.existsSync(destination),"Use a fresh release-package destination");
  fs.mkdirSync(path.dirname(destination),{recursive:true});const temp=fs.mkdtempSync(path.join(path.dirname(destination),".ci-release-"));
  try {
    const copy=(source,target)=>{fs.mkdirSync(path.dirname(path.join(temp,target)),{recursive:true});fs.copyFileSync(path.join(root,source),path.join(temp,target));fs.chmodSync(path.join(temp,target),0o644);};
    for(const folder of ["server",".openai","client"])
      for(const file of regularFiles(path.join(root,"dist",folder))) {
        if(folder==="client"&&/^(downloads|releases|_runtime|assets\/objects)\//.test(file))continue;
        copy(`dist/${folder}/${file}`,`application/dist/${folder}/${file}`);
      }
    copy(".openai/hosting.json","application/.openai/hosting.json");
    copy("dist/storage/manifest.json","storage/manifest.json");
    const storage=read(path.join(root,"dist/storage/manifest.json"));
    for(const key of Object.keys(storage.objects)){assert.match(key,hashPattern);copy(`dist/client/assets/objects/${key}`,`storage/objects/${key}`);}
    for(const [source,name] of [["dist/storage/qualification.json","qualification"],["dist/internal/release-meta.json","release-meta"],["dist/client/downloads/manifest.json","download-manifest"],["dist/client/downloads/accounting-agents-source.manifest.json","source-export-manifest"]])copy(source,`evidence/${name}.json`);
    fs.writeFileSync(path.join(temp,"evidence/source-inputs.json"),JSON.stringify(inputs)+"\n");
    const meta=read(path.join(temp,"evidence/release-meta.json"));
    const files=regularFiles(temp).map(file=>{const body=fs.readFileSync(path.join(temp,file));return {path:file,bytes:body.length,sha256:sha256(body),mode:0o644};});
    const manifest={schema_version:1,contract:"accounting-agents-ci-release",repository,workflow_path:workflowPath,event:"push",ref:"refs/heads/main",source_revision:env.GITHUB_SHA,source_tree:execFileSync("git",["-C",root,"rev-parse","HEAD^{tree}"],{encoding:"utf8"}).trim(),run_id:Number(env.GITHUB_RUN_ID),run_attempt:Number(env.GITHUB_RUN_ATTEMPT),corpus_version:meta.corpus_version,input_digest:inputs.digest,lockfile_sha256:verified.lockfile_sha256,toolchain:process.versions,build_options:{mode:"release"},required_phases:requiredPhases.map(p=>p.name),test_inventory:verified.test_inventory,files};
    fs.writeFileSync(path.join(temp,"release-package.json"),JSON.stringify(manifest,null,2)+"\n");
    const validated=validatePackage(temp);
    assert.equal(inputInventory(root).digest,inputs.digest,"Source changed during packaging");
    assert.equal(buildInventory(root).digest,verified.build_digest,"Build changed during packaging");
    fs.renameSync(temp,destination);
    return {directory:destination,source_revision:env.GITHUB_SHA,files:files.length,bytes:files.reduce((total,file)=>total+file.bytes,0),seconds:(performance.now()-started)/1000,storage:validated.storage};
  } catch(error){fs.renameSync(temp,`${temp}.failed`);throw error;}
}
if(import.meta.url===pathToFileURL(process.argv[1]||"").href){
  try{console.log(JSON.stringify(createReleasePackage(),null,2));}catch(error){console.error(error.message);process.exitCode=1;}
}
