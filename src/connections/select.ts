import { graphLimits, type GraphEdge, type GraphSnapshot } from './contract';
import type { ConnectionState } from './state';

const priority = { contradicts: 0, qualifies: 1, supersedes: 2, supports: 3, related: 4, cites: 5 };
const compareEdges = (a: GraphEdge, b: GraphEdge) => priority[a.type] - priority[b.type] || a.id.localeCompare(b.id, 'en');
export class ConnectionSnapshotError extends Error {}

/** Build once for an immutable snapshot; callers cannot mutate the private adjacency maps. */
export function createConnectionIndex(snapshot: GraphSnapshot) {
  const nodes = new Map(snapshot.nodes.map(node => [node.id, node]));
  const edgesById = new Map(snapshot.edges.map(edge => [edge.id, edge]));
  const incoming = new Map<string, GraphEdge[]>();
  const outgoing = new Map<string, GraphEdge[]>();
  for (const edge of snapshot.edges) {
    if (!nodes.has(edge.from) || !nodes.has(edge.to)) throw new Error('Graph edge has a missing endpoint');
    for (const [map, id] of [[outgoing, edge.from], [incoming, edge.to]] as const) {
      const bucket = map.get(id) ?? [];
      bucket.push(edge); map.set(id, bucket);
    }
  }
  for (const map of [incoming, outgoing]) for (const bucket of map.values()) bucket.sort(compareEdges);
  const neighborhood = (id: string, direction: ConnectionState['direction']) => {
    if (direction === 'in') return incoming.get(id) ?? [];
    if (direction === 'out') return outgoing.get(id) ?? [];
    return [...new Map([...(incoming.get(id) ?? []), ...(outgoing.get(id) ?? [])].map(edge => [edge.id, edge])).values()].sort(compareEdges);
  };
  return {
    node: (id: string) => nodes.get(id),
    edge: (id: string) => edgesById.get(id),
    select(state: ConnectionState) {
      if ((state.corpus && state.corpus !== snapshot.corpus_version) || (state.index && state.index !== snapshot.index_version)) {
        throw new ConnectionSnapshotError('This connection URL describes another corpus snapshot. Reload against the current edition.');
      }
      const warnings: string[] = [];
      const visible = new Set<string>();
      const considered = new Map<string, GraphEdge>();
      const owners = new Map<string, Set<string>>();
      const allowedTypes = new Set(state.types), allowedKinds = new Set(state.kinds);
      const accepted = (edge: GraphEdge) => allowedTypes.has(edge.type) && [edge.from, edge.to].every(id => id === state.focus || allowedKinds.has(nodes.get(id)!.kind));
      const include = (id: string, owner: string) => {
        visible.add(id);
        const set = owners.get(id) ?? new Set<string>(); set.add(owner); owners.set(id, set);
      };
      const visit = (id: string, capacity: number) => {
        for (const edge of neighborhood(id, state.direction)) {
          considered.set(edge.id, edge);
          if (!accepted(edge)) continue;
          const missing = [...new Set([edge.from, edge.to])].filter(endpoint => !visible.has(endpoint));
          if (visible.size + missing.length > capacity) continue;
          include(edge.from, id); include(edge.to, id);
        }
      };
      let capacity = state.budget;
      if (state.focus) {
        if (!nodes.has(state.focus)) throw new ConnectionSnapshotError('Unknown focus record');
        include(state.focus, state.focus);
        visit(state.focus, capacity);
        for (const expansion of state.expanded) {
          if (!visible.has(expansion.id)) {
            warnings.push(`Expansion omitted because its record is outside the current neighborhood: ${expansion.id}`);
            continue;
          }
          capacity = Math.min(graphLimits.maxNodes, capacity + expansion.steps * graphLimits.expansionStep);
          visit(expansion.id, capacity);
        }
      }
      const candidates = [...considered.values()].sort(compareEdges);
      const matching = candidates.filter(accepted);
      const eligible = matching.filter(edge => visible.has(edge.from) && visible.has(edge.to));
      const edges = eligible.slice(0, graphLimits.maxEdges);
      const visibleEdges = new Set(edges.map(edge => edge.id));
      // Nodes without a visible edge remain visible only when explicitly retained as focus or expansion context.
      const context = new Set([state.focus, ...state.expanded.map(item => item.id)]);
      const endpoints = new Set(edges.flatMap(edge => [edge.from, edge.to]));
      for (const id of visible) if (!context.has(id) && !endpoints.has(id)) visible.delete(id);
      const omitted = candidates.filter(edge => !visibleEdges.has(edge.id));
      const material = omitted.filter(edge => ['qualifies', 'contradicts', 'supersedes'].includes(edge.type));
      let selected = state.selected;
      if (selected && !(selected.kind === 'node' ? visible.has(selected.id) : visibleEdges.has(selected.id))) {
        warnings.push('The selected item is outside this visible neighborhood. Focus is unchanged.');
        selected = null;
      }
      const matchingRecords = new Set(matching.flatMap(edge => [edge.from, edge.to]));
      if (state.focus) matchingRecords.add(state.focus);
      const filtered = candidates.length - matching.length;
      return {
        schema_version: snapshot.schema_version, corpus_version: snapshot.corpus_version, index_version: snapshot.index_version,
        state: { ...state, selected, corpus: snapshot.corpus_version, index: snapshot.index_version },
        nodes: [...visible].map(id => nodes.get(id)!).sort((a, b) => a.id.localeCompare(b.id, 'en')),
        edges, warnings,
        ownership: Object.fromEntries([...owners].filter(([id]) => visible.has(id)).map(([id, roots]) => [id, [...roots]])),
        counts: { visible_records: visible.size, matching_records: matchingRecords.size, visible_edges: edges.length,
          matching_edges: matching.length, considered_edges: candidates.length, assertions: edges.reduce((sum, edge) => sum + edge.assertions.length, 0),
          omitted_by_filter: filtered, omitted_by_budget: matching.length - edges.length,
          snapshot_diagnostics: snapshot.diagnostics.length, invalid_references_in_snapshot: snapshot.diagnostics.filter(item => item.code === 'dangling-reference').length, capacity },
        // Metadata only: full assertions are retrieved through a separate inspect action.
        hidden_material: material.map(({ id, from, to, type }) => ({ id, from, to, type })),
      };
    },
  };
}
