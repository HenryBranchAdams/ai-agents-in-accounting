import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const guides = JSON.parse(fs.readFileSync('data/corpus/guide.json', 'utf8'));

test('original Xero counterexample requires empty termination and preserves sparse cursor identities', () => {
  const fixture = guides.find(r => r.id === 'guide-xero-ledger-completeness').data.synthetic_counterexample;
  assert.equal(fixture.classification, 'project proposal');
  let cursor = 0;
  const recovered = [];
  for (const page of fixture.pages) {
    assert.equal(page.offset, cursor);
    assert.ok(page.journal_numbers.every(n => n > cursor));
    recovered.push(...page.journal_numbers);
    if (page.journal_numbers.length) cursor = page.journal_numbers.at(-1);
  }
  assert.deepEqual(fixture.pages.at(-1).journal_numbers, []);
  assert.equal(new Set(recovered).size, fixture.correct_empty_termination_count);
  const naive = fixture.pages[0].journal_numbers;
  assert.equal(naive.length, fixture.naive_short_page_stop_count);
  assert.deepEqual(recovered.filter(n => !naive.includes(n)), fixture.lost_journal_numbers);
  assert.ok(fixture.naive_short_page_stop_count < fixture.correct_empty_termination_count);
  // The fixture intentionally tests a project interpretation, never a vendor API.
  assert.match(fixture.meaning, /not captured Xero traffic/);
});

test('original QBO gap example distinguishes lookback coverage from a complete population', () => {
  const f = guides.find(r => r.id === 'guide-qbo-ledger-completeness').data.synthetic_counterexample;
  const cutoff = Date.parse(f.reconnected_at) - f.documented_lookback_days * 86400000;
  const recent = f.events.filter(e => Date.parse(e.modified_at) >= cutoff);
  const older = f.events.filter(e => Date.parse(e.modified_at) < cutoff);
  assert.deepEqual(recent.map(e => e.id), f.inside_window_ids);
  assert.deepEqual(older.map(e => e.id), f.outside_window_ids);
  assert.equal(recent.reduce((s, e) => s + e.amount_minor, 0), f.naive_observed_amount_minor);
  assert.equal(f.events.reduce((s, e) => s + e.amount_minor, 0), f.full_fixture_amount_minor);
  assert.ok(Date.parse(f.last_complete_checkpoint) < cutoff);
  assert.equal(f.classification, 'project proposal');
  assert.match(f.meaning, /not an Intuit response/);
});
