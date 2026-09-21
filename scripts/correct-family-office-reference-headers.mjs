import fs from 'node:fs';
import assert from 'node:assert/strict';
const patch = (file, replacements) => {
  let text = fs.readFileSync(file, 'utf8');
  for (const [before, after, count] of replacements) {
    assert.equal(text.split(before).length - 1, count, `Unexpected integration helper state: ${file}`);
    text = text.replaceAll(before, after);
  }
  fs.writeFileSync(file, text);
};
patch('scripts/integrate-family-office-reference.mjs', [
  ["edition = '2026-09-21.4'", "edition = '2026-09-21.5'", 2],
  ["['2026-09-21.3', edition]", "['2026-09-21.3', '2026-09-21.4', edition]", 1],
  ["if (meta.corpus_version === edition)", "if (meta.corpus_version !== '2026-09-21.3')", 1],
  ["for (const file of ['research-questions', 'subsector-profiles', 'subsector-screening'])", "for (const file of ['research-questions', 'subsector-profiles', 'subsector-screening', 'assessments'])", 1],
  ["value.corpus_version = edition; writes.set(relative, value);", "if (Object.hasOwn(value, 'corpus_version')) value.corpus_version = edition; if (file === 'research-questions') value.question_set_version = edition; if (file === 'assessments') value.assessment_version = edition; writes.set(relative, value);", 1]
]);
patch('scripts/prepare-family-office-reference.mjs', [
  ["'2026-09-21.4'", "'2026-09-21.5'", 1],
  ["const assessments = fs.readFileSync('data/coverage/assessments.json');", "const assessments = JSON.parse(fs.readFileSync('data/coverage/assessments.json')).assessments;", 1],
  ["assert.deepEqual(fs.readFileSync('data/coverage/assessments.json'), assessments);", "assert.deepEqual(JSON.parse(fs.readFileSync('data/coverage/assessments.json')).assessments, assessments);", 1],
  ["writeReleaseArtifacts(current, 'data/releases', {previousExport: before});", "writeReleaseArtifacts(current, 'data/releases', {previousExport: JSON.parse(fs.readFileSync('data/releases/2026-09-21.4/corpus.json', 'utf8'))});", 1]
]);
