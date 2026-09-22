import type { RecordSection } from "../record-sections";
export function PageOutline({ sections }: { sections: RecordSection[] }) {
  const links = (items: RecordSection[]) => items.map(section => <a key={section.id} href={`#${section.id}`} data-section-link={section.id}>{section.title}</a>);
  return <nav aria-label="Record sections" data-page-outline="true" className="grid gap-1 [&_a]:py-2 [&_a]:no-underline hover:[&_a]:underline">
    {links(sections.filter(section => !section.secondary))}
    <details><summary>Reference and record information</summary><div className="grid gap-1">{links(sections.filter(section => section.secondary))}</div></details>
  </nav>;
}
