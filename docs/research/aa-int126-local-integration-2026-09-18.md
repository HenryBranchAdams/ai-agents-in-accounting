# AA-INT126 local integration receipt

Status: local-only integration, not a release publication.

Date: 2026-09-18

Branch: `codex/aa-int126-assurance-integration`

Verified base: `92bfc034183adf7857ed291158a7ba64f50fb8a1`, tree `7f1849ac86a8063dc0550683d3430969801840cd`

Accepted local source: branch `codex/aa-r126-correction`, head `256aaad056d6abd620cf8cfea7aab4268f15b585`, correction `77ad06e9188a633421728e266b2d16e6689729b4`, review receipt `52cb3fad71d752226cf3face5eb4b85e2e654444`, local source snapshot `2026-09-17.126`. That source remains provenance for this integration and is not treated as a release.

## Integrated scope

- Edition and local snapshot: `2026-09-18.1`.
- Assurance families: `q-audit-assertions`, `q-controls-fraud`, `q-compliance-assurance`, and `q-professional-governance`.
- New named questions: `rq-audit-assertions-recorded-vs-omitted`, `rq-audit-assertions-contradictory-evidence`, `rq-controls-fraud-design-operation`, `rq-controls-fraud-contradiction-override`, `rq-compliance-assurance-federal-award-criteria`, `rq-compliance-assurance-exception-scope`, `rq-professional-governance-human-boundary`, and `rq-professional-governance-context-routing`.
- Explicitly corrected existing named questions: `rq-audit-assertions-assertion-evidence`, `rq-audit-assertions-automated-evidence`, `rq-controls-fraud-fraud-scenario`, `rq-controls-fraud-monitoring`, `rq-compliance-assurance-criteria-scope`, `rq-compliance-assurance-evidence-exception`, `rq-professional-governance-competence-independence`, and `rq-professional-governance-quality-system`.
- Synthetic example: `example-assurance-evidence-packet`.
- Scoped assessments: `coverage-assurance-assertions-2026-09-17`, `coverage-assurance-controls-2026-09-17`, `coverage-assurance-compliance-2026-09-17`, and `coverage-assurance-governance-2026-09-17`.

The integration scope and source union are recorded in `data/research/foundations.json`. Existing question IDs, source identities, unrelated guide fields, and historical records remain in place.

## Conflict and provenance decisions

The current conflict-aware importer remains the integration path. Its narrow extension permits substantive replacement only for the eight question IDs listed above, preserves unrelated existing registry rows, merges source locators and assessment fields, and remains byte-stable on replay. The AA-I125 management-accounting replay also preserves this newer assurance edition and its scope marker while still adding its absent FAR source and supplemental review in the regression harness.

The existing main snapshot identity `2026-09-17.2` and its bytes were preserved. The accepted alternate local lineage used source snapshot `.126` with corpus edition `2026-09-14.3`, mapping edition `2026-09-14.1`, assessment edition `2026-09-14.3`, and 1,068 records. That historical collision is retained as provenance. The resolution is a new local `2026-09-18.1` state, with no existing snapshot or release identity rewritten or dropped.

## Evidence boundaries

Inherited source checks remain identified as inherited where applicable. Effective periods remain unknown when the source record does not establish them. Rights remain unresolved where publisher terms were not granted. The four assessments are partial and scoped to their declared industry and question family. The packet, calculations, search results, and exports do not assert professional review, production evidence, assurance conclusions, or live control operation.

## Local verification

- `node scripts/build-research-coverage.mjs` passed.
- `npm run coverage:map` passed with 1,107 records and 1,048 candidate-associated records.
- `npm run validate` passed with 1,107 records and 653 sources.
- Importer replay tests passed, including explicit scoped replacement, unrelated-state preservation, conflict reporting, and byte-stable replay.
- Assurance foundation, reporting-foundations, management-accounting, nonprofit, evidence, and release integration tests passed in their targeted runs.
- `npm run build` produced the current corpus, release downloads, and multipart source export.
- Source archive reconstruction passed from the generated multipart manifest, with the release gzip intentionally omitted from the source membership because the release bundle supplies it.
- The final `npm run check` result and generated artifact digests are the evidence attached to the local commit containing this receipt.

Final local artifact digests:

- `data/releases/2026-09-18.1/corpus.json`: 10,216,114 bytes, SHA-256 `c95abe98c15bb4629337a527b7976b0939f7543b54ac3020fe36cf6432d449d8`.
- `data/releases/2026-09-18.1/corpus.json.gz`: 887,536 bytes, SHA-256 `9524060cceda96ce495479f0ea66f474b76cf11aedb7d57f6733596bb5a708dd`.
- `data/releases/2026-09-18.1/corpus.jsonl`: 8,047,067 bytes, SHA-256 `c9aa75383156766ffb428aee872bbbee8aab5186fe295fa03f04d857825207bb`.
- `data/releases/2026-09-18.1/manifest.json`: SHA-256 `7b9b9b0f800aaf6a29779d35ce5156ed6227e0c6ce4a62429db7a3199dcf391a`.

No pull request, push, GitHub comment, merge, issue closure, deployment, or remote branch action was performed.
