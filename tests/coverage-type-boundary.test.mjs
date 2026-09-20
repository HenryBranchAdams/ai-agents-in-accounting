import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

test('type checking includes current corpus JSON without inferring immutable history', () => {
  const files = execFileSync(process.execPath, ['node_modules/typescript/bin/tsc', '--listFilesOnly'], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 }).split('\n');
  assert.ok(files.includes(path.resolve('src/coverage-history-data.d.ts')));
  assert.ok(files.includes(path.resolve('data/corpus/source.json')));
  assert.ok(files.includes(path.resolve('data/coverage/assessments.json')));
  assert.ok(!files.some(file => /data\/coverage\/snapshots\//.test(file)));
});
