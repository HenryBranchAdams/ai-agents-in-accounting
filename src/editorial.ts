import type { Json } from "./corpus";
export interface BriefSection {
  title: string;
  paragraphs: string[];
}
export interface EditedBrief {
  question: string;
  answer: string;
  findings: {
    claim: string;
    classification?: string;
    source_ids: string[];
    locator?: string;
    qualification: string;
  }[];
  unknowns: string[];
  reading_order: string[];
  reading_notes?: { record_id: string; reason: string }[];
  reading: {
    scope: string;
    critical_limitation: string;
    sections: BriefSection[];
    example: {
      title: string;
      classification: "original-synthetic";
      assumptions: string;
      columns: string[];
      rows: string[][];
      record_id?: string;
      anchor?: string;
    };
    responsibilities: { role: string; task: string; boundary: string }[];
    exception: BriefSection;
    gap_url?: string;
    review: {
      reviewed_at: string;
      reviewer: string;
      scope: string;
      dependencies: { record_id: string; sha256: string }[];
    };
  };
}
export function editedBrief(value: Json | undefined): EditedBrief | undefined {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    !value.reading
  )
    return undefined;
  return value as unknown as EditedBrief;
}
const mdCell = (s: string) => s.replaceAll("|", "\\|").replaceAll("\n", " ");
export function briefMarkdown(b: EditedBrief, baseUrl: string): string {
  const r = b.reading;
  const section = (s: BriefSection) =>
    `## ${s.title}\n\n${s.paragraphs.join("\n\n")}\n\n`;
  const table = (columns: string[], rows: string[][]) =>
    [columns, columns.map(() => "---"), ...rows]
      .map((row) => `| ${row.map(mdCell).join(" | ")} |`)
      .join("\n");
  return `## ${b.question}\n\n${b.answer}\n\n**Scope:** ${r.scope}\n\n**Critical limitation:** ${r.critical_limitation}\n\n${r.sections.map(section).join("")}## ${r.example.title}\n\nOriginal synthetic example. ${r.example.assumptions}\n\n${table(r.example.columns, r.example.rows)}\n\n${r.example.record_id ? `[Complete example](${baseUrl}/records/${r.example.record_id}#${r.example.anchor || "record-content"})\n\n` : ""}## Who does what\n\nProject-proposed responsibility boundaries.\n\n${table(
    ["Role", "Work", "Boundary"],
    r.responsibilities.map((x) => [x.role, x.task, x.boundary]),
  )}\n\n${section(r.exception)}${r.gap_url ? `[Unresolved evidence gaps](${r.gap_url})\n\n` : ""}## Evidence and limitations\n\n${b.findings.map((f) => `- **${f.classification || "Recorded synthesis"}:** ${f.claim}\n  ${f.qualification}\n  ${f.locator || "Precise passage locator not recorded in this brief; inspect the canonical source review."}\n  ${f.source_ids.map((id) => `[${id}](${baseUrl}/records/${id})`).join(" · ")}`).join("\n\n")}\n\n## What remains unknown\n\n${b.unknowns.map((s) => `- ${s}`).join("\n")}\n\n## Suggested reading\n\n${b.reading_order.map((id) => `- [${id}](${baseUrl}/records/${id})${b.reading_notes?.find((n) => n.record_id === id)?.reason ? ": " + b.reading_notes.find((n) => n.record_id === id)!.reason : ""}`).join("\n")}\n\n`;
}
