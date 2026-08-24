# Part XV — Decision rules

## 63. Launch gates

Do not launch an official leaderboard until:

- the measurement claim is public;
- divisions are defined;
- at least three candidate systems have completed the full pipeline;
- human baselines exist;
- task ambiguity has been independently reviewed;
- graders have been adversarially tested;
- automated judges have a validated judge benchmark;
- uncertainty methods are predeclared;
- sandboxing is verified;
- submission and appeals procedures are tested;
- governance and conflicts are public;
- benchmark-health metrics meet launch thresholds.

## 64. Stopping rules

Pause or invalidate an official round when:

- hidden answers leak;
- environment isolation fails;
- a grader has a systematic exploit;
- a material scoring bug is discovered;
- task validity falls below the program threshold;
- official candidate configurations cannot be reproduced;
- conflicts compromise adjudication;
- the benchmark no longer supports its stated claims.

## 65. The standard for success

LedgerBench succeeds when it becomes useful to all of these groups:

- researchers seeking diagnostic signals;
- developers comparing agent architectures;
- accounting leaders evaluating systems;
- auditors and control teams assessing boundaries;
- buyers distinguishing evidence from marketing;
- policymakers understanding practical capability;
- practitioners contributing representative work;
- model providers tracking progress.

The benchmark should make it harder to make vague claims and easier to produce reproducible evidence.

---

# Conclusion

The benchmark’s central innovation should not be a novel score.

It should be the combination of:

- a defensible accounting-work sampling frame;
- realistic stateful environments;
- actual human baselines;
- executable accounting checks;
- qualified expert review;
- hard authority gates;
- standardized and open divisions;
- hidden rotating evaluations;
- explicit uncertainty;
- verified submissions;
- independent governance; and
- continuous benchmark-health measurement.

That combination would make LedgerBench not merely an accounting benchmark, but the measurement infrastructure for accounting agents.

---

# Source program references

- MLCommons, **MLPerf Submission Rules**, **Training Rules**, and **Results Messaging Guidelines**.
- Bommasani, R. et al., **Holistic Evaluation of Language Models (HELM)**, 2023.
- Srivastava, A. et al., **Beyond the Imitation Game: Quantifying and Extrapolating the Capabilities of Language Models**, arXiv:2206.04615.
- Jimenez, C. et al., **SWE-bench: Can Language Models Resolve Real-World GitHub Issues?**, arXiv:2310.06770.
- OpenAI and SWE-bench authors, **SWE-bench Verified**, 2024–2025.
- Mialon, G. et al., **GAIA: A Benchmark for General AI Assistants**, arXiv:2311.12983.
- Zhou, S. et al., **WebArena**, arXiv:2307.13854.
- Xie, T. et al., **OSWorld**, arXiv:2404.07972.
- Starace, G. et al., **PaperBench**, arXiv:2504.01848.
- Chan, J. S. et al., **MLE-bench**, arXiv:2410.07095.
- Wijk, H. et al., **RE-Bench**, arXiv:2411.15114.
- Kwa, T. et al., **Measuring AI Ability to Complete Long Tasks**, 2025.
- Kiela, D. et al., **Dynabench**, arXiv:2104.14337.
- White, C. et al., **LiveBench**, arXiv:2406.19314.
- Chiang, W. et al., **Chatbot Arena**, arXiv:2403.04132.
- NIST, **AI Test, Evaluation, Verification, and Validation**, **NIST AI 800-3**, **TEVV-Athlon**, and **Conformance Testing** guidance.
