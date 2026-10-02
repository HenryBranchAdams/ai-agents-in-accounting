import assert from 'node:assert/strict';
import fs from 'node:fs';

export const form706Receipt = JSON.parse(fs.readFileSync('data/research/form706-routing-review-2026-10-02.json', 'utf8'));
// Remove only the exact additive receipt from this one identity for historical
// comparisons. Every other field remains available to callers' deepEqual.
export function beforeForm706Supplement(current, historical) {
  const retained = structuredClone(current);
  if (retained?.id !== 'src_fo_ref_irs_i706' || retained.kind !== 'source') return retained;
  assert.equal(Object.hasOwn(historical.data, 'supplemental_reviews'), false, 'Form 706 supplement must be additive');
  assert.deepEqual(retained.data.supplemental_reviews, [form706Receipt], 'Form 706 supplement differs from reviewed receipt');
  delete retained.data.supplemental_reviews;
  return retained;
}
