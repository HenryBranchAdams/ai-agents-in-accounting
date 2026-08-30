# Living Atlas implementation contract

Status: responsive and data contract retained; visual prescription superseded
by `designcode-quality-direction.md` on 2026-08-29.

## Learning objective

The Atlas helps a reader trace how accounting work, controls and risks, agent capabilities, primary sources, and industry context connect. It is a navigable reference and learning surface, not a ranking, benchmark, product score, or substitute for professional judgment.

The initial guided path is:

1. Bank reconciliation
2. Matching evidence
3. Exception handling
4. Reviewer approval

The path preserves the project invariant: agents may prepare accounting work; accountable people approve conclusions and sensitive external actions.

## Responsive behavior

- Desktop provides a coordinated map workspace and evidence inspector.
- Portrait and compact layouts prioritize the semantic list while preserving an
  explicit map option and selected-node inspector.
- Responsive composition may change as needed to protect reading order,
  legibility, and useful first-viewport actions.
- Map and semantic-list views are equivalent. Previous and next controls provide a non-drag path through the guided sequence.
- Controls use at least 44 by 44 CSS-pixel targets. Focus, reduced motion, forced colors, keyboard selection, and zoom remain supported.

## Visual system

Visual direction is owned by `designcode-quality-direction.md`. This contract
does not lock a palette, texture, component library, icon source, radius,
shadow, gradient policy, or site-shell composition.

## Data and interaction contract

- Canonical repository records remain the source of truth. The Atlas is a deterministic projection with stable node and edge IDs.
- Every edge names a relationship. Every node exposes provenance, evidence classification, review status, and a canonical destination when one exists.
- Industry and time controls filter reviewed metadata; they do not infer applicability, adoption, effectiveness, or recency.
- The selected node, industry lens, time layer, and map/list mode are shareable in the URL.
- The guide asks bounded questions and routes readers to evidence or a synthetic case. It does not approve conclusions or perform external actions.
- HTML, Markdown, JSON, OpenAPI, search, sitemap, and agent-discovery surfaces preserve material meaning.

## Qualification boundary

Local rendering, static contract tests, and visual comparison may qualify the implementation for review. They do not establish hosted behavior, deployment, independent review, professional review, control effectiveness, learning efficacy, or production release.
