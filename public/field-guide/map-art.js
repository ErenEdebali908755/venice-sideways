/* Original Venice Sideways illustrations over OpenFreeMap / OpenStreetMap vectors. */
import { ILLUSTRATIONS } from "./illustrations.js?v=20261006-kit04";

export const BASE_STYLE = "https://tiles.openfreemap.org/styles/positron";

export const ART_ASSETS = [
  ...ILLUSTRATIONS.filter(asset => asset.approved),
  {
    "kind": "station",
    "url": "/field-guide/art/santa-lucia-0c26a4e5d8a5.png",
    "width": 272,
    "height": 92,
    "pixelRatio": 2
  },
  {
    "kind": "bridge",
    "url": "/field-guide/art/accademia-b7311850aa62.png",
    "width": 272,
    "height": 106,
    "pixelRatio": 2
  },
  {
    "kind": "dogana",
    "url": "/field-guide/art/punta-della-dogana-469b12b37835.png",
    "width": 272,
    "height": 240,
    "pixelRatio": 2
  },
  {
    "kind": "garden-leaves",
    "url": "/field-guide/art/botanical-pattern-d8e4508b8432.png",
    "width": 128,
    "height": 128,
    "pixelRatio": 1
  }
];

export const MAIN_LANDMARKS = ILLUSTRATIONS.filter(asset => asset.approved).map(asset => ({ key: asset.key, icon: asset.kind, coordinatesFrom: asset.key }));

export const GARDENS = [
  { key: "papadopoli", osmWayId: "174476472", focus: [12.32068956, 45.43846877] },
  { key: "savorgnan", osmWayId: "4715855", focus: [12.32362926, 45.44335433] },
];

export const PLACE_COPY = {
  lucia: {
    name: "Venezia Santa Lucia",
    text: { en: "The railway station marks the beginning of Main Walk, beside the Grand Canal.", tr: "Ana Yürüyüş, Büyük Kanal kıyısındaki tren istasyonundan başlar." },
  },
  accademia: {
    name: "Ponte dell’Accademia",
    text: { en: "Pause on the bridge to watch the Grand Canal change with the light.", tr: "Büyük Kanal’ın ışıkla değişen görünümünü izlemek için köprüde dur." },
  },
  dogana: {
    name: "Punta della Dogana",
    text: { en: "At Dorsoduro’s tip, the former customs house stands where two waterways meet.", tr: "Dorsoduro’nun ucundaki eski gümrük binası iki su yolunun birleştiği yerde durur." },
  },
  papadopoli: {
    name: "Giardini Papadopoli",
    text: { en: "A mapped green space near the station. Check current access on site before visiting.", tr: "İstasyon yakınında haritalanmış bir yeşil alan. Gitmeden önce güncel erişimi yerinde kontrol et." },
  },
  savorgnan: {
    name: "Parco Savorgnan",
    text: { en: "A mapped green space in Cannaregio. Check current access on site before visiting.", tr: "Cannaregio’da haritalanmış bir yeşil alan. Gitmeden önce güncel erişimi yerinde kontrol et." },
  },
};

export function placeCopy(key, language) {
  const place = PLACE_COPY[key];
  if (!place) { const art = ILLUSTRATIONS.find(item => item.key === key); return art ? { name: art.title, text: "" } : null; }
  return place ? { name: place.name, text: place.text[language] || place.text.en } : null;
}

