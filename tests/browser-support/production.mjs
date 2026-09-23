import {fork,execFileSync} from 'node:child_process';
import {once} from 'node:events';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';

// Production output only; no browser-specific build or mocked application.
export async function productionBrowser(t,name){
 const directory=path.resolve('outputs/browser',name);fs.mkdirSync(directory,{recursive:true});
 const child=fork('scripts/serve.mjs',[],{env:{...process.env,PORT:'0',HOST:'127.0.0.1'},stdio:['ignore','pipe','pipe','ipc']});
 let log='';for(const stream of [child.stdout,child.stderr])stream.on('data',b=>{log=(log+b).slice(-32000);});
 t.after(async()=>{
  fs.writeFileSync(path.join(directory,'server.log'),log);
  if(child.exitCode===null&&child.signalCode===null){
   const stopped=once(child,'exit');child.kill('SIGTERM');
   const timer=setTimeout(()=>child.kill('SIGKILL'),5000);timer.unref();
   try{await stopped;}finally{clearTimeout(timer);}
  }
 });
 const origin=await new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>finish(new Error('Production server readiness timed out')),20000);
  const message=value=>{if(value?.type==='ready')finish(null,value.origin);};
  const exited=(code,signal)=>finish(new Error(`Production server exited before readiness (${code}/${signal}): ${log}`));
  const error=e=>finish(e);
  function finish(error,value){clearTimeout(timer);child.off('message',message);child.off('exit',exited);child.off('error',errorHandler);error?reject(error):resolve(value);}
  const errorHandler=error;child.on('message',message);child.once('exit',exited);child.once('error',errorHandler);
 });
 const browser=await chromium.launch();t.after(()=>browser.close());
 const hash=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
 const receipt={status:'running',source_revision:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),lockfile_sha256:hash('package-lock.json'),server_sha256:hash('dist/server/index.js'),corpus_version:JSON.parse(fs.readFileSync('data/catalog.json')).corpus_version,node:process.version,browser:browser.version(),origin,tool:'Playwright Chromium',fallback:'Browser plugin not available; authorized Playwright Chromium fallback on the recorded local or hosted runner',journeys:[]};
 t.after(()=>fs.writeFileSync(path.join(directory,'receipt.json'),JSON.stringify(receipt,null,2)+'\n'));
 return {browser,origin,directory,receipt};
}
