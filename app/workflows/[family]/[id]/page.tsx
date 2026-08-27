import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DocsShell } from "../../../DocsShell";
import {
  AuthorityTag,
  BulletList,
  ClaimReferences,
  SourceReferences,
} from "../../../DomainRecords";
import { siteOrigin } from "../../../agent-interface";
import { docsMetadata } from "../../../docsMetadata";
import { controlModelElements } from "../../../control-model";
import { resources } from "../../../resources-data";
import { processFamilies, workflowById, workflowRecords, workflowsForFamily } from "../../../workflows-data";

type WorkflowPageProps = {
  params: Promise<{ family: string; id: string }>;
};

export function generateStaticParams() {
  return workflowRecords.map((workflow) => ({
    family: workflow.family,
    id: workflow.id,
  }));
}

export async function generateMetadata({ params }: WorkflowPageProps): Promise<Metadata> {
  const { family, id } = await params;
  const workflow = workflowById.get(id);
  if (!workflow || workflow.family !== family) return {};

  const canonical = `/workflows/${workflow.family}/${workflow.id}`;
  return {
    ...docsMetadata(workflow.name, workflow.summary, canonical),
    alternates: {
      canonical,
      types: {
        "application/json": `/api/v1/workflows/${workflow.id}`,
        "text/markdown": `/api/v1/workflows/${workflow.id}?format=markdown`,
      },
    },
  };
}

