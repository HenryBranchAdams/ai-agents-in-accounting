# Living Atlas design QA — historical baseline

Date: 2026-08-28
Result at capture: **passed**
Current status: **superseded by `docs/design/designcode-quality-direction.md`**

This file preserves evidence for the previous implementation. It is not a
design constraint on the current site shell, palette, layout, imagery, motion,
or interaction model.

## Visual truth and implementation evidence

| Surface | Visual truth | Implementation capture | Comparison | Viewport and normalization |
| --- | --- | --- | --- | --- |
| Desktop | `/Users/henryadams/.codex/generated_images/01a03a73-ac39-71f3-bc61-185d25d1783a/exec-ded72834-b47b-4af1-b4e5-c2c08aa5cc89.png` | `/private/tmp/accounting-atlas-desktop-final-1487x1058.jpg` | `/private/tmp/accounting-atlas-desktop-final-comparison.png` | Source 1487×1058 px; implementation 1487×1058 px; 1487×1058 CSS px at 1× density. |
| Portrait | `/Users/henryadams/.codex/generated_images/01a03a73-ac39-71f3-bc61-185d25d1783a/exec-5383729d-e4e6-4ee2-816e-9a5d73e2d262.png` | `/private/tmp/accounting-atlas-portrait-final-390x844.jpg` | `/private/tmp/accounting-atlas-portrait-final-comparison.png` | Source 853×1844 px normalized to 390×844; implementation 390×844 px; 390×844 CSS px at 1× density. |
| Compact landscape | `/Users/henryadams/.codex/generated_images/01a03a73-ac39-71f3-bc61-185d25d1783a/exec-2bb8bb73-2f5c-4cc4-9be6-4ba08dab43e7.png` | `/private/tmp/accounting-atlas-landscape-final-844x390.jpg` | `/private/tmp/accounting-atlas-landscape-final-comparison.png` | Source 1846×852 px normalized to 844×390; implementation 844×390 px; 844×390 CSS px at 1× density. |

The compared state is the General accounting lens, all time layers, Map view, with `Exception handling` selected at step 3 of the canonical four-step path.

## Comparison findings

The same-size, side-by-side comparisons establish the full-view layout at all three approved breakpoints. Focused crops were not needed for final acceptance because the remaining concerns were global relationships—map fit, inspector order, path centering, control placement, and first-viewport action visibility—and are legible at native comparison size. Earlier focused browser inspection was used while correcting node labels, the selected path, source metadata, and action cards.

- Desktop preserves the approved map-plus-persistent-inspector composition. The canonical four-step path replaces the illustrative seven-step concept, and all surrounding nodes are real repository records rather than mock content.
- Portrait keeps the selected path centered in a graph-first stage without horizontal overflow. The inspector follows the map below the first viewport, as required by the approved implementation contract.
- Compact landscape keeps the map and evidence inspector side by side. The selected path, primary source, and the first learning actions remain visible without drag-only navigation.
- Typography, spacing, borders, radii, shadows, and color tokens remain consistent with the existing Accounting Agents system. The generated contour image is quiet, correctly fitted, and does not carry meaning.
- Copy preserves sourced fact, implementation pattern, synthetic-example, and limitation distinctions. The four-step path and AS 1105 source replace illustrative mock records.
- Phosphor and React Flow supply icons and graph primitives. No placeholder image, fake icon, handcrafted SVG, CSS drawing, or benchmark/ranking content was introduced.
- Visible focus, semantic fallback content, 44×44 touch controls, reduced-motion behavior, and forced-color handling are retained.

Those differences document the compared implementation only. The maintained
records and four-step learning sequence remain factual inputs; the former site
shell and its visual treatment are not protected requirements.

## Comparison history

1. **Iteration 1 — development-runtime blocker:** the Vite development client rendered a blank hydrated map because `process` was undefined. QA moved to the repository's successful production build, where the map rendered and the console stayed clean. This is a development-runtime limitation, not a production-rendering defect.
2. **Iteration 2 — P2 responsive structure:** the desktop inspector did not remain persistently aligned with the map; portrait and landscape graph fitting was fragile; React Flow controls were undersized; and relationship labels were generic. The layout grid, responsive refit, 44×44 controls, and relationship names were corrected.
3. **Iteration 3 — P2 portrait and landscape composition:** the map and inspector stacked in the wrong order, the selected node could be tiny or offscreen, cluster labels overlapped, and learning actions fell outside the compact landscape view. Explicit grid placement, compact deterministic positions, post-filter refitting, label anchors, and compact source/action layout resolved the issues.
4. **Interaction correction:** the time slider's `onChange` handler did not update state in the built Vinext runtime. It now uses `onInput`; selecting Current developments updates both the URL and the visible layer description.
5. **Independent review correction:** map nodes accepted pointer selection but not Enter or Space, and a selected source node could fall back to AS 1105 in the source card. Map nodes are now native buttons with capture-level keyboard activation, and source nodes resolve their own metadata before related-source fallback. Built-browser checks confirmed Enter, Space, source ID, title, URL, and original-source link fidelity.

## Interaction and runtime checks

Verified in the built local application at `http://localhost:4191/atlas`:

- Map/List equivalence.
- Previous and next path navigation.
- Direct graph-node selection.
- Enter and Space activation for focused graph nodes.
- General, banking, healthcare, and manufacturing industry lenses.
- All, foundational archive, and current-development time layers.
- Guide and synthetic-case learning actions.
- Shareable `node`, `industry`, `time_layer`, and `view` URL state.
- WebMCP inventory and a harmless `accounting_agents.get_current_page` call.
- No warnings or errors in the production-page console.
- Selected source nodes preserve their own title, source ID, record link, and original-source link in the inspector.

This QA qualifies local rendering and interaction fidelity only. It does not establish hosted behavior, deployment, independent review, professional review, control effectiveness, learning efficacy, or production release.
