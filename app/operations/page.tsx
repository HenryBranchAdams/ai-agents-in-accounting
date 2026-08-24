import { DocsShell } from "../DocsShell";
import { BulletList, SourceReferences } from "../DomainRecords";
import { docsMetadata } from "../docsMetadata";
import { controlPatterns } from "../governance-data";

const description = "Operate accounting agents with explicit ownership, versioned changes, production signals, pause controls, incident response, correction, and retained evidence.";

export const metadata = docsMetadata("Production operations", description, "/operations");

const operationsControls = controlPatterns.filter((control) => [
  "ctrl-change-management",
  "ctrl-production-monitoring",
  "ctrl-incident-response",
  "ctrl-version-evidence",
  "ctrl-override-monitoring",
].includes(control.id));

const sourceIds = [...new Set(operationsControls.flatMap((control) => control.source_ids))];

export default function OperationsPage() {
  return (
    <DocsShell
      active="/operations"
      category="Implement"
      title="Production operations"
      description={description}
      toc={[
        { href: "#readiness", label: "Production readiness" },
        { href: "#monitoring", label: "Monitoring" },
        { href: "#change", label: "Change management" },
        { href: "#incident", label: "Incident response" },
        { href: "#review", label: "Operating review" },
      ]}
      previous={{ href: "/pilot", label: "Pilot checklist" }}
      next={{ href: "/templates", label: "Templates and checklists" }}
    >
      <section id="readiness">
        <h2>Do not operate what the team cannot stop</h2>
        <p>
          Production begins when real users, records, decisions, or actions can
          depend on the workflow. Before that point, assign owners, freeze the
          approved version, test failure paths, and prove that the team can deny,
          pause, recover, and reconcile the system.
        </p>
        <ul className="check-list">
          <li>Accounting, system, control, security, vendor, and incident owners are named.</li>
          <li>The approved workflow, authority matrix, tools, data, limits, and evaluation results are versioned.</li>
          <li>Write paths are least-privilege, approval-bound, idempotent, observable, and independently reconciled.</li>
          <li>Alerts have thresholds, an on-call owner, response time, escalation path, and pause action.</li>
          <li>Run records, workpapers, approvals, receipts, and source versions meet retention requirements.</li>
          <li>Fallback, provider outage, credential revocation, rollback, correction, and exit procedures have been exercised.</li>
        </ul>
      </section>

      <section id="monitoring">
        <h2>Monitor accounting outcomes and system behavior</h2>
        <div className="table-wrap">
          <table>
            <caption className="sr-only">Production monitoring signals and required responses</caption>
            <thead><tr><th>Signal family</th><th>Examples</th><th>Response</th></tr></thead>
            <tbody>
              <tr><th scope="row">Population</th><td>Untied totals, exclusions, duplicates, incomplete runs</td><td>Stop the run; re-establish source completeness</td></tr>
              <tr><th scope="row">Quality</th><td>Calculation error, unsupported claim, missed exception, rising reviewer rework</td><td>Limit scope; review affected outputs; add regression cases</td></tr>
              <tr><th scope="row">Authority</th><td>Tool denial, approval bypass, payload drift, self-approval, duplicate action</td><td>Pause write path immediately; preserve authorization evidence</td></tr>
              <tr><th scope="row">Accounting</th><td>Unreconciled effect, post-close adjustment, corrected filing, stale open item</td><td>Identify affected records; correct through authorized procedures</td></tr>
              <tr><th scope="row">Operations</th><td>Latency, timeout, retry loop, cost spike, unavailable provider, failed receipt</td><td>Degrade safely, fail closed, and invoke continuity plan</td></tr>
              <tr><th scope="row">Change</th><td>New model, prompt, policy, source, tool, schema, vendor, or jurisdiction</td><td>Reassess and rerun the applicable evaluation gate</td></tr>
            </tbody>
          </table>
        </div>
        <div className="note note-warning">
          <p className="note-title">Pause on control failure</p>
          <p>
            If scope, approval, permission, completeness, payload integrity, or
            reconciliation cannot be established, fail closed and preserve the
            current state. Do not ask the model to reason around a failed control.
          </p>
        </div>
      </section>

      <section id="change">
        <h2>Treat behavior changes as production changes</h2>
        <ol className="numbered-records">
          <li><strong>Identify.</strong><span>Record the changed model, prompt, tool, source, policy, template, evaluator, infrastructure, or dependency.</span></li>
          <li><strong>Assess.</strong><span>Map affected workflows, assertions, actions, data, jurisdictions, controls, and retained work.</span></li>
          <li><strong>Evaluate.</strong><span>Run applicable regression, edge, adversarial, tool, authorization, and recovery cases.</span></li>
          <li><strong>Approve.</strong><span>Record the accountable release decision, conditions, residual risk, timing, and rollback version.</span></li>
          <li><strong>Observe.</strong><span>Use heightened monitoring after release and compare quality, overrides, exceptions, and system behavior.</span></li>
        </ol>
        <p>
          Use the <a href="/templates#tpl-production-change">production change record</a>
          {" "}to preserve the decision and the <a href="/templates#tpl-evaluation-plan">evaluation plan</a>
          {" "}to define the evidence needed for release.
        </p>
      </section>

      <section id="incident">
        <h2>Contain, preserve, determine, correct</h2>
        <ol className="incident-sequence">
          <li><strong>Contain</strong><span>Disable affected tools, revoke credentials, pause workflows, and stop downstream use.</span></li>
          <li><strong>Preserve</strong><span>Retain runs, prompts, versions, sources, approvals, tool results, system logs, and affected outputs.</span></li>
          <li><strong>Determine</strong><span>Establish timeline, root cause, entities, periods, populations, records, users, and external parties affected.</span></li>
          <li><strong>Correct</strong><span>Reverse or compensate through authorized accounting procedures and reconcile every affected effect.</span></li>
          <li><strong>Communicate</strong><span>Use legal, privacy, security, audit, governance, customer, or regulator processes as applicable.</span></li>
          <li><strong>Learn</strong><span>Add regression cases, redesign the control, reassess risk, and require approval before resuming.</span></li>
        </ol>
        <p>
          Record the event with the <a href="/templates#tpl-incident-report">incident report</a>.
          Never silently edit or delete the original run, approval, or accounting record.
        </p>
      </section>

      <section id="review">
        <h2>Run a recurring operating review</h2>
        <dl className="term-list">
          <div><dt>Scope</dt><dd>Active workflows, versions, populations, authority levels, users, tools, vendors, and jurisdictions.</dd></div>
          <div><dt>Quality</dt><dd>Coverage, accuracy, exceptions, rework, overrides, disagreement, and downstream corrections.</dd></div>
          <div><dt>Controls</dt><dd>Denied actions, approval integrity, segregation conflicts, access reviews, control failures, and remediation.</dd></div>
          <div><dt>Change</dt><dd>Released and pending changes, evaluation results, drift, provider notices, and new requirements.</dd></div>
          <div><dt>Incidents</dt><dd>Events, near misses, affected records, time to contain, correction, root cause, and open actions.</dd></div>
          <div><dt>Decision</dt><dd>Continue, constrain, pause, correct, retrain, redesign, replace, or retire with an accountable owner.</dd></div>
        </dl>
        <h3>Related controls</h3>
        <div className="control-pattern-list compact-record-list">
          {operationsControls.map((control) => (
            <article key={control.id}>
              <h3>{control.name}</h3>
              <p>{control.objective}</p>
              <h4>Procedure</h4>
              <BulletList items={control.procedure} />
              <h4>Evidence</h4>
              <BulletList items={control.evidence} />
            </article>
          ))}
        </div>
        <h3>Primary source basis</h3>
        <SourceReferences ids={sourceIds} />
      </section>
    </DocsShell>
  );
}
