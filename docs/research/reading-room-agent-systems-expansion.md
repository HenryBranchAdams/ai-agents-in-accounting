# Reading room expansion: agent systems, reliability, and human oversight

**Research cutoff:** 2026-08-23  
**Purpose:** expand the Accounting Agents reading room with primary research, open standards, and independent technical analysis that transfers to accounting-agent design without pretending that results from software, customer service, aviation, or general knowledge work are accounting evidence.

## Recommendation at a glance

- Add **25 net-new sources** to the catalog. Feature **16** of them in the reading room and keep nine as supporting depth.
- Hold **two very recent preprints** in a watch queue until their status or contribution stabilizes.
- Add two shelves: **Human oversight and automation** and **Evidence, provenance, and production readiness**. The current shelves do not give these subjects enough room.
- Expand the existing **Agent systems and evaluation**, **Security and deployment boundaries**, and **Work and adoption** shelves with the sources below.
- Keep the reading room curated. The full source index can hold every credible record; the reading room should contain the few sources that change how a practitioner designs or evaluates a system.
- Put publication status, transfer limitation, and access beside every title. A benchmark score, preprint, vendor-authored framework, and peer-reviewed field study should never look interchangeable.

### Priority key

- **Feature now:** index and place in the reading room.
- **Index now:** add to the source catalog; link from a shelf only as supporting depth.
- **Watch:** credible and relevant, but too recent or overlapping to feature now.

## Feature now (16)

