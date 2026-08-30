import type { Metadata } from "next";
import "./globals.css";
import "./field-instrument.css";
import "./edtech-shell.css";
import "./edtech-home.css";
import "./edtech-lessons.css";
import "./edtech-atlas.css";
import { WebMcpTools } from "./WebMcpTools";

export const metadata: Metadata = {
  metadataBase: new URL("https://accounting-agents.madebyhenry.chatgpt.site"),
  title: "Accounting Agents",
  description:
    "Learn to design, practice, and review governed accounting-agent workflows through source-linked lessons and synthetic cases.",
  alternates: {
    canonical: "/",
  },
  keywords: [
    "AI agents in accounting",
    "agentic accounting",
    "accounting automation",
    "AI internal controls",
    "AI audit evidence",
    "accounting agents",
  ],
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/brand-mark.png",
    shortcut: "/brand-mark.png",
  },
  openGraph: {
    title: "Accounting Agents",
    description: "A practical learning path for governed AI agents in accounting.",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Accounting Agents learning experience",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Accounting Agents",
    description: "A practical learning path for governed AI agents in accounting.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta content="development" name="codex-preview" />
        <link href="/agent-context.md" rel="alternate" type="text/markdown" />
        <link href="/llms.txt" rel="describedby" type="text/plain" />
        <link href="/.well-known/api-catalog" rel="api-catalog" type="application/linkset+json" />
        <link href="/openapi.json" rel="service-desc" type="application/vnd.oai.openapi+json;version=3.1" />
      </head>
      <body>
        <WebMcpTools />
        {children}
      </body>
    </html>
  );
}
