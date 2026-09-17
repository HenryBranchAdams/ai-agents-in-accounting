import fs from "node:fs";
import assert from "node:assert/strict";
import path from "node:path";

const root = path.resolve(process.env.REPORTING_FOUNDATIONS_ROOT || ".");
const read = (file) => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
const write = (file, value) => fs.writeFileSync(path.join(root, file), JSON.stringify(value, null, 2) + "\n");
const union = (...values) => [...new Set(values.flatMap((value) => Array.isArray(value) ? value : []))];
const mergeObjects = (current, additions) => {
  const seen = new Set(current.map((item) => JSON.stringify(item)));
  return [...current, ...additions.filter((item) => !seen.has(JSON.stringify(item)))];
};
const sameIds = (left, right) => Array.isArray(left) && Array.isArray(right) && left.length === right.length && right.every((id) => left.includes(id));

const packageData = read("data/research/reporting-foundations.json");
const exampleData = read("data/research/reporting-foundations-example.json");
const assessmentData = read("data/research/reporting-foundations-assessments.json");
const inventoryData = read(packageData.inventory_file);
const date = packageData.reviewed_at;
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

const sources = read("data/corpus/source.json");
const guides = read("data/corpus/guide.json");
const examples = read("data/corpus/example.json");
const registry = read("data/coverage/research-questions.json");
const assessments = read("data/coverage/assessments.json");
const overrides = read("data/coverage/mapping-overrides.json");
const catalog = read("data/catalog.json");
const profileCoverage = read("data/coverage/subsector-profiles.json");
const screeningCoverage = read("data/coverage/subsector-screening.json");

assert.match(catalog.corpus_version, /^\d{4}-\d{2}-\d{2}\.\d+$/, "catalog corpus version missing");
assert.equal(inventoryData.package_id, packageData.package_id, "inventory package mismatch");
assert.equal(inventoryData.reviewed_at, date, "inventory review date mismatch");
for (const [label, current, expected] of [["question registry", registry.question_set_version, packageData.version], ["assessment coverage", assessments.assessment_version, assessmentData.assessment_version], ["mapping overrides", overrides.mapping_version, packageData.version]]) {
  if (current > expected) throw new Error(`${label}: newer version ${current} would be overwritten by ${expected}`);
}
if (registry.reviewed_at > date) throw new Error(`question registry: newer review date ${registry.reviewed_at} would be overwritten by ${date}`);
if (overrides.updated_at > date) throw new Error(`mapping overrides: newer review date ${overrides.updated_at} would be overwritten by ${date}`);
for (const [file, coverage] of [["data/coverage/subsector-profiles.json", profileCoverage], ["data/coverage/subsector-screening.json", screeningCoverage]]) {
  if (coverage.corpus_version > catalog.corpus_version)
    throw new Error(`${file}: newer corpus version ${coverage.corpus_version} would be overwritten by ${catalog.corpus_version}`);
  coverage.corpus_version = catalog.corpus_version;
}

function sourceRecord(source) {
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
    question_ids: [],
    industry_scope: "shared-context",
    industry_codes: [],
    mapping_rationale: "Shared US reporting-foundations authority; the reviewed material does not establish a specific NAICS industry treatment.",
    reviewed_at: date,
    reviewer: packageData.reviewer,
  };
  return {
    id: source.id,
    kind: "source",
    title: source.title,
    summary: source.summary,
    topics: ["Accounting and reporting", "Reporting foundations"],
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
      reviewer: packageData.reviewer,
      scope: source.source_locator,
      evidence_urls: [source.source_url],
      note: "Bounded public material was inspected and summarized originally. This is not complete current standards access, professional review or a license to external content.",
    },
    rights: sourceRights,
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
      access: "Open public source; terms and automated-access limits remain unresolved",
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
        permission_scope: null,
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
    },
  };
}

const reportingPackageMarkerFields = [
  "provenance.supplemental_research_file",
  "provenance.supplemental_inventory_file",
  "provenance.supplemental_reviewed_at",
  "provenance.supplemental_reviewer",
  "provenance.supplemental_scope",
  "data.supplemental_research_package",
  "data.supplemental_research_file",
  "data.supplemental_inventory_file",
];

