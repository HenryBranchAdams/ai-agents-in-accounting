import { renderToString } from "react-dom/server.edge";
import { shell } from "../components/shell";
import { LibraryExplorer } from "../components/library-explorer";
import { Alert, AlertTitle, AlertDescription } from "../components/ui/alert";
import type { MapView, MapDetail } from "../library-map/contract";
declare const LIBRARY_MAP_SCRIPT: string;
export function libraryMapPage(view: MapView, detail?: MapDetail) {
  const initial = { view, detail };
  return shell(
    "Library map",
    "Explore the entire Accounting Agents library through topics and recorded connections.",
    <>
      <div
        id="library-map"
        data-library-map={JSON.stringify(initial)}
        data-map-mode={view.state.mode}
        dangerouslySetInnerHTML={{
          __html: renderToString(
            <div>
              <LibraryExplorer view={view} detail={detail} />
            </div>,
            { identifierPrefix: "library-map-" },
          ),
        }}
      />
      {view.state.mode === "map" ? (
        <script type="module" src={LIBRARY_MAP_SCRIPT} />
      ) : null}
    </>,
    "map",
    "/map",
  );
}
export function libraryMapError(message: string) {
  return shell(
    "Library map unavailable",
    message,
    <section className="py-10">
      <h1>Library map</h1>
      <Alert>
        <AlertTitle>Map unavailable</AlertTitle>
        <AlertDescription>
          <p>{message}</p>
          <a href="/map">Reload the current map</a>
        </AlertDescription>
      </Alert>
      <p>
        <a href="/library">Read the research library</a>
      </p>
    </section>,
    "map",
    "/map",
  );
}
