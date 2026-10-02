import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {prepareArealFonts,writeArealFonts,verifyFontBytes,arealFaces} from '../scripts/areal-fonts.mjs';
import {sourceFiles} from '../scripts/source-archive.mjs';
import worker from '../dist/server/index.js';
const sha=b=>createHash('sha256').update(b).digest('hex');

test('unlicensed builds request no fonts and retain readable fallback stacks',()=>{
 assert.equal(prepareArealFonts(),null);
 assert.equal(writeArealFonts(null,'nonexistent-output'),null);
 const css=fs.readFileSync('public/style.css','utf8');
 assert.match(css,/"ABC Areal", -apple-system/);assert.match(css,/"ABC Areal", Georgia/);
 assert.doesNotMatch(css,/@font-face/);
});
test('font validation rejects changed bytes and wrong container independently',()=>{
 const body=Buffer.from('wOF2synthetic-only-test');
 assert.doesNotThrow(()=>verifyFontBytes(body,body.length,sha(body)));
 assert.throws(()=>verifyFontBytes(body,body.length+1,sha(body)),/original WOFF2/);
 assert.throws(()=>verifyFontBytes(body,body.length,'0'.repeat(64)),/original WOFF2/);
 const wrong=Buffer.from('xxxxsynthetic-only-test');assert.throws(()=>verifyFontBytes(wrong,wrong.length,sha(wrong)),/original WOFF2/);
});
test('inputs inside the source checkout and incomplete external downloads fail before writes',t=>{
 assert.throws(()=>prepareArealFonts({directory:process.cwd()}),/outside the checkout/);
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'areal-missing-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 assert.throws(()=>prepareArealFonts({directory:dir}),/ENOENT/);assert.deepEqual(fs.readdirSync(dir),[]);
 fs.writeFileSync(path.join(dir,'ABCAreal-Regular.woff2'),'wOF2not-the-licensed-original');
 assert.throws(()=>prepareArealFonts({directory:dir}),/original WOFF2/);
});
test('font overlay preserves bytes, serves content-addressed URLs and does not expand source membership',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'areal-output-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const before=sourceFiles();fs.writeFileSync(path.join(dir,'style.css'),'body{}');
 const body=Buffer.from('wOF2synthetic-overlay-test'),digest=sha(body),url=`/fonts/areal-regular-${digest.slice(0,12)}.woff2`;
 const manifest=writeArealFonts({faces:[{body,weight:400,style:'normal',bytes:body.length,sha256:digest,url}]},dir);
 assert.deepEqual(fs.readFileSync(path.join(dir,url.slice(1))),body);
 assert.match(fs.readFileSync(path.join(dir,'style.css'),'utf8'),/font-display:swap/);
 assert.equal(manifest.files[0].sha256,digest);assert.ok(!JSON.stringify(manifest).includes(dir));
 assert.deepEqual(sourceFiles(),before);assert.ok(!before.some(file=>/\.(woff2?|ttf|otf)$/.test(file)));
 assert.deepEqual(arealFaces.map(face=>[face[1],face[2]]),[[400,'normal'],[400,'italic'],[500,'normal'],[500,'italic'],[700,'normal'],[700,'italic']]);
});
test('primary build serves only its qualified font URLs and keeps binaries out of downloads',async()=>{
 const meta=JSON.parse(fs.readFileSync('dist/internal/release-meta.json'));
 const html=await (await worker.fetch(new Request('https://example.test/'))).text();
 const css=fs.readFileSync('dist/client/style.css','utf8');
 const downloadManifest=fs.readFileSync('dist/client/downloads/manifest.json','utf8');
 const sourceManifest=fs.readFileSync('dist/client/downloads/accounting-agents-source.manifest.json','utf8');
 let fetches=0;
 const env={ASSETS:{fetch:async()=>{fetches++;return new Response('fixture',{headers:{'Content-Type':'font/woff2'}});}}};
 for(const face of meta.licensed_fonts?.files||[]){
  const body=fs.readFileSync('dist/client'+face.url);assert.equal(body.length,face.bytes);assert.equal(sha(body),face.sha256);
  assert.ok(css.includes(face.url));assert.ok(!downloadManifest.includes(face.url));assert.ok(!sourceManifest.includes(face.url));
  const res=await worker.fetch(new Request('https://example.test'+face.url),env);assert.equal(res.status,200);assert.equal(res.headers.get('content-type'),'font/woff2');
 }
 assert.equal(fetches,meta.licensed_fonts?.files.length||0);
 const rejected=await worker.fetch(new Request('https://example.test/fonts/arbitrary.woff2'),env);assert.equal(rejected.status,404);
 if(meta.licensed_fonts){assert.match(html,/ABC Areal by Dinamo/);assert.match((await worker.fetch(new Request('https://example.test/'))).headers.get('Content-Security-Policy'),/font-src 'self'/);}
 else{assert.doesNotMatch(css,/@font-face/);assert.doesNotMatch(html,/ABC Areal by Dinamo/);}
});
