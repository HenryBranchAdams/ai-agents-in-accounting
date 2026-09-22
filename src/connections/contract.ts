export const graphSchemaVersion = "1.0.0";
export const graphLimits = { defaultNodes: 25, mobileNodes: 12, maxNodes: 80, maxEdges: 160, expansionStep: 10, maxExpansions: 8, maxQueryLength: 4096 } as const;
export const connectionTypes = ["cites", "related", "supports", "qualifies", "contradicts", "supersedes"] as const;
export type ConnectionType = typeof connectionTypes[number];
export interface GraphNode {
  id: string; kind: string; title: string; href: string; summary: string; revision: string;
  scope: string; review_status: string; reviewed_at: string | null; access: string;
  limitations: string[]; rights: Record<string, unknown>;
}
export interface GraphLocator {
  kind: "corpus-pointer" | "publisher-passage" | "finding-locator";
  owner_id: string | null; locator: string; status: "resolved" | "unresolved" | "ambiguous";
  candidate_owners: string[];
}
export interface GraphAssertion {
  origin: "canonical-reference" | "legacy-reference" | "editorial-annotation" | "structured-reference";
  owner_file: string; stored_at: string; reason: string; limitations: string[];
  source_ids: string[]; locators: GraphLocator[];
}
export interface GraphEdge {
  id: string; from: string; to: string; type: ConnectionType;
  direction_meaning: string; assertions: GraphAssertion[];
}
export interface GraphDiagnostic { code: string; owner: string; locator: string; target?: string; message: string }
export interface GraphSnapshot {
  schema_version: string; index_version: string; corpus_version: string;
  nodes: GraphNode[]; edges: GraphEdge[]; diagnostics: GraphDiagnostic[];
  counts: { records: number; canonical_edges: number; assertions: number; self_references: number };
}
