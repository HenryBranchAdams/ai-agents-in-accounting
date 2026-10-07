import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const readJson = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const prior = readJson('data/releases/2026-10-02.5/corpus.json').records;
const edition = readJson('data/releases/2026-10-02.6/corpus.json').records;
const researchPath = 'docs/research/2026-10-02-source-expansion';
const sources = readJson(`${researchPath}/source-additions.json`);
const collections = readJson(`${researchPath}/collection-additions.json`);

test('edition 2026-10-02.6 preserves prior records and adds exactly the reviewed research package', () => {
  assert.equal(sources.length, 198);
  assert.equal(collections.length, 22);
  const oldIds = new Set(prior.map(record => record.id));
  const byId = new Map(edition.map(record => [record.id, record]));
  assert.equal(byId.size, edition.length);
  for (const record of prior) assert.deepEqual(byId.get(record.id), record, record.id);

  const additions = [...sources, ...collections];
  const expectedIds = additions.map(record => record.id).sort();
  const actualIds = edition.filter(record => !oldIds.has(record.id)).map(record => record.id).sort();
  assert.deepEqual(actualIds, expectedIds);
  for (const record of additions) assert.deepEqual(byId.get(record.id), record, record.id);
});
