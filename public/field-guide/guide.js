/* Shared visitor presentation: public releases and private in-memory admin previews. */
const THEME_KEY = "sideways-field-guide-theme";
const THEME_LABELS = {
  en: ["Theme", "System", "Light", "Dark"],
  tr: ["Tema", "Sistem", "Açık", "Koyu"],
  it: ["Tema", "Sistema", "Chiaro", "Scuro"],
  fr: ["Thème", "Système", "Clair", "Sombre"],
  ru: ["Тема", "Система", "Светлая", "Тёмная"],
  zh: ["主题", "跟随系统", "浅色", "深色"],
  ja: ["テーマ", "システム", "ライト", "ダーク"],
  ko: ["테마", "시스템", "라이트", "다크"],
};
const PREFERENCE_LABELS = {
  en: ["Settings", "Language"],
  tr: ["Ayarlar", "Dil"],
  it: ["Impostazioni", "Lingua"],
  fr: ["Réglages", "Langue"],
  ru: ["Настройки", "Язык"],
  zh: ["设置", "语言"],
  ja: ["設定", "言語"],
  ko: ["설정", "언어"],
};
export const orderedVisits = (route) =>
  [...route.segments]
    .sort((a, b) => a.order - b.order)
    .flatMap((s) =>
      route.visits
        .filter((v) => v.visible && v.segmentKey === s.key)
        .sort((a, b) => a.order - b.order),
    );
export const copyFor = (rows, lang) =>
  rows?.find((c) => c.locale === lang) ||
  rows?.find((c) => c.locale === "en") ||
  {};
