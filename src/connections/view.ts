import type { createConnectionIndex } from './select';
export type ConnectionView = ReturnType<ReturnType<typeof createConnectionIndex>['select']>;

/** Overview delivery retains relationship identity and counts. Exact evidence has an explicit lazy endpoint. */
export function connectionViewDTO(view: ConnectionView) {
  return {
    ...view,
    edges: view.edges.map(({ id, from, to, type, direction_meaning, assertions }) => ({
      id, from, to, type, direction_meaning, assertion_count: assertions.length,
      evidence_href: `/api/v1/connections/edge?${new URLSearchParams({ id, index: view.index_version })}`,
    })),
  };
}
export type ConnectionViewDTO = ReturnType<typeof connectionViewDTO>;
