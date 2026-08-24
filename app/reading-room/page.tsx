import Link from "next/link";
import { DocsShell } from "../DocsShell";
import { siteOrigin } from "../agent-interface";
import {
  readingRoomKindCounts,
  readingRoomResources,
  readingRoomReviewedAt,
  readingRoomSections,
} from "../reading-room-data";
import { docsMetadata } from "../docsMetadata";

const description = "A curated path through research papers, practitioner essays, professional reports, and disclosed practice examples on AI and agents in accounting.";

const structuredData = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Accounting Agents reading room",
  description,
  url: `${siteOrigin}/reading-room`,
  dateModified: readingRoomReviewedAt,
  inLanguage: "en",
  isAccessibleForFree: true,
  mainEntity: {
    "@type": "ItemList",
    numberOfItems: readingRoomResources.length,
    itemListElement: readingRoomResources.map((resource, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${siteOrigin}/resources/${resource.id}`,
      item: {
        "@type": "CreativeWork",
        name: resource.title,
        author: { "@type": "Organization", name: resource.owner },
        url: resource.href,
      },
    })),
  },
};

export const metadata = {
  ...docsMetadata("Reading room", description, "/reading-room"),
  alternates: {
    canonical: "/reading-room",
    types: {
      "application/json": "/downloads/reading-room.json",
      "text/markdown": "/reading-room.md",
    },
  },
};

export default function ReadingRoomPage() {
  return (
    <DocsShell
      active="/reading-room"
      category="Reference"
      title="Reading room"
      description={description}
      headerImage={{
        src: "/images/editorial/02-evidence-archive.jpg",
        alt: "An archive of research papers linked by a green evidence thread.",
      }}
      jsonHref="/downloads/reading-room.json"
      markdownHref="/reading-room.md"
      reviewedAt={readingRoomReviewedAt}
      toc={[
        { href: "#coverage", label: "Coverage" },
        { href: "#how-to-use", label: "How to use this room" },
        ...readingRoomSections.map((section) => ({
          href: `#${section.id}`,
          label: section.title,
        })),
      ]}
      previous={{ href: "/resources", label: "Source library" }}
      next={{ href: "/machine-access", label: "Agent access" }}
    >
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
        type="application/ld+json"
      />

      <section id="coverage">
        <h2>Coverage</h2>
        <div className="reading-room-summary" role="list" aria-label="Reading room coverage">
          <div role="listitem"><strong>{readingRoomResources.length}</strong><span>readings</span></div>
          <div role="listitem"><strong>{readingRoomSections.length}</strong><span>topic shelves</span></div>
          <div role="listitem"><strong>{readingRoomKindCounts["Research paper"]}</strong><span>research papers</span></div>
          <div role="listitem"><strong>{readingRoomKindCounts["Thought piece"]}</strong><span>thought pieces</span></div>
        </div>
        <nav aria-label="Reading room shelves" className="doc-link-list reading-room-shelf-index">
          {readingRoomSections.map((section) => (
            <a href={`#${section.id}`} key={section.id}>
              <strong>{section.title}</strong>
              <span>{section.resources.length} readings · {section.introduction}</span>
            </a>
          ))}
        </nav>
      </section>

      <section id="how-to-use">
        <h2>How to use this room</h2>
        <p>
          This is an editorial path through the larger source catalog, not a
          ranking. Each item keeps its source type, status, access note, and
          transfer limit beside the title so a persuasive essay cannot be
          mistaken for a rule or an outcome study.
        </p>
        <dl className="term-list reading-room-key">
          <div><dt>Authority</dt><dd>Identify whether the publisher is a regulator, professional body, journal, independent author, firm, or vendor.</dd></div>
          <div><dt>Status</dt><dd>Distinguish peer-reviewed work from preprints, living guidance, commentary, surveys, and announcements.</dd></div>
          <div><dt>Transfer</dt><dd>Check whether the population, task, model, period, and jurisdiction match the accounting use under review.</dd></div>
          <div><dt>Interest</dt><dd>Treat first-party and commercial claims as disclosed practice examples, not independent proof of effectiveness.</dd></div>
        </dl>
      </section>

      {readingRoomSections.map((section) => (
        <section id={section.id} key={section.id}>
          <h2>{section.title}</h2>
          <p>{section.introduction}</p>
          <div className="source-list reading-room-list">
            {section.resources.map((resource) => (
              <article key={resource.id}>
                <div className="source-meta">
                  <span>{resource.kind}</span>
                  <span>{resource.date}</span>
                </div>
                <h3>
                  <a href={resource.href} rel="noreferrer" target="_blank">
                    {resource.title}<span aria-hidden="true"> ↗</span>
                  </a>
                </h3>
                <p className="source-owner">
                  {resource.owner} · {resource.jurisdiction} · {resource.access}
                </p>
                <p>{resource.note}</p>
                <p className="source-record-link">
                  <a href={`/resources/${resource.id}`}>Catalog record · {resource.id}</a>
                </p>
              </article>
            ))}
          </div>
        </section>
      ))}

      <section id="complete-catalog">
        <h2>Continue into the catalog</h2>
        <p>
          The <Link href="/resources">complete source library</Link> includes standards,
          regulator guidance, technical references, research, surveys, and
          practice examples. Agents can retrieve the same records through the
          <Link href="/api/v1/resources"> source API</Link> and filter by source type.
        </p>
      </section>
    </DocsShell>
  );
}
