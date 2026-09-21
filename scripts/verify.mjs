import fs from "node:fs";
import path from "node:path";
import { execFileSync, spawn } from "node:child_process";
import { pathToFileURL } from "node:url";
import { preflight, inputInventory, sha256, captureCandidate, buildInventory } from "./release-inputs.mjs";

export const requiredPhases = Object.freeze([
  { name: "lint", command: ["npm", "run", "lint"] },
  { name: "build", command: ["npm", "run", "build"] },
  { name: "tests", command: ["npm", "run", "test:only"] },
  { name: "qualification", command: ["npm", "run", "qualify"] },
]);
const atomicJson = (file, value) => {
  const temporary = `${file}.tmp-${process.pid}`;
  fs.writeFileSync(temporary, JSON.stringify(value, null, 2) + "\n");
  fs.renameSync(temporary, file);
};
const execute = (command, root, log) => new Promise((resolve, reject) => {
  const output = fs.openSync(log,"wx");
  const child = spawn(command[0],command.slice(1),{cwd:root,stdio:["ignore","pipe","pipe"]});
  for (const [stream, destination] of [[child.stdout,process.stdout],[child.stderr,process.stderr]])
    stream.on("data", bytes=>{fs.writeSync(output,bytes);destination.write(bytes);});
  child.once("error", error=>{fs.closeSync(output);reject(error);});
  child.once("exit", (status,signal)=>{fs.closeSync(output);resolve({status,signal});});
});

// Separate CI phases and the complete local command use the same state machine.
// A receipt supports local review only. Publication authenticates GitHub again.
export async function runVerification({root=process.cwd(),revision,mode="release",phase,run=execute,check=preflight}={}) {
  const intended=revision || execFileSync("git",["-C",root,"rev-parse","HEAD"],{encoding:"utf8"}).trim();
  const checked=await check({root,revision:intended,mode});
  if(!checked.ok)throw new Error(`Preflight refused before build/tests:\n${checked.problems.join("\n")}`);
  if(mode==="working-copy") {
    const candidate=JSON.parse(fs.readFileSync(path.join(root,"outputs/candidate.json")));
    if(candidate.input_digest!==checked.input_digest || candidate.source_revision!==intended || candidate.publishable!==false)
      throw new Error("Working-copy verification requires an unchanged captured candidate");
  }
  const phases=mode==="working-copy"?requiredPhases.filter(p=>p.name!=="qualification"):requiredPhases;
  if(phase&&!phases.some(p=>p.name===phase))throw new Error("Unknown verification phase");
  const directory=path.join(root,"outputs/verification");fs.mkdirSync(directory,{recursive:true});
  const lock=path.join(directory,"active.lock");
  const fd=fs.openSync(lock,"wx",0o600);fs.writeFileSync(fd,JSON.stringify({pid:process.pid,source_revision:intended,input_digest:checked.input_digest}));fs.closeSync(fd);
  const receipt=path.join(directory,"current.json");let state;
  try {
    if(phase&&phase!==phases[0].name){
      state=JSON.parse(fs.readFileSync(receipt));
      if(state.status!=="running" || state.input_digest!==checked.input_digest || state.source_revision!==intended || state.mode!==mode || state.node!==process.version)
        throw new Error("Previous verification phase is missing, failed or stale");
      const expected=phases.slice(0,phases.findIndex(p=>p.name===phase)).map(p=>p.name);
      if(JSON.stringify(state.phases.map(p=>p.name))!==JSON.stringify(expected)||state.phases.some(p=>p.exit_code!==0))
        throw new Error("Required predecessor phases did not pass");
    }else{
      if(fs.existsSync(receipt))fs.renameSync(receipt,path.join(directory,`previous-${Date.now()}-${process.pid}.json`));
      state={schema_version:1,contract:"accounting-agents-local-verification",mode,publishable:false,source_revision:intended,input_digest:checked.input_digest,lockfile_sha256:checked.lockfile_sha256,node:process.version,toolchain:process.versions,build_options:{mode:"release"},status:"running",attempt:`${Date.now()}-${process.pid}`,phases:[]};
    }
    atomicJson(receipt,state);
    for(const next of phase?phases.filter(p=>p.name===phase):phases){
      const log=path.join(directory,`${state.attempt}-${next.name}.log`);const started=performance.now();
      if(next.name==="tests"||next.name==="qualification") {
        if(!state.build_digest||buildInventory(root).digest!==state.build_digest)throw new Error("Tested build changed or is absent");
      }
      const result=await run(next.command,root,log);
      state.phases.push({name:next.name,seconds:(performance.now()-started)/1000,exit_code:result.status,signal:result.signal,log:path.basename(log)});
      atomicJson(receipt,state);
      if(result.status!==0)throw new Error(`${next.name} failed; see ${log}`);
      if(inputInventory(root).digest!==checked.input_digest)throw new Error(`Source changed during ${next.name}; result is not reusable`);
      if(next.name==="build")state.build_digest=buildInventory(root).digest;
      else if(state.build_digest&&buildInventory(root).digest!==state.build_digest)throw new Error(`Build changed during ${next.name}; verification is invalid`);
    }
    if(state.phases.length===phases.length){
      state.test_inventory=fs.readdirSync(path.join(root,"tests")).filter(file=>file.endsWith(".test.mjs")).sort();
      state.release_meta=JSON.parse(fs.readFileSync(path.join(root,"dist/internal/release-meta.json")));
      if(state.release_meta.source_revision!==intended||state.release_meta.build_mode!=="release")throw new Error("Build identity differs from pinned verification inputs");
      state.qualification_sha256=mode==="release"?sha256(fs.readFileSync(path.join(root,"dist/storage/qualification.json"))):null;
      state.status="passed";
    }
    atomicJson(receipt,state);return {receipt,...state};
  }catch(error){
    if(state){state.status="failed";state.error=error.message;atomicJson(receipt,state);}throw error;
  }finally{fs.unlinkSync(lock);}
}

