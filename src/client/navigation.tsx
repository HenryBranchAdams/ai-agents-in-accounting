import { hydrateRoot } from "react-dom/client";
import { SiteNavigation } from "../components/site-navigation";

const root = document.getElementById("site-navigation");
if (root) {
  hydrateRoot(
    root,
    <SiteNavigation active={root.dataset.active || "library"} />,
    {
      identifierPrefix: "navigation-",
    },
  );
}

// Install only the small intent handler eagerly. Palette and cmdk load on intent.
let opening = false;
async function showSearch(trigger: HTMLElement | null) {
  if (opening || document.querySelector('[role="dialog"]')) return;
  opening = true;
  try {
    const { openSearch } = await import("../components/search-palette");
    openSearch(document.body.dataset.corpusVersion || "", trigger);
  } catch {
    window.location.assign("/library");
  } finally { opening = false; }
}
document.addEventListener("click", event => {
  const trigger = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-search-trigger]") : null;
  if (!trigger || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey || document.querySelector('[role="dialog"]')) return;
  event.preventDefault();
  void showSearch(trigger);
});
document.addEventListener("keydown", event => {
  if (event.key.toLowerCase() !== "k" || !(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey || event.isComposing || event.defaultPrevented) return;
  if (document.querySelector('[role="dialog"]') || (event.target instanceof Element && event.target.closest('input,textarea,select,[contenteditable="true"]'))) return;
  event.preventDefault();
  void showSearch(document.activeElement instanceof HTMLElement ? document.activeElement : null);
});

if (document.querySelector("[data-evidence-preview]")) {
  void import("../components/evidence-preview").then(module => module.initializeEvidencePreviews()).catch(() => {
    // Canonical source links and qualifications remain complete in server HTML.
  });
}
if (document.querySelector("[data-page-outline]")) {
  void import("./reading").then(module => module.initializeReadingOutline()).catch(() => {
    // Native anchors and complete sections remain usable without highlighting.
  });
}

if (document.querySelector('[data-connections-initial]')) {
  void import('./connections').then(module => module.initializeConnections()).catch(() => {
    // The server-rendered List and native GET actions remain usable.
  });
}
