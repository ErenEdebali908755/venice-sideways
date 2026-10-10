/* Original Venice Sideways illustrations over OpenFreeMap / OpenStreetMap vectors. */
import { ILLUSTRATIONS } from "./illustrations.js?v=20261010-main-ten";

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
// Context belongs to an existing stop. These are neither additional visits nor
// promises that a gate is open today; the linked keeper has current conditions.
export const NEARBY_GREEN_SPACES = [
  { placeKey: "lucia", name: "Giardini Papadopoli", access: "Public green space · check current access", url: "https://www.comune.venezia.it/it/node/44238", checkedAt: "2026-10-06", polygonOSMWay: "174476472" },
  { placeKey: "lucia", name: "Parco Savorgnan", access: "Public green space · check current access", url: "https://www.comune.venezia.it/it/node/44238", checkedAt: "2026-10-06", polygonOSMWay: "4715855" },
  { placeKey: "lucia", name: "Giardino Mistico dei Carmelitani Scalzi", access: "Convent garden · guided visits by reservation", url: "https://www.veneziaunica.it/it/cosa-fare-a-venezia/giardini-parchi-oasi-naturali/giardino-mistico-dei-carmelitani-scalzi", checkedAt: "2026-10-06" },
  { placeKey: "marco", name: "Giardini Reali", access: "Public garden · check the foundation’s access information", url: "https://www.venicegardensfoundation.org/en/giardini-reali", checkedAt: "2026-10-06", polygonOSMWay: null },
  { placeKeys: ["accademia", "salute"], name: "Peggy Guggenheim Collection · Nasher Sculpture Garden", access: "Museum garden · admission conditions apply", url: "https://www.guggenheim-venice.it/en/visit/", checkedAt: "2026-10-06" },
  { placeKeys: ["giardini", "viale", "garibaldi"], name: "Giardini Napoleonici", access: "Public green space · check current access", url: "https://www.veneziaunica.it/en/things-to-do-in-venice/gardens-parks-natural-oases/napoleon-gardens", checkedAt: "2026-10-06" },
  { placeKeys: ["giardini", "viale", "garibaldi"], name: "Giardini della Biennale · exhibition grounds", access: "Exhibition grounds · ticket and event conditions apply", url: "https://www.labiennale.org/en/art/2026/prepare-your-visit", checkedAt: "2026-10-06" },
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
    waterway_line_label: { "text-color": "#406f86", "text-halo-color": "#F4F2ED" },
    water_name_point_label: { "text-color": "#406f86", "text-halo-color": "#F4F2ED" },
    label_other: { "text-color": "#59493f", "text-halo-color": "#F4F2ED" },
  };
  for (const layer of style.layers) {
    if (colors[layer.id]) layer.paint = { ...layer.paint, ...colors[layer.id] };
    if (["water_name_line_label", "waterway_line_label"].includes(layer.id)) layer.minzoom = Math.max(layer.minzoom || 0, 16);
    if (layer.type === "symbol") {
      layer.layout = { ...layer.layout, "text-allow-overlap": false, "text-ignore-placement": false };
      // Variable point anchors do not apply to a canal's line placement.
      if ((!layer.layout["symbol-placement"] || layer.layout["symbol-placement"] === "point") && layer.layout["text-field"] && !layer.layout["text-variable-anchor"])
        layer.layout["text-variable-anchor"] = ["top", "bottom", "left", "right"];
    }
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
      properties: { key, icon, visitKey: visit.key, placeKey: visit.placeKey || key,
        visitCoordinate: [visit.longitude, visit.latitude],
        artAnchor: ILLUSTRATIONS.find(asset => asset.key === key)?.artAnchor || null,
        placementMode: "bounded-callout" },
      geometry: { type: "Point", coordinates: ILLUSTRATIONS.find(asset => asset.key === key)?.artAnchor || [visit.longitude, visit.latitude] },
    }];
  });
}

const LANDMARK_LAYERS = ["fg-landmark-tether", "fg-landmark-overview", "fg-landmark-detail", "fg-landmark-active"];
const ZOOM_STOPS = [[13, 0.64], [15, 0.88], [16.5, 1], [19, 1]];

