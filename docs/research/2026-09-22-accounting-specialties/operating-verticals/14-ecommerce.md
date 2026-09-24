# Area 14: E-commerce and marketplace sellers

Research date: September 22, 2026 (America/Chicago). Primary scope is U.S. nongovernmental sellers and marketplace facilitators under accrual-basis U.S. GAAP. Sales/use-tax examples are explicitly jurisdictional; this is bounded research, not a conclusion for a particular seller.

## Baseline and existing corpus

The baseline links this area to `guide-wholesale-retail`, `guide-q-revenue`, `guide-q-cash-settlement`, `guide-q-inventory`, and `guide-q-indirect-tax`, as well as NAICS wholesaler, broker, and retail guides. Existing source IDs include `src_construction_fasb_2014_09`, `src_fasb_asu2016_08_principal_agent`, `src_fasb_asu2015_11_inventory`, `src_fasb_bmho20241218_topic330`, `src_roadmap_kpmg_inventory_2026`, `src_roadmap_ey_revenue_2026`, and California/Canada tax route records. `example-us-wholesale-retail-trade-reconciliation` already contains synthetic merchant, broker/consignor, retail POS/card clearing, gift-card, loyalty, grocery-inventory, and marketplace principal/agent branches. It explicitly excludes state sales-tax conclusions and real platform validation. This is material breadth, but not platform-specific settlement procedure or a 50-state tax guide.

## Findings by accounting question

### Marketplace settlement, processor fees, and period cutoff

A payout is a net settlement, not a sales total. Reconcile order/item and fulfillment events to gross consideration, discounts, returns/refunds, disputes, tax withheld/remitted, platform/processor fees, other services, reserves/holds, settlement receivable, and bank deposit; keep each recognition period distinct from subsequent payout. Shopify documents balance activity, including gross activity, fees, disputes and payouts, and explicitly says the activity report is not an accounting revenue statement (`ov-ecom-shopify-activity`). Its refund documentation says refunds reduce a later payout and the original processing fee is not returned (`ov-ecom-shopify-refunds`). Amazon documents a V2 settlement report with settlement window, deposit date, order/shipment/adjustment IDs, fee/amount descriptions, SKU, quantity and posting date; prior XML/flat-file reports are marked deprecated (`ov-ecom-amazon-settlement`). Stripe's balance report exposes gross, fee, net, created/availability dates, dispute reason and original-charge links (`ov-ecom-stripe-balance`); its API provides separate transactions filterable by payout/source/date/type and includes refund, fee and reserve transaction types (`ov-ecom-stripe-api`). These vendor documents describe system behavior and fields only. They do not determine GAAP recognition or principal/agent. The existing synthetic example remains accounting context; FASB's control test is based on the specified good/service before transfer, not who moves cash (`ov-principal-agent`).

### Returns, refunds, credits, and chargebacks

An expected customer return is variable consideration and can involve a refund liability and a recovery asset for expected goods, subject to measurement/condition. Separate refund acceptance, inventory return/inspection, dispute/chargeback event, dispute fee, and cash settlement. Shopify's reserve documentation describes temporary holds, potential deductions for dispute amounts/fees, and release of remaining balances (`ov-ecom-shopify-reserves`); the processor activity and refund events are separately documented (`ov-ecom-shopify-activity`, `ov-ecom-shopify-refunds`). Stripe's report links charge/refund/dispute context to gross/fee/net amounts (`ov-ecom-stripe-balance`), and its API supplies transaction-level payout/type filters (`ov-ecom-stripe-api`). Those records help trace sequence, but merchant agreement, dispute evidence, actual return and applicable accounting determine whether the item is a revenue reversal, receivable/loss, penalty or another expense. The FTC's dated shipping rule alert is legal compliance context, not GAAP measurement (`ov-ecom-ftc`).

### Fulfillment, inventory, and fees

Inventory ownership remains a rights question when a platform or 3PL stores/ships goods; a custody status is not title, existence or valuation evidence by itself. Amazon FBA's public API separates fulfillable, inbound, reserved, unfulfillable and researching (misplaced/warehouse-damaged under investigation) populations (`ov-ecom-amazon-inventory`). Use those as exception/reconciliation populations with seller SKU/FNSKU/lot, transfer/receipt, shipment, return/restock, damaged/lost status, inventory ledger, 3PL confirmations and physical/cycle count. Distinguish acquisition/conversion costs from outbound fulfillment, storage, ads, selling fees and processor charges under entity policy. ASU 2015-11 applies lower of cost and NRV for methods other than LIFO or retail; those excluded methods retain separate rules. The platform API does not settle ownership, cost, NRV, or expense-versus-capitalization conclusions. See `ov-ecom-inventory`, reused `src_fasb_asu2015_11_inventory`, `src_fasb_bmho20241218_topic330`, and `src_roadmap_kpmg_inventory_2026`.

