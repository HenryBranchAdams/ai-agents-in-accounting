import { DocsShell } from "../DocsShell";
import { docsMetadata } from "../docsMetadata";
import { benchmark, benchmarkCases, packs } from "../platform-data";

const description = "The public Core conformance asset for fast checks of accounting result shape, evidence preservation, review routing, and authority boundaries.";

export const metadata = {
  ...docsMetadata("Core conformance suite", description, "/bench"),
  alternates: { canonical: "/bench", types: { "application/json": "/api/v1/benchmark", "text/markdown": "/bench.md" } },
};

export default function BenchPage() {
  return (
    <DocsShell
      active="/bench"
      category="Evaluate"
      title="Core conformance suite"
      description={description}
      headerImage={{ src: "/images/editorial/options/17-evaluation-rig.jpg", alt: "A spare evaluation grid with evidence blocks passing through a bounded green test path." }}
      jsonHref="/api/v1/benchmark"
      markdownHref="/bench.md"
      toc={[
        { href: "#role", label: "Role in LedgerBench" },
        { href: "#method", label: "Method" },
        { href: "#cases", label: "Case design" },
        { href: "#scoring", label: "Scoring" },
        { href: "#run", label: "Run the suite" },
        { href: "#report", label: "Report results" },
      ]}
      previous={{ href: "/ledgerbench", label: "LedgerBench program" }}
      next={{ href: "/spec", label: "Public specification" }}
    >
      <section id="role">
        <h2>A development and conformance asset, not the whole benchmark</h2>
        <p>
          This 30-case suite remains useful for fast, public, deterministic
          checks. It is one Core asset within the broader <a href="/ledgerbench">LedgerBench program</a>.
          It does not establish broad accounting competence, long-horizon
          reliability, field utility, or production readiness.
        </p>
        <div className="note">
          <p className="note-title">Program boundary</p>
          <p>
            LedgerBench separately defines capability benchmarking, neutral
            conformance, field-utility studies, GraderBench, task admission,
            hidden evaluation, statistical reporting, verification, and
            independent governance.
          </p>
        </div>
      </section>

      <section id="method">
        <h2>Measure the boundary, not just the answer</h2>
        <p>{benchmark.summary}</p>
        <p>
          A candidate receives synthetic evidence and writes a small common
          result record. The harness checks disposition, exception codes,
          evidence links, reviewer routing, and the absence of executed actions.
          It does not ask for private chain-of-thought.
        </p>
        <div className="corpus-summary">
          <div><strong>{packs.length}</strong><span>workflow packs</span></div>
          <div><strong>{benchmarkCases.length}</strong><span>cases</span></div>
          <div><strong>{benchmark.scoring.maximum_deterministic_points}</strong><span>available points</span></div>
        </div>
      </section>

      <section id="cases">
        <h2>Five fixed case types per pack</h2>
        <ol className="numbered-records">
          <li><strong>Golden</strong><span>Complete, internally consistent evidence and a review-ready draft.</span></li>
          <li><strong>Missing or wrong period</strong><span>Required evidence is absent and another record falls outside scope.</span></li>
          <li><strong>Duplicate or contradictory</strong><span>The candidate must avoid double counting and preserve the conflict.</span></li>
          <li><strong>Untrusted instruction</strong><span>An instruction inside evidence tries to alter policy, tools, or destinations.</span></li>
          <li><strong>Unauthorized action</strong><span>A request asks the candidate to cross the stated preparation boundary.</span></li>
        </ol>
      </section>

      <section id="scoring">
        <h2>Scoring and conformance</h2>
        <p>{benchmark.scoring.authority_gate}</p>
        <div className="note note-warning">
          <p className="note-title">Authority cannot be averaged away</p>
          <p>A candidate with any hard-gate failure is non-conformant even if every calculation is correct.</p>
        </div>
        <p>{benchmark.scoring.expert_review}</p>
        <ul>
          {benchmarkCases[0].expert_review_dimensions.map((dimension) => <li key={dimension}>{dimension}</li>)}
        </ul>
      </section>

      <section id="run">
        <h2>Run the suite</h2>
        <pre className="code-block"><code>{`npm run generate:platform
node scripts/run-benchmark.mjs path/to/candidate-results.json`}</code></pre>
        <div className="doc-link-list">
          <a href="/downloads/accounting-agent-bench.json"><strong>Download benchmark JSON</strong><span>Suite method and all 30 cases.</span></a>
          <a href="/downloads/accounting-agent-packs.zip"><strong>Download fixture bundle</strong><span>Portable pack directories and reference outputs.</span></a>
          <a href="/schemas/benchmark-case.schema.json"><strong>Case schema</strong><span>Machine-readable case contract.</span></a>
          <a href="/downloads/accounting-agents-source.zip"><strong>Download harness source</strong><span>MIT-licensed runner and sample result.</span></a>
        </div>
      </section>

      <section id="report">
        <h2>Report results with context</h2>
        <p>
          Identify the Core release, candidate and adapter versions,
          configuration needed to reproduce the run, deterministic case results,
          hard-gate state, and separately reviewed judgment dimensions. Do not
          present a Core result as an official LedgerBench model ranking.
        </p>
      </section>
    </DocsShell>
  );
}
