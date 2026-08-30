# DesignCode quality direction

This direction raises the public knowledge hub to the craft level of the 2026
DesignCode course experience without copying its sales mechanics or dark visual
theme. The translation is a calm, light evidence instrument: editorial enough
to remember, precise enough to trust, and responsive enough to use while doing
real work.

## Accepted concepts

- `concepts/designcode-quality/concept-home.png` — homepage first viewport and
  Living Atlas preview.
- `concepts/designcode-quality/concept-path-current.png` — role path and current
  signal composition.
- `concepts/designcode-quality/concept-docs-shell.png` — shared documentation
  shell.
- `concepts/designcode-quality/concept-atlas.png` — Living Atlas workspace.
- `concepts/designcode-quality/concept-mobile.png` — mobile homepage and path
  continuation.

The concepts define composition, hierarchy, typography, palette, geometry, and
interaction character. Repository records remain the copy and data source of
truth. Generated example records, counts, dates, organization names, source
names, and claims are explicitly excluded from implementation.

## Visual system

- Background: true paper white with cool-gray structural bands. Do not warm the
  neutral palette.
- Ink: near-black `#111116`; reading text `#4f5360`; metadata `#6d707c`.
- Signal: atlas indigo `#4f46d9`, deep `#3433a8`, and a pale selected surface
  `#f0efff`. The signal is used for active state, focus, selected paths, and
  source-linked actions—not decoration everywhere.
- Rules: cool hairlines `#dedfe6`; stronger divisions `#c9cbd5`.
- Typography: a modern humanist/system sans for UI and reading; a compact mono
  face only for IDs, dates, evidence classes, statuses, and structural labels.
- Type rhythm: large editorial page promises, deliberately sized controls, and
  body copy that never drops below a comfortable reading size.
- Geometry: open ruled bands, rails, indexed rows, and canvases. Cards are used
  only when a record genuinely needs a boundary.
- Texture: an extremely subtle contour/grid field may support the homepage and
  Atlas. It must not reduce contrast or become a faux-technical background.

## Component families

- Two-tier masthead: global learning routes on the first line; page context on
  the second where the surface benefits from it.
- Corpus instrument: factual counts and review metadata with direct links.
- Path rail: four real learning branches connected by one selected route.
- Signal index: dated, classified source records rendered as rows rather than a
  marketing card grid.
- Documentation shell: contextual left navigation, central reading column,
  provenance band, and right section rail.
- Atlas workspace: filter rail, map/list parity, selected-node inspector, and a
  compact provenance footer.

## Motion and state

- Use 160–240ms opacity/transform transitions for route context, selected path,
  inspector reveal, and live source status.
- Motion confirms hierarchy or state; reading never depends on animation.
- `prefers-reduced-motion` removes transforms and looping effects.
- Keyboard focus uses a visible two-pixel indigo outline with adequate offset.

## Responsive contract

- Desktop keeps the broad editorial composition and contextual rails.
- Tablet collapses the right rail first, then converts navigation to a single
  accessible disclosure.
- Mobile uses one compact masthead, a vertical path rail, full-width controls,
  44px minimum targets, no horizontal graph dependency, and no tiny metadata.
- The Atlas defaults to its linear equivalent on narrow screens while retaining
  an explicit map option.

## Copy and evidence lock

Visible claims, source records, classifications, counts, dates, routes, and
authority language come from the maintained TypeScript corpus. The concepts do
not authorize invented proof, adoption, outcomes, product status, or operating
claims. The accounting boundary describes production accounting work; it does
not constrain the website from being expressive, interactive, or automated.

## Explicit non-goals

- No pricing, countdowns, fake testimonials, fake terminal, or commercial
  urgency borrowed from DesignCode.
- No dark cyberpunk treatment, starfield, glass-dashboard grid, or finance
  cliche imagery.
- No deployment claim. Local visual and functional acceptance is distinct from
  hosted or public qualification.
