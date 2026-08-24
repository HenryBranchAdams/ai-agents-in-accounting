# AI Agents in Accounting

An open field guide, workflow-pack library, benchmark, and machine-readable corpus for governed AI-agent work in accounting and finance.

The public site is [accounting-agents.madebyhenry.chatgpt.site](https://accounting-agents.madebyhenry.chatgpt.site). It publishes 60 canonical workflows, 433 source records, 153 curated readings across 20 shelves, six portable packs, 30 benchmark cases, controlled governance records, Markdown and JSON projections, a versioned read-only API, OpenAPI, JSON Schemas, and small reference clients.

## Four ways in

- Learn: definitions, lifecycle, authority, controls, evidence, and operations.
- Build: portable packs with synthetic fixtures and reference outputs.
- Evaluate: Accounting Agent Bench and its hard authority gates.
- Integrate: standard HTTP, Markdown, JSON, OpenAPI, feeds, clients, and CLI.

The [open ecosystem map](https://accounting-agents.madebyhenry.chatgpt.site/ecosystem) distinguishes direct web access, AGENTS.md, MCP, A2A, and accounting-domain contracts by role and adoption posture. The repository `AGENTS.md` gives coding agents the build, content, rights, and verification rules for contributing safely.

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

`npm test` builds the production Worker and runs contract, site-wide quality, and mobile suites. See [`TESTING.md`](TESTING.md) for the coverage matrix, focused commands, and release gates.

`data/open-source-platform.mjs` is the canonical source for packs, benchmark cases, and release notes. `npm run generate:platform` produces the portable pack tree, benchmark sample, JSON downloads, and pack archive. Do not edit generated pack artifacts by hand.

Run the deterministic reference harness:

```sh
npm run benchmark:sample
```

Build the public source archive and checksum manifest after other generated artifacts are current:

```sh
npm run archive:source
```

## Project structure

- `app/`: semantic HTML pages, Markdown projections, API routes, feeds, schemas, and shared records
- `data/open-source-platform.mjs`: canonical platform release, packs, cases, and changes
- `packs/`: generated portable pack directories
- `benchmark/`: candidate-result contract and reference-shape sample
- `clients/`: zero-dependency JavaScript and Python clients
- `bin/`: reference CLI
- `docs/strategy/`: research and product rationale
- `tests/`: rendered Worker, accessibility, API, schema, release, route-crawl, mobile, link, asset, metadata, and referential-integrity contracts

The deployed site is public and read-only. It does not use a database, authentication, vector store, runtime scraper, or required agent framework.

## Rights

- Software: MIT — `LICENSE` and `LICENSES/MIT.txt`
- Original educational content: CC BY 4.0 — `LICENSE-CONTENT.md`
- Project-created factual metadata and clean-room synthetic fixtures: CC0 1.0 — `LICENSE-DATA.md`
- External publications: not redistributed; publisher terms apply

This is a mixed-rights repository. See `LICENSE_POLICY.md`, `NOTICE.md`, and record-level rights fields before redistributing a combined corpus response.

## Contributing and governance

Read `CONTRIBUTING.md`, `EDITORIAL_POLICY.md`, `GOVERNANCE.md`, `SECURITY.md`, `CORRECTIONS.md`, `BENCHMARK_SUBMISSIONS.md`, and `CODE_OF_CONDUCT.md`. Use synthetic data only; never submit client, employer, engagement, bank, employee, vendor, or taxpayer records.