function assertGuidePackageFields(guide, family) {
  const expected = {
    title: family.title,
    summary: family.summary,
    jurisdiction: family.jurisdictions.join("; "),
    reviewed_at: date,
    "provenance.supplemental_research_file": "data/research/reporting-foundations.json",
    "provenance.supplemental_inventory_file": packageData.inventory_file,
    "provenance.supplemental_reviewed_at": date,
    "provenance.supplemental_reviewer": packageData.reviewer,
    "provenance.supplemental_scope": family.scope,
    "data.scope": family.scope,
    "data.review_basis": family.review_basis,
    "data.us_scope": family.us_scope,
    "data.version": packageData.version,
    "data.supplemental_research_package": packageData.package_id,
    "data.supplemental_research_file": "data/research/reporting-foundations.json",
    "data.supplemental_inventory_file": packageData.inventory_file,
  };
  // Pre-package guide values are replaced only when no package marker exists. Once a marker is present,
  // every package-owned field must match before any canonical file can be written.
  const hasAppliedPackage = reportingPackageMarkerFields.some((field) => field.split(".").reduce((current, key) => current?.[key], guide) !== undefined);
  if (!hasAppliedPackage) return;
  for (const [field, value] of Object.entries(expected)) {
    const actual = field.split(".").reduce((current, key) => current?.[key], guide);
    assert.deepEqual(actual, value, `${guide.id}: package-owned guide field ${field} differs; refusing overwrite`);
  }
}

for (const source of packageData.sources) {
  const existing = sources.find((record) => record.id === source.id);
  const expected = sourceRecord(source);
  if (existing) assert.deepEqual(existing, expected, `${source.id}: existing canonical record differs; refusing overwrite`);
  else sources.push(expected);
}

const newQuestionRows = [];
for (const family of packageData.families) {
  const guide = guides.find((record) => record.id === family.guide_id);
  assert.ok(guide, `${family.guide_id}: guide missing`);
  assertGuidePackageFields(guide, family);
  const question = structuredClone(family.question);
  const packageSourceIds = new Set(family.source_ids);
  const questionIndex = guide.data.research_questions.findIndex((candidate) => candidate.id === question.id);
  if (questionIndex < 0) guide.data.research_questions.push(question);
  else assert.deepEqual(guide.data.research_questions[questionIndex], question, `${question.id}: existing canonical question differs; refusing overwrite`);

  guide.title = family.title;
  guide.summary = family.summary;
  guide.jurisdiction = family.jurisdictions.join("; ");
  guide.reviewed_at = date;
  guide.source_ids = union(guide.source_ids, family.source_ids, question.source_ids);
  guide.related_ids = union(guide.related_ids, family.related_ids);
  guide.provenance = {
    ...guide.provenance,
    supplemental_research_file: "data/research/reporting-foundations.json",
    supplemental_inventory_file: packageData.inventory_file,
    supplemental_reviewed_at: date,
    supplemental_reviewer: packageData.reviewer,
    supplemental_scope: family.scope,
  };
  guide.data = {
    ...guide.data,
    scope: family.scope,
    review_basis: family.review_basis,
    source_ids: union(guide.data.source_ids, family.source_ids, question.source_ids),
    source_locators: mergeObjects((guide.data.source_locators || []).filter((locator) => !packageSourceIds.has(locator.source_id)), family.source_locators),
    frameworks: union(guide.data.frameworks, family.frameworks),
    jurisdictions: union(guide.data.jurisdictions, family.jurisdictions),
    related_ids: union(guide.data.related_ids, family.related_ids),
    us_scope: family.us_scope,
    workflows: union(guide.data.workflows, family.workflows),
    additional_inputs: union(guide.data.additional_inputs, family.additional_inputs),
    coverage_gaps: union(guide.data.coverage_gaps, family.coverage_gaps),
    version: packageData.version,
    supplemental_research_package: packageData.package_id,
    supplemental_research_file: "data/research/reporting-foundations.json",
    supplemental_inventory_file: packageData.inventory_file,
  };
  const brief = guide.data.editorial_brief || { findings: [], unknowns: [], reading_order: [] };
  const finding = {
    question_id: question.id,
    claim: question.answer,
    source_ids: question.source_ids,
    classification: question.answer_status,
    qualification: question.scope,
  };
  guide.data.editorial_brief = {
    ...brief,
    answer: family.summary,
    findings: mergeObjects((brief.findings || []).filter((existing) => !(existing.question_id === question.id || (existing.qualification === family.scope && sameIds(existing.source_ids, question.source_ids)))), [finding]),
    unknowns: union(brief.unknowns, family.coverage_gaps),
    reading_order: union(brief.reading_order, family.source_ids),
  };

  const override = overrides.records[guide.id] || {
    replace_question_ids: true,
    question_ids: [],
    industry_codes: [],
    industry_scope: "shared-context",
    basis_field: "/data/research_questions",
    reason: "The explicitly scoped research questions and original synthesis support discovery associations only. Detailed-industry adequacy is separately assessed.",
    reviewed_question_ids: [],
    reviewed_industry_codes: [],
    review_note: "Reviewed discovery relationship to the named questions and explicitly declared industry scope; does not confer accounting adequacy or professional verification.",
  };
  override.reviewed_at = date;
  overrides.records[guide.id] = override;

  newQuestionRows.push({
    id: question.id,
    record_id: guide.id,
    pointer: `/data/research_questions/${guide.data.research_questions.findIndex((candidate) => candidate.id === question.id)}`,
    family_ids: [question.family_id],
    question: question.question,
    scope: question.scope,
    answer_status: question.answer_status,
    assessment_status: question.assessment.status,
    source_ids: union(question.source_ids),
    remaining_gaps: question.remaining_gaps,
    professional_review: "not-performed",
    empirical_support: "not-established",
    dimensions: question.assessment.dimensions,
    dimension_basis: question.assessment.basis,
  });
}

