import fs from "node:fs";
import assert from "node:assert/strict";

const read = file => JSON.parse(fs.readFileSync(file, "utf8"));
const write = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n");
const packet = read("data/research/management-accounting-2026-09-17.json");
const integrateIntoNewerCorpus = process.argv.includes("--integrate-into-newer-corpus");
const versionPattern = /^(\d{4}-\d{2}-\d{2})\.(\d+)$/;
const compareVersion = (left, right) => {
  const leftMatch = versionPattern.exec(left), rightMatch = versionPattern.exec(right);
  if (!leftMatch || !rightMatch) throw new Error(`Cannot compare non-canonical version ${left} or ${right}`);
  return leftMatch[1] === rightMatch[1]
    ? Number(leftMatch[2]) - Number(rightMatch[2])
    : leftMatch[1].localeCompare(rightMatch[1]);
};
const assertNotNewerDate = (label, value) => {
  if (value && value > packet.reviewed_at) {
    throw new Error(`Refusing AA-I125 integration: ${label}=${value} is newer than packet review date ${packet.reviewed_at}`);
  }
};
const preserveOrUseVersion = (current, requested) => {
  if (!integrateIntoNewerCorpus || !current) return requested;
  return compareVersion(current, requested) > 0 ? current : requested;
};
const assertNoNewerCanonicalState = () => {
  const states = [
    { file: "data/research/foundations.json", versionField: "question_set_version", dateField: "reviewed_at" },
    { file: "data/coverage/research-questions.json", versionField: "question_set_version", dateField: "reviewed_at" },
    { file: "data/coverage/mapping-overrides.json", versionField: "mapping_version", dateField: "updated_at" },
    { file: "data/coverage/assessments.json", versionField: "assessment_version", dateField: null },
  ];
  for (const state of states) {
    const current = read(state.file);
    const currentVersion = current[state.versionField];
    if (currentVersion && compareVersion(currentVersion, packet.package_version) > 0 && !integrateIntoNewerCorpus) {
      throw new Error(`Refusing AA-I125 integration: ${state.file}.${state.versionField}=${currentVersion} is newer than packet ${packet.package_version}`);
    }
    assertNotNewerDate(`${state.file}.${state.dateField}`, state.dateField && current[state.dateField]);
  }

  const mappingOverrides = read("data/coverage/mapping-overrides.json");
  const mappingIds = new Set([
    ...packet.families.map(family => family.guide_id),
    ...packet.sources.map(source => source.id),
    packet.example.id,
  ]);
  for (const id of mappingIds) assertNotNewerDate(`data/coverage/mapping-overrides.json.records[${id}].reviewed_at`, mappingOverrides.records[id]?.reviewed_at);

  const assessments = read("data/coverage/assessments.json");
  for (const assessment of packet.assessments) {
    const current = assessments.assessments.find(candidate => candidate.id === assessment.id);
    assertNotNewerDate(`data/coverage/assessments.json.assessments[${assessment.id}].reviewed_at`, current?.reviewed_at);
  }

  const guides = read("data/corpus/guide.json");
  for (const family of packet.families) {
    const current = guides.find(candidate => candidate.id === family.guide_id);
    assertNotNewerDate(`data/corpus/guide.json[${family.guide_id}].reviewed_at`, current?.reviewed_at);
  }

  const sources = read("data/corpus/source.json");
  for (const update of packet.sources) {
    const current = sources.find(candidate => candidate.id === update.id);
    if (!current) continue;
    assertNotNewerDate(`data/corpus/source.json[${update.id}].reviewed_at`, current.reviewed_at);
    assertNotNewerDate(`data/corpus/source.json[${update.id}].provenance.source_review_attempted_at`, current.provenance?.source_review_attempted_at);
    assertNotNewerDate(`data/corpus/source.json[${update.id}].data.record_updated_at`, current.data?.record_updated_at);
    assertNotNewerDate(`data/corpus/source.json[${update.id}].data.source_review.reviewed_at`, current.data?.source_review?.reviewed_at);
    const supplemental = current.data?.supplemental_reviews?.find(review => review.batch === packet.issue_id);
    assertNotNewerDate(`data/corpus/source.json[${update.id}].data.supplemental_reviews[${packet.issue_id}].reviewed_at`, supplemental?.reviewed_at);
  }

  const examples = read("data/corpus/example.json");
  const currentExample = examples.find(record => record.id === packet.example.id);
  if (currentExample) {
    assertNotNewerDate(`data/corpus/example.json[${packet.example.id}].reviewed_at`, currentExample.reviewed_at);
    assertNotNewerDate(`data/corpus/example.json[${packet.example.id}].data.editorial_review.reviewed_at`, currentExample.data?.editorial_review?.reviewed_at);
  }
};
assertNoNewerCanonicalState();
const catalog = integrateIntoNewerCorpus ? read("data/catalog.json") : null;
const corpusEdition = integrateIntoNewerCorpus ? catalog.corpus_version : packet.corpus_edition;
if (integrateIntoNewerCorpus) assert.match(corpusEdition, versionPattern, "Integration catalog corpus version must be canonical");
const foundations = read("data/research/foundations.json");
const addUnique = (left = [], right = []) => [...new Set([...left, ...right])];
const byId = (records, id) => {
  const record = records.find(candidate => candidate.id === id);
  assert.ok(record, `Missing canonical record ${id}`);
  return record;
};

