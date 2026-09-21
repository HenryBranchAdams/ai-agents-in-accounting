import path from "node:path";
import { pathToFileURL } from "node:url";
import fs from 'node:fs';
import { createHash } from 'node:crypto';
const root = path.resolve(process.argv[2] || '.');
const started = performance.now();
const {default:worker}=await import(pathToFileURL(path.join(root,'dist/server/index.js')).href);
const entry={stage:'entry',ms:performance.now()-started,...process.memoryUsage()};
const env={ASSETS:{fetch:async request=>{try{return new Response(fs.readFileSync(root+'/dist/client'+new URL(request.url).pathname));}catch{return new Response(null,{status:404});}}}};
const results=[entry];
for(const path of ['/', '/api/v1/records?q=family%20office', '/coverage', '/api/v1/coverage/history', '/api/v1/agent/search?q=family%20office']) {
  const start=performance.now();const response=await worker.fetch(new Request('https://local'+path),env);
  const headersMs=performance.now()-start;let bytes=0;const hash=createHash('sha256');
  for await(const part of response.body){bytes+=part.length;hash.update(part);}
  results.push({path,status:response.status,bytes,sha256:hash.digest('hex'),headers_ms:headersMs,total_ms:performance.now()-start,...process.memoryUsage()});
}
console.log(JSON.stringify({runtime:process.version,results},null,2));
