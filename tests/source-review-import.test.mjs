import test from 'node:test';
import assert from 'node:assert/strict';
import { applySourceReview } from '../scripts/import-source-reviews.mjs';

const record = {
  id:'src_fixture', kind:'source', title:'Original publisher title', source_url:'https://example.org/original',
  review_status:'inherited-not-reverified', reviewed_at:null,
  rights:{source_status:'unknown',source_license:null}, provenance:{note:'Historical evidence retained'},
  data:{title:'Original publisher title', limitations:['Earlier limit']},
};
const batch = {reviewed_at:'2026-09-11',reviewer:'Fixture reviewer'};
const review = {
  record_id:'src_fixture', checked_url:'https://example.org/original', disposition:'unresolved-access',
  review_level:'attempted-unresolved', source_locator:null,
  evidence_summary:'The original page could not be read during the bounded review attempt. A reachable URL would not establish the accuracy or scope of the source.',
  checks:[{url:'https://example.org/original',outcome:'Access denied',material_read:false}],
  limitations:['The substantive source contents remain unverified.'],
  corrections:{title:null,source_url:null}, rights_review:{status:'unresolved'},
};

test('an unresolved source attempt preserves identity, rights and inherited review status', () => {
  const updated = applySourceReview(record, review, batch);
  assert.equal(updated.title, record.title);
  assert.equal(updated.source_url, record.source_url);
  assert.equal(updated.reviewed_at, null);
  assert.equal(updated.review_status, 'inherited-not-reverified');
  assert.equal(updated.rights.source_status, 'unknown');
  assert.equal(updated.data.source_review.previous_review.reviewed_at, null);
  assert.equal(updated.data.limitations.length, 2);
  assert.equal(record.data.source_review, undefined);
  assert.strictEqual(applySourceReview(updated,review,batch), updated);
});

test('a supported correction records the checked scope without granting reuse rights', () => {
  const revised = {...review,disposition:'corrected-association',review_level:'abstract-or-landing',source_locator:'Abstract, final paragraph',corrections:{title:'Corrected study title'}};
  const updated = applySourceReview(record,revised,batch);
  assert.equal(updated.title, 'Corrected study title');
  assert.equal(updated.data.title, updated.title);
  assert.equal(updated.reviewed_at, batch.reviewed_at);
  assert.equal(updated.review_status,'source-checked');
  assert.equal(updated.rights.source_status,'unknown');
  assert.match(updated.provenance.review_scope,/abstract-or-landing/);
  assert.throws(() => applySourceReview(record,{...revised,rights_review:{status:'confirmed-license',license:'CC-BY-4.0'}},batch));
});
