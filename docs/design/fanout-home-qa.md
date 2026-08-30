# Design QA — fan-out learning homepage historical baseline

Status: superseded by `designcode-quality-direction.md`.

This report records a previously accepted render. Its composition, shell,
palette, type scale, and responsive treatment are comparison evidence, not
requirements for subsequent design work.

## Comparison target

- Source visual truth: `/Users/henryadams/.codex/generated_images/01a03a73-ac39-71f3-bc61-185d25d1783a/exec-271f99fa-b5c8-4b25-83c8-6f85d68f0525.png`
- Rendered implementation: `http://localhost:4173/`
- Final desktop capture: `/private/tmp/accounting-agents-fanout-home-desktop-final-verify.png`
- Final mobile capture: `/private/tmp/accounting-agents-fanout-home-mobile-final-verify.png`
- Final combined comparison: `/private/tmp/accounting-agents-fanout-comparison-final.png`

## Normalization and state

- Source pixels: 1487 × 1058.
- Desktop implementation pixels and CSS viewport: 1440 × 1024.
- Mobile implementation pixels and CSS viewport: 390 × 844.
- The browser reported `devicePixelRatio: 2`; its screenshot service normalized each capture to one output pixel per requested CSS pixel.
- For the combined comparison, the source was normalized to 1440 × 1024 and placed beside the 1440 × 1024 implementation with a 16-pixel neutral divider. Both sides show the default role, general-accounting industry context, light theme, and homepage route.

## Full-view comparison evidence

The final combined comparison shows the same primary composition as the selected concept: a quiet four-part learning header, role and industry controls, four colored learning branches, the accountable-person rule at the center, two actions, a trust boundary, and a current-signal rail. The implementation keeps the project’s true source counts and actual current-development records instead of the illustrative titles and dates in the concept.

Five fidelity surfaces were checked:

- Fonts and typography: both use a restrained system sans-serif hierarchy. The implementation preserves the concept’s large but non-promotional heading, compact control labels, and readable small metadata without truncation.
- Spacing and layout rhythm: the hero, controls, fan-out map, trust line, and current signal retain the concept’s desktop ordering and proportions. At 390 pixels, the map becomes a deliberate single-column sequence with no horizontal overflow.
- Colors and tokens: true white, charcoal, muted gray, and restrained blue, orange, plum, and green accents match the concept while reusing the project’s existing green trust token.
- Image quality: the generated 1800 × 700 synthetic-ledger raster is sharp at its rendered size, has a true-white center, preserves the concept’s physical-ledger edges and colored paths, and contains no embedded UI copy or real accounting data.
- Copy and content: the hero and central rule match the selected concept’s meaning. Branch destinations, counts, trust metadata, and current-signal cards use canonical repository records; no efficacy, adoption, ranking, or execution-authority claim was added.

No separate focused crop was needed. At the original 2896 × 1024 combined resolution, the complete header, controls, icons, branch labels, central rule, actions, trust row, and current cards are readable in one input. The 390 × 844 mobile capture separately verifies the only materially different responsive state.

## Comparison history

1. First comparison: `/private/tmp/accounting-agents-fanout-comparison.png`.
   - P2: the heading was oversized, the selectors sat on a separate lower row, boxed branch cards felt heavier than the concept, and the current signal did not enter the first desktop viewport.
   - Fixes: reduced the hero scale, aligned selectors alongside the hero, removed generic card borders and shadows, added circular Phosphor icon treatments, tightened the map, and promoted the real current-signal rail.
   - Post-fix evidence: `/private/tmp/accounting-agents-fanout-comparison-2.png`.
2. Second comparison and compacting pass.
   - P2: the current-signal rail remained too low relative to the concept.
   - P1 caught during the fix: moving the fan-out upward temporarily allowed its white raster and live role sentence to collide with the hero copy.
   - Fixes: separated the raster from the hero, kept the role update available to assistive technology but visually removed the redundant desktop sentence, restored a stable map offset, and shortened the hero to the selected concept’s source-matching language.
   - Post-fix evidence: `/private/tmp/accounting-agents-fanout-comparison-final.png`; the hero and first branch no longer overlap, and all three real current-signal cards begin in the first desktop viewport.
3. Independent code and responsive review.
   - P2: corpus links overrode their native link semantics with `role="listitem"`; learning branches lacked headings; the map could clip between 761 and 900 pixels; the default General accounting label did not pass its filter; and two research links had the same visible label.
   - Fixes: used a semantic list with linked items, promoted branch titles to headings, added an explicit tablet map layout and compact header breakpoint, passed `industry=general`, and renamed the catalog action.
   - Post-fix evidence: the refreshed combined comparison above plus 761 × 900 browser metrics. No P0, P1, or P2 finding remains.

## Interaction, responsive, and accessibility evidence

- Role selection changed to “Risk, controls, and assurance” and exposed the canonical `/control-model` next step.
- Industry selection changed to “Banking and credit unions” and updated links to `/observatory?industry=banking-credit-unions` and `/resources?industry=banking-credit-unions`.
- Mobile navigation opened, retained the complete documentation navigation, and marked only Overview as current.
- Search opened its dialog and closed with Escape after the header rearrangement.
- At 390 × 844, document width equaled viewport width (390 pixels), the map resolved to one column, and controls/actions retained touch-sized targets.
- At 761 × 900, document width equaled viewport width (761 pixels); the map stayed fully inside its 689-pixel container as two 329.5-pixel columns with a 14-pixel gap.
- Desktop and mobile browser console checks returned no warnings or errors.
- Default General accounting links resolve to `/resources?industry=general` and `/observatory?industry=general`.
- The central rule, visible boundary copy, semantic list and headings, native selects, focus rules, reduced-motion behavior, and descriptive image alternative text remain present.

## Findings

- No actionable P0, P1, or P2 findings remain.
- Historical implementation note: that render used maintained source records
  with longer publisher titles, so its density differed from the illustrative
  concept.
- P3: some 10–11 pixel metadata is optically smaller than the concept at 1440 pixels. It remains legible and is consistent with the existing knowledge-hub shell.

## Verification boundary

This report covers the local rendered homepage and its primary responsive interactions. It does not qualify a hosted build, publication, production deployment, third-party review, subject-matter review, or independent accessibility audit.

final result: passed