const sourceReview = (source, update) => ({
  record_id: source.id,
  disposition: "supported-scope",
  review_level: "substantive-excerpt",
  checked_url: update.checked_url,
  source_locator: update.source_locator,
  publication_or_edition: update.publication_or_edition,
  effective_period: update.effective_period,
  evidence_summary: update.evidence_summary,
  limitations: update.limitations,
  checks: [{
    url: update.checked_url,
    method: "web.open",
    outcome: update.check_outcome,
    material_read: true,
  }],
  rights_review: {
    status: "unresolved",
    license: null,
    license_url: null,
    scope: null,
    note: "Public accessibility does not establish reuse permission; external content remains under publisher terms.",
  },
  question_ids: update.question_ids,
  industry_scope: "shared-context",
  industry_codes: [],
  mapping_rationale: update.mapping_rationale,
  reviewed_at: packet.reviewed_at,
  reviewer: "Codex AI-assisted original-source review",
  previous_review: source.data?.source_review?.previous_review || {
    review_status: source.review_status,
    reviewed_at: source.reviewed_at,
  },
});

const supplementalReview = update => ({
  batch: packet.issue_id,
  reviewed_at: packet.reviewed_at,
  review_level: "substantive-excerpt",
  checked_url: update.checked_url,
  locator: update.source_locator,
  publication_or_edition: update.publication_or_edition,
  effective_period: update.effective_period,
  evidence_summary: update.evidence_summary,
  limitations: update.limitations,
  checks: [{
    url: update.checked_url,
    method: "live page read",
    outcome: update.check_outcome,
    material_read: true,
  }],
  rights_review: {
    status: "unresolved",
    license: null,
    license_url: null,
    scope: null,
    note: "Public accessibility does not establish reuse permission; external content remains under publisher terms.",
  },
});

const replaceSupplementalReview = (reviews, incoming) => {
  const index = reviews.findIndex(review => review.batch === incoming.batch);
  if (index === -1) return [...reviews, incoming];
  return reviews.map((review, position) => position === index ? incoming : review);
};

const foundationSupplementalReview = update => {
  const foundation = foundations.sources?.find(source => source.id === update.id);
  if (!foundation) return null;
  return {
    batch: "foundations",
    reviewed_at: foundations.reviewed_at,
    review_level: foundation.review_level,
    checked_url: foundation.source_url,
    locator: foundation.source_locator,
    publication_or_edition: foundation.publication_or_edition,
    effective_period: foundation.effective_period,
    evidence_summary: foundation.evidence_summary,
    limitations: foundation.limitations,
    checks: foundation.checks,
    rights_review: foundation.rights_review,
  };
};

