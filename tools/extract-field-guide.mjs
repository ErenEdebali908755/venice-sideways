/** Extracts reviewed, local source code only. Never fetches or runs visitor input. */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
const root = path.resolve(process.argv[2] || "../venice_side_ways");
const expected = "e0dccaa96018ac512183dfddebb6f4a84b54984e";
const commit = execFileSync("git", ["-C", root, "rev-parse", "HEAD"], {
  encoding: "utf8",
}).trim();
if (commit !== expected)
  throw Error(
    "Review extraction rules against the new public source commit before importing.",
  );
const files = {};
const read = (name) => {
  const s = fs.readFileSync(path.join(root, "public", name), "utf8");
  files[name] = createHash("sha256").update(s).digest("hex");
  return s;
};
const langs = ["en", "tr", "ru", "fr", "zh", "ja", "ko", "it"],
  ui = new Map(),
  stops = {},
  prompts = {};
function rows(raw, fn) {
  for (const l of raw.trim().split("\n")) {
    const [key, ...values] = l.split("|");
    if (l.trim()) fn(key, values);
  }
}
function parsePrompts(raw) {
  let key = "";
  const out = {};
  for (const line of raw.trim().split("\n")) {
    if (!line.trim()) continue;
    if (line.startsWith("[")) {
      key = line.slice(1, -1);
      out[key] = [];
    } else out[key].push(line.split("|"));
  }
  return out;
}
const ctx = vm.createContext({
  URLSearchParams,
  WalkI18n: {
    registerUI: (raw) => rows(raw, (k, v) => ui.set(k, [k, ...v])),
    registerTemplates: () => {},
    registerStops: (raw) => rows(raw, (k, v) => (stops[k] = v)),
    registerPrompts: (lang, raw) => (prompts[lang] = parsePrompts(raw)),
  },
});
vm.runInContext(
  'window=globalThis;window.WalkI18n=WalkI18n;stops=()=>[];mode="main";',
  ctx,
);
const base = read("walk-map-v5.js");
vm.runInContext(
  base.slice(0, base.indexOf("const el=id")) +
    ";globalThis.source={POINTS,ROUTES};",
  ctx,
);
for (const f of [
  "walk-i18n/v9/interface.js",
  "walk-i18n/v9/content.js",
  ...langs.slice(1).map((l) => `walk-i18n/v9/prompts-${l}.js`),
])
  vm.runInContext(read(f), ctx);
const phone = read("walk-map-phone-ideas-v8.js");
prompts.en = parsePrompts(phone.match(/const content = `([\s\S]*?)`;/)[1]);
// Same two reviewed corrections as runtime.registerPrompts in the pinned source.
read("walk-i18n/v9/runtime.js");
prompts.tr.lucia[4][0] = "Bir arkadaşının ilk izleniminden yola çık";
prompts.fr.stefano[3][2] =
  "Avec les bords architecturaux publics, donnez à la place l’impression d’un espace clos. Puis essayez un cadre qui la laisse respirer.";
const oldMain = read("walk-map-main-elena-v10.js");
vm.runInContext(
  oldMain.slice(0, oldMain.indexOf("  ROUTES.main.ids")) +
    "globalThis.bridgeAbout=bridgeAbout;})();",
  ctx,
);
for (const f of ["walk-v11/locale.js", "walk-v11/ideas.js", "walk-v12/copy.js"])
  vm.runInContext(read(f), ctx);
const app = read("walk-v12/app.js");
vm.runInContext(
  app.slice(0, app.indexOf("const baseStops")) +
    "globalThis.current={MAIN,BOARD,LAND,CHANGE};})();",
  ctx,
);
const { POINTS, ROUTES } = ctx.source,
  { BOARD, LAND, CHANGE } = ctx.current;
const c = (
  locale,
  title,
  text = "",
  theme = "",
  phoneTip = "",
  needsReview = false,
) => ({ locale, title, text, theme, phoneTip, needsReview });
const translate = (text, i) => ui.get(text)?.[i] || text;
const copies = (name, text) =>
  langs.map((l, i) =>
    c(
      l,
      translate(name, i),
      translate(text, i),
      "",
      "",
      i > 0 && !ui.has(text) && !!text,
    ),
  );
const places = Object.values(POINTS).map((p) => ({
  key: p.id,
  name: p.name,
  latitude: p.lat,
  longitude: p.lon,
  navigationQuery: p.query,
  sourceURL: p.source,
  copy: langs.map((l, i) =>
    c(l, p.name, i ? stops[p.id]?.[i - 1] || p.about : p.about),
  ),
}));
for (const p of [BOARD, CHANGE, LAND])
  places.push({
    key: p.id,
    name: p.name,
    latitude: p.lat,
    longitude: p.lon,
    navigationQuery: p.query,
    sourceURL: "https://actv.avmspa.it/en/node/10576",
    copy: copies(p.name, ""),
  });
