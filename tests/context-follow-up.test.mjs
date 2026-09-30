import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const cli = (op, args = []) => JSON.parse(execFileSync(process.execPath, ['scripts/corpus.mjs', op, ...args], { encoding: 'utf8' }));
const guide = 'guide-family-office-us-accounting';

test('a controller context packet exposes unfinished retrieval and actionable follow-up', () => {
  const description = cli('describe');
  const pin = ['--corpus-version', description.corpus_version];
  const packet = cli('context', ['--ids', guide, ...pin]);
  assert.equal(packet.retrieval.evidence_sufficiency, 'not-assessed');
  assert.equal(packet.retrieval.all_candidate_passages_included, false);
  assert.ok(packet.records.some(r => r.remaining_passages > 0));
  assert.ok(packet.omitted.length > 0);
  assert.equal(packet.budget.used_chars, JSON.stringify(packet).length);
  assert.ok(packet.budget.used_chars <= 12000);
  for (const entry of [...packet.records.map(r => ({ id: r.record.id, get_url: r.get_url })), ...packet.omitted]) {
    const url = new URL(entry.get_url, 'https://corpus.test');
    assert.equal(url.searchParams.get('id'), entry.id);
    assert.equal(url.searchParams.get('corpus_version'), description.corpus_version);
  }
  const excluded = cli('context', ['--ids', guide, '--include-sources', 'false', ...pin]);
  const canonical=JSON.parse(fs.readFileSync('data/corpus/guide.json','utf8')).find(r=>r.id===guide);
  assert.equal(excluded.retrieval.linked_sources_not_considered, new Set(canonical.source_ids).size);
  const limited = cli('context', ['--q', 'family office', '--limit', '1', ...pin]);
  assert.ok(limited.retrieval.search_matches_not_selected > 0);
});

test('a cited passage can be retrieved exactly without reading the whole guide', () => {
  const page = cli('get', [guide, '--section', 'data.research_questions', '--limit', '20']);
  const selected = page.passages.find(p => p.source_pointers.includes('/data/research_questions/3/answer'));
  assert.ok(selected, 'trust answer is present in selected research section');
  const exact = cli('get', [guide, '--passage-id', selected.id, '--corpus-version', page.corpus_version]);
  assert.equal(exact.total, 1);
  assert.equal(exact.next_cursor, null);
  assert.deepEqual(exact.passages, [selected]);
  const link = new URL(selected.retrieval_url, 'https://corpus.test');
  assert.equal(link.searchParams.get('passage_id'), selected.id);
  assert.equal(link.searchParams.get('corpus_version'), page.corpus_version);
  assert.throws(() => cli('get', [guide, '--passage-id', 'missing#summary:0']), /UNKNOWN_PASSAGE/);
  assert.throws(() => cli('get', [guide, '--passage-id', selected.id, '--section', 'summary']), /INVALID_ARGUMENT/);
});

test('empty exact selectors cannot silently fall back to broader retrieval', () => {
  assert.throws(() => cli('get', [guide, '--passage-id', '', '--section', 'data.research_questions']), /INVALID_ARGUMENT/);
  assert.throws(() => cli('get', [guide, '--passage-id', `${guide}#summary:0`, '--section', '']), /INVALID_ARGUMENT/);
  assert.throws(() => cli('get', [guide, '--passage-id', `${guide}#summary:0`, '--cursor', '']), /INVALID_ARGUMENT/);
});
