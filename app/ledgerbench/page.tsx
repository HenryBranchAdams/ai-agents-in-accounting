import { DocsShell } from "../DocsShell";
import { docsMetadata } from "../docsMetadata";
import { ledgerBenchProgram } from "../ledgerbench-data";
import { LedgerBenchFoundations } from "./LedgerBenchFoundations";
import { LedgerBenchOperations } from "./LedgerBenchOperations";
import { LedgerBenchScoring } from "./LedgerBenchScoring";

const description = "A specialist research program for accounting-agent capability, conformance, field utility, and grader validity.";

export const metadata = {
  ...docsMetadata("LedgerBench research program", description, "/ledgerbench"),
  alternates: {
    canonical: "/ledgerbench",
    types: {
      "application/json": "/api/v1/ledgerbench",
      "text/markdown": "/ledgerbench.md",
    },
  },
};

export default function LedgerBenchPage() {
  return (
    <DocsShell
      active="/ledgerbench"
      category="Lab"
      title="LedgerBench research program"
      description={description}
      headerImage={{
        src: "/images/editorial/options/17-evaluation-rig.jpg",
        alt: "A bounded evaluation rig showing evidence, checks, review, and authority gates as separate stages.",
      }}
      jsonHref="/api/v1/ledgerbench"
      markdownHref="/ledgerbench.md"
      toc={[
        { href: "#claim", label: "Measurement claim" },
        { href: "#products", label: "Program products" },
        { href: "#tracks", label: "Tracks and divisions" },
        { href: "#universe", label: "Task universe" },
        { href: "#scoring", label: "Scoring" },
        { href: "#admission", label: "Task admission" },
        { href: "#integrity", label: "Evaluation integrity" },
        { href: "#governance", label: "Governance" },
        { href: "#release", label: "First release" },
        { href: "#precedents", label: "Precedents" },
        { href: "#machine", label: "Machine contracts" },
      ]}
      previous={{ href: "/bench", label: "Core conformance suite" }}
      next={{ href: "/spec", label: "Public specification" }}
      reviewedAt={ledgerBenchProgram.reviewed_at}
    >
      <LedgerBenchFoundations />
      <LedgerBenchScoring />
      <LedgerBenchOperations />
    </DocsShell>
  );
}
