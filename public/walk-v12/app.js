/* Scoped upgrade: mixed travel modes, theme and phone-first editorial refinements.
   No paid API, credentials, new domain, or gallery changes. */
(() => {
'use strict';
const $=id=>document.getElementById(id), LANG=['en','tr','ru','fr','zh','ja','ko'];
const C=window.WalkV11Copy,P=window.WalkV11Ideas;
const currentLang=()=>window.WalkI18n?.language||'en';
const text=(key,pack=C)=>pack[key]?.[Math.max(0,LANG.indexOf(currentLang()))]||pack[key]?.[0]||key;
const english=key=>C[key][0];
WalkI18n.registerUI(Object.values(C).map(row=>row.join('|')).join('\n'));
for(const name of ['Punta della Dogana','Accademia · ACTV','Ferrovia · ACTV','Tre Archi · ACTV'])WalkI18n.registerUI(Array(7).fill(name).join('|'));
const MAIN=['lucia','giacomo','frari','margherita','barnaba','trovaso','zattere','dogana','accademia','trearchi','vino'];
const BOARD={id:'board',n:'⛴',name:'Accademia · ACTV',lat:45.43164,lon:12.32871,area:'core',query:'Accademia B vaporetto, Venice, Italy'};
const LAND={id:'land',n:'⛴',name:'Tre Archi · ACTV',lat:45.44613,lon:12.31985,area:'north',query:'Tre Archi vaporetto, Venice, Italy'};
// Outdoor transfer areas are approximate; the departure boards determine the actual pier.
const CHANGE={id:'change',n:'⛴',name:'Ferrovia · ACTV',lat:45.44026,lon:12.32206,area:'north',query:'Ferrovia vaporetto, Venice, Italy'};
const boatIcon='<svg class="boat-icon" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path d="M8 15V7h16v8M12 7V4h8v3M7 15l9-4 9 4-3 10H10Z"/><path d="M4 28q3-4 6 0q3-4 6 0q3-4 6 0q3-4 6 0M12 10v3m8-3v3M16 12v12"/></svg>';
const pointBadge=p=>typeof p.n==='number'?String(p.n):boatIcon;
const ACTV='https://actv.avmspa.it/en/node/10576';
const transit=(a,b)=>'https://www.google.com/maps/dir/?'+new URLSearchParams({api:'1',origin:a.query,destination:b.query,travelmode:'transit'});
const transitURL=transit(BOARD,LAND);
const journeys=[{from:BOARD,to:CHANGE,line:'1',label:'boatFirst',url:transit(BOARD,CHANGE)},{from:CHANGE,to:LAND,line:'5.2',label:'boatSecond',url:transit(CHANGE,LAND)}];
const transitLinks=()=>journeys.map(j=>aLink(j.url,text(j.label),'btn primary small')).join('');
ROUTES.main.ids=MAIN;ROUTES.main.label='Main Walk · 11 stops · Vino Vero';ROUTES.main.plan=english('mainPlan');
const baseStops=stops;
// A forecourt point avoids snapping the station meeting to a ferry pier.
stops=function(){return baseStops().map(p=>{if(mode!=='main')return p;if(p.id==='lucia')return {...p,lat:45.44085,lon:12.32145,query:'45.44085,12.32145'};return p.id==='dogana'?{...p,source:'https://www.pinaultcollection.com/palazzograssi/en/punta-della-dogana'}:p;});};
const phasePoints=()=>{const all=stops();return [[...all.slice(0,9),BOARD],[LAND,...all.slice(9)]];};
const aLink=(href,label,classes='btn small')=>'<a class="'+classes+'" href="'+esc(href)+'" target="_blank" rel="noopener">'+esc(label)+' ↗</a>';
function transferHTML(compact=false){const bridge=stops().find(p=>p.id==='accademia');return '<div class="transfer-heading">'+esc(text('transfer'))+'</div>'+(compact?'':'<p>'+esc(text('transferInfo'))+'</p>')+'<div class="transfer-links">'+aLink(googleRoute([bridge,BOARD]),text('walkBoard'))+transitLinks()+aLink(googleRoute([LAND,POINTS.trearchi]),text('walkAfter'))+aLink(ACTV,text('currentActv'))+'</div>'+(compact?'':'<p class="small-note">'+esc(text('waterbusPhoto'))+'</p>');}
const transferPanel=document.createElement('section');transferPanel.id='mixed-transfer';transferPanel.className='transfer-panel';transferPanel.setAttribute('data-no-translate','');
document.querySelector('.export-box').after(transferPanel);
const boatField=document.createElement('div');boatField.id='boat-budget-field';boatField.className='pause-budget';boatField.setAttribute('data-no-translate','');boatField.innerHTML='<label class="field-label" for="boat-minutes"></label><input id="boat-minutes" type="number" min="10" max="180" step="5" value="70">';$('pause-minutes').closest('.pause-budget').after(boatField);
function budget(){const n=Number($('boat-minutes').value);return Number.isFinite(n)?Math.max(10,Math.min(180,n)):70;}
$('boat-minutes').onchange=()=>{$('boat-minutes').value=budget();renderSun();};
let walkResults=null,transferLayer=null,networkState='idle';
function mainStatus(titleKey){for(const id of ['status-title','status-text','status-small'])$(id).setAttribute('data-no-translate','');$('status-title').textContent=titleKey==='ready'?(walkResults.distance/1000).toFixed(1)+' km · '+Math.round(walkResults.distance/4000*60)+' min':text(titleKey);$('status-text').textContent=text(titleKey==='ready'?'routeReady':'legend');$('status-small').textContent=titleKey==='ready'?text('scheduleNote'):text('mixedExport');}
const baseBadge=updateBadge;
updateBadge=function(){if(mode!=='main'){for(const id of ['badge-title','badge-note'])$(id).removeAttribute('data-no-translate');return baseBadge();}baseBadge();for(const id of ['badge-title','badge-note'])$(id).setAttribute('data-no-translate','');$('badge-title').textContent=WalkI18n.translate('Main Walk')+' · 11';$('badge-note').textContent=text('legend');};
let decoratedMode='main';
function decorate(){
 transferPanel.hidden=mode!=='main';boatField.hidden=mode!=='main';
 if(mode==='main'){
  const sunIntro=document.querySelector('#sun-panel > p');if(sunIntro){sunIntro.setAttribute('data-no-translate','');sunIntro.textContent=text('sunIntro');}
  mainStatus(walkResults&&networkState==='ready'?'ready':networkState==='loading'?'loading':'partial');
  const first=document.querySelector('#guide-plan .intro + .muted');if(first){first.textContent=english('mainPlan');}
  $('export-all').hidden=true;$('export-all').removeAttribute('href');
  $('export-note').textContent=english('mixedExport');
  const phases=phasePoints(),parts=phases.map(splitRoute);let n=0;
  $('parts').setAttribute('data-no-translate','');$('parts').innerHTML=parts.map((group,k)=>group.map((p)=>aLink(googleRoute(p),text('walkPart')+' '+(++n)+' · '+p[0].n+'–'+p.at(-1).n)).join('')+(k===0?transitLinks():'')).join('');
  transferPanel.innerHTML=transferHTML();
  const card=$('photo-stop-accademia');if(card){card.querySelector('.leg-link')?.remove();let step=card.querySelector('.card-transfer');if(!step){step=document.createElement('div');step.className='card-transfer';step.setAttribute('data-no-translate','');card.append(step);}step.innerHTML=transferHTML(true);}
  $('boat-budget-field').querySelector('label').textContent=text('boatBudget');
  const old=document.querySelector('#pause-minutes')?.closest('.pause-budget')?.querySelector('p');if(old)old.textContent=english('scheduleNote');
 }else{
  $('parts').removeAttribute('data-no-translate');$('badge-note').removeAttribute('data-no-translate');
  for(const id of ['status-title','status-text','status-small'])$(id).removeAttribute('data-no-translate');
  if(decoratedMode==='main')setStatus('Loading the walking map…','Google Maps links and photo ideas work independently of the map.','');
 }
 decoratedMode=mode;
 for(const p of document.querySelectorAll('.fineprint details p')){
  if(p.dataset.ideaSummary||p.textContent.startsWith('The guide has 155 optional')){p.dataset.ideaSummary='1';p.textContent=english('ideasSummary');}
  if(p.querySelector('b')?.textContent==='Main Walk:'||p.dataset.mainDescription){p.dataset.mainDescription='1';p.textContent=english('mainPlan');}
  if(p.querySelector('a[href*="maps/documentation/urls"]')||p.dataset.mixedDescription){p.dataset.mixedDescription='1';p.textContent=english('mixedExport');}
 }
 polishIdeas();
 window.dispatchEvent(new CustomEvent('walkrouteviewchange'));
}
function promptKey(id,index){return index===4&&['majer','ormesini','accademia','zattere'].includes(id)?id+'4':null;}
function setTranslated(el,key){if(!el)return;el.setAttribute('data-no-translate','');el.textContent=text(key,P);}
function polishIdeas(){
 for(const card of document.querySelectorAll('#stops > li')){
  const id=card.dataset.id,box=card.querySelector('.photo-prompt'),i=Number(box?.querySelector('.prompt-count')?.textContent.match(/[1-5]/)?.[0]||1)-1,key=promptKey(id,i);if(!key)continue;
  setTranslated(box.querySelector('h4'),key+'.title');setTranslated(box.querySelector('.prompt-text'),key+'.body');
  const tip=box.querySelector('.prompt-tip');tip.setAttribute('data-no-translate','');tip.innerHTML='<b>'+esc(WalkI18n.translate('On your phone'))+'</b> '+esc(text(key+'.phone',P));
 }
 for(const p of stops()){
  const m=markerById.get(p.id),original=m?.getPopup?.()?.getContent?.();if(typeof original!=='string')continue;
  const wrap=document.createElement('div');wrap.innerHTML=original;const box=wrap.querySelector('.popup-prompt'),i=Number(box?.dataset.phoneIdea||1)-1,key=promptKey(p.id,i);
  if(box&&key){setTranslated(box.querySelector('b'),key+'.title');setTranslated(box.querySelector('p:not(.phone-popup-tip)'),key+'.body');const tip=box.querySelector('.phone-popup-tip');if(tip){tip.setAttribute('data-no-translate','');tip.textContent=WalkI18n.translate('On your phone')+': '+text(key+'.phone',P);}}
  if(mode==='main'&&p.id==='accademia'){
   wrap.querySelectorAll('a[href*="/maps/dir/"]').forEach(a=>a.remove());wrap.querySelector('.v11-popup-transfer')?.remove();
   const div=document.createElement('div');div.className='v11-popup-transfer';div.setAttribute('data-no-translate','');div.innerHTML=transferHTML(true);wrap.append(div);
  }
  if(wrap.innerHTML!==original)m.setPopupContent(wrap.innerHTML);
 }
}
const darkPreference=matchMedia('(prefers-color-scheme: dark)'),THEME_KEY='walk-theme-v11';let theme='system';
try{const value=localStorage.getItem(THEME_KEY);if(['system','light','dark'].includes(value))theme=value;}catch{}
const themeLabel=document.createElement('label');themeLabel.htmlFor='walk-theme';themeLabel.className='theme-label';themeLabel.setAttribute('data-no-translate','');
const themeSelect=document.createElement('select');themeSelect.id='walk-theme';themeSelect.setAttribute('data-no-translate','');
const bar=document.querySelector('.walk-language-bar');bar.append(themeLabel,themeSelect);document.body.classList.add('walk-v11');
const fixStyle=document.createElement('style');fixStyle.textContent='.walk-v11[data-walk-theme=dark] #idea-stop-picker{background:#223139;color:#edf1ed;border-color:#51666e}';document.head.append(fixStyle);
// The basemap always keeps its original light style. Only page UI follows the theme.
function applyTheme(){const effective=theme==='system'?(darkPreference.matches?'dark':'light'):theme;document.body.dataset.walkTheme=effective;document.documentElement.style.colorScheme=effective;document.querySelector('meta[name="theme-color"]').content=effective==='dark'?'#142026':'#087d80';themeLabel.textContent=text('theme');themeSelect.innerHTML=['system','light','dark'].map(v=>'<option value="'+v+'">'+esc(text(v))+'</option>').join('');themeSelect.value=theme;themeSelect.setAttribute('aria-label',text('theme'));}
themeSelect.onchange=()=>{theme=themeSelect.value;try{localStorage.setItem(THEME_KEY,theme);}catch{}applyTheme();};darkPreference.addEventListener('change',()=>{if(theme==='system')applyTheme();});
function doganaPriority(){if(mode==='main')markerById.get('dogana')?.getElement?.()?.classList.add('priority-pin');}
function drawTransfer(){
 if(!map)return;if(!transferLayer)transferLayer=L.layerGroup().addTo(map);transferLayer.clearLayers();if(mode!=='main')return;
 // Approximate connections following the canals, split at the required Ferrovia change.
 const first=[[BOARD.lat,BOARD.lon],[45.43310,12.32740],[45.43435,12.32665],[45.43545,12.32755],[45.43580,12.33010],[45.43645,12.33275],[45.43802,12.33565],[45.4394,12.3349],[45.44055,12.3329],[45.44140,12.3307],[45.4421,12.3281],[45.4416,12.3257],[45.4406,12.3241],[CHANGE.lat,CHANGE.lon]];
 const second=[[CHANGE.lat,CHANGE.lon],[45.4406,12.3241],[45.4418,12.3258],[45.4425,12.3257],[45.4435,12.3241],[45.44455,12.3224],[45.4456,12.3207],[LAND.lat,LAND.lon]];
 [first,second].forEach((path,i)=>L.polyline(path,{color:'#479fdd',weight:3,opacity:.9,dashArray:'9 9',walkBoat:true,walkStage:'boat'}).addTo(transferLayer).bindTooltip(text(journeys[i].label)).on('click',()=>window.open(journeys[i].url,'_blank','noopener')));
 for(const [p,k] of [[BOARD,'boarding'],[CHANGE,'interchange'],[LAND,'landing']]){
  const marker=L.marker(xy(p),{title:text(k),walkTransferPoint:p.id,icon:L.divIcon({className:'transit-marker',html:boatIcon,iconSize:[40,40],iconAnchor:[20,20]})}).addTo(transferLayer);
  marker.bindTooltip(text(k)).bindPopup('<div data-no-translate><b>'+esc(text(k))+'</b><p>'+esc(text('transferInfo'))+'</p>'+transitLinks()+'</div>');
 }

}
const baseSchematic=schematic;
schematic=function(){if(mode!=='main'){transferLayer?.clearLayers();return baseSchematic();}routeDistance='';lines?.clearLayers();drawTransfer();updateBadge();};
const baseRender=render;
render=function(...args){const value=baseRender.apply(this,args);decorate();applyTheme();return value;};
const baseMarkers=renderMarkers;
renderMarkers=function(...args){const value=baseMarkers.apply(this,args);polishIdeas();drawTransfer();doganaPriority();return value;};
const baseFocus=focusStop;
focusStop=function(id){baseFocus(id);if(mode==='main'&&['dogana','lucia'].includes(id))requestAnimationFrame(()=>{if(map){const point=stops().find(p=>p.id===id);map.setView(xy(point),17,{animate:false});markerById.get(id)?.openPopup();}});};
const baseCalculate=calculate;
function buildMetrics(packs,phases){const valid=packs.map((data,i)=>validateRoute(data,phases[i]));const b=phases[1].findIndex(p=>p.id==='trearchi');return {sections:valid.map(r=>r.distance),distance:valid.reduce((sum,r)=>sum+r.distance,0),before:valid[0].distance+valid[1].legs.slice(0,b).reduce((sum,l)=>sum+l.distance,0),after:valid[1].legs.slice(b).reduce((sum,l)=>sum+l.distance,0)};}
function paintPhases(packs,phases){lines.clearLayers();let successes=0;for(let k=0;k<2;k++){if(!packs[k])continue;const r=validateRoute(packs[k],phases[k]);successes++;r.legs.forEach((leg,i)=>drawLeg(leg.steps.flatMap(s=>s.geometry.coordinates.map(p=>[p[1],p[0]])),phases[k][i],phases[k][i+1],true));}drawTransfer();return successes;}
calculate=async function(force=false){
 if(mode!=='main'){walkResults=null;networkState='idle';transferLayer?.clearLayers();return baseCalculate(force);}if(!map)return;
 const id=++requestId;if(aborter)aborter.abort();walkResults=null;networkState='loading';schematic();mainStatus('loading');$('refresh').disabled=true;
 const phases=phasePoints(),key='walk-mixed-v13-trearchi-11-main',controller=new AbortController();aborter=controller;let packs=[null,null];
 try{
  if(!force){try{const cached=JSON.parse(localStorage.getItem(key)||'null');if(cached&&Date.now()-cached.at<86400000){buildMetrics(cached.packs,phases);packs=cached.packs;}}catch{}}
  for(let k=0;k<2;k++){
   if(packs[k])continue;await new Promise(r=>setTimeout(r,Math.max(0,1300-(Date.now()-lastRequest))));if(id!==requestId||controller.signal.aborted)return;lastRequest=Date.now();
   const part=new AbortController(),cancel=()=>part.abort();controller.signal.addEventListener('abort',cancel,{once:true});const timer=setTimeout(cancel,20000);
   try{const coords=phases[k].map(p=>p.lon+','+p.lat).join(';');const r=await fetch('https://routing.openstreetmap.de/routed-foot/route/v1/driving/'+coords+'?overview=full&geometries=geojson&steps=true&continue_straight=false',{signal:part.signal,referrerPolicy:'strict-origin-when-cross-origin'});if(!r.ok)throw Error('Routing unavailable');const data=await r.json();validateRoute(data,phases[k]);packs[k]=data;}catch{}finally{clearTimeout(timer);controller.signal.removeEventListener('abort',cancel);}
  }
  if(id!==requestId||mode!=='main')return;
  paintPhases(packs,phases);
  if(packs.every(Boolean)){walkResults=buildMetrics(packs,phases);networkState='ready';routeDistance=(walkResults.distance/1000).toFixed(1);try{localStorage.setItem(key,JSON.stringify({at:Date.now(),packs}));}catch{}mainStatus('ready');}
  else {networkState='partial';mainStatus('partial');}
  updateBadge();renderSun();window.dispatchEvent(new CustomEvent('walkrouteviewchange'));
 }catch{if(id===requestId){networkState='partial';walkResults=null;mainStatus('partial');renderSun();}}
 finally{if(id===requestId)$('refresh').disabled=false;}
};
const baseSun=renderSun;
renderSun=function(){if(mode!=='main'){$('sun-times').removeAttribute('data-no-translate');$('date-help').removeAttribute('data-no-translate');return baseSun();}sunLayer?.clearLayers();$('sun-times').setAttribute('data-no-translate','');$('sun-times').hidden=!eventDate;if(!eventDate){$('date-help').setAttribute('data-no-translate','');$('date-help').textContent=text('chooseDate');return;}
 const p=POINTS.trearchi,s=solarTimes(eventDate,p.lat,p.lon);const dt=new Intl.DateTimeFormat(currentLang()==='zh'?'zh-Hans':currentLang(),{timeZone:'Europe/Rome',year:'numeric',month:'short',day:'numeric'}).format(new Date(eventDate+'T12:00:00Z'));
 $('date-help').setAttribute('data-no-translate','');$('date-help').textContent=dt+' · Europe/Rome';
 const values=[['arriveSun',clock(shift(s.sunset,-25))],['sunset',clock(s.sunset)],['dusk',clock(s.dusk)]];
 if(walkResults){const pauses=Math.max(0,Math.min(240,Number($('pause-minutes').value)||0)),lead=Math.ceil(walkResults.before/4000*60)+pauses+budget()+20+25;values.unshift(['meeting',clock(shift(s.sunset,-lead))]);values.push(['finishTime',clock(shift(s.sunset,5+Math.ceil(walkResults.after/4000*60)+10))]);}
 $('sun-times').innerHTML=values.map(([k,v])=>'<div><small>'+esc(text(k))+'</small><strong>'+v+'</strong></div>').join('')+'<p class="wide small-note">'+esc(text(walkResults?'scheduleNote':'needRoute'))+'</p>';
 if(map&&sunLayer){const a=s.bearing*Math.PI/180,end=[p.lat+Math.cos(a)*420/111320,p.lon+Math.sin(a)*420/(111320*Math.cos(p.lat*Math.PI/180))];L.polyline([xy(p),end],{color:'#e1ab57',weight:2,dashArray:'3 8',interactive:false}).addTo(sunLayer);}
};
document.addEventListener('click',event=>{if(event.target instanceof Element&&event.target.closest('[data-phone-idea]')){polishIdeas();WalkI18n.refresh();}});
window.addEventListener('walklanguagechange',()=>{decorate();applyTheme();drawTransfer();renderSun();if(mode==='main')mainStatus(networkState==='ready'?'ready':networkState==='loading'?'loading':'partial');updateBadge();WalkI18n.refresh();});
let boundMap;const binding=setInterval(()=>{if(map&&map!==boundMap){boundMap=map;map.on('zoomend',()=>requestAnimationFrame(doganaPriority));drawTransfer();doganaPriority();clearInterval(binding);}},200);setTimeout(()=>clearInterval(binding),30000);
window.WalkV11={boatIcon,pointBadge,journeys,transferPoints:()=>[BOARD,CHANGE,LAND],theme:()=>theme,points:phasePoints,transitURL,audit:()=>({mode,stops:stops().map(p=>({id:p.id,n:p.n,lat:p.lat,lon:p.lon})),networkState,walkResults,boatAllowance:budget()}),polish:polishIdeas};
render();if(map){renderMarkers();fitBounds();calculate();}else{mainStatus('partial');}applyTheme();WalkI18n.refresh();
})();