import Link from "next/link";
import { DocsSearch } from "./DocsSearch";
import { navGroups } from "./content";

const learningLinks = [
  { href: "/atlas", label: "Atlas" },
  { href: "/start-here", label: "Learn" },
  { href: "/tutorials/bank-reconciliation", label: "Practice" },
  { href: "/control-model", label: "Govern" },
  { href: "/reading-room", label: "Research" },
] as const;

function BrandMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 32 32">
      <path d="M16 3 29 27h-7.1L16 15.9 10.1 27H3L16 3Z" fill="currentColor" />
      <path d="m16 15.9 5.9 11.1h-4.2L16 23.8 14.3 27h-4.2L16 15.9Z" fill="white" opacity="0.92" />
      <circle cx="16" cy="20.2" fill="currentColor" r="2.2" stroke="white" strokeWidth="1.4" />
    </svg>
  );
}

function ExploreMark() {
  return (
    <svg aria-hidden="true" className="explore-mark" viewBox="0 0 20 20">
      <circle cx="10" cy="10" fill="none" r="8" stroke="currentColor" strokeWidth="1.4" />
      <path d="m12.9 6.6-1.8 4.5-4.3 2.2 1.8-4.5 4.3-2.2Z" fill="currentColor" />
      <circle cx="10" cy="10" fill="white" r="1" />
    </svg>
  );
}

export function DocumentationNavigation({
  active,
  mobile = false,
}: {
  active: string;
  mobile?: boolean;
}) {
  const activeGroup = navGroups.find((group) => group.items.some((item) => item.href === active));
  const visibleGroups = mobile || !activeGroup
    ? navGroups
    : navGroups.filter((group) => group.label !== activeGroup.label);

  const renderGroup = (group: (typeof navGroups)[number], activeGroupClass = false) => (
    <div className={`nav-group${activeGroupClass ? " nav-group-active" : ""}`} key={group.label}>
      <p>{group.label}</p>
      {group.items.map((item) => (
        <a
          aria-current={item.href === active ? "page" : undefined}
          href={item.href}
          key={item.href}
        >
          {item.label}
        </a>
      ))}
    </div>
  );

  return (
    <nav aria-label={mobile ? "Mobile documentation" : "Documentation"} className={`docs-navigation ${mobile ? "docs-navigation-mobile" : "docs-navigation-priority"}`}>
      {activeGroup && !mobile && renderGroup(activeGroup, true)}
      {mobile || !activeGroup ? visibleGroups.map((group) => renderGroup(group)) : (
        <details className="all-sections">
          <summary>All sections</summary>
          {visibleGroups.map((group) => renderGroup(group))}
        </details>
      )}
    </nav>
  );
}

export function SiteHeader({ active }: { active: string }) {
  const activeGroup = navGroups.find((group) => group.items.some((item) => item.href === active));
  const activeItem = activeGroup?.items.find((item) => item.href === active);

  return (
    <header className="topbar">
      <div className="topbar-primary">
        <Link className="wordmark" href="/" aria-label="Accounting Agents knowledge hub home">
          <span aria-hidden="true" className="brand-mark"><BrandMark /></span>
          <span>Accounting Agents</span>
          <small>Educational knowledge hub</small>
        </Link>

        <nav aria-label="Learning paths" className="learning-nav">
          {learningLinks.map((item) => (
            <Link
              aria-current={item.href === active ? "page" : undefined}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <DocsSearch />

        <nav className="top-links" aria-label="Current material">
          <Link href="/observatory">
            <span aria-hidden="true" className="signal-dot" />
            Current signal
          </Link>
        </nav>

        <details className="mobile-navigation">
          <summary><ExploreMark /> Explore</summary>
          <DocumentationNavigation active={active} mobile />
        </details>
      </div>

      <div aria-label="Site context" className="site-context-rail" role="group">
        <span>Public knowledge hub</span>
        <span>{activeGroup?.label ?? "Guide"} / {activeItem?.label ?? "Overview"}</span>
        <span>Read-only / Source-linked</span>
      </div>
    </header>
  );
}