const applySource = (source, update) => {
  source.summary = update.summary;
  source.review_status = "source-checked";
  source.reviewed_at = packet.reviewed_at;
  source.provenance = {
    ...source.provenance,
    reviewer: "Codex AI-assisted original-source review",
    review_scope: update.review_scope,
    outcome: "supported-scope-within-declared-limits",
    source_review_attempted_at: packet.reviewed_at,
    source_review_evidence_pointer: "/data/source_review",
    note: "Original bounded synthesis of the cited public material; not professional review or a license to external content.",
  };
  source.rights = {
    ...source.rights,
    full_text_stored: false,
    source_status: "unknown",
    source_license: null,
    source_license_url: null,
    source_permission_scope: null,
  };
  source.data = {
    ...source.data,
    record_updated_at: packet.reviewed_at,
    published_or_status: update.publication_or_edition,
    access: update.access,
    summary: update.summary,
    frameworks: update.frameworks,
    source_license: "unknown",
    source_license_url: null,
    source_rights: {
      ...(source.data.source_rights || {}),
      status: "unknown",
      license_id: null,
      license_url: null,
      full_text_stored: false,
      permission_scope: null,
      notes: "Check the publisher's current terms. Access status does not establish reuse permission.",
    },
    canonical_source_url: update.checked_url,
    source_review: sourceReview(source, update),
    limitations: update.limitations,
  };
  source.data.supplemental_reviews = replaceSupplementalReview(
    source.data.supplemental_reviews || [],
    supplementalReview(update),
  );
};

const newSource = update => {
  const source = {
    id: update.id,
    kind: "source",
    title: update.title,
    summary: update.summary,
    topics: ["Accounting and reporting", "Law and policy"],
    industries: [],
    jurisdiction: update.jurisdiction,
    source_type: update.source_type,
    publisher: update.publisher,
    source_url: update.source_url,
    source_ids: [],
    related_ids: ["src_cfr200grants"],
    review_status: "source-checked",
    reviewed_at: packet.reviewed_at,
    provenance: {
      added_on: packet.reviewed_at,
      reviewer: "Codex AI-assisted original-source review",
      review_scope: update.review_scope,
      outcome: "supported-scope-within-declared-limits",
      source_review_attempted_at: packet.reviewed_at,
      source_review_evidence_pointer: "/data/source_review",
      note: "Original bounded synthesis of the cited public material; not professional review or a license to external content.",
    },
    rights: {
      metadata: "CC0-1.0",
      content: "CC-BY-4.0",
      external_content: "Not included; publisher terms apply",
      full_text_stored: false,
      source_status: "unknown",
      source_license: null,
      source_license_url: null,
      source_permission_scope: null,
    },
    data: {
      id: update.id,
      record_version: "1",
      record_updated_at: packet.reviewed_at,
      topic: "Accounting and reporting",
      source_type: update.source_type,
      owner: update.publisher,
      title: update.title,
      published_or_status: update.publication_or_edition,
      jurisdiction: update.jurisdiction,
      access: update.access,
      summary: update.summary,
      curation: {
        applicability: [],
        applicability_note: "US federal procurement contracts only when the covered contract facts apply.",
        temporal_role: "current",
        lifecycle: "current",
        publication_status: update.publication_or_edition,
        method: update.review_scope,
        transfer_limit: "Federal-contract cost allocation scope; not ordinary internal management reporting or a general US GAAP conclusion.",
        commercial_interest: "none identified",
        source_updated_at: "2026-03-13",
        next_review_at: null,
        profile_status: "curated",
      },
      relationship_profile: null,
      source_license: "unknown",
      source_license_url: null,
      source_rights: {
        status: "unknown",
        license_id: null,
        license_url: null,
        full_text_stored: false,
        permission_scope: null,
        notes: "Check the publisher's current terms. Access status does not establish reuse permission.",
      },
      metadata_rights: {
        license_id: "CC0-1.0",
        license_url: "https://creativecommons.org/publicdomain/zero/1.0/",
        applies_to: "project-created factual catalog metadata",
      },
      annotation_rights: {
        creator: "Accounting Agents contributors",
        license_id: "CC-BY-4.0",
        license_url: "https://creativecommons.org/licenses/by/4.0/",
        applies_to: "original editorial summary and annotation",
      },
      canonical_source_url: update.source_url,
      source_review: sourceReview({ id: update.id, review_status: "source-checked", reviewed_at: packet.reviewed_at, data: {} }, update),
      limitations: update.limitations,
      frameworks: update.frameworks,
      supplemental_reviews: [
        supplementalReview(update),
        foundationSupplementalReview(update),
      ].filter(Boolean),
    },
  };
  return source;
};

const enrichedQuestion = question => ({
  ...question,
  assessment: {
    ...(question.assessment || {}),
    basis: "Presence of the selected source, inputs, workflow, controls, and original synthetic material within the declared scope. Partial does not establish accounting correctness, professional review, empirical support, or external applicability.",
    professional_review: "not-performed",
    empirical_support: "not-established",
  },
});

