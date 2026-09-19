import fs from "node:fs";
import assert from "node:assert/strict";

const read = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const staged = new Map();
const write = (file, value) => staged.set(file, JSON.stringify(value, null, 2) + "\n");
const packet = read("data/research/agriculture-i97.json");
const integratedVersion = "2026-09-19.12402";
const predecessorVersion = "2026-09-19.12401";
const catalog = read("data/catalog.json");
assert.ok([predecessorVersion, integratedVersion].includes(catalog.corpus_version), "Refuse an unrecognized current corpus edition before writing");
const appendOnce = (current, addition) => current.includes(addition) ? current : `${current} ${addition}`;

assert.equal(packet.issue_id, "AA-I97");
assert.equal(packet.families.length, 3);
assert.equal(packet.families.flatMap((family) => family.questions).length, 8);

const guides = read("data/corpus/guide.json");
const agricultureGuideIds = new Set(packet.families.map((family) => family.guide_id));
const agricultureGuides = guides.filter((guide) => agricultureGuideIds.has(guide.id));
assert.equal(agricultureGuides.length, packet.families.length, "Agriculture guides must be present before current-edition integration");
for (const guide of agricultureGuides) {
  assert.equal(guide.data.research_questions.length, packet.families.find((family) => family.guide_id === guide.id).questions.length);
}

const registry = read("data/coverage/research-questions.json");
const retainedRows = registry.questions.filter((row) => !agricultureGuideIds.has(row.record_id));
const agricultureRows = agricultureGuides.flatMap((guide) => guide.data.research_questions.map((question, index) => ({
  id: question.id,
  record_id: guide.id,
  pointer: `/data/research_questions/${index}`,
  family_ids: question.family_id ? [question.family_id] : question.family_ids || guide.data.question_family_ids,
  question: question.question,
  scope: question.scope || guide.data.scope,
  answer_status: question.answer_status || "sourced-answer-bounded",
  assessment_status: question.assessment?.status || "partial",
  source_ids: [...new Set(question.source_ids || [])],
  source_locators: question.source_locators || [],
  remaining_gaps: question.remaining_gaps || [],
  professional_review: question.assessment?.professional_review || "not-performed",
  empirical_support: question.assessment?.empirical_support || "not-established",
  dimensions: question.assessment?.dimensions || {
    scope: "partial",
    "accounting-question": "partial",
    "evidence-inputs": "partial",
    workflow: "partial",
    controls: "partial",
    "worked-material": "partial",
    "empirical-support": "not-assessed",
  },
  dimension_basis: question.assessment?.basis || "Presence and review limits of the linked named question, package workflow and original worked material. Partial does not establish accounting correctness.",
})));
const questionIds = [...retainedRows, ...agricultureRows].map((row) => row.id);
assert.equal(new Set(questionIds).size, questionIds.length, "Integrated research-question IDs must be unique");
registry.questions = [...retainedRows, ...agricultureRows];
registry.question_set_version = integratedVersion;
registry.corpus_version = integratedVersion;
registry.reviewed_at = registry.reviewed_at > packet.reviewed_at ? registry.reviewed_at : packet.reviewed_at;
write("data/coverage/research-questions.json", registry);

const assessments = read("data/coverage/assessments.json");
assert.ok(packet.assessments.every((assessment) => assessments.assessments.some((candidate) => candidate.id === assessment.id)), "Agriculture assessments must be integrated before version bump");
assessments.assessment_version = integratedVersion;
write("data/coverage/assessments.json", assessments);

const overrides = read("data/coverage/mapping-overrides.json");
assert.ok(packet.families.every((family) => Object.hasOwn(overrides.records, family.guide_id)), "Agriculture guide mappings must be integrated before version bump");
overrides.mapping_version = integratedVersion;
overrides.updated_at = packet.reviewed_at;
write("data/coverage/mapping-overrides.json", overrides);


catalog.corpus_version = integratedVersion;
catalog.updated_at = packet.reviewed_at;
catalog.coverage_note = appendOnce(catalog.coverage_note, "Edition2026-09-19.12402 AA-INT97 adds a bounded US agriculture, forestry, fishing and harvesting-service layer with three role-specific guides, eight named questions, five partial assessments, source-specific periods and explicit producer-versus-service boundaries.");
catalog.review_note = appendOnce(catalog.review_note, "AA-INT97 integrates the independently accepted AA-I97 source package into the combined institutional/extractive 2026-09-19.12401 corpus as edition 2026-09-19.12402. The prior education records, tests, package, releases and snapshots remain preserved. Agriculture facts remain synthetic and scoped; no professional review, operating evidence, whole-subsector sufficiency or posting authorization is established.");
write("data/catalog.json", catalog);

for (const [file, content] of staged) fs.writeFileSync(file, content);

console.log(JSON.stringify({
  integrated_version: integratedVersion,
  guides: agricultureGuides.length,
  named_questions_added: agricultureRows.length,
  assessments: assessments.assessments.length,
  question_set_version: registry.question_set_version,
  assessment_version: assessments.assessment_version,
  mapping_version: overrides.mapping_version,
}, null, 2));
