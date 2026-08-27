import Link from "next/link";
import { DocsShell } from "../DocsShell";
import { docsMetadata } from "../docsMetadata";
import { accountingAgentsStartHere } from "../start-here";
import { KnowledgeCheck } from "./KnowledgeCheck";

const lesson = accountingAgentsStartHere;

export const metadata = {
  ...docsMetadata(lesson.title, lesson.description, "/start-here"),
  alternates: {
    canonical: "/start-here",
    types: {
      "text/markdown": "/start-here.md",
      "application/json": "/api/v1/start-here",
    },
  },
};

const classificationLabels = {
  "authoritative-requirement": "Authoritative requirement",
  "editorial-recommendation": "Editorial recommendation",
  "implementation-pattern": "Implementation pattern",
  "synthetic-example": "Synthetic example",
} as const;

export default function StartHerePage() {
  return (
    <DocsShell
      active="/start-here"
      category="Learn"
      title={lesson.title}
      description={lesson.description}
      reviewedAt={lesson.prepared_at}
      trustDateLabel="Prepared"
      reviewStatus="Maintainer review pending; subject-matter, independent, or professional review is not claimed"
      markdownHref="/start-here.md"
      jsonHref="/api/v1/start-here"
      toc={[
        { href: "#before-you-begin", label: "Before you begin" },
        { href: "#definition", label: "Definition" },
        { href: "#comparison", label: "Compare patterns" },
        { href: "#governing-rule", label: "Governing rule" },
        { href: "#evidence-chain", label: "Evidence to decision" },
        { href: "#scenario", label: "Synthetic scenario" },
        { href: "#knowledge-check", label: "Knowledge check" },
        { href: "#next-path", label: "Choose a path" },
      ]}
      previous={{ href: "/", label: "Overview" }}
      next={{ href: "/packs/bank-reconciliation", label: "Synthetic bank-reconciliation pack" }}
    >
      <section id="before-you-begin">
        <h2>Before you begin</h2>
        <p>{lesson.intended_audience}</p>
        <dl className="record-facts">
          <div><dt>Lesson ID</dt><dd><code>{lesson.id}</code> · version {lesson.version}</dd></div>
          <div><dt>Time</dt><dd>About five minutes, including the knowledge check</dd></div>
          <div><dt>Prerequisites</dt><dd>{lesson.prerequisites.join(" ")}</dd></div>
          <div><dt>Expected outcome</dt><dd>{lesson.learning_objectives.join(" ")}</dd></div>
        </dl>
        <h3>Learning objectives</h3>
        <ul className="check-list">
          {lesson.learning_objectives.map((objective) => <li key={objective}>{objective}</li>)}
        </ul>
      </section>

      <section id="definition">
        <h2>One-sentence definition</h2>
        <p className="orientation-definition">{lesson.definition.text}</p>
        <p className="evidence-label" data-evidence-classification={lesson.definition.evidence_classification}>
          Evidence classification: {classificationLabels[lesson.definition.evidence_classification]}
        </p>
        <p>{lesson.definition.reliance_boundary}</p>
      </section>

      <section id="comparison">
        <h2>Compare four operating patterns</h2>
        <p>
          The difference is not how polished the output sounds. The difference is
          who or what chooses the steps, which tools are available, and where the
          authority boundary is enforced.
        </p>
        <p className="evidence-label" data-evidence-classification="implementation-pattern">
          Evidence classification: the comparison model is an implementation pattern; every accounting example is synthetic.
        </p>
        <div className="table-wrap">
          <table>
            <caption>Chat, copilot, fixed workflow, and accounting agent</caption>
            <thead><tr><th>Pattern</th><th>Controller</th><th>Behavior</th><th>Accounting example</th><th>Boundary</th></tr></thead>
            <tbody>
              {lesson.comparisons.map((item) => (
                <tr id={item.id} key={item.id}>
                  <th scope="row">{item.label}</th>
                  <td>{item.controller}</td>
                  <td>{item.behavior}</td>
                  <td>{item.accounting_example}</td>
                  <td>{item.boundary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="governing-rule">
        <h2>The governing rule</h2>
        <div className="note note-rule">
          <p>{lesson.governing_rule.text}</p>
        </div>
        <p className="evidence-label" data-evidence-classification={lesson.governing_rule.evidence_classification}>
          Evidence classification: {classificationLabels[lesson.governing_rule.evidence_classification]}
        </p>
        <p>{lesson.governing_rule.implication}</p>
        <p>
          In practice, a model may help prepare a reconciliation, memo, proposed
          entry, or payment packet. It does not become the controller, approver,
          signer, certifier, or fiduciary because its output looks complete.
        </p>
      </section>

      <section id="evidence-chain">
        <h2>Follow evidence to an accountable decision</h2>
        <p>
          Each step has a different owner. Keeping the steps separate prevents a
          supported observation from silently becoming an approved conclusion.
        </p>
        <p className="evidence-label" data-evidence-classification="implementation-pattern">
          Evidence classification: the chain is an implementation pattern; each lesson application is
          {" "}<span data-evidence-classification="synthetic-example">synthetic</span>.
        </p>
        <ol className="evidence-chain">
          {lesson.evidence_to_decision_chain.map((item, index) => (
            <li id={item.id} key={item.id}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div><strong>{item.label}</strong><p>{item.text}</p><small>{item.owner}</small></div>
            </li>
          ))}
        </ol>
      </section>

      <section id="scenario">
        <h2>{lesson.scenario.title}</h2>
        <p className="evidence-label" data-evidence-classification={lesson.scenario.evidence_classification}>
          Scenario ID: {lesson.scenario.id} · Evidence classification: {classificationLabels[lesson.scenario.evidence_classification]} · fictional clean-room scenario
        </p>
        <p>{lesson.scenario.context}</p>
        <ol className="procedure-list">
          {lesson.scenario.guided_steps.map((step) => <li key={step}>{step}</li>)}
        </ol>
        <div className="note note-warning">
          <p className="note-title">Deliberate exception</p>
          <p>{lesson.scenario.deliberate_exception}</p>
        </div>
        <h3>Finished artifact: {lesson.scenario.finished_artifact.label}</h3>
        <ul className="check-list">
          {lesson.scenario.finished_artifact.fields.map((field) => <li key={field}>{field}</li>)}
        </ul>
        <p>{lesson.scenario.safe_reset}</p>
        <p>
          Continue with the <Link href="/packs/bank-reconciliation">synthetic bank-reconciliation pack</Link> when
          you want to inspect the fixtures, procedures, reference outputs, and
          hard gates behind this example.
        </p>
      </section>

      <section id="knowledge-check">
        <h2>Two-minute knowledge check</h2>
        <p>
          Choose one answer for each question. Answers stay in this browser tab;
          the site does not save or transmit them.
        </p>
        <KnowledgeCheck
          questions={lesson.knowledge_check}
          completionId={lesson.completion_artifact.id}
          completionTitle={lesson.completion_artifact.title}
          completionStatements={lesson.completion_artifact.statements}
          interpretationBoundary={lesson.completion_artifact.interpretation_boundary}
        />
      </section>

      <section id="next-path">
        <h2>Choose your next path</h2>
        <p>{lesson.next_action}</p>
        <div className="doc-link-list">
          {lesson.audience_paths.map((path) => (
            <Link href={path.href} id={path.id} key={path.id}>
              <strong>{path.label}: {path.next}</strong>
              <span>{path.outcome}</span>
            </Link>
          ))}
        </div>
      </section>

      <section id="limits">
        <h2>Limitations and source basis</h2>
        <ul>{lesson.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}</ul>
        <ul className="source-reference-list">
          {lesson.source_basis.map((source) => (
            <li key={source.id}>
              <Link href={source.href}>{source.title}</Link>
              <span data-evidence-classification={source.evidence_classification}>{classificationLabels[source.evidence_classification]}</span>
              <p className="source-reference-note">{source.scope}</p>
            </li>
          ))}
        </ul>
        <p>{lesson.review_note}</p>
      </section>
    </DocsShell>
  );
}
