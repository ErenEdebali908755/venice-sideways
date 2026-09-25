'use strict';
/* A scoped upgrade of the existing field guide. No paid APIs, account keys,
   infrastructure changes, or changes to the personal gallery. */
(() => {
  const $ = id => document.getElementById(id);
  const MAIN = ['lucia','giacomo','frari','margherita','barnaba','trovaso','zattere','accademia','rialto','guglie','majer','ghetto','trearchi','ormesini','vino'];
  ROUTES.main.ids = MAIN;
  ROUTES.main.label = 'Main Walk · 15 stops · Vino Vero';
  ROUTES.main.title = 'Main Walk';
  ROUTES.main.plan = 'An expanded walk through the centre, Dorsoduro and Cannaregio. Pass Majer Ghetto, pause for evening light at Tre Archi and finish at Vino Vero. Allow a half-day as a planning budget, not a measured duration. Choose a few shared pauses rather than stopping the group at every pin.';
  delete ROUTES.main.lead;
  ROUTES.full.label = 'Full 28-Stop Walk · Sant’Elena';
  ROUTES.full.title = 'Full 28-Stop Walk';
  ROUTES.full.plan = 'The complete 28-stop exploration, including Salute, Punta della Dogana, Campo della Tana, Viale Garibaldi and Sant’Elena. This is a broad scouting route, not a short club meetup. It finishes at Sant’Elena; the optional onward walk to Vino Vero adds distance.';
  for (const key of Object.keys(ROUTES)) if (!['main','full'].includes(key)) delete ROUTES[key];
  POINTS.accademia.about = 'The Dorsoduro approach to the Accademia Bridge. The main walk continues towards Rialto; the full walk continues via Santo Stefano. Keep the bridge and steps clear.';
  POINTS.rialto.about = 'A Grand Canal stop at Rialto. Use the marked public approach rather than stopping a group on narrow bridge steps.';
  POINTS.zattere.about = 'The waterfront beside the Giudecca Canal. A suggested breathing space on both walks; it is no longer the end of the main walk.';
  POINTS.elena.about = 'The waterfront and Parco delle Rimembranze at the eastern end of the full walk. Finish here and plan the return journey separately.';
  const baseStops = stops;
  stops = function () {
    return baseStops().map(p => mode === 'main' && p.id === 'rialto' ? {...p, name:'Rialto · northern approach',lat:45.4384,lon:12.33585,query:'45.4384,12.33585',about:'The northern approach by Rialto, on the Cannaregio side of the canal crossing. Continue north towards Guglie; this point avoids an extra stop on the San Polo side.'} : p);
  };
  // Old shared hashes keep working, but never resurrect a removed route option.
  readState = function () {
    const raw = location.hash.slice(1), p = new URLSearchParams(raw), r = p.get('route');
    mode = r === 'full' || ['short','dorsoduro','cannaregio','castello'].includes(r) || raw === 'rialto' ? 'full' : 'main';
    withRialto = false; overview = false;
    eventDate = validDate(p.get('date') || '') ? p.get('date') : '';
  };
  regionalRoute = () => 'full';
  renderOtherMarkers = function () { if (otherMarkers) otherMarkers.clearLayers(); };
  const EXTRA = {
    lucia:['One place, two tempos','Could the station feel both hurried and still? Look for something that stays put while the rest of the scene changes. A willing friend can help; you do not need a stranger’s face.'],
    guglie:['An accidental connection','From the quay, shift slightly until two distant shapes seem connected. Do you prefer the coincidence or the version where they separate? Stay clear of the bridge steps.'],
    ghetto:['Give the context back','Notice a surface detail that interests you. Compare it alone and within its surroundings. What becomes clearer, and what becomes less certain? Respect the square’s religious and memorial spaces.'],
    ormesini:['Let the background interrupt','Choose an ordinary detail, then let its surroundings compete with it. Does the less tidy version feel more like being there? A photograph does not have to be perfectly simplified.'],
    orto:['Let them choose','With a willing friend, let them choose where and how they appear in the public square. What changes when you stop directing the photograph? The empty square is equally valid.'],
    misericordia:['Keep something unresolved','Let part of an ordinary scene remain obscured, soft or outside the frame. Is there anything you would rather suggest than explain? No story is required.'],
    chiodo:['Almost the same tone','From the public quay, look for shapes that nearly blend together. How little contrast can still hold your attention? Do not step onto the private bridge for a different angle.'],
    rialto:['The moment that does not quite fit','Let a moving shape enter only partly at the edge of your frame. Could imperfect timing make the canal feel more alive? Watch a scene rather than following an individual.'],
    giacomo:['Change the mood, keep the frame','From one safe spot, try a brighter and a darker interpretation. Which details can disappear without losing what interested you? Neither version has to be the correct one.'],
    polo:['Borrow one small rule','A friend chooses horizontal or vertical; you choose everything else. Did that tiny constraint help, distract you, or become something to ignore? Changing the rule is allowed.'],
    frari:['A building that refuses to stand straight','Compare a level view with a deliberately tilted one. Which feels closer to your experience of standing beside the building? An unusual angle is an experiment, not an error.'],
    margherita:['Opposite moods, same square','Could this square feel busy and restful without staging anything? Look for either mood, or something that does not fit those words. You can also simply like a colour.'],
    barnaba:['Letters that are not letters','Could an arrangement of ordinary shapes resemble a letter, a symbol or something almost familiar? It does not have to spell anything. Leave objects where they are.'],
    trovaso:['What holds things together?','From the public side, look for a visible join, knot, overlap or repair. Follow the connections rather than the whole boat. The working yard is not part of our route.'],
    zattere:['An honest blur','Could movement describe the water better than sharp detail? When your device allows it, try a softer interpretation and decide what it gains or loses. Stay still and well back from the edge.'],
    dogana:['A photograph with no centre','Let different shapes pull towards opposite edges. Can the picture hold together without one obvious main subject? Water alone is enough if that is what catches your attention.'],
    salute:['Begin with the less obvious format','Try the view in the orientation you would not normally choose. What new relationship appears when the frame changes shape? You need not include the whole basilica.'],
    accademia:['You are allowed to like the postcard','Make the famous view the way you genuinely enjoy it. Originality does not require avoiding something beautiful. Find a place to stop without blocking anyone.'],
    stefano:['The colour you almost ignore','Instead of the brightest accent, notice a quiet relationship between pale or muted colours. Could something barely colourful be enough? Cloudy light counts too.'],
    marco:['Let the crowd belong','Rather than waiting for an empty square, notice spacing, directions and gaps. Could the movement belong in the composition rather than be a distraction? Keep close portraits permission-based.'],
    schiavoni:['Different kinds of time','Look for something still, something drifting and something briefly passing. They might share a photograph or remain separate observations. Stay clear of boarding areas.'],
    arsenale:['What does weight look like?','Could a crop, a safe low viewpoint or a dark area suggest the weight of the architecture without showing the entire gate? Remain outside restricted areas.'],
    tana:['A photograph from a word','Choose a word on a public sign, then respond with a picture of something else. The connection can be loose, personal or playful. Do not photograph passes or personal information.'],
    garibaldi:['A friendly visual coincidence','Look for two ordinary details that briefly seem to agree. Let shapes and objects carry the humour, not a stranger at their expense. Nothing needs to be rearranged.'],
    viale:['Turn the canopy upside down','From a safe stopping place, photograph a pattern above you, then rotate the image afterwards. Does it still read as trees or become something else? Stay on the paths.'],
    giardini:['Curate a tiny exhibition','Outside the ticketed area, choose two ordinary details that might belong beside each other. What makes you want to pair them? The idea needs no pavilion visit or photograph of an artwork.'],
    sette:['The photograph between photographs','Could something here connect two images you made earlier through shape, texture or pace rather than location? A connection only you can see is still a connection.'],
    elena:['The picture you do not take','Notice something you would rather simply remember. You may finish with a photograph, a description, a sketch, or nothing to share. There is nothing to submit.'],
    majer:['Coffee without coffee','What could suggest warmth, a break or an appetite without showing a cup, food or the shop’s name? Let your own association lead. Buying something is not part of the exercise.'],
    trearchi:['An evening without its colours','Compare an evening scene in colour and black and white. Does the atmosphere survive, or does a different photograph emerge? You do not need a clear view of the setting sun.'],
    vino:['A picture you changed your mind about','Revisit a photograph you nearly dismissed earlier. Has the walk changed what you notice in it? Sharing a photograph, explaining it and buying a drink are all optional.']
  };
  const metrics = new Map();
  let freeMode = false, nearby = 'cafes', vectorLayer, gl, vectorReady=false, upgrading=false, unavailable=false, vectorGeneration=0, mapClickBound=false;
  try { freeMode = localStorage.getItem('walk-free-exploration') === '1'; } catch {}
  document.body.classList.add('walk-v7');
  const explore = document.createElement('button');
  explore.className='btn free-toggle'; explore.type='button'; explore.id='explore-freely';
  $('guide-ideas').querySelector('.guide-heading').append(explore);
  function syncFree() {
    document.body.classList.toggle('explore-freely',freeMode);
    explore.textContent=freeMode?'Show photo ideas':'Explore freely · hide suggestions';
    explore.setAttribute('aria-pressed',String(freeMode));
  }
  explore.onclick=()=>{freeMode=!freeMode;try{localStorage.setItem('walk-free-exploration',freeMode?'1':'0');}catch{}syncFree();};
  function decorateCards() {
    const all=stops();
    for(const p of all){
      const card=document.querySelector('#photo-stop-'+p.id),extra=EXTRA[p.id];
      if(!card||!extra||card.querySelector('.extra-prompt'))continue;
      const details=document.createElement('details');details.className='extra-prompt';
      details.innerHTML='<summary>A different direction · new idea</summary><h4>'+esc(extra[0])+'</h4><p>'+esc(extra[1])+'</p>';
      card.querySelector('.photo-prompt').after(details);
    }
    $('guide-route-caption').textContent=ROUTES[mode].title+' · '+all.length+' stops · '+all.length*3+' optional starting points';
    $('rialto-option').hidden=true;
    $('guide-overview').textContent=mode==='main'?'Full walk':'Main walk';
    $('guide-overview').onclick=()=>{changeMode(mode==='main'?'full':'main');document.querySelector('[data-guide-view="map"]').click();};
    syncFree();
  }
  const baseRender=render;
  render=function(){baseRender();decorateCards();};
  const baseChange=changeMode;
  changeMode=function(value){baseChange(value==='full'?'full':'main');};
  // The old renderer's overview button is retained only as a compatibility hook.
  $('all-areas').hidden=true;
  $('all-areas').onclick=()=>changeMode('full');
  const pauseField=document.createElement('div');
  pauseField.className='pause-budget';
  pauseField.innerHTML='<label class="field-label" for="pause-minutes">Photo / coffee pauses before Tre Archi (minutes)</label><input id="pause-minutes" type="number" min="0" max="240" step="5" value="75"><p class="small-note">Start-time estimate = computed walking at 4 km/h + these pauses + 20 minutes of buffer + arrival 25 minutes before sunset.</p>';
  $('date-help').before(pauseField);
  $('pause-minutes').onchange=()=>{const n=Number($('pause-minutes').value);$('pause-minutes').value=Number.isFinite(n)?Math.max(0,Math.min(240,n)):75;renderSun();};
  renderSun=function(){
    if(sunLayer)sunLayer.clearLayers();
    $('sun-times').hidden=!eventDate||mode!=='main';
    if(!eventDate){$('date-help').textContent='Choose your event date. No date is assumed.';return;}
    if(mode!=='main')return;
    const p=POINTS.trearchi,s=solarTimes(eventDate,p.lat,p.lon),m=metrics.get(mode);
    const label=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Rome',weekday:'short',day:'numeric',month:'short',year:'numeric'}).format(new Date(eventDate+'T12:00:00Z'));
    $('date-help').textContent=label+' · Venice local time (Europe/Rome). Astronomical estimate, not a weather forecast.';
    let values=[['At Tre Archi by',clock(shift(s.sunset,-25))],['Approx. sunset',clock(s.sunset)],['Civil twilight ends',clock(s.dusk)]];
    if(m){const at=stops().findIndex(x=>x.id==='trearchi'),before=m.legs.slice(0,at).reduce((a,x)=>a+x.distance,0),after=m.legs.slice(at).reduce((a,x)=>a+x.distance,0),pauses=Number($('pause-minutes').value)||0;
      const lead=Math.ceil(before/4000*60)+pauses+20+25;
      values.unshift(['Suggested meeting',clock(shift(s.sunset,-lead))]);
      values.push(['Vino Vero · allow until',clock(shift(s.sunset,5+Math.ceil(after/4000*60)+10))]);
    }
    $('sun-times').innerHTML=values.map(v=>'<div><small>'+v[0]+'</small><strong>'+v[1]+'</strong></div>').join('')+(!m?'<p class="wide small-note">A meeting time will appear after a valid street route has loaded. We do not reuse the old short-walk schedule.</p>':'')+'<p class="wide small-note">Sun direction: '+Math.round(s.bearing)+'° clockwise from north. After the sunset pause, leave about '+clock(shift(s.sunset,5))+'.</p>';
    if(map&&sunLayer){const a=s.bearing*Math.PI/180,end=[p.lat+Math.cos(a)*420/111320,p.lon+Math.sin(a)*420/(111320*Math.cos(p.lat*Math.PI/180))];L.polyline([xy(p),end],{color:'#a76721',weight:2,dashArray:'4 8',interactive:false}).addTo(sunLayer);}
  };
  const baseShowRoute=showRoute;
  showRoute=function(data){baseShowRoute(data);metrics.set(mode,data.routes[0]);renderSun();};
  // New main-route coordinates invalidate the old seven-stop cache.
  // The original validator rejects cached routes whose leg count no longer matches.
  const baseMarkers=renderMarkers;
  renderMarkers=function(){baseMarkers();tuneMarkers();};
  function tuneMarkers(){if(!map)return;const all=stops(),last=all.at(-1).id,wide=map.getZoom()<15;
    document.body.classList.toggle('map-wide',wide);
    markerById.forEach((marker,id)=>{const node=marker.getElement?.();if(node)node.classList.toggle('priority-pin',id===all[0].id||id===last||id==='trearchi');});
  }
  const controls=document.createElement('div');controls.className='nearby-controls';
  controls.innerHTML='<label for="nearby-kind">Nearby places</label><select id="nearby-kind" aria-describedby="nearby-hint"><option value="cafes">Coffee & food</option><option value="shops">Shops</option><option value="essentials">Useful places</option><option value="all">All mapped places</option><option value="none">Hide places</option></select><small id="nearby-hint">Zoom in for place names.</small>';
  document.querySelector('.map-wrap').append(controls);
  const sheet=document.createElement('section');sheet.id='place-sheet';sheet.hidden=true;sheet.setAttribute('aria-label','Mapped place details');sheet.innerHTML='<button id="close-place" class="btn small" type="button" aria-label="Close place details">Close ×</button><div id="place-details"></div>';
  document.querySelector('.map-wrap').append(sheet);
  $('close-place').onclick=()=>{sheet.hidden=true;$('nearby-kind').focus({preventScroll:true});};
  document.addEventListener('keydown',e=>{if(e.key==='Escape')sheet.hidden=true;});
  const nameExpression=['coalesce',['get','name:en'],['get','name:latin'],['get','name'],''];
  function poiFilter(){
    const categories={cafes:['cafe','restaurant','fast_food','bakery','bar','pub','ice_cream','food','drink'],shops:['shop','grocery','supermarket','convenience','clothes','books','gift'],essentials:['toilets','drinking_water','pharmacy','atm','hospital','information']};
    const base=['!=',nameExpression,''];
    return nearby==='all'?base:['all',base,['any',['in',['get','class'],['literal',categories[nearby]||[]]],['in',['get','subclass'],['literal',categories[nearby]||[]]]]];
  }
  $('nearby-kind').onchange=()=>{nearby=$('nearby-kind').value;sheet.hidden=true;applyPlaces();};
  function applyPlaces(){
    if(!gl||!vectorReady)return;
    const visible=nearby!=='none';
    for(const id of ['walk-nearby'])if(gl.getLayer(id)){gl.setLayoutProperty(id,'visibility',visible?'visible':'none');if(visible)gl.setFilter(id,poiFilter());}
    $('nearby-hint').textContent=!visible?'Place labels hidden.':gl.getZoom()<16?'Zoom in for place names.':'Tap a place name for details. Not every business is mapped.';
  }
  function showPlace(feature){
    const p=feature.properties||{},coords=feature.geometry?.coordinates;if(!Array.isArray(coords)||!Number.isFinite(coords[0])||!Number.isFinite(coords[1]))return;
    const name=String(p['name:en']||p['name:latin']||p.name||'Mapped place').slice(0,180),type=String(p.subclass||p.class||'Place').replace(/_/g,' ').slice(0,80);
    const u='https://www.google.com/maps/search/?'+new URLSearchParams({api:'1',query:name+', Venice, Italy'});
    const pin='https://www.google.com/maps/search/?'+new URLSearchParams({api:'1',query:coords[1]+','+coords[0]});
    $('place-details').innerHTML='<div class="eyebrow">NEARBY PLACE · NOT AN EXTRA STOP</div><h3>'+esc(name)+'</h3><p>'+esc(type)+'</p><p class="small-note">From OpenStreetMap. Listings may be incomplete or outdated; no live opening hours or ratings are shown.</p><div class="stop-actions"><a class="btn primary small" href="'+esc(u)+'" target="_blank" rel="noopener">Look up in Google Maps ↗</a><a class="btn small" href="'+esc(pin)+'" target="_blank" rel="noopener">Exact mapped point ↗</a></div>';
    sheet.hidden=false;
  }
  function loadScript(url){return new Promise((resolve,reject)=>{const s=document.createElement('script'),t=setTimeout(()=>{s.remove();reject(Error('Script timed out'));},14000);s.src=url;s.crossOrigin='anonymous';s.onload=()=>{clearTimeout(t);resolve();};s.onerror=()=>{clearTimeout(t);s.remove();reject(Error('Script unavailable'));};document.head.append(s);});}
  function loadCSS(url){const link=document.createElement('link');link.rel='stylesheet';link.href=url;link.onerror=()=>{link.onerror=null;link.href=url.replace('https://cdn.jsdelivr.net/npm/','https://unpkg.com/');};document.head.append(link);}
  async function scriptWithFallback(path){for(const host of ['https://cdn.jsdelivr.net/npm/','https://unpkg.com/']){try{await loadScript(host+path);return;}catch{}}throw Error('Map dependency unavailable');}
  function restoreRaster(message){
    if(vectorLayer&&map?.hasLayer(vectorLayer))map.removeLayer(vectorLayer);
    vectorLayer=null;gl=null;vectorReady=false;unavailable=true;
    if(map&&tileLayer&&!map.hasLayer(tileLayer))tileLayer.addTo(map);
    $('nearby-kind').disabled=true;$('nearby-hint').textContent='Simple-map fallback: place filtering is unavailable.';
    $('map-error').textContent=message+' Google Maps links and all photo ideas remain available.';$('map-error').hidden=false;
  }
  async function upgradeMap(){
    if(!map||upgrading||vectorReady||unavailable)return;upgrading=true;const generation=++vectorGeneration;
    try{
      loadCSS('https://cdn.jsdelivr.net/npm/maplibre-gl@5.24.0/dist/maplibre-gl.css');
      await scriptWithFallback('maplibre-gl@5.24.0/dist/maplibre-gl.js');
      await scriptWithFallback('@maplibre/maplibre-gl-leaflet@0.1.3/leaflet-maplibre-gl.js');
      if(!L.maplibreGL)throw Error('Map adapter unavailable');
      const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),15000);
      let style;try{const r=await fetch('https://tiles.openfreemap.org/styles/positron',{signal:ctl.signal});if(!r.ok)throw Error('Style unavailable');style=await r.json();}finally{clearTimeout(t);}
      if(style.version!==8||!Array.isArray(style.layers))throw Error('Unexpected style');
      const source=Object.keys(style.sources||{}).find(k=>style.sources[k].type==='vector');if(!source)throw Error('No vector source');
      const font=style.layers.find(l=>Array.isArray(l.layout?.['text-font']))?.layout['text-font']||['Noto Sans Regular'];
      for(const layer of style.layers){
        if(layer.type==='symbol'&&JSON.stringify(layer.layout?.['text-field']||'').includes('name'))layer.layout['text-field']=nameExpression;
        if(layer.type==='fill'&&/water/.test(layer.id)){layer.paint=layer.paint||{};layer.paint['fill-color']='#c2dade';}
        if(layer.type==='fill'&&/building/.test(layer.id)){layer.paint=layer.paint||{};layer.paint['fill-color']='#e5dfd4';}
      }
      style.layers.push({id:'walk-nearby',type:'symbol',source,'source-layer':'poi',minzoom:16,filter:poiFilter(),layout:{'text-field':['concat','· ',nameExpression],'text-font':font,'text-size':['interpolate',['linear'],['zoom'],16,11,19,13],'text-max-width':11,'text-padding':14,'text-allow-overlap':false,'text-ignore-placement':false,'symbol-sort-key':['to-number',['get','rank'],100]},paint:{'text-color':'#667365','text-halo-color':'#fffdf6','text-halo-width':1.6}});
      vectorLayer=L.maplibreGL({style,interactive:false,attribution:'<a href="https://openfreemap.org/" target="_blank" rel="noopener">OpenFreeMap</a> © <a href="https://openmaptiles.org/" target="_blank" rel="noopener">OpenMapTiles</a> · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'}).addTo(map);
      vectorLayer.getContainer().style.opacity='0';
      gl=vectorLayer.getMaplibreMap();
      const deadline=setTimeout(()=>{if(!vectorReady&&generation===vectorGeneration)restoreRaster('The detailed vector map did not load. Showing the standard map.');},25000);
      gl.once('load',()=>{clearTimeout(deadline);if(!vectorLayer||generation!==vectorGeneration)return;vectorReady=true;unavailable=false;vectorLayer.getContainer().style.opacity='1';if(tileLayer&&map.hasLayer(tileLayer))map.removeLayer(tileLayer);$('map-error').hidden=true;$('nearby-kind').disabled=false;applyPlaces();});
      gl.on('webglcontextlost',()=>{if(generation===vectorGeneration)restoreRaster('Your browser lost the detailed map display. Showing the standard map.');});
      if(!mapClickBound){mapClickBound=true;map.on('click',e=>{if(!vectorReady||nearby==='none'||!gl||gl.getZoom()<16||!gl.getLayer('walk-nearby'))return;const pt=gl.project([e.latlng.lng,e.latlng.lat]),hits=gl.queryRenderedFeatures([[pt.x-5,pt.y-5],[pt.x+5,pt.y+5]],{layers:['walk-nearby']});if(hits.length)showPlace(hits[0]);});}
    }catch{restoreRaster('The detailed vector map is unavailable. Showing the standard map.');}
    finally{upgrading=false;}
  }
  // The original Leaflet loader may finish before or after this enhancement.
  let checks=0;
  const wait=setInterval(()=>{
    if(map){clearInterval(wait);map.on('zoomend',()=>{tuneMarkers();applyPlaces();});map.on('movestart',()=>{sheet.hidden=true;});tuneMarkers();upgradeMap();}
    else if(++checks>100){clearInterval(wait);$('nearby-kind').disabled=true;$('nearby-hint').textContent='Map unavailable. Use the Google Maps links.';}
  },200);
  readState();render();if(map){renderMarkers();fitBounds();calculate();}
  // Retry button also offers recovery if the keyless basemap was temporarily down.
  const oldRetry=$('refresh').onclick;
  $('refresh').onclick=()=>{oldRetry();if(unavailable){unavailable=false;upgradeMap();}};
})();
