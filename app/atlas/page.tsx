import Link from "next/link";
import { AtlasExplorer } from "./AtlasExplorer";
import {
  accountingAgentsAtlas,
  atlasDefaultNodeId,
  atlasIndustryLenses,
  atlasPathNodeIds,
  atlasTimeLayers,
} from "../atlas-data";
import { contentModeForPath } from "../content-contract";
import { docsMetadata } from "../docsMetadata";
import { SiteHeader } from "../SiteHeader";

export const metadata = {
  ...docsMetadata(accountingAgentsAtlas.title, accountingAgentsAtlas.description, "/atlas"),
  alternates: {
    canonical: "/atlas",
    types: {
      "text/markdown": "/atlas.md",
      "application/json": "/api/v1/atlas",
    },
  },
};

export default function LivingAtlasPage() {
  const primaryMode = contentModeForPath("/atlas");
  const nodeById = new Map(accountingAgentsAtlas.full_graph.nodes.map((node) => [node.id, node]));

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to Atlas</a>
      <SiteHeader active="/atlas" />
      <main className="atlas-page" id="main-content">
        <AtlasExplorer
          defaultNodeId={atlasDefaultNodeId}
          edges={[...accountingAgentsAtlas.full_graph.edges]}
          industryLenses={[...atlasIndustryLenses]}
          nodes={[...accountingAgentsAtlas.full_graph.nodes]}
          pathNodeIds={[...atlasPathNodeIds]}
          timeLayers={[...atlasTimeLayers]}
        />

        <details className="atlas-linear-fallback">
          <summary>Browse the guided path as a linear index</summary>
          <p>
            This ordered view preserves the same stable node IDs, classifications,
            provenance, and destinations as the interactive map.
          </p>
          <ol>
            {atlasPathNodeIds.map((id) => {
              const node = nodeById.get(id);
              if (!node) return null;
              return (
                <li id={`atlas-linear-${node.id}`} key={node.id}>
                  <h2>{node.href ? <Link href={node.href}>{node.label}</Link> : node.label}</h2>
                  <p>{node.summary}</p>
                  <dl>
                    <div><dt>Stable ID</dt><dd><code>{node.id}</code></dd></div>
                    <div><dt>Evidence classification</dt><dd>{node.evidence_classification}</dd></div>
                    <div><dt>Provenance</dt><dd>{node.provenance.source_file} · {node.provenance.derivation}</dd></div>
                  </dl>
                </li>
              );
            })}
          </ol>
        </details>

        <footer className="atlas-trust-strip">
          <p>{accountingAgentsAtlas.operating_rule.text}</p>
          <div>
            <span>Snapshot {accountingAgentsAtlas.snapshot_as_of}</span>
            <span data-content-mode={primaryMode.id}>Content mode: {primaryMode.label}</span>
            <Link href="/atlas.md">Markdown</Link>
            <Link href="/api/v1/atlas">JSON</Link>
            <Link href="/resources#method">Source method</Link>
          </div>
        </footer>
      </main>
    </>
  );
}
