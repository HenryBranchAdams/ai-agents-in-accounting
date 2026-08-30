# Living Cartography design QA

Date: 2026-08-30
Branch: `codex/edtech-living-cartography`
Target: a modern, practice-first EdTech experience at the quality bar established by the selected Living Cartography direction.

## Source and render comparison

The selected source concepts and final browser renders were opened together and judged in the same comparison pass.

| Surface | Source concept | Final browser evidence | Viewport |
| --- | --- | --- | --- |
| Learning home | `docs/design/concepts/edtech-v2/living-cartography-home.png` | `/private/tmp/aa2-home-1440-viewport-final.png` | 1440 × 1024 |
| Core course | `docs/design/concepts/edtech-v2/living-cartography-course.png` | `/private/tmp/aa2-course-1440-viewport-final.png` | 1440 × 1024 |
| Practice lab | `docs/design/concepts/edtech-v2/living-cartography-practice.png` | `/private/tmp/aa2-practice-1440-viewport-final.png` | 1440 × 1024 |
| Living Atlas | `docs/design/concepts/edtech-v2/living-cartography-atlas.png` | `/private/tmp/aa2-atlas-1440-viewport-final.png` | 1440 × 1024 |
| Mobile home | `docs/design/concepts/edtech-v2/living-cartography-mobile.png` | `/private/tmp/aa2-home-390-top-viewport-final.png`, `/private/tmp/aa2-home-390-map-viewport-final.png`, `/private/tmp/aa2-home-390-evidence-viewport-final.png`, `/private/tmp/aa2-home-390-paths-viewport-final.png` | 390 × 844 |

## Fidelity ledger

1. **Visual grammar — matched.** The final build uses the source direction’s white paper field, black editorial typography, cobalt-to-violet path, moss approval state, amber exception state, fine gray rules, and restrained contour texture.
2. **Learning-home hierarchy — matched.** The exact hero promise, two primary actions, Evidence → Prepare → Review → Approve journey, selected-step card, role paths, and Atlas continuation all survive in the final build.
3. **Course shell — matched in intent and quality.** The final course uses a persistent route rail, focused lesson canvas, three-part evidence arc, and private device-local progress surface. The full source-backed course continues below the initial learner canvas instead of being reduced to mock content.
4. **Practice workspace — matched in intent and quality.** The final lab exposes evidence, tie-out, exception, reviewer packet, and decision stages with a real synthetic discrepancy and a dedicated exception inspector. The full tutorial remains available below the interactive workspace.
5. **Atlas — matched.** The final graph preserves the source direction’s category colors, main governed-work spine, related controls/capabilities/sources, filter controls, map/list equivalence, and selected-node inspector.
6. **Interaction language — strengthened.** Visible state changes are explicit through `aria-pressed`, live response regions, selected tabs, active stages, and device-local lesson markers; no completion or certification state is invented.
7. **Mobile composition — matched after refinement.** The mobile sequence preserves the source concept’s editorial hero and vertical cartography while adapting the preview card and role paths to a true 390 px viewport.
8. **Accountability boundary — correctly scoped.** The site is visually expressive and interactive. Human approval remains a content and production-agent boundary, not a restriction on the site experience.

## Defects found and resolved

- Removed legacy shell clipping on the immersive course and practice canvases.
- Replaced the malformed social image and placeholder brand tile with production-ready raster assets.
- Restored pointer access to map nodes that were overlapped by the transparent hero copy layer.
- Separated the mobile CTA and Approve node.
- Separated the mobile Evidence node and workflow preview card, then reconnected all visible path segments.
- Added a semantic caption and explicit overflow wrapper to the practice tie-out table.
- Preserved a complete mobile documentation menu while allowing immersive learner routes to omit the desktop sidebar.
- Replaced obsolete README and old-homepage assertions with runtime contracts for the new learner experience.
- Split the Atlas graph into an on-demand map chunk and render a stable semantic list first on narrow screens.

No unresolved P0, P1, or P2 visual defects remain.

## Interaction evidence

- Homepage Evidence node becomes selected and exposes the stage 1 evidence preview.
- Role-based path selection changes the focused outcome and destination.
- Practice `Request evidence` returns a no-conclusion/no-posting boundary message.
- Practice `Prepare reviewer packet` confirms that a reviewer still decides the disposition.
- Atlas Map and List controls both become pressed and expose equivalent discovery paths.
- Mobile Explore exposes Learn, Practice, Atlas, Library, Start learning, and the complete documentation index.

## Acceptance evidence

- Production build: passed.
- Lint: passed.
- Clean-clone redesign release suite: 97 passed, 0 failed.
- Integrated working-tree suite, including concurrent additions: 102 passed, 0 failed.
- Desktop widths: all four primary surfaces render at 1440 CSS px with 1440 px document width.
- Mobile widths: home, course, practice, and Atlas render at 390 CSS px with 390 px document width.
- Mobile collision checks: CTA/Approve and Evidence/preview both report no overlap.
- Semantic checks: one H1 per page, table captions, keyboard-search shortcut, mobile navigation parity, local-image existence, and alt/decorative-image contracts all pass.

## Release boundary

The verified local preview is the release candidate. Production was not changed during this QA pass.

final result: passed
