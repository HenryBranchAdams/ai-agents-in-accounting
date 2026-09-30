# Family-office exclusion: bounded source-currency increment

Research observation date: 2026-09-30 UTC. Owner: authority_research. Selected-source investigation followed by a bounded supplemental review; no professional review, operational validation or full-text ingestion.

## Decision

A narrow metadata-and-original-summary supplemental review is supportable. It can supplement the historical 2011 source with the eCFR text displayed as current through **2026-09-25**, and explain the **2016 removal of expired transition provisions**. It cannot establish currency through September 30 or settle entity-specific adviser status. Preserve the existing historical source and the accepted research question; retain partial coverage and all other authority gaps.

The web fetch tool could not retrieve the eCFR section, but the supported in-app browser successfully displayed the government page and its publication-date banner. This is an observed source reading, not an inference from search snippets.

## Primary sources actually read

1. [eCFR, 17 CFR 275.202(a)(11)(G)-1, Family offices](https://www.ecfr.gov/current/title-17/chapter-II/part-275/section-275.202(a)(11)(G)-1). Selected locators: (a), (b)(1)-(3), (c), (d)(4)(i)-(xi), (d)(5)-(8), and source note. The banner displayed Title 17 up to date September 25, 2026, last amended September 16, 2026. Those are **title-level dates**, not the date this section changed. The section source note cites 76 FR 37994 (June 29, 2011), as amended at 81 FR 60457 (September 1, 2016). The displayed text ends with (d), with no (e).
2. [Federal Register, Form ADV and Investment Advisers Act Rules, 2016-20832](https://www.federalregister.gov/documents/2016/09/01/2016-20832/form-adv-and-investment-advisers-act-rules). Release IA-4509, 81 FR 60418, published September 1, 2016. Selected locators: section II.B.2.b, HTML `#h-35` / `#p-510`; section III.A / `#p-521`; amendatory instruction 2, `#p-amd-2`, printed page 60457. The instruction removes paragraph (e). Discussion explains expiration of its two transitions on December 31, 2013 and March 30, 2012. Effective date: October 31, 2016. This amendment did not rewrite the selected (b) conditions or (d)(4) definitions.
3. [Federal Register, Family Offices, 2011-16117](https://www.federalregister.gov/documents/2011/06/29/2011-16117/family-offices). Selected locators: effective date `#p-4`; II.A.4 Multifamily Offices `#h-20` / `#p-174`; original rule (b)(1)-(3), `#p-231` through `#p-233`. Effective August 29, 2011. The three conditions match the selected eCFR conditions read above. The multifamily discussion remains historical interpretive context, not a new September 2026 staff determination.
4. [SEC Family Offices rule landing page](https://www.sec.gov/rules-regulations/2011/06/family-offices). Confirms release IA-3220, SEC issue June 22, 2011, Federal Register publication June 29, 2011, effective August 29, 2011, 76 FR 37983. Page last reviewed/updated April 7, 2023; that site-maintenance date is not a new rule or current-law certification.
5. [eCFR legal status](https://www.ecfr.gov/reader-aids/government-policy-and-ofr-procedures/about-this-site#legal-status). eCFR describes its daily codification as authoritative but unofficial; annual CFR plus Federal Register documents are the official source. It directs legal researchers to check official CFR, daily Federal Register and LSA. This investigation did not complete that comprehensive legal-research reconciliation.

## Exact partial claim supported

Suggested original wording:

“The eCFR text observed September 30, 2026, displayed as current through September 25, retains the family-client restriction, family-client ownership and family-member/entity control conditions, and restriction on public holding out in paragraph (b). Definitions and exceptions require separate reading, including the involuntary-transfer provision, grandfathering and family-client categories. The 2016 amendment removed expired paragraph (e) transition provisions. This selected source check does not establish an office's eligibility, current GAAP, ownership or consolidation conclusions, or changes after the displayed currency date.”

Do not shorten this to “current law verified September 30” or “single-family office exempt.” A mere family relationship does not resolve the defined-client, control, entity or exception analysis. Avoid converting the original guide's multifamily caution into a categorical conclusion about any actual office.

## Safe implementation scope for integration owner

- Reuse `src_fo_ref_sec_family_rule`, the existing identity for this exact eCFR URL. Append batch `family-office-ecfr-2026-09-30` under `data.supplemental_reviews`. Preserve every prior field, including discovery annotations, null review date, discovery status and rights; also preserve the distinct historical 2011 source.
- Record observation date separately from publisher currency date and amendment effective date. The supplemental review has `substantive-excerpt` scope; it does not overwrite the source’s original discovery status or establish professional review.
- Store only URLs, locators, dates, original summary, provenance and limitations. Keep `full_text_stored: false` and unknown external reuse rights. The government-domain/legal-status page alone should not trigger broad rights or training-permission changes.
- Add a bounded editorial currency note linked to the reused source without changing the six accepted research questions or their answers. Explicitly identify this as supplemental evidence. Do not upgrade partial assessments or refresh unrelated source reviews. Check any editorial dependency hashes affected by additions.
- Structural/export tests should verify date distinctions, source routing, preservation and limitations. Such tests demonstrate corpus behavior, not legal validity or actual live agent efficacy.

## Remaining limits / stopping condition

The September 26-30 interval is unverified; no assertion of absence of later changes. No comprehensive current CFR/Federal Register/LSA audit, later interpretive releases, court decisions, exemptive orders, state adviser laws, or entity documents was undertaken. The narrow published-source claim is ready for independent review. A broader legal-currentness claim remains blocked by these missing checks and must not ship as established.

## Authored implementation and source-identity correction

The final source design appends one named supplemental review to `src_fo_ref_sec_family_rule`. The unreleased duplicate identity was removed after importer tests identified the exact URL collision. The existing source population stays at 917 records. Every historical field and source record is retained; only this named review is added. No importer identity guard is weakened. Observation date, displayed currency, title-level amendment date, selected locators, checks and limitations are nested in this review. External reuse rights remain unknown and full-text storage remains false.

## Canonical source linkage

The controller guide appends the reused source ID to its original source list, alongside the supplemental reading note and dependency receipt. Every prior source link remains in order, and all six original research-question objects and source lists remain unchanged. Control and close dependency receipts reflect that explicit guide relationship. Focused preservation tests remove only the named supplemental review or guide link before comparing historical fields. Source and guide retrieval tests use the supplemental-review path, and the browser check opens the native record-details disclosure before inspecting that evidence. No UI component change is required.
