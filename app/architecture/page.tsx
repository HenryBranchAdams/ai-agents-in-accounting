import { DocsShell } from "../DocsShell";
import { layers } from "../content";
import { docsMetadata } from "../docsMetadata";

const description = "Separate accounting methods, system access, policy, output formats, evaluation, and the durable work record.";

export const metadata = docsMetadata("System architecture", description, "/architecture");

export default function ArchitecturePage() {
  return (
    <DocsShell
      active="/architecture"
      category="Implementation"
      title="System architecture"
      description={description}
      headerImage={{
        src: "/images/editorial/03-agent-architecture.jpg",
        alt: "Paper modules connected through tools and a central human review point.",
      }}
      toc={[
        { href: "#layers", label: "System layers" },
        { href: "#record", label: "Work record" },
        { href: "#orchestration", label: "Orchestration" },
        { href: "#mcp", label: "Tool interfaces" },
      ]}
      previous={{ href: "/controls", label: "Controls and authority" }}
      next={{ href: "/pilot", label: "Pilot checklist" }}
    >
      <section id="layers">
        <h2>Separate the system layers</h2>
        <p>
          Prompts become difficult to review when they contain the accounting
          method, access rules, approval policy, output format, and quality tests
          in one block. Store each concern where the system can version, test,
          and approve it.
        </p>
        <div className="table-wrap">
          <table>
            <caption className="sr-only">System layers, purposes, and accounting-agent examples</caption>
            <thead><tr><th>Layer</th><th>Purpose</th><th>Example</th></tr></thead>
            <tbody>
              {layers.map(([name, purpose, example]) => (
                <tr key={name}><th scope="row">{name}</th><td>{purpose}</td><td>{example}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="record">
        <h2>Keep the accounting record outside the model</h2>
        <p>
          The agent runtime executes model and tool calls. The accounting
          application owns work state, evidence, policies, approvals, and
          history. A model or provider change should not break the work record.
        </p>
        <dl className="term-list">
          <div><dt>Work item</dt><dd>Objective, entity, period, owner, scope, and status.</dd></div>
          <div><dt>Work plan</dt><dd>Versioned procedures, assigned work units, and approval points.</dd></div>
          <div><dt>Run</dt><dd>Instructions, model, tools, configuration, inputs, and timestamps.</dd></div>
          <div><dt>Evidence item</dt><dd>Source, provenance, version, period, and access record.</dd></div>
          <div><dt>Finding</dt><dd>Observation, support, contradiction, severity, and disposition.</dd></div>
          <div><dt>Proposed effect</dt><dd>Draft entry, adjustment, disclosure, task, or escalation.</dd></div>
          <div><dt>Review</dt><dd>Reviewer decision, comments, date, and required rework.</dd></div>
          <div><dt>Commit boundary</dt><dd>The approval required before an external action becomes effective.</dd></div>
        </dl>
        <div className="note">
          <p className="note-title">Carry work forward by reference</p>
          <p>
            Keep completed work in history. Require an explicit decision before
            a later period or run treats that work as current evidence.
          </p>
        </div>
      </section>

      <section id="orchestration">
        <h2>Use the simplest orchestration that works</h2>
        <p>
          Begin with one general accounting agent and deterministic helpers.
          Add specialist agents when a single instruction set becomes difficult
          to evaluate or when separate context improves the result.
        </p>
        <ul>
          <li>Use code-controlled steps when sequence and outcome must remain predictable.</li>
          <li>Use model-controlled steps for investigation, classification, and evidence requests.</li>
          <li>Use deterministic code for calculations, tie-outs, schema checks, and permissions.</li>
          <li>Pause the run before sensitive tools or material judgments.</li>
          <li>Return specialist results to one accountable manager for the final package.</li>
        </ul>
      </section>

      <section id="mcp">
        <h2>Treat tool protocols as interfaces</h2>
        <p>
          Model Context Protocol can expose ledger data, policies, evidence
          stores, calculations, and actions through narrow interfaces. The
          protocol does not establish data completeness, authorization,
          segregation of duties, or ICFR readiness.
        </p>
        <p>
          Validate inputs and outputs, separate read and write tools, enforce
          permissions outside the model, require approval for sensitive actions,
          and log the request and result.
        </p>
        <p className="section-sources">
          See the <a href="https://openai.github.io/openai-agents-python/" rel="noreferrer" target="_blank">OpenAI Agents SDK documentation</a> and <a href="https://modelcontextprotocol.io/specification/2026-07-28" rel="noreferrer" target="_blank">Model Context Protocol specification</a>.
        </p>
      </section>
    </DocsShell>
  );
}
