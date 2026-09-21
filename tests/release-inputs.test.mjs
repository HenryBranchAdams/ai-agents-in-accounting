import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { inputInventory, editionProblems, captureCandidate, preflight } from "../scripts/release-inputs.mjs";

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(),"aa-inputs-"));
  const version = "2099-01-01.2";
  const files = {
    "package.json": {dependencies:{},devDependencies:{}},
    "package-lock.json": {packages:{"":{dependencies:{},devDependencies:{}}}},
    "tsconfig.json":{}, "eslint.config.mjs":"export default []", "components.json":{},
    ".gitignore":"outputs/\nnode_modules/\n", "LICENSE":"original fixture",
    "data/catalog.json": {corpus_version:version},
    "data/coverage/record-mappings.json":{corpus_version:version,mapping_version:version},
    "data/coverage/mapping-overrides.json":{mapping_version:version},
    "data/coverage/assessments.json":{assessment_version:version},
    "data/coverage/research-questions.json":{corpus_version:version,question_set_version:version},
    "data/coverage/subsector-profiles.json":{corpus_version:version},
    "data/coverage/subsector-screening.json":{corpus_version:version},
    "data/releases/index.json":{current_version:version,versions:["2099-01-01.1",version]},
    "src/entry.ts":"export const greeting='first'",
  };
  for (const [file,body] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root,file)),{recursive:true});
    fs.writeFileSync(path.join(root,file),typeof body === "string" ? body : JSON.stringify(body));
  }
  const git = args => execFileSync("git",["-C",root,...args],{encoding:"utf8",stdio:["ignore","pipe","pipe"]}).trim();
  git(["init"]);git(["add","."]);git(["-c","user.name=Fixture","-c","user.email=fixture@example.invalid","commit","-m","fixture"]);
  return {root,git};
}

test("release preflight rejects changed and new source before expensive gates; evidence is excluded", async () => {
  const {root,git}=fixture();
  try {
    const revision=git(["rev-parse","HEAD"]);
    assert.equal((await preflight({root,revision,requireLoopback:false})).ok,true);
    const before=inputInventory(root).digest;
    fs.mkdirSync(path.join(root,"outputs"),{recursive:true});
    fs.writeFileSync(path.join(root,"outputs/receipt.json"),'{"passed":true}');
    assert.equal(inputInventory(root).digest,before);
    fs.writeFileSync(path.join(root,"src/entry.ts"),"changed");
    fs.writeFileSync(path.join(root,"src/new.ts"),"new input");
    const failed=await preflight({root,revision,requireLoopback:false});
    assert.equal(failed.ok,false);
    assert.ok(failed.problems.some(p=>p.includes("src/entry.ts: differs")));
    assert.ok(failed.problems.some(p=>p.includes("src/new.ts: untracked")));
    assert.equal(fs.existsSync(path.join(root,"dist")),false);
    assert.equal((await preflight({root,mode:"working-copy",requireLoopback:false})).ok,true);
    assert.notEqual(inputInventory(root).digest,before);
  } finally {fs.rmSync(root,{recursive:true,force:true});}
});

test("preflight collects stale current metadata while leaving historical review editions alone",()=>{
  const {root}=fixture();
  try {
    assert.deepEqual(editionProblems(root),[]);
    for(const file of ["assessments","record-mappings"])
      fs.writeFileSync(path.join(root,`data/coverage/${file}.json`),"{}");
    const problems=editionProblems(root);
    assert.ok(problems.some(p=>p.includes("assessments.json")));
    assert.ok(problems.some(p=>p.includes("record-mappings.json")));
    fs.writeFileSync(path.join(root,"data/coverage/industry-exception-reviews.json"),'{"corpus_version":"2000-01-01.1"}');
    assert.deepEqual(editionProblems(root),problems);
  }finally{fs.rmSync(root,{recursive:true,force:true});}
});

test("captured working-copy candidate includes new files and remains stable after edits",()=>{
  const {root}=fixture();const container=fs.mkdtempSync(path.join(os.tmpdir(),"aa-candidates-"));
  try{
    fs.writeFileSync(path.join(root,"src/new.ts"),"new source");
    const before=inputInventory(root).digest;
    const first=captureCandidate({root,destination:path.join(container,"first")});
    const second=captureCandidate({root,destination:path.join(container,"second")});
    assert.equal(first.input_digest,second.input_digest);assert.equal(first.input_digest,before);
    assert.equal(first.publishable,false);
    fs.writeFileSync(path.join(root,"src/new.ts"),"later edit");
    assert.equal(inputInventory(first.destination).digest,before);
    assert.equal(fs.readFileSync(path.join(first.destination,"src/new.ts"),"utf8"),"new source");
    assert.throws(()=>captureCandidate({root,destination:first.destination}),/fresh/);
    assert.throws(()=>captureCandidate({root,destination:path.join(container,"release"),mode:"release"}),/working-copy only/);
  }finally{fs.rmSync(root,{recursive:true,force:true});fs.rmSync(container,{recursive:true,force:true});}
});

test("a capture race is detected before candidate promotion",()=>{
  const {root}=fixture();const container=fs.mkdtempSync(path.join(os.tmpdir(),"aa-race-"));
  const original=fs.copyFileSync;let changed=false;
  try{
    fs.copyFileSync=(source,target,...args)=>{
      original(source,target,...args);
      if(!changed && source===path.join(root,"src/entry.ts")){changed=true;fs.writeFileSync(source,"changed during copy");}
    };
    const destination=path.join(container,"candidate");
    assert.throws(()=>captureCandidate({root,destination}),/changed during candidate capture/);
    assert.equal(fs.existsSync(destination),false);
    assert.deepEqual(fs.readdirSync(container),[]);
  }finally{fs.copyFileSync=original;fs.rmSync(root,{recursive:true,force:true});fs.rmSync(container,{recursive:true,force:true});}
});
