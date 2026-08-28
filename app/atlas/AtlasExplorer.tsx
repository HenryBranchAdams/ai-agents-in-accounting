"use client";

import "@xyflow/react/dist/style.css";

import {
  ArrowRight,
  ArrowSquareOut,
  Bank,
  BookOpen,
  Buildings,
  CaretLeft,
  CaretRight,
  Check,
  Compass,
  FileText,
  ListBullets,
  MapTrifold,
  Question,
  Robot,
  Scales,
  ShieldCheck,
  WarningDiamond,
} from "@phosphor-icons/react";
import {
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  AtlasEdge,
  AtlasNode,
  AtlasTimeLayerId,
} from "../atlas-data";
import type { ResourceIndustry } from "../resources-data";

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

type AtlasFlowData = {
  onSelect: (id: string) => void;
  record: AtlasNode;
  pathIndex: number | null;
  selected: boolean;
};

type AtlasFlowNode = Node<AtlasFlowData, "atlasNode">;

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

function NodeGlyph({ record }: { record: AtlasNode }) {
  if (record.kind === "workflow") return <Bank aria-hidden="true" />;
  if (record.kind === "human-gate") return <Scales aria-hidden="true" />;
  if (record.kind === "control") return <ShieldCheck aria-hidden="true" />;
  if (record.kind === "capability") return <Robot aria-hidden="true" />;
  if (record.kind === "source") return <BookOpen aria-hidden="true" />;
  if (record.kind === "industry") return <Buildings aria-hidden="true" />;
  return <WarningDiamond aria-hidden="true" />;
}

function AtlasNodeCard({ data }: NodeProps<AtlasFlowNode>) {
  const { onSelect, record, pathIndex, selected } = data;
  return (
    <>
      <Handle className="atlas-handle" position={Position.Left} type="target" />
      <button
        aria-current={selected ? "step" : undefined}
        className="atlas-node-card nodrag nopan"
        data-cluster={record.cluster}
        data-kind={record.kind}
        data-node-id={record.id}
        data-path-node={pathIndex === null ? undefined : "true"}
        data-selected={selected ? "true" : undefined}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(record.id);
        }}
        type="button"
      >
        <span aria-hidden="true" className="atlas-node-orb">
          <NodeGlyph record={record} />
        </span>
        <span className="atlas-node-label">{record.short_label}</span>
        {pathIndex !== null && (
          <span aria-label={`Path step ${pathIndex + 1}`} className="atlas-node-step">
            {pathIndex + 1}
          </span>
        )}
      </button>
      <Handle className="atlas-handle" position={Position.Right} type="source" />
    </>
  );
}

const nodeTypes = { atlasNode: AtlasNodeCard };

function isIndustry(value: string | null, lenses: readonly AtlasIndustryLens[]): value is ResourceIndustry {
  return Boolean(value && lenses.some((lens) => lens.id === value));
}

function isTimeLayer(value: string | null, layers: readonly AtlasTimeLayer[]): value is AtlasTimeLayerId {
  return Boolean(value && layers.some((layer) => layer.id === value));
}

function isViewMode(value: string | null): value is ViewMode {
  return value === "map" || value === "list";
}

