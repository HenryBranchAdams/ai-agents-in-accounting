import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {buildFamilyOfficeResearchPacks, researchPacksMarkdown, writeFamilyOfficeResearchPacks} from '../scripts/family-office-research-packs.mjs';

const records = fs.readdirSync('data/corpus').filter(file => file.endsWith('.json')).sort().flatMap(file => JSON.parse(fs.readFileSync(path.join('data/corpus', file), 'utf8')));
const meta = JSON.parse(fs.readFileSync('data/catalog.json', 'utf8'));
const index = new Map(records.map(record => [record.id, record]));

test('four bounded packs keep reporting purposes, context and canonical reading sequences distinct', () => {
  const before = JSON.stringify(records), bundle = buildFamilyOfficeResearchPacks(records, meta);
  assert.deepEqual(bundle.packs.map(pack => pack.facets.reporting_purpose), ['books', 'fiduciary-accounting', 'tax-basis', 'supplemental-family-reporting']);
  assert.equal(bundle.corpus_version, meta.corpus_version);
  assert.equal(bundle.packs.length, 4);
  for (const pack of bundle.packs) {
    const reference = index.get(pack.canonical_topic_id).data.family_office_reference;
    assert.equal(pack.question, reference.framing_question);
    assert.equal(pack.boundary, reference.boundary);
    assert.deepEqual(pack.reading_sequence.map(step => step.record_id), reference.reading_path.map(step => step.annotation.record_id));
    assert.deepEqual(pack.required_context.map(context => context.record_id), reference.context_ids);
    for (const key of ['reporting_purpose', 'workflow', 'entity', 'framework', 'jurisdiction', 'period']) assert.ok(pack.facets[key]);
    assert.equal(pack.question_status, 'discovery-question-not-answered');
    assert.equal(pack.reviewer_handoff.conclusion, null);
    assert.equal(pack.reviewer_handoff.reviewer, null);
    assert.match(pack.limitations.join(' '), /Books, tax basis, fiduciary accounting and supplemental/);
    for (const context of pack.required_context) assert.deepEqual(context.required_context, index.get(context.record_id).data.family_office_reference.checklist.required_context);
  }
  assert.equal(JSON.stringify(records), before, 'Generator must not mutate canonical records');
});

test('evidence comes from current canonical sources, preserving rights, review levels and unknown dates', () => {
  const changed = structuredClone(records);
  const source = changed.find(record => record.id === 'src_family_office_irs_k1_1065_2025');
  source.title = 'Changed canonical title'; source.reviewed_at = '2026-10-01';
  source.data.effective_period = undefined; source.data.applicability = undefined;
  source.data.effective_from = undefined; source.data.effective_date = undefined;
  source.rights.source_status = 'unknown';
  const bundle = buildFamilyOfficeResearchPacks(changed, meta);
  const evidence = bundle.packs.find(pack => pack.id === 'family-office-tax-basis').evidence.find(row => row.record_id === source.id);
  assert.equal(evidence.title, source.title, 'Embedded historical annotation must not override canonical title');
  assert.equal(evidence.reviewed_at, source.reviewed_at);
  assert.equal(evidence.review_status, source.review_status);
  assert.equal(evidence.effective_period, null, 'Review dates must not become effective dates');
  assert.equal(evidence.applicability, null);
  assert.equal(evidence.period_metadata.effective_from, null);
  assert.equal(evidence.period_metadata.publication, source.data.publication ?? null);
  assert.deepEqual(evidence.rights, source.rights);
  const old = buildFamilyOfficeResearchPacks(records, meta);
  assert.notEqual(bundle.canonical_record_hashes[source.id], old.canonical_record_hashes[source.id]);
});

test('invalid or out-of-scope canonical references fail instead of silently omitting evidence', () => {
  assert.throws(() => buildFamilyOfficeResearchPacks(records.filter(record => record.id !== 'src_family_office_irs_k1_1065_2025'), meta), /Missing canonical source/);
  assert.throws(() => buildFamilyOfficeResearchPacks([...records, records[0]], meta), /Duplicate canonical/);
  const changed = structuredClone(records), guide = changed.find(record => record.id === 'guide-fo-reference-fo-27');
  guide.source_ids = [];
  assert.throws(() => buildFamilyOfficeResearchPacks(changed, meta), /outside canonical topic/);
  const missingContext = structuredClone(records);
  missingContext.find(record => record.id === 'guide-fo-reference-ctx-02').data.family_office_reference.checklist = {};
  assert.throws(() => buildFamilyOfficeResearchPacks(missingContext, meta), /Missing context checklist/);
});

test('deterministic portable JSON and Markdown retain canonical navigation and review handoff', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'fo-packs-'));
  try {
    const output = writeFamilyOfficeResearchPacks(records, meta, directory);
    const json = fs.readFileSync(output.json, 'utf8'), markdown = fs.readFileSync(output.markdown, 'utf8');
    const bundle = buildFamilyOfficeResearchPacks(records, meta);
    assert.deepEqual(JSON.parse(json), bundle);
    assert.equal(markdown, researchPacksMarkdown(bundle));
    for (const pack of bundle.packs) {
      assert.ok(markdown.includes(pack.question));
      assert.ok(markdown.includes(pack.canonical_topic_url));
      assert.ok(markdown.includes(pack.boundary));
      for (const source of pack.evidence) assert.ok(markdown.includes(source.url));
    }
    assert.match(markdown, /Reviewer, review date and conclusion: unknown/);
    assert.match(markdown, /Edition and review dates do not establish effective dates/);
    writeFamilyOfficeResearchPacks(records, meta, directory);
    assert.equal(fs.readFileSync(output.json, 'utf8'), json);
    assert.equal(fs.readFileSync(output.markdown, 'utf8'), markdown);
  } finally { fs.rmSync(directory, {recursive: true, force: true}); }
});

test('normal production build exports the packs from the same corpus edition', () => {
  const file = 'dist/client/downloads/family-office-research-packs.json';
  assert.ok(fs.existsSync(file), 'Build must include generated family-office research packs');
  const exported = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.deepEqual(exported, buildFamilyOfficeResearchPacks(records, meta));
  assert.equal(fs.readFileSync('dist/client/downloads/family-office-research-packs.md', 'utf8'), researchPacksMarkdown(exported));
});
