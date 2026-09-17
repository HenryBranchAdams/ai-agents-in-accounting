import fs from "node:fs";
import assert from "node:assert/strict";

const read = f => JSON.parse(fs.readFileSync(f, "utf8"));
const write = (f, x) => fs.writeFileSync(f, JSON.stringify(x, null, 2) + "\n");
const names = ["foundations", "industries", "jurisdictions", "empirical"];
const batches = names.filter(n => fs.existsSync(`data/research/${n}.json`)).map(n => ({name:n, ...read(`data/research/${n}.json`)}));
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const editionPattern = /^(\d{4}-\d{2}-\d{2})\.(\d+)$/;
const numericVersionPattern = /^\d+(?:\.\d+)*$/;
const conflicts = [];
const recordConflict = (target, reason, current, incoming) => conflicts.push({target, reason, current, incoming});
const compareDates = (left, right) => {
  if (left === right) return 0;
  assert.ok(datePattern.test(left) && datePattern.test(right), `Invalid metadata dates for comparison: ${left}, ${right}`);
  return left < right ? -1 : 1;
};
const compareEditions = (left, right) => {
  if (left === right) return 0;
  const leftEdition = editionPattern.exec(left), rightEdition = editionPattern.exec(right);
  if (leftEdition && rightEdition) {
    const dateComparison = leftEdition[1].localeCompare(rightEdition[1]);
    return dateComparison || Number(leftEdition[2]) - Number(rightEdition[2]);
  }
  const leftNumeric = numericVersionPattern.test(left), rightNumeric = numericVersionPattern.test(right);
  if (leftNumeric && rightNumeric) {
    const leftParts = left.split(".").map(Number), rightParts = right.split(".").map(Number);
    for (let i = 0; i < Math.max(leftParts.length, rightParts.length); i++) {
      const comparison = (leftParts[i] || 0) - (rightParts[i] || 0);
      if (comparison) return comparison;
    }
    return 0;
  }
  return null;
};
const preserveNewerDate = (current, incoming, target) => {
  if (!current) return incoming || null;
  if (!incoming) return current;
  const comparison = compareDates(current, incoming);
  if (comparison > 0) {
    recordConflict(target, "incoming-older-preserved-current", current, incoming);
    return current;
  }
  return incoming;
};
const preserveNewerEdition = (current, incoming, target) => {
  if (!current) return incoming || null;
  if (!incoming) return current;
  const comparison = compareEditions(current, incoming);
  if (comparison === null) {
    if (current !== incoming) recordConflict(target, "incomparable-editions-preserved-current", current, incoming);
    return current;
  }
  if (comparison > 0) {
    recordConflict(target, "incoming-older-preserved-current", current, incoming);
    return current;
  }
  return incoming;
};
const newestDate = values => values.filter(Boolean).reduce((latest, value) => !latest || compareDates(latest, value) < 0 ? value : latest, null);
const newestEdition = (values, target) => values.filter(Boolean).reduce((latest, value) => {
  if (!latest) return value;
  const comparison = compareEditions(latest, value);
  assert.notEqual(comparison, null, `Incomparable package editions for ${target}: ${latest}, ${value}`);
  return comparison >= 0 ? latest : value;
}, null);
const arrayIdentity = (path, item) => {
  if (!item || typeof item !== "object" || Array.isArray(item)) return null;
  if (path.endsWith("research_questions") || path.endsWith(".questions")) return item.id || null;
  if (path.endsWith("source_locators")) return item.source_id || null;
  if (path.endsWith("checks")) return `${item.existing_record_id || item.source_id || item.url || item.checked_url || ""}|${item.method || item.check_type || ""}`;
  if (path.endsWith("findings")) return item.claim || null;
  return item.id || item.question_id || null;
};
const isPrimitive = value => value === null || ["string", "number", "boolean"].includes(typeof value);
const samePrimitiveMembers = (left, right) => left.length === right.length && left.every(value => right.includes(value));
const sameValue = (left, right) => Array.isArray(left) && Array.isArray(right)
  ? (left.every(isPrimitive) && right.every(isPrimitive) ? samePrimitiveMembers(left, right) : JSON.stringify(left) === JSON.stringify(right))
  : JSON.stringify(left) === JSON.stringify(right);
