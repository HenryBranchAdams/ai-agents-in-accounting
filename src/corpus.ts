import catalog from "../data/catalog.json";
import sources from "../data/corpus/source.json";
import workflows from "../data/corpus/workflow.json";
import processes from "../data/corpus/process.json";
import controls from "../data/corpus/control.json";
import actions from "../data/corpus/action.json";
import authorities from "../data/corpus/authority.json";
import templates from "../data/corpus/template.json";
import terms from "../data/corpus/term.json";
import designs from "../data/corpus/design.json";
import ecosystems from "../data/corpus/ecosystem.json";
import guides from "../data/corpus/guide.json";
import collections from "../data/corpus/collection.json";
import examples from "../data/corpus/example.json";

export type Json =
  string | number | boolean | null | Json[] | { [key: string]: Json };
export interface CorpusRecord {
  id: string;
  kind: string;
  title: string;
  summary: string;
  topics: string[];
  industries: string[];
  jurisdiction: string | null;
  source_type: string | null;
  publisher: string;
  source_url: string | null;
  source_ids: string[];
  related_ids: string[];
  reviewed_at: string | null;
  review_status: string;
  provenance: { [key: string]: Json };
  rights: { [key: string]: Json };
  data: { [key: string]: Json };
}
export const kinds: Record<string, string> = {
  source: "Sources",
  workflow: "Workflows",
  process: "Accounting processes",
  guide: "Reference guides",
  control: "Control patterns",
  action: "Sensitive actions",
  authority: "Authority levels",
  design: "Agent design references",
  template: "Templates",
  term: "Glossary",
  example: "Synthetic examples",
  ecosystem: "Interoperability",
  collection: "Reading collections",
};
export const records = [
  ...sources,
  ...workflows,
  ...processes,
  ...controls,
  ...actions,
  ...authorities,
  ...templates,
  ...terms,
  ...designs,
  ...ecosystems,
  ...guides,
  ...collections,
  ...examples,
] as unknown as CorpusRecord[];
export const meta = {
  ...catalog,
  record_count: records.length,
  counts: Object.fromEntries(
    Object.keys(kinds).map((kind) => [
      kind,
      records.filter((r) => r.kind === kind).length,
    ]),
  ),
  methods: ["GET", "HEAD", "OPTIONS"],
};
const byId = new Map(records.map((r) => [r.id, r]));
const normalize = (s: string) =>
  s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
const indexed = records.map((r) => ({
  r,
  title: normalize(r.title),
  summary: normalize(r.summary),
  text: normalize(JSON.stringify(r)),
}));
const values = (fn: (r: CorpusRecord) => string[]) =>
  [...new Set(records.flatMap(fn))]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
export const taxonomy = {
  kinds,
  topics: values((r) => r.topics),
  industries: values((r) => r.industries),
  jurisdictions: values((r) => (r.jurisdiction ? [r.jurisdiction] : [])),
  source_types: values((r) => (r.source_type ? [r.source_type] : [])),
};
export function getRecord(id: string) {
  return byId.get(id);
}
export function references(record: CorpusRecord) {
  return record.source_ids.map((id) => byId.get(id)!).filter(Boolean);
}
export function citedBy(record: CorpusRecord) {
  return records.filter(
    (r) =>
      r.source_ids.includes(record.id) || r.related_ids.includes(record.id),
  );
}
export class QueryError extends Error {}
export function search(params: URLSearchParams) {
  const q = (params.get("q") || "").trim();
  if (q.length > 240)
    throw new QueryError("Search must be 240 characters or fewer.");
  const kind = params.get("kind") || "";
  if (kind && kind !== "context" && !Object.hasOwn(kinds, kind))
    throw new QueryError("Unknown record kind.");
  const collectionId = params.get("collection");
  const collection = collectionId ? byId.get(collectionId) : null;
  if (collectionId && collection?.kind !== "collection")
    throw new QueryError("Unknown collection.");
  const number = (key: string, fallback: number, max: number) => {
    const raw = params.get(key);
    if (raw === null) return fallback;
    if (!/^\d+$/.test(raw) || Number(raw) < 1 || Number(raw) > max)
      throw new QueryError(`${key} must be an integer from 1 to ${max}.`);
    return Number(raw);
  };
  const page = number("page", 1, 100000);
  const limit = number("limit", 20, 100);
  const terms = normalize(q).split(/\s+/).filter(Boolean);
  const topic = params.get("topic");
  const industry = params.get("industry");
  const sourceType = params.get("source_type");
  const jurisdiction = params.get("jurisdiction");
  const matches = indexed
    .filter(
      ({ r, text }) =>
        (!kind ||
          (kind === "context"
            ? !["source", "collection"].includes(r.kind)
            : r.kind === kind)) &&
        (!topic || r.topics.includes(topic)) &&
        (!industry || r.industries.includes(industry)) &&
        (!sourceType || r.source_type === sourceType) &&
        (!jurisdiction || r.jurisdiction === jurisdiction) &&
        (!collection || collection.source_ids.includes(r.id)) &&
        terms.every((t) => text.includes(t)),
    )
    .map((item) => ({
      ...item,
      score: terms.reduce(
        (sum, t) =>
          sum +
          (item.title.includes(t) ? 10 : 0) +
          (item.summary.includes(t) ? 3 : 0),
        0,
      ),
    }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.r.title.localeCompare(b.r.title) ||
        a.r.id.localeCompare(b.r.id),
    );
  return {
    corpus_version: meta.corpus_version,
    query: q,
    total: matches.length,
    page,
    limit,
    pages: Math.ceil(matches.length / limit),
    records: matches.slice((page - 1) * limit, page * limit).map((x) => x.r),
  };
}
export function recordMarkdown(r: CorpusRecord): string {
  return `# ${r.title}\n\n${r.summary}\n\n- Record: ${r.id}\n- Kind: ${r.kind}\n- Version: ${meta.corpus_version}\n- Citation: ${meta.site_url}/records/${r.id}\n- Publisher: ${r.publisher}\n- Original source: ${r.source_url || "Project editorial reference"}\n- Review: ${r.review_status}\n\n## Rights\n\n${meta.rights_note}\n\n## Record data\n\n\`\`\`json\n${JSON.stringify(r, null, 2)}\n\`\`\`\n\n## Cited sources\n\n${references(
    r,
  )
    .map((s) => `- [${s.title}](${s.source_url}) (${s.id})`)
    .join("\n")}\n`;
}
export function corpusMarkdown(items: CorpusRecord[] = records): string {
  return `# ${meta.title}\n\nVersion: ${meta.corpus_version}\n\n${meta.mission}\n\n${meta.coverage_note}\n\n${meta.review_note}\n\n${meta.rights_note}\n\n---\n\n${items.map(recordMarkdown).join("\n---\n\n")}`;
}
export function corpusExport(items: CorpusRecord[] = records) {
  return { ...meta, exported_record_count: items.length, records: items };
}
