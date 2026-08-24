import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocsShell } from "../../DocsShell";
import { BulletList, SourceReferences } from "../../DomainRecords";
import { siteOrigin } from "../../agent-interface";
import { docsMetadata } from "../../docsMetadata";
import { benchmarkCases, packById, packs } from "../../platform-data";

type PackPageProps = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return packs.map((pack) => ({ id: pack.id }));
}

export async function generateMetadata({ params }: PackPageProps): Promise<Metadata> {
  const { id } = await params;
  const pack = packById.get(id);
  if (!pack) return {};
  const canonical = `/packs/${pack.id}`;
  return {
    ...docsMetadata(pack.title, pack.summary, canonical),
    alternates: { canonical, types: { "application/json": `/api/v1/packs/${pack.id}`, "text/markdown": `/api/v1/packs/${pack.id}?format=markdown` } },
  };
}

export default async function PackPage({ params }: PackPageProps) {
  const { id } = await params;
  const packIndex = packs.findIndex((item) => item.id === id);
  if (packIndex === -1) notFound();
  const pack = packs[packIndex];
  const cases = benchmarkCases.filter((item) => item.pack_id === pack.id);
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    identifier: pack.id,
    name: pack.title,
    description: pack.summary,
    version: pack.version,
    dateModified: pack.reviewed_at,
    codeRepository: `${siteOrigin}/downloads/accounting-agents-source.zip`,
    license: ["https://opensource.org/license/mit", "https://creativecommons.org/licenses/by/4.0/", "https://creativecommons.org/publicdomain/zero/1.0/"],
    isBasedOn: pack.source_ids.map((sourceId) => `${siteOrigin}/resources/${sourceId}`),
  };

  return (
    <DocsShell
      active="/packs"
      category="Workflow packs"
      title={pack.title}
      description={pack.summary}
      reviewedAt={pack.reviewed_at}
      jsonHref={`/api/v1/packs/${pack.id}`}
      markdownHref={`/api/v1/packs/${pack.id}?format=markdown`}
      toc={[
        { href: "#contract", label: "Pack contract" },
        { href: "#procedure", label: "Procedure and checks" },
        { href: "#fixture", label: "Fixture and output" },
        { href: "#cases", label: "Benchmark cases" },
        { href: "#rights", label: "Rights and sources" },
      ]}
      previous={packs[packIndex - 1] ? { href: `/packs/${packs[packIndex - 1].id}`, label: packs[packIndex - 1].title } : { href: "/packs", label: "All packs" }}
      next={packs[packIndex + 1] ? { href: `/packs/${packs[packIndex + 1].id}`, label: packs[packIndex + 1].title } : { href: "/bench", label: "Accounting Agent Bench" }}
    >
      <script dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} type="application/ld+json" />
      <section id="contract">
        <h2>Pack contract</h2>
        <dl className="record-facts">
          <div><dt>Pack ID</dt><dd><code>{pack.id}</code> · version {pack.version}</dd></div>
          <div><dt>Process family</dt><dd>{pack.process_family}</dd></div>
          <div><dt>Authority boundary</dt><dd>{pack.authority_level}</dd></div>
          <div><dt>Accountable owner</dt><dd>{pack.accountable_owner}</dd></div>
          <div><dt>Scope</dt><dd>{pack.scope}</dd></div>
          <div><dt>Jurisdiction</dt><dd>{pack.jurisdiction}</dd></div>
          <div><dt>Expected artifact</dt><dd>{pack.expected_artifact}</dd></div>
          <div><dt>Status</dt><dd>{pack.review_status}</dd></div>
        </dl>
        <h3>Canonical workflow records</h3>
        <ul>{pack.workflow_ids.map((workflowId) => <li key={workflowId}><a href={`/api/v1/workflows/${workflowId}`}>{workflowId}</a></li>)}</ul>
      </section>

      <section id="procedure">
        <h2>Procedure and checks</h2>
        <div className="baseline-columns">
          <article><h3>Inputs</h3><BulletList items={pack.inputs} /></article>
          <article><h3>Procedures</h3><BulletList items={pack.procedures} /></article>
          <article><h3>Deterministic checks</h3><BulletList items={pack.deterministic_checks} /></article>
          <article><h3>Hard gates</h3><BulletList items={pack.hard_gates} /></article>
        </div>
      </section>

      <section id="fixture">
        <h2>Fixture and reference output</h2>
        <p>Every value below is fictional and created for this project.</p>
        <h3>Base fixture</h3>
        <pre className="code-block"><code>{JSON.stringify(pack.fixture, null, 2)}</code></pre>
        <h3>Reference output</h3>
        <pre className="code-block"><code>{JSON.stringify(pack.reference_output, null, 2)}</code></pre>
      </section>

      <section id="cases">
        <h2>Benchmark cases</h2>
        <div className="table-wrap">
          <table>
            <caption className="sr-only">Benchmark cases for {pack.title}</caption>
            <thead><tr><th>Case</th><th>Type</th><th>Expected</th><th>Gate</th></tr></thead>
            <tbody>
              {cases.map((item) => (
                <tr id={item.id} key={item.id}>
                  <th scope="row"><code>{item.id}</code></th>
                  <td>{item.case_type}</td>
                  <td>{item.expected.outcome}</td>
                  <td>{item.hard_authority_gate ? "Hard" : "Required"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="rights">
        <h2>Rights and sources</h2>
        <dl className="record-facts">
          <div><dt>Metadata and fixtures</dt><dd>{pack.licenses.manifest_and_factual_metadata}</dd></div>
          <div><dt>Explanatory content</dt><dd>{pack.licenses.original_explanatory_content}</dd></div>
          <div><dt>Code</dt><dd>{pack.licenses.code}</dd></div>
          <div><dt>External sources</dt><dd>{pack.licenses.external_sources}</dd></div>
        </dl>
        <SourceReferences ids={pack.source_ids} />
      </section>
    </DocsShell>
  );
}
