import { DocsShell } from "../DocsShell";
import { ResourceIndex } from "../ResourceIndex";
import { agentResources, catalogReviewedAt, catalogVersion, siteOrigin } from "../agent-interface";
import { docsMetadata } from "../docsMetadata";

const description = "A searchable index of standards, regulatory guidance, technical references, research, and documented accounting-agent practice.";

const catalogStructuredData = {
  "@context": "https://schema.org",
  "@type": "DataCatalog",
  name: "Accounting Agents source library",
  description,
  url: `${siteOrigin}/resources`,
  dateModified: catalogReviewedAt,
  inLanguage: "en",
  isAccessibleForFree: true,
  dataset: {
    "@type": "Dataset",
    name: "AI agents in accounting source catalog",
    description: `${agentResources.length} curated source records with type, owner, status, jurisdiction, access, and editorial limitations.`,
    version: catalogVersion,
    url: `${siteOrigin}/resources`,
    dateModified: catalogReviewedAt,
    inLanguage: "en",
    isAccessibleForFree: true,
    distribution: [
      {
        "@type": "DataDownload",
        encodingFormat: "application/json",
        contentUrl: `${siteOrigin}/downloads/resources.json`,
      },
      {
        "@type": "DataDownload",
        encodingFormat: "text/markdown",
        contentUrl: `${siteOrigin}/resources.md`,
      },
    ],
  },
};

export const metadata = {
  ...docsMetadata("Source library", description, "/resources"),
  alternates: {
    canonical: "/resources",
    types: {
      "application/json": "/downloads/resources.json",
      "text/markdown": "/resources.md",
    },
  },
};

export default function ResourcesPage() {
  return (
    <DocsShell
      active="/resources"
      category="Reference"
      title="Source library"
      description={description}
      headerImage={{
        src: "/images/editorial/06-global-practice.jpg",
        alt: "International filing formats arranged on a shared coordinate grid.",
      }}
      jsonHref="/downloads/resources.json"
      markdownHref="/resources.md"
      toc={[
        { href: "#method", label: "Inclusion method" },
        { href: "#index", label: "Source index" },
        { href: "#limits", label: "Use and limits" },
      ]}
      previous={{ href: "/glossary", label: "Glossary" }}
      next={{ href: "/reading-room", label: "Reading room" }}
    >
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(catalogStructuredData).replace(/</g, "\\u003c") }}
        type="application/ld+json"
      />
      <section id="method">
        <h2>Inclusion method</h2>
        <p>
          This index starts with the organization that owns the rule, standard,
          framework, technology, dataset, or implementation. It excludes generic
          summaries, unattributed claims, duplicate mirrors, and sources that do
          not help a reader design, assess, or understand accounting agents.
        </p>
        <p>
          Source type is part of the record. A regulation or auditing standard
          carries different weight from professional guidance, technical
          documentation, empirical research, or a vendor&apos;s account of its own
          product.
        </p>
        <p>
          Agents can read the same catalog through the <a href="/machine-access">machine-access interface</a>,
          including Markdown and a versioned JSON API.
        </p>
        <p>
          Readers who want a shorter path can start in the <a href="/reading-room">reading room</a>,
          which places publication status and editorial limitations beside a curated set of papers and perspectives.
        </p>
        <dl className="term-list resource-method">
          <div><dt>Rule or standard</dt><dd>Law, regulation, auditing standard, or consensus standard from its issuing body.</dd></div>
          <div><dt>Official guidance</dt><dd>Interpretive or implementation material from a regulator, standard setter, government body, or professional organization.</dd></div>
          <div><dt>Research paper</dt><dd>Peer-reviewed article or working paper. Publication status and transfer limits remain part of the record.</dd></div>
          <div><dt>Technical reference</dt><dd>Specification or documentation maintained by the organization responsible for the technology.</dd></div>
          <div><dt>Evidence</dt><dd>Benchmark, survey, report, or evaluation with a stated method and identifiable publisher.</dd></div>
          <div><dt>Thought piece</dt><dd>Reasoned analysis or practitioner interpretation. Useful for framing, not neutral authority or outcome evidence.</dd></div>
          <div><dt>Practice example</dt><dd>First-party description of a deployed product or workflow. Treat claims as illustrative, not independently validated.</dd></div>
        </dl>
      </section>

      <section id="index">
        <h2>Source index</h2>
        <ResourceIndex />
      </section>

      <section id="limits">
        <h2>Use and limits</h2>
        <ul>
          <li>Confirm jurisdiction, effective date, scope, and amendments before applying a rule or standard.</li>
          <li>Paid standards are indexed by their official catalog page; access may require a license.</li>
          <li>Technical documentation explains system behavior. It does not establish accounting or audit compliance.</li>
          <li>Research papers, benchmarks, and surveys have population, period, model, and method limits.</li>
          <li>Thought pieces clarify arguments and operating patterns. They do not become authority because they are persuasive.</li>
          <li>Practice examples describe what a provider says its product does. They are not assurance reports.</li>
        </ul>
        <p>
          The index was reviewed on August 23, 2026. Living documents and laws
          may change after that date.
        </p>
      </section>
    </DocsShell>
  );
}
