import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const staged = new Map();
const serialize = value => JSON.stringify(value, null, 2) + '\n';
const stage = (p, v) => {
  const original = fs.readFileSync(p, 'utf8');
  const content = serialize(v);
  const escapedUnicode = !/[^\x00-\x7f]/.test(original) && /\\u[0-9a-f]{4}/i.test(original);
  staged.set(p, escapedUnicode
    ? content.replace(/[\u007f-\uFFFF]/g, character => `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`)
    : content);
};
const packet = read('data/research/institutional-regulated-124.json');
const catalog = read('data/catalog.json');
const currentMainEdition = '2026-09-19.9804';
const integratedEdition = '2026-09-19.12401';
const acceptedInputEditions = ['2026-09-19.1114', '2026-09-19.1115', currentMainEdition, integratedEdition];
assert.equal(packet.corpus_edition, '2026-09-19.124', 'Unexpected accepted AA-I124 source package edition.');
assert.ok(acceptedInputEditions.includes(catalog.corpus_version),
  `Refuse integration into ${catalog.corpus_version}; expected current main ${currentMainEdition} or replay edition ${integratedEdition}.`);
const add = (list, value) => {
  const existing = list.find(v => v.id === value.id);
  if (existing) assert.deepEqual(existing, value, `Refuse overwrite of ${value.id}`);
  else list.push(value);
};
for (const kind of ['source', 'guide', 'example']) {
  const path = `data/corpus/${kind}.json`, records = read(path);
  for (const record of kind === 'source' ? packet.sources : [packet[kind]]) add(records, record);
  if (kind === 'guide') for (const row of packet.baseline_inventory) {
    const family = records.find(r => r.id === row.existing_guide_id);
    assert.ok(family);
    family.related_ids = [...new Set([...family.related_ids, packet.guide.id])];
  }
  stage(path, records);
}
const registry = read('data/coverage/research-questions.json');
const assessments = read('data/coverage/assessments.json');
for (const [i, q] of packet.guide.data.research_questions.entries()) {
  add(registry.questions, {
    id: q.id, record_id: packet.guide.id, pointer: `/data/research_questions/${i}`,
    family_ids: [q.family_id], question: q.question, scope: q.scope,
    answer_status: q.answer_status, assessment_status: q.assessment.status,
    source_ids: q.source_ids, source_locators: q.source_locators, remaining_gaps: q.remaining_gaps,
    professional_review: q.assessment.professional_review, empirical_support: q.assessment.empirical_support,
    dimensions: q.assessment.dimensions, dimension_basis: q.assessment.basis, reviewed_at: packet.reviewed_at,
  });
  add(assessments.assessments, {
    id: `coverage-aa-i124-${q.family_id}`, scope_kind: 'shared-context', industry_code: null,
    question_id: q.family_id, family_ids: [q.family_id], named_question_id: q.id,
    status: 'partial', scope: q.scope, jurisdictions: ['United States'], frameworks: [q.framework],
    effective_from: null, effective_to: null, reviewed_at: packet.reviewed_at,
    reviewer: 'Codex AI-assisted scoped source review', review_basis: q.assessment.basis,
    source_currency: 'not-reverified-for-this-assessment',
    evidence_record_ids: [packet.guide.id, packet.example.id, ...q.source_ids],
    dimensions: q.assessment.dimensions, gaps: [...q.remaining_gaps, ...q.exceptions], rights: packet.guide.rights,
    professional_review: 'not-performed', empirical_support: 'not-established',
  });
}
registry.question_set_version = integratedEdition;
registry.corpus_version = integratedEdition;
registry.reviewed_at = packet.reviewed_at;
assessments.assessment_version = integratedEdition;
stage('data/coverage/research-questions.json', registry);
stage('data/coverage/assessments.json', assessments);
const overrides = read('data/coverage/mapping-overrides.json');
for (const record of [packet.guide, packet.example, ...packet.sources]) {
  const families = packet.guide.data.research_questions.filter(q => record.kind !== 'source' || q.source_ids.includes(record.id)).map(q => q.family_id);
  const override = {
    replace_question_ids: true, question_ids: families, industry_codes: [], industry_scope: 'shared-context',
    basis_field: '/summary', reason: 'AA-I124 selected role-qualified discovery; no industry-wide applicability or sufficient coverage.',
    reviewed_question_ids: families, reviewed_industry_codes: [], reviewed_at: packet.reviewed_at,
    review_note: 'Source editions and named-question limits govern; no professional verification.',
  };
  if (overrides.records[record.id]) assert.deepEqual(overrides.records[record.id], override);
  overrides.records[record.id] = override;
}
overrides.mapping_version = integratedEdition;
overrides.updated_at = packet.reviewed_at;
stage('data/coverage/mapping-overrides.json', overrides);
const criteria = read('data/coverage/research-criteria.json');
criteria.population.named_research_questions = registry.questions.length;
stage('data/coverage/research-criteria.json', criteria);
const coverageAddition = ` Local AA-INT124 integration ${integratedEdition} adds ten bounded institutional and regulated US questions, four source records, one synthetic role-routing example, and ten partial shared-context assessments while preserving education, extractive research and prior release history.`;
const reviewAddition = ` AA-INT124 integrates accepted source package 137e04f795c05562207692097c8c034edd4af3d1. Edition ${integratedEdition} follows the preserved extractive edition ${currentMainEdition}; the institutional source edition 2026-09-19.124 and intermediate integration1115 remain provenance. No professional review, current consolidated authority, operational completeness, empirical agent performance, or deployment is established.`;
if (!catalog.coverage_note.includes('AA-INT124')) catalog.coverage_note = `${catalog.coverage_note.trim()}${coverageAddition}`;
if (!catalog.review_note.includes('AA-INT124')) catalog.review_note = `${catalog.review_note.trim()}${reviewAddition}`;
catalog.corpus_version = integratedEdition;
catalog.updated_at = packet.reviewed_at;
stage('data/catalog.json', catalog);
for (const path of ['data/coverage/subsector-profiles.json','data/coverage/subsector-screening.json']) {
  const value = read(path);
  value.corpus_version = integratedEdition;
  stage(path, value);
}
// All conflicts are checked before any canonical file is written. Existing records are never replaced.
for (const [path, content] of staged) fs.writeFileSync(path, content);
console.log(`Integrated ${packet.issue_id} into ${integratedEdition}: ten partial questions; current-main records and history preserved.`);
