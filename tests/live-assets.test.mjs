import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {observeAssetResponse,readPublicAssets} from '../scripts/live-assets.mjs';
test('asset observation never reads a navigation-invalidated browser body and deduplicates URLs',async()=>{
 const origin='https://corpus.example',urls=new Set(),response={url:()=>origin+'/assets/a.js',body(){throw new Error('No resource with given identifier');}};
 observeAssetResponse(response,origin,urls);observeAssetResponse(response,origin,urls);
 observeAssetResponse({url:()=>origin+'/api/v1/meta'},origin,urls);observeAssetResponse({url:()=> 'https://external.example/a.js'},origin,urls);
 assert.equal(urls.size,1);let calls=0;
 const result=await readPublicAssets(urls,origin,async(url,options)=>{calls++;assert.equal(options.redirect,'error');return new Response('verified bytes');});
 assert.equal(calls,1);assert.equal(result[0].sha256,createHash('sha256').update('verified bytes').digest('hex'));assert.equal(result[0].bytes,14);
});
test('asset readback fails closed on off-origin URLs, missing assets and oversized content',async()=>{
 const origin='https://corpus.example';
 await assert.rejects(readPublicAssets(new Set(['https://external.example/a.js']),origin,()=>{throw new Error('must not fetch');}));
 await assert.rejects(readPublicAssets(new Set([origin+'/a.js']),origin,async()=>new Response(null,{status:404})));
 await assert.rejects(readPublicAssets(new Set([origin+'/a.js']),origin,async()=>new Response(new Uint8Array(4*1024*1024+1))));
});
