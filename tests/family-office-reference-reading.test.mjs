import test from 'node:test';
import assert from 'node:assert/strict';
import worker from './worker-fixture.mjs';
import {getRecord, recordMarkdown} from '../dist/internal/corpus.mjs';
import {executeAgent} from '../dist/internal/agent.mjs';
const entry = 'collection-family-office-reference';
const escape = text => text.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#x27;');
const request = route => worker.fetch(new Request('https://corpus.test' + route));
const page = async id => {const response=await request('/records/'+id); assert.equal(response.status,200,id); return response.text();};
test('family-office collection is discoverable and all topic/context links are server rendered', async () => {
  const html=await page(entry), data=getRecord(entry).data.family_office_reference;
  assert.match(html,/Find guidance for your question/);
  assert.equal(data.topics.length,40); assert.equal(data.context_ids.length,12);
  for(const row of data.topics) assert.ok(html.includes(`/records/${row.record_id}`),row.record_id);
  for(const id of data.context_ids) assert.ok(html.includes(`/records/${id}`),id);
  assert.match(html,/<details><summary>All 112 source-discovery annotations/);
  const hits=executeAgent('search',{q:'"Family-office accounting reference library"',kind:'collection',limit:20});
  assert.ok(hits.results.some(row=>row.id===entry));
});
test('representative reading routes retain entry points, boundaries and unanswered prompts', async () => {
  for(const id of ['guide-fo-reference-fo-13','guide-fo-reference-fo-22','guide-fo-reference-fo-27']) {
    const html=await page(id), record=getRecord(id), route=record.data.family_office_reference;
    assert.ok(html.includes(escape(route.framing_question)));
    assert.ok(html.includes(escape(route.boundary)));
    assert.match(html,/unanswered research prompts/);
    for(const step of route.reading_path) {
      assert.ok(html.includes(`/records/${step.annotation.record_id}`));
      assert.ok(html.includes(escape(step.annotation.start_at)));
      assert.ok(html.includes(escape(step.annotation.scope_limit)));
    }
    const md=recordMarkdown(record);
    assert.ok(md.includes('discovery-question-not-answered'));
    assert.ok(md.includes('discovery-imported-not-reverified'));
  }
});
test('context and ASC routes preserve private-information and locator limitations', async () => {
  const id=getRecord(entry).data.family_office_reference.context_ids[0];
  const html=await page(id), checklist=getRecord(id).data.family_office_reference.checklist;
  for(const value of checklist.required_context) assert.ok(html.includes(escape(value)));
  assert.ok(html.includes(escape(checklist.privacy_boundary)));
  const asc=await page('guide-fo-reference-asc-map');
  assert.match(asc,/paragraph text not reviewed/);
  assert.match(asc,/not verified paragraph citation/);
  const gaps=await page('guide-fo-reference-research-gaps');
  assert.match(gaps,/historical G12 registry-access limitation is resolved/);
});
test('agent retrieval keeps discovery provenance and reports bounded context omissions', () => {
  const id='guide-fo-reference-fo-13';
  const got=executeAgent('get',{id,section:'data.family_office_reference',limit:20});
  assert.equal(got.record.id,id);
  assert.equal(got.record.reviewed_at,null);
  assert.equal(got.record.review_status,'discovery-imported-not-reverified');
  assert.ok(got.record.rights);
  const context=executeAgent('context',{ids:[id],include_sources:true,max_chars:4000});
  assert.ok(context.budget.used_chars<=4000);
  assert.equal(context.budget.used_chars,JSON.stringify(context).length);
  assert.ok(context.omitted.length || context.records.some(row=>row.remaining_passages>0));
});
