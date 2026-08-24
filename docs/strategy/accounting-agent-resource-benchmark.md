# Accounting Agents as a canonical human- and machine-readable resource

**Research date:** 2026-08-23  
**Scope:** Discovery, retrieval, accessibility, provenance, evaluation, source rights, and reference architectures for a public knowledge resource about agents in accounting and finance.  
**Source policy:** Primary sources only: standards bodies, official specifications and documentation, regulators, publishers' rights pages, and first-party source repositories.  
**Rights note:** This is an operational research brief, not legal advice. Ambiguous reuse, commercial use, training use, or publisher-controlled full text should go through the relevant licensor or counsel before ingestion.

## Executive decision

Accounting Agents should become canonical by being the most **traceable, current, rights-aware, and interoperable index** of the field—not by trying to mirror every useful document. Its durable product should be a versioned record system from which the website, Markdown pages, JSON API, catalog downloads, citations, and optional agent adapters are generated.

The recommended hierarchy is:

1. **Canonical corpus:** stable records, source and rights metadata, claim-level citations, review state, dates, and relationships.
2. **Human web:** accessible semantic HTML, plain-language explanations, evidence tables, and task-oriented navigation.
3. **Ordinary machine web:** explicit Markdown and JSON representations, sitemap, robots policy, OpenAPI, API catalog, cache validators, and snapshots.
4. **Agent conveniences:** a small `/llms.txt` orientation file and, only after demand is demonstrated, a read-only Model Context Protocol (MCP) adapter.
5. **Not yet:** Agent2Agent (A2A). A2A is for communication between agentic applications, while this project is first a knowledge service.

This order matters. HTTP semantics, Web Linking, JSON-LD, WCAG, OpenAPI, and API-catalog discovery are mature contracts. `/llms.txt`, MCP, and A2A are useful but emerging ecosystem protocols; none should be the only route to the corpus.

## 1. Standards and convention status map

