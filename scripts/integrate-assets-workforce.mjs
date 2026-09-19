import fs from 'node:fs';
import assert from 'node:assert/strict';
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const packetFile = 'data/research/assets-workforce-2026-09-18.json';
const packet = read(packetFile), catalog = read('data/catalog.json');
const version = '2026-09-19.12413', date = '2026-09-19';
assert.equal(packet.issue_id, 'AA-I120');
assert.ok(['2026-09-19.12411', '2026-09-19.12412', version].includes(catalog.corpus_version), 'Refuse an unrecognized assets integration edition before writes');
const outputs = new Map(), unique = values => [...new Set(values)];
const stage = (file, value) => {
  const original = fs.readFileSync(file, 'utf8');
  let text = JSON.stringify(value, null, 2) + '\n';
  if (!/[^\x00-\x7f]/.test(original) && /\\u[0-9a-f]{4}/i.test(original)) text = text.replace(/[\u007f-\uFFFF]/g, c => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`);
  outputs.set(file, text);
};
const append = (rows, row, key = 'id') => {
  const old = rows.find(x => x[key] === row[key]);
  if (old) assert.deepEqual(old, row, `Conflicting assets target ${row[key]}`);
  else rows.push(structuredClone(row));
};
const mergeStrings = (before = [], after = []) => unique([...before, ...after]);
const sourceUpdates = [...packet.source_updates, ...packet.new_sources];
const sources = read('data/corpus/source.json'), guides = read('data/corpus/guide.json'), examples = read('data/corpus/example.json');
const byId = (rows, id) => { const row = rows.find(r => r.id === id); assert.ok(row, `Missing ${id}`); return row; };
const rights = {metadata:'CC0-1.0',content:'CC-BY-4.0',external_content:'External publisher text is not stored. Permission remains unresolved.',full_text_stored:false,source_status:'unknown',source_license:null,source_license_url:null,source_permission_scope:null};
const reviewRights = {status:'unresolved',license:null,note:'Public access does not establish redistribution or training permission.'};
const review = s => ({batch:packet.issue_id,reviewed_at:s.reviewed_at || packet.reviewed_at,review_level:s.review_scope.startsWith('publisher-summary')?'publisher-summary':'substantive-excerpt',checked_url:s.checked_url || s.source_url,locator:s.source_locator,publication_or_edition:s.publication_or_edition,effective_period:s.effective_period,effective_period_sources:s.effective_period_sources || [],evidence_summary:s.evidence_summary,limitations:s.limitations,checks:[{url:s.checked_url || s.source_url,method:'Original publisher selected material read',outcome:s.check_outcome,material_read:true}],rights_review:reviewRights});
function newSource(s) {
  const r = review(s), reviewed_at = r.reviewed_at;
  return {id:s.id,kind:'source',title:s.title,summary:s.summary,topics:['Accounting and reporting','Assets and workforce'],industries:[],jurisdiction:s.jurisdiction,source_type:s.source_type,publisher:s.publisher,source_url:s.source_url,source_ids:[],related_ids:s.related_ids || [],review_status:'source-checked',reviewed_at,provenance:{added_on:reviewed_at,reviewer:'Codex AI-assisted original publisher review',issue_id:packet.issue_id,package_version:packet.package_version,note:'Only the named excerpts and original synthesis were reviewed. Historical publications and issued amendments are not current consolidated Codification; no professional sign-off is claimed.'},rights:{...rights},data:{id:s.id,record_version:'1',record_updated_at:reviewed_at,title:s.title,summary:s.summary,frameworks:s.frameworks,published_or_status:s.publication_or_edition,access:s.access,source_locator:s.source_locator,effective_period:s.effective_period,effective_period_sources:s.effective_period_sources || [],historical:Boolean(s.historical),limitations:s.limitations,source_review:{record_id:s.id,disposition:'supported-scope',...r,question_ids:s.question_ids,industry_scope:'shared-context',industry_codes:[],reviewer:'Codex AI-assisted original publisher review'},supplemental_reviews:[r],source_rights:{status:'unknown',license_id:null,full_text_stored:false,permission_scope:null},curation:{temporal_role:s.historical?'historical-context':'current-with-stated-period',lifecycle:s.historical?'superseded':'current',transfer_limit:'Selected source evidence only; current authority and entity applicability remain separate.',profile_status:'curated'}}};
}
for (const s of packet.source_updates) {
  const target = byId(sources, s.id);
  assert.equal(target.source_url, s.source_url || s.checked_url, `Reused source document mismatch ${s.id}`);
  const reviews = target.data.supplemental_reviews ||= [];
  append(reviews, review(s), 'batch');
}
for (const s of packet.new_sources) {
  assert.ok(sources.every(row => row.source_url !== s.source_url || row.id === s.id), `Duplicate publisher URL ${s.source_url}`);
  append(sources, newSource(s));
}
const dimensions = {scope:'partial','accounting-question':'partial','evidence-inputs':'partial',workflow:'partial',controls:'partial','worked-material':'partial','empirical-support':'not-assessed'};
const basis = 'Selected original-source excerpts, scoped evidence workflow, controls and synthetic worked material support a bounded answer. Historical material is not current consolidated authority, and no professional or empirical conclusion is established.';
const registry = read('data/coverage/research-questions.json');
const mappings = read('data/coverage/mapping-overrides.json');
const assessments = read('data/coverage/assessments.json');
for (const family of packet.families) {
  const guide = byId(guides, family.guide_id);
  const questions = family.questions.map(q => ({...q,scope:family.scope,answer_status:'sourced-answer-bounded',family_id:family.family_id,assessment:{status:'partial',basis,professional_review:'not-performed',empirical_support:'not-established',dimensions}}));
  const initialEdition = guide.data.aa_i120_review?.integrated_corpus_version || version;
  assert.ok(['2026-09-19.12412', version].includes(initialEdition), `Conflicting initial assets edition ${guide.id}`);
  const marker = {issue_id:packet.issue_id,package_version:packet.package_version,integrated_corpus_version:initialEdition,reviewed_at:date,selected_scope:packet.selected_scope,source_ids:family.source_ids,source_locators:family.source_locators,review_basis:family.review_basis,question_ids:questions.map(q=>q.id),shared_inputs:family.shared_inputs,exceptions:family.exceptions,remaining_limits:family.remaining_limits};
  if (guide.data.aa_i120_review) assert.deepEqual(guide.data.aa_i120_review, marker, `Conflicting assets guide review ${guide.id}`);
  else guide.data.aa_i120_review = marker;
  guide.source_ids = mergeStrings(guide.source_ids, family.source_ids);
  guide.related_ids = mergeStrings(guide.related_ids, [packet.example.id]);
  for (const question of questions) append(guide.data.research_questions, question);
  for (const key of ['workflows','controls','coverage_gaps']) guide.data[key] = mergeStrings(guide.data[key], family[key]);
  // Preserve the original guide and international-question review metadata. The
  // added US questions carry their own separately dated review marker.
  for (const question of questions) {
    const index = guide.data.research_questions.findIndex(q=>q.id===question.id);
    append(registry.questions,{id:question.id,record_id:guide.id,pointer:`/data/research_questions/${index}`,family_ids:[family.family_id],question:question.question,scope:question.scope,answer_status:question.answer_status,assessment_status:'partial',source_ids:question.source_ids,source_locators:question.source_locators,remaining_gaps:question.remaining_gaps,professional_review:'not-performed',empirical_support:'not-established',dimensions,dimension_basis:basis});
    const incoming = packet.assessments.find(a=>a.named_question_id===question.id);
    assert.ok(incoming, `Missing assessment ${question.id}`);
    append(assessments.assessments,{id:incoming.id,scope_kind:'shared-context',industry_code:null,named_question_id:question.id,question_id:family.family_id,family_ids:[family.family_id],status:'partial',scope:family.scope,jurisdictions:family.jurisdictions,frameworks:family.frameworks,effective_from:null,effective_to:null,reviewed_at:date,reviewer:'Codex AI-assisted bounded source synthesis',review_basis:basis,source_currency:family.family_id==='q-capital-assets'||family.family_id==='q-benefits'?'unknown':'verified-within-stated-scope',evidence_record_ids:unique([guide.id,packet.example.id,...question.source_ids]),dimensions,gaps:unique([...question.remaining_gaps,...family.remaining_limits]),rights:{...rights},professional_review:'not-performed',empirical_support:'not-established'});
  }
}
const supporting = byId(guides, packet.supporting_guide.guide_id);
const supportingMarker = {issue_id:packet.issue_id,package_version:packet.package_version,reviewed_at:date,source_ids:packet.supporting_guide.source_ids,question_ids:packet.supporting_guide.question_ids,note:packet.supporting_guide.note};
if (supporting.data.aa_i120_review) assert.deepEqual(supporting.data.aa_i120_review,supportingMarker,'Conflicting supporting software guide review');
else supporting.data.aa_i120_review = supportingMarker;
append(examples,packet.example);
const mapping = (id,question_ids,basis_field) => ({replace_question_ids:true,question_ids,industry_codes:[],industry_scope:'shared-context',basis_field,reason:'Selected shared US assets and workforce evidence; no industry credit or whole-family sufficiency.',reviewed_question_ids:question_ids,reviewed_industry_codes:[],reviewed_at:date,review_note:'Bounded original synthesis only; current authority, professional review and empirical support remain separate.'});
for (const s of packet.new_sources) {
  const incoming = mapping(s.id,s.question_ids,'/data/source_locator');
  if (mappings.records[s.id]) assert.deepEqual(mappings.records[s.id],incoming,`Conflicting new source mapping ${s.id}`);
  else mappings.records[s.id]=incoming;
}
const exampleMapping = mapping(packet.example.id,packet.families.map(f=>f.family_id),'/data/editorial_review');
if (mappings.records[packet.example.id]) assert.deepEqual(mappings.records[packet.example.id],exampleMapping,'Conflicting example mapping');else mappings.records[packet.example.id]=exampleMapping;
const fixtures = read('data/research-questions.json');
for (const f of packet.retrieval_fixtures) append(fixtures,f);
const foundations = read('data/research/foundations.json');
const initialFoundationEdition = foundations.aa_i120?.integrated_corpus_version || version;
assert.ok(['2026-09-19.12412', version].includes(initialFoundationEdition), 'Conflicting initial foundation edition');
const foundationMarker = {issue_id:packet.issue_id,package_version:packet.package_version,integrated_corpus_version:initialFoundationEdition,family_ids:packet.families.map(f=>f.family_id),named_question_ids:packet.families.flatMap(f=>f.questions.map(q=>q.id)),source_ids:sourceUpdates.map(s=>s.id),note:'Additive US questions and source reviews. Original generic foundation payload and international questions remain unchanged; generic replay must preserve these additions.'};
if (foundations.aa_i120) assert.deepEqual(foundations.aa_i120,foundationMarker,'Conflicting assets foundation marker');else foundations.aa_i120=foundationMarker;
registry.question_set_version=version;registry.corpus_version=version;registry.reviewed_at=[registry.reviewed_at,date].filter(Boolean).sort().at(-1);
assessments.assessment_version=version;mappings.mapping_version=version;mappings.updated_at=[mappings.updated_at,date].filter(Boolean).sort().at(-1);
const criteria=read('data/coverage/research-criteria.json');criteria.population.named_research_questions=registry.questions.length;
if(catalog.corpus_version!==version){catalog.coverage_note+=` Edition ${version} adds ten bounded US assets-and-workforce questions while preserving existing international questions and source rights.`;catalog.review_note+=` AA-I120 edition ${version} integrates the recovered assets and workforce package with source amendments, additive review metadata and original synthetic examples; historical draft edition2026-09-18.122 remains preserved.`;}
catalog.corpus_version=version;catalog.updated_at=[catalog.updated_at,date].filter(Boolean).sort().at(-1);
for(const [file,value]of Object.entries({'data/catalog.json':catalog,'data/corpus/source.json':sources,'data/corpus/guide.json':guides,'data/corpus/example.json':examples,'data/research/foundations.json':foundations,'data/coverage/research-questions.json':registry,'data/coverage/mapping-overrides.json':mappings,'data/coverage/assessments.json':assessments,'data/research-questions.json':fixtures,'data/coverage/research-criteria.json':criteria}))stage(file,value);
for(const file of ['data/coverage/subsector-profiles.json','data/coverage/subsector-screening.json']){const value=read(file);value.corpus_version=version;stage(file,value);}
if(!process.argv.includes('--dry-run'))for(const[file,text]of outputs)if(fs.readFileSync(file,'utf8')!==text)fs.writeFileSync(file,text);
console.log(JSON.stringify({version,new_questions:10,new_sources:packet.new_sources.length,reused_sources:packet.source_updates.length,mode:process.argv.includes('--dry-run')?'dry-run':'applied'}));
