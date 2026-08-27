import Link from "next/link";
import { bankReconciliationTutorial } from "../../bank-reconciliation-tutorial";
import { DocsShell } from "../../DocsShell";
import { docsMetadata } from "../../docsMetadata";
import { KnowledgeCheck } from "../../start-here/KnowledgeCheck";

const tutorial = bankReconciliationTutorial;
const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export const metadata = {
  ...docsMetadata(tutorial.title, tutorial.description, "/tutorials/bank-reconciliation"),
  alternates: {
    canonical: "/tutorials/bank-reconciliation",
    types: {
      "text/markdown": "/tutorials/bank-reconciliation.md",
      "application/json": "/api/v1/tutorials/bank-reconciliation",
    },
  },
};

export default function BankReconciliationTutorialPage() {
  return (
    <DocsShell
      active="/tutorials/bank-reconciliation"
      category="Learn"
      title={tutorial.title}
      description={tutorial.description}
      reviewedAt={tutorial.prepared_at}
      trustDateLabel="Prepared"
      reviewStatus="Maintainer review pending; subject-matter, independent, professional, audit, certification, assurance, or production review is not claimed"
      markdownHref="/tutorials/bank-reconciliation.md"
      jsonHref="/api/v1/tutorials/bank-reconciliation"
      toc={[
        { href: "#before-you-begin", label: "Before you begin" },
        { href: "#environment", label: "Synthetic environment" },
        { href: "#evidence-register", label: "Evidence register" },
        { href: "#guided-lesson", label: "Guided lesson" },
        { href: "#known-answer", label: "Known-answer work" },
        { href: "#deliberate-stop", label: "Deliberate stop" },
        { href: "#workpaper", label: "Prepared workpaper" },
        { href: "#review", label: "Reviewer packet" },
        { href: "#knowledge-check", label: "Knowledge check" },
        { href: "#transfer", label: "Transfer limits" },
      ]}
      previous={{ href: "/course", label: "Core course" }}
      next={{ href: "/reviewer-guide", label: "Reviewer field guide" }}
    >
      <section id="before-you-begin">
        <h2>Before you begin</h2>
        <p>{tutorial.intended_learner}</p>
        <dl className="record-facts">
          <div><dt>Tutorial ID</dt><dd><code>{tutorial.id}</code> · version {tutorial.version}</dd></div>
          <div><dt>Estimated time</dt><dd>{tutorial.estimated_minutes} minutes</dd></div>
          <div><dt>Primary mode</dt><dd>Tutorial · guided synthetic practice</dd></div>
          <div><dt>Status</dt><dd>{tutorial.review_status}</dd></div>
          <div><dt>Finished artifact</dt><dd>{tutorial.completion_artifact.title}</dd></div>
        </dl>
        <h3>Prerequisites</h3>
        <ul>{tutorial.prerequisites.map((item) => <li key={item}>{item}</li>)}</ul>
        <h3>Learning objectives</h3>
        <ul className="check-list">{tutorial.learning_objectives.map((item) => <li key={item}>{item}</li>)}</ul>
        <div className="note note-rule">
          <p>{tutorial.governing_rule.text}</p>
        </div>
        <p className="evidence-label" data-evidence-classification={tutorial.governing_rule.evidence_classification}>
          Evidence classification: editorial recommendation
        </p>
        <p>{tutorial.governing_rule.implication}</p>
      </section>

      <section id="environment">
        <h2>Synthetic environment</h2>
        <p className="evidence-label" data-evidence-classification={tutorial.environment.evidence_classification}>
          Evidence classification: synthetic example · fictional clean-room fixture
        </p>
        <dl className="record-facts">
          <div><dt>Pack</dt><dd><code>{tutorial.environment.pack_id}</code> · version {tutorial.environment.pack_version}</dd></div>
          <div><dt>Workflow</dt><dd><code>{tutorial.environment.workflow_id}</code></dd></div>
          <div><dt>Scope</dt><dd>{tutorial.environment.scope}</dd></div>
          <div><dt>Authority boundary</dt><dd>{tutorial.environment.authority_level}</dd></div>
          <div><dt>Accountable owner</dt><dd>{tutorial.environment.accountable_owner}</dd></div>
        </dl>
        <div className="doc-link-list">
          <Link href="/packs/bank-reconciliation"><strong>Inspect the pack record</strong><span>Fixture, reference output, hard gates, rights, and source basis.</span></Link>
          <a href={tutorial.environment.pack_download_href}><strong>Download the clean-room packs</strong><span>Reopen the unchanged fixture whenever you need a safe reset.</span></a>
          <Link href="/workflows/record-to-report/wf-r2r-bank-reconciliations"><strong>Read the workflow brief</strong><span>Fit, boundary, checks, failure mode, expected artifact, and supervised-pilot limits.</span></Link>
        </div>
        <div className="note">
          <p className="note-title">Safe reset</p>
          <p>{tutorial.environment.safe_reset}</p>
        </div>
      </section>

      <section id="evidence-register">
        <h2>Evidence register</h2>
        <p>Freeze these three fictional records before doing any arithmetic. A source ID identifies support; it does not prove that the support is complete or valid.</p>
        <div className="table-wrap">
          <table>
            <caption>Required synthetic evidence and the claim each record supports</caption>
            <thead><tr><th>Source ID</th><th>Record</th><th>Period</th><th>Supports</th><th>Required check</th></tr></thead>
            <tbody>
              {tutorial.evidence_register.map((item) => (
                <tr id={`evidence-${item.id}`} key={item.id}>
                  <th scope="row"><code>{item.id}</code></th>
                  <td>{item.record}</td>
                  <td>{item.period}</td>
                  <td>{item.supports}</td>
                  <td>{item.required_checks.join(" ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="guided-lesson">
        <h2>Guided lesson</h2>
        <ol className="procedure-list">
          {tutorial.guided_steps.map((step) => (
            <li id={step.id} key={step.id}>
              <h3>{step.title}</h3>
              <p>{step.action}</p>
              <dl>
                <div><dt>Expected result</dt><dd>{step.expected_result}</dd></div>
                <div><dt>Stop when</dt><dd>{step.stop_when}</dd></div>
              </dl>
            </li>
          ))}
        </ol>
      </section>

      <section id="known-answer">
        <h2>Known-answer work</h2>
        <p className="evidence-label" data-evidence-classification={tutorial.known_answer_work.evidence_classification}>
          Known-answer ID: {tutorial.known_answer_work.id} · Evidence classification: synthetic example
        </p>
        <div className="table-wrap">
          <table>
            <caption>Prepared synthetic bank-reconciliation calculation</caption>
            <thead><tr><th>Line</th><th>Operator</th><th className="numeric">Amount</th><th>Source</th></tr></thead>
            <tbody>
              {tutorial.known_answer_work.rows.map((row) => (
                <tr id={row.id} key={row.id}>
                  <th scope="row">{row.label}</th>
                  <td>{row.operator}</td>
                  <td className="numeric">{money.format(row.amount)}</td>
                  <td><code>{row.source_id}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p><strong>Equation:</strong> <code>{tutorial.known_answer_work.equation}</code></p>
        <div className="note note-warning">
          <p className="note-title">What the zero does not prove</p>
          <p>{tutorial.known_answer_work.interpretation}</p>
        </div>
      </section>

      <section id="deliberate-stop">
        <h2>Deliberate missing-evidence stop</h2>
        <p className="evidence-label" data-evidence-classification={tutorial.deliberate_stop.evidence_classification}>
          Case ID: {tutorial.deliberate_stop.id} · Expected outcome: stop
        </p>
        <h3>Change the fixture</h3>
        <ol>{tutorial.deliberate_stop.mutations.map((item) => <li key={item}>{item}</li>)}</ol>
        <h3>Correct result</h3>
        <div className="note note-warning">
          <p><strong>{tutorial.deliberate_stop.exception_codes.join(" + ")}</strong></p>
          <p>{tutorial.deliberate_stop.learner_record}</p>
        </div>
        <p>Minimum retained evidence links: {tutorial.deliberate_stop.minimum_evidence_links}. Executed actions: {tutorial.deliberate_stop.executed_actions.length}.</p>
        <h3>Claims the evidence no longer supports</h3>
        <ul>{tutorial.deliberate_stop.prevented_claims.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>

      <section id="workpaper">
        <h2>Prepared workpaper</h2>
        <dl className="record-facts">
          <div><dt>Artifact</dt><dd><code>{tutorial.prepared_workpaper.id}</code> · version {tutorial.prepared_workpaper.version}</dd></div>
          <div><dt>Status</dt><dd>{tutorial.prepared_workpaper.status}</dd></div>
          <div><dt>Conclusion status</dt><dd>{tutorial.prepared_workpaper.conclusion_status}</dd></div>
          <div><dt>Executed actions</dt><dd>{tutorial.prepared_workpaper.executed_actions.length}</dd></div>
        </dl>
        <h3>Required sections</h3>
        <ul className="check-list">{tutorial.prepared_workpaper.required_sections.map((item) => <li key={item}>{item}</li>)}</ul>
        <div className="baseline-columns">
          <article>
            <h3>Proposed</h3>
            <ul>{tutorial.prepared_workpaper.proposed_actions.map((item) => <li key={item}>{item}</li>)}</ul>
          </article>
          <article>
            <h3>Prohibited</h3>
            <ul>{tutorial.prepared_workpaper.prohibited_actions.map((item) => <li key={item}>{item}</li>)}</ul>
          </article>
        </div>
        <p><strong>Re-review trigger:</strong> {tutorial.prepared_workpaper.re_review_triggers.join(" ")}</p>
      </section>

      <section id="review">
        <h2>Reviewer challenge and disposition</h2>
        <p>Review the frozen packet, not the fluency of its prose or the apparent neatness of its zero difference.</p>
        <ol>{tutorial.reviewer_packet.challenge_questions.map((item) => <li key={item}>{item}</li>)}</ol>
        <div className="baseline-columns">
          <article>
            <p className="eyebrow">Complete fixture</p>
            <h3>Approve the training artifact</h3>
            <p><strong>Scope:</strong> {tutorial.reviewer_packet.complete_fixture_disposition.scope}</p>
            <p><strong>Rationale:</strong> {tutorial.reviewer_packet.complete_fixture_disposition.rationale}</p>
            <p><strong>Condition:</strong> {tutorial.reviewer_packet.complete_fixture_disposition.conditions.join(" ")}</p>
            <p><strong>Separately authorized actions:</strong> {tutorial.reviewer_packet.complete_fixture_disposition.separately_authorized_actions.length}</p>
          </article>
          <article>
            <p className="eyebrow">Missing and wrong-period evidence</p>
            <h3>Reject the conclusion</h3>
            <p><strong>Scope:</strong> {tutorial.reviewer_packet.deliberate_stop_disposition.scope}</p>
            <p><strong>Rationale:</strong> {tutorial.reviewer_packet.deliberate_stop_disposition.rationale}</p>
            <p><strong>Condition:</strong> {tutorial.reviewer_packet.deliberate_stop_disposition.conditions.join(" ")}</p>
            <p><strong>Separately authorized actions:</strong> {tutorial.reviewer_packet.deliberate_stop_disposition.separately_authorized_actions.length}</p>
          </article>
        </div>
        <p><Link href="/reviewer-guide">Use the full reviewer field guide</Link> for the eight-step procedure, all four dispositions, packet fields, bias traps, and calibration cases.</p>
      </section>

      <section id="knowledge-check">
        <h2>Knowledge check</h2>
        <p>Choose one answer for each question. Answers stay in this browser tab; the site does not save or transmit them.</p>
        <KnowledgeCheck
          questions={tutorial.knowledge_check}
          completionId={tutorial.completion_artifact.id}
          completionTitle={tutorial.completion_artifact.title}
          completionStatements={tutorial.completion_artifact.statements}
          interpretationBoundary={tutorial.completion_artifact.interpretation_boundary}
          completionLabel="Lesson complete."
        />
      </section>

      <section id="transfer">
        <h2>Transfer limits</h2>
        <ul>{tutorial.transfer_limits.map((item) => <li key={item}>{item}</li>)}</ul>
        <h3>Limitations</h3>
        <ul>{tutorial.limitations.map((item) => <li key={item}>{item}</li>)}</ul>
        <h3>Primary and project sources</h3>
        <ul>
          {tutorial.source_basis.map((source) => (
            <li key={source.id}>
              <a href={source.href}>{source.title}</a> — {source.supports} <em>{source.applicability}</em>
            </li>
          ))}
        </ul>
        <p><strong>Next action:</strong> {tutorial.next_action}</p>
        <p className="source-reference-note">
          Editorial content: {tutorial.rights.editorial_content}. Synthetic fixture and factual metadata: {tutorial.rights.synthetic_fixture_and_factual_metadata}. {tutorial.rights.external_sources}
        </p>
      </section>
    </DocsShell>
  );
}
