# US transportation and warehousing source package

This source-only packet is pending coordinator integration. It proposes four records, six original US source records, five named questions, five partial assessments, role-specific mapping overrides, and a temporary application harness. It does not change canonical corpus files, catalog metadata, downloads, archive, or release state.

The selected population is United States freight carriers, passenger carriers, property brokers, and warehouse operators or custodians. The research route uses the existing US revenue, inventory, leases, payables, provisions, settlement, capital-asset, receivables, and control foundations by reference. The package does not assert that any whole NAICS 48 or 49 subsector is sufficient. The examples use a calendar 2026 close with January 2027 cutoff counterexamples.

## Baseline and role decision

The current mapping inventory has 12 associated records: the 11 NAICS profiles for 481, 482, 483, 484, 485, 486, 487, 488, 491, 492, and 493, plus the existing FERC accounting source mapped to 4861. Their linked families include revenue, leases, cash settlement, payables, inventory, provisions, capital assets, payroll, rate regulation, environmental matters, receivables, grants, and controls. The packet records this inventory without modifying those profiles.

The application separates a carrier that performs transportation, a broker that arranges transportation for compensation, and a warehouse or custodian that holds goods for hire. Freight and passenger routes are separate. Customer-owned goods remain a custody population until ownership and reporting treatment are independently established.

The framework is a selected US GAAP research route for nongovernmental operating entities. The package reuses the accepted FASB Codification landing record and existing accounting source records, but no current consolidated ASC text was read in this package. A source rule about freight billing, maintenance, leasing, or custody is not treated as an accounting recognition conclusion.

## Source review

The source records retain short locators, effective or edition periods, access limits, and unknown external rights. No publisher text is stored.

