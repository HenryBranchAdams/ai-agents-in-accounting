import Link from "next/link";
import { DocsShell } from "../DocsShell";
import { docsMetadata } from "../docsMetadata";
import {
  accountingAgentReviewerGuide,
  type ReviewerDisposition,
} from "../reviewer-guide";

const guide = accountingAgentReviewerGuide;

export const metadata = {
  ...docsMetadata(guide.title, guide.description, "/reviewer-guide"),
  alternates: {
    canonical: "/reviewer-guide",
    types: {
      "text/markdown": "/reviewer-guide.md",
      "application/json": "/api/v1/reviewer-guide",
    },
  },
};

const classificationLabels = {
  "authoritative-requirement": "Authoritative requirement",
  "official-guidance": "Official guidance",
  "editorial-recommendation": "Editorial recommendation",
  "implementation-pattern": "Implementation pattern",
  "synthetic-example": "Synthetic example",
  "empirical-evidence": "Empirical evidence",
  "unresolved-question": "Unresolved question",
} as const;

const dispositionLabels: Record<ReviewerDisposition, string> = {
  approve: "Approve",
  "modify-and-resubmit": "Modify and resubmit",
  reject: "Reject",
  escalate: "Escalate",
};

export default function ReviewerGuidePage() {
  return (
    <DocsShell
      active="/reviewer-guide"
      category="Govern"
      title={guide.title}
      description={guide.description}
      reviewedAt={guide.prepared_at}
      trustDateLabel="Prepared"
      reviewStatus="Maintainer review pending; subject-matter, independent, or professional review is not claimed"
      markdownHref="/reviewer-guide.md"
      jsonHref="/api/v1/reviewer-guide"
      toc={[
        { href: "#outcome", label: "Outcome and inputs" },
        { href: "#procedure", label: "Review procedure" },
        { href: "#dispositions", label: "Dispositions" },
        { href: "#packet", label: "Reviewer packet" },
        { href: "#bias", label: "Bias traps" },
        { href: "#examples", label: "Examples" },
        { href: "#calibration", label: "Calibration" },
        { href: "#review-program", label: "Review states" },
        { href: "#sources", label: "Sources and limits" },
      ]}
      previous={{ href: "/authority", label: "Authority ladder and decision tree" }}
      next={{ href: "/control-model", label: "Accounting Agent Control Model" }}
    >
      <section id="outcome">
        <h2>Produce a defensible review record</h2>
        <p>{guide.intended_audience}</p>
        <dl className="record-facts">
          <div><dt>Guide ID</dt><dd><code id={guide.id}>{guide.id}</code> · version {guide.version}</dd></div>
          <div><dt>Use when</dt><dd>{guide.use_when}</dd></div>
          <div><dt>Expected outcome</dt><dd>{guide.reader_outcome}</dd></div>
          <div><dt>Primary mode</dt><dd>How-to</dd></div>
        </dl>
        <h3>Prerequisites</h3>
        <ul className="check-list">
          {guide.prerequisites.map((item) => <li key={item}>{item}</li>)}
        </ul>
        <h3>Required inputs</h3>
        <ul className="check-list">
          {guide.required_inputs.map((item) => <li key={item}>{item}</li>)}
        </ul>
        <div className="note note-rule" id={guide.governing_rule.id}>
          <p>{guide.governing_rule.text}</p>
        </div>
        <p className="evidence-label" data-evidence-classification={guide.governing_rule.evidence_classification}>
          Evidence classification: {classificationLabels[guide.governing_rule.evidence_classification]}
        </p>
        <p>{guide.governing_rule.implication}</p>
      </section>

      <section id="procedure">
        <h2>Review in eight ordered steps</h2>
        <p>
          Begin with scope and packet identity. Challenge evidence before the
          proposed narrative, then record a disposition that applies only to the
          reviewed version and named decision.
        </p>
        <ol className="review-sequence">
          {guide.review_sequence.map((step, index) => (
            <li id={step.id} key={step.id}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3>{step.label}</h3>
                <p>{step.action}</p>
                <h4>Challenge</h4>
                <ul>
                  {step.challenge_questions.map((question) => <li key={question}>{question}</li>)}
                </ul>
                <dl className="review-branches">
                  <div data-outcome-kind="proceed"><dt>Proceed when</dt><dd>{step.proceed_when}</dd></div>
                  <div data-outcome-kind="stop"><dt>Stop when</dt><dd>{step.stop_when}</dd></div>
                </dl>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section id="dispositions">
        <h2>Choose and record one disposition</h2>
        <div className="table-wrap">
          <table>
            <caption>Approve, modify and resubmit, reject, or escalate</caption>
            <thead><tr><th>Disposition</th><th>Use when</th><th>Minimum record</th></tr></thead>
            <tbody>
              {guide.disposition_guide.map((item) => (
                <tr id={item.id} key={item.id}>
                  <th scope="row">{dispositionLabels[item.disposition]}</th>
                  <td>{item.use_when}</td>
                  <td>{item.record}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h3>Stop instead of clearing the item</h3>
        <ul className="check-list review-stop-list">
          {guide.stop_conditions.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </section>

      <section id="packet">
        <h2>Minimum reviewer packet</h2>
        <p>
          The packet is the decision interface. A concise packet can still be
          complete; a long packet can still hide the population, exceptions, or
          exact proposed effect.
        </p>
        <div className="table-wrap">
          <table>
            <caption>Fields and challenge questions for a minimum reviewer packet</caption>
            <thead><tr><th>Field</th><th>Reviewer challenge</th></tr></thead>
            <tbody>
              {guide.minimum_reviewer_packet.map((item) => (
                <tr id={item.id} key={item.id}>
                  <th scope="row">{item.field}</th>
                  <td>{item.challenge}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Use the canonical <Link href="/templates#tpl-reviewer-packet">workpaper and reviewer-packet template</Link> to
          carry these fields into a reusable record.
        </p>
      </section>

      <section id="bias">
        <h2>Counter common automation-bias traps</h2>
        <div className="review-card-grid">
          {guide.automation_bias_traps.map((item) => (
            <article id={item.id} key={item.id}>
              <h3>{item.trap}</h3>
              <p>{item.countermeasure}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="examples">
        <h2>Completed and failure examples</h2>
        <p className="evidence-label" data-evidence-classification="synthetic-example">
          Evidence classification: Synthetic example · every organization, record, amount, and review event below is fictional clean-room data
        </p>
        <div className="review-example-list">
          {guide.worked_examples.map((example) => (
            <article id={example.id} key={example.id}>
              <header>
                <div>
                  <span className="status-label">{dispositionLabels[example.disposition]}</span>
                  <h3>{example.label}</h3>
                </div>
                <small>{example.domain}</small>
              </header>
              <dl className="record-facts">
                <div><dt>Facts</dt><dd>{example.facts}</dd></div>
                <div><dt>Challenge</dt><dd>{example.challenge}</dd></div>
                <div><dt>Disposition</dt><dd>{dispositionLabels[example.disposition]}</dd></div>
                <div><dt>Review record</dt><dd>{example.record}</dd></div>
                <div><dt>Why</dt><dd>{example.why}</dd></div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      <section id="calibration">
        <h2>Short reviewer calibration</h2>
        <p>
          Choose a disposition before opening each answer. The exercise checks
          the reasoning boundary; it does not establish reviewer competence or
          authority.
        </p>
        <ol className="review-calibration">
          {guide.calibration_exercise.map((item, index) => (
            <li key={item.id}>
              <details id={item.id}>
                <summary><span>{String(index + 1).padStart(2, "0")}</span><strong>{item.domain}</strong> — {item.prompt}</summary>
                <ul>
                  {item.options.map((option) => <li key={option.id}>{option.label}</li>)}
                </ul>
                <div className="note">
                  <p className="note-title">Answer: {dispositionLabels[item.correct_option_id]}</p>
                  <p>{item.rationale}</p>
                </div>
              </details>
            </li>
          ))}
        </ol>
      </section>

      <section id="review-program">
        <h2>Visible review states without invented assurance</h2>
        <p>{guide.review_program_scaffold.claim_boundary}</p>
        <p className="evidence-label" data-evidence-classification={guide.review_program_scaffold.evidence_classification}>
          Scaffold ID: {guide.review_program_scaffold.id} · Evidence classification: {classificationLabels[guide.review_program_scaffold.evidence_classification]} · approval status: maintainer approval required
        </p>
        <div className="review-program-grid">
          <article>
            <h3>Qualifications and appointment</h3>
            <ul>
              {guide.review_program_scaffold.qualification_fields.map((item) => <li key={item}>{item}</li>)}
            </ul>
            <h4>Appointment record</h4>
            <ul>
              {guide.review_program_scaffold.appointment_fields.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </article>
          <article>
            <h3>Conflicts and re-review</h3>
            <ul>
              {guide.review_program_scaffold.conflict_questions.map((item) => <li key={item}>{item}</li>)}
            </ul>
            <h4>Re-review triggers</h4>
            <ul>
              {guide.review_program_scaffold.re_review_triggers.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </article>
        </div>
        <div className="table-wrap">
          <table>
            <caption>Proposed, appointed, completed, expired, superseded, and unavailable review states</caption>
            <thead><tr><th>State</th><th>Meaning</th><th>Allowed claim</th></tr></thead>
            <tbody>
              {guide.review_program_scaffold.review_states.map((item) => (
                <tr id={item.id} key={item.id}>
                  <th scope="row">{item.state}</th>
                  <td>{item.meaning}</td>
                  <td>{item.allowed_claim}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="note note-warning">
          <p className="note-title">Current project claim state: {guide.review_program_scaffold.current_project_claim_state.state}</p>
          <p>{guide.review_program_scaffold.current_project_claim_state.note}</p>
        </div>
      </section>

      <section id="sources">
        <h2>Related material, limitations, and source basis</h2>
        <div className="doc-link-list">
          {guide.related_material.map((item) => (
            <Link href={item.href} id={item.id} key={item.id}>
              <strong>{item.label}</strong>
              <span>{item.kind}</span>
            </Link>
          ))}
        </div>
        <h3>Limitations</h3>
        <ul>{guide.limitations.map((item) => <li key={item}>{item}</li>)}</ul>
        <p>{guide.next_action}</p>
        <h3>Primary-source basis</h3>
        <p>
          The procedure above is an Accounting Agents implementation pattern.
          The sources below have explicit applicability boundaries and do not
          convert this guide into an audit standard or professional review.
        </p>
        <ul className="source-reference-list">
          {guide.source_basis.map((source) => (
            <li key={source.id}>
              <Link href={source.href}>{source.title}</Link>
              <span data-evidence-classification={source.evidence_classification}>{classificationLabels[source.evidence_classification]}</span>
              <p className="source-reference-note">{source.scope}</p>
            </li>
          ))}
        </ul>
        <p>{guide.review_note}</p>
      </section>
    </DocsShell>
  );
}
