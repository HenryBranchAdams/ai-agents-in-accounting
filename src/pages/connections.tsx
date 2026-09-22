import { kinds, search } from '../corpus';
import { shell } from '../components/shell';
import { Button } from '../components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert';
import { FieldGroup } from '../components/ui/field';
import { InputField, SelectField } from '../components/corpus-fields';
import { connectionTypes, graphLimits, type GraphEdge, type GraphNode } from '../connections/contract';
import { connectionURL, type ConnectionState } from '../connections/state';
import type { createConnectionIndex } from '../connections/select';

type View = ReturnType<ReturnType<typeof createConnectionIndex>['select']>;
const reset = (state: ConnectionState, id: string): ConnectionState => ({ ...state, focus: id, query: '', selected: null, expanded: [], budget: graphLimits.defaultNodes });
const inspectURL = (edge: Pick<GraphEdge, 'id'>) => `/connections/edge?${new URLSearchParams({ id: edge.id })}`;
export function ConnectionEvidence({ edge }: { edge: GraphEdge }) {
  return <>
    <p>{edge.direction_meaning}</p>
    <p>{edge.assertions.length} recorded provenance items. Repeated citations are not independent confirmations.</p>
    {edge.assertions.map((assertion, i) => <section key={i}>
      <h3>Recorded reason {i + 1}</h3><p>{assertion.reason}</p>
      {assertion.limitations.length ? <ul>{assertion.limitations.map((limitation, index) => <li key={index}>{limitation}</li>)}</ul> : <p>No additional limitation recorded for this assertion. This does not establish effectiveness.</p>}
      <p>Origin: {assertion.origin}. Stored at <code>{assertion.owner_file}#{assertion.stored_at}</code>.</p>
      {assertion.source_ids.length ? <p>Declared source owners: {assertion.source_ids.map((id, index) => <span key={id}>{index ? ', ' : ''}<a href={`/records/${encodeURIComponent(id)}`}>{id}</a></span>)}</p> : null}
      <ul>{assertion.locators.map((locator, index) => <li key={index}>
        {locator.kind === 'corpus-pointer' ? 'Corpus JSON pointer' : locator.kind === 'finding-locator' ? 'Finding-level locator, not a per-source publisher passage' : 'Publisher passage'}: <code>{locator.locator}</code>. Ownership: {locator.status}.
        {locator.owner_id ? <> Owner: <a href={`/records/${encodeURIComponent(locator.owner_id)}`}>{locator.owner_id}</a>.</> : <> No unique owner established. Candidates: {locator.candidate_owners.join(', ') || 'none'}.</>}
      </li>)}</ul>
    </section>)}
  </>;
}
function NodeContext({ node }: { node: GraphNode }) {
  return <><p>{node.summary}</p><dl>
    <dt>Record kind</dt><dd>{node.kind}, not an authority or confidence score</dd>
    <dt>Recorded scope</dt><dd>{node.scope}</dd>
    <dt>Source review</dt><dd>{node.review_status}; {node.reviewed_at ?? 'date unknown'}</dd>
    <dt>Access</dt><dd>{node.access}</dd>
  </dl>{node.limitations.length ? <ul>{node.limitations.map((limit, i) => <li key={i}>{limit}</li>)}</ul> : null}
  <details><summary>Recorded rights</summary><pre>{JSON.stringify(node.rights, null, 2)}</pre></details>
  <p><a href={node.href}>Open the complete record</a></p></>;
}
export function connectionEdgePage(edge: GraphEdge, from: GraphNode, to: GraphNode, state: ConnectionState) {
  return shell('Recorded connection', 'Inspect the exact recorded relationship and provenance.', <article className="max-w-reading py-10">
    <h1>{from.title} → {to.title}</h1><p>Relationship: {edge.type}</p>
    <ConnectionEvidence edge={edge} />
    <p><a href={connectionURL(reset(state, from.id))}>Explore from {from.title}</a></p>
    <p><a href={connectionURL(reset(state, to.id))}>Explore from {to.title}</a></p>
  </article>, '', '/connections');
}
export function connectionsPage(state: ConnectionState, view?: View) {
  const focus = view?.nodes.find(node => node.id === state.focus);
  const byId = new Map(view?.nodes.map(node => [node.id, node]));
  const link = (updates: Partial<ConnectionState>) => connectionURL({ ...state, ...updates });
  const changeFocus = (id: string) => connectionURL(reset(state, id));
  const results = !state.focus && state.query ? search(new URLSearchParams({ q: state.query, limit: '12' })).records : [];
  const expand = (id: string) => {
    const existing = state.expanded.find(item => item.id === id);
    if ((existing?.steps ?? 0) >= 8 || (!existing && state.expanded.length >= graphLimits.maxExpansions) || (view?.counts.capacity ?? 0) >= graphLimits.maxNodes) return null;
    return link({ expanded: existing ? state.expanded.map(item => item.id === id ? { ...item, steps: item.steps + 1 } : item) : [...state.expanded, { id, steps: 1 }] });
  };
  return shell('Explore connections', 'Explore recorded citations and relationships with their scope and limitations.', <>
    <header className="max-w-reading py-10"><h1>Explore connections</h1>
      <p>Follow recorded citations and relationships. A citation, a shared source, a proposed control and explicit support are different claims.</p>
      <form action="/connections" method="get"><FieldGroup><InputField name="q" label="Find a record to explore" defaultValue={state.query} maxLength={240} /><Button type="submit">Find records</Button></FieldGroup></form>
    </header>
    {!focus ? <section className="max-w-reading"><h2>{state.query ? 'Matching starting points' : 'Start with a workflow'}</h2>
      {state.query && !results.length ? <p>No records match this search. Try a shorter phrase.</p> : null}
      <ul>{(state.query ? results : [{ id: 'wf-r2r-bank-reconciliations', title: 'Bank reconciliation' }, { id: 'guide-construction-connected-close', title: 'Construction work in progress' }]).map(record => <li key={record.id}><a href={changeFocus(record.id)}>{record.title}</a></li>)}</ul>
      <p>Choose a starting record. The view opens a bounded neighborhood, not the complete corpus network.</p>
    </section> : view ? <>
      <section className="max-w-reading"><h2>Focus: {focus.title}</h2><p><a href={focus.href}>Read this record</a></p>
        <p>{view.counts.visible_records} visible records of {view.counts.matching_records} matching records; {view.counts.visible_edges} visible relationships of {view.counts.matching_edges} matching relationships; {view.counts.assertions} provenance items.</p>
        <p>{view.counts.omitted_by_filter} relationships omitted by filters; {view.counts.omitted_by_budget} omitted by node or edge limits. Counts cover the focus and explicit expansion neighborhoods. The focus remains visible when its kind is filtered out.</p>
        {view.warnings.map((warning, index) => <Alert key={index}><AlertTitle>View changed</AlertTitle><AlertDescription>{warning}</AlertDescription></Alert>)}
        {view.hidden_material.length ? <Alert><AlertTitle>Material connections are outside this view</AlertTitle><AlertDescription>
          <p>{view.hidden_material.length} qualification, contradiction or supersession relationships are hidden by filters or limits.</p>
          <details><summary>Inspect hidden material connections</summary><ul>{view.hidden_material.map(edge => <li key={edge.id}><a href={inspectURL(edge)}>{edge.from} → {edge.to}: {edge.type}</a></li>)}</ul></details>
        </AlertDescription></Alert> : null}
        <details><summary>Direction and filters</summary>
          <form action="/connections" method="get"><FieldGroup>
            <input type="hidden" name="focus" value={state.focus!} /><input type="hidden" name="mode" value={state.mode} />
            <input type="hidden" name="corpus" value={view.corpus_version} /><input type="hidden" name="index" value={view.index_version} />
            <SelectField name="direction" label="Relationship direction from each explored record" values={[["both", "Both directions"], ["out", "Outgoing"], ["in", "Incoming"]]} selected={state.direction} />
            <SelectField name="budget" label="Initial record limit" values={[["12", "12 records"], ["25", "25 records"], ["40", "40 records"], ["80", "80 records"]]} selected={String(state.budget)} />
            <InputField name="types" label="Relationship types, separated by commas" defaultValue={state.types.join(',')} />
            <p>Available types: {connectionTypes.join(', ')}. An empty value hides every relationship.</p>
            <InputField name="kinds" label="Record kinds, separated by commas" defaultValue={state.kinds.join(',')} />
            <p>Available kinds: {Object.keys(kinds).join(', ')}. These are record categories, not evidence quality.</p>
            <Button type="submit">Apply filters and reset expansions</Button>
          </FieldGroup></form>
        </details>
        <p><a href={link({ mode: 'list' })} aria-current={state.mode === 'list' ? 'page' : undefined}>List</a> · <a href={link({ mode: 'graph' })} aria-current={state.mode === 'graph' ? 'page' : undefined}>Graph</a> · <a href={connectionURL({ ...reset(state, focus.id), types: [...connectionTypes], kinds: Object.keys(kinds) })}>Reset exploration</a></p>
        {state.expanded.length ? <p><a href={link({ expanded: state.expanded.slice(0, -1) })}>Undo last expansion</a></p> : null}
        <p>Maximum: {graphLimits.maxNodes} records and {graphLimits.maxEdges} relationships. Refocus or narrow filters when the limit is reached.</p>
      </section>
      {state.mode === 'graph' ? <section id="connection-graph" data-connection-url={connectionURL(state)}><h2>Graph</h2><p>The accessible List below contains the same visible records, relationships and actions if graph enhancement is unavailable.</p></section> : null}
      <section id="connection-list" className="max-w-reading"><h2>Visible records</h2>
        <ul>{view.nodes.map(node => <li key={node.id}>
          <a href={link({ selected: { kind: 'node', id: node.id } })}>{node.title}</a> ({node.kind})
          <p><a href={node.href}>Read record</a> · <a href={changeFocus(node.id)}>Refocus here</a>{expand(node.id) ? <> · <a href={expand(node.id)!}>Expand by up to 10 records</a></> : null}{state.expanded.some(item => item.id === node.id) ? <> · <a href={link({ expanded: state.expanded.filter(item => item.id !== node.id) })}>Collapse this expansion</a></> : null}</p>
        </li>)}</ul>
        <h2>Visible relationships</h2>
        {!view.edges.length ? <p>No recorded relationships match this neighborhood and its filters.</p> : null}
        <ul>{view.edges.map(edge => <li key={edge.id}><a href={link({ selected: { kind: 'edge', id: edge.id } })}>{byId.get(edge.from)?.title} → {byId.get(edge.to)?.title}: {edge.type}</a> ({edge.assertions.length} provenance items)</li>)}</ul>
      </section>
      <aside id="connection-inspector" className="max-w-reading" aria-label="Selected connection or record">
        <h2>Inspector</h2>
        {state.selected?.kind === 'node' && byId.has(state.selected.id) ? <><h3>{byId.get(state.selected.id)!.title}</h3><NodeContext node={byId.get(state.selected.id)!} /></> : state.selected?.kind === 'edge' && view.edges.some(edge => edge.id === state.selected!.id) ? <ConnectionEvidence edge={view.edges.find(edge => edge.id === state.selected!.id)!} /> : <p>Select a record or relationship to inspect it without expanding or changing focus.</p>}
      </aside>
      <p>Corpus {view.corpus_version}. Connection index <code>{view.index_version}</code>. {view.counts.snapshot_diagnostics} projection diagnostics, including {view.counts.invalid_references_in_snapshot} invalid references excluded from edges.</p>
    </> : null}
  </>, '', '/connections');
}
