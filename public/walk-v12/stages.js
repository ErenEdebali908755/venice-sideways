/* Presentation-only stage views. The selected route and its stop order never change. */
(() => {
'use strict';
WalkI18n.registerUI(`The detailed vector map is unavailable. Showing the standard map. Google Maps links and all photo ideas remain available.|Ayrıntılı vektör harita kullanılamıyor. Standart harita gösteriliyor. Google Maps bağlantıları ve tüm fotoğraf fikirleri kullanılabilir durumda.|Подробная векторная карта недоступна. Показана стандартная карта. Ссылки Google Maps и все фотоидеи остаются доступны.|La carte vectorielle détaillée est indisponible. La carte standard est affichée. Les liens Google Maps et toutes les idées photo restent accessibles.|详细矢量地图暂不可用，现显示标准地图。Google Maps链接和全部摄影创意仍可使用。|詳細なベクター地図を利用できないため、標準地図を表示しています。Google Mapsリンクとすべての撮影アイデアは引き続き利用できます。|상세 벡터 지도를 사용할 수 없어 기본 지도를 표시합니다. Google Maps 링크와 모든 촬영 아이디어는 계속 이용할 수 있습니다.`);
const $=id=>document.getElementById(id),langs=['en','tr','ru','fr','zh','ja','ko'];
const t=key=>{const values=WalkV11Copy[key];return values?.[Math.max(0,langs.indexOf(WalkI18n.language))]||values?.[0]||key;};
const wrap=document.querySelector('.map-wrap');
const toolbar=document.createElement('div');toolbar.className='walk-stage-toolbar';toolbar.setAttribute('data-no-translate','');
const nav=document.createElement('nav');nav.className='walk-stage-tabs';
const legend=document.createElement('div');legend.className='walk-line-key';
toolbar.append(nav,legend);wrap.prepend(toolbar);
const flow=document.createElement('section');flow.id='walk-route-flow';flow.setAttribute('data-no-translate','');
document.querySelector('.export-box').before(flow);
let stage='all',lastMode=mode,boundMap,queued=false,pendingFit=false;
const colors={walk1:'#087d80',walk2:'#a47434',north:'#a47434',centre:'#087d80',east:'#69578e'};
function sections(){
 const all=stops();
 if(mode==='main'){
  const phases=WalkV11.points();
  return [{id:'walk1',label:'walkOne',info:'walkOneInfo',points:phases[0]},
   {id:'boat',label:'boatStage',info:'boatInfo',points:WalkV11.transferPoints()},
   {id:'walk2',label:'walkTwo',info:'walkTwoInfo',points:phases[1]}];
 }
 return [{id:'north',label:'fullNorth',points:all.slice(0,8)},
  {id:'centre',label:'fullCentre',points:all.slice(7,20)},
  {id:'east',label:'fullEast',points:all.slice(19)}];
}
const currentSection=()=>sections().find(s=>s.id===stage);
function legStage(a,b){return mode==='main'?(b.id==='board'||Number(b.n)<=9?'walk1':'walk2'):(Number(b.n)<=8?'north':Number(b.n)<=20?'centre':'east');}
function setLayerVisible(layer,visible){if(!map)return;if(visible&&!map.hasLayer(layer))map.addLayer(layer);else if(!visible&&map.hasLayer(layer))map.removeLayer(layer);}
const oldDraw=drawLeg;
drawLeg=function(path,a,b,real){
 const old=new Set(lines.getLayers()),key=legStage(a,b);oldDraw(path,a,b,real);
 for(const layer of lines.getLayers())if(!old.has(layer)){
  layer.options.walkStage=key;
  if(real&&layer.options.weight===4.5)layer.setStyle({color:colors[key]||layer.options.color});
 }
 schedule();
};
function visibleIds(){const sec=currentSection();return sec?new Set(sec.points.map(p=>p.id)):new Set(stops().map(p=>p.id));}
function applyVisibility(){
 if(!map)return;const ids=visibleIds(),wide=map.getZoom()<15;
 markerById.forEach((marker,id)=>{setLayerVisible(marker,ids.has(id));
  if(mode==='main'){
   const p=stops().find(s=>s.id===id),pin=marker.getElement?.()?.querySelector('.pin');
   if(pin&&p&&p.id!=='vino'&&p.id!=='trearchi')pin.style.setProperty('--c',p.n<=9?colors.walk1:colors.walk2);
  }
 });
 lines?.eachLayer(layer=>setLayerVisible(layer,stage==='all'||layer.options.walkStage===stage));
 const phases=mode==='main'?WalkV11.points():null;
 const board=phases?.[0].at(-1),land=phases?.[1][0];
 // Transfer layers are owned by the mixed-mode engine; tag without removing them from their group.
 map.eachLayer(group=>{if(!(group instanceof L.LayerGroup)||group===lines||group===markers||group===sunLayer||group===otherMarkers)return;
  group.eachLayer(layer=>{
   if(layer.getElement?.()?.classList.contains('transit-marker')||layer.options.walkTransferPoint){
    const id=layer.options.walkTransferPoint;
    setLayerVisible(layer,mode==='main'&&(stage==='all'||stage==='boat'||(id==='board'&&stage==='walk1')||(id==='land'&&stage==='walk2')));
    const node=layer.getElement?.();if(node&&id==='board')node.classList.add('boarding-label-offset');
   }else if(layer instanceof L.Polyline&&(layer.options.color==='#479fdd'||layer.options.walkBoat)){
    layer.options.walkBoat=true;setLayerVisible(layer,mode==='main'&&(stage==='all'||stage==='boat'));
   }
  });
 });
 sunLayer?.eachLayer(layer=>setLayerVisible(layer,mode==='main'&&(stage==='all'||stage==='walk2')));
 nav.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.stage===stage)));
 const sec=currentSection();
 if(sec){
  $('badge-title').setAttribute('data-no-translate','');$('badge-title').textContent=t(sec.label);
  $('badge-note').setAttribute('data-no-translate','');$('badge-note').textContent=sec.info?t(sec.info):WalkI18n.translate(sec.points[0].name)+' → '+WalkI18n.translate(sec.points.at(-1).name);
 }
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;applyVisibility();});}
fitBounds=function(){
 if(!map)return;
 if(matchMedia('(max-width:900px)').matches&&document.body.dataset.guideView!=='map'){pendingFit=true;return;}
 pendingFit=false;
 const sec=currentSection(),pts=(sec?sec.points:stops()).map(xy);
 if(stage==='boat')pts.push([45.43802,12.33565],[45.43435,12.32665]);
 map.stop();map.closePopup();map.invalidateSize({pan:false});
 map.fitBounds(L.latLngBounds(pts),{paddingTopLeft:[26,110],paddingBottomRight:[38,78],maxZoom:16,animate:false});
};
function chooseStage(value){
 stage=sections().some(s=>s.id===value)?value:'all';
 document.querySelector('.guide-dock [data-guide-view="map"]')?.click();
 updateBadge();renderControls();
 requestAnimationFrame(()=>requestAnimationFrame(()=>{applyVisibility();fitBounds();}));
}
function renderControls(){
 if(mode!==lastMode){lastMode=mode;stage='all';}
 nav.setAttribute('aria-label',t('stageNav'));
 nav.innerHTML=[{id:'all',label:'allView'},...sections()].map(s=>'<button class="btn small" type="button" data-stage="'+s.id+'" aria-pressed="'+(stage===s.id)+'">'+esc(t(s.label))+'</button>').join('');
 nav.querySelectorAll('button').forEach(b=>b.onclick=()=>chooseStage(b.dataset.stage));
 legend.innerHTML='<span><i class="walk-key-solid" aria-hidden="true"></i>'+esc(t('walkSolid'))+'</span>'+(mode==='main'?'<span><i class="walk-key-boat" aria-hidden="true"></i>'+esc(t('boatDashed'))+'</span>':'');
 const groups=sections();
 flow.innerHTML='<h2>'+esc(t('flowTitle'))+'</h2><p class="small-note">'+esc(t('stageHelp'))+'</p>'+groups.map(s=>{
  const info=s.info?t(s.info):s.points[0].name+' → '+s.points.at(-1).name;
  return '<details class="walk-flow-section"'+(mode==='main'?' open':'')+'><summary><strong>'+esc(t(s.label))+'</strong><small>'+esc(info)+'</small></summary><div class="walk-flow-stops">'+s.points.map(p=>'<button class="btn small" type="button" data-flow-stop="'+p.id+'" data-flow-stage="'+s.id+'"><b>'+WalkV11.pointBadge(p)+'</b> '+esc(WalkI18n.translate(p.name))+'</button>').join('')+'</div>'+(s.id==='walk1'?'<p class="small-note">'+esc(t('backToBoard'))+'</p>':'')+'<button class="btn small walk-section-focus" type="button" data-focus-stage="'+s.id+'">'+esc(t('showSection'))+'</button></details>';
 }).join('');
 flow.querySelectorAll('[data-focus-stage]').forEach(b=>b.onclick=()=>chooseStage(b.dataset.focusStage));
 flow.querySelectorAll('[data-flow-stop]').forEach(b=>b.onclick=()=>{
  chooseStage(b.dataset.flowStage);const p=sections().flatMap(s=>s.points).find(x=>x.id===b.dataset.flowStop);
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
   if(!map||!p)return;
   if(markerById.has(p.id)){focusStop(p.id);}else map.setView(xy(p),17,{animate:false});
  }));
 });
 if(mode==='main'){
  const group=WalkV11.points(),parts=group.map(splitRoute);let count=0;
  const footGroup=(label,parts)=>'<div class="walking-parts-group"><strong>'+esc(t(label))+'</strong>'+parts.map(points=>'<a class="btn small" href="'+esc(googleRoute(points))+'" target="_blank" rel="noopener">'+esc(t('walkPart'))+' '+(++count)+' · '+points[0].n+'–'+points.at(-1).n+' ↗</a>').join('')+'</div>';
  const boats='<div class="walking-parts-group boat-parts-group"><strong>'+WalkV11.boatIcon+esc(t('boatStage'))+'</strong>'+WalkV11.journeys.map(j=>'<a class="btn primary small" href="'+esc(j.url)+'" target="_blank" rel="noopener">'+esc(t(j.label))+' ↗</a>').join('')+'</div>';
  $('parts').innerHTML=footGroup('walkOne',parts[0])+boats+footGroup('walkTwo',parts[1]);
 }
 wrap.style.setProperty('--walk-stage-height',toolbar.getBoundingClientRect().height+'px');schedule();
}
const oldBadge=updateBadge;
updateBadge=function(){
 oldBadge();
 if(mode==='main'&&stage==='all'){
  $('badge-title').textContent=WalkI18n.translate('Main Walk')+' · 11'+(routeDistance?' · '+routeDistance+' km':'');
  $('badge-note').textContent=t('boatInfo');
 }
 schedule();
};
document.addEventListener('click',e=>{if(e.target.closest?.('[data-guide-view="map"]'))requestAnimationFrame(()=>requestAnimationFrame(()=>{if(pendingFit)fitBounds();}));});
const oldRender=render;render=function(...args){const out=oldRender.apply(this,args);renderControls();return out;};
const oldMarkers=renderMarkers;renderMarkers=function(...args){const out=oldMarkers.apply(this,args);schedule();return out;};
const oldFocus=focusStop;focusStop=function(id){
 if(stage!=='all'&&!visibleIds().has(id)){stage='all';renderControls();}
 oldFocus(id);schedule();
};
const fitButton=$('fit').onclick;$('fit').onclick=()=>{stage='all';renderControls();fitButton();schedule();};
window.addEventListener('walkrouteviewchange',()=>{renderControls();});
window.addEventListener('walklanguagechange',renderControls);
new ResizeObserver(()=>{wrap.style.setProperty('--walk-stage-height',toolbar.getBoundingClientRect().height+'px');map?.invalidateSize({pan:false});}).observe(toolbar);
const binding=setInterval(()=>{if(map&&boundMap!==map){boundMap=map;map.on('zoomend',schedule);map.on('layeradd',schedule);clearInterval(binding);schedule();}},200);setTimeout(()=>clearInterval(binding),30000);
window.WalkStages={choose:chooseStage,audit:()=>({mode,stage,sections:sections().map(s=>({id:s.id,points:s.points.map(p=>({id:p.id,n:p.n}))}))})};
renderControls();
if(map)calculate();
})();