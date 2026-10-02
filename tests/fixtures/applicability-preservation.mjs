import {beforeForm706Supplement} from './form706-preservation.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const audit = JSON.parse(fs.readFileSync('data/research/family-office-applicability-2026-10-01.json', 'utf8'));
const rows = new Map(audit.rows.map(row => [row.id, row]));

// Historical preservation comparisons allow only this separately reviewed,
// ledger-bound addition and the two contradictory Form 1041 period fields.
// Callers still compare every remaining field exactly.
export function beforeApplicabilityAudit(current, historical) {
  const retained = beforeForm706Supplement(current, historical);
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
  // The original "2025 only" prose contradicted this source's ledger-backed
  // fiscal/short-year scope. Permit only that exact correction in both fields.
  if (row.id === 'src_family_office_irs_1041_2025') {
    for (const [currentPeriod, historicalPeriod] of [
      [retained.data, historical.data],
      [retained.data.source_review, historical.data.source_review],
    ]) {
      assert.equal(historicalPeriod.effective_period, 'Tax year 2025 only; no automatic transfer to the illustrative 2026 close.', 'Expected original Form 1041 period');
      assert.equal(currentPeriod.effective_period, row.decision, 'Form 1041 period correction differs from ledger');
      currentPeriod.effective_period = historicalPeriod.effective_period;
    }
  }
  return retained;
}
