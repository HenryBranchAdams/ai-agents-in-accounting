# AA-I111 education completion source package

This source-only package completes the bounded US education research gap with four additive routes:

- auxiliary services, including housing, dining, bookstore and a lease or dual-use tax counterexample;
- federal grants, with contribution versus exchange, conditional barriers, 2 CFR Part 200 cost controls and a separate student-aid boundary;
- public appropriations, with historical GASB 35 public-college reporting-model and appropriation routing; and
- nongovernmental nonprofit endowments, using the pending shared nonprofit FASB and Illinois UPMIFA source IDs without duplicating their publisher URLs.

The accepted education baseline remains one NAICS 611 guide with the accepted tuition, aid, withdrawal/refund and framework-routing questions. Its source fields, reviews, rights and mappings are preserved. The package adds four guides, workflows, controls, examples, questions, assessments and one original IRS Publication 598 source. It adds a distinct review marker to the education-owned GASB 35 source so the auxiliary and appropriation locators remain attributable without overwriting prior review metadata.

The examples are synthetic. They are arithmetic bridges and counterexamples, not operational evidence, accounting conclusions, tax opinions or professional sign-off. Current consolidated FASB/GASB requirements, entity applicability, award terms, governing law and current tax-year rules remain open where stated in the package.

Integration is intentionally staged. `scripts/integrate-education-completion.mjs --apply` requires the exact pending nonprofit source IDs before it writes any planned file, rejects duplicate publisher URLs and existing-record conflicts, and writes only after all checks pass. `--validate-applied` seeds those shared source records in a disposable detached worktree, applies the package there, runs coverage mapping, validation, build and representative retrieval, then removes the disposable copy. No canonical records, release, snapshot or catalog files are changed in this source checkout.

Original public sources read for this package:

- [FASB ASU 2018-08](https://storage.fasb.org/ASU%202018-08.pdf)
- [GASB Statement 35](https://storage.gasb.org/GASBS%2035.pdf)
- [2 CFR Part 200](https://www.ecfr.gov/current/title-2/subtitle-A/chapter-II/part-200)
- [IRS Publication 598](https://www.irs.gov/publications/p598)
- [FASB ASU 2014-09 Section A](https://storage.fasb.org/ASU%202014-09_Section%20A.pdf)

The integration amendment retains exact shared nonprofit locators in both the endowment guide and question registry: ASU 2016-14 selected PDF pages 10-11, 17, 30-31 and 41-42, and Illinois 760 ILCS 51 sections 2, 3, 4(a)-(c), 6, 7 and 11. JSON pointers resolve to the preserved shared source records and their effective-period fields. No new state-law survey or current consolidated-guidance claim is added.
