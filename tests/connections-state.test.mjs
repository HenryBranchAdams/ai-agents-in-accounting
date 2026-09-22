import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'aa-connections-state-'));
await build({ entryPoints: ['src/connections/state.ts', 'src/connections/select.ts'], outdir: directory, bundle: true, format: 'esm', platform: 'node', outExtension: { '.js': '.mjs' } });
const { parseConnectionState, connectionURL } = await import(pathToFileURL(path.join(directory, 'state.mjs')));
const { createConnectionIndex } = await import(pathToFileURL(path.join(directory, 'select.mjs')));
process.on('exit', () => fs.rmSync(directory, { recursive: true, force: true }));
const parse = query => parseConnectionState(new URLSearchParams(query), ['guide', 'source']);
const state = extra => ({ ...parse('focus=a'), ...extra });
const node = (id, kind = 'guide') => ({ id, kind, title: id });
const edge = (from, to, type = 'related') => ({ id: `${from}/${type}/${to}`, from, to, type, assertions: [{ reason: 'Synthetic fixture assertion' }] });
const snapshot = (nodes, edges) => ({ schema_version: '1', corpus_version: 'edition', index_version: 'index', nodes, edges, diagnostics: [] });

test('portable URL preserves literal IDs, explicit empty filters, continuation order and selected edge', () => {
  const expected = state({ selected: { kind: 'edge', id: 'e:a%3A/qualifies/b' }, kinds: [], types: [], expanded: [{ id: 'a,:["]', steps: 2 }, { id: 'z', steps: 1 }] });
  assert.deepEqual(parse(new URL(connectionURL(expected), 'https://example.test').search), expected);
  const canonical = connectionURL(state({ types: ['cites', 'qualifies', 'cites'], kinds: ['source', 'guide'] }));
  assert.equal(connectionURL(parse(new URL(canonical, 'https://example.test').search)), canonical);
  const defaults=state({});const compact=connectionURL(defaults,['guide','source']);assert.ok(!compact.includes('kinds=')&&!compact.includes('types='));assert.deepEqual(parse(new URL(compact,'https://example.test').search),defaults);
});

test('untrusted URLs reject unknown and repeated keys, counts, malformed selections and expansions before resolution', () => {
  for (const query of ['bogus=x', 'focus=a&focus=b', 'direction=sideways', 'types=inferred', 'budget=81', 'budget=0', 'budget=1e1', 'focus=a&selected=wrong:a', 'expanded=[]&mode=bad', 'expanded=%7B%7D', 'focus=a&expanded=[["a",1],["a",2]]', 'focus=a&expanded=[["a",9]]', 'focus=a&expanded=[["a",1.2]]', 'selected=node:a', 'focus=%00', `focus=${'x'.repeat(4097)}`]) {
    assert.throws(() => parse(query), undefined, query);
  }
});

test('bounded selection prioritizes material edges, reports disjoint omission reasons and never invents reverse support', () => {
  const nodes = [node('a'), ...Array.from({ length: 90 }, (_, index) => node(`n${String(index).padStart(2, '0')}`, index % 2 ? 'source' : 'guide'))];
  const edges = nodes.slice(1).map((n, index) => edge('a', n.id, index === 89 ? 'qualifies' : 'cites'));
  const index = createConnectionIndex(snapshot(nodes, edges));
  const normal = index.select(state({ budget: 25 }));
  assert.equal(normal.nodes.length, 25); assert.equal(normal.edges.length, 24);
  assert.ok(normal.edges.some(edge => edge.type === 'qualifies'));
  assert.equal(normal.counts.omitted_by_budget, 66);
  assert.equal(normal.counts.matching_records, 91);
  const filtered = index.select(state({ types: ['cites'], kinds: ['guide'] }));
  assert.ok(filtered.hidden_material.some(edge => edge.type === 'qualifies'));
  assert.equal(filtered.counts.considered_edges, filtered.counts.visible_edges + filtered.counts.omitted_by_filter + filtered.counts.omitted_by_budget);
  assert.equal(index.select(state({ direction: 'in' })).edges.length, 0);
  assert.equal(index.select(state({ kinds: [] })).nodes[0].id, 'a');
});

test('overlapping expansion ownership survives collapse, cycles are idempotent and selection does not change layout inputs', () => {
  const index = createConnectionIndex(snapshot(['a', 'b', 'c', 'd', 'isolate'].map(id => node(id)), [edge('a', 'b'), edge('a', 'c'), edge('b', 'd'), edge('c', 'd'), edge('d', 'a', 'cites'), edge('b', 'b')]));
  const expanded = state({ direction: 'out', expanded: [{ id: 'b', steps: 1 }, { id: 'c', steps: 1 }] });
  const result = index.select(expanded);
  assert.deepEqual(result.ownership.d, ['b', 'c']);
  assert.equal(new Set(result.edges.map(edge => edge.id)).size, result.edges.length);
  const collapsed = index.select({ ...expanded, expanded: [{ id: 'c', steps: 1 }] });
  assert.ok(collapsed.nodes.some(node => node.id === 'd')); assert.deepEqual(collapsed.ownership.d, ['c']);
  const selected = index.select({ ...expanded, selected: { kind: 'node', id: 'd' } });
  assert.deepEqual(selected.nodes, result.nodes); assert.deepEqual(selected.edges, result.edges);
  const missing = index.select({ ...expanded, selected: { kind: 'edge', id: 'gone' } });
  assert.equal(missing.state.selected, null); assert.equal(missing.state.focus, 'a'); assert.equal(missing.warnings.length, 1);
  assert.deepEqual(index.select(state({ focus: 'isolate' })).nodes.map(node => node.id), ['isolate']);
  assert.throws(() => index.select(state({ focus: 'missing' })), /Unknown focus/);
  assert.throws(() => index.select(state({ corpus: 'stale' })), /another corpus snapshot/);
  assert.throws(() => index.select(state({ index: 'stale' })), /another corpus snapshot/);
});

test('dense neighborhoods keep all edge endpoints under the independent 80-node and 160-edge caps', () => {
  const nodes = Array.from({ length: 90 }, (_, i) => node(i ? `n${i}` : 'a'));
  const edges = nodes.slice(1).flatMap(n => ['cites', 'related', 'supports', 'qualifies', 'contradicts', 'supersedes'].map(type => edge('a', n.id, type)));
  const result = createConnectionIndex(snapshot(nodes, edges)).select(state({ budget: 80, expanded: [{ id: 'a', steps: 8 }] }));
  assert.ok(result.nodes.length <= 80); assert.equal(result.edges.length, 160);
  const ids = new Set(result.nodes.map(node => node.id)); assert.ok(result.edges.every(edge => ids.has(edge.from) && ids.has(edge.to)));
  assert.equal(result.counts.considered_edges, result.counts.visible_edges + result.counts.omitted_by_filter + result.counts.omitted_by_budget);
});
