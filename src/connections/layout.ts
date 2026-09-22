export interface GraphPosition { x: number; y: number }
/** Stable occupied slots retain surviving nodes and restored branches. No force simulation. */
export function placeConnections(ids: string[], focus: string, saved = new Map<string, GraphPosition>()) {
  if (!saved.has(focus)) saved.set(focus, { x: 0, y: 0 });
  let slot = Math.max(0, saved.size - 1);
  for (const id of ids.filter(id => id !== focus).sort()) {
    if (saved.has(id)) continue;
    let ring = 1, offset = slot;
    while (offset >= ring * 8) { offset -= ring * 8; ring++; }
    const angle = -Math.PI / 2 + 2 * Math.PI * offset / (ring * 8);
    const radius = ring * 260;
    saved.set(id, { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius });
    slot++;
  }
  return saved;
}
