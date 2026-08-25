import { DocsShell } from "../DocsShell";
import { docsMetadata } from "../docsMetadata";
import {
  contentContractReviewNote,
  contentModes,
  educationalContentContract,
} from "../content-contract";

const description = educationalContentContract.description;

export const metadata = {
  ...docsMetadata("Educational content contract", description, "/content-contract"),
  alternates: {
    canonical: "/content-contract",
    types: {
      "text/markdown": "/content-contract.md",
      "application/json": "/api/v1/content-contract",
    },
  },
};

function modeLabel(id: string) {
  return contentModes.find((mode) => mode.id === id)?.label ?? id;
}

export default function ContentContractPage() {
  return (
    <DocsShell
      active="/content-contract"
      category="Project"
      title="Educational content contract"
      description={description}
      reviewedAt={educationalContentContract.prepared_at}
      trustDateLabel="Prepared"
      reviewStatus="Maintainer review pending; independent or professional review is not claimed"
      markdownHref="/content-contract.md"
      jsonHref="/api/v1/content-contract"
      toc={[
        { href: "#overview", label: "Contract overview" },
        { href: "#modes", label: "Primary modes" },
        { href: "#evidence", label: "Evidence classifications" },
        { href: "#release-gate", label: "Release gate" },
        { href: "#success-measures", label: "Success measures" },
        { href: "#assignments", label: "Page assignments" },
      ]}
      previous={{ href: "/open-source", label: "Open source" }}
    >
      <section id="overview">
        <h2>Contract overview</h2>
        <p>
          This contract gives each page one primary educational job, makes the
          evidence status visible, and defines what would count as educational
          progress. Cross-links are encouraged, but mixed concerns must remain
          explicit so a tutorial does not become a reference dump or a project
          recommendation does not look like an authoritative requirement.
        </p>
        <dl className="record-facts">
          <div><dt>Contract ID</dt><dd><code>{educationalContentContract.id}</code> · version {educationalContentContract.version}</dd></div>
          <div><dt>Review status</dt><dd>{educationalContentContract.review_status}</dd></div>
          <div><dt>Review note</dt><dd>{contentContractReviewNote}</dd></div>
          <div><dt>Governing invariant</dt><dd>{educationalContentContract.governing_invariant}</dd></div>
        </dl>
      </section>

      <section id="modes">
        <h2>Primary content modes</h2>
        <p>
          The first four modes follow the approved Diátaxis distinction between
          learning, task completion, explanation, and lookup. Case study,
          evidence synthesis, and program documentation extend that contract
          for this project&apos;s field-guide, research, and program surfaces.
        </p>
        <div className="table-wrap">
          <table>
            <caption>Seven primary educational content modes</caption>
            <thead><tr><th>Mode</th><th>Reader need</th><th>Required anatomy</th><th>Completion standard</th><th>Mixing and quality boundary</th></tr></thead>
            <tbody>
              {educationalContentContract.modes.map((mode) => (
                <tr key={mode.id}>
                  <th scope="row">{mode.label}</th>
                  <td>{mode.reader_need}</td>
                  <td><ul>{mode.required_anatomy.map((item) => <li key={item}>{item}</li>)}</ul></td>
                  <td>{mode.completion_standard}</td>
                  <td>{mode.mixing_quality_boundary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="evidence">
        <h2>Visible evidence classifications</h2>
        <p>
          Classifications describe what a statement or artifact is and how a
          reader may rely on it. Source type is not an authority score. Current
          applicability, entity, period, jurisdiction, effective date, and
          contrary evidence still require review.
        </p>
        <div className="table-wrap">
          <table>
            <caption>Evidence classifications and reliance boundaries</caption>
            <thead><tr><th>Classification</th><th>Meaning</th><th>Display and reliance boundary</th></tr></thead>
            <tbody>
              {educationalContentContract.evidence_classifications.map((classification) => (
                <tr key={classification.id}>
                  <th scope="row">{classification.label}</th>
                  <td>{classification.meaning}</td>
                  <td>{classification.display_reliance_boundary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="release-gate">
        <h2>Educational release gate</h2>
        <p>{educationalContentContract.release_gate.principle}</p>
        <div className="baseline-columns">
          {educationalContentContract.release_gate.qualifying_improvements.map((improvement) => (
            <article key={improvement.id}>
              <h3>{improvement.label}</h3>
              <p>{improvement.test}</p>
              <ul>{improvement.evidence_examples.map((example) => <li key={example}>{example}</li>)}</ul>
            </article>
          ))}
        </div>
        <div className="note note-rule">
          <p className="note-title">Count alone does not qualify</p>
          <p>{educationalContentContract.release_gate.non_qualifying_basis}</p>
          <p>{educationalContentContract.release_gate.required_boundary}</p>
        </div>
      </section>

      <section id="success-measures">
        <h2>Success measures</h2>
        <p>
          {educationalContentContract.measurement_status} These measures define
          what future evaluation should examine rather than reporting outcomes
          the project has not captured.
        </p>
        <div className="table-wrap">
          <table>
            <caption>Proposed educational success measures</caption>
            <thead><tr><th>Measure</th><th>Question</th><th>Signal</th><th>Interpretation boundary</th></tr></thead>
            <tbody>
              {educationalContentContract.success_measures.map((measure) => (
                <tr key={measure.id}>
                  <th scope="row">{measure.label}</th>
                  <td>{measure.question}</td>
                  <td>{measure.signal}</td>
                  <td>{measure.interpretation_boundary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="assignments">
        <h2>Primary mode assignments</h2>
        <p>
          Static human pages have one explicit assignment. Dynamic workflow,
          resource, and pack routes resolve to their safe reference mode, even
          when an unknown route is rejected by its own route handler.
        </p>
        <div className="table-wrap">
          <table>
            <caption>Primary mode for major human routes</caption>
            <thead><tr><th>Route pattern</th><th>Page kind</th><th>Primary mode</th></tr></thead>
            <tbody>
              {educationalContentContract.page_assignments.map((assignment) => (
                <tr key={assignment.path}>
                  <th scope="row"><code>{assignment.path}</code></th>
                  <td>{assignment.page_kind}</td>
                  <td>{modeLabel(assignment.primary_mode)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="sources">
        <h2>Source basis</h2>
        <p>
          The four core documentation modes use the approved primary reference
          below. The additional modes and all project boundaries are original
          Accounting Agents editorial contract content.
        </p>
        <ul>
          {educationalContentContract.source_basis.map((source) => (
            <li key={source.id}><a href={source.url} rel="noreferrer" target="_blank">{source.title}</a> — {source.scope}</li>
          ))}
        </ul>
      </section>
    </DocsShell>
  );
}
