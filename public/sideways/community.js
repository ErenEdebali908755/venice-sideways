/* Optional anonymous usage counts. Device location is never read or shared here. */
(() => {
  const host = document.createElement('div');
  host.id = 'sideways-community';
  const root = host.attachShadow({mode: 'open'});
  document.body.append(host);
  root.innerHTML = `<style>:host{display:block;flex-shrink:0;max-height:40dvh;overflow:auto;position:relative;font-family:Arial,sans-serif;color:#e9f1f4;background:#172b35;padding:14px 20px;border-top:1px solid #49616d;font-size:14px;line-height:1.5;z-index:2}select{font:inherit;padding:9px 12px;min-height:42px;color:#effaff;background:#23434e;border:1px solid #73919c;border-radius:7px;cursor:pointer}summary{cursor:pointer;font-weight:bold;min-height:30px}p{max-width:850px}label{display:flex;gap:10px;align-items:center;margin:12px 0}input{width:20px;height:20px}.row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}</style><details><summary id="title"></summary><div class="row"><select aria-label="Language"><option value="en">English</option><option value="tr">Türkçe</option></select></div><label><input type="checkbox" id="stats"><span id="stats-label"></span></label><p id="stats-explain"></p></details>`;

  let tr = (typeof WalkI18n !== 'undefined' ? WalkI18n.language : document.documentElement.lang) === 'tr';
  let measured = false;
  const $ = selector => root.querySelector(selector);
  const t = (en, turkish) => tr ? turkish : en;
  const privacy = () => navigator.doNotTrack === '1' || navigator.globalPrivacyControl === true;
  const random = count => Array.from(crypto.getRandomValues(new Uint8Array(count)), byte => byte.toString(16).padStart(2, '0')).join('');

  function render() {
    $('#title').textContent = t('Privacy & anonymous statistics', 'Gizlilik ve anonim istatistikler');
    $('#stats-label').textContent = t('Allow anonymous usage counts', 'Anonim kullanım sayımına izin ver');
    $('#stats-explain').textContent = privacy()
      ? t('Your browser privacy preference disables measurement.', 'Tarayıcının gizlilik tercihi nedeniyle ölçüm kapalı.')
      : t('Counts page views and route selections by language and screen size. No GPS, names, persistent visitor ID or browsing history. Aggregate counts are kept for 180 days. Uncheck to stop future measurement.', 'Dil ve ekran boyutuna göre sayfa görüntüleme ve rota seçimlerini sayar. GPS, isim, kalıcı ziyaretçi kimliği veya gezinme geçmişi içermez. Toplu sayılar 180 gün tutulur. İzni kaldırarak sonraki ölçümleri durdurabilirsin.');
    $('#stats').disabled = privacy();
  }

  $('select').value = tr ? 'tr' : 'en';
  $('select').onchange = () => { tr = $('select').value === 'tr'; render(); };
  function route() {
    const key = new URLSearchParams(location.hash.slice(1)).get('route') || 'main';
    return /^[a-z][a-z0-9-]{0,79}$/.test(key) ? key : 'home';
  }
  async function measure(metric) {
    if (!$('#stats').checked || privacy() || document.hidden) return;
    const current = route();
    if (await window.SidewaysRouteReady) return;
    if (current !== route() || document.hidden || !$('#stats').checked) return;
    let language = typeof WalkI18n !== 'undefined' ? WalkI18n.language : (new URLSearchParams(location.search).get('lang') || document.documentElement.lang);
    language = ['en', 'tr', 'it', 'ru', 'fr', 'zh', 'ja', 'ko'].includes(language) ? language : 'other';
    const data = {consent: true, event: random(16), metric, route: current, language, device: innerWidth < 900 ? 'mobile' : 'desktop'};
    for (let attempt = 0; attempt < 2; attempt++) {
      if (!$('#stats').checked || privacy()) return;
      try {
        const response = await fetch('/api/community/statistics', {method: 'POST', headers: {'Content-Type': 'application/json'}, credentials: 'omit', body: JSON.stringify(data)});
        if (!response.ok) throw Error();
        return;
      } catch {
        if (!attempt) await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  try { $('#stats').checked = !privacy() && localStorage.getItem('sideways-measurement') === 'yes'; } catch {}
  function initial() {
    if (!measured && $('#stats').checked && !document.hidden) {
      measured = true;
      void measure('page_view');
      void measure('route_open');
    }
  }
  $('#stats').onchange = () => {
    try { localStorage.setItem('sideways-measurement', $('#stats').checked ? 'yes' : 'no'); } catch {}
    initial();
  };
  let previous = route();
  function changed() {
    const next = route();
    if (next !== previous) { previous = next; void measure('route_open'); }
  }
  addEventListener('hashchange', changed);
  addEventListener('sidewaysroutechange', changed);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) initial(); });
  render();
  initial();
})();
