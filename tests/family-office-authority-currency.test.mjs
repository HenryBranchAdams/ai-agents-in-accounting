import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

const id='src_family_office_ecfr_20260925';
const raw=fs.readFileSync('data/corpus/source.json','utf8');
const sources=JSON.parse(raw), source=sources.find(r=>r.id===id);

test('family-office currency evidence preserves all existing source bytes and historical provenance',()=>{
 const prior=execFileSync('git',['show','e6dbd4c:data/corpus/source.json'],{encoding:'utf8',maxBuffer:32*1024*1024});
 const prefix=prior.slice(0,prior.match(/\n\]\s*$/).index);
 assert.ok(raw.startsWith(prefix+',\n'),'Existing source text must remain byte-identical');
 const original=JSON.parse(prior);
 for(const record of original)assert.deepEqual(sources.find(r=>r.id===record.id),record);
 assert.equal(sources.filter(r=>r.id===id).length,1);
 assert.ok(source.related_ids.includes('src_family_office_sec_2011_rule'));
});

test('currency evidence separates observation, publisher currency and title-level amendment dates',()=>{
 assert.ok(source);
 assert.equal(source.reviewed_at,'2026-09-30');
 assert.equal(source.data.currency.displayed_current_through,'2026-09-25');
 assert.equal(source.data.currency.observed_at,source.reviewed_at);
 assert.equal(source.data.currency.displayed_title_last_amended,'2026-09-16');
 assert.equal(source.data.currency.verified_through_observation_date,false);
 assert.match(source.data.currency.title_amendment_date_scope,/not the family-office section/);
 assert.match(source.data.effective_period,/October 31, 2016/);
 assert.match(source.data.limitations.join(' '),/September 26-30 changes were not established/);
 assert.match(source.data.limitations.join(' '),/authoritative but unofficial/);
 assert.match(source.data.limitations.join(' '),/No professional sign-off or empirical agent performance/);
 const review=source.data.source_review;
 assert.equal(review.checked_url,source.source_url);
 assert.equal(review.review_level,'substantive-excerpt');
 assert.ok(review.checks.some(c=>c.url===source.source_url&&c.locator.includes('(b)(1)-(3)')&&c.material_read));
 assert.ok(review.checks.some(c=>c.url.includes('2016-20832')&&c.locator.includes('#p-amd-2')&&c.material_read));
 assert.ok(review.checks.some(c=>c.url.endsWith('#legal-status')&&c.material_read));
 for(const check of review.checks){assert.equal(check.checked_at,source.reviewed_at);assert.ok(check.outcome);}
 assert.equal(source.rights.source_status,'unknown');
 assert.equal(source.rights.full_text_stored,false);
 assert.equal(source.data.source_rights.status,'unknown');
 assert.equal(source.data.source_rights.full_text_stored,false);
 assert.equal(source.data.source_rights.permission_scope,null);
});
