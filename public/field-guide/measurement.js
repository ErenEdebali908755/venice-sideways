/* First-party anonymous event counts, on unless this device stored 'no'. Imported only by the public entry.
 * No geolocation, participant fields, cookies, archive IDs or persistent person ID. */
const collectors = new WeakMap();
const locales = ['en','tr','it','ru','fr','zh','ja','ko'];
export const measurementCopy = {
  en: {title:'Anonymous statistics',allow:'Anonymous usage counts',detail:'Counts page views and opened walks by language and screen size. No GPS, names, persistent visitor ID or browsing history; no cookies are used. Aggregate counts are kept for 180 days. On by default; if you turn it off, this device is not counted.'},
  tr: {title:'Anonim istatistikler',allow:'Anonim kullanım sayımı',detail:'Sayfa görüntülemelerini ve açılan rotaları dil ve ekran boyutuna göre sayar. GPS, isim, kalıcı ziyaretçi kimliği veya gezinme geçmişi yok; çerez kullanılmaz. Toplu sayılar 180 gün tutulur. Varsayılan olarak açıktır; kapatırsan bu cihazdan sayım yapılmaz.'},
  it: {title:'Statistiche anonime',allow:'Conteggio anonimo dell’uso',detail:'Conta le visualizzazioni delle pagine e i percorsi aperti per lingua e dimensione dello schermo. Nessun GPS, nome, identificativo persistente del visitatore o cronologia di navigazione; non usa cookie. I conteggi aggregati sono conservati per 180 giorni. È attivo per impostazione predefinita; se lo disattivi, questo dispositivo non viene conteggiato.'},
  fr: {title:'Statistiques anonymes',allow:'Comptage anonyme de l’utilisation',detail:'Compte les pages vues et les parcours ouverts par langue et taille d’écran. Pas de GPS, de nom, d’identifiant de visiteur persistant ni d’historique de navigation ; aucun cookie n’est utilisé. Les totaux sont conservés pendant 180 jours. Activé par défaut ; si vous le désactivez, cet appareil n’est plus compté.'},
  ru: {title:'Анонимная статистика',allow:'Анонимный подсчёт использования',detail:'Подсчитывает просмотры страниц и открытые маршруты по языку и размеру экрана. Без GPS, имён, постоянного идентификатора посетителя и истории просмотров; файлы cookie не используются. Общие показатели хранятся 180 дней. Включено по умолчанию; если выключить, с этого устройства подсчёт не ведётся.'},
  zh: {title:'匿名统计',allow:'匿名使用统计',detail:'按语言和屏幕大小统计页面浏览和打开的路线。不收集 GPS、姓名、永久访客标识或浏览历史，也不使用 Cookie。汇总数据保留 180 天。默认开启；关闭后，此设备将不再计入统计。'},
  ja: {title:'匿名統計',allow:'匿名の利用回数の計測',detail:'言語と画面サイズ別にページ閲覧と開いたコースを数えます。GPS、氏名、永続的な訪問者ID、閲覧履歴は収集せず、Cookieも使用しません。集計は180日間保存されます。初期設定はオンです。オフにすると、この端末からは計測されません。'},
  ko: {title:'익명 통계',allow:'익명 이용 횟수 집계',detail:'언어와 화면 크기별로 페이지 조회와 연 코스를 집계합니다. GPS, 이름, 영구 방문자 ID, 방문 기록은 수집하지 않으며 쿠키도 사용하지 않습니다. 집계는 180일 동안 보관됩니다. 기본으로 켜져 있으며, 끄면 이 기기에서는 집계하지 않습니다.'}
};
export function createMeasurementCollector(options = {}) {
  const doc = options.document || document, win = options.window || window;
  if (collectors.has(doc)) return collectors.get(doc);
  const request = options.request || win.fetch.bind(win), random = options.crypto || win.crypto;
  let storage = options.storage; if (!storage) { try { storage = win.localStorage; } catch {} }
  let consent = false, ready = false, pageClaimed = false, language = 'en', current = null, sequence = 0, disposed = false, generation = 0;
  const claimed = new Set(), pending = new Set(), widgets = new Set();
  const allowed = () => !disposed && consent && !doc.hidden;
  // No stored choice means counting is on; only an explicit 'no' (including earlier refusals) turns it off.
  const fromStorage = value => value !== 'no';
  consent = true; try { consent = fromStorage(storage?.getItem('sideways-measurement')); } catch {}
  const locale = value => locales.includes(value) ? value : 'other';
  const id = () => Array.from(random.getRandomValues(new Uint8Array(16)), value => value.toString(16).padStart(2,'0')).join('');
  function stop() { generation++; for (const item of pending) { item.abort.abort(); clearTimeout(item.timer); item.resume?.(); } pending.clear(); }
  async function send(metric, route) {
    if (!allowed()) return;
    // This ephemeral ID belongs to one logical event, including both retries.
    const data = {consent:true,event:id(),metric,route,language:locale(language),device:win.innerWidth < 900 ? 'mobile':'desktop'};
    const version = generation;
    for (let attempt = 0; attempt < 2; attempt++) {
      if (!allowed() || version !== generation) return;
      const item = {abort:new AbortController(),timer:null,resume:null}; pending.add(item);
      item.timer = setTimeout(() => item.abort.abort(),8000);
      try {
        const response = await request('/api/community/statistics',{method:'POST',credentials:'omit',headers:{'content-type':'application/json'},body:JSON.stringify(data),signal:item.abort.signal,cache:'no-store'});
        if (response.ok) return;
        // Invalid events and permission failures cannot be repaired by repeating.
        if (response.status < 500 && ![408,429].includes(response.status)) return;
      } catch {}
      finally { clearTimeout(item.timer); pending.delete(item); }
      if (!attempt && allowed() && version === generation) {
        const wait = {abort:new AbortController(),timer:null,resume:null}; pending.add(wait);
        await new Promise(resolve => { wait.resume = resolve; wait.timer = setTimeout(resolve, options.retryDelay ?? 1000); });
        clearTimeout(wait.timer); pending.delete(wait);
      }
    }
  }
  function flush() {
    if (!ready || !allowed()) return;
    if (!pageClaimed) { pageClaimed = true; void send('page_view','home'); }
    if (current && !claimed.has(current.identity)) { claimed.add(current.identity); void send('route_open',current.route); }
  }
  function updateWidgets() {
    for (const widget of widgets) {
      if (!widget.host.isConnected) { widgets.delete(widget); continue; }
      widget.input.checked = consent;
    }
  }
  function setConsent(value) {
    consent = value === true;
    try { storage?.setItem('sideways-measurement',consent?'yes':'no'); } catch {}
    if (!consent) stop(); else flush();
    updateWidgets();
  }
  function mountPreferences(containers, lang = language) {
    widgets.clear();
    for (const container of containers || []) {
      const copy = measurementCopy[lang] || measurementCopy.en, details = doc.createElement('details'), summary = doc.createElement('summary'), label = doc.createElement('label'), input = doc.createElement('input'), text = doc.createElement('span'), explanation = doc.createElement('p');
      details.className = 'fg-measurement'; summary.textContent = copy.title; input.type = 'checkbox'; input.checked = consent; text.textContent = copy.allow;
      explanation.className = 'fg-muted'; explanation.textContent = copy.detail;
      input.addEventListener('change',() => setConsent(input.checked)); label.append(input,text); details.append(summary,label,explanation); container.replaceChildren(details);
      widgets.add({host:container,input,detail:explanation,copy});
    }
  }
  const visibility = () => { if (doc.hidden) stop(); else { updateWidgets(); flush(); } };
  const storageChange = event => { if (event.key === 'sideways-measurement') { consent = fromStorage(event.newValue); if (!consent) stop(); updateWidgets(); flush(); } };
  doc.addEventListener('visibilitychange',visibility); win.addEventListener('storage',storageChange);
  const api = {
    pageReady(lang) { if (disposed) return; ready = true; language = lang || language; flush(); },
    routeOpened({route,language:lang,openID} = {}) { if (disposed || typeof route !== 'string' || !/^[a-z][a-z0-9-]{0,79}$/.test(route) || route === 'home') return; language = lang || language; current = {route,identity:openID == null ? ++sequence : `${route}:${openID}`}; flush(); },
    languageChanged(lang) { language = lang || language; },
    mountPreferences, setConsent,
    destroy() { if (disposed) return; stop(); disposed = true; doc.removeEventListener('visibilitychange',visibility); win.removeEventListener('storage',storageChange); widgets.clear(); collectors.delete(doc); },
  };
  collectors.set(doc,api); return api;
}
