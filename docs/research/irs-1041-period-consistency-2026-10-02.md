# Form 1041 period consistency correction

The canonical `src_family_office_irs_1041_2025` record had two “Tax year 2025 only” descriptions that contradicted its October 1 applicability audit. Only `data.effective_period` and `data.source_review.effective_period` now repeat the existing ledger decision. Historical editions and intake evidence remain unchanged.

On October 2, 2026, Codex checked the official [2025 instructions PDF](https://www.irs.gov/pub/irs-prior/i1041--2025.pdf), revision March 5, 2026, pages 8–9, “Period Covered.” It supports calendar 2025 and fiscal years beginning in 2025 and ending in 2026. Short-year 2026 use requires a period beginning and ending in 2026, an unavailable 2026 form when filing is required, the 2026 year shown on the form, and applicable tax law changes incorporated. The ledger’s conditional qualifier remains necessary; there is no automatic transfer to an illustrative 2026 close.

This is a consistency correction against the existing audit, not a renewed substantive or professional review. Review dates, statuses, provenance, rights and unknown effective date bounds are preserved. No entity-independent complete date window is inferred.

The historical preservation fixture permits only these two exact prose replacements for this one ID, with the original prose asserted. All other fields remain subject to exact comparison. Regression checks cover JSON and Markdown research-pack qualifiers, preserved review/rights metadata, and continued exclusion from date-filtered retrieval for unknown effective bounds.
