// Runs only inside the isolated edition capture, never in the editing checkout.
import fs from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { generateMappings } from './coverage-mappings.mjs';
import { validateCorpus } from './validate.mjs';
import { coverageInputs } from './validate-coverage.mjs';
import { readSnapshotHistory, writeSnapshotHistory } from './snapshot-history.mjs';
import { historySummaryPlugin } from './history-summary.mjs';
import { writeReleaseArtifacts } from './release-history.mjs';

const [version, date] = process.argv.slice(2);
if (!/^\d{4}-\d{2}-\d{2}\.\d+$/.test(version || '') || !/^\d{4}-\d{2}-\d{2}$/.test(date || '')) throw new Error('Expected prospective edition and preparation date');
const read = file => JSON.parse(fs.readFileSync(file));
const write = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
const capture = read('outputs/candidate.json');
if (capture.publishable !== false || capture.mode !== 'working-copy') throw new Error('Requires an isolated working-copy capture');
const catalog = read('data/catalog.json');
const predecessor = catalog.corpus_version;
const previous = JSON.parse(gunzipSync(fs.readFileSync(`data/releases/${predecessor}/corpus.json.gz`)));
const index = read('data/releases/index.json');
if (index.current_version !== predecessor || index.versions.includes(version) || version.localeCompare(predecessor, 'en', {numeric:true}) <= 0) throw new Error('Prospective edition must follow the current finalized edition');
// Review dates and independently versioned assessments are not new reviews.
const headers = {
  'data/catalog.json': ['corpus_version'],
  'data/coverage/mapping-overrides.json': ['mapping_version'],
  'data/coverage/assessments.json': ['assessment_version'],
  'data/coverage/research-questions.json': ['corpus_version', 'question_set_version'],
  'data/coverage/subsector-profiles.json': ['corpus_version'],
  'data/coverage/subsector-screening.json': ['corpus_version'],
};
for (const [file, fields] of Object.entries(headers)) {
  const value = read(file);
  for (const field of fields) value[field] = version;
  if (file === 'data/catalog.json') value.updated_at = date;
  write(file, value);
}
write('data/coverage/record-mappings.json', generateMappings());
validateCorpus();
const history = readSnapshotHistory();
await build({entryPoints:['src/corpus.ts'],outfile:'outputs/edition-corpus.mjs',bundle:true,plugins:[historySummaryPlugin({history})],format:'esm',platform:'node',target:'es2023'});
const {coverage, corpusExport} = await import(pathToFileURL(`${process.cwd()}/outputs/edition-corpus.mjs`));
history.snapshots.push({id:version,recorded_at:date,inputs_sha256:coverageInputs(),...coverage.analytics()});
writeSnapshotHistory(history);
writeReleaseArtifacts(corpusExport(), 'data/releases', {previousExport:previous});
validateCorpus();
