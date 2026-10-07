import {assertApplicabilityReviewState} from './fixtures/family-office-applicability-review.mjs';
import {beforeApplicabilityAudit} from './fixtures/applicability-preservation.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

const id='src_fo_ref_sec_family_rule';
const batch='family-office-ecfr-2026-09-30';
const raw=fs.readFileSync('data/corpus/source.json','utf8');
const sources=JSON.parse(raw), source=sources.find(r=>r.id===id);
const supplemental=source.data.supplemental_reviews.find(r=>r.batch===batch);

test('family-office currency review reuses the unique source and preserves historical fields',()=>{
 const prior=JSON.parse(execFileSync('git',['show','e6dbd4c:data/corpus/source.json'],{encoding:'utf8',maxBuffer:32*1024*1024}));
 const priorIds=new Set(prior.map(record=>record.id));
 const additions=new Set(sources.filter(record=>!priorIds.has(record.id)).map(record=>record.id));
 for(const id of ['src_estate_irs_8971_202508','src_estate_td9991_20240917','src_irs_afr_rr2026_19'])assert.ok(additions.has(id),id);
 for(const record of prior){
  const retained=beforeApplicabilityAudit(sources.find(r=>r.id===record.id),record);
  if(record.id===id){
   assert.equal(retained.data.supplemental_reviews.filter(r=>r.batch===batch).length,1);
   retained.data.supplemental_reviews=retained.data.supplemental_reviews.filter(r=>r.batch!==batch);
   if(!record.data.supplemental_reviews)delete retained.data.supplemental_reviews;
  }
  assert.deepEqual(retained,record,record.id);
 }
 assert.equal(sources.filter(r=>r.source_url===source.source_url).length,1);
 assert.equal(sources.some(r=>r.id==='src_family_office_ecfr_20260925'),false);
 assert.equal(source.reviewed_at,null);
 assert.equal(source.review_status,'discovery-imported-not-reverified');
 assert.ok(source.related_ids.includes('src_family_office_sec_2011_rule'));
});

test('currency evidence separates observation, publisher currency and title-level amendment dates',()=>{
 assert.ok(source);
 assert.equal(supplemental.reviewed_at,'2026-09-30');
 assert.equal(supplemental.currency.displayed_current_through,'2026-09-25');
 assert.equal(supplemental.currency.observed_at,supplemental.reviewed_at);
 assert.equal(supplemental.currency.displayed_title_last_amended,'2026-09-16');
 assert.equal(supplemental.currency.verified_through_observation_date,false);
 assert.match(supplemental.currency.title_amendment_date_scope,/not the family-office section/);
 assert.match(supplemental.effective_period,/October 31, 2016/);
 assert.match(supplemental.limitations.join(' '),/September 26-30 changes were not established/);
 assert.match(supplemental.limitations.join(' '),/authoritative but unofficial/);
 assert.match(supplemental.limitations.join(' '),/No professional sign-off or empirical agent performance/);
 const review=supplemental;
 assert.equal(review.checked_url,source.source_url);
 assert.equal(review.review_level,'substantive-excerpt');
 assert.ok(review.checks.some(c=>c.url===source.source_url&&c.locator.includes('(b)(1)-(3)')&&c.material_read));
 assert.ok(review.checks.some(c=>c.url.includes('2016-20832')&&c.locator.includes('#p-amd-2')&&c.material_read));
 assert.ok(review.checks.some(c=>c.url.endsWith('#legal-status')&&c.material_read));
 for(const check of review.checks){assert.equal(check.checked_at,supplemental.reviewed_at);assert.ok(check.outcome);}
 assert.equal(source.rights.source_status,'unknown');
 assert.equal(source.rights.full_text_stored,false);
 assert.equal(supplemental.source_rights.status,'unknown');
 assert.equal(supplemental.source_rights.full_text_stored,false);
 assert.equal(supplemental.source_rights.permission_scope,null);
});

test('supplemental currency note is visible and retrievable without replacing historical answers',async()=>{
 const[{getRecord,recordMarkdown,records},{executeAgent},{editorialReviewReport},{default:worker}]=await Promise.all([import('../dist/internal/corpus.mjs'),import('../dist/internal/agent.mjs'),import('../scripts/editorial-review.mjs'),import('./worker-fixture.mjs')]);
 const guideId='guide-family-office-us-accounting',guide=getRecord(guideId),brief=guide.data.editorial_brief;
 const historical=JSON.parse(execFileSync('git',['show','caf023cbed4cd651274201708b45501ddc1aa0ad:data/corpus/guide.json'],{encoding:'utf8',maxBuffer:32*1024*1024})).find(r=>r.id===guideId);
 const retained=structuredClone(guide);delete retained.data.editorial_brief;
 assert.deepEqual(retained.source_ids,[...historical.source_ids,id]);retained.source_ids.pop();assert.deepEqual(retained,historical);
 assert.ok(brief.reading_order.includes(id));
 assert.equal(brief.findings.filter(f=>f.source_ids.includes(id)).length,1);
 assertApplicabilityReviewState([editorialReviewReport(records).find(r=>r.record_id===guideId)]);
 const response=await worker.fetch(new Request(`https://corpus.example/records/${guideId}`));assert.equal(response.status,200);
 const html=await response.text(),md=recordMarkdown(guide);
 for(const text of ['Supplemental source-currency note','September 25','September 26–30 changes']){assert.ok(html.includes(text));assert.ok(md.includes(text));}
 assert.ok(html.includes(`/records/${id}`));assert.ok(md.includes(`/records/${id}`));
 const sourceResponse=await worker.fetch(new Request(`https://corpus.example/records/${id}`));assert.equal(sourceResponse.status,200);
 assert.ok((await sourceResponse.text()).includes('authoritative but unofficial'));
 let cursor;const passages=[];
 do{const r=executeAgent('get',{id,section:'data.supplemental_reviews',limit:3,...(cursor?{cursor}:{})});passages.push(...r.passages);cursor=r.next_cursor;}while(cursor);
 const text=passages.map(p=>p.text).join('\n');for(const marker of ['2026-09-30','2026-09-25','false'])assert.ok(text.includes(marker),marker);
});
