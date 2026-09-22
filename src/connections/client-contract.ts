import { connectionTypes, type GraphEdge } from './contract';
import { connectionURL, parseConnectionState } from './state';
import type { ConnectionViewDTO } from './view';
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const strings = (value: unknown): value is string[] => Array.isArray(value) && value.every(item => typeof item === 'string');
export function isConnectionEvidence(value: unknown): value is { corpus_version: string; index_version: string; edge: GraphEdge } {
  if (!object(value) || typeof value.corpus_version !== 'string' || typeof value.index_version !== 'string' || !object(value.edge)) return false;
  const edge = value.edge;
  return ['id', 'from', 'to', 'direction_meaning'].every(key => typeof edge[key] === 'string') && connectionTypes.includes(edge.type as typeof connectionTypes[number]) && Array.isArray(edge.assertions) && edge.assertions.every(assertion =>
    object(assertion) && ['origin', 'owner_file', 'stored_at', 'reason'].every(key => typeof assertion[key] === 'string') && strings(assertion.limitations) && strings(assertion.source_ids) && Array.isArray(assertion.locators) && assertion.locators.every(locator =>
      object(locator) && ['corpus-pointer', 'publisher-passage', 'finding-locator'].includes(String(locator.kind)) && ['resolved', 'unresolved', 'ambiguous'].includes(String(locator.status)) && typeof locator.locator === 'string' && (locator.owner_id === null || typeof locator.owner_id === 'string') && strings(locator.candidate_owners)));
}
export function isConnectionView(value: unknown, edition: string, kinds: string[]): value is ConnectionViewDTO {
  if (!object(value) || value.schema_version !== '1.0.0' || value.corpus_version !== edition || typeof value.index_version !== 'string' || !object(value.state) || !Array.isArray(value.nodes) || !Array.isArray(value.edges) || value.nodes.length > 80 || value.edges.length > 160 || !object(value.counts) || !strings(value.warnings) || !Array.isArray(value.hidden_material)) return false;
  try { parseConnectionState(new URL(connectionURL(value.state as unknown as ConnectionViewDTO['state']), 'https://validation.invalid').searchParams, kinds); } catch { return false; }
  if (value.state.corpus !== value.corpus_version || value.state.index !== value.index_version) return false;
  const nodes = value.nodes, counts = value.counts;
  if (!nodes.every(node => object(node) && ['id', 'kind', 'title', 'summary', 'revision', 'scope', 'review_status', 'access'].every(key => typeof node[key] === 'string') && (node.reviewed_at === null || typeof node.reviewed_at === 'string') && strings(node.limitations) && object(node.rights) && node.href === `/records/${encodeURIComponent(String(node.id))}`)) return false;
  const ids = new Set(nodes.map(node => node.id));
  const validEdge = (edge: unknown): boolean => object(edge) && ['id', 'from', 'to'].every(key => typeof edge[key] === 'string') && connectionTypes.includes(edge.type as typeof connectionTypes[number]);
  return ids.has(value.state.focus) && ['visible_records', 'matching_records', 'visible_edges', 'matching_edges', 'considered_edges', 'assertions', 'omitted_by_filter', 'omitted_by_budget', 'snapshot_diagnostics', 'invalid_references_in_snapshot', 'capacity'].every(key => typeof counts[key] === 'number') && ids.size === nodes.length && value.edges.every(edge => validEdge(edge) && ids.has(edge.from) && ids.has(edge.to) && typeof edge.direction_meaning === 'string' && Number.isInteger(edge.assertion_count) && edge.assertion_count >= 0 && edge.evidence_href === `/api/v1/connections/edge?${new URLSearchParams({ id: edge.id, index: value.index_version as string })}`) && value.hidden_material.every(validEdge) && Object.values(counts).every(count => typeof count === 'number' && Number.isFinite(count) && count >= 0);
}
