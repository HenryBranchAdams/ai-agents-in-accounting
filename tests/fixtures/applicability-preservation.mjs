import assert from 'node:assert/strict';
import fs from 'node:fs';

const audit = JSON.parse(fs.readFileSync('data/research/family-office-applicability-2026-10-01.json', 'utf8'));
const rows = new Map(audit.rows.map(row => [row.id, row]));

// Historical preservation comparisons allow only this separately reviewed,
// ledger-bound addition. Callers still compare every remaining field exactly.
export function beforeApplicabilityAudit(current, historical) {
  const retained = structuredClone(current);
  const row = retained?.kind === 'source' ? rows.get(retained.id) : null;
  if (!row) return retained;
  const expected = {
    effective_note: row.decision,
    applicability_audit: {
      audited_at: audit.audited_at,
      reviewer: 'Codex AI-assisted bounded applicability audit',
      source_url: row.source_url,
      locator: row.locator,
      disposition: row.effective_from ? 'recorded-effective-start' : 'unknown-date-bounds',
      note: row.decision,
    },
  };
  if (row.effective_from !== null) expected.effective_from = row.effective_from;
  if (row.effective_to !== null) expected.effective_to = row.effective_to;
  for (const key of ['effective_from', 'effective_to', 'effective_note', 'applicability_audit']) {
    assert.equal(Object.hasOwn(historical.data, key), false, `${row.id}: audit must be additive over historical ${key}`);
    assert.equal(Object.hasOwn(retained.data, key), Object.hasOwn(expected, key), `${row.id}: unexpected audit field ${key}`);
    if (Object.hasOwn(expected, key)) {
      assert.deepEqual(retained.data[key], expected[key], `${row.id}: audit ${key} differs from ledger`);
      delete retained.data[key];
    }
  }
  return retained;
}
