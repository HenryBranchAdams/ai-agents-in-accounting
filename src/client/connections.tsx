import { useEffect, useRef, useState, type MouseEvent, type FormEvent } from 'react';
import { hydrateRoot } from 'react-dom/client';
import type { GroupImperativeHandle } from 'react-resizable-panels';
import { ConnectionsExplorer, ConnectionInspector } from '../components/connections-explorer';
import { ConnectionCanvas, type ConnectionCanvasMemory } from '../components/connection-canvas';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '../components/ui/resizable';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../components/ui/sheet';
import { Button } from '../components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert';
import { connectionURL, parseConnectionState, type ConnectionState } from '../connections/state';
import type { ConnectionViewDTO } from '../connections/view';
import { isConnectionView, isConnectionEvidence } from '../connections/client-contract';
import type { GraphEdge } from '../connections/contract';

interface Initial { view: ConnectionViewDTO; kindNames: Record<string, string>; evidence?: GraphEdge }
function ConnectionsApplication({ initial }: { initial: Initial }) {
  const [view, setView] = useState(initial.view), latest = useRef(view); latest.current = view;
  const [ready, setReady] = useState(false), [mobile, setMobile] = useState(false), [open, setOpen] = useState(false);
  const [status, setStatus] = useState(''), [evidenceStatus, setEvidenceStatus] = useState('');
  const [evidence, setEvidence] = useState(initial.evidence);
  const canvasMemory = useRef<ConnectionCanvasMemory>({ positions: new Map(), focus: null });
  const pending = useRef<AbortController | null>(null), group = useRef<GroupImperativeHandle | null>(null);
  const navigateRef = useRef<(url: URL, push: boolean) => void>(() => {});
  const kindNames = initial.kindNames;
  async function navigate(url: URL, push: boolean) {
    if (url.origin !== location.origin || url.pathname !== '/connections') return;
    try {
      const state = parseConnectionState(url.searchParams, Object.keys(kindNames));
      if (!state.focus) { location.assign(url); return; }
      pending.current?.abort();
      const comparable = (value: ConnectionState) => connectionURL({ ...value, selected: null, mode: 'list' });
      let next: ConnectionViewDTO;
      const selectionExists = !state.selected || (state.selected.kind === 'node' ? latest.current.nodes.some(node => node.id === state.selected!.id) : latest.current.edges.some(edge => edge.id === state.selected!.id));
      if (selectionExists && comparable(state) === comparable(latest.current.state)) next = { ...latest.current, state: { ...state, corpus: latest.current.corpus_version, index: latest.current.index_version } };
      else {
        const controller = new AbortController(); pending.current = controller; setStatus('Loading connections…');
        const response = await fetch(`/api/v1/connections?${url.searchParams}`, { signal: controller.signal, credentials: 'omit', mode: 'same-origin' });
        const body: unknown = await response.json();
        if (controller.signal.aborted) return;
        if (response.status === 409) { setStatus('The corpus snapshot changed. Reload this page before continuing.'); return; }
        if (!response.ok || !isConnectionView(body, initial.view.corpus_version, Object.keys(kindNames)) || body.index_version !== initial.view.index_version) { setStatus('Connections could not be loaded. The current List remains available. Reload to try again.'); return; }
        next = body;
      }
      setView(next); setStatus('');
      const nextURL = connectionURL(next.state);
      if (push && location.pathname + location.search !== nextURL) history.pushState(null, '', nextURL);
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) setStatus('This connection state could not be loaded. Use a native link or reload the page.');
    }
  }
  navigateRef.current = (url, push) => { void navigate(url, push); };
  useEffect(() => {
    setReady(true);
    history.replaceState(null, '', connectionURL(initial.view.state));
    const query = matchMedia('(max-width: 899px)');
    const resize = () => setMobile(query.matches); resize(); query.addEventListener('change', resize);
    const pop = () => navigateRef.current(new URL(location.href), false); window.addEventListener('popstate', pop);
    return () => { pending.current?.abort(); query.removeEventListener('change', resize); window.removeEventListener('popstate', pop); };
  }, []);
  useEffect(() => { if (view.state.selected) setOpen(true); }, [view.state.selected?.kind, view.state.selected?.id]);
  useEffect(() => {
    const selected = view.state.selected;
    if (selected?.kind !== 'edge') { setEvidence(undefined); setEvidenceStatus(''); return; }
    if (evidence?.id === selected.id) return;
    const edge = view.edges.find(edge => edge.id === selected.id); if (!edge) return;
    const controller = new AbortController(); setEvidence(undefined); setEvidenceStatus('Loading recorded evidence…');
    void fetch(edge.evidence_href, { signal: controller.signal, credentials: 'omit', mode: 'same-origin' }).then(async response => {
      const body = await response.json();
      if (controller.signal.aborted) return;
      if (!response.ok || !isConnectionEvidence(body) || body.index_version !== view.index_version || body.corpus_version !== view.corpus_version || body.edge?.id !== selected.id || !Array.isArray(body.edge?.assertions)) { setEvidenceStatus('The evidence could not be verified against this view. Open the complete connection or reload.'); return; }
      setEvidence(body.edge); setEvidenceStatus('');
    }).catch(() => { if (!controller.signal.aborted) setEvidenceStatus('Evidence is temporarily unavailable. Use the complete connection link.'); });
    return () => controller.abort();
  }, [view.state.selected, view.index_version, view.corpus_version]);
  const click = (event: MouseEvent<HTMLDivElement>) => {
    const anchor = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null;
    if (anchor?.getAttribute('href')?.startsWith('#') || anchor?.hasAttribute('data-connection-reload')) return;
    if (!anchor || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey || anchor.target || anchor.hasAttribute('download')) return;
    const url = new URL(anchor.href);
    if (url.origin === location.origin && url.pathname === '/connections' && url.search) { event.preventDefault(); void navigate(url, true); }
  };
  const submit = (event: FormEvent<HTMLDivElement>) => {
    if (!(event.target instanceof HTMLFormElement) || new URL(event.target.action).pathname !== '/connections') return;
    event.preventDefault();
    const params = new URLSearchParams(); for (const [key, value] of new FormData(event.target)) if (typeof value === 'string') params.append(key, value);
    void navigate(new URL(`/connections?${params}`, location.origin), true);
  };
  const select = (selected: ConnectionState['selected']) => { void navigate(new URL(connectionURL({ ...latest.current.state, selected }), location.origin), true); };
  const inspector = <ConnectionInspector view={view} evidence={evidence} status={evidenceStatus} />;
  let graph;
  if (ready && view.state.mode === 'graph') {
    graph = mobile ? <section id="connection-graph">
      <ConnectionCanvas view={view} onSelect={select} memory={canvasMemory.current} />
      <Sheet open={open && !!view.state.selected} onOpenChange={setOpen}>
        <SheetTrigger asChild><Button type="button" variant="outline" disabled={!view.state.selected}>Inspect selected item</Button></SheetTrigger>
        <SheetContent side="bottom" className="max-h-dvh overflow-y-auto"><SheetHeader><SheetTitle>Connection inspector</SheetTitle><SheetDescription>Selection does not expand or change the focus record.</SheetDescription></SheetHeader><div className="px-4 pb-6">{inspector}</div></SheetContent>
      </Sheet>
    </section> : <section id="connection-graph">
      <Button type="button" variant="outline" size="sm" onClick={() => group.current?.setLayout({ graph: 65, inspector: 35 })}>Reset panel widths</Button>
      <ResizablePanelGroup orientation="horizontal" groupRef={group}>
        <ResizablePanel id="graph" defaultSize="65%" minSize="360px"><ConnectionCanvas view={view} onSelect={select} memory={canvasMemory.current} /></ResizablePanel>
        <ResizableHandle withHandle aria-label="Resize graph and inspector" />
        <ResizablePanel id="inspector" defaultSize="35%" minSize="280px"><aside id="connection-inspector" className="connection-panel-inspector p-4" aria-label="Selected connection or record"><h2>Inspector</h2>{inspector}</aside></ResizablePanel>
      </ResizablePanelGroup>
    </section>;
  }
  return <div onClick={click} onSubmit={submit}>
    {status ? <Alert><AlertTitle>Connection status</AlertTitle><AlertDescription><p role="status">{status}</p><a data-connection-reload="" href={connectionURL({ ...view.state, corpus: null, index: null })}>Reload against the current corpus edition</a></AlertDescription></Alert> : null}
    <ConnectionsExplorer view={view} kindNames={kindNames} evidence={evidence} graph={graph} inspector={ready && view.state.mode === 'graph' ? null : undefined} />
  </div>;
}
export function initializeConnections() {
  const root = document.getElementById('connections-explorer');
  if (!root?.dataset.connectionsInitial) return;
  const initial = JSON.parse(root.dataset.connectionsInitial) as Initial;
  if (!isConnectionView(initial.view, document.body.dataset.corpusVersion || '', Object.keys(initial.kindNames ?? {})) || !initial.kindNames) return;
  // The wrapper is also present in server HTML; initial render retains the List.
  hydrateRoot(root, <ConnectionsApplication initial={initial} />);
}
