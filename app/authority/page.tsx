import Link from "next/link";
import { DocsShell } from "../DocsShell";
import { AuthorityTag, BulletList, SourceReferences } from "../DomainRecords";
import { authorityDecisionGuide, authorityLevels, corpusReviewedAt } from "../domain-model";
import { docsMetadata } from "../docsMetadata";

const guide = authorityDecisionGuide;
const description = "Classify one accounting-agent action from explanation through constrained execution or human-only responsibility, then apply the required approval and segregation of duties.";

export const metadata = {
  ...docsMetadata("Authority ladder and decision tree", description, "/authority"),
  alternates: {
    canonical: "/authority",
    types: { "application/json": "/api/v1/authority-levels", "text/markdown": "/authority-levels.md" },
  },
};

export default function AuthorityPage() {
  return (
    <DocsShell
      active="/authority"
      category="Learn"
      title="Authority ladder and decision tree"
      description={description}
      reviewedAt={guide.prepared_at}
      trustDateLabel="Prepared"
      reviewStatus="Maintainer review pending; subject-matter, independent, or professional review is not claimed"
      jsonHref="/api/v1/authority-levels"
      markdownHref="/authority-levels.md"
      toc={[
        { href: "#outcome", label: "Reader outcome" },
        { href: "#model", label: "Authority ladder" },
        { href: "#decision-tree", label: "Decision tree" },
        { href: "#execution-boundary", label: "A3, A4, human-only" },
        { href: "#mixed-workflow", label: "Mixed-level workflow" },
        { href: "#misclassifications", label: "Misclassifications" },
        { href: "#segregation", label: "Segregation of duties" },
        { href: "#sensitive-examples", label: "Sensitive actions" },
        { href: "#sources", label: "Source basis" },
      ]}
      previous={{ href: "/coverage", label: "Coverage and gaps" }}
      next={{ href: "/reviewer-guide", label: "Reviewer field guide" }}
    >
      <section id="outcome">
        <h2>Classify one action, not an entire agent</h2>
        <p>{guide.intended_audience}</p>
        <dl className="record-facts">
          <div><dt>Guide ID</dt><dd><code id={guide.id}>{guide.id}</code> · version {guide.version}</dd></div>
          <div><dt>Prerequisites</dt><dd>{guide.prerequisites.join(" ")}</dd></div>
          <div><dt>Expected outcome</dt><dd>{guide.expected_outcome}</dd></div>
          <div><dt>Primary mode</dt><dd>Reference</dd></div>
        </dl>
        <div className="note note-rule">
          <p>{guide.operating_rule.text}</p>
        </div>
        <p className="evidence-label" data-evidence-classification={guide.operating_rule.evidence_classification}>
          Evidence classification: Editorial recommendation
        </p>
      </section>

      <section id="model">
        <h2>The authority ladder</h2>
        <p>
          The level describes the smallest proposed action and its permitted effect.
          A single workflow may move through several levels; no level turns an agent
          into an approver, signer, certifier, or fiduciary.
        </p>
        <div className="authority-level-list">
          {authorityLevels.map((level) => (
            <article id={`level-${level.id}`} key={level.id}>
              <div className="record-heading-row">
                <h3>{level.label}</h3>
                <AuthorityTag level={level.id} />
              </div>
              <p>{level.agent_role}</p>
              <dl className="record-facts">
                <div><dt>Execution rule</dt><dd>{level.execution_rule}</dd></div>
                <div><dt>Accounting example</dt><dd>{level.accounting_example}</dd></div>
                <div><dt>Boundary</dt><dd>{level.boundary}</dd></div>
              </dl>
              <h4>Required controls</h4>
              <BulletList items={level.required_controls} />
            </article>
          ))}
        </div>
      </section>

      <section id="decision-tree">
        <h2>Decision tree</h2>
        <p>
          Start at step 1. Follow the stated branch until it assigns a level or
          tells you to stop. Confidence, fluency, or prior success never changes
          the result.
        </p>
        <ol className="authority-decision-tree">
          {guide.decision_steps.map((step, index) => (
            <li id={step.id} key={step.id}>
              <span className="record-number">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3>{step.question}</h3>
                <p>{step.why_it_matters}</p>
                <dl className="authority-branches">
                  <div data-outcome-kind={step.yes.kind}>
                    <dt>Yes</dt><dd>{step.yes.label}</dd>
                  </div>
                  <div data-outcome-kind={step.no.kind}>
                    <dt>No</dt><dd>{step.no.label}</dd>
                  </div>
                </dl>
              </div>
            </li>
          ))}
        </ol>
        <h3>Stop instead of guessing</h3>
        <BulletList items={[...guide.stop_conditions]} />
      </section>

      <section id="execution-boundary">
        <h2>A3, A4, and human-only are different boundaries</h2>
        <div className="table-wrap">
          <table>
            <caption>Constrained execution, policy execution, and human-owned responsibility</caption>
            <thead><tr><th>Level</th><th>Entry condition</th><th>Decision owner</th><th>Permitted effect</th><th>Accounting example</th><th>Stop when</th></tr></thead>
            <tbody>
              {guide.execution_comparison.map((item) => (
                <tr id={item.id} key={item.id}>
                  <th scope="row"><AuthorityTag level={item.level_id} /></th>
                  <td>{item.entry_condition}</td>
                  <td>{item.decision_owner}</td>
                  <td>{item.permitted_effect}</td>
                  <td>{item.accounting_example}</td>
                  <td>{item.stop_when}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Identity, permission, approval state, payload integrity, limits,
          idempotency, and prohibited actions must be enforced outside the model.
          A prompt is not an authorization control.
        </p>
      </section>

      <section id="mixed-workflow">
        <h2>{guide.mixed_level_workflow.title}</h2>
        <p id={guide.mixed_level_workflow.id} className="evidence-label" data-evidence-classification={guide.mixed_level_workflow.evidence_classification}>
          Scenario ID: {guide.mixed_level_workflow.id} · Evidence classification: Synthetic example · fictional clean-room scenario
        </p>
        <p>{guide.mixed_level_workflow.context}</p>
        <ol className="authority-mixed-workflow">
          {guide.mixed_level_workflow.actions.map((item, index) => (
            <li id={item.id} key={item.id}>
              <span className="record-number">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <div className="record-heading-row"><h3>{item.action}</h3><AuthorityTag level={item.level_id} /></div>
                <p>{item.why}</p>
                <small>{item.accountable_person}</small>
              </div>
            </li>
          ))}
        </ol>
        <div className="note">
          <p className="note-title">Finished artifact</p>
          <p>{guide.mixed_level_workflow.finished_artifact}</p>
        </div>
      </section>

      <section id="misclassifications">
        <h2>Common misclassifications</h2>
        <div className="table-wrap">
          <table>
            <caption>Claims that overstate or blur agent authority</caption>
            <thead><tr><th>Mistaken claim</th><th>Correction</th></tr></thead>
            <tbody>
              {guide.common_misclassifications.map((item) => (
                <tr id={item.id} key={item.id}>
                  <th scope="row">{item.mistaken_claim}</th>
                  <td>{item.correction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="segregation">
        <h2>Segregation-of-duties comparisons</h2>
        <div className="record-subsections authority-sod-grid">
          {guide.segregation_of_duties_examples.map((item) => (
            <article id={item.id} key={item.id}>
              <h3>Unsafe combination</h3>
              <p>{item.unsafe_combination}</p>
              <h4>Safer design</h4>
              <p>{item.safer_design}</p>
              <small>{item.principle}</small>
            </article>
          ))}
        </div>
      </section>

      <section id="sensitive-examples">
        <h2>Apply the result to sensitive actions</h2>
        <p>
          The level does not replace the action-specific limits, approval
          evidence, identity checks, rollback, or retained record.
        </p>
        <div className="doc-link-list">
          {guide.sensitive_action_mappings.map((item) => (
            <Link href={item.href} id={item.id} key={item.id}>
              <strong>{item.sensitive_action_id}</strong>
              <span>{item.rule}</span>
            </Link>
          ))}
        </div>
        <p>
          Continue with the <Link href="/control-model">Accounting Agent Control Model</Link> to
          record the authority decision alongside objective, scope, evidence,
          procedure, checks, review, action, and retained record.
        </p>
      </section>

      <section id="sources">
        <h2>Limitations, source basis, and next action</h2>
        <ul>{guide.limitations.map((item) => <li key={item}>{item}</li>)}</ul>
        <p className="evidence-label" data-evidence-classification="authoritative-requirement">
          Evidence classification: Authoritative requirements with explicit applicability boundaries
        </p>
        <p>
          The A0–A4 labels are an Accounting Agents editorial model, reviewed
          {" "}{corpusReviewedAt}. They translate established control, authorization,
          evidence, and accountability principles into an implementation aid;
          no cited organization has adopted these labels as a standard.
        </p>
        <SourceReferences ids={["src_075usnq", "src_1v1zwt5", "src_gaogb25", "src_0pywo86"]} />
        <p>{guide.next_action}</p>
        <p>{guide.review_note}</p>
      </section>
    </DocsShell>
  );
}
