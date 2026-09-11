import fs from "node:fs";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

export const hash = value => createHash("sha256").update(value).digest("hex");
export const read = file => JSON.parse(fs.readFileSync(file, "utf8"));
export const corpusRecords = () => fs.readdirSync("data/corpus").sort().flatMap(file => read(`data/corpus/${file}`));
export const corpusHash = records => hash(JSON.stringify([...records].sort((a, b) => a.id.localeCompare(b.id))));

// These rules propose associations from explicit metadata. They do not assess
// applicability or source quality, or pass parent-industry credit to children.
const questionRules = {
  "reporting-basis": "reporting basis|accounting polic|authoritative research|fact.pattern intake|technical.accounting memorand|accounting scope",
  "ledger-close": "journal.entr|accrual|cutoff|period.close|close orchestration|ledger reconciliation|record to report|balance.sheet reconciliation",
  estimates: "estimat|uncertainty|sensitivit",
  presentation: "financial.statement|disclosure|digital filing|XBRL|call report|statutory.*report|reporting taxonom",
  "foreign-currency": "foreign.exchange|foreign.currency|remeasurement|currency translation",
  "policy-changes-errors": "accounting changes|method changes|new.standard|transition|correction of errors|standard.*adoption",
  "events-going-concern": "subsequent events|going concern",
  consolidation: "consolidation|consolidat|reporting perimeter|noncontrolling",
  revenue: "revenue|customer.*contract|payment applications|billing|performance obligations",
  "project-wip": "\\bWIP\\b|work in pro(?:gress|cess)|job.cost|estimate.to.complete|contract costs|contract losses|change orders",
  "purchasing-payables": "payables?|invoice|procure to pay|purchase.order|three.way match|expense.report|unrecorded.liabilit|vendor.master|vendor onboarding",
  "receivables-credit": "receivables?|credit.loss|retainage|collections support|write.offs",
  "cash-settlement": "cash application|cash.position|cash settlement|bank reconciliation|payment|treasury and cash|bank.account",
  inventory: "inventory|inventories|cost.of.goods|cost of sales|obsolescence",
  "capital-assets": "fixed.asset|capital.asset|depreciation|construction in progress|capitalization|tangible property|equipment",
  leases: "\\bleases?\\b|lease.accounting|lessee|lessor",
  "intangibles-software": "intangible|software.*cost|implementation costs|research expenditure|cloud computing arrangement",
  payroll: "payroll|labor costing|worker classification|prevailing wage",
  benefits: "employee benefits|pension|retirement arrangement",
  debt: "\\bdebt\\b|covenant|borrowing|financing costs|surety",
  equity: "\\bequity\\b|capital instruments|redemption|convertible",
  "share-compensation": "share.based compensation|stock.based compensation|equity awards",
  investments: "investment accounting|financial assets|investment.*measurement",
  derivatives: "derivative|hedging|hedge accounting",
  "valuation-impairment": "fair.value|impairment|valuation support",
  "digital-assets": "crypto|digital assets|tokenized",
  "income-tax": "income.tax|tax.provision|uncertain tax|apportionment",
  "indirect-tax": "indirect.tax|sales.*tax|use tax|value.added.tax|VAT|excise|customs",
  "tax-returns": "tax.return|information.return|Form 990|Form 8697|tax.filing",
  "international-tax": "transfer.pricing|cross.border tax|international tax|permanent establishment",
  "tax-methods": "tax methods|accounting method|book.tax|long.term.*tax|construction tax",
  "business-combinations": "acquisition|business combination|joint venture",
  "related-parties": "related.part|intercompany|common.control|related.entity",
  provisions: "provisions|contingenc|warranties|guarantees|claims|liens|payment bonds",
  "insurance-policyholder": "insurance.*recover|wrap.up|premium audit|construction insurance",
  "restructuring-distress": "restructur|insolvency|liquidation|discontinued operations",
  environmental: "environmental obligation|remediation|emissions|asset.retirement|carbon credit",
  "grants-contributions": "grants|contributions|restricted resources|federal awards|transfer expenses|charity accounting|public.sector and charity",
  "government-funds": "government funds|budgetary reporting|GASB|interfund|public.sector and charity",
  "federal-sovereign": "FASAB|SFFAS|sovereign|federal spending|budget authority",
  insurer: "IFRS 17|insurance contracts|insurers|reinsurance|NAIC|Solvency II",
  "credit-intermediation": "lending|deposits|loan origination|bank accounting|credit.unions|Call Report|FR Y.9C",
  "funds-custody": "custody|fiduciary|fund accounting|client.asset",
  "rate-regulation": "rate.regulat|regulated cost recovery|FERC",
  "natural-resources": "biological|extractive|depletion|harvest|exploration costs",
  reimbursement: "reimbursement|Medicare|hospital cost.report|provider cost.report|HCRIS",
  "licensed-content": "royalties|licensed content|rights portfolio|minimum guarantees",
  "cost-allocation": "cost allocation|job.cost|allowable costs|contract costs|cost principles|internal charges|labor costing|construction.*cost",
  planning: "forecast|budgets|budgeting|financial planning|cash forecasting",
  performance: "profitability|unit economics|margin|variance analysis|backlog|performance measures|non.GAAP",
  "audit-assertions": "audit.evidence|audit.assertion|substantive|PBC|population completeness|evidence packaging|financial.statement audit",
  "controls-fraud": "fraud|internal.control|ICFR|control.testing|control.performance|management.review control|walkthrough|deficiency|segregation",
  "compliance-assurance": "certified payroll|public works|public construction|Davis.Bacon|special.purpose assurance|SOC for|compliance audit|preaward accounting",
  "professional-governance": "professional dut|independence|ethics|quality.management|engagement governance|competence",
  "data-lineage": "data.lineage|reconcil|provenance|data quality|population completeness|ledger tie|evidence packaging",
  interfaces: "interoperability|schema|taxonomy|API|MCP|ISO 20022|FOCUS|electronic filing|data model|document extraction",
  security: "security|privacy|access control|prompt.injection|HIPAA|cyber|identity|confidentiality|PCI Data",
  "agent-design": "agent architecture|agent design|reasoning|retrieval|tool.use|orchestration|planning agents|multi.agent",
  "human-authority": "human.review|approval|authorization|action authority|sign.off|signatory|payment release|posting",
  evaluation: "evaluat|benchmark|experiment|transfer limits|research methods|synthetic",
  "deployment-evidence": "deployment|case.study|accelerated finance|incident|real.world performance|production evidence",
  "reuse-rights": "reuse rights|licens|copyright|training data|provenance|dataset",
};
const topicRules = {
  "Agent engineering": ["q-agent-design"], "Agent design": ["q-agent-design"],
  "Agent interoperability": ["q-interfaces"], "Data and interoperability": ["q-interfaces"],
  "Security and identity": ["q-security"], "Evaluation and evidence": ["q-evaluation"],
  "Research methods": ["q-evaluation"], "Controls and governance": ["q-controls-fraud"],
};
const industryTags = {
  "banking-credit-unions": "522", "insurance": "524", "healthcare-life-sciences": "62",
  "asset-management-capital-markets": "523", manufacturing: "31-33", "retail-consumer": "44-45",
};

