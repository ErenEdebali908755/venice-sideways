/* Classic uses the same bounded opt-in protocol as the modern visitor. No GPS access. */
(async () => {
  const { createMeasurementCollector } = await import('/field-guide/measurement.js?v=20261007-security');
  const host = document.createElement('div'); host.id = 'sideways-community';
  const root = host.attachShadow({ mode: 'open' }); document.body.append(host);
  const style = document.createElement('style'); style.textContent = ':host{display:block;max-height:40dvh;overflow:auto;position:relative;font-family:Arial,sans-serif;color:#e9f1f4;background:#172b35;padding:14px 20px;border-top:1px solid #49616d;font-size:14px;line-height:1.5}summary{cursor:pointer;min-height:30px;font-weight:bold}p{max-width:850px}label{display:flex;gap:10px;align-items:center;margin:12px 0}input{width:20px;height:20px}';
  const preferences = document.createElement('div'); root.append(style, preferences);
  const nativeFetch = window.fetch.bind(window);
  const request = (path, options) => nativeFetch(location.hostname === 'erenedebali.com' ? path === '/api/community/admission' ? '/api/sideways/measurement-admission' : path === '/api/community/statistics' ? '/api/sideways/statistics' : path : path, options);
  const collector = createMeasurementCollector({ request });
  const language = () => typeof WalkI18n !== 'undefined' ? WalkI18n.language : document.documentElement.lang || 'en';
  const route = () => { const value = new URLSearchParams(location.hash.slice(1)).get('route') || 'main'; return /^[a-z][a-z0-9-]{0,79}$/.test(value) ? value : 'home'; };
  let previous, opening = 0, generation = 0;
  function render() { collector.mountPreferences([preferences], language()); collector.languageChanged(language()); }
  async function ready() {
    const version = ++generation, current = route();
    if (await window.SidewaysRouteReady) return;
    if (version !== generation || current !== route() || document.hidden) return;
    collector.pageReady(language());
    if (current !== previous) { previous = current; collector.routeOpened({ route: current, language: language(), openID: ++opening }); }
  }
  addEventListener('hashchange', ready); addEventListener('sidewaysroutechange', ready);
  addEventListener('walklanguagechange', render);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) void ready(); });
  addEventListener('pagehide', () => collector.destroy(), { once: true }); render(); void ready();
})().catch(() => { /* Missing admission/service leaves optional measurement inactive. */ });
