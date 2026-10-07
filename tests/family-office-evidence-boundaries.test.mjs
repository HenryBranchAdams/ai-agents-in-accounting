import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {executeAgent} from '../dist/internal/agent.mjs';

const canonical = ['source', 'guide'].flatMap(kind => JSON.parse(fs.readFileSync(`data/corpus/${kind}.json`, 'utf8')));
const byId = new Map(canonical.map(record => [record.id, record]));
function passages(id, section) {
  const result = [], seen = new Set();
  let cursor;
  do {
    const page = executeAgent('get', {id, section, limit:2, ...(cursor ? {cursor} : {})});
    assert.equal(page.record.id, id);
    result.push(...page.passages);
    cursor = page.next_cursor;
    if (cursor) {
      assert.ok(!seen.has(cursor), 'Evidence pagination must advance');
      seen.add(cursor);
    }
  } while (cursor);
  assert.ok(result.length, `${id}/${section} must supply evidence`);
  return result;
}
function delivered(items, pointer, marker) {
  const selected = items.filter(passage => passage.source_pointers.includes(pointer));
  assert.ok(selected.length, `Missing canonical evidence pointer ${pointer}`);
  assert.ok(selected.map(passage => passage.text).join('\n').includes(String(marker)), `${pointer}: ${marker}`);
}

test('agent date inclusion delivers the rule while retaining its exclusive estate-return condition', () => {
  const id = 'src_estate_td9991_20240917';
  for (const [as_of, included] of [['2024-09-16', false], ['2024-09-17', true]]) {
    const result = executeAgent('search', {q:'Treasury Decision 9991', kind:'source', as_of});
    assert.equal(result.results.some(record => record.id === id), included);
  }
  const condition = byId.get(id).data.applicability.estate_return_filing_condition;
  assert.deepEqual(condition, {date:'2024-09-17', relation:'after', boundary_included:false});
  const evidence = passages(id, 'data.applicability');
  for (const [key, value] of Object.entries(condition)) delivered(evidence, `/data/applicability/estate_return_filing_condition/${key}`, value);
  const limits = passages(id, 'data.limitations');
  delivered(limits, '/data/limitations/1', byId.get(id).data.limitations[1]);
});

test('operative evidence checks reject a missing limitation pointer and a changed filing boundary', () => {
  const id = 'src_estate_td9991_20240917', pointer = '/data/limitations/1';
  const limits = structuredClone(passages(id, 'data.limitations'));
  for (const passage of limits) passage.source_pointers = passage.source_pointers.filter(value => value !== pointer);
  assert.throws(() => delivered(limits, pointer, byId.get(id).data.limitations[1]), /Missing canonical evidence pointer/);
  const relation = '/data/applicability/estate_return_filing_condition/relation';
  const changed = structuredClone(passages(id, 'data.applicability'));
  for (const passage of changed) passage.text = passage.text.replaceAll('after', 'before');
  assert.throws(() => delivered(changed, relation, 'after'), /after/);
});

test('Form 706 passage delivery keeps payment, conditional portability and unread relief authority separate', () => {
  const id = 'src_fo_ref_irs_i706', reviews = byId.get(id).data.supplemental_reviews;
  const ordinal = reviews.findIndex(review => review.batch === 'form706-routing-2026-10-02');
  assert.ok(ordinal >= 0);
  const receipt = reviews[ordinal], prefix = `/data/supplemental_reviews/${ordinal}`;
  assert.match(receipt.routing_context.payment, /filing extension does not establish payment-extension approval/);
  assert.match(receipt.routing_context.portability_relief, /conditional.*without a section 6018\(a\) filing requirement.*eligibility is unresolved/);
  assert.equal(receipt.underlying_relief_authority.status, 'not-read-in-this-review');
  assert.equal(receipt.professional_review_status, 'pending');
  const evidence = passages(id, 'data.supplemental_reviews');
  for (const key of ['ordinary_filing', 'payment', 'portability_relief']) delivered(evidence, `${prefix}/routing_context/${key}`, receipt.routing_context[key]);
  delivered(evidence, `${prefix}/underlying_relief_authority/status`, receipt.underlying_relief_authority.status);
  delivered(evidence, `${prefix}/professional_review_status`, receipt.professional_review_status);
  receipt.routing_context.required_context.forEach((value, index) => delivered(evidence, `${prefix}/routing_context/required_context/${index}`, value));
});

