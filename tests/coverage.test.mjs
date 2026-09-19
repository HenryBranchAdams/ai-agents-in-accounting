import { readSnapshotHistory } from "../scripts/snapshot-history.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { coverage, records, meta } from "../dist/internal/corpus.mjs";
import worker from "../dist/server/index.js";
import { validateSchema } from "../scripts/validate.mjs";
import { coverageInputs } from "../scripts/validate-coverage.mjs";

const read = file => JSON.parse(fs.readFileSync(file,"utf8"));
const mappingRows = read("data/coverage/record-mappings.json").mappings;
const topology = read("data/coverage/topology.json");
const fetchPage = (path, options) => worker.fetch(new Request(`https://corpus.example${path}`,options));

test("coverage joins every canonical record and preserves the complete topology denominators", () => {
  assert.deepEqual(topology.industry_backbone.counts, {sector:20,subsector:96,"industry-group":308,"naics-industry":689,"us-industry":1012});
  assert.equal(topology.industry_backbone.nodes.length,2125);
  assert.equal(topology.question_families.length,62);
  assert.equal(topology.archetypes.length,30);
  assert.equal(topology.subsector_screening.length,96);
  assert.deepEqual(new Set(mappingRows.map(m=>m.record_id)),new Set(records.map(r=>r.id)));
  assert.equal(coverage.summary.subsector_question_screening_pairs,5952);
  assert.equal(coverage.summary.record_count,records.length);
});

test("headline counts independently reconcile to mapping rows without summing overlapping memberships", () => {
  const proposed = mappingRows.filter(m=>m.question_mappings.length);
  const questions = new Set(proposed.flatMap(m=>m.question_mappings.map(q=>q.question_id)));
  assert.equal(coverage.summary.question_mapped_records,proposed.length);
  assert.equal(coverage.summary.question_families_with_material,questions.size);
  assert.equal(coverage.summary.question_unassigned_records,mappingRows.length-proposed.length);
  const partition = Object.groupBy(mappingRows,m=>m.industry_scope);
  assert.equal(coverage.summary.industry_mapped_records,partition.specific.length);
  assert.equal(coverage.summary.shared_context_records,partition["shared-context"].length);
  assert.equal(coverage.summary.industry_unassigned_records,partition.unassigned.length);
  assert.equal(Object.values(partition).reduce((sum,rows)=>sum+rows.length,0),records.length);
  const roots = new Set();
  for (const m of mappingRows) for (const i of m.industry_mappings) {
    let node=topology.industry_backbone.nodes.find(n=>n.code===i.industry_code);
    while(node.parent_code) node=topology.industry_backbone.nodes.find(n=>n.code===node.parent_code);
    roots.add(node.code);
  }
  assert.equal(coverage.summary.sectors_with_material,roots.size);
  // The same collection is intentionally mapped to several financial subsectors.
  const financeIds=new Set(mappingRows.filter(m=>m.industry_mappings.some(i=>i.industry_code.startsWith("52"))).map(m=>m.record_id));
  assert.equal(coverage.industryStats("52").subtree_records,financeIds.size);
  const exactFinance = new Set(mappingRows.filter(m=>m.industry_mappings.some(i=>["521","522","523","524","525"].includes(i.industry_code))).map(m=>m.record_id));
  assert.ok(["521","522","523","524","525"].reduce((n,code)=>n+coverage.industryStats(code).direct_records,0)>=exactFinance.size);
});

test("broad construction references do not become detailed-industry material or assessments", () => {
  const parent=coverage.cell("23","q-project-wip"), child=coverage.cell("236","q-project-wip"), leaf=coverage.cell("236115","q-project-wip");
  assert.ok(parent.direct_records>0);
  assert.deepEqual(parent.assessments.map(a=>a.id).sort(),["coverage-construction-connected-2026-09-14","coverage-construction-four-gaps-2026-09-14","coverage-construction-local-2026-09-14","coverage-construction-wip-2026-09-11"]);
  for (const cell of [child,leaf]) {
    assert.equal(cell.direct_records,mappingRows.filter(m=>m.industry_mappings.some(i=>i.industry_code===cell.industry_code)&&m.question_mappings.some(q=>q.question_id==="q-project-wip")).length);
    assert.equal(cell.assessments.length,0);
    assert.equal(cell.assessment_status,"unassessed");
    assert.ok(cell.broader_context_records>=parent.direct_records);
  }
  const selected=coverage.select(new URLSearchParams("industry=236&question=q-project-wip"));
  assert.ok(selected.records.some(r=>r.id==="guide-industry-naics2022-236"));
  assert.ok(selected.research.screening[0].named_question_ids.length);
  assert.equal(leaf.screening,null);
  assert.ok(selected.broader_context.some(r=>r.id==="wf-construction-wip-close"));
  assert.equal(coverage.summary.detailed_industries_with_direct_material,0);
  const subsectorCodes=new Set(topology.industry_backbone.nodes.filter(n=>n.level==="subsector").map(n=>n.code));
  const assessedPairs=new Set(read("data/coverage/assessments.json").assessments.filter(a=>subsectorCodes.has(a.industry_code)&&a.question_id).map(a=>`${a.industry_code}:${a.question_id}`));
  assert.equal(coverage.summary.assessed_subsector_question_pairs,assessedPairs.size);
  assert.ok(![...assessedPairs].some(pair=>pair.startsWith("236:")),"A separate nonprofit assessment must not assess construction subsectors");
});