export default async function WorkflowPage({ params }: WorkflowPageProps) {
  const { family: familyId, id } = await params;
  const workflow = workflowById.get(id);
  if (!workflow || workflow.family !== familyId) notFound();

  const family = processFamilies.find((candidate) => candidate.id === workflow.family);
  if (!family) notFound();

  const familyWorkflows = workflowsForFamily(family.id);
  const workflowIndex = familyWorkflows.findIndex((candidate) => candidate.id === workflow.id);
  const previousWorkflow = familyWorkflows[workflowIndex - 1];
  const nextWorkflow = familyWorkflows[workflowIndex + 1];
  const canonicalPath = `/workflows/${workflow.family}/${workflow.id}`;
  const sourceUrls = resources
    .filter((resource) => workflow.source_ids.includes(resource.id))
    .map((resource) => resource.href);
  const sourceAnnotations = Object.fromEntries(
    workflow.source_links.map((source) => [source.source_id, {
      supports: source.supports,
      claims: source.claims,
      applicability: source.applicability,
    }]),
  );
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    identifier: workflow.id,
    headline: workflow.name,
    description: workflow.summary,
    version: workflow.version,
    dateModified: workflow.reviewed_at,
    inLanguage: "en",
    mainEntityOfPage: `${siteOrigin}${canonicalPath}`,
    about: [family.name, "AI agents in accounting", workflow.authority_level],
    author: { "@type": "Organization", name: "Accounting Agents" },
    publisher: { "@type": "Organization", name: "Accounting Agents" },
    isBasedOn: sourceUrls,
  };

  return (
    <DocsShell
      active={`/workflows/${family.id}`}
      category={family.name}
      title={workflow.name}
      description={workflow.summary}
      jsonHref={`/api/v1/workflows/${workflow.id}`}
      markdownHref={`/api/v1/workflows/${workflow.id}?format=markdown`}
      reviewedAt={workflow.reviewed_at}
      toc={[
        ...(workflow.brief ? [{ href: "#one-minute-brief", label: "One-minute brief" }] : []),
        { href: "#objective", label: "Objective and scope" },
        { href: "#evidence", label: "Evidence and tools" },
        { href: "#procedure", label: "Procedure and checks" },
        { href: "#control-model", label: "Control Model mapping" },
        { href: "#authority", label: "Authority and review" },
        { href: "#output", label: "Output and record" },
        { href: "#resilience", label: "Failure and recovery" },
        { href: "#sources", label: "Source basis" },
      ]}
      previous={previousWorkflow
        ? { href: `/workflows/${family.id}/${previousWorkflow.id}`, label: previousWorkflow.name }
        : { href: `/workflows/${family.id}`, label: family.name }}
      next={nextWorkflow
        ? { href: `/workflows/${family.id}/${nextWorkflow.id}`, label: nextWorkflow.name }
        : { href: `/workflows/${family.id}`, label: `${family.name} index` }}
    >
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
        type="application/ld+json"
      />
      {workflow.brief && (
        <section className="workflow-brief" data-content-mode={workflow.brief.content_mode} id="one-minute-brief">
          <div className="workflow-brief-heading">
            <div>
              <p className="workflow-brief-kicker">One-minute workflow brief</p>
              <h2>Should you keep reading?</h2>
            </div>
            <span className="evidence-classification" data-evidence-classification={workflow.brief.evidence_classification}>
              Implementation pattern
            </span>
          </div>
          <p className="workflow-brief-outcome">{workflow.brief.outcome}</p>
          <p>{workflow.brief.why_agentic}</p>

          <div className="workflow-brief-fit">
            <article>
              <h3>Good fit</h3>
              <BulletList items={workflow.brief.best_fit} />
            </article>
            <article>
              <h3>Poor fit</h3>
              <BulletList items={workflow.brief.poor_fit} />
            </article>
          </div>

          <div className="note note-rule">
            <p className="note-title">Default authority boundary</p>
            <p>{workflow.brief.default_boundary}</p>
          </div>

          <dl className="record-facts workflow-brief-facts">
            <div><dt>Owner</dt><dd>{workflow.brief.owner}</dd></div>
            <div><dt>Reviewer</dt><dd>{workflow.brief.reviewer}</dd></div>
            <div><dt>Top check</dt><dd>{workflow.brief.top_check}</dd></div>
            <div><dt>Top failure</dt><dd>{workflow.brief.top_failure}</dd></div>
            <div><dt>Expected artifact</dt><dd>{workflow.brief.expected_artifact}</dd></div>
            <div>
              <dt>Pilot suitability</dt>
              <dd>
                <strong>{workflow.brief.pilot_suitability.rating === "good-supervised-pilot" ? "Good supervised pilot" : workflow.brief.pilot_suitability.rating}</strong>
                {` — ${workflow.brief.pilot_suitability.rationale}`}
              </dd>
            </div>
          </dl>

          <details className="workflow-brief-details">
            <summary>Open prerequisites, example, sources, and transfer limits</summary>
            <div>
              <h3>Prerequisites</h3>
              <BulletList items={workflow.brief.prerequisites} />
              <h3>Pilot conditions</h3>
              <BulletList items={workflow.brief.pilot_suitability.conditions} />

              <article className="workflow-brief-example" id={workflow.brief.synthetic_example.id}>
                <p className="evidence-label" data-evidence-classification={workflow.brief.synthetic_example.evidence_classification}>
                  Synthetic example · fictional
                </p>
                <h3>{workflow.brief.synthetic_example.title}</h3>
                <BulletList items={workflow.brief.synthetic_example.facts} />
                <p><strong>Safe decision:</strong> {workflow.brief.synthetic_example.decision}</p>
              </article>

              <div className="workflow-brief-lower">
                <article>
                  <h3>Related material</h3>
                  <ul>
                    {workflow.brief.related_material.map((item) => (
                      <li key={item.id}><Link href={item.href}>{item.label}</Link> <small>({item.kind})</small></li>
                    ))}
                  </ul>
                </article>
                <article>
                  <h3>Limits</h3>
                  <BulletList items={workflow.brief.limitations} />
                </article>
              </div>

              <h3>Primary-source basis</h3>
              <ul className="workflow-brief-sources">
                {workflow.brief.source_basis.map((source) => (
                  <li key={source.id}>
                    <Link href={`/resources/${source.id}`}><code>{source.id}</code></Link>
                    <span>{source.supports}</span>
                    <small>{source.applicability}</small>
                  </li>
                ))}
              </ul>
            </div>
          </details>

          <div className="note">
            <p className="note-title">Continue only after the fit check</p>
            <p>{workflow.brief.next_action}</p>
          </div>
          <p className="workflow-brief-review">
            Prepared {workflow.brief.prepared_at} · {workflow.brief.review_note}
          </p>
        </section>
      )}
      <section id="objective">
        <div className="record-heading-row record-heading-intro">
          <h2>Objective and scope</h2>
          <span className="controlling-boundary">
            <small>Controlling boundary</small>
            <AuthorityTag level={workflow.authority_level} />
          </span>
        </div>
        <p>{workflow.accounting_objective}</p>
        <ClaimReferences
          label="Sources for the accounting objective"
          links={workflow.source_links}
          placement="objective"
        />
        <p className="record-boundary-note">
          The controlling boundary identifies the workflow&apos;s highest-risk or
          human-reserved action. Preparation, recommendation, execution, and
          final approval are classified separately below.
        </p>
        <dl className="record-facts">
          <div><dt>Workflow ID</dt><dd><code>{workflow.id}</code> · version {workflow.version}</dd></div>
          <div><dt>Accountable owner</dt><dd>{workflow.accountable_owner}</dd></div>
          <div><dt>Reviewer</dt><dd>{workflow.reviewer}</dd></div>
          <div><dt>Trigger</dt><dd>{workflow.trigger}</dd></div>
          <div><dt>Scope</dt><dd>{workflow.scope}</dd></div>
          <div><dt>Entity</dt><dd>{workflow.entity_scope}</dd></div>
          <div><dt>Period</dt><dd>{workflow.period_scope}</dd></div>
          <div><dt>Jurisdiction</dt><dd>{workflow.jurisdiction}</dd></div>
          <div><dt>Run guard</dt><dd>{workflow.trigger_scope}</dd></div>
          <div><dt>Reviewed</dt><dd>{workflow.reviewed_at} · {workflow.review_status}</dd></div>
        </dl>
      </section>

      <section id="evidence">
        <h2>Evidence and tools</h2>
        <div className="baseline-columns">
          <article>
            <h3>Inputs</h3>
            <BulletList items={workflow.inputs} />
          </article>
          <article>
            <h3>Control totals</h3>
            <BulletList items={workflow.control_totals} />
          </article>
          <article>
            <h3>Read tools</h3>
            <BulletList items={workflow.read_tools} />
          </article>
          <article>
            <h3>Write tools</h3>
            <BulletList items={workflow.write_tools} />
          </article>
        </div>
        <ClaimReferences
          label="Sources for evidence design"
          links={workflow.source_links}
          placement="evidence"
        />
      </section>

      <section id="procedure">
        <h2>Procedure and checks</h2>
        <h3>Agent procedures</h3>
        <ol className="procedure-list">
          {workflow.agent_procedures.map((procedure) => <li key={procedure}>{procedure}</li>)}
        </ol>
        <h3>Deterministic checks</h3>
        <BulletList items={workflow.deterministic_checks} />
        <div className="note note-warning">
          <p className="note-title">Stop conditions</p>
          <BulletList items={workflow.stop_conditions} />
        </div>
      </section>

      <section id="authority">
        <h2>Authority and review</h2>
        <div className="table-wrap">
          <table>
            <caption className="sr-only">Authority allocation for {workflow.name}</caption>
            <thead>
              <tr><th>Action</th><th>Level</th><th>Agent role</th><th>Human role</th></tr>
            </thead>
            <tbody>
              {workflow.actions.map((action) => (
                <tr key={`${action.action}-${action.authority_level}`}>
                  <th scope="row">{action.action}</th>
                  <td><AuthorityTag level={action.authority_level} /></td>
                  <td>{action.agent_role}</td>
                  <td>{action.human_role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h3>Human decisions</h3>
        <BulletList items={workflow.human_decisions} />
        <h3>Thresholds</h3>
        <BulletList items={workflow.thresholds} />
        <h3>Segregation of duties</h3>
        <BulletList items={workflow.segregation_of_duties} />
        <ClaimReferences
          label="Sources for authority and controls"
          links={workflow.source_links}
          placement="authority"
        />
      </section>

      <section id="control-model">
        <h2>Accounting Agent Control Model mapping</h2>
        <p>
          This workflow applies the canonical <Link href="/control-model">Accounting Agent Control Model</Link> through
          the fields below. The mapping does not grant authority: accountable people still approve conclusions and
          sensitive external actions.
        </p>
        <div className="table-wrap">
          <table>
            <caption>Control-model elements mapped to {workflow.name} fields</caption>
            <thead><tr><th>Element</th><th>Workflow fields</th></tr></thead>
            <tbody>
              {workflow.control_model.elements.map((mapping) => (
                <tr key={mapping.element_id}>
                  <th scope="row"><Link href={`/control-model#element-${mapping.element_id}`}>{controlModelElements.find((element) => element.id === mapping.element_id)?.label}</Link></th>
                  <td>{mapping.source_fields.map((field) => <code key={field}>{field} </code>)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="output">
        <h2>Output and record</h2>
        <h3>Expected outputs</h3>
        <BulletList items={workflow.outputs} />
        <dl className="record-facts">
          <div><dt>Proposed accounting effects</dt><dd>{workflow.proposed_accounting_effects}</dd></div>
          <div><dt>Retention</dt><dd>{workflow.retention}</dd></div>
          <div><dt>Reproducibility</dt><dd>{workflow.reproducibility}</dd></div>
        </dl>
        <h3>Run record</h3>
        <BulletList items={workflow.run_record} />
        <ClaimReferences
          label="Sources for documentation and reproducibility"
          links={workflow.source_links}
          placement="record"
        />
      </section>

      <section id="resilience">
        <h2>Failure, recovery, and monitoring</h2>
        <div className="baseline-columns">
          <article>
            <h3>Failure modes</h3>
            <BulletList items={workflow.failure_modes} />
          </article>
          <article>
            <h3>Recovery actions</h3>
            <BulletList items={workflow.recovery_actions} />
          </article>
          <article>
            <h3>Pilot measures</h3>
            <BulletList items={workflow.pilot_measures} />
          </article>
          <article>
            <h3>Production signals</h3>
            <BulletList items={workflow.production_signals} />
          </article>
        </div>
      </section>

      <section id="sources">
        <h2>Source basis</h2>
        <p>
          This is an original educational workflow record informed by the
          sources below. Confirm current requirements and entity-specific
          applicability before implementation.
        </p>
        <SourceReferences annotations={sourceAnnotations} ids={workflow.source_ids} />
      </section>
    </DocsShell>
  );
}
