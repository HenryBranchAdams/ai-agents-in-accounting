import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { spawn, fork, execFileSync } from "node:child_process";
import { once } from "node:events";
import { pathToFileURL } from "node:url";
import { previewInventory, loopbackCapability, sha256 } from "./release-inputs.mjs";

const fileEntries = root => fs.readdirSync(root,{recursive:true}).sort().flatMap(name=>{
 const file=path.join(root,name),stat=fs.lstatSync(file);
 if(stat.isSymbolicLink()||(!stat.isFile()&&!stat.isDirectory()))throw new Error(`Nonregular preview output: ${name}`);
 return stat.isFile()?[{path:name,sha256:sha256(fs.readFileSync(file))}]:[];
});
const sameFiles = (root,files) => JSON.stringify(fileEntries(root))===JSON.stringify(files);
const sourcePath = file => /^(src|data|public|schemas|scripts|tests|docs|LICENSES|\.github|\.openai)\//.test(file) || /^(package(?:-lock)?\.json|tsconfig\.json|eslint\.config\.mjs|components\.json|\.gitignore|LICENSE|[^/]+\.(md|cff))$/.test(file);

export async function buildPreview({root=process.cwd(),directory=path.join(root,"outputs/previews"),signal}={}){
 const started=performance.now();
 const before=previewInventory(root);
 const revision=execFileSync("git",["-C",root,"rev-parse","HEAD"],{encoding:"utf8"}).trim();
 const identity=sha256(JSON.stringify({input:before.digest,revision,toolchain:process.versions,mode:"preview"}));
 const destination=path.join(directory,identity);
 fs.mkdirSync(directory,{recursive:true});
 const lock=path.join(directory,`${identity}.lock`);
 const lockFd=fs.openSync(lock,"wx",0o600);fs.writeFileSync(lockFd,String(process.pid));fs.closeSync(lockFd);
 try {
 const receiptPath=path.join(destination,"preview-build.json");
 if(fs.existsSync(destination)){
  try {
   const cached=JSON.parse(fs.readFileSync(receiptPath));
   if(cached.identity===identity && cached.input_digest===before.digest && sameFiles(path.join(destination,"dist"),cached.files))
    return {...cached,directory:destination,reused:true,seconds:(performance.now()-started)/1000};
  } catch { /* Missing/corrupt cache is evidence to preserve and rebuild. */ }
  // Preserve corrupted evidence; a fresh attempt replaces only the cache name.
  fs.renameSync(destination,`${destination}.invalid-${Date.now()}`);
 }
 const temporary=fs.mkdtempSync(path.join(directory,".building-"));
 const log=path.join(directory,`build-${identity}-${Date.now()}.log`);
 let promoted=false;
 try{
  for(const file of before.files){
   const target=path.join(temporary,file.path);fs.mkdirSync(path.dirname(target),{recursive:true});
   fs.copyFileSync(path.join(root,file.path),target,fs.constants.COPYFILE_FICLONE);
  }
  if(previewInventory(temporary).digest!==before.digest || previewInventory(root).digest!==before.digest)
   throw new Error("Source changed during preview capture; previous preview remains available");
  fs.symlinkSync(path.resolve(root,"node_modules"),path.join(temporary,"node_modules"),"dir");
  const fd=fs.openSync(log,"wx");
  const env={...process.env,PREVIEW_INPUT_DIGEST:before.digest,PREVIEW_SOURCE_REVISION:revision};
  delete env.RELEASE_IMPORT_TOKEN;
  const child=spawn(process.execPath,["scripts/build.mjs","--preview"],{cwd:temporary,env,stdio:["ignore",fd,fd],signal});
  let code;
  try{[code]=await once(child,"exit");}finally{fs.closeSync(fd);}
  if(code!==0)throw new Error(`Preview build failed (${code}); see ${log}`);
  if(previewInventory(temporary).digest!==before.digest)throw new Error("Preview build mutated captured source");
  const meta=JSON.parse(fs.readFileSync(path.join(temporary,"dist/internal/release-meta.json")));
  if(meta.build_mode!=="preview" || meta.input_digest!==before.digest)throw new Error("Preview build identity mismatch");
  const receipt={schema_version:1,identity,input_digest:before.digest,source_revision:revision,build_mode:"preview",publishable:false,source_exports:0,files:fileEntries(path.join(temporary,"dist")),seconds:(performance.now()-started)/1000};
  fs.writeFileSync(path.join(temporary,"preview-build.json"),JSON.stringify(receipt,null,2)+"\n");
  fs.renameSync(temporary,destination);promoted=true;
  return {...receipt,directory:destination,reused:false};
 }finally{
  if(!promoted && fs.existsSync(temporary))fs.renameSync(temporary,`${temporary}.failed`);
 }
 } finally {fs.unlinkSync(lock);}
}

