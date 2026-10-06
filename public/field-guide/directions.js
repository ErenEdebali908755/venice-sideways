/* Screen-spaced arrows follow source coordinate order; vertices never become arrows. */
export const ROUTE_COLORS = { walk: "#2D59D6", boat: "#007A8A", halo: "#fffaf2" };
/** @param {any} map @param {any[]} lines @param {{spacing?:number,max?:number}} options @returns {any} */
export function directionFeatures(map, lines, { spacing = 125, max = 64 } = {}) {
  const features = [], container = map.getContainer();
  const width = container.clientWidth, height = container.clientHeight;
  if (width < 180 || height < 160) return { type: "FeatureCollection", features };
  for (const line of lines) {
    if (line.properties?.selected === false) continue;
    const coordinates = line.geometry?.coordinates || [];
    let walked = 0, next = spacing / 2;
    for (let i = 1; i < coordinates.length && features.length < max; i++) {
      const a = map.project(coordinates[i - 1]), b = map.project(coordinates[i]);
      const dx = b.x - a.x, dy = b.y - a.y, length = Math.hypot(dx, dy);
      if (!Number.isFinite(length) || length < 0.01) continue;
      while (next <= walked + length && features.length < max) {
        const ratio = (next - walked) / length, x = a.x + dx * ratio, y = a.y + dy * ratio;
        if (x >= 16 && y >= 16 && x <= width - 16 && y <= height - 16) {
          const from = coordinates[i - 1], to = coordinates[i];
          features.push({ type: "Feature", properties: { boat: line.properties?.boat === true, angle: Math.atan2(dy, dx) * 180 / Math.PI }, geometry: { type: "Point", coordinates: [from[0] + (to[0] - from[0]) * ratio, from[1] + (to[1] - from[1]) * ratio] } });
        }
        next += spacing;
      }
      walked += length;
    }
    if (features.length >= max) break;
  }
  return { type: "FeatureCollection", features };
}
/** @param {boolean} boat */
export function directionImage(boat = false) {
  const canvas = document.createElement("canvas"); canvas.width = canvas.height = 32;
  const ctx = canvas.getContext("2d");
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  for (const [color, width] of [[ROUTE_COLORS.halo, 9], [boat ? ROUTE_COLORS.boat : ROUTE_COLORS.walk, 4]]) {
    ctx.beginPath(); ctx.moveTo(8, 7); ctx.lineTo(22, 16); ctx.lineTo(8, 25); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
  }
  return ctx.getImageData(0, 0, 32, 32);
}
/** @param {any} map @param {string} source @param {string} layer @param {string|undefined} before */
export function installDirections(map, source, layer, before) {
  for (const boat of [false, true]) {
    const id = boat ? "sw-direction-boat" : "sw-direction-walk";
    if (!map.hasImage(id)) map.addImage(id, directionImage(boat), { pixelRatio: 2 });
  }
  if (!map.getSource(source)) map.addSource(source, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
  if (!map.getLayer(layer)) map.addLayer({ id: layer, type: "symbol", source,
    layout: { "icon-image": ["case", ["get", "boat"], "sw-direction-boat", "sw-direction-walk"], "icon-size": 0.85,
      "icon-rotate": ["get", "angle"], "icon-rotation-alignment": "viewport", "icon-pitch-alignment": "viewport", "icon-keep-upright": false,
      "icon-allow-overlap": false, "icon-ignore-placement": false, "icon-padding": 2 } }, before);
}
