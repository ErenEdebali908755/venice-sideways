import {FieldGuide} from './guide.js?v=20261005-gallery-reopen';
import {temporarySelection} from './temporary-selection.js?v=20261005-mobile';

const languages = ['en','tr','it','fr','ru','zh','ja','ko'];
export const normalizeLanguage = value => typeof value === 'string' ? value.toLowerCase().split(/[-_]/)[0] : '';
export function resolveInitialLanguage({query, saved, browser = []} = {}) {
  for (const candidate of [query,saved,...browser]) {
    const language = normalizeLanguage(candidate);
    if (languages.includes(language)) return language;
  }
  return 'en';
}
export const bootCopy = {
  en:{loading:'Loading walks…',title:'Walks could not load',detail:'The latest publication could not be checked. No stop has been selected.',retry:'Try again',bundled:'Open bundled guide',network:'Maps may still need an internet connection. Only the bundled guide can be opened here.',limit:'The retry limit has been reached. Reload this page or open the bundled guide.'},
  tr:{loading:'Yürüyüşler yükleniyor…',title:'Rotalar şu an yüklenemedi',detail:'Güncel yayın kontrol edilemedi. Henüz durak seçilmedi.',retry:'Yeniden dene',bundled:'Yerleşik rehberi aç',network:'Harita için internet bağlantısı gerekebilir. Burada yalnızca yerleşik rehber açılabilir.',limit:'Yeniden deneme sınırına ulaşıldı. Sayfayı yenile veya yerleşik rehberi aç.'},
  it:{loading:'Caricamento passeggiate…',title:'Impossibile caricare i percorsi',detail:'Non è stato possibile verificare la pubblicazione attuale. Nessuna tappa è stata selezionata.',retry:'Riprova',bundled:'Apri la guida inclusa',network:'Le mappe potrebbero richiedere una connessione Internet. Qui è disponibile solo la guida inclusa.',limit:'Limite di tentativi raggiunto. Ricarica la pagina o apri la guida inclusa.'},
  fr:{loading:'Chargement des promenades…',title:'Impossible de charger les parcours',detail:'La publication actuelle n’a pas pu être vérifiée. Aucun arrêt n’a été sélectionné.',retry:'Réessayer',bundled:'Ouvrir le guide intégré',network:'Les cartes peuvent nécessiter une connexion Internet. Seul le guide intégré est disponible ici.',limit:'La limite de tentatives est atteinte. Rechargez la page ou ouvrez le guide intégré.'},
  ru:{loading:'Загрузка маршрутов…',title:'Не удалось загрузить маршруты',detail:'Не удалось проверить текущую публикацию. Остановка ещё не выбрана.',retry:'Повторить',bundled:'Открыть встроенный путеводитель',network:'Для карт может понадобиться Интернет. Здесь доступен только встроенный путеводитель.',limit:'Достигнут предел попыток. Обновите страницу или откройте встроенный путеводитель.'},
  zh:{loading:'正在加载步行路线…',title:'无法加载路线',detail:'无法核实当前发布版本。尚未选择任何站点。',retry:'重试',bundled:'打开内置指南',network:'地图可能仍需互联网连接。此处只能打开内置指南。',limit:'已达到重试次数上限。请刷新页面或打开内置指南。'},
  ja:{loading:'散歩コースを読み込んでいます…',title:'コースを読み込めませんでした',detail:'現在の公開版を確認できませんでした。まだスポットは選択されていません。',retry:'再試行',bundled:'内蔵ガイドを開く',network:'地図にはインターネット接続が必要な場合があります。ここでは内蔵ガイドのみ開けます。',limit:'再試行回数の上限に達しました。ページを再読み込みするか、内蔵ガイドを開いてください。'},
  ko:{loading:'산책 코스를 불러오는 중…',title:'코스를 불러올 수 없습니다',detail:'현재 공개 버전을 확인할 수 없습니다. 아직 정류장이 선택되지 않았습니다.',retry:'다시 시도',bundled:'내장 가이드 열기',network:'지도에는 인터넷 연결이 필요할 수 있습니다. 여기서는 내장 가이드만 열 수 있습니다.',limit:'다시 시도 횟수 제한에 도달했습니다. 페이지를 새로고침하거나 내장 가이드를 여세요.'}
};
const root = typeof document === 'undefined' ? null : document.getElementById('field-guide');
const language = () => {
  let saved; try { saved=localStorage.getItem('sideways-language'); } catch {}
  return resolveInitialLanguage({query:new URLSearchParams(location.search).get('lang'),saved,browser:navigator.languages||[navigator.language]});
};
let generation=0, guide=null, attempts=0;
async function json(url) {
  const response=await fetch(url,{credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(9000)});
  if(!response.ok)throw Error('Guide resource unavailable');
  return response.json();
}
async function boot(bundled=false) {
  const current=++generation;
  if(!bundled)attempts++;
  guide?.destroy();guide=null;
  const copy=bootCopy[language()];
  document.documentElement.lang=language();
  root.className='fg-loading';root.setAttribute('aria-busy','true');root.replaceChildren();
  const loading=document.createElement('p');loading.setAttribute('role','status');loading.textContent=copy.loading;root.append(loading);
  try {
    const [base,water]=await Promise.all([json('/field-guide/routes.json'),json('/sideways/actv-water-paths.json')]);
    if(!Array.isArray(base.routes)||!base.routes.length)throw Error('No bundled routes');
    let routes=base.routes;
    const requested=new URLSearchParams(location.hash.slice(1)).get('route');
    if(!bundled) {
      const catalog=await json('/api/route-catalog');
      if(!Array.isArray(catalog.routes)||(requested&&!catalog.routes.some(route=>route.key===requested)))throw Error('Unavailable route');
      const available=catalog.routes.filter(route=>['main','full'].includes(route.key)||route.key===requested);
      routes=await Promise.all(available.map(async route=>route.published?await json('/api/routes/'+encodeURIComponent(route.key)):base.routes.find(bundledRoute=>bundledRoute.key===route.key)));
    }
    routes=routes.filter(Boolean);
    if(!routes.length)throw Error('No available routes');
    if(current!==generation)return;
    root.removeAttribute('aria-busy');
    guide=new FieldGuide(root,{routes,lang:language(),water,referencePhotos:temporarySelection,publicLocation:true,localTestLocation:new URLSearchParams(location.search).get('gps-test')==='1',bundledNotice:bundled});
    if(!bundled)json('/api/events').then(data=>{
      if(current!==generation||guide.disposed)return;
      guide.events=(data.events||[]).filter(event=>['open','upcoming'].includes(event.state));guide.render();
    }).catch(()=>{});
    if(requested&&routes.some(route=>route.key===requested))guide.choose(requested);
  } catch {
    if(current!==generation)return;
    root.className='fg-loading';root.removeAttribute('aria-busy');root.replaceChildren();
    const title=document.createElement('h1');title.textContent=copy.title;
    const detail=document.createElement('p');detail.textContent=copy.detail;
    const retry=document.createElement('button');retry.className='fg-boot-action';retry.type='button';retry.textContent=copy.retry;retry.disabled=attempts>=3;retry.onclick=()=>boot();
    const local=document.createElement('button');local.className='fg-boot-action';local.type='button';local.textContent=copy.bundled;local.onclick=()=>boot(true);
    const actions=document.createElement('div');actions.className='fg-boot-actions';actions.append(retry,local);
    const network=document.createElement('p');network.textContent=attempts>=3?copy.limit:copy.network;
    root.append(title,detail,actions,network);
  }
}
if(root)boot();