const substantiveQuestionFields = ["question", "answer", "scope", "answer_status", "family_ids", "source_ids", "source_locators", "observed_outcomes", "evidence_type", "remaining_gaps"];
const questionDifferences = (current, incoming) => substantiveQuestionFields.filter(field => !sameValue(current[field], incoming[field]));
const mergeQuestionObject = (current, incoming, target) => {
  const differingFields=questionDifferences(current,incoming);
  if (differingFields.length) {
    recordConflict(`${target}:substantive`, "substantive-question-conflict-preserved-current", differingFields, differingFields.map(field => ({field, current:current[field], incoming:incoming[field]})));
    return current;
  }
  return mergeValue(current, incoming, target);
};
const mergePrimitiveArray = (current, incoming, target) => {
  if (JSON.stringify(current) === JSON.stringify(incoming) || samePrimitiveMembers(current, incoming)) return current;
  const incomingRemovesCurrent = current.some(value => !incoming.includes(value));
  if (incomingRemovesCurrent) {
    recordConflict(target, "incoming-primitive-array-removal-preserved-current", current, incoming);
    return current;
  }
  return incoming;
};
const mergeValue = (current, incoming, target) => {
  if (incoming === undefined) return current;
  if (current === undefined) return incoming;
  if (incoming === null) return current;
  if (current === null) return incoming;
  if (Array.isArray(current) && Array.isArray(incoming)) {
    if (current.every(isPrimitive) && incoming.every(isPrimitive)) {
      return mergePrimitiveArray(current, incoming, target);
    }
    const keyed = incoming.length && incoming.every(item => arrayIdentity(target, item)) && current.every(item => arrayIdentity(target, item));
    if (keyed) {
      const currentByKey = new Map(current.map(item => [arrayIdentity(target, item), item]));
      const incomingKeys = new Set(incoming.map(item => arrayIdentity(target, item)));
      const unmatched = current.filter(item => !incomingKeys.has(arrayIdentity(target, item)));
      if (unmatched.length) {
        recordConflict(target, "unmatched-current-array-items-preserved", unmatched.length, incoming.length);
        return current;
      }
      return incoming.map(item => {
        const key = arrayIdentity(target, item), prior = currentByKey.get(key);
        if (!prior) return item;
        return target.endsWith("research_questions") || target.endsWith(".questions")
          ? mergeQuestionObject(prior, item, `${target}[${key}]`)
          : mergeValue(prior, item, `${target}[${key}]`);
      });
    }
    if (JSON.stringify(current) === JSON.stringify(incoming)) return current;
    if (!current.length) return incoming;
    if (!incoming.length) {
      recordConflict(target, "incoming-empty-array-preserved-current", current.length, 0);
      return current;
    }
    recordConflict(target, "unkeyed-current-array-preserved", current.length, incoming.length);
    return current;
  }
  if (typeof current === "object" && typeof incoming === "object" && !Array.isArray(current) && !Array.isArray(incoming)) {
    const merged = {...current};
    for (const [key, value] of Object.entries(incoming)) merged[key] = mergeValue(current[key], value, `${target}.${key}`);
    return merged;
  }
  return incoming;
};
const mappingOwnedFields = ["replace_question_ids", "question_ids", "exclude_question_ids", "industry_codes", "industry_scope", "basis_field", "reason", "reviewed_question_ids", "reviewed_industry_codes", "reviewed_at", "review_note"];
const mergeReviewedMapping = (current, incoming, target) => {
  if (!current || !Object.keys(current).length) return incoming;
  const applyIncoming=() => {
    const merged={...current};
    for (const field of mappingOwnedFields) if (incoming[field] !== undefined) merged[field]=incoming[field];
    return merged;
  };
  const currentDate=current.reviewed_at || null, incomingDate=incoming.reviewed_at || null;
  if (!currentDate) return applyIncoming();
  if (!incomingDate) {
    recordConflict(target, "undated-incoming-reviewed-mapping-preserved-current", currentDate, incomingDate);
    return current;
  }
  const comparison=compareDates(currentDate,incomingDate);
  if (comparison > 0) {
    recordConflict(target, "incoming-older-reviewed-mapping-preserved-current", currentDate, incomingDate);
    return current;
  }
  if (comparison === 0) {
    const differingFields=mappingOwnedFields.filter(field => !sameValue(current[field], incoming[field]));
    if (differingFields.length) {
      recordConflict(target, "same-date-reviewed-mapping-preserved-current", differingFields, differingFields.map(field => ({field, current:current[field], incoming:incoming[field]})));
      return current;
    }
  }
  return applyIncoming();
};
const batchMetadata = new Map(batches.map(batch => {
  const reviewedAt = batch.reviewed_at || newestDate((batch.sources || []).map(source => source.reviewed_at));
  assert.ok(reviewedAt && datePattern.test(reviewedAt), `${batch.name}: package reviewed_at is required and must be YYYY-MM-DD`);
  return [batch.name, {reviewedAt, version:batch.version || batch.question_set_version || null, corpusVersion:batch.corpus_version || null}];
}));
const allBatchDates = [...batchMetadata.values()].map(metadata => metadata.reviewedAt);
const sources = read("data/corpus/source.json"), guides = read("data/corpus/guide.json"), questionRegistry = read("data/coverage/research-questions.json");
const overrides = read("data/coverage/mapping-overrides.json");
const aliases = fs.existsSync("data/research/source-aliases.json") ? read("data/research/source-aliases.json") : {};
const beforeSources = JSON.parse(JSON.stringify(sources));
const beforeGuides = JSON.parse(JSON.stringify(guides));
const beforeOverrides = JSON.parse(JSON.stringify(overrides));
const beforeQuestionRegistry = JSON.parse(JSON.stringify(questionRegistry));
const beforeAliases = JSON.parse(JSON.stringify(aliases));
aliases.src_roadmap_naics2022 = "src_roadmap_naics2022_manual";
aliases.src_roadmap_naics_311 = "src_roadmap_naics2022_manual";
const sourceById = new Map(sources.map(r => [r.id, r]));
const sourcesByURL = new Map();
for (const source of sources.filter(r => r.source_url)) {
  const matches=sourcesByURL.get(source.source_url) || [];
  matches.push(source);
  sourcesByURL.set(source.source_url,matches);
}
for (const [url, matches] of sourcesByURL) assert.equal(matches.length,1,`Ambiguous canonical source URL: ${url}`);
const explicitAliasUrlMismatches = new Set(["src_roadmap_naics2022"]);
const rights = {metadata:"CC0-1.0", content:"CC-BY-4.0", external_content:"External text is not included; source terms and unresolved permissions remain separate.", full_text_stored:false};
const sourceDates = new Map();
const mergeSupplementalReview = (existingReviews, incoming, target) => {
  const matches = existingReviews.filter(review => review.batch === incoming.batch && review.checked_url === incoming.checked_url);
  if (!matches.length) return [...existingReviews, incoming];
  const current = matches.slice().sort((left, right) => (left.reviewed_at || "").localeCompare(right.reviewed_at || "")).at(-1);
  const currentDate = current.reviewed_at || null, incomingDate = incoming.reviewed_at || null;
  const comparison = currentDate && incomingDate ? compareDates(currentDate, incomingDate) : null;
  const chosen = comparison !== null && comparison > 0
    ? mergeValue(incoming, current, `${target}.current`)
    : mergeValue(current, incoming, `${target}.incoming`);
  if (comparison !== null && comparison > 0) {
    recordConflict(target, "incoming-older-supplemental-preserved-current", currentDate, incomingDate);
  }
  if (currentDate && incomingDate && comparison === 0) chosen.reviewed_at = incomingDate;
  const firstMatch = existingReviews.findIndex(review => review.batch === incoming.batch && review.checked_url === incoming.checked_url);
  const remaining = existingReviews.filter(review => review.batch !== incoming.batch || review.checked_url !== incoming.checked_url);
  remaining.splice(firstMatch, 0, chosen);
  return remaining;
};
for (const batch of batches) for (const s of batch.sources || []) {
  assert.ok(s.id && s.title && /^https?:\/\//.test(s.source_url), `Invalid source proposal ${s.id}`);
  const metadata = batchMetadata.get(batch.name);
  const aliasTarget=Object.hasOwn(aliases,s.id) ? aliases[s.id] : null;
  const direct=sourceById.get(s.id);
  const aliased=aliasTarget ? sourceById.get(aliasTarget) : null;
  if (aliasTarget) {
    assert.ok(aliased, `Alias target missing for ${s.id}: ${aliasTarget}`);
    if (aliasTarget !== s.id && !explicitAliasUrlMismatches.has(s.id)) assert.equal(aliased.source_url,s.source_url,`Alias target URL mismatch for ${s.id}: ${aliasTarget}`);
  }
  if (direct) {
    const urlMatches=sourcesByURL.get(s.source_url) || [];
    assert.ok(!urlMatches.length || urlMatches.some(source => source.id === direct.id),`Package ID/URL resolves to a different canonical source for ${s.id}`);
  }
  const existing = aliased || direct || sourcesByURL.get(s.source_url)?.[0];
  const record = existing || {
    id:s.id,kind:"source",title:s.title,summary:s.evidence_summary || s.summary || `Publisher reference for ${s.title}; see the bounded review scope.`,
    topics:["Research foundations"], industries:[],jurisdiction:s.jurisdiction || null,source_type:s.source_type || "Publisher reference",publisher:s.publisher,source_url:s.source_url,
    source_ids:[],related_ids:[],review_status:"inherited-not-reverified",reviewed_at:null,
    provenance:{added_on:metadata.reviewedAt,reviewer:"Codex AI-assisted source research",note:"Original bounded synthesis of the cited public material; not professional review or a licence to external content."},
    rights:{...rights, source_status:s.rights_review?.status || s.rights_status || "unknown",source_license:null,source_license_url:null,source_permission_scope:null},data:{},
  };
  sourceDates.set(record.id, newestDate([sourceDates.get(record.id), metadata.reviewedAt]));
  if (record.id !== s.id || Object.hasOwn(aliases, s.id)) aliases[s.id] = record.id;
  const review = {
    batch:batch.name, reviewed_at:metadata.reviewedAt, review_level:s.review_level || "scope-not-specified",
    ...(s.review_scope ? {review_scope:s.review_scope} : {}),
    checked_url:s.source_url, locator:s.source_locator || s.locator || null,
    publication_or_edition:s.publication_or_edition || null, effective_period:s.effective_period || null,
    evidence_summary:s.evidence_summary || null, limitations:s.limitations || [],
    checks:s.checks || [], rights_review:s.rights_review || {status:s.rights_status || "unknown"},
  };
  record.data.supplemental_reviews = mergeSupplementalReview(record.data.supplemental_reviews || [], review, `source:${record.id}:supplemental_reviews:${batch.name}:${s.source_url}`);
  if (!existing) {record.data.frameworks=s.frameworks || []; sources.push(record);sourceById.set(record.id,record);sourcesByURL.set(record.source_url,[record]);}
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
const guidePackageApplied=new Set();
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
    const existingGuide=guides.find(g=>g.id===id);
    const packageVersion=batchMetadata.get(batch.name).version;
    const version=preserveNewerEdition(existingGuide?.data?.version,packageVersion,`guide:${id}:data.version`);
    const comparison=existingGuide?.data?.version && packageVersion ? compareEditions(existingGuide.data.version,packageVersion) : null;
    const applyPackage=!existingGuide || (Boolean(packageVersion) && (!existingGuide.data?.version || comparison < 0));
    const data={...p,research_package:batch.name,research_questions:qs};
    if (version) data.version=version; else delete data.version;
    delete data.questions;
    data.professional_review="not-performed";data.empirical_support=p.empirical_support || "not-established";
    data.editorial_brief={question:p.title, answer:summary, findings:qs.map(q=>({claim:q.answer,source_ids:[...new Set(q.source_ids || [])],classification:q.answer_status || "scoped-research",qualification:q.scope || p.scope || "Apply only within the question's stated conditions and source access limits."})),unknowns:[...new Set(p.coverage_gaps || p.remaining_limits || ["No family-wide accounting sufficiency or professional review is asserted."])],reading_order:source_ids};
    checkReferences(data,id);
    for (const source of source_ids) assert.ok(sourceById.has(source),`${id}: ${source}`);
    const generatedRecord={id,kind:"guide",title:p.title,summary,topics:["Scoped research",...family_ids.map(id=>familyTitles.get(id))],industries:p.industries || [],jurisdiction:p.jurisdiction || p.jurisdictions?.join("; ") || "Declared separately for each question",source_type:null,publisher:"Accounting Agents contributors",source_url:null,source_ids,related_ids,review_status:"editorially-reviewed",reviewed_at:batchMetadata.get(batch.name).reviewedAt,provenance:{added_on:batchMetadata.get(batch.name).reviewedAt,reviewer:"Codex AI-assisted research, with root source-scope and semantic review",note:"Original research synthesis and clearly labeled original examples. Listed source access and currency limits constrain every answer; no professional sign-off or production validation.",research_file:`data/research/${batch.name}.json`},rights:{...rights},data};
    if (!applyPackage && existingGuide && comparison === 0) {
      const currentQuestions=new Map((existingGuide.data.research_questions || []).map(question => [question.id, question]));
      for (const question of qs) {
        const currentQuestion=currentQuestions.get(question.id);
        if (currentQuestion) mergeQuestionObject(currentQuestion,question,`guide:${id}.data.research_questions[${question.id}]`);
      }
    }
    if (applyPackage) {
      const record=existingGuide ? mergeValue(existingGuide, generatedRecord, `guide:${id}`) : generatedRecord;
      record.reviewed_at=preserveNewerDate(existingGuide?.reviewed_at,batchMetadata.get(batch.name).reviewedAt,`guide:${id}:reviewed_at`);
      record.provenance=mergeValue(existingGuide?.provenance || {}, generatedRecord.provenance, `guide:${id}:provenance`);
      record.provenance.added_on=existingGuide?.provenance?.added_on || batchMetadata.get(batch.name).reviewedAt;
      record.data.version=version;
      const at=guides.findIndex(g=>g.id===id); if(at<0) guides.push(record);else guides[at]=record;
      guidePackageApplied.add(id);
      const previousOverride=overrides.records[id] || {};
      const generatedOverride={replace_question_ids:true,question_ids:family_ids,industry_codes,industry_scope:industry_codes.length?"specific":"shared-context",basis_field:"/data/research_questions",reason:"The explicitly scoped research questions and original synthesis support discovery associations only. Detailed-industry adequacy is separately assessed.",reviewed_question_ids:family_ids,reviewed_industry_codes:industry_codes,reviewed_at:batchMetadata.get(batch.name).reviewedAt,review_note:"Reviewed discovery relationship to the named questions and explicitly declared industry scope; does not confer accounting adequacy or professional verification."};
      overrides.records[id]=mergeReviewedMapping(previousOverride,generatedOverride,`mapping:${id}`);
    }
    known.add(id);
    const canonicalQuestions=guides.find(g=>g.id===id)?.data?.research_questions || qs;
    for(const [index,q] of canonicalQuestions.entries()) questionRows.push({id:q.id,record_id:id,pointer:`/data/research_questions/${index}`,family_ids:q.family_id?[q.family_id]:q.family_ids || family_ids,question:q.question,scope:q.scope || p.scope || summary,answer_status:q.answer_status || "sourced-answer-bounded",assessment_status:q.assessment?.status || "partial",source_ids:[...new Set(q.source_ids || [])],remaining_gaps:q.remaining_gaps || [],professional_review:"not-performed",empirical_support:"not-established"});
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
 if (guidePackageApplied.has(g.id)) q.assessment={...(q.assessment||{}),status:row.assessment_status,dimensions:row.dimensions,basis:row.dimension_basis,professional_review:'not-performed'};
}
// New source associations follow the exact questions citing them, not every family in a package.
for(const s of sources){
 const qs=questionRows.filter(q=>q.source_ids.includes(s.id));if(!qs.length)continue;
 const previous=overrides.records[s.id]||{};
 const incomingDate=sourceDates.get(s.id);
 if (!incomingDate) continue;
 const families=[...new Set([...(previous.question_ids||[]),...qs.flatMap(q=>q.family_ids)])];
 const generatedOverride={replace_question_ids:false,question_ids:families,industry_codes:previous.industry_codes||[],industry_scope:previous.industry_scope||'shared-context',basis_field:'/data',reason:'Exact named research questions cite this source within their separate scope limits; discovery relationship only.',reviewed_question_ids:families,reviewed_industry_codes:previous.reviewed_industry_codes||[],reviewed_at:incomingDate,review_note:'Question-level citation association reviewed; no industry descendant or sufficiency credit.'};
 overrides.records[s.id]=mergeReviewedMapping(previous,generatedOverride,`mapping:${s.id}`);
}
assert.equal(new Set(questionRows.map(q=>q.id)).size,questionRows.length,"Duplicate research-question IDs");
for(const g of guides) for(const id of g.related_ids) assert.ok(known.has(id),`${g.id}: unknown related ${id}`);
for (const [recordId, override] of Object.entries(overrides.records)) {
  const reviewed = [...(override.reviewed_question_ids || []), ...(override.reviewed_industry_codes || [])];
  if (!reviewed.length) continue;
  assert.ok(override.reviewed_at && datePattern.test(override.reviewed_at), `${recordId}: reviewed mapping requires a valid reviewed_at date`);
  assert.ok(override.review_note, `${recordId}: reviewed mapping requires a review_note`);
}
const incomingQuestionSetVersion=newestEdition([...batchMetadata.values()].map(metadata=>metadata.version),"package:question_set_version");
const incomingCorpusVersion=newestEdition([...batchMetadata.values()].map(metadata=>metadata.corpusVersion),"package:corpus_version");
const questionSetVersion=preserveNewerEdition(questionRegistry.question_set_version,incomingQuestionSetVersion,"research-questions:question_set_version");
const corpusVersion=preserveNewerEdition(questionRegistry.corpus_version,incomingCorpusVersion,"research-questions:corpus_version");
const registryComparison=questionRegistry.question_set_version && incomingQuestionSetVersion ? compareEditions(questionRegistry.question_set_version,incomingQuestionSetVersion) : null;
const applyRegistry=!questionRegistry.question_set_version || (Boolean(incomingQuestionSetVersion) && registryComparison < 0);
let registryOutput=questionRegistry;
write("data/corpus/source.json",sources);write("data/corpus/guide.json",guides);write("data/coverage/mapping-overrides.json",overrides);
write("data/research/source-aliases.json",aliases);
if (applyRegistry) {
  const generatedRegistry={schema_version:questionRegistry.schema_version,question_set_version:incomingQuestionSetVersion,corpus_version:incomingCorpusVersion,reviewed_at:newestDate(allBatchDates),scope:questionRegistry.scope,questions:questionRows};
  const registry=mergeValue(questionRegistry,generatedRegistry,"research-questions");
  registry.question_set_version=questionSetVersion;
  registry.corpus_version=corpusVersion;
  registry.reviewed_at=preserveNewerDate(questionRegistry.reviewed_at,newestDate(allBatchDates),"research-questions:reviewed_at");
  registryOutput=registry;
  write("data/coverage/research-questions.json",registryOutput);
}
const changedRecordIds=(before, after) => {
  const allIds=new Set([...before, ...after].map(record=>record.id));
  return [...allIds].filter(id=>JSON.stringify(before.find(record=>record.id===id)) !== JSON.stringify(after.find(record=>record.id===id)));
};
const changedObjectKeys=(before, after) => [...new Set([...Object.keys(before), ...Object.keys(after)])].filter(key=>JSON.stringify(before[key]) !== JSON.stringify(after[key]));
const changes={
  source_records:changedRecordIds(beforeSources,sources),
  guide_records:changedRecordIds(beforeGuides,guides),
  mapping_records:changedRecordIds(Object.entries(beforeOverrides.records || {}).map(([id,value])=>({id,...value})),Object.entries(overrides.records || {}).map(([id,value])=>({id,...value}))),
  registry_rows:changedRecordIds(beforeQuestionRegistry.questions || [],registryOutput.questions || []),
  registry_fields:changedObjectKeys(beforeQuestionRegistry,registryOutput).filter(key=>key!="questions"),
  source_aliases:changedObjectKeys(beforeAliases,aliases),
};
console.log(JSON.stringify({sources:sources.length,guides:guides.length,named_questions:questionRows.length,preserved_newer_metadata:conflicts.length,conflicts,changes},null,2));
