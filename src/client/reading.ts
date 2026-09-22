let cleanup: (() => void) | undefined;
export function initializeReadingOutline() {
  cleanup?.();
  const links = [...document.querySelectorAll<HTMLAnchorElement>("[data-section-link]")];
  const ids = [...new Set(links.map(link => link.dataset.sectionLink!))];
  const targets = ids.map(id => document.getElementById(id)).filter((element): element is HTMLElement => !!element);
  const visible = new Set<HTMLElement>();
  let frame = 0;
  const mark = (id: string) => {
    for (const link of links) {
      if (link.dataset.sectionLink === id) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    }
  };
  const refresh = () => {
    frame = 0;
    const candidates = [...visible].filter(element => element.getClientRects().length)
      .map(element => ({ element, top: element.getBoundingClientRect().top }));
    const passed = candidates.filter(item => item.top <= 48).sort((a, b) => b.top - a.top);
    const next = candidates.filter(item => item.top > 48).sort((a, b) => a.top - b.top);
    const active = passed[0] || next[0];
    if (active) mark(active.element.id);
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(refresh); };
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) entry.isIntersecting ? visible.add(entry.target as HTMLElement) : visible.delete(entry.target as HTMLElement);
    schedule();
  }, { threshold: [0, 0.1, 0.5, 1] });
  for (const target of targets) observer.observe(target);
  const resize = new ResizeObserver(schedule);
  const article = document.querySelector("article.reading");if (article) resize.observe(article);
  const fragment = () => {
    let id: string;
    try { id = decodeURIComponent(window.location.hash.slice(1)); } catch { return; }
    const target = document.getElementById(id);if (!target) return;
    let opened = false;
    for (let parent = target.parentElement; parent; parent = parent.parentElement) {
      if (parent instanceof HTMLDetailsElement && !parent.open) { parent.open = true; opened = true; }
    }
    if (opened) target.scrollIntoView();
    if (ids.includes(id)) mark(id);
    schedule();
  };
  window.addEventListener("hashchange", fragment);
  window.addEventListener("resize", schedule);
  // Only the small set reported by IntersectionObserver is measured per frame.
  window.addEventListener("scroll", schedule, { passive: true });
  fragment();
  cleanup = () => {
    observer.disconnect();resize.disconnect();cancelAnimationFrame(frame);
    window.removeEventListener("hashchange", fragment);window.removeEventListener("resize", schedule);window.removeEventListener("scroll", schedule);
  };
  return cleanup;
}
window.addEventListener("pagehide", () => cleanup?.());
window.addEventListener("pageshow", event => { if (event.persisted) initializeReadingOutline(); });
