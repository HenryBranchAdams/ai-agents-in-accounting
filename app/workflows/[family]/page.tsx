import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocsShell } from "../../DocsShell";
import { AuthorityTag, BulletList, SourceReferences } from "../../DomainRecords";
import { docsMetadata } from "../../docsMetadata";
import { processFamilies, workflowsForFamily } from "../../workflows-data";

type FamilyPageProps = {
  params: Promise<{ family: string }>;
};

export function generateStaticParams() {
  return processFamilies.map((family) => ({ family: family.id }));
}

export async function generateMetadata({ params }: FamilyPageProps): Promise<Metadata> {
  const { family: familyId } = await params;
  const family = processFamilies.find((candidate) => candidate.id === familyId);
  if (!family) return {};

  const canonical = `/workflows/${family.id}`;
  return {
    ...docsMetadata(
      `${family.name} workflows`,
      `${family.summary} Review the evidence, controls, authority, and accountable roles for each workflow.`,
      canonical,
    ),
    alternates: {
      canonical,
      types: {
        "application/json": `/api/v1/workflows?family=${family.id}`,
        "text/markdown": `/api/v1/workflows?family=${family.id}&format=markdown`,
      },
    },
  };
}

export default async function FamilyPage({ params }: FamilyPageProps) {
  const { family: familyId } = await params;
  const familyIndex = processFamilies.findIndex((candidate) => candidate.id === familyId);
  if (familyIndex === -1) notFound();

  const family = processFamilies[familyIndex];
  const familyWorkflows = workflowsForFamily(family.id);
  const previousFamily = processFamilies[familyIndex - 1];
  const nextFamily = processFamilies[familyIndex + 1];

  return (
    <DocsShell
      active={`/workflows/${family.id}`}
      category="Workflows"
      title={family.name}
      description={`${family.summary} This family contains ${familyWorkflows.length} governed workflow records.`}
      jsonHref={`/api/v1/workflows?family=${family.id}`}
      markdownHref={`/api/v1/workflows?family=${family.id}&format=markdown`}
      toc={[
        { href: "#ownership", label: "Ownership and boundary" },
        { href: "#workflows", label: "Workflows" },
        { href: "#baseline", label: "Baseline design" },
        { href: "#sources", label: "Source basis" },
      ]}
      previous={previousFamily
        ? { href: `/workflows/${previousFamily.id}`, label: previousFamily.name }
        : { href: "/workflows", label: "All workflows" }}
      next={nextFamily
        ? { href: `/workflows/${nextFamily.id}`, label: nextFamily.name }
        : { href: "/controls", label: "Controls and authority" }}
    >
      <section id="ownership">
        <h2>Ownership and boundary</h2>
        <dl className="record-facts">
          <div><dt>Accountable owner</dt><dd>{family.accountable_owner}</dd></div>
          <div><dt>Reviewer</dt><dd>{family.reviewer}</dd></div>
          <div><dt>Coverage</dt><dd>{familyWorkflows.length} workflow records</dd></div>
          <div><dt>Deployment rule</dt><dd>Adapt every record to the entity, systems, period, jurisdiction, materiality, and approved authority.</dd></div>
        </dl>
        <div className="note">
          <p className="note-title">Family records are starting points</p>
          <p>
            They do not replace an entity&apos;s accounting policy, risk assessment,
            control design, professional judgment, or legal requirements.
          </p>
        </div>
      </section>

      <section id="workflows">
        <h2>{family.name} workflows</h2>
        <ol className="family-workflow-list">
          {familyWorkflows.map((workflow, index) => (
            <li key={workflow.id}>
              <a href={`/workflows/${family.id}/${workflow.id}`}>
                <span className="workflow-list-number">{String(index + 1).padStart(2, "0")}</span>
                <span className="workflow-list-copy">
                  <strong>{workflow.name}</strong>
                  <small>{workflow.summary}</small>
                </span>
                <AuthorityTag level={workflow.authority_level} prefix="Boundary" />
              </a>
            </li>
          ))}
        </ol>
      </section>

      <section id="baseline">
        <h2>Baseline design</h2>
        <div className="baseline-columns">
          <article>
            <h3>Expected inputs</h3>
            <BulletList items={family.default_inputs} />
          </article>
          <article>
            <h3>Read tools</h3>
            <BulletList items={family.default_read_tools} />
          </article>
          <article>
            <h3>Required checks</h3>
            <BulletList items={family.default_checks} />
          </article>
          <article>
            <h3>Segregation of duties</h3>
            <BulletList items={family.segregation_of_duties} />
          </article>
        </div>
      </section>

      <section id="sources">
        <h2>Source basis</h2>
        <p>
          These sources inform the family-level accounting, control, and
          assurance pattern. Confirm current applicability before relying on a
          requirement or conclusion.
        </p>
        <SourceReferences ids={family.source_ids} />
      </section>
    </DocsShell>
  );
}