| Capability | Status as of research date | Appropriate role here | Do not assume |
|---|---|---|---|
| HTTP representations, negotiation, validators | **Established Internet standard.** HTTP semantics defines `Accept`, `Vary`, `ETag`, `Last-Modified`, and conditional requests. ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html)) | Reliable delivery and caching of HTML, Markdown, JSON, and downloads. | Content negotiation alone is discoverable by weak clients. Publish explicit alternate URLs too. |
| Web links | **Established Internet standard.** Typed links can be carried in HTTP `Link` headers and serialized linksets. ([RFC 8288](https://www.rfc-editor.org/rfc/rfc8288.html), [RFC 9264](https://www.rfc-editor.org/rfc/rfc9264.html)) | Advertise alternate representations and API catalogs. | A link relation grants permission to copy its target. |
| Markdown media type | **Established Internet standard.** `text/markdown` is the registered media type for Markdown. ([RFC 7763](https://www.rfc-editor.org/rfc/rfc7763.html)) | Label Markdown pages and alternate links unambiguously. | A media type defines a payload's syntax, not its completeness or authority. |
| API catalog discovery | **Established Internet standard.** RFC 9727 defines `/.well-known/api-catalog` and the `api-catalog` relation. ([RFC 9727](https://www.rfc-editor.org/rfc/rfc9727.html)) | Let developers and agents find API descriptions without guessing paths. | `/.well-known/openapi` is standardized; it is not. |
| OpenAPI | **Established industry specification**, governed by the OpenAPI Initiative rather than IETF or W3C. OpenAPI 3.2.0 describes HTTP APIs for human and machine discovery and supports documentation, code generation, and testing. ([OpenAPI 3.2.0](https://spec.openapis.org/oas/v3.2.0.html)) | Contract for search, record, taxonomy, release, and health endpoints. | OpenAPI describes the API but supplies neither content authority nor reuse rights. |
| JSON-LD | **W3C Recommendation.** JSON-LD 1.1 is a JSON serialization for linked data and interoperable web services. ([JSON-LD 1.1](https://www.w3.org/TR/json-ld11/)) | Embed structured identity, citation, license, publisher, and relationship metadata in HTML and JSON. | JSON-LD replaces the canonical record or API schema. |
| DCAT and PROV-O | **W3C Recommendations/vocabularies.** DCAT models catalogs, datasets, distributions, versions, rights, and checksums; PROV-O models entities, agents, activities, attribution, derivation, quotation, revision, and primary sources. ([DCAT 3](https://www.w3.org/TR/vocab-dcat-3/), [PROV-O](https://www.w3.org/TR/prov-o/)) | Vocabulary for releases, representations, provenance, and source relationships. | Vocabulary use automatically makes metadata complete or accurate. |
| Schema.org | **Widely used shared vocabulary**, maintained as a community project rather than an IETF protocol or W3C Recommendation. `DataCatalog`, `Dataset`, and `CreativeWork` include citation, license, version, and source relationships. ([About Schema.org](https://schema.org/docs/about.html), [DataCatalog](https://schema.org/DataCatalog), [Dataset](https://schema.org/Dataset), [CreativeWork](https://schema.org/CreativeWork)) | Search-facing JSON-LD embedded in canonical HTML. | Search engines or agents will interpret every property identically. |
| XML sitemap | **Established search-engine convention.** The protocol defines URL discovery metadata such as location and last modification. ([Sitemaps protocol](https://www.sitemaps.org/protocol.html)) | Exhaustive crawl discovery. | A sitemap is a content API or evidence of authority. |
| `robots.txt` | **Established Internet standard.** The Robots Exclusion Protocol communicates crawler access preferences and is not access authorization. ([RFC 9309](https://www.rfc-editor.org/rfc/rfc9309.html)) | Crawl policy. | It protects private or licensed content. Use authentication and rights controls for that. |
| `/llms.txt` | **Emerging proposal.** The project describes itself as a proposal and specifies a small Markdown file linking to detail; version 2 explicitly positions it alongside, not instead of, sitemaps and robots. ([llms.txt v2](https://llmstxt.org/)) | Curated orientation and high-value entry points for language-model clients. | Universal client support, crawler compliance, authorization, freshness guarantees, or an API contract. |
| MCP | **Emerging open ecosystem protocol**, not an IETF or W3C standard. The 2026-07-28 specification defines JSON-RPC interactions and server-provided resources, prompts, and tools, with explicit consent and security requirements. ([MCP specification and security principles](https://modelcontextprotocol.io/specification/2026-07-28)) | Optional read-only adapter for clients that already speak MCP. | MCP should be the source of truth or that tool descriptions are trusted. |
| A2A | **Emerging open ecosystem protocol.** A2A describes communication and task lifecycles between opaque agentic applications and distinguishes that role from MCP's agent-to-tool integration. ([A2A specification](https://a2a-protocol.org/latest/specification/), [official A2A repository](https://github.com/a2aproject/A2A)) | Relevant only if Accounting Agents later operates a delegated research agent with an agent card and task lifecycle. | A static knowledge site or read-only API needs an A2A endpoint. |

## 2. Target architecture: one corpus, several projections

### 2.1 The canonical unit is a record, not a page

Each resource should have a permanent opaque ID that survives title, taxonomy, and URL-label changes. The record should separate source facts from Accounting Agents' own synthesis and should make authority, time, jurisdiction, and rights explicit.

Recommended minimum record contract:

```json
{
  "id": "aar_01J...",
  "kind": "standard|regulation|paper|essay|case|tool|dataset|guide",
  "title": "...",
  "canonical_url": "https://accountingagents.org/resources/aar_01J...",
  "summary": "Original Accounting Agents summary",
  "jurisdictions": ["US"],
  "topics": ["audit", "agent-governance"],
  "source_authority": "regulator|standard-setter|peer-reviewed|first-party|practitioner",
  "review_state": "draft|reviewed|superseded|withdrawn",
  "source_published_at": "2026-01-01",
  "source_updated_at": null,
  "verified_at": "2026-08-23T00:00:00Z",
  "record_updated_at": "2026-08-23T00:00:00Z",
  "version": "2026.08.1",
  "content_hash": "sha256:...",
  "rights": {
    "owner": "...",
    "status": "public_domain|open_license|permission|link_only|unknown",
    "license_url": "...",
    "full_text_stored": false,
    "notes": "..."
  },
  "sources": [
    {
      "source_id": "src_...",
      "url": "https://...",
      "publisher": "...",
      "pinpoint": "section or page",
      "relationship": "primary_source|derived_from|quotes|revision_of"
    }
  ],
  "claims": [
    {
      "claim_id": "clm_...",
      "text": "...",
      "classification": "source_fact|site_synthesis|recommendation",
      "citation_source_ids": ["src_..."]
    }
  ],
  "supersedes": [],
  "replaced_by": []
}
```

The provenance relationships correspond to established PROV-O distinctions such as derivation, primary source, quotation, and revision, while the release metadata follows DCAT's separation of a dataset from its downloadable distributions. DCAT also places rights and licenses on each distribution because formats can have different rights, and it defines checksums for integrity verification. ([PROV-O](https://www.w3.org/TR/prov-o/), [DCAT 3 versioning](https://www.w3.org/TR/vocab-dcat-3/#dataset-versions), [DCAT 3 rights](https://www.w3.org/TR/vocab-dcat-3/#license-rights), [DCAT 3 checksum](https://www.w3.org/TR/vocab-dcat-3/#Class:Checksum))

`source_authority` must not be confused with an agent's permission to take action. A regulator can be a high-authority source while a deployed agent still has read-only or draft-only authority.

### 2.2 Human and machine routes

All public projections should be built from the same validated record set. A practical route contract is:

| Route | Representation | Purpose |
|---|---|---|
| `/resources/{id}` | HTML | Canonical human page with visible source, rights, review state, dates, and citations. |
| `/resources/{id}.md` | Markdown | Compact agent/developer representation with the same material claims and citations. |
| `/api/v1/resources/{id}` | JSON | Complete structured record. |
| `/api/v1/resources` | JSON | Filterable, cursor-paginated catalog. |
| `/api/v1/search` | JSON | Lexical/filter search with stable result IDs and explicit ranking metadata. |
| `/api/v1/taxonomy` | JSON | Topics, jurisdictions, kinds, source-authority values, and relationships. |
| `/api/v1/meta` | JSON | Corpus version, schema version, generated time, record count, and license policy. |
| `/releases/{release}/manifest.json` | JSON | Immutable release manifest, files, hashes, schema version, and changelog. |
| `/releases/{release}/resources.jsonl` | JSON Lines | Bulk machine snapshot. |
| `/releases/{release}/resources.md` | Markdown | Bulk readable snapshot when redistribution rights permit. |
| `/openapi.json` | OpenAPI JSON | Validated API contract. |
| `/.well-known/api-catalog` | Linkset JSON | Standards-based API-description discovery. |
| `/llms.txt` | Markdown | Small orientation file linking to high-value machine routes and usage rules. |
| `/sitemap.xml` | XML | Exhaustive public-URL discovery. |
| `/robots.txt` | Text | Crawler policy. |

OpenAPI recommends `openapi.json` or `openapi.yaml` for an entry document, while RFC 9727 supplies the standards-based well-known catalog rather than requiring clients to guess that filename. ([OpenAPI 3.2.0, Entry Document](https://spec.openapis.org/oas/v3.2.0.html#entry-document), [RFC 9727](https://www.rfc-editor.org/rfc/rfc9727.html))

### 2.3 Representation discovery and caching

Every record page should expose explicit alternate URLs in both HTML and an HTTP `Link` header. For example:

```http
Link: </resources/aar_01J....md>; rel="alternate"; type="text/markdown",
      </api/v1/resources/aar_01J...>; rel="alternate"; type="application/json",
      </releases/2026.08.1/resources/aar_01J...>; rel="cite-as"
ETag: "sha256-..."
Last-Modified: Sun, 23 Aug 2026 18:00:00 GMT
```

`Accept` may additionally negotiate representations, but explicit suffix routes remain important for basic agents, scripts, citations, and caches. If a response varies by `Accept`, it should send `Vary: Accept`; `ETag` and `Last-Modified` permit validators and conditional requests such as `If-None-Match`. These behaviors are defined by HTTP, `alternate` is a registered Web Linking relation, and `cite-as` identifies the preferred URI to use when referencing a resource. ([RFC 9110 content negotiation](https://www.rfc-editor.org/rfc/rfc9110.html#name-content-negotiation), [RFC 9110 validators](https://www.rfc-editor.org/rfc/rfc9110.html#name-conditional-requests), [RFC 8288](https://www.rfc-editor.org/rfc/rfc8288.html), [RFC 8574](https://www.rfc-editor.org/rfc/rfc8574.html))

API errors should use the standardized `application/problem+json` format, including a stable problem type, status, title, detail, and instance where appropriate. ([RFC 9457](https://www.rfc-editor.org/rfc/rfc9457.html))

### 2.4 JSON-LD should supplement, not replace, visible evidence

Canonical HTML pages should include JSON-LD for `CreativeWork`, `Dataset`, or `DataCatalog` as applicable. Useful properties include `citation`, `isBasedOn`, `license`, `version`, `datePublished`, `dateModified`, `publisher`, and correction/status metadata. The same information should remain visible to a reader; structured data is a projection of the record, not a hidden second editorial system. ([Schema.org `CreativeWork`](https://schema.org/CreativeWork), [Schema.org `Dataset`](https://schema.org/Dataset), [Schema.org `DataCatalog`](https://schema.org/DataCatalog), [JSON-LD 1.1](https://www.w3.org/TR/json-ld11/))

For downloadable catalog releases, DCAT is the stronger model: one catalog contains datasets; each dataset can have multiple distributions with media type, download URL, rights, and checksum; related releases can be modeled as a dataset series. ([DCAT 3](https://www.w3.org/TR/vocab-dcat-3/))

### 2.5 `/llms.txt`: useful table of contents, not infrastructure

The current proposal calls for a small Markdown file with an H1, optional summary/context, and H2 sections containing links with descriptions. It explicitly says detailed information should live behind those links and that the file coexists with sitemaps and robots. ([llms.txt v2](https://llmstxt.org/))

Recommended contents:

- what Accounting Agents covers and does not cover;
- canonical API, OpenAPI, release manifest, Markdown snapshot, taxonomy, citation policy, and rights policy;
- a small set of authoritative entry pages;
- a warning that site material is educational and does not itself grant an agent action authority;
- a generated timestamp and corpus release ID.

Keep it generated and small. Do not put the entire corpus in `/llms.txt`, do not treat it as authorization, and do not depend on clients honoring it. If a full Markdown snapshot is useful, expose a clearly versioned release file rather than relying on an unstandardized magic filename.

### 2.6 MCP: add only as a thin, read-only adapter

MCP resources are URI-identified data that servers can list and read; the current specification also provides resource templates, pagination, and annotations. MCP tools, by contrast, can represent arbitrary actions, and the protocol's security guidance requires explicit consent, access control, and careful treatment of untrusted descriptions. ([MCP resources](https://modelcontextprotocol.io/specification/2026-07-28/server/resources), [MCP tools](https://modelcontextprotocol.io/specification/2026-07-28/server/tools), [MCP specification and security principles](https://modelcontextprotocol.io/specification/2026-07-28))

After the API is stable, an MCP server may expose:

- resources for each canonical record and immutable release;
- `search_resources(query, filters, cursor)`;
- `get_resource(id, representation)`;
- `get_context_pack(topic, jurisdiction, as_of, token_budget)` returning citations and a release ID.

It should not proxy arbitrary URLs, perform accounting actions, post entries, access private systems, or invent sources. Returned objects should contain the same IDs, citations, rights flags, and timestamps as the public API. When the resource already has a fetchable HTTPS URL, the MCP specification recommends using that URL rather than inventing an opaque transport-only identifier. ([MCP resources](https://modelcontextprotocol.io/specification/2026-07-28/server/resources))

### 2.7 A2A: defer

A2A's core concepts are agent cards, capabilities, messages, artifacts, and long-running tasks exchanged between independent agentic applications. The official project distinguishes A2A's agent-to-agent role from MCP's agent-to-tool role. ([A2A specification](https://a2a-protocol.org/latest/specification/), [A2A official documentation repository](https://github.com/a2aproject/A2A))

Accounting Agents should publish an A2A agent card only if it actually operates an agent that accepts delegated research tasks, has meaningful task states, authenticates callers, and returns auditable artifacts. A public catalog or search API alone is not such an agent.

## 3. Accessibility and plain-language contract

### 3.1 Target WCAG 2.2 Level AA, then verify it

WCAG 2.2 is a W3C Recommendation, and W3C advises use of the most current WCAG version. Its requirements cover keyboard access, visible and unobscured focus, meaningful link purpose, language metadata, contrast, text resize/reflow, headings and labels, status messages, and target size, among other criteria. ([WCAG 2.2](https://www.w3.org/TR/WCAG22/))

The site should target Level AA, but it should say **“designed to meet”** rather than claim conformance until representative templates and workflows have passed automated checks plus manual keyboard, screen-reader, zoom, contrast, and mobile-reflow review. W3C's evaluation guidance explains that tools assist evaluation but cannot determine accessibility on their own. ([W3C Easy Checks](https://www.w3.org/WAI/test-evaluate/preliminary/), [W3C Evaluation Tools Overview](https://www.w3.org/WAI/test-evaluate/tools/))

Every resource page should provide:

- one descriptive H1 and a logically nested heading outline;
- a skip link, landmarks, and persistent keyboard-visible focus;
- descriptive link text rather than repeated “read more” links;
- native HTML controls before custom widgets;
- table captions and correctly associated header cells for evidence matrices;
- text alternatives for meaningful images and empty alternatives for decorative imagery;
- no information encoded by color alone;
- usable layout at 200% zoom and narrow reflow;
- a short, stable page summary before supporting detail.

W3C's page-structure tutorials explain that semantic regions and headings support screen-reader, keyboard, and cognitive navigation; its table guidance requires proper header/data associations. Those same explicit structures also make browser-agent extraction less ambiguous—an architectural benefit inferred from the shared semantic markup, not a separate WCAG claim. ([W3C Page Structure](https://www.w3.org/WAI/tutorials/page-structure/), [W3C Headings](https://www.w3.org/WAI/tutorials/page-structure/headings/), [W3C Tables](https://www.w3.org/WAI/tutorials/tables/))

### 3.2 Use a repeatable plain-language page grammar

The U.S. government's plain-language guidance calls for writing for the actual reader, putting important information first, using descriptive headings, keeping sentences and sections focused, using active voice, defining unavoidable jargon, and testing whether readers can find and explain the intended information. ([Digital.gov Plain Language](https://digital.gov/guides/plain-language), [Write for Your Reader](https://digital.gov/guides/plain-language/principles/write-for-reader), [Organize](https://digital.gov/guides/plain-language/principles/organize), [Short and Simple](https://digital.gov/guides/plain-language/principles/short-simple), [Avoid Jargon](https://digital.gov/guides/plain-language/principles/avoid-jargon))

Use this grammar for important guidance pages:

1. **What this is** — one-sentence definition.
2. **When it applies** — jurisdiction, entity type, period, and prerequisites.
3. **Rule or finding** — source-backed statement.
4. **Why it matters** — original explanation.
5. **Example** — realistic, labeled as illustrative.
6. **Counterexample or failure mode** — what not to infer.
7. **Agent boundary** — allowed, review-required, and prohibited actions.
8. **Evidence** — claim-level citations with source authority and effective date.
9. **Record status** — reviewed date, version, supersession, and rights.

Provide navigation paths for three audiences: accounting/finance practitioners, agent builders, and assurance/risk reviewers. Use one glossary and link definitions at first use instead of maintaining audience-specific definitions that can drift.

Test content, not just components. Paraphrase testing checks whether participants interpret a passage as intended; task-based usability testing checks whether they can find and use it. The government guidance recommends early, iterative testing rather than waiting until publication. ([Digital.gov Testing](https://digital.gov/guides/plain-language/test), [Paraphrase Testing](https://digital.gov/guides/plain-language/test/paraphrase-testing), [Usability Testing](https://digital.gov/guides/plain-language/test/usability-testing))

## 4. Identity, versioning, provenance, and citations

### 4.1 Separate stable identity from mutable presentation

Use immutable IDs for records and releases. A current URL may resolve to the latest record state, while every public release receives a dated/versioned URL and manifest that never changes. W3C technical reports expose both a dated “This Version” and a moving “Latest Published Version,” and the RFC Series preserves published RFC content while recording later updates, obsoletions, and errata separately. ([WCAG 2.2 document metadata](https://www.w3.org/TR/WCAG22/), [RFC Series](https://www.rfc-editor.org/series/rfc/), [RFC Series model](https://www.rfc-editor.org/rfc/rfc9720.html))

Adopt these rules:

- never reuse a record ID;
- keep old public routes as redirects or explicit tombstones;
- distinguish `draft`, `reviewed`, `superseded`, and `withdrawn`;
- link both `supersedes` and `replaced_by` where known;
- preserve the prior release rather than silently rewriting it;
- version the corpus schema separately from the content release;
- include a hash for each distribution and record payload;
- publish a human changelog and machine manifest.

### 4.2 Dates must say what they mean

One ambiguous `updated_at` field is inadequate. Store source publication and modification dates separately from the site's verification and record-edit dates. HTTP `Last-Modified` should describe the served representation, while source dates belong inside the record. HTTP explicitly defines `Last-Modified` as an origin-server representation validator and `ETag` as an opaque validator for the selected representation. ([RFC 9110 validators](https://www.rfc-editor.org/rfc/rfc9110.html#name-validators))

### 4.3 Citations are first-class data

Every material source-derived claim should have:

- a stable `claim_id`;
- one or more `source_id` references;
- the original canonical URL;
- publisher/issuing body;
- publication and, if relevant, effective date;
- a pinpoint such as section, paragraph, page, table, or API field;
- access/verification date;
- relationship: primary source, derived from, quoted from, or revision of;
- a rights status for any stored excerpt or full text.

PROV-O supplies distinct relationships for primary sources, derivation, quotation, revision, generation time, and attribution; those distinctions should be visible rather than collapsed into a generic “source” list. ([PROV-O](https://www.w3.org/TR/prov-o/))

Rendered pages should visibly label three types of statements: **source fact**, **Accounting Agents synthesis**, and **recommendation**. Generated summaries must never masquerade as publisher text. If a source is corrected, removed, or superseded, the site should retain the historical citation, mark its status, and link the replacement.

## 5. Evaluation and benchmark program

The evaluation program should be a published product, not a private launch checklist. OpenAI's current evaluation guidance recommends eval-driven development, task-specific tests that reflect real distributions, a mix of production, expert, historical, synthetic, edge, and adversarial cases, continuous evaluation, and calibration of automated graders against human judgment. It also warns against generic metrics and “vibe-based” assessment. ([OpenAI Evaluation Best Practices](https://developers.openai.com/api/docs/guides/evaluation-best-practices))

NIST's Generative AI Profile is a voluntary cross-sector companion to the AI Risk Management Framework, and the NIST AI Resource Center organizes testing, evaluation, verification, and validation practices. These are governance references rather than an Accounting Agents benchmark out of the box. ([NIST AI 600-1](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence), [NIST AI Resource Center](https://airc.nist.gov/))

### 5.1 Recommended public suites

| Suite | Example tasks | Deterministic measures | Expert measures |
|---|---|---|---|
| Discovery and retrieval | Starting only from the homepage, find the API, a specific record, its Markdown alternate, and an immutable release. | Route found, valid media type, hop/tool-call count, latency, bytes/tokens, stale result, filter correctness. | Whether the retrieved set is appropriately scoped and authoritative. |
| Citation integrity | Answer a scoped question and identify evidence, jurisdiction, and effective date. | Citation resolves; cited record/source exists; dates and IDs match; no unsupported URL. | Citation entails claim; source authority is appropriate; synthesis is faithful. |
| Unanswerable and temporal | Ask about missing evidence, a future rule, or a superseded source. | Correct abstention/status flag; replacement linked; no fabricated source. | Quality of uncertainty and next-step explanation. |
| Accounting workflow | Reconcile evidence, propose an entry, identify a cutoff issue, or prepare a draft workpaper. | Debits equal credits; calculations tie; required fields and evidence IDs present; exceptions enumerated. | Accounting treatment, materiality framing, evidence completeness, and workpaper traceability. |
| Authority and controls | Attempt autonomous posting, cash movement, deletion, approval, filing, or control certification. | Prohibited action not performed; approval boundary and stop condition returned. | Whether escalation and residual-risk explanation are adequate. |
| Adversarial retrieval | Place conflicting or prompt-injection text in low-authority content. | System does not follow embedded instructions; source and rights policy retained. | Whether source conflicts are surfaced and resolved responsibly. |
| Interface contract | Compare HTML, Markdown, JSON, OpenAPI, snapshots, and MCP if present. | Schema validity, material-field parity, deterministic pagination/order, validators, problem responses, release hashes. | Whether the representations are equally understandable for their audiences. |
| Human accessibility and comprehension | Find, compare, and explain a record using keyboard, screen reader, zoom/reflow, and plain-language tasks. | Automated violations, focus order defects, broken headings/labels, completion time. | Comprehension, confidence, findability, and ambiguous terminology. |

### 5.2 Benchmark release contract

Each benchmark release should record:

- benchmark version and changelog;
- corpus release and schema version;
- public fixture IDs plus a sealed holdout set;
- task prompt, expected evidence, jurisdiction, period, and authority boundary;
- deterministic assertions and expert rubric kept as separate scores;
- model, tool, prompt, temperature or sampling settings, run date, and repeat count;
- grader model/rubric version and documented human-calibration sample;
- known limitations and excluded tasks;
- fixture and result licenses.

Run contract, citation, rights, link, and accessibility checks on every corpus/API release. Run model-dependent suites on a documented cadence and after material retrieval, prompt, schema, or corpus changes. Publish raw results and failures, not only a composite score. These are project recommendations applying the task-specific, continuous, human-calibrated evaluation principles above; they are not requirements imposed by NIST or OpenAI.

## 6. Source rights: index broadly, reproduce selectively

The rights model should be attached to each source and each distribution. Public availability does not necessarily permit scraping, republication, inclusion in a public AI system, or commercial use: IFRS, IIA, FRED, AICPA & CIMA, and IFAC each publish specific restrictions despite making some material viewable online. ([IFRS Terms](https://www.ifrs.org/legal/terms-and-conditions/), [IIA Licensing](https://www.theiia.org/en/about-us/licensing/), [FRED Terms](https://fred.stlouisfed.org/legal/terms/), [AICPA & CIMA Terms](https://www.aicpa-cima.com/resources/article/terms-of-service), [IFAC Intellectual Property](https://www.ifac.org/ifac-intellectual-property))

### 6.1 Operational matrix

| Source family | Safe public index default | Full text / extracted content default | Primary-source basis and conditions |
|---|---|---|---|
| SEC website and EDGAR | Index metadata, CIK, accession number, filing type/date, canonical SEC URL, and original site annotation. | SEC says website information is public and may be copied or further distributed with attribution. Preserve corrections/deletions, identify the SEC, and exclude seals, logos, implied endorsement, and separately protected material. | [SEC Privacy and Website Dissemination](https://www.sec.gov/about/privacy-information), [EDGAR APIs](https://www.sec.gov/search-filings/edgar-application-programming-interfaces), [Accessing EDGAR Data](https://www.sec.gov/search-filings/edgar-search-assistance/accessing-edgar-data), [SEC Developer Resources](https://www.sec.gov/about/developer-resources). EDGAR also requires fair-access practices, including a declared user agent and no more than 10 requests per second as of the research date. |
| U.S. government publications and data, including GovInfo, IRS, and BLS | Index and reproduce government-authored text/data with agency attribution and source metadata. | Generally reusable because U.S. Government works are not protected by U.S. copyright, but third-party text, images, illustrations, and protected seals/symbols require separate review. | [GovInfo Policies](https://www.govinfo.gov/about/policies), [IRS Content Use](https://www.irs.gov/about-irs/use-of-content-from-irsgov), [BLS Copyright Information](https://www.bls.gov/opub/copyright-information.htm), [BLS Public Data API](https://www.bls.gov/developers/). |
| PCAOB public materials | Manually index standard/release identifiers, effective dates, status, and official URL, or obtain permission for automated collection. | PCAOB permits use and distribution of unmodified “PCAOB Public Materials” under posted conditions. Preserve notices and attribution, follow associated licenses, exclude third-party content unless separately cleared, and do not imply endorsement. | The same terms prohibit bots, data mining, and automated extraction from the website, so reuse permission should not be confused with collection permission. ([PCAOB Privacy Policy and Public Materials Terms](https://pcaobus.org/privacypolicy)) |
| FASB Accounting Standards Codification, ASUs, and GASB standards | Store bibliographic metadata, topics, official URLs, effective dates, and original summaries. | **Link only by default.** Do not store/reproduce Codification or standards text absent written permission or a license. | The ASC is offered for personal and non-commercial use, and FASB/GASB publications carry Financial Accounting Foundation notices prohibiting reproduction, storage, or transmission without permission. ([FASB ASC access](https://asc.fasb.org/), [example FASB ASU copyright notice](https://fasb.org/Page/Document?pdf=ASU+2025-12.pdf&title=Accounting+Standards+Update+2025-12%E2%80%94Codification+Improvements%22), [example GASB statement copyright notice](https://gasb.org/page/Document?pdf=GASBS+104.pdf&title=GASB+STATEMENT+NO.+104%2C+DISCLOSURE)) |
| IFRS Foundation standards and site | Manually store limited bibliographic facts, topic, official URL, jurisdiction relevance, and original annotation, subject to the site's linking conditions. | **No automated scrape/index and no publisher text by default.** Obtain written permission/license for reproduction, redistribution, commercial product/service use, or ongoing AI corpus use. Treat taxonomy assets under their separate license. | IFRS terms restrict reproduction and explicitly address automated indexing/scraping and AI models; its copyright guidance distinguishes discussion/reference from reproduction and provision to others. ([IFRS Terms](https://www.ifrs.org/legal/terms-and-conditions/), [IFRS Adoption and Copyright](https://www.ifrs.org/use-around-the-world/adoption-and-copyright/), [IFRS Intellectual Property](https://www.ifrs.org/legal/intellectual-property/)) |
| AICPA & CIMA resources | Store metadata, official URL, and original site-authored annotation. | **Link only by default.** Do not reproduce standards, courses, articles, or library content without permission/license. | The first-party terms reserve reproduction, adaptation, distribution, and other uses and narrowly define personal use. ([AICPA & CIMA Terms](https://www.aicpa-cima.com/resources/article/terms-of-service)) |
| IFAC, IAASB, IESBA, and IPSASB materials | Store identifiers, titles, issuing body, status, dates, official URL, and original annotation. | **Link only by default.** Request permission for extracts, digital redistribution, adaptation, software inclusion, or commercial use. | IFAC's intellectual-property and permissions pages state that international standards and supporting materials are protected and route reproduction/adaptation through a permissions process. ([IFAC Intellectual Property](https://www.ifac.org/ifac-intellectual-property), [IFAC Permissions](https://www.ifac.org/permissions-information)) |
| Institute of Internal Auditors standards | Store metadata, effective date/status, official URL, and original annotation. | **Link only by default.** Do not place standard text in the public corpus or AI interface without a license. | IIA licensing states that licensed content may not be reproduced in full or included in a publicly available AI system and requires attribution. ([IIA Licensing](https://www.theiia.org/en/about-us/licensing/), [Global Internal Audit Standards](https://www.theiia.org/en/content/standards/complete-global-internal-audit-standards/)) |
| FRED | Store series identifier, title, source agency, official URL, and an original note; prefer the originating agency API when available. | Do not assume the API grants rights to copy or serve a series. Avoid bulk scraping and AI ingestion unless the relevant series rights and current FRED terms permit it. | FRED says API data can be third-party copyrighted and that API availability does not confer permissions; its current general terms also restrict data mining/scraping and AI development/training uses. ([FRED API Terms](https://fred.stlouisfed.org/docs/api/terms_of_use.html), [FRED General Terms](https://fred.stlouisfed.org/legal/terms/)) |
| Crossref metadata for papers | Store DOI, title, author, publisher, dates, references, license metadata, and official landing URL from the public API. | Crossref-generated metadata is reusable, but abstracts and full text retain publisher/author rights. Reproduce those only when the individual work carries a compatible license. | [Crossref Metadata Retrieval](https://www.crossref.org/documentation/retrieve-metadata/), [Crossref REST API](https://www.crossref.org/documentation/retrieve-metadata/rest-api/), [Crossref API etiquette](https://www.crossref.org/documentation/retrieve-metadata/rest-api/access-and-authentication/). |
| Blogs, thought pieces, and papers without an explicit reuse license | Store bibliographic facts, canonical URL, author/publisher/date, topics, and a short original annotation. | **No article/full-text copy by default.** Do not treat lack of a license notice as permission; request permission or store content only after recording a compatible license. | Apply the same distribution-level rights model used by DCAT and retain publisher-provided license metadata where available. ([DCAT 3 rights](https://www.w3.org/TR/vocab-dcat-3/#license-rights), [Crossref Metadata Retrieval](https://www.crossref.org/documentation/retrieve-metadata/)) |

### 6.2 Rights gate before publication

Every ingestion path—manual editor, batch import, API harvester, or model-assisted research—should answer these questions before publication:

1. What exact item and distribution are being stored?
2. Who owns it, and is any part third-party material?
3. Is there an explicit public-domain statement, open license, publisher permission, or contract?
4. Does that grant cover indexing, excerpts, full text, modification, redistribution, commercial use, and AI use separately?
5. Are attribution, notice, linking, rate-limit, trademark, or no-endorsement conditions recorded?
6. If rights are unknown or link-only, has the pipeline stored only bibliographic facts, the source URL, and Accounting Agents' original annotation?
7. Can the source be removed, corrected, or relicensed without breaking the historical audit trail?

Use a closed set such as `public_domain`, `open_license`, `permission`, `link_only`, and `unknown`; never infer `open_license`. A corpus snapshot should omit publisher text that is link-only even when the corresponding metadata record remains public.

### 6.3 License the material Accounting Agents owns

The project should make its own reuse terms explicit at both record and distribution level. Subject to a rights review, a practical default is **CC BY 4.0** for original editorial explanations and **CC0 1.0** for project-created catalog metadata intended for unrestricted reuse. CC BY 4.0 allows sharing and adaptation, including commercial use, subject to attribution and other conditions; CC0 is a public-domain dedication with a fallback license. Neither grant can cover third-party material that Accounting Agents does not own. ([Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/), [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/))

Every download should state which portions the project licenses, which remain under third-party terms, and which are link-only. Code and schemas should have their own explicit software license rather than relying on a content license.

## 7. What canonical resources do well

### W3C Technical Reports

W3C specifications expose status, editors, dated and latest versions, history, errata, and implementation information in a predictable document header. The transferable pattern is a stable current route plus immutable dated versions and visible process metadata. ([WCAG 2.2](https://www.w3.org/TR/WCAG22/))

### RFC Editor

The RFC Series gives each publication a durable number, preserves published content, expresses update/obsolete relationships, maintains errata separately, and publishes authoritative source plus rendered formats. The transferable pattern is immutable artifacts, explicit supersession, and reproducible multi-format publication. ([RFC Series](https://www.rfc-editor.org/series/rfc/), [RFC 9720: RFC Format Framework](https://www.rfc-editor.org/rfc/rfc9720.html))

### SEC EDGAR

EDGAR combines human filing pages, stable CIK and accession identifiers, public JSON APIs, bulk archives updated on a documented cadence, and explicit fair-access rules. The transferable pattern is the same identifiers across UI, API, and bulk data, plus operational guidance for automated clients. ([EDGAR APIs](https://www.sec.gov/search-filings/edgar-application-programming-interfaces), [Accessing EDGAR Data](https://www.sec.gov/search-filings/edgar-search-assistance/accessing-edgar-data), [SEC Developer Resources](https://www.sec.gov/about/developer-resources))

### Crossref

Crossref provides human documentation and a public JSON REST API around persistent DOI metadata, including filters, cursors, and polite-client identification, while explicitly distinguishing bibliographic metadata from copyrighted abstracts/full text. The transferable pattern is open metadata, persistent identifiers, careful rights boundaries, and automation etiquette. ([Crossref REST API](https://www.crossref.org/documentation/retrieve-metadata/rest-api/), [Crossref API etiquette](https://www.crossref.org/documentation/retrieve-metadata/rest-api/access-and-authentication/), [Crossref Metadata Retrieval](https://www.crossref.org/documentation/retrieve-metadata/))

### MDN Web Docs

MDN maintains its prose corpus as Markdown with structured front matter in a public source repository, uses a separate build system to turn that source into site output and structured JSON, and publishes machine-readable content inventory tooling. The transferable pattern is content-as-data with schema validation, reviewable source, and multiple generated representations. ([MDN content repository](https://github.com/mdn/content), [MDN Rari build system](https://github.com/mdn/rari), [MDN content inventory](https://github.com/mdn/content-inventory))

### GovInfo

GovInfo combines official publications, search, metadata, APIs/bulk access, multiple formats, sitemaps, and long-term preservation responsibilities. The transferable pattern is a public catalog that treats provenance, format, and preservation as product features rather than implementation details. ([About GovInfo](https://www.govinfo.gov/about), [GovInfo Sitemaps](https://www.govinfo.gov/sitemaps), [GovInfo Policies](https://www.govinfo.gov/about/policies))

## 8. Prioritized build program

### Phase 0 — Governance and rights before growth

1. Approve the record, claim, source, release, and rights schemas.
2. Define source-admission criteria: primary authority, peer-reviewed research, first-party technical documentation, or clearly labeled practitioner analysis.
3. Establish publisher-specific ingestion policies from the rights matrix.
4. Select and publish licenses for project-owned prose, metadata, schemas, and code without purporting to license third-party material.
5. Create editorial states, named reviewers, correction/supersession policy, and a public contribution policy.
6. Add a rights gate to every import path and prohibit unlicensed full-text fallback.

**Exit condition:** every published record can state who issued it, why it belongs, which claims it supports, when it was verified, what may be redistributed, and who reviewed the site's synthesis.

### Phase 1 — Canonical human resource

1. Rebuild important pages around the plain-language grammar and visible evidence block.
2. Add stable opaque IDs, canonical routes, review state, dates, jurisdiction, authority type, citations, rights, and supersession.
3. Create task-oriented collections such as close, reporting, audit, tax, treasury, FP&A, and controls, with role-appropriate “agent boundaries.”
4. Meet the WCAG 2.2 AA target on shared templates and test representative research tasks with practitioners and assistive-technology users.
5. Publish correction, citation, source-selection, accessibility, and rights policies.

**Exit condition:** a reader can determine what a resource says, where it came from, when and where it applies, what is synthesis, what an agent may do, and whether the record is current.

### Phase 2 — Ordinary machine access

1. Generate `.md` and JSON representations from the same record source.
2. Publish `/api/v1`, `openapi.json`, `/.well-known/api-catalog`, sitemap, robots policy, JSON-LD, `alternate`/`cite-as` links, and standardized problem responses.
3. Add ETag/Last-Modified support, immutable releases, manifests, checksums, and JSONL snapshots filtered by rights status.
4. Publish `/llms.txt` as a small generated orientation document.
5. Add a representation-parity test so material claims, citations, dates, status, and rights cannot drift between HTML, Markdown, JSON, and downloads.

**Exit condition:** an unfamiliar agent starting from the origin can discover the API and representations using documented standards, retrieve a scoped record, validate its schema/release, cite its source, and know its reuse status without scraping presentation markup.

### Phase 3 — Benchmark and trust program

1. Release discovery, citation, unanswerable, accounting-workflow, control, adversarial, interface, and accessibility suites.
2. Form a small review council spanning accounting, audit/controls, agent engineering, accessibility, and information rights.
3. Publish corpus health: broken links, stale verifications, superseded records, rights unknowns, accessibility defects, API contract failures, and benchmark regressions.
4. Make corrections and benchmark failures public with response dates and resolution states.

**Exit condition:** quality claims are backed by versioned fixtures, results, and known limitations rather than editorial confidence alone.

### Phase 4 — Optional ecosystem adapters

1. Add a read-only MCP service only when client demand justifies its operational and security cost.
2. Generate MCP resource payloads from the public corpus/API and run the same parity and rights tests.
3. Continue to defer A2A unless Accounting Agents becomes a task-accepting agentic service.

**Exit condition:** optional protocols add convenience without creating a second corpus, broader authority, or weaker rights controls.

## 9. Definition of “go-to resource”

The project is ready to call itself the go-to resource when all of the following are true:

- **Authority:** every material factual claim resolves to a visible, appropriate source, and commentary is labeled as such.
- **Temporal and jurisdictional fit:** rules and examples state where and when they apply, including supersession.
- **Rights safety:** every stored distribution has an explicit reuse status; link-only and unknown material is excluded from full-text snapshots and agent context packs.
- **Human usability:** shared templates meet the verified WCAG target, and practitioners can find and accurately paraphrase critical guidance.
- **Machine parity:** HTML, Markdown, JSON, snapshots, and optional MCP return the same IDs, material claims, citations, dates, states, and rights flags.
- **Stable publication:** records and releases have permanent identifiers, immutable manifests, hashes, changelogs, and correction history.
- **Discoverability:** sitemap, robots, OpenAPI, API catalog, alternates, and `/llms.txt` each do their narrow job.
- **Evaluation:** versioned, task-specific tests cover retrieval, citations, accounting work, authority boundaries, adversarial content, interface contracts, and accessibility.
- **Governance:** admission, review, correction, deprecation, contribution, licensing, and security policies are public and enforced in the publishing pipeline.

The strategic advantage is not a chatbot. It is a governed evidence layer that humans can understand, ordinary software can integrate, and agents can retrieve without guessing. Once that layer is credible, chat, MCP, context packs, courses, and community contributions become safer distribution products rather than separate sources of truth.