- [49 CFR Part 371, Brokers of Property](https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-371), read on 2026-09-19. Sections 371.1 through 371.3 support the broker definition and transaction fields, including consignor, carrier, bill or freight-bill number, compensation, freight collected, payment date, three-year retention, and review rights. Sections 371.7 and 371.13 support the carrier-representation boundary and segregated brokerage accounting. The eCFR page stated that Title 49 was current through 2026-09-17 and described itself as an unofficial editorial compilation.
- [49 CFR 377.203, Extension of Credit to Shippers](https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-377/subpart-B/section-377.203), read on 2026-09-19. Sections 377.203(a) through (d) provide freight-bill presentation and default credit timing, while 377.203(g) addresses collection charges and bill-of-lading conditions. This is payment evidence, not revenue guidance.
- [FMCSA Part 396 maintenance guidance](https://www.fmcsa.dot.gov/safety/passenger-safety/inspection-repair-and-maintenance-motor-carriers-passengers-part-396), read on 2026-09-19. The page summarizes 396.3, 396.7, 396.11, and 396.17, including vehicle-control, leased-vehicle identification, inspection, repair, and maintenance records. It was last updated in 2019, so current eCFR text and carrier applicability remain open.
- [49 CFR Part 376, Lease and Interchange of Vehicles](https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III/subchapter-B/part-376), reviewed on 2026-09-19 with intermittent access limits. The packet retains Part 376 sections 376.2 and 376.11 through 376.12 as the property-carrier route and retains FMCSA passenger lease history from [80 FR 30164](https://www.federalregister.gov/documents/2015/05/27/2015-12644/lease-and-interchange-of-vehicles-motor-carriers-of-passengers) and [84 FR 52194](https://www.federalregister.gov/documents/2019/10/01/2019-17342/lease-and-interchange-of-vehicles-motor-carriers-of-passengers). Current text and entity applicability remain open.
- [FMCSA Regulations and Enforcement](https://www.fmcsa.dot.gov/protect-your-move/resources/regulation-enforcement), read on 2026-09-19. The official index identifies Part 370 as the loss and damage claims and salvage route. The current Part 370 eCFR page was access-limited during review, so exact claim deadlines, valuation, and disposition are routed as an open review item rather than asserted.
- [Uniform Law Commission UCC overview and Article 7](https://www.uniformlaws.org/acts/ucc), read on 2026-09-19. The ULC summary identifies Article 7 as the 2003 revised model-law framework for documents of title, including warehouse receipts and bills of lading. Sections 7-102, 7-202, 7-204, 7-207, 7-209, and 7-403 are retained as locators. ULC expressly states that the UCC is not federal law, so state enactment, contract terms, liens, and custody claims require selected-state review.

External source rights remain unknown in each source record. The packet stores only metadata and short locators. Public access does not imply redistribution, training, or automated-reuse permission.

## Named question dispositions

| Question | Disposition | Material route and remaining boundary |
| --- | --- | --- |
| Carrier, broker, and warehouse role boundary | Partial supported answer | Part 371 and Article 7 provide role and custody evidence. Entity classification and state law remain open. |
| Freight and passenger cutoff with fuel surcharge | Partial supported answer | Event date, billing date, cash date, base rate, surcharge basis, and passenger trip date are retained. Contract-specific formulas and current accounting text remain open. |
| Carrier settlement and claims | Partial supported answer with explicit claim route | Broker compensation and carrier payment are kept separate. Part 370 text, carrier liability, insurance recovery, and current provisions application remain open. |
| Leased fleets and maintenance | Partial supported answer | Lease, control, responsibility, work order, inspection, and service period are required. Current Part 376 text and accounting classification remain open. |
| Customer-owned inventory and custody claims | Partial supported answer with state-law route | Article 7 supports custody, receipt, segregation, lien, and delivery evidence. State enactment, warehouse contract, and claims treatment remain open. |

Professional review is `not-performed` and empirical support is `not-established` for every assessment. The package supplies a route and evidence requirements where a complete current answer was unavailable; it does not substitute an unexplained omission for the requested topic.

## Connected synthetic example

The fixture connects the same event families through independent arithmetic:

- Freight base charge 240,000 cents with a 12% surcharge produces 28,800 cents of surcharge and a 268,800-cent invoice.
- A December 31 freight delivery with January 3 billing is retained as a cutoff candidate and is not auto-posted.
- A broker collection of 220,000 cents reconciles to a 176,000-cent carrier settlement and 44,000-cent broker fee.
- Twenty passenger tickets at 25,000 cents each produce 500,000 cents of cash received before the January 2 trip, giving a distinct service-date counterexample.
- A warehouse custodian holds 500 customer-owned units at 4,000 cents each, or 2,000,000 cents, while its owned-inventory population remains zero and storage billing is 120,000 cents.
- A 400,000-cent cargo damage notice remains under review and is not netted against the customer invoice or treated as a recovery.

The negative cases independently test role collapse, customer-custody misclassification, and a surcharge calculation error. Proposed entries are review artifacts only; no action executes.

## A1-A5 disposition and verification

- **A1, inventory and scope:** Complete in the source packet. The 12 baseline records and linked family inventory are retained, with four selected roles, US GAAP research scope, calendar 2026 period, and five named questions.
- **A2, original sources:** Complete as a bounded package. Six original US or model-law sources have locators, periods or editions, access limits, rights status, and source-specific limitations. Part 370 and current Part 376 text remain explicit gaps.
- **A3, workflow and worked material:** Complete for the selected route. The workflow, role and custody control, connected synthetic arithmetic, and negative examples are included.
- **A4, assessment and limits:** Complete as partial assessments. Professional review and empirical support remain unperformed and not established; state, contract, current consolidated accounting, claim, tax, insurance, and operational applicability remain open where relevant.
- **A5, checks and handoff:** Local packet tests and temporary-harness application checks pass. The helper stages all assertions before writes, refuses conflicting stable IDs or source URLs, preserves existing records, and supports idempotent replay. Repository-wide `npm run check` is run separately after the source files are complete. Downloads, archive, release, publication, merge, and deployment remain coordinator-owned and are not performed here.

The coordinator can apply `scripts/integrate-transport.mjs` from a newer checkout. It adds only packet records, question rows, assessments, and new mapping overrides. It does not change canonical profiles, shared coverage foundations, catalog version, snapshots, or release metadata.
