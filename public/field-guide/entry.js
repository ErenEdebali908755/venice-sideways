import {FieldGuide} from './guide.js';
const root=document.getElementById('field-guide');
const lang=()=>{const allowed=['en','tr','it','fr','ru','zh','ja','ko'],query=new URLSearchParams(location.search).get('lang');if(allowed.includes(query))return query;try{const saved=localStorage.getItem('sideways-language');if(allowed.includes(saved))return saved;}catch{}return (navigator.languages||[navigator.language]).map(value=>value.toLowerCase().split('-')[0]).find(value=>allowed.includes(value))||'en';};
async function json(url){const r=await fetch(url,{credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(9000)});if(!r.ok)throw Error(String(r.status));return r.json();}
async function boot(offline=false){root.className='fg-loading';root.textContent=lang()==='tr'?'Yürüyüşler yükleniyor…':'Loading walks…';try{
 const [base,water]=await Promise.all([json('/field-guide/routes.json'),json('/sideways/actv-water-paths.json')]);
 let routes=base.routes;
 const requested=new URLSearchParams(location.hash.slice(1)).get('route');
 if(!offline){const catalog=await json('/api/route-catalog');if(requested&&!catalog.routes.some(r=>r.key===requested))throw Error('Unavailable route');const available=catalog.routes.filter(r=>['main','full'].includes(r.key)||r.key===requested);routes=await Promise.all(available.map(async r=>r.published?await json('/api/routes/'+encodeURIComponent(r.key)):base.routes.find(d=>d.key===r.key)));}
 const guide=new FieldGuide(root,{routes:routes.filter(Boolean),lang:lang(),water});
 if(!offline)json('/api/events').then(data=>{guide.events=(data.events||[]).filter(e=>['open','upcoming'].includes(e.state));guide.render();}).catch(()=>{});
 const key=new URLSearchParams(location.hash.slice(1)).get('route');if(key)guide.choose(key);
 if(offline){const notice=document.createElement('p');notice.className='fg-offline-banner';notice.textContent=guide.t('Bundled guide · current publication status could not be checked.','Yerel rehber · güncel yayın durumu kontrol edilemedi.');root.prepend(notice);}
 }catch{root.className='fg-loading';root.replaceChildren();const h=document.createElement('h1');h.textContent=lang()==='tr'?'Rotalar şu an yüklenemedi':'Walks could not load';const p=document.createElement('p');p.textContent=lang()==='tr'?'Güncel olmayan içeriği yayındaki sürüm olarak göstermiyoruz.':'The latest publication could not be checked.';const retry=document.createElement('button');retry.textContent=lang()==='tr'?'Yeniden dene':'Try again';retry.onclick=()=>boot();const local=document.createElement('button');local.textContent=lang()==='tr'?'Yerel rehberi aç':'Open bundled guide';local.onclick=()=>boot(true);root.append(h,p,retry,local);}}
boot();
