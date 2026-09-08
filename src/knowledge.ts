import vocabulary from "../data/vocabulary.json";
import relationshipData from "../data/relationships.json";

export type KnowledgeRecord = {
  id: string; kind: string; title: string; summary?: string;
  jurisdiction?: string | null; source_url?: string | null;
  source_ids?: string[]; related_ids?: string[]; review_status?: string;
  reviewed_at?: string | null; rights?: Record<string, unknown>;
  publisher?: string; topics?: string[]; industries?: string[];
  data?: Record<string, any>; [key: string]: any;
};
export type Basis = { pointers: string[]; status: "recorded" | "inferred" | "unknown" };
export type Profile = { scope: {
  jurisdictions: string[]; frameworks: string[]; entities: string[]; products: string[];
  period: { published_at: string | null; effective_from: string | null; effective_to: string | null; effective_note: string | null };
  basis: Record<string, Basis>;
}; evidence: {
  claims: { text: string; classification: string; source_ids: string[]; source_url: string | null; source_pointers: string[] }[];
  limitations: string[]; review: Record<string, unknown>; rights: Record<string, unknown>;
} };
export type RelationType = "cites" | "cited_by" | "supports" | "qualifies" | "contradicts" | "supersedes" | "related";
export type Relation = { from: string; to: string; type: RelationType; provenance: { source_ids: string[]; pointers: string[]; reason: string } };

