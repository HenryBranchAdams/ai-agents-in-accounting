import { Alert, AlertTitle, AlertDescription } from "./ui/alert";
import type { ReactNode } from "react";
import { renderToString } from "react-dom/server.edge";
import { SiteNavigation } from "./site-navigation";
import { meta } from "../corpus";
declare const STYLE_VERSION: string;
declare const NAVIGATION_SCRIPT: string;
declare const PREVIEW_BUILD: boolean;
export function shell(
  title: string,
  description: string,
  body: ReactNode,
  active = "",
  canonical = "/",
) {
  const current =
    ["sources", "context"].includes(active) ||
    (active === "" && canonical === "/")
      ? "library"
      : active;
  return (
    "<!doctype html>" +
    renderToString(
      <html lang="en">
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width,initial-scale=1" />
          <title>{`${title} · Accounting Agents`}</title>
          <meta name="description" content={description} />
          <link rel="canonical" href={meta.site_url + canonical} />
          <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
          <link rel="stylesheet" href={`/style.css?v=${STYLE_VERSION}`} />
          <link rel="alternate" type="application/json" href="/api/v1/meta" />
          <link rel="alternate" type="text/markdown" href="/llms.txt" />
        </head>
        <body>
          <a
            className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-primary focus:p-4 focus:text-primary-foreground"
            href="#main"
          >
            Skip to content
          </a>
          <header className="border-b border-border bg-card">
            <div className="relative mx-auto flex min-h-20 max-w-library items-center justify-between gap-6 px-5 md:px-10">
              <a
                className="flex items-center gap-3 text-foreground no-underline"
                href="/"
                aria-label="Accounting Agents home"
              >
                <span
                  className="flex size-9 items-center justify-center rounded-sm bg-primary font-serif text-lg text-primary-foreground"
                  aria-hidden="true"
                >
                  Aa
                </span>
                <span className="font-serif text-xl tracking-tight">
                  Accounting Agents
                </span>
              </a>
              <div
                id="site-navigation"
                data-active={current}
                dangerouslySetInnerHTML={{
                  __html: renderToString(<SiteNavigation active={current} />, {
                    identifierPrefix: "navigation-",
                  }),
                }}
              />
            </div>
          </header>
          <main
            id="main"
            tabIndex={-1}
            className="mx-auto min-h-screen max-w-library px-5 pb-16 md:px-10"
          >
            {typeof PREVIEW_BUILD !== "undefined" && PREVIEW_BUILD ? (
              <Alert className="mt-6" role="status">
                <AlertTitle>Draft preview</AlertTitle>
                <AlertDescription>
                  These working changes are not a published corpus edition. Release downloads and history are unavailable in this preview.
                </AlertDescription>
              </Alert>
            ) : null}
            {body}
          </main>
          <footer className="border-t border-border bg-card">
            <div className="mx-auto grid max-w-library gap-8 px-5 py-10 text-sm md:grid-cols-2 md:px-10">
              <div>
                <a
                  href="/"
                  className="font-serif text-xl text-foreground no-underline"
                >
                  Accounting Agents
                </a>
                <p className="mt-3 max-w-md text-muted-foreground">
                  A public reference for building accounting agents. Open
                  project metadata and editorial content. Publisher rights
                  remain separate.
                </p>
              </div>
              <nav
                aria-label="Footer"
                className="grid grid-cols-2 content-start gap-x-6 gap-y-4"
              >
                <a href="/about">Mission &amp; coverage</a>
                <a href="/changes">Release history</a>
                <a href="/maintenance">Source maintenance</a>
                <a href={meta.repository_url}>Repository ↗</a>
                <a href="/llms.txt">Agent index</a>
                <a href="/api/v1/meta">Version {meta.corpus_version}</a>
              </nav>
            </div>
          </footer>
          <script type="module" src={NAVIGATION_SCRIPT} />
        </body>
      </html>,
    )
  );
}