### Sales tax and marketplace facilitator role

Marketplace facilitator statutes are tax collection/reporting regimes; they do not by themselves decide GAAP principal-agent revenue presentation. California CDTFA guidance reviewed here generally makes a registered marketplace facilitator the retailer responsible for collecting/remitting tax on facilitated California tangible-merchandise sales, but direct sales and nexus may leave seller registration/reporting obligations. The guidance also instructs sellers to retain documentation of facilitator registration/responsibility, and sellers may still include facilitated sales in nexus threshold calculations and report total sales. This is California-only guidance, includes provisions amended through 2022 and must be checked against current statutes/other states. See `ov-ecom-cdtfa`.

## Editorial workpaper recommendation

Enrich `guide-wholesale-retail` with an original, platform-neutral settlement close map and evidence checklist. Keep gross sales, sales-return estimate, actual refunds, discounts, tax payable, platform fees, fulfillment/storage charges, chargeback/fees, reserves, settlement receivable, and deposit as separately reconcilable populations. Add a close example where a sale and shipment occur in one month, the customer return/chargeback is initiated later, the product returns to platform custody later still, and the marketplace payout is net of unrelated fees/tax/reserves. Maintain separate role analysis for seller-principal, marketplace facilitator/principal for its own service, and marketplace agent. Create linked state-specific indirect-tax routing instead of implying California applies nationwide.

## Unresolved gaps

- Public Shopify, Amazon and Stripe help/API schemas were read, but no seller account, actual statement/export, Amazon Inventory Ledger extract, 3PL confirmation, merchant agreement, or empirical reconciliation sample was inspected. Platform reports differ and change.
- No card-network rules or merchant agreement was inspected to classify chargeback recovery, refund, dispute fee, and fraud loss. Vendor documentation establishes transaction workflow, not GAAP conclusions.
- U.S. GAAP treatment of a platform commission/fulfillment service netted at settlement needs contract and specified-good/service facts; exact principal-agent classification is not inferred from net cash.
- California is the sole marketplace-tax authority read in this package; state thresholds, product taxability, local taxes, facilitator definitions, exemptions, and remote-seller rules remain state-specific and mutable.
- Rights in platform reports and third-party technical documentation remain unknown. No live books, platform exports, professional review, or application to a merchant's facts was performed.

## Source links

- `ov-saas-revcore`: [FASB ASU 2014-09, Section A](https://storage.fasb.org/ASU%202014-09_Section%20A.pdf), Topic 606 foundation.
- `ov-principal-agent`: [FASB ASU 2016-08](https://storage.fasb.org/ASU%202016-08.pdf), principal/agent control analysis.
- `ov-ecom-inventory`: [FASB ASU 2015-11](https://storage.fasb.org/ASU_2015-11.pdf), inventory measurement.
- `ov-ecom-cdtfa`: [California marketplace facilitator tax guide](https://cdtfa.ca.gov/industry/MPFAct.htm), California state tax rules.
- `ov-ecom-ftc`: [FTC prompt delivery rules alert](https://www.ftc.gov/system/files/documents/plain-language/alt051-selling-internet-prompt-delivery-rules.pdf), historical refund/delay context.
- `ov-ecom-shopify-activity`: [Shopify Payments activity report](https://help.shopify.com/en/manual/payments/shopify-payments/payouts/payouts-activity-report), vendor balance fields only.
- `ov-ecom-shopify-refunds`: [Shopify Payments refunds](https://help.shopify.com/en/manual/payments/shopify-payments/payouts/refunds), refund and payout timing/fee behavior only.
- `ov-ecom-shopify-reserves`: [Overview of reserves in Shopify Payments](https://help.shopify.com/en/manual/payments/shopify-payments/payouts/reserves), reserve workflow only.
- `ov-ecom-amazon-settlement`: [Amazon SP-API settlement report documentation](https://developer-docs.amazon.com/sp-api/docs/report-type-values-settlement), Flat File V2 fields/deprecation.
- `ov-ecom-amazon-inventory`: [Amazon FBA Inventory API](https://developer-docs.amazon.com/sp-api/lang-en_EN/docs/fba-inventory-api), inventory status populations.
- `ov-ecom-stripe-balance`: [Stripe Balance report](https://docs.stripe.com/reports/balance), report fields only.
- `ov-ecom-stripe-api`: [List all balance transactions API](https://docs.stripe.com/api/balance_transactions/list), transaction query behavior only.
- Existing source IDs `src_fasb_bmho20241218_topic330`, `src_roadmap_kpmg_inventory_2026`, and `src_roadmap_ey_revenue_2026` remain in the corpus; their original URLs and source-specific limits are recorded there.
