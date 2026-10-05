/* Original Venice Sideways illustrations over OpenFreeMap / OpenStreetMap vectors. */
export const BASE_STYLE = "https://tiles.openfreemap.org/styles/positron";

export const MAIN_LANDMARKS = [
  { key: "lucia", icon: "station", coordinatesFrom: "lucia" },
  { key: "accademia", icon: "bridge", coordinatesFrom: "accademia" },
  { key: "dogana", icon: "dogana", coordinatesFrom: "dogana" },
];

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
  return place ? { name: place.name, text: place.text[language] || place.text.en } : null;
}

export function watercolorStyle(base) {
  if (!base?.sources?.openmaptiles || !Array.isArray(base.layers))
    throw new Error("OpenFreeMap style is missing its vector source");
  const style = structuredClone(base);
  style.name = "Venice Sideways · watercolor field guide";
  style.metadata = { ...style.metadata, "venice-sideways:base": BASE_STYLE };
  const colors = {
    background: { "background-color": "#f8f1e6" },
    park: { "fill-color": "#bfd8bc" },
    landcover_wood: { "fill-color": "#a6c8ac" },
    landuse_residential: { "fill-color": "#f2e9db" },
    water: { "fill-color": "#b7d7e2" },
    waterway: { "line-color": "#8ab8cb" },
    building: { "fill-color": "#ead8c4", "fill-outline-color": "#d8bfa8" },
    road_area_pier: { "fill-color": "#fcf7ed" },
    road_pier: { "line-color": "#fcf7ed" },
    highway_path: { "line-color": "#fffaf2" },
    highway_minor: { "line-color": "#fffaf2" },
    highway_major_inner: { "line-color": "#fffaf2" },
    highway_motorway_inner: { "line-color": "#fffaf2" },
    highway_motorway_bridge_inner: { "line-color": "#fffaf2" },
    water_name_line_label: { "text-color": "#406f86", "text-halo-color": "#f8f1e6" },
    water_name_point_label: { "text-color": "#406f86", "text-halo-color": "#f8f1e6" },
    label_other: { "text-color": "#59493f", "text-halo-color": "#f8f1e6" },
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
  if (route?.key !== "main") return [];
  return MAIN_LANDMARKS.flatMap(({ key, icon, coordinatesFrom }) => {
    const visit = route.visits?.find((entry) => entry.key === coordinatesFrom);
    if (!Number.isFinite(visit?.longitude) || !Number.isFinite(visit?.latitude)) return [];
    return [{
      type: "Feature",
      properties: { key, icon },
      geometry: { type: "Point", coordinates: [visit.longitude, visit.latitude] },
    }];
  });
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
  ctx.fillStyle = "#b7d7e288";
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

export function addWatercolorLayers(map) {
  const style = map.getStyle();
  if (!style?.sources?.openmaptiles || map.getSource("fg-landmarks")) return false;
  for (const kind of ["station", "bridge", "dogana"])
    map.addImage(`fg-art-${kind}`, illustration(kind), { pixelRatio: 2 });
  map.addImage("fg-garden-leaves", gardenPattern());
  map.addImage("fg-garden-icon", gardenIcon(), { pixelRatio: 2 });
  map.addSource("fg-landmarks", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
  map.addSource("fg-gardens", {
    type: "geojson",
    data: "/field-guide/gardens.json",
    attribution: '<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors · ODbL</a>',
  });
  const beforeRoads = style.layers.find((layer) => layer.id === "highway_path")?.id;
  map.addLayer({
    id: "fg-garden-wash", type: "fill", source: "fg-gardens", minzoom: 12,
    paint: { "fill-color": "#88c39a", "fill-opacity": 0.28 },
  }, beforeRoads);
  map.addLayer({
    id: "fg-garden-grain", type: "fill", source: "fg-gardens", minzoom: 14,
    paint: { "fill-pattern": "fg-garden-leaves", "fill-opacity": 0.55 },
  }, beforeRoads);
  map.addLayer({
    id: "fg-garden-label", type: "symbol", source: "fg-gardens", minzoom: 15,
    layout: { "icon-image": "fg-garden-icon", "icon-size": 0.85,
      "icon-allow-overlap": false, "icon-ignore-placement": false,
      "text-field": ["get", "name"], "text-offset": [0, 1.9],
      "text-font": ["Noto Sans Regular"], "text-size": 11, "text-max-width": 12,
      "text-allow-overlap": false, "symbol-sort-key": 8 },
    paint: { "text-color": "#335e42", "text-halo-color": "#fff9ec", "text-halo-width": 1.5 },
  });
  for (const [id, minzoom, maxzoom, filter] of [
    ["fg-landmark-overview", 13, 15, ["==", ["get", "key"], "dogana"]],
    ["fg-landmark-detail", 15, 24, ["has", "key"]],
  ]) map.addLayer({
    id, type: "symbol", source: "fg-landmarks", minzoom, maxzoom, filter,
    layout: { "icon-image": ["concat", "fg-art-", ["get", "icon"]],
      "icon-size": 1, "icon-anchor": "bottom", "icon-allow-overlap": true,
      "icon-ignore-placement": false, "symbol-sort-key": 10 },
  });
  return true;
}

export function setWatercolorLandmarks(map, route) {
  map.getSource("fg-landmarks")?.setData({ type: "FeatureCollection", features: landmarkFeatures(route) });
}
