import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
test('live verification rejects missing release identity before browser or network work',()=>{
 const cwd=fs.mkdtempSync(path.join(os.tmpdir(),'aa-live-verifier-'));
 try{
  fs.copyFileSync('package-lock.json',path.join(cwd,'package-lock.json'));
  const result=spawnSync(process.execPath,[path.resolve('scripts/verify-live.mjs')],{cwd,encoding:'utf8',env:{...process.env,EXPECTED_SOURCE_REVISION:'not-a-revision'}});
  assert.equal(result.status,1);const receipt=JSON.parse(fs.readFileSync(path.join(cwd,'outputs/live-verification/receipt.json')));
  assert.equal(receipt.status,'failed');assert.equal(receipt.release_before,undefined);assert.equal(receipt.browser,undefined);assert.deepEqual(receipt.downloads,[]);
 }finally{fs.rmSync(cwd,{recursive:true,force:true});}
});
