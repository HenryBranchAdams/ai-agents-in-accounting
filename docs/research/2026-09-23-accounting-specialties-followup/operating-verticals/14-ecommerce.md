# Area 14: E-commerce and marketplace sellers

Research date: September 23, 2026 (America/Chicago). This supplement extends the September 22, 2026 package. It provides general U.S. accrual-basis accounting context and selected current platform workflow evidence. No merchant account, seller agreement, actual settlement export, or tax return was inspected.

## Baseline and selected gaps

The existing corpus includes `guide-wholesale-retail`, `guide-q-revenue`, `guide-q-cash-settlement`, `guide-q-inventory`, `guide-q-indirect-tax`, and `example-us-wholesale-retail-trade-reconciliation`. Source IDs include `src_construction_fasb_2014_09`, `src_fasb_asu2016_08_principal_agent`, `src_fasb_asu2015_11_inventory`, `src_roadmap_ey_revenue_2026`, and `src_roadmap_kpmg_inventory_2026`. The fixture already has a synthetic retail settlement and marketplace principal-agent branches. This follow-up adds a source-backed settlement map and synthetic arithmetic, clarifies refund versus cardholder dispute events, and grounds custody analysis in current Amazon FBA status labels. A foreign AE/English historical seller agreement was read but is excluded from U.S. findings because its elected-country applicability is not verified.

## Findings

### Settlement evidence and a synthetic reconciliation

Stripe's current balance report has a summary equation that ties beginning balance plus activity to payouts and ending balance. Activity reports expose counts and gross, fee and net totals by reporting category; the itemized report includes balance transaction IDs, source links, currency, creation time, availability date and payout association. The API can filter transactions by payout or source. Those are useful audit-trail fields, but a provider's categories do not determine revenue, inventory, tax, expense or loss recognition (`f2_operating-verticals_ecom-stripe-balance`, `f2_operating-verticals_ecom-stripe-transactions`).

Use a row-level bridge from order and fulfillment evidence to the settlement receivable, then to the payout and bank deposit. Keep the order date, performance/transfer date, refund date, tax date, fee date, dispute date, reserve hold/release date, payout date and bank posting date in separate columns. Tie each line to platform source IDs, order/charge IDs, return/refund IDs, dispute case IDs, platform invoices and bank deposit IDs. Do not infer a sales amount or recognition period from a payout amount.

The following numbers are a **synthetic worked example only**. They are not actual seller, Stripe, Amazon, Shopify, or marketplace data. Assume one currency and no opening balance, foreign-exchange movement, prior-period transaction or other adjustment. Customer collections are $10,600, consisting of $10,000 of seller consideration and $600 of tax. A $424 customer refund is assumed to contain $400 of consideration and $24 of tax. The facilitator remits the remaining $576 of tax. Other balance events are a $300 processor fee, a $100 dispute debit, a $15 dispute fee, a $250 reserve hold and a $50 reserve release.

| Synthetic settlement movement | Amount |
| --- | ---: |
| Customer collections | $10,600 |
| Customer refund, including associated tax | ($424) |
| Tax remitted by facilitator | ($576) |
| Processor fee | ($300) |
| Cardholder-dispute principal | ($100) |
| Dispute fee | ($15) |
| Reserve held | ($250) |
| Reserve released | $50 |
| Synthetic bank payout from available funds | **$8,985** |

The calculation is a settlement illustration, not a journal-entry template. In an actual close, establish which gross amount belongs to the seller, which tax is payable and who is obligated to remit it, whether the dispute amount relates to a previously recognized transaction, and how the reserve is presented under the provider's terms. The $250 hold and $50 release are transfers between available and reserve balances, not fees or reductions of total provider funds; on these assumptions, $200 remains in reserve after the $50 release, while $8,985 of available funds is paid out. Opening balance plus itemized activity less payout(s) should agree to the provider's closing available balance; a separate rollforward should tie the remaining reserve. Payout batch IDs and bank activity then support the final cash tie-out. Keep the sales/returns ledger and indirect-tax return separate from this settlement equation.

