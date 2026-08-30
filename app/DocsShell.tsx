import type { ReactNode } from "react";
import Link from "next/link";
import type { NavItem } from "./content";
import { contentModeForPath } from "./content-contract";
import { corpusReviewedAt } from "./domain-model";
import { navGroups } from "./content";
import { DocumentationNavigation, SiteHeader } from "./SiteHeader";

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
  immersive?: boolean;
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
  immersive = false,
}: DocsShellProps) {
  const primaryMode = contentModeForPath(active);
  const activeGroup = navGroups.find((group) => group.items.some((item) => item.href === active));
  const contextualLinks = activeGroup?.items.filter((item) => item.href !== active).slice(0, 5) ?? [];

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <SiteHeader active={active} />

      <div className={`docs-layout aa2-docs-layout${immersive ? " aa2-immersive-layout" : ""}`}>
        {!immersive && (
          <aside className="sidebar aa2-sidebar">
            <DocumentationNavigation active={active} />
            <p className="sidebar-note">Corpus snapshot {displayDate(corpusReviewedAt)}</p>
          </aside>
        )}

        <main className={`main-column aa2-main-column${immersive ? " aa2-immersive-main" : ""}`} id="main-content">
          <article className={`doc-article aa2-doc-article${immersive ? " aa2-immersive-article" : ""}`}>
            {!immersive && (
              <div className="breadcrumbs aa2-breadcrumbs">
                <Link href="/">Guide</Link>
                <span aria-hidden="true">/</span>
                <span>{category}</span>
              </div>
            )}

            {!immersive && (
              <header className="doc-header aa2-doc-header">
                <p className="aa2-doc-kicker">{category}</p>
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
            )}

            {!immersive && (
              <div aria-label="Page trust and formats" className="doc-trust-row aa2-doc-trust-row" role="group">
                <span><time dateTime={reviewedAt}>{trustDateLabel} {displayDate(reviewedAt)}</time></span>
                <span>{reviewStatus}</span>
                <span aria-label={`Primary content mode: ${primaryMode.label}`} className="content-mode" data-content-mode={primaryMode.id} data-primary-mode={primaryMode.id}>Content mode: <strong>{primaryMode.label}</strong></span>
                <Link href="/resources#method">Source method</Link>
                {markdownHref && <a href={markdownHref}>Markdown</a>}
                {jsonHref && <a href={jsonHref}>JSON</a>}
              </div>
            )}

            <div className={`doc-body aa2-doc-body${immersive ? " aa2-immersive-body" : ""}`}>{children}</div>

            {immersive && (
              <div aria-label="Page provenance and formats" className="aa2-immersive-provenance" role="group">
                <span><time dateTime={reviewedAt}>{trustDateLabel} {displayDate(reviewedAt)}</time></span>
                <span>{reviewStatus}</span>
                <span aria-label={`Primary content mode: ${primaryMode.label}`} className="content-mode" data-content-mode={primaryMode.id} data-primary-mode={primaryMode.id}>Content mode: <strong>{primaryMode.label}</strong></span>
                <Link href="/resources#method">Source method</Link>
                {markdownHref && <a href={markdownHref}>Markdown</a>}
                {jsonHref && <a href={jsonHref}>JSON</a>}
              </div>
            )}

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

            <footer className="doc-footer aa2-doc-footer">
              <p>Educational material. Original content CC BY 4.0; project metadata and synthetic fixtures CC0 1.0; software MIT. External publisher terms apply.</p>
            </footer>
          </article>
        </main>

        {!immersive && <aside className="page-toc aa2-page-toc">
          {activeGroup && (
            <div aria-label={`${activeGroup.label} section context`} className="contextual-rail">
              <p className="contextual-rail-label">{activeGroup.label}</p>
              <p className="contextual-rail-title">{title}</p>
              {contextualLinks.length > 0 && (
                <nav aria-label={`${activeGroup.label} pages`}>
                  {contextualLinks.map((item) => <a href={item.href} key={item.href}>{item.label}</a>)}
                </nav>
              )}
            </div>
          )}
          <p>On this page</p>
          <nav aria-label="On this page">
            {toc.map((item) => (
              <a href={item.href} key={item.href}>{item.label}</a>
            ))}
          </nav>
        </aside>}
      </div>
    </>
  );
}
