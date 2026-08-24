import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocsShell } from "../../DocsShell";
import { catalogReviewedAt, siteOrigin } from "../../agent-interface";
import { docsMetadata } from "../../docsMetadata";
import { resources } from "../../resources-data";

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
      toc={[
        { href: "#record", label: "Catalog record" },
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
          <div><dt>Source license</dt><dd>Unknown; check the publisher&apos;s terms</dd></div>
          <div><dt>Catalog metadata</dt><dd>Project-created factual fields · CC0 1.0</dd></div>
          <div><dt>Editorial annotation</dt><dd>Original summary · CC BY 4.0</dd></div>
        </dl>
      </section>

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
