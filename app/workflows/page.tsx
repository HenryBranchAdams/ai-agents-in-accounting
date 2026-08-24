import { DocsShell } from "../DocsShell";
import { AuthorityTag } from "../DomainRecords";
import { docsMetadata } from "../docsMetadata";
import { processFamilies, workflowRecords, workflowsForFamily } from "../workflows-data";

const description = "Browse sixty accounting-agent workflows across eight process families, each with an objective, evidence requirements, checks, authority, human decisions, and recovery path.";

export const metadata = {
  ...docsMetadata("Workflow library", description, "/workflows"),
  alternates: {
    canonical: "/workflows",
    types: { "application/json": "/api/v1/workflows", "text/markdown": "/workflows.md" },
  },
};

export default function WorkflowsPage() {
  return (
    <DocsShell
      active="/workflows"
      category="Workflows"
      title="Workflow library"
      description={description}
      jsonHref="/api/v1/workflows"
      markdownHref="/workflows.md"
      toc={[
        { href: "#coverage", label: "Coverage" },
        { href: "#selection", label: "Selection criteria" },
        { href: "#catalog", label: "Workflow catalog" },
        { href: "#use", label: "How to use a record" },
      ]}
      previous={{ href: "/authority", label: "Authority levels" }}
      next={{ href: "/workflows/record-to-report", label: "Record to report" }}
    >
      <section id="coverage">
        <h2>Complete lifecycle coverage</h2>
        <p>
          The library covers the recurring work of accounting, reporting,
          treasury, tax, assurance, and policy teams. Its {workflowRecords.length}
          {" "}records are educational operating specifications: they show what
          an agent may prepare, which decisions remain attributable to people,
          and which system checks must hold before any action.
        </p>
        <div className="corpus-summary" aria-label="Workflow library summary">
          <div><strong>{workflowRecords.length}</strong><span>workflows</span></div>
          <div><strong>{processFamilies.length}</strong><span>process families</span></div>
          <div><strong>6</strong><span>authority levels</span></div>
        </div>
        <div className="note note-rule">
          <p>
            Coverage is not permission. A workflow may describe posting,
            payment, filing, or certification while keeping execution
            approval-gated or human-only.
          </p>
        </div>
      </section>

      <section id="selection">
        <h2>Select the work before the model</h2>
        <p>
          Start where inputs are stable, procedures can be reproduced, and a
          named reviewer already owns the accounting outcome. Expand scope or
          authority only when retained run evidence supports the change.
        </p>
        <ul className="check-list">
          <li>Source populations have control totals or other completeness checks.</li>
          <li>Calculations, schemas, permissions, and tie-outs can run deterministically.</li>
          <li>Material, contradictory, unauthorized, and unresolved conditions stop the run.</li>
          <li>The output has an established workpaper, entry, memo, or exception format.</li>
          <li>Roles separate preparation, approval, execution, custody, and assessment.</li>
        </ul>
      </section>

      <section id="catalog">
        <h2>Workflow catalog</h2>
        <div className="workflow-family-index">
          {processFamilies.map((family) => {
            const familyWorkflows = workflowsForFamily(family.id);

            return (
              <article id={family.id} key={family.id}>
                <header className="family-index-header">
                  <div>
                    <span className="family-code">{family.short_name}</span>
                    <h3><a href={`/workflows/${family.id}`}>{family.name}</a></h3>
                    <p>{family.summary}</p>
                  </div>
                  <span>{familyWorkflows.length} workflows</span>
                </header>
                <ol className="workflow-index-list">
                  {familyWorkflows.map((workflow) => (
                    <li key={workflow.id}>
                      <a href={`/workflows/${family.id}/${workflow.id}`}>
                        <span>
                          <strong>{workflow.name}</strong>
                          <small>{workflow.summary}</small>
                        </span>
                        <AuthorityTag level={workflow.authority_level} prefix="Boundary" />
                      </a>
                    </li>
                  ))}
                </ol>
                <a className="family-index-link" href={`/workflows/${family.id}`}>
                  Open {family.name.toLowerCase()} guidance
                </a>
              </article>
            );
          })}
        </div>
      </section>

      <section id="use">
        <h2>How to use a workflow record</h2>
        <ol className="numbered-records">
          <li><strong>Confirm applicability.</strong><span>Adapt entity, period, jurisdiction, accounting framework, materiality, and accountable roles.</span></li>
          <li><strong>Verify evidence.</strong><span>Name the systems of record, extraction parameters, source owners, and reproducible control totals.</span></li>
          <li><strong>Decompose authority.</strong><span>Assign A0–A4 or human-only to each read, recommendation, approval, write, and representation.</span></li>
          <li><strong>Implement hard checks.</strong><span>Keep arithmetic, permissions, limits, payload integrity, and stop conditions outside model discretion.</span></li>
          <li><strong>Evaluate and retain.</strong><span>Test normal and failure cases, then preserve the run record, reviewer decision, and action receipt.</span></li>
        </ol>
      </section>
    </DocsShell>
  );
}
