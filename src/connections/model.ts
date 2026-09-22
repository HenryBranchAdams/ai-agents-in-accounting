import type { CorpusRecord } from "../corpus";
import { connectionTypes, graphSchemaVersion, type ConnectionType, type GraphAssertion, type GraphDiagnostic, type GraphEdge, type GraphLocator, type GraphNode, type GraphSnapshot } from "./contract";
const object = (value: unknown): Record<string, unknown> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const strings = (value: unknown): string[] => Array.isArray(value) ? value.filter((x): x is string => typeof x === "string") : typeof value === "string" ? [value] : [];
const text = (value: unknown, fallback = "Unknown or not recorded") => typeof value === "string" && value.trim() ? value : fallback;
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b, "en")).map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`).join(",")}}`;
  return JSON.stringify(value) ?? "null";
}
async function hash(value: unknown) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonicalJson(value)));
  return [...new Uint8Array(bytes)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}
export function pointerValue(value: unknown, pointer: string): unknown {
  if (!pointer.startsWith("/")) return undefined;
  for (const part of pointer.slice(1).split("/")) {
    const key = part.replaceAll("~1", "/").replaceAll("~0", "~");
    if (!value || typeof value !== "object" || !Object.hasOwn(value, key)) return undefined;
    value = (value as Record<string, unknown>)[key];
  }
  return value;
}
export const edgeIdentity = (from: string, to: string, type: ConnectionType) => `e:${encodeURIComponent(from)}:${type}:${encodeURIComponent(to)}`;
const directionMeaning = (type: ConnectionType) => type === "related" ? "The source record stores this reference; direction does not imply causation or accounting dependency." : type === "cites" ? "The citing record points to a referenced source; citation is not validation or a permission grant." : "Direction is the recorded annotation, limited to its stated reason and scope.";

