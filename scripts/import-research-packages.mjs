import fs from "node:fs";
import assert from "node:assert/strict";

const read = f => JSON.parse(fs.readFileSync(f, "utf8"));
const write = (f, x) => fs.writeFileSync(f, JSON.stringify(x, null, 2) + "\n");
const date = "2026-09-11";
const names = ["foundations", "industries", "jurisdictions", "empirical"];
const batches = names.filter(n => fs.existsSync(`data/research/${n}.json`)).map(n => ({name:n, ...read(`data/research/${n}.json`)}));
const sources = read("data/corpus/source.json"), guides = read("data/corpus/guide.json");
const overrides = read("data/coverage/mapping-overrides.json");
const aliases = {src_roadmap_naics2022: "src_roadmap_naics2022_manual", src_roadmap_naics_311: "src_roadmap_naics2022_manual"};
const sourceById = new Map(sources.map(r => [r.id, r]));
const byURL = new Map(sources.filter(r => r.source_url).map(r => [r.source_url, r]));
const rights = {metadata:"CC0-1.0", content:"CC-BY-4.0", external_content:"External text is not included; source terms and unresolved permissions remain separate.", full_text_stored:false};
for (const batch of batches) for (const s of batch.sources || []) {
  assert.ok(s.id && s.title && /^https?:\/\//.test(s.source_url), `Invalid source proposal ${s.id}`);
  const existing = sourceById.get(aliases[s.id] || s.id) || byURL.get(s.source_url);
  const record = existing || {
    id:s.id,kind:"source",title:s.title,summary:s.evidence_summary || s.summary || `Publisher reference for ${s.title}; see the bounded review scope.`,
    topics:["Research foundations"], industries:[],jurisdiction:s.jurisdiction || null,source_type:s.source_type || "Publisher reference",publisher:s.publisher,source_url:s.source_url,
    source_ids:[],related_ids:[],review_status:s.review_level === "attempted-unresolved" ? "inherited-not-reverified" : "source-checked",reviewed_at:s.review_level === "attempted-unresolved" ? null : date,
    provenance:{added_on:date,reviewer:"Codex AI-assisted source research",note:"Original bounded synthesis of the cited public material; not professional review or a licence to external content."},
    rights:{...rights, source_status:s.rights_review?.status || s.rights_status || "unknown",source_license:null,source_license_url:null,source_permission_scope:null},data:{},
  };
  aliases[s.id] = record.id;
  const review = {
    batch:batch.name, reviewed_at:date, review_level:s.review_level || "scope-not-specified",
    checked_url:s.source_url, locator:s.source_locator || s.locator || null,
    publication_or_edition:s.publication_or_edition || null, effective_period:s.effective_period || null,
    evidence_summary:s.evidence_summary || null, limitations:s.limitations || [],
    checks:s.checks || [], rights_review:s.rights_review || {status:s.rights_status || "unknown"},
  };
  record.data.supplemental_reviews = [...(record.data.supplemental_reviews || []).filter(x => x.batch !== batch.name || x.checked_url !== s.source_url), review];
  if (!existing) {record.data.frameworks=s.frameworks || []; sources.push(record);sourceById.set(record.id,record);byURL.set(record.source_url,record);}
}
const remap = value => typeof value === "string" ? aliases[value] || value : Array.isArray(value) ? value.map(remap) : value && typeof value === "object" ? Object.fromEntries(Object.entries(value).map(([k,v])=>[k,remap(v)])) : value;
const allOther = fs.readdirSync("data/corpus").filter(f=>f.endsWith(".json")&&!['source.json','guide.json'].includes(f)).flatMap(f=>read(`data/corpus/${f}`));
const known = new Set([...sources,...guides,...allOther].map(r=>r.id));
const familyTitles = new Map(read("data/coverage/topology.json").question_families.map(f=>[f.id,f.title]));
const checkReferences = (value, where) => {
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    if (key === "source_ids") for (const id of child) assert.ok(sourceById.has(id), `${where}: unknown source ${id}`);
    if (key === "source_id") assert.ok(sourceById.has(child), `${where}: unknown source ${child}`);
    checkReferences(child, where);
  }
};
const questionRows=[];
for (const original of batches) {
  const batch=remap(original);
  const packages=batch.families || batch.packages || batch.guides || [];
  for (const p of packages) {
    const id=p.guide_id || (p.family_id ? `guide-${p.family_id}` : `guide-${p.package_id}`);
    const qs=p.questions || p.research_questions || [];
    const source_ids=[...new Set([...(p.source_ids || []),...qs.flatMap(q=>q.source_ids || [])])];
    const family_ids=p.family_id ? [p.family_id] : p.question_family_ids || [];
    for(const f of family_ids) assert.ok(familyTitles.has(f),f);
    const industry_codes=p.industry_codes || p.industry_scope?.naics_codes || [];
    const summary=p.summary || p.scope || `Scoped research on ${p.title.toLowerCase()}: ${qs.length} questions, evidence inputs, worked material and remaining gaps.`;
    const related_ids=[...new Set(p.related_ids || [])];
    const data={...p,version:"2026-09-11.1",research_package:batch.name,research_questions:qs};
    delete data.questions;
    data.professional_review="not-performed";data.empirical_support=p.empirical_support || "not-established";
    data.editorial_brief={question:p.title, answer:summary, findings:qs.map(q=>({claim:q.answer,source_ids:[...new Set(q.source_ids || [])],classification:q.answer_status || "scoped-research",qualification:q.scope || p.scope || "Apply only within the question's stated conditions and source access limits."})),unknowns:[...new Set(p.coverage_gaps || p.remaining_limits || ["No family-wide accounting sufficiency or professional review is asserted."])],reading_order:source_ids};
    checkReferences(data,id);
    for (const source of source_ids) assert.ok(sourceById.has(source),`${id}: ${source}`);
    const record={id,kind:"guide",title:p.title,summary,topics:["Scoped research",...family_ids.map(id=>familyTitles.get(id))],industries:p.industries || [],jurisdiction:p.jurisdiction || p.jurisdictions?.join("; ") || "Declared separately for each question",source_type:null,publisher:"Accounting Agents contributors",source_url:null,source_ids,related_ids,review_status:"editorially-reviewed",reviewed_at:date,provenance:{added_on:date,reviewer:"Codex AI-assisted research, with root source-scope and semantic review",note:"Original research synthesis and clearly labeled original examples. Listed source access and currency limits constrain every answer; no professional sign-off or production validation.",research_file:`data/research/${batch.name}.json`},rights:{...rights},data};
    const at=guides.findIndex(g=>g.id===id); if(at<0) guides.push(record);else guides[at]=record;known.add(id);
    overrides.records[id]={replace_question_ids:true,question_ids:family_ids,industry_codes,industry_scope:industry_codes.length?"specific":"shared-context",basis_field:"/data/research_questions",reason:"The explicitly scoped research questions and original synthesis support discovery associations only. Detailed-industry adequacy is separately assessed.",reviewed_question_ids:family_ids,reviewed_industry_codes:industry_codes,reviewed_at:date,review_note:"Reviewed discovery relationship to the named questions and explicitly declared industry scope; does not confer accounting adequacy or professional verification."};
    for(const q of qs) questionRows.push({id:q.id,record_id:id,pointer:`/data/research_questions/${qs.indexOf(q)}`,family_ids:q.family_id?[q.family_id]:q.family_ids || family_ids,question:q.question,scope:q.scope || p.scope || summary,answer_status:q.answer_status || "sourced-answer-bounded",assessment_status:q.assessment?.status || "partial",source_ids:[...new Set(q.source_ids || [])],remaining_gaps:q.remaining_gaps || [],professional_review:"not-performed",empirical_support:"not-established"});
  }
}
for(const g of guides.filter(g=>g.data.manual_research_questions)) for(const [i,q] of g.data.research_questions.entries()) {
  checkReferences(q,g.id);
  questionRows.push({id:q.id,record_id:g.id,pointer:`/data/research_questions/${i}`,family_ids:q.family_ids,question:q.question,scope:q.scope,answer_status:q.answer_status||"sourced-answer-bounded",assessment_status:"partial",source_ids:q.source_ids,remaining_gaps:q.remaining_gaps,professional_review:"not-performed",empirical_support:"not-established"});
}
// A field-presence inventory is not a seven-dimension sufficiency finding.
for(const row of questionRows){
 const g=guides.find(g=>g.id===row.record_id),q=g.data.research_questions[Number(row.pointer.split('/').at(-1))];
 row.dimensions={scope:"partial",'accounting-question':row.assessment_status==='evidence-gap'?"missing":"partial",'evidence-inputs':(q.inputs?.length||q.evidence_inputs?.length)?"partial":"missing",workflow:(q.workflow?.length||g.data.workflows?.length||g.data.connected_workflow)?"partial":"missing",controls:(q.controls?.length||g.data.controls?.length)?"partial":"missing",'worked-material':(q.worked_example||g.data.worked_examples?.length||g.data.worked_record_id)?"partial":"missing",'empirical-support':g.data.research_package==='empirical'?"partial":"not-assessed"};
 row.dimension_basis='Presence and review limits of the linked named question, package workflow and original worked material. Partial does not establish accounting correctness; missing means this question packet lacks that component.';
 q.assessment={...(q.assessment||{}),status:row.assessment_status,dimensions:row.dimensions,basis:row.dimension_basis,professional_review:'not-performed'};
}
// New source associations follow the exact questions citing them, not every family in a package.
for(const s of sources){
 const qs=questionRows.filter(q=>q.source_ids.includes(s.id));if(!qs.length)continue;
 const previous=overrides.records[s.id]||{};
 const families=[...new Set([...(previous.question_ids||[]),...qs.flatMap(q=>q.family_ids)])];
 overrides.records[s.id]={...previous,replace_question_ids:false,question_ids:families,industry_codes:previous.industry_codes||[],industry_scope:previous.industry_scope||'shared-context',basis_field:'/data',reason:'Exact named research questions cite this source within their separate scope limits; discovery relationship only.',reviewed_question_ids:families,reviewed_industry_codes:previous.reviewed_industry_codes||[],reviewed_at:date,review_note:'Question-level citation association reviewed; no industry descendant or sufficiency credit.'};
}
assert.equal(new Set(questionRows.map(q=>q.id)).size,questionRows.length,"Duplicate research-question IDs");
for(const g of guides) for(const id of g.related_ids) assert.ok(known.has(id),`${g.id}: unknown related ${id}`);
write("data/corpus/source.json",sources);write("data/corpus/guide.json",guides);write("data/coverage/mapping-overrides.json",overrides);
write("data/research/source-aliases.json",aliases);
write("data/coverage/research-questions.json",{schema_version:"1.0.0",question_set_version:"2026-09-11.1",corpus_version:"2026-09-11.2",reviewed_at:date,scope:"Versioned named research questions. Broader unresolved family questions and industry applicability are separate denominators, retained in their review files.",questions:questionRows});
console.log({sources:sources.length,guides:guides.length,named_questions:questionRows.length});
