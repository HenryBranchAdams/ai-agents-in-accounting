export type EcosystemLayer = {
  id: string;
  name: string;
  role: string;
  posture: "adopted" | "available when needed" | "deferred";
  use_here: string;
  boundary: string;
  local_href: string | null;
  local_label: string | null;
  source_ids: string[];
};

export const ecosystemLayers: EcosystemLayer[] = [
  {
    id: "direct-web-access",
    name: "HTTP, Markdown, JSON, and OpenAPI",
    role: "Direct discovery, retrieval, filtering, caching, and client generation without a required agent framework.",
    posture: "adopted",
    use_here: "The public corpus, deterministic search, schemas, feeds, and release records are available through ordinary web contracts.",
    boundary: "An interface describes how to retrieve information. It does not establish accounting authority, completeness, or correctness.",
    local_href: "/machine-access",
    local_label: "Use the public interfaces",
    source_ids: [],
  },
  {
    id: "repository-context",
    name: "AGENTS.md",
    role: "A predictable Markdown file for project-specific instructions used by coding agents.",
    posture: "adopted",
    use_here: "The source release includes repository instructions, and the public /AGENTS.md file gives agents a compact routing and reliance policy for this corpus.",
    boundary: "Repository instructions are not a runtime permission system and do not authorize accounting actions.",
    local_href: "/AGENTS.md",
    local_label: "Read public agent instructions",
    source_ids: ["src_agentsmd"],
  },
  {
    id: "tool-and-data-connection",
    name: "Model Context Protocol",
    role: "A protocol for exposing resources, prompts, and tools to compatible AI applications.",
    posture: "available when needed",
    use_here: "Agents can use the existing HTTPS and OpenAPI surfaces directly. A thin read-only MCP adapter remains appropriate only when a tested client workflow needs MCP-specific discovery or resources.",
    boundary: "MCP connectivity does not prove authorization, source completeness, segregation of duties, or control effectiveness.",
    local_href: "/architecture#mcp",
    local_label: "Review the interface boundary",
    source_ids: ["src_1iuvzzy", "src_15erfc2", "src_055ypga"],
  },
  {
    id: "agent-coordination",
    name: "Agent2Agent Protocol",
    role: "A protocol for task exchange, messages, artifacts, and coordination between independent agentic applications.",
    posture: "deferred",
    use_here: "Accounting Agents is a public knowledge service, not a task-accepting autonomous agent, so it does not publish an A2A agent card.",
    boundary: "A catalog or search API is not an agent merely because other agents can call it.",
    local_href: null,
    local_label: null,
    source_ids: ["src_1xcjkju"],
  },
  {
    id: "accounting-domain-contracts",
    name: "Accounting domain contracts",
    role: "Workflow specifications, evidence requirements, authority levels, synthetic fixtures, and conformance cases for accounting work.",
    posture: "adopted",
    use_here: "The public specification, workflow packs, and benchmark add the accounting-specific layer that general agent protocols do not provide.",
    boundary: "Passing a synthetic case does not approve production use or replace professional judgment and local control testing.",
    local_href: "/spec",
    local_label: "Read the public specification",
    source_ids: [],
  },
];

export function renderEcosystemMarkdown(origin: string, records: readonly EcosystemLayer[] = ecosystemLayers) {
  const lines = [
    "# Open agent ecosystem",
    "",
    "> A role-based map of open agent interfaces and the accounting-specific contracts layered on top of them.",
    "",
    "Accounting Agents uses open formats where they add portability. Protocol support is matched to the job instead of treated as a maturity signal.",
    "",
    "## Standards and interface map",
    "",
  ];

  for (const layer of records) {
    lines.push(
      `### ${layer.name}`,
      "",
      `- ID: \`${layer.id}\``,
      `- Posture: ${layer.posture}`,
      `- Role: ${layer.role}`,
      `- Use here: ${layer.use_here}`,
      `- Boundary: ${layer.boundary}`,
      ...(layer.local_href ? [`- Local surface: ${origin}${layer.local_href}`] : []),
      ...(layer.source_ids.length ? [`- Source records: ${layer.source_ids.map((id) => `${origin}/resources/${id}`).join(", ")}`] : []),
      "",
    );
  }

  lines.push(
    "## Accounting workstreams",
    "",
    "The human guide organizes domain work into eight accounting process families. They are topical pathways, not committees or claims of institutional representation.",
    "",
    `Browse them at ${origin}/lifecycle or retrieve the canonical records from ${origin}/api/v1/workflows.`,
    "",
    "## Participation and trust",
    "",
    `- Methodology: ${origin}/methodology`,
    `- Changes and feeds: ${origin}/changes`,
    `- Rights and contribution rules: ${origin}/open-source`,
    `- Source archive: ${origin}/downloads/accounting-agents-source.zip`,
    "",
  );

  return lines.join("\n");
}
