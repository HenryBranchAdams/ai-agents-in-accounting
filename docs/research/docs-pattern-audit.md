# Documentation pattern audit for Accounting Agents

Research date: 2026-08-23
Scope: professional-minimal documentation and wiki patterns, accessibility, citations, search, and human/agent parity. Observations below come from first-party sites, specifications, and source repositories. Recommendations are explicitly labeled and are not claims about what the reference sites require.

## Executive recommendation

Use the familiar documentation anatomy shared by Nimbus, Flue, Cloudflare, Fumadocs, Nextra, and Mintlify: a quiet top bar, grouped left navigation, a restrained reading column, a local table of contents, fast keyboard search, page-level metadata, and previous/next links. Do not make the home page a marketing landing page. Make it a field-guide index with four obvious entry paths: learn the model, browse accounting workflows, govern authority, and connect an agent.

The strongest pattern to copy is not a particular theme. It is **one canonical corpus rendered into equivalent human and machine surfaces**:

- semantic HTML for people, browsers, search engines, and accessibility trees;
- clean Markdown alternates for low-token retrieval;
- structured JSON records and an OpenAPI description for programmatic use;
- a concise discovery index and full downloadable snapshot;
- visible provenance, review state, and freshness on every substantive record.

For presentation, retain white and near-white surfaces, one sober accent color, thin borders, compact metadata, sentence-case labels, and a 64–72 character reading measure. Avoid oversized heroes, gradients, glass effects, decorative AI imagery, floating cards, excessive pills, and animation that does not explain a mechanism.

## Resolving “Flue” and “Nimbus”

### High-confidence match: Nimbus

The likely Nimbus reference is Cloudflare's open-source [Nimbus documentation framework](https://github.com/cloudflare/nimbus) and its own [documentation site](https://nimbus-docs.com/). The match is unusually strong: Nimbus describes itself as documentation “where humans and agents are both first-class,” and it ships Markdown twins, `llms.txt`, full-text search, JSON-LD, breadcrumbs, pagination, and accessible navigation. Its [agent surfaces](https://nimbus-docs.com/ai/agent-surfaces/) and [sidebar](https://nimbus-docs.com/navigation/sidebar/) pages document those patterns directly.

Important caveat: Nimbus is currently pre-1.0, and its repository warns that the public surface can change between minor releases. Several Nimbus pages are also visibly labeled “AI-generated · awaiting review.” Borrow its information architecture and provenance patterns; do not treat its current package API or unreviewed copy as an authority.

### Probable match, but still ambiguous: Flue

