import Link from "next/link";
import { DocsShell } from "../DocsShell";
import { docsMetadata } from "../docsMetadata";
import { benchmarkCases, packs } from "../platform-data";

const description = "Portable accounting-agent specifications with synthetic fixtures, reference outputs, deterministic checks, and authority tests.";

export const metadata = {
  ...docsMetadata("Workflow packs", description, "/packs"),
  alternates: { canonical: "/packs", types: { "application/json": "/api/v1/packs", "text/markdown": "/packs.md" } },
};

export default function PacksPage() {
  return (
    <DocsShell
      active="/packs"
      category="Build"
      title="Workflow packs"
      description={description}
      headerImage={{ src: "/images/editorial/options/08-reconciliation-tieout.jpg", alt: "Abstract ledger strips aligning across a precise green tie-out line." }}
      jsonHref="/api/v1/packs"
      markdownHref="/packs.md"
      toc={[
        { href: "#use", label: "What a pack contains" },
        { href: "#library", label: "Pack library" },
        { href: "#portable", label: "Portability contract" },
        { href: "#limits", label: "Limits" },
      ]}
      previous={{ href: "/operations", label: "Production operations" }}
      next={{ href: "/bench", label: "Accounting Agent Bench" }}
    >
      <section id="use">
        <h2>From guidance to a runnable specimen</h2>
        <p>
          A pack turns one bounded workflow into a versioned specimen. It links
          the canonical guide, supplies clean-room synthetic evidence, states
          the checks and stop rules, shows a reference output, and includes five
          conformance cases. It is tool-agnostic and does not contain a model prompt.
        </p>
        <div className="corpus-summary">
          <div><strong>{packs.length}</strong><span>packs</span></div>
          <div><strong>{benchmarkCases.length}</strong><span>cases</span></div>
          <div><strong>100%</strong><span>synthetic fixtures</span></div>
        </div>
      </section>

      <section id="library">
        <h2>Pack library</h2>
        <div className="workflow-family-index">
          {packs.map((pack) => (
            <article key={pack.id}>
              <div className="family-index-header">
                <div>
                  <span className="family-code">{pack.process_family} · {pack.authority_level}</span>
                  <h3><Link href={`/packs/${pack.id}`}>{pack.title}</Link></h3>
                  <p>{pack.summary}</p>
                </div>
                <span>{benchmarkCases.filter((item) => item.pack_id === pack.id).length} cases</span>
              </div>
              <div className="source-meta" aria-label={`${pack.title} release facts`}>
                <span>Published specimen</span>
                <span>Version {pack.version}</span>
                <span>Reviewed {pack.reviewed_at}</span>
                <span>{pack.hard_gates.length} hard gates</span>
              </div>
              <p className="section-sources">{pack.expected_artifact}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="portable">
        <h2>Portability contract</h2>
        <p>
          Each pack exposes the same manifest fields, fixture and reference
          output, case categories, rights statement, source IDs, review date,
          and file inventory. Retrieve one through <code>/api/v1/packs/:id</code>
          or download the complete JSON bundle.
        </p>
        <div className="doc-link-list">
          <a href="/downloads/accounting-agent-packs.json"><strong>Download all packs</strong><span>One release-aligned JSON file.</span></a>
          <a href="/schemas/pack.schema.json"><strong>Pack schema</strong><span>JSON Schema 2020-12 contract.</span></a>
          <a href="/downloads/accounting-agent-packs.zip"><strong>Portable directory bundle</strong><span>Six self-contained pack directories.</span></a>
          <a href="/releases/current/manifest.json"><strong>Release manifest</strong><span>Versions, counts, rights, and digest.</span></a>
        </div>
      </section>

      <section id="limits">
        <h2>Limits</h2>
        <div className="note note-rule">
          <p>A pack defines preparation and evaluation. It does not approve a conclusion, grant production access, or authorize an external effect.</p>
        </div>
        <p>
          Replace synthetic fixtures only inside an organization&apos;s governed
          environment. Revalidate accounting policy, jurisdiction, materiality,
          systems, access, reviewers, retention, and action limits before use.
        </p>
      </section>
    </DocsShell>
  );
}
