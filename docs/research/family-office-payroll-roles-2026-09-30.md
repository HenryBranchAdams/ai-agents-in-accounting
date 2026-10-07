# Household and office payroll: bounded guide research

Research observed 2026-09-30 UTC. Owner: authority_research. Selected-source research followed by a separately scoped guide implementation; no full-text ingestion.

## Decision and non-duplication

Recommend one small **role-routing supplement**, not another payroll calculation guide. `guide-fo-reference-fo-08` has discovery question `FO-08.Q1`: whether a worker is employed by the office, a household or another entity. Existing `guide-other-services-us-close` already answers household employee-versus-contractor evidence and reimbursements. `guide-q-payroll` already covers approved time, US gross-to-net reconciliation, federal filing evidence and an assumed covered nonexempt employee. The controller brief says payment processing does not identify the employer but supplies no worked ambiguity case for this boundary.

The missing useful connection is separating four facts: **what services were performed, who had the right to control them, who administered payment, and which tax reporting route was selected**. A home address, job label, office-funded cash or observed Form 941 is insufficient alone. This can be demonstrated with two explicitly assumed branches and an unresolved mixed-duty counterexample. It would advance FO-08.Q1 without claiming Q2 wage/hour or Q4 benefits completeness.

## Verified primary evidence and limits

[IRS Publication 926](https://www.irs.gov/publications/p926), live page headed **Publication 926 (2026)** and **For use in 2026**, read with supported browser; page last reviewed/updated **30-Apr-2026**. Selected locators:

- “Do You Have a Household Employee?” (`#en_US_2026_publink100086722`): control of both the task and its manner matters.
- “Household work” (`#en_US_2026_publink100086724`): work in/around a private home; private secretary, tutor and librarian services are excluded even at home.
- “Workers who aren’t your employees” (`#en_US_2026_publink100086725`): worker-controlled independent business and agency-controlled work are distinct branches.
- “Payment option for business employers” (`#en_US_2026_publink100086762`) and “Business employment tax returns” (`#en_US_2026_publink100086772`): the specified business/farm-owner reporting choice can place household employment taxes on business returns instead of Schedule H; it does not permit the stated Schedule C/F deduction for household wages/taxes.

Those paragraphs support careful routing, **not** transferring an individual's household obligations to a separate family-office corporation. Do not infer that every home-based employee fits household employment or every non-household worker is a contractor.

[IRS Publication 15](https://www.irs.gov/publications/p15), page identifies **2026** edition. Selected locators: section 2, “Employee status under common law”; section 16, opening paragraphs and “Payroll service provider (PSP),” with adjacent reporting-agent/approved-agent/CPEO distinctions retained as exclusions from the simplified case. The control right matters even where the worker has freedom of action. A PSP administers payroll under the employer's EIN, and ordinary outsourcing generally leaves employer obligations in place. Other third-party arrangements can differ; an office or vendor label is not enough to select one.

These are final published IRS explanatory guidance pages, not drafts or a comprehensive legal/GAAP review. Observation date is not an enactment date or a certification against all later developments. No annual thresholds, rates, filing deadlines, deductions or wage/hour result is proposed for the new example.

## Proposed question and answer scope

Question: **What evidence distinguishes household work, office-company employment and payment administration when one family office coordinates payroll?**

Suggested bounded answer: Identify the contracting parties and control rights, task descriptions, work locations and dates before assigning an employment-tax research route. A worker doing household tasks under an individual's stated control is a household-employment research candidate; a company-controlled administrator performing office business work follows the employer research route even when working at a home. Keep service provider and paying-account identities separate. Conflicting or mixed facts stay unresolved for payroll/tax/employment review; do not decide employer identity by reimbursement allocation or form number alone.

Add this as an independently scoped supplemental question/reading object or new tightly bounded guide. Do not silently rewrite the six accepted family-office questions or turn the FO-08 discovery record into comprehensive verified coverage.

## Synthetic case worth implementing

All people, IDs and documents fictional. No real payroll, bank access, filing or posting.

| Case | Stated facts | Research output |
|---|---|---|
| H | Individual H contracts with a housekeeper, supplies household equipment, and controls how household work at H's residence is done. Office O only forwards a processor file under an explicit administrative arrangement. | Household route candidate under the stated facts; identify H separately from O and processor P. Tax applicability remains outside example. |
| O | Company O contracts with an administrator and retains control over company recordkeeping tasks. Worker performs only those office tasks from a desk at H's home. | Office employment research route under the stipulated control facts. Home location alone does not supply household-work classification. |
| U | “Family assistant” offer letter names O, residence instructions come from H, a timesheet mixes household tasks and office scheduling, and P's extract gives only one payer label. Contracts omit who controls each duty; no third-party arrangement evidence. | Employer/route **unresolved**. Preserve both sets of facts; request contracts, actual direction evidence and task/time detail. Do not mechanically split legal employers by hours, infer contractor status, or resolve by who paid cash. |
| F | Reviewer receives a Form 941 copy for a separately stipulated individual who owns a business and uses the household reporting option. | Form number is not proof the services are business labor or deductible business expense. Treat reporting election and employer/service evidence as distinct. Do not apply this option to O by analogy. |

Expected structured evidence fields: worker alias; contracting party; person/entity with control right; evidence of actual direction; task and location by period; equipment/provider facts; payment-account owner; payroll administrator identity and arrangement type; employer identifier alias; chosen reporting route and basis; withheld/employer amounts from approved register if included; unresolved conflicts; reviewer needed; authority/source edition. Avoid storing real names, taxpayer IDs or account numbers in the synthetic corpus.

## Implementation boundaries and gates

Reuse existing source IDs `src_aa_i115_irs_household_employer` and `src_irs_pub15_2026`; no duplicate sources. Add a narrowly dated supplemental review/locator only if needed to show the newly read paragraphs, preserving original review history and unknown reuse rights. Keep source full-text storage false. Existing generic household and payroll guides remain the calculation/reconciliation reading routes.

Meaningful tests: home location alone never selects household route; payment administrator never overwrites employer field; mixed-duty conflict produces null/unresolved employer and filing route; Form 941 counterexample does not generate business-deduction conclusion; every positive branch records its assumed control facts and source locator. Tests check designed synthetic behavior, not real legal classification or live skill efficacy.

Exclude actual tax computations, state wage/hour, overtime aggregation, joint employment, benefit coverage, immigration determinations, CPEO eligibility and entity-specific filing advice. These remain specialist handoffs. Independent content review and normal candidate/final-head checks remain necessary before integration.

## Authored supplement

`guide-family-office-payroll-roles` implements these four synthetic branches as a new guide with structured cases and an editorial reading brief. Selected-passage observations live in its own data and provenance. Both reused source records, all original guides, FO-08 discovery questions and the six accepted family-office answers remain unchanged. No formal sufficiency assessment is upgraded.

The focused source-level tests verify case distinctions, unresolved evidence, the limited reporting-option counterexample and editorial dependencies. They measure designed corpus consistency only, not empirical or live agent efficacy. Integration, independent source/content review, exports and browser validation remain separate release gates.
