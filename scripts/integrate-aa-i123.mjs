import fs from 'node:fs';
import assert from 'node:assert/strict';

// Additive, issue-specific applicator. Conflicting owned IDs fail before writes.
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const outputs = new Map();
const save = (p, value) => outputs.set(p, JSON.stringify(value, null, 2) + '\n');
const union = (...a) => [...new Set(a.flat())];
const packetPath = 'data/research/aa-i123-entity-events.json';
const p = read(packetPath), date = p.reviewed_at;
const rights = {metadata:'CC0-1.0',content:'CC-BY-4.0',external_content:'External full text is not stored; publisher rights and permissions remain separate.',full_text_stored:false};
const dimensions = {scope:'present','accounting-question':'partial','evidence-inputs':'present',workflow:'present',controls:'present','worked-material':'present','empirical-support':'not-assessed'};
const provenance = {added_on:date,reviewer:'Codex AI-assisted original-source research',research_file:packetPath,note:'Bounded original synthesis and synthetic material; no professional review or operational validation.'};
const sources = read('data/corpus/source.json'), guides = read('data/corpus/guide.json'), examples = read('data/corpus/example.json');
const registry = read('data/coverage/research-questions.json'), assessments = read('data/coverage/assessments.json'), overrides = read('data/coverage/mapping-overrides.json');
const families = union(p.questions.map(q=>q.family_id));
const exampleId = 'example-aa-i123-entity-events';
function appendOwned(rows, item) {
  const old = rows.find(r=>r.id===item.id);
  if (old) assert.deepEqual(old,item,`Conflicting owned ID ${item.id}; review instead of overwriting`);
  else rows.push(item);
}
const record = (id, kind, title, summary, source_ids, data) => ({id,kind,title,summary,topics:['Entity changes and unusual events','US GAAP'],industries:[],jurisdiction:'United States; nongovernmental US GAAP, role-specific branches',source_type:null,publisher:'Accounting Agents contributors',source_url:null,source_ids,related_ids:[],review_status:'editorially-reviewed',reviewed_at:date,provenance,rights,data});
const inventoryPath = 'data/research/aa-i123-inventory.json';
if (!fs.existsSync(inventoryPath)) {
  const mappings = read('data/coverage/record-mappings.json').mappings;
  save(inventoryPath,{base_commit:p.base_commit,issue:123,recorded_at:date,scope:p.scope,
    existing_named_questions:registry.questions.filter(q=>q.family_ids.some(f=>families.includes(f))),
    associated_records:mappings.filter(m=>m.question_mappings.some(q=>families.includes(q.question_id))).map(m=>({record_id:m.record_id,family_ids:m.question_mappings.map(q=>q.question_id).filter(f=>families.includes(f))})),
    family_guides:guides.filter(g=>families.includes(g.data.family_id)).map(g=>({id:g.id,scope:g.data.scope,source_ids:g.source_ids,question_ids:g.data.research_questions.map(q=>q.id)})),
    dispositions:{preserve:'All 14 existing linked named questions, including manufacturing and construction applications; IFRS answers remain separate.',reuse:['src_construction_fasb_202305','src_construction_fasb_201817','src_construction_fasb_codification_access','guide-q-consolidation','guide-q-investments','guide-q-income-tax','guide-q-capital-assets'],context_only:['src_construction_kpmg_contingencies'],add:p.questions.map(q=>q.id),unresolved:p.common_gaps},
    coordination:{'98/99/110':'Industry-specific retirement/remediation applications remain separate.','106':'Insurer-side accounting is excluded.','107':'Developer/owner disposal application remains separate.','118/109':'Reuse consolidation perimeter research.','120/121/122':'Reuse asset, instrument and tax foundations; no duplicate implementation.'}});
}
for (const s of p.sources) {
  const review = {batch:'aa-i123',reviewed_at:date,review_level:'substantive-excerpt',checked_url:s.url,locator:s.locator,publication_or_edition:s.edition,effective_period:s.effective_period,evidence_summary:s.summary,limitations:p.common_gaps,checks:[{checked_at:date,url:s.url,method:'Original publisher web open/search; no terms accepted',material_read:s.material_read,outcome:'Supports only the cited bounded synthesis, not current consolidated authority.'}],rights_review:{status:'unresolved',license:null,scope:null,note:'No redistribution, automated-reuse or training grant established.'}};
  if (s.reuse) {
    const old = sources.find(r=>r.id===s.id); assert.equal(old?.source_url,s.url);
    const reviews = old.data.supplemental_reviews ||= [];
    const prior = reviews.find(r=>r.batch==='aa-i123');
    if (prior) assert.deepEqual(prior,review); else reviews.push(review);
  } else {
    assert.ok(!sources.some(r=>r.source_url===s.url && r.id!==s.id),`Duplicate publisher URL ${s.url}`);
    const r = record(s.id,'source',s.title,s.summary,[],{frameworks:['US GAAP research; see source-specific scope'],edition:s.edition,effective_period:s.effective_period,source_locators:[{url:s.url,locator:s.locator}],supplemental_reviews:[review],limitations:p.common_gaps,source_rights:{status:'unresolved',full_text_stored:false,permission_scope:null}});
    Object.assign(r,{publisher:s.publisher,source_url:s.url,source_type:s.classification,review_status:'source-checked',rights:{...rights,source_status:'unresolved',source_license:null,source_permission_scope:null}});
    appendOwned(sources,r);
  }
}
const workflow = [
  'Define reporting entity, role, framework, event date, balance date, information cutoff and applicable edition; route exceptions before calculating.',
  'Collect original agreements, legal/engineering/valuation evidence and counterevidence; reconcile consideration, balances and populations to independent records.',
  'Prepare separate classification, recognition, measurement and disclosure decisions with precise source locators and unresolved facts.',
  'Recompute the applicable bridge, preserve prior estimates and reconcile cash and noncash movements without unsupported netting.',
  'A named authorized accounting reviewer must resolve scope and evidence gaps before any real posting; retain approval, exceptions and disclosure disposition.'
];
const controls = [
  {id:'entity-perimeter',performer:'Accounting preparer and independent reviewer',frequency:'Each unusual event and reporting close',risk:'Wrong entity or accounting model',evidence:'Signed role/classification memorandum, ownership chart, date and applicable-source version',failure:'Unresolved role, missing agreement or pre-effective date stops a proposed conclusion.'},
  {id:'separate-claims',performer:'Accounting reviewer with legal and insurance specialists as needed',frequency:'Each claim decision and estimate update',risk:'Unsupported recovery asset or net liability',evidence:'Separate liability/recovery decisions, insurer response, estimate version and authorization',failure:'Contested or unsupported recovery remains an exception; no balancing plug.'},
  {id:'event-rollforward',performer:'Independent close reviewer',frequency:'Each reporting period with an open event',risk:'Unexplained revisions, missing settlements or budget accrual',evidence:'Opening balance to closing balance with source-linked movements, rate layers and dated triggers',failure:'Arithmetic agreement alone cannot resolve unsupported recognition or legal facts.'}
];
const cases = [
  {id:'acquisition',date:'2026-06-30',currency:'USD',role:'Buyer',classification:'Assumed business combination for illustration',facts:'Operating workforce and critical production processes acquired with heterogeneous plant, inventory and customer assets; assume the concentration screen is not met and substantive-process criteria are supported. No NCI, prior interest, tax or measurement exceptions modeled.',consideration:1000000,identifiable_assets:1200000,assumed_liabilities:350000,residual:150000,source_ids:['src_aa_i123_201701'],approval:{status:'synthetic-assumption-only',evidence:'SYN-ACQ-MEMO-01; no actual valuation or reviewer signature'},treatment:'Residual reconciliation only: 1,000,000 - (1,200,000 - 350,000) = 150,000. Goodwill posting requires the unresolved complete ASC 805 analysis.',counterexample:{id:'single-asset',same_cash_price:1000000,facts:'Only one identifiable machine and no substantive process acquired; concentration screen satisfied.',route:'asset-acquisition',goodwill_from_residual:false}},
  {id:'jv',date:'2026-06-30',currency:'USD',role:'Venture own financial statements',cash_contribution:1000000,source_ids:['src_construction_fasb_202305'],treatment:'Assume a qualifying JV; research new-basis formation measurement independently of the buyer case. Cash contribution alone does not measure all venture net assets.',counterexample:{formation_date:'2024-06-30',automatic_2025_model:false,needed:'Document early/retrospective adoption and sufficient information; investor treatment remains separate.'},approval:{status:'pending',evidence:null}},
  {id:'related-party',date:'2026-09-30',service_charge:20000,cash_paid:5000,closing_due:15000,source_ids:['src_aa_i123_fas57','src_construction_fasb_201817'],treatment:'Reconcile 20,000 - 5,000 = 15,000 across both counterparties; retain ownership and settlement terms. This does not establish arm\'s-length pricing or permit elimination in separate statements.',counterexample:{public_parent:true,private_common_control_alternative_eligible:false},approval:{status:'pending',evidence:null}},
  {id:'claim',date:'2026-09-30',currency:'USD',source_ids:['src_aa_i123_fas5','src_aa_i123_sec5y'],liability_assumptions:'For arithmetic only, assume a probable incurred loss reasonably estimated at 100,000 and no acquisition-date scope exception.',claim_liability:100000,potential_recovery:60000,recognized_recovery:0,net_liability_plug_allowed:false,recovery_decision:'Insurer disputes coverage; no evidence sufficient to support an asset. SEC branch additionally records footnote 49 presumption; private-company recognition text remains an explicit gap.',journals:[{debit:'Claim expense',credit:'Claim liability',amount:100000,approval:'SYN-CLAIM-01, assumed for illustration only'}],independent_revision:{date:'2026-10-31',new_claim_estimate:120000,additional_expense:20000,recognized_recovery:0,reason:'New legal estimate; insurer status unchanged',evidence:'SYN-LEGAL-02; original estimate retained'},approval:{status:'synthetic-assumption-only',evidence:'SYN-CLAIM-01 for liability; recovery proposal rejected in SYN-RECOVERY-01; no actual sign-off'}},
  {id:'guarantee',date:'2026-07-01',source_ids:['src_aa_i123_fin45'],facts:'Assumed standalone unrelated-party in-scope guarantee, premium received 3,000; no higher contingent-loss measurement assumed.',premium:3000,initial_liability:3000,journal:{debit:'Cash',credit:'Guarantee liability',amount:3000},counterexample:'A parent guarantee of subsidiary debt must be separately tested against initial-recognition exceptions; do not copy this entry.',approval:{status:'synthetic-assumption-only',evidence:'SYN-GUAR-01; current ASC 460 review pending'}},
  {id:'exit',date:'2026-09-30',source_ids:['src_aa_i123_fas146'],budget:50000,received_relocation_services:12000,cash_paid:7000,closing_payable:5000,unreceived_budget:38000,treatment:'Assuming only other exit costs in the selected model: expense received services 12,000; settle 7,000; payable 5,000. Do not accrue the 38,000 unreceived budget.',counterexample:'Employee termination benefits and lease exits require separate models.',approval:{status:'synthetic-assumption-only',evidence:'SYN-SERVICE-01 and SYN-CASH-01'}},
  {id:'disposal',date:'2026-09-30',source_ids:['src_aa_i123_201408'],facts:'Plan to sell one routine machine, with no demonstrated major strategic shift; no buyer program documented.',held_for_sale_supported:false,discontinued_operation_supported:false,needed:'Document all applicable criteria and material strategic effect before classification.',approval:{status:'pending',evidence:null}},
  {id:'retirement',date:'2026-12-31',currency:'USD',source_ids:['src_aa_i123_fas143','src_aa_i123_epa'],facts:'Synthetic asset with a legal normal-operation retirement duty, estimable fair value and an already recognized opening obligation. The base isolates subsequent liability arithmetic.',opening:100000,opening_cash_flow:121550.625,opening_years:4,original_rate:0.05,accretion:5000,upward_revision:10000,revision_timing:'Year-end after accretion',revision_rate:0.06,revision_years:3,revision_future_cash_flow:11910.16,settlement:20000,closing:95000,treatment:'Opening 100,000 + accretion 5,000 + separately measured revision 10,000 - settlement 20,000 = 95,000. Revision layer uses its own rate; asset-cost and depreciation effects require a separate asset schedule.',counterexample:'Improper-operation contamination goes to remediation research; do not apply this discount/accretion model by label alone.',approval:{status:'synthetic-assumption-only',evidence:'SYN-ENGINEERING-01; SYN-RATE-01; SYN-SETTLEMENT-01; no legal or engineering validation'}}
];
appendOwned(examples,record(exampleId,'example','US entity changes and unusual events: synthetic decision and reconciliation packet','US business versus asset acquisition, policyholder insurance recovery, and retirement versus remediation with independent role, date and estimate-change counterexamples.',p.sources.map(s=>s.id),{scope:p.scope,examples:cases,workflows:workflow,controls,limitations:['Synthetic examples use invented facts, inputs and approval references; they are not operational evidence.',...p.common_gaps],professional_review:'not-performed',empirical_support:'not-established'}));
for (const q of p.questions) {
  const guide = guides.find(g=>g.id===`guide-${q.family_id}`); assert.ok(guide);
  const locators = q.source_ids.map(id=>{const s=p.sources.find(s=>s.id===id);assert.ok(s);return {source_id:id,url:s.url,locator:s.locator,effective_period:s.effective_period,reviewed_at:date};});
  const full = {...q,scope:p.scope,answer_status:'sourced-answer-bounded',source_locators:locators,workflow,controls:controls.map(c=>`${c.id}: ${c.risk}. Evidence: ${c.evidence}`),worked_example:{record_id:exampleId,case_id:q.example_id},remaining_gaps:union(q.remaining_gaps,p.common_gaps),assessment:{status:'partial',dimensions,basis:'Bounded source research and synthetic counterexamples; current authority and professional review remain separate.',professional_review:'not-performed',empirical_support:'not-established'}};
  appendOwned(guide.data.research_questions,full);
  guide.source_ids=union(guide.source_ids,q.source_ids);
  guide.related_ids=union(guide.related_ids,[exampleId,'guide-q-consolidation','guide-q-investments','guide-q-income-tax','guide-q-capital-assets']);
  guide.data.source_ids=union(guide.data.source_ids,q.source_ids);
  guide.data.supplemental_research_files=union(guide.data.supplemental_research_files||[],[packetPath]);
  guide.data.us_entity_events_scope=p.scope;
  guide.data.us_entity_events_workflow=workflow;
  guide.data.us_entity_events_controls=controls;
  guide.data.us_entity_events_gaps=union(guide.data.us_entity_events_gaps||[],full.remaining_gaps);
  // Preserve original framework scope, dates and findings. Add a separately dated review.
  guide.data.supplemental_reviews ||= [];
  if(!guide.data.supplemental_reviews.some(r=>r.batch==='aa-i123'))guide.data.supplemental_reviews.push({batch:'aa-i123',reviewed_at:date,scope:p.scope,research_file:packetPath,professional_review:'not-performed'});
  const row={id:q.id,record_id:guide.id,pointer:`/data/research_questions/${guide.data.research_questions.findIndex(x=>x.id===q.id)}`,family_ids:[q.family_id],question:q.question,scope:p.scope,answer_status:full.answer_status,assessment_status:'partial',source_ids:q.source_ids,remaining_gaps:full.remaining_gaps,professional_review:'not-performed',empirical_support:'not-established',dimensions,dimension_basis:full.assessment.basis};
  appendOwned(registry.questions,row);
  appendOwned(assessments.assessments,{id:`coverage-${q.id}`,scope_kind:'shared-context',industry_code:null,question_id:q.family_id,family_ids:[q.family_id],named_question_id:q.id,status:'partial',scope:p.scope,jurisdictions:['United States'],frameworks:['US GAAP research with source-specific historical and SEC limits'],effective_from:null,effective_to:null,reviewed_at:date,reviewer:provenance.reviewer,review_basis:full.assessment.basis,source_currency:'verified-within-stated-scope',evidence_record_ids:[guide.id,exampleId,...q.source_ids],dimensions,gaps:union(full.remaining_gaps,q.exceptions.map(e=>`Exception: ${e}`)),rights});
}
for (const id of union(p.sources.map(s=>s.id),families.map(f=>`guide-${f}`),[exampleId])) {
  const familyIds = id===exampleId ? families : id.startsWith('guide-') ? [id.slice(6)] : union(p.questions.filter(q=>q.source_ids.includes(id)).map(q=>q.family_id));
  const old=overrides.records[id]||{};
  overrides.records[id]={...old,replace_question_ids:old.replace_question_ids??false,question_ids:union(old.question_ids||[],familyIds),industry_codes:old.industry_codes||[],industry_scope:old.industry_scope||'shared-context',basis_field:'/data',reason:'AA-I123 named questions cite these records within separate source and role limits; discovery only.',reviewed_question_ids:union(old.reviewed_question_ids||[],familyIds),reviewed_industry_codes:old.reviewed_industry_codes||[],reviewed_at:date,review_note:'Issue123 source/question associations inspected; no descendant or family sufficiency claim.'};
}
const criteria=read('data/coverage/research-criteria.json'); criteria.population.named_research_questions=registry.questions.length;
registry.question_set_version=p.version;registry.corpus_version=p.version;registry.reviewed_at=date;
assessments.assessment_version=p.version;
for (const file of ['data/coverage/subsector-profiles.json','data/coverage/subsector-screening.json','data/coverage/research-criteria.json']) {
  if (file.endsWith('research-criteria.json')) {criteria.corpus_version=p.version;continue;}
  const generated=read(file);generated.corpus_version=p.version;save(file,generated);
}
const catalog=read('data/catalog.json');
if (catalog.corpus_version!==p.version) {
  assert.equal(catalog.corpus_version,'2026-09-18.1','Apply on assigned base; newer corpus integration requires separate coordinator review.');
  catalog.corpus_version=p.version;catalog.updated_at=date;
  catalog.coverage_note += ' AA-I123 adds nine bounded US entity-event questions to six existing guides, original-source reviews and synthetic branches. All nine assessments remain partial; historical sources do not close current-authority gaps.';
  catalog.review_note += ' AA-I123 was researched on 2026-09-18/19 with reserved edition 2026-09-18.123; no professional approval or deployment is asserted.';
}
for(const [file,value] of Object.entries({'data/corpus/source.json':sources,'data/corpus/guide.json':guides,'data/corpus/example.json':examples,'data/coverage/research-questions.json':registry,'data/coverage/assessments.json':assessments,'data/coverage/mapping-overrides.json':overrides,'data/coverage/research-criteria.json':criteria,'data/catalog.json':catalog}))save(file,value);
for(const [file,body] of outputs)if(!fs.existsSync(file)||fs.readFileSync(file,'utf8')!==body)fs.writeFileSync(file,body);
console.log(`Integrated ${p.id}: ${p.questions.length} questions; ${families.length} guides; ${p.version}. Run coverage:map, coverage:snapshot and check.`);
