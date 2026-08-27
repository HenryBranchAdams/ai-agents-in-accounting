import Link from "next/link";
import { DocsShell } from "../DocsShell";
import { KnowledgeCheck } from "../start-here/KnowledgeCheck";
import {
  accountingAgentsCoreCourse,
  coreCourseEstimatedMinutes,
  coreCourseReadings,
} from "../core-course";
import { docsMetadata } from "../docsMetadata";

const course = accountingAgentsCoreCourse;

export const metadata = {
  ...docsMetadata(course.title, course.description, "/course"),
  alternates: {
    canonical: "/course",
    types: {
      "text/markdown": "/course.md",
      "application/json": "/api/v1/course",
    },
  },
};

const readingRoleLabels = {
  required: "Required",
  "framework-choice": "Choose the applicable framework",
  "case-comparison": "Comparison exercise",
} as const;

export default function CoreCoursePage() {
  return (
    <DocsShell
      active="/course"
      category="Learn"
      title={course.title}
      description={course.description}
      reviewedAt={course.prepared_at}
      trustDateLabel="Prepared"
      reviewStatus="Maintainer review pending; subject-matter, independent, professional, audit, certification, or assurance review is not claimed"
      markdownHref="/course.md"
      jsonHref="/api/v1/course"
      toc={[
        { href: "#before-you-begin", label: "Before you begin" },
        { href: "#lenses", label: "Choose a lens" },
        { href: "#selection", label: "Selection basis" },
        ...course.modules.map((module) => ({ href: `#${module.id}`, label: `${module.order}. ${module.title}` })),
        { href: "#capstone", label: "Synthetic capstone" },
        { href: "#knowledge-check", label: "Knowledge check" },
        { href: "#limits", label: "Limits" },
      ]}
      previous={{ href: "/start-here", label: "Start here" }}
      next={{ href: "/workflows/record-to-report/wf-r2r-bank-reconciliations", label: "Bank-reconciliation workflow brief" }}
    >
      <section id="before-you-begin">
        <h2>Before you begin</h2>
        <p>{course.intended_audience}</p>
        <dl className="record-facts">
          <div><dt>Course ID</dt><dd><code>{course.id}</code> · version {course.version}</dd></div>
          <div><dt>Scope</dt><dd>{course.modules.length} modules · {coreCourseReadings.length} readings · about {coreCourseEstimatedMinutes} reading minutes</dd></div>
          <div><dt>Primary mode</dt><dd>Tutorial · editorial learning sequence</dd></div>
          <div><dt>Prerequisites</dt><dd>{course.prerequisites.join(" ")}</dd></div>
          <div><dt>Finished artifact</dt><dd>{course.capstone.finished_artifact.title}</dd></div>
        </dl>
        <h3>Learning objectives</h3>
        <ul className="check-list">
          {course.learning_objectives.map((objective) => <li key={objective}>{objective}</li>)}
        </ul>
        <div className="note note-rule">
          <p>{course.governing_rule.text}</p>
        </div>
        <p className="evidence-label" data-evidence-classification={course.governing_rule.evidence_classification}>
          Evidence classification: editorial recommendation
        </p>
        <p>{course.governing_rule.implication}</p>
      </section>

      <section id="lenses">
        <h2>Choose one audience lens</h2>
        <p>
          Everyone follows the same five-module sequence. The lens changes which
          questions you emphasize and which artifact you carry into the capstone.
        </p>
        <div className="doc-link-list course-lens-list">
          {course.audience_lenses.map((lens) => (
            <a href={`#lens-${lens.id}`} id={`lens-${lens.id}`} key={lens.id}>
              <strong>{lens.label}</strong>
              <span>{lens.use_when}</span>
              <span><b>Finish with:</b> {lens.completion_artifact}</span>
            </a>
          ))}
        </div>
      </section>

      <section id="selection">
        <h2>Why these twenty sources</h2>
        <p>{course.selection_basis.target}</p>
        <ul>
          {course.selection_basis.admission_rules.map((rule) => <li key={rule}>{rule}</li>)}
        </ul>
        <div className="note">
          <p className="note-title">Framework choice</p>
          <p>{course.selection_basis.framework_choice}</p>
        </div>
        <div className="note note-warning">
          <p className="note-title">Product comparison</p>
          <p>{course.selection_basis.product_comparison}</p>
        </div>
      </section>

      {course.modules.map((module) => (
        <section className="course-module" id={module.id} key={module.id}>
          <header>
            <span className="course-module-number">{String(module.order).padStart(2, "0")}</span>
            <div>
              <h2>{module.title}</h2>
              <p className="orientation-definition">{module.question}</p>
            </div>
          </header>

          <div className="course-bridge-grid">
            <article>
              <h3>Agent systems for accountants</h3>
              <p>{module.accountants_bridge}</p>
            </article>
            <article>
              <h3>Accounting systems for builders</h3>
              <p>{module.builders_bridge}</p>
            </article>
          </div>

          <div className="note note-rule">
            <p className="note-title">Module assignment</p>
            <p>{module.assignment}</p>
          </div>

          <p className="course-related-material">
            Prepare with {module.related_material.map((item, index) => (
              <span key={item.href}>{index > 0 ? " · " : ""}<Link href={item.href}>{item.label}</Link></span>
            ))}.
          </p>

          <ol className="course-reading-list" aria-label={`${module.title} readings`}>
            {module.readings.map((reading) => (
              <li id={reading.id} key={reading.id}>
                <div className="course-reading-heading">
                  <span>{String(reading.order).padStart(2, "0")}</span>
                  <div>
                    <h3><Link href={reading.catalog_href}>{reading.title}</Link></h3>
                    <p>{reading.publisher}</p>
                  </div>
                </div>
                <div className="course-reading-meta" aria-label="Reading facts">
                  <span>{reading.evidence_tier_label}</span>
                  <span>{readingRoleLabels[reading.role]}</span>
                  <span>{reading.estimated_reading_minutes} min</span>
                  <span>{reading.source_lifecycle}</span>
                </div>
                <p className="course-reading-contribution">{reading.contribution}</p>
                <details className="course-reading-details">
                  <summary>Why it matters, limitation, and outcome</summary>
                  <dl>
                    <div><dt>Why it matters</dt><dd>{reading.why_it_matters}</dd></div>
                    <div><dt>Key limitation</dt><dd>{reading.key_limitation}</dd></div>
                    <div><dt>Learning outcome</dt><dd>{reading.learning_outcome}</dd></div>
                    <div><dt>Source status</dt><dd>{reading.source_status}{reading.source_verified_at ? ` · verified ${reading.source_verified_at}` : " · course relies on the dated catalog record"}</dd></div>
                    <div><dt>Workflow IDs</dt><dd>{reading.related_workflow_ids.map((id) => <code key={id}>{id} </code>)}</dd></div>
                    <div><dt>Course lenses</dt><dd>{reading.audience_lenses.join(", ")}</dd></div>
                  </dl>
                  <p>
                    <Link href={reading.catalog_href}>Read the catalog record</Link>
                    {" · "}
                    <a href={reading.original_href} target="_blank" rel="noreferrer">Open the primary source ↗</a>
                  </p>
                </details>
              </li>
            ))}
          </ol>
        </section>
      ))}

      <section id="capstone">
        <h2>{course.capstone.title}</h2>
        <p className="evidence-label" data-evidence-classification={course.capstone.evidence_classification}>
          Capstone ID: {course.capstone.id} · Evidence classification: synthetic example · fictional clean-room exercise
        </p>
        <p>{course.capstone.context}</p>
        <ol className="procedure-list">
          {course.capstone.guided_steps.map((step) => <li key={step}>{step}</li>)}
        </ol>
        <div className="note note-warning">
          <p className="note-title">Deliberate exception</p>
          <p>{course.capstone.deliberate_exception}</p>
        </div>
        <h3>Finished artifact: {course.capstone.finished_artifact.title}</h3>
        <p><code>{course.capstone.finished_artifact.id}</code></p>
        <ul className="check-list">
          {course.capstone.finished_artifact.fields.map((field) => <li key={field}>{field}</li>)}
        </ul>
        <p>{course.capstone.safe_reset}</p>
      </section>

      <section id="knowledge-check">
        <h2>Knowledge check</h2>
        <p>
          Choose one answer for each question. Answers stay in this browser tab;
          the site does not save or transmit them.
        </p>
        <KnowledgeCheck
          questions={course.knowledge_check}
          completionId={course.completion_artifact.id}
          completionTitle={course.completion_artifact.title}
          completionStatements={course.completion_artifact.statements}
          interpretationBoundary={course.completion_artifact.interpretation_boundary}
          completionLabel="Course check complete."
        />
      </section>

      <section id="limits">
        <h2>Limitations, rights, and next action</h2>
        <ul>{course.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}</ul>
        <p>{course.review_note}</p>
        <p>{course.next_action}</p>
        <p className="source-reference-note">
          Editorial course content: {course.rights.editorial_content}. Synthetic example and factual metadata: {course.rights.synthetic_example_and_factual_metadata}. {course.rights.external_sources}
        </p>
      </section>
    </DocsShell>
  );
}
