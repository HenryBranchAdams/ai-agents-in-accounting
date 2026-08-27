import Link from "next/link";
import { DocsShell } from "./DocsShell";
import { packs, releaseNotes } from "./platform-data";
import { readingRoomResources } from "./reading-room-data";
import { templates } from "./reference-data";
import { resources } from "./resources-data";
import { workflowRecords } from "./workflows-data";

export default function OverviewPage() {
  return (
    <DocsShell
      active="/"
      category="Overview"
      title="AI agents in accounting"
      description="An open educational hub for learning how governed AI agents can prepare accounting and finance work."
      headerImage={{
        src: "/images/editorial/01-ledger-topology.jpg",
        alt: "Layered paper ledgers connected by a restrained green review path.",
      }}
      toc={[
        { href: "#purpose", label: "Purpose" },
        { href: "#current", label: "Current signal" },
        { href: "#operating-rule", label: "Operating rule" },
        { href: "#guide-map", label: "Choose a path" },
        { href: "#ecosystem", label: "What is here" },
        { href: "#scope", label: "Coverage and execution" },
      ]}
      next={{ href: "/start-here", label: "Start here" }}
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
          The reading room curates {readingRoomResources.length} research papers,
          professional reports, guidance documents, and disclosed practice examples.
          Templates and {packs.length} synthetic workflow packs help readers turn
          the guidance into reviewable practice without using production data.
        </p>
        <div className="corpus-summary" role="list" aria-label="Public corpus coverage">
          <div role="listitem"><strong>{workflowRecords.length}</strong><span>workflows</span></div>
          <div role="listitem"><strong>{resources.length}</strong><span>source records</span></div>
          <div role="listitem"><strong>{readingRoomResources.length}</strong><span>curated readings</span></div>
          <div role="listitem"><strong>{templates.length}</strong><span>practical templates</span></div>
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
          <Link href="/coverage">
            <strong>Coverage and gaps</strong>
            <span>See what the guide covers deeply, references, plans to expand, or keeps out of scope.</span>
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
        <h2>Choose a path</h2>
        <div className="doc-link-list">
          <Link href="/start-here">
            <strong>Learn the foundations</strong>
            <span>Take the five-minute orientation, complete one synthetic exception, and choose the path that fits your role.</span>
          </Link>
          <Link href="/workflows">
            <strong>Explore accounting workflows</strong>
            <span>Find objectives, evidence, procedures, checks, authority limits, and review requirements.</span>
          </Link>
          <Link href="/templates">
            <strong>Put the guidance to work</strong>
            <span>Use practical templates, synthetic workflow packs, and a controlled-pilot checklist.</span>
          </Link>
          <a href="/reading-room">
            <strong>Research the field</strong>
            <span>Follow curated reading paths or search the complete source catalog.</span>
          </a>
        </div>
        <p>
          Building or testing a system? Use the <Link href="/packs">workflow packs</Link> and
          {" "}<Link href="/evaluation">evaluation guide</Link>. Benchmark expansion is deferred while the
          knowledge hub, source archive, and practical learning paths take priority.
        </p>
      </section>

      <section id="ecosystem">
        <h2>A guide, library, and practical toolkit</h2>
        <p>
          Learn the concepts, find an accounting workflow, apply a control model,
          inspect practical templates, and trace claims back to their sources.
          The same operating rule runs through every path: agents prepare work;
          accountable people approve conclusions and sensitive actions.
        </p>
        <div className="doc-link-list">
          <Link href="/start-here">
            <strong>Concepts and orientation</strong>
            <span>Understand the governing rule, follow evidence to a decision, and choose an appropriate next route.</span>
          </Link>
          <Link href="/workflows">
            <strong>Workflow library</strong>
            <span>Explore sixty source-linked specifications across eight accounting families.</span>
          </Link>
          <Link href="/control-model">
            <strong>Governance and controls</strong>
            <span>Connect objectives, evidence, procedures, checks, authority, review, and records, then use the reviewer field guide to challenge prepared work.</span>
          </Link>
          <Link href="/reading-room">
            <strong>Evidence and further reading</strong>
            <span>Follow curated learning paths, then inspect the complete source catalog.</span>
          </Link>
        </div>
        <p>
          For builders, the hub also publishes <Link href="/machine-access">machine-readable access</Link>,
          {" "}<Link href="/ecosystem">open-interface guidance</Link>, and
          {" "}<Link href="/open-source">reusable source and governance records</Link>.
        </p>
      </section>

      <section id="scope">
        <h2>Coverage and execution boundary</h2>
        <p>
          The guide maps a broad core of the accounting lifecycle, including posting,
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
          Check the <a href="/coverage">versioned coverage and gaps map</a> before treating this core map as complete.
        </p>
        <p>
          Use <a href="/authority">the authority ladder</a> to classify each action
          and <a href="/sensitive-actions">Sensitive actions</a> to design the
          approval, identity, payload, rollback, and logging boundary.
        </p>
      </section>
    </DocsShell>
  );
}
