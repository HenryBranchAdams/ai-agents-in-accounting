# Living Atlas implementation contract

Status: approved for implementation on 2026-08-28.

## Learning objective

The Atlas helps a reader trace how accounting work, controls and risks, agent capabilities, primary sources, and industry context connect. It is a navigable reference and learning surface, not a ranking, benchmark, product score, or substitute for professional judgment.

The initial guided path is:

1. Bank reconciliation
2. Matching evidence
3. Exception handling
4. Reviewer approval

The path preserves the project invariant: agents may prepare accounting work; accountable people approve conclusions and sensitive external actions.

## Approved responsive composition

- Desktop: a large map workspace beside a persistent evidence inspector.
- Portrait: the map remains visible in the first viewport; the selected-node inspector follows directly below it.
- Landscape: the map uses roughly two thirds of the viewport and the compact inspector uses the remaining third.
- Below 900 CSS pixels, the inspector moves below the map. Below 720 CSS pixels, the graph reduces to the selected path and its nearest evidence, control, and industry neighbors.
- Map and semantic-list views are equivalent. Previous and next controls provide a non-drag path through the guided sequence.
- Controls use at least 44 by 44 CSS-pixel targets. Focus, reduced motion, forced colors, keyboard selection, and zoom remain supported.

## Visual system

- Warm off-white paper field with a faint generated topographic-contour texture.
- Deep ink typography, forest green for the active path, restrained blue, violet, amber, and teal for graph categories.
- White cards, hairline borders, compact shadows, rounded corners, and no gradients.
- Phosphor icons and React Flow provide the visible icon and graph primitives; the implementation does not recreate them as handcrafted SVG or CSS art.

## Data and interaction contract

- Canonical repository records remain the source of truth. The Atlas is a deterministic projection with stable node and edge IDs.
- Every edge names a relationship. Every node exposes provenance, evidence classification, review status, and a canonical destination when one exists.
- Industry and time controls filter reviewed metadata; they do not infer applicability, adoption, effectiveness, or recency.
- The selected node, industry lens, time layer, and map/list mode are shareable in the URL.
- The guide asks bounded questions and routes readers to evidence or a synthetic case. It does not approve conclusions or perform external actions.
- HTML, Markdown, JSON, OpenAPI, search, sitemap, and agent-discovery surfaces preserve material meaning.

## Qualification boundary

Local rendering, static contract tests, and visual comparison may qualify the implementation for review. They do not establish hosted behavior, deployment, independent review, professional review, control effectiveness, learning efficacy, or production release.
