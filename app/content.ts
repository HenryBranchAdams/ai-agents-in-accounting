export type NavItem = {
  href: string;
  label: string;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const navGroups: NavGroup[] = [
  {
    label: "Learn",
    items: [
      { href: "/", label: "Overview" },
      { href: "/fundamentals", label: "Agent fundamentals" },
      { href: "/lifecycle", label: "Accounting lifecycle" },
      { href: "/coverage", label: "Coverage and gaps" },
      { href: "/authority", label: "Authority levels" },
    ],
  },
  {
    label: "Workflows",
    items: [
      { href: "/workflows", label: "All workflows" },
      { href: "/workflows/record-to-report", label: "Record to report" },
      { href: "/workflows/procure-to-pay", label: "Procure to pay" },
      { href: "/workflows/order-to-cash", label: "Order to cash" },
      { href: "/workflows/treasury-cash", label: "Treasury and cash" },
      { href: "/workflows/assets-inventory", label: "Assets and inventory" },
      { href: "/workflows/tax-regulatory", label: "Tax and regulatory" },
      { href: "/workflows/audit-icfr", label: "Audit and ICFR" },
      { href: "/workflows/technical-policy", label: "Technical and policy" },
    ],
  },
  {
    label: "Govern",
    items: [
      { href: "/control-model", label: "Accounting Agent Control Model" },
      { href: "/controls", label: "Controls and authority" },
      { href: "/sensitive-actions", label: "Sensitive actions" },
      { href: "/evidence-assurance", label: "Evidence and assurance" },
      { href: "/security-identity", label: "Security and identity" },
    ],
  },
  {
    label: "Apply",
    items: [
      { href: "/pilot", label: "Pilot checklist" },
      { href: "/packs", label: "Workflow packs" },
      { href: "/architecture", label: "System architecture" },
      { href: "/evaluation", label: "Evaluation and testing" },
      { href: "/operations", label: "Production operations" },
      { href: "/ecosystem", label: "Open agent ecosystem" },
    ],
  },
  {
    label: "Library",
    items: [
      { href: "/reading-room", label: "Reading room" },
      { href: "/resources", label: "Source library" },
      { href: "/templates", label: "Templates and checklists" },
      { href: "/glossary", label: "Glossary" },
      { href: "/machine-access", label: "Agent access" },
    ],
  },
  {
    label: "Lab",
    items: [
      { href: "/bench", label: "Core conformance suite" },
      { href: "/ledgerbench", label: "LedgerBench research program" },
    ],
  },
  {
    label: "Project",
    items: [
      { href: "/spec", label: "Public specification" },
      { href: "/methodology", label: "Methodology" },
      { href: "/changes", label: "Changes" },
      { href: "/open-source", label: "Open source" },
      { href: "/content-contract", label: "Content contract" },
    ],
  },
];

export const searchItems = [
  { href: "/", title: "Overview", category: "Learn", detail: "Coverage and execution boundary" },
  { href: "/fundamentals#definition", title: "Define an accounting agent", category: "Fundamentals", detail: "Objective, tools, evidence, and limits" },
  { href: "/fundamentals#patterns", title: "Compare operating patterns", category: "Fundamentals", detail: "Chat, copilot, workflow, and agent" },
  { href: "/fundamentals#work-loop", title: "Follow the work loop", category: "Fundamentals", detail: "Objective through review" },
  { href: "/lifecycle", title: "Map the accounting lifecycle", category: "Learn", detail: "Eight process families and sixty workflows" },
  { href: "/authority", title: "Set an authority level", category: "Learn", detail: "Explain, prepare, recommend, constrained execution, or human-only" },
  { href: "/workflows", title: "Review the workflow library", category: "Workflows", detail: "Sixty canonical accounting workflows" },
  { href: "/workflows/record-to-report/wf-r2r-bank-reconciliations", title: "Prepare a bank reconciliation", category: "Workflows", detail: "Inputs, procedures, checks, authority, output, and review" },
  { href: "/controls#support", title: "Separate support and authority", category: "Controls", detail: "Evidence, claims, judgment, and decisions" },
  { href: "/controls#authority", title: "Set the authority boundary", category: "Controls", detail: "Scope, tools, thresholds, actions, and stops" },
  { href: "/controls#control-design", title: "Design an agent-assisted control", category: "Controls", detail: "Performance and assessment" },
  { href: "/sensitive-actions", title: "Govern sensitive actions", category: "Govern", detail: "Posting, cash, filings, deletion, approval, and certification" },
  { href: "/evidence-assurance", title: "Evaluate evidence and assurance", category: "Govern", detail: "Provenance, reliability, contradiction, and assessment" },
  { href: "/security-identity", title: "Secure identity and tools", category: "Govern", detail: "Least privilege, segregation of duties, and zero trust" },
  { href: "/architecture#layers", title: "Separate system layers", category: "Apply", detail: "Skill, tool, policy, template, evaluator" },
  { href: "/architecture#record", title: "Keep a durable work record", category: "Apply", detail: "Evidence, approvals, state, and history" },
  { href: "/architecture#mcp", title: "Use MCP as an interface", category: "Apply", detail: "Tool interoperability and authorization" },
  { href: "/ecosystem", title: "Map the open agent ecosystem", category: "Apply", detail: "AGENTS.md, MCP, A2A, web interfaces, and accounting-domain contracts" },
  { href: "/pilot#steps", title: "Run a supervised pilot", category: "Apply", detail: "Scope, shadow, supervise, measure" },
  { href: "/pilot#measures", title: "Measure pilot quality", category: "Apply", detail: "Accuracy, exceptions, rework, and overrides" },
  { href: "/evaluation", title: "Evaluate agent workflows", category: "Apply", detail: "Normal, edge, adversarial, and regression cases" },
  { href: "/operations", title: "Operate agents in production", category: "Apply", detail: "Monitoring, changes, incidents, and recovery" },
  { href: "/templates", title: "Use templates and checklists", category: "Library", detail: "Fourteen practical implementation artifacts" },
  { href: "/glossary", title: "Read the glossary", category: "Library", detail: "Accounting-agent operating vocabulary" },
  { href: "/resources", title: "Browse the source library", category: "Library", detail: "Search standards, guidance, research, and implementations" },
  { href: "/reading-room", title: "Enter the reading room", category: "Library", detail: "Curated papers, essays, reports, and practice perspectives" },
  { href: "/machine-access", title: "Connect an agent", category: "Library", detail: "Agent instructions, Markdown context, resource API, and OpenAPI contract" },
  { href: "/packs", title: "Use a workflow pack", category: "Apply", detail: "Synthetic fixtures, reference outputs, and hard gates" },
  { href: "/bench", title: "Run the Core conformance suite", category: "Lab", detail: "Thirty public cases across six synthetic workflow packs" },
  { href: "/ledgerbench", title: "Inspect the LedgerBench research program", category: "Lab", detail: "Specialist measurement methods, task admission, hidden evaluation, verification, and governance" },
  { href: "/spec", title: "Read the public specification", category: "Project", detail: "Identifiers, record contracts, rights, versioning, and conformance" },
  { href: "/methodology", title: "Review the methodology", category: "Project", detail: "Source admission, claims, review states, and corrections" },
  { href: "/changes", title: "Follow corpus changes", category: "Project", detail: "Immutable releases, compatibility, JSON Feed, and Atom" },
  { href: "/open-source", title: "Reuse the open project", category: "Project", detail: "MIT software, CC BY content, CC0 fixtures, and source archive" },
  { href: "/content-contract", title: "Choose a primary content mode", category: "Project", detail: "Seven educational modes, evidence classifications, release gate, and success measures" },
  { href: "/control-model", title: "Apply the Accounting Agent Control Model", category: "Govern", detail: "Objective, scope, evidence, procedure, checks, authority, review, action, and record" },
  { href: "/control-model#scenarios", title: "Review complete control-model scenarios", category: "Govern", detail: "Synthetic accrual-entry and payment-release examples with accountable human decisions" },
  { href: "/coverage", title: "Check coverage and gaps", category: "Learn", detail: "Deep, canonical-reference, source-only, planned, and out-of-scope coverage" },
];

export const modes = [
  {
    name: "Chat",
    controller: "Person",
    action: "Answers a prompt",
    example: "Explain a lease-accounting concept.",
  },
  {
    name: "Copilot",
    controller: "Person",
    action: "Assists inside a task",
    example: "Draft a variance explanation for review.",
  },
  {
    name: "Workflow",
    controller: "Defined rules",
    action: "Runs a fixed sequence",
    example: "Match invoices when specified fields agree.",
  },
  {
    name: "Agent",
    controller: "Model within set limits",
    action: "Selects steps and tools",
    example: "Investigate unmatched cash items and route exceptions.",
  },
];

export const workLoop = [
  ["Objective", "Define the outcome, period, scope, and stop conditions."],
  ["Evidence", "Collect source records and record where each fact came from."],
  ["Plan", "Break the objective into work units and identify required approvals."],
  ["Work", "Use approved tools to normalize, compare, calculate, research, and draft."],
  ["Check", "Run tie-outs, thresholds, completeness tests, and other deterministic checks."],
  ["Review", "Send exceptions, judgments, and proposed effects to the accountable reviewer."],
] as const;

export const layers = [
  ["Skill", "Method for performing the accounting work", "Reconcile cash"],
  ["Tool", "Interface the system can read or use", "Read a ledger export"],
  ["Policy", "Rule that limits the system's authority", "Draft only; do not post"],
  ["Template", "Required structure for the output", "Reconciliation workpaper"],
  ["Evaluator", "Test applied to the result", "Balance ties; evidence linked"],
] as const;

export const evidenceChain = [
  ["Evidence", "An invoice states $24,000 and covers June through August."],
  ["Observation", "One month of service relates to the current reporting period."],
  ["Claim", "The supported current-period expense is $8,000."],
  ["Judgment", "The amount exceeds the team's review threshold."],
  ["Decision", "The reviewer approves the proposed entry."],
] as const;

export const pilotSteps = [
  ["Choose the scope", "Select one repeatable workflow with stable evidence and a named reviewer."],
  ["Write the specification", "Define inputs, output, checks, authority limits, and stop conditions."],
  ["Run in shadow mode", "Use read-only access beside the current process. Do not change records."],
  ["Prepare drafts", "Let the agent prepare work. Require approval for judgments and external actions."],
  ["Measure the result", "Track coverage, accuracy, exceptions, rework, cycle time, and reviewer overrides."],
  ["Set the next boundary", "Expand only when the run record supports a wider scope or authority."],
] as const;
