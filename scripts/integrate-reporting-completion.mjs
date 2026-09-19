#!/usr/bin/env node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const currentVersion = '2026-09-19.12416';
const currentMode = process.argv.includes('--current');
// These proposal IDs were never canonical. Reuse the exact existing publisher
// records and append a scoped review without altering their primary metadata.
const sourceReuse = {
  src_aa118_fasb_asc_current: 'src_1os761s',
  src_aa118_fasb_asu202010: 'src_fasb_202010',
  src_aa118_sec_sab99: 'src_secsab0099',
  src_aa118_sec_sab108: 'src_secsab0108',
  src_aa118_ecfr_reg_sx_current: 'src_regsxcfr'
};
const reusedIds = new Set(Object.values(sourceReuse));
function canonicalIds(value) {
  if (typeof value === 'string') return sourceReuse[value] || value;
  if (Array.isArray(value)) return value.map(canonicalIds);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k,v]) => [k,canonicalIds(v)]));
  return value;
}
const root = path.resolve(process.env.REPORTING_COMPLETION_ROOT ?? process.cwd());
const packagePath = path.join(root, 'data/research/reporting-completion-2026-09-19.json');
const inventoryPath = path.join(root, 'data/research/reporting-completion-inventory-2026-09-19.json');
const examplePath = path.join(root, 'data/research/reporting-completion-example-2026-09-19.json');

const files = {
  catalog: 'data/catalog.json',
  source: 'data/corpus/source.json',
  guide: 'data/corpus/guide.json',
  example: 'data/corpus/example.json',
  questions: 'data/coverage/research-questions.json',
  assessments: 'data/coverage/assessments.json',
  mapping: 'data/coverage/mapping-overrides.json',
  foundations: 'data/research/foundations.json'
};

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function clone(value) {
  return structuredClone(value);
}