export async function projectConnections(records: CorpusRecord[], annotations: unknown, edition: string): Promise<GraphSnapshot> {
  const byId = new Map(records.map(record => [record.id, record]));
  if (byId.size !== records.length) throw new Error("Duplicate canonical record IDs in graph input");
  const diagnostics: GraphDiagnostic[] = [], edges = new Map<string, GraphEdge>();
  function add(from: string, to: string, type: ConnectionType, assertion: GraphAssertion, strict = false) {
    if (!byId.has(from) || !byId.has(to)) {
      if (strict) throw new Error(`Invalid explicit graph endpoint: ${from} -> ${to}`);
      diagnostics.push({ code: "dangling-reference", owner: from, locator: assertion.stored_at, target: to, message: "Reference excluded because its canonical endpoint is absent." });return;
    }
    const id = edgeIdentity(from, to, type);
    const edge = edges.get(id) || { id, from, to, type, direction_meaning: directionMeaning(type), assertions: [] };
    if (!edge.assertions.some(item => canonicalJson(item) === canonicalJson(assertion))) edge.assertions.push(assertion);
    edges.set(id, edge);
  }
  for (const record of records) {
    const file = `data/corpus/${record.kind}.json`, owner = record.id;
    const reference = (value: unknown, pointer: string, type: ConnectionType, origin: GraphAssertion["origin"], reason: string, limitations: string[] = [], findingLocator?: string) => {
      const ids = strings(value);
      for (const [index, to] of ids.entries()) {
        const locator = Array.isArray(value) ? `${pointer}/${index}` : pointer;
        const locators: GraphLocator[] = [{ kind: "corpus-pointer", owner_id: owner, locator, status: pointerValue(record, locator) === to ? "resolved" : "unresolved", candidate_owners: [owner] }];
        if (findingLocator) locators.push({ kind: "finding-locator", owner_id: owner, locator: findingLocator, status: "unresolved", candidate_owners: [] });
        add(owner, to, type, { origin, owner_file: file, stored_at: locator, reason, limitations, source_ids: [owner], locators });
      }
    };
    reference(record.source_ids, "/source_ids", "cites", "canonical-reference", "This record lists the target in its source references.");
    reference(record.related_ids, "/related_ids", "related", "canonical-reference", "This record lists the target as a related record.");
    for (const pointer of ["/data/workflow_ids", "/data/relationship_profile/workflow_ids"])
      reference(pointerValue(record, pointer), pointer, "related", "legacy-reference", "A documented legacy workflow field records this navigational reference.");
    for (const pointer of ["/supersedes", "/data/supersedes", "/data/relationship_profile/supersedes"])
      reference(pointerValue(record, pointer), pointer, "supersedes", "canonical-reference", "This field explicitly records supersession; applicability and currentness still depend on scope.");
    for (const group of ["findings", "disagreements"]) {
      const items = pointerValue(record, `/data/editorial_brief/${group}`);
      if (Array.isArray(items)) items.forEach((item, index) => {
        const finding = object(item);
        reference(finding.source_ids, `/data/editorial_brief/${group}/${index}/source_ids`, "cites", "structured-reference", text(finding.claim, "This finding explicitly references the source."), [text(finding.qualification, "Finding qualification not recorded."), "A finding-level locator is not automatically a publisher passage owned by every referenced source."], typeof finding.locator === "string" ? finding.locator : undefined);
      });
    }
    reference(pointerValue(record, "/data/editorial_brief/reading_order"), "/data/editorial_brief/reading_order", "related", "structured-reference", "The brief suggests this record in its reading order; this is navigation, not evidentiary support.");
    reference(pointerValue(record, "/data/editorial_brief/reading/example/record_id"), "/data/editorial_brief/reading/example/record_id", "related", "structured-reference", "The brief links its worked example; synthetic material does not establish observed effectiveness.");
    reference(pointerValue(record, "/data/worked_record_id"), "/data/worked_record_id", "related", "structured-reference", "This record links a worked reference; the link does not establish professional validation.");
    const notes = pointerValue(record, "/data/editorial_brief/reading_notes");
    if (Array.isArray(notes)) notes.forEach((note, index) => reference(object(note).record_id, `/data/editorial_brief/reading_notes/${index}/record_id`, "related", "structured-reference", text(object(note).reason, "Suggested reading reference.")));
  }
  const explicit = object(annotations).edges;
  if (!Array.isArray(explicit)) throw new Error("Graph annotations require an edges array");
  explicit.forEach((value, index) => {
    const edge = object(value), provenance = object(edge.provenance), type = edge.type as ConnectionType;
    if (typeof edge.from !== "string" || typeof edge.to !== "string" || !connectionTypes.includes(type) || typeof provenance.reason !== "string") throw new Error(`Malformed graph annotation at edges/${index}`);
    const owners = strings(provenance.source_ids), pointers = strings(provenance.pointers);
    const locators: GraphLocator[] = pointers.map(locator => {
      const resolved = owners.filter(owner => byId.has(owner) && pointerValue(byId.get(owner), locator) !== undefined);
      const status = resolved.length === 1 ? "resolved" : resolved.length ? "ambiguous" : "unresolved";
      if (status !== "resolved") diagnostics.push({code: `${status}-locator`,owner: `data/relationships.json#/edges/${index}`,locator,message: "Original annotation retained; source_ids and pointers are not mechanically paired."});
      return { kind: "corpus-pointer", owner_id: resolved.length === 1 ? resolved[0] : null, locator, status, candidate_owners: owners };
    });
    add(edge.from, edge.to, type, {origin:"editorial-annotation",owner_file:"data/relationships.json",stored_at:`/edges/${index}`,reason:provenance.reason,limitations:[...strings(provenance.limitations),"The recorded reason defines this annotation's scope; it does not validate the target as a whole."],source_ids:owners,locators}, true);
  });
  const nodes: GraphNode[] = await Promise.all([...records].sort((a,b)=>a.id.localeCompare(b.id,"en")).map(async record => {
    const data = object(record.data), review = object(data.source_review);
    return { id:record.id,kind:record.kind,title:record.title,href:`/records/${encodeURIComponent(record.id)}`,summary:record.summary,revision:await hash(record),scope:text(data.scope || object(data.editorial_brief).scope || record.jurisdiction),review_status:record.review_status,reviewed_at:record.reviewed_at,access:text(data.access || data.access_note),limitations:[...new Set([...strings(data.limitations),...strings(review.limitations)])],rights:record.rights };
  }));
  const sortedEdges=[...edges.values()].sort((a,b)=>a.id.localeCompare(b.id,"en"));
  for(const edge of sortedEdges)edge.assertions.sort((a,b)=>canonicalJson(a).localeCompare(canonicalJson(b),"en"));
  diagnostics.sort((a,b)=>canonicalJson(a).localeCompare(canonicalJson(b),"en"));
  const inputs={schema_version:graphSchemaVersion,corpus_version:edition,nodes,edges:sortedEdges,diagnostics};
  return {...inputs,index_version:await hash(inputs),counts:{records:nodes.length,canonical_edges:sortedEdges.length,assertions:sortedEdges.reduce((n,e)=>n+e.assertions.length,0),self_references:sortedEdges.filter(e=>e.from===e.to).length}};
}
