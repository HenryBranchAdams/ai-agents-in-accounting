import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {validateSchema} from './validate.mjs';

export const packetPath = 'data/research/family-office-reference-2026-09-21';
export const entryId = 'collection-family-office-reference';
const date = '2026-09-21';
const clone = value => structuredClone(value);
export const stable = value => Array.isArray(value) ? value.map(stable) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])])) : value;
export const digest = value => createHash('sha256').update(JSON.stringify(stable(value))).digest('hex');
const unique = values => [...new Set(values)];
const topicId = id => `guide-fo-reference-${id.toLowerCase()}`;
const contextId = id => `guide-fo-reference-${id.toLowerCase()}`;
export function overlay(base, row) {
  const result = clone(base);
  for (const [key, value] of Object.entries(row)) {
    assert.ok(!['__proto__', 'prototype', 'constructor'].includes(key), 'Unsafe metadata key');
    result[key] = value && typeof value === 'object' && !Array.isArray(value)
      ? overlay(result[key] || {}, value) : clone(value);
  }
  return result;
}
export function normalizedUrl(raw) {
  const url = new URL(raw);
  assert.ok(['http:', 'https:'].includes(url.protocol), 'Only HTTP(S) source URLs are allowed');
  // Retain fragments: ASC topic locators sharing a host are not interchangeable.
  url.pathname = url.pathname.replace(/\/$/, '') || '/';
  for (const key of [...url.searchParams.keys()]) if (key.toLowerCase().startsWith('utm_')) url.searchParams.delete(key);
  return url.href;
}
export function loadPacket(root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')) {
  const read = name => JSON.parse(fs.readFileSync(path.join(root, packetPath, name), 'utf8'));
  const meta = read('package.json');
  const sources = meta.source_files.flatMap(name => read(name).map(row => overlay(meta.source_defaults, row)));
  assert.equal(digest(sources), meta.sources_sha256, 'Source annotations differ from the supplied research snapshot');
  const topics = meta.topic_files.flatMap(read);
  const contexts = read('context_packets.json').context_packets;
  const gaps = read('research_gaps.json').gaps;
  const asc = read('asc_locator_map.json');
  const decisions = read('reconciliation.json');
  assert.equal(sources.length, 112); assert.equal(topics.length, 40); assert.equal(contexts.length, 12);
  const sourceIds = new Set(sources.map(s => s.id)), contextIds = new Set(contexts.map(c => c.id));
  assert.equal(sourceIds.size, sources.length); assert.equal(contextIds.size, contexts.length);
  assert.equal(new Set(topics.map(t => t.id)).size, topics.length);
  assert.equal(topics.reduce((n, t) => n + t.questions.length, 0), 160);
  for (const s of sources) { normalizedUrl(s.url); assert.equal(s.rights.external_full_text_stored, false); assert.equal(s.verification.accounting_conclusions_validated, false); }
  for (const t of topics) {
    assert.ok(t.questions.length && t.reading_path.length && t.critical_boundary);
    for (const id of t.all_source_ids) assert.ok(sourceIds.has(id), `Unknown source ${id}`);
    for (const r of t.reading_path) assert.ok(t.all_source_ids.includes(r.source_id), `Reading source outside topic ${t.id}`);
    for (const id of t.context_packet_ids) assert.ok(contextIds.has(id), `Unknown context ${id}`);
  }
  assert.deepEqual(decisions.rows.map(r => r.candidate_id).sort(), [...sourceIds].sort());
  return {meta, sources, topics, contexts, gaps, asc, decisions};
}
const rights = {metadata: 'CC0-1.0', content: 'CC-BY-4.0', external_content: 'External publications remain subject to their own terms. This record contains original navigation annotations, not publisher full text.', full_text_stored: false};
function record(id, kind, title, summary, sourceIds, relatedIds, data, topics = []) {
  return {id, kind, title, summary, topics: unique(['Family office accounting', 'Source discovery', ...topics]), industries: [], jurisdiction: 'United States; selected named state and international interfaces', source_type: null, publisher: 'Accounting Agents contributors', source_url: null, source_ids: unique(sourceIds), related_ids: unique(relatedIds), reviewed_at: null, review_status: 'discovery-imported-not-reverified', provenance: {added_on: date, research_package: '2026-09-21.source-library.1', integration_method: 'Guarded additive import with explicit identity decisions', note: 'Imported source-discovery annotations and editorial reading paths. Original discovery dates are retained in the data; no new publisher, professional or accounting review is asserted.'}, rights: clone(rights), data: {id, ...data}};
}
export function planIntegration(root, {edition = '2026-09-21.5'} = {}) {
  assert.equal(edition, '2026-09-21.5', 'This historical importer only targets edition 2026-09-21.5; use edition preparation for later changes');
  const packet = loadPacket(root);
  const read = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
  const meta = read('data/catalog.json');
  assert.ok(['2026-09-21.3', '2026-09-21.4', edition].includes(meta.corpus_version), 'Unexpected corpus edition; reconcile against current main before importing');
  if (meta.corpus_version !== '2026-09-21.3') assert.equal(meta.family_office_reference?.source_digest, packet.meta.sources_sha256, 'Edition already belongs to another change');
  const files = ['source', 'guide', 'collection'];
  const byKind = Object.fromEntries(files.map(kind => [kind, read(`data/corpus/${kind}.json`)]));
  const all = fs.readdirSync(path.join(root, 'data/corpus')).filter(f => f.endsWith('.json')).flatMap(f => read(`data/corpus/${f}`));
  const index = new Map(all.map(r => [r.id, r]));
  const targets = new Map(packet.decisions.rows.map(row => [row.candidate_id, row]));
  const sourceId = id => { const target = targets.get(id); assert.ok(target, `Missing source decision ${id}`); return target.record_id; };
  for (const row of packet.decisions.rows) {
    if (row.disposition === 'reuse') {
      const existing = index.get(row.record_id);
      assert.ok(existing?.kind === 'source', `Missing reuse target ${row.record_id}`);
      assert.equal(digest(existing), row.baseline_record_sha256, `Reused source changed: ${row.record_id}; inspect rather than overwrite`);
    } else {
      assert.equal(row.disposition, 'add');
      const source = packet.sources.find(s => s.id === row.candidate_id);
      const collisions = byKind.source.filter(r => r.id !== row.record_id && normalizedUrl(r.source_url) === normalizedUrl(source.url));
      assert.equal(collisions.length, 0, `New source URL now has another identity: ${source.id}`);
    }
  }
  const additions = [];
  const notes = new Map(packet.sources.map(s => [s.id, {...clone(s), record_id: sourceId(s.id), locator_precision: 'Discovery navigation hint; not claim-level verified evidence'}]));
  for (const s of packet.sources) {
    const decision = targets.get(s.id);
    if (decision.disposition === 'reuse') continue;
    const r = record(sourceId(s.id), 'source', s.title, `${s.why_use} ${s.scope_limit}`, [], decision.related_record_ids || [], {discovery_annotation: notes.get(s.id), limitations: [s.scope_limit, 'Imported discovery check, not new source verification. Source access and rights must be checked for the intended use.'], reference_topics: s.topic_ids.map(topicId)}, s.topic_ids.map(id => packet.topics.find(t => t.id === id)?.title).filter(Boolean));
    r.publisher = s.publisher; r.source_url = s.url; r.source_type = s.resource_type;
    r.jurisdiction = s.applicability.jurisdictions.join('; ');
    r.rights = {...r.rights, source_status: 'unknown', source_license: null, source_license_url: null, source_permission_scope: null};
    additions.push(r);
  }
  const limits = ['Reading order is editorial navigation, not a ranking of accounting authority.', 'Questions are discovery prompts, not supported answers or coverage-completeness claims.', 'Source-specific editions, jurisdictions, access, provenance and rights continue to apply.'];
  for (const t of packet.topics) {
    const related = t.corpus_reuse.map(r => r.record_id);
    related.forEach(id => assert.ok(index.has(id), `Missing existing context ${id}`));
    additions.push(record(topicId(t.id), 'guide', `Family office reference ${t.id}: ${t.title}`, `${t.framing_question} ${t.critical_boundary}`, t.all_source_ids.map(sourceId), [entryId, ...t.context_packet_ids.map(contextId), ...related], {family_office_reference: {type: 'topic', topic_id: t.id, framing_question: t.framing_question, boundary: t.critical_boundary, questions: t.questions.map((question, i) => ({id: `${t.id}.Q${i+1}`, question, status: 'discovery-question-not-answered'})), reading_path: t.reading_path.map(r => ({role: r.role, annotation: notes.get(r.source_id)})), context_ids: t.context_packet_ids.map(contextId), additional_context: t.additional_context, corpus_reuse: t.corpus_reuse, parent_id: entryId}, limitations: limits}, [t.title]));
  }
  for (const c of packet.contexts) additions.push(record(contextId(c.id), 'guide', `Family office context: ${c.title}`, `${c.title}. ${c.privacy_boundary}`, [], [entryId], {family_office_reference: {type: 'context', checklist: c}, limitations: ['Checklist only. No private family documents, balances, account credentials or tax identifiers are included.']}));
  additions.push(record('guide-fo-reference-research-gaps', 'guide', 'Family office reference: remaining research and access gaps', 'Unresolved technical, jurisdictional, access and evidence questions. Source-discovery coverage is not accounting sufficiency.', packet.sources.map(s => sourceId(s.id)), [entryId], {family_office_reference: {type: 'gaps', gaps: packet.gaps, integration_note: 'The historical G12 registry-access limitation is resolved for this pinned integration by comparison with all 767 source records from main 275433c. No source currency or professional-review gap was closed by this comparison.'}, limitations: limits}));
  additions.push(record('guide-fo-reference-asc-map', 'guide', 'Family office reference: ASC topic lookup map', 'Find the accounting topic to investigate after selecting the entity, instrument, reporting purpose and period. No operative paragraph text was verified by this lookup map.', [sourceId(packet.asc.source_id)], [entryId], {family_office_reference: {type: 'asc', lookup: packet.asc}, limitations: limits}));
  additions.push(record(entryId, 'collection', 'Family-office accounting reference library', 'Source-first guidance across 40 topic routes, 112 annotated references, 160 research prompts and 12 private-context checklists. Start with a question, follow the reading path, and retain the source scope and access limits.', packet.sources.map(s => sourceId(s.id)), ['guide-family-office-us-accounting', 'example-family-office-four-entity-close', 'workflow-family-office-entity-close', 'control-family-office-ownership-payments', ...packet.topics.map(t => topicId(t.id)), ...packet.contexts.map(c => contextId(c.id)), 'guide-fo-reference-research-gaps', 'guide-fo-reference-asc-map'], {family_office_reference: {type: 'index', topics: packet.topics.map(t => ({record_id: topicId(t.id), topic_id: t.id, part: t.part_title, title: t.title, question: t.framing_question})), context_ids: packet.contexts.map(c => contextId(c.id)), gaps_id: 'guide-fo-reference-research-gaps', asc_map_id: 'guide-fo-reference-asc-map', counts: clone(packet.meta.counts), source_annotations: [...notes.values()]}, limitations: limits, integration: {base: packet.meta.integration_base, source_digest: packet.meta.sources_sha256, reused_sources: packet.decisions.rows.filter(r => r.disposition === 'reuse').length}}));
  const schema = read('schemas/record.schema.json');
  const newIndex = new Map([...all, ...additions].map(r => [r.id, r]));
  const changed = [];
  for (const r of additions) {
    validateSchema(r, schema, r.id);
    r.source_ids.forEach(id => assert.equal(newIndex.get(id)?.kind, 'source', `Missing source ${id}`));
    r.related_ids.forEach(id => assert.ok(newIndex.has(id), `Missing related record ${id}`));
    const existing = index.get(r.id);
    if (existing) assert.deepEqual(existing, r, `Conflicting integration record ${r.id}`);
    else { byKind[r.kind].push(r); changed.push(r.id); }
  }
  const overrides = read('data/coverage/mapping-overrides.json');
  for (const r of additions) {
    const proposed = {industry_codes: [], industry_scope: 'shared-context', question_ids: [], exclude_question_ids: [], note: 'Family-office discovery navigation. No industry applicability or supported-answer assessment is asserted.'};
    if (overrides.records[r.id]) assert.deepEqual(overrides.records[r.id], proposed, `Mapping conflict ${r.id}`);
    else overrides.records[r.id] = proposed;
  }
  overrides.mapping_version = edition;
  const note = ` Edition ${edition} adds the source-first family-office reference library: 112 annotations, 40 topic routes, 160 unanswered discovery prompts and 12 context checklists. Existing source identities and assessment contents are preserved; discovery membership does not establish sufficient coverage.`;
  if (!meta.family_office_reference) { meta.coverage_note += note; meta.review_note += ' Family-office reference import preserves the prior research snapshot and source-level access/rights limits. No publisher re-verification, professional review, operating evidence or deployment is asserted.'; }
  meta.corpus_version = edition; meta.updated_at = date;
  meta.family_office_reference = {source_digest: packet.meta.sources_sha256, entry_id: entryId, package: packet.meta.edition};
  const writes = new Map(files.map(kind => [`data/corpus/${kind}.json`, byKind[kind]]));
  writes.set('data/catalog.json', meta); writes.set('data/coverage/mapping-overrides.json', overrides);
  for (const file of ['research-questions', 'subsector-profiles', 'subsector-screening', 'assessments']) {
    const relative = `data/coverage/${file}.json`, value = read(relative);
    if (Object.hasOwn(value, 'corpus_version')) value.corpus_version = edition; if (file === 'research-questions') value.question_set_version = edition; if (file === 'assessments') value.assessment_version = edition; writes.set(relative, value);
  }
  return {writes, additions, changed, counts: {sources_reused: packet.decisions.rows.filter(r => r.disposition === 'reuse').length, sources_added: additions.filter(r => r.kind === 'source').length, guides: additions.filter(r => r.kind === 'guide').length, collections: 1, changed_records: changed.length}, edition};
}
export function applyIntegration(root, options = {}) {
  const plan = planIntegration(root, options);
  if (!options.apply) return {...plan, written: []};
  // Compute/validate every change first, then retain a recoverable write receipt.
  const receiptDir = path.join(root, 'outputs/family-office-reference-import');
  fs.mkdirSync(receiptDir, {recursive: true});
  const receipt = {edition: plan.edition, status: 'prepared', files: []};
  for (const [relative, value] of plan.writes) {
    const before = fs.readFileSync(path.join(root, relative));
    const after = Buffer.from(JSON.stringify(value, null, 2) + '\n');
    if (before.equals(after)) continue;
    const backup = relative.replaceAll('/', '__');
    fs.writeFileSync(path.join(receiptDir, backup), before);
    receipt.files.push({path: relative, backup, before_sha256: createHash('sha256').update(before).digest('hex'), after_sha256: createHash('sha256').update(after).digest('hex')});
  }
  fs.writeFileSync(path.join(receiptDir, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
  for (const row of receipt.files) {
    const target = path.join(root, row.path);
    assert.equal(createHash('sha256').update(fs.readFileSync(target)).digest('hex'), row.before_sha256, `Concurrent change at ${row.path}`);
    const temporary = target + '.fo-import.tmp';
    fs.writeFileSync(temporary, JSON.stringify(plan.writes.get(row.path), null, 2) + '\n');
    fs.renameSync(temporary, target);
  }
  receipt.status = 'applied'; fs.writeFileSync(path.join(receiptDir, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
  return {...plan, written: receipt.files.map(row => row.path)};
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const args = process.argv.slice(2); const allowed = new Set(['--apply', '--root', '--edition']);
    let root = process.cwd(), edition = '2026-09-21.5', apply = false;
    for (let i = 0; i < args.length; i++) {
      assert.ok(allowed.has(args[i]), `Unknown option ${args[i]}`);
      if (args[i] === '--apply') apply = true;
      else { assert.ok(args[i + 1] && !args[i + 1].startsWith('--'), `Missing value for ${args[i]}`); if (args[i] === '--root') root = path.resolve(args[++i]); else edition = args[++i]; }
    }
    const result = applyIntegration(root, {apply, edition});
    console.log(JSON.stringify({mode: apply ? 'applied-canonical-records; edition generation still required' : 'read-only-plan', edition, ...result.counts, written: result.written, boundary: 'Run coverage mapping, snapshot/release generation and the complete repository checks. No deployment or accounting review is implied.'}, null, 2));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