function segment(key, order, type = "walking") {
  return {
    key,
    order,
    type,
    copy: copies(type === "walking" ? "Walking" : "Vaporetto", ""),
    geometry: [],
    waypoints: [],
    routingStatus: "stale",
    routingFingerprint: "",
    routingProvider: "legacy-not-captured",
    routingReviewed: false,
    distanceMeters: 0,
    durationMinutes: 0,
    waitingMinutes: 0,
    transitStops: [],
    timetableURL: "",
  };
}
function ideas(place) {
  return Array.from({ length: 5 }, (_, index) => ({
    key: `${place}-idea-${index + 1}`,
    order: index + 1,
    copy: langs.map((lang, i) => {
      const [title, theme, text, phone] = prompts[lang][place][index];
      const override =
        index === 4 &&
        ["majer", "ormesini", "accademia", "zattere"].includes(place)
          ? place + "4"
          : null;
      return c(
        lang,
        override ? ctx.WalkV11Ideas[override + ".title"][i] : title,
        override ? ctx.WalkV11Ideas[override + ".body"][i] : text,
        theme,
        override ? ctx.WalkV11Ideas[override + ".phone"][i] : phone,
      );
    }),
  }));
}
const routes = Object.entries(ROUTES).map(([key, r]) => {
  const route = {
    key,
    copy: copies(r.title, r.plan),
    defaultLanguage: "en",
    sunsetVisitKey: r.ids.includes("trearchi") ? "trearchi" : "",
    sunsetOffsetMinutes: -25,
    segments: [segment("walk-1", 0)],
    visits: [],
  };
  if (key === "main") {
    route.copy = langs.map((l, i) =>
      c(l, translate("Main Walk", i), ctx.WalkV11Copy.mainPlan[i]),
    );
    const boat = segment("boat", 1, "vaporetto");
    boat.durationMinutes = 70;
    boat.timetableURL = "https://actv.avmspa.it/en/node/10576";
    boat.copy = copies("Vaporetto", ctx.WalkV11Copy.transferInfo[0]);
    boat.transitStops = [
      { ...BOARD, lineFrom: "", lineTo: "1" },
      { ...CHANGE, lineFrom: "1", lineTo: "5.2" },
      { ...LAND, lineFrom: "5.2", lineTo: "" },
    ].map((p) => ({
      placeKey: p.id,
      name: p.name,
      latitude: p.lat,
      longitude: p.lon,
      lineFrom: p.lineFrom,
      lineTo: p.lineTo,
    }));
    route.segments.push(boat, segment("walk-2", 2));
    route.segments[0].waypoints = [
      { latitude: BOARD.lat, longitude: BOARD.lon },
    ];
    route.segments[2].waypoints = [{ latitude: LAND.lat, longitude: LAND.lon }];
  }
  route.visits = r.ids.map((id, i) => {
    const p = places.find((p) => p.key === id);
    const visit = {
      key: id,
      placeKey: id,
      segmentKey: key === "main" && i >= 9 ? "walk-2" : "walk-1",
      order: i,
      latitude: p.latitude,
      longitude: p.longitude,
      visible: true,
      isPhotoStop: true,
      pauseMinutes: 0,
      copy: structuredClone(p.copy),
      ideas: ideas(id),
    };
    if (key === "main" && id === "lucia") {
      visit.latitude = 45.44085;
      visit.longitude = 12.32145;
    }
    if (key === "main" && id === "accademia") {
      visit.latitude = 45.43166;
      visit.longitude = 12.32891;
      visit.copy = langs.map((l, i) =>
        c(l, "Ponte dell’Accademia", ctx.WalkV11Copy.bridgeAbout[i]),
      );
    }
    return visit;
  });
  return route;
});
if (
  routes.find((r) => r.key === "main").visits.length !== 11 ||
  routes.find((r) => r.key === "full").visits.length !== 28
)
  throw Error("Legacy route invariant changed.");
const seed = {
  schemaVersion: 1,
  source: { repository: "ErenEdebali908755/venice-sideways", commit, files },
  places,
  routes,
};
fs.mkdirSync("data/sideways", { recursive: true });
fs.writeFileSync(
  "data/sideways/legacy-seed.json",
  JSON.stringify(seed, null, 2) + "\n",
);
console.log(
  JSON.stringify({
    places: places.length,
    routes: routes.map((r) => ({
      key: r.key,
      visits: r.visits.length,
      ideas: r.visits.reduce((n, v) => n + v.ideas.length, 0),
    })),
  }),
);

