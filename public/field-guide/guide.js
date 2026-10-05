/* Shared visitor presentation: public releases and private in-memory admin previews. */
import {
  BASE_STYLE,
  GARDENS,
  MAIN_LANDMARKS,
  addWatercolorLayers,
  placeCopy,
  setWatercolorLandmarks,
  watercolorStyle,
} from "./map-art.js?v=20261005-mobile";
import { uiCopy } from "./ui-copy.js?v=20261005-mobile";
import { galleryForVisit, galleryText, coverPhoto, imageVariant } from "./gallery.js?v=20261005-mobile";
import { LocationEngine, locationCapability, accuracyGeometry } from "./location-engine.js?v=20261005-mobile";
import { icon } from "./icons.js?v=20261005-mobile";
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
export const copyFor = (rows, lang, sourceLanguage = "en") => {
  const reviewed = rows?.filter((row) => row?.needsReview !== true) || [];
  return reviewed.find((row) => row.locale === lang) ||
    reviewed.find((row) => row.locale === "en") ||
    reviewed.find((row) => row.locale === sourceLanguage) ||
    {};
};
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
    return ["https:", "http:"].includes(u.protocol) && !u.username && !u.password ? u.href : "";
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
      events = [],
      publicLocation = false,
      localTestLocation = false,
      referencePhotos = [],
      bundledNotice = false,
    } = {},
  ) {
    this.root = root;
    this.routes = routes;
    this.lang = lang;
    this.preview = preview;
    this.publicLocation = publicLocation;
    this.localTestLocation = localTestLocation;
    this.referencePhotos = referencePhotos;
    this.bundledNotice = bundledNotice;
    this.onEdit = onEdit;
    this.water = water;
    this.events = events;
    this.route = routes[0];
    this.view = "explore";
    this.index = 0;
    this.pins = [];
    this.map = null;
    this.ready = false;
    this.mapError = "";
    this.locationStatus = "";
    this.detail = false;
    this.list = false;
    this.started = false;
    this.completed = false;
    this.sheet = "standard";
    this.threeD = false;
    this.inspectedVisit = null;
    this.selectedPhoto = null;
    this.modalMode = "";
    this.cameraMode = "free";
    this.locationState = "off";
    this.overlayID = `field-guide-${Math.random().toString(36).slice(2)}`;
    this.disposed = false;
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
    this.locationEngine = new LocationEngine({
      allowed: () => this.locationAllowed() && this.ready && this.mapVisible() && !document.hidden && !this.disposed,
      onState: state => { this.locationState = state; this.renderLocation(); },
      onFix: (fix, map) => this.paintLocation(fix, map),
      onClear: () => this.clearLocationPresentation(),
    });
    this.el(".fg-dialog").addEventListener("cancel", event => { event.preventDefault(); this.closeOverlay(); });
    this.dialogKeyboard = event => {
      if (event.key !== "Tab") return;
      const dialog = this.el(".fg-dialog");
      const controls = [...dialog.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex="-1"])')].filter(control => control.getClientRects().length);
      const first = controls[0], last = controls.at(-1);
      if (!first) { event.preventDefault(); dialog.focus(); return; }
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    };
    this.el(".fg-dialog").addEventListener("keydown", this.dialogKeyboard);
    this.popstate = event => this.restoreOverlay(event.state?.sidewaysOverlay);
    addEventListener("popstate", this.popstate);
    this.applyTheme();
    this.render();
    this.initMap();
    this.observer = new ResizeObserver(() => this.scheduleResize());
    this.observer.observe(this.el(".fg-map"));
    this.visibility = () => {
      if (document.hidden && this.locationEngine.active) this.stopLocation("suspended");
      else this.scheduleResize();
    };
    document.addEventListener("visibilitychange", this.visibility);
    this.online = () => this.renderStatus();
    addEventListener("online", this.online);
    addEventListener("offline", this.online);
    this.pagehide = () => { if (this.locationEngine.active) this.stopLocation("suspended"); };
    this.pageshow = () => this.scheduleResize();
    addEventListener("pagehide", this.pagehide);
    addEventListener("pageshow", this.pageshow);
    this.settingsOutside = event => {
      const settings = this.el(".fg-mobile-settings");
      if (settings?.open && !settings.contains(event.target)) settings.open = false;
    };
    document.addEventListener("pointerdown", this.settingsOutside);
  }
  t(en, tr) {
    return uiCopy(en, this.lang, tr);
  }
  applyTheme() {
    const dark =
      this.themePreference === "dark" ||
      (this.themePreference === "system" && this.systemTheme.matches);
    this.root.dataset.theme = dark ? "dark" : "light";
    const mark = this.el(".fg-brand-mark");
    if (mark) mark.src = `/field-guide/yana-mark-${dark ? "dark" : "light"}.svg`;
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
  }
  text(rows, route = this.route) {
    return copyFor(rows, this.lang, route?.sourceLanguage || "en");
  }
  title(route = this.route) {
    return this.text(route?.copy, route).title || route?.key || "";
  }
  photo(photo, kind = "stop") {
    const items = galleryForVisit({ photo });
    if (!items.length) return kind === "cover" ? "" : `<p class="fg-photo-missing">${this.t("No photographs at this stop yet.")}</p>`;
    return this.galleryImage(items[0], { cover: kind === "cover", eager: kind === "cover" });
  }
  galleryImage(photo, { cover = false, thumbnail = false, eager = false, full = false } = {}) {
    const selected = imageVariant(photo, thumbnail ? 400 : full ? 1600 : 900), url = safeURL(selected?.url);
    if (!url) return `<p class="fg-photo-missing">${this.t("Photograph unavailable")}</p>`;
    const copy = galleryText(photo, this.lang);
    const variants = (photo.derivatives || []).filter(item => item.width > 0 && safeURL(item.url));
    const source = variants.map(item => `${escape(safeURL(item.url))} ${item.width}w`).join(", ");
    const dimensions = selected.width > 0 && selected.height > 0 ? `width="${selected.width}" height="${selected.height}"` : "";
    const focal = photo.focalPoint || { x: 50, y: 50 };
    return `<figure class="fg-photo ${cover || thumbnail ? "fg-photo-cover" : "fg-photo-full"}"><img src="${escape(url)}" ${source ? `srcset="${source}" sizes="${thumbnail ? "80px" : full ? "95vw" : "(max-width: 900px) 92vw, 650px"}"` : ""} ${dimensions} alt="${escape(copy.alt || "")}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" style="object-position:${Math.max(0, Math.min(100, Number(focal.x) || 0))}% ${Math.max(0, Math.min(100, Number(focal.y) || 0))}%">${!thumbnail && (copy.caption || photo.credit) ? `<figcaption ${copy.locale ? `lang="${escape(copy.locale)}"` : ""}>${escape(copy.caption || "")}${copy.caption && photo.credit ? " · " : ""}${escape(photo.credit || "")}</figcaption>` : ""}</figure>`;
  }
  visitPhotos(visit) {
    const photos = galleryForVisit(visit);
    return photos.length ? photos : this.referencePhotos;
  }
  galleryLabel(visit) {
    const photos = this.visitPhotos(visit);
    return `${this.t(photos.some(photo => photo.referenceOnly) ? "Temporary photo selection" : "Photos at this stop")} · ${photos.length}`;
  }
  cover(visit) {
    const photo = coverPhoto(this.visitPhotos(visit));
    return photo ? this.galleryImage(photo, { cover: true }) : `<p class="fg-photo-missing">${this.t("No photographs at this stop yet.")}</p>`;
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
    this.refreshOverlay();
  }
  refreshOverlay() {
    if (this.modalMode === "places") this.renderPlaces();
    else if (this.modalMode === "place") this.renderPlace(this.placeKey);
    else if (this.modalMode) this.renderOverlay();
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
    return `<article class="fg-route-card">${r.photo?.url !== this.route?.photo?.url ? this.photo(r.photo, "cover") : ""}<div><span class="fg-kicker">${visits.filter((v) => v.isPhotoStop).length} ${this.t("stops", "durak")} · ${r.segments.some((s) => s.type === "vaporetto") ? this.t("Walk + vaporetto", "Yürüyüş + vaporetto") : this.t("On foot", "Yaya")}</span><h2>${escape(this.title(r))}</h2><p>${escape(this.text(r.copy, r).text?.split(/(?<=[.!?])\s/)[0] || "")}</p><dl><div><dt>${this.t("Start", "Başlangıç")}</dt><dd>${escape(this.text(visits[0]?.copy, r).title || "—")}</dd></div><div><dt>${this.t("Finish", "Bitiş")}</dt><dd>${escape(this.text(visits.at(-1)?.copy, r).title || "—")}</dd></div></dl><p class="fg-muted">${known ? new Intl.NumberFormat(this.lang, { maximumFractionDigits: 1 }).format(walking.reduce((sum, s) => sum + s.distanceMeters, 0) / 1000) + " km · " + this.t("walking distance; duration not verified", "yaya mesafesi; süre doğrulanmadı") : this.t("Distance and duration awaiting verification", "Mesafe ve süre doğrulanmayı bekliyor")}</p><button data-route="${escape(r.key)}" class="fg-primary">${this.t("Explore this walk", "Rotayı keşfet")} <span aria-hidden="true">↗</span></button></div></article>`;
  }
  render() {
    const t = (en, tr) => this.t(en, tr),
      step = this.steps()[this.index];
    const settingsOpen = !!this.el(".fg-mobile-settings")?.open;
    this.root.dataset.view = this.view;
    this.root.dataset.sheet = this.sheet;
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
      `<button class="fg-brand" data-action="explore" aria-label="${t("Return to route selection", "Rota seçimine dön")}"><img class="fg-brand-mark" src="/field-guide/yana-mark.svg" alt="" aria-hidden="true"><span class="fg-brand-name"><i>Venice</i> <strong>Sideways</strong></span></button><div class="fg-header-actions">${this.view === "walk" ? `<button class="fg-back" data-action="explore" aria-label="${t("Choose a walk", "Rota seç")}">${icon("back")}</button><select aria-label="${t("Change route", "Rotayı değiştir")}" class="fg-route-switch">${this.routes.map((r) => `<option value="${escape(r.key)}" ${r === this.route ? "selected" : ""}>${escape(this.title(r))}</option>`).join("")}</select>` : ""}<div class="fg-desktop-preferences">${preferences}</div><details class="fg-mobile-settings"><summary>${escape(settingsName)}</summary><div class="fg-settings-panel">${preferences}</div></details></div>`;
    const panel = this.el(".fg-editorial");
    if (!this.routes.length)
      panel.innerHTML = `<h1>${t("No walks available", "Henüz rota yok")}</h1><p>${t("Published walks will appear here.", "Yayımlanan rotalar burada görünecek.")}</p>`;
    else if (this.view === "explore")
      panel.innerHTML = `<div class="fg-intro">${this.route?.photo?.url ? this.photo(this.route.photo, "cover") : this.referencePhotos[0] ? this.galleryImage(this.referencePhotos[0], {cover:true,eager:true}) + `<p class="fg-reference-note">${this.t("Temporary photo selection")} · Eren Edebali</p>` : ""}<span class="fg-kicker">VENEZIA · ${t("ON FOOT, WITH CURIOSITY", "YÜRÜYEREK, MERAKLA")}</span><h1>${t("Look a little<br><i>sideways.</i>", "Biraz da<br><i>başka türlü bak.</i>")}</h1><p>${t("A reflection. A quiet square. The space between two places. Find your own photographs of Venice.", "Bir yansıma. Sakin bir meydan. İki yer arasındaki boşluk. Venedik’te kendi fotoğraflarını bul.")}</p><a class="fg-primary" href="#fg-walks">${t("Explore the walks", "Rotayı keşfet")} ↓</a></div><section id="fg-walks" aria-label="${t("Choose a walk", "Rota seç")}">${this.routes
        .filter((r) => this.preview || ["main", "full"].includes(r.key))
        .map((r) => this.routeCard(r))
        .join("")}</section>`;
    else if (this.completed)
      panel.innerHTML = `<div class="fg-stop-copy fg-completion"><span class="fg-kicker">${escape(this.title())} · ${this.index + 1} / ${this.steps().length}</span><h1>${t("Walk completed")}</h1><p>${t("You have manually completed the final step.")}</p><p>${escape(this.text(step.copy).title || step.key)}</p><div class="fg-walk-actions"><button class="fg-primary" data-action="explore">${t("Return to walks")} →</button><button data-inspect="${escape(step.key)}">${t("Inspect the final stop")}</button><button data-action="list">${t("All stops")}</button></div></div>`;
    else if (this.list)
      panel.innerHTML = `<div class="fg-panel-head"><h2>${t("Your walk", "Yürüyüşün")}</h2><button data-action="close-list">${t("Back to map", "Haritaya dön")} ×</button></div><ol class="fg-stop-list">${this.steps()
        .map(
          (s, i) =>
            `<li><button data-step="${i}" aria-current="${i === this.index ? "step" : "false"}"><span>${s.boat ? "⛴" : s.n || "·"}</span>${escape(s.boat ? t("Vaporetto transfer", "Vaporetto aktarması") : this.text(s.copy).title)}</button>${s.boat ? "" : `<button class="fg-list-gallery" data-inspect="${escape(s.key)}">${escape(this.galleryLabel(s))} ↗</button>`}</li>`,
        )
        .join("")}</ol>`;
    else if (!step)
      panel.innerHTML = `<h2>${t("No stops yet", "Henüz durak yok")}</h2>`;
    else if (step.boat) panel.innerHTML = this.transfer(step);
    else
      panel.innerHTML = `<div class="fg-panel-head"><span class="fg-kicker">${this.index === 0 ? t("START HERE", "BURADAN BAŞLA") : t("YOUR NEXT STOP", "SIRADAKİ DURAĞIN")} · ${step.n || "·"}</span><button data-action="list">${t("All stops", "Duraklar")} ≡</button></div>${this.cover(step)}<div class="fg-stop-copy"><h1>${escape(this.text(step.copy).title || step.key)}</h1><p>${escape(this.text(step.copy).text?.split(/(?<=[.!?])\s/)[0] || "")}</p><button class="fg-text-link" data-action="detail">${t("Read the place & photo ideas", "Durak anlatısı ve fotoğraf fikirleri")} ↗</button><button class="fg-text-link fg-gallery-link" data-inspect="${escape(step.key)}">${escape(this.galleryLabel(step))} ↗</button>${this.preview ? `<button class="fg-text-link" data-action="edit">${t("Edit this stop", "Bu durağı düzenle")} ↗</button>` : ""}<div class="fg-walk-actions">${!this.started ? `<a class="fg-primary" href="${pointLink(step)}" target="_blank" rel="noopener">${t("Go to the start", "Başlangıca git")} ↗</a><button data-action="start">${t("I am here · start walking", "Buradayım · yürüyüşe başla")}</button>` : `<button class="fg-primary" data-action="next">${this.index === this.steps().length - 1 ? t("Finish walk", "Yürüyüşü bitir") : this.steps()[this.index + 1]?.boat ? t("Next · vaporetto transfer", "Sıradaki · vaporetto aktarması") : t("Next stop", "Sonraki durak")} →</button><a href="${pointLink(step)}" target="_blank" rel="noopener">${t("Directions to this stop", "Bu durağa yol tarifi")} ↗</a>`}</div><div class="fg-progress"><button data-action="previous" ${this.index === 0 ? "disabled" : ""}>← ${t("Previous", "Önceki")}</button><span>${this.index + 1} / ${this.steps().length}</span></div></div>`;
    if (this.view === "walk") {
      const controls = document.createElement("div"); controls.className = "fg-sheet-controls";
      controls.innerHTML = `<span role="status">${t({collapsed:"Compact panel",standard:"Standard panel",expanded:"Expanded panel"}[this.sheet])}</span>${[["collapsed", "Collapse stop panel", "⌄"], ["standard", "Standard stop panel", "↔"], ["expanded", "Expand stop panel", "⌃"]].map(([state,label,symbol]) => `<button data-sheet="${state}" aria-label="${escape(t(label))}" aria-pressed="${state === this.sheet}" aria-controls="fg-sheet-content">${symbol}</button>`).join("")}`;
      const content = document.createElement("div"); content.className = "fg-sheet-content"; content.id = "fg-sheet-content";
      while (panel.firstChild) content.append(panel.firstChild);
      panel.append(controls, content);
      if (!this.list && !this.completed && step && !step.boat) {
        const story = document.createElement("section"); story.className = "fg-sheet-story";
        story.innerHTML = this.story(step); content.append(story);
      }
      controls.querySelectorAll("[data-sheet]").forEach(button => { button.onclick = () => this.setSheet(button.dataset.sheet); });
    }
    if (this.bundledNotice) {
      const notice = document.createElement("p"); notice.className = "fg-bundled-notice";
      notice.textContent = t("Bundled guide · the latest published update could not be checked."); panel.prepend(notice);
    }
    if (!this.preview) {
      const labels = {en:"Join the event",tr:"Etkinliğe katıl",it:"Partecipa all'evento",fr:"Participer à l'événement",ru:"Участвовать в событии",zh:"参加活动",ja:"イベントに参加",ko:"행사 참가"};
      for (const event of this.events) {
        if (!/^[a-z][a-z0-9-]{0,79}$/.test(event.slug)) continue;
        const target = this.view === "explore"
          ? [...panel.querySelectorAll(".fg-route-card")].find(card => card.querySelector("[data-route]")?.dataset.route === event.routeKey)?.querySelector("div")
          : event.routeKey === this.route?.key ? panel.querySelector(".fg-stop-copy") : null;
        if (!target) continue;
        const link = document.createElement("a");
        link.className = "fg-event-link";
        link.href = `/events/${event.slug}?lang=${encodeURIComponent(this.lang)}`;
        link.textContent = `${labels[this.lang] || labels.en} · ${event.eventDate} ↗`;
        target.append(link);
      }
    }
    this.el(".fg-map-tools").innerHTML =
      `<details class="fg-map-options"><summary>${t("Route map")}</summary><div class="fg-map-option-actions"><button data-action="fit">${t("Whole route", "Rotanın tamamı")}</button>${this.view === "walk" ? `<button data-action="focus">${t("Active stop", "Aktif durak")}</button>` : ""}<button data-action="places">${t("Places on the map", "Haritadaki yerler")}</button><button data-action="dimension" aria-pressed="${this.threeD}" ${!this.ready ? "disabled" : ""}>${this.threeD ? "2D" : "3D"}</button></div></details><div class="fg-location-controls"></div>`;
    if (matchMedia("(min-width: 901px)").matches) this.el(".fg-map-options").open = true;
    this.locationControlsSignature = "";
    this.renderLocation();
    this.root.querySelectorAll("[data-inspect]").forEach(button => { button.onclick = () => this.openDetail(button.dataset.inspect, button); });
    this.root
      .querySelectorAll("[data-route]")
      .forEach((b) => (b.onclick = () => this.choose(b.dataset.route)));
    this.root.querySelectorAll("[data-step]").forEach(
      (b) =>
        (b.onclick = () => {
          this.index = Number(b.dataset.step);
          this.started = true;
          this.completed = false;
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
        const mobileSettings = !!select.closest(".fg-mobile-settings");
        this.lang = e.target.value;
        try { localStorage.setItem("sideways-language", this.lang); } catch {}
        this.render();
        this.draw();
        this.refreshOverlay();
        if (mobileSettings) this.el(".fg-mobile-settings .fg-language")?.focus({ preventScroll: true });
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
    const settings = this.el(".fg-mobile-settings");
    settings.open = settingsOpen;
    const closeSettings = document.createElement("button"); closeSettings.className = "fg-settings-close";
    closeSettings.textContent = t("Close settings"); closeSettings.onclick = () => { settings.open = false; settings.querySelector("summary").focus(); };
    settings.querySelector(".fg-settings-panel").append(closeSettings);
    settings.addEventListener("keydown", event => { if (event.key === "Escape" && settings.open) { event.preventDefault(); settings.open = false; settings.querySelector("summary").focus(); } });
    this.bindPhotoErrors(panel);
    this.applyTheme();
    this.renderStatus();
    this.scheduleResize();
  }
  story(visit) {
    return `<p>${escape(this.text(visit.copy).text)}</p><h2>${this.t("Five ways to look")}</h2>${[...(visit.ideas || [])].sort((a, b) => a.order - b.order).map(idea => `<article><h3>${escape(this.text(idea.copy).title)}</h3><p>${escape(this.text(idea.copy).text)}</p><small>${escape(this.text(idea.copy).phoneTip)}</small></article>`).join("")}`;
  }
  setSheet(state) {
    if (!["collapsed", "standard", "expanded"].includes(state)) return;
    this.sheet = state; this.root.dataset.sheet = state;
    const controls = this.el(".fg-sheet-controls");
    controls?.querySelectorAll("[data-sheet]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.sheet === state)));
    const label = controls?.querySelector('[role="status"]');
    if (label) label.textContent = this.t({collapsed:"Compact panel",standard:"Standard panel",expanded:"Expanded panel"}[state]);
    if (!this.mapVisible() && this.locationEngine.active) this.stopLocation("suspended");
    this.scheduleResize();
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
    this.completed = false;
    this.sheet = "standard";
    this.list = false;
    this.render();
    this.draw();
    this.fit();
  }
  action(action) {
    if (action === "explore") {
      this.view = "explore";
      this.list = false;
      this.completed = false;
      this.render();
      this.draw();
    }
    if (action === "list" || action === "close-list") {
      this.list = action === "list";
      if (this.list) this.completed = false;
      else this.sheet = "standard";
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
        this.completed = true;
        this.sheet = "standard";
      }
      this.render();
      this.draw();
      this.focus();
    }
    if (action === "previous") {
      this.completed = false;
      this.index = Math.max(0, this.index - 1);
      this.render();
      this.draw();
      this.focus();
    }
    if (action === "edit") this.onEdit(this.steps()[this.index]?.key);
    if (action === "detail") this.openDetail();
    if (action === "places") this.openPlaces();
    if (action === "location") this.locate();
    if (action === "location-off") this.stopLocation();
    if (action === "location-return") this.returnToLocation();
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
      for (const id of ["fg-landmark-overview", "fg-landmark-detail"])
        if (this.map.getLayer(id))
          this.map.setLayoutProperty(id, "visibility", this.threeD ? "none" : "visible");
      this.render();
    }
  }
  cameraSnapshot() {
    if (!this.ready) return null;
    const center = this.map.getCenter();
    return { center: [center.lng, center.lat], zoom: this.map.getZoom(), bearing: this.map.getBearing(), pitch: this.map.getPitch() };
  }
  overlayState(mode = this.modalMode) {
    return { id: this.overlayID, mode, routeKey: this.route.key, visitKey: this.inspectedVisit, photoID: this.selectedPhoto };
  }
  pushOverlay(mode) {
    history.pushState({ ...history.state, sidewaysOverlay: this.overlayState(mode) }, "");
  }
  beginOverlay(opener = document.activeElement) {
    if (!this.modalMode) { this.map?.stop(); this.savedCamera = this.cameraSnapshot(); this.overlayOpener = opener; this.overlayFocusKey = opener?.dataset.inspect || opener?.dataset.visitKey; }
    this.cameraMode = "free";
    this.cameraTouched = true;
  }
  openDetail(key = this.steps()[this.index]?.key, opener = document.activeElement) {
    const visit = this.steps().find(item => !item.boat && item.key === key);
    if (!visit) return;
    const wasOpen = !!this.modalMode;
    this.beginOverlay(opener);
    this.inspectedVisit = visit.key;
    this.selectedPhoto = coverPhoto(this.visitPhotos(visit))?.assetID || null;
    this.modalMode = "detail";
    if (!wasOpen) this.pushOverlay("detail");
    else history.replaceState({ ...history.state, sidewaysOverlay: this.overlayState("detail") }, "");
    this.renderOverlay();
  }
  openLightbox() {
    if (this.modalMode !== "detail" || !this.selectedPhoto) return;
    this.modalMode = "lightbox"; this.photoZoom = false;
    this.pushOverlay("lightbox"); this.renderOverlay();
  }
  closeOverlay() {
    if (history.state?.sidewaysOverlay?.id === this.overlayID) history.back();
    else this.restoreOverlay(null);
  }
  restoreOverlay(state) {
    if (state?.id === this.overlayID && state.routeKey === this.route?.key && ["detail", "lightbox", "places", "place"].includes(state.mode)) {
      this.modalMode = state.mode; this.inspectedVisit = state.visitKey; this.selectedPhoto = state.photoID;
      this.photoZoom = false;
      if (state.mode === "places") this.renderPlaces();
      else if (state.mode === "place") this.renderPlace(this.placeKey);
      else this.renderOverlay();
      return;
    }
    this.modalMode = ""; this.inspectedVisit = null; this.selectedPhoto = null;
    const dialog = this.el(".fg-dialog");
    if (dialog.open) dialog.close();
    dialog.classList.remove("fg-lightbox", "fg-photo-zoomed");
    this.cameraMode = "free";
    if (this.ready && this.savedCamera) this.map.jumpTo(this.savedCamera);
    this.savedCamera = null;
    const matching = [...this.root.querySelectorAll('[data-inspect],[data-visit-key]')].find(control => control.dataset.inspect === this.overlayFocusKey || control.dataset.visitKey === this.overlayFocusKey);
    const opener = this.overlayOpener?.isConnected ? this.overlayOpener : matching || this.root.querySelector('[data-action="detail"]') || this.root.querySelector('[data-action="focus"]');
    opener?.focus({ preventScroll: true }); this.overlayOpener = null; this.overlayFocusKey = null;
  }
  showDialog(dialog) {
    if (dialog.open) return;
    dialog.showModal();
    // A fresh opening starts at its heading; photo/history rerenders stay put.
    dialog.scrollTop = 0;
  }
  renderOverlay() {
    const visit = this.steps().find(item => item.key === this.inspectedVisit && !item.boat);
    if (!visit) { this.restoreOverlay(null); return; }
    const photos = this.visitPhotos(visit);
    const photo = photos.find(item => item.assetID === this.selectedPhoto) || coverPhoto(photos);
    this.selectedPhoto = photo?.assetID || null;
    const index = photos.indexOf(photo), dialog = this.el(".fg-dialog"), lightbox = this.modalMode === "lightbox";
    const t = value => this.t(value);
    const temporary = photos.some(item => item.referenceOnly);
    dialog.classList.toggle("fg-lightbox", lightbox);
    dialog.classList.toggle("fg-photo-zoomed", lightbox && !!this.photoZoom);
    dialog.setAttribute("aria-labelledby", "fg-dialog-title");
    const gallery = photo ? `<section class="fg-gallery" aria-label="${escape(this.galleryLabel(visit))}"><div class="fg-gallery-stage"><button class="fg-open-photo" data-open-photo aria-label="${escape(t("Open full photograph"))}">${this.galleryImage(photo, { full: lightbox })}</button></div><div class="fg-gallery-controls"><button data-photo-previous aria-label="${escape(t("Previous photograph"))}" ${photos.length < 2 ? "disabled" : ""}>${icon("previous")}</button><span role="status">${t("Photograph")} ${index + 1} / ${photos.length}</span><button data-photo-next aria-label="${escape(t("Next photograph"))}" ${photos.length < 2 ? "disabled" : ""}>${icon("next")}</button>${lightbox ? `<button data-photo-zoom aria-pressed="${!!this.photoZoom}">${icon(this.photoZoom ? "zoom-out" : "zoom-in")} ${escape(t(this.photoZoom ? "Reset photograph zoom" : "Zoom photograph"))}</button>` : ""}</div><div class="fg-thumbnails">${photos.map((item, number) => `<button data-photo-id="${escape(item.assetID)}" aria-pressed="${item === photo}" aria-label="${escape(t("Select photograph"))} ${number + 1}">${this.galleryImage(item, { thumbnail: true })}</button>`).join("")}</div></section>` : `<p class="fg-photo-missing">${t("No photographs at this stop yet.")}</p>`;
    const editorial = lightbox ? "" : this.story(visit);
    dialog.innerHTML = `<button class="fg-close">${icon("back")} ${t(lightbox ? "Back to stop" : "Back to map")}</button><span class="fg-kicker">${escape(this.title())} · ${t("Stop")} ${visit.n || "·"} / ${this.steps().filter(step => step.isPhotoStop).length}</span><h1 id="fg-dialog-title">${escape(this.text(visit.copy).title)}</h1>${temporary ? `<p class="fg-reference-note">${t("Temporary photographs by Eren Edebali; their connection to this stop has not been verified.")}</p>` : ""}${gallery}${editorial}`;
    dialog.querySelector(".fg-close").onclick = () => this.closeOverlay();
    dialog.querySelector("[data-open-photo]")?.addEventListener("click", () => { if (performance.now() < (this.ignorePhotoClickUntil || 0)) return; lightbox ? this.togglePhotoZoom() : this.openLightbox(); });
    dialog.querySelector("[data-photo-zoom]")?.addEventListener("click", () => this.togglePhotoZoom());
    dialog.querySelector("[data-photo-previous]")?.addEventListener("click", () => this.selectPhoto(-1));
    dialog.querySelector("[data-photo-next]")?.addEventListener("click", () => this.selectPhoto(1));
    dialog.querySelectorAll("[data-photo-id]").forEach(button => { button.onclick = () => this.selectPhoto(button.dataset.photoId); });
    dialog.onkeydown = event => {
      if (event.target.matches("input,select,textarea")) return;
      if (!this.photoZoom && (event.key === "ArrowLeft" || event.key === "ArrowRight")) { event.preventDefault(); this.selectPhoto(event.key === "ArrowLeft" ? -1 : 1); }
    };
    let touch;
    const stage = dialog.querySelector(".fg-gallery-stage");
    stage?.addEventListener("touchstart", event => { if (event.touches.length === 1 && !this.photoZoom) touch = [event.touches[0].clientX, event.touches[0].clientY]; }, { passive: true });
    stage?.addEventListener("touchend", event => {
      if (!touch || !event.changedTouches.length || this.photoZoom) return;
      const deltaX = event.changedTouches[0].clientX - touch[0], deltaY = event.changedTouches[0].clientY - touch[1]; touch = null;
      if (Math.abs(deltaX) > 55 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) { this.ignorePhotoClickUntil = performance.now() + 400; this.selectPhoto(deltaX > 0 ? -1 : 1); }
    }, { passive: true });
    this.bindPhotoErrors(dialog);
    this.showDialog(dialog);
    dialog.querySelector(".fg-close").focus({ preventScroll: true });
  }
  togglePhotoZoom() {
    if (this.modalMode !== "lightbox") return;
    this.photoZoom = !this.photoZoom;
    this.el(".fg-dialog").classList.toggle("fg-photo-zoomed", this.photoZoom);
    const button = this.el("[data-photo-zoom]");
    button?.setAttribute("aria-pressed", String(this.photoZoom));
    if (button) button.innerHTML = icon(this.photoZoom ? "zoom-out" : "zoom-in") + " " + escape(this.t(this.photoZoom ? "Reset photograph zoom" : "Zoom photograph"));
  }
  selectPhoto(selection) {
    const visit = this.steps().find(item => item.key === this.inspectedVisit), photos = this.visitPhotos(visit);
    if (!photos.length) return;
    const current = Math.max(0, photos.findIndex(item => item.assetID === this.selectedPhoto));
    const next = typeof selection === "number" ? photos[(current + selection + photos.length) % photos.length] : photos.find(item => item.assetID === selection);
    if (!next) return;
    const focused = document.activeElement?.dataset.photoId;
    const direction = document.activeElement?.hasAttribute("data-photo-next") ? "[data-photo-next]" : document.activeElement?.hasAttribute("data-photo-previous") ? "[data-photo-previous]" : "";
    this.selectedPhoto = next.assetID; this.photoZoom = false;
    this.el(".fg-dialog").classList.remove("fg-photo-zoomed");
    history.replaceState({ ...history.state, sidewaysOverlay: this.overlayState() }, "");
    this.renderOverlay();
    (direction ? this.el(direction) : focused ? [...this.root.querySelectorAll("[data-photo-id]")].find(button => button.dataset.photoId === next.assetID) : null)?.focus({ preventScroll: true });
  }
  bindPhotoErrors(container) {
    container.querySelectorAll("img").forEach(image => { image.onerror = () => {
      if (!image.closest(".fg-photo")) return;
      if (image.closest("[data-photo-id]")) { const message = document.createElement("span"); message.className = "fg-photo-missing"; message.textContent = this.t("Photograph unavailable"); image.replaceWith(message); return; }
      const error = document.createElement("div"); error.className = "fg-photo-error";
      const message = document.createElement("p"); message.className = "fg-photo-missing"; message.setAttribute("role", "status"); message.textContent = this.t("Photograph unavailable");
      const retry = document.createElement("button"); retry.textContent = this.t("Retry photograph");
      error.append(message, retry);
      const openButton = image.closest("[data-open-photo]");
      // Retry the same approved derivative. Never fall back to an original or another visit.
      const target = openButton || image;
      target.replaceWith(error);
      retry.onclick = () => {
        error.replaceWith(target);
        image.src = image.getAttribute("src");
        const onLoad = () => { image.removeEventListener("load", onLoad); (openButton || image.closest("[data-photo-id]") || container.querySelector(".fg-close"))?.focus({ preventScroll: true }); };
        image.addEventListener("load", onLoad, { once: true });
      };
    }; });
  }
  openPlaces() {
    const wasOpen = !!this.modalMode;
    this.beginOverlay(); this.modalMode = "places";
    if (!wasOpen) this.pushOverlay("places");
    else history.replaceState({ ...history.state, sidewaysOverlay: this.overlayState("places") }, "");
    this.renderPlaces();
  }
  renderPlaces() {
    const t = (en, tr) => this.t(en, tr);
    const dialog = this.el(".fg-dialog");
    dialog.classList.remove("fg-lightbox", "fg-photo-zoomed");
    dialog.onkeydown = null;
    dialog.setAttribute("aria-labelledby", "fg-dialog-title");
    const keys = this.route?.key === "main"
      ? [...MAIN_LANDMARKS.map((place) => place.key), ...GARDENS.map((place) => place.key)]
      : GARDENS.map((place) => place.key);
    dialog.innerHTML = `<button class="fg-close">← ${t("Back to map", "Haritaya dön")}</button><span class="fg-kicker">${t("VENICE SIDEWAYS · MAP NOTES", "VENICE SIDEWAYS · HARİTA NOTLARI")}</span><h1 id="fg-dialog-title">${t("Places on the map", "Haritadaki yerler")}</h1><p class="fg-muted">${t("Small original drawings mark places to notice. They are not extra walk stops.", "Küçük özgün çizimler dikkat edilecek yerleri gösterir; ek yürüyüş durağı değildir.")}</p><div class="fg-place-list">${keys.map((key) => `<button data-place="${key}">${escape(placeCopy(key, this.lang)?.name || key)} →</button>`).join("")}</div>`;
    dialog.querySelector(".fg-close").onclick = () => this.closeOverlay();
    dialog.querySelectorAll("[data-place]").forEach((button) => {
      button.onclick = () => this.openPlace(button.dataset.place);
    });
    this.showDialog(dialog);
  }
  openPlace(key) {
    if (this.route?.visits.some(visit => visit.key === key)) { this.openDetail(key); return; }
    const wasOpen = !!this.modalMode;
    this.beginOverlay(); this.placeKey = key; this.modalMode = "place";
    if (!wasOpen) this.pushOverlay("place");
    else history.replaceState({ ...history.state, sidewaysOverlay: this.overlayState("place") }, "");
    this.renderPlace(key);
  }
  renderPlace(key) {
    const place = placeCopy(key, this.lang);
    if (!place) return;
    const t = (en, tr) => this.t(en, tr);
    const dialog = this.el(".fg-dialog");
    dialog.classList.remove("fg-lightbox", "fg-photo-zoomed");
    dialog.onkeydown = null;
    dialog.setAttribute("aria-labelledby", "fg-dialog-title");
    const garden = GARDENS.find((item) => item.key === key);
    const stop = this.route?.visits?.find((item) => item.key === key);
    const focus = garden?.focus || (stop ? [stop.longitude, stop.latitude] : null);
    const englishFallback = !["en", "tr"].includes(this.lang);
    dialog.innerHTML = `<button class="fg-close">← ${t("Back to map", "Haritaya dön")}</button><span class="fg-kicker">${garden ? t("MAPPED GREEN SPACE", "HARİTALANMIŞ YEŞİL ALAN") : t("A PLACE TO NOTICE", "DİKKAT EDİLECEK BİR YER")}</span><h1 id="fg-dialog-title">${escape(place.name)}</h1><div class="fg-photo-missing">${t("No photograph yet.", "Henüz fotoğraf yok.")}</div>${englishFallback ? '<span class="fg-kicker" lang="en">Description in English</span>' : ""}<p lang="${englishFallback ? "en" : this.lang}">${escape(place.text)}</p><p class="fg-muted">${garden ? t("Garden boundary: OpenStreetMap contributors (ODbL). Base map: OpenFreeMap. Check current access and hours locally.", "Bahçe sınırı: OpenStreetMap katkıcıları (ODbL). Alt harita: OpenFreeMap. Güncel erişim ve saatleri yerinde kontrol et.") : t("Original Venice Sideways drawing; approximate map position follows the Main Walk stop coordinates.", "Özgün Venice Sideways çizimi; haritadaki yaklaşık konum Ana Yürüyüş durağının koordinatlarını izler.")}</p>${focus ? `<button class="fg-primary" data-focus-place>${t("Show on map", "Haritada göster")} ↗</button>` : ""}<p class="fg-muted"><a href="https://www.openstreetmap.org/copyright" rel="noopener" target="_blank">© OpenStreetMap contributors ↗</a>${garden ? ` · <a href="https://www.openstreetmap.org/way/${garden.osmWayId}" rel="noopener" target="_blank">${t("Mapped boundary", "Haritalanmış sınır")} ↗</a> · <a href="https://www.comune.venezia.it/it/node/44238" rel="noopener" target="_blank">${t("City garden information", "Belediye bahçe bilgisi")} ↗</a>` : ""}</p>`;
    dialog.querySelector(".fg-close").onclick = () => this.closeOverlay();
    dialog.querySelector("[data-focus-place]")?.addEventListener("click", () => {
      this.savedCamera = null; this.closeOverlay();
      if (this.ready && focus) this.map.easeTo({ center: focus, zoom: 16, duration: reduced() ? 0 : 250 });
    });
    this.showDialog(dialog);
  }
  renderStatus() {
    const message = !navigator.onLine
      ? this.t(
          "Offline · loaded stops remain available. Maps and directions need a connection.",
          "Çevrimdışı · yüklenen duraklar açık. Harita ve yol tarifi bağlantı gerektirir.",
        )
      : (this.mapError && this.t(this.mapError)) || this.locationStatus || (this.mapResourceWarning && this.t(this.mapResourceWarning)) ||
        (!this.ready
          ? this.t(
              "Loading the map… You can already browse the stops.",
              "Harita yükleniyor… Duraklara şimdiden bakabilirsin.",
            )
          : "");
    const status = this.el(".fg-map-status");
    status.textContent = message;
    status.hidden = !message;
    if (this.mapError) {
      const retry = document.createElement("button");
      retry.textContent = this.t("Retry map", "Haritayı yeniden dene");
      retry.disabled = (this.mapRetries || 0) >= 3;
      retry.onclick = () => { if ((this.mapRetries || 0) < 3) { this.mapRetries = (this.mapRetries || 0) + 1; this.initMap(); } };
      status.append(retry);
      if (retry.disabled) status.append(document.createTextNode(" · " + this.t("Map retry limit reached. Reload the page or keep browsing the stops.")));
    }
  }
  async initMap() {
    const recoveryCamera = this.cameraSnapshot() || this.recoveryCamera;
    this.recoveryCamera = recoveryCamera;
    this.mapStyleAbort?.abort(); this.mapStyleAbort = new AbortController();
    const generation = (this.mapGeneration = (this.mapGeneration || 0) + 1);
    if (!window.maplibregl) {
      this.mapError = "Map unavailable. Use the stop list and directions.";
      this.renderStatus();
      return;
    }
    this.stopLocation();
    this.map?.remove();
    this.map = null;
    clearTimeout(this.mapFailureTimer);
    this.pins = [];
    this.ready = false;
    this.mapError = ""; this.mapResourceWarning = "";
    this.renderStatus();
    let style = BASE_STYLE;
    try {
      const response = await fetch(BASE_STYLE, { credentials: "omit", signal: AbortSignal.any([this.mapStyleAbort.signal, AbortSignal.timeout(8000)]) });
      if (!response.ok) throw new Error("base map style unavailable");
      style = watercolorStyle(await response.json());
    } catch {
      // Keep the readable original style if the decorative transform cannot load.
      style = BASE_STYLE;
    }
    if (generation !== this.mapGeneration || this.disposed) return;
    try {
      this.map = new maplibregl.Map({
        container: this.el(".fg-map"),
        style,
        center: [12.335, 45.438],
        zoom: 13.5,
        attributionControl: { compact: true },
      });
      for (const event of ["dragstart", "zoomstart", "rotatestart", "pitchstart"]) this.map.on(event, action => { if (action.originalEvent) { this.cameraMode = "free"; this.cameraTouched = true; } });
      const map = this.map;
      map.on("error", () => { if (generation === this.mapGeneration && map === this.map && !this.disposed) { this.mapResourceWarning = "Some map details could not load. Stops and directions remain available."; this.renderStatus(); } });
      map.on("webglcontextlost", () => {
        if (generation !== this.mapGeneration || map !== this.map || this.disposed) return;
        this.recoveryCamera = this.cameraSnapshot() || this.recoveryCamera;
        clearTimeout(this.mapFailureTimer); this.stopLocation("suspended");
        this.ready = false; this.mapError = "Map graphics were interrupted. Retry the map or keep browsing the stops."; this.renderStatus();
      });
      // Style availability, rather than individual tile events, determines usability.
      this.mapFailureTimer = setTimeout(() => {
        if (this.ready || generation !== this.mapGeneration) return;
        this.mapError = "Map could not load. Stops and directions remain available.";
        this.renderStatus();
      }, 12000);
      this.map.on("style.load", () => {
        // style.load confirms that style mutations are available. isStyleLoaded also
        // waits for visible tiles and can still be false inside this event.
        if (generation !== this.mapGeneration || map !== this.map || this.disposed) return;
        const styleCamera = this.cameraSnapshot();
        clearTimeout(this.mapFailureTimer);
        try {
        if (!map.getSource("fg-route")) {
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
          paint: { "line-color": "#2454d4", "line-width": 4 },
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
        }
        const building = this.map
          .getStyle()
          .layers.find((l) => l.id === "building");
        if (building?.source && !map.getLayer("fg-buildings"))
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
        if (typeof style !== "string") {
          try {
            Promise.resolve(addWatercolorLayers(map)).then(available => {
              if (!available || generation !== this.mapGeneration || map !== this.map || this.disposed) return;
              this.draw();
              if (map.__fgArtworkInteractions) return;
              map.__fgArtworkInteractions = true;
              for (const id of ["fg-landmark-overview", "fg-landmark-detail"])
                this.map.on("click", id, (event) => this.openPlace(event.features?.[0]?.properties?.key));
              for (const id of ["fg-garden-wash", "fg-garden-label"])
                this.map.on("click", id, (event) => {
                  this.openPlace(event.features?.[0]?.properties?.key);
                });
              for (const id of ["fg-landmark-overview", "fg-landmark-detail", "fg-garden-wash", "fg-garden-label"]) {
                this.map.on("mouseenter", id, () => { this.map.getCanvas().style.cursor = "pointer"; });
                this.map.on("mouseleave", id, () => { this.map.getCanvas().style.cursor = ""; });
              }
            }).catch(() => { if (generation === this.mapGeneration && !this.disposed) { this.mapResourceWarning = "Some map details could not load. Stops and directions remain available."; this.renderStatus(); } });
          } catch (error) {
            console.warn("Optional field-guide artwork unavailable", error);
          }
        }
        this.ready = true;
        this.mapError = "";
        this.render();
        this.draw();
        if (recoveryCamera || styleCamera) this.map.jumpTo(recoveryCamera || styleCamera);
        else this.fit();
        this.recoveryCamera = null;
        this.scheduleResize();
        } catch (error) {
          console.error("Field-guide route layers could not be installed", error);
          this.ready = false;
          this.mapError = "Map unavailable. Use the stop list and directions.";
          this.renderStatus();
        }
      });
    } catch {
      this.mapError = "Map unavailable. Use the stop list.";
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
    setWatercolorLandmarks(this.map, this.route);
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
      if (!step.boat) pin.dataset.visitKey = step.key;
      pin.setAttribute("aria-label", `${pin.textContent} · ${pin.title}`);
      pin.onclick = () => step.boat ? this.focus() : this.openDetail(step.key, pin);
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
    this.cameraMode = "free"; this.cameraTouched = true;
    this.map.fitBounds(bounds, {
      padding: 36,
      maxZoom: 16,
      duration: reduced() ? 0 : 250,
    });
  }
  focus() {
    if (!this.ready || this.view !== "walk") return;
    this.cameraMode = "free"; this.cameraTouched = true;
    const s = this.steps()[this.index],
      p = s?.boat ? s.transitStops[0] : s;
    if (p)
      this.map.easeTo({
        center: [p.longitude, p.latitude],
        zoom: 16.5,
        duration: reduced() ? 0 : 220,
      });
  }
  get walkingStep() { return this.steps()[this.index]?.key || null; }
  get watch() { return this.locationEngine?.watch ?? null; }
  locationAllowed() {
    return locationCapability({ publicLocation: this.publicLocation, preview: this.preview, localTest: this.localTestLocation });
  }
  mapVisible() {
    const rectangle = this.el(".fg-map").getBoundingClientRect();
    return rectangle.width > 0 && rectangle.height > 0;
  }
  scheduleResize() {
    if (this.resizeFrame || this.disposed) return;
    this.resizeFrame = requestAnimationFrame(() => {
      this.resizeFrame = null;
      if (this.disposed) return;
      const rectangle = this.el(".fg-map").getBoundingClientRect();
      const size = `${Math.round(rectangle.width)}:${Math.round(rectangle.height)}`;
      if (!rectangle.width || !rectangle.height) { if (this.locationEngine.active) this.stopLocation("suspended"); this.lastMapSize = size; return; }
      if (size !== this.lastMapSize) { this.lastMapSize = size; this.map?.resize(); }
    });
  }
  renderLocation() {
    const controls = this.el(".fg-location-controls");
    const state = this.locationState;
    const messages = {
      requesting: "Finding your location…", tracking: "Location is on", stale: "Location is out of date. Return to the map or restart location.", suspended: "Location paused. Start it again when you are ready.", denied: "Location permission denied. Allow location in your browser's site settings, then try again.", unavailable: "Location unavailable. You can keep browsing.", timeout: "Location timed out. Try again when you are ready.", unsupported: "Location is unavailable in this context. You can keep browsing.",
    };
    const active = this.locationEngine?.active;
    const fix = this.locationEngine?.fix;
    this.root.dataset.location = state;
    this.locationStatus = state === "off" ? "" : this.t(messages[state] || "");
    if (fix && state === "tracking") this.locationStatus = fix.outside ? this.t("You are outside Venice. Your real position is available with Return to my location; the route stays here.") : `${this.t("Location is on")} · ${fix.accuracy > 200 ? this.t("Low accuracy") : this.t("Accuracy")} ±${Math.round(fix.accuracy)} m`;
    const signature = `${this.lang}:${!!active}:${this.ready}:${this.locationAllowed()}`;
    if (controls && signature !== this.locationControlsSignature) {
      this.locationControlsSignature = signature;
      controls.innerHTML = !this.locationAllowed() ? "" : `${active ? `<button data-action="location-return" ${!fix ? "disabled" : ""}>${icon("recenter")} ${this.t("Return to my location")}</button><button data-action="location-off">${icon("location-stop")} ${this.t("Turn location off")}</button>` : `<button data-action="location" ${!this.ready ? "disabled" : ""}>${icon("location")} ${this.t("Show my location")}</button>`}<span class="fg-location-copy">${this.t("Your position stays on this device; it is not sent to the organiser.")}</span>`;
      controls.querySelectorAll("[data-action]").forEach(button => { button.onclick = () => this.action(button.dataset.action); });
    }
    controls?.querySelector('[data-action="location-return"]')?.toggleAttribute("disabled", !fix || state === "stale");
    this.renderStatus();
  }
  locate() {
    if (this.preview || this.disposed || this.locationEngine.active) return;
    this.cameraMode = "free"; this.cameraTouched = !!this.modalMode; this.locationFirstFix = true;
    this.locationEngine.start(this.map);
  }
  paintLocation(fix, map) {
    if (this.disposed || !this.locationEngine.active || map !== this.map || !this.ready || !this.mapVisible()) { if (this.locationEngine.active) this.stopLocation("suspended"); return; }
    if (!this.locationPin) {
      const element = document.createElement("div"); element.className = "fg-location-dot"; element.setAttribute("aria-label", this.t("Location is on"));
      this.locationPin = new maplibregl.Marker({ element }).setLngLat(fix.coordinates).addTo(map);
    } else this.locationPin.setLngLat(fix.coordinates);
    const data = accuracyGeometry(fix);
    if (!map.getSource("fg-gps-accuracy")) {
      map.addSource("fg-gps-accuracy", { type: "geojson", data });
      map.addLayer({ id: "fg-gps-accuracy-fill", type: "fill", source: "fg-gps-accuracy", paint: { "fill-color": "#2454d4", "fill-opacity": 0.1 } });
      map.addLayer({ id: "fg-gps-accuracy-line", type: "line", source: "fg-gps-accuracy", paint: { "line-color": "#2454d4", "line-opacity": 0.5, "line-width": 1 } });
    } else map.getSource("fg-gps-accuracy").setData(data);
    if (!this.modalMode && (this.cameraMode === "follow" || (this.locationFirstFix && !this.cameraTouched && !fix.outside && !map.getBounds().contains(fix.coordinates)))) this.focusLocation(fix);
    this.locationFirstFix = false;
    this.renderLocation();
  }
  focusLocation(fix) {
    const zoom = fix.accuracy > 1000 ? 12 : fix.accuracy > 200 ? 14 : fix.accuracy > 70 ? 15 : 16;
    this.map.easeTo({ center: fix.coordinates, zoom, duration: reduced() ? 0 : 250 });
  }
  returnToLocation() {
    const fix = this.locationEngine.fix;
    if (!fix || this.locationState !== "tracking" || !this.ready || this.modalMode) return;
    this.cameraMode = "follow"; this.focusLocation(fix);
  }
  clearLocationPresentation() {
    this.cameraMode = "free";
    this.locationPin?.remove(); this.locationPin = null;
    if (!this.map) return;
    for (const id of ["fg-gps-accuracy-line", "fg-gps-accuracy-fill"]) if (this.map.getLayer(id)) this.map.removeLayer(id);
    if (this.map.getSource("fg-gps-accuracy")) this.map.removeSource("fg-gps-accuracy");
  }
  stopLocation(state = "off") { this.locationEngine.stop(state); }
  destroy() {
    this.disposed = true;
    this.el(".fg-dialog").removeEventListener("keydown", this.dialogKeyboard);
    if (this.el(".fg-dialog").open) this.el(".fg-dialog").close();
    cancelAnimationFrame(this.resizeFrame);
    removeEventListener("popstate", this.popstate);
    removeEventListener("pagehide", this.pagehide);
    removeEventListener("pageshow", this.pageshow);
    this.mapGeneration = (this.mapGeneration || 0) + 1;
    this.mapStyleAbort?.abort();
    clearTimeout(this.mapFailureTimer);
    this.stopLocation();
    this.observer.disconnect();
    this.map?.remove();
    document.removeEventListener("visibilitychange", this.visibility);
    this.systemTheme.removeEventListener("change", this.themeChange);
    removeEventListener("online", this.online);
    removeEventListener("offline", this.online);
    document.removeEventListener("pointerdown", this.settingsOutside);
  }
}
