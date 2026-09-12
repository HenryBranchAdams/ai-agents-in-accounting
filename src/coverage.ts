import topologyData from "../data/coverage/topology.json";
import mappingData from "../data/coverage/record-mappings.json";
import assessmentData from "../data/coverage/assessments.json";
import historyData from "../data/coverage/snapshots.json";
import metricData from "../data/coverage/metrics.json";
import type { CorpusRecord } from "./corpus";
import { researchCell, researchSummary, researchView } from './research';

export const coverageTopology = topologyData;
export const coverageMappings = mappingData;
export const coverageAssessments = assessmentData;
// History spans prior schema shapes; avoid a giant inferred union of every snapshot cell.
export const coverageHistory = historyData as unknown as { snapshots: Array<{id:string;recorded_at:string;corpus_version:string;topology_version:string;mapping_version:string;summary:{record_count:number;question_families_with_material:number;question_families:number;scoped_assessments:number}}> };
export const coverageMetrics = metricData;
export type Industry = typeof topologyData.industry_backbone.nodes[number];
export type CoverageMapping = typeof mappingData.mappings[number];
export class CoverageQueryError extends Error {}
export const coverageNotes = {
  associations: "Counts describe proposed content associations, not adequate accounting coverage. A record may appear in several questions or industries; totals use unique record IDs.",
  inheritance: "Broader-industry and shared context remain separate. They do not establish specific coverage for a child industry.",
  denominator: "NAICS-US 2022 describes US economic activities. The question families are editorial proposals. Their cross-product is a screening space, not a list of applicable accounting requirements.",
  assessment: "Assessments apply only to their stated scope. Unassessed does not mean absent or inadequate. Metadata review does not establish professional sign-off or empirical performance.",
};

