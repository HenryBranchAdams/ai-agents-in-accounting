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

## Interface changes

Read [the design system](docs/design-system.md) and use the shadcn skill when available. Its requirements apply to all public reading surfaces, including coverage and publication views.

1. Inspect `components.json` and run `npx shadcn@latest info --json`. Search the official `@shadcn` registry before introducing a custom primitive; consider community components only when they improve the research experience. Inspect origins, licensing, maintenance, dependencies, accessibility, and server-rendering compatibility before adopting one.
2. Run `npx shadcn@latest docs <component>` and read the returned documentation. Review `add --dry-run` and `add --diff` before replacing installed source. Preserve documented local adaptations and license notices; do not blindly overwrite components.
3. Compose registry components with supported variants and sizes. Caller classes control layout, not component colors or typography. Use semantic Slate tokens from `public/style.css`, `cn()` for conditional classes, `gap-*` for stacks, and `size-*` for equal dimensions. Document any new shared token or primitive variant.
4. Forms use FieldGroup and Field with associated labels. Keep search/filter state in GET URLs and native select controls where appropriate. Use Alert, Empty, Card, Table, and Pagination for their corresponding surfaces. Route links remain links; do not replace them with state-only toggles. Sheet and other dialogs need accessible titles and working keyboard behavior. Button icons use Lucide with `data-icon`; let the component set their size.
5. Preserve server-rendered corpus content and native prose structure. Interactive components need real hydration; the current navigation island is the default boundary. Document and test any justified expansion rather than shipping inert controls or hydrating the entire corpus.
6. Run `npm run check`, including `@shadcn/lint` and its negative/positive probes. Keep exceptions exact and file-scoped in `eslint.config.mjs`; document the reason in the design-system guide. Do not disable rules broadly to admit new styling.
7. Complete the desktop/mobile and keyboard checks in [TESTING.md](TESTING.md). Build downloads and the source ZIP together. Include verification evidence and update affected contributor and architecture guidance.

Typography, spacing and reading widths include application-owned choices; do not describe every token or HTML element as supplied by shadcn. Canonical records, rights, stable URLs and agent contracts are outside a presentation-only change.