function equal(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function unique(values) {
  return [...new Set(values)];
}

function requireValue(condition, message) {
  if (!condition) throw new Error(message);
}

function sourceRecord(source, pkg) {
  const scope = source.source_locator;
  return {
    id: source.id,
    kind: 'source',
    title: source.title,
    summary: source.summary,
    topics: ['Accounting and reporting', 'Reporting foundations completion'],
    industries: [],
    jurisdiction: source.jurisdiction,
    source_type: source.source_type,
    publisher: source.publisher,
    source_url: source.source_url,
    source_ids: [],
    related_ids: [],
    review_status: 'source-checked',
    reviewed_at: pkg.reviewed_at,
    provenance: {
      added_on: pkg.reviewed_at,
      reviewer: pkg.reviewer,
      review_scope: scope,
      evidence_urls: [source.source_url],
      note: 'Bounded primary-source review for four selected US reporting routes; current consolidated text and professional review remain outside scope.'
    },
    rights: {
      metadata: 'CC0-1.0',
      content: 'CC-BY-4.0',
      external_content: 'Publisher text is not stored; publisher terms apply.',
      full_text_stored: false,
      source_status: source.rights_review.status,
      source_license: source.rights_review.license,
      source_permission_scope: source.rights_review.permission_scope
    },
    data: {
      id: source.id,
      record_version: '1',
      record_updated_at: pkg.reviewed_at,
      topic: 'Accounting and reporting',
      source_type: source.source_type,
      owner: source.publisher,
      title: source.title,
      published_or_status: source.publication_or_edition,
      jurisdiction: source.jurisdiction,
      access: source.access_status,
      summary: source.summary,
      frameworks: source.frameworks,
      edition: source.publication_or_edition,
      effective_period: source.effective_period,
      source_locators: [{ url: source.source_url, locator: source.source_locator }],
      source_review: {
        level: source.review_level,
        status: 'source-checked',
        reviewed_at: pkg.reviewed_at,
        scope,
        limitations: source.limitations
      },
      limitations: source.limitations,
      source_license: source.rights_review.license,
      source_rights: {
        status: source.rights_review.status,
        permission_scope: source.rights_review.permission_scope,
        full_text_stored: false,
        note: source.rights_review.note
      },
      metadata_rights: 'CC0-1.0',
      annotation_rights: 'CC-BY-4.0',
      canonical_source_url: source.source_url,
      reporting_completion: {
        package_id: pkg.package_id,
        version: pkg.version,
        question_ids: source.question_ids
      }
    }
  };
}

function guideQuestion(family, pkg, example) {
  const q = family.question;
  return {
    id: q.id,
    question: q.question,
    scope: q.scope,
    conditions: [
      'Entity role, US GAAP basis, reporting period and current effective requirements are declared before applying the route.',
      'The selected answer is bounded to the listed source locators and does not decide entity-specific accounting.'
    ],
    answer: q.answer,
    answer_status: q.answer_status,
    source_ids: q.source_ids,
    source_locators: family.source_locators.map((locator, index) => ({
      source_id: family.source_ids[index],
      locator
    })),
    dimensions: q.assessment.dimensions,
    inputs: q.inputs,
    controls: q.controls,
    exceptions: q.counterexamples,
    remaining_gaps: q.remaining_gaps,
    family_id: q.family_id,
    worked_record_id: example.id,
    assessment: q.assessment,
    reporting_completion: {
      package_id: pkg.package_id,
      version: pkg.version,
      family_id: family.family_id,
      question_id: q.id,
      reviewed_at: pkg.reviewed_at
    }
  };
}

function expectedAssessment(family, pkg, sourceIds, exampleId) {
  const q = family.question;
  return {
    id: `coverage-reporting-completion-${family.family_id}-2026-09-19`,
    scope_kind: 'shared-context',
    industry_code: null,
    named_question_id: family.question.id,
    question_id: family.family_id,
    family_ids: [family.family_id],
    status: 'partial',
    scope: q.scope,
    jurisdictions: family.jurisdictions,
    frameworks: family.frameworks,
    effective_from: null,
    effective_to: null,
    reviewed_at: pkg.reviewed_at,
    reviewer: pkg.reviewer,
    review_basis: `Selected-source and synthetic-fixture review for ${family.family_id}; this is a completion proposal for one named route, not a whole-industry assessment.`,
    source_currency: 'verified-within-stated-scope',
    evidence_record_ids: [family.guide_id, exampleId, ...sourceIds],
    dimensions: q.assessment.dimensions,
    gaps: q.remaining_gaps,
    rights: {
      metadata: 'CC0-1.0',
      content: 'CC-BY-4.0',
      external_content: 'Not included; linked source records retain publisher terms.',
      full_text_stored: false
    }
  };
}

function mappingRecord(questionIds, reviewedAt, reason) {
  return {
    replace_question_ids: true,
    question_ids: questionIds,
    industry_codes: [],
    industry_scope: 'shared-context',
    basis_field: '/data/reporting_completion',
    reason,
    reviewed_question_ids: questionIds,
    reviewed_industry_codes: [],
    reviewed_at: reviewedAt,
    review_note: 'Additive package association only; no existing guide, source, question or industry mapping is replaced.'
  };
}

function validatePackage(pkg, inventory, example, catalog) {
  requireValue(String(pkg.issue_id) === '118', `unexpected issue id: ${pkg.issue_id}`);
  requireValue(pkg.base_commit === 'f3d7fb2d56e09d7a3af8ed602e7d0238c763e9e8', 'package base commit does not match the assigned source head');
  requireValue(pkg.version !== catalog.corpus_version, 'package version must remain distinct from corpus version');
  requireValue(inventory.package_id === pkg.package_id && inventory.package_version === pkg.version, 'inventory does not match package');
  requireValue(example.id === 'example-us-reporting-completion-boundaries', 'unexpected example id');
  requireValue(inventory.completion_targets.length === 4, 'completion package must contain exactly four targets');
  requireValue(pkg.families.length === 4, 'package must contain exactly four families');
  const families = new Set(pkg.families.map(f => f.family_id));
  for (const familyId of inventory.completion_targets) requireValue(families.has(familyId), `missing completion family: ${familyId}`);
  const sourceIds = new Set(pkg.sources.map(s => s.id));
  requireValue(sourceIds.size === pkg.sources.length, 'source ids must be unique');
  for (const source of pkg.sources) {
    requireValue(source.source_url.startsWith('https://'), `source URL is not public HTTPS: ${source.id}`);
    requireValue(source.source_locator && source.effective_period && source.access_status, `source locator, period and access are required: ${source.id}`);
    requireValue(source.rights_review?.status === 'unresolved', `rights status must remain explicit: ${source.id}`);
  }
  for (const family of pkg.families) {
    requireValue(family.guide_id && family.question.id && family.question.source_ids.length > 0, `incomplete family: ${family.family_id}`);
    requireValue(family.question.answer_status === 'sourced-answer-bounded', `answer is not bounded: ${family.family_id}`);
    requireValue(family.question.assessment.status === 'partial', `assessment is not partial: ${family.family_id}`);
    requireValue(example.data.examples.some(e => e.id === family.question.worked_example_id), `example link is missing: ${family.family_id}`);
  }
}

function loadState() {
  const state = { pkg: readJson(packagePath), inventory: readJson(inventoryPath), examplePackage: readJson(examplePath) };
  for (const [key, relative] of Object.entries(files)) state[key] = readJson(path.join(root, relative));
  validatePackage(state.pkg, state.inventory, state.examplePackage, state.catalog);
  if (currentMode) requireValue(['2026-09-19.12413','2026-09-19.12415',currentVersion].includes(state.catalog.corpus_version), 'unrecognized current reporting edition before write');
  state.pkg = canonicalIds(state.pkg);
  state.examplePackage = canonicalIds(state.examplePackage);
  return state;
}

function prepare(state) {
  const { pkg, inventory, examplePackage } = state;
  const out = {
    source: clone(state.source),
    guide: clone(state.guide),
    example: clone(state.example),
    questions: clone(state.questions),
    assessments: clone(state.assessments),
    mapping: clone(state.mapping),
    foundations: clone(state.foundations)
  };
  const sourceById = new Map(out.source.map(record => [record.id, record]));
  const guideById = new Map(out.guide.map(record => [record.id, record]));
  const exampleById = new Map(out.example.map(record => [record.id, record]));
  const questionById = new Map(out.questions.questions.map(record => [record.id, record]));
  const assessmentById = new Map(out.assessments.assessments.map(record => [record.id, record]));

  const expectedSources = pkg.sources.map(source => sourceRecord(source, pkg));
  for (const expected of expectedSources) {
    const existing = sourceById.get(expected.id);
    if (reusedIds.has(expected.id)) {
      requireValue(existing && existing.source_url === expected.source_url, `conflict before write: reused source document ${expected.id}`);
      const incoming = {batch:pkg.package_id,reviewed_at:pkg.reviewed_at,reviewer:pkg.reviewer,checked_url:expected.source_url,review_level:expected.data.source_review.level,locator:expected.data.source_review.scope,publication_or_edition:expected.data.edition,effective_period:expected.data.effective_period,limitations:expected.data.limitations,question_ids:expected.data.reporting_completion.question_ids,rights_review:{status:'unresolved',note:'No change to existing source rights; this selected review grants no publisher reuse rights.'},source_proposal_id:Object.keys(sourceReuse).find(id=>sourceReuse[id]===expected.id)};
      const reviews = existing.data.supplemental_reviews ||= [];
      const prior = reviews.find(r=>r.batch===pkg.package_id);
      if (prior && !equal(prior,incoming)) throw new Error(`conflict before write: supplemental review ${expected.id}`);
      if (!prior) reviews.push(incoming);
    } else {
      requireValue(out.source.every(s=>s.source_url!==expected.source_url || s.id===expected.id), `conflict before write: duplicate publisher URL ${expected.id}`);
      if (existing && !equal(existing, expected)) throw new Error(`conflict before write: source ${expected.id} differs`);
      if (!existing) out.source.push(expected);
    }
  }

  const expectedExample = {
    id: examplePackage.id,
    kind: 'example',
    title: examplePackage.title,
    summary: examplePackage.summary,
    topics: ['Accounting and reporting', 'Synthetic examples'],
    industries: [],
    jurisdiction: examplePackage.jurisdiction,
    source_type: null,
    publisher: 'Accounting Agents contributors',
    source_url: null,
    source_ids: examplePackage.source_ids,
    related_ids: examplePackage.related_ids,
    review_status: 'editorially-reviewed',
    reviewed_at: pkg.reviewed_at,
    provenance: {
      added_on: pkg.reviewed_at,
      reviewer: pkg.reviewer,
      review_scope: 'Four selected US reporting routes; synthetic routing fixture only.',
      note: 'Synthetic examples are not professional, ERP, filing or ledger evidence.'
    },
    rights: {
      metadata: 'CC0-1.0',
      content: 'CC-BY-4.0',
      external_content: 'Not included; linked source records retain publisher terms.',
      full_text_stored: false
    },
    data: {
      id: examplePackage.id,
      title: examplePackage.title,
      summary: examplePackage.summary,
      scope: examplePackage.data.scope,
      examples: examplePackage.data.examples,
      limitations: examplePackage.data.limitations,
      source_ids: examplePackage.source_ids,
      related_ids: examplePackage.related_ids,
      reporting_completion: { package_id: pkg.package_id, version: pkg.version, reviewed_at: pkg.reviewed_at }
    }
  };
  const existingExample = exampleById.get(expectedExample.id);
  if (existingExample && !equal(existingExample, expectedExample)) throw new Error(`conflict before write: example ${expectedExample.id} differs`);
  if (!existingExample) out.example.push(expectedExample);

  for (const family of pkg.families) {
    const guide = guideById.get(family.guide_id);
    requireValue(guide, `missing existing guide for ${family.guide_id}`);
    const expectedQuestion = guideQuestion(family, pkg, examplePackage);
    const marker = expectedQuestion.reporting_completion;
    const expectedGuideMarker={...marker,source_file:'data/research/reporting-completion-2026-09-19.json',inventory_file:'data/research/reporting-completion-inventory-2026-09-19.json'};
    if(guide.data.reporting_completion&&!equal(guide.data.reporting_completion,expectedGuideMarker))throw new Error(`conflict before write: guide review ${guide.id}`);
    const existingQuestion = guide.data.research_questions.find(question => question.id === expectedQuestion.id);
    if (existingQuestion && !equal(existingQuestion, expectedQuestion)) throw new Error(`conflict before write: question ${expectedQuestion.id} differs`);
    if (!existingQuestion) {
      const nextGuide = clone(guide);
      nextGuide.source_ids = unique([...nextGuide.source_ids, ...family.source_ids]);
      nextGuide.data.source_ids = unique([...nextGuide.data.source_ids, ...family.source_ids]);
      nextGuide.data.source_locators = [...nextGuide.data.source_locators, ...family.source_locators.map((locator, index) => ({ source_id: family.source_ids[index], locator }))];
      nextGuide.data.research_questions = [...nextGuide.data.research_questions, expectedQuestion];
      nextGuide.data.reporting_completion = {...marker,source_file:'data/research/reporting-completion-2026-09-19.json',inventory_file:'data/research/reporting-completion-inventory-2026-09-19.json'};
      nextGuide.provenance.reporting_completion = marker;
      out.guide[out.guide.findIndex(record => record.id === guide.id)] = nextGuide;
    }
    const questionIndex = existingQuestion
      ? guide.data.research_questions.findIndex(question => question.id === expectedQuestion.id)
      : guide.data.research_questions.length;
    const registryExpected = {
      id: expectedQuestion.id,
      record_id: family.guide_id,
      pointer: `/data/research_questions/${questionIndex}`,
      family_ids: [family.family_id],
      question: expectedQuestion.question,
      scope: expectedQuestion.scope,
      answer_status: expectedQuestion.answer_status,
      assessment_status: expectedQuestion.assessment.status,
      source_ids: expectedQuestion.source_ids,
      remaining_gaps: expectedQuestion.remaining_gaps,
      professional_review: 'not-performed',
      empirical_support: 'not-established',
      dimensions: expectedQuestion.assessment.dimensions,
      dimension_basis: expectedQuestion.assessment.basis
    };
    const existingRegistry = questionById.get(registryExpected.id);
    if (existingRegistry && !equal(existingRegistry, registryExpected)) throw new Error(`conflict before write: registry ${registryExpected.id} differs`);
    if (!existingRegistry) out.questions.questions.push(registryExpected);

    const assessment = expectedAssessment(family, pkg, family.source_ids, examplePackage.id);
    const existingAssessment = assessmentById.get(assessment.id);
    if (existingAssessment && !equal(existingAssessment, assessment)) throw new Error(`conflict before write: assessment ${assessment.id} differs`);
    if (!existingAssessment) out.assessments.assessments.push(assessment);
  }

  const mappingAdds = new Map();
  for (const source of pkg.sources) {
    if (reusedIds.has(source.id)) continue;
    const familyIds = pkg.families.filter(family => source.question_ids.includes(family.question.id)).map(family => family.family_id);
    mappingAdds.set(source.id, mappingRecord(familyIds, pkg.reviewed_at, 'Source association for the selected US reporting completion package.'));
  }
  mappingAdds.set(examplePackage.id, mappingRecord(pkg.families.map(f => f.family_id), pkg.reviewed_at, 'Synthetic example association for the selected US reporting completion package.'));
  for (const [id, value] of mappingAdds) {
    const existing = out.mapping.records[id];
    if (existing && !equal(existing, value)) throw new Error(`conflict before write: mapping ${id} differs`);
    if (!existing) out.mapping.records[id] = value;
  }

  const foundationMarker = {
    issue_id: pkg.issue_id,
    package_id: pkg.package_id,
    package_version: pkg.version,
    base_commit: pkg.base_commit,
    family_ids: pkg.families.map(f => f.family_id),
    source_ids: pkg.sources.map(source => source.id),
    named_question_ids: pkg.families.map(f => f.question.id),
    note: 'Additive source-only package for four selected US reporting routes; existing foundation records and canonical corpus files remain unchanged until a separately authorized integration.'
  };
  if (out.foundations.reporting_completion_us && !equal(out.foundations.reporting_completion_us, foundationMarker)) throw new Error('conflict before write: foundations.reporting_completion_us differs');
  if (!out.foundations.reporting_completion_us) out.foundations.reporting_completion_us = foundationMarker;

  if (currentMode) {
    out.catalog = clone(state.catalog);
    if(out.catalog.corpus_version!==currentVersion){out.catalog.coverage_note+=` Edition ${currentVersion} adds four bounded US reporting answers for ledger close, estimates, presentation, and policy changes/errors.`;out.catalog.review_note+=` AA-I118 edition ${currentVersion} preserves accepted reporting routes and reuses five canonical source records through additive selected reviews.`;}
    out.catalog.corpus_version=currentVersion;
    out.questions.question_set_version=currentVersion;out.questions.corpus_version=currentVersion;
    out.assessments.assessment_version=currentVersion;out.mapping.mapping_version=currentVersion;
    out.extra={};
    const fixtures=readJson(path.join(root,'data/research-questions.json'));
    for(const row of readJson(path.join(root,'data/research/reporting-completion-retrieval-2026-09-19.json'))){
      const prior=fixtures.find(f=>f.id===row.id);
      if(prior&&!equal(prior,row))throw new Error(`conflict before write: retrieval ${row.id}`);
      if(!prior)fixtures.push(row);
    }
    out.extra['data/research-questions.json']=fixtures;
    for(const file of ['data/coverage/research-criteria.json','data/coverage/subsector-profiles.json','data/coverage/subsector-screening.json']){
      const value=readJson(path.join(root,file));
      if(file.endsWith('research-criteria.json'))value.population.named_research_questions=out.questions.questions.length;
      else value.corpus_version=currentVersion;
      out.extra[file]=value;
    }
  }
  return out;
}

function writePrepared(state, out) {
  writePreparedAt(root, out);
}

function writePreparedAt(targetRoot, out) {
  const writes = { source: out.source, guide: out.guide, example: out.example, questions: out.questions, assessments: out.assessments, mapping: out.mapping, foundations: out.foundations };
  if(out.catalog)writes.catalog=out.catalog;
  const staged=new Map();
  for(const[key,value]of Object.entries(writes))staged.set(files[key],value);
  for(const[file,value]of Object.entries(out.extra||{}))staged.set(file,value);
  for (const [file, value] of staged) {
    const target = path.join(targetRoot, file);
    const temporary = `${target}.reporting-completion.tmp`;
    fs.mkdirSync(path.dirname(target), { recursive: true });
    const original=fs.existsSync(target)?fs.readFileSync(target,'utf8'):'';
    let text=JSON.stringify(value,null,2)+'\n';
    if(!/[^\x00-\x7f]/.test(original)&&/\\u[0-9a-f]{4}/i.test(original))text=text.replace(/[\u007f-\uFFFF]/g,c=>`\\u${c.charCodeAt(0).toString(16).padStart(4,'0')}`);
    fs.writeFileSync(temporary, text);
    fs.renameSync(temporary, target);
  }
}

function copyInto(sourceRoot, targetRoot, relative) {
  const source = path.join(sourceRoot, relative);
  const target = path.join(targetRoot, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

function makeValidationRoot(sourceRoot) {
  const targetRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'aa-reporting-completion-applied-'));
  const filesToCopy = [
    'data/catalog.json', 'data/migration.json', 'data/relationships.json', 'data/source-observations.json',
    'schemas/record.schema.json', 'data/coverage/snapshots.json', 'data/coverage/snapshots.generated.ts',
    'data/coverage/topology.json', 'data/coverage/record-mappings.json', 'data/coverage/assessments.json',
    'data/coverage/metrics.json', 'data/coverage/research-questions.json', 'data/coverage/subsector-profiles.json',
    'data/coverage/subsector-screening.json', 'data/coverage/industry-exception-reviews.json',
    'data/coverage/research-criteria.json', 'data/coverage/classification-relationships.json',
    'data/coverage/mapping-overrides.json', 'data/reviews/source-reviews.json', 'data/reviews/editorial-reviews.json',
    'scripts/coverage-mappings.mjs'
  ];
  for (const relative of filesToCopy) copyInto(sourceRoot, targetRoot, relative);
  for (const file of fs.readdirSync(path.join(sourceRoot, 'data/corpus')).filter(file => file.endsWith('.json'))) copyInto(sourceRoot, targetRoot, `data/corpus/${file}`);
  for (const file of fs.readdirSync(path.join(sourceRoot, 'data/coverage/snapshots')).filter(file => file.endsWith('.json'))) copyInto(sourceRoot, targetRoot, `data/coverage/snapshots/${file}`);
  return targetRoot;
}

function corpusRecords(targetRoot) {
  return fs.readdirSync(path.join(targetRoot, 'data/corpus')).filter(file => file.endsWith('.json')).sort().flatMap(file => readJson(path.join(targetRoot, 'data/corpus', file)));
}

async function validateApplied(state, prepared) {
  const targetRoot = makeValidationRoot(root);
  const originalCwd = process.cwd();
  try {
    writePreparedAt(targetRoot, prepared);
    process.chdir(targetRoot);
    const { generateMappings } = await import(new URL('./coverage-mappings.mjs', import.meta.url).href + `?reporting-completion=${Date.now()}`);
    const mappings = generateMappings(corpusRecords(targetRoot));
    fs.writeFileSync(path.join(targetRoot, 'data/coverage/record-mappings.json'), `${JSON.stringify(mappings, null, 2)}\n`);
    const criteriaPath = path.join(targetRoot, 'data/coverage/research-criteria.json');
    const criteria = readJson(criteriaPath);
    criteria.population.named_research_questions = readJson(path.join(targetRoot, files.questions)).questions.length;
    fs.writeFileSync(criteriaPath, `${JSON.stringify(criteria, null, 2)}\n`);
    const { validateCorpus } = await import(new URL('./validate.mjs', import.meta.url).href + `?reporting-completion=${Date.now()}`);
    return validateCorpus();
  } finally {
    process.chdir(originalCwd);
    fs.rmSync(targetRoot, { recursive: true, force: true });
  }
}

try {
  const state = loadState();
  const prepared = prepare(state);
  const validation = process.argv.includes('--validate-applied') ? await validateApplied(state, prepared) : (process.argv.includes('--dry-run') ? null : writePrepared(state, prepared), null);
  console.log(JSON.stringify({
    package_id: state.pkg.package_id,
    package_version: state.pkg.version,
    families: state.pkg.families.map(f => f.family_id),
    sources_added_or_replayed: state.pkg.sources.length - reusedIds.size,
    sources_reused: reusedIds.size,
    canonical_files_staged: Object.values(files).filter(file => file !== files.catalog),
    applied_validation: validation
  }, null, 2));
} catch (error) {
  console.error(`reporting completion integration failed: ${error.message}`);
  process.exitCode = 1;
}