const applyFamily = (guide, family) => {
  const currentGuideVersion = guide.data?.version;
  if (
    integrateIntoNewerCorpus &&
    currentGuideVersion &&
    versionPattern.test(currentGuideVersion) &&
    compareVersion(currentGuideVersion, packet.package_version) >= 0
  ) {
    // A newer-corpus replay must not replace an already-current guide snapshot
    // with the older family payload carried by this packet. Other packet-owned
    // records, including a genuinely absent source, are still integrated below.
    return false;
  }
  const questions = family.research_questions.map(enrichedQuestion);
  guide.title = family.title;
  guide.summary = family.summary;
  guide.jurisdiction = `${family.jurisdictions.join("; ")}; selected role, framework, period, and population are declared in data.scope`;
  guide.source_ids = [...family.source_ids];
  guide.review_status = "editorially-reviewed";
  guide.reviewed_at = packet.reviewed_at;
  guide.provenance = {
    ...guide.provenance,
    reviewer: "Codex AI-assisted original-source and synthetic-fixture review",
    note: "Original bounded synthesis and clearly labeled original synthetic example. Listed source access, effective-period, rights, professional-review, and production-evidence limits constrain every answer.",
    research_file: "data/research/foundations.json",
    issue_id: packet.issue_id,
    package_version: packet.package_version,
  };
  guide.data = {
    ...guide.data,
    family_id: family.family_id,
    title: family.title,
    scope: family.scope,
    review_basis: family.review_basis,
    source_ids: [...family.source_ids],
    source_locators: family.source_locators,
    source_checks: family.source_checks,
    shared_inputs: family.shared_inputs,
    controls: family.controls,
    exceptions: family.exceptions,
    coverage_gaps: family.coverage_gaps,
    frameworks: family.frameworks,
    jurisdictions: family.jurisdictions,
    professional_review: "not-performed",
    empirical_support: "not-established",
    remaining_limits: family.remaining_limits,
    workflows: family.workflows,
    worked_examples: family.worked_examples,
    question_inventory: family.question_inventory,
    research_questions: questions,
    issue_id: packet.issue_id,
    package_version: packet.package_version,
    selected_scope: packet.selected_scope,
    editorial_brief: family.editorial_brief,
  };
  return true;
};

const canonicalSources = read("data/corpus/source.json");
for (const update of packet.sources) {
  if (update.new) {
    const existing = canonicalSources.find(source => source.id === update.id);
    if (existing) {
      assert.equal(existing.source_url, update.source_url, `${update.id}: existing source URL differs`);
      applySource(existing, update);
    } else {
      canonicalSources.push(newSource(update));
    }
  } else {
    applySource(byId(canonicalSources, update.id), update);
  }
}

const canonicalGuides = read("data/corpus/guide.json");
const appliedFamilyIds = new Set();
for (const family of packet.families) {
  if (applyFamily(byId(canonicalGuides, family.guide_id), family)) appliedFamilyIds.add(family.family_id);
}

const exampleRecords = read("data/corpus/example.json");
const existingExample = exampleRecords.find(record => record.id === packet.example.id);
if (existingExample) {
  assert.ok(existingExample.provenance?.issue_id === packet.issue_id, "Refusing to replace an unrelated example with the same ID");
  Object.assign(existingExample, packet.example);
} else {
  exampleRecords.push(packet.example);
}

