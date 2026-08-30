"use client";

import {
  ArrowRight,
  ArrowSquareOut,
  Bank,
  BookOpen,
  Buildings,
  CaretLeft,
  CaretRight,
  ClockCountdown,
  Compass,
  FileText,
  Funnel,
  ListBullets,
  MapTrifold,
  Question,
  WarningDiamond,
  X,
} from "@phosphor-icons/react";
import Link from "next/link";
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import type {
  AtlasEdge,
  AtlasNode,
  AtlasTimeLayerId,
} from "../atlas-data";
import type { ResourceIndustry } from "../resources-data";
import { AtlasNodeGlyph } from "./AtlasNodeGlyph";

const AtlasFlowMap = lazy(() => import("./AtlasFlowMap"));

type AtlasIndustryLens = {
  id: ResourceIndustry;
  label: string;
  description: string;
};

type AtlasTimeLayer = {
  id: AtlasTimeLayerId;
  label: string;
  description: string;
};

type ViewMode = "map" | "list";

const clusterLabels = {
  "accounting-work": "Accounting work",
  "controls-risks": "Controls & risks",
  "agent-capabilities": "Agent capabilities",
  "primary-sources": "Primary sources",
  industries: "Industries",
} as const;

const evidenceLabels: Record<AtlasNode["evidence_classification"], string> = {
  "authoritative-requirement": "Authoritative requirement",
  "official-guidance": "Official guidance",
  "editorial-recommendation": "Editorial recommendation",
  "implementation-pattern": "Implementation pattern",
  "synthetic-example": "Synthetic example",
  "empirical-evidence": "Empirical evidence",
  "unresolved-question": "Unresolved question",
};

function isIndustry(value: string | null, lenses: readonly AtlasIndustryLens[]): value is ResourceIndustry {
  return Boolean(value && lenses.some((lens) => lens.id === value));
}

function isTimeLayer(value: string | null, layers: readonly AtlasTimeLayer[]): value is AtlasTimeLayerId {
  return Boolean(value && layers.some((layer) => layer.id === value));
}

function isViewMode(value: string | null): value is ViewMode {
  return value === "map" || value === "list";
}

function defaultViewMode(requestedView: string | null) {
  if (isViewMode(requestedView)) return requestedView;
  return window.matchMedia("(max-width: 720px)").matches ? "list" : "map";
}

