import type { ReactNode } from 'react';
import { Button } from './ui/button';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { FieldGroup, FieldSet, FieldLegend } from './ui/field';
import { SelectField } from './corpus-fields';
import { connectionTypes, graphLimits, type GraphEdge } from '../connections/contract';
import { connectionURL, type ConnectionState } from '../connections/state';
import type { ConnectionViewDTO } from '../connections/view';
import { ConnectionEvidence, NodeContext } from './connection-evidence';
export const resetConnections = (state: ConnectionState, id: string): ConnectionState => ({ ...state, focus: id, query: '', selected: null, expanded: [], budget: graphLimits.defaultNodes });
const inspectURL = (edge: Pick<GraphEdge, 'id'>) => `/connections/edge?${new URLSearchParams({ id: edge.id })}`;
export function ConnectionInspector({ view, evidence, status = '' }: { view: ConnectionViewDTO; evidence?: GraphEdge; status?: string }) {
  const selection = view.state.selected;
  const node = selection?.kind === 'node' ? view.nodes.find(item => item.id === selection.id) : !selection ? view.nodes.find(item => item.id === view.state.focus) : undefined;
  const edge = selection?.kind === 'edge' ? view.edges.find(item => item.id === selection.id) : undefined;
  if (node) {
    const expansion = view.state.expanded.find(item => item.id === node.id);
    const expanded = expansion ? view.state.expanded.map(item => item.id === node.id ? { ...item, steps: item.steps + 1 } : item) : [...view.state.expanded, { id: node.id, steps: 1 }];
    const canExpand = view.counts.capacity < graphLimits.maxNodes && (expansion?.steps ?? 0) < 8 && (expansion || view.state.expanded.length < graphLimits.maxExpansions);
    return <><h3>{node.title}</h3><p>{node.id === view.state.focus ? 'This is the focus record.' : `Shown through recorded connections from ${(view.ownership[node.id] ?? []).map(id => view.nodes.find(item => item.id === id)?.title ?? id).join('; ')}.`}</p><NodeContext node={node} /><p><a href={connectionURL(resetConnections(view.state, node.id))}>Refocus on this record</a>{canExpand ? <> · <a href={connectionURL({ ...view.state, expanded })}>Expand this record</a></> : null}</p></>;
  }
  if (edge) return <><h3>{view.nodes.find(node => node.id === edge.from)?.title} → {view.nodes.find(node => node.id === edge.to)?.title}: {edge.type}</h3><p><a href={`/records/${encodeURIComponent(edge.from)}`}>Read the source record</a> · <a href={`/records/${encodeURIComponent(edge.to)}`}>Read the target record</a></p>{evidence?.id === edge.id ? <ConnectionEvidence edge={evidence} /> : <p role="status">{status || 'Loading recorded evidence…'}</p>}<p><a href={inspectURL(edge)}>Open the complete connection evidence</a></p></>;
  return <p>Select a record or relationship to inspect it without expanding or changing focus.</p>;
}
export function ConnectionsExplorer({ view, kindNames, evidence, graph, inspector }: { view: ConnectionViewDTO; kindNames: Record<string, string>; evidence?: GraphEdge; graph?: ReactNode; inspector?: ReactNode }) {
  const state = view.state;
  const focus = view.nodes.find(node => node.id === state.focus)!;
  const byId = new Map(view.nodes.map(node => [node.id, node]));
  const link = (updates: Partial<ConnectionState>) => connectionURL({ ...state, ...updates }, Object.keys(kindNames));
  const changeFocus = (id: string) => connectionURL(resetConnections(state, id), Object.keys(kindNames));
  const expand = (id: string) => {
    const existing = state.expanded.find(item => item.id === id);
    if ((existing?.steps ?? 0) >= 8 || (!existing && state.expanded.length >= graphLimits.maxExpansions) || view.counts.capacity >= graphLimits.maxNodes) return null;
    return link({ expanded: existing ? state.expanded.map(item => item.id === id ? { ...item, steps: item.steps + 1 } : item) : [...state.expanded, { id, steps: 1 }] });
  };
  return <>
      <p className="sr-only" role="status" aria-live="polite">{state.selected ? `Selected ${state.selected.kind}: ${state.selected.kind === 'node' ? byId.get(state.selected.id)?.title ?? state.selected.id : view.edges.find(edge => edge.id === state.selected!.id)?.type ?? 'relationship'}.` : `Focus details: ${focus.title}.`} {view.nodes.length} records and {view.edges.length} relationships visible.</p>
      <section className="max-w-reading"><h2>Focus: {focus.title}</h2><p><a href={focus.href}>Read this record</a></p>
        <p>{view.counts.visible_records} visible records of {view.counts.matching_records} matching records; {view.counts.visible_edges} visible relationships of {view.counts.matching_edges} matching relationships; {view.counts.assertions} provenance items.</p>
        <p>{view.counts.omitted_by_filter} relationships omitted by filters; {view.counts.omitted_by_budget} omitted by node or edge limits. Counts cover the focus and explicit expansion neighborhoods. The focus remains visible when its kind is filtered out.</p>
        {view.warnings.map((warning, index) => <Alert key={index}><AlertTitle>View changed</AlertTitle><AlertDescription>{warning}</AlertDescription></Alert>)}
        {view.hidden_material.length ? <Alert><AlertTitle>Material connections are outside this view</AlertTitle><AlertDescription>
          <p>{view.hidden_material.length} qualification, contradiction or supersession relationships are hidden by filters or limits.</p>
          <details><summary>Inspect hidden material connections</summary><ul>{view.hidden_material.map(edge => <li key={edge.id}><a href={inspectURL(edge)}>{edge.from} → {edge.to}: {edge.type}</a></li>)}</ul></details>
        </AlertDescription></Alert> : null}
        <details><summary>Direction and filters</summary>
          <form key={JSON.stringify([state.direction, state.budget, state.types, state.kinds])} action="/connections" method="get"><FieldGroup>
            <input type="hidden" name="focus" value={state.focus!} /><input type="hidden" name="mode" value={state.mode} />
            <input type="hidden" name="corpus" value={view.corpus_version} /><input type="hidden" name="index" value={view.index_version} />
            <SelectField name="direction" label="Relationship direction from each explored record" values={[["both", "Both directions"], ["out", "Outgoing"], ["in", "Incoming"]]} selected={state.direction} />
            <SelectField name="budget" label="Initial record limit" values={[...new Set([12, 25, 40, 80, state.budget])].sort((a, b) => a - b).map(value => [String(value), `${value} records`])} selected={String(state.budget)} />
            <input type="hidden" name="types" value={state.types.join(',')} />
            <input type="hidden" name="kinds" value={state.kinds.join(',')} />
            <Button type="submit">Apply filters and reset expansions</Button>
          </FieldGroup></form>
          <FieldGroup>
            <FieldSet><FieldLegend>Relationship types</FieldLegend><p>Visible types: {state.types.length ? state.types.join(', ') : 'none'}.</p>
              <ul>{connectionTypes.map(type => <li key={type}><a href={link({ types: state.types.includes(type) ? state.types.filter(item => item !== type) : [...state.types, type], expanded: [], selected: null })}>{state.types.includes(type) ? 'Hide' : 'Show'} {type}</a></li>)}</ul>
              <p><a href={link({ types: [...connectionTypes], expanded: [], selected: null })}>Show all relationship types</a></p>
            </FieldSet>
            <FieldSet><FieldLegend>Record kinds</FieldLegend><p>These are record categories, not evidence quality.</p>
              <ul>{Object.entries(kindNames).map(([kind, title]) => <li key={kind}><a href={link({ kinds: state.kinds.includes(kind) ? state.kinds.filter(item => item !== kind) : [...state.kinds, kind], expanded: [], selected: null })}>{state.kinds.includes(kind) ? 'Hide' : 'Show'} {title}</a></li>)}</ul>
              <p><a href={link({ kinds: Object.keys(kindNames), expanded: [], selected: null })}>Show all record kinds</a></p>
            </FieldSet>
          </FieldGroup>
        </details>
        <p><a href={link({ mode: 'list' })} aria-current={state.mode === 'list' ? 'page' : undefined}>List</a> · <a href={link({ mode: 'graph' })} aria-current={state.mode === 'graph' ? 'page' : undefined}>Graph</a> · <a href={connectionURL({ ...resetConnections(state, focus.id), types: [...connectionTypes], kinds: Object.keys(kindNames) }, Object.keys(kindNames))}>Reset exploration</a></p>
        <p><a href={connectionURL(state, Object.keys(kindNames))}>Link to this view</a></p>
        {state.selected ? <p><a href={link({ selected: null })}>Clear selection and inspect focus</a></p> : null}
        {state.expanded.length ? <p><a href={link({ expanded: state.expanded.slice(0, -1) })}>Undo last expansion</a></p> : null}
        <p>Maximum: {graphLimits.maxNodes} records and {graphLimits.maxEdges} relationships. Refocus or narrow filters when the limit is reached.</p>
      </section>
      {state.mode === 'graph' ? (graph ?? <section id="connection-graph"><h2>Graph</h2><p>The accessible List below contains the same visible records, relationships and actions if graph enhancement is unavailable.</p></section>) : null}
      <section id="connection-list" className="max-w-reading"><h2>Visible records</h2>
        <ul>{view.nodes.map(node => <li key={node.id} data-connection-node-id={node.id}>
          <a href={link({ selected: { kind: 'node', id: node.id } })}>{node.title}</a> ({node.kind})
          <p><a href={node.href}>Read record</a> · <a href={changeFocus(node.id)}>Refocus here</a>{expand(node.id) ? <> · <a href={expand(node.id)!}>Expand by up to 10 records</a></> : null}{state.expanded.some(item => item.id === node.id) ? <> · <a href={link({ expanded: state.expanded.filter(item => item.id !== node.id) })}>Collapse this expansion</a></> : null}</p>
        </li>)}</ul>
        <h2>Visible relationships</h2>
        {!view.edges.length ? <p>No recorded relationships match this neighborhood and its filters.</p> : null}
        <ul>{view.edges.map(edge => <li key={edge.id} data-connection-edge-id={edge.id}><a href={link({ selected: { kind: 'edge', id: edge.id } })}>{byId.get(edge.from)?.title} → {byId.get(edge.to)?.title}: {edge.type}</a> ({edge.assertion_count} provenance items)</li>)}</ul>
      </section>
      {inspector === undefined ? <aside id="connection-inspector" className="max-w-reading" aria-label="Selected connection or record"><h2>Inspector</h2><ConnectionInspector view={view} evidence={evidence} /></aside> : inspector}
      <p>Corpus {view.corpus_version}. Connection index <code>{view.index_version}</code>. {view.counts.snapshot_diagnostics} projection diagnostics, including {view.counts.invalid_references_in_snapshot} invalid references excluded from edges.</p>
  </>;
}
