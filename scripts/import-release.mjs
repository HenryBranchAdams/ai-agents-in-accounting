import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {validateStorage} from './release-package.mjs';
import {sha256} from './release-inputs.mjs';

export function importOrigin(value) {
  const url=new URL(value);
  assert.equal(url.protocol,'https:','Imports require HTTPS');
  assert.ok(!url.username&&!url.password&&!url.search&&!url.hash&&url.pathname==='/','Supply only the HTTPS origin');
  return url.origin;
}

// The default fetch implementation reuses connections. Credentials remain in
// memory: no subprocess arguments, credential files or response-body logging.
export async function importStorage({origin,directory,token,fetchImpl=fetch,delay=ms=>new Promise(resolve=>setTimeout(resolve,ms)),concurrency=4}={}) {
  origin=importOrigin(origin);
  assert.ok(typeof token==='string'&&token.length>=24&&token.length<=4096&&!/[\r\n]/.test(token),'A nonempty import credential is required');
  assert.ok(Number.isInteger(concurrency)&&concurrency>=1&&concurrency<=4,'Import concurrency must be between one and four');
  const started=performance.now();
  // Validate the complete manifest, every compressed object and every logical
  // file before the first remote request. A local receipt is never authority.
  const verified=validateStorage(directory);
  const manifestBody=fs.readFileSync(path.join(directory,'manifest.json'));
  assert.equal(sha256(manifestBody),verified.manifest,'Manifest changed after validation');
  const manifest=JSON.parse(manifestBody);
  const stats={requests:0,retries:0,objects_reused:0,objects_uploaded:0,uploaded_bytes:0,request_body_bytes:0};
  const retryable=status=>[408,429,500,502,503,504].includes(status);
  async function request(kind,key,method,body) {
    stats.requests++;stats.request_body_bytes+=body?.byteLength||0;
    let response;
    try {
      response=await fetchImpl(`${origin}/_release/${kind}/${key}`,{method,headers:{Authorization:`Bearer ${token}`},body,redirect:'manual',signal:AbortSignal.timeout(120000)});
    } catch {
      throw Object.assign(new Error('Import transport failed or timed out; remote outcome is uncertain'),{transient:true});
    }
    const status=response.status;
    // Never log a remote body, which could reflect credentials. Drain/cancel it
    // so the transport does not retain an unbounded error response.
    await response.body?.cancel();
    return {status,ok:status>=200&&status<300};
  }
  async function uploadObject(key,size) {
    for(let attempt=0;attempt<3;attempt++) {
      try {
        // Reconcile first, including after a lost PUT response or resumed run.
        const head=await request('objects',key,'HEAD');
        if(head.ok){stats.objects_reused++;return;}
        if(head.status!==404)throw Object.assign(new Error(`Object preflight returned HTTP ${head.status}`),{transient:retryable(head.status)});
        const bytes=fs.readFileSync(path.join(directory,'objects',key));
        assert.equal(bytes.length,size);assert.equal(sha256(bytes),key,'Object changed before upload');
        const put=await request('objects',key,'PUT',bytes);
        if(!put.ok)throw Object.assign(new Error(`Object import returned HTTP ${put.status}`),{transient:retryable(put.status)});
        stats.objects_uploaded++;stats.uploaded_bytes+=bytes.length;
        const confirmed=await request('objects',key,'HEAD');
        if(!confirmed.ok)throw Object.assign(new Error(`Object confirmation returned HTTP ${confirmed.status}`),{transient:retryable(confirmed.status)||confirmed.status===404});
        return;
      }catch(error){
        if(!error.transient||attempt===2)throw error;
        stats.retries++;await delay(1000*2**attempt);
      }
    }
  }
  const entries=Object.entries(manifest.objects);let cursor=0,failed;
  // On a worker failure, stop assigning objects and wait for in-flight work to
  // settle before reporting. Another invocation safely reconciles those writes.
  await Promise.all(Array.from({length:concurrency},async()=>{
    while(!failed&&cursor<entries.length) {
      const [key,size]=entries[cursor++];
      try{await uploadObject(key,size);}catch(error){failed ||= error;}
    }
  }));
  if(failed)throw failed;
  // Always re-PUT the identical manifest. The supported existing server checks
  // every required object's existence and size before accepting this seal.
  // A historical seal's HEAD alone does not establish current completeness.
  for(let attempt=0;attempt<3;attempt++) {
    try {
      if(sha256(fs.readFileSync(path.join(directory,'manifest.json')))!==verified.manifest)throw new Error('Manifest changed during import');
      const seal=await request('manifests',verified.manifest,'PUT',manifestBody);
      if(!seal.ok)throw Object.assign(new Error(`Manifest seal returned HTTP ${seal.status}`),{transient:retryable(seal.status)});
      const confirmed=await request('manifests',verified.manifest,'HEAD');
      if(!confirmed.ok)throw Object.assign(new Error(`Manifest confirmation returned HTTP ${confirmed.status}`),{transient:retryable(confirmed.status)||confirmed.status===404});
      return {schema_version:1,origin,...verified,...stats,seconds:(performance.now()-started)/1000,sealed:true,activation_authority:false};
    } catch(error) {
      if(!error.transient||attempt===2)throw error;
      // Read back an uncertain seal before retrying the idempotent validation.
      await request('manifests',verified.manifest,'HEAD');
      stats.retries++;await delay(1000*2**attempt);
    }
  }
}

if(import.meta.url===pathToFileURL(process.argv[1]||'').href) {
  try {
    const [origin,directory,...extra]=process.argv.slice(2);
    assert.ok(origin&&directory&&!extra.length,'Usage: import-release.mjs HTTPS_ORIGIN VALIDATED_STORAGE_DIRECTORY; provide the credential on stdin');
    let token='';for await(const chunk of process.stdin){token+=chunk;if(token.length>4097)throw new Error('Import credential too long');}
    const result=await importStorage({origin,directory,token:token.trim()});
    console.log(JSON.stringify(result,null,2));
  }catch(error){console.error(error.message);process.exitCode=1;}
}