The IRS says Form 1099-K reports gross payment amounts without adjustment for fees, credits, refunds, shipping or discounts; a merchant must use its own records to determine income and expenses. That federal information-reporting amount is not the same thing as taxable business income, marketplace-facilitator sales-tax collection, a revenue amount, or a net settlement (`f2_operating-verticals_ecom-irs-1099k`).

### Returns, refunds, customer credits, and chargebacks

Shopify's current operations documentation says a seller may refund an order without creating a return and may separately choose whether to restock the item. It also documents that a partial refund can later be disputed for the full order amount, and it distinguishes gateway processing fees from a customer refund (`f2_operating-verticals_ecom-shopify-refunding-orders`). These are workflow and payment facts, not accounting policy. Under the current EY interpretation of ASC 606, an entity expecting customer returns generally records a refund liability and a separate recovery asset measured from expected returned inventory, net of recovery costs and expected value decreases; update both estimates at each reporting date (`f2_operating-verticals_saas_ey-revenue-2026`, sections 5.3-5.4). A payment refund does not prove that the goods were physically returned, inspected, or returned to inventory.

Stripe describes a chargeback as an issuer/network dispute that immediately reverses the payment and debits the payment amount plus one or more network dispute fees from the Stripe balance. That is a different event from a seller-initiated refund (`f2_operating-verticals_ecom-stripe-disputes`). If evidence wins a dispute, a later reinstatement is a separate settlement event. An open or lost dispute does not by itself determine whether the original sale is reversed, whether a refund liability existed at sale, or whether the debit is a loss, fee or other expense. Apply the executed merchant agreement, actual case outcome, customer correspondence, delivery/return evidence and the applicable accounting policy.

### Fulfillment custody, title, inventory and fees

Amazon's current FBA Inventory API page supports the use of fulfillable, inbound, reserved, unfulfillable and researching as operational status labels. The page says researching covers misplaced or warehouse-damaged units being confirmed. Those are custody/status categories; they do not establish title, actual cutoff quantity, condition for sale, cost, net realizable value or accounting for storage/fulfillment fees (`f2_operating-verticals_ecom-amazon-fba-inventory`). Reconcile platform statuses to seller SKU/FNSKU and lot, inventory ledger, inbound and shipment records, returns and reimbursements, 3PL or platform confirmations, physical/cycle counts and the applicable ownership or consignment terms. Keep inventory-cost decisions separate from storage, outbound fulfillment, platform commission, advertising, payment processing and loss/reimbursement events.

A dated Amazon Services Business Solutions Agreement marked AE/English was directly read for FBA Sections F-3 and F-4, but is retained only as an excluded foreign-contract lead, not support for a U.S. seller conclusion (`f2_operating-verticals_ecom-amazon-fba-agreement-2024`). Its elected-country scope and current applicability to any seller were not established. The current MCF service-terms URL remains a discovery-only lead because a direct open failed; no operative title/risk conclusion relies on its search excerpt (`f2_operating-verticals_ecom-amazon-mcf-terms`). No U.S. seller agreement, actual inventory response, 3PL confirmation or physical count was available, so title and control remain unresolved for the seller and cutoff date.

### Marketplace facilitator tax routing

The existing CDTFA source is a California-specific example: it addresses marketplace-facilitator collection/remittance for facilitated California sales and seller responsibilities for other sales and records (`ov-ecom-cdtfa`). It is not a national rule. A practical routing record should identify the ship-from/destination jurisdictions, product and transaction type, marketplace/facilitator, which channel made the sale, the applicable facilitator law and date, evidence of collection/remittance, and the seller's separate registration, reporting and record duties. Direct-site sales and other nexus facts still need review under the governing jurisdiction's current rules. No 50-state survey or threshold test was performed.