const pointer = (path: string) => `/${path.split(".").map((x) => x.replace(/~/g, "~0").replace(/\//g, "~1")).join("/")}`;
const text = (v: unknown) => typeof v === "string" ? v.trim() : "";
const array = (v: unknown) => typeof v === "string" ? (v.trim() ? [v.trim()] : []) : Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim().length > 0) : [];
const norm = (v: string) => v.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const alias = (v: string) => (vocabulary.aliases as Record<string,string>)[norm(v)] || v;
const jurisdiction = (v: string) => (vocabulary.jurisdictions as Record<string,string>)[norm(v)] || v;
const raw = (r: KnowledgeRecord): Record<string, any> => ({ ...(r.data || {}), record_jurisdiction: r.jurisdiction || null });
const pick = (r: KnowledgeRecord, keys: string[]) => keys.flatMap((key) => array(raw(r)[key]));
const countryNames = ["United States", "United Kingdom", "Canada", "Australia", "New Zealand", "Germany", "France", "Austria", "Japan", "India", "Singapore", "European Union", "Global"];
const frameworkLabels = ["US GAAP", "IFRS", "IPSAS", "GASB", "FASAB", "Austrian GAAP"];
const entityLabels = [
  ["bank", "Banking"], ["insurance", "Insurance"], ["insurer", "Insurance"],
  ["public[- ]sector|government", "Public sector"], ["nonprofit|not[- ]for[- ]profit", "Nonprofit"],
  ["public compan(y|ies)|listed compan(y|ies)", "Public company"], ["service provider|software provider", "Service provider"],
  ["healthcare|health care", "Healthcare"],
] as const;
function basis(pointers: string[], status: Basis["status"] = "recorded"): Basis { return { pointers: [...new Set(pointers)], status }; }
function dateFrom(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const m = v.match(/\b(\d{4})[-/.](\d{1,2})(?:[-/.](\d{1,2}))?\b/);
  return m ? `${m[1]}-${m[2].padStart(2,"0")}${m[3] ? `-${m[3].padStart(2,"0")}` : ""}` : null;
}
export function normalizeTerm(value: string) { return alias(value); }
export function normalizeJurisdiction(value: string) { return jurisdiction(value); }
export function expandIndexedText(value: string): string {
  const source = norm(value);
  const has = (term: string) => new RegExp(`(^|\\s|[^a-z0-9])${term.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}(?=$|\\s|[^a-z0-9])`, "i").test(source);
  return source + " " + Object.entries(vocabulary.aliases as Record<string, string>)
    .filter(([from]) => has(norm(from)))
    .map(([, to]) => norm(to)).join(" ");
}
export function expandQuery(q: string): string[] {
  if ((q.match(/"/g) || []).length % 2) throw new Error("Close every quoted phrase.");
  const whole = norm(q), aliases = Object.entries(vocabulary.aliases as Record<string,string>)
    .map(([from, to]) => [norm(from), norm(to)] as const).sort((a, b) => b[0].split(/\s+/).length - a[0].split(/\s+/).length);
  if (!whole.includes('"')) {
    const words = whole.split(/\s+/).filter(Boolean), out: string[] = [];
    for (let i = 0; i < words.length;) {
      const hit = aliases.find(([from]) => from.split(/\s+/).every((word, j) => words[i + j] === word));
      if (hit) { out.push(...hit[1].split(/\s+/)); i += hit[0].split(/\s+/).length; } else { out.push(words[i++]); }
    }
    return out;
  }
  return [...q.matchAll(/"([^"]+)"|([^\s"]+)/g)].map((m) => norm(m[1] || m[2])).filter(Boolean);
}
export function createKnowledgeIndex(records: KnowledgeRecord[]) {
  const byId = new Map(records.map((r) => [r.id, r]));
  const profiles = new Map<string, Profile>();
  for (const r of records) {
    const d = raw(r), c = d.curation && typeof d.curation === "object" ? d.curation : {};
    const rawScope = text(r.jurisdiction);
    const country = countryNames.find((name) => new RegExp(`\\b${name.replace(/ /g, "\\s+")}\\b`, "i").test(rawScope));
    const productScope = /\b(xero|sap|oracle|netsuite|quickbooks|api|cloud|release\s+\d)/i.test(rawScope);
    const jurisdictionParts = rawScope.split(";").map((x) => x.trim()).filter(Boolean);
    const jurisdictions = productScope || !country ? [] : [jurisdiction(country)];
    const inferredFrameworks = jurisdictionParts.slice(1).filter((x) => /gaap|ifrs|us gaap/i.test(x));
    const scopeText = [rawScope, r.title, text(c.applicability_note), ...array(c.applicability)].join(" ");
    const detectedFrameworks = frameworkLabels.filter((label) => new RegExp(`\\b${label.replace(" ", "\\s+")}\\b`, "i").test(scopeText));
    const explicitFrameworks = pick(r, ["framework", "frameworks", "accounting_framework"]).filter((value) => frameworkLabels.some((label) => norm(value) === norm(label)));
    const inferredFrameworkLabels = inferredFrameworks.flatMap((value) => frameworkLabels.filter((label) => new RegExp(`\\b${label.replace(" ", "\\s+")}\\b`, "i").test(value)));
    const frameworks = [...new Set([...explicitFrameworks, ...inferredFrameworkLabels, ...detectedFrameworks].map(alias))];
    const entityText = [rawScope, text(c.applicability_note), ...array(c.applicability)].join(" ");
    const detectedEntities = entityLabels.filter(([pattern]) => new RegExp(`\\b(?:${pattern})\\b`, "i").test(entityText)).map(([, label]) => label);
    const explicitEntities = pick(r, ["entity", "entities", "entity_scope"]).filter((value) => entityLabels.some(([, label]) => norm(value) === norm(label)));
    const entities = [...new Set([...explicitEntities, ...detectedEntities])];
    const productMatch = /xero/i.test(rawScope) ? "Xero" : /sap/i.test(rawScope) ? "SAP" : /oracle/i.test(rawScope) ? "Oracle" : /netsuite/i.test(rawScope) ? "NetSuite" : /quickbooks/i.test(rawScope) ? "QuickBooks" : undefined;
    const products = [...new Set([...pick(r, ["product", "products", "systems", "software"]), ...(productScope && productMatch ? [productMatch] : [])])].map((x) => x.slice(0, 160));
    const published = dateFrom(d.publication?.published_at || d.publication?.date || d.publication_date || d.published_at || d.published_or_status);
    const effective = dateFrom(d.effective_date || d.effective_from || c.effective_date);
    const profile: Profile = {
      scope: { jurisdictions, frameworks, entities, products,
        period: { published_at: published, effective_from: effective, effective_to: dateFrom(d.effective_to), effective_note: text(d.effective_note || d.effective_reporting_period || d.published_or_status) || null },
        basis: { jurisdictions: basis(jurisdictions.length ? ["/jurisdiction"] : [], jurisdictions.length ? "recorded" : "unknown"), frameworks: basis(frameworks.length ? (explicitFrameworks.length ? ["framework", "frameworks", "accounting_framework"].filter(k => d[k]).map(k => `/data/${k}`) : detectedFrameworks.length ? ["/title", ...(r.jurisdiction ? ["/jurisdiction"] : []), ...(c.applicability_note ? ["/data/curation/applicability_note"] : []), ...(c.applicability ? ["/data/curation/applicability"] : [])] : []) : [], frameworks.length ? (explicitFrameworks.length ? "recorded" : "inferred") : "unknown"), entities: basis(entities.length ? (explicitEntities.length ? ["entity", "entities", "entity_scope"].filter(k => d[k]).map(k => `/data/${k}`) : c.applicability_note ? ["/data/curation/applicability_note"] : c.applicability?.length ? ["/data/curation/applicability"] : ["/jurisdiction"]) : [], entities.length ? (explicitEntities.length ? "recorded" : "inferred") : "unknown"), products: basis(products.length ? (productScope ? ["/jurisdiction"] : d.product ? ["/data/product"] : d.products ? ["/data/products"] : d.systems ? ["/data/systems"] : d.software ? ["/data/software"] : []) : [], products.length ? (productScope ? "inferred" : "recorded") : "unknown"), period: basis([d.publication ? "/data/publication" : "", d.effective_date ? "/data/effective_date" : "", d.effective_reporting_period ? "/data/effective_reporting_period" : "", d.published_or_status ? "/data/published_or_status" : ""].filter(Boolean), published || effective || d.effective_reporting_period || d.published_or_status ? "recorded" : "unknown") }
      },
      evidence: { claims: [{ text: r.summary || r.title, classification: r.kind === "source" ? "record-summary" : "editorial-description", source_ids: [r.id], source_url: r.source_url || null, source_pointers: ["/summary"] }, ...((Array.isArray(d.evidence) ? d.evidence : []).flatMap((e: any, i: number) => e && typeof e === "object" && text(e.claim) ? [{ text: text(e.claim), classification: text(e.classification) || "recorded-claim", source_ids: [r.id], source_url: text(e.source?.url) || r.source_url || null, source_pointers: [`/data/evidence/${i}/claim`] }] : [])), ...((Array.isArray(d.relationship_profile?.claims) ? d.relationship_profile.claims : []).flatMap((e: any, i: number) => e && typeof e === "object" && text(e.text) ? [{ text: text(e.text), classification: text(e.evidence_classification) || "recorded-claim", source_ids: [r.id], source_url: r.source_url || null, source_pointers: [`/data/relationship_profile/claims/${i}/text`] }] : []))], limitations: [...array(d.limitations), ...array(d.relationship_profile?.limitations), ...array(c.limitations)], review: { status: r.review_status || "unknown", date: r.reviewed_at || null, scope: text(r.provenance?.scope || r.provenance?.review_scope || r.provenance?.note) || "unknown", outcome: text(r.provenance?.outcome) || null }, rights: r.rights || {} }
    };
    profiles.set(r.id, profile);
  }
  const relations = (id: string, options: { direction?: "out" | "in" | "both"; types?: RelationType[] } = {}): Relation[] => {
    const direction = options.direction || "both", allowed = options.types;
    const out: Relation[] = [];
    for (const r of records) {
      const add = (to: string, type: RelationType, pointers: string[], reason: string) => { if (!byId.has(to) || (allowed && !allowed.includes(type))) return; out.push({ from: r.id, to, type, provenance: { source_ids: [r.id], pointers, reason } }); };
      if (r.id === id && (direction === "out" || direction === "both") && r.source_ids) for (const to of r.source_ids) add(to, "cites", ["/source_ids"], "canonical source_ids reference");
      if (r.id === id && (direction === "out" || direction === "both") && r.related_ids) for (const to of r.related_ids) add(to, "related", ["/related_ids"], "canonical related_ids reference");
      if (r.id === id && (direction === "out" || direction === "both")) {
        const workflowIds = array((r.data || {}).workflow_ids), legacyWorkflowIds = array(r.data?.relationship_profile?.workflow_ids), supersedes = array(r.data?.supersedes || r.data?.relationship_profile?.supersedes || r.supersedes);
        for (const to of legacyWorkflowIds) add(to, "related", ["/data/relationship_profile/workflow_ids"], "legacy source-to-workflow reference");
        for (const to of workflowIds) add(to, "related", ["/data/workflow_ids"], "legacy workflow_ids reference");
        for (const to of supersedes) add(to, "supersedes", [r.data?.supersedes ? "/data/supersedes" : r.data?.relationship_profile?.supersedes ? "/data/relationship_profile/supersedes" : "/supersedes"], "explicit supersedes reference");
      }
      if ((direction === "in" || direction === "both") && array(r.data?.relationship_profile?.workflow_ids).includes(id)) add(id, "related", ["/data/relationship_profile/workflow_ids"], "reverse legacy source-to-workflow reference");
      if ((direction === "in" || direction === "both") && (r.source_ids?.includes(id) || r.related_ids?.includes(id))) {
        const type: RelationType = r.source_ids?.includes(id) ? "cited_by" : "related";
        add(id, type, [r.source_ids?.includes(id) ? "/source_ids" : "/related_ids"], "reverse canonical reference");
      }
    }
    for (const e of (relationshipData as any).edges || []) if ((direction !== "in" && e.from === id) || (direction !== "out" && e.to === id)) if ((!allowed || allowed.includes(e.type)) && byId.has(e.from) && byId.has(e.to)) out.push(e);
    return out.filter((e, i, a) => a.findIndex((x) => x.from === e.from && x.to === e.to && x.type === e.type) === i);
  };
  return { profiles, byId, profile: (id: string) => profiles.get(id), relations };
}
