import Link from "next/link";
import { DocsSearch } from "./DocsSearch";
import { navGroups } from "./content";

const learningLinks = [
  { href: "/start-here", label: "Learn" },
  { href: "/tutorials/bank-reconciliation", label: "Practice" },
  { href: "/control-model", label: "Govern" },
  { href: "/reading-room", label: "Research" },
] as const;

export function DocumentationNavigation({
  active,
  mobile = false,
}: {
  active: string;
  mobile?: boolean;
}) {
  return (
    <nav aria-label={mobile ? "Mobile documentation" : "Documentation"} className="docs-navigation">
      {navGroups.map((group) => (
        <div className="nav-group" key={group.label}>
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
      ))}
    </nav>
  );
}

export function SiteHeader({ active }: { active: string }) {
  return (
    <header className="topbar">
      <Link className="wordmark" href="/" aria-label="Accounting Agents knowledge hub home">
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
          Current signal
          <span aria-hidden="true" className="signal-dot" />
        </Link>
      </nav>

      <details className="mobile-navigation">
        <summary>Menu</summary>
        <DocumentationNavigation active={active} mobile />
      </details>
    </header>
  );
}
