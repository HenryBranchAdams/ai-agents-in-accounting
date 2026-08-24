import { DocsShell } from "../DocsShell";
import { BulletList, SourceReferences } from "../DomainRecords";
import { docsMetadata } from "../docsMetadata";
import { controlPatterns } from "../governance-data";

const description = "Design agent identity, least-privilege tools, segregation of duties, data boundaries, and deterministic authorization for accounting work.";

export const metadata = docsMetadata("Security and identity", description, "/security-identity");

const securityControls = controlPatterns.filter((control) => [
  "ctrl-tool-authorization",
  "ctrl-human-approval",
  "ctrl-segregation-duties",
  "ctrl-data-governance",
  "ctrl-third-party-risk",
  "ctrl-incident-response",
].includes(control.id));

const sourceIds = [...new Set(securityControls.flatMap((control) => control.source_ids))];

export default function SecurityIdentityPage() {
  return (
    <DocsShell
      active="/security-identity"
      category="Govern"
      title="Security and identity"
      description={description}
      toc={[
        { href: "#identity", label: "Identity model" },
        { href: "#authorization", label: "Authorization path" },
        { href: "#sod", label: "Segregation of duties" },
        { href: "#data", label: "Data and secrets" },
        { href: "#patterns", label: "Security controls" },
      ]}
      previous={{ href: "/evidence-assurance", label: "Evidence and assurance" }}
      next={{ href: "/architecture", label: "System architecture" }}
    >
      <section id="identity">
        <h2>Give the system its own attributable identity</h2>
        <p>
          An accounting agent should act as a non-human workload with an
          identifiable owner, workflow, environment, and permission set. It
          should not borrow a person&apos;s session, API key, mailbox, signer
          credential, or approval authority.
        </p>
        <dl className="term-list">
          <div><dt>Workload identity</dt><dd>Identifies the deployed service, agent, and environment for every request.</dd></div>
          <div><dt>Human identity</dt><dd>Identifies the requester, reviewer, approver, or operator and their current authority.</dd></div>
          <div><dt>Workflow identity</dt><dd>Binds activity to an approved objective, version, entity, period, and run.</dd></div>
          <div><dt>Tool identity</dt><dd>Identifies the constrained interface and records the policy decision for each call.</dd></div>
        </dl>
        <div className="note">
          <p className="note-title">A model is not a principal</p>
          <p>
            The surrounding system authenticates the workload, assigns scope,
            evaluates policy, and records the actor. Never treat fluent text as
            proof of identity, permission, or approval.
          </p>
        </div>
      </section>

      <section id="authorization">
        <h2>Authorize every tool call</h2>
        <ol className="numbered-records">
          <li><strong>Authenticate.</strong><span>Verify workload and human identities using current, non-shared credentials.</span></li>
          <li><strong>Bind context.</strong><span>Attach workflow, run, entity, period, purpose, data classification, and requested action.</span></li>
          <li><strong>Evaluate policy.</strong><span>Check allowed tool, fields, records, amount, time, authority level, and segregation conflicts.</span></li>
          <li><strong>Verify approval.</strong><span>For A3, authenticate the approver and match the exact, unexpired payload.</span></li>
          <li><strong>Execute narrowly.</strong><span>Use field-level permissions, idempotency, transaction limits, and deny-by-default behavior.</span></li>
          <li><strong>Record and reconcile.</strong><span>Log the decision and result, compare it with the approved intent, and route differences.</span></li>
        </ol>
        <div className="note note-warning">
          <p className="note-title">The prompt is not the policy engine</p>
          <p>
            A prompt may explain the rule to the model. Only deterministic
            authorization can reliably enforce identity, scope, amount,
            approval state, payload integrity, and prohibited actions.
          </p>
        </div>
      </section>

      <section id="sod">
        <h2>Preserve segregation of duties</h2>
        <p>
          Agents can collapse roles accidentally when a single tool bundle can
          request, maintain master data, approve, execute, reconcile, and delete
          evidence. Map incompatible responsibilities at the action level and
          enforce them across human and non-human identities.
        </p>
        <div className="table-wrap">
          <table>
            <caption className="sr-only">Segregation-of-duties conflicts and enforcement examples</caption>
            <thead><tr><th>Responsibility</th><th>Conflict to prevent</th><th>Example enforcement</th></tr></thead>
            <tbody>
              <tr><th scope="row">Request</th><td>Requesting and approving the same action</td><td>Independent approver role and policy decision</td></tr>
              <tr><th scope="row">Master data</th><td>Changing beneficiary data and releasing payment</td><td>Separate tools, identities, and verification evidence</td></tr>
              <tr><th scope="row">Preparation</th><td>Preparing and finally approving accounting work</td><td>Named reviewer with no model-delegated approval</td></tr>
              <tr><th scope="row">Execution</th><td>Executing and concealing an unauthorized effect</td><td>Immutable logs and independent reconciliation</td></tr>
              <tr><th scope="row">Assessment</th><td>Performing a control and assessing its own effectiveness</td><td>Independent human evaluator and retained exceptions</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="data">
        <h2>Limit data, secrets, and persistence</h2>
        <ul className="check-list">
          <li>Classify data before use and restrict collection to the approved accounting purpose.</li>
          <li>Prefer scoped connectors or short-lived tokens over copied credentials and broad exports.</li>
          <li>Minimize fields, redact unnecessary personal data, and isolate entities and environments.</li>
          <li>Define provider use, location, retention, training, subprocessors, export, and deletion terms.</li>
          <li>Keep secrets out of prompts, traces, workpapers, evaluation sets, and reviewer packets.</li>
          <li>Honor accounting-record retention, privacy obligations, investigations, and legal holds together.</li>
          <li>Test revocation, tool denial, provider outage, compromise, data export, and exit procedures.</li>
        </ul>
      </section>

      <section id="patterns">
        <h2>Security control patterns</h2>
        <div className="control-pattern-list compact-record-list">
          {securityControls.map((control) => (
            <article key={control.id}>
              <h3>{control.name}</h3>
              <p>{control.objective}</p>
              <dl className="record-facts">
                <div><dt>Risk</dt><dd>{control.risk}</dd></div>
                <div><dt>Owner</dt><dd>{control.owner}</dd></div>
                <div><dt>Frequency</dt><dd>{control.frequency}</dd></div>
              </dl>
              <h4>Procedure</h4>
              <BulletList items={control.procedure} />
              <h4>Exceptions</h4>
              <BulletList items={control.exceptions} />
            </article>
          ))}
        </div>
        <h3>Primary source basis</h3>
        <SourceReferences ids={sourceIds} />
      </section>
    </DocsShell>
  );
}