const exampleRecord = {
  id: exampleData.id,
  kind: "example",
  title: exampleData.title,
  summary: exampleData.summary,
  topics: ["Scoped research", "Reporting foundations", "Synthetic examples"],
  industries: [],
  jurisdiction: exampleData.jurisdiction,
  source_type: null,
  publisher: "Accounting Agents contributors",
  source_url: null,
  source_ids: union(exampleData.source_ids),
  related_ids: union(exampleData.related_ids),
  review_status: "editorially-reviewed",
  reviewed_at: date,
  provenance: {
    added_on: date,
    reviewer: packageData.reviewer,
    research_file: "data/research/reporting-foundations-example.json",
    inventory_file: packageData.inventory_file,
    note: "Fully original synthetic accounting fixture with explicit arithmetic, source identities, control boundaries and unexecuted actions. This is not operational evidence or professional review.",
  },
  rights: projectRights,
  data: exampleData.data,
};
const existingExample = examples.findIndex((record) => record.id === exampleRecord.id);
if (existingExample < 0) examples.push(exampleRecord);
else assert.deepEqual(examples[existingExample], exampleRecord, `${exampleRecord.id}: existing canonical record differs; refusing overwrite`);

const exampleQuestionIds = packageData.families.map((family) => family.family_id);
overrides.records[exampleRecord.id] = {
  replace_question_ids: true,
  question_ids: exampleQuestionIds,
  industry_codes: [],
  industry_scope: "shared-context",
  basis_field: "/data",
  reason: "Original synthetic reporting-foundations fixture supports discovery associations across the eight named reporting-foundations families; it does not establish industry-specific adequacy.",
  reviewed_question_ids: [],
  reviewed_industry_codes: [],
  reviewed_at: date,
  review_note: "Synthetic example association reviewed for named-family navigation only; no accounting adequacy, industry coverage or professional verification is conferred.",
};

for (const row of newQuestionRows) {
  const at = registry.questions.findIndex((question) => question.id === row.id);
  if (at < 0) registry.questions.push(row);
  else assert.deepEqual(registry.questions[at], row, `${row.id}: existing registry row differs; refusing overwrite`);
}
registry.question_set_version = packageData.version;
registry.reviewed_at = date;
const scopeAddition = `The ${packageData.package_id} supplement adds eight US-scoped named answers while preserving IFRS and other existing framework records.`;
registry.scope = `${registry.scope.replaceAll(` ${scopeAddition}`, "").trim()} ${scopeAddition}`;

const common = assessmentData.common;
for (const item of assessmentData.items) {
  const assessment = {
    id: item.id,
    industry_code: assessmentData.industry_code,
    question_id: item.question_id,
    status: common.status,
    scope: `${assessmentData.scope_prefix} ${item.review_basis}`,
    jurisdictions: common.jurisdictions,
    frameworks: common.frameworks,
    effective_from: common.effective_from,
    effective_to: common.effective_to,
    reviewed_at: assessmentData.reviewed_at,
    reviewer: assessmentData.reviewer,
    review_basis: item.review_basis,
    source_currency: common.source_currency,
    evidence_record_ids: item.evidence_record_ids,
    dimensions: common.dimensions,
    gaps: item.gaps,
    rights: common.rights,
  };
  const at = assessments.assessments.findIndex((candidate) => candidate.id === assessment.id);
  if (at < 0) assessments.assessments.push(assessment);
  else assert.deepEqual(assessments.assessments[at], assessment, `${assessment.id}: existing assessment differs; refusing overwrite`);
}
assessments.assessment_version = assessmentData.assessment_version;
overrides.mapping_version = packageData.version;
overrides.updated_at = date;

write("data/corpus/source.json", sources);
write("data/corpus/guide.json", guides);
write("data/corpus/example.json", examples);
write("data/coverage/research-questions.json", registry);
write("data/coverage/assessments.json", assessments);
write("data/coverage/mapping-overrides.json", overrides);
write("data/coverage/subsector-profiles.json", profileCoverage);
write("data/coverage/subsector-screening.json", screeningCoverage);

console.log(JSON.stringify({
  added_sources: packageData.sources.length,
  merged_guides: packageData.families.length,
  added_questions: newQuestionRows.length,
  example_id: exampleRecord.id,
  assessments: assessmentData.items.length,
}, null, 2));