export function AtlasExplorer({
  defaultNodeId,
  edges,
  industryLenses,
  nodes,
  pathNodeIds,
  timeLayers,
}: {
  defaultNodeId: string;
  edges: AtlasEdge[];
  industryLenses: AtlasIndustryLens[];
  nodes: AtlasNode[];
  pathNodeIds: string[];
  timeLayers: AtlasTimeLayer[];
}) {
  const [selectedNodeId, setSelectedNodeId] = useState(defaultNodeId);
  const [industry, setIndustry] = useState<ResourceIndustry>("general");
  const [timeLayer, setTimeLayer] = useState<AtlasTimeLayerId>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [viewIsExplicit, setViewIsExplicit] = useState(false);
  const [filtersInitialized, setFiltersInitialized] = useState(false);
  const [compactMap, setCompactMap] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [industryPanelOpen, setIndustryPanelOpen] = useState(false);

  const nodeById = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);
  const pathIndexById = useMemo(() => new Map(pathNodeIds.map((id, index) => [id, index])), [pathNodeIds]);

  useEffect(() => {
    const readLocation = () => {
      const parameters = new URLSearchParams(window.location.search);
      const requestedNode = parameters.get("node");
      const requestedIndustry = parameters.get("industry");
      const requestedTimeLayer = parameters.get("time_layer");
      const requestedView = parameters.get("view");
      setSelectedNodeId(requestedNode && nodeById.has(requestedNode) ? requestedNode : defaultNodeId);
      setIndustry(isIndustry(requestedIndustry, industryLenses) ? requestedIndustry : "general");
      setTimeLayer(isTimeLayer(requestedTimeLayer, timeLayers) ? requestedTimeLayer : "all");
      setViewMode(defaultViewMode(requestedView));
      setViewIsExplicit(isViewMode(requestedView));
      setFiltersInitialized(true);
    };

    readLocation();
    window.addEventListener("popstate", readLocation);
    return () => window.removeEventListener("popstate", readLocation);
  }, [defaultNodeId, industryLenses, nodeById, timeLayers]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 720px), (min-width: 700px) and (max-height: 600px)");
    const narrowMedia = window.matchMedia("(max-width: 720px)");
    const update = () => {
      setCompactMap(media.matches);
      if (!viewIsExplicit) setViewMode(narrowMedia.matches ? "list" : "map");
    };
    update();
    media.addEventListener("change", update);
    narrowMedia.addEventListener("change", update);
    return () => {
      media.removeEventListener("change", update);
      narrowMedia.removeEventListener("change", update);
    };
  }, [viewIsExplicit]);

  useEffect(() => {
    if (!filtersInitialized) return;
    const parameters = new URLSearchParams(window.location.search);
    parameters.set("node", selectedNodeId);
    parameters.set("industry", industry);
    parameters.set("time_layer", timeLayer);
    if (viewIsExplicit) parameters.set("view", viewMode);
    else parameters.delete("view");
    window.history.replaceState(null, "", `${window.location.pathname}?${parameters}${window.location.hash}`);
  }, [filtersInitialized, industry, selectedNodeId, timeLayer, viewIsExplicit, viewMode]);

  const filteredNodes = useMemo(() => {
    const byLens = nodes.filter((node) => {
      if (node.kind === "industry") {
        return industry === "general"
          ? node.id === "atlas-industry-general"
          : node.id === `atlas-industry-${industry}` || node.id === "atlas-industry-general";
      }
      if (node.kind !== "source") return true;
      const industryMatches = industry === "general"
        ? node.industries.includes("general")
        : node.industries.includes(industry);
      const timeMatches = timeLayer === "all"
        || (timeLayer === "foundational" && (node.temporal_role === "foundational" || node.temporal_role === "evergreen"))
        || (timeLayer === "current-development" && node.temporal_role === "current-development");
      return industryMatches && timeMatches;
    });

    if (!compactMap) return byLens;
    const directNeighbors = new Set(
      edges.flatMap((edge) => {
        if (edge.source === selectedNodeId) return [edge.target];
        if (edge.target === selectedNodeId) return [edge.source];
        return [];
      }),
    );
    return byLens.filter((node) =>
      node.mobile_priority === "core"
      || node.id === selectedNodeId
      || (node.mobile_priority === "context" && directNeighbors.has(node.id)),
    );
  }, [compactMap, edges, industry, nodes, selectedNodeId, timeLayer]);

  const visibleIds = useMemo(() => new Set(filteredNodes.map((node) => node.id)), [filteredNodes]);
  const resolvedSelectedNodeId = visibleIds.has(selectedNodeId) ? selectedNodeId : defaultNodeId;
  const filteredEdges = useMemo(
    () => edges.filter((edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target)),
    [edges, visibleIds],
  );

  const selectNode = useCallback((id: string) => {
    setSelectedNodeId(id);
    setGuideOpen(false);
    setIndustryPanelOpen(false);
  }, []);

  const selectViewMode = useCallback((nextView: ViewMode) => {
    setViewMode(nextView);
    setViewIsExplicit(true);
  }, []);

  const changeIndustry = (nextIndustry: ResourceIndustry) => {
    setIndustry(nextIndustry);
    setSelectedNodeId(defaultNodeId);
    setGuideOpen(false);
    setIndustryPanelOpen(false);
  };

  const changeTimeLayer = (nextTimeLayer: AtlasTimeLayerId) => {
    setTimeLayer(nextTimeLayer);
    if (nodeById.get(selectedNodeId)?.kind === "source") setSelectedNodeId(defaultNodeId);
    setGuideOpen(false);
  };

  const selectedNode = nodeById.get(resolvedSelectedNodeId) ?? nodeById.get(defaultNodeId)!;
  const selectedPathIndex = pathIndexById.get(selectedNode.id) ?? null;
  const relatedEdges = edges.filter((edge) => edge.source === selectedNode.id || edge.target === selectedNode.id);
  const relatedRelationshipLabels = Array.from(new Set(relatedEdges.map((edge) =>
    edge.relationship.replaceAll("-", " "),
  ))).slice(0, 2);
  const relatedSource = selectedNode.kind === "source"
    ? selectedNode
    : relatedEdges
      .map((edge) => nodeById.get(edge.source === selectedNode.id ? edge.target : edge.source))
      .find((node) => node?.kind === "source")
      ?? nodeById.get("src_0vf7hhg")
      ?? null;

  const movePath = (direction: -1 | 1) => {
    const current = selectedPathIndex ?? 0;
    const next = (current + direction + pathNodeIds.length) % pathNodeIds.length;
    selectNode(pathNodeIds[next]);
  };

  const groupedNodes = useMemo(() => Object.entries(clusterLabels).map(([cluster, label]) => ({
    cluster,
    label,
    nodes: filteredNodes.filter((node) => node.cluster === cluster),
  })).filter((group) => group.nodes.length), [filteredNodes]);

  return (
    <section aria-labelledby="atlas-explorer-title" className="atlas-explorer aa2-atlas-explorer">
      <header className="atlas-intro aa2-atlas-intro">
        <h1 id="atlas-explorer-title">The Living Atlas</h1>
        <p>
          Trace one accounting workflow through evidence, controls, agent capabilities,
          sources, and accountable review.
        </p>
      </header>

      <section aria-label="Atlas filters and view controls" className="atlas-instrument-rail aa2-atlas-instrument-rail">
        <div className="atlas-filter-rail aa2-atlas-filter-rail">
          <div className="atlas-lens-row">
            <span className="aa2-atlas-filter-icon" aria-hidden="true"><Funnel /></span>
            <span id="atlas-industry-lens-label" className="sr-only">Industry lens</span>
            <div aria-labelledby="atlas-industry-lens-label" className="atlas-lens-scroller" role="radiogroup">
              {industryLenses.map((lens) => (
                <button
                  aria-checked={industry === lens.id}
                  className="atlas-lens-button"
                  data-active={industry === lens.id ? "true" : undefined}
                  key={lens.id}
                  onClick={() => changeIndustry(lens.id)}
                  role="radio"
                  title={lens.description}
                  type="button"
                >
                  {lens.id === "general" ? <Buildings aria-hidden="true" /> : lens.id === "banking-credit-unions" ? <Bank aria-hidden="true" /> : <Buildings aria-hidden="true" />}
                  {lens.id === "general" ? "Industry" : lens.label.replace(" and credit unions", "").replace(" or life sciences", "")}
                </button>
              ))}
            </div>
          </div>

          <fieldset className="atlas-time-layer atlas-time-layer-rail">
            <legend><ClockCountdown aria-hidden="true" /> Time layer</legend>
            <div>
              <span>Foundational archive</span>
              <span>Current developments</span>
            </div>
            <label>
              <span className="sr-only">Time layer</span>
              <input
                aria-valuetext={timeLayers.find((layer) => layer.id === timeLayer)?.label}
                max={2}
                min={0}
                onInput={(event) => changeTimeLayer(timeLayers[Number(event.currentTarget.value)]?.id ?? "all")}
                step={1}
                type="range"
                value={timeLayers.findIndex((layer) => layer.id === timeLayer)}
              />
            </label>
            <p>{timeLayers.find((layer) => layer.id === timeLayer)?.description}</p>
          </fieldset>
        </div>

        <div className="atlas-rail-actions aa2-atlas-rail-actions">
          <div className="atlas-view-controls">
            <div aria-label="Atlas view" role="group">
              <button
                aria-pressed={viewMode === "map"}
                data-active={viewMode === "map" ? "true" : undefined}
                onClick={() => selectViewMode("map")}
                type="button"
              >
                <MapTrifold aria-hidden="true" /> Map
              </button>
              <button
                aria-pressed={viewMode === "list"}
                data-active={viewMode === "list" ? "true" : undefined}
                onClick={() => selectViewMode("list")}
                type="button"
              >
                <ListBullets aria-hidden="true" /> List
              </button>
            </div>
            <div aria-label="Move through guided path" role="group">
              <button aria-label="Previous path step" onClick={() => movePath(-1)} type="button"><CaretLeft aria-hidden="true" /></button>
              <button aria-label="Next path step" onClick={() => movePath(1)} type="button"><CaretRight aria-hidden="true" /></button>
            </div>
          </div>
        </div>
      </section>

      <nav aria-label="Guided Atlas path" className="atlas-path-progress aa2-atlas-path-progress">
        <p>Selected workflow <span>{selectedPathIndex === null ? "Explore" : `Step ${selectedPathIndex + 1} of ${pathNodeIds.length}`}</span></p>
        <ol>
          {pathNodeIds.map((id, index) => {
            const node = nodeById.get(id);
            if (!node) return null;
            return (
              <li key={id}>
                <button
                  aria-current={id === selectedNode.id ? "step" : undefined}
                  aria-label={`Step ${index + 1}: ${node.label}`}
                  data-current={id === selectedNode.id ? "true" : undefined}
                  onClick={() => selectNode(id)}
                  type="button"
                >
                  {index + 1}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="atlas-workspace aa2-atlas-workspace">
        <div className="atlas-map-pane aa2-atlas-map-pane">
          <div aria-label="Atlas legend" className="aa2-atlas-legend">
            {Object.entries(clusterLabels).map(([cluster, label]) => (
              <span data-cluster={cluster} key={cluster}><i aria-hidden="true" />{label}</span>
            ))}
          </div>
          {filtersInitialized && viewMode === "map" ? (
            <Suspense
              fallback={(
                <div aria-live="polite" className="aa2-atlas-loading" role="status">
                  <span aria-hidden="true" />
                  <p>Drawing the knowledge map…</p>
                </div>
              )}
            >
              <AtlasFlowMap
                compact={compactMap}
                edges={filteredEdges}
                nodes={filteredNodes}
                onSelect={selectNode}
                pathNodeIds={pathNodeIds}
                selectedNodeId={resolvedSelectedNodeId}
              />
            </Suspense>
          ) : (
            <div className="atlas-list-view" data-atlas-list>
              {groupedNodes.map((group) => (
                <section key={group.cluster}>
                  <h2>{group.label}</h2>
                  <ol>
                    {group.nodes.map((node) => (
                      <li key={node.id}>
                        <button
                          aria-current={node.id === selectedNode.id ? "true" : undefined}
                          onClick={() => selectNode(node.id)}
                          type="button"
                        >
                          <span className="atlas-list-glyph" data-cluster={node.cluster}><AtlasNodeGlyph record={node} /></span>
                          <span><strong>{node.label}</strong><small>{node.summary}</small></span>
                          <ArrowRight aria-hidden="true" />
                        </button>
                      </li>
                    ))}
                  </ol>
                </section>
              ))}
            </div>
          )}
        </div>

        <aside aria-label={`Selected Atlas node: ${selectedNode.label}`} className="atlas-inspector aa2-atlas-inspector" id={`atlas-inspector-${selectedNode.id}`}>
          <div className="atlas-inspector-heading">
            <div>
              <p>{selectedNode.id === "atlas-path-bank-reconciliation" ? "Workflow brief" : selectedPathIndex === null ? clusterLabels[selectedNode.cluster] : `Guided sequence · Step ${selectedPathIndex + 1} of ${pathNodeIds.length}`}</p>
              <h2>{selectedNode.id === "atlas-path-bank-reconciliation" ? "Bank reconciliations" : selectedNode.label}</h2>
            </div>
            <button aria-label="Close selected node details" className="aa2-atlas-close" onClick={() => selectNode(defaultNodeId)} type="button"><X aria-hidden="true" /></button>
          </div>

          <p className="atlas-inspector-summary">{selectedNode.summary}</p>
          <p className="atlas-inspector-detail">{selectedNode.detail}</p>

          <div className="atlas-classification-row">
            <span>Evidence classification</span>
            <strong data-evidence-classification={selectedNode.evidence_classification}>
              {evidenceLabels[selectedNode.evidence_classification]}
            </strong>
          </div>

          {selectedNode.example && (
            <section className="atlas-example-card">
              <div><WarningDiamond aria-hidden="true" /><h3>{selectedNode.example.title}</h3></div>
              <p>{selectedNode.example.text}</p>
              <span data-evidence-classification="synthetic-example">Synthetic example · fictional</span>
            </section>
          )}

          <div className="atlas-related-row">
            <span>Related to</span>
            <ul>
              <li>{selectedNode.kind.replaceAll("-", " ")}</li>
              <li>{clusterLabels[selectedNode.cluster]}</li>
              {relatedRelationshipLabels.map((label) => <li key={label}>{label}</li>)}
            </ul>
          </div>

          {relatedSource?.source && (
            <section className="atlas-source-card">
              <div className="atlas-source-card-heading">
                <BookOpen aria-hidden="true" />
                <div>
                  <p>Primary source</p>
                  <h3>{relatedSource.label}</h3>
                </div>
              </div>
              <dl>
                <div><dt>Source ID</dt><dd><code>{relatedSource.id}</code></dd></div>
                <div><dt>Publisher</dt><dd>{relatedSource.source.publisher}</dd></div>
                <div><dt>Status</dt><dd>{relatedSource.source.published_or_status}</dd></div>
              </dl>
              <p>{relatedSource.source.transfer_limit}</p>
              <div className="atlas-source-links">
                <Link href={relatedSource.href ?? "/resources"}>Inspect source record <ArrowRight aria-hidden="true" /></Link>
                <a href={relatedSource.source.original_href} rel="noreferrer" target="_blank">Original source <ArrowSquareOut aria-hidden="true" /></a>
              </div>
            </section>
          )}

          <div className="atlas-learning-actions aa2-atlas-learning-actions">
            <Link className="aa2-atlas-primary-action" href={selectedNode.href ?? "/workflows/record-to-report/wf-r2r-bank-reconciliations"}>
              <span><FileText aria-hidden="true" /></span>
              <span><strong>Open the workflow brief</strong><small>Read the context and design constraints behind this map.</small></span>
              <ArrowSquareOut aria-hidden="true" />
            </Link>
            <Link className="aa2-atlas-return-action" href="/tutorials/bank-reconciliation">
              <CaretLeft aria-hidden="true" />
              <span>Return to the lesson</span>
            </Link>
            <button aria-expanded={guideOpen} onClick={() => setGuideOpen((open) => !open)} type="button">
              <span><Compass aria-hidden="true" /></span>
              <span><strong>Ask the guide</strong><small>Trace why this relationship exists</small></span>
              <ArrowRight aria-hidden="true" />
            </button>
            <button aria-expanded={industryPanelOpen} onClick={() => setIndustryPanelOpen((open) => !open)} type="button">
              <span><Buildings aria-hidden="true" /></span>
              <span><strong>Compare industries</strong><small>Change only the reviewed applicability lens</small></span>
              <ArrowRight aria-hidden="true" />
            </button>
          </div>

          {guideOpen && (
            <section aria-live="polite" className="atlas-guide-panel">
              <div><Question aria-hidden="true" /><h3>{selectedNode.guide?.prompt ?? "What evidence would change your next step?"}</h3></div>
              <ol>
                {(selectedNode.guide?.questions ?? [
                  "Which claim are you trying to support?",
                  "What is missing, contradictory, or outside scope?",
                  "Which accountable person owns the conclusion?",
                ]).map((question) => <li key={question}>{question}</li>)}
              </ol>
              {selectedNode.guide?.next_href && selectedNode.guide.next_label && (
                <Link href={selectedNode.guide.next_href}>{selectedNode.guide.next_label} <ArrowRight aria-hidden="true" /></Link>
              )}
              <p>The guide helps frame review questions. It does not approve the answer.</p>
            </section>
          )}

          {industryPanelOpen && (
            <section aria-live="polite" className="atlas-industry-panel">
              <h3>Choose a reviewed industry lens</h3>
              <p>General material is not silently treated as industry-specific.</p>
              <div>
                {industryLenses.map((lens) => (
                  <button
                    aria-pressed={industry === lens.id}
                    key={lens.id}
                    onClick={() => changeIndustry(lens.id)}
                    type="button"
                  >
                    {lens.label}
                  </button>
                ))}
              </div>
            </section>
          )}

          <div className="atlas-provenance">
            <span>Stable node <code>{selectedNode.id}</code></span>
            <span>Reviewed {selectedNode.reviewed_at}</span>
            <span>{selectedNode.provenance.source_file}</span>
          </div>
        </aside>
      </div>
    </section>
  );
}
