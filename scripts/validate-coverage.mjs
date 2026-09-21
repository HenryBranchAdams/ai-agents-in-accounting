import { readSnapshotHistory } from "./snapshot-history.mjs";
import assert from "node:assert/strict";
import fs from "node:fs";
import { read, generateMappings, hash } from "./coverage-mappings.mjs";
import { validateResearch } from './validate-research.mjs';

export function coverageInputs() {
  return Object.fromEntries(["data/coverage/topology.json", "data/coverage/record-mappings.json", "data/coverage/assessments.json", "data/coverage/metrics.json", "src/coverage.ts", "src/research.ts", "data/coverage/research-questions.json", "data/coverage/subsector-profiles.json", "data/coverage/subsector-screening.json", "data/coverage/industry-exception-reviews.json", "data/coverage/research-criteria.json", "data/coverage/classification-relationships.json"].map(file => [file, hash(fs.readFileSync(file))]));
}

export function validateCoverage(records, { includeHistory = true } = {}) {
  validateResearch(records);
  const topology = read("data/coverage/topology.json"), mappings = read("data/coverage/record-mappings.json"), assessmentData = read("data/coverage/assessments.json"), criteria = read("data/coverage/research-criteria.json"), questionData = read("data/coverage/research-questions.json");
  const ids = new Set(records.map(r => r.id)), recordMap = new Map(records.map(r => [r.id,r]));
  const nodes = new Map(topology.industry_backbone.nodes.map(n => [n.code,n]));
  const questions = new Set(topology.question_families.map(q => q.id));
  assert.equal(nodes.size, topology.industry_backbone.nodes.length, "Duplicate industry code");
  assert.equal(questions.size, topology.question_families.length, "Duplicate question family");
  for (const [level,count] of Object.entries(topology.industry_backbone.counts)) assert.equal([...nodes.values()].filter(n => n.level === level).length,count,`Industry denominator: ${level}`);
  for (const node of nodes.values()) {
    assert.ok(node.parent_code === null || nodes.has(node.parent_code), `Unknown parent for ${node.code}`);
    const visited = new Set([node.code]); let current = node;
    while (current.parent_code) { assert.ok(!visited.has(current.parent_code), "Industry cycle"); visited.add(current.parent_code); current = nodes.get(current.parent_code); }
  }
  for (const q of topology.question_families) assert.ok(Object.hasOwn(topology.question_groups,q.group), `Unknown question group ${q.id}`);
  for (const p of topology.subsector_screening) {
    assert.equal(nodes.get(p.naics_code)?.level,"subsector");
    p.candidate_question_family_ids.forEach(q=>assert.ok(questions.has(q)));
    p.candidate_corpus_record_ids.forEach(id=>assert.ok(ids.has(id),`Unknown screening record ${id}`));
  }
  assert.deepEqual(mappings, generateMappings(records), "Coverage mappings are stale. Run npm run coverage:map, review changes, then capture a new snapshot.");
  assert.equal(mappings.mappings.length,ids.size);
  assert.equal(new Set(mappings.mappings.map(m=>m.record_id)).size,ids.size);
  assert.equal(criteria.population.named_research_questions,questionData.questions.length,"Research criteria named-question denominator");
  assert.equal(questionData.questions.filter(q=>q.assessment_status === "partial").length + questionData.questions.filter(q=>q.assessment_status === "evidence-gap").length,questionData.questions.length,"Named-question status denominator");
  for (const m of mappings.mappings) {
    assert.ok(ids.has(m.record_id));
    assert.equal(m.industry_scope === "specific",m.industry_mappings.length > 0);
    assert.equal(new Set(m.question_mappings.map(q=>q.question_id)).size,m.question_mappings.length);
    assert.equal(new Set(m.industry_mappings.map(i=>i.industry_code)).size,m.industry_mappings.length);
    for (const entry of [...m.question_mappings,...m.industry_mappings]) {
      assert.ok(entry.question_id ? questions.has(entry.question_id) : nodes.has(entry.industry_code));
      assert.ok(["candidate","reviewed"].includes(entry.status)); assert.ok(entry.basis.length);
      for (const b of entry.basis) {
        assert.ok(b.field.startsWith("/") && b.matched && b.rule);
        const value = b.field.slice(1).split("/").reduce((v,key)=>v?.[key.replaceAll("~1","/").replaceAll("~0","~")],recordMap.get(m.record_id));
        assert.notEqual(value,undefined,`Mapping field missing on ${m.record_id}`);
        if (!["editorial-association","editorial-review"].includes(b.rule)) assert.ok(String(value).toLowerCase().includes(b.matched.toLowerCase()), `Mapping basis no longer matches ${m.record_id}`);
      }
    }
  }
  assert.equal(assessmentData.topology_version,topology.topology_version);
  assert.equal(new Set(assessmentData.assessments.map(a=>a.id)).size,assessmentData.assessments.length);
  const namedQuestionIds = new Set(questionData.questions.map(q=>q.id));
  const sharedNamedQuestionIds = new Set();
  for (const a of assessmentData.assessments) {
    assert.ok(questions.has(a.question_id));
    assert.ok(a.family_ids.length && a.family_ids.includes(a.question_id));
    a.family_ids.forEach(id => assert.ok(questions.has(id),`Unknown assessment question family ${id}`));
    if (a.scope_kind === "shared-context") {
      assert.equal(a.industry_code,null,"Shared assessment must not invent an industry code");
      assert.ok(a.named_question_id && namedQuestionIds.has(a.named_question_id),"Shared assessment must identify a named question");
      assert.ok(!sharedNamedQuestionIds.has(a.named_question_id),"Duplicate shared named-question assessment");
      sharedNamedQuestionIds.add(a.named_question_id);
    } else {
      assert.equal(a.scope_kind,"industry");
      assert.ok(typeof a.industry_code === "string" && nodes.has(a.industry_code));
      assert.ok(!a.named_question_id,"Industry assessment must not use a shared named-question pointer");
    }
    assert.ok(a.scope&&a.review_basis&&a.reviewer&&a.source_currency&&a.rights);
    assert.ok(["partial","sufficient-for-stated-scope","evidence-gap","not-applicable"].includes(a.status));
    assert.ok(Number.isFinite(Date.parse(a.reviewed_at)));
    a.evidence_record_ids.forEach(id=>assert.ok(ids.has(id),`Unknown evidence ${id}`));
    for (const d of topology.depth_dimensions) assert.ok(["present","partial","missing","not-assessed","not-applicable"].includes(a.dimensions[d.id]));
    if (a.status === "partial") assert.ok(a.gaps.length&&a.evidence_record_ids.length);
  }
  const history = includeHistory ? readSnapshotHistory().snapshots : [];
  assert.equal(new Set(history.map(s=>s.id)).size,history.length,"Duplicate coverage snapshot");
  for (const snapshot of history) assert.ok(snapshot.recorded_at&&snapshot.topology_version&&snapshot.corpus_version&&snapshot.inputs_sha256&&snapshot.summary);
  return { mapped_records: mappings.mappings.length, assessments: assessmentData.assessments.length, snapshots: history.length };
}
