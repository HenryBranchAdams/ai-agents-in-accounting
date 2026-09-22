import { getRecord, type CorpusRecord, type Json } from "../corpus";

// A read-only projection of canonical data. No browser island or second index.
type ObjectValue = Record<string, Json>;
const object = (value: Json | undefined): ObjectValue =>
  value && typeof value === "object" && !Array.isArray(value) ? value : {};
const array = (value: Json | undefined): Json[] => Array.isArray(value) ? value : [];
const text = (value: Json | undefined): string => typeof value === "string" ? value : "";
const href = (value: Json | undefined): string | undefined => {
  try {
    const url = new URL(text(value));
    return ["https:", "http:"].includes(url.protocol) ? url.href : undefined;
  } catch { return undefined; }
};
function RecordLink({ id }: { id: Json | undefined }) {
  const record = getRecord(text(id));
  return record ? <a href={`/records/${record.id}`}>{record.title}</a> : <span>Reference unavailable</span>;
}
function Sources({ values }: { values: Json[] }) {
  return <ol>{values.map((value, i) => {
    const row = object(value), note = object(row.annotation || value);
    const verification = object(note.verification);
    return <li key={`${text(note.record_id)}-${i}`}>
      <p><strong>{text(row.role) || text(note.publisher)}</strong>{" "}<RecordLink id={note.record_id} /></p>
      <p>{text(note.why_use)}</p>
      <p><strong>Start at:</strong>{" "}{text(note.start_at)}</p>
      <p><strong>Scope limit:</strong>{" "}{text(note.scope_limit)}</p>
      <p><a href={href(note.url)} rel="noreferrer">Open the discovery source</a></p>
      <details><summary>Edition, access and discovery provenance</summary>
        <p>{text(note.edition_observed)}</p><p>{text(note.access)}</p>
        <p>{text(verification.extent)}</p>
        <p>Discovery date: {text(verification.checked_on) || "Not recorded"}. Integration does not reverify the publisher.</p>
        <p>Navigation hints are not verified claim-level locators. External full text is not stored; publisher reuse permission remains unestablished.</p>
        {href(note.url) !== getRecord(text(note.record_id))?.source_url ? <p>The discovery URL differs from the preserved canonical source URL. Check the document and edition before use.</p> : null}
      </details>
    </li>;
  })}</ol>;
}
export function FamilyOfficeReference({ record }: { record: CorpusRecord }) {
  const value = object(record.data.family_office_reference);
  const annotation = record.data.discovery_annotation;
  if (!value.type && !annotation) return null;
  if (annotation) return <section id="source-discovery"><h2>When to use this source</h2><Sources values={[annotation]} /></section>;
  if (value.type === "index") {
    const topics = array(value.topics).map(object);
    const parts = [...new Set(topics.map(row => text(row.part)))];
    return <section id="family-office-reference">
      <h2>Find guidance for your question</h2>
      <p>Choose the entity, reporting purpose, jurisdiction and period first. These reading paths organize guidance; they do not establish an accounting conclusion.</p>
      {parts.map(part => <section key={part}><h3>{part}</h3><dl>{topics.filter(row => row.part === part).map(row => <div key={text(row.record_id)}><dt><RecordLink id={row.record_id} /></dt><dd>{text(row.question)}</dd></div>)}</dl></section>)}
      <h3>Gather the facts before applying guidance</h3><ul>{array(value.context_ids).map(id => <li key={text(id)}><RecordLink id={id} /></li>)}</ul>
      <p><RecordLink id={value.gaps_id} /></p><p><RecordLink id={value.asc_map_id} /></p>
      <details><summary>All 112 source-discovery annotations</summary><Sources values={array(value.source_annotations)} /></details>
    </section>;
  }
  if (value.type === "topic") return <section id="family-office-reference">
    <p><RecordLink id={value.parent_id} /></p>
    <h2>{text(value.framing_question)}</h2><p><strong>Important boundary:</strong>{" "}{text(value.boundary)}</p>
    <h3>Research questions</h3><p>These are unanswered research prompts, not supported findings.</p>
    <ul>{array(value.questions).map(q => <li key={text(object(q).id)}>{text(object(q).question)}</li>)}</ul>
    <h3>Reading path</h3><p>Reading order is editorial navigation, not a ranking of authority.</p><Sources values={array(value.reading_path)} />
    <h3>Context to collect privately</h3><ul>{array(value.context_ids).map(id => <li key={text(id)}><RecordLink id={id} /></li>)}{array(value.additional_context).map(item => <li key={text(item)}>{text(item)}</li>)}</ul>
    <h3>Existing corpus context</h3><ul>{array(value.corpus_reuse).map(row => <li key={text(object(row).record_id)}><RecordLink id={object(row).record_id} /></li>)}</ul>
  </section>;
  if (value.type === "context") {
    const checklist = object(value.checklist);
    return <section id="family-office-reference"><h2>Context to collect</h2><p>{text(checklist.status)}</p><ul>{array(checklist.required_context).map(item => <li key={text(item)}>{text(item)}</li>)}</ul><h3>Privacy boundary</h3><p>{text(checklist.privacy_boundary)}</p></section>;
  }
  if (value.type === "gaps") return <section id="family-office-reference"><h2>Remaining evidence and access work</h2><p>{text(value.integration_note)}</p>{array(value.gaps).map(gap => {
    const row = object(gap);
    return <section key={text(row.id)}><h3>{text(row.id)}. {text(row.title)}</h3><p>{text(row.status)}</p><p>{text(row.missing_evidence_or_context)}</p><p>{text(row.why_it_matters)}</p><p><strong>Next research action:</strong>{" "}{text(row.next_research_action)}</p><p>{text(row.completion_test)}</p></section>;
  })}</section>;
  if (value.type === "asc") {
    const lookup = object(value.lookup);
    return <section id="family-office-reference"><h2>Locate the relevant accounting topic</h2><p>{text(lookup.status)}</p><ol>{array(lookup.lookup_sequence).map(item => <li key={text(item)}>{text(item)}</li>)}</ol><dl>{array(lookup.routes).map(item => {
      const row = object(item);
      return <div key={text(row.topic)}><dt>ASC {text(row.topic)}: {text(row.title)}</dt><dd>{text(row.question_area)}. {text(row.locator_precision)}</dd></div>;
    })}</dl></section>;
  }
  return null;
}
