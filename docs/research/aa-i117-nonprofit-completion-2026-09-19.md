# AA-I117 nonprofit completion package

This source-only package recovers four bounded US nonprofit branches from the selected research scope: endowment spending and disclosure, contributed nonfinancial assets and services, selected Form 990 and Federal-award reporting, and cross-industry activity routing. It uses nongovernmental US GAAP and federal reporting context, with Illinois UPMIFA as one state-law example. It does not attempt a 50-state survey or claim whole-industry sufficiency.

## Criteria disposition

- **A1 inventory and scope:** four named questions, four partial assessments, three guides with workflows and controls, three synthetic examples, two new authority records, and three guarded revisions to existing source records are packaged. The package records the 2025 Form 990 period, the current eCFR display inspected on 2026-09-19, and an illustrative 2026 close.
- **A2 authority and rights:** the package preserves publisher URLs, exact PDF pages or statutory and CFR sections, effective-period pointers, access notes, and record-level rights. FASB, eCFR, Illinois, and IRS source text is not stored; external reuse permissions remain unresolved where the records say so.
- **A3 accounting material:** each branch connects declared inputs to treatment and a read-only workflow, control proposals, and an original synthetic example. The examples reconcile their stated arithmetic and retain independent counterexamples such as a board-designated fund, an underwater fund, nonqualifying volunteer service, and the distinction between Form 990 and Federal-award routes.
- **A4 limits:** every question and assessment remains partial. Current consolidated Topic 958, real donor instruments, actual returns or awards, professional review, operational populations, measured agent performance, and legal conclusions remain open.
- **A5 retrieval and contracts:** the applied package is validated in a detached temporary Git worktree. Standard corpus, research, coverage, mapping, snapshot self-metadata, build, and retrieval checks are run there. The source checkout is unchanged by validation. The package fixes the prior retrieval limit at 20, preserves each historical snapshot's own assessment and corpus version, and refuses an unexpected `src_cfr200grants` state rather than overwriting accepted AA-I125 review.

The package keeps canonical release, catalog, and historical snapshot files outside the source-only change. Any later integration must regenerate derived mappings, downloads, and archives from the applied corpus in that separate integration scope.

## Authority receipts

- [FASB ASU 2020-07](https://storage.fasb.org/ASU%202020-07.pdf), PDF pp. 6-7 and 17-19, including the effective periods and selected presentation and disclosure paragraphs.
- [FASB ASU 2016-14](https://storage.fasb.org/ASU_2016-14.pdf), PDF pp. 10-11, 30-31, 41-42, and 160 for effective periods, net-asset restrictions, endowment disclosures, and functional expenses.
- [Illinois 760 ILCS 51](https://www.ilga.gov/legislation/ilcs/ilcs3.asp?ActID=3093&ChapterID=61&Print=True), selected §§2, 3, 6, 7, and 11. This is a selected state-law example only.
- [2025 IRS Instructions for Form 990](https://www.irs.gov/pub/irs-prior/i990--2025.pdf), PDF pp. 10-12, 41, and 43 for donated-service narrative boundaries, schedule routing, functional expenses, and grant or assistance routing.
- [eCFR 2 CFR Part 200](https://www.ecfr.gov/current/title-2/subtitle-A/chapter-II/part-200), selected §§200.302, 200.328, 200.329, 200.403, 200.405, and 200.501. The current display, award terms, entity role, period, and exceptions require a separate human check for an actual award.

## Direct Issue 111 disposition

The existing education record supports selected tuition and deferred-tuition, third-party aid, withdrawal/refund and Title IV return separation, and public versus nongovernmental framework routing. This nonprofit package provides reusable contribution, endowment, Federal-award, and activity-routing context but does not answer education-specific auxiliary services, grants, public appropriations, or endowments. Issue 111 therefore remains partially addressed and open for those routes; this package does not close it.

The integration source amendment adds Illinois 760 ILCS 51/4(a)-(c) appropriation and accumulation limits, with the guide and named-question registry pointing to source locator 5. It also adds 2 CFR 200.331(a)-(b) subrecipient/contractor classification to the selected federal review, its inventory locator and period pointer. The baseline inventory records 182 associated records and 105 linked questions as discovery context, without inferring nonprofit applicability.
