# Accounting coverage topology worklist

This is the human-readable companion to the [research report](accounting-coverage-topology-2026-09-11.md) and [machine-readable map](accounting-coverage-topology-2026-09-11.json).

It inventories all 96 subsectors and 1,012 detailed industries in NAICS United States 2022. The 62 question families and 30 business-model archetypes are original screening proposals. All subsectors remain unassessed for applicability, detailed-industry exceptions and evidence sufficiency.

Source for codes, titles and hierarchy: [U.S. Census Bureau, 2022 NAICS Structure](https://www.census.gov/naics/2022NAICS/2022_NAICS_Structure.xlsx). Titles omit the publisher's T footnote marker; the JSON retains the marker separately. Questions below are editorial research prompts, not statements of accounting requirements.

## Industry screening

### 11 — Agriculture, Forestry, Fishing and Hunting

| Subsector | Detailed industries | Questions to investigate |
|---|---:|---|
| 111 Crop Production | 30 | Which crop stages, harvest rights, seasonal costs, insurance proceeds and cooperative arrangements need separate treatment? |
| 112 Animal Production and Aquaculture | 19 | How do breeding stock, production animals, aquaculture cycles, feed costs and mortality create distinct questions? |
| 113 Forestry and Logging | 3 | Which timber ownership, growth, harvest, depletion and restoration facts change the accounting? |
| 114 Fishing, Hunting and Trapping | 4 | How do catch rights, quotas, vessel costs, inventory perishability and resource restrictions affect the research profile? |
| 115 Support Activities for Agriculture and Forestry | 8 | Does the entity own production or provide services, and how are seasonal contracts and shared costs evidenced? |

Existing navigation seeds: `wf-assets-inventory-valuation`, `wf-tax-returns`. Their applicability and depth must be assessed separately.

### 21 — Mining, Quarrying, and Oil and Gas Extraction

| Subsector | Detailed industries | Questions to investigate |
|---|---:|---|
| 211 Oil and Gas Extraction | 2 | Which exploration, development, production, reserve, royalty and retirement questions differ by ownership and framework? |
| 212 Mining (except Oil and Gas) | 14 | Which mineral rights, development stages, stripping costs, stockpiles and closure obligations require distinct evidence? |
| 213 Support Activities for Mining | 5 | How do drilling and support-service contracts differ from ownership of the underlying resource? |

Existing navigation seeds: `wf-assets-impairment`, `wf-technical-estimates-valuations`. Their applicability and depth must be assessed separately.

### 22 — Utilities

| Subsector | Detailed industries | Questions to investigate |
|---|---:|---|
| 221 Utilities | 14 | Which operations are rate regulated, and how do tariff revenue, fuel adjustments, infrastructure and regulatory accounts reconcile? |

Existing navigation seeds: `src_fercacct`, `wf-assets-fixed-assets`. Their applicability and depth must be assessed separately.

### 23 — Construction

| Subsector | Detailed industries | Questions to investigate |
|---|---:|---|
| 236 Construction of Buildings | 6 | Is the business a contractor, developer or owner-builder, and which residential or commercial contract facts change the profile? |
| 237 Heavy and Civil Engineering Construction | 6 | Which infrastructure, concession, public-procurement, joint-venture and long-duration contract branches apply? |
| 238 Specialty Trade Contractors | 19 | How do trade subcontracts, service work, installation, retainage and labor evidence change the project accounting questions? |

Existing navigation seeds: `guide-construction-coverage`, `wf-construction-wip-close`, `wf-construction-job-cost-estimates`. Their applicability and depth must be assessed separately.

### 31-33 — Manufacturing

| Subsector | Detailed industries | Questions to investigate |
|---|---:|---|
| 311 Food Manufacturing | 43 | Which perishability, yields, joint products, commodity inputs and recall obligations need distinct evidence? |
| 312 Beverage and Tobacco Product Manufacturing | 7 | Which excise duties, aging inventory, distribution rights and regulatory obligations alter the usual production profile? |
| 313 Textile Mills | 7 | How do fibers, work in process, waste, energy and production stages determine cost objects? |
| 314 Textile Product Mills | 5 | Which made-to-order products, material yields, freight and customer specifications create accounting differences? |
| 315 Apparel Manufacturing | 4 | How do outsourced production, sourcing, returns, markdowns and seasonal obsolescence affect the inventory population? |
| 316 Leather and Allied Product Manufacturing | 3 | Which materials, production stages, sourcing and obsolescence facts require separate review? |
| 321 Wood Product Manufacturing | 13 | Where do forest-resource ownership and purchased-material conversion create different inventory and cost questions? |
| 322 Paper Manufacturing | 10 | Which continuous-process costs, recycled inputs, environmental duties and byproducts need separate treatment? |
| 323 Printing and Related Support Activities | 4 | How do customer-specific jobs, setup costs, printing services and unused materials reconcile? |
| 324 Petroleum and Coal Products Manufacturing | 5 | How do refinery yields, joint products, commodity contracts and environmental obligations interact? |
| 325 Chemical Manufacturing | 30 | Which chemical or pharmaceutical branches introduce research, licensing, regulatory milestones, inventory or remediation differences? |
| 326 Plastics and Rubber Products Manufacturing | 16 | Which molds, tooling, scrap, production variance and customer-owned materials need explicit evidence? |
| 327 Nonmetallic Mineral Product Manufacturing | 18 | Which quarry inputs, process yields, emissions, plant costs and freight terms change the cost profile? |
| 331 Primary Metal Manufacturing | 18 | How do metal inventories, tolling, scrap recovery, energy costs and commodity hedges relate? |
| 332 Fabricated Metal Product Manufacturing | 36 | Which fabricated-to-order contracts, tooling, job costs and warranties require a project branch? |
| 333 Machinery Manufacturing | 35 | When do equipment, installation, customization, service commitments and acceptance terms need separate analysis? |
| 334 Computer and Electronic Product Manufacturing | 23 | Which semiconductor or device activities introduce foundry, IP, software, obsolescence and warranty questions? |
| 335 Electrical Equipment, Appliance, and Component Manufacturing | 16 | Which component bundles, supply constraints, rebates, warranties and installed-product obligations matter? |
| 336 Transportation Equipment Manufacturing | 26 | Which automotive, aerospace, shipbuilding or defense activities change program costs, contracts, warranties and public-procurement duties? |
| 337 Furniture and Related Product Manufacturing | 11 | How do custom orders, deposits, installation, freight and inventory obsolescence affect the profile? |
| 339 Miscellaneous Manufacturing | 16 | Which heterogeneous product branches need separate review for regulated devices, IP, tooling and product liability? |

Existing navigation seeds: `wf-assets-inventory-valuation`, `wf-assets-cogs`, `src_rivianagents`. Their applicability and depth must be assessed separately.

### 42 — Wholesale Trade

| Subsector | Detailed industries | Questions to investigate |
|---|---:|---|
| 423 Merchant Wholesalers, Durable Goods | 37 | Which title terms, rebates, returns, inventory financing and consignment arrangements differ across durable-goods trades? |
| 424 Merchant Wholesalers, Nondurable Goods | 31 | Which perishability, commodity pricing, excise duties and pharmaceutical distribution arrangements add distinct questions? |
| 425 Wholesale Trade Agents and Brokers | 1 | Who owns the goods and customer relationship, and how are commissions and third-party settlements evidenced? |

Existing navigation seeds: `wf-assets-inventory-movement`, `wf-o2c-revenue-recognition`. Their applicability and depth must be assessed separately.

### 44-45 — Retail Trade

| Subsector | Detailed industries | Questions to investigate |
|---|---:|---|
| 441 Motor Vehicle and Parts Dealers | 7 | Which vehicle inventory, floorplan financing, trade-ins, rebates, service and finance commissions need separate review? |
| 444 Building Material and Garden Equipment and Supplies Dealers | 6 | How do delivery, installation, contractor sales, seasonal stock and customer deposits change the retail profile? |
| 445 Food and Beverage Retailers | 10 | Which spoilage, coupons, supplier allowances, shrinkage and payment programs need distinct evidence? |
| 449 Furniture, Home Furnishings, Electronics, and Appliance Retailers | 5 | How do delivery, installation, extended warranties, financing offers and returns affect the customer arrangement? |
| 455 General Merchandise Retailers | 3 | Which own-inventory and marketplace transactions, memberships, rebates and multichannel returns must be separated? |
| 456 Health and Personal Care Retailers | 5 | Which pharmacy reimbursement, regulated products, inventory and concession arrangements change the retail questions? |
| 457 Gasoline Stations and Fuel Dealers | 3 | Who owns fuel, and how do excise taxes, consignment, environmental exposure and payment settlements reconcile? |
| 458 Clothing, Clothing Accessories, Shoe, and Jewelry Retailers | 4 | How do fashion cycles, markdowns, online returns, imports and supplier arrangements affect margin evidence? |
| 459 Sporting Goods, Hobby, Musical Instrument, Book, and Miscellaneous Retailers | 14 | Which product, consignment, collectible, gift-card or seasonal branches require review below the broad retail grouping? |

Existing navigation seeds: `src_irsretail`, `wf-assets-inventory-valuation`. Their applicability and depth must be assessed separately.

### 48-49 — Transportation and Warehousing

| Subsector | Detailed industries | Questions to investigate |
|---|---:|---|
| 481 Air Transportation | 5 | How do ticket obligations, loyalty programs, leased aircraft, maintenance reserves and cargo services differ? |
| 482 Rail Transportation | 2 | Which track rights, rolling stock, freight interchange, infrastructure and regulated accounts matter? |
| 483 Water Transportation | 6 | Which voyage, charter, port, fuel, maintenance and vessel-rights facts establish the accounting profile? |
| 484 Truck Transportation | 6 | How do carrier and broker roles, fuel surcharges, owner-operators, equipment and freight cutoff differ? |
| 485 Transit and Ground Passenger Transportation | 11 | Which fare, subsidy, concession, fleet and public-ownership arrangements need different framework branches? |
| 486 Pipeline Transportation | 4 | Which throughput, tariff, line-fill, customer-product and restoration facts affect the accounts? |
| 487 Scenic and Sightseeing Transportation | 3 | How do advance bookings, cancellations, seasonal assets and packaged experiences affect the service obligation? |
| 488 Support Activities for Transportation | 13 | Which forwarding, port, terminal, support and customs-agency roles change ownership and settlement questions? |
| 491 Postal Service | 1 | Which postal obligations, prepaid services, public reporting basis and network costs require separate scope decisions? |
| 492 Couriers and Messengers | 2 | How do delivery evidence, subcontractors, surcharges, loss claims and shipment cutoff reconcile? |
| 493 Warehousing and Storage | 4 | Whose goods are stored, and how do storage periods, warehouse rights, liens and handling services differ? |

Existing navigation seeds: `wf-assets-leases`, `wf-o2c-revenue-recognition`. Their applicability and depth must be assessed separately.

### 51 — Information

| Subsector | Detailed industries | Questions to investigate |
|---|---:|---|
| 512 Motion Picture and Sound Recording Industries | 10 | Which production costs, distribution rights, royalties, participations and ultimate revenue estimates require separate evidence? |
| 513 Publishing Industries | 7 | Which book, periodical and software-publishing activities differ in licensing, subscriptions, returns and development expenditure? |
| 516 Broadcasting and Content Providers | 3 | How do advertising, subscriptions, content rights, distribution and creator settlements change the revenue profile? |
| 517 Telecommunications | 6 | Which device-service bundles, usage, installation, spectrum rights and network costs require separate questions? |
| 518 Computing Infrastructure Providers, Data Processing, Web Hosting, and Related Services | 1 | How do cloud commitments, consumption billing, implementation, data-center assets and software rights differ by provider role? |
| 519 Web Search Portals, Libraries, Archives, and Other Information Services | 2 | Which advertising, access, licensing, archival and publicly supported activities require distinct models? |

Existing navigation seeds: `wf-o2c-revenue-recognition`, `src_asu201815`, `src_focusv14`. Their applicability and depth must be assessed separately.

### 52 — Finance and Insurance

| Subsector | Detailed industries | Questions to investigate |
|---|---:|---|
| 521 Monetary Authorities-Central Bank | 1 | Which central-bank accounting basis, monetary instruments, reserves and public remittances require a distinct authority map? |
| 522 Credit Intermediation and Related Activities | 11 | Which bank, credit-union, nonbank lender, processor and servicing branches differ in assets, liabilities and supervision? |
| 523 Securities, Commodity Contracts, and Other Financial Investments and Related Activities | 7 | Which broker, exchange, dealer and adviser roles differ in client assets, principal positions, fees and reporting obligations? |
| 524 Insurance Carriers and Related Activities | 10 | Which insurers, reinsurers, agencies and benefits administrators need separate risk-bearing and commission models? |
| 525 Funds, Trusts, and Other Financial Vehicles | 6 | Which funds, trusts, pensions and special vehicles differ in reporting entity, investments, allocations and investor rights? |

Existing navigation seeds: `src_occ_baas_2026`, `src_ifrs17impl`, `src_naic_sap_hierarchy_2026`. Their applicability and depth must be assessed separately.

### 53 — Real Estate and Rental and Leasing

| Subsector | Detailed industries | Questions to investigate |
|---|---:|---|
| 531 Real Estate | 9 | How do property ownership, development, leasing, management and brokerage roles create different questions? |
| 532 Rental and Leasing Services | 14 | Which asset class, contract duration, maintenance, residual exposure and purchase options change the rental analysis? |
| 533 Lessors of Nonfinancial Intangible Assets (except Copyrighted Works) | 1 | Which nonfinancial intangible rights, franchises, territories, royalties and minimum guarantees are involved? |

Existing navigation seeds: `wf-assets-leases`, `wf-r2r-consolidation`, `wf-assets-impairment`. Their applicability and depth must be assessed separately.

### 54 — Professional, Scientific, and Technical Services

| Subsector | Detailed industries | Questions to investigate |
|---|---:|---|
| 541 Professional, Scientific, and Technical Services | 49 | Which legal, accounting, engineering, consulting, research, design and technical-service branches differ in retainers, IP, milestones and professional duties? |

Existing navigation seeds: `wf-o2c-customer-contract-intake`, `wf-o2c-revenue-recognition`. Their applicability and depth must be assessed separately.

### 55 — Management of Companies and Enterprises

| Subsector | Detailed industries | Questions to investigate |
|---|---:|---|
| 551 Management of Companies and Enterprises | 3 | Which holding, management, financing and operating roles determine consolidation, investments and related-party flows? |

Existing navigation seeds: `wf-r2r-consolidation`, `wf-r2r-intercompany`. Their applicability and depth must be assessed separately.

### 56 — Administrative and Support and Waste Management and Remediation Services

| Subsector | Detailed industries | Questions to investigate |
|---|---:|---|
| 561 Administrative and Support Services | 33 | Which staffing, travel, collection, security or support roles change worker, customer-fund and gross-versus-net questions? |
| 562 Waste Management and Remediation Services | 11 | Which collection, disposal, recycling and remediation businesses differ in closure costs, permits, commodity output and claims? |

Existing navigation seeds: `wf-o2c-revenue-recognition`, `wf-technical-estimates-valuations`. Their applicability and depth must be assessed separately.

### 61 — Educational Services

| Subsector | Detailed industries | Questions to investigate |
|---|---:|---|
| 611 Educational Services | 17 | Which tuition, student aid, research grants, endowments and public or private ownership facts require distinct reporting profiles? |

Existing navigation seeds: `src_cfr200grants`, `src_irs_form990_2025`. Their applicability and depth must be assessed separately.

### 62 — Health Care and Social Assistance

| Subsector | Detailed industries | Questions to investigate |
|---|---:|---|
| 621 Ambulatory Health Care Services | 21 | Which practitioner, laboratory, outpatient and home-care branches differ in claims, payer contracts, ownership and compensation? |
| 622 Hospitals | 3 | Which hospital payer mix, cost reports, settlements, restrictions and ownership basis need separate evidence? |
| 623 Nursing and Residential Care Facilities | 6 | Which resident arrangements, occupancy, care services, third-party payments and property roles change the profile? |
| 624 Social Assistance | 9 | Which benefit programs, grants, eligibility evidence, childcare arrangements and restricted resources matter? |

Existing navigation seeds: `src_cms255210_transmittal25_2026`, `src_cms_hcris_cost_reports_2026`. Their applicability and depth must be assessed separately.

### 71 — Arts, Entertainment, and Recreation

| Subsector | Detailed industries | Questions to investigate |
|---|---:|---|
| 711 Performing Arts, Spectator Sports, and Related Industries | 11 | Which admissions, sponsorships, media rights, participant compensation and advance receipts require separate questions? |
| 712 Museums, Historical Sites, and Similar Institutions | 4 | Which collections, conservation duties, donations, admissions and ownership forms change the accounting basis and asset questions? |
| 713 Amusement, Gambling, and Recreation Industries | 10 | Which gaming, amusement, membership, prize and participant-fund branches require separate obligations and control evidence? |

Existing navigation seeds: `wf-o2c-revenue-recognition`, `src_irs_form990_2025`. Their applicability and depth must be assessed separately.

### 72 — Accommodation and Food Services

| Subsector | Detailed industries | Questions to investigate |
|---|---:|---|
| 721 Accommodation | 7 | Which owner, operator, manager, franchise and reservation roles change revenue, leases and property accounting? |
| 722 Food Services and Drinking Places | 8 | How do tips, delivery platforms, franchises, gift cards, food waste and labor obligations reconcile? |

Existing navigation seeds: `wf-o2c-revenue-recognition`, `wf-assets-inventory-valuation`. Their applicability and depth must be assessed separately.

### 81 — Other Services (except Public Administration)

| Subsector | Detailed industries | Questions to investigate |
|---|---:|---|
| 811 Repair and Maintenance | 14 | Which repair labor, parts, customer property, warranties and service contracts require distinct populations? |
| 812 Personal and Laundry Services | 16 | Which deposits, prepaid services, tips, labor arrangements and specialized personal-service obligations apply? |
| 813 Religious, Grantmaking, Civic, Professional, and Similar Organizations | 13 | Which religious, grantmaking, civic, labor and professional organizations differ in dues, contributions, investments and tax status? |
| 814 Private Households | 1 | Which household employer, personal tax and business-boundary questions fall inside the corpus's declared scope? |

Existing navigation seeds: `src_irs_form990_2025`, `wf-o2c-revenue-recognition`. Their applicability and depth must be assessed separately.

### 92 — Public Administration

| Subsector | Detailed industries | Questions to investigate |
|---|---:|---|
| 921 Executive, Legislative, and Other General Government Support | 6 | Which government level, reporting entity, taxes, appropriations and fund structures govern the reporting? |
| 922 Justice, Public Order, and Safety Activities | 7 | Which court, correction, safety, forfeiture, custodial and grant funds require distinct accountability? |
| 923 Administration of Human Resource Programs | 4 | Which administered benefit, education, labor and social programs differ from the entities actually delivering services? |
| 924 Administration of Environmental Quality Programs | 2 | Which regulatory, resource-management, grant and environmental obligations belong to the administering entity? |
| 925 Administration of Housing Programs, Urban Planning, and Community Development | 2 | Which housing, community-development, lending, grant and property arrangements require separate reporting questions? |
| 926 Administration of Economic Programs | 5 | Which economic regulation, permits, transport administration, fees and transfers need distinct populations? |
| 927 Space Research and Technology | 1 | Which space-program contracts, research, capital assets, grants and agency reporting requirements apply? |
| 928 National Security and International Affairs | 2 | Which defense, international assistance, procurement, foreign-currency and stewardship obligations require dedicated authority routes? |

Existing navigation seeds: `src_gasb0096`, `src_fasab_sffas54_leases`, `src_ipsas47_revenue`. Their applicability and depth must be assessed separately.

## Accounting and agent question families

Every subsector is to be screened against the full question-family list. Archetypes suggest places to begin; they do not exclude other families.

### Reporting foundations

| Family | Screening question |
|---|---|
| Reporting basis and accounting policies (`q-reporting-basis`) | Which reporting entity, accounting basis, policy elections and effective requirements govern the question? |
| Ledger, journals and period close (`q-ledger-close`) | How do journals, accruals, reversals, cutoff and reconciliations produce a complete period ledger? |
| Estimates and uncertainty (`q-estimates`) | Which assumptions, specialists, revisions, bias indicators and sensitivities support estimates? |
| Statements, disclosures and digital filing (`q-presentation`) | How are ledger balances classified, consolidated into statements, disclosed and tied to filing concepts? |
| Foreign currency and foreign operations (`q-foreign-currency`) | Which functional currencies, exchange rates, remeasurement and translation facts matter? |
| Accounting changes, adoption and errors (`q-policy-changes-errors`) | Which transition cohorts, comparative periods and correction requirements apply? |
| Subsequent events and going concern (`q-events-going-concern`) | What subsequent evidence, funding uncertainty and reporting-date boundaries require consideration? |
| Reporting perimeter and consolidation (`q-consolidation`) | Which entities, interests, control relationships, eliminations and noncontrolling interests belong in the reporting perimeter? |

### Operating transactions

| Family | Screening question |
|---|---|
| Revenue and customer contracts (`q-revenue`) | What is promised, who is the customer, and how do performance, pricing, changes, returns and principal-agent roles affect the analysis? |
| Contract costs, project WIP and estimates to complete (`q-project-wip`) | How do contract terms, progress evidence, cost forecasts, changes, billing and losses reconcile for each project? |
| Purchasing, payables and expenses (`q-purchasing-payables`) | How are supplier obligations, receipts, expenses, credits and unrecorded liabilities identified and reconciled? |
| Receivables, collection and credit losses (`q-receivables-credit`) | Which rights to payment, collection populations, concessions and expected losses are supported? |
| Cash, payments and settlement (`q-cash-settlement`) | How do bank, processor, payment-network and ledger records reconcile across timing and ownership differences? |
| Inventory, conversion costs and cost of sales (`q-inventory`) | Which quantities, ownership, cost layers, overhead allocations, spoilage and obsolescence affect inventory and margin? |

### Assets and workforce

| Family | Screening question |
|---|---|
| Capital assets and construction in progress (`q-capital-assets`) | Which expenditures create owner assets, when are assets ready for use, and how are depreciation, retirements and disposals supported? |
| Lessee and lessor arrangements (`q-leases`) | Which contracts convey asset-use rights, and how do options, modifications, embedded leases and party roles matter? |
| Intangibles, software and research expenditure (`q-intangibles-software`) | What is being developed or acquired, who owns it, and which project stages, rights and costs require separate analysis? |
| Payroll, labor costing and worker obligations (`q-payroll`) | How do worker status, time, compensation, deductions, payroll taxes and work locations reconcile? |
| Employee benefits and retirement arrangements (`q-benefits`) | Which benefit promises, plan assets, funding duties and actuarial assumptions require accounting and reporting? |

### Capital and financing

| Family | Screening question |
|---|---|
| Debt, financing costs and covenants (`q-debt`) | What borrowing terms, modifications, extinguishments, collateral and covenant definitions govern the financing? |
| Equity and complex capital instruments (`q-equity`) | What ownership, redemption, conversion and distribution rights are attached to each instrument? |
| Share-based compensation (`q-share-compensation`) | Which awards, vesting conditions, modifications, settlement choices and valuation inputs affect compensation? |
| Investments and financial assets (`q-investments`) | Which instruments, business purposes, measurement bases, impairment models and disposal events matter? |
| Derivatives and hedging (`q-derivatives`) | Which contracts, embedded terms, risk exposures and designation evidence require derivative or hedge analysis? |
| Fair value and impairment (`q-valuation-impairment`) | Which units of account, markets, cash flows, assumptions and impairment triggers support the valuation? |
| Digital assets and tokenized arrangements (`q-digital-assets`) | What rights does the instrument convey, who controls it, and which asset, liability, custody or payment model applies? |

### Tax and filing obligations

| Family | Screening question |
|---|---|
| Income tax provision and uncertain positions (`q-income-tax`) | How do current taxes, temporary differences, recoverability and uncertain positions connect to the reporting entity? |
| Sales, use, value-added, excise and customs taxes (`q-indirect-tax`) | Which transaction, customer, product, location, exemption and import facts establish the obligation? |
| Entity, individual and information returns (`q-tax-returns`) | Which taxpayer, income type, ownership, reporting threshold, return and filing period apply? |
| Cross-border tax and transfer pricing (`q-international-tax`) | Which legal entities, related-party flows, treaties, withholding, permanent-establishment and transfer-pricing facts matter? |
| Tax accounting methods and book-tax bridges (`q-tax-methods`) | Which timing methods, elections, aggregation rules, method changes and transition cohorts govern book-tax differences? |

### Entity changes and unusual events

| Family | Screening question |
|---|---|
| Acquisitions, combinations and joint ventures (`q-business-combinations`) | What is acquired or formed, who controls it, and which consideration, opening-balance and measurement questions follow? |
| Related parties and intercompany arrangements (`q-related-parties`) | Which ownership, common-control, service, funding and transfer terms need separate identification and evidence? |
| Provisions, claims, warranties and guarantees (`q-provisions`) | What obligation or exposure exists, what triggers recognition or disclosure, and how are ranges and recoveries supported? |
| Purchased insurance and recoveries (`q-insurance-policyholder`) | Which coverage, deductibles, claims, premiums, cancellations and recovery rights affect the policyholder? |
| Disposals, restructurings and insolvency (`q-restructuring-distress`) | Which sale, closure, restructuring, liquidation or reorganization events change the accounting basis or obligations? |
| Environmental obligations and related instruments (`q-environmental`) | Which remediation, retirement, conservation, emissions or credit arrangements create measurable rights or obligations? |

### Institutional and regulated arrangements

| Family | Screening question |
|---|---|
| Grants, contributions and restricted resources (`q-grants-contributions`) | Who provides resources, what conditions and restrictions attach, and how are spending, release and return duties evidenced? |
| Government funds and budgetary reporting (`q-government-funds`) | Which fund, appropriation, budgetary basis, interfund flow and government-wide reconciliation applies? |
| Federal and sovereign reporting (`q-federal-sovereign`) | Which federal or sovereign reporting entity, budget authority, credit activity and stewardship obligations are relevant? |
| Insurance and reinsurance obligations (`q-insurer`) | Which underwriting, contract boundary, reserve, reinsurance, acquisition-cost and statutory-reporting questions apply? |
| Lending, deposits and servicing (`q-credit-intermediation`) | How do loan origination, servicing, transfers, deposits, guarantees and supervisory reports relate to the accounts? |
| Funds, custody and fiduciary accounting (`q-funds-custody`) | Whose assets are held, which fund or trust is the reporting unit, and how do fees, allocations and client-asset reconciliations work? |
| Rate regulation and regulated cost recovery (`q-rate-regulation`) | Which rate-setting regime, recovery rights, obligations and regulatory accounts apply? |
| Biological and extractive resources (`q-natural-resources`) | Which growing, harvested, mineral, exploration, development or depletion stages require distinct analysis? |
| Third-party reimbursement and cost reporting (`q-reimbursement`) | How do service delivery, payer rules, contractual adjustments, estimates, settlements and cost reports reconcile? |
| Licensed content, royalties and rights portfolios (`q-licensed-content`) | Which territories, usage rights, minimum guarantees, production costs, royalties and participations attach to the content? |

### Management accounting

| Family | Screening question |
|---|---|
| Cost objects and allocation (`q-cost-allocation`) | Which products, services, jobs and responsibility centers consume the costs, and how are allocation bases reconciled? |
| Budgets, forecasts and decision models (`q-planning`) | Which volume, price, capacity, cost and cash assumptions explain the plan and its uncertainty? |
| Profitability and performance measures (`q-performance`) | How are margins, unit economics and non-GAAP measures defined and reconciled to financial records? |

### Assurance and controls

| Family | Screening question |
|---|---|
| Audit assertions and substantive evidence (`q-audit-assertions`) | What supports existence, completeness, rights, valuation and presentation for each material population? |
| Internal control and fraud (`q-controls-fraud`) | Which error or fraud can occur, which control addresses it, and what evidence demonstrates its operation? |
| Compliance and special-purpose assurance (`q-compliance-assurance`) | Which engagement, regulated population, grant, contract or special-purpose criteria require separate assurance procedures? |
| Professional duties and engagement governance (`q-professional-governance`) | Which competence, independence, confidentiality, documentation and quality-management duties apply to the role? |

### Agent, data and research evidence

| Family | Screening question |
|---|---|
| Source data, lineage and reconciliation (`q-data-lineage`) | Can the complete source population, transformations, revisions and ledger ties be reproduced for the accounting question? |
| Systems, documents and interoperability (`q-interfaces`) | Which contracts, schemas, identifiers, units, versions, exports and interface limitations govern the data? |
| Security, privacy and access (`q-security`) | Which access, tenant, retention, deletion, prompt-injection and information-disclosure boundaries apply? |
| Agent architecture and reasoning (`q-agent-design`) | Which planning, tool-use, calculation and retrieval designs are supported for the accounting task and its failure conditions? |
| Human review and action authority (`q-human-authority`) | Which judgments, exceptions and consequential actions require assigned authority, and how is review evidenced? |
| Evaluation methods and transfer limits (`q-evaluation`) | What did the study measure, on which population and controls, and what cannot be inferred about other accounting work? |
| Deployment, incidents and independent evidence (`q-deployment-evidence`) | Which observed outcomes, costs, failures and independent replications establish real-world performance? |
| Rights, provenance and reusable data (`q-reuse-rights`) | Which source-level permissions, consent, provenance and restrictions govern retrieval, redistribution and training reuse? |

## Reusable business-model archetypes

Several archetypes may apply to one entity or subsector. These are proposed research groupings, not alternative official industry codes.

| Archetype | Accounting distinctions to investigate |
|---|---|
| Biological production | Growing stock, harvested output, seasonality and resource rights |
| Extractive production | Reserves, exploration, development, depletion and site obligations |
| Regulated network operations | Usage, tariffs, regulated cost recovery and infrastructure |
| Project contracting | Contract performance, WIP, estimates, billing, claims and subcontractors |
| Manufacturing and conversion | Material transformation, capacity, standard costs, yields and warranties |
| Wholesale distribution | Inventory title, rebates, returns, logistics and supplier finance |
| Agency and marketplace arrangements | Principal-agent roles, commissions, third-party balances and settlement |
| Retail and multichannel selling | Point-of-sale, returns, promotions, inventory and indirect tax |
| Transport and fleet services | Trips, freight, capacity, fleet assets, fuel and maintenance |
| Storage and logistics | Customer goods, custody, throughput, locations and service periods |
| Content and intellectual-property licensing | Rights portfolios, royalties, production costs and distribution |
| Software, subscriptions and cloud services | Access periods, usage, implementation, development and bundled promises |
| Communications and usage networks | Metered usage, devices, service bundles and network investment |
| Credit intermediation | Loans, deposits, servicing, funding, expected losses and supervision |
| Insurance risk pooling | Underwriting, reserves, reinsurance and regulatory capital |
| Investment and fiduciary arrangements | Client assets, funds, valuations, fees and investor allocations |
| Property development and leasing | Land, development costs, sales, tenant arrangements and property entities |
| Asset rental | Owned fleets, lease classification, utilization, maintenance and residual values |
| Professional and technical services | Time, milestones, retainers, reimbursable costs and project profitability |
| Holding and management entities | Ownership, consolidation, related-party services and internal funding |
| Outsourced workforce and support | Service delivery, worker obligations, pass-through costs and customer funds |
| Waste and environmental services | Disposal volumes, long-lived sites, remediation and closure obligations |
| Education and sponsored activity | Tuition, aid, grants, endowments and differing ownership forms |
| Clinical care and third-party payment | Patient activity, payer contracts, adjustments, claims and cost reporting |
| Care and social services | Service eligibility, grants, reimbursement, occupancy and labor |
| Events, recreation and gaming | Admissions, advance receipts, prizes, participant funds and rights |
| Hospitality and food service | Occupancy, reservations, food costs, tips, franchises and property roles |
| Membership and donor-funded activity | Dues, donations, restrictions, programs and stewardship |
| Government and public finance | Budget authority, taxes, transfers, public assets and fund reporting |
| Households as employers or taxpayers | Personal and business boundaries, domestic payroll and tax obligations |

## Construction example

The 23 areas from the prior construction review can be linked into the broader topology. These are candidate content links; the earlier review's limitations remain in force.

| Prior construction area | Question families | Existing workflow |
|---|---|---|
| Contract scope and delivery model | q-reporting-basis, q-revenue | `wf-construction-contract-intake` |
| Over-time eligibility and progress | q-revenue, q-project-wip | `wf-construction-wip-close` |
| Job-cost completeness and cutoff | q-project-wip, q-data-lineage | `wf-construction-job-cost-estimates` |
| Estimates to complete and margin fade | q-estimates, q-project-wip | `wf-construction-job-cost-estimates` |
| Change orders and claims | q-revenue, q-project-wip, q-provisions | `wf-construction-change-orders-claims` |
| Expected contract losses | q-project-wip, q-provisions | `wf-construction-change-orders-claims` |
| Payment applications and schedules of values | q-revenue, q-data-lineage | `wf-construction-billing-retainage` |
| Retainage and contract balances | q-receivables-credit, q-project-wip | `wf-construction-billing-retainage` |
| Credit losses and collections | q-receivables-credit | `wf-construction-billing-retainage` |
| Subcontractor obligations and payments | q-purchasing-payables, q-cash-settlement | `wf-construction-subcontractor-payables` |
| Trust funds, waivers, liens and bonds | q-provisions, q-compliance-assurance | `wf-construction-subcontractor-payables` |
| Public works and allowable costs | q-cost-allocation, q-compliance-assurance | `wf-construction-contract-intake` |
| Prevailing wages and certified payroll | q-payroll, q-compliance-assurance | `wf-construction-prevailing-wage-payroll` |
| Long-term-contract federal tax | q-tax-methods, q-tax-returns | `wf-construction-long-term-contract-tax` |
| Multistate sales and use tax | q-indirect-tax | `wf-construction-multistate-tax` |
| Income apportionment and conformity | q-income-tax, q-tax-methods | `wf-construction-multistate-tax` |
| Equipment, rentals and internal charges | q-capital-assets, q-leases, q-cost-allocation | `wf-construction-equipment-leases` |
| Insurance, wrap-ups and premiums | q-insurance-policyholder | `wf-construction-insurance-contingencies` |
| Warranties, guarantees and contingencies | q-provisions | `wf-construction-insurance-contingencies` |
| Joint ventures and related entities | q-business-combinations, q-consolidation, q-related-parties | `wf-construction-joint-ventures` |
| Cash, borrowing and surety | q-cash-settlement, q-debt, q-planning | `wf-construction-cash-surety-closeout` |
| Backlog and closeout | q-performance, q-project-wip, q-provisions | `wf-construction-cash-surety-closeout` |
| Data lineage, access and fraud controls | q-data-lineage, q-security, q-controls-fraud | `wf-construction-wip-close` |

## Snapshot and review boundary

The local corpus snapshot is 2026-09-11.1: 838 records, including 577 sources and 73 workflows. The JSON contains input hashes, classification provenance, candidate links and review states. No source record was added, retagged or reverified by this topology mapping.
