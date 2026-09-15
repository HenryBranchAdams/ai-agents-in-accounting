export const displayText = (value: unknown) => String(value ?? "");

export const esc = (value: unknown) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const fieldLabels: Record<string, string> = {
  "record-summary": "Source overview",
  "official-dataset-description": "Publisher description",
  "official-technical-documentation": "Publisher documentation",
  "vendor-documented-behavior": "Documented product behavior",
  "authoritative-requirement": "Accounting authority",
  "editorial-recommendation": "Editorial interpretation",
  "editorial-synthesis": "Editorial synthesis",
  "empirical-finding": "Research finding",
  "source-checked": "AI-assisted source check",
  "editorially-reviewed": "Editorial review",
  "inherited-not-reverified": "Inherited · not reverified",
  published_or_status: "Publication and status",
  relationship_profile: "Evidence and relationships",
  source_links: "How sources support this reference",
  source_basis: "Source basis and applicability",
};
export const label = (s: string) =>
  fieldLabels[s] ||
  s.replace(/[_-]/g, " ").replace(/^./, (c) => c.toUpperCase());
export function link(url: string, title: string) {
  if (!/^(https?:\/\/|\/(?!\/))/.test(url)) return displayText(title);
  return (
    <>
      <a
        href={displayText(url)}
        {...(url.startsWith("http") ? { rel: "noreferrer" } : {})}
      >
        {displayText(title)}
      </a>
    </>
  );
}