export function watercolorStyle(base) {
  if (!base?.sources?.openmaptiles || !Array.isArray(base.layers))
    throw new Error("OpenFreeMap style is missing its vector source");
  const style = structuredClone(base);
  style.name = "Venice Sideways · watercolor field guide";
  style.metadata = { ...style.metadata, "venice-sideways:base": BASE_STYLE };
  const colors = {
    background: { "background-color": "#F4F2ED" },
    park: { "fill-color": "#CBD6BC" },
    landcover_wood: { "fill-color": "#a6c8ac" },
    landuse_residential: { "fill-color": "#f2e9db" },
    water: { "fill-color": "#B7DBE8" },
    waterway: { "line-color": "#8ab8cb" },
    building: { "fill-color": "#E6D9C9", "fill-outline-color": "#d8bfa8" },
    road_area_pier: { "fill-color": "#fcf7ed" },
    road_pier: { "line-color": "#fcf7ed" },
    highway_path: { "line-color": "#fffaf2" },
    highway_minor: { "line-color": "#fffaf2" },
    highway_major_inner: { "line-color": "#fffaf2" },
    highway_motorway_inner: { "line-color": "#fffaf2" },
    highway_motorway_bridge_inner: { "line-color": "#fffaf2" },
    water_name_line_label: { "text-color": "#406f86", "text-halo-color": "#F4F2ED" },
    water_name_point_label: { "text-color": "#406f86", "text-halo-color": "#F4F2ED" },
    label_other: { "text-color": "#59493f", "text-halo-color": "#F4F2ED" },
  };
  for (const layer of style.layers) {
    if (colors[layer.id]) layer.paint = { ...layer.paint, ...colors[layer.id] };
    if (layer.id === "water_name_line_label") layer.minzoom = Math.max(layer.minzoom || 0, 14.5);
    if (/^highway-name-/.test(layer.id))
      layer.paint = { ...layer.paint, "text-color": "#695d55", "text-halo-color": "#fffaf2" };
  }
  return style;
}

export function landmarkFeatures(route) {
  if (!["main", "full"].includes(route?.key)) return [];
  return MAIN_LANDMARKS.flatMap(({ key, icon, coordinatesFrom }) => {
    // Both canonical walks explicitly identify these places. Use each route's
    // own visit anchor, never a translated title or Main's coordinates for Full.
    const visit = route.visits?.find((entry) => entry.visible !== false && entry.key === coordinatesFrom &&
      (!entry.placeKey || entry.placeKey === key));
    if (!Number.isFinite(visit?.longitude) || !Number.isFinite(visit?.latitude)) return [];
    return [{
      type: "Feature",
      properties: { key, icon, visitKey: visit.key, placeKey: visit.placeKey || key },
      geometry: { type: "Point", coordinates: [visit.longitude, visit.latitude] },
    }];
  });
}

const LANDMARK_LAYERS = ["fg-landmark-tether", "fg-landmark-overview", "fg-landmark-detail", "fg-landmark-active"];
const ZOOM_STOPS = [[13, 0.64], [15, 0.88], [16.5, 1], [19, 1]];

// These are screen annotation budgets, not architectural footprints. Height is
// independently bounded so the tall Dogana cannot outweigh the station/bridge.
export function watercolorLayout(width, height) {
  const compact = width <= 600;
  const maxWidth = Math.min(compact ? 104 : 124, Math.max(0, width) * 0.27);
  const maxHeight = Math.min(compact ? 72 : 80, Math.max(0, height) * 0.24);
  // Clear the selected/focused 43px stop plus its outline. On an unusually
  // short/narrow map, optional art is hidden rather than covering the controls.
  const gap = Math.min(42, Math.max(34, Math.max(0, height) * 0.12));
  const assets = ART_ASSETS.filter(asset => asset.kind !== "garden-leaves");
  return { gap, maxWidth, maxHeight, visible: width >= 180 && height >= 160, sizes: Object.fromEntries(assets.map(asset => [asset.kind,
    Math.min(maxWidth / (asset.width / asset.pixelRatio), maxHeight / (asset.height / asset.pixelRatio))])) };
}

function layoutExpressions(layout) {
  const match = value => ["match", ["get", "icon"],
    ...Object.entries(layout.sizes).flatMap(([kind, size]) => [kind, value(size)]), value(0.5)];
  return {
    size: ["interpolate", ["linear"], ["zoom"],
      ...ZOOM_STOPS.flatMap(([zoom, factor]) => [zoom, match(size => size * factor)])],
    // MapLibre 5 multiplies icon-offset by icon-size. The inverse size keeps
    // the annotation gap stable in CSS pixels while its body scales smoothly.
    offset: ["interpolate", ["linear"], ["zoom"],
      ...ZOOM_STOPS.flatMap(([zoom, factor]) => [zoom, match(size =>
        ["literal", [0, size ? -layout.gap / (size * factor) : 0]])])],
  };
}

