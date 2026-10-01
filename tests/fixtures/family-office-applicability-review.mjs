import assert from 'node:assert/strict';
import {editorialHash} from '../../scripts/editorial-review.mjs';

// The bounded applicability audit amended sources, not the accepted editorial
// reviews. Keep their pinned hashes/dates and require honest stale reporting.
const shared = [
  'src_family_office_sec_2011_rule',
  'src_family_office_irs_k1_1065_2025',
  'src_family_office_texas_principal_income',
  'src_family_office_irs_1041_2025',
  'src_family_office_irs_k1_1041_2025',
  'src_family_office_irs_p559_2025',
];
export const staleFamilyOfficeDependencies = {
  'workflow-family-office-entity-close': shared,
  'control-family-office-ownership-payments': shared,
  'guide-family-office-us-accounting': [...shared, 'src_fo_ref_sec_family_rule'],
  'example-family-office-four-entity-close': ['src_family_office_irs_k1_1065_2025', 'src_family_office_irs_k1_1041_2025'],
};
export function assertApplicabilityReviewState(reviews) {
  for (const review of reviews) {
    assert.ok(review, 'Expected editorial review report must exist');
    const expected = staleFamilyOfficeDependencies[review.record_id] ?? [];
    assert.equal(review.status, expected.length ? 'editorial-review-needed' : 'dependencies-unchanged', review.record_id);
    assert.deepEqual(review.changed_dependencies, expected, review.record_id);
    if (expected.length) assert.equal(review.reviewed_at, '2026-09-30', 'Source amendments must not advance the editorial review date');
  }
}
export function assertPinnedApplicabilityDependencies(record, byId) {
  const stale = staleFamilyOfficeDependencies[record.id] ?? [];
  const dependencies = record.data.editorial_brief.reading.review.dependencies;
  assert.deepEqual(dependencies.filter(dependency => stale.includes(dependency.record_id)).map(dependency => dependency.record_id), stale);
  for (const dependency of dependencies) {
    assert.ok(byId.has(dependency.record_id), dependency.record_id);
    const current = editorialHash(byId.get(dependency.record_id));
    if (stale.includes(dependency.record_id)) assert.notEqual(current, dependency.sha256, `Audited source must remain pending editorial review: ${dependency.record_id}`);
    else assert.equal(current, dependency.sha256, dependency.record_id);
  }
}
