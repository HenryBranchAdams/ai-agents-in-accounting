import type { Metadata } from "next";

export function docsMetadata(title: string, description: string, canonical: string): Metadata {
  return {
    title: `${title} | Accounting Agents`,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${title} | Accounting Agents`,
      description,
      images: [],
    },
    twitter: {
      title: `${title} | Accounting Agents`,
      description,
      images: [],
    },
  };
}
