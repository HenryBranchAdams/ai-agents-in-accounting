import { resourceKinds, resources, type Resource } from "./resources-data";

export const readingRoomReviewedAt = "2026-08-23";

type ReadingRoomSectionDefinition = {
  id: string;
  title: string;
  introduction: string;
  sourceIds: readonly string[];
};

const sectionDefinitions: readonly ReadingRoomSectionDefinition[] = [
  {
    id: "start-here",
    title: "Start here",
    introduction: "A six-reading route through the field, early accounting evidence, professional duty, evaluation discipline, and the limits of human–AI collaboration.",
    sourceIds: ["src_0hroanw", "src_1sbtyzp", "src_0j5fy58", "src_06l7uy3", "src_133sxln", "src_0dsjdn2"],
  },
  {
    id: "judgment-reliance-review",
    title: "Judgment, reliance, and review",
    introduction: "Accounting-native studies on professional judgment, psychological ownership, uncertainty, skills threat, and the quality of human challenge.",
    sourceIds: ["src_184dnnm", "src_0g4uvsr", "src_0bneozy", "src_0vks953", "src_1vsed7d", "src_037ngna", "src_icis25judgment", "src_holstein26"],
  },
  {
    id: "accounting-reporting-evidence",
    title: "Accounting and reporting evidence",
    introduction: "Research and regulator observations on financial analysis, ICFR, corporate reporting, structured data, and finance-team readiness.",
    sourceIds: ["src_1x8sdqx", "src_095yto0", "src_0cn4sq6", "src_04sc6cz", "src_0qnpuy0", "src_06z3svl", "src_finverbench", "src_lrec26trace"],
  },
  {
    id: "audit-evidence-assurance",
    title: "Audit evidence and assurance",
    introduction: "Audit studies and field perspectives on co-piloted work, skepticism, explanations, evidence quality, socio-technical constraints, and local testing.",
    sourceIds: ["src_1nozuxx", "src_1leuoiu", "src_10ub0wu", "src_18zatvq", "src_1uogv2b", "src_1yywfl5"],
  },
  {
    id: "international-audit-oversight",
    title: "International audit oversight",
    introduction: "First-party expectations and observations from audit regulators and professional bodies in Singapore, the Netherlands, Germany, South Africa, the United Kingdom, and Japan.",
    sourceIds: ["src_09imui4", "src_1bu97ex", "src_0qw4qgy", "src_1tcpuh2", "src_1ayxpgh", "src_0rz6w00"],
  },
  {
    id: "work-design-identity",
    title: "Work design and professional identity",
    introduction: "Field experiments and organizational research on task redesign, teams, expertise, professional boundaries, and the difference between local speed and end-to-end change.",
    sourceIds: ["src_1l0q90c", "src_1p2g6i1", "src_1pbfmlh", "src_1hp6kfj", "src_0hqji5v", "src_17ktxqn"],
  },
  {
    id: "management-accounting-controllership",
    title: "Management accounting and controllership",
    introduction: "Research, profession evidence, market signals, and disclosed practice on controllers, finance teams, skills, data, and operating-model change.",
    sourceIds: ["src_09438v4", "src_06v2vde", "src_0xce2sl", "src_0b6l4fu", "src_1ubjvso", "src_1krui2p", "src_bis25cashagents"],
  },
  {
    id: "tax-public-administration",
    title: "Tax work and public administration",
    introduction: "Professional duties, tax-practice evidence, administrative use, taxpayer legitimacy, software expectations, and independent public audit.",
    sourceIds: ["src_06ouxpb", "src_0crvww7", "src_0731a9b", "src_0b5xcz9", "src_0a4kx0d", "src_0yyp4cb", "src_1klaq4c", "src_12s8jr7", "src_0w8mvx4"],
  },
  {
    id: "education-professional-formation",
    title: "Education and professional formation",
    introduction: "Evidence and critical perspectives on accounting curricula, assessment, help-seeking, higher-order skill, ethics, and the public role of the profession.",
    sourceIds: ["src_0hwi8yi", "src_1376dbb", "src_1smh725", "src_0h6k5hk"],
  },
  {
    id: "open-standards-interoperability",
    title: "Open standards and interoperability",
    introduction: "First-party sources for open project stewardship, repository instructions, tool and data connectivity, agent coordination, authorization, and protocol-specific security.",
    sourceIds: ["src_aaif2026", "src_agentsmd", "src_1iuvzzy", "src_1xcjkju", "src_15erfc2", "src_055ypga"],
  },
  {
    id: "agent-systems-evaluation",
    title: "Agent systems and evaluation",
    introduction: "Technical explanations and peer-reviewed benchmarks for tool use, state, long tasks, reliability, enterprise interfaces, and sustained workplace activity.",
    sourceIds: ["src_00we6f7", "src_0obxwi0", "src_0p4xhvf", "src_138oad7", "src_03c2qkm", "src_023hddn", "src_18lep20", "src_0ztzbym"],
  },
  {
    id: "security-deployment-boundaries",
    title: "Security and deployment boundaries",
    introduction: "Threat research and guidance for untrusted content, prompt injection, constrained tools, capability boundaries, local validation, and smaller-firm security.",
    sourceIds: ["src_0c89fwp", "src_0nqqjyl", "src_0bztogd", "src_0tfuqlv", "src_18xd8ll", "src_10wzswi", "src_0j5ntza", "src_treas24aicyber", "src_enisa23ai", "src_uk25aicode", "src_g7tprm"],
  },
  {
    id: "human-oversight-automation",
    title: "Human oversight and automation",
    introduction: "Foundational and experimental research on misuse, disuse, automation levels, skill erosion, verification, and what meaningful human control requires.",
    sourceIds: ["src_05shm3i", "src_16fb52v", "src_1jal1ad", "src_0mz74m6", "src_113zjrs"],
  },
  {
    id: "evidence-provenance-production",
    title: "Evidence, provenance, and production readiness",
    introduction: "Standards and engineering research for lineage, testing, technical debt, behavioral evaluation, system disclosure, and the complementary work needed around deployment.",
    sourceIds: ["src_092a1wl", "src_0v7x0m1", "src_1ttzngc", "src_07s1t5x", "src_1hgp2bd", "src_0w2pi9z", "src_dodaite"],
  },
  {
    id: "ai-assurance-governance",
    title: "AI assurance and governance",
    introduction: "Frameworks and professional perspectives on provider, model, application, lifecycle, ethics, three-lines ownership, and committee oversight.",
    sourceIds: ["src_04s75ox", "src_1igc1rp", "src_17r8k3y", "src_1e96rjh", "src_0djqo8b", "src_179f1cz", "src_aicpa26resp", "src_saicagenai", "src_ccab26draft"],
  },
  {
    id: "financial-services-supervision",
    title: "Financial-services supervision",
    introduction: "Current first-party expectations for AI use across banks, securities firms, insurers, and market infrastructure in ten regulatory settings.",
    sourceIds: ["src_osfi26agent", "src_iosco26ai", "src_finra2409", "src_finma24ai", "src_apra26ai", "src_sfc24genai", "src_esma24ai", "src_eiopa25ai", "src_hkma19ai", "src_bis24regai"],
  },
  {
    id: "model-risk-operational-resilience",
    title: "Model risk and operational resilience",
    introduction: "Supervisory and policy material on validation, data, explainability, third parties, concentration, resilience, and system-wide monitoring.",
    sourceIds: ["src_occ26mrm", "src_fsb26ai", "src_bafin26ai", "src_boe22aippf", "src_pra23mrm", "src_bis26dataai", "src_bis25xai", "src_bis25aigov", "src_fsb24ai", "src_fsb25monitor", "src_bis21human"],
  },
  {
    id: "structured-financial-data",
    title: "Structured financial data",
    introduction: "Open standards and official implementation material for machine-readable reports, ledgers, validations, calculations, taxonomies, and audit files.",
    sourceIds: ["src_xbrlvalid", "src_ixbrl", "src_xbrlformula", "src_xbrlgl", "src_ifrs26taxarch", "src_sec26xbrl", "src_xbrlusdqc", "src_xbrlcalc11", "src_saft140", "src_esef2019"],
  },
  {
    id: "field-notes-deployments",
    title: "Field notes and deployments",
    introduction: "Observed use portfolios, practitioner research, and named implementations with explicit limits on what each case can prove.",
    sourceIds: ["src_finra25uses", "src_boe24aisurvey", "src_far26badadvice", "src_joa26ethics", "src_kpmgaireporting", "src_digitalktp", "src_bdochat", "src_hapaggenai", "src_rivianagents"],
  },
  {
    id: "authorization-continuous-assurance",
    title: "Authorization and continuous assurance",
    introduction: "Emerging research and technical work on permission before execution, delegated authority, lifecycle documentation, continuous assessment, and assurance ecosystems.",
    sourceIds: ["src_certtraces", "src_aadp", "src_oauthagentdraft", "src_etsi104119", "src_etsi104008", "src_oecd23acct", "src_uk21assure"],
  },
] as const;

