import Link from "next/link";
import { DocsShell } from "../DocsShell";
import { ObservatoryIndex } from "../ObservatoryIndex";
import { docsMetadata } from "../docsMetadata";
import {
  accountingAgentsPracticeObservatory,
  practiceObservatoryItems,
  practiceObservatoryLanes,
} from "../practice-observatory";
import { resourceIndustryFacets } from "../resources-data";

const observatory = accountingAgentsPracticeObservatory;

export const metadata = {
  ...docsMetadata(observatory.title, observatory.description, "/observatory"),
  alternates: {
    canonical: "/observatory",
    types: {
      "text/markdown": "/observatory.md",
      "application/json": "/api/v1/observatory",
    },
  },
};

export default function PracticeObservatoryPage() {
  return (
    <DocsShell
      active="/observatory"
      category="Library"
      title={observatory.title}
      description={observatory.description}
      reviewedAt={observatory.snapshot_as_of}
      trustDateLabel="Snapshot as of"
      reviewStatus="Maintainer review pending; subject-matter, independent, professional, audit, certification, or assurance review is not claimed"
      markdownHref="/observatory.md"
      jsonHref="/api/v1/observatory"
      toc={[
        { href: "#how-to-use", label: "How to use it" },
        { href: "#method", label: "Method and boundaries" },
        { href: "#records", label: "Current developments" },
        { href: "#limits", label: "Limits and next action" },
      ]}
      previous={{ href: "/reading-room", label: "Reading room" }}
      next={{ href: "/resources", label: "Source library" }}
    >
      <section id="how-to-use">
        <h2>A dated field index, not a leaderboard</h2>
        <p>{observatory.scope.question}</p>
        <dl className="record-facts">
          <div><dt>Observatory ID</dt><dd><code>{observatory.id}</code> · version {observatory.version}</dd></div>
          <div><dt>Coverage</dt><dd>{observatory.counts.records} current-development records across {observatory.counts.lanes} source lanes</dd></div>
          <div><dt>Evidence profiles</dt><dd>{observatory.counts.relationship_profiled_records} records have an assigned relationship profile; the rest are visibly pending</dd></div>
          <div><dt>Primary mode</dt><dd>Evidence synthesis · editorial recommendation</dd></div>
        </dl>
        <div className="note note-rule">
          <p>{observatory.governing_rule.text}</p>
        </div>
        <p className="evidence-label" data-evidence-classification={observatory.governing_rule.evidence_classification}>
          Evidence classification: editorial recommendation
        </p>
        <p>{observatory.governing_rule.implication}</p>
        <p>
          Start with a type or industry filter. Open the catalog record for the
          method and transfer limit, then follow the original source. Use the
          <Link href="/reading-room"> reading room</Link> for a guided curriculum and the
          <Link href="/resources"> source library</Link> for the full archive.
        </p>
      </section>

      <section id="method">
        <h2>Method and boundaries</h2>
        <h3>Admission rules</h3>
        <ul className="check-list">
          {observatory.scope.admission_rules.map((rule) => <li key={rule}>{rule}</li>)}
        </ul>
        <div className="note note-warning">
          <p className="note-title">What the index does not provide</p>
          <ul>{observatory.scope.exclusions.map((exclusion) => <li key={exclusion}>{exclusion}</li>)}</ul>
        </div>
        <h3>Freshness</h3>
        <p>{observatory.freshness.ordering}</p>
        <p>{observatory.freshness.source_date_boundary}</p>
        <p>{observatory.freshness.monitoring_boundary}</p>
        <p>
          The lane and coverage counts describe this snapshot only. They are not
          product scores, field trends, adoption measures, or outcome metrics.
        </p>
      </section>

      <section id="records">
        <h2>Current developments</h2>
        <p>
          Industry filters match reviewed applicability exactly. A “general”
          record is not silently inserted into a specific industry view, and an
          unprofiled record is not assigned an evidence tier by inference.
        </p>
        <ObservatoryIndex
          industries={resourceIndustryFacets}
          items={practiceObservatoryItems}
          lanes={practiceObservatoryLanes}
        />
      </section>

      <section id="limits">
        <h2>Limitations, rights, and next action</h2>
        <ul>{observatory.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}</ul>
        <p>{observatory.next_action}</p>
        <p>{observatory.review_note}</p>
        <p className="source-reference-note">
          Editorial content: {observatory.rights.editorial_content}. Factual metadata: {observatory.rights.factual_metadata}. {observatory.rights.external_sources}
        </p>
      </section>
    </DocsShell>
  );
}
