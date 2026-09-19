import fs from "node:fs";
import assert from "node:assert/strict";

const packetFile = "data/research/capital-financing-2026-09-18.json";
const packet = JSON.parse(fs.readFileSync(packetFile, "utf8"));
const read = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const outputs = new Map();
const write = (file, value) => {
  const original = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  let body = JSON.stringify(value, null, 2) + "\n";
  if (!/[^\x00-\x7f]/.test(original) && /\\u[0-9a-f]{4}/i.test(original)) {
    body = body.replace(/[\u007f-\uFFFF]/g, character => `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`);
  }
  outputs.set(file, body);
};
const unique = (values) => [...new Set(values)];
const byId = (records) => new Map(records.map((record) => [record.id, record]));
const mergeText = (existing, addition) => existing.includes(addition) ? existing : `${existing} ${addition}`;
const replaceOrAppend = (records, record) => {
  const index = records.findIndex((candidate) => candidate.id === record.id);
  if (index === -1) records.push(record);
  else records[index] = record;
};

const appendOwned = (records, record) => {
  const existing = records.find(candidate => candidate.id === record.id);
  if (existing) assert.deepEqual(existing, record, `Conflicting owned ID ${record.id}; review before replacement`);
  else records.push(record);
};
const reusedSourceIds = new Set(["src_asu202308", "src_secsab122"]);
const currentCatalog = read("data/catalog.json");
const currentIntegration = process.argv.includes("--current");
const version = currentIntegration ? "2026-09-19.12409" : packet.package_version;
assert.ok((currentIntegration ? ["2026-09-19.12406", version] : ["2026-09-18.1", version]).includes(currentCatalog.corpus_version), "Refuse an unrecognized capital integration edition before writes");
const integrationDate = [currentCatalog.updated_at, packet.reviewed_at].filter(Boolean).sort().at(-1);
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
for (const family of packet.families) {
  for (const sourceId of family.source_ids) {
    const families = sourceFamilies.get(sourceId) || [];
    families.push(family.family_id);
    sourceFamilies.set(sourceId, families);
  }
}

