# US information source package, 2026-09-19

This document describes a source-only candidate for the Information industry research gap. It is pending coordinator integration. It does not change the canonical corpus, catalog, release, snapshot, or public deployment, and it does not claim whole-sector sufficiency.

## Baseline and selected scope

The current mapping inventory contains seven distinct NAICS 51 associated records:

- Motion Picture and Sound Recording Industries, NAICS 512
- Publishing Industries, NAICS 513
- Broadcasting and Content Providers, NAICS 516
- Telecommunications, NAICS 517
- Computing Infrastructure Providers, Data Processing, Web Hosting, and Related Services, NAICS 518
- Web Search Portals, Libraries, Archives, and Other Information Services, NAICS 519
- The existing software publishers, hosted subscriptions and customer implementation guide

The existing mappings point to shared families for revenue, licensed content, cost allocation, data lineage, interfaces, security, deployment evidence, reuse rights, software and leases. Their association counts and editorial profiles are discovery context, not adequacy findings. Existing records and their primary review metadata remain preserved. The package reuses the existing NAICS manual, Topic 606 revenue, principal-versus-agent, and cloud implementation sources by stable ID.

The selected application covers a United States accrual-basis US GAAP provider or customer for a synthetic 2026-12-31 close. It distinguishes a software or subscription provider, telecom carrier or noncarrier connectivity provider, publisher or media producer, hosting or data-processing provider, information service or data licensor, and a customer purchasing software, hosting or content access. FCC Part 32 is used only when specified carrier applicability is established. Copyright law is legal context for duration and does not grant a license or establish accounting treatment. There is no state-by-state survey, international expansion, complete leaf review, current consolidated ASC claim, professional sign-off, operational population, or measured agent-performance evidence.

## Source evidence and limits

The package adds three original US authority records. Only short original summaries and locators are stored.

| Source | Locator and effective-period note | Application and limit |
| --- | --- | --- |
| [FASB ASU 2016-10](https://storage.fasb.org/ASU%202016-10.pdf) | 606-10-25-19 through 25-22 and 606-10-55-56 through 55-64; issued April 2016. Public entities apply the linked Topic 606 amendments for annual periods beginning after December 15, 2017; other entities after December 15, 2018, with interim timing in 606-10-65-1. | Supports separate performance-obligation and license research. The ASU is an amendment, not the current consolidated Codification. Later amendments, entity adoption and contract facts remain open. |
| [47 CFR Part 32, eCFR](https://www.ecfr.gov/current/title-47/chapter-I/subchapter-B/part-32) | §§ 32.11, 32.14, 32.2000 and the revenue-account subpart. Current eCFR edition reviewed September 19, 2026. | Defines a narrower federal telecommunications accounting and regulated/nonregulated boundary for specified carriers. It is not a universal US GAAP answer and does not apply to every NAICS 51 company. |
| [17 USC Chapter 3](https://uscode.house.gov/view.xhtml?path=/prelim@title17/chapter3) | §§ 302(a)-(c), 304(a), and 305. Preliminary 2026 U.S. Code text displayed September 18, 2026. | Supplies statutory duration context. The signed grant, territory, media, term, renewal, termination and ownership evidence still govern the selected rights question. The statute is not an accounting standard and does not grant corpus reuse permission. |

Record-level rights remain unknown. `full_text_stored` is false for each source. FASB, eCFR and U.S. Code publisher terms were not converted into a training, redistribution or adaptation grant.

## Named questions and application

The packet adds six bounded question rows and partial assessments:

1. Subscription, usage and setup revenue: contract, meter, invoice, deferred balance and cutoff evidence remain separate.
2. Bundle and customer expenditure separation: provider revenue, reseller presentation and the customer's software or implementation cost are different populations.
3. Content, production and software implementation costs: production, acquired or licensed content, internal-use software and hosted-service implementation work stay separately identified pending the selected framework gate.
4. Royalties and rights periods: a rights register connects work identity, grant scope, term, royalty base, usage and payment; statutory duration does not replace the contract.
5. Sector role routing: telecom, publishing, media, hosting and data services use activity and regulated-role evidence before selecting a question route.
6. Retrieval and lineage: representative search and get fixtures are capped at 20 results and route role-specific queries to the relevant source family.

The connected synthetic example uses these independent calculations:

- $120,000 collected for a 12-month subscription gives $10,000 per month and $30,000 for October through December. Treating all cash as 2026 revenue overstates the synthetic period by $90,000.
- 4,000 usage units at $2.50 gives $10,000.
- A $180,000 bundle with standalone prices of $120,000 hosting, $90,000 content, and $30,000 implementation allocates $90,000, $67,500, and $22,500 using relative prices totaling $240,000.
- A 5% royalty on 10,000 licensed uses gives $500. Missing usage evidence is an exception, not proof of zero usage.
- The customer’s $30,000 internal-use software implementation population remains separate from provider bundle revenue. A hosting provider’s use of a telecom carrier does not by itself make the hosting provider a Part 32 carrier.

Proposed entries are synthetic review proposals. They are not posting authority. Negative and scope counterexamples cover all-cash subscription cutoff, missing royalty usage, wrong netting of customer cost against provider revenue, noncarrier hosting, customer software expenditure, and distribution after rights expiry.

## Integration contract and verification

`scripts/integrate-information.mjs` reads the package and stages additions to source, guide, example, workflow, control, research-question, assessment, and mapping files. It performs all source URL, stable-ID, record, question, assessment and mapping conflict checks before writing. It preserves existing records and source primary metadata, refuses a different stable ID for an existing source URL, is replay-safe, and does not write `data/catalog.json`, snapshots, releases or a corpus version.

The source tests use disposable temporary harnesses. They validate record and assessment schemas, all seven baseline records, question dimensions, unknown rights, synthetic arithmetic, retrieval limits, additive application, catalog-version preservation, byte-stable replay, and a conflict injected before any target write.

## Remaining gaps

Current consolidated ASC text and later amendments were not read. The package therefore does not make a current consolidated ASC 606, ASC 350-40, or industry-specific production-cost conclusion. Film and publishing cost guidance was not exhaustively researched. No actual contract portfolio, content-rights register, usage system, customer ledger, royalty statement, carrier designation, regulatory filing, or production control was reviewed. Legal review of rights ownership, termination, infringement, statutory exceptions, and source reuse remains open. No whole-sector or state/international completeness claim is made.

Publication-month correction: the official ASU 2016-10 cover states April 2016. The later integration corrects that month in the source, linked question copies and source package, with an explicit before/after record. The ASU 2016-08 March date and all frozen historical editions remain unchanged.
