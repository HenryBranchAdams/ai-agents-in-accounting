"use client";

import "@xyflow/react/dist/style.css";

import {
  BookOpen,
  Buildings,
  FileText,
  Robot,
  ShieldCheck,
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
import { useEffect, useMemo } from "react";
import type { AtlasEdge, AtlasNode } from "../atlas-data";
import { AtlasNodeGlyph } from "./AtlasNodeGlyph";

type AtlasFlowData = {
  onSelect: (id: string) => void;
  record: AtlasNode;
  pathIndex: number | null;
  selected: boolean;
};

type AtlasFlowNode = Node<AtlasFlowData, "atlasNode">;

const pathPhases: Record<string, { label: string; detail: string }> = {
  "atlas-path-bank-reconciliation": {
    label: "Evidence",
    detail: "Collect and verify source records.",
  },
  "atlas-step-matching-evidence": {
    label: "Prepare",
    detail: "Draft the reconciliation and link supporting evidence.",
  },
  "atlas-step-exception-handling": {
    label: "Review",
    detail: "Assess the draft and flag adjustments.",
  },
  "atlas-step-reviewer-approval": {
    label: "Approve",
    detail: "Approve conclusions and record final adjustments.",
  },
};

function AtlasNodeCard({ data }: NodeProps<AtlasFlowNode>) {
  const { onSelect, record, pathIndex, selected } = data;
  const pathPhase = pathPhases[record.id];
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
          <AtlasNodeGlyph record={record} />
        </span>
        <span className="atlas-node-label">{pathPhase?.label ?? record.short_label}</span>
        {pathPhase && <span className="aa2-atlas-node-detail">{pathPhase.detail}</span>}
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

function AtlasMapCanvas({
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
  const layoutKey = nodes.map((node) => `${node.id}:${node.position.x}:${node.position.y}`).join("|");

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
        <Controls position="bottom-left" showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

export default function AtlasFlowMap({
  compact,
  edges,
  nodes,
  onSelect,
  pathNodeIds,
  selectedNodeId,
}: {
  compact: boolean;
  edges: AtlasEdge[];
  nodes: AtlasNode[];
  onSelect: (id: string) => void;
  pathNodeIds: string[];
  selectedNodeId: string;
}) {
  const nodeById = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);
  const pathIndexById = useMemo(() => new Map(pathNodeIds.map((id, index) => [id, index])), [pathNodeIds]);

  const compactPositions = useMemo(() => {
    const positions = new Map<string, { x: number; y: number }>();
    pathNodeIds.forEach((id, index) => positions.set(id, { x: index * 165, y: 230 }));

    const contextByCluster = new Map<AtlasNode["cluster"], AtlasNode[]>();
    nodes.filter((node) => !pathIndexById.has(node.id)).forEach((node) => {
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
  }, [nodes, pathIndexById, pathNodeIds]);

  const flowNodes: AtlasFlowNode[] = useMemo(() => nodes.map((record) => ({
    id: record.id,
    type: "atlasNode",
    position: compact ? compactPositions.get(record.id) ?? record.position : record.position,
    data: {
      onSelect,
      record,
      pathIndex: pathIndexById.get(record.id) ?? null,
      selected: record.id === selectedNodeId,
    },
    ariaLabel: `${record.label}. ${record.summary}`,
    className: "atlas-flow-node",
    draggable: false,
    selectable: true,
  })), [compact, compactPositions, nodes, onSelect, pathIndexById, selectedNodeId]);

  const flowEdges: Edge[] = useMemo(() => edges.map((record) => ({
    id: record.id,
    source: record.source,
    target: record.target,
    type: record.path_edge ? "smoothstep" : "default",
    label: compact || !record.path_edge ? undefined : record.label,
    ariaLabel: `${nodeById.get(record.source)?.label ?? record.source} ${record.label} ${nodeById.get(record.target)?.label ?? record.target}`,
    focusable: true,
    animated: false,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: record.path_edge ? "#4f46d9" : "#9b9ead",
      height: record.path_edge ? 16 : 12,
      width: record.path_edge ? 16 : 12,
    },
    style: {
      stroke: record.path_edge ? "#4f46d9" : "#afb1bd",
      strokeDasharray: record.path_edge ? undefined : "5 6",
      strokeWidth: record.path_edge ? 2.5 : 1.25,
    },
    labelStyle: { fill: "#3b39ad", fontSize: 11, fontWeight: 650 },
    labelBgStyle: { fill: "#ffffff", fillOpacity: 0.94 },
    labelBgPadding: [5, 3],
    labelBgBorderRadius: 5,
  })), [compact, edges, nodeById]);

  return (
    <ReactFlowProvider>
      <AtlasMapCanvas compact={compact} edges={flowEdges} nodes={flowNodes} onSelect={onSelect} />
    </ReactFlowProvider>
  );
}
