import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";
import { validateCorpus } from "./validate.mjs";
import { coverageInputs } from "./validate-coverage.mjs";
import { read } from "./coverage-mappings.mjs";

const id = process.argv[2];
if (!id || !/^\d{4}-\d{2}-\d{2}\.\d+$/.test(id)) throw new Error("Supply an immutable snapshot ID, for example: npm run coverage:snapshot -- 2026-09-11.1");
validateCorpus();
const history = read("data/coverage/snapshots.json"), inputs = coverageInputs();
const existing = history.snapshots.find(s=>s.id===id);
if (existing) {
  assert.deepEqual(existing.inputs_sha256,inputs,"This snapshot ID already exists with different inputs. Choose a new ID; prior snapshots are immutable.");
  console.log(`Snapshot ${id} already records these exact inputs.`);
} else {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(),"accounting-coverage-"));
  try {
    const output = path.join(temporary,"corpus.mjs");
    await build({entryPoints:["src/corpus.ts"],outfile:output,bundle:true,format:"esm",platform:"node",target:"es2023"});
    const {coverage} = await import(pathToFileURL(output));
    history.snapshots.push({id,recorded_at:new Date().toISOString().slice(0,10),inputs_sha256:inputs,...coverage.analytics()});
    fs.writeFileSync("data/coverage/snapshots.json",JSON.stringify(history,null,2)+"\n");
    console.log(`Recorded baseline ${id}: ${coverage.summary.record_count} records, ${coverage.summary.question_families_with_material} question families with material, ${coverage.summary.scoped_assessments} scoped assessments.`);
  } finally { fs.rmSync(temporary,{recursive:true,force:true}); }
}
