import { DocsShell } from "../DocsShell";
import { pilotSteps } from "../content";
import { docsMetadata } from "../docsMetadata";

const description = "Run one accounting workflow with read-only or draft-only authority, compare it with the current process, and expand only when the evidence supports it.";

export const metadata = docsMetadata("Pilot checklist", description, "/pilot");

export default function PilotPage() {
  return (
    <DocsShell
      active="/pilot"
      category="Implementation"
      title="Pilot checklist"
      description={description}
      toc={[
        { href: "#before", label: "Before the pilot" },
        { href: "#steps", label: "Pilot stages" },
        { href: "#measures", label: "Measures" },
        { href: "#stop", label: "Stop conditions" },
      ]}
      previous={{ href: "/architecture", label: "System architecture" }}
      next={{ href: "/resources", label: "Source library" }}
    >
      <section id="before">
        <h2>Before the pilot</h2>
        <p>
          Assign a business owner, technical owner, control owner, and reviewer.
          Document the current process and collect a small set of representative,
          edge, contradictory, and known-answer cases.
        </p>
        <ul className="check-list">
          <li>The workflow has a defined objective and reviewer.</li>
          <li>Source access is authorized and limited to the required data.</li>
          <li>The team can reproduce control totals and key calculations.</li>
          <li>The expected output and review standard are documented.</li>
          <li>The system can stop without changing a record or sending a message.</li>
          <li>The team can restore the prior configuration after a change.</li>
        </ul>
      </section>

      <section id="steps">
        <h2>Pilot stages</h2>
        <ol className="process-list process-list-detailed">
          {pilotSteps.map(([name, detail], index) => (
            <li key={name}>
              <span>{index + 1}</span>
              <div><h3>{name}</h3><p>{detail}</p></div>
            </li>
          ))}
        </ol>
      </section>

      <section id="measures">
        <h2>Measures</h2>
        <div className="table-wrap">
          <table>
            <caption className="sr-only">Measures for evaluating a supervised accounting-agent pilot</caption>
            <thead><tr><th>Measure</th><th>Question</th></tr></thead>
            <tbody>
              <tr><th scope="row">Coverage</th><td>How much of the defined population did the run process?</td></tr>
              <tr><th scope="row">Accuracy</th><td>Did calculations, matches, classifications, and citations agree with known answers?</td></tr>
              <tr><th scope="row">Exception quality</th><td>Did the run find material problems without creating excessive false positives?</td></tr>
              <tr><th scope="row">Traceability</th><td>Can the reviewer follow each material result to its source and procedure?</td></tr>
              <tr><th scope="row">Rework</th><td>How much preparation and correction did the reviewer perform?</td></tr>
              <tr><th scope="row">Cycle time</th><td>How long did preparation, review, correction, and approval take?</td></tr>
              <tr><th scope="row">Overrides</th><td>Which agent recommendations did reviewers reject or change, and why?</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="stop">
        <h2>Stop conditions</h2>
        <p>Pause the pilot and investigate when any of these conditions occur:</p>
        <ul>
          <li>The source population cannot be tied to an authoritative control total.</li>
          <li>The agent uses an unauthorized source or tool.</li>
          <li>A material result lacks support or contradicts source evidence.</li>
          <li>The system performs or attempts a prohibited action.</li>
          <li>Reviewer overrides increase after a model, prompt, tool, or mapping change.</li>
          <li>The run record cannot reproduce the result or identify the configuration used.</li>
        </ul>
        <div className="note note-warning">
          <p className="note-title">Expansion decision</p>
          <p>
            Record the evidence that supports any wider scope, tool access, or
            action authority. Keep the current boundary when results remain
            mixed or the review burden offsets the time saved.
          </p>
        </div>
        <p className="section-sources">
          See the <a href="https://www.nist.gov/itl/ai-risk-management-framework" rel="noreferrer" target="_blank">NIST AI Risk Management Framework</a> and <a href="https://www.cpa.com/sites/cpa/files/media/resources/whitepapers/ai-solution-due-diligence-guide-for-accounting-firms-cpacom.pdf" rel="noreferrer" target="_blank">CPA.com due diligence guide</a>.
        </p>
      </section>
    </DocsShell>
  );
}
