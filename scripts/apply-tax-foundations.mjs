import fs from "node:fs";
import assert from "node:assert/strict";
import path from "node:path";

const root = path.resolve(process.env.TAX_FOUNDATIONS_ROOT || ".");
const read = (file) => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
const write = (file, value) => fs.writeFileSync(path.join(root, file), JSON.stringify(value, null, 2) + "\n");
const unique = (values = []) => [...new Set(values)];
const union = (...values) => unique(values.flatMap((value) => Array.isArray(value) ? value : []));
const uniqueObjects = (...values) => {
  const result = [];
  const seen = new Set();
  for (const value of values.flatMap((items) => Array.isArray(items) ? items : [])) {
    const key = JSON.stringify(value);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(value);
    }
  }
  return result;
};
const clone = (value) => structuredClone(value);
const versionPattern = /^(\d{4}-\d{2}-\d{2})\.(\d+)$/;
const compareVersion = (left, right) => {
  const a = versionPattern.exec(left || ""), b = versionPattern.exec(right || "");
  if (!a || !b) throw new Error(`Cannot compare non-canonical versions ${left} and ${right}`);
  return a[1] === b[1] ? Number(a[2]) - Number(b[2]) : a[1].localeCompare(b[1]);
};
const maxVersion = (current, incoming) => !current || compareVersion(current, incoming) < 0 ? incoming : current;
const maxDate = (current, incoming) => current && current > incoming ? current : incoming;
const hasOwn = (object, key) => Object.hasOwn(object || {}, key);
const pointerValue = (record, pointer) => pointer.replace(/^\//, "").split("/").filter(Boolean).reduce((value, key) => value?.[key.replaceAll("~1", "/").replaceAll("~0", "~")], record);

const packet = read("data/research/tax-foundations-2026-09-18.json");
const exampleData = read("data/research/tax-foundations-example-2026-09-18.json");
const inventoryData = read(packet.inventory_file);
const date = packet.reviewed_at;
const integrateIntoNewerCorpus = process.argv.includes("--integrate-into-newer-corpus");

assert.equal(inventoryData.package_id, packet.package_id, "Inventory package mismatch");
assert.equal(inventoryData.issue_id, packet.issue_id, "Inventory issue mismatch");
assert.equal(inventoryData.reviewed_at, date, "Inventory review date mismatch");
assert.match(packet.version, versionPattern);
assert.match(packet.corpus_edition, versionPattern);
assert.equal(new Set(packet.sources.map((source) => source.id)).size, packet.sources.length, "Duplicate package source ID");
assert.equal(new Set(packet.families.map((family) => family.family_id)).size, packet.families.length, "Duplicate package family ID");
assert.equal(exampleData.id, "example-us-tax-foundations-boundary", "Unexpected example ID");

const catalog = read("data/catalog.json");
const sources = read("data/corpus/source.json");
const guides = read("data/corpus/guide.json");
const examples = read("data/corpus/example.json");
const registry = read("data/coverage/research-questions.json");
const criteria = read("data/coverage/research-criteria.json");
const assessments = read("data/coverage/assessments.json");
const overrides = read("data/coverage/mapping-overrides.json");
const fixtures = read("data/research-questions.json");
const foundations = read("data/research/foundations.json");
const subsectorProfiles = read("data/coverage/subsector-profiles.json");
const subsectorScreening = read("data/coverage/subsector-screening.json");
const genericReplayVersion = foundations.integration_scope?.replay_version || foundations.question_set_version;
const genericReplayCorpusVersion = foundations.integration_scope?.replay_corpus_version || foundations.corpus_version;

for (const [label, value] of [
  ["catalog corpus version", catalog.corpus_version],
  ["foundation question-set version", foundations.question_set_version],
  ["question registry version", registry.question_set_version],
  ["assessment version", assessments.assessment_version],
  ["mapping version", overrides.mapping_version],
]) {
  assert.match(value, versionPattern, `${label} missing canonical version`);
  if (!integrateIntoNewerCorpus && compareVersion(value, packet.version) > 0)
    throw new Error(`${label} ${value} is newer than package ${packet.version}; use --integrate-into-newer-corpus after review`);
}
if (!integrateIntoNewerCorpus && registry.reviewed_at > date)
  throw new Error(`Question registry review date ${registry.reviewed_at} is newer than package ${date}`);
if (!integrateIntoNewerCorpus && overrides.updated_at > date)
  throw new Error(`Mapping review date ${overrides.updated_at} is newer than package ${date}`);

const packageSourceIds = new Set(packet.sources.map((source) => source.id));
const sourceQuestionIds = new Map();
for (const family of packet.families) {
  for (const sourceId of family.question.source_ids) {
    const ids = sourceQuestionIds.get(sourceId) || [];
    if (!ids.includes(family.family_id)) ids.push(family.family_id);
    sourceQuestionIds.set(sourceId, ids);
  }
}

const sourceRights = {
  metadata: "CC0-1.0",
  content: "CC-BY-4.0",
  external_content: "Publisher text is not included; publisher terms apply.",
  full_text_stored: false,
  source_status: "unknown",
  source_license: null,
  source_license_url: null,
  source_permission_scope: null,
};
const projectRights = {
  metadata: "CC0-1.0",
  content: "CC-BY-4.0",
  external_content: "External text is not included; source terms and unresolved permissions remain separate.",
  full_text_stored: false,
};
const mappingRationale = "Exact named AA-I122 tax questions cite this source within a bounded US scope; the association supports discovery only and does not establish tax adequacy, industry coverage, filing authority, or professional verification.";
const mappingReviewNote = "AA-I122 source association reviewed for the bounded US tax package; shared context only, with no industry descendant or sufficiency credit.";

const sourceRecord = (source) => {
  const questionIds = sourceQuestionIds.get(source.id) || [];
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
    limitations: source.limitations,
    checks: source.checks,
    corrections: {},
    rights_review: source.rights_review,
    question_ids: questionIds,
    industry_scope: "shared-context",
    industry_codes: [],
    mapping_rationale: source.mapping_rationale,
    reviewed_at: date,
    reviewer: packet.reviewer,
  };
  return {
    id: source.id,
    kind: "source",
    title: source.title,
    summary: source.summary,
    topics: ["Accounting and reporting", "Law and policy"],
    industries: [],
    jurisdiction: source.jurisdiction,
    source_type: source.source_type,
    publisher: source.publisher,
    source_url: source.source_url,
    source_ids: [],
    related_ids: [],
    review_status: "source-checked",
    reviewed_at: date,
    provenance: {
      added_on: date,
      reviewer: packet.reviewer,
      scope: source.source_locator,
      evidence_urls: [source.source_url],
      aa_i122: {
        issue_id: packet.issue_id,
        package_version: packet.version,
        reviewed_at: date,
        review_level: source.review_level,
      },
      note: "Bounded public material was inspected and summarized originally. This is not complete current authority access, professional review, or a license to external content.",
    },
    rights: clone(sourceRights),
    data: {
      id: source.id,
      record_version: "1",
      record_updated_at: date,
      topic: "Accounting and reporting",
      source_type: source.source_type,
      owner: source.publisher,
      title: source.title,
      published_or_status: source.publication_or_edition,
      jurisdiction: source.jurisdiction,
      access: "Open public source; source terms and automated-access limits remain unresolved",
      summary: source.summary,
      frameworks: source.frameworks,
      edition: source.publication_or_edition,
      effective_period: source.effective_period,
      source_locators: [{ url: source.source_url, locator: source.source_locator }],
      source_review: sourceReview,
      limitations: source.limitations,
      source_license: "unknown",
      source_license_url: null,
      source_rights: {
        status: source.rights_review.status,
        license_id: null,
        license_url: null,
        full_text_stored: false,
        permission_scope: source.rights_review.scope,
        notes: source.rights_review.note,
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
      canonical_source_url: source.source_url,
      aa_i122: {
        issue_id: packet.issue_id,
        package_version: packet.version,
        reviewed_at: date,
        source_locator: source.source_locator,
      },
    },
  };
};

for (const source of packet.sources) {
  const expected = sourceRecord(source);
  const index = sources.findIndex((record) => record.id === source.id);
  if (index < 0) {
    sources.push(expected);
    continue;
  }
  assert.equal(sources[index].source_url, source.source_url, `${source.id}: source URL differs`);
  assert.deepEqual(sources[index], expected, `${source.id}: existing canonical source differs; refusing overwrite`);
}

const familyById = new Map(packet.families.map((family) => [family.family_id, family]));
const guideQuestionRows = [];
for (const family of packet.families) {
  const guide = guides.find((record) => record.id === family.guide_id);
  assert.ok(guide, `${family.guide_id}: guide missing`);
  if (!integrateIntoNewerCorpus && guide.reviewed_at && guide.reviewed_at > date)
    throw new Error(`${guide.id}: review date ${guide.reviewed_at} is newer than package ${date}`);
  if (guide.data?.version && compareVersion(guide.data.version, packet.version) > 0 && !integrateIntoNewerCorpus)
    throw new Error(`${guide.id}: data version ${guide.data.version} is newer than package ${packet.version}`);

  const question = clone(family.question);
  const questionAt = guide.data.research_questions.findIndex((candidate) => candidate.id === question.id);
  if (questionAt < 0) guide.data.research_questions.push(question);
  else assert.deepEqual(guide.data.research_questions[questionAt], question, `${question.id}: existing question differs; refusing overwrite`);

  const marker = {
    issue_id: packet.issue_id,
    package_id: packet.package_id,
    package_version: packet.version,
    family_id: family.family_id,
    question_id: question.id,
    reviewed_at: date,
    scope: family.scope,
  };
  if (guide.provenance?.aa_i122) assert.deepEqual(guide.provenance.aa_i122, marker, `${guide.id}: AA-I122 provenance marker differs`);
  if (guide.data?.aa_i122) assert.deepEqual(guide.data.aa_i122, marker, `${guide.id}: AA-I122 data marker differs`);

  guide.title = family.title;
  guide.summary = family.summary;
  guide.jurisdiction = family.jurisdictions.join("; ");
  guide.reviewed_at = date;
  guide.source_ids = union(guide.source_ids, family.source_ids, question.source_ids);
  guide.related_ids = union(guide.related_ids, family.related_ids);
  guide.provenance = {
    ...guide.provenance,
    aa_i122: marker,
    supplemental_research_file: packet.inventory_file.replace("-inventory", ""),
    supplemental_inventory_file: packet.inventory_file,
    supplemental_reviewed_at: date,
    supplemental_reviewer: packet.reviewer,
    supplemental_scope: family.scope,
  };
  const existingBrief = guide.data.editorial_brief || { findings: [], unknowns: [], reading_order: [] };
  const finding = {
    question_id: question.id,
    claim: question.answer,
    source_ids: question.source_ids,
    classification: question.answer_status,
    qualification: question.scope,
  };
  guide.data = {
    ...guide.data,
    aa_i122: marker,
    scope: family.scope,
    review_basis: family.review_basis,
    source_ids: union(guide.data.source_ids, family.source_ids, question.source_ids),
    source_locators: uniqueObjects(guide.data.source_locators, family.source_locators),
    frameworks: union(guide.data.frameworks, family.frameworks),
    jurisdictions: union(guide.data.jurisdictions, family.jurisdictions),
    related_ids: union(guide.data.related_ids, family.related_ids),
    shared_inputs: union(guide.data.shared_inputs, family.shared_inputs),
    additional_inputs: union(guide.data.additional_inputs, family.additional_inputs),
    workflows: union(guide.data.workflows, family.workflows),
    controls: union(guide.data.controls, family.controls),
    exceptions: union(guide.data.exceptions, family.exceptions),
    coverage_gaps: union(guide.data.coverage_gaps, family.coverage_gaps),
    version: maxVersion(guide.data.version, packet.version),
    supplemental_research_package: packet.package_id,
    supplemental_research_file: packet.inventory_file.replace("-inventory", ""),
    supplemental_inventory_file: packet.inventory_file,
    editorial_brief: {
      ...existingBrief,
      findings: existingBrief.findings?.some((item) => item.question_id === question.id)
        ? existingBrief.findings
        : [...(existingBrief.findings || []), finding],
      unknowns: union(existingBrief.unknowns, family.coverage_gaps),
      reading_order: union(existingBrief.reading_order, family.source_ids),
    },
  };
  guideQuestionRows.push({
    id: question.id,
    record_id: guide.id,
    pointer: `/data/research_questions/${guide.data.research_questions.findIndex((candidate) => candidate.id === question.id)}`,
    family_ids: [family.family_id],
    question: question.question,
    scope: question.scope,
    answer_status: question.answer_status,
    assessment_status: question.assessment.status,
    source_ids: unique(question.source_ids),
    remaining_gaps: question.remaining_gaps,
    professional_review: "not-performed",
    empirical_support: "not-established",
    dimensions: question.assessment.dimensions,
    dimension_basis: question.assessment.basis,
    reviewed_at: date,
  });
}

const expectedExample = {
  id: exampleData.id,
  kind: "example",
  title: exampleData.title,
  summary: exampleData.summary,
  topics: ["Scoped research", "Tax and compliance", "Synthetic examples"],
  industries: [],
  jurisdiction: exampleData.jurisdiction,
  source_type: null,
  publisher: "Accounting Agents contributors",
  source_url: null,
  source_ids: unique(exampleData.source_ids),
  related_ids: unique(exampleData.related_ids),
  review_status: "editorially-reviewed",
  reviewed_at: date,
  provenance: {
    added_on: date,
    reviewer: packet.reviewer,
    research_file: "data/research/tax-foundations-example-2026-09-18.json",
    inventory_file: packet.inventory_file,
    issue_id: packet.issue_id,
    package_version: packet.version,
    note: "Fully original synthetic tax fixture with explicit arithmetic, evidence boundaries, and unexecuted actions. This is not operational evidence or professional review.",
  },
  rights: projectRights,
  data: exampleData.data,
};
const existingExampleIndex = examples.findIndex((record) => record.id === expectedExample.id);
if (existingExampleIndex < 0) examples.push(expectedExample);
else assert.deepEqual(examples[existingExampleIndex], expectedExample, `${expectedExample.id}: existing example differs; refusing overwrite`);

const familyIds = packet.families.map((family) => family.family_id);
const guideMappingReason = "The explicitly scoped AA-I122 US tax questions and original synthesis support discovery associations only. Detailed-industry adequacy, taxpayer applicability, filing authority, and professional verification are separate.";
const guideMappingReview = "AA-I122 guide association reviewed for the named US tax question only; it does not confer family-wide adequacy or professional verification.";
for (const family of packet.families) {
  const existing = overrides.records[family.guide_id] || {};
  if (existing.reviewed_at && existing.reviewed_at > date && !integrateIntoNewerCorpus)
    throw new Error(`${family.guide_id}: mapping review date ${existing.reviewed_at} is newer than package ${date}`);
  overrides.records[family.guide_id] = {
    ...existing,
    replace_question_ids: true,
    question_ids: [family.family_id],
    industry_codes: [],
    industry_scope: "shared-context",
    basis_field: "/data/research_questions",
    reason: guideMappingReason,
    reviewed_question_ids: [family.family_id],
    reviewed_industry_codes: [],
    reviewed_at: maxDate(existing.reviewed_at, date),
    review_note: guideMappingReview,
  };
}

for (const [sourceId, questionIds] of sourceQuestionIds) {
  const existing = overrides.records[sourceId] || {};
  if (existing.reviewed_at && existing.reviewed_at > date && !integrateIntoNewerCorpus)
    throw new Error(`${sourceId}: mapping review date ${existing.reviewed_at} is newer than package ${date}`);
  const isNewPackageSource = packageSourceIds.has(sourceId);
  const sourceRecordInCorpus = sources.find((record) => record.id === sourceId);
  const preferredBasis = isNewPackageSource
    ? "/data/source_review/mapping_rationale"
    : (existing.basis_field && pointerValue(sourceRecordInCorpus, existing.basis_field) !== undefined ? existing.basis_field : "/data");
  const currentQuestions = existing.question_ids || [];
  const currentReviewed = existing.reviewed_question_ids || [];
  const replaySafeReviewNote = "AA-I122 association reviewed within the bounded US tax package.";
  const priorReviewNote = (existing.review_note || "Question-level citation association reviewed; no industry descendant or sufficiency credit.")
    .replaceAll(` ${replaySafeReviewNote}`, "");
  const reviewNote = isNewPackageSource
    ? mappingReviewNote
    : `${priorReviewNote} ${replaySafeReviewNote}`;
  overrides.records[sourceId] = {
    ...(isNewPackageSource ? {} : existing),
    replace_question_ids: isNewPackageSource ? true : existing.replace_question_ids ?? false,
    question_ids: isNewPackageSource ? questionIds : union(currentQuestions, questionIds),
    industry_codes: isNewPackageSource ? [] : existing.industry_codes || [],
    industry_scope: isNewPackageSource ? "shared-context" : existing.industry_scope || "shared-context",
    basis_field: preferredBasis,
    reason: isNewPackageSource ? mappingRationale : existing.reason || mappingRationale,
    reviewed_question_ids: isNewPackageSource ? questionIds : union(currentReviewed, questionIds),
    reviewed_industry_codes: isNewPackageSource ? [] : existing.reviewed_industry_codes || [],
    reviewed_at: maxDate(existing.reviewed_at, date),
    review_note: reviewNote,
  };
}
overrides.records[expectedExample.id] = {
  replace_question_ids: true,
  question_ids: familyIds,
  industry_codes: [],
  industry_scope: "shared-context",
  basis_field: "/data/editorial_review",
  reason: "Original synthetic AA-I122 fixture explicitly covers five US tax families and supports discovery navigation only; it does not establish taxpayer, industry, or professional adequacy.",
  reviewed_question_ids: familyIds,
  reviewed_industry_codes: [],
  reviewed_at: date,
  review_note: "AA-I122 synthetic fixture association reviewed for named-family navigation only; no filing authority, tax conclusion, industry coverage, or professional verification is conferred.",
};

for (const row of guideQuestionRows) {
  const existing = registry.questions.find((question) => question.id === row.id);
  if (!existing) registry.questions.push(row);
  else assert.deepEqual(existing, row, `${row.id}: existing registry row differs; refusing overwrite`);
}
registry.question_set_version = maxVersion(registry.question_set_version, packet.version);
registry.corpus_version = catalog.corpus_version;
registry.reviewed_at = maxDate(registry.reviewed_at, date);
const registryScopeAddition = `The ${packet.package_id} supplement adds five US-scoped named tax answers while preserving existing framework, construction-conflict, and jurisdiction boundaries.`;
if (!registry.scope.includes(registryScopeAddition)) registry.scope = `${registry.scope.trim()} ${registryScopeAddition}`;
criteria.population.named_research_questions = registry.questions.length;

const foundationMarker = {
  issue_id: packet.issue_id,
  package_id: packet.package_id,
  package_version: packet.version,
  corpus_version: catalog.corpus_version,
  family_ids: packet.families.map((family) => family.family_id),
  source_ids: packet.sources.map((source) => source.id),
  named_question_ids: guideQuestionRows.map((row) => row.id),
  note: "Issue-specific tax foundation package is tracked additively; generic foundation families and their existing review state remain unchanged.",
};
if (foundations.aa_i122) assert.deepEqual(foundations.aa_i122, foundationMarker, "Foundations AA-I122 marker differs; refusing overwrite");
foundations.aa_i122 = foundationMarker;
foundations.integration_scope = {
  ...foundations.integration_scope,
  replay_version: genericReplayVersion,
  replay_corpus_version: genericReplayCorpusVersion,
};
foundations.question_set_version = maxVersion(foundations.question_set_version, packet.version);
foundations.corpus_version = catalog.corpus_version;
foundations.reviewed_at = maxDate(foundations.reviewed_at, date);
subsectorProfiles.corpus_version = catalog.corpus_version;
subsectorScreening.corpus_version = catalog.corpus_version;

const assessmentIds = [];
for (const family of packet.families) {
  const question = family.question;
  const assessment = {
    id: `coverage-aa-i122-${family.family_id}-2026-09-18`,
    scope_kind: "shared-context",
    industry_code: null,
    named_question_id: question.id,
    question_id: family.family_id,
    family_ids: [family.family_id],
    status: question.assessment.status,
    scope: family.scope,
    jurisdictions: family.jurisdictions,
    frameworks: family.frameworks,
    effective_from: null,
    effective_to: null,
    reviewed_at: date,
    reviewer: packet.reviewer,
    review_basis: question.assessment.basis,
    source_currency: "verified-within-stated-scope",
    evidence_record_ids: unique([family.guide_id, expectedExample.id, ...question.source_ids]),
    dimensions: question.assessment.dimensions,
    gaps: question.remaining_gaps,
    rights: clone(projectRights),
  };
  assessmentIds.push(assessment.id);
  const existing = assessments.assessments.find((candidate) => candidate.id === assessment.id);
  if (!existing) assessments.assessments.push(assessment);
  else assert.deepEqual(existing, assessment, `${assessment.id}: existing assessment differs; refusing overwrite`);
}
assessments.assessment_version = maxVersion(assessments.assessment_version, packet.version);
overrides.mapping_version = maxVersion(overrides.mapping_version, packet.version);
overrides.updated_at = maxDate(overrides.updated_at, date);

for (const fixture of packet.retrieval_fixtures) {
  const existing = fixtures.find((candidate) => candidate.id === fixture.id);
  if (!existing) fixtures.push(fixture);
  else if (JSON.stringify(existing) !== JSON.stringify(fixture)) {
    assert.match(fixture.id, /^rq-aa-i122-/, `${fixture.id}: refusing to replace an unrelated retrieval fixture`);
    Object.assign(existing, fixture);
  }
}

write("data/corpus/source.json", sources);
write("data/corpus/guide.json", guides);
write("data/corpus/example.json", examples);
write("data/research/foundations.json", foundations);
write("data/coverage/research-questions.json", registry);
write("data/coverage/research-criteria.json", criteria);
write("data/coverage/subsector-profiles.json", subsectorProfiles);
write("data/coverage/subsector-screening.json", subsectorScreening);
write("data/coverage/assessments.json", assessments);
write("data/coverage/mapping-overrides.json", overrides);
write("data/research-questions.json", fixtures);

console.log(JSON.stringify({
  issue: packet.issue_id,
  package_version: packet.version,
  added_sources: packet.sources.length,
  updated_guides: packet.families.map((family) => family.guide_id),
  added_named_questions: guideQuestionRows.map((row) => row.id),
  example: expectedExample.id,
  assessments: assessmentIds,
  retrieval_fixtures: packet.retrieval_fixtures.map((fixture) => fixture.id),
}, null, 2));
