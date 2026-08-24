import { DocsShell } from "../DocsShell";
import { BulletList, SourceReferences } from "../DomainRecords";
import { evidenceChain } from "../content";
import { docsMetadata } from "../docsMetadata";
import { controlPatterns } from "../governance-data";

const description = "Define the agent's authority, keep evidence and decisions separate, and apply sixteen control patterns across design, release, operation, and assurance.";

export const metadata = {
  ...docsMetadata("Controls and authority", description, "/controls"),
  alternates: {
    canonical: "/controls",
    types: { "application/json": "/api/v1/controls", "text/markdown": "/controls.md" },
  },
};

export default function ControlsPage() {
  return (
    <DocsShell
      active="/controls"
      category="Applied accounting"
      title="Controls and authority"
      description={description}
      headerImage={{
        src: "/images/editorial/04-control-boundary.jpg",
        alt: "Evidence packets pause at a physical approval boundary before continuing.",
      }}
      jsonHref="/api/v1/controls"
      markdownHref="/controls.md"
      toc={[
        { href: "#support", label: "Support and authority" },
        { href: "#authority", label: "Authority boundary" },
        { href: "#control-design", label: "Control design" },
        { href: "#assessment", label: "Assessment" },
        { href: "#patterns", label: "Control patterns" },
      ]}
      previous={{ href: "/workflows", label: "Workflow library" }}
      next={{ href: "/sensitive-actions", label: "Sensitive actions" }}
    >
      <section id="support">
        <h2>Separate support and authority</h2>
        <p>
          An agent can collect evidence, reproduce calculations, identify
          exceptions, and draft a recommendation. Those procedures may support
          a conclusion. They do not give the agent authority to approve an
          accounting treatment or state that a control operated effectively.
        </p>
        <p>
          Label each step in the reasoning chain. The reviewer can then see
          where the source record ends and where interpretation begins.
        </p>
        <div className="table-wrap">
          <table>
            <caption className="sr-only">Evidence-chain terms and accounting examples</caption>
            <thead><tr><th>Type</th><th>Example</th></tr></thead>
            <tbody>
              {evidenceChain.map(([name, example]) => (
                <tr key={name}><th scope="row">{name}</th><td>{example}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="note">
          <p className="note-title">Check applicability</p>
          <p>
            A source may be authoritative and still fall outside the entity,
            transaction, period, jurisdiction, or question under review. Record
            the basis for applying it.
          </p>
        </div>
      </section>

      <section id="authority">
        <h2>Set the authority boundary</h2>
        <p>
          Write the boundary before the run. Connect it to access controls and
          approval gates rather than relying on an instruction inside the prompt.
        </p>
        <dl className="term-list">
          <div><dt>Scope</dt><dd>Entity, accounts, period, objective, and assertions.</dd></div>
          <div><dt>Evidence</dt><dd>Approved sources, completeness rules, and prohibited data.</dd></div>
          <div><dt>Tools</dt><dd>Read, calculate, search, draft, write, post, or communicate.</dd></div>
          <div><dt>Thresholds</dt><dd>Materiality, confidence, matching tolerance, and aging.</dd></div>
          <div><dt>Actions</dt><dd>Allowed, draft-only, approval-gated, and prohibited actions.</dd></div>
          <div><dt>Stops</dt><dd>Missing evidence, conflict, ambiguity, access failure, and policy judgment.</dd></div>
          <div><dt>Record</dt><dd>Required trace, workpaper, approvals, and retention period.</dd></div>
        </dl>
      </section>

      <section id="control-design">
        <h2>Design an agent-assisted control</h2>
        <p>
          A useful agent result may support a control. Reliance requires a full
          control design with an owner, objective, population, procedure,
          precision, evidence requirement, exception path, and review standard.
        </p>
        <div className="plain-sections">
          <article>
            <h3>Controls over the agent</h3>
            <p>
              Govern source access, write permissions, model and prompt changes,
              tool definitions, approvals, logging, monitoring, and incidents.
            </p>
          </article>
          <article>
            <h3>Procedures performed with the agent</h3>
            <p>
              Define the population, source controls, calculation method,
              thresholds, reviewer, exceptions, and retained evidence.
            </p>
          </article>
          <article>
            <h3>Dependent controls</h3>
            <p>
              Identify controls over source data, system access, change
              management, interfaces, and any deterministic calculation used by
              the agent.
            </p>
          </article>
        </div>
      </section>

      <section id="assessment">
        <h2>Keep performance and assessment separate</h2>
        <p>
          The same agent should not perform a control procedure and make the
          final assurance claim about its own work. Assign assessment to a
          competent person or an independent process with access to the run
          record and source evidence.
        </p>
        <ul className="check-list">
          <li>Test design before testing operating effectiveness.</li>
          <li>Use known-answer, edge, contradictory, and unauthorized cases.</li>
          <li>Reperform deterministic calculations outside the model.</li>
          <li>Review overrides, false positives, false negatives, and unresolved exceptions.</li>
          <li>Retest after changes to the model, instructions, sources, tools, thresholds, or mappings.</li>
        </ul>
        <p className="section-sources">
          See <a href="https://pcaobus.org/oversight/standards/auditing-standards/details/AS1105" rel="noreferrer" target="_blank">PCAOB AS 1105, Audit Evidence</a>, <a href="https://pcaobus.org/oversight/standards/auditing-standards/details/AS2201" rel="noreferrer" target="_blank">PCAOB AS 2201, An Audit of ICFR</a>, and <a href="https://www.coso.org/generative-ai" rel="noreferrer" target="_blank">COSO&apos;s generative AI guidance</a>.
        </p>
      </section>

      <section id="patterns">
        <h2>Control pattern library</h2>
        <p>
          Select the patterns that address the workflow&apos;s risks and dependencies,
          then adapt the owner, frequency, precision, evidence, and exception path.
          A list of controls is not a control design until those operating details
          are specific and assigned.
        </p>
        <nav className="in-page-index" aria-label="Control pattern records">
          {controlPatterns.map((control) => (
            <a href={`#${control.id}`} key={control.id}>{control.name}</a>
          ))}
        </nav>
        <div className="control-pattern-list">
          {controlPatterns.map((control, index) => (
            <article id={control.id} key={control.id}>
              <header>
                <span className="record-number">{String(index + 1).padStart(2, "0")}</span>
                <h3>{control.name}</h3>
              </header>
              <p>{control.objective}</p>
              <dl className="record-facts">
                <div><dt>Risk</dt><dd>{control.risk}</dd></div>
                <div><dt>Owner</dt><dd>{control.owner}</dd></div>
                <div><dt>Frequency</dt><dd>{control.frequency}</dd></div>
              </dl>
              <div className="record-subsections three-column-record">
                <div>
                  <h4>Procedure</h4>
                  <BulletList items={control.procedure} />
                </div>
                <div>
                  <h4>Evidence</h4>
                  <BulletList items={control.evidence} />
                </div>
                <div>
                  <h4>Exceptions</h4>
                  <BulletList items={control.exceptions} />
                </div>
              </div>
              <details className="source-disclosure">
                <summary>Source basis</summary>
                <SourceReferences ids={control.source_ids} />
              </details>
            </article>
          ))}
        </div>
      </section>
    </DocsShell>
  );
}
