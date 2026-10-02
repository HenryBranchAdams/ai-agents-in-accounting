import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {loadRecords, validateSchema} from '../scripts/validate.mjs';
import {knowledge, search, recordMarkdown} from '../dist/internal/corpus.mjs';
import {executeAgent} from '../dist/internal/agent.mjs';

const records = loadRecords(), id = 'src_irs_afr_rr2026_19';
const source = records.find(record => record.id === id);
const ledger = JSON.parse(fs.readFileSync('data/research/october-afr-2026-10-02.json', 'utf8'));
const previous = file => JSON.parse(execFileSync('git', ['show', `c042644:${file}`], {encoding:'utf8', maxBuffer:32*1024*1024}));
const expected = {
  'short-term':['4.25','4.21','4.19','4.17'],
  'mid-term':['4.61','4.56','4.53','4.52'],
  'long-term':['5.22','5.15','5.12','5.10'],
};
const conventions = ['annual','semiannual','quarterly','monthly'];

test('October ruling is the sole added source and leaves every historical record and landing identity intact', () => {
  for (const file of fs.readdirSync('data/corpus').filter(file => file.endsWith('.json'))) {
    const old = previous(`data/corpus/${file}`), current = JSON.parse(fs.readFileSync(`data/corpus/${file}`, 'utf8'));
    assert.equal(current.length, old.length + (file === 'source.json' ? 1 : 0));
    const oldIds = new Set(old.map(record => record.id));
    assert.deepEqual(current.filter(record => !oldIds.has(record.id)).map(record => record.id), file === 'source.json' ? [id] : []);
    for (const record of old) assert.deepEqual(current.find(row => row.id === record.id), record, record.id);
  }
  assert.equal(records.filter(record => record.source_url === source.source_url).length, 1);
  assert.deepEqual(source.related_ids, ['src_fo_ref_irs_afr']);
  assert.ok(records.some(record => record.id === source.related_ids[0] && record.kind === 'source'));
  validateSchema(source, JSON.parse(fs.readFileSync('schemas/record.schema.json', 'utf8')), id);
});

test('12 visually checked base AFR cells retain term, compounding, page, table and percent unit', () => {
  const table = source.data.base_afr;
  assert.equal(table.statutory_purpose, 'section 1274(d)');
  assert.equal(table.table, 1);
  assert.equal(table.page, 2);
  assert.equal(table.rates.length, 12);
  assert.equal(new Set(table.rates.map(rate => `${rate.term}/${rate.compounding}`)).size, 12);
  for (const [term, values] of Object.entries(expected)) {
    const row = table.rates.filter(rate => rate.term === term);
    assert.deepEqual(row.map(rate => rate.compounding), conventions);
    assert.deepEqual(row.map(rate => rate.value), values, term);
    for (const rate of row) {
      assert.equal(rate.table, 1);
      assert.equal(rate.page, 2);
      assert.equal(rate.row, 'AFR', 'Multiplier rows must not be mixed with base AFR');
      assert.equal(rate.unit, 'percent');
      assert.match(rate.value, /^\d+\.\d{2}$/);
    }
  }
  assert.deepEqual(ledger.visual_checks.find(check => check.table === 1).column_order, conventions);
  assert.deepEqual(ledger.visual_checks.find(check => check.table === 1).values_percent, expected);
});

test('section 7520 remains a separate valuation rate without an invented compounding convention', () => {
  const rate = source.data.section_7520;
  assert.equal(rate.table, 5);
  assert.equal(rate.page, 4);
  assert.equal(rate.statutory_purpose, 'section 7520 present-value valuation');
  assert.equal(rate.compounding, 'not-stated-in-table');
  assert.equal(rate.unit, 'percent');
  assert.equal(rate.value, '5.60');
  assert.equal(ledger.visual_checks.find(check => check.table === 5).value_percent, rate.value);
  assert.ok(!source.data.base_afr.rates.some(cell => cell.table === 5));
});

test('rate month, visual provenance, unknown publication date and rights stay distinct from professional approval', () => {
  assert.equal(source.data.published_rate_month, '2026-10');
  assert.equal(ledger.published_rate_month, source.data.published_rate_month);
  assert.equal(source.data.publication_date, null);
  assert.equal(source.reviewed_at, '2026-10-02');
  assert.equal(source.review_status, 'source-checked');
  assert.equal(source.data.professional_review_status, 'pending');
  assert.equal(ledger.source_id, id);
  assert.equal(ledger.source_url, source.source_url);
  assert.equal(ledger.pdf_sha256, '5baef5d7ab63efcd02684d2f700fe463c58ff78d6ff142bfcf23cd933ba2e914');
  assert.equal(source.provenance.pdf_sha256, ledger.pdf_sha256);
  assert.deepEqual(ledger.visual_checks.map(check => check.page), [1,2,4]);
  assert.match(ledger.verification_method, /visual inspection.*row and column label.*not the sole/);
  assert.equal(source.rights.full_text_stored, false);
  assert.equal(source.rights.source_status, 'unknown');
  for (const key of ['source_license','source_license_url','source_permission_scope']) assert.equal(source.rights[key], null);
  assert.equal(ledger.full_text_stored, false);
  assert.match(source.data.limitations.join(' '), /rate-selection|prior-month elections/);
});

test('undated retrieval exposes rate facts while dated native and agent retrieval count unknown-bound omissions', () => {
  const q = 'IRS Revenue Ruling 2026-19';
  const undated = search(new URLSearchParams({q,kind:'source'}));
  assert.deepEqual(undated.records.find(record => record.id === id), source);
  const markdown = recordMarkdown(source);
  for (const text of ['2026-10','section 1274(d)','section 7520','5.60','not-stated-in-table']) assert.ok(markdown.includes(text));
  const passages = [];
  let cursor;
  do {
    const facts = executeAgent('get', {id,section:'data.base_afr',limit:20,...(cursor ? {cursor} : {})});
    passages.push(...facts.passages);
    cursor = facts.next_cursor;
  } while (cursor);
  const factText = passages.map(passage => passage.text).join('\n');
  for (const value of Object.values(expected).flat()) assert.ok(factText.includes(value), value);
  for (const term of Object.keys(expected)) assert.ok(factText.includes(term), term);
  for (const convention of conventions) assert.ok(factText.includes(convention), convention);
  const period = knowledge.profile(id).scope.period;
  assert.equal(period.effective_from, null);
  assert.equal(period.effective_to, null);
  for (const as_of of ['2025-10-01','2026-10-01','2026-10-31']) {
    assert.ok(!search(new URLSearchParams({q,kind:'source',as_of})).records.some(record => record.id === id));
    for (const method of ['search','context']) {
      const result = executeAgent(method, {q,kind:'source',as_of,...(method === 'context' ? {max_chars:12000} : {})});
      assert.ok(!(method === 'search' ? result.results : result.records).some(record => record.id === id));
      assert.ok(result.temporal_filter.excluded['unknown-effective-from'] >= 1);
    }
  }
});
