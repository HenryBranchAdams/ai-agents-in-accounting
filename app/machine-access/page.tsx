import Link from "next/link";
import { DocsShell } from "../DocsShell";
import { agentResources, siteOrigin } from "../agent-interface";
import { docsMetadata } from "../docsMetadata";
import { controlPatterns, sensitiveActions } from "../governance-data";
import { glossary, templates } from "../reference-data";
import { workflowRecords } from "../workflows-data";
import { benchmarkCases, packs } from "../platform-data";
import { ecosystemLayers } from "../ecosystem-data";

const description = "Give agents stable access to the guide through clean Markdown, a complete JSON corpus, and versioned read-only APIs.";

export const metadata = {
  ...docsMetadata("Agent access", description, "/machine-access"),
  alternates: {
    canonical: "/machine-access",
    types: {
      "application/vnd.oai.openapi+json": "/openapi.json",
      "text/markdown": "/agent-context.md",
      "application/json": "/downloads/corpus.json",
    },
  },
};

const jsonExample = `curl '${siteOrigin}/api/v1/workflows?q=reconciliation&family=record-to-report&limit=10'`;
const markdownExample = `curl -H 'Accept: text/markdown' \\
  '${siteOrigin}/api/v1/controls?q=approval&limit=20'`;
const researchExample = `curl '${siteOrigin}/api/v1/resources?kind=Research%20paper&limit=50'`;
const searchExample = `curl '${siteOrigin}/api/v1/search?q=bank%20reconciliation&type=workflow&type=pack'`;

