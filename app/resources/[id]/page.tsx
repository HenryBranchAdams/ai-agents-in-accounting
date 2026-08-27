import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocsShell } from "../../DocsShell";
import { catalogReviewedAt, siteOrigin } from "../../agent-interface";
import { docsMetadata } from "../../docsMetadata";
import {
  resourceCurationById,
  resourceIndustryFacets,
  resourceTimeRoles,
  resources,
  sourceEvidenceTiers,
  sourceRelationshipProfiles,
} from "../../resources-data";

type ResourcePageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return resources.map((resource) => ({ id: resource.id }));
}

export async function generateMetadata({ params }: ResourcePageProps): Promise<Metadata> {
  const { id } = await params;
  const resource = resources.find((candidate) => candidate.id === id);
  if (!resource) return {};

  return {
    ...docsMetadata(resource.title, resource.note, `/resources/${resource.id}`),
    alternates: {
      canonical: `/resources/${resource.id}`,
      types: {
        "application/json": `/api/v1/resources/${resource.id}`,
        "text/markdown": `/api/v1/resources/${resource.id}?format=markdown`,
      },
    },
  };
}

export default async function ResourcePage({ params }: ResourcePageProps) {
  const { id } = await params;
  const index = resources.findIndex((candidate) => candidate.id === id);
  if (index === -1) notFound();

  const resource = resources[index];
  const curation = resourceCurationById[resource.id];
  const relationshipProfile = sourceRelationshipProfiles[resource.id];
  const previous = resources[index - 1];
  const next = resources[index + 1];
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    identifier: resource.id,
    name: resource.title,
    publisher: { "@type": "Organization", name: "Accounting Agents" },
    dateModified: catalogReviewedAt,
    url: `${siteOrigin}/resources/${resource.id}`,
    isBasedOn: {
      "@type": "CreativeWork",
      name: resource.title,
      url: resource.href,
      publisher: { "@type": "Organization", name: resource.owner },
    },
    citation: resource.href,
    description: resource.note,
    inLanguage: "en",
  };

  return (
    <DocsShell
      active="/resources"
      category={resource.topic}
      title={resource.title}
      description={resource.note}
      jsonHref={`/api/v1/resources/${resource.id}`}
      markdownHref={`/api/v1/resources/${resource.id}?format=markdown`}
      reviewedAt={catalogReviewedAt}
      reviewStatus={curation
        ? "Agent-prepared curation; maintainer review pending"
        : "Catalog record; curation and maintainer review not yet completed"}
      trustDateLabel={curation ? "Prepared" : "Catalog updated"}
      toc={[
        { href: "#record", label: "Catalog record" },
        ...(curation ? [{ href: "#curation", label: "Curation profile" }] : []),
        ...(relationshipProfile ? [{ href: "#relationships", label: "Relationships" }] : []),
        { href: "#source", label: "Original source" },
        { href: "#machine", label: "Machine access" },
        { href: "#limits", label: "Use and limits" },
      ]}
      previous={previous
        ? { href: `/resources/${previous.id}`, label: previous.title }
        : { href: "/resources", label: "Source library" }}
      next={next
        ? { href: `/resources/${next.id}`, label: next.title }
        : { href: "/machine-access", label: "Agent access" }}
    >
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
        type="application/ld+json"
      />
      <section id="record">
        <h2>Catalog record</h2>
        <dl className="record-facts">
          <div><dt>Record ID</dt><dd><code>{resource.id}</code></dd></div>
          <div><dt>Source type</dt><dd>{resource.kind}</dd></div>
          <div><dt>Publisher</dt><dd>{resource.owner}</dd></div>
          <div><dt>Date or status</dt><dd>{resource.date}</dd></div>
          <div><dt>Jurisdiction</dt><dd>{resource.jurisdiction}</dd></div>
          <div><dt>Access</dt><dd>{resource.access}</dd></div>
          <div><dt>Catalog review</dt><dd>{catalogReviewedAt}</dd></div>
          <div><dt>Profile status</dt><dd>{relationshipProfile ? "Relationship profiled" : curation ? "Curated" : "Not yet classified"}</dd></div>
          <div><dt>Source license</dt><dd>Unknown; check the publisher&apos;s terms</dd></div>
          <div><dt>Catalog metadata</dt><dd>Project-created factual fields · CC0 1.0</dd></div>
          <div><dt>Editorial annotation</dt><dd>Original summary · CC BY 4.0</dd></div>
        </dl>
      </section>

      {curation && (
        <section id="curation">
          <h2>Curation profile</h2>
          <dl className="record-facts">
            <div>
              <dt>Applicability</dt>
              <dd>{curation.applicability.map((id) => resourceIndustryFacets.find((item) => item.id === id)?.label ?? id).join(", ")}</dd>
            </div>
            <div>
              <dt>Time role</dt>
              <dd>{resourceTimeRoles.find((item) => item.id === curation.temporal_role)?.label ?? curation.temporal_role}</dd>
            </div>
            <div><dt>Lifecycle</dt><dd>{curation.lifecycle}</dd></div>
            <div><dt>Publication status</dt><dd>{curation.publication_status}</dd></div>
            <div><dt>Curation review</dt><dd>Maintainer review pending</dd></div>
            <div><dt>Source updated</dt><dd>{curation.source_updated_at ?? "Not stated"}</dd></div>
            <div><dt>Source verified</dt><dd>{curation.source_verified_at}</dd></div>
            <div><dt>Next review</dt><dd>{curation.next_review_at}</dd></div>
            <div><dt>Commercial interest</dt><dd>{curation.commercial_interest}</dd></div>
          </dl>
          <h3>Applicability note</h3>
          <p>{curation.applicability_note}</p>
          <h3>Method or source basis</h3>
          <p>{curation.method}</p>
          <h3>Transfer limit</h3>
          <p>{curation.transfer_limit}</p>
        </section>
      )}

      {relationshipProfile && (
        <section id="relationships">
          <h2>Questions, claims, and relationships</h2>
          <p>
            This agent-prepared profile is awaiting maintainer review. It helps readers decide
            why to use the source, what it can support, and what still needs accountable
            professional judgment. It is not independent review or assurance.
          </p>
          <dl className="record-facts">
            <div>
              <dt>Evidence tier</dt>
              <dd>{sourceEvidenceTiers.find((item) => item.id === relationshipProfile.evidence_tier)?.label ?? relationshipProfile.evidence_tier}</dd>
            </div>
            <div><dt>Importance</dt><dd>{relationshipProfile.importance}</dd></div>
            <div><dt>Difficulty</dt><dd>{relationshipProfile.difficulty}</dd></div>
            <div><dt>Reading time</dt><dd>{relationshipProfile.estimated_reading_minutes} minutes</dd></div>
            <div><dt>Audience</dt><dd>{relationshipProfile.audiences.join(", ")}</dd></div>
            <div><dt>Review status</dt><dd>Maintainer review pending</dd></div>
          </dl>

          <h3>Questions this source helps answer</h3>
          <ul>{relationshipProfile.questions.map((question) => <li key={question}>{question}</li>)}</ul>

          <h3>Claims and evidence classification</h3>
          <ul>
            {relationshipProfile.claims.map((claim) => (
              <li key={claim.id}>
                {claim.text} <small>({claim.evidence_classification})</small>
              </li>
            ))}
          </ul>

          <h3>Contrary or limiting evidence</h3>
          <ul>
            {relationshipProfile.contrary_claims.map((claim) => (
              <li key={claim.text}>
                {claim.text} <small>({claim.evidence_classification})</small>{" "}
                {claim.source_ids.map((sourceId, claimIndex) => {
                  const related = resources.find((item) => item.id === sourceId);
                  return (
                    <span key={sourceId}>
                      {claimIndex > 0 ? ", " : "("}
                      <a href={`/resources/${sourceId}`}>{related?.title ?? sourceId}</a>
                      {claimIndex === claim.source_ids.length - 1 ? ")" : ""}
                    </span>
                  );
                })}
              </li>
            ))}
          </ul>

          <h3>Prerequisites and expected outcome</h3>
          <p><strong>Before reading:</strong> {relationshipProfile.prerequisites}</p>
          <p><strong>Expected outcome:</strong> {relationshipProfile.expected_outcome}</p>

          <h3>Synthetic accounting example</h3>
          <p>{relationshipProfile.accounting_example.text}</p>
          <p><small>Evidence classification: synthetic example.</small></p>

          <h3>Workflow and implementation links</h3>
          <ul>
            {relationshipProfile.related_paths.map((item) => (
              <li key={item.href}><a href={item.href}>{item.label}</a></li>
            ))}
            {relationshipProfile.workflow_ids.map((workflowId) => (
              <li key={workflowId}><a href={`/api/v1/workflows/${workflowId}`}>Workflow record · {workflowId}</a></li>
            ))}
          </ul>

          <h3>Related sources and supersession</h3>
          <ul>
            {relationshipProfile.related_source_ids.map((sourceId) => {
              const related = resources.find((item) => item.id === sourceId);
              return <li key={sourceId}><a href={`/resources/${sourceId}`}>{related?.title ?? sourceId}</a></li>;
            })}
          </ul>
          <p>
            Supersedes: {relationshipProfile.supersedes.length ? relationshipProfile.supersedes.join(", ") : "none recorded"}.
            {" "}Superseded by: {relationshipProfile.superseded_by ?? "none recorded"}.
          </p>

          <h3>Limitations</h3>
          <ul>{relationshipProfile.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}</ul>

          <h3>Next action</h3>
          <p>{relationshipProfile.next_action}</p>
        </section>
      )}

      <section id="source">
        <h2>Original source</h2>
        <p>
          <a href={resource.href} rel="noreferrer" target="_blank">
            Open the source at {resource.owner}<span aria-hidden="true"> ↗</span>
          </a>
        </p>
        <p>
          This page indexes citation metadata and an original editorial summary;
          it does not reproduce or relicense the publisher&apos;s content.
        </p>
      </section>

      <section id="machine">
        <h2>Machine access</h2>
        <ul>
          <li><a href={`/api/v1/resources/${resource.id}`}>JSON record</a></li>
          <li><a href={`/api/v1/resources/${resource.id}?format=markdown`}>Markdown record</a></li>
          <li><a href="/openapi.json">OpenAPI contract</a></li>
        </ul>
      </section>

      <section id="limits">
        <h2>Use and limits</h2>
        <ul>
          <li>Confirm current text, amendments, jurisdiction, entity, period, and facts.</li>
          <li>A technical or implementation source does not establish accounting authority or control effectiveness.</li>
          <li>Public access does not imply permission to copy or redistribute the source.</li>
          <li>Use the publisher&apos;s canonical page when citing or relying on the underlying material.</li>
        </ul>
      </section>
    </DocsShell>
  );
}
