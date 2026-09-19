# US manufacturing conversion source package

This is a source-only recovery package for AA-I101, pending coordinator integration. It preserves the existing IFRS manufacturing guide and its five named questions, and proposes an additive US application for privately held nongovernmental manufacturers using US GAAP with FIFO or weighted-average inventory. The packet does not pin a current corpus version, rebuild historical releases, modify canonical data, or claim whole-sector sufficiency.

The recovered baseline contains 23 associated records: the manufacturing guide, the 21 NAICS 2022 manufacturing subsector guides, and the existing management-accounting example. The linked questions are `rq-mfg-cost`, `rq-mfg-nrv`, `rq-mfg-outsourced`, `rq-mfg-longterm`, and `rq-mfg-completeness`. Reused foundations are inventory, cost allocation, revenue, project WIP, and data lineage. Roles are owner-manufacturer, toll processor, and customer. The principal period is the March 31, 2026 close, with a separate June 30, 2026 custom-contract branch.

## Source evidence

The packet records original publisher URLs, short locators, editions or effective periods, access and review limits, and unknown external rights. No publisher full text is stored.

- [FAS 151](https://storage.fasb.org/fas151.pdf), November 2004, paragraphs 2 and 5, PDF pages 5-7. It requires fixed production overhead allocation based on normal capacity, recognizes unallocated overhead as period expense, and treats abnormal idle facility expense and wasted material as current-period charges. It applies prospectively to inventory costs incurred in fiscal years beginning after June 15, 2005. This is historical pre-Codification evidence.
- [ASU 2015-11](https://storage.fasb.org/ASU_2015-11.pdf), July 2015, Topic 330 summary pages 1-3 and ASC 330-10-35-1A through 35-1C. FIFO and average-cost inventory within scope use lower of cost and net realizable value; LIFO and retail inventory remain separate. Public entity annual periods begin after December 15, 2016; other entity annual periods begin after December 15, 2016, with interim periods after December 15, 2017. The ASU itself states that the Codification is authoritative and the ASU communicates amendments.
- [ASU 2014-09 Section A](https://storage.fasb.org/ASU%202014-09_Section%20A.pdf), May 2014, ASC 606-10-25-27 through 25-30 and 606-10-55-7 through 55-15, including the consignment discussion at 55-79 through 55-80. Customer control, no alternative use, and an enforceable right to payment can support over-time recognition; otherwise point-in-time control remains a branch. Public and nonpublic effective periods and later amendments require entity-specific review.
- [2022 NAICS Manual](https://www.census.gov/naics/reference_files_tools/2022_NAICS_Manual.pdf), sectors 31-33 and subsectors 311-316, 321-327, and 331-339. It supports classification and exception routing only, not accounting treatment.
- [FASB Accounting Standards Codification](https://asc.fasb.org/), current access attempt on September 19, 2026. No paragraph text was obtained. No login, CAPTCHA, license, or access control was bypassed.

The existing accepted ASU 2015-11, ASU 2014-09, Codification-access boundary, and NAICS source records are referenced by stable ID when present. The packet adds only the absent FAS 151 source record. All source rights remain unknown, and public access is not treated as redistribution or training permission.

## Question and application scope

The five US application branches are additive to the original IFRS questions:

1. Normal-capacity fixed overhead, process mass balance, scrap, by-products, and abnormal loss.
2. FIFO or average-cost NRV measurement, with LIFO and retail exclusions.
3. Outsourced production, title and control, customer-owned inputs, processor accruals, and duplicate-cost prevention.
4. Custom goods, alternative use, enforceable payment rights, progress measurement, and loss uncertainty.
5. Population completeness, cutoff, late invoices, physical evidence, lot identity, and ledger tieout.

All five assessments are partial. Professional review is `not-performed`, empirical support is `not-established`, and source permissions remain unknown. The packet does not claim current consolidated ASC verification, a universal scrap or joint-product policy, entity contract conclusions, or 21-subsector sufficiency.

The 21 subsector dispositions remain explicit and partial. Food, beverage and tobacco, textile, apparel, leather, paper, chemical, plastics, glass, cement, metals, and other process industries route to yield, stage, joint-output, spoilage, quality-hold, or recoverability evidence. Printing, fabricated metals, machinery, electronics, electrical equipment, transportation equipment, furniture, and miscellaneous manufacturing route to job, customization, testing, customer-owned input, alternative-use, and contract-right evidence. Each disposition retains a concrete remaining gap rather than treating the generic manufacturing guide as sufficient.

## Connected synthetic evidence

The example is original synthetic material with lot and event IDs, balanced integer-cent journals, and negative branches:

- Process branch: 1,000 kg becomes 900 kg good output, 50 kg scrap, and 50 kg loss. The $17,600 incurred cost reconciles to $11,100 finished goods, $500 scrap, and $6,000 idle expense under the stated allocation assumptions.
- Abnormal-loss sensitivity: $11,600 production cost separates $10,520 good output, $500 scrap, and $580 abnormal loss.
- Discrete job: 100 units become 80 complete and 20 WIP. Equivalent conversion units are 88, with $14,727.27 finished conversion and $2,672.73 WIP conversion.
- Outsourced production: $6,000 components and $1,350 conversion produce $6,750 finished goods and $600 WIP; the March accrual clears once against the April invoice.
- Custom goods: $40,000 incurred cost over $80,000 estimated total cost gives 50% progress, $50,000 revenue, $30,000 billings, and a $20,000 contract asset only in the qualifying-rights branch. Redirectable goods without the other over-time criteria have zero pre-transfer revenue.
- FIFO or average-cost NRV sensitivity: $11,100 cost versus $9,900 NRV produces a separate $1,200 write-down.
- Cutoff: March-completed units remain inventory until April 2 under the stated shipment-control contract; missing confirmations remain evidence exceptions.

These figures are illustrative checks, not operating evidence or posting instructions.

## Additive application contract

`scripts/integrate-manufacturing-conversion.mjs` stages all seven target-file outputs before writing. It:

- adds the absent source and synthetic example only when their stable IDs and primary metadata are absent or identical;
- verifies every source check is either packaged or already present, and rejects source URL or stable-ID conflicts;
- enriches the existing manufacturing guide only through allowlisted additive fields, preserving its summary, review metadata, rights, original answers, and framework labels;
- adds US application pointers, partial assessments, mapping overrides, and retrieval fixtures only when absent or identical;
- preserves current catalog, corpus, registry, assessment, mapping, snapshot, release, and generated versions; and
- supports `--dry-run` and fails before any write when a conflict is found.

The source commit contains only this packet, helper, focused tests, and this receipt. The coordinator must regenerate mappings, snapshots, downloads, and releases in the newer integration checkout if those changes are accepted.

## Original completion criteria

- **Inventory and scope:** met for the selected population, roles, framework, periods, five questions, and 23-record baseline.
- **Original authorities:** met as a bounded package with exact locators and effective periods. Historical FAS 151, issued ASUs, classification material, and the failed current-Codification text access attempt are distinguished.
- **Workflow and worked material:** met through connected inputs, accounting routes, controls, balanced synthetic journals, and negative examples.
- **Assessments and limits:** met through five partial assessments and 21 reasoned partial subsector dispositions. Professional, empirical, rights, current-GAAP, contract, and operational limits remain explicit.
- **Verification and handoff:** focused tests and a temporary applied Git worktree are required evidence. Full source checks and applied checks remain separate. No deployment, merge, publication, release rebuild, or issue closure is performed here.
