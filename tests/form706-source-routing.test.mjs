import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {records, knowledge, recordMarkdown, search} from '../dist/internal/corpus.mjs';
import {executeAgent} from '../dist/internal/agent.mjs';
import {beforeForm706Supplement, form706Receipt} from './fixtures/form706-preservation.mjs';

const id = 'src_fo_ref_irs_i706', baseline = '33c0152';
const current = records.find(record => record.id === id);
const previous = file => JSON.parse(execFileSync('git', ['show', `${baseline}:${file}`], {encoding: 'utf8', maxBuffer: 32 * 1024 * 1024}));
const historical = previous('data/corpus/source.json').find(record => record.id === id);

test('Form 706 reuses its identity and preserves every existing record and historical field', () => {
  for (const kind of ['source', 'guide']) {
    const prior = previous(`data/corpus/${kind}.json`);
    const now = records.filter(record => record.kind === kind);
    assert.equal(now.length, prior.length + (kind === 'source' ? 1 : 0));
    const priorIds = new Set(prior.map(record => record.id));
    assert.deepEqual(now.filter(record => !priorIds.has(record.id)).map(record => record.id), kind === 'source' ? ['src_irs_afr_rr2026_19'] : []);
    for (const old of prior) assert.deepEqual(beforeForm706Supplement(now.find(record => record.id === old.id), old), old, old.id);
  }
  assert.equal(records.filter(record => record.source_url === current.source_url).length, 1);
  assert.equal(current.review_status, 'discovery-imported-not-reverified');
  assert.equal(current.reviewed_at, null);
  assert.deepEqual(current.data.discovery_annotation, historical.data.discovery_annotation);
  assert.deepEqual(current.provenance, historical.provenance);
  assert.deepEqual(current.rights, historical.rights);
});

test('historical projection permits only the exact additive receipt and preserves unrelated changes', () => {
  assert.deepEqual(beforeForm706Supplement(current, historical), historical);
  const altered = structuredClone(current);
  altered.data.supplemental_reviews[0].routing_context.portability_relief = 'Universal five-year filing extension';
  assert.throws(() => beforeForm706Supplement(altered, historical), /differs from reviewed receipt/);
  const doubled = structuredClone(current);
  doubled.data.supplemental_reviews.push(form706Receipt);
  assert.throws(() => beforeForm706Supplement(doubled, historical), /differs from reviewed receipt/);
  const oldWithReceipt = structuredClone(historical);
  oldWithReceipt.data.supplemental_reviews = [];
  assert.throws(() => beforeForm706Supplement(current, oldWithReceipt), /must be additive/);
  for (const mutate of [r => {r.reviewed_at = '2026-10-02';}, r => {r.summary = 'changed';}, r => {r.rights.source_status = 'permitted';}, r => {r.data.discovery_annotation.verification.checked_on = '2026-10-02';}]) {
    const altered = structuredClone(current);
    mutate(altered);
    assert.notDeepEqual(beforeForm706Supplement(altered, historical), historical);
  }
});

test('selected-source receipt separates revisions, death year, filing, payment and conditional portability relief', () => {
  assert.deepEqual(current.data.supplemental_reviews, [form706Receipt]);
  const receipt = current.data.supplemental_reviews[0], routing = receipt.routing_context;
  assert.equal(receipt.checked_url, current.source_url);
  assert.equal(receipt.reviewed_at, '2026-10-02');
  assert.equal(receipt.review_level, 'substantive-excerpt');
  assert.equal(routing.instruction_revision, '07/2026');
  assert.equal(routing.form_revision_observed, 'August 2025');
  assert.match(routing.form_revision_death_date_condition, /After December 31, 2024/);
  assert.equal(routing.filing_section_death_year_observed, '2026');
  assert.deepEqual(routing.separate_facts, ['instruction revision','form revision','date of death','actual filing date']);
  assert.match(routing.ordinary_filing, /nine-month.*six-month.*Form 4768/);
  assert.match(routing.payment, /separate.*does not establish payment-extension approval/);
  assert.match(routing.portability_relief, /conditional.*without a section 6018\(a\) filing requirement.*eligibility is unresolved/);
  assert.equal(receipt.underlying_relief_authority.status, 'not-read-in-this-review');
  assert.equal(receipt.professional_review_status, 'pending');
  assert.equal(receipt.source_rights.status, 'unknown');
  assert.equal(receipt.source_rights.full_text_stored, false);
  for (const key of ['license_id','license_url','permission_scope']) assert.equal(receipt.source_rights[key], null);
  assert.deepEqual(receipt.checks.map(check => check.locator), receipt.scope);
  for (const check of receipt.checks) {
    assert.equal(check.url, current.source_url);
    assert.equal(check.checked_at, receipt.reviewed_at);
    assert.equal(check.material_read, true);
  }
});

test('Markdown and paginated agent retrieval expose the receipt with historical review state and unknown bounds', () => {
  const markdown = recordMarkdown(current);
  for (const text of ['form706-routing-2026-10-02','07/2026','August 2025','section 6018(a)','not-read-in-this-review','discovery-imported-not-reverified']) assert.ok(markdown.includes(text), text);
  const passages = [];
  let cursor;
  do {
    const result = executeAgent('get', {id, section:'data.supplemental_reviews', limit:2, ...(cursor ? {cursor} : {})});
    passages.push(...result.passages);
    cursor = result.next_cursor;
  } while(cursor);
  const text = passages.map(passage => passage.text).join('\n');
  for (const marker of ['07/2026','August 2025','6018(a)','not-read-in-this-review']) assert.ok(text.includes(marker), marker);
  const period = knowledge.profile(id).scope.period;
  assert.equal(period.effective_from, null);
  assert.equal(period.effective_to, null);
  const q = 'IRS Instructions Form 706';
  assert.ok(search(new URLSearchParams({q, kind:'source'})).records.some(record => record.id === id));
  for (const as_of of ['2025-08-01','2026-07-01']) {
    assert.ok(!search(new URLSearchParams({q,kind:'source',as_of})).records.some(record => record.id === id));
    for (const method of ['search','context']) {
      const result = executeAgent(method, {q,kind:'source',as_of,...(method === 'context' ? {max_chars:12000} : {})});
      const selected = method === 'search' ? result.results : result.records;
      assert.ok(!selected.some(record => record.id === id));
      assert.ok(result.temporal_filter.excluded['unknown-effective-from'] >= 1);
    }
  }
});
