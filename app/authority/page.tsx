import { DocsShell } from "../DocsShell";
import { AuthorityTag, BulletList, SourceReferences } from "../DomainRecords";
import { authorityLevels, corpusReviewedAt } from "../domain-model";
import { docsMetadata } from "../docsMetadata";

const description = "Assign each agent action an explicit level from explanation through constrained execution or human-only responsibility.";

export const metadata = {
  ...docsMetadata("Authority levels", description, "/authority"),
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
      title="Authority levels"
      description={description}
      jsonHref="/api/v1/authority-levels"
      markdownHref="/authority-levels.md"
      toc={[
        { href: "#model", label: "Authority model" },
        { href: "#assignment", label: "Assign a level" },
        { href: "#enforcement", label: "Enforce outside the model" },
        { href: "#sources", label: "Source basis" },
      ]}
      previous={{ href: "/coverage", label: "Coverage and gaps" }}
      next={{ href: "/workflows", label: "All workflows" }}
    >
      <section id="model">
        <h2>One model for every workflow</h2>
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

      <section id="assignment">
        <h2>Assign the smallest action</h2>
        <p>
          Do not label an entire agent “A3” or “autonomous.” Break the workflow
          into actions. Reading a ledger may be A1, recommending an entry A2,
          submitting an approved staging payload A3, and final approval
          human-only.
        </p>
        <p>
          Consider reversibility, materiality, external effect, segregation of
          duties, legal accountability, evidence quality, and the system&apos;s
          ability to enforce a precise limit.
        </p>
      </section>

      <section id="enforcement">
        <h2>Enforce outside the model</h2>
        <div className="note">
          <p className="note-title">A prompt is not an authorization control</p>
          <p>
            Identity, permission, approval state, payload integrity, amount,
            entity, period, tool scope, idempotency, and prohibited actions must
            be checked by deterministic systems before execution.
          </p>
        </div>
        <p>
          See <a href="/sensitive-actions">Sensitive actions</a> for the
          operating pattern applied to posting, payments, filings, deletion,
          approval, certification, and company communications.
        </p>
      </section>

      <section id="sources">
        <h2>Source and review basis</h2>
        <p>
          The A0–A4 labels are an Accounting Agents editorial model, reviewed
          {" "}{corpusReviewedAt}. They translate established control, authorization,
          evidence, and accountability principles into an implementation aid;
          no cited organization has adopted these labels as a standard.
        </p>
        <SourceReferences ids={["src_075usnq", "src_1v1zwt5", "src_gaogb25", "src_0pywo86"]} />
      </section>
    </DocsShell>
  );
}
