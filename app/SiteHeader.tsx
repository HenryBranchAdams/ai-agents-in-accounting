import { ArrowRightIcon, CompassIcon } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { DocsSearch } from "./DocsSearch";
import { navGroups } from "./content";

const learningLinks = [
  { href: "/start-here", label: "Learn", matches: ["/start-here", "/course"] },
  { href: "/tutorials/bank-reconciliation", label: "Practice", matches: ["/tutorials", "/workflows"] },
  { href: "/atlas", label: "Atlas", matches: ["/atlas"] },
  { href: "/resources", label: "Library", matches: ["/resources", "/reading-room", "/templates", "/glossary"] },
] as const;

function isLearningSectionActive(active: string, matches: readonly string[]) {
  return matches.some((prefix) => active === prefix || active.startsWith(`${prefix}/`));
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
  return (
    <header className="topbar aa2-topbar">
      <div className="topbar-primary aa2-topbar-primary">
        <Link className="wordmark aa2-wordmark" href="/" aria-label="Accounting Agents home">
          <span aria-hidden="true" className="brand-mark aa2-brand-mark">
            {/* A shipped brand asset keeps the mark crisp without adding a bespoke UI glyph. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="" height="36" src="/brand-mark.png" width="36" />
          </span>
          <span>Accounting Agents</span>
          <small>Learn governed work</small>
        </Link>

        <nav aria-label="Learning paths" className="learning-nav aa2-learning-nav">
          {learningLinks.map((item) => (
            <Link
              aria-current={isLearningSectionActive(active, item.matches) ? "page" : undefined}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="aa2-header-actions top-links">
          <DocsSearch />
          <Link className="aa2-start-action" href="/start-here">
            <span>Start learning</span>
            <ArrowRightIcon aria-hidden="true" size={18} weight="bold" />
          </Link>
        </div>

        <details className="mobile-navigation aa2-mobile-navigation">
          <summary><CompassIcon aria-hidden="true" size={18} weight="regular" /> Explore</summary>
          <div className="aa2-mobile-menu">
            <nav aria-label="Mobile learning paths" className="aa2-mobile-learning-nav">
              {learningLinks.map((item) => (
                <Link
                  aria-current={isLearningSectionActive(active, item.matches) ? "page" : undefined}
                  href={item.href}
                  key={item.href}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <Link className="aa2-mobile-start" href="/start-here">Start learning <ArrowRightIcon aria-hidden="true" size={17} weight="bold" /></Link>
            <DocumentationNavigation active={active} mobile />
          </div>
        </details>
      </div>
    </header>
  );
}