const resourcesById = new Map(resources.map((resource) => [resource.id, resource]));

function resolveResource(id: string): Resource {
  const resource = resourcesById.get(id);
  if (!resource) throw new Error(`Reading-room source ${id} is missing from the catalog.`);
  return resource;
}

export const readingRoomSections = sectionDefinitions.map((section) => ({
  ...section,
  resources: section.sourceIds.map(resolveResource),
}));

export const readingRoomResources = readingRoomSections.flatMap((section) => section.resources);
const readingRoomIds = readingRoomResources.map((resource) => resource.id);

if (new Set(readingRoomIds).size !== readingRoomIds.length) {
  throw new Error("A source may appear on only one reading-room shelf.");
}

export const readingRoomKindCounts = Object.fromEntries(
  resourceKinds.map((kind) => [
    kind,
    readingRoomResources.filter((resource) => resource.kind === kind).length,
  ]),
) as Record<(typeof resourceKinds)[number], number>;

export function renderReadingRoomMarkdown(origin: string) {
  const lines = [
    "# Accounting Agents reading room",
    "",
    "> A curated path through research papers, practitioner essays, professional reports, and disclosed practice examples on AI and agents in accounting.",
    "",
    `Reviewed: ${readingRoomReviewedAt}`,
    "",
    `Coverage: ${readingRoomResources.length} readings across ${readingRoomSections.length} shelves.`,
    "",
    "## How to use this collection",
    "",
    "- Read source type and publication status before reading the claim.",
    "- Treat a peer-reviewed study, regulator observation, independent essay, survey, and vendor announcement as different forms of support.",
    "- Check whether the task, population, model, period, and jurisdiction transfer to the accounting decision at hand.",
    "- Follow the catalog record for the editorial limitation and stable source ID.",
    "",
    "## Shelf index",
    "",
    ...readingRoomSections.flatMap((section) => [
      `- [${section.title}](${origin}/reading-room#${section.id}) — ${section.resources.length} readings. ${section.introduction}`,
    ]),
    "",
  ];

  for (const section of readingRoomSections) {
    lines.push(`## ${section.title}`, "", section.introduction, "");

    for (const resource of section.resources) {
      lines.push(
        `### [${resource.title}](${resource.href})`,
        "",
        `- Source type: ${resource.kind}`,
        `- Owner: ${resource.owner}`,
        `- Date or status: ${resource.date}`,
        `- Scope: ${resource.jurisdiction}`,
        `- Access: ${resource.access}`,
        `- Catalog record: ${origin}/resources/${resource.id}`,
        "",
        resource.note,
        "",
      );
    }
  }

  lines.push(
    "## Complete catalog",
    "",
    `Browse every indexed source at ${origin}/resources or retrieve ${origin}/api/v1/resources.`,
    "",
  );

  return lines.join("\n");
}