// These are screen annotation budgets, not architectural footprints. Height is
// independently bounded so the tall Dogana cannot outweigh the station/bridge.
export function watercolorLayout(width, height) {
  const compact = width < 768;
  const maxWidth = Math.min(compact ? 96 : 112, Math.max(0, width) * 0.27);
  const maxHeight = Math.min(compact ? 64 : 72, Math.max(0, height) * 0.24);
  const assets = ART_ASSETS.filter(asset => asset.kind !== "garden-leaves");
  return { gap: 0, maxWidth, maxHeight, visible: width >= 180 && height >= 160, sizes: Object.fromEntries(assets.map(asset => [asset.kind,
    Math.min(maxWidth / (asset.width / asset.pixelRatio), maxHeight / (asset.height / asset.pixelRatio))])) };
}

export function opticalPlacement(asset, point, iconSize, displacement = [0, 0]) {
  const ratio = asset.pixelRatio || 1, scale = iconSize / ratio;
  const [gx, gy] = asset.imageGroundPointPx || [asset.width / 2, asset.height];
  const [dx, dy] = displacement;
  const center = { x: point.x + (asset.width / 2 - gx) * scale + dx, y: point.y + (asset.height / 2 - gy) * scale + dy };
  const [left, top, right, bottom] = asset.visibleAlpha16BoundsPx || [0, 0, asset.width, asset.height];
  return { center, ground: { x: point.x + dx, y: point.y + dy },
    // icon-offset is in logical sprite pixels, then multiplied by icon-size.
    // The raw ground point is divided by pixelRatio exactly once.
    offset: [(asset.width / 2 - gx) / ratio + dx / iconSize, (asset.height / 2 - gy) / ratio + dy / iconSize],
    bounds: { left: center.x + (left - asset.width / 2) * scale, top: center.y + (top - asset.height / 2) * scale,
      right: center.x + (right - asset.width / 2) * scale, bottom: center.y + (bottom - asset.height / 2) * scale } };
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
  // Provider symbols are placed after the art family in collision priority,
  // while drawn beneath it. Cross-source collision is enabled on the map.
  // Canal line labels remain line labels; they no longer paint over Vino Vero.
  const labels = layers.filter(layer => layer.type === "symbol" && !layer.id.startsWith("fg-")).map(layer => layer.id);
  const overlay = [...labels, "fg-halo", "fg-walk", "fg-boat", "fg-directions", ...LANDMARK_LAYERS, "fg-garden-label"];
  const existing = overlay.filter(id => map.getLayer(id));
  const current = map.getStyle()?.layers.map(layer => layer.id) || [];
  if (current.slice(-existing.length).join("|") !== existing.join("|"))
    for (const id of existing) move(id);
}

export function applyWatercolorPresentation(map, { threeD = false } = {}) {
  orderWatercolorLayers(map);
  const container = map.getContainer?.();
  const layout = watercolorLayout(container?.clientWidth || 800, container?.clientHeight || 500);
  const set = (id, name, value) => {
    if (!map.getLayer(id)) return;
    if (JSON.stringify(map.getLayoutProperty?.(id, name)) !== JSON.stringify(value))
      map.setLayoutProperty(id, name, value);
  };
  set("fg-buildings", "visibility", threeD ? "visible" : "none");
  for (const id of LANDMARK_LAYERS) set(id, "visibility", threeD || !layout.visible ? "none" : "visible");
  for (const id of LANDMARK_LAYERS.slice(1)) {
    set(id, "icon-size", ["get", "iconSize"]);
    set(id, "icon-offset", ["get", "iconOffset"]);
  }
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
  if (!map.getSource("fg-landmarks")) map.addSource("fg-landmarks", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
  if (!map.getSource("fg-landmark-tethers")) map.addSource("fg-landmark-tethers", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
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
    id: "fg-landmark-tether", type: "line", source: "fg-landmark-tethers", minzoom: 13, maxzoom: 24,
    layout: { "line-cap": "round" },
    paint: { "line-color": "#716459", "line-width": 1, "line-opacity": 0.7 },
  });
  for (const [id, minzoom, filter] of [
    ["fg-landmark-overview", 13, ["!=", ["get", "active"], true]],
    ["fg-landmark-detail", 14.5, ["==", ["get", "key"], "__unused__"]],
  ]) if (!map.getLayer(id)) map.addLayer({
    id, type: "symbol", source: "fg-landmarks", minzoom, maxzoom: 24, filter,
    layout: { "icon-image": ["concat", "fg-art-", ["get", "icon"]],
      "icon-size": ["get", "iconSize"], "icon-offset": ["get", "iconOffset"], "icon-anchor": "center", "icon-allow-overlap": false,
      "icon-ignore-placement": false, "icon-padding": 3,
      "icon-pitch-alignment": "viewport", "icon-rotation-alignment": "viewport",
      "symbol-sort-key": ["get", "priority"] },
    paint: { "icon-opacity": id === "fg-landmark-detail" ?
      ["interpolate", ["linear"], ["zoom"], 14.5, 0, 15, 1] : 1 },
  });
  if (!map.getLayer("fg-landmark-active")) map.addLayer({
    id: "fg-landmark-active", type: "symbol", source: "fg-landmarks", minzoom: 13, maxzoom: 24,
    filter: ["==", ["get", "active"], true],
    layout: { "icon-image": ["concat", "fg-art-", ["get", "icon"]],
      "icon-size": ["get", "iconSize"], "icon-offset": ["get", "iconOffset"],
      "icon-anchor": "center", "icon-allow-overlap": false,
      "icon-ignore-placement": false, "icon-padding": 3,
      "icon-pitch-alignment": "viewport", "icon-rotation-alignment": "viewport" },
  });
  orderWatercolorLayers(map);
  void loadWatercolorImages(map, ["garden-leaves"]);
  return true;
}

