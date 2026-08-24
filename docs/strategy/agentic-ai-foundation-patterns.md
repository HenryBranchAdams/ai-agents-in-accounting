# Agentic AI Foundation patterns worth adapting

**Research date:** 2026-08-23

**Scope:** The official Agentic AI Foundation (AAIF) site, Linux Foundation announcements, and AAIF-controlled GitHub repositories.

**Source policy:** First-party materials only. Observations describe AAIF; recommendations are original applications to Accounting Agents.

## Decision

Borrow AAIF's **structural clarity**, not its brand or campaign voice. The useful pattern is a public-interest resource organized around four visible systems:

1. a small set of concrete projects;
2. named governance and lifecycle rules;
3. several ways to participate; and
4. first-class renditions for machine readers.

Accounting Agents already has the stronger task-oriented spine—**Learn, Build, Evaluate, Integrate**—plus packs, a benchmark, APIs, feeds, explicit rights, and release artifacts. Keep that spine. Add AAIF-inspired ecosystem, trust, contribution, and Markdown-discovery patterns around it.

## 1. Transferable patterns

| AAIF pattern | First-party evidence | Application to Accounting Agents |
|---|---|---|
| **A mission statement immediately becomes a builder action.** The homepage pairs its open-protocol premise with a prominent participation CTA instead of leaving the proposition as institutional copy. | [AAIF homepage](https://aaif.io/) | Keep the current accounting operating rule, then offer two equally clear actions: **choose a workflow** and **give an agent context**. Avoid adopting AAIF's slogan or visual identity. |
| **Navigation separates institution, participation, and publishing.** AAIF groups board/members/staff separately from working groups/project proposals/ambassadors and from blog/video/news/newsletter. | [AAIF homepage navigation](https://aaif.io/) | Preserve task navigation in the main rail, but make the project footer or utility navigation explicitly separate **Project**, **Contribute**, and **Follow**. This will make governance and participation findable without diluting the docs hierarchy. |
| **The landing page moves from current signal to durable structure.** AAIF leads from timely editorial material into working groups, events, projects, and a submission CTA. | [AAIF homepage](https://aaif.io/) | Add one restrained **Current signal** row near the top: latest Accounting Agents release, one substantive reading-room addition, and one standards change. Then return to the durable Learn/Build/Evaluate/Integrate map. Do not add a carousel or event-heavy homepage. |
| **An ecosystem is legible as a small project portfolio.** The project index gives each hosted project a name, one-sentence role, project hub, repository, and official website. | [AAIF projects](https://aaif.io/projects) | Treat workflow packs as the site's project portfolio. On each pack card, expose version, review date, authority level, benchmark cases, and evidence count—not only a description. Also create a separate **Standards watch** strip for external dependencies such as MCP, A2A, AGENTS.md, OpenAPI, and identity standards; never imply they are Accounting Agents projects. |
| **Each project becomes a content hub, not just a link.** AAIF project pages combine a definition, official destination, development-health metrics, programs, and related articles. | [AAIF MCP project page](https://aaif.io/projects/model-context-protocol), [AAIF AGENTS.md project page](https://aaif.io/projects/agents-md) | Make each pack page the canonical hub for its fixture, reference output, benchmark cases, related workflows, sources, changelog, and integrations. Add a compact, auditable status panel rather than popularity metrics: conformance result, hard-gate result, version, last review, rights, and known limitations. |
| **Work is grouped into stable problem domains.** AAIF describes working groups for reliability, commerce, governance/risk, identity/trust, observability, security, workflows, and taxonomy. | [AAIF homepage working groups](https://aaif.io/#), [AAIF working groups](https://aaif.io/working-groups), [AAIF Technical Committee repository](https://github.com/aaif/technical-committee) | Reframe the existing ecosystem page around accounting-relevant cross-cutting tracks: **Authority & approval**, **Evidence & provenance**, **Identity & access**, **Reliability & evaluation**, **Workflow integration**, and **Taxonomy & interoperability**. These are editorial tracks, not community working groups unless real groups and maintainers exist. |
| **Governance roles are concrete and separate.** AAIF publishes a Governing Board, Technical Committee, member roster, and foundation-level charter/code-of-conduct materials rather than compressing all trust claims into an About page. | [AAIF Governing Board](https://aaif.io/board), [AAIF Technical Committee](https://aaif.io/tc), [AAIF members](https://aaif.io/members), [AAIF foundation repository](https://github.com/aaif/foundation) | Add a visible **Stewardship** block only when real names and responsibilities can be published: maintainer, accounting reviewer, security contact, and release authority. Until then, retain the site's precise claim of maintainer review and do not imply independent or professional review. |
| **Project acceptance is a public workflow.** AAIF documents eligibility, a five-step intake/review/onboarding path, a GitHub issue application, vote thresholds, trackable statuses, reapplication, and the boundary between project acceptance and organizational membership. | [Submit a project](https://aaif.io/submit-a-project), [project-proposals repository](https://github.com/aaif/project-proposals), [project lifecycle policy](https://github.com/aaif/technical-committee/blob/main/governance/project-lifecycle-policy.md) | Once a public forge exists, provide structured issue forms for **source correction**, **reading-room nomination**, **workflow/pack proposal**, and **benchmark case**. Publish states such as received, evidence check, domain review, accepted, declined with reason, and released. Do not simulate an open process before there is a public channel. |
| **Lifecycle state is a trust signal.** AAIF distinguishes Growth, Impact, and Emeritus projects, sets criteria, and requires recurring health review. | [AAIF project lifecycle policy](https://github.com/aaif/technical-committee/blob/main/governance/project-lifecycle-policy.md), [AAIF Technical Committee project table](https://github.com/aaif/technical-committee#projects) | Give Accounting Agents artifacts a simpler domain-specific lifecycle: **Draft**, **Validated**, **Published**, **Superseded**, **Retired**. Define entry/exit criteria and review cadence in the public specification; show the state on packs, benchmark releases, and major guidance pages. |
| **Participation has several depths.** AAIF offers working groups, project proposals, events, membership, an ambassador program, and newsletter subscription rather than one generic “join” button. | [AAIF homepage](https://aaif.io/), [AAIF Ambassador Program](https://aaif.io/ambassadors), [AAIF members](https://aaif.io/members), [AAIF working-group calendar](https://aaif.io/working-groups/calendar) | Offer an honest ladder suited to this project: **follow changes**, **report a correction**, **nominate a source**, **submit a synthetic case**, **propose a pack**, and later **review a release**. Keep membership and ambassador language out unless those programs actually exist. |
| **Long-form pieces lead with retrieval aids.** AAIF technical articles show author/date metadata and an “In this blog” section list before the body; worked articles include diagrams, tables, versioned components, setup steps, verification cases, and production cautions. | [AAIF authorized OpenAPI/MCP article](https://aaif.io/blog/exposing-openapi-operations-as-authorized-mcp-tools-with-agentgateway-and-keycloak) | For future Accounting Agents essays and implementation notes, use a fixed grammar: summary, applicability, author/reviewer, reviewed date, table of contents, source status, worked example, failure modes, authority boundary, and related records. The reading-room index should continue to distinguish external work from original synthesis. |
| **Institutional credibility is reinforced by neutral stewardship and a visible founding portfolio.** The Linux Foundation launch announcement identifies AAIF's neutral-home purpose and the initial project contributions; AAIF's GitHub organization then exposes the technical/governance repositories. | [Linux Foundation formation announcement](https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation), [AAIF GitHub organization](https://github.com/aaif) | Accounting Agents cannot borrow institutional authority. Its equivalent trust must come from transparent evidence, tests, release digests, explicit rights, named reviewers when available, and a public decision trail. |

## 2. Agent-readable patterns

AAIF's most relevant innovation for this site is that machine access is treated as a presentation layer, not an afterthought.

| Observed behavior | Evidence | Recommendation |
|---|---|---|
| AAIF publishes `/llms.txt` as a linked catalog and `/llms-full.txt` as an expanded canonical/Markdown map. The file explains that pages can be requested with `Accept: text/markdown` or through an `/md/` path. | [AAIF llms.txt](https://aaif.io/llms.txt), [AAIF llms-full.txt](https://aaif.io/llms-full.txt) | Keep Accounting Agents' compact `/llms.txt`; add a generated `/llms-full.txt` that enumerates canonical HTML, Markdown, JSON/API, rights, and update metadata without embedding licensed third-party text. |
| Canonical pages respond to `Accept: text/markdown`, vary on `Accept`, and advertise an alternate Markdown URL in the HTTP `Link` header. | [AAIF projects page](https://aaif.io/projects), [AAIF Markdown route for projects](https://aaif.io/md/projects) | Make this uniform across every first-party guide page. Keep explicit `.md` URLs as the dependable contract, then add negotiation and `rel="alternate"` as conveniences. Add tests that HTML, Markdown, and JSON carry the same material claims and citations. |
| AAIF publishes a sitemap with per-URL modification timestamps. | [AAIF sitemap](https://aaif.io/sitemap.xml) | Keep the current sitemap and ensure every resource, pack, benchmark release, and original essay has a truthful `lastmod`. Do not update dates merely because the application was rebuilt. |
| The robots policy explicitly allows public crawling, declares content-use signals, names common AI crawlers, and excludes application paths such as `/api/` and `/sandbox`. AAIF also publishes a minimal `/agents.txt`. | [AAIF robots.txt](https://aaif.io/robots.txt), [AAIF agents.txt](https://aaif.io/agents.txt) | Add `/agents.txt` as a very small orientation pointer. Treat `Content-Signal` as a site policy, not a substitute for record-level rights. Because Accounting Agents has mixed-rights catalog records, avoid a blanket training permission that could be misread as licensing external works. |
| Selected content-negotiated Markdown includes page metadata and structured WebPage data. | [AAIF projects page requested as Markdown](https://aaif.io/projects) | Preserve Accounting Agents' stronger structured records and visible citations. If JSON-LD is expanded, generate it from the same canonical data and include version, date modified, rights, source relationships, and stable identifier. |

## 3. Patterns to retain as Accounting Agents advantages

AAIF is primarily a foundation and publishing site. Accounting Agents should not trade away its resource-service strengths to resemble it.

- **Keep task-oriented navigation.** AAIF's organization-centric hierarchy is appropriate to a foundation; Accounting Agents' Learn/Build/Evaluate/Integrate model is better for practitioners and agent builders.
- **Keep explicit authority boundaries.** AAIF's project framing does not replace this site's accounting-specific distinction between preparation, approval, and execution.
- **Keep the public API, OpenAPI, RFC 9727 catalog, schemas, release manifest, checksums, JSON Feed, and Atom feed.** At the research date, AAIF's conventional `/openapi.json`, `/.well-known/api-catalog`, `/feed.xml`, and `/rss.xml` paths returned 404, while its machine layer concentrated on Markdown and crawl discovery. ([AAIF OpenAPI path](https://aaif.io/openapi.json), [AAIF API-catalog path](https://aaif.io/.well-known/api-catalog), [AAIF feed path](https://aaif.io/feed.xml), [AAIF RSS path](https://aaif.io/rss.xml))
- **Keep field-level rights.** AAIF can signal use of its own site globally; Accounting Agents indexes external works whose publisher terms remain controlling.
- **Keep deterministic evaluation and the hard authority gate.** Project popularity and contributor metrics are not a substitute for domain conformance.

## 4. Gaps in the AAIF pattern to avoid reproducing

These are dated observations, not criticism of the foundation's mission.

1. **Governance promises are ahead of some public artifacts.** The Technical Committee repository says meeting minutes and a mailing list are still forthcoming and that committee meetings will open after governance is formalized. Accounting Agents should not advertise a review community or public process until the channel, records, and decision owner exist. ([AAIF Technical Committee repository](https://github.com/aaif/technical-committee#meetings))
2. **The working-groups landing page is thin relative to the GitHub organization.** The page explains the concept and links to a calendar/proposal path, while the repositories carry much of the operational substance. Accounting Agents should put status, owners, outputs, and next action on the relevant site page and use a forge for the detailed record. ([AAIF working groups](https://aaif.io/working-groups), [AAIF GitHub organization](https://github.com/aaif))
3. **Project maturity is not prominent on the project index.** AAIF's Technical Committee repository identifies project stages, but the visual project cards emphasize identity and description. Accounting Agents should show lifecycle state and last review directly on pack cards. ([AAIF projects](https://aaif.io/projects), [AAIF Technical Committee project table](https://github.com/aaif/technical-committee#projects))
4. **Markdown does not remove the need for a data contract.** AAIF's Markdown discovery is exemplary for reading, but Accounting Agents has structured, filterable, versioned domain records. Maintain both; do not collapse the API into prose.

## 5. Implementation sequence

### P0 — small, high-signal changes

1. Add a homepage **Current signal** row sourced from the latest release note and one curated standards update.
2. Enrich pack cards with lifecycle status, version, last reviewed date, case count, and hard-gate result.
3. Add a small **Standards watch** section to the ecosystem page with five external projects/protocols and a one-sentence accounting relevance statement for each.
4. Add `/llms-full.txt` and `/agents.txt`; test their freshness against the canonical route registry.
5. Add a compact footer split into **Project**, **Contribute**, and **Follow** using only routes and channels that exist.

### P1 — trust and contribution infrastructure

1. Define artifact lifecycle states and criteria in `/spec` and show them on packs and releases.
2. Publish a stewardship/review page when actual responsible people can be named.
3. When a public forge exists, add structured proposal forms and a visible status board for corrections, sources, packs, and benchmark cases.
4. Add content negotiation and `Link: rel="alternate"` consistently to first-party human pages while retaining explicit Markdown routes.

### P2 — editorial depth

1. Introduce original field notes/case studies with the fixed evidence-and-boundary grammar described above.
2. Organize ecosystem coverage by cross-cutting tracks and publish one maintained landscape view showing how standards, controls, packs, sources, and benchmarks connect.
3. Add artifact health history based on conformance, review freshness, evidence coverage, and known limitations—not stars or promotional adoption claims.

## 6. Presentation direction

Use AAIF's **modular rhythm**: a decisive introduction, compact project cards, visible status, related content, and a clear contribution endpoint. Keep Accounting Agents visually quieter:

- white and warm-neutral surfaces;
- one restrained green or blue accent;
- strong typographic hierarchy and narrow reading measure;
- light rules instead of gradient panels;
- one editorial image per major page, not decorative carousels;
- static cards and tables before animation;
- metadata that reads like a workpaper cover sheet: status, owner, reviewed date, version, scope, authority, sources.

Do not reuse AAIF's slogans, coral/black palette, logo treatments, project names, or campaign composition. The transferable value is the public architecture of projects, governance, participation, and machine access.

## First-party source set

- [Agentic AI Foundation](https://aaif.io/)
- [AAIF projects](https://aaif.io/projects)
- [AAIF working groups](https://aaif.io/working-groups)
- [AAIF project submission guide](https://aaif.io/submit-a-project)
- [AAIF machine index](https://aaif.io/llms.txt)
- [AAIF expanded machine index](https://aaif.io/llms-full.txt)
- [AAIF robots policy](https://aaif.io/robots.txt)
- [AAIF sitemap](https://aaif.io/sitemap.xml)
- [AAIF GitHub organization](https://github.com/aaif)
- [AAIF Technical Committee repository](https://github.com/aaif/technical-committee)
- [AAIF project lifecycle policy](https://github.com/aaif/technical-committee/blob/main/governance/project-lifecycle-policy.md)
- [AAIF project proposals](https://github.com/aaif/project-proposals)
- [AAIF foundation repository](https://github.com/aaif/foundation)
- [Linux Foundation formation announcement](https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation)
