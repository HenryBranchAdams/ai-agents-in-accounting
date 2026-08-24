import { DocsShell } from "../DocsShell";
import { docsMetadata } from "../docsMetadata";
import { templates } from "../reference-data";

const description = "Use fourteen practical templates to specify, govern, evaluate, review, operate, and document accounting-agent work.";

export const metadata = {
  ...docsMetadata("Templates and checklists", description, "/templates"),
  alternates: {
    canonical: "/templates",
    types: { "application/json": "/api/v1/templates", "text/markdown": "/templates.md" },
  },
};

export default function TemplatesPage() {
  return (
    <DocsShell
      active="/templates"
      category="Reference"
      title="Templates and checklists"
      description={description}
      jsonHref="/api/v1/templates"
      markdownHref="/templates.md"
      toc={[
        { href: "#method", label: "How to use" },
        { href: "#index", label: "Template index" },
        { href: "#templates", label: "Template fields" },
        { href: "#minimum", label: "Minimum record" },
      ]}
      previous={{ href: "/operations", label: "Production operations" }}
      next={{ href: "/glossary", label: "Glossary" }}
    >
      <section id="method">
        <h2>Adapt the record before the run</h2>
        <p>
          These templates are implementation scaffolds, not completed controls or
          conclusions. Assign owners, adapt fields to the entity and applicable
          framework, approve the version, and connect each required field to the
          actual system of record.
        </p>
        <div className="note note-rule">
          <p>
            If a required field is unknown, leave it visibly unresolved and route
            it to an owner. Do not let the agent invent a value to complete the form.
          </p>
        </div>
      </section>

      <section id="index">
        <h2>Template index</h2>
        <nav className="template-index" aria-label="Template records">
          {templates.map((template, index) => (
            <a href={`#${template.id}`} key={template.id}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{template.name}</strong>
              <small>{template.use_when}</small>
            </a>
          ))}
        </nav>
      </section>

      <section id="templates">
        <h2>Template fields</h2>
        <div className="template-record-list">
          {templates.map((template, index) => (
            <article id={template.id} key={template.id}>
              <header>
                <span className="record-number">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{template.name}</h3>
                  <p>{template.purpose}</p>
                </div>
              </header>
              <dl className="record-facts">
                <div><dt>Use when</dt><dd>{template.use_when}</dd></div>
                <div><dt>Template ID</dt><dd><code>{template.id}</code> · version {template.version}</dd></div>
                <div><dt>Reviewed</dt><dd>{template.reviewed_at}</dd></div>
              </dl>
              <ol className="template-field-list">
                {template.sections.map((field) => (
                  <li key={field.heading}>
                    <strong>{field.heading}</strong>
                    <span>{field.prompt}</span>
                  </li>
                ))}
              </ol>
            </article>
          ))}
        </div>
      </section>

      <section id="minimum">
        <h2>Minimum record for every governed run</h2>
        <p>
          Even a small read-only pilot should retain enough information to
          understand what was attempted, reproduce the result, identify who
          reviewed it, and determine whether later work was affected.
        </p>
        <ul className="check-list">
          <li>Workflow and run identity, objective, entity, period, population, scope, and accountable roles</li>
          <li>Source register, versions, access, extraction parameters, control totals, and transformations</li>
          <li>Model, instructions, policies, tools, templates, evaluators, and environment versions</li>
          <li>Procedures, calculations, tool calls, deterministic checks, and stop events</li>
          <li>Results, exceptions, contradictory evidence, proposed effects, and limitations</li>
          <li>Reviewer disposition, approvals, exact payload, execution receipt, reconciliation, and corrections</li>
        </ul>
        <p>
          Machine-readable versions are available through <a href="/machine-access">Agent access</a>.
        </p>
      </section>
    </DocsShell>
  );
}
