import Link from "next/link";
import { DocsShell } from "./DocsShell";
import { benchmarkCases, packs, releaseNotes } from "./platform-data";
import { resources } from "./resources-data";
import { workflowRecords } from "./workflows-data";

export default function OverviewPage() {
  return (
    <DocsShell
      active="/"
      category="Overview"
      title="AI agents in accounting"
      description="An open, source-linked field guide, workflow-pack library, and benchmark for governed AI agents in accounting and finance."
      headerImage={{
        src: "/images/editorial/01-ledger-topology.jpg",
        alt: "Layered paper ledgers connected by a restrained green review path.",
      }}
      toc={[
        { href: "#purpose", label: "Purpose" },
        { href: "#current", label: "Current signal" },
        { href: "#operating-rule", label: "Operating rule" },
        { href: "#guide-map", label: "Guide map" },
        { href: "#ecosystem", label: "Open ecosystem" },
        { href: "#scope", label: "Coverage and execution" },
      ]}
      next={{ href: "/fundamentals", label: "Agent fundamentals" }}
    >
      <section id="purpose">
        <h2>Purpose</h2>
        <p>
          Accounting teams can use agents to collect evidence, run procedures,
          investigate exceptions, and prepare review materials. The same
          flexibility creates new questions about access, accuracy,
          documentation, and approval.
        </p>
        <p>
          This open guide describes the work in accounting terms. Sixty workflow
          records across eight process families name the objective, evidence,
          procedures, deterministic checks, authority, human decisions, failure
          modes, and retained record an implementation needs.
        </p>
        <p>
          Six portable packs turn representative workflows into synthetic,
          runnable specimens. Accounting Agent Bench tests thirty normal, edge,
          adversarial, and authority-boundary cases without using production data.
        </p>
        <div className="corpus-summary" role="list" aria-label="Public corpus coverage">
          <div role="listitem"><strong>{workflowRecords.length}</strong><span>workflows</span></div>
          <div role="listitem"><strong>{resources.length}</strong><span>source records</span></div>
          <div role="listitem"><strong>{packs.length}</strong><span>workflow packs</span></div>
          <div role="listitem"><strong>{benchmarkCases.length}</strong><span>benchmark cases</span></div>
        </div>
      </section>

      <section id="current">
        <h2>Current signal</h2>
        <div className="doc-link-list">
          <Link href={`/changes#release-${releaseNotes[0].id}`}>
            <strong>Current release · {releaseNotes[0].id}</strong>
            <span>{releaseNotes[0].summary}</span>
          </Link>
          <Link href="/reading-room#financial-services-supervision">
            <strong>Expanded reading room · 153 readings</strong>
            <span>Financial supervision, model risk, structured reporting data, field deployments, and continuous assurance.</span>
          </Link>
          <Link href="/ecosystem">
            <strong>Standards posture</strong>
            <span>See what is adopted, optional, or deferred—and what each interface cannot prove.</span>
          </Link>
        </div>
      </section>

      <section id="operating-rule">
        <h2>Operating rule</h2>
        <div className="note note-rule">
          <p>
            Agents may prepare accounting work. Accountable people approve
            conclusions and external actions.
          </p>
        </div>
        <p>
          Apply this rule to journal entries, payments, filings, policy choices,
          control assessments, and communications made in the company&apos;s name.
          The controls page explains how to write these boundaries before a run.
        </p>
      </section>

      <section id="guide-map">
        <h2>Choose the job you are here to do</h2>
        <div className="doc-link-list">
          <a href="/fundamentals">
            <strong>Learn</strong>
            <span>Start with agent fundamentals, the accounting lifecycle, authority, and controls.</span>
          </a>
          <Link href="/packs">
            <strong>Build</strong>
            <span>Use portable workflow packs, system architecture, pilot guidance, and the public specification.</span>
          </Link>
          <Link href="/bench">
            <strong>Evaluate</strong>
            <span>Run synthetic conformance cases with deterministic checks and hard authority gates.</span>
          </Link>
          <a href="/machine-access">
            <strong>Integrate</strong>
            <span>Use standard HTTP, Markdown, JSON, OpenAPI, schemas, feeds, clients, and a CLI.</span>
          </a>
        </div>
        <p>
          Or browse the <Link href="/workflows">workflow library</Link>, <Link href="/resources">source catalog</Link>,
          and <Link href="/reading-room">reading room</Link> directly.
        </p>
      </section>

      <section id="ecosystem">
        <h2>Open standards, accounting-specific constraints</h2>
        <p>
          Interoperability and domain control are different layers. Open web
          formats make the corpus easy to retrieve; AGENTS.md can guide coding
          agents; MCP can connect tools and data; A2A can coordinate independent
          agents. None of those standards decides whether an accounting action
          is supported, approved, or within authority.
        </p>
        <div className="doc-link-list">
          <Link href="/ecosystem">
            <strong>Open agent ecosystem</strong>
            <span>See the role, adoption posture, and accounting boundary for each interface.</span>
          </Link>
          <Link href="/AGENTS.md">
            <strong>Public agent instructions</strong>
            <span>Give an agent compact routing, source-use, reliance, and protocol guidance.</span>
          </Link>
          <Link href="/machine-access">
            <strong>Direct machine access</strong>
            <span>Use Markdown, JSON, deterministic search, OpenAPI, schemas, and feeds.</span>
          </Link>
          <Link href="/open-source">
            <strong>Trust and participation</strong>
            <span>Review rights, governance, contribution rules, release records, and source archive.</span>
          </Link>
        </div>
      </section>

      <section id="scope">
        <h2>Coverage and execution boundary</h2>
        <p>
          The guide covers the full accounting lifecycle, including posting,
          payments, filings, master-data changes, deletion, close operations,
          control assessment, and certification. Coverage explains how to
          specify and govern the work; it does not grant execution authority.
        </p>
        <div className="note note-rule">
          <p className="note-title">Execution remains risk-tiered</p>
          <p>
            Read, preparation, recommendation, approval-gated execution, and
            low-risk reversible action use distinct authority levels. Final
            approval, legal attestation, fiduciary authority, and ICFR or
            professional certification remain human-owned.
          </p>
        </div>
        <p>
          Use <a href="/authority">Authority levels</a> to classify each action
          and <a href="/sensitive-actions">Sensitive actions</a> to design the
          approval, identity, payload, rollback, and logging boundary.
        </p>
      </section>
    </DocsShell>
  );
}