test("metadata queues and sparse cells retain unknowns instead of inventing absence or sufficiency", () => {
  const unmapped=coverage.select(new URLSearchParams("mapping=question-unassigned&limit=100"));
  assert.equal(unmapped.total,coverage.summary.question_unassigned_records);
  assert.ok(unmapped.records.every(r=>!r.coverage.question_mappings.length));
  assert.ok(coverage.select(new URLSearchParams("view=questions&show=unassessed")).question_rows.some(q=>q.id==="q-project-wip"),"One narrow review does not assess the entire question across industries");
  const analytics=coverage.analytics();
  const assessments=read("data/coverage/assessments.json").assessments;
  assert.equal(analytics.summary.scoped_assessments,new Set(assessments.map(a=>a.id)).size);
  assert.equal(analytics.summary.assessment_status_counts.partial,assessments.filter(a=>a.status==="partial").length);
  assert.equal(analytics.summary.assessment_status_counts["sufficient-for-stated-scope"],0);
  assert.equal(assessments[0].source_currency,"not-reverified-for-this-assessment");
  assert.equal(assessments[0].dimensions["worked-material"],"missing");
  assert.ok(assessments[0].gaps.length>0);
  assert.ok(analytics.metric_definitions.comparison_rule.includes("mapping"));
});

test("coverage API is read-only, validates filters, supports cache validators and bounds pagination", async () => {
  const route="/api/v1/coverage?industry=23&question=q-project-wip&limit=1";
  const result=await fetchPage(route);assert.equal(result.status,200);
  const data=await result.json();assert.equal(data.records.length,1);assert.ok(data.total>1);
  assert.ok(data.next.includes("page=2"));assert.equal(data.corpus_version,meta.corpus_version);
  assert.equal(Number(result.headers.get("X-Total-Count")),data.total);
  assert.match(result.headers.get("Link"),/rel="next"/);
  assert.equal((await fetchPage(route,{method:"HEAD"})).status,200);
  assert.equal(await (await fetchPage(route,{method:"HEAD"})).text(),"");
  assert.equal((await fetchPage(route,{headers:{"If-None-Match":result.headers.get("ETag")}})).status,304);
  for(const method of ["POST","PUT","PATCH","DELETE"]) assert.equal((await fetchPage(route,{method})).status,405);
  assert.equal((await fetchPage(route,{method:"OPTIONS"})).status,204);
  for(const query of ["industry=999999","industry=23&industry=236","question=missing","page=0","limit=101","limit=1.5","unknown=1","mapping=complete","view=magic"]) {
    const response=await fetchPage(`/api/v1/coverage?${query}`);
    assert.equal(response.status,400,query);assert.ok((await response.json()).error);
  }
  assert.equal((await fetchPage("/api/v1/coverage/records/missing")).status,404);
});

test("all coverage record pages paginate once per stable record with the same canonical evidence", async () => {
  const ids=[];let route="/api/v1/coverage?limit=100";
  while(route) {
    const response=await fetchPage(route);const data=await response.json();
    for(const record of data.records) { const {coverage:profile,...canonical}=record;ids.push(record.id);assert.equal(profile.record_id,record.id);assert.deepEqual(canonical,records.find(r=>r.id===record.id)); }
    route=data.next;
  }
  assert.equal(ids.length,records.length);assert.equal(new Set(ids).size,records.length);
});

