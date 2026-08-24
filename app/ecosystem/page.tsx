import Link from "next/link";
import { DocsShell } from "../DocsShell";
import { docsMetadata } from "../docsMetadata";
import { ecosystemLayers } from "../ecosystem-data";
import { processFamilies, workflowRecords } from "../workflows-data";

const description = "See where open agent protocols fit, where accounting-specific contracts begin, and how to participate without confusing interoperability with authority.";

const trustTracks = [
  { title: "Accuracy and reliability", detail: "Known-answer cases, repeat runs, regression, and hard authority gates.", href: "/evaluation", companionLabel: "Accounting Agent Bench" },
  { title: "Governance, risk, and regulation", detail: "Source applicability, control design, review states, and correction policy.", href: "/controls", companionLabel: "Methodology" },
  { title: "Identity and trust", detail: "Least privilege, attributable actors, segregation of duties, and action authority.", href: "/security-identity", companionLabel: "Authority levels" },
  { title: "Observability and traceability", detail: "Evidence chains, work records, monitoring, incidents, and recovery.", href: "/evidence-assurance", companionLabel: "Production operations" },
  { title: "Workflow integration", detail: "Canonical work definitions paired with portable synthetic specimens.", href: "/workflows", companionLabel: "Workflow packs" },
  { title: "Taxonomy and interoperability", detail: "Controlled terms, stable IDs, machine-readable records, and interface contracts.", href: "/glossary", companionLabel: "Taxonomy API" },
] as const;

export const metadata = {
  ...docsMetadata("Open agent ecosystem", description, "/ecosystem"),
  alternates: { canonical: "/ecosystem", types: { "text/markdown": "/ecosystem.md" } },
};

export default function EcosystemPage() {
  return (
    <DocsShell
      active="/ecosystem"
      category="Build"
      title="Open agent ecosystem"
      description={description}
      headerImage={{
        src: "/images/editorial/options/19-secure-tool-interface.jpg",
        alt: "A restrained interface boundary connecting records, tools, approvals, and review paths.",
      }}
      markdownHref="/ecosystem.md"
      toc={[
        { href: "#pattern", label: "Pattern adopted" },
        { href: "#map", label: "Standards map" },
        { href: "#workstreams", label: "Trust tracks" },
        { href: "#trust", label: "Trust surfaces" },
        { href: "#participate", label: "Ways to participate" },
      ]}
      previous={{ href: "/architecture", label: "System architecture" }}
      next={{ href: "/packs", label: "Workflow packs" }}
    >
      <section id="pattern">
        <h2>A useful foundation pattern, adapted to this field guide</h2>
        <p>
          The <a href="https://aaif.io/" rel="noreferrer" target="_blank">Agentic AI Foundation</a> makes
          projects, working groups, governance, current material, and routes to
          participate separately findable. This guide adopts that information
          pattern while keeping its own restrained documentation design and
          accounting-specific purpose. See the <Link href="/resources/src_aaif2026">catalog record</Link> for
          the source status and limitation.
        </p>
        <p>
          Accounting Agents is not an AAIF or Linux Foundation project. This is
          an interoperability map, not a statement of affiliation or endorsement.
        </p>
        <p>
          The public <Link href="/AGENTS.md">AGENTS.md</Link> file is a retrieval
          convenience inspired by the repository convention. <Link href="/llms.txt">llms.txt</Link> remains
          the primary web discovery map.
        </p>
        <div className="note note-rule">
          <p>
            Open standards make systems more portable. They do not grant an
            agent authority to post, pay, file, delete, approve, certify, or
            communicate externally.
          </p>
        </div>
      </section>

      <section id="map">
        <h2>Standards and interface map</h2>
        <p>
          Each item below has a distinct job. The posture states what this
          project uses now, what remains an optional adapter, and what would be
          misleading to publish before the service actually supports it.
        </p>
        <p className="section-sources">
          Agent-readable forms: <Link href="/ecosystem.md">Markdown</Link> · <Link href="/api/v1/ecosystem">JSON API</Link>
        </p>
        <div className="workflow-family-index ecosystem-map">
          {ecosystemLayers.map((layer) => (
            <article id={layer.id} key={layer.id}>
              <div className="family-index-header">
                <div>
                  <span className="family-code">{layer.posture}</span>
                  <h3>{layer.name}</h3>
                  <p>{layer.role}</p>
                </div>
              </div>
              <dl className="ecosystem-facts">
                <div><dt>Use here</dt><dd>{layer.use_here}</dd></div>
                <div><dt>Boundary</dt><dd>{layer.boundary}</dd></div>
              </dl>
              {(layer.local_href || layer.source_ids.length > 0) && (
                <p className="section-sources">
                  {layer.local_href && <><Link href={layer.local_href}>{layer.local_label}</Link>{layer.source_ids.length > 0 ? " · " : ""}</>}
                  {layer.source_ids.map((id, index) => (
                    <span key={id}>{index > 0 ? " · " : ""}<Link href={`/resources/${id}`}>Source {id}</Link></span>
                  ))}
                </p>
              )}
            </article>
          ))}
        </div>
      </section>

      <section id="workstreams">
        <h2>Cross-cutting trust tracks</h2>
        <p>
          AAIF&apos;s working-group presentation makes cross-cutting concerns easy to
          scan. The alignment below applies that pattern to existing guidance;
          these are editorial tracks, not committees operated by this project.
        </p>
        <div className="doc-link-list">
          {trustTracks.map((track) => (
            <Link href={track.href} key={track.title}>
              <strong>{track.title}</strong>
              <span>{track.detail} Related surface: {track.companionLabel}.</span>
            </Link>
          ))}
        </div>
        <h3>Accounting process pathways</h3>
        <p>Each pathway groups bounded objectives, evidence, owners, controls, and authority decisions.</p>
        <div className="doc-link-list">
          {processFamilies.map((family) => (
            <Link href={`/workflows/${family.id}`} key={family.id}>
              <strong>{family.name}</strong>
              <span>{workflowRecords.filter((workflow) => workflow.family === family.id).length} workflows · {family.summary}</span>
            </Link>
          ))}
        </div>
      </section>

      <section id="trust">
        <h2>Trust surfaces stay separate</h2>
        <div className="doc-link-list">
          <Link href="/methodology"><strong>Methodology</strong><span>How sources are selected, classified, reviewed, and limited.</span></Link>
          <Link href="/changes"><strong>Changes and feeds</strong><span>Immutable release notes, Atom, JSON Feed, and current manifest.</span></Link>
          <Link href="/open-source"><strong>Rights and governance</strong><span>Licenses, review roles, contribution rules, and source archive.</span></Link>
          <Link href="/resources"><strong>Source catalog</strong><span>Stable source records with type, status, jurisdiction, access, and editorial limitation.</span></Link>
        </div>
      </section>

      <section id="participate">
        <h2>Three useful ways to participate</h2>
        <ol>
          <li><strong>Correct a source record.</strong> Name the stable ID, provide the primary source, and explain the applicability change.</li>
          <li><strong>Extend a workflow pack.</strong> Use clean-room synthetic fixtures, explicit authority limits, and reproducible checks.</li>
          <li><strong>Submit a benchmark case.</strong> Define the expected outcome, evidence requirements, and any hard authority gate.</li>
        </ol>
        <p>
          The current source archive contains the contribution, correction,
          editorial, governance, and benchmark-submission policies. A public
          contribution forge is not yet configured, so the site does not imply
          that a submission channel exists before one is available.
        </p>
      </section>
    </DocsShell>
  );
}
