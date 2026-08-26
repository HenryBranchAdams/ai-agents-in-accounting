# AI Agents in Accounting

An open field guide, workflow library, measurement program, conformance suite, and machine-readable corpus for governed AI-agent work in accounting and finance.

The public site is [accounting-agents.madebyhenry.chatgpt.site](https://accounting-agents.madebyhenry.chatgpt.site). It publishes 60 canonical workflows, 433 source records, 153 curated readings across 20 shelves, six portable packs, 30 public conformance cases, LedgerBench program contracts, controlled governance records, Markdown and JSON projections, a versioned read-only API, OpenAPI, JSON Schemas, and small reference clients.

## Four ways in

- Learn: definitions, lifecycle, authority, controls, evidence, and operations.
- Build: portable packs with synthetic fixtures and reference outputs.
- Evaluate: the LedgerBench measurement program and the public Core conformance suite.
- Integrate: standard HTTP, Markdown, JSON, OpenAPI, feeds, clients, and CLI.

[LedgerBench](https://accounting-agents.madebyhenry.chatgpt.site/ledgerbench) is the Preview-stage measurement program for accounting-agent capability, conformance, field utility, and grader validity. It defines the measurement claim, task universe, products, tracks, divisions, Accepted Work Rate, hard gates, task-admission process, hidden evaluation strategy, verification states, statistical discipline, and independent governance required before an official model ranking is published.

The existing 30-case Accounting Agent Bench remains a public Core conformance asset. It does not by itself define LedgerBench or establish broad accounting competence.

The [open ecosystem map](https://accounting-agents.madebyhenry.chatgpt.site/ecosystem) distinguishes direct web access, AGENTS.md, MCP, A2A, and accounting-domain contracts by role and adoption posture. The repository `AGENTS.md` gives coding agents the build, content, rights, and verification rules for contributing safely.

The [educational content contract](https://accounting-agents.madebyhenry.chatgpt.site/content-contract) assigns every major human page one primary mode—Tutorial, How-to, Explanation, Reference, Case study, Evidence synthesis, or Program documentation—and defines visible evidence classifications, an educational release gate, and proposed success measures. The contract is available as [Markdown](https://accounting-agents.madebyhenry.chatgpt.site/content-contract.md) and [JSON](https://accounting-agents.madebyhenry.chatgpt.site/api/v1/content-contract). Instrumentation and results for those measures are not currently claimed.

The [Accounting Agent Control Model](https://accounting-agents.madebyhenry.chatgpt.site/control-model) defines nine elements—Objective, Scope, Evidence, Procedure, Checks, Authority, Review, Action, and Record—and applies them to two fictional synthetic scenarios and all 60 workflows. Equivalent [Markdown](https://accounting-agents.madebyhenry.chatgpt.site/control-model.md) and [JSON](https://accounting-agents.madebyhenry.chatgpt.site/api/v1/control-model) preserve the same stable model, element, and scenario IDs. It is an implementation pattern under maintainer review, not an independent or professional conclusion.

Coverage never grants execution authority. Agents may prepare work; accountable people approve conclusions and sensitive external actions.

## Development

Requires Node.js 22.13 or newer and Linux with `flock`, `curl`, GNU `timeout`, and `zip`.

```sh
npm run install:ci
npm run generate:platform
npm run validate:platform
npm run lint
npm test
```

`npm test` builds the production Worker and runs contract, site-wide quality, mobile, and LedgerBench program suites. See [`TESTING.md`](TESTING.md) for the coverage matrix, focused commands, and release gates.

`data/open-source-platform.mjs` is the canonical source for packs, public conformance cases, and release notes. `data/ledgerbench-program.mjs` is the canonical structured Preview record for the LedgerBench measurement program.

Run the deterministic Core reference harness:

```sh
npm run benchmark:sample
```

Build the public source archive and checksum manifest after other generated artifacts are current:

```sh
npm run archive:source
```

## Project structure

- `app/`: semantic HTML pages, Markdown projections, API routes, feeds, schemas, and shared records
- `data/open-source-platform.mjs`: canonical portable packs, Core conformance cases, and changes
- `data/ledgerbench-program.mjs`: canonical LedgerBench program record
- `docs/ledgerbench/`: program constitution, task admission, statistical analysis, governance, and submission rules
- `packs/`: generated portable pack directories
- `benchmark/`: current Core candidate-result contract and reference-shape sample
- `clients/`: zero-dependency JavaScript and Python clients
- `bin/`: reference CLI
- `docs/strategy/`: research and product rationale
- `tests/`: rendered Worker, accessibility, API, schema, release, route-crawl, mobile, link, asset, metadata, referential-integrity, and LedgerBench program contracts

The deployed site is public and read-only. It does not use a database, authentication, vector store, runtime scraper, or required agent framework.

## LedgerBench machine surfaces

- Human guide: `/ledgerbench`
- Markdown: `/ledgerbench.md`
- Program API: `/api/v1/ledgerbench`
- Program schema: `/schemas/ledgerbench-program.schema.json`
- Episode schema: `/schemas/ledgerbench-episode.schema.json`
- Candidate-result schema: `/schemas/ledgerbench-result.schema.json`
- Submission schema: `/schemas/ledgerbench-submission.schema.json`

The Preview does not yet publish an official hidden item bank, independently validated automated judge, verified submission round, or model ranking.

## Rights

- Software and schemas: MIT — `LICENSE` and `LICENSES/MIT.txt`
- Original educational and program content: CC BY 4.0 — `LICENSE-CONTENT.md`
- Project-created factual metadata and clean-room synthetic fixtures: CC0 1.0 — `LICENSE-DATA.md`
- External publications: not redistributed; publisher terms apply

This is a mixed-rights repository. See `LICENSE_POLICY.md`, `NOTICE.md`, and record-level rights fields before redistributing a combined corpus response.

## Contributing and governance

Read `CONTRIBUTING.md`, `EDITORIAL_POLICY.md`, `GOVERNANCE.md`, `SECURITY.md`, `CORRECTIONS.md`, `BENCHMARK_SUBMISSIONS.md`, `docs/ledgerbench/`, and `CODE_OF_CONDUCT.md`.

Use synthetic data only. Never submit client, employer, engagement, bank, employee, vendor, or taxpayer records.
