import fs from "node:fs";
import assert from "node:assert/strict";

const packetFile = "data/research/capital-financing-2026-09-18.json";
const packet = JSON.parse(fs.readFileSync(packetFile, "utf8"));
const read = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const write = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n");
const unique = (values) => [...new Set(values)];
const byId = (records) => new Map(records.map((record) => [record.id, record]));
const versionKey = (version) => {
  const match = String(version).match(/^(\d{4}-\d{2}-\d{2})\.(\d+)$/);
  assert.ok(match, `Invalid corpus version: ${version}`);
  return `${match[1]}-${String(match[2]).padStart(6, "0")}`;
};
const mergeText = (existing, addition) => existing.includes(addition) ? existing : `${existing} ${addition}`;
const replaceOrAppend = (records, record) => {
  const index = records.findIndex((candidate) => candidate.id === record.id);
  if (index === -1) records.push(record);
  else records[index] = record;
};

const retiredSourceIds = ["src_fasb_asu_202308_crypto", "src_sec_sab122_crypto"];

const currentCatalog = read("data/catalog.json");
assert.equal(versionKey(currentCatalog.corpus_version) <= versionKey(packet.package_version), true, "AA-I121 package cannot overwrite a newer catalog version");
assert.equal(packet.families.length, 7);
assert.equal(packet.families.reduce((count, family) => count + family.questions.length, 0), 14);

const rights = {
  metadata: "CC0-1.0",
  content: "CC-BY-4.0",
  external_content: "Publisher text is not included; publisher terms apply.",
  full_text_stored: false,
  source_status: "unknown",
  source_license: null,
  source_license_url: null,
  source_permission_scope: null,
};

const sourceFamilies = new Map();
const existingSourceRecords = new Map(read("data/corpus/source.json").map((record) => [record.id, record]));
for (const family of packet.families) {
  for (const sourceId of family.source_ids) {
    const families = sourceFamilies.get(sourceId) || [];
    families.push(family.family_id);
    sourceFamilies.set(sourceId, families);
  }
}
for (const source of packet.sources) {
  const priorQuestionIds = existingSourceRecords.get(source.id)?.data?.source_review?.question_ids || [];
  if (priorQuestionIds.length) sourceFamilies.set(source.id, unique([...priorQuestionIds, ...(sourceFamilies.get(source.id) || [])]));
}

function canonicalSource(source, existing = null) {
  const familyIds = unique(sourceFamilies.get(source.id) || []);
  const limitations = unique(source.limitations);
  const sourceReview = {
    record_id: source.id,
    disposition: "supported-scope",
    review_level: source.review_level,
    checked_url: source.source_url,
    publisher_verified: true,
    source_locator: source.source_locator,
    publication_or_edition: source.publication_or_edition,
    jurisdiction: source.jurisdiction,
    frameworks: source.frameworks,
    effective_period: source.effective_period,
    evidence_summary: source.evidence_summary,
    limitations,
    checks: source.checks.map((check) => ({ ...check, url: source.source_url, checked_at: packet.reviewed_at })),
    rights_review: source.rights_review,
    question_ids: familyIds,
    industry_scope: "shared-context",
    industry_codes: [],
    mapping_rationale: `AA-I121 source review for ${familyIds.join(", ") || "shared capital-financing context"}; no industry-specific coverage credit.`,
    reviewed_at: packet.reviewed_at,
    reviewer: packet.reviewer,
  };
  const record = {
    id: source.id,
    kind: "source",
    title: source.title,
    summary: source.evidence_summary,
    topics: ["Accounting and reporting", "Capital and financing"],
    industries: [],
    jurisdiction: source.jurisdiction,
    source_type: source.source_type,
    publisher: source.publisher,
    source_url: source.source_url,
    source_ids: [],
    related_ids: [],
    review_status: "source-checked",
    reviewed_at: packet.reviewed_at,
    provenance: {
      added_on: packet.reviewed_at,
      reviewer: packet.reviewer,
      issue_id: packet.issue_id,
      package_version: packet.package_version,
      scope: "US-first bounded capital and financing source review",
      note: "Original publisher material was inspected only for the cited locator and summary. This record is not professional review and does not grant permission to redistribute publisher content.",
    },
    rights: { ...rights },
    data: {
      id: source.id,
      record_version: "1",
      record_updated_at: packet.reviewed_at,
      topic: "Accounting and reporting",
      source_type: source.source_type,
      owner: source.publisher,
      title: source.title,
      published_or_status: source.publication_or_edition,
      jurisdiction: source.jurisdiction,
      frameworks: source.frameworks,
      access: source.access,
      summary: source.evidence_summary,
      source_license: "unknown",
      source_license_url: null,
      source_rights: {
        status: "unknown",
        license_id: null,
        license_url: null,
        full_text_stored: false,
        permission_scope: null,
        notes: source.rights_review.note,
      },
      metadata_rights: { license_id: "CC0-1.0", license_url: "https://creativecommons.org/publicdomain/zero/1.0/", applies_to: "project-created factual catalog metadata" },
      annotation_rights: { creator: "Accounting Agents contributors", license_id: "CC-BY-4.0", license_url: "https://creativecommons.org/licenses/by/4.0/", applies_to: "original editorial summary and annotation" },
      canonical_source_url: source.source_url,
      source_review: sourceReview,
      limitations,
      supplemental_reviews: [{
        batch: "AA-I121",
        reviewed_at: packet.reviewed_at,
        review_level: source.review_level,
        checked_url: source.source_url,
        locator: source.source_locator,
        publication_or_edition: source.publication_or_edition,
        effective_period: source.effective_period,
        evidence_summary: source.evidence_summary,
        limitations,
        rights_review: source.rights_review,
      }],
    },
  };
  if (existing?.data?.source_review && existing.reviewed_at !== packet.reviewed_at) {
    const prior = existing.data.source_review;
    record.data.supplemental_reviews = mergeArray([{
      batch: "prior-corpus",
      reviewed_at: existing.reviewed_at,
      review_level: prior.review_level,
      checked_url: prior.checked_url,
      locator: prior.source_locator,
      publication_or_edition: prior.publication_or_edition,
      effective_period: prior.effective_period,
      evidence_summary: prior.evidence_summary,
      limitations: prior.limitations,
      checks: prior.checks,
      rights_review: prior.rights_review,
    }], record.data.supplemental_reviews);
  }
  return record;
}