foundations.question_set_version = preserveOrUseVersion(foundations.question_set_version, packet.package_version);
foundations.reviewed_at = packet.reviewed_at;
foundations.reviewer = "Codex AI-assisted original-source and synthetic-fixture review";
for (const family of packet.families) {
  if (!appliedFamilyIds.has(family.family_id)) continue;
  const input = foundations.families.find(candidate => candidate.family_id === family.family_id);
  assert.ok(input, `Missing research input family ${family.family_id}`);
  input.title = family.title;
  input.scope = family.scope;
  input.review_basis = family.review_basis;
  input.source_ids = [...family.source_ids];
  input.source_locators = family.source_locators;
  input.source_checks = family.source_checks;
  input.frameworks = family.frameworks;
  input.jurisdictions = family.jurisdictions;
  input.shared_inputs = family.shared_inputs;
  input.controls = family.controls;
  input.exceptions = family.exceptions;
  input.coverage_gaps = family.coverage_gaps;
  input.remaining_limits = family.remaining_limits;
  input.questions = family.research_questions.map(enrichedQuestion);
}
const far = packet.sources.find(source => source.id === "src_far_31203_indirect_costs");
if (far && !foundations.sources.some(source => source.id === far.id)) {
  foundations.sources.push({
    id: far.id,
    title: far.title,
    source_url: far.source_url,
    publisher: far.publisher,
    source_type: far.source_type,
    jurisdiction: far.jurisdiction,
    evidence_summary: far.evidence_summary,
    review_level: "substantive-excerpt",
    source_locator: far.source_locator,
    publication_or_edition: far.publication_or_edition,
    effective_period: far.effective_period,
    frameworks: far.frameworks,
    limitations: far.limitations,
    checks: [{ url: far.checked_url, method: "web.open", outcome: far.check_outcome, material_read: true }],
    rights_review: { status: "unresolved", note: "Public access does not establish reuse permission." },
  });
}
foundations.integration_scope = {
  issue_id: packet.issue_id,
  family_ids: packet.families.map(family => family.family_id),
  source_ids: packet.sources.map(source => source.id),
  note: "Only the listed packet families and sources were refreshed by this integration. Generic package replay must preserve review state for all other foundation records.",
};

const researchQuestions = read("data/coverage/research-questions.json");
researchQuestions.question_set_version = preserveOrUseVersion(researchQuestions.question_set_version, packet.package_version);
researchQuestions.corpus_version = corpusEdition;
researchQuestions.reviewed_at = packet.reviewed_at;
for (const family of packet.families) {
  if (!appliedFamilyIds.has(family.family_id)) continue;
  const guide = byId(canonicalGuides, family.guide_id);
  for (const [index, question] of guide.data.research_questions.entries()) {
    const row = byId(researchQuestions.questions, question.id);
    row.record_id = guide.id;
    row.pointer = `/data/research_questions/${index}`;
    row.question = question.question;
    row.scope = question.scope;
    row.answer_status = question.answer_status;
    row.assessment_status = question.assessment.status;
    row.source_ids = [...question.source_ids];
    row.remaining_gaps = [...question.remaining_gaps];
    row.professional_review = "not-performed";
    row.empirical_support = "not-established";
    row.dimensions = question.assessment.dimensions;
    row.dimension_basis = question.assessment.basis;
  }
}

