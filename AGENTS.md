# Accounting Agents contributor instructions

## Project purpose

Accounting Agents is a public, read-only knowledge hub and resource wiki led by the Living Atlas for governed AI-agent work in accounting and finance. Workflow packs remain practical educational specimens. Existing Accounting Agent Bench and LedgerBench surfaces remain compatibility and reference assets; further benchmark product development is fully deferred.

The operating invariant is: agents may prepare accounting work; accountable people approve conclusions and sensitive external actions. Do not weaken that boundary in copy, examples, fixtures, APIs, or tests.

## Canonical sources

- `app/resources-data.ts` plus the three `app/resources-reading-room-*.ts` files define source records.
- `app/workflows-data.ts`, `app/domain-model.ts`, `app/governance-data.ts`, and `app/reference-data.ts` define the domain corpus.
- `data/open-source-platform.mjs` defines packs, benchmark reference cases, releases, and release notes.
- Generated `packs/`, benchmark reference samples, and pack downloads must be refreshed with `npm run generate:platform`; do not edit generated pack artifacts by hand.

## Build and verification

Use Node.js 22.13 or newer.

```sh
npm run generate:platform
npm run validate:platform
npm run benchmark:sample
npm run lint
npm test
npm run archive:source
```

The retained benchmark sample command checks compatibility of the reference harness; it does not reopen benchmark or LedgerBench product development.

Run the archive command only after all source and generated artifacts are current. The committed source archive, checksums, and digest metadata must agree.

## Content discipline

- Prefer plain accounting language to generic AI claims.
- Separate sourced fact, editorial inference, recommendation, and limitation.
- Do not invent adoption, accuracy, prevalence, savings, ROI, legal effect, or professional-review claims.
- Describe maintainer review as maintainer review. Do not call it independent, professional, audited, certified, or assured without documented support.
- Link to primary sources. Store metadata and original summaries, not third-party full text.
- Record external source rights as unknown unless a publisher grant is documented.
- Use only clean-room synthetic fixtures. Never add employer, client, engagement, bank, employee, vendor, customer, or taxpayer data.
- Give each major human page one primary mode from `/content-contract` and keep tutorial, how-to, explanation, reference, case study, evidence synthesis, and program-documentation concerns visibly distinct.
- Label visible claims and examples with the content contract's evidence classification; an editorial recommendation, implementation pattern, synthetic example, or empirical finding is not an authoritative requirement.

## Interface discipline

- Human HTML, Markdown, JSON, downloads, OpenAPI, schemas, feeds, and search must preserve stable IDs and material meaning.
- Keep public APIs read-only, deterministic, cacheable, and explicit about errors, rights, dates, and provenance.
- Do not publish an MCP endpoint or A2A agent card unless the implementation provides a tested capability that the ordinary HTTPS contract does not.
- Preserve semantic headings, landmarks, keyboard access, visible focus, reduced-motion support, table captions, and descriptive alternative text.

## Change checklist

- Add or update rendered-route and interface tests for material changes.
- Update fixed release, corpus, catalog, source-count, and reading-room-count assertions.
- Update the sitemap, navigation, search index, Markdown discovery, and README when adding a public route.
- Rebuild generated artifacts and the source archive before publishing.

## Agent skills

### Issue tracker

Work is tracked in GitHub Issues for `HenryBranchAdams/ai-agents-in-accounting`. See `docs/agents/issue-tracker.md`.

### Triage labels

Use the default five-role triage vocabulary. See `docs/agents/triage-labels.md`.

### Domain docs

Use the single-context domain-documentation layout. See `docs/agents/domain.md`.
