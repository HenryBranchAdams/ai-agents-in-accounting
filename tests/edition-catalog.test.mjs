import test from 'node:test';
import assert from 'node:assert/strict';
import { editionCatalog } from '../scripts/edition-catalog.mjs';

test('edition inventory narrative advances without claiming or changing review acceptance', () => {
  const before = { corpus_version: '2026-10-02.4', updated_at: '2026-10-02',
    coverage_note: 'Earlier scoped associations remain partial.',
    review_note: 'Professional acceptance is pending.', reviewed_at: null,
    rights: { source_status: 'unknown' }, record_count: 1565 };
  const after = editionCatalog(before, '2026-10-02.5', '2026-10-03');
  assert.ok(after.coverage_note.startsWith(before.coverage_note));
  assert.ok(after.coverage_note.includes(after.corpus_version));
  assert.match(after.coverage_note, /do not establish adequate coverage, source currency or professional acceptance/);
  for (const key of ['review_note', 'reviewed_at', 'rights', 'record_count']) assert.deepEqual(after[key], before[key]);
  assert.equal(before.corpus_version, '2026-10-02.4');
  assert.equal(before.coverage_note, 'Earlier scoped associations remain partial.');
  assert.deepEqual(editionCatalog(after, '2026-10-02.5', '2026-10-03'), after);
  const next = editionCatalog(after, '2026-10-02.6', '2026-10-04');
  assert.ok(next.coverage_note.includes(next.corpus_version));
  assert.equal(next.review_note, before.review_note);
});
