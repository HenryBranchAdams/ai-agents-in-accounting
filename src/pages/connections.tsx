import { kinds, search } from '../corpus';
import { shell } from '../components/shell';
import { Button } from '../components/ui/button';
import { FieldGroup } from '../components/ui/field';
import { InputField } from '../components/corpus-fields';
import type { GraphEdge, GraphNode } from '../connections/contract';
import { connectionURL, type ConnectionState } from '../connections/state';
import { connectionViewDTO, type ConnectionView } from '../connections/view';
import { ConnectionEvidence } from '../components/connection-evidence';
import { ConnectionsExplorer, resetConnections } from '../components/connections-explorer';
export function connectionEdgePage(edge: GraphEdge, from: GraphNode, to: GraphNode, state: ConnectionState) {
  return shell('Recorded connection', 'Inspect the exact recorded relationship and provenance.', <article className="max-w-reading py-10">
    <h1>{from.title} → {to.title}</h1><p>Relationship: {edge.type}</p>
    <ConnectionEvidence edge={edge} />
    <p><a href={connectionURL(resetConnections(state, from.id))}>Explore from {from.title}</a></p>
    <p><a href={connectionURL(resetConnections(state, to.id))}>Explore from {to.title}</a></p>
  </article>, '', '/connections');
}
export function connectionsPage(state: ConnectionState, view?: ConnectionView) {
  const results = !state.focus && state.query ? search(new URLSearchParams({ q: state.query, limit: '12' })).records : [];
  const dto = view ? connectionViewDTO(view) : undefined;
  const evidence = state.selected?.kind === 'edge' ? view?.edges.find(edge => edge.id === state.selected!.id) : undefined;
  const initial = dto ? { view: dto, kindNames: kinds, evidence } : undefined;
  return shell('Explore connections', 'Explore recorded citations and relationships with their scope and limitations.', <>
    <header className="max-w-reading py-10"><h1>Explore connections</h1>
      <p>Follow recorded citations and relationships. A citation, a shared source, a proposed control and explicit support are different claims.</p>
      <form action="/connections" method="get"><FieldGroup><InputField name="q" label="Find a record to explore" defaultValue={state.query} maxLength={240} /><Button type="submit">Find records</Button></FieldGroup></form>
    </header>
    {!view ? <section className="max-w-reading"><h2>{state.query ? 'Matching starting points' : 'Start with a workflow'}</h2>
      {state.query && !results.length ? <p>No records match this search. Try a shorter phrase.</p> : null}
      <ul>{(state.query ? results : [{ id: 'wf-r2r-bank-reconciliations', title: 'Bank reconciliation' }, { id: 'guide-construction-connected-close', title: 'Construction work in progress' }]).map(record => <li key={record.id}><a href={connectionURL(resetConnections(state, record.id))}>{record.title}</a></li>)}</ul>
      <p>Choose a starting record. The view opens a bounded neighborhood, not the complete corpus network.</p>
    </section> : null}
    {dto ? <div id="connections-explorer" data-connections-initial={state.mode === 'graph' ? JSON.stringify(initial) : undefined}><div><ConnectionsExplorer view={dto} kindNames={kinds} evidence={evidence} /></div></div> : null}
  </>, '', '/connections');
}
