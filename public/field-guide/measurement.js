/* First-party opt-in anonymous event counts. Imported only by the public entry.
 * No geolocation, participant fields, cookies, archive IDs or persistent person ID. */
const collectors = new WeakMap();
const locales = ['en','tr','it','ru','fr','zh','ja','ko'];
export const measurementCopy = {
  en: {title:'Anonymous statistics',allow:'Allow anonymous usage counts',detail:'Counts page views and opened walks by language and screen size. No GPS, names, persistent visitor ID or browsing history. Aggregates are kept for 180 days. Turn off to stop future measurement.',blocked:'Your browser privacy preference disables measurement.'},
  tr: {title:'Anonim istatistikler',allow:'Anonim kullanım sayımına izin ver',detail:'Sayfa görüntülemelerini ve açılan rotaları dil ve ekran boyutuna göre sayar. GPS, isim, kalıcı ziyaretçi kimliği veya gezinme geçmişi içermez. Toplu sayılar 180 gün tutulur. Kapatmak sonraki ölçümleri durdurur.',blocked:'Tarayıcının gizlilik tercihi nedeniyle ölçüm kapalı.'},
  it: {title:'Statistiche anonime',allow:'Consenti il conteggio anonimo dell’uso',detail:'Conta le visualizzazioni e i percorsi aperti per lingua e dimensione dello schermo. Nessun GPS, nome, identificatore persistente o cronologia. I conteggi aggregati sono conservati per 180 giorni. Disattiva per interrompere le misurazioni future.',blocked:'La preferenza di privacy del browser disattiva la misurazione.'},
  fr: {title:'Statistiques anonymes',allow:'Autoriser les comptages anonymes',detail:'Compte les pages vues et les parcours ouverts par langue et taille d’écran. Sans GPS, nom, identifiant persistant ni historique. Les totaux sont conservés pendant 180 jours. Désactivez pour arrêter les mesures futures.',blocked:'La préférence de confidentialité du navigateur désactive la mesure.'},
  ru: {title:'Анонимная статистика',allow:'Разрешить анонимный подсчёт использования',detail:'Подсчитывает просмотры страниц и открытые маршруты по языку и размеру экрана. Без GPS, имён, постоянного идентификатора и истории. Общие показатели хранятся 180 дней. Отключение прекращает будущие измерения.',blocked:'Настройки конфиденциальности браузера отключают измерения.'},
  zh: {title:'匿名统计',allow:'允许匿名使用统计',detail:'按语言和屏幕大小统计页面浏览和打开的路线。不收集 GPS、姓名、永久访客标识或浏览历史。汇总数据保留 180 天。关闭后停止后续统计。',blocked:'浏览器隐私设置已禁用统计。'},
  ja: {title:'匿名統計',allow:'匿名の利用回数の計測を許可',detail:'言語と画面サイズ別にページ閲覧と開いたコースを数えます。GPS、氏名、永続的な識別子、閲覧履歴は収集しません。集計は180日間保存されます。オフにすると今後の計測を停止します。',blocked:'ブラウザーのプライバシー設定により計測は無効です。'},
  ko: {title:'익명 통계',allow:'익명 이용 횟수 집계 허용',detail:'언어와 화면 크기별로 페이지 조회 및 연 코스를 집계합니다. GPS, 이름, 영구 방문자 ID 또는 방문 기록은 수집하지 않습니다. 집계는 180일 동안 보관됩니다. 끄면 이후 측정이 중단됩니다.',blocked:'브라우저 개인정보 설정으로 측정이 비활성화되었습니다.'}
};
export function createMeasurementCollector(options = {}) {
  const doc = options.document || document, win = options.window || window, nav = options.navigator || navigator;
  if (collectors.has(doc)) return collectors.get(doc);
  const request = options.request || win.fetch.bind(win), random = options.crypto || win.crypto;
  let storage = options.storage; if (!storage) { try { storage = win.localStorage; } catch {} }
  let consent = false, ready = false, pageClaimed = false, language = 'en', current = null, sequence = 0, disposed = false, generation = 0;
  const claimed = new Set(), pending = new Set(), widgets = new Set();
  let consentEpoch, admission = null, admissionPending = null;
  const privacy = () => nav.doNotTrack === '1' || nav.doNotTrack === 'yes' || nav.globalPrivacyControl === true || win.doNotTrack === '1';
  const allowed = () => !disposed && consent && !privacy() && !doc.hidden;
  try { consent = storage?.getItem('sideways-measurement') === 'yes' && !privacy(); } catch {}
  const locale = value => locales.includes(value) ? value : 'other';
  const id = () => Array.from(random.getRandomValues(new Uint8Array(16)), value => value.toString(16).padStart(2,'0')).join('');
  consentEpoch = id();
  function stop() { generation++; admission = null; admissionPending = null; consentEpoch = id(); for (const item of pending) { item.abort.abort(); clearTimeout(item.timer); item.resume?.(); } pending.clear(); }
  async function capability(version) {
    if (!allowed() || version !== generation) return null;
    if (admission && admission.expiresAt * 1000 - 30000 > Date.now()) return admission.capability;
    if (admissionPending) return admissionPending;
    const item = {abort:new AbortController(),timer:null,resume:null}; pending.add(item);
    item.timer = setTimeout(() => item.abort.abort(),5000);
    let job; job = (async () => {
      try {
        const response = await Promise.resolve().then(() => { if (!allowed() || version !== generation || item.abort.signal.aborted) throw Error('Measurement stopped'); return request('/api/community/admission',{method:'POST',credentials:'omit',headers:{'content-type':'application/json'},body:JSON.stringify({consent:true,schemaVersion:1,consentEpoch}),signal:item.abort.signal,cache:'no-store'}); });
        if (!response.ok) return null;
        const value = await response.json();
        if (!allowed() || version !== generation || typeof value.capability !== 'string' || value.capability.length > 1024 || !Number.isSafeInteger(value.expiresAt) || value.expiresAt * 1000 <= Date.now()) return null;
        admission = {capability:value.capability,expiresAt:value.expiresAt}; return value.capability;
      } catch { return null; }
      finally { clearTimeout(item.timer); pending.delete(item); if (admissionPending === job) admissionPending = null; }
    })();
    admissionPending = job; return job;
  }
  async function send(metric, route) {
    if (!allowed() || pending.size >= 4) return;
    const version = generation, token = await capability(version);
    if (!token || !allowed() || version !== generation || pending.size >= 4) return;
    // This ephemeral ID belongs to one logical event, including both retries.
    const data = {consent:true,event:id(),metric,route,language:locale(language),device:win.innerWidth < 900 ? 'mobile':'desktop',schemaVersion:1,consentEpoch};
    for (let attempt = 0; attempt < 2; attempt++) {
      if (!allowed() || version !== generation) return;
      const item = {abort:new AbortController(),timer:null,resume:null}; pending.add(item);
      item.timer = setTimeout(() => item.abort.abort(),8000);
      try {
        const response = await request('/api/community/statistics',{method:'POST',credentials:'omit',headers:{'content-type':'application/json','X-Measurement-Capability':token},body:JSON.stringify(data),signal:item.abort.signal,cache:'no-store'});
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
    if (current && !claimed.has(current.identity)) { claimed.add(current.identity); if (claimed.size > 128) claimed.delete(claimed.values().next().value); void send('route_open',current.route); }
  }
  function updateWidgets() {
    for (const widget of widgets) {
      if (!widget.host.isConnected) { widgets.delete(widget); continue; }
      widget.input.checked = consent && !privacy(); widget.input.disabled = privacy();
      widget.detail.textContent = privacy() ? widget.copy.blocked : widget.copy.detail;
    }
  }
  function setConsent(value) {
    consent = value === true && !privacy();
    try { storage?.setItem('sideways-measurement',consent?'yes':'no'); } catch {}
    if (!consent) stop(); else flush();
    updateWidgets();
  }
  function mountPreferences(containers, lang = language) {
    widgets.clear();
    for (const container of containers || []) {
      const copy = measurementCopy[lang] || measurementCopy.en, details = doc.createElement('details'), summary = doc.createElement('summary'), label = doc.createElement('label'), input = doc.createElement('input'), text = doc.createElement('span'), explanation = doc.createElement('p');
      details.className = 'fg-measurement'; summary.textContent = copy.title; input.type = 'checkbox'; input.checked = consent && !privacy(); input.disabled = privacy(); text.textContent = copy.allow;
      explanation.className = 'fg-muted'; explanation.textContent = privacy() ? copy.blocked : copy.detail;
      input.addEventListener('change',() => setConsent(input.checked)); label.append(input,text); details.append(summary,label,explanation); container.replaceChildren(details);
      widgets.add({host:container,input,detail:explanation,copy});
    }
  }
  const visibility = () => { if (doc.hidden) stop(); else { updateWidgets(); flush(); } };
  const storageChange = event => { if (event.key === 'sideways-measurement') { consent = event.newValue === 'yes' && !privacy(); if (!consent) stop(); updateWidgets(); flush(); } };
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