export async function startBuiltPreview(build,{signal}={}){
 const env={...process.env,PORT:"0",HOST:"127.0.0.1"};delete env.RELEASE_IMPORT_TOKEN;
 const child=fork(path.join(build.directory,"scripts/serve.mjs"),[],{cwd:build.directory,env,stdio:["ignore","pipe","pipe","ipc"],signal});
 let stderr="";child.stderr.on("data",data=>{stderr=(stderr+data).slice(-4000);});child.stdout.resume();
 try{
  const ready=await new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>reject(new Error("Preview readiness timed out")),30000);
   child.once("error",error=>{clearTimeout(timer);reject(error);});
   child.once("exit",code=>{clearTimeout(timer);reject(new Error(`Preview server exited (${code}): ${stderr}`));});
   child.once("message",message=>{clearTimeout(timer);resolve(message);});
  });
  const url=new URL(ready.origin);
  if(ready.type!=="ready" || url.protocol!=="http:" || url.hostname!=="127.0.0.1")throw new Error("Invalid owned preview readiness message");
  const response=await fetch(new URL("/api/v1/release",url),{signal:AbortSignal.timeout(10000)});
  const meta=await response.json();
  if(!response.ok || meta.build_mode!=="preview" || meta.input_digest!==build.input_digest)throw new Error("Ready server has stale preview identity");
  return {child,origin:url.origin,build,stop:()=>child.kill("SIGTERM")};
 }catch(error){child.kill("SIGTERM");throw error;}
}

export async function startPreview({root=process.cwd(),port=0,watch=true}={}){
 if(!Number.isInteger(port)||port<0||port>65535)throw new Error("Invalid preview port");
 const capability=await loopbackCapability();
 if(!capability.available)throw new Error(`Preview cannot bind loopback (${capability.code}); no build started`);
 const controller=new AbortController();let current,building=false,pending=false,closed=false,watcher,timer;
 const owned=new Set(), rebuilding=new Set();
 const server=http.createServer((req,res)=>{
  if(req.url==="/__preview"){
   res.writeHead(current?200:503,{"Content-Type":"application/json","Cache-Control":"no-store"});
   res.end(JSON.stringify({build:current?.build.identity,input_digest:current?.build.input_digest,building,publishable:false}));return;
  }
  if(!current){res.writeHead(503,{"Retry-After":"1"});res.end("Preview is building.\n");return;}
  if(!req.url?.startsWith("/")){res.writeHead(400);res.end("Invalid preview path");return;}
  const selected=current;
  selected.requests=(selected.requests||0)+1;
  const request=http.request({hostname:"127.0.0.1",port:new URL(selected.origin).port,path:req.url,method:req.method,headers:req.headers},response=>{
   res.writeHead(response.statusCode,{...response.headers,"cache-control":"no-store","x-preview-build":selected.build.identity});response.pipe(res);
  });
  const finish=()=>{selected.requests--;if(selected.retired && !selected.requests)selected.stop();};
  res.once("close",finish);request.on("error",()=>{if(!res.headersSent)res.writeHead(502);res.end("Preview request failed\n");});req.pipe(request);
 });
 // Bind before any expensive build, so an occupied explicit port fails early.
 server.listen(port,"127.0.0.1");await once(server,"listening");
 const origin=`http://127.0.0.1:${server.address().port}`;
 const rebuild=async()=>{
  if(closed)return;if(building){pending=true;return;}building=true;
  try{
   const build=await buildPreview({root,signal:controller.signal});
   if(current?.build.identity!==build.identity){
    const next=await startBuiltPreview(build,{signal:controller.signal});owned.add(next);
    next.child.once("exit",()=>owned.delete(next));
    const previous=current;current=next;
    if(previous){previous.retired=true;if(!previous.requests)previous.stop();}
   }
   console.log(JSON.stringify({preview:origin,input_digest:build.input_digest,reused:build.reused,seconds:build.seconds}));
  }catch(error){if(!closed)console.error(error.message);if(!current)throw error;}
  finally{building=false;if(pending&&!closed){pending=false;void scheduleRebuild().catch(error=>console.error(error.message));}}
 };
 const scheduleRebuild=()=>{const task=rebuild();rebuilding.add(task);void task.finally(()=>rebuilding.delete(task)).catch(()=>{});return task;};
 const close=async()=>{closed=true;clearTimeout(timer);watcher?.close();controller.abort();for(const child of owned)child.stop();await Promise.allSettled([...rebuilding]);server.closeAllConnections();await new Promise(resolve=>server.close(resolve));};
 try{
  if(watch)watcher=fs.watch(root,{recursive:true},(_,name)=>{
   if(name&&sourcePath(String(name))){clearTimeout(timer);timer=setTimeout(()=>void scheduleRebuild().catch(error=>console.error(error.message)),180);}
  });
  await scheduleRebuild();
  return {origin,close,rebuild:scheduleRebuild,get identity(){return current?.build.identity;}};
 }catch(error){await close();throw error;}
}

if(import.meta.url===pathToFileURL(process.argv[1]||"").href){
 try{
  const preview=await startPreview({port:Number(process.env.PORT||0),watch:!process.argv.includes("--once")});
  console.log(`Preview ready: ${preview.origin}`);
  for(const signal of ["SIGINT","SIGTERM"])process.once(signal,()=>void preview.close().then(()=>process.exit(0)));
 }catch(error){console.error(error.message);process.exitCode=1;}
}
