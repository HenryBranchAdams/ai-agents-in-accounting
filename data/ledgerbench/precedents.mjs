export default {
  "precedents": [
    {
      "id": "mlperf",
      "name": "MLPerf / MLCommons",
      "source": "https://github.com/mlcommons/policies/blob/master/submission_rules.adoc",
      "practice_adopted": "Separate standardized and open divisions, formal rounds, compliance checks, reviewed results, and restrictions on benchmark-specific behavior."
    },
    {
      "id": "helm",
      "name": "HELM",
      "source": "https://arxiv.org/abs/2211.09110",
      "practice_adopted": "Define a taxonomy and desired coverage before scenarios; publish multiple metrics, raw results, and coverage gaps."
    },
    {
      "id": "big-bench",
      "name": "BIG-bench",
      "source": "https://arxiv.org/abs/2206.04615",
      "practice_adopted": "Community task contribution, broad participation, human baselines, and tasks intended to expose frontier gaps."
    },
    {
      "id": "swe-bench",
      "name": "SWE-bench and SWE-bench Verified",
      "source": "https://arxiv.org/abs/2310.06770",
      "practice_adopted": "Authentic work, executable end-state checks, containerized environments, professional annotation, conservative ambiguity filtering, and reproducibility."
    },
    {
      "id": "gaia",
      "name": "GAIA",
      "source": "https://arxiv.org/abs/2311.12983",
      "practice_adopted": "Ordinary human-solvable tasks that require robust tool use and hidden official answers."
    },
    {
      "id": "webarena",
      "name": "WebArena",
      "source": "https://arxiv.org/abs/2307.13854",
      "practice_adopted": "Stateful realistic environments, reproducible initial states, execution-based evaluation, and human baselines."
    },
    {
      "id": "osworld",
      "name": "OSWorld",
      "source": "https://arxiv.org/abs/2404.07972",
      "practice_adopted": "Cross-application agent tasks, environment setup, state inspection, and execution evaluation."
    },
    {
      "id": "paperbench",
      "name": "PaperBench",
      "source": "https://arxiv.org/abs/2504.01848",
      "practice_adopted": "Hierarchical rubrics, domain-author participation, thousands of gradable subcriteria, and separate judge evaluation."
    },
    {
      "id": "re-bench",
      "name": "RE-Bench",
      "source": "https://arxiv.org/abs/2411.15114",
      "practice_adopted": "Direct comparison with expert humans under resource budgets and long-horizon tasks."
    },
    {
      "id": "metr-long-tasks",
      "name": "METR long-task evaluations",
      "source": "https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/",
      "practice_adopted": "Calibrate task difficulty in human time and publish reliability curves rather than only task averages."
    },
    {
      "id": "dynabench",
      "name": "Dynabench",
      "source": "https://arxiv.org/abs/2104.14337",
      "practice_adopted": "Human-and-model-in-the-loop failure harvesting and dynamic task creation."
    },
    {
      "id": "livebench",
      "name": "LiveBench",
      "source": "https://arxiv.org/abs/2406.19314",
      "practice_adopted": "Fresh, regularly updated tasks and contamination-aware releases."
    },
    {
      "id": "chatbot-arena",
      "name": "Chatbot Arena",
      "source": "https://arxiv.org/abs/2403.04132",
      "practice_adopted": "Blinded randomized pairwise comparison with statistical uncertainty for subjective quality, used only after correctness gates."
    },
    {
      "id": "nist-tevv",
      "name": "NIST TEVV and conformance guidance",
      "source": "https://www.nist.gov/itl/ai-risk-management-framework/ai-test-evaluation-validation-and-verification-tevv",
      "practice_adopted": "Context-specific measurement, explicit requirements, repeatable procedures, impartial testing, and uncertainty discipline."
    }
  ],
  "provenance": {
    "publisher": "Accounting Agents contributors",
    "annotation_type": "Original benchmark-program design informed by the cited primary benchmark programs and official guidance.",
    "review_process": "Maintainer review; Preview status; no independent measurement-science or accounting-practice board approval has yet been recorded."
  },
  "licenses": {
    "program_record_and_factual_metadata": "CC0-1.0",
    "original_explanatory_content": "CC-BY-4.0",
    "schemas_and_software": "MIT",
    "external_sources": "Remain subject to their publishers' terms."
  }
};
