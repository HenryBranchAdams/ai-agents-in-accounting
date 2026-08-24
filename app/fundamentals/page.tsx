import { DocsShell } from "../DocsShell";
import { modes, workLoop } from "../content";
import { docsMetadata } from "../docsMetadata";

const description = "Define an accounting agent, compare it with other automation patterns, and review the six-part work loop.";

export const metadata = docsMetadata("Agent fundamentals", description, "/fundamentals");

export default function FundamentalsPage() {
  return (
    <DocsShell
      active="/fundamentals"
      category="Start"
      title="Agent fundamentals"
      description={description}
      toc={[
        { href: "#definition", label: "Definition" },
        { href: "#patterns", label: "Operating patterns" },
        { href: "#work-loop", label: "Work loop" },
        { href: "#run-record", label: "Run record" },
      ]}
      previous={{ href: "/", label: "Overview" }}
      next={{ href: "/workflows", label: "Workflow library" }}
    >
      <section id="definition">
        <h2>Definition</h2>
        <p>
          An accounting agent pursues a defined accounting objective. It can
          select steps, use approved tools and evidence, inspect results, and
          continue until it reaches a completion or stop condition.
        </p>
        <p>
          A usable definition names four things: the objective, available
          tools, accepted evidence, and operating limits. A product label alone
          does not describe the system&apos;s authority.
        </p>
        <p className="section-sources">
          See <a href="https://openai.com/business/guides-and-resources/a-practical-guide-to-building-ai-agents/" rel="noreferrer" target="_blank">OpenAI&apos;s practical guide to building agents</a>.
        </p>
        <dl className="term-list">
          <div><dt>Objective</dt><dd>The accounting outcome, entity, period, and scope.</dd></div>
          <div><dt>Tools</dt><dd>The data and actions the system can access.</dd></div>
          <div><dt>Evidence</dt><dd>The sources accepted for facts and calculations.</dd></div>
          <div><dt>Limits</dt><dd>The thresholds, approvals, prohibitions, and stop conditions.</dd></div>
        </dl>
      </section>

      <section id="patterns">
        <h2>Four operating patterns</h2>
        <p>
          Classify a system by who or what controls the next step. This avoids
          relying on product language that uses <em>agent</em> for several
          different behaviors.
        </p>
        <div className="table-wrap">
          <table>
            <caption className="sr-only">Comparison of chat, copilot, workflow, and agent operating patterns</caption>
            <thead>
              <tr>
                <th>Pattern</th>
                <th>Next step controlled by</th>
                <th>Behavior</th>
                <th>Accounting example</th>
              </tr>
            </thead>
            <tbody>
              {modes.map((mode) => (
                <tr key={mode.name}>
                  <th scope="row">{mode.name}</th>
                  <td>{mode.controller}</td>
                  <td>{mode.action}</td>
                  <td>{mode.example}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="work-loop">
        <h2>Work loop</h2>
        <p>
          An agent run should leave a path that a reviewer can follow. Use the
          following sequence as a baseline, then adapt it to the workflow.
        </p>
        <ol className="process-list">
          {workLoop.map(([name, detail], index) => (
            <li key={name}>
              <span>{index + 1}</span>
              <div><h3>{name}</h3><p>{detail}</p></div>
            </li>
          ))}
        </ol>
      </section>

      <section id="run-record">
        <h2>Run record</h2>
        <p>
          Store more than the final answer. Record the objective, source set,
          procedures, tool calls, calculations, exceptions, contradictory
          evidence, configuration, approvals, and conclusion. The record should
          show who prepared and reviewed the work and when each action occurred.
        </p>
        <div className="note">
          <p className="note-title">Trace and workpaper serve different jobs</p>
          <p>
            A technical trace helps diagnose the system. A governed workpaper
            explains the accounting work to its intended reviewer. Convert the
            relevant trace data into the required workpaper format.
          </p>
        </div>
        <p className="section-sources">
          See <a href="https://pcaobus.org/oversight/standards/auditing-standards/details/AS1215" rel="noreferrer" target="_blank">PCAOB AS 1215, Audit Documentation</a>.
        </p>
      </section>
    </DocsShell>
  );
}
