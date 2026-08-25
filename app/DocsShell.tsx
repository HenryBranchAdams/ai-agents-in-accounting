import type { ReactNode } from "react";
import Link from "next/link";
import { DocsSearch } from "./DocsSearch";
import { navGroups, type NavItem } from "./content";
import { contentModeForPath } from "./content-contract";
import { corpusReviewedAt } from "./domain-model";

type TocItem = {
  href: string;
  label: string;
};

type DocsShellProps = {
  active: string;
  category: string;
  title: string;
  description: string;
  toc: TocItem[];
  children: ReactNode;
  previous?: NavItem;
  next?: NavItem;
  reviewedAt?: string;
  reviewStatus?: string;
  trustDateLabel?: string;
  markdownHref?: string;
  jsonHref?: string;
  headerImage?: {
    src: string;
    alt: string;
  };
};

function displayDate(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.valueOf())) return value;
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(date);
}

function Navigation({ active, mobile = false }: { active: string; mobile?: boolean }) {
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

export function DocsShell({
  active,
  category,
  title,
  description,
  toc,
  children,
  previous,
  next,
  reviewedAt = corpusReviewedAt,
  reviewStatus = "Maintainer-reviewed educational synthesis",
  trustDateLabel = "Reviewed",
  markdownHref,
  jsonHref,
  headerImage,
}: DocsShellProps) {
  const primaryMode = contentModeForPath(active);

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>

      <header className="topbar">
        <Link className="wordmark" href="/" aria-label="Accounting Agents guide home">
          <span>Accounting Agents</span>
          <small>Open field guide</small>
        </Link>
        <DocsSearch />
        <nav className="top-links" aria-label="Utility navigation">
          <Link href="/packs">Packs</Link>
          <a href="/machine-access">Agent access</a>
        </nav>
        <details className="mobile-navigation">
          <summary>Menu</summary>
          <Navigation active={active} mobile />
        </details>
      </header>

      <div className="docs-layout">
        <aside className="sidebar">
          <Navigation active={active} />
          <p className="sidebar-note">Reviewed {displayDate(corpusReviewedAt)}</p>
        </aside>

        <main className="main-column" id="main-content">
          <article className="doc-article">
            <div className="breadcrumbs">
              <Link href="/">Guide</Link>
              <span aria-hidden="true">/</span>
              <span>{category}</span>
            </div>

            <header className="doc-header">
              <h1>{title}</h1>
              <p>{description}</p>
              {headerImage && (
                <figure className="doc-header-art">
                  {/* Pre-cropped, pre-sized assets avoid runtime image transforms. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt={headerImage.alt}
                    decoding="async"
                    height="600"
                    loading="eager"
                    src={headerImage.src}
                    width="1800"
                  />
                </figure>
              )}
            </header>

            <div aria-label="Page trust and formats" className="doc-trust-row" role="group">
              <span><time dateTime={reviewedAt}>{trustDateLabel} {displayDate(reviewedAt)}</time></span>
              <span>{reviewStatus}</span>
              <span aria-label={`Primary content mode: ${primaryMode.label}`} className="content-mode" data-content-mode={primaryMode.id} data-primary-mode={primaryMode.id}>Content mode: <strong>{primaryMode.label}</strong></span>
              <Link href="/resources#method">Source method</Link>
              {markdownHref && <a href={markdownHref}>Markdown</a>}
              {jsonHref && <a href={jsonHref}>JSON</a>}
            </div>

            <div className="doc-body">{children}</div>

            {(previous || next) && (
              <nav aria-label="Page navigation" className="page-navigation">
                {previous ? (
                  <a href={previous.href} rel="prev">
                    <span>Previous</span>
                    {previous.label}
                  </a>
                ) : <span />}
                {next ? (
                  <a href={next.href} rel="next">
                    <span>Next</span>
                    {next.label}
                  </a>
                ) : <span />}
              </nav>
            )}

            <footer className="doc-footer">
              <p>Educational material. Original content CC BY 4.0; project metadata and synthetic fixtures CC0 1.0; software MIT. External publisher terms apply.</p>
            </footer>
          </article>
        </main>

        <aside className="page-toc">
          <p>On this page</p>
          <nav aria-label="On this page">
            {toc.map((item) => (
              <a href={item.href} key={item.href}>{item.label}</a>
            ))}
          </nav>
        </aside>
      </div>
    </>
  );
}
