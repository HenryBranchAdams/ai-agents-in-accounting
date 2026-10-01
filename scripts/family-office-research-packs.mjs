import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

// Editorial routing only. All questions, checklists and source metadata come
// from canonical records; this is not a second imported guidance registry.
const routes = [
  {id: 'family-office-books', topic: 'fo-04', reporting_purpose: 'books', workflow: 'select-reporting-basis', entity: ['office entity', 'investment entity', 'individual'], framework: ['US GAAP', 'selected alternate framework'], jurisdiction: ['United States', 'source-specific alternate jurisdiction']},
  {id: 'family-office-fiduciary', topic: 'fo-22', reporting_purpose: 'fiduciary-accounting', workflow: 'reconcile-principal-income-distributions', entity: ['trust', 'estate'], framework: ['governing instrument and applicable state fiduciary law'], jurisdiction: ['United States; Texas', 'United States; Florida', 'US federal tax bridge']},
  {id: 'family-office-tax-basis', topic: 'fo-27', reporting_purpose: 'tax-basis', workflow: 'reconcile-partner-outside-basis', entity: ['partnership', 'partner'], framework: ['US federal partnership tax'], jurisdiction: ['United States']},
  {id: 'family-office-supplemental-reporting', topic: 'fo-33', reporting_purpose: 'supplemental-family-reporting', workflow: 'prepare-family-reporting-disclosures', entity: ['family reporting group', 'individual', 'investment entity'], framework: ['selected reporting basis', 'supplemental administration reporting'], jurisdiction: ['United States', 'source-specific applicability']},
];
const commonLimits = [
  'A pack is a bounded discovery route, not a supported answer, accounting conclusion or completeness claim.',
  'Reading order is editorial navigation, not authority ranking. Each source retains its own scope, rights and review status.',
  'Books, tax basis, fiduciary accounting and supplemental family reporting are separate purposes; reconcile bridges explicitly.',
  'Select the reporting period and verify operative provisions, amendments and entity facts. Edition and review dates do not establish effective dates.',
  'Publisher full text and private family documents are not included. Public access does not establish reuse permission.',
];
const recordUrl = id => `/records/${id}`;
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

export function buildFamilyOfficeResearchPacks(records, meta) {
  const byId = new Map(records.map(record => [record.id, record]));
  if (byId.size !== records.length) throw new Error('Duplicate canonical record ID');
  const consumed = new Map();
  function get(id, kind) {
    const record = byId.get(id);
    if (!record || record.kind !== kind) throw new Error(`Missing canonical ${kind}: ${id}`);
    consumed.set(id, record);
    return record;
  }
  const packs = routes.map(route => {
    const topic = get(`guide-fo-reference-${route.topic}`, 'guide');
    const reference = topic.data.family_office_reference;
    if (reference?.type !== 'topic' || !reference.framing_question || !reference.reading_path?.length) throw new Error(`Invalid topic route: ${topic.id}`);
    const required_context = reference.context_ids.map(id => {
      const context = get(id, 'guide');
      const checklist = context.data.family_office_reference?.checklist;
      if (!Array.isArray(checklist?.required_context)) throw new Error(`Missing context checklist: ${id}`);
      return {record_id: id, url: recordUrl(id), title: context.title, required_context: checklist.required_context, privacy_boundary: checklist.privacy_boundary};
    });
    const evidence = [];
    const seen = new Set();
    const reading_sequence = reference.reading_path.map((step, index) => {
      const id = step.annotation.record_id;
      if (!topic.source_ids.includes(id)) throw new Error(`Reading source outside canonical topic: ${id}`);
      const source = get(id, 'source');
      if (!seen.has(id)) {
        seen.add(id);
        evidence.push({
          record_id: id, url: recordUrl(id), title: source.title,
          publisher: source.publisher, source_url: source.source_url,
          jurisdiction: source.jurisdiction, source_type: source.source_type,
          review_status: source.review_status, reviewed_at: source.reviewed_at,
          edition: source.data.edition ?? source.data.discovery_annotation?.edition_observed ?? null,
          effective_period: source.data.effective_period ?? null,
          period_metadata: {effective_from: source.data.effective_from ?? source.data.effective_date ?? null, effective_to: source.data.effective_to ?? null, effective_note: source.data.effective_note ?? null, publication: source.data.publication ?? null},
          applicability: source.data.applicability ?? null,
          source_locators: source.data.source_locators ?? [],
          limitations: source.data.limitations ?? [], rights: source.rights,
          record_sha256: digest(source),
        });
      }
      return {position: index + 1, role: step.role, record_id: id, url: recordUrl(id), start_at: step.annotation.start_at, locator_precision: step.annotation.locator_precision, scope_limit: step.annotation.scope_limit};
    });
    return {
      id: route.id, canonical_topic_id: topic.id, canonical_topic_url: recordUrl(topic.id),
      title: topic.title, question: reference.framing_question,
      question_status: 'discovery-question-not-answered', boundary: reference.boundary,
      facets: {reporting_purpose: route.reporting_purpose, workflow: route.workflow, entity: route.entity, framework: route.framework, jurisdiction: route.jurisdiction, period: 'reader-selected; verify each source'},
      facet_basis: 'Editorial routing scope, not source or entity applicability.',
      required_context, additional_context: reference.additional_context ?? [],
      reading_sequence, evidence,
      limitations: [...commonLimits, ...(topic.data.limitations ?? [])],
      reviewer_handoff: {
        status: 'pending-entity-and-period-review',
        required_decisions: ['Confirm reporting purpose, entity perimeter, framework, jurisdiction and period.', 'Record operative source editions and provisions, access and unresolved rights.', 'Reconcile differences among book, tax, fiduciary and supplemental views.', 'Document contrary evidence, omitted branches and limitations before reaching a conclusion.'],
        record_ids: [topic.id, ...required_context.map(context => context.record_id), ...evidence.map(source => source.record_id)],
        conclusion: null, reviewer: null, reviewed_at: null,
      },
    };
  });
  return {
    schema_version: '1.0.0', corpus_version: meta.corpus_version,
    source: 'Canonical corpus records; no additional imported guidance.',
    canonical_record_hashes: Object.fromEntries([...consumed].sort(([a], [b]) => a.localeCompare(b)).map(([id, record]) => [id, digest(record)])),
    counts: {packs: packs.length, canonical_records: consumed.size, unique_sources: new Set(packs.flatMap(pack => pack.evidence.map(source => source.record_id))).size},
    packs,
  };
}

