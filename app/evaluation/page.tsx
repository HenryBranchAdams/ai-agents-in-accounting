import { DocsShell } from "../DocsShell";
import { BulletList, SourceReferences } from "../DomainRecords";
import { docsMetadata } from "../docsMetadata";
import { controlPatterns } from "../governance-data";

const description = "Evaluate accounting-agent workflows end to end with risk-based cases, independent expected results, deterministic checks, human review, and release gates.";

export const metadata = docsMetadata("Evaluation and testing", description, "/evaluation");

const evaluationControls = controlPatterns.filter((control) => [
  "ctrl-release-evaluation",
  "ctrl-deterministic-validation",
  "ctrl-override-monitoring",
  "ctrl-change-management",
].includes(control.id));

const sourceIds = [...new Set(evaluationControls.flatMap((control) => control.source_ids))];

export default function EvaluationPage() {
  return (
    <DocsShell
      active="/evaluation"
      category="Implement"
      title="Evaluation and testing"
      description={description}
      toc={[
        { href: "#decision", label: "Decision first" },
        { href: "#cases", label: "Case design" },
        { href: "#evaluators", label: "Evaluators" },
        { href: "#metrics", label: "Metrics" },
        { href: "#release", label: "Release gate" },
      ]}
      previous={{ href: "/architecture", label: "System architecture" }}
      next={{ href: "/pilot", label: "Pilot checklist" }}
    >
      <section id="decision">
        <h2>Start with the release decision</h2>
        <p>
          An evaluation should answer a concrete question: whether a defined
          workflow version may enter shadow use, prepare drafts, reach a limited
          population, receive a constrained tool, or continue after a change.
          Measure the end-to-end accounting outcome, not only model response quality.
        </p>
        <dl className="record-facts">
          <div><dt>Unit under test</dt><dd>Workflow, model, instructions, sources, tools, policy, template, evaluator, and environment as one versioned system.</dd></div>
          <div><dt>Decision owner</dt><dd>Named accounting process owner with system, risk, control, security, legal, or audit input as applicable.</dd></div>
          <div><dt>Risk basis</dt><dd>Materiality, reversibility, external effect, assertion, data sensitivity, frequency, and ability to detect and recover.</dd></div>
          <div><dt>Expected result</dt><dd>Independently derived answer, evidence, check, stop, or reviewer decision with provenance.</dd></div>
        </dl>
      </section>

      <section id="cases">
        <h2>Build cases from the workflow and its failures</h2>
        <div className="evaluation-case-list">
          <article><h3>Normal</h3><p>Representative in-policy populations, formats, systems, entities, and periods with known results.</p></article>
          <article><h3>Edge</h3><p>Boundary dates, rounding, currencies, reversals, duplicates, sparse support, large populations, and threshold values.</p></article>
          <article><h3>Contradictory</h3><p>Sources disagree, facts change, guidance conflicts, or support does not match the requested accounting effect.</p></article>
          <article><h3>Unauthorized</h3><p>Wrong entity, period, user, tool, field, amount, account, recipient, payload, or expired approval.</p></article>
          <article><h3>Adversarial</h3><p>Prompt injection, malicious documents, data exfiltration attempts, forged approval, or tool-result manipulation.</p></article>
          <article><h3>Failure and recovery</h3><p>Tool timeout, duplicate request, partial write, stale source, outage, policy denial, rollback, and rerun.</p></article>
        </div>
        <div className="note">
          <p className="note-title">Hold out material cases</p>
          <p>
            Keep a fixed regression set outside prompt authoring and model tuning.
            Add every material production failure and reviewer disagreement after
            it has an independently approved expected disposition.
          </p>
        </div>
      </section>

      <section id="evaluators">
        <h2>Use more than one evaluator</h2>
        <div className="table-wrap">
          <table>
            <caption className="sr-only">Evaluator types, suitable uses, and accounting-agent examples</caption>
            <thead><tr><th>Evaluator</th><th>Best suited to</th><th>Examples</th></tr></thead>
            <tbody>
              <tr><th scope="row">Deterministic</th><td>Exact, reproducible requirements</td><td>Schema, balance, count, amount, date, permission, citation existence, payload hash</td></tr>
              <tr><th scope="row">Reference comparison</th><td>Known accounting outcomes</td><td>Classification, selected population, calculation, exception, proposed entry</td></tr>
              <tr><th scope="row">Human subject matter</th><td>Applicability, judgment, usefulness, and reviewer effort</td><td>Memo quality, contradictory evidence, materiality, decision readiness</td></tr>
              <tr><th scope="row">Model-assisted</th><td>Scaled qualitative screening with calibration</td><td>Evidence linkage, instruction adherence, unsupported claim, clarity</td></tr>
              <tr><th scope="row">Operational</th><td>System behavior over time</td><td>Latency, tool failure, denial, retry, cost, drift, override, incident</td></tr>
            </tbody>
          </table>
        </div>
        <p>
          Calibrate model-assisted graders against human decisions, retain the
          grader version and rationale, and never use the same unverified model
          output as both the answer and its source of truth.
        </p>
      </section>

      <section id="metrics">
        <h2>Report outcomes by risk</h2>
        <ul className="check-list">
          <li><strong>Population:</strong> coverage, exclusions, duplicates, untied totals, and unresolved items.</li>
          <li><strong>Accounting:</strong> calculation accuracy, correct period and entity, supported classification, and proposed-effect accuracy.</li>
          <li><strong>Evidence:</strong> source validity, citation support, applicability, contradictory-evidence recall, and reproducibility.</li>
          <li><strong>Control:</strong> stop-condition recall, authorization denial, approval integrity, idempotency, and post-action reconciliation.</li>
          <li><strong>Review:</strong> rework, override, disagreement, time, open questions, and escalation quality.</li>
          <li><strong>Operations:</strong> tool errors, latency, retries, cost, incidents, recovery time, and drift by version.</li>
        </ul>
        <div className="note note-warning">
          <p className="note-title">Averages can hide critical failure</p>
          <p>
            Set separate zero-tolerance or high-threshold gates for unauthorized
            action, missing material exceptions, fabricated support, payload
            drift, self-approval, and unreconciled writes.
          </p>
        </div>
      </section>

      <section id="release">
        <h2>Make the release gate attributable</h2>
        <ol className="numbered-records">
          <li><strong>Freeze the candidate.</strong><span>Record every model, prompt, policy, tool, template, source, and evaluator version.</span></li>
          <li><strong>Run the approved suite.</strong><span>Preserve inputs, expected results, actual results, scores, traces, and failures.</span></li>
          <li><strong>Investigate failure.</strong><span>Determine root cause, affected workflows, materiality, compensating controls, and remediation.</span></li>
          <li><strong>Decide by risk.</strong><span>Approve, limit, condition, reject, or roll back with a named owner and residual-risk statement.</span></li>
          <li><strong>Set production signals.</strong><span>Carry evaluation thresholds into monitoring, alerting, pause, and regression tests.</span></li>
        </ol>
        <h3>Related controls</h3>
        <div className="control-pattern-list compact-record-list">
          {evaluationControls.map((control) => (
            <article key={control.id}>
              <h3>{control.name}</h3>
              <p>{control.objective}</p>
              <h4>Evidence</h4>
              <BulletList items={control.evidence} />
            </article>
          ))}
        </div>
        <p>
          Start from the <a href="/templates#tpl-evaluation-plan">evaluation plan template</a>
          {" "}and carry approved results into the pilot scorecard and production change record.
        </p>
        <h3>Primary source basis</h3>
        <SourceReferences ids={sourceIds} />
      </section>
    </DocsShell>
  );
}