export async function checkWorkingCopy({root=process.cwd(),destination,candidate}={}) {
  if(candidate) {
    const capturedRoot=path.resolve(root,candidate);
    const captured=JSON.parse(fs.readFileSync(path.join(capturedRoot,"outputs/candidate.json")));
    return runVerification({root:capturedRoot,revision:captured.source_revision,mode:"working-copy"});
  }
  const checked=await preflight({root,mode:"working-copy"});
  if(!checked.ok)throw new Error(`Working-copy preflight refused: ${checked.problems.join("; ")}`);
  const snapshot=captureCandidate({root,destination:destination||path.join(root,"outputs/candidates",`${checked.input_digest.slice(0,16)}-${Date.now()}`)});
  // npm ci is performed inside the independent capture; no mutable shared modules.
  const log=path.join(snapshot.destination,"outputs/install.log");
  const installed=await execute(["npm","ci","--offline"],snapshot.destination,log);
  if(installed.status!==0)throw new Error(`Candidate install failed; retain ${log}. Populate the npm cache with npm ci in the source checkout and retry a fresh candidate.`);
  return runVerification({root:snapshot.destination,revision:snapshot.source_revision,mode:"working-copy"});
}

if(import.meta.url===pathToFileURL(process.argv[1]||"").href){
  try{
    const args=process.argv.slice(2);const options={};let preflightOnly=false,working=false;
    for(let i=0;i<args.length;i++){
      if(args[i]==="--revision"||args[i]==="--phase"||args[i]==="--candidate"){const key=args[i].slice(2);if(!args[i+1]||args[i+1].startsWith("--"))throw new Error(`Missing ${key}`);options[key]=args[++i];}
      else if(args[i]==="--preflight")preflightOnly=true;
      else if(args[i]==="--working-copy")working=true;
      else throw new Error(`Unknown verification argument: ${args[i]}`);
    }
    if(options.candidate && (!working || preflightOnly))throw new Error("--candidate requires --working-copy verification");
    if(preflightOnly){
      const revision=options.revision||execFileSync("git",["rev-parse","HEAD"],{encoding:"utf8"}).trim();
      const result=await preflight({revision});console.log(JSON.stringify(result,null,2));process.exitCode=result.ok?0:1;
    }else console.log(JSON.stringify(working?await checkWorkingCopy(options):await runVerification(options),null,2));
  }catch(error){console.error(error.message);process.exitCode=1;}
}