export default function MachineAccessPage() {
  return (
    <DocsShell
      active="/machine-access"
      category="Reference"
      title="Agent access"
      description={description}
      toc={[
        { href: "#surfaces", label: "Choose a surface" },
        { href: "#api", label: "Corpus API" },
        { href: "#contract", label: "Contract and limits" },
        { href: "#accessibility", label: "Accessible by design" },
        { href: "#ecosystem", label: "Open ecosystem" },
        { href: "#webmcp", label: "WebMCP site tools" },
        { href: "#mcp", label: "When to add MCP" },
      ]}
      previous={{ href: "/reading-room", label: "Reading room" }}
    >
      <section id="surfaces">
        <h2>Choose the smallest useful surface</h2>
        <p>
          Start with the compact context file. Retrieve a focused domain
          collection for the task, then query source records when the work needs
          standards, guidance, research, or implementation evidence. Every
          machine-readable surface is public, read-only, and requires no API key.
        </p>
        <div className="doc-link-list machine-links">
          <Link href="/llms.txt">
            <strong>llms.txt</strong>
            <span>Small discovery map for agents; an emerging community convention.</span>
          </Link>
          <Link href="/AGENTS.md">
            <strong>Public agent instructions</strong>
            <span>A retrieval convenience with routing, reliance, source-use, and protocol boundaries; not a web discovery standard.</span>
          </Link>
          <Link href="/agent-context.md">
            <strong>Compact Markdown context</strong>
            <span>Definitions, lifecycle, authority, workflows, controls, architecture, and operations.</span>
          </Link>
          <Link href="/downloads/context-bundle.md">
            <strong>Full context bundle</strong>
            <span>The canonical domain corpus and complete source catalog in one Markdown document.</span>
          </Link>
          <Link href="/downloads/corpus.json">
            <strong>Canonical JSON corpus</strong>
            <span>All workflows, authority levels, action boundaries, controls, templates, terminology, and sources.</span>
          </Link>
          <Link href="/workflows.md">
            <strong>Workflow corpus in Markdown</strong>
            <span>All {workflowRecords.length} evidence-linked specifications across eight accounting families.</span>
          </Link>
          <Link href="/resources.md">
            <strong>Source catalog in Markdown</strong>
            <span>All {agentResources.length} records with provenance and limitations.</span>
          </Link>
          <Link href="/reading-room.md">
            <strong>Curated reading room in Markdown</strong>
            <span>A smaller, editorial path through papers, essays, professional reports, and disclosed practice examples.</span>
          </Link>
          <Link href="/downloads/reading-room.json">
            <strong>Curated reading room in JSON</strong>
            <span>Topic shelves, stable source IDs, source-type counts, provenance, and complete records.</span>
          </Link>
          <Link href="/downloads/resources.json">
            <strong>Source JSON snapshot</strong>
            <span>The complete versioned source catalog for local indexing or offline ingestion.</span>
          </Link>
          <Link href="/api/v1/workflows">
            <strong>Workflow API</strong>
            <span>Search by text, process family, or authority and retrieve stable workflow records.</span>
          </Link>
          <Link href="/control-model">
            <strong>Accounting Agent Control Model</strong>
            <span>Nine-element human reference with equivalent Markdown and JSON, two synthetic scenarios, and mappings for every workflow.</span>
          </Link>
          <Link href="/coverage">
            <strong>Coverage and gaps map</strong>
            <span>Versioned deep, canonical-reference, source-only, planned, and out-of-scope boundaries in equivalent human, Markdown, and JSON forms.</span>
          </Link>
          <Link href="/api/v1/search?q=reconciliation">
            <strong>Unified search API</strong>
            <span>One deterministic index across pages, workflows, sources, packs, cases, and changes.</span>
          </Link>
          <Link href="/api/v1/packs">
            <strong>Workflow-pack API</strong>
            <span>{packs.length} portable specifications with synthetic fixtures and reference outputs.</span>
          </Link>
          <Link href="/api/v1/benchmark">
            <strong>Benchmark API</strong>
            <span>{benchmarkCases.length} cases for correctness, evidence handling, and authority.</span>
          </Link>
          <Link href="/api/v1/ecosystem">
            <strong>Open ecosystem API</strong>
            <span>{ecosystemLayers.length} role-based records for direct web access, AGENTS.md, MCP, A2A, and domain contracts.</span>
          </Link>
          <Link href="/content-contract">
            <strong>Educational content contract</strong>
            <span>Seven primary page modes, visible evidence classifications, release gate, proposed measures, and equivalent Markdown and JSON.</span>
          </Link>
          <Link href="/releases/current/manifest.json">
            <strong>Release manifest</strong>
            <span>Current versions, counts, assets, rights, and a SHA-256 corpus digest.</span>
          </Link>
          <Link href="/api/v1/resources">
            <strong>Resource API</strong>
            <span>Search supporting sources by text, topic, or source type.</span>
          </Link>
          <Link href="/openapi.json">
            <strong>OpenAPI description</strong>
            <span>A machine-readable contract for generating clients or agent tools.</span>
          </Link>
          <Link href="/.well-known/api-catalog">
            <strong>Standard API catalog</strong>
            <span>RFC 9727 discovery in Linkset JSON for clients that start at the domain.</span>
          </Link>
        </div>
        <h3>Minimal integration recipe</h3>
        <ol>
          <li>Load <code>/agent-context.md</code> as durable background context.</li>
          <li>Query a focused collection such as <code>/api/v1/workflows</code>, <code>/api/v1/controls</code>, or <code>/api/v1/templates</code>.</li>
          <li>Resolve each <code>source_id</code> through <code>/api/v1/resources</code> when the task needs supporting authority or evidence.</li>
          <li>Use a workflow pack when the task needs a fixture, reference output, and evaluation contract.</li>
          <li>Preserve release and record IDs, review dates, source IDs, and rights fields in the agent&apos;s run record and handoff.</li>
        </ol>
      </section>

      <section id="api">
        <h2>Corpus API</h2>
        <p>
          All collection endpoints use the same public read-only conventions:
          JSON by default, Markdown by content negotiation, stable IDs, AND
          search, cursor pagination, cache validators, CORS, and problem details.
        </p>
        <dl className="term-list">
          <div><dt>/workflows</dt><dd>{workflowRecords.length} workflow records; filter with <code>family</code> and <code>authority</code>.</dd></div>
          <div><dt>/authority-levels</dt><dd>A0–A4 plus the human-only boundary.</dd></div>
          <div><dt>/sensitive-actions</dt><dd>{sensitiveActions.length} high-impact action boundaries.</dd></div>
          <div><dt>/controls</dt><dd>{controlPatterns.length} reusable control patterns.</dd></div>
          <div><dt>/templates</dt><dd>{templates.length} practical implementation structures.</dd></div>
          <div><dt>/glossary</dt><dd>{glossary.length} controlled terms and related concepts.</dd></div>
          <div><dt>/resources</dt><dd>{agentResources.length} source records with provenance and access notes.</dd></div>
          <div><dt>/search</dt><dd>Ranked search across every public record family with explainable match fields.</dd></div>
          <div><dt>/packs</dt><dd>{packs.length} portable workflow packs.</dd></div>
          <div><dt>/benchmark</dt><dd>{benchmarkCases.length} public synthetic conformance cases.</dd></div>
          <div><dt>/ecosystem</dt><dd>{ecosystemLayers.length} interface and standards layers with explicit adoption posture and boundaries.</dd></div>
          <div><dt>/content-contract</dt><dd>Primary educational modes, evidence classifications, release gate, and proposed success measures.</dd></div>
          <div><dt>/control-model</dt><dd>Nine canonical governance elements, two synthetic scenarios, workflow mappings, sources, and review limits.</dd></div>
          <div><dt>/coverage</dt><dd>Five coverage states, eight process-family boundaries, planned deep treatments, expansion gaps, and explicit exclusions.</dd></div>
        </dl>
        <p>Prefix each path above with <code>/api/v1</code>.</p>

        <h3>Common parameters</h3>
        <dl className="term-list">
          <div><dt>q</dt><dd>Space-separated search terms, up to 200 characters.</dd></div>
          <div><dt>family</dt><dd>Workflow process family; values are published in the taxonomy endpoint.</dd></div>
          <div><dt>authority</dt><dd>Workflow authority level from A0 through A4 or human-only.</dd></div>
          <div><dt>topic / kind</dt><dd>Source-catalog topic and source type.</dd></div>
          <div><dt>limit</dt><dd>One through 200 records. The default is 50.</dd></div>
          <div><dt>cursor</dt><dd>The last record ID from the previous page. Reuse the same filters.</dd></div>
          <div><dt>format</dt><dd><code>json</code> or <code>markdown</code>; the Accept header can also select Markdown.</dd></div>
        </dl>

        <h3>JSON example</h3>
        <pre className="code-block"><code>{jsonExample}</code></pre>

        <h3>Markdown example</h3>
        <pre className="code-block"><code>{markdownExample}</code></pre>

        <h3>Research-paper filter</h3>
        <pre className="code-block"><code>{researchExample}</code></pre>
        <p>
          Use <code>kind=Thought%20piece</code> for independent and practitioner
          perspectives. Source type is a classification, not an authority score.
        </p>

        <h3>Unified search</h3>
        <pre className="code-block"><code>{searchExample}</code></pre>
        <p>
          Results publish an ordinal <code>rank</code> and the matched fields.
          Ranking uses exact identity, prefix, title, then summary and keywords;
          it does not expose a made-up probability score.
        </p>

        <h3>Reference clients and CLI</h3>
        <p>
          The <a href="/downloads/accounting-agents-source.zip">source archive</a> includes
          zero-dependency JavaScript and Python clients and the
          <code> accounting-agents</code> CLI. They are small examples over the
          same public HTTP contract, not required frameworks.
        </p>
      </section>

      <section id="contract">
        <h2>Contract and limits</h2>
        <ul>
          <li>Version 1 is fixed in the URL. Breaking schema changes require a new version.</li>
          <li>Every workflow and source has a stable ID; workflow and source detail endpoints preserve that identity.</li>
          <li>Corpus and record versions, review dates, provenance, and field-level rights are explicit.</li>
          <li>CORS permits public read access from other applications.</li>
          <li>ETag and Last-Modified validators support conditional requests; public cache headers reduce repeated transfer.</li>
          <li>Invalid parameters and unknown IDs return structured problem details.</li>
          <li><code>/api/v1/meta</code> and <code>/api/v1/taxonomy</code> expose policy, counts, process families, authority levels, and source terms.</li>
        </ul>
        <h3 id="errors">Problem responses</h3>
        <p>
          Invalid filters, limits, cursors, formats, and record IDs return
          <code> application/problem+json</code> with <code>type</code>,
          <code> title</code>, <code>status</code>, and <code>detail</code>.
          Correct the request before retrying; do not treat an empty successful
          result as equivalent to an invalid request.
        </p>
        <div className="note">
          <p className="note-title">Rights and reliance</p>
          <p>
            Original educational records are CC BY 4.0. Project-created factual
            metadata and clean-room synthetic fixtures are CC0 1.0. Software is
            MIT. Source records link to external works that remain subject to
            each publisher&apos;s terms. Confirm jurisdiction, effective date, scope,
            amendments, rights, and access before relying on a source.
          </p>
        </div>
        <p className="section-sources">
          The interface uses the <a href="https://spec.openapis.org/oas/v3.1.2.html" rel="noreferrer" target="_blank">OpenAPI Specification</a>,
          the IETF <a href="https://www.rfc-editor.org/rfc/rfc9727.html" rel="noreferrer" target="_blank">API catalog standard</a>,
          standard HTTP caching and content negotiation, and a public <a href="/robots.txt">robots policy</a> with a <a href="/sitemap.xml">sitemap</a>.
          The <a href="https://llmstxt.org/" rel="noreferrer" target="_blank">llms.txt format</a> is an informal proposal, not a web standard.
        </p>
      </section>

      <section id="accessibility">
        <h2>Accessible by design</h2>
        <p>
          The guide uses semantic headings, landmarks, labeled controls, a skip
          link, visible keyboard focus, reduced-motion support, and ordinary
          links. Core reading does not depend on canvas, animation, or a
          proprietary chat interface.
        </p>
        <p>
          Software clients receive the same content as clean HTML, Markdown,
          and JSON. Identifiers and URLs are stable; controlled terms, errors,
          versions, provenance, dates, and rights notes are explicit.
        </p>
        <p className="section-sources">
          Human-interface decisions follow <a href="https://www.w3.org/TR/WCAG22/" rel="noreferrer" target="_blank">WCAG 2.2</a>.
          Machine interfaces use standard media types and HTTP semantics rather
          than requiring a specific agent framework.
        </p>
      </section>

      <section id="ecosystem">
        <h2>Fit each interface to its job</h2>
        <p>
          The <Link href="/ecosystem">open ecosystem map</Link> separates direct
          web retrieval, repository instructions, tool and data connection,
          agent coordination, and accounting-domain contracts. Retrieve the same
          map as <Link href="/ecosystem.md">Markdown</Link> or from the
          <Link href="/api/v1/ecosystem"> JSON API</Link>.
        </p>
        <p>
          Publishing a protocol name is not evidence of maturity. Each record
          states what this service uses, what remains optional, and which
          accounting conclusions the interface cannot establish.
        </p>
      </section>

      <section id="webmcp">
        <h2>Use page-scoped tools with WebMCP</h2>
        <p>
          In a compatible ChatGPT or Codex built-in browser, every guide page
          registers two read-only WebMCP tools. <code>accounting_agents.get_current_page</code>
          reads the current page&apos;s title, canonical URL, evidence mode, review date,
          and user-selected text. <code>accounting_agents.search</code> runs the same
          deterministic, stable-ID search as <code>/api/v1/search</code> and returns
          canonical human and API URLs.
        </p>
        <p>
          These page tools do not approve an accounting conclusion, change a
          record, post an entry, send a message, move money, alter permissions,
          or take another sensitive external action. They return the project&apos;s
          reliance boundary with each result: agents may prepare accounting work;
          accountable people approve conclusions and sensitive external actions.
          Browsers without WebMCP support keep the ordinary HTML, Markdown, JSON,
          and OpenAPI experience unchanged.
        </p>
        <p className="section-sources">
          Implementation follows OpenAI&apos;s <a href="https://learn.chatgpt.com/docs/webmcp" rel="noreferrer" target="_blank">Site tools guidance</a> and the proposed <a href="https://webmachinelearning.github.io/webmcp/" rel="noreferrer" target="_blank">WebMCP specification</a>.
        </p>
      </section>

      <section id="mcp">
        <h2>Add MCP when it adds capability</h2>
        <p>
          A separate MCP server becomes useful when the corpus needs authorized
          private resources, live subscriptions, parameterized resources, or
          callable tools. Wrapping the same public records today would add setup
          without adding information.
        </p>
        <p>
          The current HTTPS surfaces already have stable identifiers, media
          types, descriptions, review dates, search, pagination, and caching.
          MCP-capable agents can fetch these public resources directly or expose
          the OpenAPI operations as tools.
        </p>
        <p className="section-sources">
          See the <a href="https://modelcontextprotocol.io/specification/2026-07-28/server/resources" rel="noreferrer" target="_blank">MCP resources specification</a>.
        </p>
      </section>
    </DocsShell>
  );
}