function canonicalSource(source, existing = null) {
  const reviewDate = source.reviewed_at || packet.reviewed_at;
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
    checks: source.checks.map((check) => ({ ...check, url: check.url || source.source_url, checked_at: check.checked_at || reviewDate })),
    rights_review: source.rights_review,
    question_ids: familyIds,
    industry_scope: "shared-context",
    industry_codes: [],
    mapping_rationale: `AA-I121 source review for ${familyIds.join(", ") || "shared capital-financing context"}; no industry-specific coverage credit.`,
    reviewed_at: reviewDate,
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
    reviewed_at: reviewDate,
    provenance: {
      added_on: reviewDate,
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
      record_updated_at: reviewDate,
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
      effective_period_sources: source.effective_period_sources || [],
      limitations,
      supplemental_reviews: [{
        batch: "AA-I121",
        reviewed_at: reviewDate,
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
  if (reusedSourceIds.has(source.id)) {
    assert.equal(existing?.source_url, source.source_url, `Reused source document mismatch: ${source.id}`);
    const retained = structuredClone(existing);
    const review = { batch: "AA-I121", ...sourceReview };
    const reviews = retained.data.supplemental_reviews ||= [];
    const prior = reviews.find(item => item.batch === "AA-I121");
    if (prior) assert.deepEqual(prior, review, `Conflicting supplemental source review: ${source.id}`);
    else reviews.push(review);
    return retained;
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
  const next = structuredClone(guide);
  const questions = next.data.research_questions ||= [];
  for (const question of family.questions.map(canonicalQuestion)) appendOwned(questions, question);
  next.source_ids = mergeArray(next.source_ids, family.source_ids);
  next.related_ids = mergeArray(next.related_ids, [packet.example.id]);
  next.topics = mergeArray(next.topics, ["US GAAP capital and financing"]);
  next.data.source_ids = mergeArray(next.data.source_ids, family.source_ids);
  next.data.supplemental_research_files = mergeArray(next.data.supplemental_research_files, [packetFile]);
  const review = {
    batch: "AA-I121", reviewed_at: packet.reviewed_at, reviewer: packet.reviewer,
    package_version: packet.package_version, research_file: packetFile,
    scope: family.scope, framework: packet.scope.framework,
    professional_review: "not-performed", empirical_support: "not-established",
  };
  const reviews = next.data.supplemental_reviews ||= [];
  const prior = reviews.find(item => item.batch === "AA-I121");
  if (prior) assert.deepEqual(prior, review, `Conflicting guide review: ${guide.id}`);
  else reviews.push(review);
  const layer = {
    scope: family.scope, source_locators: family.source_locators,
    shared_inputs: family.shared_inputs, controls: family.controls,
    exceptions: family.exceptions, coverage_gaps: family.coverage_gaps,
    frameworks: family.frameworks, selected_scope: packet.scope,
    named_question_ids: family.questions.map(question => question.id),
  };
  if (next.data.us_capital_financing) assert.deepEqual(next.data.us_capital_financing, layer, `Conflicting capital layer: ${guide.id}`);
  else next.data.us_capital_financing = layer;
  return next;
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

function mappingOverride(id, questionIds, note) {
  const existing = overrides.records[id] || {};
  const next = { ...existing };
  if (newRecordIds.has(id)) {
    next.industry_scope ??= "shared-context";
    next.industry_codes ??= [];
  }
  next.replace_question_ids ??= false;
  next.question_ids = unique([...(existing.question_ids || []), ...questionIds]);
  next.reviewed_question_ids = unique([...(existing.reviewed_question_ids || []), ...questionIds]);
  next.basis_field ??= "/data";
  next.reason = mergeText(existing.reason || "", note).trim();
  next.reviewed_at = [existing.reviewed_at, packet.reviewed_at].filter(Boolean).sort().at(-1);
  next.review_note = mergeText(existing.review_note || "", note).trim();
  return next;
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
const newRecordIds = new Set([...packet.sources.filter(source => !reusedSourceIds.has(source.id)).map(source => source.id), packet.example.id]);
for (const source of packet.sources) {
  assert.ok(corpus["source.json"].every(record => record.source_url !== source.source_url || record.id === source.id), `Duplicate publisher document: ${source.source_url}`);
  const candidate = canonicalSource(source, sourceRecords.get(source.id));
  if (reusedSourceIds.has(source.id)) replaceOrAppend(corpus["source.json"], candidate);
  else appendOwned(corpus["source.json"], candidate);
}
for (const family of packet.families) {
  const guide = guides.get(`guide-${family.family_id}`);
  assert.ok(guide, `Missing canonical guide for ${family.family_id}`);
  replaceOrAppend(corpus["guide.json"], integrateGuide(guide, family));
}
appendOwned(corpus["example.json"], canonicalExample(packet.example));
for (const file of corpusFiles) write(`data/corpus/${file}`, corpus[file]);

const questionData = read("data/coverage/research-questions.json");
for (const family of packet.families) {
  const guide = corpus["guide.json"].find(record => record.id === `guide-${family.family_id}`);
  for (const selected of family.questions) {
    const index = guide.data.research_questions.findIndex(question => question.id === selected.id);
    appendOwned(questionData.questions, registryEntry(guide, guide.data.research_questions[index], index));
  }
}
questionData.question_set_version = version;
questionData.corpus_version = version;
questionData.reviewed_at = [questionData.reviewed_at, packet.reviewed_at].filter(Boolean).sort().at(-1);
write("data/coverage/research-questions.json", questionData);

const criteria = read("data/coverage/research-criteria.json");
criteria.population.named_research_questions = questionData.questions.length;
write("data/coverage/research-criteria.json", criteria);

const assessmentData = read("data/coverage/assessments.json");
for (const assessment of packet.assessments) appendOwned(assessmentData.assessments, {
  ...assessment, reviewed_at: packet.reviewed_at, reviewer: packet.reviewer,
  scope_kind: "shared-context", industry_code: null,
});
assessmentData.assessment_version = version;
write("data/coverage/assessments.json", assessmentData);

const overrides = read("data/coverage/mapping-overrides.json");
const familyIds = packet.families.map((family) => family.family_id);
for (const family of packet.families) {
  overrides.records[`guide-${family.family_id}`] = mappingOverride(`guide-${family.family_id}`, [family.family_id], `AA-I121 US-first shared-context review for ${family.title}; inherited IFRS questions remain separate.`);
}
for (const [sourceId, ids] of sourceFamilies) overrides.records[sourceId] = mappingOverride(sourceId, ids, `AA-I121 official-source review; shared-context only and no industry-specific coverage credit.`);
overrides.records[packet.example.id] = mappingOverride(packet.example.id, familyIds, "AA-I121 synthetic example maps to the seven capital-financing families as shared context; it is not professional or production evidence.");
overrides.mapping_version = version;
overrides.updated_at = [overrides.updated_at, packet.reviewed_at].filter(Boolean).sort().at(-1);
write("data/coverage/mapping-overrides.json", overrides);

const catalog = read("data/catalog.json");
catalog.corpus_version = version;
catalog.updated_at = integrationDate;
catalog.coverage_note = mergeText(catalog.coverage_note, `Edition${version} adds a bounded US-first capital and financing layer across debt, equity, share compensation, investments, derivatives, valuation and digital assets, with explicit source periods, rights limits, synthetic cases and an evidence gap for custody ownership.`);
catalog.review_note = mergeText(catalog.review_note, `Edition${version}: AA-I121 official-source excerpts and Codification locators retain their 2026-09-18 research date; this edition integrates them after the accepted tax corpus. The seven inherited guide families retain their IFRS context while adding US questions and source records. No full publisher text, professional sign-off, entity-specific contract review, empirical agent performance or custody ownership conclusion is established.`);
write("data/catalog.json", catalog);
for (const file of ["data/coverage/subsector-profiles.json", "data/coverage/subsector-screening.json"]) {
  const value = read(file); value.corpus_version = version; write(file, value);
}
// All assertions and proposed outputs complete before any canonical file write.
for (const [file, body] of outputs) if (fs.readFileSync(file, "utf8") !== body) fs.writeFileSync(file, body);

console.log(JSON.stringify({
  package_version: packet.package_version,
  sources_added: packet.sources.filter((source) => !sourceRecords.has(source.id)).length,
  sources_reused: packet.sources.filter((source) => sourceRecords.has(source.id)).length,
  guides_updated: packet.families.length,
  named_questions_added: packet.families.reduce((count, family) => count + family.questions.length, 0),
  assessments_added: packet.assessments.length,
  example_id: packet.example.id,
}, null, 2));