export function generateMappings(records = corpusRecords()) {
  const topology = read("data/coverage/topology.json");
  const overrides = read("data/coverage/mapping-overrides.json");
  const mappings = records.map(record => {
    const questions = new Map();
    const add = (id, field, matched, rule) => {
      const entry = questions.get(id) || { question_id: id, status: "candidate", basis: [] };
      entry.basis.push({ field, matched, rule }); questions.set(id, entry);
    };
    for (const [name, pattern] of Object.entries(questionRules)) {
      const re = new RegExp(`(?:${pattern})`, "i");
      // A title match has less incidental context than a full-text match.
      const match = record.title.match(re);
      if (match) add(`q-${name}`, "/title", match[0], `title:${name}`);
    }
    record.topics.forEach((topic, index) => (topicRules[topic] || []).forEach(id => add(id, `/topics/${index}`, topic, "topic-association")));
    const override = overrides.records[record.id];
    for (const id of override?.question_ids || []) add(id, override.basis_field, override.reason, "editorial-association");
    for (const id of override?.exclude_question_ids || []) questions.delete(id);
    for (const id of override?.reviewed_question_ids || []) {
      const entry = questions.get(id);
      if (!entry || !override.review_note || !override.reviewed_at) throw new Error(`A reviewed mapping needs an existing association, review_note and reviewed_at: ${record.id}`);
      entry.status = "reviewed";
      entry.basis.push({ field: override.basis_field, matched: `${override.reviewed_at}: ${override.review_note}`, rule: "editorial-review" });
    }
    let industries = [];
    record.industries.forEach((tag, index) => {
      let code = industryTags[tag];
      if (tag === "construction-real-estate" && (/construction|contractor|WIP|work in pro|job.cost|subcontractor/i.test(record.title) || record.id.startsWith("src_construction_"))) code = "23";
      if (record.id === "src_fercacct") code = "22";
      if (code) industries.push({ industry_code: code, status: "candidate", basis: [{ field: `/industries/${index}`, matched: tag, rule: "legacy-tag-crosswalk" }] });
    });
    if (override?.industry_codes) industries = override.industry_codes.map(code => ({ industry_code: code, status: "candidate", basis: [{ field: override.basis_field, matched: override.reason, rule: "editorial-association" }] }));
    for (const code of override?.reviewed_industry_codes || []) {
      const entry = industries.find(i => i.industry_code === code);
      if (!entry || !override.review_note || !override.reviewed_at) throw new Error(`A reviewed mapping needs an existing association, review_note and reviewed_at: ${record.id}`);
      entry.status = "reviewed";
      entry.basis.push({ field: override.basis_field, matched: `${override.reviewed_at}: ${override.review_note}`, rule: "editorial-review" });
    }
    const shared = override?.industry_scope === "shared-context" || (override?.industry_scope !== "unassigned" && (record.industries.includes("general") || ["src_asu201815", "src_focusv14", "src_asu202308", "src_secsab122"].includes(record.id)));
    return {
      record_id: record.id,
      question_mappings: [...questions.values()].sort((a,b) => a.question_id.localeCompare(b.question_id)),
      industry_scope: industries.length ? "specific" : shared ? "shared-context" : "unassigned",
      industry_mappings: industries,
      note: industries.length ? "Candidate association with this industry scope; applicability and depth are not inferred." : shared ? "Shared context; no industry-specific coverage credit." : "Industry scope has not been assigned. This is not evidence of irrelevance.",
    };
  }).sort((a,b) => a.record_id.localeCompare(b.record_id));
  return {
    schema_version: "1.0.0", mapping_version: overrides.mapping_version,
    topology_version: topology.topology_version, corpus_version: read("data/catalog.json").corpus_version,
    generated_at: overrides.updated_at, corpus_sha256: corpusHash(records),
    rules_sha256: hash(fs.readFileSync("scripts/coverage-mappings.mjs")),
    overrides_sha256: hash(fs.readFileSync("data/coverage/mapping-overrides.json")),
    method: "Deterministic title/topic associations, conservative industry crosswalk, and explicit editorial additions. All initial links are candidates; source review status is unchanged.",
    mappings,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const data = generateMappings();
  fs.writeFileSync("data/coverage/record-mappings.json", JSON.stringify(data, null, 2) + "\n");
  console.log(`Mapped ${data.mappings.length} records; ${data.mappings.filter(r => r.question_mappings.length).length} have candidate question associations.`);
}
