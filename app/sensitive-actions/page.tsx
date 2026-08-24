import { DocsShell } from "../DocsShell";
import { AuthorityTag, BulletList, SourceReferences } from "../DomainRecords";
import { docsMetadata } from "../docsMetadata";
import { sensitiveActions } from "../governance-data";

const description = "Govern posting, cash movement, filings, deletion, master data, credits, approvals, certification, close activity, and company communications.";

export const metadata = {
  ...docsMetadata("Sensitive actions", description, "/sensitive-actions"),
  alternates: {
    canonical: "/sensitive-actions",
    types: { "application/json": "/api/v1/sensitive-actions", "text/markdown": "/sensitive-actions.md" },
  },
};

export default function SensitiveActionsPage() {
  return (
    <DocsShell
      active="/sensitive-actions"
      category="Govern"
      title="Sensitive actions"
      description={description}
      jsonHref="/api/v1/sensitive-actions"
      markdownHref="/sensitive-actions.md"
      toc={[
        { href: "#rule", label: "Operating rule" },
        { href: "#catalog", label: "Action catalog" },
        { href: "#approval", label: "Approval design" },
        { href: "#human-owned", label: "Human-owned acts" },
      ]}
      previous={{ href: "/controls", label: "Controls and authority" }}
      next={{ href: "/evidence-assurance", label: "Evidence and assurance" }}
    >
      <section id="rule">
        <h2>Constrain the action, not only the answer</h2>
        <p>
          A sensitive action has a material, irreversible, externally
          attributable, fiduciary, legal, privacy, security, or certification
          consequence. Model confidence does not authorize the action. Identity,
          limits, approval, payload integrity, and post-action reconciliation
          must be enforced by systems outside the model.
        </p>
        <div className="note note-rule">
          <p>
            Use A3 only for one constrained action after approval of the exact
            payload. Keep final approval, legal attestation, fiduciary authority,
            and professional or ICFR certification human-owned.
          </p>
        </div>
      </section>

      <section id="catalog">
        <h2>Action catalog</h2>
        <p>
          Each record separates preparation from execution, states when a human
          must act, and defines the evidence needed before and after execution.
        </p>
        <nav className="in-page-index" aria-label="Sensitive action records">
          {sensitiveActions.map((action) => (
            <a href={`#${action.id}`} key={action.id}>{action.name}</a>
          ))}
        </nav>
        <div className="governance-record-list">
          {sensitiveActions.map((action, index) => (
            <article id={action.id} key={action.id}>
              <header className="record-heading-row">
                <div>
                  <span className="record-number">{String(index + 1).padStart(2, "0")}</span>
                  <h3>{action.name}</h3>
                </div>
                <AuthorityTag level={action.default_authority} prefix="Default" />
              </header>
              <p>{action.summary}</p>
              <div className="record-subsections">
                <div>
                  <h4>Agent may prepare</h4>
                  <BulletList items={action.agent_may_prepare} />
                </div>
                <div>
                  <h4>Agent may execute</h4>
                  {action.agent_may_execute.length > 0
                    ? <BulletList items={action.agent_may_execute} />
                    : <p className="empty-value">No execution authority.</p>}
                </div>
                <div>
                  <h4>Human-only conditions</h4>
                  <BulletList items={action.human_only_conditions} />
                </div>
                <div>
                  <h4>Identity and segregation of duties</h4>
                  <BulletList items={action.identity_and_sod} />
                </div>
                <div>
                  <h4>Limits</h4>
                  <BulletList items={action.limits} />
                </div>
                <div>
                  <h4>Approval evidence</h4>
                  <BulletList items={action.approval_evidence} />
                </div>
                <div>
                  <h4>Pre-execution checks</h4>
                  <BulletList items={action.pre_execution_checks} />
                </div>
                <div>
                  <h4>Rollback or compensation</h4>
                  <BulletList items={action.rollback_or_compensation} />
                </div>
                <div>
                  <h4>Logging and review</h4>
                  <BulletList items={action.logging_and_review} />
                </div>
              </div>
              <details className="source-disclosure">
                <summary>Source basis</summary>
                <SourceReferences ids={action.source_ids} />
              </details>
            </article>
          ))}
        </div>
      </section>

      <section id="approval">
        <h2>Approval design</h2>
        <ol className="numbered-records">
          <li><strong>Present the decision.</strong><span>Show evidence, calculation, exceptions, proposed effect, and the exact payload.</span></li>
          <li><strong>Authenticate the person.</strong><span>Confirm the approver&apos;s identity, current role, entity, action, and amount authority.</span></li>
          <li><strong>Bind the payload.</strong><span>Reject any difference between what was approved and what the tool will execute.</span></li>
          <li><strong>Execute once.</strong><span>Use least privilege, idempotency, deterministic policy, and a time-bounded approval.</span></li>
          <li><strong>Reconcile the result.</strong><span>Preserve the receipt, compare it with the approval, and route every difference.</span></li>
        </ol>
      </section>

      <section id="human-owned">
        <h2>Human-owned acts</h2>
        <p>
          The agent may prepare support for an approval or certification, but
          it cannot assume the accountable person&apos;s identity or responsibility.
          Do not infer approval from a prompt, meeting transcript, chat message,
          prior approval, or silence.
        </p>
        <ul className="check-list">
          <li>The accountable person reviews the current evidence and unresolved matters directly.</li>
          <li>The decision is attributable, authenticated, scoped, time-stamped, and preserved.</li>
          <li>The system prevents self-approval, credential delegation, and expansion of authority.</li>
          <li>A later change creates a new decision record; it does not overwrite the prior one.</li>
        </ul>
      </section>
    </DocsShell>
  );
}
