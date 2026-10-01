import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {beforeApplicabilityAudit} from './fixtures/applicability-preservation.mjs';

const records = JSON.parse(fs.readFileSync('data/corpus/source.json', 'utf8'));
const audit = JSON.parse(fs.readFileSync('data/research/family-office-applicability-2026-10-01.json', 'utf8'));
const historical = record => {
  const old = structuredClone(record);
  for (const key of ['effective_from', 'effective_to', 'effective_note', 'applicability_audit']) delete old.data[key];
  return old;
};
test('preservation allowance binds every added field to all eight audit rows', () => {
  for (const row of audit.rows) {
    const current = records.find(record => record.id === row.id);
    const old = historical(current);
    assert.deepEqual(beforeApplicabilityAudit(current, old), old);
    const tampered = structuredClone(current);
    tampered.data.applicability_audit.locator = 'unsupported locator';
    assert.throws(() => beforeApplicabilityAudit(tampered, old), /differs from ledger/);
  }
});
test('preservation allowance rejects invented dates and retains unrelated changes for exact comparison', () => {
  const current = records.find(record => record.id === audit.rows.find(row => row.effective_from === null).id);
  const old = historical(current);
  const invented = structuredClone(current);
  invented.data.effective_from = '2025-01-01';
  assert.throws(() => beforeApplicabilityAudit(invented, old), /unexpected audit field/);
  const changed = structuredClone(current);
  changed.rights.source_status = 'unreviewed-change';
  assert.notDeepEqual(beforeApplicabilityAudit(changed, old), old);
  const existing = structuredClone(old);
  existing.data.effective_note = 'historical field cannot be erased';
  assert.throws(() => beforeApplicabilityAudit(current, existing), /must be additive/);
});
