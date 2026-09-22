/** Cytoscape needs RGB; resolve the existing semantic tokens with the browser color parser. */
export function graphColor(token: string) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const context = canvas.getContext("2d")!;
  context.fillStyle = getComputedStyle(document.documentElement)
    .getPropertyValue(token)
    .trim();
  context.fillRect(0, 0, 1, 1);
  const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
  return `rgb(${r},${g},${b})`;
}
