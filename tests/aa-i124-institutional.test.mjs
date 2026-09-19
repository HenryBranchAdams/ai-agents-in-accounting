import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { executeAgent } from '../dist/internal/agent.mjs';
import { validateSchema } from '../scripts/validate.mjs';

const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const packet = read('data/research/institutional-regulated-124.json');
const qs = packet.guide.data.research_questions;
test('AA-I124 explicit review status cannot claim unperformed professional or empirical verification', () => {
  const schema = read('schemas/coverage.schema.json');
  const a = read('data/coverage/assessments.json').assessments.find(a => a.id.startsWith('coverage-aa-i124-'));
  validateSchema(a, schema.$defs.assessment, schema);
  assert.throws(() => validateSchema({...a, professional_review:'verified'}, schema.$defs.assessment, schema));
  assert.throws(() => validateSchema({...a, empirical_support:'established'}, schema.$defs.assessment, schema));
});
test('AA-I124 source pointers, inherited question inventory and partial assessments remain connected', () => {
  const canonical = read('data/corpus/guide.json');
  const sources = read('data/corpus/source.json');
  assert.deepEqual(canonical.find(r => r.id === packet.guide.id), packet.guide);
  assert.equal(qs.length, 10);
  for (const row of packet.baseline_inventory) {
    const old = canonical.find(g => g.id === row.existing_guide_id);
    assert.deepEqual(old.data.research_questions.map(q => q.id), row.existing_question_ids);
    assert.ok(old.related_ids.includes(packet.guide.id));
  }
  for (const [i,q] of qs.entries()) {
    const registered = read('data/coverage/research-questions.json').questions.find(r => r.id === q.id);
    assert.equal(registered.pointer, `/data/research_questions/${i}`);
    assert.deepEqual(registered.source_ids, q.source_ids);
    for (const loc of q.source_locators) {
      assert.equal(sources.find(s => s.id === loc.source_id).source_url, loc.url);
      assert.ok(loc.locator.length > 20 && loc.effective_period && loc.access_limits);
    }
    const assessment = read('data/coverage/assessments.json').assessments.find(a => a.named_question_id === q.id);
    assert.equal(assessment.status, 'partial');
    assert.equal(assessment.industry_code, null);
    assert.equal(assessment.professional_review, 'not-performed');
    assert.ok(assessment.gaps.length);
  }
});
test('AA-I124 independent inflows reconcile without treating budget authority as revenue', () => {
  const [customer, contribution, appropriation] = packet.example.data.examples;
  assert.equal(customer.amount, contribution.amount);
  assert.equal(contribution.amount, appropriation.amount);
  assert.equal(customer.entries[0].credit, 'Contract liability');
  assert.equal(customer.entries[1].debit, 'Contract liability');
  for (const c of [customer, contribution]) {
    const cash = c.entries.filter(e => e.debit === 'Cash').reduce((n,e) => n+e.amount,0);
    assert.equal(cash, c.ending.cash);
    assert.equal(c.ending.cash, c.ending.revenue+c.ending.liability);
  }
  assert.equal(contribution.ending.restriction_release, 0);
  assert.deepEqual(appropriation.entries, []);
  assert.equal(appropriation.ending.revenue, 0);
  assert.equal(appropriation.ending.budget_authority, 100000);
  const custody = packet.example.data.custody;
  assert.equal(custody.owned.entity_asset, custody.statement_value);
  assert.equal(custody.client.entity_asset, 0);
  assert.equal(custody.client.client_asset_subledger, custody.statement_value);
});
test('AA-I124 retrieval exposes role-specific evidence and counterexamples', () => {
  for (const q of ['GASB governmental fund','FASAB federal budget reconciliation','US rate regulated utility','provider Medicare cost report']) {
    const hits = executeAgent('search', {q,limit:5}).results;
    const expected = q === 'provider Medicare cost report' ? 'guide-q-reimbursement' : packet.guide.id;
    assert.ok(hits.some(r => r.id === expected), `${q}: missing qualified evidence`);
    if (q === 'provider Medicare cost report') assert.ok(!hits.some(r => r.id === 'guide-q-insurer'));
  }
  const provider = qs.find(q => q.family_id === 'q-reimbursement');
  const utility = qs.find(q => q.family_id === 'q-rate-regulation');
  assert.ok(provider.exceptions.some(x => x.includes('Insurer reserve accounting does not apply')));
  assert.ok(!provider.source_ids.some(id => /naic|ifrs17/.test(id)));
  assert.ok(utility.exceptions.some(x => x.includes('Unregulated electricity sales do not establish')));
  const mappings = read('data/coverage/record-mappings.json').mappings;
  const matrix = mappings.find(m => m.record_id === packet.guide.id);
  assert.equal(matrix.industry_scope, 'shared-context');
  assert.deepEqual(matrix.industry_mappings, []);
  for (const [query, exception] of [
    ['provider Medicare insurer reserve accounting', provider.exceptions[0]],
    ['unregulated electricity sales rate regulated', utility.exceptions[0]],
  ]) {
    const context = executeAgent('context',{q:query,kind:'guide',limit:1,include_sources:false,max_chars:40000});
    assert.equal(context.records[0].record.id, packet.guide.id);
    assert.ok(JSON.stringify(context).includes(exception), query);
  }
});
test('AA-I124 same-build corpus and source export preserve canonical bytes', () => {
  const exported = read('dist/client/downloads/corpus.json');
  for (const record of [packet.guide,packet.example,...packet.sources]) {
    const found = exported.records.find(r => r.id === record.id);
    for (const key of Object.keys(record)) assert.deepEqual(found[key],record[key]);
  }
  const manifest = read('dist/client/downloads/accounting-agents-source.manifest.json');
  for (const p of ['data/research/institutional-regulated-124.json','scripts/integrate-aa-i124.mjs','tests/aa-i124-institutional.test.mjs']) {
    const entry = manifest.source_membership.find(e => e.path === p);
    assert.ok(entry?.included, p);
    assert.equal(entry.sha256,createHash('sha256').update(fs.readFileSync(p)).digest('hex'));
  }
});
