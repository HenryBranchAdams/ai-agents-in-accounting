import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {getRecord, recordMarkdown, records} from '../dist/internal/corpus.mjs';
import {executeAgent} from '../dist/internal/agent.mjs';
import {editorialReviewReport} from '../scripts/editorial-review.mjs';
import worker from './worker-fixture.mjs';

const id='guide-family-office-us-accounting';
const guide=getRecord(id), brief=guide.data.editorial_brief;
const base='caf023cbed4cd651274201708b45501ddc1aa0ad';
const htmlText=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#x27;');

test('controller orientation preserves the accepted technical questions and their partial assessments',()=>{
 const original=JSON.parse(execFileSync('git',['show',`${base}:data/corpus/guide.json`],{encoding:'utf8',maxBuffer:32*1024*1024})).find(r=>r.id===id);
 const retained=structuredClone(guide);delete retained.data.editorial_brief;
 assert.deepEqual(retained.source_ids,[...original.source_ids,'src_family_office_ecfr_20260925']);retained.source_ids.pop();
 assert.deepEqual(retained,original,'Only the named editorial brief and supplemental source link may be appended');
 assert.deepEqual(guide.data.research_questions,original.data.research_questions);
 for(const key of ['reviewed_at','review_status','rights','provenance'])assert.deepEqual(guide[key],original[key],key);
 const assessments=JSON.parse(fs.readFileSync('data/coverage/assessments.json')).assessments;
 for(const q of guide.data.research_questions){
  assert.equal(q.assessment_status,'partial');
  assert.ok(assessments.some(a=>JSON.stringify(a).includes(q.id)&&a.status==='partial'));
 }
 const report=editorialReviewReport(records).find(r=>r.record_id===id);
 assert.equal(report.status,'dependencies-unchanged');
 assert.match(brief.reading.critical_limitation,/Discovery routes remain discovery/);
});

test('controller reading is visible before record metadata and preserves native evidence routes',async()=>{
 const response=await worker.fetch(new Request(`https://corpus.example/records/${id}`));
 assert.equal(response.status,200);
 const html=await response.text(),md=recordMarkdown(guide);
 assert.ok(html.indexOf(htmlText(brief.answer))<html.indexOf('aria-label="Review and rights"'));
 assert.equal(brief.reading.sections.length,11);
 for(const section of brief.reading.sections){assert.ok(html.includes(htmlText(section.title)));assert.ok(md.includes(section.title));}
 for(const route of brief.reading_order){assert.ok(getRecord(route));assert.ok(html.includes(`/records/${route}`));assert.ok(md.includes(`/records/${route}`));}
 for(const q of guide.data.research_questions)assert.ok(html.includes(`id="${q.id}"`));
 assert.ok(html.includes('Original synthetic example'));
 assert.ok(md.includes('employer'));
 assert.ok(md.includes('Missing documents keep the authority or reporting conclusion unresolved'));
});

test('bounded agent retrieval exposes the controller evidence boundary and precise source pointers',()=>{
 const directory=executeAgent('get',{id,limit:1});
 assert.ok(directory.sections.some(s=>s.id==='data.editorial_brief'));
 const passages=[];let cursor,result;
 do{result=executeAgent('get',{id,section:'data.editorial_brief',limit:20,...(cursor?{cursor}:{})});passages.push(...result.passages);cursor=result.next_cursor;}while(cursor);
 const limitation=passages.find(p=>p.source_pointers.includes('/data/editorial_brief/reading/critical_limitation'));
 assert.ok(limitation?.text.includes('six family-office assessments remain partial'));
 assert.equal(result.record.rights.full_text_stored,false);
 const text=passages.filter(p=>p.source_pointers.some(pointer=>pointer.startsWith('/data/editorial_brief/reading/example/'))).map(p=>p.text).join('\n');
 assert.match(text,/Unresolved account title/);
 assert.match(text,/processor/);
 assert.match(text,/donor|Donor/);
});
