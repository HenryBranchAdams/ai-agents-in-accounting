import type { GraphEdge, GraphNode } from '../connections/contract';
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
export function NodeContext({ node }: { node: GraphNode }) {
  return <><p>{node.summary}</p><dl>
    <dt>Record kind</dt><dd>{node.kind}, not an authority or confidence score</dd>
    <dt>Recorded scope</dt><dd>{node.scope}</dd>
    <dt>Source review</dt><dd>{node.review_status}; {node.reviewed_at ?? 'date unknown'}</dd>
    <dt>Access</dt><dd>{node.access}</dd>
  </dl>{node.limitations.length ? <ul>{node.limitations.map((limit, i) => <li key={i}>{limit}</li>)}</ul> : null}
  <details><summary>Recorded rights</summary><pre>{JSON.stringify(node.rights, null, 2)}</pre></details>
  <p><a href={node.href}>Open the complete record</a></p></>;
}