export function orderWatercolorLayers(map) {
  const layers = map.getStyle()?.layers || [];
  const roads = layers.find(layer => layer.id === "highway_path") ||
    layers.find(layer => layer.type === "line" && /^(road|highway)/.test(layer.id));
  const move = (id, before) => {
    if (!map.getLayer(id) || (before && !map.getLayer(before))) return;
    const ids = map.getStyle().layers.map(layer => layer.id);
    const index = ids.indexOf(id), target = before ? ids.indexOf(before) : ids.length;
    if (index !== target - 1) map.moveLayer(id, before);
  };
  if (roads) {
    const gardens = ["fg-garden-wash", "fg-garden-grain"].filter(id => map.getLayer(id));
    const ids = map.getStyle().layers.map(layer => layer.id), roadIndex = ids.indexOf(roads.id);
    if (ids.slice(roadIndex - gardens.length, roadIndex).join("|") !== gardens.join("|"))
      for (const id of gardens) move(id, roads.id);
  }
  // Keep the provider's road/place label order, above the small art family.
  // Gardens stay below roads; route geometry and its white halo stay below art.
  const labels = layers.filter(layer => layer.type === "symbol" && !layer.id.startsWith("fg-")).map(layer => layer.id);
  const overlay = ["fg-halo", "fg-walk", "fg-boat", "fg-directions", ...LANDMARK_LAYERS, ...labels, "fg-garden-label"];
  const existing = overlay.filter(id => map.getLayer(id));
  const current = map.getStyle()?.layers.map(layer => layer.id) || [];
  if (current.slice(-existing.length).join("|") !== existing.join("|"))
    for (const id of existing) move(id);
}

export function applyWatercolorPresentation(map, { threeD = false } = {}) {
  orderWatercolorLayers(map);
  const container = map.getContainer?.();
  const layout = watercolorLayout(container?.clientWidth || 800, container?.clientHeight || 500);
  const expressions = layoutExpressions(layout);
  const set = (id, name, value) => {
    if (!map.getLayer(id)) return;
    if (JSON.stringify(map.getLayoutProperty?.(id, name)) !== JSON.stringify(value))
      map.setLayoutProperty(id, name, value);
  };
  set("fg-buildings", "visibility", threeD ? "visible" : "none");
  for (const id of LANDMARK_LAYERS) set(id, "visibility", threeD || !layout.visible ? "none" : "visible");
  for (const id of LANDMARK_LAYERS.slice(1)) {
    set(id, "icon-size", expressions.size);
    set(id, "icon-offset", expressions.offset);
  }
  // The line is an annotation back to the unchanged route/place anchor. It is
  // deliberately thin and neutral, distinct from solid/dashed route strokes.
  set("fg-landmark-tether", "icon-size", layout.gap / 48);
}

const stroke = (ctx, points, color = "#865346", width = 3) => {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const point of points.slice(1)) ctx.lineTo(...point);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();
};