test('estate handoff delivers discovery questions without promoting a filing or property decision', () => {
  const id = 'guide-estate-beneficiary-reporting-lineage', guide = byId.get(id);
  assert.equal(guide.data.status, 'discovery-question-not-answered');
  delivered(passages(id, 'data.status'), '/data/status', guide.data.status);
  delivered(passages(id, 'data.boundary'), '/data/boundary', guide.data.boundary);
  const questions = passages(id, 'data.questions');
  guide.data.questions.forEach((question, index) => delivered(questions, `/data/questions/${index}/question`, question.question));
  const required = passages(id, 'data.required_context');
  guide.data.required_context.forEach((value, index) => delivered(required, `/data/required_context/${index}`, value));
  assert.ok(guide.source_ids.includes('src_estate_irs_8971_202508'));
  assert.ok(guide.source_ids.includes('src_estate_td9991_20240917'));
  const context = executeAgent('context', {ids:[id], include_sources:false, max_chars:12000});
  assert.deepEqual(context.records.map(row => row.record.id), [id]);
  assert.equal(context.retrieval.evidence_sufficiency, 'not-assessed');
  assert.equal(context.retrieval.linked_sources_not_considered, new Set(guide.source_ids).size);
});

test('Form 1041 delivers conditional periods and tax-character limits without inventing GAAP or entity eligibility', () => {
  const id = 'src_family_office_irs_1041_2025', source = byId.get(id);
  const record = executeAgent('get', {id, limit:1}).record;
  assert.deepEqual(record.knowledge.frameworks, []);
  assert.deepEqual(record.knowledge.entities, []);
  for (const filter of [{framework:'US GAAP'}, {entity:'Public company'}]) {
    const result = executeAgent('search', {q:'IRS 2025 Form 1041 instructions', kind:'source', ...filter});
    assert.ok(!result.results.some(row => row.id === id));
  }
  assert.match(source.data.effective_period, /fiscal years beginning in 2025 and ending in 2026.*conditional short-year 2026/);
  delivered(passages(id, 'data.effective_period'), '/data/effective_period', source.data.effective_period);
  delivered(passages(id, 'data.frameworks'), '/data/frameworks/0', 'US federal fiduciary income tax guidance');
  assert.match(source.data.source_review.evidence_summary, /cash paid alone does not settle tax character/);
  delivered(passages(id, 'data.source_review'), '/data/source_review/evidence_summary', source.data.source_review.evidence_summary);
});

test('a 5.60 discovery match delivers distinct base AFR and section 7520 cells rather than selecting a loan rate', () => {
  const id = 'src_irs_afr_rr2026_19', source = byId.get(id);
  const search = executeAgent('search', {q:'October 2026 short-term rate 5.60', kind:'source', limit:20});
  assert.ok(search.results.some(row => row.id === id));
  const index = source.data.base_afr.rates.findIndex(rate => rate.term === 'short-term' && rate.compounding === 'monthly');
  assert.ok(index >= 0);
  const cell = source.data.base_afr.rates[index];
  assert.equal(cell.value, '4.17');
  assert.equal(cell.table, 1);
  assert.equal(cell.unit, 'percent');
  const base = passages(id, 'data.base_afr');
  for (const key of ['value', 'table', 'term', 'compounding', 'unit']) delivered(base, `/data/base_afr/rates/${index}/${key}`, cell[key]);
  const valuation = source.data.section_7520;
  assert.equal(valuation.value, '5.60');
  assert.equal(valuation.table, 5);
  assert.equal(valuation.compounding, 'not-stated-in-table');
  const separate = passages(id, 'data.section_7520');
  for (const key of ['value', 'table', 'statutory_purpose', 'compounding', 'unit']) delivered(separate, `/data/section_7520/${key}`, valuation[key]);
  const requirements = passages(id, 'data.required_context');
  source.data.required_context.forEach((value, index) => delivered(requirements, `/data/required_context/${index}`, value));
});