function dimensions(status) {
  return {
    scope: status === "evidence-gap" ? "partial" : "present",
    "accounting-question": "partial",
    "evidence-inputs": status === "evidence-gap" ? "partial" : "present",
    workflow: status === "evidence-gap" ? "partial" : "present",
    controls: "present",
    "worked-material": "present",
    "empirical-support": "not-assessed",
  };
}

function canonicalQuestion(question) {
  const status = question.assessment.status;
  return {
    ...question,
    assessment: {
      status,
      basis: "Presence of a source-linked bounded answer, explicit inputs, controls, synthetic worked material and stated limitations. This is not a family-wide sufficiency or professional conclusion.",
      professional_review: "not-performed",
      empirical_support: "not-established",
      dimensions: dimensions(status),
    },
  };
}

function mergeArray(existing, additions) {
  const seen = new Set();
  return [...(existing || []), ...(additions || [])].filter((value) => {
    const key = JSON.stringify(value);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function integrateGuide(guide, family) {
  const oldQuestions = (guide.data.research_questions || []).map((question) => ({
    ...question,
    source_ids: (question.source_ids || []).filter((id) => !retiredSourceIds.includes(id)),
    source_locators: (question.source_locators || []).filter((locator) => !retiredSourceIds.includes(locator.source_id)),
  }));
  const newQuestions = family.questions.map(canonicalQuestion);
  const questions = [...oldQuestions];
  for (const question of newQuestions) replaceOrAppend(questions, question);
  const sourceIds = mergeArray((guide.source_ids || []).filter((id) => !retiredSourceIds.includes(id)), family.source_ids);
  const oldData = guide.data;
  const newFindingClaims = new Set(newQuestions.map((question) => question.answer));
  const findings = (oldData.editorial_brief?.findings || []).filter((finding) => !newFindingClaims.has(finding.claim)).concat(newQuestions.map((question) => ({
    claim: question.answer,
    source_ids: question.source_ids,
    classification: question.answer_status,
    qualification: question.scope,
  })));
  const guideScope = `${family.scope} Inherited IFRS questions remain visible as explicitly separate context and do not substitute for this US layer.`;
  return {
    ...guide,
    summary: guideScope,
    topics: mergeArray(guide.topics, ["US GAAP capital and financing"]),
    jurisdiction: "United States; inherited IFRS questions remain explicitly separate context",
    source_ids: sourceIds,
    reviewed_at: packet.reviewed_at,
    review_status: "editorially-reviewed",
    provenance: {
      ...guide.provenance,
      reviewed_at: packet.reviewed_at,
      reviewer: packet.reviewer,
      issue_id: packet.issue_id,
      package_version: packet.package_version,
      note: "Inherited source and question context is preserved. AA-I121 adds a bounded US-first layer from official publisher material and original synthetic examples; no professional sign-off or full-family sufficiency is asserted.",
      research_file: packetFile,
    },
    data: {
      ...oldData,
      title: family.title,
      scope: guideScope,
      review_basis: `${family.review_basis} Inherited IFRS context remains separate.`,
      source_ids: sourceIds,
      source_locators: mergeArray((oldData.source_locators || []).filter((locator) => !retiredSourceIds.includes(locator.source_id)), family.source_locators),
      shared_inputs: mergeArray(oldData.shared_inputs, family.shared_inputs),
      controls: mergeArray(oldData.controls, family.controls),
      exceptions: mergeArray(oldData.exceptions, family.exceptions),
      coverage_gaps: mergeArray(oldData.coverage_gaps, family.coverage_gaps),
      frameworks: mergeArray(oldData.frameworks, family.frameworks),
      jurisdictions: ["United States", "Inherited IFRS context retained separately"],
      professional_review: "not-performed",
      empirical_support: "not-established",
      version: packet.package_version,
      research_package: "foundations",
      supplemental_research_package: "AA-I121",
      issue_id: packet.issue_id,
      package_version: packet.package_version,
      selected_scope: packet.scope,
      question_inventory: { existing_named_questions: oldQuestions.map((question) => question.id), added_named_questions: newQuestions.map((question) => question.id) },
      research_questions: questions,
      editorial_brief: {
        ...(oldData.editorial_brief || {}),
        question: family.title,
        answer: guideScope,
        findings,
        unknowns: mergeArray(oldData.editorial_brief?.unknowns, family.coverage_gaps),
        reading_order: sourceIds,
      },
    },
  };
}

function registryEntry(guide, question, index) {
  return {
    id: question.id,
    record_id: guide.id,
    pointer: `/data/research_questions/${index}`,
    family_ids: [question.family_id],
    question: question.question,
    scope: question.scope,
    answer_status: question.answer_status,
    assessment_status: question.assessment.status,
    source_ids: question.source_ids,
    remaining_gaps: question.remaining_gaps,
    professional_review: question.assessment.professional_review,
    empirical_support: question.assessment.empirical_support,
    dimensions: question.assessment.dimensions,
    dimension_basis: question.assessment.basis,
  };
}

function mappingOverride(questionIds, note) {
  return {
    replace_question_ids: true,
    question_ids: unique(questionIds),
    reviewed_question_ids: unique(questionIds),
    industry_scope: "shared-context",
    industry_codes: [],
    basis_field: "/data",
    reason: note,
    reviewed_at: packet.reviewed_at,
    review_note: note,
  };
}

function canonicalExample(example) {
  return {
    id: example.id,
    kind: "example",
    title: example.title,
    summary: example.summary,
    topics: example.topics,
    industries: [],
    jurisdiction: example.jurisdiction,
    source_type: null,
    publisher: "Accounting Agents contributors",
    source_url: null,
    source_ids: example.source_ids,
    related_ids: example.related_ids,
    review_status: "editorially-reviewed",
    reviewed_at: packet.reviewed_at,
    provenance: {
      added_on: packet.reviewed_at,
      reviewer: packet.reviewer,
      issue_id: packet.issue_id,
      package_version: packet.package_version,
      note: "Original synthetic cases connect source-linked accounting questions to evidence inputs, controls and authority limits. They are not customer, production or professional evidence.",
    },
    rights: { ...rights, external_content: "Not included; linked publisher terms apply." },
    data: {
      id: example.id,
      title: example.title,
      summary: example.summary,
      version: example.data.version,
      authority_level: "A2",
      accountable_owner: "Controller, treasurer or accounting policy owner",
      scope: example.jurisdiction,
      source_ids: example.source_ids,
      source_locators: example.data.source_locators,
      authority_boundary: example.data.authority_boundary,
      inputs: ["Executed agreements, source populations, reporting-date facts, valuations, reconciliations, approvals and legal or custody evidence as applicable."],
      procedures: ["Declare entity, framework, period and instrument role.", "Reconcile source populations, calculate the bounded example, preserve exceptions and route consequential conclusions to a human reviewer."],
      controls: ["Source-to-ledger reconciliation", "Independent recalculation", "Rights and ownership review", "No executed actions"],
      examples: example.data.examples,
      limitations: example.data.limitations,
      licenses: { manifest_and_factual_metadata: "CC0-1.0", original_explanatory_content: "CC-BY-4.0", external_sources: "Not redistributed; publisher terms apply" },
    },
  };
}

const corpusFiles = ["source.json", "guide.json", "example.json"];
const corpus = Object.fromEntries(corpusFiles.map((file) => [file, read(`data/corpus/${file}`)]));
const guides = byId(corpus["guide.json"]);
const sourceRecords = byId(corpus["source.json"]);
corpus["source.json"] = corpus["source.json"].filter((record) => !retiredSourceIds.includes(record.id));
for (const source of packet.sources) replaceOrAppend(corpus["source.json"], canonicalSource(source, sourceRecords.get(source.id)));
for (const family of packet.families) {
  const guide = guides.get(`guide-${family.family_id}`);
  assert.ok(guide, `Missing canonical guide for ${family.family_id}`);
  replaceOrAppend(corpus["guide.json"], integrateGuide(guide, family));
}
replaceOrAppend(corpus["example.json"], canonicalExample(packet.example));
for (const file of corpusFiles) write(`data/corpus/${file}`, corpus[file]);

const questionData = read("data/coverage/research-questions.json");
const targetGuideIds = new Set(packet.families.map((family) => `guide-${family.family_id}`));
questionData.questions = questionData.questions.filter((question) => !targetGuideIds.has(question.record_id));
const addedRegistryEntries = [];
for (const family of packet.families) {
  const guide = corpus["guide.json"].find((record) => record.id === `guide-${family.family_id}`);
  guide.data.research_questions.forEach((question, index) => addedRegistryEntries.push(registryEntry(guide, question, index)));
}
const registryInsertionIndex = questionData.questions.findIndex((question) => question.record_id === "guide-q-income-tax");
assert.ok(registryInsertionIndex >= 0, "Research-question registry insertion anchor is missing");
questionData.questions.splice(registryInsertionIndex, 0, ...addedRegistryEntries);
questionData.question_set_version = packet.package_version;
questionData.corpus_version = packet.package_version;
questionData.reviewed_at = packet.reviewed_at;
write("data/coverage/research-questions.json", questionData);

const criteria = read("data/coverage/research-criteria.json");
criteria.population.named_research_questions = questionData.questions.length;
write("data/coverage/research-criteria.json", criteria);

const assessmentData = read("data/coverage/assessments.json");
const assessmentIds = new Set(packet.assessments.map((assessment) => assessment.id));
assessmentData.assessments = assessmentData.assessments.filter((assessment) => !assessmentIds.has(assessment.id));
assessmentData.assessments.push(...packet.assessments.map((assessment) => ({
  ...assessment,
  reviewed_at: packet.reviewed_at,
  reviewer: packet.reviewer,
  scope_kind: "shared-context",
  industry_code: null,
})));
assessmentData.assessment_version = packet.package_version;
write("data/coverage/assessments.json", assessmentData);

const overrides = read("data/coverage/mapping-overrides.json");
const familyIds = packet.families.map((family) => family.family_id);
for (const id of retiredSourceIds) delete overrides.records[id];
for (const family of packet.families) {
  overrides.records[`guide-${family.family_id}`] = mappingOverride([family.family_id], `AA-I121 US-first shared-context review for ${family.title}; inherited IFRS questions remain separate.`);
}
for (const [sourceId, ids] of sourceFamilies) overrides.records[sourceId] = mappingOverride(ids, `AA-I121 official-source review; shared-context only and no industry-specific coverage credit.`);
overrides.records[packet.example.id] = mappingOverride(familyIds, "AA-I121 synthetic example maps to the seven capital-financing families as shared context; it is not professional or production evidence.");
overrides.mapping_version = packet.package_version;
overrides.updated_at = packet.reviewed_at;
write("data/coverage/mapping-overrides.json", overrides);

const catalog = read("data/catalog.json");
catalog.corpus_version = packet.package_version;
catalog.updated_at = packet.reviewed_at;
catalog.coverage_note = mergeText(catalog.coverage_note, "AA-I121 adds a bounded US-first capital and financing layer across debt, equity, share compensation, investments, derivatives, valuation and digital assets, with explicit source periods, rights limits, synthetic cases and an evidence gap for custody ownership.");
catalog.review_note = mergeText(catalog.review_note, "AA-I121 official-source excerpts and Codification locators were integrated on 2026-09-18. The seven inherited guide families retain their IFRS context while adding US questions and source records. No full publisher text, professional sign-off, entity-specific contract review, empirical agent performance or custody ownership conclusion is established.");
write("data/catalog.json", catalog);

console.log(JSON.stringify({
  package_version: packet.package_version,
  sources_added: packet.sources.filter((source) => !sourceRecords.has(source.id)).length,
  sources_reused: packet.sources.filter((source) => sourceRecords.has(source.id)).length,
  guides_updated: packet.families.length,
  named_questions_added: packet.families.reduce((count, family) => count + family.questions.length, 0),
  assessments_added: packet.assessments.length,
  example_id: packet.example.id,
}, null, 2));
