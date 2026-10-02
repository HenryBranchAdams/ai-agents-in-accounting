import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { historySummaryPlugin } from '../scripts/history-summary.mjs';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'family-office-gap-navigation-'));
let getRecord, recordPage;
try {
  const outfile = path.join(dir, 'render.mjs');
  await build({
    stdin: { contents: 'export { recordPage } from "./src/render"; export { getRecord } from "./src/corpus";', resolveDir: process.cwd() },
    outfile, bundle: true, platform: 'node', format: 'esm', target: 'es2023',
    define: { 'process.env.NODE_ENV': '"production"', STYLE_VERSION: '"gap-test"', NAVIGATION_SCRIPT: '"/assets/navigation-test.js"', PREVIEW_BUILD: 'false' },
    plugins: [historySummaryPlugin({ history: { schema_version: '1.0.0', snapshots: [] } })],
  });
  ({ getRecord, recordPage } = await import(pathToFileURL(outfile)));
} finally { fs.rmSync(dir, { recursive: true, force: true }); }

const gapRecord = () => structuredClone(getRecord('guide-fo-reference-research-gaps'));
const section = (html, id) => {
  const match = html.match(new RegExp(`<section id="gap-${id}">([\\s\\S]*?)</section>`));
  assert.ok(match, id);
  return match[1];
};
const links = html => [...html.matchAll(/href="(\/records\/[^"#]+)"/g)].map(match => match[1]);

test('G07 and G13 render only their reconciled starting sources with explicit IDs', () => {
  const record = gapRecord(), before = JSON.stringify(record);
  const html = recordPage(record);
  const cases = {
    G07: [
      ['irs-prior', 'src_fo_ref_irs_prior'],
      ['irs-p15', 'src_irs_pub15_2026'],
      ['irs-i706', 'src_fo_ref_irs_i706'],
      ['irs-i1041', 'src_family_office_irs_1041_2025'],
    ],
    G13: [
      ['fasb-asc', 'src_1os761s'],
      ['pwc-viewpoint', 'src_fo_ref_pwc_viewpoint'],
      ['aicpa-investment-companies', 'src_fo_ref_aicpa_investment_companies'],
    ],
  };
  for (const [id, sources] of Object.entries(cases)) {
    const rendered = section(html, id);
    assert.deepEqual(links(rendered), sources.map(([, sourceId]) => `/records/${sourceId}`));
    for (const [candidate, canonical] of sources) {
      assert.ok(rendered.includes(`<code>${candidate}</code>`));
      assert.ok(rendered.includes(`<code>${canonical}</code>`));
      const source = getRecord(canonical);
      assert.equal(source.kind, 'source');
      assert.ok(recordPage(source).includes(source.title));
    }
  }
  assert.equal(JSON.stringify(record), before, 'rendering leaves canonical content intact');
});

test('all gap candidate lists retain their own IDs and G12 historical limitation', () => {
  const record = gapRecord(), html = recordPage(record);
  assert.equal(record.data.family_office_reference.gaps.length, 15);
  for (const gap of record.data.family_office_reference.gaps) {
    const rendered = section(html, gap.id);
    for (const id of gap.starting_source_ids) assert.ok(rendered.includes(`<code>${id}</code>`), `${gap.id}: ${id}`);
  }
  assert.match(html, /historical G12 registry-access limitation is resolved/);
  const g12 = section(html, 'G12');
  assert.match(g12, /Repository access limit/);
  assert.match(g12, /GitHub returned empty or oversize errors/);
  assert.match(g12, /No starting source IDs recorded/);
  assert.deepEqual(links(g12), []);
});

test('unresolved candidate IDs stay visible, escaped and unlinked without alias inference', () => {
  const record = gapRecord();
  record.data.family_office_reference.gaps = [{
    id: 'G07', title: 'Fixture', starting_source_ids: ['unknown-<candidate>', 'src_irs_pub15_2026'],
  }];
  const rendered = section(recordPage(record), 'G07');
  assert.match(rendered, /unknown-&lt;candidate&gt;/);
  assert.match(rendered, /src_irs_pub15_2026/);
  assert.equal((rendered.match(/Canonical source unavailable/g) || []).length, 2);
  assert.deepEqual(links(rendered), []);
});
