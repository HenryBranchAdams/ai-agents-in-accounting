import Link from "next/link";
import { DocsShell } from "../DocsShell";
import { accountingAgentsCoverageMap } from "../coverage-map";
import { docsMetadata } from "../docsMetadata";
import { workflowById } from "../workflows-data";

const description = "See what the public Accounting Agents corpus covers deeply, at canonical-reference level, only through sources, as planned work, or not at all.";

export const metadata = {
  ...docsMetadata("Coverage and gaps", description, "/coverage"),
  alternates: { canonical: "/coverage", types: { "text/markdown": "/coverage.md", "application/json": "/api/v1/coverage" } },
};

export default function CoveragePage() {
  const map = accountingAgentsCoverageMap;
  return (
    <DocsShell
      active="/coverage"
      category="Learn"
      title="Coverage and gaps"
      description={description}
      reviewStatus={map.review_status}
      markdownHref="/coverage.md"
      jsonHref="/api/v1/coverage"
      toc={[
        { href: "#use", label: "Use and limits" },
        { href: "#states", label: "Coverage states" },
        { href: "#deep", label: "Deep coverage" },
        { href: "#families", label: "Family boundaries" },
        { href: "#gaps", label: "Expansion gaps" },
        { href: "#examples", label: "How to use the map" },
        { href: "#out-of-scope", label: "Out of scope" },
      ]}
      previous={{ href: "/lifecycle", label: "Accounting lifecycle" }}
      next={{ href: "/authority", label: "Authority levels" }}
    >
      <section id="use">
        <h2>Use a coverage claim that this release can support</h2>
        <p>{map.expected_outcome}</p>
        <dl className="record-facts">
          <div><dt>Map ID</dt><dd><code>{map.id}</code> · version {map.version}</dd></div>
          <div><dt>Prepared</dt><dd>{map.prepared_at}</dd></div>
          <div><dt>Intended audience</dt><dd>{map.intended_audience.join("; ")}</dd></div>
          <div><dt>Prerequisites</dt><dd>{map.prerequisites.join("; ")}</dd></div>
          <div><dt>Evidence classification</dt><dd><span data-evidence-classification={map.evidence_classification}>Editorial recommendation</span></dd></div>
          <div><dt>Next action</dt><dd>{map.next_action}</dd></div>
        </dl>
        <div className="note note-rule"><p className="note-title">Coverage is not authority</p><p>{map.governing_invariant}</p></div>
        <h3>Limitations</h3>
        <ul className="check-list">{map.limitations.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>

      <section id="states">
        <h2>Five versioned coverage states</h2>
        <div className="coverage-state-grid">
          {map.state_definitions.map((state) => <article id={`state-${state.id}`} key={state.id}><h3>{state.label}</h3><p>{state.definition}</p><code>{state.id}</code></article>)}
        </div>
      </section>

      <section id="deep">
        <h2>Deep coverage is a release gate, not a marketing label</h2>
        <p><strong>{map.deep_coverage.current_count} workflows</strong> currently meet every deep-treatment criterion. {map.deep_coverage.boundary}</p>
        <div className="table-wrap"><table><caption>Planned deep treatments and their current state</caption><thead><tr><th>Workflow</th><th>Stable ID</th><th>Current state</th></tr></thead><tbody>
          {map.deep_coverage.planned_candidates.map((item) => { const workflow = workflowById.get(item.id); return <tr key={item.id}><th scope="row"><Link href={`/workflows/${workflow?.family}/${item.id}`}>{item.name}</Link></th><td><code>{item.id}</code></td><td>{item.current_state}</td></tr>; })}
        </tbody></table></div>
      </section>

      <section id="families">
        <h2>Canonical-reference process families</h2>
        <p>All eight families have governed reference records. Each row states what that family does and does not establish.</p>
        <div className="coverage-family-list">{map.family_coverage.map((item) => <article id={item.id} key={item.id}>
          <header><div><h3><Link href={`/workflows/${item.family_id}`}>{item.family_name}</Link></h3><p>{item.workflow_count} canonical workflows · {item.state}</p></div></header>
          <dl><div><dt>Includes</dt><dd>{item.includes}</dd></div><div><dt>Does not establish</dt><dd>{item.excludes}</dd></div><div><dt>Next gap</dt><dd>{item.next_gap}</dd></div></dl>
        </article>)}</div>
      </section>

      <section id="gaps">
        <h2>Source-only and planned expansion gaps</h2>
        <div className="table-wrap"><table><caption>Domains not represented by a complete canonical workflow module</caption><thead><tr><th>Domain</th><th>Current state</th><th>Evidence surface</th><th>Planned issue</th><th>Boundary</th></tr></thead><tbody>
          {map.expansion_coverage.map((item) => <tr id={item.id} key={item.id}><th scope="row">{item.label}</th><td>{item.current_state}</td><td>{item.source_query ? <Link href={`/api/v1/resources?q=${encodeURIComponent(item.source_query)}`}>Source records</Link> : "Not claimed"}</td><td><a href={`https://github.com/HenryBranchAdams/ai-agents-in-accounting/issues/${item.planned_issue}`}>#{item.planned_issue}</a></td><td>{item.boundary}</td></tr>)}
        </tbody></table></div>
      </section>

      <section id="examples">
        <h2>Use the map before selecting or describing work</h2>
        <div className="coverage-state-grid">
          <article>
            <h3>Bank reconciliation: canonical reference, planned deep treatment</h3>
            <p>The current <Link href="/workflows/record-to-report/wf-r2r-bank-reconciliations">workflow record</Link> and <Link href="/packs/bank-reconciliation">synthetic pack</Link> support design and conformance work. They do not yet satisfy every Deep criterion. Use the <Link href="/controls">control patterns</Link> and <Link href="/templates">templates</Link> to prepare a governed pilot artifact.</p>
          </article>
          <article>
            <h3>Payroll: source-library presence is not workflow coverage</h3>
            <p>A <Link href="/api/v1/resources?q=payroll">source search</Link> can locate relevant evidence, but the corpus has no canonical payroll family or complete hire-to-retire treatment. Record that gap rather than adapting a generic workflow silently.</p>
          </article>
          <article>
            <h3>Payment release: coverage does not grant execution authority</h3>
            <p>The <Link href="/workflows/procure-to-pay/wf-p2p-payment-release">payment-release reference</Link> describes preparation and approval gates. Apply the <Link href="/sensitive-actions">sensitive-action boundary</Link>; accountable people approve the beneficiary and payment, and deterministic systems enforce the exact approved payload.</p>
          </article>
          <article>
            <h3>Professional conclusions remain outside the public corpus</h3>
            <p>Use <Link href="/evidence-assurance">evidence and assurance</Link> to distinguish a workpaper, maintainer review, control assessment, and professional assurance. A complete-looking page or passing test does not create an audit opinion or certification.</p>
          </article>
        </div>
      </section>

      <section id="out-of-scope">
        <h2>Explicitly out of scope</h2>
        <div className="coverage-state-grid">{map.out_of_scope.map((item) => <article id={item.id} key={item.id}><h3>{item.label}</h3><p>{item.boundary}</p></article>)}</div>
        <div className="note"><p className="note-title">Review and reuse</p><p>{map.review_note} {map.applicability}</p><p>Editorial content: {map.rights.editorial_content}. Factual metadata: {map.rights.factual_metadata}.</p></div>
      </section>
    </DocsShell>
  );
}
