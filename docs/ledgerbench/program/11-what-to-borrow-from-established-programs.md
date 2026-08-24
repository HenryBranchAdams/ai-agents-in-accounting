# Part XI — What to borrow from established programs

## 49. Precedent matrix

| Program | Strong practice | LedgerBench adaptation | Limitation to avoid |
|---|---|---|---|
| **MLPerf / MLCommons** | Closed and Open divisions; formal submission rounds; compliance checks; reviewed and verified results; anti-benchmark-detection rules; advisory and review bodies | Standardized, Open Systems, Assisted, and Conformance products; official rounds; verified labels; reproducibility audits | Do not allow submitters to dominate dispute resolution or reduce results to throughput-style competition |
| **HELM** | Taxonomy before task selection; multi-metric reporting; standardized conditions; transparent raw results; explicit coverage gaps | Declare the accounting task universe and publish capability profiles and omissions | Avoid sprawling breadth without enough task depth or operational realism |
| **BIG-bench** | Community task contribution; broad institutional participation; strong human baselines; tasks intended to expose frontier gaps | Open task proposal pipeline and paid expert baselines | Community volume does not substitute for strict task validation |
| **SWE-bench** | Authentic work drawn from real practice; executable end-state tests; sustainable source of difficult tasks | Use realistic enterprise workflows and outcome-based grading | Public static tasks can become contaminated; original tasks may contain invalid or overly narrow tests |
| **SWE-bench Verified** | Professional annotators; three independent labels; conservative filtering; containerized evaluation; explicit ambiguity and grader-validity review | Triple review, independent solve, conservative admission, reproducible environments | Do not confuse removal of invalid tasks with making the benchmark easier |
| **GAIA** | Tool-using tasks that are simple for humans but hard for agents; hidden answers powering an official leaderboard | Include ordinary accounting tasks that require robust evidence and tools, not only exotic technical questions | Exact-answer tasks alone do not capture workpaper quality or safe action |
| **WebArena / OSWorld** | Stateful, realistic environments; detailed initial-state setup; execution-based evaluation; human baselines | Enterprise digital twins, stateful close environments, and end-state evaluation | High realism can create fragile infrastructure and ambiguous graders |
| **PaperBench** | Hierarchical rubrics; domain-author participation; thousands of gradable subcriteria; separate evaluation of the automated judge | Rubric decomposition, author/reviewer co-development, and a GraderBench | LLM grading cannot become the ultimate authority for accounting correctness |
| **METR / RE-Bench** | Human time calibration; multiple time budgets; direct expert comparison; long-horizon reliability curves | Human-time horizons and resource-scaling curves | Time horizon is intuitive but distribution-dependent and not a complete quality measure |
| **Dynabench / LiveBench** | Dynamic task creation; fresh data; human-and-model-in-the-loop failure harvesting; contamination resistance | Rotating hidden rounds, failure-derived tasks, and temporal canaries | Adversarial collection can drift toward unnatural trick distributions |
| **Chatbot Arena** | Blinded pairwise human preference; large-scale live data; statistical rankings and uncertainty | Blind pairwise expert comparison for qualitative work that already passes hard requirements | Preference is not correctness; crowd users are not a substitute for qualified accounting reviewers |
| **NIST TEVV and conformance guidance** | Context-specific measurement; explicit conformance requirements; repeatable test tools and procedures; impartial testing bodies; uncertainty discipline | Separate benchmark, conformance, and field studies; publish estimands and uncertainty; maintain independent testing and appeals | Passing a test suite can show nonfailure on tested cases, not universal safety or correctness |

## 50. Agreed best practices distilled

Across these programs, the most defensible common practices are:

1. Define the measurement claim before building tasks.
2. Evaluate realistic outcomes, not easy proxies.
3. Separate standardized and open-system comparisons.
4. Keep conformance separate from competitive ranking.
5. Use multiple metrics and expose trade-offs.
6. Establish human baselines.
7. Validate task instructions and graders with independent experts.
8. Use execution-based checks wherever possible.
9. Decompose open-ended work into explicit rubrics.
10. Validate automated judges independently.
11. Keep official test answers hidden.
12. Rotate tasks and monitor contamination.
13. Standardize resource budgets and report scaling separately.
14. Repeat stochastic evaluations and report uncertainty.
15. Publish exact system configurations and raw non-sensitive results.
16. Verify official submissions and distinguish them from self-reported numbers.
17. Provide an appeals and correction process.
18. Monitor benchmark separability, saturation, and health.
19. Retire or replace invalid and saturated tasks.
20. Keep benchmark governance independent of any single submitter.

---
