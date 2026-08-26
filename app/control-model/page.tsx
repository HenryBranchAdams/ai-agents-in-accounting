import { DocsShell } from "../DocsShell";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  accountingAgentControlModel,
  controlModelElements,
} from "../control-model";
import { docsMetadata } from "../docsMetadata";
import { workflowRecords } from "../workflows-data";

const description = accountingAgentControlModel.description;

export const metadata = {
  ...docsMetadata("Accounting Agent Control Model", description, "/control-model"),
  alternates: {
    canonical: "/control-model",
    types: {
      "text/markdown": "/control-model.md",
      "application/json": "/api/v1/control-model",
    },
  },
};

function EvidenceLabel({ children, value }: { children: ReactNode; value: string }) {
  return <span className="evidence-classification" data-evidence-classification={value}>{children}</span>;
}

export default function ControlModelPage() {
  return (
    <DocsShell
      active="/control-model"
      category="Govern"
      title="Accounting Agent Control Model"
      description={description}
      headerImage={{
        src: "/images/editorial/04-control-boundary.jpg",
        alt: "Evidence, procedures, checks, review, and action arranged around a visible approval boundary.",
      }}
      reviewStatus={accountingAgentControlModel.review_status}
      markdownHref="/control-model.md"
      jsonHref="/api/v1/control-model"
      toc={[
        { href: "#use", label: "Use and limits" },
        { href: "#elements", label: "Nine elements" },
        { href: "#scenarios", label: "Two scenarios" },
        { href: "#workflow-map", label: "Workflow mapping" },
        { href: "#print-reference", label: "Printable reference" },
        { href: "#sources", label: "Source basis" },
      ]}
      previous={{ href: "/authority", label: "Authority levels" }}
      next={{ href: "/controls", label: "Controls and authority" }}
    >
      <section id="use">
        <div className="record-heading-row record-heading-intro">
          <h2>Use one record from objective through retained evidence</h2>
          <EvidenceLabel value="implementation-pattern">Implementation pattern</EvidenceLabel>
        </div>
        <p>
          The model gives practitioners, reviewers, and builders one stable way
          to describe governed accounting-agent work. Complete all nine
          elements before relying on a workflow design or expanding its
          authority.
        </p>
        <div className="note note-warning">
          <p className="note-title">The accountable boundary does not move</p>
          <p>{accountingAgentControlModel.governing_invariant}</p>
        </div>
        <dl className="record-facts">
          <div><dt>Model ID</dt><dd><code>{accountingAgentControlModel.id}</code> · version {accountingAgentControlModel.version}</dd></div>
          <div><dt>Prepared</dt><dd>{accountingAgentControlModel.prepared_at}</dd></div>
          <div><dt>Expected outcome</dt><dd>{accountingAgentControlModel.expected_outcome}</dd></div>
          <div><dt>Prerequisites</dt><dd>{accountingAgentControlModel.prerequisites.join("; ")}</dd></div>
          <div><dt>Next action</dt><dd>{accountingAgentControlModel.next_action}</dd></div>
        </dl>
        <h3>Limitations</h3>
        <ul className="check-list">
          {accountingAgentControlModel.limitations.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </section>

      <section id="elements">
        <h2>Nine elements</h2>
        <p>
          Each element answers a different control question. The sequence is
          deliberate: an action or record cannot repair an undefined objective,
          incomplete population, unsupported procedure, or missing approval.
        </p>
        <div className="control-model-element-list">
          {accountingAgentControlModel.elements.map((element) => (
            <article id={`element-${element.id}`} key={element.id}>
              <header>
                <span className="record-number">{String(element.ordinal).padStart(2, "0")}</span>
                <div>
                  <h3>{element.label}</h3>
                  <p>{element.question}</p>
                </div>
              </header>
              <p>{element.definition}</p>
              <div className="record-subsections">
                <div>
                  <h4>Required record</h4>
                  <ul>{element.required_record.map((item) => <li key={item}>{item}</li>)}</ul>
                </div>
                <div>
                  <h4>Failure boundary</h4>
                  <p>{element.failure_boundary}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="scenarios">
        <h2>Two complete synthetic scenarios</h2>
        <p>
          These fictional examples demonstrate the model. They are not client,
          employer, engagement, vendor, bank, or production records and do not
          establish a correct treatment for another fact pattern.
        </p>
        <div className="control-model-scenarios">
          {accountingAgentControlModel.scenarios.map((scenario) => (
            <article id={scenario.id} key={scenario.id}>
              <div className="record-heading-row">
                <h3>{scenario.title}</h3>
                <EvidenceLabel value="synthetic-example">Synthetic example</EvidenceLabel>
              </div>
              <p>{scenario.context}</p>
              <p><strong>Lesson:</strong> {scenario.intended_lesson}</p>
              <div className="table-wrap">
                <table>
                  <caption>Control Model application for {scenario.title}</caption>
                  <thead><tr><th>Element</th><th>Application</th></tr></thead>
                  <tbody>
                    {scenario.elements.map((item) => (
                      <tr key={item.element_id}>
                        <th scope="row">{controlModelElements.find((element) => element.id === item.element_id)?.label}</th>
                        <td>{item.application}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="note">
                <p className="note-title">Accountable conclusion</p>
                <p>{scenario.accountable_conclusion}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="workflow-map">
        <h2>Every workflow maps to the model</h2>
        <p>
          All {workflowRecords.length} canonical workflow records expose a
          <code> control_model </code> object with this model ID, version, and
          source-field mappings for all nine elements. The mapping is available
          in workflow JSON and Markdown and remains subordinate to each
          workflow&apos;s action-level authority and human decisions.
        </p>
        <div className="table-wrap">
          <table>
            <caption>Canonical workflow fields used by each Control Model element</caption>
            <thead><tr><th>Element</th><th>Workflow fields</th></tr></thead>
            <tbody>
              {accountingAgentControlModel.workflow_mapping.contract.elements.map((mapping) => (
                <tr key={mapping.element_id}>
                  <th scope="row">{controlModelElements.find((element) => element.id === mapping.element_id)?.label}</th>
                  <td>{mapping.source_fields.map((field) => <code key={field}>{field} </code>)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Inspect the <Link href="/workflows/record-to-report/wf-r2r-journal-entry">journal-entry workflow</Link>,
          {" "}<Link href="/workflows/procure-to-pay/wf-p2p-payment-release">payment-release workflow</Link>, or
          {" "}<Link href="/api/v1/workflows?limit=60">workflow collection API</Link>.
        </p>
      </section>

      <section className="control-model-print-reference" id="print-reference">
        <div className="record-heading-row">
          <h2>Printable one-page reference</h2>
          <EvidenceLabel value="implementation-pattern">Implementation pattern</EvidenceLabel>
        </div>
        <p className="screen-only">
          Use the browser&apos;s Print command on this page. Print styles remove
          navigation and the extended examples, leaving this reference and its
          boundary.
        </p>
        <p><strong>{accountingAgentControlModel.governing_invariant}</strong></p>
        <ol className="control-model-quick-list">
          {accountingAgentControlModel.elements.map((element) => (
            <li key={element.id}>
              <strong>{element.label}</strong>
              <span>{element.question}</span>
              <small>{element.failure_boundary}</small>
            </li>
          ))}
        </ol>
        <p className="print-review-note">
          Model {accountingAgentControlModel.version}; prepared {accountingAgentControlModel.prepared_at}. {accountingAgentControlModel.review_note}
        </p>
      </section>

      <section id="sources">
        <h2>Source and review basis</h2>
        <p>
          The Control Model is an Accounting Agents editorial implementation
          pattern. Source classifications below apply only within each stated
          scope; they do not make the nine-element model itself authoritative.
        </p>
        <div className="control-model-source-list">
          {accountingAgentControlModel.source_basis.map((source) => (
            <article key={source.id}>
              <div className="record-heading-row">
                <h3><a href={source.url} rel="noreferrer" target="_blank">{source.title}</a></h3>
                <EvidenceLabel value={source.classification}>{source.classification === "authoritative-requirement" ? "Authoritative requirement" : "Official guidance"}</EvidenceLabel>
              </div>
              <p>{source.scope}</p>
              <p><code>{source.id}</code></p>
            </article>
          ))}
        </div>
        <div className="note">
          <p className="note-title">Review status</p>
          <p>{accountingAgentControlModel.review_note}</p>
        </div>
      </section>
    </DocsShell>
  );
}