The most plausible Flue reference is the [Flue agent framework](https://github.com/withastro/flue) and [Flue documentation](https://flueframework.com/docs/guide/getting-started/). Its docs use the same professional documentation grammar: top-level section tabs, a section rail, command-key search, an “On this page” outline, last-updated metadata, and “View as Markdown.” Flue also exposes an unusually useful agent pattern: [`flue docs search`](https://flueframework.com/docs/cli/docs/) returns ranked JSON results and `flue docs read` prints the matching page as Markdown from the locally installed version.

“Flue” is overloaded. Search also finds an unrelated desktop-automation bridge named Flue. The framework above is the best contextual match, but visual fidelity work should confirm that this is the intended reference rather than assume it.

## Observed patterns from comparable sites

| Reference | Observed pattern | Why it matters here |
|---|---|---|
| [Nimbus](https://nimbus-docs.com/get-started/) | Hierarchical left rail, breadcrumb, H1 plus short description, compact status/date/actions row, narrow body, right-side “On this page,” and next-page navigation. Search is available from the rail and keyboard. | Strongest direct model for a calm wiki whose pages are equally usable by people and agents. |
| [Nimbus agent surfaces](https://nimbus-docs.com/ai/agent-surfaces/) | Markdown and MDX twins, site and section indexes, a full-corpus representation, version labels, JSON-LD, robots, and sitemap are generated from the same content tree. | Demonstrates parity instead of a separate, drifting “AI knowledge base.” |
| [Nimbus linting](https://nimbus-docs.com/writing/linting/) and [reference recipe](https://nimbus-docs.com/writing/recipes/reference/) | Stable lint rule IDs, JSON diagnostics, visible draft/review state, self-identifying headings, stable anchors, one source of truth, last-verified dates, and a warning against hiding reference facts in tabs or accordions. | Useful anti-slop and anti-hallucination controls for an accounting reference. |
| [Flue docs](https://flueframework.com/docs/guide/why-flue/) | A small global section taxonomy (Guide, Reference, CLI, SDK, Ecosystem), local navigation, keyboard search, updated date, Markdown action, and local TOC. | Shows how a large body of material stays dense without feeling busy. |
| [Flue docs CLI](https://flueframework.com/docs/cli/docs/) | The same installed-version documentation is listable, searchable as ranked JSON, and readable as Markdown without a network request. | A strong later-stage pattern for a downloadable/version-pinned Accounting Agents corpus or CLI. |
| [Stripe get started](https://docs.stripe.com/get-started) and [quickstarts](https://docs.stripe.com/quickstarts) | The entry page starts from concrete use cases, then exposes a clear “start building” path. Quickstarts pair steps with language/framework-specific examples. Pages expose “Ask AI,” “Copy for LLM,” and Markdown. | Use task-based entry points and copyable examples; do not organize only around abstract AI terminology. |
| [Stripe API docs](https://docs.stripe.com/apis) and [`llms.txt`](https://docs.stripe.com/llms.txt) | Guide and reference content share a taxonomy; API concepts such as authentication, pagination, errors, and versioning are first-class. The machine index contains direct Markdown links and agent guidance. | Keep educational pages, records, API contract, and agent instructions mutually discoverable. |
| [Linear Docs](https://linear.app/docs) | The home page privileges “Popular” tasks and then grouped basics. Articles use short opening summaries, an “Overview,” descriptive headings, and linkable header anchors. | A useful model for non-developer readers who need an answer before learning the full taxonomy. |
| [Cloudflare Docs for agents](https://developers.cloudflare.com/docs-for-agents/) | Every page can be copied or fetched as Markdown by URL or `Accept: text/markdown`; product and global indexes are available. Regular pages also expose breadcrumb, TOC, updated date, edit/report actions, and feedback. | Best large-scale example of a mature human docs site adding low-token agent access without removing normal web semantics. |
| [Fumadocs](https://www.fumadocs.dev/docs/headless) | Breadcrumb, sidebar, TOC, and search are composable; its search supports several backends and its UI exposes a command-key dialog. It also documents generating LLM-oriented text from the same source. | Confirms that search, navigation, and alternate representations should be shared primitives rather than page-specific inventions. |
| [Nextra docs theme](https://nextra.site/docs/docs-theme/start) | Top navigation, search, page sidebar, and TOC are the theme's core defaults; [search](https://nextra.site/docs/guide/search) is a static build-time index through Pagefind. | Supports a low-dependency, static-first search approach for a public corpus. |
| [Mintlify navigation](https://www.mintlify.com/docs/organize/navigation) and [search](https://www.mintlify.com/docs/optimize/search) | One primary navigation model is selected at the root; search ranking can be boosted by page or group rather than by duplicating content. | The accounting taxonomy should stay singular and explicit, with ranking tuned around common tasks. |

## Recommended information architecture

The five navigation groups already defined for the guide are the right level of granularity:

1. **Learn** — overview, fundamentals, lifecycle, authority.
2. **Workflows** — all workflows plus the eight accounting process families.
3. **Govern** — controls, sensitive actions, evidence, security and identity.
4. **Implement** — architecture, evaluation, pilot, production operations.
5. **Reference** — templates, glossary, sources, agent access.

Recommended shell:

- **Top bar:** wordmark; one wide search control; links to Source library and Agent access. Avoid a crowded product-navigation bar.
- **Left rail:** the five groups, current-page state, expandable workflow families, and a compact mobile drawer. Keep labels stable because people and agents will cite them.
- **Main column:** breadcrumb; one H1; a one- or two-sentence purpose statement; compact metadata/actions; body; cited sources; previous/next navigation.
- **Right rail:** a local table of contents generated from H2/H3 headings. Hide it when the page has fewer than three useful sections.
- **Home page:** four task-oriented entry cards, the lifecycle/family map, the authority boundary, and a “recently reviewed” or “source coverage” area. Do not lead with a promotional hero or product claims.

Recommended content-template split:

| Page type | Stable page anatomy |
|---|---|
| Concept | Definition → why it matters → boundaries → example → sources → related pages |
| Workflow | Objective → owner/reviewer → scope and trigger → inputs → procedures → deterministic checks → authority/approvals → outputs/run record → stops/failures → sources |
| Control pattern | Risk → control objective → performer/assessor → evidence → test procedure → failure response → sources |
| Sensitive action | What may be prepared → what may execute → authority level → identity/SoD → limits → preflight → approval → rollback/reconciliation → human-only conditions |
| Reference record | Exact term/ID → concise definition → allowed values or rule → source and freshness → related records |
| Source record | Title → publisher → source type → jurisdiction → published/updated/verified dates → relevance note → canonical link → licensing/access note |

The [Nimbus reference recipe](https://nimbus-docs.com/writing/recipes/reference/) is especially relevant: retrieved headings should identify themselves, entries should share one template, and facts should not disappear inside collapsed UI. For Accounting Agents, a chunk headed “Approval timing” is too ambiguous; “Journal posting — approval timing” is independently usable.

## Professional-minimal presentation

These are recommendations, not measurements copied from the reference sites.

- Use a white page, near-white secondary surface, charcoal text, restrained gray borders, and one dark green or blue accent. Reserve orange/red for warnings and prohibited states.
- Use the system UI sans-serif stack for prose and a native monospace stack only for workflow IDs, API fields, and examples.
- Keep body text around 15–17 CSS pixels with approximately 1.55–1.7 line height and a 64–72 character measure. A roughly 720–780 pixel article column is appropriate at desktop sizes.
- Use sentence case. Make H1 clearly dominant, H2 structural, and H3 compact. Avoid eyebrow text unless it carries real classification such as “Human-only.”
- Prefer hairline borders and background changes over shadows. A search dialog may use one restrained shadow; ordinary content cards should not float.
- Use status tags only for controlled vocabulary: authority level, source type, review state, jurisdiction, and deprecation. Do not turn every noun into a pill.
- Use diagrams only when they explain sequence, authority, or evidence lineage. Do not add generic robot imagery, glowing network art, or decorative dashboards.
- Keep motion optional and rare. If an interactive diagram is justified, follow the reduced-motion and keyboard practices described by [Nimbus interactive content](https://nimbus-docs.com/writing/interactive-content/).

## Search and navigation behavior

Search should cover page titles, section headings, all 60 workflow records, glossary terms, source titles/publishers, and stable IDs. Recommended behavior:

- open with both `/` and `Ctrl/Cmd+K`, while leaving `/` usable when focus is already in a text field;
- group results by Workflow, Concept, Template, Glossary, and Source;
- show a short matched excerpt and the parent process family;
- support filters for family, authority level, jurisdiction, source type, and last-reviewed date on the full results page;
- make every result a real link with a stable URL and descriptive accessible name;
- provide arrow-key navigation, Enter to select, Escape to close, and restore focus to the trigger.

If search suggestions are implemented as a combobox, follow the W3C [ARIA Authoring Practices combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) instead of assembling ad hoc roles and keyboard behavior. Nimbus and Fumadocs both expose command-key search, while Nextra documents a static Pagefind index and Nimbus documents [build-time Pagefind search](https://nimbus-docs.com/navigation/search/). A static index is sufficient at the current corpus size; the JSON API can later back richer filters.

## Citations, provenance, and editorial trust

Accounting guidance should be visibly more rigorous than a generic docs site.

Recommended rules:

1. Put a citation beside the substantive claim it supports, not only in a bibliography.
2. Distinguish **source fact**, **site-authored synthesis**, and **implementation recommendation**.
3. Prefer the issuing standard setter, regulator, professional body, protocol author, or vendor's first-party documentation.
4. Show publisher, document title, publication/update date when available, jurisdiction, source type, canonical URL, and the site's last verification date.
5. Give every workflow, control pattern, template, glossary term, and source a stable ID.
6. Display “Reviewed” and a date on public accounting content. If a draft is exposed, label it; for this site, publishing only reviewed content is preferable to copying Nimbus's public “awaiting review” pattern.
7. Provide “Report an issue” and a correction path on every substantive page. Cloudflare's page-level edit/report actions are a good model.
8. Never infer a third-party license. Separate the site's editorial/compilation license from the linked work's license.

The W3C [PROV-O model](https://www.w3.org/TR/prov-o/) supplies a useful conceptual minimum—entity, activity, and responsible agent—while [DCAT 3](https://www.w3.org/TR/vocab-dcat-3/) covers dataset publication, revision, distribution, and publisher metadata. The site does not need to expose full RDF to adopt those provenance fields consistently.

## Accessibility baseline

Target WCAG 2.2 AA. W3C encourages use of the latest WCAG 2 version, and WCAG 2.2 preserves the earlier 2.x criteria while adding new requirements ([WCAG overview](https://www.w3.org/WAI/standards-guidelines/wcag/)).

Required patterns:

- Use `header`, labeled `nav`, `main`, `article`, complementary TOC, and `footer` landmarks. Include a visible-on-focus skip link. W3C notes that structured pages help screen-reader and keyboard users navigate efficiently ([Page Structure Tutorial](https://www.w3.org/WAI/tutorials/page-structure/)).
- Use one H1 and logical heading ranks. Headings are a navigation interface, not just typography ([W3C headings guidance](https://www.w3.org/WAI/tutorials/page-structure/headings/)).
- Put the in-page TOC in a labeled navigation landmark and make heading anchors stable. W3C describes TOCs and skip links as mechanisms for bypassing repeated blocks and skimming a page ([in-page navigation](https://www.w3.org/WAI/tutorials/page-structure/in-page-navigation/)).
- Ensure all interaction is keyboard-operable, focus is clearly visible, and sticky bars do not cover focused elements. WCAG 2.2 specifically addresses [focus not obscured](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html).
- Make pointer targets at least 24 by 24 CSS pixels or provide sufficient spacing, as required by [WCAG 2.2 target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html). Larger targets are appropriate for primary navigation.
- Reflow without two-dimensional scrolling at a 320 CSS pixel viewport except for genuinely two-dimensional data. Sticky rails must collapse rather than consume the reading area ([WCAG reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow)).
- Do not rely on color alone for authority or risk. Pair color with text such as `A3 — execute after approval`.
- Make link text meaningful out of context; avoid repeated “Read more” links when the destination can be named ([WCAG link purpose](https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-in-context)).
- Use real table headers, scopes, and captions for comparison matrices ([W3C Tables Tutorial](https://www.w3.org/WAI/tutorials/tables/)). On narrow screens, preserve the relationships or provide an equivalent list representation.
- Give informative diagrams concise alt text plus a nearby prose explanation; use `alt=""` for decoration ([W3C Images Tutorial](https://www.w3.org/WAI/tutorials/images/)).
- Respect text zoom, reduced motion, high contrast/forced colors, and user color-scheme preferences. Do not make hover the only way to reveal a citation or definition.

Accessible HTML is also the best default interface for browser-operating agents. Cloudflare's [Playwright MCP documentation](https://developers.cloudflare.com/browser-run/playwright/playwright-mcp/) explains why accessibility-tree roles, labels, and hierarchy can be faster and more deterministic than screenshot-only interaction. This is a benefit of correct semantics, not a reason to weaken the human experience.

## Agent-readable surface

The adjacent machine-interface research goes deeper on protocols; the presentation-level recommendation is:

| Surface | Recommended use |
|---|---|
| Canonical HTML page | Complete, indexable, accessible record for humans and general web clients |
| Page `.md` alternate | Clean prose and record fields without navigation chrome |
| `/llms.txt` | Short orientation file linking to the corpus, API, and highest-value pages |
| Downloadable context bundle | Versioned full-corpus Markdown and JSON snapshots with counts, schema version, and generated/modified dates |
| `/api/v1/...` | Read-only JSON collections and individual records, searchable/filterable with deterministic pagination |
| `/openapi.json` | Machine-readable HTTP API contract |
| Sitemap, robots, JSON-LD | General crawler discovery, access policy, and structured page/catalog metadata |
| Optional MCP adapter | Read-only resources/search after a demonstrated client need; not the primary source of truth |

Nimbus, Cloudflare, Stripe, Fumadocs, and Mintlify all expose some form of Markdown or LLM-oriented retrieval. That is strong implementation evidence, but `llms.txt` remains an emerging convention rather than an IETF or W3C standard. Keep normal HTML, sitemap/robots, and the documented JSON API authoritative.

The API should expose stable IDs, schema/content versions, canonical URLs, provenance, source IDs, reviewed/modified dates, and explicit authority levels. Use the [OpenAPI Specification](https://spec.openapis.org/oas/latest.html) so humans and computers can discover the service contract. Use standard validators (`ETag`, `Last-Modified`) from [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html), standard problem responses from [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457.html), and Web Linking from [RFC 8288](https://www.rfc-editor.org/rfc/rfc8288.html) to advertise alternate representations.

If MCP is added, expose read-only **resources** for workflows, authority levels, templates, glossary entries, and sources, plus at most a constrained search tool. The MCP specification defines resources as URI-identified contextual data and supports list/read/templates ([MCP Resources](https://modelcontextprotocol.io/specification/latest/server/resources)). Linear's [read-only MCP endpoint](https://linear.app/docs/mcp) is a useful permission model. Do not add mutating accounting tools to a public educational server.

## Anti-slop editorial controls

Adopt automated and editorial checks inspired by Nimbus's [linting](https://nimbus-docs.com/writing/linting/) and reference guidance, but tune them for a high-trust accounting corpus.

### Build-breaking checks

- duplicate stable ID or route;
- invalid workflow/authority/source relationship;
- missing H1, description, owner, last-reviewed date, or required source field;
- heading-level jumps that break structure;
- broken internal links, anchors, and source URLs;
- workflow records missing any required canonical field;
- human page, Markdown, API, or search representation generated from different record versions;
- undocumented authority-level value;
- inaccessible image, form label, or table header relationship.

### Editorial checks

- delete generic openings such as “AI is transforming the accounting landscape” unless the claim is necessary and sourced;
- replace “leverage,” “unlock,” “revolutionize,” “seamless,” “robust,” and “powerful” with the concrete action or omit them;
- keep one claim per sentence when citations or authority boundaries differ;
- state who acts, on what object, under which limit, and what record remains;
- mark an inference as an inference and a recommendation as a recommendation;
- use exact authority labels (`A0`–`A4`, `Human-only`) rather than vague “human in the loop” language;
- do not repeat the same definition across pages; link to the canonical glossary or authority record;
- do not hide required facts in tabs, hover cards, accordions, diagrams, or client-only UI;
- show concrete examples, counterexamples, and stop conditions instead of abstract benefit lists;
- require a human editorial sign-off before moving an AI-assisted page to `reviewed`.

## Current implementation audit

This is a code-level audit of the working tree on 2026-08-23, not a rendered-browser or assistive-technology certification. The implementation is changing in parallel, so treat file references as the reviewed checkpoint and rerun the checks after the final build.

| Area | Current implementation | Assessment and next move |
|---|---|---|
| Shell and visual system | `app/DocsShell.tsx` and `app/globals.css` already implement a quiet three-column docs shell: sticky top bar, grouped rail, restrained article column, local TOC, breadcrumbs, previous/next links, one green accent, thin borders, and little decoration. | **Strong.** This is already much closer to Nimbus/Flue than to a marketing site. Preserve it; do not add hero art, floating feature cards, gradients, or a second visual system. |
| Information architecture | `app/content.ts` uses the recommended Learn / Workflows / Govern / Implement / Reference groups, with eight process-family links and stable labels. The overview links to all major areas. | **Strong taxonomy; partial onboarding.** Add three short start paths for accountants/controllers, builders, and audit/risk readers. At desktop size the entire rail is always expanded; use section scoping or collapsible groups if the corpus keeps growing, as documented by [Nimbus sidebar](https://nimbus-docs.com/navigation/sidebar/). |
| Page grammar | Workflow, family, authority, control, sensitive-action, template, glossary, and source pages use repeatable structures. Workflow records expose objective, evidence, procedure, checks, authority, outputs, recovery, and sources. | **Strong.** Put the workflow-specific answer and authority boundary before inherited baseline material. The record builder intentionally repeats common thresholds, run-record fields, failure modes, and recovery steps across all 60 records; in HTML, progressive disclosure or a shared-baseline link would reduce template fatigue while the API can remain fully expanded. |
| Global search | `app/DocsSearch.tsx` searches guide pages, all workflows, glossary entries, and sources; opens on Ctrl/Cmd+K; announces result counts; moves focus into the dialog; traps Tab; closes on Escape; and restores focus. | **Good foundation; interaction is partial.** Add ranked/grouped results, matched excerpts, stable IDs, arrow-key navigation, Enter selection, `/` as an optional shortcut, and a result cap. The visible shortcut currently says only `⌘ K` even though the code also supports Ctrl+K. A unified read-only `/api/v1/search` would give agents the same cross-corpus retrieval path; Flue's [ranked JSON search](https://flueframework.com/docs/cli/docs/) is the clearest reference. |
| Search-modal accessibility | The dialog has `role="dialog"`, `aria-modal="true"`, an accessible label, focus containment, a visible close control, and focus restoration. The overlay blocks pointer interaction and body scrolling. | **One material gap.** The underlying page is not made `inert` or otherwise removed from interaction while `aria-modal` is true. The W3C [modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) describes the background as inert and warns against asserting modal semantics without modal behavior for all users. Add real inertness and verify with screen-reader virtual navigation, not only Tab. |
| Semantic accessibility | `app/layout.tsx` sets `lang="en"`; `DocsShell` supplies a skip link and labeled header/nav/main/article/aside/footer structure; active links use `aria-current`; CSS supplies visible focus, responsive collapse, reduced-motion handling, and print rules. Tables use real header cells and wide tables scroll horizontally. | **Strong static baseline; conformance unproven.** Add an automated axe/HTML check plus manual keyboard, screen-reader, 200% zoom, 320 CSS-pixel reflow, high-contrast/forced-colors, and text-spacing tests. Comparison tables generally lack captions; add concise captions when the section heading does not already make the table's purpose unambiguous. |
| Color and density | Static token calculations give 5.04:1 for `#687076` on white, 4.82:1 for `#6b737a` on white, and 6.47:1 for `#176b4d` on white. Body copy is 14.5px at 1.72 line height; metadata is often 9.5–12.5px. | **Text colors are promising; visual QA remains.** The subtle borders are only about 1.25:1 (`#e4e6e8`) and 1.51:1 (`#cfd3d6`) against white, so they cannot be the sole cue identifying a control. W3C's [non-text contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) requires meaningful component cues to reach 3:1. Labels may provide an alternate cue, so verify the rendered controls rather than declare a blanket failure. Consider 15.5–16px body copy for the broad accounting audience and avoid adding more sub-11px text. |
| Citations and source records | `app/resources/page.tsx`, `app/ResourceIndex.tsx`, and `app/resources/[id]/page.tsx` provide a searchable, typed source catalog with stable IDs, first-party canonical links, jurisdiction/access notes, review dates, explicit unknown-license treatment, JSON/Markdown alternates, and catalog JSON-LD. Workflow and governance pages visibly list supporting sources. | **Excellent catalog; citation granularity is partial.** Most workflow `source_ids` are inherited from the process family in `app/workflows-data.ts`, so a workflow-specific claim can appear beside only a broad family source set. Add workflow- and claim-level source mappings, and place citations beside consequential accounting, authority, and legal claims rather than only at the end. Preserve the existing applicability and rights caveats. |
| Page trust metadata | Workflow and source records expose IDs, versions, review dates, and provenance; the rail shows a corpus-wide reviewed date. | **Partial.** Static concept/how-to pages do not consistently show their own reviewed date, review state, responsible editorial role, Markdown action, or correction path. Add a compact page-action row: Reviewed, View as Markdown, Copy page, and Report an issue. Do not publish an “awaiting review” page merely because Nimbus demonstrates that status; public accounting guidance should default to reviewed-only. |
| Agent surfaces | The site already exposes `agent-context.md`, `llms.txt`, collection Markdown, a full Markdown bundle, canonical JSON snapshots, versioned read-only APIs, OpenAPI, RFC 9727 discovery, sitemap/robots, stable IDs, provenance, validators, pagination, CORS, and problem details. `app/machine-access/page.tsx` documents the contract and correctly treats MCP as optional. | **Stronger than most references.** The main gap is page parity: most human concept and workflow pages do not expose a visible page-specific Markdown twin or page-level structured data. Follow [Nimbus agent surfaces](https://nimbus-docs.com/ai/agent-surfaces/) and Stripe's [append-`.md` pattern](https://docs.stripe.com/agents) so every canonical page advertises an exact low-token alternate. Keep the JSON API authoritative for records. |
| Anti-slop and review gates | The published copy is mostly concrete, restrained, operational, and free of decorative AI claims. Type and record assertions catch duplicate IDs and missing corpus counts. The repository has code linting but no dedicated prose/citation/review-state gate in `package.json`. | **Copy quality is strong; maintenance control is missing.** Add deterministic editorial checks for generic openings, promotional filler, duplicate definitions, unsupported numerals/dates, vague authority language, missing adjacent sources, heading/link quality, and HTML/Markdown/API version parity. Record human review state separately from the fact that a record was generated or normalized. |

### Highest-priority implementation gaps

1. Make the search modal truly inert behind the dialog, then run the full accessibility verification set; the current static review cannot establish WCAG 2.2 AA conformance.
2. Replace family-only citation inheritance with workflow- and claim-level source mapping for consequential accounting, authority, filing, payment, deletion, and certification statements.
3. Add a page action/trust row and a page-specific Markdown alternate plus structured metadata for every canonical human page.
4. Upgrade search from an unranked link list to grouped, ranked, keyboard-navigable retrieval, and expose the same cross-corpus search as a read-only JSON endpoint.
5. Add an editorial/provenance gate so repetitive generated fields, generic language, stale review dates, and representation drift are detected before publication.
6. Add role/task start paths and collapse or scope the rail only when the expanding corpus makes the current always-open navigation materially slower to scan.

## Recommended implementation order

1. **Canonical page grammar:** finish the five-group information architecture and one template per content type.
2. **Trust layer:** stable IDs, adjacent citations, review/freshness metadata, source records, correction links.
3. **Navigation layer:** grouped rail, breadcrumbs, TOC, previous/next, keyboard search, mobile/reflow behavior.
4. **Accessibility validation:** WCAG 2.2 AA checks, keyboard walk-through, zoom/reflow, screen-reader landmarks/headings/tables, reduced motion.
5. **Machine parity:** Markdown alternates, complete context exports, JSON API, OpenAPI, discovery metadata, validators, and contract tests generated from the same records.
6. **Retrieval evaluation:** test representative human and agent questions for findability, correct source attribution, authority-boundary preservation, and stale-version avoidance.
7. **Optional adapter:** add a read-only MCP surface only if direct Markdown/API retrieval leaves a measured integration gap.

## Material gaps and cautions

- **Flue remains a name ambiguity.** The agent-framework docs are the best match, but the intended reference should be confirmed before pursuing close visual imitation.
- **Nimbus is a pattern source, not a stable dependency requirement.** It is pre-1.0 and some public copy is explicitly awaiting review.
- **Do not equate agent-readable with `llms.txt`.** Accessible HTML, stable URLs, a sitemap, Markdown alternates, and a documented JSON API carry most of the value.
- **Do not let full-scope coverage imply full agent authority.** Search results, workflow summaries, downloads, and API records must preserve the same authority and human-only fields as the detailed page.
- **Do not create a separate agent corpus.** Drift between HTML, Markdown, JSON, search excerpts, and context bundles would be especially dangerous in accounting guidance.

## Acceptance checklist

- [ ] A first-time accountant can reach a relevant workflow from the home page in two choices or fewer.
- [ ] A controller can see the authority boundary and required approver before detailed procedures.
- [ ] An auditor can trace each material claim to a visible primary source and verification date.
- [ ] A keyboard-only user can open search, traverse results, close it, navigate the rails, and reach every page action.
- [ ] The site remains readable at 200% zoom and a 320 CSS pixel viewport without sticky chrome obscuring content.
- [ ] Every page has one H1, logical headings, descriptive links, stable anchors, and a useful local TOC when warranted.
- [ ] Status is never color-only; every authority tag includes its code and meaning.
- [ ] Every canonical record is available at stable HTML, Markdown, and JSON URLs generated from the same version.
- [ ] API collections are filterable and deterministic; errors, pagination, caching, and schema version are documented.
- [ ] The downloadable context preserves citations, authority levels, human decisions, stop conditions, and review dates.
- [ ] Draft or AI-assisted content cannot appear as reviewed without attributable human sign-off.
- [ ] Retrieval tests show that humans and agents return the same current authority boundary and cite the same sources.
