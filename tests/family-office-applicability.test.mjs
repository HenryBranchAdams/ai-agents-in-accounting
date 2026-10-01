import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { records, knowledge, search, createKnowledgeIndex, applicabilityExclusion } from '../dist/internal/corpus.mjs';
import { executeAgent } from '../dist/internal/agent.mjs';
import { outputSchemas } from '../dist/internal/agent-contract.mjs';

const audit = JSON.parse(fs.readFileSync('data/research/family-office-applicability-2026-10-01.json'));
const sec = 'src_family_office_sec_2011_rule';

test('bounded audit records only a source-supported date and preserves seven unknown windows', () => {
  assert.equal(audit.rows.length, 8);
  assert.equal(audit.rows.filter(row => row.effective_from).length, 1);
  for (const row of audit.rows) {
    const record = records.find(record => record.id === row.id);
    const period = knowledge.profile(row.id).scope.period;
    assert.equal(period.effective_from, row.effective_from);
    assert.equal(period.effective_to, row.effective_to);
    assert.equal(record.data.applicability_audit.source_url, row.source_url);
    assert.equal(record.data.applicability_audit.note, row.decision);
    assert.ok(row.locator);
    assert.notEqual(record.reviewed_at, '2026-10-01', 'date audit does not upgrade substantive review');
  }
  assert.ok(knowledge.profile(sec).scope.basis.period.pointers.includes('/data/effective_from'));
});

test('native and agent date retrieval include the published SEC rule at its effective boundary', () => {
  const q = 'SEC Family Offices final rule';
  for (const [date, expected] of [['2011-08-28', false], ['2011-08-29', true], ['2025-12-31', true]]) {
    assert.equal(search(new URLSearchParams({ q, kind: 'source', as_of: date })).records.some(r => r.id === sec), expected);
    const result = executeAgent('search', { q, kind: 'source', as_of: date });
    assert.equal(result.results.some(r => r.id === sec), expected);
    assert.ok(outputSchemas.search.safeParse(result).success);
    if (!expected) assert.equal(result.temporal_filter.excluded['before-effective-from'], 1);
  }
});

test('2025 edition is retrievable without as_of and its unknown window is explicitly counted with as_of', () => {
  const q = 'IRS 2025 Form 1041 instructions';
  const plain = executeAgent('search', { q, kind: 'source' });
  assert.ok(plain.results.some(r => r.id === 'src_family_office_irs_1041_2025'));
  assert.equal(plain.temporal_filter, null);
  const dated = executeAgent('search', { q, kind: 'source', as_of: '2025-12-31' });
  assert.equal(dated.total, 0);
  assert.ok(dated.temporal_filter.excluded['unknown-effective-from'] >= 1);
  const packet = executeAgent('context', { q, kind: 'source', as_of: '2025-12-31', max_chars: 12000 });
  assert.equal(packet.records.length, 0);
  assert.deepEqual(packet.temporal_filter, dated.temporal_filter);
  assert.ok(outputSchemas.context.safeParse(packet).success);
});

test('complete bounds, unknown ends and invalid calendar dates fail closed without publication fallback', () => {
  const fixture = (id, data) => ({ id, kind: 'source', title: id, reviewed_at: '2025-01-01', data });
  const index = createKnowledgeIndex([
    fixture('bounded', { effective_from: '2025-01-01', effective_to: '2025-12-31' }),
    fixture('publication', { publication_date: '2025-01-01' }),
    fixture('partial', { effective_from: '2025-01' }),
    fixture('invalid', { effective_from: '2025-02-30' }),
    fixture('unknown-end', { effective_from: '2025-01-01', effective_to: '2025-12' }),
  ]);
  const reason = (id, date) => applicabilityExclusion(index.profile(id).scope.period, date);
  assert.equal(reason('bounded', '2025-01-01'), null);
  assert.equal(reason('bounded', '2025-12-31'), null);
  assert.equal(reason('bounded', '2026-01-01'), 'after-effective-to');
  for (const id of ['publication', 'partial', 'invalid']) assert.equal(reason(id, '2025-06-01'), 'unknown-effective-from');
  assert.equal(reason('unknown-end', '2025-06-01'), 'unknown-effective-to');
});
