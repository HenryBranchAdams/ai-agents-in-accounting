import { DocsShell } from "../DocsShell";
import { BulletList, SourceReferences } from "../DomainRecords";
import { evidenceChain } from "../content";
import { docsMetadata } from "../docsMetadata";
import { controlPatterns } from "../governance-data";

const description = "Preserve evidence provenance, test reliability and applicability, keep contradictions visible, and separate preparer work from assurance conclusions.";

export const metadata = docsMetadata("Evidence and assurance", description, "/evidence-assurance");

const evidenceControls = controlPatterns.filter((control) => [
  "ctrl-input-completeness",
  "ctrl-source-authenticity",
  "ctrl-deterministic-validation",
  "ctrl-version-evidence",
  "ctrl-assessment-separation",
].includes(control.id));

const sourceIds = [...new Set(evidenceControls.flatMap((control) => control.source_ids))];

export default function EvidenceAssurancePage() {
  return (
    <DocsShell
      active="/evidence-assurance"
      category="Govern"
      title="Evidence and assurance"
      description={description}
      headerImage={{
        src: "/images/editorial/05-workpaper-review.jpg",
        alt: "Reviewed workpaper packets aligned together while one unresolved item remains separate.",
      }}
      toc={[
        { href: "#chain", label: "Reasoning chain" },
        { href: "#reliability", label: "Evidence reliability" },
        { href: "#workpaper", label: "Workpaper standard" },
        { href: "#assurance", label: "Assurance boundary" },
        { href: "#controls", label: "Control patterns" },
      ]}
      previous={{ href: "/sensitive-actions", label: "Sensitive actions" }}
      next={{ href: "/security-identity", label: "Security and identity" }}
    >
      <section id="chain">
        <h2>Keep the reasoning chain visible</h2>
        <p>
          Separate what a source says from what the system infers and what an
          accountable person decides. A linked chain makes disagreement,
          missing support, and judgment visible before a conclusion is used.
        </p>
        <ol className="evidence-chain">
          {evidenceChain.map(([name, example], index) => (
            <li key={name}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div><strong>{name}</strong><p>{example}</p></div>
            </li>
          ))}
        </ol>
        <div className="note">
          <p className="note-title">Contradictory evidence is part of the record</p>
          <p>
            Do not average it away, omit it from a summary, or treat confidence
            as resolution. Link the conflict to the affected claim and route it
            to the named reviewer.
          </p>
        </div>
      </section>

      <section id="reliability">
        <h2>Evaluate evidence before using it</h2>
        <div className="table-wrap">
          <table>
            <caption className="sr-only">Evidence-reliability dimensions, review questions, and retained support</caption>
            <thead><tr><th>Dimension</th><th>Question</th><th>Retained evidence</th></tr></thead>
            <tbody>
              <tr><th scope="row">Authenticity</th><td>Who produced or controls the source, and has custody been preserved?</td><td>System, owner, identifier, hash, or retrieval record</td></tr>
              <tr><th scope="row">Completeness</th><td>Does the population include every in-scope record exactly once?</td><td>Extraction parameters, counts, amounts, exclusions, and tie-out</td></tr>
              <tr><th scope="row">Accuracy</th><td>Do fields and calculations agree with authoritative records?</td><td>Independent recalculation, validation, and exception results</td></tr>
              <tr><th scope="row">Relevance</th><td>Does the evidence support the specific assertion or decision?</td><td>Claim-to-source mapping and procedure</td></tr>
              <tr><th scope="row">Applicability</th><td>Does the rule or evidence apply to this entity, period, transaction, and jurisdiction?</td><td>Scope analysis and effective version</td></tr>
              <tr><th scope="row">Timeliness</th><td>Was the source current at the time of the work and decision?</td><td>As-of date, retrieval time, and subsequent-event check</td></tr>
              <tr><th scope="row">Consistency</th><td>What corroborates or contradicts the source?</td><td>Alternative sources, differences, and reviewer disposition</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="workpaper">
        <h2>Build an accounting workpaper, not only a trace</h2>
        <p>
          Technical traces help diagnose orchestration and tool behavior. The
          workpaper must also let a competent reviewer understand the accounting
          objective, evidence, procedure, result, exceptions, and proposed effect.
        </p>
        <ul className="check-list">
          <li>Identify entity, period, population, jurisdiction, materiality, and accountable roles.</li>
          <li>Preserve source owners, versions, extraction parameters, control totals, and transformations.</li>
          <li>Link each material observation and claim to its evidence and reproducible calculation.</li>
          <li>Show contrary evidence, uncertainty, stop events, overrides, and unresolved questions prominently.</li>
          <li>Record model, prompt, policy, tool, template, and evaluator versions used for the run.</li>
          <li>Retain reviewer decisions, exact approval payloads, execution receipts, and corrections.</li>
        </ul>
      </section>

      <section id="assurance">
        <h2>Separate support, performance, and assessment</h2>
        <dl className="term-list">
          <div><dt>Preparation</dt><dd>The agent organizes evidence, reproduces calculations, drafts work, and identifies exceptions.</dd></div>
          <div><dt>Performance</dt><dd>The designated control performer executes the defined procedure at the required precision and frequency.</dd></div>
          <div><dt>Review</dt><dd>A competent person challenges the work, resolves exceptions, and makes the assigned decision.</dd></div>
          <div><dt>Assessment</dt><dd>Management, internal audit, or an external auditor evaluates design or effectiveness under the applicable framework.</dd></div>
          <div><dt>Representation</dt><dd>An authorized person makes any final attestation, certification, audit conclusion, or external statement.</dd></div>
        </dl>
        <div className="note note-warning">
          <p className="note-title">No self-assurance</p>
          <p>
            The agent&apos;s explanation of its own work is not independent evidence
            that the work is correct or that a control operated effectively.
          </p>
        </div>
      </section>

      <section id="controls">
        <h2>Control patterns for evidence</h2>
        <div className="control-pattern-list compact-record-list">
          {evidenceControls.map((control) => (
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
