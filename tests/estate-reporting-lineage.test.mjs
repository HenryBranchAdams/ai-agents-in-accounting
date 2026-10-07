import {beforeForm706Supplement} from './fixtures/form706-preservation.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {loadRecords, validateSchema} from '../scripts/validate.mjs';
import {knowledge, search, applicabilityExclusion} from '../dist/internal/corpus.mjs';

const records = loadRecords(), byId = new Map(records.map(record => [record.id, record]));
const instruction = byId.get('src_estate_irs_8971_202508');
const rule = byId.get('src_estate_td9991_20240917');
const guide = byId.get('guide-estate-beneficiary-reporting-lineage');
// The accepted 2026-10-02.1 edition includes the separately reviewed Form 1041 correction.
const baseline = 'a3efcd6';
const prior = file => JSON.parse(execFileSync('git', ['show', `${baseline}:${file}`], {encoding: 'utf8', maxBuffer: 32 * 1024 * 1024}));

test('bounded estate intake preserves all prior records and protected research annotations', () => {
  for (const kind of ['source', 'guide']) {
    const old = prior(`data/corpus/${kind}.json`);
    const current = records.filter(record => record.kind === kind);
    const oldIds = new Set(old.map(record => record.id));
    const additions = new Set(current.filter(record => !oldIds.has(record.id)).map(record => record.id));
    for (const id of kind === 'source' ? [instruction.id, rule.id, 'src_irs_afr_rr2026_19'] : [guide.id]) {
      assert.ok(additions.has(id), id);
    }
    for (const record of old) assert.deepEqual(beforeForm706Supplement(byId.get(record.id), record), record, record.id);
  }
  for (const file of ['data/research/family-office-applicability-2026-10-01.json', 'docs/research/2026-09-24-family-office-controller/source-inventory.json']) {
    assert.deepEqual(JSON.parse(fs.readFileSync(file, 'utf8')), prior(file));
  }
});

test('new records satisfy the shared schema and all references resolve to the expected kinds', () => {
  const schema = JSON.parse(fs.readFileSync('schemas/record.schema.json', 'utf8'));
  for (const record of [instruction, rule, guide]) {
    assert.ok(record);
    validateSchema(record, schema, record.id);
    for (const id of record.source_ids) assert.equal(byId.get(id)?.kind, 'source', id);
    for (const id of record.related_ids) assert.ok(byId.has(id), id);
  }
  for (const link of guide.data.existing_evidence_links) {
    const target = byId.get(link.record_id);
    assert.ok(link.pointer.split('/').slice(1).reduce((value, key) => value?.[key], target));
  }
});

test('source identities are unique and archival CFR research is reused without promotion', () => {
  for (const source of [instruction, rule]) assert.equal(records.filter(record => record.source_url === source.source_url).length, 1);
  const ref = guide.data.prior_research_reference;
  const inventory = JSON.parse(fs.readFileSync(ref.inventory_path, 'utf8')).find(row => row.inventory_id === ref.inventory_id);
  assert.ok(inventory.source_keys.includes(ref.source_key));
  assert.equal(inventory.url, ref.url);
  assert.deepEqual(inventory.existing_record_ids, []);
  assert.equal(records.filter(record => record.source_url === ref.url).length, 0);
});

test('source checks retain selected passage scope, unknown external rights and pending professional review', () => {
  for (const record of [instruction, rule]) {
    assert.equal(record.review_status, 'source-checked');
    assert.equal(record.reviewed_at, '2026-10-02');
    assert.equal(record.data.source_review.checked_url, record.source_url);
    assert.equal(record.data.source_review.scope, record.provenance.scope);
    assert.equal(record.data.source_review.material_read, true);
    assert.equal(record.data.professional_review_status, 'pending');
    assert.equal(record.rights.full_text_stored, false);
    assert.equal(record.rights.source_status, 'unknown');
    for (const key of ['source_license', 'source_license_url', 'source_permission_scope']) assert.equal(record.rights[key], null);
  }
  assert.equal(guide.reviewed_at, null);
  assert.equal(guide.data.status, 'discovery-question-not-answered');
  assert.equal(guide.data.professional_review_status, 'pending');
});

test('instruction edition never becomes a date bound and rule effectiveness retains the stricter filing condition', () => {
  assert.match(instruction.data.edition, /08\/2025/);
  for (const key of ['effective_from', 'effective_to']) assert.equal(instruction.data[key], null);
  assert.equal(applicabilityExclusion(knowledge.profile(instruction.id).scope.period, '2025-08-31'), 'unknown-effective-from');
  const condition = rule.data.applicability.estate_return_filing_condition;
  assert.deepEqual(condition, {date: '2024-09-17', relation: 'after', boundary_included: false});
  assert.equal(rule.data.effective_from, condition.date);
  assert.match(rule.data.effective_period, /effectiveness alone does not establish/);
  assert.match(rule.data.applicability.basis_consistency_locator, /\(c\)\(1\)/);
  assert.match(rule.data.applicability.executor_trustee_locator, /6018/);
  // Native date routing is about the publication, not an estate-return verdict.
  for (const [date, expected] of [['2024-09-16', false], ['2024-09-17', true]]) {
    const result = search(new URLSearchParams({q: 'Treasury Decision 9991', kind: 'source', as_of: date}));
    assert.equal(result.records.some(record => record.id === rule.id), expected);
  }
});
