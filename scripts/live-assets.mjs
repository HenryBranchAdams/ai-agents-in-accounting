import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

// Response bodies may disappear when Chromium navigates. Record the observed
// immutable URLs synchronously, then hash explicit public readbacks. Never leave
// rejected response.body promises detached from the verifier's receipt handler.
export function observeAssetResponse(response,origin,urls) {
  const url=new URL(response.url());
  if(url.origin===origin&&url.pathname.endsWith('.js'))urls.add(url.href);
}
export async function readPublicAssets(urls,origin,fetchImpl=fetch) {
  const assets=[];
  for(const value of urls){
    const url=new URL(value);assert.equal(url.origin,origin);assert.ok(url.pathname.endsWith('.js'));
    const response=await fetchImpl(value,{redirect:'error',signal:AbortSignal.timeout(60000)});assert.equal(response.status,200,value);
    const chunks=[];let bytes=0;
    for await(const chunk of response.body){bytes+=chunk.length;assert.ok(bytes<=4*1024*1024,'JavaScript asset exceeds readback limit');chunks.push(chunk);}
    assets.push({url:value,sha256:createHash('sha256').update(Buffer.concat(chunks)).digest('hex'),bytes,evidence:'Browser-observed URL, separately hashed public response'});
  }
  return assets;
}
