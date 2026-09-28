/* Shared visitor presentation. No draft endpoint or analytics; location is opt-in and disabled in previews. */
export const languages = {
  en: "English",
  tr: "Türkçe",
  it: "Italiano",
  fr: "Français",
  ru: "Русский",
  zh: "简体中文",
  ja: "日本語",
  ko: "한국어",
};
export const copy = (rows, lang) =>
  rows?.find((x) => x.locale === lang) ||
  rows?.find((x) => x.locale === "en") ||
  rows?.[0] ||
  {};
export const ordered = (route) =>
  [...(route?.segments || [])]
    .sort((a, b) => a.order - b.order)
    .flatMap((s) =>
      route.visits
        .filter((v) => v.visible && v.segmentKey === s.key)
        .sort((a, b) => a.order - b.order),
    );
export const text = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export const safeURL = (value) => {
  try {
    const u = new URL(
      value,
      globalThis.location?.origin || "https://venicesideways.com",
    );
    return ["http:", "https:"].includes(u.protocol) &&
      !u.username &&
      !u.password
      ? u.href
      : "";
  } catch {
    return "";
  }
};
export const photoURL = (value) => {
  try {
    const u = new URL(value);
    if (
      u.protocol !== "https:" ||
      !["erenedebali.com", "venicesideways.com"].includes(u.hostname) ||
      u.username || u.password || u.hash ||
      [...u.searchParams.keys()].some((key) => key !== "v") ||
      (u.hostname === "erenedebali.com" &&
        !/^\/(?:photo-image|image)\/[1-9]\d*\/(?:web|zoom|thumb|400|640|900|1200|1600|2200)$/.test(u.pathname))
    ) return "";
    return u.href;
  } catch { return ""; }
};
export const color = (line) =>
  ({ 1: "#176aa8", 5.2: "#88377e", 5.1: "#98500e", 2: "#496525" })[line] ||
  "#6b4691";