export function createCoverageIndex(records: CorpusRecord[]) {
  const nodes = topologyData.industry_backbone.nodes;
  const questions = topologyData.question_families;
  const nodeByCode = new Map(nodes.map(node => [node.code, node]));
  const questionById = new Map(questions.map(q => [q.id, q]));
  const recordById = new Map(records.map(r => [r.id, r]));
  const profiles = new Map(mappingData.mappings.map(m => [m.record_id, m]));
  const assessments = assessmentData.assessments;
  const idsByQuestion = new Map(questions.map(q => [q.id, new Set(mappingData.mappings.filter(m => m.question_mappings.some(x => x.question_id === q.id)).map(m => m.record_id))]));
  const direct = new Map(nodes.map(n => [n.code, new Set<string>()]));
  for (const m of mappingData.mappings) for (const association of m.industry_mappings) direct.get(association.industry_code)?.add(m.record_id);
  const descendants = new Map(nodes.map(n => [n.code, new Set(direct.get(n.code))]));
  for (const node of [...nodes].reverse()) if (node.parent_code) for (const id of descendants.get(node.code)!) descendants.get(node.parent_code)!.add(id);
  const ancestors = (code: string) => {
    const result: Industry[] = [];
    let parent = nodeByCode.get(code)?.parent_code;
    while (parent) { const node = nodeByCode.get(parent)!; result.unshift(node); parent = node.parent_code; }
    return result;
  };
  const union = (...sets: Set<string>[]) => new Set(sets.flatMap(s => [...s]));
  const intersectQuestion = (ids: Set<string>, question = "") => question ? new Set([...ids].filter(id => idsByQuestion.get(question)?.has(id))) : ids;
  const broader = (code: string) => union(...ancestors(code).map(n => direct.get(n.code)!));
  const children = (code = "") => nodes.filter(n => n.parent_code === (code || null));
  const sharedIds = new Set(mappingData.mappings.filter(m => m.industry_scope === "shared-context").map(m => m.record_id));
  const applicableAssessments = (code: string, question = "") => assessments.filter(a => a.industry_code === code && (!question || a.question_id === question));
  const cell = (code: string, question: string) => ({
    industry_code: code, question_id: question,
    direct_records: intersectQuestion(direct.get(code)!, question).size,
    narrower_records: intersectQuestion(new Set([...descendants.get(code)!].filter(id => !direct.get(code)!.has(id))), question).size,
    broader_context_records: intersectQuestion(broader(code), question).size,
    shared_context_records: intersectQuestion(sharedIds, question).size,
    assessments: applicableAssessments(code, question).map(a => ({ id: a.id, status: a.status })),
    assessment_status: applicableAssessments(code, question).length ? "scoped-assessment-present" : "unassessed",
    screening: researchCell(code,question),
  });
  const industryStats = (code: string, question = "") => {
    const exact = intersectQuestion(direct.get(code)!, question);
    return {
      ...nodeByCode.get(code)!, direct_records: exact.size,
      narrower_records: intersectQuestion(new Set([...descendants.get(code)!].filter(id => !direct.get(code)!.has(id))), question).size,
      subtree_records: intersectQuestion(descendants.get(code)!, question).size,
      broader_context_records: intersectQuestion(broader(code), question).size,
      question_families_with_material: questions.filter(q => [...exact].some(id => idsByQuestion.get(q.id)!.has(id))).length,
      scoped_assessments: applicableAssessments(code, question).length,
      unassessed_question_families: (question ? [question] : questions.map(q => q.id)).filter(q => !applicableAssessments(code, q).length).length,
    };
  };
  const questionStats = (question: string, industry = "") => ({
    ...questionById.get(question)!,
    associated_records: industry ? intersectQuestion(direct.get(industry)!, question).size : idsByQuestion.get(question)!.size,
    broader_context_records: industry ? intersectQuestion(broader(industry), question).size : 0,
    narrower_records: industry ? cell(industry, question).narrower_records : 0,
    scoped_assessments: assessments.filter(a => a.question_id === question && (!industry || a.industry_code === industry)).length,
    unassessed_industry_scopes: industry ? (applicableAssessments(industry, question).length ? 0 : 1) : nodes.length - new Set(assessments.filter(a => a.question_id === question).map(a => a.industry_code)).size,
  });
  const summary = {
    research: researchSummary,
    record_count: records.length,
    question_mapped_records: mappingData.mappings.filter(m => m.question_mappings.length).length,
    question_unassigned_records: mappingData.mappings.filter(m => !m.question_mappings.length).length,
    industry_mapped_records: mappingData.mappings.filter(m => m.industry_mappings.length).length,
    shared_context_records: sharedIds.size,
    industry_unassigned_records: mappingData.mappings.filter(m => m.industry_scope === "unassigned").length,
    question_families: questions.length,
    question_families_with_material: questions.filter(q => idsByQuestion.get(q.id)!.size).length,
    industry_counts: topologyData.industry_backbone.counts,
    sectors_with_material: nodes.filter(n => n.level === "sector" && descendants.get(n.code)!.size).length,
    subsectors_with_direct_material: nodes.filter(n => n.level === "subsector" && direct.get(n.code)!.size).length,
    detailed_industries_with_direct_material: nodes.filter(n => n.level === "us-industry" && direct.get(n.code)!.size).length,
    scoped_assessments: assessments.length,
    assessment_status_counts: Object.fromEntries(["partial", "sufficient-for-stated-scope", "evidence-gap", "not-applicable"].map(status => [status, assessments.filter(a => a.status === status).length])),
    assessed_industry_question_pairs: new Set(assessments.map(a => `${a.industry_code}:${a.question_id}`)).size,
    subsector_question_screening_pairs: nodes.filter(n => n.level === "subsector").length * questions.length,
    assessed_subsector_question_pairs: new Set(assessments.filter(a => nodeByCode.get(a.industry_code)?.level === "subsector").map(a => `${a.industry_code}:${a.question_id}`)).size,
  };
  const versions = { schema_version: "1.0.0", corpus_version: mappingData.corpus_version, topology_version: topologyData.topology_version, mapping_version: mappingData.mapping_version, assessment_version: assessmentData.assessment_version };
  const analytics = () => ({
    ...versions, notes: coverageNotes, metric_definitions: metricData, summary,
    industries: nodes.map(n => industryStats(n.code)),
    questions: questions.map(q => questionStats(q.id)),
    // Sparse cells: absence means no direct material and no scoped assessment.
    // All nodes and question families are exported separately as denominators.
    cells: nodes.flatMap(n => questions.filter(q => intersectQuestion(direct.get(n.code)!, q.id).size || applicableAssessments(n.code, q.id).length).map(q => cell(n.code, q.id))),
    assessments,
  });
  const select = (params: URLSearchParams) => {
    const allowed = ["industry", "question", "view", "show", "mapping", "page", "limit"];
    for (const key of params.keys()) if (!allowed.includes(key)) throw new CoverageQueryError(`Unknown coverage filter: ${key}.`);
    for (const key of allowed) if (params.getAll(key).length > 1) throw new CoverageQueryError(`Use one ${key} value.`);
    const industry = params.get("industry") || "", question = params.get("question") || "";
    if (industry && !nodeByCode.has(industry)) throw new CoverageQueryError("Unknown industry code. Use a NAICS-US 2022 code from the topology.");
    if (question && !questionById.has(question)) throw new CoverageQueryError("Unknown question family.");
    const view = params.get("view") || "industries", show = params.get("show") || "all", mapping = params.get("mapping") || "all";
    if (!["industries", "questions"].includes(view)) throw new CoverageQueryError("view must be industries or questions.");
    if (!["all", "with-material", "without-material", "unassessed"].includes(show)) throw new CoverageQueryError("Unknown coverage display filter.");
    if (!["all", "question-unassigned", "industry-unassigned", "shared-context"].includes(mapping)) throw new CoverageQueryError("Unknown mapping filter.");
    const integer = (name: string, fallback: number, max: number) => {
      const value = params.get(name);
      if (value === null) return fallback;
      if (!/^[1-9]\d*$/.test(value) || Number(value) > max) throw new CoverageQueryError(`${name} must be an integer from 1 to ${max}.`);
      return Number(value);
    };
    const page = integer("page", 1, 100000), limit = integer("limit", 25, 100);
    const chosen = mappingData.mappings.filter(m =>
      (!industry || m.industry_mappings.some(a => a.industry_code === industry)) &&
      (!question || m.question_mappings.some(a => a.question_id === question)) &&
      (mapping === "all" || (mapping === "question-unassigned" ? !m.question_mappings.length : m.industry_scope === (mapping === "industry-unassigned" ? "unassigned" : "shared-context"))),
    );
    let industryRows = children(industry).map(n => industryStats(n.code, question));
    let questionRows = questions.filter(q => !question || q.id === question).map(q => questionStats(q.id, industry));
    if (show !== "all") {
      industryRows = industryRows.filter(r => show === "with-material" ? r.subtree_records > 0 : show === "without-material" ? !r.subtree_records : r.unassessed_question_families > 0);
      questionRows = questionRows.filter(r => show === "with-material" ? r.associated_records + r.narrower_records > 0 : show === "without-material" ? !r.associated_records && !r.narrower_records : r.unassessed_industry_scopes > 0);
    }
    const resultRecords = chosen.slice((page - 1) * limit, page * limit).map(m => ({ ...recordById.get(m.record_id)!, coverage: m }));
    return {
      ...versions, summary, notes: coverageNotes, metric_definitions: metricData,
      filters: { industry, question, view, show, mapping },
      research: researchView(industry,question),
      selected_industry: industry ? industryStats(industry, question) : null,
      selected_question: question ? questionById.get(question)! : null,
      ancestors: industry ? ancestors(industry) : [],
      industry_rows: industryRows, question_rows: questionRows,
      assessments: assessments.filter(a => (!industry || a.industry_code === industry) && (!question || a.question_id === question)),
      broader_context: industry ? [...intersectQuestion(broader(industry), question)].map(id => ({ id, title: recordById.get(id)!.title, industry_codes: profiles.get(id)!.industry_mappings.map(m => m.industry_code) })) : [],
      total: chosen.length, page, limit, pages: Math.ceil(chosen.length / limit), records: resultRecords,
    };
  };
  return { versions, summary, profiles, nodeByCode, questionById, ancestors, children, cell, industryStats, questionStats, select, analytics };
}
