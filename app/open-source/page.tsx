import { DocsShell } from "../DocsShell";
import { docsMetadata } from "../docsMetadata";

const description = "Reuse the software, educational content, metadata, and synthetic fixtures under explicit open terms, with third-party boundaries kept visible.";

export const metadata = docsMetadata("Open source", description, "/open-source");

export default function OpenSourcePage() {
  return (
    <DocsShell
      active="/open-source"
      category="Project"
      title="Open source"
      description={description}
      headerImage={{ src: "/images/editorial/options/18-provenance-chain.jpg", alt: "An abstract chain of source blocks, review marks, and release records." }}
      toc={[
        { href: "#rights", label: "Rights by material" },
        { href: "#source", label: "Source archive" },
        { href: "#contribute", label: "Contribute" },
        { href: "#governance", label: "Governance" },
        { href: "#imagery", label: "Visual assets" },
      ]}
      previous={{ href: "/changes", label: "Changes" }}
    >
      <section id="rights">
        <h2>Rights by material</h2>
        <div className="table-wrap">
          <table>
            <caption className="sr-only">Licenses by material type</caption>
            <thead><tr><th>Material</th><th>License</th><th>Boundary</th></tr></thead>
            <tbody>
              <tr><th scope="row">Software</th><td>MIT</td><td>Application code, schemas, clients, CLI, validators, and harness.</td></tr>
              <tr><th scope="row">Original content</th><td>CC BY 4.0</td><td>Guides, annotations, workflow prose, rubrics, diagrams, and cleared imagery.</td></tr>
              <tr><th scope="row">Project data</th><td>CC0 1.0</td><td>Factual metadata, project IDs, taxonomies, synthetic fixtures, and reference values.</td></tr>
              <tr><th scope="row">External works</th><td>Publisher terms</td><td>Linked sources are not copied or sublicensed.</td></tr>
            </tbody>
          </table>
        </div>
        <p>
          Public catalog responses are mixed-rights records: CC0 factual fields,
          CC BY editorial annotations, and links to external works. The API makes
          those scopes explicit instead of assigning one blanket license.
        </p>
        <div className="doc-link-list">
          <a href="/downloads/accounting-agents-source.zip"><strong>Source archive</strong><span>Release-aligned project source.</span></a>
          <a href="/downloads/SHA256SUMS"><strong>SHA-256 checksums</strong><span>Verify public archives before use.</span></a>
          <a href="/releases/current/manifest.json"><strong>Release manifest</strong><span>Machine-readable rights, counts, and digest.</span></a>
          <a href="/api/v1/meta"><strong>Corpus metadata</strong><span>Current rights and interface map.</span></a>
        </div>
      </section>

      <section id="source">
        <h2>Source archive</h2>
        <p>
          The archive includes source, content, packs, benchmark fixtures,
          clients, tests, project imagery, and an <code>AGENTS.md</code> file with
          contributor instructions. It excludes Git history,
          dependencies, build output, runtime caches, credentials, and external
          publications. A public contribution forge is not yet configured; the
          archive is the canonical downloadable source for this release.
        </p>
      </section>

      <section id="contribute">
        <h2>Contribute a correction or artifact</h2>
        <ol>
          <li>Name the affected stable IDs or routes and the user problem.</li>
          <li>Provide primary support and an applicability note for domain claims.</li>
          <li>Use only clean-room synthetic data and original explanation.</li>
          <li>State the license scope and disclose relevant conflicts.</li>
          <li>Run generation, validation, accessibility, and rendered-route tests.</li>
        </ol>
        <p>
          The archive includes <code>CONTRIBUTING.md</code>, <code>EDITORIAL_POLICY.md</code>,
          <code> CORRECTIONS.md</code>, and <code>BENCHMARK_SUBMISSIONS.md</code>.
          A public submission channel will be linked here when it exists.
        </p>
      </section>

      <section id="governance">
        <h2>Governance and review</h2>
        <p>
          Maintainers steward compatibility, rights, and release quality.
          Material accounting or assurance changes require a designated
          subject-matter reviewer before they are described as professionally
          reviewed. Automated checks and maintainer review are not labeled independent.
        </p>
        <div className="note"><p className="note-title">Security reports</p><p>Do not publish credentials, production records, or confidential accounting data. Follow the private channel named by the project host when one is available.</p></div>
      </section>

      <section id="imagery">
        <h2>Visual assets</h2>
        <p>
          The source release contains 22 project-created editorial header
          images. They are decorative, carry descriptive alternative text when
          used, contain no embedded page copy, and follow the content license
          after project rights review.
        </p>
      </section>
    </DocsShell>
  );
}