const escape = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const safeURL = (value) => {
  try {
    const u = new URL(value, location.origin);
    return ["https:", "http:"].includes(u.protocol) ? u.href : "";
  } catch {
    return "";
  }
};
const pointLink = (v) =>
  "https://www.google.com/maps/dir/?" +
  new URLSearchParams({
    api: "1",
    destination: `${v.latitude},${v.longitude}`,
    travelmode: "walking",
    avoid: "ferries",
  });
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
export class FieldGuide {
  constructor(
    root,
    {
      routes = [],
      lang = "en",
      preview = false,
      onEdit = () => {},
      water = null,
    } = {},
  ) {
    this.root = root;
    this.routes = routes;
    this.lang = lang;
    this.preview = preview;
    this.onEdit = onEdit;
    this.water = water;
    this.route = routes[0];
    this.view = "explore";
    this.index = 0;
    this.pins = [];
    this.map = null;
    this.ready = false;
    this.error = "";
    this.detail = false;
    this.list = false;
    this.started = false;
    this.threeD = false;
    this.watch = null;
    this.themePreference = "system";
    try {
      const stored = localStorage.getItem(THEME_KEY);
      if (["system", "light", "dark"].includes(stored))
        this.themePreference = stored;
    } catch {}
    this.systemTheme = matchMedia("(prefers-color-scheme: dark)");
    this.themeChange = () => this.applyTheme();
    this.systemTheme.addEventListener("change", this.themeChange);
    root.className = "fg";
    root.innerHTML =
      '<header class="fg-header"></header><div class="fg-body"><section class="fg-editorial"></section><section class="fg-map-shell" aria-label="Map"><div class="fg-map-tools"></div><div class="fg-map"></div><p class="fg-map-status" role="status"></p></section></div><dialog class="fg-dialog"></dialog>';
    this.el = (s) => root.querySelector(s);
    this.applyTheme();
    this.render();
    this.initMap();
    this.observer = new ResizeObserver(() => this.map?.resize());
    this.observer.observe(this.el(".fg-map-shell"));
    this.visibility = () => {
      if (document.hidden) this.stopLocation();
    };
    document.addEventListener("visibilitychange", this.visibility);
    this.online = () => this.renderStatus();
    addEventListener("online", this.online);
    addEventListener("offline", this.online);
  }
  t(en, tr) {
    return this.lang === "tr" ? tr : en;
  }
  applyTheme() {
    const dark =
      this.themePreference === "dark" ||
      (this.themePreference === "system" && this.systemTheme.matches);
    this.root.dataset.theme = dark ? "dark" : "light";
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
  }
  text(rows) {
    return copyFor(rows, this.lang);
  }
  title(route = this.route) {
    return this.text(route?.copy).title || route?.key || "";
  }
  photo(photo, kind = "stop") {
    const url = photo?.url ? safeURL(photo.url) : "";
    if (!url || new URL(url).pathname === "/field-guide/venice-illustration.png")
      return kind === "cover"
        ? `<div class="fg-cover-empty" role="img" aria-label="${this.t("Space reserved for a route photograph", "Rota fotoğrafı için ayrılmış boş alan")}"></div>`
        : `<div class="fg-photo-missing">${this.t("No verified photograph for this stop", "Bu durağın doğrulanmış fotoğrafı henüz yok")}</div>`;
    return `<figure class="fg-photo"><img src="${escape(url)}" alt="${escape(this.lang === "tr" ? photo.altTr || photo.alt : photo.alt)}" style="object-position:${Number(photo.x ?? 50)}% ${Number(photo.y ?? 50)}%" loading="lazy"><figcaption>${escape(photo.credit || "")}</figcaption></figure>`;
  }
  update({ routes, lang, visitKey, view } = {}) {
    const key = this.route?.key,
      selected = this.steps()[this.index]?.key;
    if (routes) this.routes = routes;
    if (lang) this.lang = lang;
    this.route = this.routes.find((r) => r.key === key) || this.routes[0];
    const wanted = visitKey ?? selected;
    this.index = Math.max(
      0,
      this.steps().findIndex((s) => s.key === wanted),
    );
    if (view) this.view = view;
    this.render();
    this.draw();
  }
  steps() {
    if (!this.route) return [];
    let n = 0;
    return [...this.route.segments]
      .sort((a, b) => a.order - b.order)
      .flatMap((s) =>
        s.type === "vaporetto"
          ? [{ ...s, boat: true }]
          : this.route.visits
              .filter((v) => v.visible && v.segmentKey === s.key)
              .sort((a, b) => a.order - b.order)
              .map((v) => ({ ...v, n: v.isPhotoStop ? ++n : null })),
      );
  }
  routeCard(r) {
    const visits = orderedVisits(r),
      walking = r.segments.filter((s) => s.type === "walking");
    const known =
      walking.length &&
      walking.every((s) => s.routingReviewed && s.distanceMeters > 0);
    return `<article class="fg-route-card">${r.photo?.url !== this.route?.photo?.url ? this.photo(r.photo, "cover") : ""}<div><span class="fg-kicker">${visits.filter((v) => v.isPhotoStop).length} ${this.t("stops", "durak")} · ${r.segments.some((s) => s.type === "vaporetto") ? this.t("Walk + vaporetto", "Yürüyüş + vaporetto") : this.t("On foot", "Yaya")}</span><h2>${escape(this.title(r))}</h2><p>${escape(this.text(r.copy).text?.split(/(?<=[.!?])\s/)[0] || "")}</p><dl><div><dt>${this.t("Start", "Başlangıç")}</dt><dd>${escape(this.text(visits[0]?.copy).title || "—")}</dd></div><div><dt>${this.t("Finish", "Bitiş")}</dt><dd>${escape(this.text(visits.at(-1)?.copy).title || "—")}</dd></div></dl><p class="fg-muted">${known ? new Intl.NumberFormat(this.lang, { maximumFractionDigits: 1 }).format(walking.reduce((sum, s) => sum + s.distanceMeters, 0) / 1000) + " km · " + this.t("walking distance; duration not verified", "yaya mesafesi; süre doğrulanmadı") : this.t("Distance and duration awaiting verification", "Mesafe ve süre doğrulanmayı bekliyor")}</p><button data-route="${escape(r.key)}" class="fg-primary">${this.t("Explore this walk", "Rotayı keşfet")} <span aria-hidden="true">↗</span></button></div></article>`;
  }
  render() {
    const t = (en, tr) => this.t(en, tr),
      step = this.steps()[this.index];
    this.root.dataset.view = this.view;
    this.root.lang = this.lang;
    this.el(".fg-map-shell").setAttribute(
      "aria-label",
      t("Route map", "Rota haritası"),
    );
    const [settingsName, languageName] =
      PREFERENCE_LABELS[this.lang] || PREFERENCE_LABELS.en;
    const [themeName, systemName, lightName, darkName] =
      THEME_LABELS[this.lang] || THEME_LABELS.en;
    const languages = ["en", "tr", "it", "fr", "ru", "zh", "ja", "ko"];
    const languageNames = ["English", "Türkçe", "Italiano", "Français", "Русский", "中文", "日本語", "한국어"];
    const languageSelect = `<select class="fg-language" aria-label="${escape(languageName)}">${languages.map((lang, i) => `<option value="${lang}" ${lang === this.lang ? "selected" : ""}>${languageNames[i]}</option>`).join("")}</select>`;
    const themeSelect = `<select class="fg-theme" aria-label="${escape(themeName)}">${[["system", systemName], ["light", lightName], ["dark", darkName]].map(([value, label]) => `<option value="${value}" ${value === this.themePreference ? "selected" : ""}>${escape(label)}</option>`).join("")}</select>`;
    const preferences = `<label class="fg-language-control"><span>${escape(languageName)}</span>${languageSelect}</label><label class="fg-theme-control"><span>${escape(themeName)}</span>${themeSelect}</label>`;
    this.el(".fg-header").innerHTML =
      `<button class="fg-brand" data-action="explore" aria-label="${t("Return to route selection", "Rota seçimine dön")}"><img class="fg-brand-mark" src="/field-guide/yana-mark.svg" alt="" aria-hidden="true"><span class="fg-brand-name"><i>Venice</i> <strong>Sideways</strong><small>${t("A photographic field guide", "Fotoğrafik bir kent rehberi")}</small></span></button><div class="fg-header-actions">${this.view === "walk" ? `<button class="fg-back" data-action="explore" aria-label="${t("Choose a walk", "Rota seç")}">←</button><select aria-label="${t("Change route", "Rotayı değiştir")}" class="fg-route-switch">${this.routes.map((r) => `<option value="${escape(r.key)}" ${r === this.route ? "selected" : ""}>${escape(this.title(r))}</option>`).join("")}</select>` : ""}<div class="fg-desktop-preferences">${preferences}</div><details class="fg-mobile-settings"><summary>${escape(settingsName)}</summary><div class="fg-settings-panel">${preferences}</div></details></div>`;
    const panel = this.el(".fg-editorial");
    if (!this.routes.length)
      panel.innerHTML = `<h1>${t("No walks available", "Henüz rota yok")}</h1><p>${t("Published walks will appear here.", "Yayımlanan rotalar burada görünecek.")}</p>`;
    else if (this.view === "explore")
      panel.innerHTML = `<div class="fg-intro">${this.photo(this.route?.photo, "cover")}<span class="fg-kicker">VENEZIA · ${t("ON FOOT, WITH CURIOSITY", "YÜRÜYEREK, MERAKLA")}</span><h1>${t("Look a little<br><i>sideways.</i>", "Biraz da<br><i>başka türlü bak.</i>")}</h1><p>${t("A reflection. A quiet square. The space between two places. Find your own photographs of Venice.", "Bir yansıma. Sakin bir meydan. İki yer arasındaki boşluk. Venedik’te kendi fotoğraflarını bul.")}</p><a class="fg-primary" href="#fg-walks">${t("Explore the walks", "Rotayı keşfet")} ↓</a></div><section id="fg-walks" aria-label="${t("Choose a walk", "Rota seç")}">${this.routes
        .filter((r) => this.preview || ["main", "full"].includes(r.key))
        .map((r) => this.routeCard(r))
        .join("")}</section>`;
    else if (this.list)
      panel.innerHTML = `<div class="fg-panel-head"><h2>${t("Your walk", "Yürüyüşün")}</h2><button data-action="close-list">${t("Back to map", "Haritaya dön")} ×</button></div><ol class="fg-stop-list">${this.steps()
        .map(
          (s, i) =>
            `<li><button data-step="${i}" aria-current="${i === this.index ? "step" : "false"}"><span>${s.boat ? "⛴" : s.n || "·"}</span>${escape(s.boat ? t("Vaporetto transfer", "Vaporetto aktarması") : this.text(s.copy).title)}</button></li>`,
        )
        .join("")}</ol>`;
    else if (!step)
      panel.innerHTML = `<h2>${t("No stops yet", "Henüz durak yok")}</h2>`;
    else if (step.boat) panel.innerHTML = this.transfer(step);
    else
      panel.innerHTML = `<div class="fg-panel-head"><span class="fg-kicker">${this.index === 0 ? t("START HERE", "BURADAN BAŞLA") : t("YOUR NEXT STOP", "SIRADAKİ DURAĞIN")} · ${step.n || "·"}</span><button data-action="list">${t("All stops", "Duraklar")} ≡</button></div>${this.photo(step.photo)}<div class="fg-stop-copy"><h1>${escape(this.text(step.copy).title || step.key)}</h1><p>${escape(this.text(step.copy).text?.split(/(?<=[.!?])\s/)[0] || "")}</p><button class="fg-text-link" data-action="detail">${t("Read the place & photo ideas", "Durak anlatısı ve fotoğraf fikirleri")} ↗</button>${this.preview ? `<button class="fg-text-link" data-action="edit">${t("Edit this stop", "Bu durağı düzenle")} ↗</button>` : ""}<div class="fg-walk-actions">${!this.started ? `<a class="fg-primary" href="${pointLink(step)}" target="_blank" rel="noopener">${t("Go to the start", "Başlangıca git")} ↗</a><button data-action="start">${t("I am here · start walking", "Buradayım · yürüyüşe başla")}</button>` : `<button class="fg-primary" data-action="next">${this.index === this.steps().length - 1 ? t("Finish walk", "Yürüyüşü bitir") : this.steps()[this.index + 1]?.boat ? t("Next · vaporetto transfer", "Sıradaki · vaporetto aktarması") : t("Next stop", "Sonraki durak")} →</button><a href="${pointLink(step)}" target="_blank" rel="noopener">${t("Directions to this stop", "Bu durağa yol tarifi")} ↗</a>`}</div><div class="fg-progress"><button data-action="previous" ${this.index === 0 ? "disabled" : ""}>← ${t("Previous", "Önceki")}</button><span>${this.index + 1} / ${this.steps().length}</span></div></div>`;
    this.el(".fg-map-tools").innerHTML =
      `<button data-action="fit">${t("Whole route", "Rotanın tamamı")}</button>${this.view === "walk" ? `<button data-action="focus">${t("Active stop", "Aktif durak")}</button>` : ""}<button data-action="dimension" aria-pressed="${this.threeD}" ${!this.ready ? "disabled" : ""}>${this.threeD ? "2D" : "3D"}</button>${!this.preview ? `<button data-action="location">${this.watch === null ? t("My location", "Konumum") : t("Stop location", "Konumu kapat")}</button>` : ""}`;
    this.root
      .querySelectorAll("[data-route]")
      .forEach((b) => (b.onclick = () => this.choose(b.dataset.route)));
    this.root.querySelectorAll("[data-step]").forEach(
      (b) =>
        (b.onclick = () => {
          this.index = Number(b.dataset.step);
          this.started = true;
          this.list = false;
          this.render();
          this.draw();
          this.focus();
        }),
    );
    this.root
      .querySelectorAll("[data-action]")
      .forEach((b) => (b.onclick = () => this.action(b.dataset.action)));
    this.root.querySelectorAll(".fg-language").forEach((select) => {
      select.onchange = (e) => {
        this.lang = e.target.value;
        this.render();
        this.draw();
      };
    });
    this.root.querySelectorAll(".fg-theme").forEach((select) => {
      select.onchange = (e) => {
        this.themePreference = e.target.value;
        this.root.querySelectorAll(".fg-theme").forEach((other) => {
          other.value = this.themePreference;
        });
        try {
          localStorage.setItem(THEME_KEY, this.themePreference);
        } catch {}
        this.applyTheme();
      };
    });
    const select = this.el(".fg-route-switch");
    if (select) select.onchange = (e) => this.choose(e.target.value);
    panel.querySelectorAll("img").forEach(
      (img) =>
        (img.onerror = () => {
          const p = document.createElement("p");
          p.className = "fg-photo-missing";
          p.textContent = t("Photograph unavailable", "Fotoğraf yüklenemedi");
          img.replaceWith(p);
        }),
    );
    this.renderStatus();
    requestAnimationFrame(() => this.map?.resize());
  }
  transfer(s) {
    const t = (en, tr) => this.t(en, tr),
      parts = s.transitStops || [],
      source = s.timetableURL || this.water?.timetable;
    return `<div class="fg-panel-head"><span class="fg-kicker">⛴ ${t("WALK → BOAT → WALK", "YAYA → TEKNE → YAYA")}</span><button data-action="list">${t("All stops", "Duraklar")} ≡</button></div><div class="fg-stop-copy"><h1>${t("Across the water.", "Su üzerinden devam.")}<br><i>${t("Then on foot.", "Sonra yeniden yaya.")}</i></h1><ol class="fg-transfer">${parts.map((p, i) => `<li><span>${i === 0 ? t("BOARD", "BİNİŞ") : i === parts.length - 1 ? t("LEAVE THE BOAT", "İNİŞ") : t("CHANGE", "AKTARMA")}</span><h2>${escape(p.name)}</h2><p>${p.lineTo ? "ACTV " + escape(p.lineTo) : t("Continue to the next photo stop on foot.", "Sıradaki fotoğraf durağına yürüyerek devam et.")}</p></li>`).join("")}</ol><p class="fg-muted">${t("Check the departure board and current service before boarding.", "Binmeden önce iskele panosunu ve güncel seferleri kontrol et.")}</p>${source ? `<a href="${escape(safeURL(source))}" target="_blank" rel="noopener">${t("ACTV · timetables & notices", "ACTV · seferler ve duyurular")} ↗</a>` : ""}<p class="fg-muted">${t("Geometry source", "Güzergâh kaynağı")}: ${escape(this.water?.source || "ACTV")} · ${escape(this.water?.retrievedAt || this.water?.downloadedAt || this.water?.checkedAt || t("Verification date unavailable", "Doğrulama tarihi yok"))}</p><button class="fg-primary" data-action="next">${t("Continue after the boat", "Tekneden sonra devam et")} →</button><button data-action="previous">← ${t("Previous stop", "Önceki durak")}</button></div>`;
  }
  choose(key) {
    this.route = this.routes.find((r) => r.key === key) || this.route;
    this.view = "walk";
    this.index = 0;
    this.started = false;
    this.list = false;
    this.render();
    this.draw();
    this.fit();
  }
  action(action) {
    if (action === "explore") {
      this.view = "explore";
      this.list = false;
      this.render();
      this.draw();
    }
    if (action === "list" || action === "close-list") {
      this.list = action === "list";
      this.render();
    }
    if (action === "fit") this.fit();
    if (action === "focus") this.focus();
    if (action === "start") {
      this.started = true;
      this.render();
      this.focus();
    }
    if (action === "next") {
      if (this.index < this.steps().length - 1) this.index++;
      else {
        this.view = "explore";
        this.started = false;
      }
      this.render();
      this.draw();
      this.focus();
    }
    if (action === "previous") {
      this.index = Math.max(0, this.index - 1);
      this.render();
      this.draw();
      this.focus();
    }
    if (action === "edit") this.onEdit(this.steps()[this.index]?.key);
    if (action === "detail") this.openDetail();
    if (action === "location") this.locate();
    if (action === "dimension" && this.ready) {
      this.threeD = !this.threeD;
      this.map.easeTo({
        pitch: this.threeD ? 50 : 0,
        duration: reduced() ? 0 : 220,
      });
      if (this.map.getLayer("fg-buildings"))
        this.map.setLayoutProperty(
          "fg-buildings",
          "visibility",
          this.threeD ? "visible" : "none",
        );
      this.render();
    }
  }
  openDetail() {
    const s = this.steps()[this.index],
      dialog = this.el(".fg-dialog"),
      t = (a, b) => this.t(a, b);
    dialog.innerHTML = `<button class="fg-close">← ${t("Back to map", "Haritaya dön")}</button><span class="fg-kicker">${escape(this.title())} · ${s.n || "·"}</span><h1>${escape(this.text(s.copy).title)}</h1>${this.photo(s.photo)}<p>${escape(this.text(s.copy).text)}</p><h2>${t("Five ways to look", "Bakmanın beş yolu")}</h2>${(
      s.ideas || []
    )
      .sort((a, b) => a.order - b.order)
      .map(
        (i) =>
          `<article><h3>${escape(this.text(i.copy).title)}</h3><p>${escape(this.text(i.copy).text)}</p><small>${escape(this.text(i.copy).phoneTip)}</small></article>`,
      )
      .join("")}`;
    dialog.querySelector("button").onclick = () => dialog.close();
    dialog.showModal();
  }
  renderStatus() {
    const message = !navigator.onLine
      ? this.t(
          "Offline · loaded stops remain available. Maps and directions need a connection.",
          "Çevrimdışı · yüklenen duraklar açık. Harita ve yol tarifi bağlantı gerektirir.",
        )
      : this.error ||
        (!this.ready
          ? this.t(
              "Loading the map… You can already browse the stops.",
              "Harita yükleniyor… Duraklara şimdiden bakabilirsin.",
            )
          : "");
    const status = this.el(".fg-map-status");
    status.textContent = message;
    status.hidden = !message;
    if (this.error) {
      const retry = document.createElement("button");
      retry.textContent = this.t("Retry map", "Haritayı yeniden dene");
      retry.onclick = () => this.initMap();
      status.append(retry);
    }
  }
  initMap() {
    if (!window.maplibregl) {
      this.error = this.t(
        "Map unavailable. Use the stop list and directions.",
        "Harita yüklenemedi. Durak listesini ve yol tarifini kullan.",
      );
      this.renderStatus();
      return;
    }
    this.stopLocation();
    this.map?.remove();
    this.pins = [];
    this.ready = false;
    this.error = "";
    try {
      this.map = new maplibregl.Map({
        container: this.el(".fg-map"),
        style: "https://tiles.openfreemap.org/styles/positron",
        center: [12.335, 45.438],
        zoom: 13.5,
        attributionControl: { compact: true },
      });
      this.map.on("error", () => {
        this.error = this.t(
          "Map could not fully load. Stops and directions remain available.",
          "Harita tam yüklenemedi. Duraklar ve yol tarifi kullanılabilir.",
        );
        this.renderStatus();
      });
      this.map.on("load", () => {
        this.ready = true;
        this.error = "";
        this.map.addSource("fg-route", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
        this.map.addLayer({
          id: "fg-halo",
          type: "line",
          source: "fg-route",
          paint: { "line-color": "#fff", "line-width": 8 },
        });
        this.map.addLayer({
          id: "fg-walk",
          type: "line",
          source: "fg-route",
          filter: ["==", ["get", "boat"], false],
          paint: { "line-color": "#831d4f", "line-width": 4 },
        });
        this.map.addLayer({
          id: "fg-boat",
          type: "line",
          source: "fg-route",
          filter: ["==", ["get", "boat"], true],
          paint: {
            "line-color": "#275c94",
            "line-width": 4,
            "line-dasharray": [2, 2],
          },
        });
        const building = this.map
          .getStyle()
          .layers.find((l) => l.id === "building");
        if (building?.source)
          this.map.addLayer({
            id: "fg-buildings",
            source: building.source,
            "source-layer": "building",
            type: "fill-extrusion",
            minzoom: 14,
            layout: { visibility: "none" },
            paint: {
              "fill-extrusion-color": "#d5c7b3",
              "fill-extrusion-height": [
                "coalesce",
                ["get", "render_height"],
                6,
              ],
              "fill-extrusion-opacity": 0.65,
            },
          });
        this.render();
        this.draw();
        this.fit();
      });
    } catch {
      this.error = this.t(
        "Map unavailable. Use the stop list.",
        "Harita yüklenemedi. Durak listesini kullan.",
      );
      this.renderStatus();
    }
  }
  draw() {
    if (!this.ready || !this.route) return;
    const features = this.route.segments.flatMap((s) => {
      let paths = [];
      if (s.type === "walking") {
        if (s.geometry?.length > 2) paths = [s.geometry];
      } else {
        const original = [
          [12.32871, 45.43164],
          [12.32206, 45.44026],
          [12.31985, 45.44613],
        ];
        const known =
          s.geometry.length <= 3 &&
          s.transitStops.length === 3 &&
          s.transitStops.every(
            (p, i) =>
              p.placeKey === ["board", "change", "land"][i] &&
              Math.abs(p.longitude - original[i][0]) < 0.00001 &&
              Math.abs(p.latitude - original[i][1]) < 0.00001,
          );
        if (known && this.water)
          paths = this.water.legs.map((l) => l.coordinates);
        else if (s.geometry.length > 3 && s.routingReviewed)
          paths = [s.geometry];
      }
      return paths.map((coordinates) => ({
        type: "Feature",
        properties: { boat: s.type === "vaporetto" },
        geometry: { type: "LineString", coordinates },
      }));
    });
    this.map
      .getSource("fg-route")
      ?.setData({ type: "FeatureCollection", features });
    this.pins.forEach((p) => p.remove());
    this.pins = [];
    if (this.view !== "walk") return;
    const step = this.steps()[this.index];
    if (!step) return;
    const points = step.boat ? step.transitStops : [step];
    points.forEach((point) => {
      if (!Number.isFinite(point.longitude) || !Number.isFinite(point.latitude))
        return;
      const anchor = document.createElement("div");
      anchor.className = "fg-pin-anchor";
      const pin = document.createElement("button");
      pin.className = "fg-pin selected" + (step.boat ? " fg-pin-boat" : "");
      pin.textContent = step.boat ? "⛴" : step.n || "·";
      pin.title = step.boat ? point.name : this.text(step.copy).title;
      pin.setAttribute("aria-label", `${pin.textContent} · ${pin.title}`);
      pin.onclick = () => this.focus();
      anchor.append(pin);
      const marker = new maplibregl.Marker({ element: anchor })
        .setLngLat([point.longitude, point.latitude])
        .addTo(this.map);
      anchor.removeAttribute("role");
      anchor.removeAttribute("tabindex");
      anchor.removeAttribute("aria-label");
      this.pins.push(marker);
    });
  }
  fit() {
    if (!this.ready || !this.route) return;
    const bounds = new maplibregl.LngLatBounds();
    let hasPoint = false;
    const extend = (longitude, latitude) => {
      if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return;
      bounds.extend([longitude, latitude]);
      hasPoint = true;
    };
    orderedVisits(this.route).forEach((v) => extend(v.longitude, v.latitude));
    this.route.segments.forEach((segment) => {
      segment.geometry?.forEach(([longitude, latitude]) =>
        extend(longitude, latitude),
      );
      segment.transitStops?.forEach((stop) =>
        extend(stop.longitude, stop.latitude),
      );
    });
    if (!hasPoint) return;
    this.map.fitBounds(bounds, {
      padding: 36,
      maxZoom: 16,
      duration: reduced() ? 0 : 250,
    });
  }
  focus() {
    if (!this.ready || this.view !== "walk") return;
    const s = this.steps()[this.index],
      p = s?.boat ? s.transitStops[0] : s;
    if (p)
      this.map.easeTo({
        center: [p.longitude, p.latitude],
        zoom: 16.5,
        duration: reduced() ? 0 : 220,
      });
  }
  locate() {
    if (this.preview) return;
    if (this.watch !== null) {
      this.stopLocation();
      this.render();
      return;
    }
    if (!navigator.geolocation || !this.ready) {
      this.error = this.t(
        "Location requires an available map. Browsing still works.",
        "Konum için haritanın yüklenmesi gerekiyor. Duraklara bakabilirsin.",
      );
      this.renderStatus();
      return;
    }
    if (
      !confirm(
        this.t(
          "Show your position only on this device? It is not sent to the organiser.",
          "Konumun yalnızca bu cihazda gösterilsin mi? Organizatöre gönderilmez.",
        ),
      )
    )
      return;
    this.watch = navigator.geolocation.watchPosition(
      (p) => {
        if (!this.locationPin)
          this.locationPin = new maplibregl.Marker({ color: "#275c94" }).addTo(
            this.map,
          );
        this.locationPin.setLngLat([p.coords.longitude, p.coords.latitude]);
      },
      () => {
        this.stopLocation();
        this.error = this.t(
          "Location unavailable. You can keep browsing.",
          "Konum alınamadı. Duraklara bakmaya devam edebilirsin.",
        );
        this.render();
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    );
    this.render();
  }
  stopLocation() {
    if (this.watch !== null) navigator.geolocation.clearWatch(this.watch);
    this.watch = null;
    this.locationPin?.remove();
    this.locationPin = null;
  }
  destroy() {
    this.stopLocation();
    this.observer.disconnect();
    this.map?.remove();
    document.removeEventListener("visibilitychange", this.visibility);
    this.systemTheme.removeEventListener("change", this.themeChange);
    removeEventListener("online", this.online);
    removeEventListener("offline", this.online);
  }
}