test("rendered coverage routes expose sources, explicit scope and schema-linked record fields", async () => {
  const page=await fetchPage("/coverage");assert.equal(page.status,200,"The former redirect must not shadow the new route");
  const html=await page.text();
  for(const phrase of ["Entire corpus snapshot","Metric definitions and source data","Mapping method","unassessed","coverage-records.jsonl","Exploration filters above do not narrow"]) assert.ok(html.includes(phrase),phrase);
  assert.doesNotMatch(html,/<script\b(?! type="module" src="\/assets\/navigation-[A-Z0-9]{8}\.js"><\/script>)/i);
  const detail=await (await fetchPage("/records/wf-construction-wip-close")).text();
  assert.ok(detail.includes('id="coverage"'));
  assert.ok(detail.includes('/api/v1/coverage/records/wf-construction-wip-close'));
  const profile=await (await fetchPage("/api/v1/coverage/records/wf-construction-wip-close")).json();
  assert.deepEqual(profile.question_mappings,coverage.profiles.get(profile.record_id).question_mappings);
  const spec=await (await fetchPage("/openapi.json")).json();
  for(const path of ["/api/v1/coverage","/api/v1/coverage/topology","/api/v1/coverage/history","/api/v1/coverage/records/{id}"]) assert.ok(spec.paths[path]?.get);
});

test("portable mappings meet their public schema and analytics match the same hashed build", async () => {
  const schema=read("schemas/coverage.schema.json");
  const resolve=value=>Array.isArray(value)?value.map(resolve):value&&typeof value==="object"?(value.$ref?resolve(schema.$defs[value.$ref.split("/").at(-1)]):Object.fromEntries(Object.entries(value).filter(([key])=>key!=="$defs").map(([key,v])=>[key,resolve(v)]))):value;
  const rows=fs.readFileSync("dist/client/downloads/coverage-records.jsonl","utf8").trim().split("\n").map(JSON.parse);
  for(const row of rows) validateSchema(row,resolve(schema));
  for(const assessment of read("data/coverage/assessments.json").assessments) validateSchema(assessment,resolve(schema.$defs.assessment));
  assert.deepEqual(read("dist/client/downloads/coverage.json"),coverage.analytics());
  assert.deepEqual(read("dist/client/downloads/coverage-topology.json"),topology);
  const manifest=read("dist/client/downloads/manifest.json");
  for(const entry of manifest.files.filter(f=>f.path.includes("coverage"))) {
    const response=await worker.fetch(new Request(`https://corpus.test${entry.path}`), {ASSETS:{fetch:async request=>{
      const file=`dist/client${new URL(request.url).pathname}`;
      return fs.existsSync(file)?new Response(fs.readFileSync(file)):new Response(null,{status:404});
    }}});
    assert.equal(response.status,200,entry.path);
    const bytes=Buffer.from(await response.arrayBuffer());
    assert.equal(createHash("sha256").update(bytes).digest("hex"),entry.sha256);
  }
  assert.equal(manifest.files.filter(f=>f.path.includes("coverage")).length,7);
});

test("expanded screening CSV preserves every subsector/question pair, zero and broader context", () => {
  const [header,...lines]=fs.readFileSync("dist/client/downloads/coverage-cells.csv","utf8").trimEnd().split("\n");
  const names=header.split(",");
  const rows=lines.map(line=>Object.fromEntries(line.match(/"(?:[^"]|"")*"/g).map((v,i)=>[names[i],v.slice(1,-1).replaceAll('""','"')])));
  assert.equal(rows.length,5952);
  assert.equal(new Set(rows.map(r=>`${r.industry_code}:${r.question_id}`)).size,5952);
  const row=rows.find(r=>r.industry_code==="236"&&r.question_id==="q-project-wip");
  assert.equal(row.direct_records,String(coverage.cell("236","q-project-wip").direct_records));assert.ok(Number(row.broader_context_records)>0);
  assert.equal(row.scoped_assessments,"0");assert.equal(row.assessment_status,"unassessed");
  assert.equal(row.assessment_version,coverage.versions.assessment_version);
});

test("the latest measured snapshot pins current inputs and existing snapshot IDs cannot be rewritten", () => {
  const history=readSnapshotHistory().snapshots, latest=history.at(-1);
  assert.ok(latest);assert.deepEqual(latest.inputs_sha256,coverageInputs());
  assert.deepEqual(latest.summary,coverage.summary);
  assert.deepEqual(latest.industries,coverage.analytics().industries);
  assert.equal(latest.mapping_version,coverage.versions.mapping_version);
  const before=fs.readFileSync("data/coverage/snapshots.json");
  const output=execFileSync(process.execPath,["scripts/coverage-snapshot.mjs",latest.id],{encoding:"utf8"});
  assert.match(output,/already records/);
  assert.deepEqual(fs.readFileSync("data/coverage/snapshots.json"),before);
  assert.throws(()=>execFileSync(process.execPath,["scripts/coverage-snapshot.mjs",history[0].id],{stdio:"pipe"}),/Command failed/);
  assert.deepEqual(fs.readFileSync("data/coverage/snapshots.json"),before);
});
