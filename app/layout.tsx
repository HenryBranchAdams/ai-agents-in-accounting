import type { Metadata } from "next";
import "./globals.css";
import { WebMcpTools } from "./WebMcpTools";

export const metadata: Metadata = {
  metadataBase: new URL("https://accounting-agents.madebyhenry.chatgpt.site"),
  title: "Accounting Agents",
  description:
    "Methods, workflow examples, control guidance, and primary sources for accounting teams using AI agents.",
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
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "Accounting Agents",
    description: "Field guide to AI agents in accounting.",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Accounting Agents field guide",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Accounting Agents",
    description: "Field guide to AI agents in accounting.",
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
