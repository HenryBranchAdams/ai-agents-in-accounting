import { DocsShell } from "../DocsShell";
import { SourceReferences } from "../DomainRecords";
import { corpusReviewedAt } from "../domain-model";
import { processFamilies, workflowsForFamily } from "../workflows-data";
import { docsMetadata } from "../docsMetadata";

const description = "Map sixty accounting-agent workflows across the full accounting lifecycle before selecting tools or authority.";

export const metadata = docsMetadata("Accounting lifecycle", description, "/lifecycle");

export default function LifecyclePage() {
  return (
    <DocsShell
      active="/lifecycle"
      category="Learn"
      title="Accounting lifecycle"
      description={description}
      toc={[
        { href: "#map", label: "Lifecycle map" },
        { href: "#sequence", label: "Operating sequence" },
        { href: "#coverage", label: "Coverage rule" },
        { href: "#sources", label: "Source basis" },
      ]}
      previous={{ href: "/fundamentals", label: "Agent fundamentals" }}
      next={{ href: "/authority", label: "Authority levels" }}
    >
      <section id="map">
        <h2>Lifecycle map</h2>
        <p>
          Start with the accounting process, not the model. Each process family
          has a different owner, source population, accounting objective,
          authority boundary, and failure mode.
        </p>
        <div className="family-list">
          {processFamilies.map((family) => (
            <a href={`/workflows/${family.id}`} key={family.id}>
              <span className="family-code">{family.short_name}</span>
              <strong>{family.name}</strong>
              <p>{family.summary}</p>
              <span>{workflowsForFamily(family.id).length} workflows · {family.accountable_owner}</span>
            </a>
          ))}
        </div>
      </section>

      <section id="sequence">
        <h2>Operating sequence</h2>
        <ol className="numbered-records">
          <li><strong>Establish scope.</strong><span>Confirm entity, period, population, framework, jurisdiction, materiality, and owner.</span></li>
          <li><strong>Establish evidence.</strong><span>Identify authoritative sources, reproduce control totals, and preserve provenance.</span></li>
          <li><strong>Assign authority.</strong><span>Classify every action from A0 through A4 or human-only before tools are exposed.</span></li>
          <li><strong>Perform and check.</strong><span>Use approved procedures and deterministic calculations, schemas, permissions, and tie-outs.</span></li>
          <li><strong>Route exceptions.</strong><span>Stop on missing, contradictory, material, unauthorized, or out-of-policy conditions.</span></li>
          <li><strong>Review and act.</strong><span>Give the accountable person the evidence, proposed effect, open matters, and exact payload.</span></li>
          <li><strong>Retain and monitor.</strong><span>Preserve the run record, reconcile any action, measure overrides, and learn from incidents.</span></li>
        </ol>
      </section>

      <section id="coverage">
        <h2>Coverage is not permission</h2>
        <p>
          The guide covers posting, payments, filings, master-data changes,
          deletion, close operations, control assessment, and certification.
          That coverage explains how to govern the work. It does not make every
          action suitable for autonomy.
        </p>
        <div className="note note-rule">
          <p>
            Sensitive actions stay behind deterministic authorization and an
            attributable human decision. Final approval, legal attestation,
            fiduciary authority, and ICFR certification remain human-owned.
          </p>
        </div>
      </section>

      <section id="sources">
        <h2>Source and review basis</h2>
        <p>
          Reviewed {corpusReviewedAt}. The lifecycle map is an editorial
          organization of recurring accounting work. Each family and workflow
          page links its specific accounting, control, audit, tax, filing,
          payment, identity, and retention sources.
        </p>
        <SourceReferences ids={["src_1os761s", "src_0n4x3cf", "src_1v1zwt5", "src_075usnq"]} />
      </section>
    </DocsShell>
  );
}
