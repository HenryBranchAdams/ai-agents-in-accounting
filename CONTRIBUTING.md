# Contributing

Accounting Agents accepts corrections, source additions, workflow improvements, synthetic fixtures, benchmark cases, accessibility fixes, and software changes.

## Before proposing a change

1. State the user problem and the affected record IDs or routes.
2. Use primary or authoritative sources for accounting, audit, legal, regulatory, security, and interface claims.
3. Do not copy source text beyond a short, necessary quotation. Add citation metadata and write an original summary.
4. Use synthetic data only. Never submit client, employer, engagement, bank, employee, vendor, or taxpayer data.
5. Keep preparation, approval, and execution boundaries explicit. New cases that request a sensitive action must test refusal or attributable authorization.

## Record requirements

Every substantive record needs a stable ID, version, review date, review status, provenance, source basis, scope, jurisdiction or applicability note, and reuse status. Workflow and pack changes must identify deterministic checks, human decisions, stop conditions, expected outputs, and retained evidence.

## Local checks

Run:

```sh
npm run generate:platform
npm run validate:platform
npm run lint
npm test
```

For benchmark harness changes, also run `npm run benchmark:sample`.

## Review

Editorial review checks source applicability, plain language, rights, and professional boundaries. Maintainer review checks schemas, API compatibility, accessibility, security, and generated-artifact parity. Material accounting or assurance changes require a designated subject-matter reviewer before publication.

By contributing, you agree that software contributions are licensed under MIT, original editorial contributions under CC BY 4.0, and deliberately submitted factual metadata and synthetic fixtures under CC0 1.0.