export const boxesOverlap = (a, b, padding = 0) => a.left < b.right + padding && a.right > b.left - padding && a.top < b.bottom + padding && a.bottom > b.top - padding;
export function mapDOMObstacles(map) {
  const container=map.getContainer?.(), origin=container?.getBoundingClientRect?.();
  if (!origin) return [];
  const shell=container.closest?.('.fg-map-shell') || container.parentElement || container;
  // The floating toolbar wrapper is transparent and can span unused space.
  // Reserve the actual controls and only the open disclosure surfaces instead.
  const selector = '.fg-pin,.fg-location-dot,.fg-map-tools > button,.fg-location-controls > button,.fg-map-tools summary,.fg-map-options[open] > .fg-map-option-actions,.fg-location-copy[open] > .fg-privacy-panel,.fg-map-legend,.maplibregl-ctrl-top-right,.maplibregl-ctrl-bottom-right,.maplibregl-ctrl-attrib';
  return [...(shell.querySelectorAll?.(selector) || [])]
    .map(element=>element.getBoundingClientRect()).filter(box=>box.width>0&&box.height>0)
    .map(box=>({left:box.left-origin.left-5,top:box.top-origin.top-5,right:box.right-origin.left+5,bottom:box.bottom-origin.top+5}));
}
function zoomFactor(zoom) {
  for(let i=1;i<ZOOM_STOPS.length;i++) if(zoom<=ZOOM_STOPS[i][0]) {
    const [a,x]=ZOOM_STOPS[i-1], [b,y]=ZOOM_STOPS[i];return x+(y-x)*Math.max(0,(zoom-a)/(b-a));
  }
  return 1;
}
function routeScreenIndex(map, route, width, height) {
  const grid=new Map(),points=new Map();
  const project=coordinate=>{const key=coordinate.join(',');if(!points.has(key))points.set(key,map.project(coordinate));return points.get(key);};
  for(const segment of route?.segments||[]) for(let i=1;i<(segment.geometry?.length||0);i++) {
    const a=project(segment.geometry[i-1]),b=project(segment.geometry[i]);
    const left=Math.max(0,Math.min(a.x,b.x)-4),right=Math.min(width,Math.max(a.x,b.x)+4),top=Math.max(0,Math.min(a.y,b.y)-4),bottom=Math.min(height,Math.max(a.y,b.y)+4);
    if(left>right||top>bottom)continue;
    const line={a,b};
    for(let x=Math.floor(left/64);x<=Math.floor(right/64);x++)for(let y=Math.floor(top/64);y<=Math.floor(bottom/64);y++) {
      const key=x+','+y;if(!grid.has(key))grid.set(key,[]);grid.get(key).push(line);
    }
  }
  return grid;
}
function routeIntersectsBox(grid, box) {
  const lines=new Set();
  for(let x=Math.floor(box.left/64);x<=Math.floor(box.right/64);x++)for(let y=Math.floor(box.top/64);y<=Math.floor(box.bottom/64);y++)for(const line of grid.get(x+','+y)||[])lines.add(line);
  for(const {a,b} of lines) {
    const dx=b.x-a.x,dy=b.y-a.y;let lower=0,upper=1,intersects=true;
    for(const [p,q] of [[-dx,a.x-box.left+4],[dx,box.right+4-a.x],[-dy,a.y-box.top+4],[dy,box.bottom+4-a.y]]) {
      if(p===0){if(q<0){intersects=false;break;}continue;}
      const ratio=q/p;if(p<0)lower=Math.max(lower,ratio);else upper=Math.min(upper,ratio);
      if(lower>upper){intersects=false;break;}
    }
    if(intersects)return true;
  }
  return false;
}
const selectionState=new WeakMap();
/** Alpha-based screen culling. A displaced image is an explicit tethered callout. */
export function visibleLandmarks(map, route, activeVisitKey = null, { obstacles = mapDOMObstacles(map), protectRoute = true } = {}) {
  const container = map.getContainer?.(), width = container?.clientWidth || 800, height = container?.clientHeight || 500;
  const layout = watercolorLayout(width, height);
  if (!layout.visible || map.getZoom() < 13 || map.getPitch?.() > 0) return [];
  const max = width < 768 ? 3 : 6;
  const routeObstacles=protectRoute?routeScreenIndex(map,route,width,height):null;
  const previous=selectionState.get(map), retained=previous?.routeKey===route?.key ? previous.positions : new Map();
  const accepted=[],positions=new Map();
  const candidates=landmarkFeatures(route).map(feature => {
    const projected = map.project(feature.geometry.coordinates);
    // MapLibre's Point is a class instance; GeoJSON worker properties must be
    // ordinary serializable values, including our calibration QA metadata.
    const point = { x: projected.x, y: projected.y };
    const active=feature.properties.visitKey===activeVisitKey;
    return {feature,point,active,distance:Math.hypot(point.x-width/2,point.y-height/2)-(retained.has(feature.properties.key)?24:0)};
  }).filter(({point})=>point.x>=0&&point.y>=0&&point.x<=width&&point.y<=height)
    .sort((a,b)=>Number(b.active)-Number(a.active)||a.distance-b.distance||a.feature.properties.key.localeCompare(b.feature.properties.key));
  for(const {feature,point,active} of candidates) {
    const asset=ART_ASSETS.find(row=>row.kind===feature.properties.icon);
    const size=layout.sizes[asset.kind]*zoomFactor(map.getZoom());
    const old=retained.get(feature.properties.key);
    const displacements=[...(old?[old]:[]),[0,0],[0,-32],[0,-56],[-48,-32],[48,-32],[-64,0],[64,0],[0,48]];
    let chosen;
    for(const displacement of displacements) {
      if(Math.hypot(...displacement)>(asset.placement?.maxDisplacementCSSPx||72))continue;
      const placement=opticalPlacement(asset,point,size,displacement),box=placement.bounds;
      if(box.left<8||box.top<8||box.right>width-8||box.bottom>height-8)continue;
      if(obstacles.some(obstacle=>boxesOverlap(box,obstacle,4))||accepted.some(item=>boxesOverlap(box,item.bounds,8)))continue;
      if(protectRoute&&routeIntersectsBox(routeObstacles,box))continue;
      chosen={...placement,displacement};break;
    }
    if(!chosen)continue;
    positions.set(feature.properties.key,chosen.displacement);
    accepted.push({bounds:chosen.bounds,feature:{...feature,properties:{...feature.properties,active,priority:accepted.length,
      iconSize:size,iconOffset:chosen.offset,screenDisplacement:chosen.displacement,
      visibleBoundsCSS:chosen.bounds,groundCSS:chosen.ground,anchorCSS:point}}});
    if(accepted.length>=max)break;
  }
  selectionState.set(map,{routeKey:route?.key,positions});
  return accepted.map(item=>item.feature);
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
  for (const id of ["fg-landmark-active"]) if (map.getLayer(id)) {
    if (map.getLayer(id).minzoom !== 13) map.setLayerZoomRange(id, 13, 24);
    if (map.getPaintProperty?.(id, "icon-opacity") !== 1) map.setPaintProperty(id, "icon-opacity", 1);
  }
  source.setData({ type: "FeatureCollection", features });
  const tethers=features.flatMap(feature=>{
    const {groundCSS,anchorCSS,screenDisplacement}=feature.properties;
    if(!screenDisplacement.some(value=>Math.abs(value)>1)||!map.unproject)return [];
    const end=map.unproject(groundCSS);
    return [{type:'Feature',properties:{key:feature.properties.key},geometry:{type:'LineString',coordinates:[feature.geometry.coordinates,[end.lng,end.lat]]}}];
  });
  map.getSource('fg-landmark-tethers')?.setData({type:'FeatureCollection',features:tethers});
  if (features.length) void loadWatercolorImages(map, [...new Set(features.map(feature => feature.properties.icon))]);
}