Keep indirect-tax status separate from ASC 606 principal-agent analysis. The existing FASB and SEC revenue sources address whether a seller controls the specified good or service before transfer (`ov-principal-agent`); a marketplace's tax collection role or the net payout alone does not settle gross-versus-net presentation.

## Workpaper recommendation

Enrich the existing trade reconciliation with evidence adapters that map platform transaction identifiers and status fields to accounting populations without assigning automatic journal entries. Add separate tabs or schedules for order/fulfillment revenue cutoff, expected returns and recovery assets, actual refunds, cardholder disputes and fees, facilitator-collected taxes, platform fees, reserves, settlement receivables and bank cash. Keep a jurisdiction-and-channel tax matrix that routes each case to current governing law and retains source date and product facts.

## Remaining gaps

- No merchant statement, account configuration, seller/facilitator agreement, Amazon ledger, 3PL confirmation, physical count, live tax return or bank match was reviewed.
- Amazon MCF terms are discovery-only after the publisher URL returned a server error. The directly read AE/English FBA contract is an excluded foreign comparator, not evidence of U.S. seller terms.
- Card-network rules and a real dispute file were not inspected. Platform documentation establishes workflow, not the accounting outcome.
- Only California marketplace-facilitator tax guidance is carried forward; federal Form 1099-K reporting does not fill a multistate sales-tax gap. Current state and local thresholds and product taxability remain outside scope.
- The current EY revenue guide is interpretive and includes ASC excerpts. This follow-up did not directly verify consolidated ASC 606 through the Codification web view. the observed no-text result is not evidence that a paid license is necessary.

## Sources and locators

- `f2_operating-verticals_ecom-stripe-balance`: [Stripe Balance report](https://docs.stripe.com/reports/balance), Balance Summary, Balance change from activity and itemized report fields.
- `f2_operating-verticals_ecom-stripe-transactions`: [Stripe List all balance transactions API](https://docs.stripe.com/api/balance_transactions/list), response fields and payout/source filters.
- `f2_operating-verticals_ecom-stripe-disputes`: [Stripe Disputes](https://docs.stripe.com/disputes), cardholder/issuer dispute workflow and balance debits.
- `f2_operating-verticals_ecom-shopify-refunding-orders`: [Shopify Refunding orders](https://help.shopify.com/en/manual/fulfillment/managing-orders/refunding-orders), refunds without returns, optional restocking, partial-refund disputes and fees.
- `f2_operating-verticals_ecom-amazon-fba-agreement-2024`: [Amazon Services Business Solutions Agreement, AE/English version dated November 8, 2024](https://m.media-amazon.com/images/G/01/rainier/help./Amazon_Services_Business_Solutions_Agreement_-_AE_-_EN_-_November_8_2024.pdf), FBA Sections F-3-F-4 were read; excluded foreign comparator, not U.S. seller evidence.
- `f2_operating-verticals_ecom-amazon-mcf-terms`: [Amazon Multichannel Fulfillment Service Terms](https://supplychain.amazon.com/legal/service-terms/mcf), discovered as dated July 6, 2026; direct open returned a server error, so this is discovery-only and no operative term is relied on.
- `f2_operating-verticals_ecom-amazon-fba-inventory`: [Amazon FBA Inventory API](https://developer-docs.amazon.com/sp-api/lang-en_EN/docs/fba-inventory-api), inventory status definitions and current v1 listing.
- `f2_operating-verticals_ecom-irs-1099k`: [IRS What to do with Form 1099-K](https://www.irs.gov/businesses/what-to-do-with-form-1099-k), gross-payment and recordkeeping discussion.
- Carried forward from [the September 22 operating-verticals package](../../2026-09-22-accounting-specialties/operating-verticals/14-ecommerce.md): `ov-principal-agent`, `ov-saas-revcore`, `ov-ecom-cdtfa`, `ov-ecom-amazon-inventory`, `ov-ecom-stripe-balance` and `ov-ecom-stripe-api`.
