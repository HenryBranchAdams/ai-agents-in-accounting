import { graphColor } from "../lib/graph-color";
import { useEffect, useRef } from "react";
import cytoscape, { type Core } from "cytoscape";
import { Button } from "./ui/button";
import {
  matchingRecords,
  type LibraryMapData,
  type MapState,
} from "../library-map/contract";
export interface MapMemory {
  viewport?: { zoom: number; pan: { x: number; y: number } };
  positions: Record<string, { x: number; y: number }>;
}
const fitNodes = (
  cy: Core,
  nodes = cy.nodes(),
  padding = 35,
  maxZoom = cy.maxZoom(),
) => {
  const box = nodes.boundingBox({
    includeLabels: false,
    includeOverlays: false,
  });
  const zoom = Math.max(
    cy.minZoom(),
    Math.min(
      maxZoom,
      (cy.width() - 2 * padding) / Math.max(1, box.w),
      (cy.height() - 2 * padding) / Math.max(1, box.h),
    ),
  );
  cy.viewport({
    zoom,
    pan: {
      x: cy.width() / 2 - ((box.x1 + box.x2) * zoom) / 2,
      y: cy.height() / 2 - ((box.y1 + box.y2) * zoom) / 2,
    },
  });
};
export function LibraryMapCanvas({
  data,
  state,
  onSelect,
  onEdge,
  memory,
  reset,
  restore,
}: {
  data: LibraryMapData;
  state: MapState;
  onSelect: (id: string, topic: boolean) => void;
  onEdge: (id: string) => void;
  memory: MapMemory;
  reset: number;
  restore: number;
}) {
  const host = useRef<HTMLDivElement>(null),
    cyRef = useRef<Core | null>(null),
    selectRef = useRef(onSelect),
    edgeRef = useRef(onEdge);
  selectRef.current = onSelect;
  edgeRef.current = onEdge;
  const stateRef = useRef(state);
  stateRef.current = state;
  const labelsRef = useRef<() => void>(() => {});
  const positionsRef = useRef<() => void>(() => {});
  useEffect(() => {
    if (!host.current) return;
    const started = performance.now();
    const container = host.current,
      foreground = graphColor("--foreground"),
      muted = graphColor("--muted-foreground"),
      border = graphColor("--border"),
      background = graphColor("--card");
    const elements = [
      ...data.records.map((r) => ({
        data: { id: r.id, title: r.title, kind: r.kind, topic: false },
        position: memory.positions[r.id] || { x: r.x, y: r.y },
      })),
      ...data.topics.map((t) => ({
        data: { id: t.id, title: t.title, count: t.count, topic: true },
        position: memory.positions[t.id] || { x: t.x, y: t.y },
      })),
    ];
    const cy = cytoscape({
      container,
      elements,
      layout: { name: "preset" },
      minZoom: 0.01,
      maxZoom: 8,
      wheelSensitivity: 0.2,
      userZoomingEnabled: matchMedia("(pointer:coarse)").matches,
      boxSelectionEnabled: false,
      autounselectify: true,
      style: [
        {
          selector: "node",
          style: {
            width: 4,
            height: 4,
            "background-color": muted,
            "border-width": 0,
            "overlay-opacity": 0,
            "z-index-compare": "manual",
          },
        },
        {
          selector: 'node[kind="collection"]',
          style: { shape: "diamond", width: 8, height: 8 },
        },
        {
          selector: "node[?topic]",
          style: {
            width: 8,
            height: 8,
            "background-color": foreground,
            label: "data(title)",
            "text-opacity": 0,
            color: foreground,
            "text-valign": "top",
            "font-size": 14,
            "text-wrap": "wrap",
            "text-background-color": background,
            "text-background-opacity": 1,
            "text-background-padding": "3px",
            "text-background-shape": "roundrectangle",
          },
        },
        { selector: ".dim", style: { opacity: 0.16 } },
        {
          selector: ".selected",
          style: {
            width: 16,
            height: 16,
            "background-color": foreground,
            "border-color": background,
            "border-width": 2,
          },
        },
        {
          selector: "edge",
          style: {
            width: 1,
            "line-color": border,
            "target-arrow-color": muted,
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            "arrow-scale": 0.65,
          },
        },
        { selector: 'edge[type="cites"]', style: { "line-style": "dotted" } },
        { selector: 'edge[type="related"]', style: { "line-style": "dashed" } },
        {
          selector: 'edge[type="member"]',
          style: { "target-arrow-shape": "none", "line-style": "solid" },
        },
        {
          selector: "edge.chosen",
          style: {
            width: 3,
            "line-color": foreground,
            label: "data(type)",
            "font-size": 12,
            "text-background-color": background,
            "text-background-opacity": 1,
          },
        },
      ],
    });
    cyRef.current = cy;
    container.dataset.records = String(data.records.length);
    container.dataset.topics = String(data.topics.length);
    const recordPositions = () => {
      container.dataset.positions = JSON.stringify(
        cy.nodes().map((n) => ({ id: n.id(), ...n.position() })),
      );
    };
    positionsRef.current = recordPositions;
    recordPositions();
    cy.one("render", () => {
      container.dataset.readyMs = String(performance.now() - started);
      performance.mark("library-map-ready");
    });
    if (memory.viewport) cy.viewport(memory.viewport);
    else fitNodes(cy);
    let frame = 0;
    const labels = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (cy.destroyed()) return;
        const taken: {
            id: string;
            x: number;
            y: number;
            w: number;
            h: number;
          }[] = [],
          zoom = cy.zoom();
        cy.batch(() =>
          cy
            .nodes("[?topic]")
            .sort(
              (a, b) =>
                Number(b.id() === stateRef.current.topic) -
                  Number(a.id() === stateRef.current.topic) ||
                b.data("count") - a.data("count"),
            )
            .forEach((n) => {
              const p = n.renderedPosition(),
                title = String(n.data("title")),
                w = Math.min(title.length * 7, 210),
                h = Math.max(24, Math.ceil((title.length * 7) / 210) * 16 + 8),
                r = {
                  id: n.id(),
                  x: p.x - w / 2 - 5,
                  y: p.y - h - 14,
                  w: w + 10,
                  h: h + 10,
                };
              const show =
                !n.hasClass("dim") &&
                r.x >= 0 &&
                r.y >= 0 &&
                r.x + r.w <= cy.width() &&
                r.y + r.h <= cy.height() &&
                !taken.some(
                  (b) =>
                    r.x < b.x + b.w &&
                    r.x + r.w > b.x &&
                    r.y < b.y + b.h &&
                    r.y + r.h > b.y,
                );
              if (show) taken.push(r);
              n.style({
                "text-events": show ? "yes" : "no",
                "z-index": show ? 20 : 1,
                "text-opacity": show ? 1 : 0,
                "font-size": 13 / zoom,
                "text-max-width": 210 / zoom,
                "text-margin-y": -8 / zoom,
              });
            }),
        );
        memory.viewport = { zoom: cy.zoom(), pan: cy.pan() };
        container.dataset.viewport = JSON.stringify(memory.viewport);
        container.dataset.labels = JSON.stringify(taken);
        const selected = cy.getElementById(
          stateRef.current.record || stateRef.current.topic,
        );
        if (selected.length)
          container.dataset.selectedPoint = JSON.stringify(
            selected.renderedPosition(),
          );
      });
    };
    labelsRef.current = labels;
    cy.on("tap", "node", (event) =>
      selectRef.current(event.target.id(), Boolean(event.target.data("topic"))),
    );
    cy.on("tap", "edge", (event) => {
      if (event.target.data("type") !== "member")
        edgeRef.current(event.target.id());
    });
    cy.on("dragfree", "node", (event) => {
      memory.positions[event.target.id()] = { ...event.target.position() };
      recordPositions();
    });
    cy.on("zoom pan", labels);
    labels();
    let manuallyMoved = Boolean(memory.viewport),
      previousWidth = container.clientWidth,
      previousHeight = container.clientHeight;
    const moved = () => {
      manuallyMoved = true;
    };
    container.addEventListener("pointerdown", moved);
    const observer = new ResizeObserver(() => {
      const changed =
        previousWidth !== container.clientWidth ||
        previousHeight !== container.clientHeight;
      previousWidth = container.clientWidth;
      previousHeight = container.clientHeight;
      cy.resize();
      if (changed) {
        if (stateRef.current.record)
          cy.center(cy.getElementById(stateRef.current.record));
        else if (!manuallyMoved && !stateRef.current.topic) fitNodes(cy);
      }
      labels();
    });
    observer.observe(container);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      container.removeEventListener("pointerdown", moved);
      memory.viewport = { zoom: cy.zoom(), pan: cy.pan() };
      cy.destroy();
      cyRef.current = null;
    };
  }, [data, memory]);
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    const matching = new Set(matchingRecords(data, state).map((r) => r.id)),
      topicMatches = new Set(
        data.records.filter((r) => matching.has(r.id)).flatMap((r) => r.topics),
      );
    const filtered = !!(
      state.q ||
      state.topic ||
      state.kind ||
      state.collection
    );
    cy.batch(() => {
      cy.nodes().removeClass("dim selected");
      cy.edges().remove();
      if (filtered)
        cy.nodes().forEach((n) => {
          if (!(n.data("topic") ? topicMatches : matching).has(n.id()))
            n.addClass("dim");
        });
      const chosen = state.record || state.topic;
      if (chosen)
        cy.getElementById(chosen).addClass("selected").removeClass("dim");
      const relations = state.record
        ? data.edges.filter(
            (e) => e.from === state.record || e.to === state.record,
          )
        : [];
      if (relations.length)
        cy.add(
          relations.map((e) => ({
            data: { id: e.id, source: e.from, target: e.to, type: e.type },
            classes: e.id === state.edge ? "chosen" : "",
          })),
        );
      if (state.topic)
        cy.add(
          data.records
            .filter((r) => r.topics.includes(state.topic))
            .map((r) => ({
              data: {
                id: `member:${r.id}`,
                source: r.id,
                target: state.topic,
                type: "member",
              },
            })),
        );
    });
    labelsRef.current();
  }, [data, state]);
  const previous = useRef(memory.viewport ? state.record || state.topic : "");
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    const target = state.record || state.topic;
    if (target && target !== previous.current) {
      if (state.record) {
        cy.center(cy.getElementById(target));
        cy.zoom({
          level: Math.max(cy.zoom(), 1.1),
          renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 },
        });
      } else {
        const ids = new Set(
          data.records
            .filter((r) => r.topics.includes(target))
            .map((r) => r.id),
        );
        ids.add(target);
        fitNodes(
          cy,
          cy.nodes().filter((n) => ids.has(n.id())),
          45,
          2.2,
        );
      }
    }
    previous.current = target;
  }, [data, state.record, state.topic]);
  useEffect(() => {
    const cy = cyRef.current;
    if (reset && cy) {
      cy.batch(() => {
        for (const n of [...data.records, ...data.topics])
          cy.getElementById(n.id).position({ x: n.x, y: n.y });
      });
      positionsRef.current();
      fitNodes(cy);
    }
  }, [reset, data]);
  useEffect(() => {
    if (restore && memory.viewport) cyRef.current?.viewport(memory.viewport);
  }, [restore, memory]);
  const zoom = (factor: number) => {
    const cy = cyRef.current;
    if (cy)
      cy.zoom({
        level: cy.zoom() * factor,
        renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 },
      });
  };
  return (
    <>
      <div
        className="flex flex-wrap items-center gap-2 p-3"
        aria-label="Map navigation"
      >
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => cyRef.current && fitNodes(cyRef.current)}
        >
          Fit whole library
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => zoom(1.4)}
          aria-label="Zoom in"
        >
          +
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => zoom(1 / 1.4)}
          aria-label="Zoom out"
        >
          −
        </Button>
        <a href="#map-record-list">Explore with keyboard</a>
      </div>
      <div
        ref={host}
        className="library-map-canvas"
        role="img"
        aria-label={`${data.records.length} records and ${data.topics.length} topics. Use the List and filters for keyboard exploration.`}
      />
      <p className="px-3 pb-3 text-xs text-muted-foreground">
        Drag to pan. Use + / − to zoom, or pinch on touch screens. Select a
        point to inspect it. Positions do not indicate evidentiary support.
      </p>
    </>
  );
}
