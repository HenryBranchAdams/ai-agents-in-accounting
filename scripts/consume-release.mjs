import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync, spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { repository, workflowPath, validatePackage } from "./release-package.mjs";

export const repositoryId=1344646234;
export const workflowId=356650039;
export const requiredSteps=[
 "Preflight pinned verification inputs",
 "Lint, typecheck, data validation and design-rule probes",
 "Build application and exports once",
 "Run every test against the primary build",
 "Qualify the tested release",
 "Package the verified main release",
 "Retain authoritative main release",
];
const api = endpoint=>JSON.parse(execFileSync("gh",["api",endpoint],{encoding:"utf8",maxBuffer:8*1024*1024}));
const shaFile=async file=>{const digest=createHash("sha256");for await(const block of fs.createReadStream(file))digest.update(block);return digest.digest("hex");};
export function validateProvenance({run,jobs,artifact,main,revision,attempt,commit}) {
 assert.match(revision,/^[a-f0-9]{40}$/);
 assert.equal(run.repository?.id,repositoryId);assert.equal(run.repository?.full_name,repository);
 assert.equal(run.head_repository?.id,repositoryId);assert.equal(run.head_repository?.full_name,repository);
 assert.equal(run.workflow_id,workflowId);assert.equal(run.path,workflowPath);
 assert.equal(run.event,"push");assert.equal(run.head_branch,"main");assert.equal(run.head_sha,revision);
 assert.equal(main.sha,revision,"Main advanced; do not replace a newer release with this attempt");
 assert.equal(commit.sha,revision);assert.match(commit.tree?.sha||"",/^[a-f0-9]{40}$/);
 assert.equal(run.run_attempt,attempt,"Run attempt changed; reselect the authoritative artifact");
 assert.equal(run.status,"completed");assert.equal(run.conclusion,"success");
 assert.ok(jobs.length>0);assert.ok(jobs.every(job=>job.run_id===run.id&&job.head_sha===revision&&job.status==="completed"&&job.conclusion==="success"),"Missing, failed, canceled or skipped required job");
 const verify=jobs.filter(job=>job.name==="verify");assert.equal(verify.length,1,"Expected one verify job");
 for(const name of requiredSteps){const steps=verify[0].steps.filter(step=>step.name===name);assert.equal(steps.length,1,`Missing step: ${name}`);assert.equal(steps[0].status,"completed");assert.equal(steps[0].conclusion,"success",`Required step: ${name}`);}
 assert.equal(artifact.name,`corpus-release-${revision}-attempt-${attempt}`);
 assert.equal(artifact.expired,false,"Artifact expired; rerun the same main revision or verify a newer intended main revision");
 assert.match(artifact.digest||"",/^sha256:[a-f0-9]{64}$/,"No authenticated artifact digest");
 assert.ok(Number.isSafeInteger(artifact.size_in_bytes)&&artifact.size_in_bytes>0&&artifact.size_in_bytes<=2*1024**3);
 assert.equal(artifact.workflow_run?.id,run.id);assert.equal(artifact.workflow_run?.head_sha,revision);
 assert.equal(artifact.workflow_run?.repository_id,repositoryId);assert.equal(artifact.workflow_run?.head_repository_id,repositoryId);
 assert.equal(artifact.workflow_run?.head_branch,"main");
 const created=Date.parse(artifact.created_at),started=Date.parse(run.run_started_at),finished=Date.parse(run.updated_at);
 assert.ok(Number.isFinite(created)&&created>=started&&created<=finished,"Artifact not created within selected attempt");
 return {repository,repository_id:repositoryId,workflow_id:workflowId,workflow_path:workflowPath,revision,source_tree:commit.tree.sha,run_id:run.id,run_attempt:attempt,artifact_id:artifact.id,artifact_digest:artifact.digest,job_ids:jobs.map(j=>j.id)};
}
export function inspectProvenance({runId,revision,attempt}) {
 assert.ok(Number.isSafeInteger(runId)&&runId>0);assert.ok(Number.isSafeInteger(attempt)&&attempt>0);
 const base=`repos/${repository}`;
 const run=api(`${base}/actions/runs/${runId}`);
 const jobPages=JSON.parse(execFileSync("gh",["api","--paginate","--slurp",`${base}/actions/runs/${runId}/attempts/${attempt}/jobs?per_page=100`],{encoding:"utf8",maxBuffer:8*1024*1024}));
 const artifactPages=JSON.parse(execFileSync("gh",["api","--paginate","--slurp",`${base}/actions/runs/${runId}/artifacts?per_page=100`],{encoding:"utf8",maxBuffer:8*1024*1024}));
 const artifacts=artifactPages.flatMap(p=>p.artifacts).filter(a=>a.name===`corpus-release-${revision}-attempt-${attempt}`);
 assert.equal(artifacts.length,1,"Authoritative artifact missing or ambiguous; rerun verified main CI if expired or unavailable");
 const artifact=artifacts[0];const jobs=jobPages.flatMap(p=>p.jobs);
 const main=api(`${base}/commits/main`);const commit=api(`${base}/git/commits/${revision}`);
 const proof=validateProvenance({run,jobs,artifact,main,revision,attempt,commit});
 return {proof,run,jobs,artifact,main,commit};
}
const download = (artifact,file)=>new Promise((resolve,reject)=>{
 const fd=fs.openSync(file,"wx",0o600);
 const child=spawn("gh",["api",`repos/${repository}/actions/artifacts/${artifact.id}/zip`],{stdio:["ignore",fd,"pipe"]});
 let error="";child.stderr.on("data",data=>{error=(error+data).slice(-4000);});
 child.once("error",e=>{fs.closeSync(fd);reject(e);});
 child.once("exit",code=>{fs.closeSync(fd);code===0?resolve():reject(new Error(`Artifact download failed (${code}): ${error}`));});
});
export async function consumeRelease({runId,revision,attempt,destination}) {
 const started=performance.now();assert.ok(destination&&!fs.existsSync(destination),"Use a fresh consumer destination");
 const evidence=inspectProvenance({runId,revision,attempt});
 const parent=path.dirname(path.resolve(destination));fs.mkdirSync(parent,{recursive:true});
 const archive=path.join(parent,`artifact-${evidence.artifact.id}-${Date.now()}.zip`);
 await download(evidence.artifact,archive);
 assert.equal(fs.statSync(archive).size,evidence.artifact.size_in_bytes,"Downloaded ZIP length differs from platform");
 assert.equal(await shaFile(archive),evidence.artifact.digest.slice(7),"Downloaded ZIP digest differs from platform");
 const extractor=fileURLToPath(new URL("./extract-release-artifact.py",import.meta.url));
 // Execute only the reviewed local extractor, never code from the artifact.
 const extraction=JSON.parse(execFileSync("python3",[extractor,archive,destination,"--sha256",evidence.artifact.digest],{encoding:"utf8"}));
 const result=validatePackage(destination);const manifest=result.manifest;
 for(const [key,expected] of Object.entries({repository,workflow_path:workflowPath,event:"push",ref:"refs/heads/main",source_revision:revision,source_tree:evidence.proof.source_tree,run_id:runId,run_attempt:attempt}))assert.equal(manifest[key],expected,`Package provenance mismatch: ${key}`);
 assert.equal(manifest.build_options?.mode,"release");
 // Re-read remote state after the transfer, which can take minutes.
 const fresh=inspectProvenance({runId,revision,attempt});assert.deepEqual(fresh.proof,evidence.proof,"Authoritative state changed during artifact transfer");
 const receipt={schema_version:1,contract:"accounting-agents-authenticated-consumption",...evidence.proof,package_sha256:extraction.package_sha256,input_digest:manifest.input_digest,corpus_version:manifest.corpus_version,archive,directory:path.resolve(destination),storage:result.storage,seconds:(performance.now()-started)/1000,checked_at:new Date().toISOString()};
 // Receipt is outside the package and is evidence, never future authorization.
 fs.writeFileSync(`${destination}.consumption.json`,JSON.stringify(receipt,null,2)+"\n",{flag:"wx",mode:0o600});
 return receipt;
}
if(import.meta.url===pathToFileURL(process.argv[1]||"").href){
 try{
  const [run,attempt,revision,destination,...extra]=process.argv.slice(2);assert.equal(extra.length,0);
  console.log(JSON.stringify(await consumeRelease({runId:Number(run),attempt:Number(attempt),revision,destination}),null,2));
 }catch(error){console.error(`Release consumption refused: ${error.message}`);process.exitCode=1;}
}