function AtlasMap({
  compact,
  edges,
  nodes,
  onSelect,
}: {
  compact: boolean;
  edges: Edge[];
  nodes: AtlasFlowNode[];
  onSelect: (id: string) => void;
}) {
  const { fitView } = useReactFlow<AtlasFlowNode>();
  const layoutKey = nodes
    .map((node) => `${node.id}:${node.position.x}:${node.position.y}`)
    .join("|");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void fitView({ maxZoom: 1.08, minZoom: 0.24, padding: compact ? 0.08 : 0.16 });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [compact, fitView, layoutKey]);

  return (
    <div
      className="atlas-map"
      data-atlas-map
      onKeyDownCapture={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        const nodeButton = (event.target as Element).closest<HTMLButtonElement>("button.atlas-node-card[data-node-id]");
        const nodeId = nodeButton?.dataset.nodeId;
        if (!nodeId) return;
        event.preventDefault();
        event.stopPropagation();
        onSelect(nodeId);
      }}
    >
      <div aria-hidden="true" className="atlas-cluster-labels">
        <span data-cluster="accounting-work"><FileText /> Accounting work</span>
        <span data-cluster="controls-risks"><ShieldCheck /> Controls &amp; risks</span>
        <span data-cluster="agent-capabilities"><Robot /> Agent capabilities</span>
        <span data-cluster="primary-sources"><BookOpen /> Primary sources</span>
        <span data-cluster="industries"><Buildings /> Industries</span>
      </div>
      <ReactFlow
        aria-label="Living Atlas knowledge graph. Use Tab to move through nodes or switch to list view for a linear equivalent."
        colorMode="light"
        connectOnClick={false}
        deleteKeyCode={null}
        edges={edges}
        edgesFocusable
        edgesReconnectable={false}
        elementsSelectable
        fitView
        fitViewOptions={{ maxZoom: 1.08, minZoom: 0.24, padding: compact ? 0.08 : 0.16 }}
        maxZoom={1.8}
        minZoom={0.22}
        nodeTypes={nodeTypes}
        nodes={nodes}
        nodesConnectable={false}
        nodesDraggable={false}
        nodesFocusable={false}
        onNodeClick={(_, node) => onSelect(node.id)}
        panOnDrag
        proOptions={{ hideAttribution: false }}
        zoomOnDoubleClick={false}
        zoomOnPinch
        zoomOnScroll={false}
      >
        <Controls position="top-right" showInteractive={false} />
      </ReactFlow>
    </div>
  );
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
  const [viewMode, setViewMode] = useState<ViewMode>("map");
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
      setViewMode(isViewMode(requestedView) ? requestedView : "map");
      setFiltersInitialized(true);
    };

    readLocation();
    window.addEventListener("popstate", readLocation);
    return () => window.removeEventListener("popstate", readLocation);
  }, [defaultNodeId, industryLenses, nodeById, timeLayers]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 720px), (min-width: 700px) and (max-height: 600px)");
    const update = () => setCompactMap(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!filtersInitialized) return;
    const parameters = new URLSearchParams(window.location.search);
    parameters.set("node", selectedNodeId);
    parameters.set("industry", industry);
    parameters.set("time_layer", timeLayer);
    parameters.set("view", viewMode);
    window.history.replaceState(null, "", `${window.location.pathname}?${parameters}${window.location.hash}`);
  }, [filtersInitialized, industry, selectedNodeId, timeLayer, viewMode]);

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

  const compactPositions = useMemo(() => {
    const positions = new Map<string, { x: number; y: number }>();
    pathNodeIds.forEach((id, index) => positions.set(id, { x: index * 165, y: 230 }));

    const contextByCluster = new Map<AtlasNode["cluster"], AtlasNode[]>();
    filteredNodes.filter((node) => !pathIndexById.has(node.id)).forEach((node) => {
      const group = contextByCluster.get(node.cluster) ?? [];
      group.push(node);
      contextByCluster.set(node.cluster, group);
    });

    const anchors: Record<AtlasNode["cluster"], { x: number; y: number; step: number }> = {
      "accounting-work": { x: 20, y: 35, step: 130 },
      "controls-risks": { x: 175, y: 35, step: 135 },
      "agent-capabilities": { x: 60, y: 420, step: 135 },
      "primary-sources": { x: 310, y: 420, step: 130 },
      industries: { x: 495, y: 420, step: 120 },
    };

    contextByCluster.forEach((group, cluster) => {
      const anchor = anchors[cluster];
      group.forEach((node, index) => positions.set(node.id, {
        x: anchor.x + index * anchor.step,
        y: anchor.y,
      }));
    });
    return positions;
  }, [filteredNodes, pathIndexById, pathNodeIds]);

  const flowNodes: AtlasFlowNode[] = useMemo(() => filteredNodes.map((record) => ({
    id: record.id,
    type: "atlasNode",
    position: compactMap ? compactPositions.get(record.id) ?? record.position : record.position,
    data: {
      onSelect: selectNode,
      record,
      pathIndex: pathIndexById.get(record.id) ?? null,
      selected: record.id === resolvedSelectedNodeId,
    },
    ariaLabel: `${record.label}. ${record.summary}`,
    className: "atlas-flow-node",
    draggable: false,
    selectable: true,
  })), [compactMap, compactPositions, filteredNodes, pathIndexById, resolvedSelectedNodeId, selectNode]);

  const flowEdges: Edge[] = useMemo(() => filteredEdges.map((record) => ({
    id: record.id,
    source: record.source,
    target: record.target,
    type: record.path_edge ? "smoothstep" : "default",
    label: compactMap || !record.path_edge ? undefined : record.label,
    ariaLabel: `${nodeById.get(record.source)?.label ?? record.source} ${record.label} ${nodeById.get(record.target)?.label ?? record.target}`,
    focusable: true,
    animated: false,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: record.path_edge ? "#176b4d" : "#94a3b8",
      height: record.path_edge ? 16 : 12,
      width: record.path_edge ? 16 : 12,
    },
    style: {
      stroke: record.path_edge ? "#176b4d" : "#a9b7c5",
      strokeDasharray: record.path_edge ? undefined : "5 6",
      strokeWidth: record.path_edge ? 2.5 : 1.25,
    },
    labelStyle: { fill: "#176b4d", fontSize: 11, fontWeight: 650 },
    labelBgStyle: { fill: "#fffdf9", fillOpacity: 0.94 },
    labelBgPadding: [5, 3],
    labelBgBorderRadius: 5,
  })), [compactMap, filteredEdges, nodeById]);

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
    <section aria-labelledby="atlas-explorer-title" className="atlas-explorer">
      <div className="atlas-lens-row">
        <span>Industry lens</span>
        <div aria-label="Industry lens" className="atlas-lens-scroller" role="radiogroup">
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
              {lens.label.replace(" and credit unions", "").replace(" or life sciences", "")}
            </button>
          ))}
        </div>
      </div>

      <div className="atlas-intro">
        <p className="atlas-eyebrow">Source-linked learning map</p>
        <h1 id="atlas-explorer-title">The Living Atlas</h1>
        <p>
          Explore how accounting work, controls, agent capabilities, primary sources,
          and industry context connect across time.
        </p>
      </div>

      <nav aria-label="Guided Atlas path" className="atlas-path-progress">
        <p>Your path <span>{selectedPathIndex === null ? "Explore" : `${selectedPathIndex + 1} of ${pathNodeIds.length}`}</span></p>
        <ol>
          {pathNodeIds.map((id, index) => {
            const node = nodeById.get(id);
            if (!node) return null;
            const complete = selectedPathIndex !== null && index < selectedPathIndex;
            return (
              <li key={id}>
                <button
                  aria-current={id === selectedNode.id ? "step" : undefined}
                  aria-label={`Step ${index + 1}: ${node.label}`}
                  data-complete={complete ? "true" : undefined}
                  data-current={id === selectedNode.id ? "true" : undefined}
                  onClick={() => selectNode(id)}
                  type="button"
                >
                  {complete ? <Check aria-hidden="true" weight="bold" /> : index + 1}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="atlas-workspace">
        <div className="atlas-map-pane">
          <div className="atlas-view-controls">
            <div aria-label="Atlas view" role="group">
              <button
                aria-pressed={viewMode === "map"}
                data-active={viewMode === "map" ? "true" : undefined}
                onClick={() => setViewMode("map")}
                type="button"
              >
                <MapTrifold aria-hidden="true" /> Map
              </button>
              <button
                aria-pressed={viewMode === "list"}
                data-active={viewMode === "list" ? "true" : undefined}
                onClick={() => setViewMode("list")}
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

          {viewMode === "map" ? (
            <ReactFlowProvider>
              <AtlasMap compact={compactMap} edges={flowEdges} nodes={flowNodes} onSelect={selectNode} />
            </ReactFlowProvider>
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
                          <span className="atlas-list-glyph" data-cluster={node.cluster}><NodeGlyph record={node} /></span>
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

        <aside aria-label={`Selected Atlas node: ${selectedNode.label}`} className="atlas-inspector" id={`atlas-inspector-${selectedNode.id}`}>
          <div className="atlas-inspector-heading">
            <div>
              <p>{selectedPathIndex === null ? clusterLabels[selectedNode.cluster] : `Your path · Step ${selectedPathIndex + 1} of ${pathNodeIds.length}`}</p>
              <h2>{selectedNode.label}</h2>
            </div>
            <span className="atlas-selection-glyph" data-cluster={selectedNode.cluster}><NodeGlyph record={selectedNode} /></span>
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

          <div className="atlas-learning-actions">
            <Link href="/tutorials/bank-reconciliation">
              <span><FileText aria-hidden="true" /></span>
              <span><strong>Try a case</strong><small>Work a short synthetic scenario with guided feedback</small></span>
              <ArrowRight aria-hidden="true" />
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

          <section className="atlas-time-layer">
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
          </section>

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