export function withOfficialWater(input, water) {
  const route = structuredClone(input),
    keys = ["board", "change", "land"],
    original = [
      [12.32871, 45.43164],
      [12.32206, 45.44026],
      [12.31985, 45.44613],
    ];
  for (const s of route.segments || []) {
    if (
      s.type !== "vaporetto" ||
      s.officialLegs?.length ||
      s.geometry.length > 3 ||
      s.transitStops.length !== 3 ||
      s.transitStops.some(
        (p, i) =>
          p.placeKey !== keys[i] ||
          Math.abs(p.longitude - original[i][0]) > 0.00001 ||
          Math.abs(p.latitude - original[i][1]) > 0.00001,
      )
    )
      continue;
    s.officialLegs = water.legs;
    s.feedModifiedAt = water.feedModifiedAt;
    s.sourceURL = water.source;
    s.timetableURL = water.timetable;
  }
  return route;
}
export function routeFeatures(route) {
  return {
    type: "FeatureCollection",
    features: (route?.segments || []).flatMap((s) => {
      const legs = s.officialLegs?.length
        ? s.officialLegs
        : [
            {
              coordinates: s.geometry,
              line: s.type === "vaporetto" ? s.transitStops?.[0]?.lineTo : "",
            },
          ];
      // Never connect missing geometry with a straight line. Different boat legs remain separate features.
      return legs
        .filter((l) => l.coordinates?.length > 1)
        .map((l) => ({
          type: "Feature",
          properties: {
            key: s.key,
            boat: s.type === "vaporetto",
            line: l.line || "",
            label: l.line ? "ACTV " + l.line : "",
            color: s.type === "vaporetto" ? color(l.line) : "#17676b",
          },
          geometry: { type: "LineString", coordinates: l.coordinates },
        }));
    }),
  };
}
export function routeCard(route, lang) {
  const tr = lang === "tr",
    stops = ordered(route),
    c = copy(route.copy, lang),
    boat = route.segments.some((s) => s.type === "vaporetto");
  return `<article class="fg-route-card"><span class="fg-kicker">${text(stops.filter((v) => v.isPhotoStop).length)} ${tr ? "DURAK" : "STOPS"} · ${boat ? "VAPORETTO + " + (tr ? "YÜRÜYÜŞ" : "WALKING") : tr ? "YÜRÜYÜŞ" : "WALKING"}</span><h2>${text(c.title || route.key)}</h2><p>${text(route.presentation?.summary?.[lang] || c.text || (route.key === "main" ? (tr ? "Dorsoduro kıyıları, iki vaporetto hattı ve Cannaregio’da bir son durak." : "Dorsoduro waterfronts, two waterbus lines and a finish in Cannaregio.") : tr ? "Cannaregio’dan Dorsoduro’ya, Castello üzerinden Sant’Elena’ya uzanan yürüyüş." : "From Cannaregio through Dorsoduro and Castello, ending at Sant’Elena."))}</p><dl><div><dt>${tr ? "Başlangıç" : "Start"}</dt><dd>${text(copy(stops[0]?.copy, lang).title || "—")}</dd></div><div><dt>${tr ? "Bitiş" : "Finish"}</dt><dd>${text(copy(stops.at(-1)?.copy, lang).title || "—")}</dd></div></dl><p class="fg-meta">${tr ? "Süre ve mesafe henüz doğrulanmadı." : "Duration and distance not yet verified."}</p><button class="fg-primary" data-start="${text(route.key)}">${tr ? "Bu rotayı yürü" : "Walk this route"} <span aria-hidden="true">↗</span></button></article>`;
}
export function photoHTML(photo, cls = "") {
  if (!photo?.url || !photoURL(photo.url)) return "";
  return `<figure class="fg-photo ${cls}"><img src="${text(photoURL(photo.url))}" alt="${text(photo.alt || "")}" style="object-position:${Number(photo.x ?? 50)}% ${Number(photo.y ?? 50)}%" loading="lazy"><figcaption>${text(photo.credit || "")}</figcaption></figure>`;
}
export function stopCard(route, stop, lang, { detail = false } = {}) {
  const tr = lang === "tr",
    c = copy(stop.copy, lang),
    n =
      ordered(route)
        .filter((v) => v.isPhotoStop)
        .findIndex((v) => v.key === stop.key) + 1;
  return `<article class="fg-stop-story" data-stop-key="${text(stop.key)}"><span class="fg-kicker">${tr ? "DURAK" : "STOP"} ${n > 0 ? String(n).padStart(2, "0") : "·"}</span><h2>${text(c.title || stop.key)}</h2>${photoHTML(route.presentation?.photos?.[stop.key])}<p class="fg-stop-description ${detail ? "" : "fg-clamp"}">${text(c.text)}</p>${!detail ? `<button class="fg-text-button" data-action="detail">${tr ? "Fotoğraf ve ayrıntılar" : "Photo & details"} ↗</button>` : ""}</article>`;
}
const messages = {
  en: {
    explore: "Explore",
    walk: "Walk",
    start: "Find the start",
    next: "Next stop",
    previous: "Previous stop",
    stops: "Stops",
    map: "Map",
    back: "Back to map",
    all: "Route overview",
    detail: "Stop details",
    retry: "Try map again",
    unavailable:
      "The map could not load. The stop list and directions still work.",
    loading: "Opening the map…",
    empty: "No visible stops in this route yet.",
    offline:
      "You are offline. Loaded stop details remain available; directions and maps need a connection.",
    location: "My location",
    stopLocation: "Stop location",
    locationOnly:
      "Your location stays on this device. It is not shared with admins.",
    denied: "Location unavailable. You can continue using the guide.",
    transfer: "Waterbus & transfer",
    end: "You reached the last stop",
    edit: "Edit this stop",
    missingPhoto: "A photograph has not been assigned to this stop yet.",
  },
  tr: {
    explore: "Keşfet",
    walk: "Yürü",
    start: "Başlangıca git",
    next: "Sonraki durak",
    previous: "Önceki durak",
    stops: "Duraklar",
    map: "Harita",
    back: "Haritaya dön",
    all: "Rotanın tamamı",
    detail: "Durak ayrıntısı",
    retry: "Haritayı yeniden dene",
    unavailable:
      "Harita yüklenemedi. Durak listesi ve yol tarifi bağlantıları kullanılabilir.",
    loading: "Harita açılıyor…",
    empty: "Bu rotaya henüz görünür durak eklenmedi.",
    offline:
      "Çevrimdışısın. Yüklenen durak bilgileri açık kalır; harita ve yol tarifleri için bağlantı gerekir.",
    location: "Konumum",
    stopLocation: "Konumu kapat",
    locationOnly: "Konumun bu cihazda kalır. Yöneticilerle paylaşılmaz.",
    denied: "Konum alınamadı. Rehberi kullanmaya devam edebilirsin.",
    transfer: "Vaporetto ve aktarma",
    end: "Son durağa geldin",
    edit: "Bu durağı düzenle",
    missingPhoto: "Bu durağa henüz fotoğraf atanmamış.",
  },
};
// The original eight-language guide remains accessible. Existing translated stop/idea content is preserved here.
export function createGuide(
  root,
  {
    routes = [],
    lang = "en",
    routeKey = "main",
    mode = "explore",
    preview = false,
    onRoute = () => {},
    onLanguage = () => {},
    onEdit = () => {},
  } = {},
) {
  let state = {
      routes,
      lang,
      routeKey,
      mode,
      stopKey: "",
      expanded: false,
      screen: "map",
    },
    map = null,
    mapReady = false,
    fallback = null,
    fallbackLayers = [],
    fallbackLocation = null,
    pins = [],
    mapTimer = null,
    watch = null,
    locationMarker = null,
    accuracyLayer = false,
    locationExpiry = null,
    locationSession = null,
    generation = 0,
    threeD = false,
    destroyed = false;
  let reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const q = (s) => root.querySelector(s),
    m = (k) => (messages[state.lang] || messages.en)[k],
    tr = () => state.lang === "tr",
    route = () =>
      state.routes.find((r) => r.key === state.routeKey) || state.routes[0],
    visits = () => ordered(route());
  function current() {
    return visits().find((v) => v.key === state.stopKey) || visits()[0];
  }
  root.classList.add("fg");
  root.innerHTML = `<header class="fg-header"><button class="fg-wordmark" data-action="explore" aria-label="Venice Sideways"><span>VENICE</span><small>SIDEWAYS</small></button><div class="fg-mode"><button data-action="explore"></button><button data-action="walk"></button></div><div class="fg-utilities"><label><span class="fg-sr">Language</span><select data-language>${Object.entries(
    languages,
  )
    .map(([k, v]) => `<option value="${k}">${v}</option>`)
    .join(
      "",
    )}</select></label><button data-action="theme" aria-label="Change panel theme">◐</button></div></header><div class="fg-network" role="status" hidden></div><main class="fg-main"><section class="fg-discover"><div class="fg-intro"><span class="fg-kicker"></span><h1></h1><p></p><button class="fg-primary" data-action="choose"></button></div><div class="fg-cover"></div><div class="fg-route-choices" id="fg-routes"></div></section><section class="fg-walking"><div class="fg-walkbar"><button data-action="explore">←</button><label><span class="fg-sr">Route</span><select data-route></select></label><button data-action="list"></button></div><div class="fg-map-shell"><div class="fg-map" role="region" aria-label="Route map"></div><div class="fg-map-status" role="status"></div><div class="fg-map-controls"><button data-action="fit"></button><button data-action="3d" aria-pressed="false">3D</button>${preview ? "" : '<button data-action="locate"></button>'}</div><div class="fg-legend"></div></div><aside class="fg-stop-panel"><div class="fg-progress"></div><div class="fg-stop-content"></div><div class="fg-step-actions"></div></aside><section class="fg-stop-list" hidden><header><h2></h2><button data-action="close-list">×</button></header><ol></ol></section></section><section class="fg-detail" hidden></section></main><footer class="fg-footer"><span>Venice Sideways · Eren Edebali</span><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap contributors</a>${preview ? "" : '<a href="/legacy.html">Original guide · 8 languages ↗</a>'}</footer>`;
  q("[data-language]").value = state.lang;
  function issue(message) {
    if (!mapReady && !fallback && window.L) {
      makeFallback();
      return;
    }
    q(".fg-map-status").innerHTML =
      `<p>${text(message)}</p><button data-action="retry">${m("retry")}</button>`;
    q(".fg-map-status").hidden = false;
  }
  function resetMap() {
    stopLocation();
    fallback?.remove();
    fallback = null;
    fallbackLayers = [];
    generation++;
    clearTimeout(mapTimer);
    pins.forEach((p) => p.remove());
    pins = [];
    map?.remove();
    map = null;
    mapReady = false;
  }
  function makeFallback() {
    clearTimeout(mapTimer);
    map?.remove();
    map = null;
    mapReady = false;
    try {
      fallback = L.map(q(".fg-map"), { zoomControl: false }).setView(
        [45.437, 12.333],
        13,
      );
      L.control.zoom({ position: "topright" }).addTo(fallback);
      let tileLoaded = false;
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap contributors",
      })
        .on("tileload", () => {
          tileLoaded = true;
          q(".fg-map-status").hidden = true;
        })
        .on("tileerror", () => {
          if (!tileLoaded) {
            q(".fg-map-status").hidden = false;
            q(".fg-map-status").textContent = m("unavailable");
          }
        })
        .addTo(fallback);
      q(".fg-map-status").hidden = true;
      q('[data-action="3d"]').disabled = true;
      paintFallback();
      fit();
    } catch {
      q(".fg-map-status").hidden = false;
      q(".fg-map-status").textContent = m("unavailable");
    }
  }
  function paintFallback() {
    if (!fallback) return;
    fallbackLayers.forEach((l) => l.remove());
    fallbackLayers = [];
    fallbackLayers.push(
      L.geoJSON(routeFeatures(route()), {
        style: (f) => ({
          color: f.properties.color,
          weight: 4.5,
          opacity: 1,
          dashArray: f.properties.boat ? "8 7" : undefined,
        }),
      }).addTo(fallback),
    );
    let n = 0;
    for (const v of visits()) {
      const label = v.isPhotoStop ? String(++n) : "·",
        title = copy(v.copy, state.lang).title || v.key;
      const marker = L.marker([v.latitude, v.longitude], {
        zIndexOffset: v.key === current()?.key ? 10000 : 0,
        icon: L.divIcon({
          className: "fg-leaflet-pin",
          html: `<button class="fg-pin ${v.key === current()?.key ? "is-selected" : ""}" aria-label="${text(label + " · " + title)}">${label}</button>`,
          iconSize: [44, 44],
          iconAnchor: [22, 22],
        }),
        keyboard: false,
      }).addTo(fallback);
      marker.getElement().querySelector("button").onclick = () =>
        selectStop(v.key);
      fallbackLayers.push(marker);
    }
    for (const seg of route().segments.filter((s) => s.type === "vaporetto"))
      for (const p of seg.transitStops) {
        const marker = L.marker([p.latitude, p.longitude], {
          icon: L.divIcon({
            className: "fg-leaflet-pin",
            html: `<button class="fg-pin fg-boat-pin" aria-label="${text(p.name)}">⛴</button>`,
            iconSize: [44, 44],
            iconAnchor: [22, 22],
          }),
          keyboard: false,
        }).addTo(fallback);
        marker.getElement().querySelector("button").onclick = () =>
          openTransit(seg.key);
        fallbackLayers.push(marker);
      }
  }
  function makeMap() {
    if (map || destroyed) return;
    if (!window.maplibregl) {
      issue(m("unavailable"));
      return;
    }
    q(".fg-map-status").textContent = m("loading");
    q(".fg-map-status").hidden = false;
    try {
      map = new maplibregl.Map({
        container: q(".fg-map"),
        style: "https://tiles.openfreemap.org/styles/positron",
        center: [12.333, 45.437],
        zoom: 13.7,
        pitch: 0,
        attributionControl: true,
      });
      map.addControl(
        new maplibregl.NavigationControl({ showCompass: false }),
        "top-right",
      );
      mapTimer = setTimeout(() => {
        if (!mapReady) issue(m("unavailable"));
      }, 12000);
      map.on("load", () => {
        mapReady = true;
        clearTimeout(mapTimer);
        q(".fg-map-status").hidden = true;
        map.addSource("fg-route", {
          type: "geojson",
          data: routeFeatures(route()),
        });
        map.addLayer({
          id: "fg-route-halo",
          source: "fg-route",
          type: "line",
          paint: {
            "line-color": "#fff",
            "line-width": 8,
            "line-opacity": 0.85,
          },
        });
        map.addLayer({
          id: "fg-walk",
          source: "fg-route",
          type: "line",
          filter: ["==", ["get", "boat"], false],
          layout: { "line-join": "round", "line-cap": "round" },
          paint: { "line-color": "#17676b", "line-width": 4.5 },
        });
        map.addLayer({
          id: "fg-boat",
          source: "fg-route",
          type: "line",
          filter: ["==", ["get", "boat"], true],
          paint: {
            "line-color": ["get", "color"],
            "line-width": 4.5,
            "line-dasharray": [2, 1.5],
          },
        });
        map.addLayer({
          id: "fg-boat-label",
          source: "fg-route",
          type: "symbol",
          filter: ["==", ["get", "boat"], true],
          layout: {
            "text-field": ["get", "label"],
            "text-font": ["Noto Sans Regular"],
            "text-size": 13,
            "symbol-placement": "line",
          },
          paint: {
            "text-color": ["get", "color"],
            "text-halo-color": "#fff",
            "text-halo-width": 2,
          },
        });
        const layer = (map.getStyle().layers || []).find(
          (l) => l["source-layer"] === "building",
        );
        if (layer) {
          map.addLayer(
            {
              id: "fg-buildings",
              type: "fill-extrusion",
              source: layer.source,
              "source-layer": "building",
              minzoom: 14,
              layout: { visibility: "none" },
              paint: {
                "fill-extrusion-color": "#c9c6b9",
                "fill-extrusion-height": [
                  "max",
                  5,
                  ["coalesce", ["get", "render_height"], 5],
                ],
                "fill-extrusion-base": [
                  "coalesce",
                  ["get", "render_min_height"],
                  0,
                ],
                "fill-extrusion-opacity": 0.8,
              },
            },
            "fg-route-halo",
          );
        }
        paintMap();
        fit();
      });
      map.on("error", () => {
        if (!mapReady) issue(m("unavailable"));
      });
    } catch {
      issue(m("unavailable"));
    }
  }
  function fit() {
    if (fallback && visits().length) {
      const points = visits().map((v) => [v.latitude, v.longitude]);
      routeFeatures(route()).features.forEach((f) =>
        f.geometry.coordinates.forEach((c) => points.push([c[1], c[0]])),
      );
      fallback.fitBounds(points, {
        padding: [45, 45],
        maxZoom: 16,
        animate: !reduced,
      });
      return;
    }
    if (!mapReady || !visits().length) return;
    const b = new maplibregl.LngLatBounds();
    visits().forEach((v) => b.extend([v.longitude, v.latitude]));
    routeFeatures(route()).features.forEach((f) =>
      f.geometry.coordinates.forEach((c) => b.extend(c)),
    );
    map.fitBounds(b, { padding: 50, maxZoom: 16, duration: reduced ? 0 : 250 });
  }
  function focus() {
    const v = current();
    if (fallback && v) {
      fallback.setView(
        [v.latitude, v.longitude],
        Math.max(fallback.getZoom(), 16),
        { animate: !reduced },
      );
      return;
    }
    if (mapReady && v)
      map.easeTo({
        center: [v.longitude, v.latitude],
        zoom: Math.max(map.getZoom(), 16),
        duration: reduced ? 0 : 250,
      });
  }
  function paintMap() {
    if (fallback) {
      paintFallback();
      return;
    }
    if (!mapReady || !route()) return;
    map.getSource("fg-route")?.setData(routeFeatures(route()));
    pins.forEach((p) => p.remove());
    pins = [];
    let n = 0;
    for (const v of visits()) {
      const el = document.createElement("button");
      el.className =
        "fg-pin" + (v.key === current()?.key ? " is-selected" : "");
      el.textContent = v.isPhotoStop ? String(++n) : "·";
      el.setAttribute(
        "aria-label",
        `${n} · ${copy(v.copy, state.lang).title || v.key}`,
      );
      el.setAttribute("aria-current", String(v.key === current()?.key));
      el.onclick = () => selectStop(v.key);
      pins.push(
        new maplibregl.Marker({ element: el })
          .setLngLat([v.longitude, v.latitude])
          .addTo(map),
      );
    }
    for (const s of route().segments.filter((s) => s.type === "vaporetto"))
      for (const [i, p] of (s.transitStops || []).entries()) {
        const el = document.createElement("button");
        el.className = "fg-pin fg-boat-pin";
        el.textContent = "⛴";
        el.title = p.name;
        el.setAttribute("aria-label", p.name);
        el.onclick = () => openTransit(s.key);
        pins.push(
          new maplibregl.Marker({ element: el })
            .setLngLat([p.longitude, p.latitude])
            .addTo(map),
        );
      }
  }
  function selectStop(key) {
    if (preview) onEdit(key);
    state.stopKey = key;
    state.screen = "map";
    state.mode = "walk";
    state.expanded = false;
    paint();
    focus();
  }
  function transitHTML(s) {
    const legs = s.officialLegs?.length
      ? s.officialLegs
      : (s.transitStops || []).slice(0, -1).map((p, i) => ({
          line: p.lineTo,
          fromName: p.name,
          toName: s.transitStops[i + 1].name,
        }));
    return `<section class="fg-transit"><span class="fg-kicker">⛴ ${m("transfer")}</span><h2>${tr() ? "İskeleden iskeleye" : "Pier to pier"}</h2>${legs.map((l, i) => `<div class="fg-transit-leg"><strong style="--line:${color(l.line)}">ACTV ${text(l.line || "—")}</strong><p>${text(l.fromName)} <span aria-hidden="true">→</span> ${text(l.toName)}</p></div>${i < legs.length - 1 ? `<p class="fg-transfer-note">↔ ${tr() ? "İskele değiştir:" : "Change piers:"} ${text(l.toName)} → ${text(legs[i + 1].fromName)}. ${tr() ? "İskele panosunu ve yürüyüş bağlantısını kontrol et." : "Check pier signs and the walking connection."}</p>` : ""}`).join("")}<p class="fg-meta">${tr() ? "Tarifeli güzergâh; canlı sefer bilgisi değildir." : "Scheduled route, not live service information."} ${s.feedModifiedAt ? `ACTV · ${text(s.feedModifiedAt)}` : ""}</p>${safeURL(s.timetableURL) ? `<a href="${text(safeURL(s.timetableURL))}" target="_blank" rel="noopener">${tr() ? "Güncel ACTV tarifesi ve duyurular" : "Current ACTV timetable & notices"} ↗</a>` : ""}</section>`;
  }
  function openTransit(key) {
    const s = route().segments.find((s) => s.key === key);
    if (!s) return;
    state.mode = "walk";
    q(".fg-detail").innerHTML =
      `<button data-action="back">← ${m("back")}</button>${transitHTML(s)}`;
    q(".fg-detail").hidden = false;
    q(".fg-detail").querySelector("button").focus();
    root.dataset.detail = "true";
  }
  function detail() {
    const v = current();
    if (!v) return;
    state.expanded = true;
    root.dataset.detail = "true";
    q(".fg-detail").hidden = false;
    q(".fg-detail").innerHTML =
      `<button data-action="back">← ${m("back")}</button>${stopCard(route(), v, state.lang, { detail: true })}${!route().presentation?.photos?.[v.key] ? `<p class="fg-meta">${m("missingPhoto")}</p>` : ""}<details open><summary>${tr() ? "Fotoğraf fikirleri" : "Photo ideas"} · ${v.ideas?.length || 0}</summary>${(
        v.ideas || []
      )
        .map((idea, i) => {
          const c = copy(idea.copy, state.lang);
          return `<section class="fg-idea"><span class="fg-kicker">${i + 1} / ${v.ideas.length} · ${text(c.theme)}</span><h3>${text(c.title)}</h3><p>${text(c.text)}</p><small>${text(c.phoneTip)}</small></section>`;
        })
        .join(
          "",
        )}</details>${preview ? `<button class="fg-primary" data-action="edit">${m("edit")}</button>` : ""}`;
    q(".fg-detail button").focus();
  }
  function paint() {
    const r = route();
    root.dataset.mode = state.mode;
    root.dataset.detail = "false";
    q(".fg-detail").hidden = true;
    document.documentElement.lang = state.lang;
    q(".fg-walkbar .fg-sr").textContent = tr() ? "Rota" : "Route";
    q(".fg-utilities .fg-sr").textContent = tr() ? "Dil" : "Language";
    q(".fg-map").setAttribute(
      "aria-label",
      tr() ? "Rota haritası" : "Route map",
    );
    q("[data-language]").value = state.lang;
    q('[data-action="theme"]').setAttribute(
      "aria-label",
      tr() ? "Panel temasını değiştir" : "Change panel theme",
    );
    q('.fg-stop-list [data-action="close-list"]').setAttribute(
      "aria-label",
      tr() ? "Durak listesini kapat" : "Close stop list",
    );
    q('.fg-mode [data-action="explore"]').textContent = m("explore");
    q('.fg-mode [data-action="walk"]').textContent = m("walk");
    q('.fg-mode [data-action="explore"]').setAttribute(
      "aria-pressed",
      String(state.mode === "explore"),
    );
    q('.fg-mode [data-action="walk"]').setAttribute(
      "aria-pressed",
      String(state.mode === "walk"),
    );
    q("[data-route]").innerHTML = state.routes
      .map(
        (r) =>
          `<option value="${text(r.key)}" ${r.key === state.routeKey ? "selected" : ""}>${text(copy(r.copy, state.lang).title || r.key)}</option>`,
      )
      .join("");
    q('[data-action="list"]').textContent = m("stops");
    q('[data-action="fit"]').textContent = m("all");
    if (q('[data-action="locate"]'))
      q('[data-action="locate"]').textContent = m(
        watch === null ? "location" : "stopLocation",
      );
    q(".fg-intro .fg-kicker").textContent = tr()
      ? "EREN EDEBALİ’NİN VENEDİK REHBERİ"
      : "A VENICE FIELD GUIDE BY EREN EDEBALI";
    q(".fg-intro h1").textContent = tr()
      ? "Biraz yavaşla.\nBaşka bir Venedik gör."
      : "Slow down.\nSee Venice sideways.";
    q(".fg-intro p").textContent = tr()
      ? "İki yürüyüş. Sokaklar, su ve durup bakmaya değer ayrıntılar."
      : "Two walks through streets, water and details worth stopping for.";
    q('[data-action="choose"]').textContent = tr()
      ? "Rotayı keşfet ↓"
      : "Explore the routes ↓";
    q(".fg-cover").innerHTML =
      photoHTML(r?.presentation?.cover, "fg-cover-photo") ||
      `<div class="fg-cover-note"><span>45°26′ N · 12°20′ E</span><strong>${tr() ? "Şehri adım adım keşfet." : "Find the city, one stop at a time."}</strong><p>${tr() ? "Rota kapağı henüz eklenmedi." : "Route photograph not yet assigned."}</p></div>`;
    q(".fg-route-choices").innerHTML = state.routes
      .filter((r) => preview || ["main", "full"].includes(r.key))
      .map((r) => routeCard(r, state.lang))
      .join("");
    q(".fg-legend").innerHTML =
      `<span class="fg-walk-legend">${tr() ? "Yürüyüş" : "Walking"}</span>` +
      (r?.segments
        .filter((s) => s.type === "vaporetto")
        .flatMap(
          (s) =>
            s.officialLegs ||
            s.transitStops
              ?.filter((p) => p.lineTo)
              .map((p) => ({ line: p.lineTo })) ||
            [],
        )
        .map(
          (l) =>
            `<button style="--line:${color(l.line)}" data-transit="${text(r.segments.find((s) => s.type === "vaporetto").key)}">⛴ ACTV ${text(l.line)}</button>`,
        )
        .join("") || "");
    const v = current(),
      list = visits(),
      at = list.findIndex((x) => x.key === v?.key);
    q(".fg-stop-content").innerHTML = v
      ? stopCard(r, v, state.lang)
      : `<p>${m("empty")}</p>`;
    q(".fg-progress").textContent = v ? `${at + 1} / ${list.length}` : "";
    const upcoming =
      r?.segments.filter(
        (s) =>
          s.type === "vaporetto" &&
          s.order >
            (r.segments.find((s) => s.key === v?.segmentKey)?.order ?? -1) &&
          s.order <
            (r.segments.find((s) => s.key === list[at + 1]?.segmentKey)
              ?.order ?? -1),
      ) || [];
    q(".fg-step-actions").innerHTML = v
      ? `${at === 0 ? `<a class="fg-primary" href="https://www.google.com/maps/dir/?api=1&destination=${v.latitude},${v.longitude}&travelmode=walking" target="_blank" rel="noopener">${m("start")} ↗</a>` : ""}${upcoming.length ? `<button class="fg-primary" data-transit="${text(upcoming[0].key)}">⛴ ${m("transfer")}</button>` : ""}<div class="fg-step-row"><button data-action="previous" ${at < 1 ? "disabled" : ""} aria-label="${m("previous")}">←</button><button class="${at > 0 && !upcoming.length ? "fg-primary" : ""}" data-action="next" ${at >= list.length - 1 ? "disabled" : ""}>${at >= list.length - 1 ? m("end") : m("next")} →</button></div>`
      : "";
    q(".fg-stop-list h2").textContent = m("stops");
    q(".fg-stop-list ol").innerHTML = list
      .map(
        (v, i) =>
          `<li><button data-stop="${text(v.key)}" aria-current="${v.key === current()?.key}"><span>${i + 1}</span>${text(copy(v.copy, state.lang).title || v.key)}</button></li>`,
      )
      .join("");
    if (!mapReady && q('.fg-map-status [data-action="retry"]'))
      issue(m("unavailable"));
    paintMap();
    if (state.expanded) detail();
    requestAnimationFrame(() => {
      map?.resize();
      fallback?.invalidateSize({ pan: false });
    });
    network();
  }
  function network() {
    const n = q(".fg-network");
    n.hidden = navigator.onLine;
    n.textContent = m("offline");
  }
  function stopLocation() {
    generation++;
    clearTimeout(locationExpiry);
    clearTimeout(locationSession);
    if (watch !== null) navigator.geolocation.clearWatch(watch);
    watch = null;
    locationMarker?.remove();
    locationMarker = null;
    fallbackLocation?.remove();
    fallbackLocation = null;
    if (mapReady && map.getSource("fg-accuracy"))
      map
        .getSource("fg-accuracy")
        .setData({ type: "FeatureCollection", features: [] });
    if (q('[data-action="locate"]'))
      q('[data-action="locate"]').textContent = m("location");
  }
  function locate() {
    if (preview) return;
    if (watch !== null) {
      stopLocation();
      return;
    }
    if (!navigator.geolocation) {
      issue(m("denied"));
      return;
    }
    const g = ++generation;
    locationSession = setTimeout(stopLocation, 15 * 60 * 1000);
    q('[data-action="locate"]').textContent = m("stopLocation");
    watch = navigator.geolocation.watchPosition(
      (p) => {
        if (
          g !== generation ||
          document.hidden ||
          Date.now() - p.timestamp > 90000 ||
          (!mapReady && !fallback)
        )
          return;
        clearTimeout(locationExpiry);
        locationExpiry = setTimeout(stopLocation, 90000);
        const { latitude, longitude, accuracy } = p.coords;
        if (
          !Number.isFinite(latitude) ||
          !Number.isFinite(longitude) ||
          !Number.isFinite(accuracy)
        )
          return;
        if (fallback) {
          fallbackLocation?.remove();
          fallbackLocation = L.circle([latitude, longitude], {
            radius: accuracy,
            color: "#246bb4",
            fillOpacity: 0.12,
          }).addTo(fallback);
          q(".fg-map-status").hidden = false;
          q(".fg-map-status").textContent =
            m("locationOnly") + " ±" + Math.round(accuracy) + " m";
          return;
        }
        locationMarker ??= new maplibregl.Marker({ color: "#246bb4" })
          .setLngLat([longitude, latitude])
          .addTo(map);
        locationMarker.setLngLat([longitude, latitude]);
        const coords = Array.from({ length: 65 }, (_, i) => {
          const a = (i * Math.PI) / 32;
          return [
            longitude +
              (Math.cos(a) * accuracy) /
                (111320 * Math.cos((latitude * Math.PI) / 180)),
            latitude + (Math.sin(a) * accuracy) / 111320,
          ];
        });
        const data = {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: {},
              geometry: { type: "Polygon", coordinates: [coords] },
            },
          ],
        };
        if (!map.getSource("fg-accuracy")) {
          map.addSource("fg-accuracy", { type: "geojson", data });
          map.addLayer({
            id: "fg-accuracy",
            type: "fill",
            source: "fg-accuracy",
            paint: { "fill-color": "#246bb4", "fill-opacity": 0.12 },
          });
        } else map.getSource("fg-accuracy").setData(data);
        q(".fg-map-status").hidden = false;
        q(".fg-map-status").textContent =
          m("locationOnly") + " ±" + Math.round(accuracy) + " m";
      },
      () => {
        if (g !== generation) return;
        stopLocation();
        issue(m("denied"));
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
    );
  }
  const hide = () => {
    if (document.hidden) stopLocation();
  };
  document.addEventListener("visibilitychange", hide);
  addEventListener("pagehide", stopLocation);
  addEventListener("online", network);
  addEventListener("offline", network);
  root.addEventListener("change", (e) => {
    if (e.target.matches("[data-language]")) {
      state.lang = e.target.value;
      onLanguage(state.lang);
      paint();
    }
    if (e.target.matches("[data-route]")) choose(e.target.value);
  });
  function choose(key) {
    if (!state.routes.some((r) => r.key === key)) return;
    state.routeKey = key;
    state.stopKey = "";
    state.mode = "walk";
    state.expanded = false;
    onRoute(key);
    paint();
    fit();
  }
  root.addEventListener("click", (e) => {
    const b = e.target.closest("button,a");
    if (!b) return;
    if (b.dataset.start) {
      choose(b.dataset.start);
      return;
    }
    if (b.dataset.stop) {
      q(".fg-stop-list").hidden = true;
      selectStop(b.dataset.stop);
      return;
    }
    if (b.dataset.transit) {
      openTransit(b.dataset.transit);
      return;
    }
    switch (b.dataset.action) {
      case "explore":
        state.mode = "explore";
        state.expanded = false;
        paint();
        break;
      case "walk":
        state.mode = "walk";
        paint();
        break;
      case "choose":
        q(".fg-route-choices").scrollIntoView({
          behavior: reduced ? "instant" : "smooth",
          block: "start",
        });
        q(".fg-route-choices button")?.focus({ preventScroll: true });
        break;
      case "next":
      case "previous": {
        const list = visits(),
          i = list.findIndex((v) => v.key === current()?.key);
        selectStop(
          list[i + (b.dataset.action === "next" ? 1 : -1)]?.key ||
            current()?.key,
        );
        break;
      }
      case "detail":
        detail();
        break;
      case "back":
        state.expanded = false;
        root.dataset.detail = "false";
        q(".fg-detail").hidden = true;
        q('[data-action="detail"]')?.focus();
        map?.resize();
        fallback?.invalidateSize({ pan: false });
        break;
      case "list":
        q(".fg-stop-list").hidden = false;
        q(".fg-stop-list button").focus();
        break;
      case "close-list":
        q(".fg-stop-list").hidden = true;
        q('[data-action="list"]').focus();
        break;
      case "fit":
        fit();
        break;
      case "retry":
        resetMap();
        makeMap();
        break;
      case "theme":
        root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
        break;
      case "locate":
        locate();
        break;
      case "3d":
        if (!mapReady || !map.getLayer("fg-buildings")) {
          issue(
            tr()
              ? "3D şu anda yüklenemedi. 2D harita ve duraklar kullanılabilir."
              : "3D is unavailable. The 2D map and stops are still available.",
          );
          break;
        }
        threeD = !threeD;
        map.setLayoutProperty(
          "fg-buildings",
          "visibility",
          threeD ? "visible" : "none",
        );
        map.easeTo({
          pitch: threeD ? 50 : 0,
          zoom: threeD ? Math.max(15.4, map.getZoom()) : map.getZoom(),
          duration: reduced ? 0 : 250,
        });
        b.textContent = threeD ? "2D" : "3D";
        b.setAttribute("aria-pressed", String(threeD));
        break;
      case "edit":
        onEdit(current()?.key);
        break;
    }
  });
  const observer = new ResizeObserver(() => {
    map?.resize();
    fallback?.invalidateSize({ pan: false });
  });
  observer.observe(q(".fg-map"));
  paint();
  makeMap();
  return {
    update(next) {
      const old = state.routeKey,
        oldFocus = state.stopKey;
      state = { ...state, ...next };
      if (next.focusKey) {
        state.stopKey = next.focusKey;
        state.mode = "walk";
      }
      paint();
      if (old !== state.routeKey) fit();
      else if (next.focusKey && next.focusKey !== oldFocus) focus();
    },
    destroy() {
      destroyed = true;
      stopLocation();
      resetMap();
      observer.disconnect();
      document.removeEventListener("visibilitychange", hide);
      removeEventListener("pagehide", stopLocation);
      removeEventListener("online", network);
      removeEventListener("offline", network);
      root.replaceChildren();
    },
    getState() {
      return { ...state, mapReady };
    },
  };
}
