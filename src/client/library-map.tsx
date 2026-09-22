import { hydrateRoot } from "react-dom/client";
import {
  Component,
  type ErrorInfo,
  type ReactNode,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type FormEvent,
} from "react";
import { LibraryExplorer } from "../components/library-explorer";
import {
  isLibraryMap,
  isMapDetail,
  mapState,
  mapURL,
  mapView,
  type LibraryMapData,
  type MapView,
  type MapDetail,
} from "../library-map/contract";
import { isConnectionEvidence } from "../connections/client-contract";
import type { MapMemory } from "../components/library-map-canvas";
import { LibraryMapCanvas as Canvas } from "../components/library-map-canvas";
class CanvasBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(_error: Error, _info: ErrorInfo) {
    /* Keep the native List usable if the optional canvas cannot start. */
  }
  render() {
    return this.state.failed ? (
      <p role="status" className="p-6">
        The interactive map could not load. Use the List below, or reload to try
        again.
      </p>
    ) : (
      this.props.children
    );
  }
}
interface Initial {
  view: MapView;
  detail?: MapDetail;
}
function Application({ initial }: { initial: Initial }) {
  const [data, setData] = useState<LibraryMapData | null>(null),
    [view, setView] = useState(initial.view),
    [detail, setDetail] = useState(initial.detail),
    [status, setStatus] = useState(""),
    [reset, setReset] = useState(0),
    [restore, setRestore] = useState(0);
  const memory = useRef<MapMemory>({ positions: {} }),
    latest = useRef(view);
  latest.current = view;
  const dataRef = useRef(data);
  dataRef.current = data;
  const focusNext = useRef(false);
  const storageKey = `library-map:${initial.view.map_version}`;
  function remember() {
    try {
      sessionStorage.setItem(
        storageKey,
        JSON.stringify({
          url: location.pathname + location.search,
          memory: memory.current,
        }),
      );
    } catch {
      /* Unavailable storage does not block reading. */
    }
  }
  function navigate(url: URL, push = true, whole = false) {
    if (url.origin !== location.origin || url.pathname !== "/map") return;
    if (!dataRef.current) {
      location.assign(url);
      return;
    }
    try {
      const state = mapState(url.searchParams);
      if (state.map && state.map !== initial.view.map_version)
        throw new Error("The map changed. Reload the current map.");
      const next = mapView(dataRef.current, state);
      focusNext.current =
        next.state.record !== latest.current.state.record &&
        !!next.state.record;
      if (push) {
        history.replaceState({ mapMemory: memory.current }, "", location.href);
        history.pushState(null, "", mapURL(next.state));
      }
      setView(next);
      setStatus("");
      if (whole) {
        memory.current.positions = {};
        setReset((n) => n + 1);
      }
      remember();
    } catch {
      setStatus(
        "This map state is unavailable or belongs to another edition. Reload the current map.",
      );
    }
  }
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey) || "null");
      const m = saved?.memory;
      if (
        saved?.url === location.pathname + location.search &&
        m &&
        m.viewport &&
        Number.isFinite(m.viewport.zoom) &&
        m.viewport.zoom >= 0.01 &&
        m.viewport.zoom <= 8 &&
        Number.isFinite(m.viewport.pan?.x) &&
        Number.isFinite(m.viewport.pan?.y) &&
        m.positions &&
        typeof m.positions === "object"
      ) {
        memory.current.viewport = m.viewport;
        memory.current.positions = Object.fromEntries(
          Object.entries(m.positions)
            .filter(
              ([, p]) =>
                !!p &&
                typeof p === "object" &&
                Number.isFinite((p as { x: number }).x) &&
                Number.isFinite((p as { y: number }).y),
            )
            .slice(0, 10000),
        ) as MapMemory["positions"];
      }
    } catch {
      /* Ignore invalid saved view. */
    }
    const controller = new AbortController();
    void fetch(`/api/v1/library-map?map=${initial.view.map_version}`, {
      signal: controller.signal,
      credentials: "omit",
      mode: "same-origin",
    })
      .then(async (response) => {
        const body: unknown = await response.json();
        if (controller.signal.aborted) return;
        if (
          !response.ok ||
          !isLibraryMap(
            body,
            initial.view.corpus_version,
            initial.view.map_version,
          )
        )
          throw new Error("Map identity mismatch");
        const { map_version, ...inputs } = body;
        const digest = [
          ...new Uint8Array(
            await crypto.subtle.digest(
              "SHA-256",
              new TextEncoder().encode(JSON.stringify(inputs)),
            ),
          ),
        ]
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
        if (digest !== map_version) throw new Error("Map content changed");
        if (!controller.signal.aborted) setData(body);
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setStatus(
            "The interactive map could not load. The complete paginated List remains available below.",
          );
      });
    const pop = (event: PopStateEvent) => {
      if (event.state?.mapMemory?.viewport) {
        memory.current.viewport = event.state.mapMemory.viewport;
        setRestore((n) => n + 1);
      }
      navigateRef.current(new URL(location.href), false);
    };
    const save = () => remember();
    window.addEventListener("popstate", pop);
    window.addEventListener("pagehide", save);
    return () => {
      controller.abort();
      window.removeEventListener("popstate", pop);
      window.removeEventListener("pagehide", save);
    };
  }, []);
  useEffect(() => {
    if (focusNext.current) {
      focusNext.current = false;
      document
        .getElementById("map-selection-title")
        ?.focus({ preventScroll: matchMedia("(min-width: 960px)").matches });
    }
  }, [view.state.record]);
  useEffect(() => {
    if (!view.state.record) {
      setDetail(undefined);
      return;
    }
    if (
      detail?.node.id === view.state.record &&
      (detail.edge?.id || "") === view.state.edge
    )
      return;
    const controller = new AbortController();
    setDetail(undefined);
    const params = new URLSearchParams({
      record: view.state.record,
      map: view.map_version,
    });
    if (view.state.edge) params.set("edge", view.state.edge);
    void fetch(`/api/v1/library-map/record?${params}`, {
      signal: controller.signal,
      credentials: "omit",
      mode: "same-origin",
    })
      .then(async (response) => {
        const body: unknown = await response.json();
        if (controller.signal.aborted) return;
        if (
          !response.ok ||
          !isMapDetail(body, view) ||
          (view.state.edge &&
            (!isConnectionEvidence(body) || body.edge.id !== view.state.edge))
        )
          throw new Error("Unverified evidence");
        setDetail(body);
        setStatus("");
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setStatus(
            "Evidence could not be verified against this map. Open the complete record or reload.",
          );
      });
    return () => controller.abort();
  }, [view.state.record, view.state.edge, view.map_version]);
  const click = (event: MouseEvent<HTMLDivElement>) => {
    const a =
      event.target instanceof Element
        ? event.target.closest<HTMLAnchorElement>("a[href]")
        : null;
    if (
      !a ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey ||
      a.target ||
      a.hasAttribute("download") ||
      a.getAttribute("href")?.startsWith("#")
    )
      return;
    const url = new URL(a.href);
    remember();
    if (
      url.origin === location.origin &&
      url.pathname === "/map" &&
      !a.hasAttribute("data-map-reload")
    ) {
      event.preventDefault();
      navigate(url, true, a.hasAttribute("data-map-whole"));
    }
  };
  const submit = (event: FormEvent<HTMLDivElement>) => {
    if (
      !(event.target instanceof HTMLFormElement) ||
      new URL(event.target.action).pathname !== "/map"
    )
      return;
    event.preventDefault();
    const p = new URLSearchParams();
    for (const [k, v] of new FormData(event.target))
      if (typeof v === "string" && v) p.set(k, v);
    navigate(new URL(`/map?${p}`, location.origin));
  };
  const select = (id: string, topic: boolean) =>
    navigate(
      new URL(
        mapURL({
          ...view.state,
          page: 1,
          record: topic ? "" : id,
          edge: "",
          ...(topic ? { topic: id, q: "", kind: "", collection: "" } : {}),
        }),
        location.origin,
      ),
    );
  return (
    <div onClick={click} onSubmit={submit}>
      <LibraryExplorer
        view={view}
        detail={detail}
        status={status}
        graph={
          data && view.state.mode === "map" ? (
            <CanvasBoundary>
              <Canvas
                data={data}
                state={view.state}
                onSelect={select}
                onEdge={(id) =>
                  navigate(
                    new URL(
                      mapURL({ ...view.state, edge: id }),
                      location.origin,
                    ),
                  )
                }
                memory={memory.current}
                reset={reset}
                restore={restore}
              />
            </CanvasBoundary>
          ) : undefined
        }
      />
    </div>
  );
}
function initializeLibraryMap() {
  const root = document.getElementById("library-map");
  if (!root?.dataset.libraryMap) return;
  const initial = JSON.parse(root.dataset.libraryMap) as Initial;
  hydrateRoot(root, <Application initial={initial} />, {
    identifierPrefix: "library-map-",
  });
}

initializeLibraryMap();
