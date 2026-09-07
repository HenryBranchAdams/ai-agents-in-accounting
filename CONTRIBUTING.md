# Contributing to the corpus

Contribute information that helps someone build accounting agents: authoritative sources, evidence, accounting context, technical references, data contracts, and clearly labeled synthetic examples.

1. Search for an existing record and preserve its ID when updating it.
2. Add or edit the appropriate `data/corpus/<kind>.json` file using the [record schema](schemas/record.schema.json).
3. Record the original publisher, URL, accounting relevance, jurisdiction, evidence basis, dates, provenance, and rights. Leave unknown fields unknown.
4. Link the relevant `source_ids`, add useful topics, and explain limitations or contrary evidence. Keep third-party full text out of the corpus unless a separately reviewed rights policy explicitly admits it.
5. Follow [the corpus policy](docs/corpus-policy.md), update the corpus version for a published change, and run `npm run check`.
6. Submit a focused repository change with the source evidence and validation performed. If the interface changes, include desktop and mobile evidence.

Source suggestions and corrections may also be filed as repository issues with a publisher URL, affected record IDs, a reason for inclusion, and known reuse terms. Do not submit confidential client records, credentials, or production accounting data.

Maintainers review publication. Domain expertise and review evidence must be recorded before claiming professional review. Contributors retain authorship of original work while contributing it under the applicable project license. Disclose relevant commercial or authorship interests.