function illustration(kind) {
  const canvas = document.createElement("canvas");
  canvas.width = 96;
  canvas.height = 160;
  const ctx = canvas.getContext("2d");
  // The drawing stays connected to its exact route anchor, even when a stop pin
  // occupies that point. The lower line is an annotation stem, not a new stop.
  stroke(ctx, [[48, 82], [48, 157]], "#865346", 2);
  ctx.fillStyle = "#fff7e9d9";
  ctx.beginPath();
  ctx.ellipse(48, 52, 39, 32, -0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#B7DBE888";
  ctx.beginPath();
  ctx.ellipse(48, 72, 35, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e5b394aa";
  if (kind === "station") {
    // Santa Lucia's broad modern facade, rather than a classical pediment.
    ctx.fillRect(16, 39, 64, 29);
    stroke(ctx, [[15, 37], [81, 37]], "#865346", 4);
    stroke(ctx, [[18, 47], [78, 47]], "#865346", 2);
    for (const x of [28, 42, 56, 70]) {
      ctx.fillStyle = "#7196a080";
      ctx.fillRect(x - 5, 50, 10, 18);
      stroke(ctx, [[x - 5, 50], [x - 5, 68], [x + 5, 68], [x + 5, 50]], "#865346", 1.5);
    }
    stroke(ctx, [[15, 69], [81, 69]]);
  } else if (kind === "bridge") {
    // A light wooden span and open truss for Ponte dell'Accademia.
    stroke(ctx, [[14, 43], [30, 38], [48, 36], [66, 38], [82, 43]], "#865346", 4);
    stroke(ctx, [[14, 62], [29, 61], [37, 50], [48, 46], [59, 50], [67, 61], [82, 62]], "#c77d61", 5);
    stroke(ctx, [[14, 62], [82, 62]], "#865346", 2);
    for (const x of [22, 31, 40, 49, 58, 67, 76])
      stroke(ctx, [[x, x < 48 ? 42 - (x - 22) * 0.2 : 37 + (x - 49) * 0.2], [x, 57]], "#865346", 1.5);
  } else {
    // Punta della Dogana's customs frontage and small corner tower/globe.
    ctx.fillRect(20, 48, 57, 24);
    ctx.fillRect(55, 31, 14, 19);
    stroke(ctx, [[18, 48], [47, 39], [79, 48]], "#865346", 3);
    stroke(ctx, [[54, 31], [62, 25], [70, 31]], "#865346", 2);
    ctx.beginPath(); ctx.arc(62, 20, 4, 0, Math.PI * 2); ctx.fill();
    stroke(ctx, [[20, 72], [77, 72]]);
    ctx.fillStyle = "#fff7e9";
    for (const x of [31, 45, 65]) ctx.fillRect(x, 55, 6, 17);
  }
  return ctx.getImageData(0, 0, 96, 160);
}

function gardenPattern() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 56;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#4b866139";
  for (const [x, y, rotation] of [[13, 15, 0.4], [40, 38, -0.5]]) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rotation);
    ctx.beginPath(); ctx.ellipse(-4, 0, 6, 2.5, -0.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(4, -2, 6, 2.5, 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  return ctx.getImageData(0, 0, 56, 56);
}

function gardenIcon() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fff7e9e6";
  ctx.beginPath(); ctx.ellipse(32, 32, 28, 27, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#466e50"; ctx.lineWidth = 2.5; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(20, 45); ctx.quadraticCurveTo(33, 32, 44, 16); ctx.stroke();
  ctx.fillStyle = "#6fae7b";
  for (const [x, y, angle] of [[25, 38, -0.6], [31, 30, 0.6], [36, 24, -0.5], [43, 17, 0.5]]) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
    ctx.beginPath(); ctx.ellipse(0, 0, 8, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  return ctx.getImageData(0, 0, 64, 64);
}

function annotationTether() {
  const canvas = document.createElement("canvas");
  canvas.width = 4; canvas.height = 48;
  const ctx = canvas.getContext("2d");
  stroke(ctx, [[2, 0], [2, 48]], "#71645999", 1);
  return ctx.getImageData(0, 0, 4, 48);
}

// Optional illustration failures never decide route or GPS readiness. Each style
// has its own source identity; a late image cannot mutate a replacement style.
const artworkState = new WeakMap();
function assetSizedFallback(image, asset) {
  const source = document.createElement("canvas");
  source.width = image.width; source.height = image.height;
  source.getContext("2d").putImageData(image, 0, 0);
  const target = document.createElement("canvas");
  target.width = asset.width; target.height = asset.height;
  const scale = Math.min(asset.width / image.width, asset.height / image.height);
  const width = image.width * scale, height = image.height * scale;
  target.getContext("2d").drawImage(source, (asset.width - width) / 2, asset.height - height, width, height);
  return target.getContext("2d").getImageData(0, 0, asset.width, asset.height);
}
export function loadWatercolorImages(map, kinds) {
  let state = artworkState.get(map);
  if (!state || state.source !== map.getSource("fg-landmarks")) {
    state = { source: map.getSource("fg-landmarks"), pending: new Map() };
    artworkState.set(map, state);
  }
  if (!state.source || typeof map.loadImage !== "function") return Promise.resolve([]);
  return Promise.all(kinds.map(kind => {
    if (state.pending.has(kind)) return state.pending.get(kind);
    const asset = ART_ASSETS.find(item => item.kind === kind);
    if (!asset) return Promise.resolve(false);
    const id = kind === "garden-leaves" ? "fg-garden-leaves" : `fg-art-${kind}`;
    const task = map.loadImage(asset.url).then(image => {
      if (artworkState.get(map) !== state || map.getSource("fg-landmarks") !== state.source || !map.hasImage(id)) return false;
      // updateImage requires the same dimensions as its registered fallback.
      if (image.data.width !== asset.width || image.data.height !== asset.height) return false;
      map.updateImage(id, image.data);
      return true;
    }).catch(() => false);
    state.pending.set(kind, task);
    return task;
  }));
}

export function addWatercolorLayers(map) {
  const style = map.getStyle();
  if (!style?.sources?.openmaptiles) return false;
  for (const kind of ["station", "bridge", "dogana"]) {
    const asset = ART_ASSETS.find(item => item.kind === kind);
    if (!map.hasImage(`fg-art-${kind}`)) {
      artworkState.get(map)?.pending.delete(kind);
      map.addImage(`fg-art-${kind}`, assetSizedFallback(illustration(kind), asset), { pixelRatio: asset.pixelRatio });
    }
  }
  const pattern = ART_ASSETS.find(item => item.kind === "garden-leaves");
  if (!map.hasImage("fg-garden-leaves")) {
    artworkState.get(map)?.pending.delete("garden-leaves");
    map.addImage("fg-garden-leaves", assetSizedFallback(gardenPattern(), pattern), { pixelRatio: pattern.pixelRatio });
  }
  if (!map.hasImage("fg-garden-icon")) map.addImage("fg-garden-icon", gardenIcon(), { pixelRatio: 2 });
  if (!map.hasImage("fg-art-tether")) map.addImage("fg-art-tether", annotationTether(), { pixelRatio: 1 });
  if (!map.getSource("fg-landmarks")) map.addSource("fg-landmarks", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
  if (!map.getSource("fg-gardens")) map.addSource("fg-gardens", {
    type: "geojson",
    data: "/field-guide/gardens.json",
    attribution: '<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors · ODbL</a>',
  });
  const beforeRoads = style.layers.find((layer) => layer.id === "highway_path")?.id;
  if (!map.getLayer("fg-garden-wash")) map.addLayer({
    id: "fg-garden-wash", type: "fill", source: "fg-gardens", minzoom: 12,
    paint: { "fill-color": "#88c39a", "fill-opacity": 0.28 },
  }, beforeRoads);
  if (!map.getLayer("fg-garden-grain")) map.addLayer({
    id: "fg-garden-grain", type: "fill", source: "fg-gardens", minzoom: 14,
    paint: { "fill-pattern": "fg-garden-leaves", "fill-opacity": 0.55 },
  }, beforeRoads);
  if (!map.getLayer("fg-garden-label")) map.addLayer({
    id: "fg-garden-label", type: "symbol", source: "fg-gardens", minzoom: 15,
    layout: { "icon-image": "fg-garden-icon", "icon-size": 0.85,
      "icon-allow-overlap": false, "icon-ignore-placement": false,
      "text-field": ["get", "name"], "text-offset": [0, 1.9],
      "text-font": ["Noto Sans Regular"], "text-size": 11, "text-max-width": 12,
      "text-allow-overlap": false, "symbol-sort-key": 8 },
    paint: { "text-color": "#335e42", "text-halo-color": "#fff9ec", "text-halo-width": 1.5 },
  });
  if (!map.getLayer("fg-landmark-tether")) map.addLayer({
    id: "fg-landmark-tether", type: "symbol", source: "fg-landmarks", minzoom: 13, maxzoom: 24,
    filter: ["==", ["get", "active"], true],
    layout: { "icon-image": "fg-art-tether", "icon-anchor": "bottom",
      "icon-allow-overlap": true, "icon-ignore-placement": true,
      "icon-pitch-alignment": "viewport", "icon-rotation-alignment": "viewport" },
    paint: { "icon-opacity": 1 },
  });
  for (const [id, minzoom, filter] of [
    ["fg-landmark-overview", 13, ["!=", ["get", "active"], true]],
    ["fg-landmark-detail", 14.5, ["==", ["get", "key"], "__unused__"]],
  ]) if (!map.getLayer(id)) map.addLayer({
    id, type: "symbol", source: "fg-landmarks", minzoom, maxzoom: 24, filter,
    layout: { "icon-image": ["concat", "fg-art-", ["get", "icon"]],
      "icon-size": 0.75, "icon-anchor": "bottom", "icon-allow-overlap": false,
      "icon-ignore-placement": false, "icon-padding": 3,
      "icon-pitch-alignment": "viewport", "icon-rotation-alignment": "viewport",
      "symbol-sort-key": ["match", ["get", "icon"], "dogana", 1, "station", 2, 3] },
    paint: { "icon-opacity": id === "fg-landmark-detail" ?
      ["interpolate", ["linear"], ["zoom"], 14.5, 0, 15, 1] : 1 },
  });
  if (!map.getLayer("fg-landmark-active")) map.addLayer({
    id: "fg-landmark-active", type: "symbol", source: "fg-landmarks", minzoom: 13, maxzoom: 24,
    filter: ["==", ["get", "active"], true],
    layout: { "icon-image": ["concat", "fg-art-", ["get", "icon"]],
      "icon-anchor": "bottom", "icon-allow-overlap": true,
      "icon-ignore-placement": false, "icon-padding": 3,
      "icon-pitch-alignment": "viewport", "icon-rotation-alignment": "viewport" },
  });
  orderWatercolorLayers(map);
  void loadWatercolorImages(map, ["garden-leaves"]);
  return true;
}

/** Select real anchors in the viewport before requesting any raster. Pins stay independent. */
export function visibleLandmarks(map, route, activeVisitKey = null) {
  const container = map.getContainer?.(), width = container?.clientWidth || 800, height = container?.clientHeight || 500;
  const layout = watercolorLayout(width, height);
  if (!layout.visible || map.getZoom() < 13 || map.getPitch?.() > 0) return [];
  const max = width <= 600 ? 3 : 6;
  return landmarkFeatures(route).map(feature => {
    const point = map.project(feature.geometry.coordinates);
    return { ...feature, properties: { ...feature.properties, active: feature.properties.visitKey === activeVisitKey, screenDistance: Math.hypot(point.x - width / 2, point.y - height / 2) }, point };
  }).filter(feature => feature.point.x >= layout.maxWidth / 2 + 8 && feature.point.x <= width - layout.maxWidth / 2 - 8 && feature.point.y >= layout.maxHeight + layout.gap + 8 && feature.point.y <= height - 12)
    .sort((a,b) => Number(b.properties.active) - Number(a.properties.active) || a.properties.screenDistance - b.properties.screenDistance)
    .slice(0,max).map(({ point, ...feature }) => feature);
}
export function setWatercolorLandmarks(map, route, activeVisitKey = null) {
  const source = map.getSource("fg-landmarks"); if (!source) return;
  const features = visibleLandmarks(map, route, activeVisitKey);
  for (const feature of features) {
    const kind = feature.properties.icon, asset = ART_ASSETS.find(item => item.kind === kind);
    if (asset && !map.hasImage('fg-art-' + kind)) {
      artworkState.get(map)?.pending.delete(kind);
      map.addImage('fg-art-' + kind, { width: asset.width, height: asset.height, data: new Uint8Array(asset.width * asset.height * 4) }, { pixelRatio: asset.pixelRatio });
    }
  }
  for (const id of ["fg-landmark-active", "fg-landmark-tether"]) if (map.getLayer(id)) {
    if (map.getLayer(id).minzoom !== 13) map.setLayerZoomRange(id, 13, 24);
    if (map.getPaintProperty?.(id, "icon-opacity") !== 1) map.setPaintProperty(id, "icon-opacity", 1);
  }
  source.setData({ type: "FeatureCollection", features });
  if (features.length) void loadWatercolorImages(map, [...new Set(features.map(feature => feature.properties.icon))]);
}
