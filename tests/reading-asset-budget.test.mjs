import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
test('combined production reading assets report shared costs and stay within loading budgets',()=>{
 const report=JSON.parse(execFileSync(process.execPath,['scripts/measure-reading-assets.mjs'],{encoding:'utf8'}));
 fs.mkdirSync('outputs/browser/asset-measurements',{recursive:true});fs.writeFileSync('outputs/browser/asset-measurements/receipt.json',JSON.stringify(report,null,2)+'\n');
 assert.deepEqual(report.graph_modules_in_ordinary_reading,[]);
 // Recorded pre175 navigation closure, measured with the same gzip-per-file method.
 const baseline=104682;assert.ok(report.scenarios_gzip_bytes.navigation_and_outline-baseline<=15*1024,'Bootstrap and outline exceed the recorded incremental budget');
 for(const name of ['preview','search'])assert.ok(report.entries[name].incremental_after_navigation_gzip_bytes<=80*1024,name);
 assert.ok(report.entries.graph.incremental_after_navigation_gzip_bytes<=300*1024);
});