export function researchPacksMarkdown(bundle) {
  const lines = ['# Family-office research packs', '', `Corpus edition: ${bundle.corpus_version}`, '', bundle.source, '', 'Facets describe editorial routing. Select a period and verify each source before use.', ''];
  for (const pack of bundle.packs) {
    lines.push(`## ${pack.id}`, '', `Question: ${pack.question}`, '', `Status: ${pack.question_status}`, '', `Canonical route: [${pack.title}](${pack.canonical_topic_url})`, '', `Boundary: ${pack.boundary}`, '', '### Facets', '');
    for (const [key, value] of Object.entries(pack.facets)) lines.push(`- ${key}: ${Array.isArray(value) ? value.join('; ') : value}`);
    lines.push('', pack.facet_basis, '', '### Required context', '');
    for (const context of pack.required_context) {
      lines.push(`- [${context.title}](${context.url})`);
      for (const value of context.required_context) lines.push(`  - ${value}`);
      lines.push(`  - Privacy: ${context.privacy_boundary}`);
    }
    for (const value of pack.additional_context) lines.push(`- ${value}`);
    lines.push('', '### Canonical reading sequence', '');
    for (const step of pack.reading_sequence) lines.push(`${step.position}. [${step.role}](${step.url}) — ${step.start_at}`, `   Scope: ${step.scope_limit}`, `   Locator: ${step.locator_precision}`);
    lines.push('', '### Evidence', '');
    for (const source of pack.evidence) {
      lines.push(`- [${source.title}](${source.url}) — ${source.publisher}; ${source.jurisdiction}.`, `  Publisher entry: ${source.source_url ?? 'unknown'}`, `  Review: ${source.review_status}; reviewed ${source.reviewed_at ?? 'unknown'}. Edition: ${source.edition ?? 'unknown'}.`, `  Effective period: ${source.effective_period ?? 'unknown'}. Applicability: ${JSON.stringify(source.applicability)}.`, `  Recorded period metadata: ${JSON.stringify(source.period_metadata)}`, `  Rights: ${JSON.stringify(source.rights)}`);
      for (const locator of source.source_locators) lines.push(`  Recorded locator: ${locator.locator ?? 'unknown'} (${locator.url ?? source.source_url ?? 'unknown'})`);
      for (const limitation of source.limitations) lines.push(`  Limit: ${limitation}`);
    }
    lines.push('', '### Limitations', '', ...pack.limitations.map(value => `- ${value}`), '', '### Reviewer handoff', '', `Status: ${pack.reviewer_handoff.status}. Reviewer, review date and conclusion: unknown.`, '', ...pack.reviewer_handoff.required_decisions.map(value => `- ${value}`), '');
  }
  return lines.join('\n') + '\n';
}

export function writeFamilyOfficeResearchPacks(records, meta, directory) {
  const bundle = buildFamilyOfficeResearchPacks(records, meta);
  fs.mkdirSync(directory, {recursive: true});
  const json = path.join(directory, 'family-office-research-packs.json');
  const markdown = path.join(directory, 'family-office-research-packs.md');
  fs.writeFileSync(json, JSON.stringify(bundle, null, 2) + '\n');
  fs.writeFileSync(markdown, researchPacksMarkdown(bundle));
  return {json, markdown, counts: bundle.counts};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const directory = process.argv[2] ?? 'outputs/family-office-research-packs';
  if (process.argv.length > 3) throw new Error('Usage: family-office-research-packs.mjs [output-directory]');
  const records = fs.readdirSync('data/corpus').filter(file => file.endsWith('.json')).sort().flatMap(file => JSON.parse(fs.readFileSync(path.join('data/corpus', file), 'utf8')));
  const meta = JSON.parse(fs.readFileSync('data/catalog.json', 'utf8'));
  console.log(JSON.stringify(writeFamilyOfficeResearchPacks(records, meta, directory)));
}
