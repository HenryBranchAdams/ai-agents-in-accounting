import { editedBrief } from "./editorial";
import { knowledge, references, type CorpusRecord } from "./corpus";
export interface RecordSection { id: string; title: string; secondary?: boolean }
export function constructionSectionLinks(r: CorpusRecord): [string, string][] {
  const sections: [string, string][] = r.id === "example-construction-contract-ledger"
    ? [["journals", "Base journals"], ["examples", "Calculations and branches"], ["same_job_case", "Same-job evidence"], ["transaction_evidence", "Corrections and completeness"], ["observed_evidence", "Aggregate evidence"]]
    : r.id === "guide-construction-connected-close"
      ? [["local_completion", "Local completion"], ["four_gap_ledger", "Four-gap outcomes"], ["authority_matrix", "Authority questions"], ["professional_review_packet", "Review packet"], ["evidence_closure", "Earlier gap outcomes"], ["public_evidence_intake", "Public evidence intake"]]
      : r.id === "guide-construction-tax-transitions" ? [["conflict_resolution", "Source disagreements"], ["method_change_path", "Method-change scope"]] : [];
  return sections.filter(([id]) => r.data[id] !== undefined);
}
export function recordSectionLinks(r: CorpusRecord): RecordSection[] {
  const brief = r.data.editorial_brief, edited = editedBrief(brief);
  const questions = Array.isArray(r.data.research_questions) && r.data.research_questions.length > 0;
  const primary: [string, string][] = [];
  if (edited) primary.push(["answer", "Answer"], ["worked-explanation", "Explanation"], ["worked-example", "Worked example"], ["responsibility", "Who does what"], ["exception", "When the answer changes"], ["findings", "Evidence"], ["qualifications", "Qualifications"], ["unknowns", "Unknowns"], ["suggested-reading", "Suggested reading"]);
  if (r.kind === "source") primary.push(["evidence", "Findings"], ["applicability", "Applicability"], ["limitations", "Limitations"]);
  if (questions) primary.push(["research-questions", "Research questions"]);
  else if (brief && !edited) primary.push(["answer", "Answer in context"], ["findings", "Findings"], ["qualifications", "Qualifications"], ["unknowns", "Unknowns"], ["suggested-reading", "Suggested reading"]);
  const secondary: [string, string][] = [["record-content", "Reference details"], ...constructionSectionLinks(r).map(([id, title]): [string, string] => ["detail-" + id, title])];
  if (references(r).length && r.kind !== "collection") secondary.push(["sources", "Cited sources"]);
  if (knowledge.relations(r.id).some(edge => !["cites", "cited_by"].includes(edge.type))) secondary.push(["relationships", "Relationships"]);
  secondary.push(["coverage", "Coverage mapping"], ["citation", "Citation"], ["record-information", "Record information"], ["rights", "Rights and provenance"]);
  return [...primary.map(([id, title]) => ({ id, title })), ...secondary.map(([id, title]) => ({ id, title, secondary: true }))];
}
