import { useEffect, useRef, useState } from 'react';
import cytoscape, { type Core, type StylesheetStyle } from 'cytoscape';
import type { ConnectionViewDTO } from '../connections/view';
import type { ConnectionState } from '../connections/state';
import { placeConnections, type GraphPosition } from '../connections/layout';
import { Button } from './ui/button';

export interface ConnectionCanvasMemory { positions: Map<string, GraphPosition>; focus: string | null; viewport?: { zoom: number; pan: GraphPosition } }
const minimumZoom = 0.6;
function tokenColor(token: string) {
  // Resolve the project's semantic color through the browser's color parser.
  // Cytoscape's color parser does not support every modern CSS color syntax.
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1;
  const context = canvas.getContext('2d')!;
  context.fillStyle = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  context.fillRect(0, 0, 1, 1);
  const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
  return `rgb(${r},${g},${b})`;
}
const shortTitle = (title: string) => title.length > 46 ? title.slice(0, 43) + '…' : title;
export function ConnectionCanvas({ view, onSelect, memory }: { view: ConnectionViewDTO; onSelect: (selection: ConnectionState['selected']) => void; memory: ConnectionCanvasMemory }) {
  const container = useRef<HTMLDivElement>(null), core = useRef<Core | null>(null);
  const restoreViewport = useRef(true);
  const selectionHandler = useRef(onSelect); selectionHandler.current = onSelect;
  const [notice, setNotice] = useState('');
  const fit = () => {
    const cy = core.current; if (!cy) return;
    cy.fit(undefined, 28);
    const clipped = cy.zoom() <= minimumZoom;
    setNotice(clipped ? 'Fit reached the readable zoom limit. Pan to other nodes or use the List.' : 'All visible graph elements fit in the viewport.');
  };
  useEffect(() => {
    if (!container.current) return;
    const foreground = tokenColor('--foreground'), background = tokenColor('--card'), border = tokenColor('--border'), selected = tokenColor('--primary');
    const style: StylesheetStyle[] = [
      { selector: 'node', style: { width: 112, height: 48, 'background-color': background, 'border-color': border, 'border-width': 2, color: foreground, label: 'data(label)', 'font-size': 20, 'text-wrap': 'wrap', 'text-max-width': '150px', 'text-valign': 'bottom', 'text-margin-y': 6 } },
      { selector: 'node[role = "source"]', style: { shape: 'ellipse' } },
      { selector: 'node[role = "workflow"]', style: { shape: 'round-rectangle' } },
      { selector: 'node[role = "example"]', style: { shape: 'diamond' } },
      { selector: 'node[role = "guide"]', style: { shape: 'hexagon' } },
      { selector: 'node.focus', style: { 'border-width': 4, 'border-color': selected } },
      { selector: 'edge', style: { width: 1.5, 'line-color': border, 'target-arrow-color': foreground, 'target-arrow-shape': 'triangle', 'curve-style': 'bezier', 'font-size': 16, color: foreground, 'text-background-color': background, 'text-background-opacity': 1, 'text-background-padding': '3px', 'text-rotation': 'autorotate', label: 'data(type)' } },
      { selector: 'edge[type = "cites"]', style: { 'line-style': 'dotted' } },
      { selector: 'edge[type = "related"]', style: { 'line-style': 'dashed' } },
      { selector: 'edge[type = "qualifies"], edge[type = "contradicts"], edge[type = "supersedes"]', style: { width: 3, 'line-color': foreground } },
      { selector: '.inspected', style: { 'border-color': selected, 'border-width': 4, 'line-color': selected, width: 4 } },
      { selector: 'node.inspected', style: { width: 112, label: 'data(fullLabel)', 'text-max-width': '260px', 'text-background-color': background, 'text-background-opacity': 1, 'text-background-padding': '5px' } },
    ];
    const cy = cytoscape({ container: container.current, elements: [], style, layout: { name: 'preset' }, minZoom: minimumZoom, maxZoom: 2.5, wheelSensitivity: 0.2, autoungrabify: true, boxSelectionEnabled: false, autounselectify: true });
    core.current = cy;
    cy.on('render', () => {
      if (!container.current || !memory.focus) return;
      const node = cy.getElementById(`n:${memory.focus}`);
      if (node.nonempty()) { const point = node.renderedPosition(); container.current.dataset.focusX = String(point.x); container.current.dataset.focusY = String(point.y); }
    });
    cy.on('tap', 'node', event => selectionHandler.current({ kind: 'node', id: event.target.data('recordId') }));
    cy.on('tap', 'edge', event => selectionHandler.current({ kind: 'edge', id: event.target.data('edgeId') }));
    // Cytoscape distinguishes a tap from a drag/pan gesture.
    cy.on('tap', event => { if (event.target === cy) selectionHandler.current(null); });
    const observer = new ResizeObserver(() => cy.resize()); observer.observe(container.current);
    return () => { memory.viewport = { zoom: cy.zoom(), pan: { ...cy.pan() } }; observer.disconnect(); cy.removeAllListeners(); cy.destroy(); core.current = null; };
  }, []);
  useEffect(() => {
    const cy = core.current; if (!cy || !view.state.focus) return;
    const started = performance.now();
    const refocused = memory.focus !== view.state.focus;
    if (refocused) { memory.positions.clear(); memory.focus = view.state.focus; memory.viewport = undefined; }
    placeConnections(view.nodes.map(node => node.id), view.state.focus, memory.positions);
    const desired = new Set([...view.nodes.map(node => `n:${node.id}`), ...view.edges.map(edge => `r:${edge.id}`)]);
    cy.batch(() => {
      cy.elements().forEach(element => { if (!desired.has(element.id())) element.remove(); });
      for (const node of view.nodes) {
        const existing = cy.getElementById(`n:${node.id}`);
        if (existing.empty()) cy.add({ group: 'nodes', data: { id: `n:${node.id}`, recordId: node.id, role: node.kind, label: `${node.kind}\n${shortTitle(node.title)}`, fullLabel: `${node.kind}\n${node.title}` }, position: memory.positions.get(node.id) });
        else if (refocused) existing.position(memory.positions.get(node.id)!);
      }
      for (const edge of view.edges) if (cy.getElementById(`r:${edge.id}`).empty()) cy.add({ group: 'edges', data: { id: `r:${edge.id}`, edgeId: edge.id, source: `n:${edge.from}`, target: `n:${edge.to}`, type: edge.type } });
      cy.nodes().removeClass('focus'); cy.getElementById(`n:${view.state.focus!}`).addClass('focus');
    });
    if (refocused) fit();
    else if (restoreViewport.current && memory.viewport) cy.viewport(memory.viewport);
    restoreViewport.current = false;
    if (container.current) {
      container.current.dataset.layoutMs = String(performance.now() - started);
      container.current.dataset.positions = JSON.stringify(cy.nodes().map(node => ({ id: node.data('recordId'), ...node.position() })));
      container.current.dataset.nodes = String(view.nodes.length);
      container.current.dataset.edges = String(view.edges.length);
    }
  }, [view.nodes, view.edges, view.state.focus]);
  useEffect(() => {
    const cy = core.current; if (!cy) return;
    const started = performance.now();
    cy.elements().removeClass('inspected');
    if (view.state.selected) cy.getElementById(`${view.state.selected.kind === 'node' ? 'n' : 'r'}:${view.state.selected.id}`).addClass('inspected');
    if (container.current) container.current.dataset.selectionMs = String(performance.now() - started);
  }, [view.state.selected, view.nodes, view.edges]);
  return <section aria-label="Connection graph">
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" size="sm" onClick={() => { const cy = core.current; if (cy && view.state.focus) { cy.zoom(1); cy.center(cy.getElementById(`n:${view.state.focus}`)); setNotice('Centered on the focus record at readable zoom.'); } }}>Recenter focus</Button>
      <Button type="button" variant="outline" size="sm" onClick={fit}>Fit visible graph</Button>
      <a href="#connection-list">Use accessible List</a>
    </div>
    <p>Arrows follow recorded direction. Circle: source; rounded rectangle: workflow; diamond: example; hexagon: guide. Other kinds use a circle and their kind label. Size does not indicate importance or confidence.</p>
    <div ref={container} className="connection-canvas" role="img" aria-label="Recorded directed connections. Use the adjacent List for keyboard exploration." />
    <p role="status">{notice}</p>
  </section>;
}
