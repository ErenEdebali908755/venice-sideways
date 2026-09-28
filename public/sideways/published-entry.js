/* The catalog controls visibility; only reviewed releases replace the legacy Main/Full guides. */
(()=>{
 let generation=0, available=[];
 function navigate(key){if(!['main','full'].includes(key)){location.assign('/published.html'+location.search+'#route='+encodeURIComponent(key));return;}location.hash='route='+encodeURIComponent(key)+'&view=route';}
 function paint(){const key=new URLSearchParams(location.hash.slice(1)).get('route')||'main';for(const id of ['route','mobile-route']){const select=document.getElementById(id);if(!select)continue;select.replaceChildren(...available.map(r=>{const o=document.createElement('option');o.value=r.key;o.textContent=r.title;return o;}));select.value=key;select.onchange=()=>navigate(select.value);} }

 const catalog=fetch('/api/route-catalog',{credentials:'omit',cache:'no-store'}).then(async r=>{if(!r.ok)throw Error();return (await r.json()).routes;});
 window.SidewaysCatalog=catalog;
 catalog.then(routes=>{available=routes;paint();if(typeof render==='function'){const original=render;render=function(){original();paint();};}}).catch(()=>{});
 async function check(){const current=++generation;
  try {const routes=await catalog;if(current!==generation)return true;const p=new URLSearchParams(location.hash.slice(1));let key=p.get('route')||'main';
   const nav=document.querySelector('.area-nav');if(nav){nav.querySelectorAll('[data-route],.catalog-route').forEach(el=>el.remove());for(const route of routes){const button=document.createElement('button');button.type='button';button.className='btn small catalog-route';button.textContent=route.title;button.setAttribute('aria-pressed',String(route.key===key));button.onclick=()=>{if(!['main','full'].includes(route.key)){location.assign('/published.html'+location.search+'#route='+encodeURIComponent(route.key));return;}location.hash='route='+encodeURIComponent(route.key)+'&view=route';};nav.append(button);}}
   paint();
   if(!routes.length){document.querySelector('main')?.setAttribute('hidden','');if(nav)nav.textContent='No routes are currently available.';return true;}
   if(!routes.some(r=>r.key===key)){location.hash='route='+routes[0].key+'&view=route';return true;}
   if(!routes.find(r=>r.key===key)?.published)return false;
   const r=await fetch('/api/routes/'+key,{credentials:'omit',signal:AbortSignal.timeout(7000)});if(!r.ok)return false;
   const data=await r.json();if(current!==generation||data.key!==key||data.schemaVersion!==1)return true;
   location.replace('/published.html'+location.search+'#'+p.toString());return true;
  }catch{return false;}
 }
 function update(){window.SidewaysRouteReady=check();}
 addEventListener('hashchange',update);addEventListener('sidewaysroutechange',update);update();
})();
