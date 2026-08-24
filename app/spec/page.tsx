import { DocsShell } from "../DocsShell";
import { docsMetadata } from "../docsMetadata";
import { benchmarkCases, packs, platformRelease } from "../platform-data";

const description = "The normative identifiers, record contracts, authority semantics, versioning, rights, and conformance rules behind Accounting Agents.";

export const metadata = docsMetadata("Public specification", description, "/spec");

export default function SpecPage() {
  return (
    <DocsShell
      active="/spec"
      category="Build"
      title="Public specification"
      description={description}
      headerImage={{ src: "/images/editorial/options/22-machine-readable-interface.jpg", alt: "Structured document layers connected by a small set of machine-readable interface ports." }}
      toc={[
        { href: "#status", label: "Status and scope" },
        { href: "#identifiers", label: "Identifiers" },
        { href: "#records", label: "Record contracts" },
        { href: "#authority", label: "Authority semantics" },
        { href: "#versioning", label: "Versioning" },
        { href: "#conformance", label: "Conformance" },
      ]}
      previous={{ href: "/bench", label: "Accounting Agent Bench" }}
      next={{ href: "/machine-access", label: "Agent access" }}
    >
      <section id="status">
        <h2>Status and scope</h2>
        <dl className="record-facts">
          <div><dt>Specification</dt><dd>{platformRelease.specification_version}</dd></div>
          <div><dt>Release</dt><dd>{platformRelease.id}</dd></div>
          <div><dt>Status</dt><dd>Public versioned specification</dd></div>
          <div><dt>Pack coverage</dt><dd>{packs.length} packs and {benchmarkCases.length} cases</dd></div>
        </dl>
        <p>
          This specification defines how records can be identified, retrieved,
          reused, evaluated, and versioned. It does not define an accounting
          standard, professional opinion, production authorization protocol, or
          universal model score.
        </p>
      </section>

      <section id="identifiers">
        <h2>Identifiers</h2>
        <dl className="term-list">
          <div><dt><code>wf-…</code></dt><dd>Canonical workflow record.</dd></div>
          <div><dt><code>src_…</code></dt><dd>Catalog record for an external or project source.</dd></div>
          <div><dt><code>ctrl-…</code></dt><dd>Reusable control pattern.</dd></div>
          <div><dt><code>tpl-…</code></dt><dd>Implementation template.</dd></div>
          <div><dt><code>pack-id</code></dt><dd>Portable workflow pack; lowercase ASCII and hyphens.</dd></div>
          <div><dt><code>pack--case</code></dt><dd>Benchmark case qualified by its pack ID.</dd></div>
        </dl>
        <p>Published IDs are stable and are never reassigned to a different concept.</p>
      </section>

      <section id="records">
        <h2>Record contracts</h2>
        <div className="doc-link-list">
          <a href="/openapi.json"><strong>OpenAPI 3.1</strong><span>Complete public HTTP contract.</span></a>
          <a href="/schemas/pack.schema.json"><strong>Pack schema</strong><span>Manifest, fixture, checks, rights, and provenance.</span></a>
          <a href="/schemas/benchmark-case.schema.json"><strong>Benchmark-case schema</strong><span>Mutations, expectations, assertions, and gates.</span></a>
          <a href="/schemas/release-manifest.schema.json"><strong>Release schema</strong><span>Digest, counts, assets, and rights.</span></a>
        </div>
        <p>
          JSON is the canonical interchange form. Markdown and HTML are human
          projections of the same records. Content negotiation never changes a
          record&apos;s identity, version, source basis, or authority boundary.
        </p>
      </section>

      <section id="authority">
        <h2>Authority semantics</h2>
        <p>
          A0 through A4 describe increasing operational capability, while
          <code> human-only</code> reserves a decision or action. The controlling
          workflow level is not permission: every action still has its own
          boundary, prerequisites, exact payload, approver, limits, and stop rules.
        </p>
        <div className="note note-rule"><p>Coverage is descriptive. Authorization must be attributable, independently enforced, and specific to the action and payload.</p></div>
      </section>

      <section id="versioning">
        <h2>Versioning and releases</h2>
        <ul>
          <li>The API path remains <code>/api/v1</code> for compatible additions.</li>
          <li>Pack and specification contracts use semantic versions.</li>
          <li>Corpus releases use immutable date-based IDs.</li>
          <li>Breaking required fields, meanings, or authority semantics require a major version and migration note.</li>
          <li>Clients should retain record ID, record version, release ID, review date, and source IDs in their run record.</li>
        </ul>
      </section>

      <section id="conformance">
        <h2>Conformance</h2>
        <p>
          A conformant pack validates against the published schema, contains
          only synthetic redistributable fixtures, resolves every internal ID,
          publishes deterministic checks and hard gates, and reproduces its
          reference output. A conformant benchmark run produces the common
          result fields and passes every hard authority gate.
        </p>
        <p className="section-sources">Normative machine contracts are the schemas, OpenAPI description, and release manifest. Human pages explain their intended use.</p>
      </section>
    </DocsShell>
  );
}
