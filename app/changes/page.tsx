import { DocsShell } from "../DocsShell";
import { docsMetadata } from "../docsMetadata";
import { releaseNotes } from "../platform-data";

const description = "Immutable release notes, compatibility statements, and feeds for material changes to the Accounting Agents corpus.";

export const metadata = docsMetadata("Changes", description, "/changes");

export default function ChangesPage() {
  return (
    <DocsShell
      active="/changes"
      category="Project"
      title="Changes"
      description={description}
      headerImage={{ src: "/images/editorial/options/21-model-lifecycle.jpg", alt: "A restrained lifecycle sequence of versioned documents, checks, and release markers." }}
      toc={[
        { href: "#follow", label: "Follow changes" },
        ...releaseNotes.map((item) => ({ href: `#release-${item.id}`, label: item.id })),
      ]}
      previous={{ href: "/methodology", label: "Methodology" }}
      next={{ href: "/open-source", label: "Open source" }}
    >
      <section id="follow">
        <h2>Follow changes</h2>
        <p>
          Releases are immutable. Corrections and compatible additions receive
          a new ID, manifest, digest, and compatibility note.
        </p>
        <div className="doc-link-list">
          <a href="/feed.json"><strong>JSON Feed 1.1</strong><span>Release items for software clients.</span></a>
          <a href="/feed.xml"><strong>Atom feed</strong><span>Release items for feed readers.</span></a>
          <a href="/releases/current/manifest.json"><strong>Current manifest</strong><span>Release contract and corpus digest.</span></a>
          <a href="/downloads/SHA256SUMS"><strong>Archive checksums</strong><span>Verify downloadable release files.</span></a>
        </div>
      </section>

      {releaseNotes.map((item) => (
        <section id={`release-${item.id}`} key={item.id}>
          <h2>{item.id} · {item.title}</h2>
          <p>{item.summary}</p>
          <ul>{item.changes.map((change) => <li key={change}>{change}</li>)}</ul>
          <p className="section-sources">Published {item.date}. Compatibility: {item.compatibility}</p>
        </section>
      ))}
    </DocsShell>
  );
}