| Source, status, canonical URL | Evidence role | Transfer to accounting agents | Limitation | Access | Proposed topic · kind · shelf |
|---|---|---|---|---|---|
| [AI Agents That Matter](https://openreview.net/forum?id=Zy4uFzMviZ) — Kapoor et al.; *Transactions on Machine Learning Research*, 2025; peer reviewed | Evaluation-method paper. Separates model evaluation from downstream evaluation and treats cost, holdouts, reproducibility, and shortcuts as first-class concerns. | Accounting-agent tests should measure correctness, cost, repeatability, control adherence, and generalization on held-out entities and periods, not one favorable run. | Most demonstrations are code, QA, and web benchmarks. It does not validate an accounting workflow or prescribe an assurance standard. | Open paper, code, and [author project page](https://agents.cs.princeton.edu/). | Evaluation and evidence · Research paper · Agent systems and evaluation |
| [τ-bench: A Benchmark for Tool-Agent-User Interaction in Real-World Domains](https://proceedings.iclr.cc/paper_files/paper/2025/hash/1b126cc38b8638e07bef37e7b2bb72bf-Abstract-Conference.html) — Yao et al.; ICLR 2025; peer reviewed | Stateful tool-use benchmark with domain policies, simulated users, database-state scoring, and the `pass^k` consistency measure. | The pattern maps well to policy-bound accounting actions: test the resulting ledger or workflow state, repeat runs, and score whether policy was followed throughout. | Retail and airline domains are not accounting. The user is simulated, and benchmark policies are cleaner than real entity policy. | Open paper and code. | Evaluation and evidence · Research paper · Agent systems and evaluation |
| [ToolSandbox: A Stateful, Conversational, Interactive Evaluation Benchmark for LLM Tool Use Capabilities](https://aclanthology.org/2025.findings-naacl.65/) — Lu et al.; Findings of NAACL 2025; peer reviewed | Evaluates state dependencies, canonical tool arguments, multi-turn interaction, and recognition of insufficient information. | These are core failure surfaces for ERP and spreadsheet agents: sequencing dependent steps, normalizing account or vendor fields, and pausing when support is incomplete. | Synthetic tool environment; performance depends on the tool contracts and simulator. It does not test posting, close, or audit controls. | Open paper, data, and evaluation code. | Evaluation and evidence · Research paper · Agent systems and evaluation |
| [WorkArena: How Capable Are Web Agents at Solving Common Knowledge Work Tasks?](https://proceedings.mlr.press/v235/drouin24a.html) — Drouin et al.; ICML 2024; peer reviewed | Enterprise-software benchmark covering forms, lists, knowledge bases, catalogs, dashboards, and menus with state-based validation. | It is a useful proxy for agents operating through ERP and finance interfaces when APIs are absent, and shows why apparently simple UI work can remain brittle. | ServiceNow is not an accounting system; the tasks are mostly atomic, and benchmark success does not establish financial correctness or control compliance. | Open paper and [project code](https://github.com/ServiceNow/WorkArena). | Evaluation and evidence · Research paper · Agent systems and evaluation |
| [TheAgentCompany: Benchmarking LLM Agents on Consequential Real World Tasks](https://papers.nips.cc/paper_files/paper/2025/hash/0d744742f6fac4d1134c019b7cef3c8a-Abstract-Datasets_and_Benchmarks_Track.html) — Xu et al.; NeurIPS 2025 Datasets and Benchmarks; peer reviewed | Reproducible workplace simulation spanning web, code, office tools, coworker communication, administration, and finance tasks. | It tests sustained work across several systems and handoffs, closer to close or audit coordination than single-turn benchmarks. | The environment models a small software company, not a finance function. Many tasks are graded with benchmark-specific checks and some model-based evaluation. | Open paper, code, and environment. | Evaluation and evidence · Research paper · Agent systems and evaluation |
| [AgentDojo: A Dynamic Environment to Evaluate Prompt Injection Attacks and Defenses for LLM Agents](https://proceedings.neurips.cc/paper_files/paper/2024/hash/97091a5177d8dc64b1da8bf3e1f6fb54-Abstract-Datasets_and_Benchmarks_Track.html) — Debenedetti et al.; NeurIPS 2024 Datasets and Benchmarks; peer reviewed | Dynamic security benchmark with 97 realistic tasks and 629 test cases involving tool use over untrusted content. | Email, invoices, contracts, PDFs, bank portals, and retrieved support are all plausible injection channels for accounting agents. AgentDojo gives teams an executable pattern for testing both task utility and security properties. | The environments are simplified and the attacks and defenses evolve. Passing AgentDojo is not proof that a deployed accounting agent is secure. | Open paper, supplemental material, and code. | Security and identity · Research paper · Security and deployment boundaries |
| [Not What You've Signed Up For: Compromising Real-World LLM-Integrated Applications with Indirect Prompt Injection](https://doi.org/10.1145/3605764.3623985) — Greshake et al.; ACM AISec 2023; peer reviewed; best paper | Seminal threat analysis showing that instructions embedded in retrieved data can influence tools and application behavior without direct attacker access. | It supplies the causal threat model behind malicious text hidden in invoices, email, web pages, source documents, or code comments. | Demonstrations used early LLM-integrated systems. It establishes the attack class, not the effectiveness of current defenses or incidence in accounting. | DOI record; [open preprint](https://arxiv.org/abs/2302.12173) and [author publication page](https://cispa.de/en/research/publications/77133-not-what-you-ve-signed-up-for-compromising-real-world-llm-integrated-applications-with-indirect-prompt-injection). | Security and identity · Research paper · Security and deployment boundaries |
| [Defeating Prompt Injections by Design](https://arxiv.org/abs/2503.18813) — Debenedetti et al.; revised June 2025; preprint with open implementation | Introduces CaMeL, which separates control flow from untrusted data and applies capability-based policies to tool calls. | It is a concrete architecture for keeping retrieved accounting evidence from rewriting an agent's instructions or authorizing data exfiltration. | Preprint, evaluated mainly in AgentDojo. Its guarantees depend on correct policy, data-flow extraction, implementation, and threat-model assumptions; utility and token overhead remain. | Open paper and [research code](https://github.com/google-research/camel-prompt-injection). | Security and identity · Research paper · Security and deployment boundaries |
| [When combinations of humans and AI are useful: A systematic review and meta-analysis](https://www.nature.com/articles/s41562-024-02024-1) — Vaccaro, Almaatouq, and Malone; *Nature Human Behaviour*, 2024; peer reviewed | Meta-analysis of human–AI performance across tasks, systems, and populations. It tests complementarity rather than assuming it. | Supports comparing human alone, agent alone, and combined workflows. A review step should earn its place empirically rather than serve as a ritual label. | The underlying studies are heterogeneous and mostly pre-agentic. Publication bias and domain mix constrain direct transfer to accounting. | Open access. | Evaluation and evidence · Research paper · Human oversight and automation |
| [Humans and Automation: Use, Misuse, Disuse, Abuse](https://doi.org/10.1518/001872097778543886) — Parasuraman and Riley; *Human Factors*, 1997; peer reviewed | Foundational synthesis of overreliance, underuse, monitoring failure, false alarms, trust, workload, and automation imposed without attention to human performance. | Gives accounting teams a durable vocabulary for automation bias, alarm fatigue, reviewer disengagement, and control design that makes people nominally responsible but practically ineffective. | Predates modern AI and draws heavily from safety-critical automation. It is a design foundation, not direct evidence about LLM agents. | Abstract open; full article access varies. | Controls and governance · Research paper · Human oversight and automation |
| [A model for types and levels of human interaction with automation](https://doi.org/10.1109/3468.844354) — Parasuraman, Sheridan, and Wickens; *IEEE Transactions on Systems, Man, and Cybernetics*, 2000; peer reviewed | Framework distinguishing automation of information acquisition, analysis, decision/action selection, and action implementation at different autonomy levels. | Directly supports granular authority design: an agent can gather evidence, analyze, recommend, or execute at different levels rather than being classified simply as “human in the loop.” | Conceptual human-factors model, not an agent-control standard. Local risk, reliability, and consequence should determine the level. | Abstract open; article may require subscription. | Controls and governance · Research paper · Human oversight and automation |
| [PROV-O: The PROV Ontology](https://www.w3.org/TR/prov-o/) — W3C; Recommendation, 2013 | Stable, interoperable model for entities, activities, agents, derivation, attribution, plans, revisions, and primary sources. | Provides a vendor-neutral vocabulary for connecting source files, extracts, calculations, prompts, tool actions, workpaper versions, agents, and reviewers into an evidence lineage. | An ontology does not itself create complete, truthful, immutable, or legally sufficient records. A narrower accounting profile and storage policy are still needed. | Open standard, examples, and implementation report. | Agent engineering · Rule or standard · Evidence, provenance, and production readiness |
| [The Protection of Information in Computer Systems](https://doi.org/10.1109/PROC.1975.9939) — Saltzer and Schroeder; *Proceedings of the IEEE*, 1975; peer reviewed tutorial | Foundational security-design principles: fail-safe defaults, complete mediation, separation of privilege, least privilege, and usable controls. | These principles are a stronger base for tool permissions and segregation of duties than relying on model instructions to constrain access. | General computer-security architecture from 1975. It does not address probabilistic models, prompt injection, or modern identity protocols directly. | DOI access varies; [open author-rendered copy](https://web.mit.edu/Saltzer/www/publications/protection/). | Security and identity · Research paper · Evidence, provenance, and production readiness |
| [The 2025 AI Agent Index: Documenting Technical and Safety Features of Deployed Agentic AI Systems](https://doi.org/10.1145/3805689.3806728) — Staufer et al.; ACM FAccT 2026; peer reviewed | Structured study of 30 deployed agents across architecture, autonomy, ecosystem interaction, safety, evaluation, and transparency fields. | Gives accounting buyers and auditors a disclosure checklist and shows why model-level documentation is insufficient for an agent assembled from models, tools, data, and orchestration. | Based on public information and developer correspondence, not independent penetration testing or outcome evaluation. It is a dated market snapshot. | Open [interactive index, methods, and data](https://aiagentindex.mit.edu/). | Evaluation and evidence · Research paper · Work and adoption |
| [The Productivity J-Curve: How Intangibles Complement General Purpose Technologies](https://doi.org/10.1257/mac.20180386) — Brynjolfsson, Rock, and Syverson; *American Economic Journal: Macroeconomics*, 2021; peer reviewed | Economic model and empirical work on complementary process, software, business-model, and human-capital investments around general-purpose technologies. | Explains why dropping an agent into an unchanged close or audit process may show little value: workflow redesign, data quality, controls, training, and measurement are part of the investment. | Macro and historical evidence, not a causal estimate for generative AI or a specific finance deployment. | Abstract open; published article access varies; [open NBER version](https://www.nber.org/papers/w25148). | Evaluation and evidence · Research paper · Work and adoption |
| [The ML Test Score: A Rubric for ML Production Readiness and Technical Debt Reduction](https://research.google/pubs/the-ml-test-score-a-rubric-for-ml-production-readiness-and-technical-debt-reduction/) — Breck et al.; IEEE Big Data 2017; peer reviewed | Twenty-eight concrete tests and monitoring needs covering data, models, infrastructure, serving, and production behavior. | A useful ancestor for an “agent production-readiness score” covering fixtures, data contracts, tool mocks, policy tests, canaries, drift, incidents, and rollback. | Written for predictive ML, not generative agents. It needs extensions for trajectories, tool side effects, approvals, prompt injection, cost, and evidence lineage. | Open author page and paper; DOI `10.1109/BigData.2017.8258038`. | Evaluation and evidence · Research paper · Evidence, provenance, and production readiness |

## Index now, feature selectively (9)

| Source, status, canonical URL | Evidence role and accounting transfer | Limitation and access | Proposed topic · kind · shelf |
|---|---|---|---|
| [AI Adoption and System-Wide Change](https://www.nber.org/papers/w28811) — Agrawal, Gans, and Goldfarb; NBER working paper, 2021 | Formal analysis of interacting tasks, modularity, coordination, and why task-level feasibility does not equal organization-level adoption. Useful for designing agents around end-to-end close dependencies rather than isolated demos. | Working paper and theoretical model; not an observed accounting implementation. Open. | Evaluation and evidence · Research paper · Work and adoption |
| [τ²-Bench: Evaluating Conversational Agents in a Dual-Control Environment](https://arxiv.org/abs/2506.07982) — Barres et al.; ICML 2026 oral | Extends tool-agent evaluation so both user and agent can act in a shared environment. This maps to controlled workflows in which a human supplies evidence, authorizes an action, or performs the step the agent cannot. | Telecom domain and simulated user; coordination results need accounting-specific replication. Open paper and code. | Evaluation and evidence · Research paper · Agent systems and evaluation |
| [Why Do Multi-Agent LLM Systems Fail?](https://arxiv.org/abs/2503.13657) — Cemri et al.; revised 2025; preprint and open dataset | Empirical taxonomy of specification, inter-agent alignment, verification, and termination failures across multi-agent frameworks. Useful before adding specialist agents to accounting workflows. | Preprint; studied software, math, and general agent frameworks. Trace labeling and the LLM annotator do not establish causal fixes. Open. | Evaluation and evidence · Research paper · Agent systems and evaluation |
| [Ironies of Automation](https://doi.org/10.1016/0005-1098(83)90046-8) — Bainbridge; *Automatica*, 1983; peer reviewed brief paper | Explains why automating routine work can leave humans responsible for rare, difficult conditions while eroding the skill and context needed to intervene. Directly relevant to exception-only accounting roles and reviewer readiness. | Industrial process-control context from 1983; conceptual transfer, not LLM evidence. DOI article may require subscription; an [IFAC-hosted copy](https://tc.ifac-control.org/4/1/newsletter/ironies-of-automation/view) is open. | Controls and governance · Research paper · Human oversight and automation |
| [The Principles and Limits of Algorithm-in-the-Loop Decision Making](https://doi.org/10.1145/3359152) — Green and Chen; *Proceedings of the ACM on Human-Computer Interaction*, 2019; peer reviewed | Controlled study showing why evaluating a model alone is insufficient when people must interpret, calibrate, and act on its advice. Strong support for testing the whole preparer-reviewer-agent system. | Lending and pretrial prediction tasks, not accounting; interface conditions and participants limit transfer. Abstract open; article access varies. | Evaluation and evidence · Research paper · Human oversight and automation |
| [Automation Bias: Decision Making and Performance in High-Tech Cockpits](https://doi.org/10.1207/s15327108ijap0801_3) — Mosier et al.; *International Journal of Aviation Psychology*, 1998; peer reviewed | Direct evidence on omission and commission errors and on verification behavior around automated cues. Useful for reviewer training and independent-evidence controls. | Aviation simulation and small professional population; accountability findings include post hoc analysis. Abstract open; full article access varies. | Controls and governance · Research paper · Human oversight and automation |
| [Hidden Technical Debt in Machine Learning Systems](https://papers.nips.cc/paper/2015/hash/86df7dcfd896fcaf2674f757a2463eba-Abstract.html) — Sculley et al.; NeurIPS 2015; peer reviewed | System-level account of data dependencies, feedback loops, undeclared consumers, configuration debt, and boundary erosion. Maps cleanly to agents embedded across spreadsheets, ERPs, close tools, and workpapers. | Predictive-ML systems rather than LLM agents; qualitative engineering analysis, not an accounting outcome study. Open. | Agent engineering · Research paper · Evidence, provenance, and production readiness |
| [Beyond Accuracy: Behavioral Testing of NLP Models with CheckList](https://aclanthology.org/2020.acl-main.442/) — Ribeiro et al.; ACL 2020 Best Paper; peer reviewed | Introduces capability-by-test matrices and invariance, directional, and minimum-functionality tests. A strong pattern for building accounting eval suites around expected behavior rather than aggregate accuracy. | NLP classifiers, not stateful tool agents; generated tests still require accounting experts and reliable oracles. Open paper and code. | Evaluation and evidence · Research paper · Evidence, provenance, and production readiness |
| [The Bitter Lesson](https://www.incompleteideas.net/IncIdeas/BitterLesson.html) — Rich Sutton; independent research essay, 2019 | Influential argument that general methods using computation, search, and learning tend to outlast hand-coded domain structure. It gives useful context for choosing where accounting rules should be executable constraints, retrieval context, tests, or learned behavior. | Argument from AI history, not a universal law or deployment study. It should not be used to dismiss accounting standards, controls, or domain-specific evaluation. Open. | Agent engineering · Thought piece · Start here or Agent systems and evaluation |

## Watch queue (2)

| Candidate | Why it matters | Why wait | Proposed mapping |
|---|---|---|---|
| [Holistic Agent Leaderboard: The Missing Infrastructure for AI Agent Evaluation](https://arxiv.org/abs/2510.11977) — Kapoor et al.; 2025 preprint | Standardized harness across models, scaffolds, and benchmarks, with shared traces and behavior analysis. It extends the concerns in *AI Agents That Matter* into evaluation infrastructure. | Very recent preprint and partly duplicative of *AI Agents That Matter* plus the catalog's existing reliability paper. Revisit after peer review or a stable public release. | Evaluation and evidence · Research paper · Agent systems and evaluation |
| [AI Agents May Always Fall for Prompt Injections](https://arxiv.org/abs/2605.17634) — Abdelnabi and Bagdasarian; May 2026 preprint | Challenges data-versus-instruction separation by framing attacks through contextual integrity and context-sensitive information flows. It is an important counterpoint to treating CaMeL or classifiers as a settled solution. | Very recent preprint with a strong title and broad impossibility framing. Index only after methods and claims receive more scrutiny or independent replication. | Security and identity · Research paper · Security and deployment boundaries |

## Reading-room placement

### Expand: Agent systems and evaluation

Feature these five first:

1. *AI Agents That Matter*
2. *τ-bench*
3. *ToolSandbox*
4. *WorkArena*
5. *TheAgentCompany*

Keep *τ²-Bench* and *Why Do Multi-Agent LLM Systems Fail?* as the “deeper” links beneath the shelf. Pair this group with the catalog's existing *Towards a Science of AI Agent Reliability*, METR long-task paper, WorkstreamBench, and finance-specific benchmarks. The new sources add evaluation design, interaction, enterprise UI, and workplace context without replacing the accounting tests.

### Expand: Security and deployment boundaries

Feature this three-source progression:

1. Greshake et al. establishes indirect prompt injection.
2. *AgentDojo* supplies an executable attack-and-defense benchmark.
3. *Defeating Prompt Injections by Design* supplies a capability and information-flow architecture, visibly labeled a preprint.

Keep the existing NCSC adoption warning, OWASP agent guidance, MCP security guidance, and Willison's lethal-trifecta essay. They serve different roles: authority, control catalog, protocol guidance, and practitioner framing.

### New: Human oversight and automation

Feature four:

1. Vaccaro et al. — whether human–AI combinations actually improve performance.
2. Parasuraman and Riley — misuse, disuse, and automation abuse.
3. Parasuraman, Sheridan, and Wickens — types and levels of automation.
4. Bainbridge — what happens to the human role after routine work is automated.

Link Green and Chen and Mosier et al. as supporting experiments. This shelf should sit close to controls and deployment boundaries, not in a speculative “future of work” section.

### New: Evidence, provenance, and production readiness

Feature four:

1. W3C PROV-O — interoperable evidence lineage.
2. Saltzer and Schroeder — least privilege, complete mediation, and separation of privilege.
3. *The ML Test Score* — operational testing and monitoring.
4. *Hidden Technical Debt in Machine Learning Systems* — system dependencies and maintenance risk.

Link CheckList as a practical eval-design method. This shelf joins accounting evidence concepts to modern agent operations without inventing a proprietary “agent audit trail” vocabulary.

### Expand: Work and adoption

Feature:

1. *The 2025 AI Agent Index* — deployed-system transparency and disclosure.
2. *The Productivity J-Curve* — complementary investment and process redesign.

Link *AI Adoption and System-Wide Change* for readers designing across interacting close tasks. These sources explain adoption mechanics without leaning on vendor surveys.

## Deduplication and maintenance notes

The catalog and reading-room files were checked by title and canonical URL before this audit. None of the 27 candidates above is currently represented.

Do not add new records for these already-covered concepts:

- **Agent reliability:** retain `Towards a Science of AI Agent Reliability` (`src_0p4xhvf`). *AI Agents That Matter* adds evaluation design; it does not replace the reliability metrics paper.
- **Long-horizon work:** retain METR's long-task paper (`src_138oad7`) and WorkstreamBench (`src_15oku59`). WorkArena and TheAgentCompany add enterprise interaction and workplace scope rather than another time-horizon score.
- **Observability:** retain OpenAI's observability guide (`src_0ocni66`) and the OpenTelemetry generative-AI semantic conventions (`src_1px43va`). PROV-O adds interoperable evidence relationships; it should not be described as a trace transport.
- **Prompt injection guidance:** retain Willison's lethal-trifecta essay (`src_0c89fwp`), OWASP material, OpenAI's provider guidance, and the NCSC warning (`src_0nqqjyl`). The proposed papers supply the original attack research, a benchmark, and a system architecture.
- **Automation bias in audit:** retain IAASB's overreliance guidance. The human-factors papers explain the empirical and conceptual foundation; they are not competing professional requirements.
- **Accounting-specific human–AI evidence:** retain *Human + AI in Accounting* (`src_1sbtyzp`) and the accounting-judgment study. The cross-domain meta-analysis should carry an explicit transfer label.
- **Version policy:** use the peer-reviewed publisher page when available, and keep an open author or preprint link as access support. Do not create separate catalog records for the same study's arXiv and proceedings versions.

## Editorial rules for this expansion

1. **Separate capability from reliability.** A successful run, average benchmark score, or rising time horizon does not answer whether the workflow is consistent, robust, predictable, or safe.
2. **Score state and evidence, not prose alone.** Where possible, evaluate the changed system state, cited evidence, calculations, approvals, and policy compliance.
3. **Test the human–agent system.** Compare human alone, agent alone, and combined performance; measure reviewer detection, intervention, and skill retention.
4. **Treat retrieved content as untrusted.** Invoices, email, PDFs, web pages, and tool responses are data, not authority to alter the plan or permissions.
5. **Make authority granular.** Distinguish retrieval, analysis, recommendation, preparation, and execution. Apply least privilege and separation of privilege at the tool layer.
6. **Preserve provenance as structured data.** Record sources, transformations, tool actions, versions, responsible agents, and reviewers in a form that can be queried and exchanged.
7. **Label transfer honestly.** “Enterprise web benchmark,” “aviation human-factors study,” and “general agent preprint” must stay visible. Do not paraphrase them into accounting evidence.
8. **Keep the reading room finite.** Feature the sources that alter practice. Put supporting papers in the full source index and expose them through topic and kind filters.

## Method

Research used original publisher proceedings, journal DOI pages, standards bodies, NBER, author project pages, and open research artifacts. Generic vendor SEO, listicles, and secondary summaries were excluded. Cross-domain sources were admitted only when they supply a reusable method or failure model for accounting agents: state-based evaluation, repeated-run reliability, human reliance, prompt injection, least privilege, provenance, monitoring, or organization-level adoption.