const mappingOverrides = read("data/coverage/mapping-overrides.json");
mappingOverrides.mapping_version = preserveOrUseVersion(mappingOverrides.mapping_version, packet.package_version);
mappingOverrides.updated_at = packet.reviewed_at;
for (const family of packet.families) {
  const current = mappingOverrides.records[family.guide_id] || {};
  mappingOverrides.records[family.guide_id] = {
    ...current,
    replace_question_ids: true,
    question_ids: [family.family_id],
    industry_codes: [],
    industry_scope: "shared-context",
    basis_field: "/data/research_questions",
    reason: "The explicitly scoped US research questions, source locators, and original synthetic fixture support discovery associations only. Detailed-industry adequacy is separately assessed.",
    reviewed_question_ids: [family.family_id],
    reviewed_industry_codes: [],
    reviewed_at: packet.reviewed_at,
    review_note: "AA-I125 scope review covers the selected US role and named questions only; it does not confer family-wide adequacy, professional verification, or descendant-industry conclusions.",
  };
}
const cfrUpdate = packet.sources.find(source => source.id === "src_cfr200grants");
const cfrOverride = mappingOverrides.records.src_cfr200grants || {};
mappingOverrides.records.src_cfr200grants = {
  ...cfrOverride,
  replace_question_ids: true,
  question_ids: addUnique(cfrOverride.question_ids, cfrUpdate.question_ids),
  reviewed_question_ids: addUnique(cfrOverride.reviewed_question_ids, cfrUpdate.question_ids),
  reviewed_at: packet.reviewed_at,
  review_note: `${cfrUpdate.mapping_rationale} Association review covers AA-I125 source locators only; no accounting adequacy is inferred.`,
  reason: cfrUpdate.mapping_rationale,
  basis_field: "/data/source_review/mapping_rationale",
};
const sabUpdate = packet.sources.find(source => source.id === "src_secsab0099");
const sabOverride = mappingOverrides.records.src_secsab0099 || {};
mappingOverrides.records.src_secsab0099 = {
  ...sabOverride,
  question_ids: addUnique(sabOverride.question_ids, sabUpdate.question_ids),
  reviewed_question_ids: addUnique(sabOverride.reviewed_question_ids, sabUpdate.question_ids),
  reviewed_at: packet.reviewed_at,
  review_note: `${sabUpdate.mapping_rationale} Association review covers AA-I125 source locators only; no accounting adequacy is inferred.`,
};
const farOverride = mappingOverrides.records.src_far_31203_indirect_costs || {};
mappingOverrides.records.src_far_31203_indirect_costs = {
  ...farOverride,
  replace_question_ids: true,
  question_ids: far.question_ids,
  industry_codes: [],
  industry_scope: "shared-context",
  basis_field: "/data/source_review/mapping_rationale",
  reason: far.mapping_rationale,
  reviewed_question_ids: far.question_ids,
  reviewed_industry_codes: [],
  reviewed_at: packet.reviewed_at,
  review_note: `${far.mapping_rationale} Association review covers the cited FAR paragraphs only; no accounting adequacy is inferred.`,
};
mappingOverrides.records[packet.example.id] = {
  replace_question_ids: true,
  question_ids: ["q-cost-allocation", "q-planning", "q-performance"],
  industry_codes: ["31-33"],
  industry_scope: "specific",
  basis_field: "/data/editorial_review",
  reason: "Original synthetic selected-role fixture explicitly names the US manufacturing role and three shared families; this is discovery context, not industry-wide accounting sufficiency.",
  reviewed_question_ids: ["q-cost-allocation", "q-planning", "q-performance"],
  reviewed_industry_codes: ["31-33"],
  reviewed_at: packet.reviewed_at,
  review_note: "AA-I125 synthetic fixture is scoped to one role and one period. It does not establish a conclusion for manufacturing descendants or real entities.",
};

const assessments = read("data/coverage/assessments.json");
assessments.assessment_version = preserveOrUseVersion(assessments.assessment_version, packet.package_version);
for (const assessment of packet.assessments) {
  const existing = assessments.assessments.find(candidate => candidate.id === assessment.id);
  const value = {
    ...assessment,
    reviewed_at: packet.reviewed_at,
    reviewer: "Codex AI-assisted original-source and synthetic-fixture review",
  };
  if (existing) Object.assign(existing, value);
  else assessments.assessments.push(value);
}
const packetAssessmentIds = new Set(packet.assessments.map(assessment => assessment.id));
const packetAssessments = assessments.assessments.filter(assessment => packetAssessmentIds.has(assessment.id));
const retainedAssessments = assessments.assessments.filter(assessment => !packetAssessmentIds.has(assessment.id));
const constructionLocalIndex = retainedAssessments.findIndex(assessment => assessment.id === "coverage-construction-local-2026-09-14");
if (constructionLocalIndex === -1) retainedAssessments.push(...packetAssessments);
else retainedAssessments.splice(constructionLocalIndex, 0, ...packetAssessments);
assessments.assessments = retainedAssessments;

const fixtures = read("data/research-questions.json");
for (const fixture of packet.retrieval_fixtures) {
  const existing = fixtures.find(candidate => candidate.id === fixture.id);
  if (existing) Object.assign(existing, fixture);
  else fixtures.push(fixture);
}

write("data/corpus/source.json", canonicalSources);
write("data/corpus/guide.json", canonicalGuides);
write("data/corpus/example.json", exampleRecords);
write("data/research/foundations.json", foundations);
write("data/coverage/research-questions.json", researchQuestions);
write("data/coverage/mapping-overrides.json", mappingOverrides);
write("data/coverage/assessments.json", assessments);
write("data/research-questions.json", fixtures);
console.log(JSON.stringify({
  issue: packet.issue_id,
  package_version: packet.package_version,
  updated_guides: packet.families.map(family => family.guide_id),
  added_or_updated_sources: packet.sources.map(source => source.id),
  example: packet.example.id,
  assessments: packet.assessments.map(assessment => assessment.id),
  retrieval_fixtures: packet.retrieval_fixtures.map(fixture => fixture.id),
}, null, 2));
