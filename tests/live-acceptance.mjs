/* Read-only release acceptance. Run only after the root release gate confirms that
   deployed event GETs contain the reviewed read-only fix. No production fixtures,
   credentials, registrations, publication, or content writes are used. */
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';

const target='https://venicesideways.com';
const locales=['en','tr','it','fr','ru','zh','ja','ko'];
const draftSlug='main-walk-2026-10-11';
const plan={target, cases:32, languages:locales, widths:[390,1440], routes:['main','full'],
  reads:['cold public pages','real provider style/tiles','route and event projections','owned public photo derivatives','draft event QR target'],
  interactions:['native mobile map tools','3D and 2D','fit route and return to active stop','manual gallery','browser Back','Escape and focus','native browser geolocation denial'],
  performance:'Observed startup requests, JS/image wire transfer and cache flags, gallery derivative loading, and any LCP entry; headless Chrome desktop lab, with no speed threshold or physical-mobile claim.',
  writes:'All browser methods except GET/HEAD are aborted; no form is filled or submitted.',
  gates:['SIDEWAYS_LIVE_ACCEPTANCE=approved-read-only','SIDEWAYS_EVENT_GET_VERIFIED_READ_ONLY=1'],
  limitation:'Physical-device location, battery use, and protected admin/media rights revocation require separate acceptance.'};
if(process.argv.includes('--describe')) {console.log(JSON.stringify(plan,null,2));process.exit(0)}
if(process.env.SIDEWAYS_LIVE_ACCEPTANCE!=='approved-read-only'||process.env.SIDEWAYS_EVENT_GET_VERIFIED_READ_ONLY!=='1') {
  console.error('Live acceptance is gated. Use --describe to inspect the read-only plan.');process.exit(2);
}
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const {routes:expectedRoutes}=JSON.parse(await readFile(resolve(root,'public/field-guide/routes.json'),'utf8'));
const {ILLUSTRATIONS}=await import('../public/field-guide/illustrations.js');
const approvedArtKeys=new Set(ILLUSTRATIONS.filter(art=>art.approved&&!art.humanSpecificReviewRequired).map(art=>art.key));
const stamp=new Date().toISOString().replace(/[:.]/g,'-');
const output=resolve(process.env.SIDEWAYS_ACCEPTANCE_OUTPUT || resolve(root,'../kit04-20261006/visitor-live','live-'+stamp));
await mkdir(output,{recursive:true});
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/Users/erenedebali/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
let checks=0;const issues=[],cases=[],methodsBlocked=[],cspFailures=[],networkFailures=[],applicationErrors=[],photoGETs=new Set(),providerGETs=new Set();
const check=(ok,label)=>{checks++;if(!ok)issues.push(label)};
const publicResource=value=>{try{const u=new URL(value);return {origin:u.origin,path:u.origin===target?u.pathname:undefined}}catch{return {origin:'unknown'}}};

// These test-only wrappers observe the actual constructor and native permission
// failure. They do not replace the map, provider responses, or device fixes.
function observe() {
  window.__acceptanceMaps=[];window.__acceptanceGPSStarts=0;window.__acceptanceCSP=[];
  window.__acceptanceLCP={supported:false,entry:null};
  try {
    if(PerformanceObserver.supportedEntryTypes.includes('largest-contentful-paint')) {
      window.__acceptanceLCP.supported=true;
      new PerformanceObserver(list=>{const entry=list.getEntries().at(-1);if(entry)window.__acceptanceLCP.entry={startTimeMs:entry.startTime,renderTimeMs:entry.renderTime,loadTimeMs:entry.loadTime,size:entry.size,element:entry.element?.tagName||null};}).observe({type:'largest-contentful-paint',buffered:true});
    }
  }catch{}
  let native,proxy;const constructors=new WeakMap();
  Object.defineProperty(window,'maplibregl',{configurable:true,get:()=>proxy,set:value=>{
    native=value;proxy=new Proxy(native,{get(object,key,receiver){
      const member=Reflect.get(object,key,receiver);
      if(key!=='Map'||typeof member!=='function')return member;
      if(!constructors.has(member))constructors.set(member,new Proxy(member,{construct(ctor,args,newTarget){
        const map=Reflect.construct(ctor,args,newTarget);window.__acceptanceMaps.push(map);return map;
      }}));return constructors.get(member);
    }});
  }});
  const geo=navigator.geolocation,watch=geo?.watchPosition?.bind(geo);
  if(watch)Object.defineProperty(geo,'watchPosition',{configurable:true,value:(...args)=>{window.__acceptanceGPSStarts++;return watch(...args)}});
  addEventListener('securitypolicyviolation',event=>{
    let origin='inline';try{origin=new URL(event.blockedURI).origin}catch{}
    window.__acceptanceCSP.push({directive:event.effectiveDirective,origin});
  });
}
async function newPage(language,width,height) {
  const context=await browser.newContext({viewport:{width,height},colorScheme:'light',locale:language});
  await context.addInitScript(observe);
  await context.route('**/*',async route=>{
    const request=route.request(),method=request.method();
    if(!['GET','HEAD'].includes(method)) {methodsBlocked.push({method,...publicResource(request.url())});await route.abort();return}
    const u=new URL(request.url());
    if(u.origin===target&&[...u.searchParams.keys()].some(key=>/^(lat|latitude|lng|lon|longitude|accuracy|coords|position)$/i.test(key))) {
      issues.push('Application request contains a device-position query field');await route.abort();return;
    }
    await route.continue();
  });
  const page=await context.newPage();page.setDefaultTimeout(12000);
  const requests=[],wire=new Map();
  page.on('request',request=>{
    const u=new URL(request.url());
    requests.push({type:request.resourceType(),photo:u.hostname==='erenedebali.com'&&/^\/image\/(3|6|18)\/(thumb|web)$/.test(u.pathname)?u.pathname:null});
  });
  page.on('pageerror',()=>applicationErrors.push({language,width}));
  page.on('requestfailed',request=>networkFailures.push({type:request.resourceType(),...publicResource(request.url()),errorText:request.failure()?.errorText?.slice(0,200)}));
  page.on('response',response=>{
    const u=new URL(response.url());
    if(u.hostname==='erenedebali.com'&&/^\/image\/(3|6|18)\/(thumb|web)$/.test(u.pathname)&&response.request().method()==='GET'&&response.ok())photoGETs.add(u.pathname);
    if(u.hostname==='tiles.openfreemap.org'&&response.ok())providerGETs.add(u.pathname.includes('/styles/')?'style':u.pathname.endsWith('.pbf')?'tile':'provider-resource');
  });
  // Scope denial to the fresh browser context: never acquire a physical location.
  const session=await context.newCDPSession(page);const {targetInfo}=await session.send('Target.getTargetInfo');
  await session.send('Browser.setPermission',{permission:{name:'geolocation'},setting:'denied',origin:target,browserContextId:targetInfo.browserContextId});
  await session.send('Network.enable');
  session.on('Network.responseReceived',event=>{
    const previous=wire.get(event.requestId)||{};
    wire.set(event.requestId,{...previous,type:event.type,diskCache:!!event.response.fromDiskCache,serviceWorker:!!event.response.fromServiceWorker,prefetchCache:!!event.response.fromPrefetchCache});
  });
  session.on('Network.requestServedFromCache',event=>{wire.set(event.requestId,{...wire.get(event.requestId),browserCache:true})});
  session.on('Network.loadingFinished',event=>{wire.set(event.requestId,{...wire.get(event.requestId),encodedTransferBytes:event.encodedDataLength})});
  const measurements={snapshot:async()=>{
    const observed=Object.fromEntries([...new Set(requests.map(r=>r.type))].sort().map(type=>[type,requests.filter(r=>r.type===type).length]));
    const entries=[...wire.values()];
    const summary=rows=>({responses:rows.length,completedWithByteCount:rows.filter(r=>Number.isFinite(r.encodedTransferBytes)).length,
      encodedTransferBytes:rows.reduce((sum,r)=>sum+(Number.isFinite(r.encodedTransferBytes)?r.encodedTransferBytes:0),0),
      browserCacheObserved:rows.filter(r=>r.browserCache).length,diskCacheObserved:rows.filter(r=>r.diskCache).length,
      serviceWorkerObserved:rows.filter(r=>r.serviceWorker).length,prefetchCacheObserved:rows.filter(r=>r.prefetchCache).length});
    const timing=await page.evaluate(()=>{
      const entries=performance.getEntriesByType('resource');
      const group=type=>entries.filter(entry=>type==='js'?entry.initiatorType==='script':entry.initiatorType==='img');
      const summary=rows=>({entries:rows.length,reportedTransferBytes:rows.reduce((sum,row)=>sum+row.transferSize,0),reportedEncodedBodyBytes:rows.reduce((sum,row)=>sum+row.encodedBodySize,0),
        zeroTransferWithDecodedBody:rows.filter(row=>row.transferSize===0&&row.decodedBodySize>0).length,
        zeroSizesUnknown:rows.filter(row=>row.transferSize===0&&row.encodedBodySize===0&&row.decodedBodySize===0).length});
      return {js:summary(group('js')),images:summary(group('images')),lcp:window.__acceptanceLCP};
    });
    return {pageObservedRequests:requests.length,byResourceType:observed,wire:{all:summary(entries),js:summary(entries.filter(r=>r.type==='Script')),images:summary(entries.filter(r=>r.type==='Image'))},
      resourceTiming:timing,galleryDerivativeRequests:Object.fromEntries([...new Set(requests.map(r=>r.photo).filter(Boolean))].sort().map(path=>[path,requests.filter(r=>r.photo===path).length])),
      scope:'Headless Chrome desktop lab. Page-observed requests and CDP completed-response byte counts are observations, not a physical-device or full-provider timing guarantee. ResourceTiming cross-origin zero sizes may be restricted or unavailable; zero-transfer decoded bodies suggest reuse but cache flags are reported separately. No original/private image URL is probed.'};
  }};
  return {page,context,measurements};
}
async function mapReady(page) {
  await page.waitForFunction(()=>window.__acceptanceMaps?.length===1&&window.__acceptanceMaps[0].getSource('fg-route'));
  await page.waitForFunction(()=>!document.querySelector('[data-action="location"]')?.disabled);
  await page.waitForFunction(()=>window.__acceptanceMaps[0].loaded(),null,{timeout:25000});
  await page.waitForFunction(()=>!window.__acceptanceMaps[0].isMoving());
}
async function mapControls(page,label,width) {
  const active=await page.locator('.fg-pin').getAttribute('data-visit-key');
  async function control(action) {
    const button=page.locator(`[data-action="${action}"]`);
    if(!await button.isVisible())await page.locator('.fg-map-options > summary').click();
    check(await button.isVisible()&&await button.isEnabled(),label+': map '+action+' control is reachable');
    return button;
  }
  await (await control('dimension')).click();
  await page.waitForFunction(()=>document.querySelector('[data-action="dimension"]')?.getAttribute('aria-pressed')==='true'&&__acceptanceMaps[0].getPitch()>=49);
  check(await page.evaluate(()=>__acceptanceMaps.length===1&&__acceptanceGPSStarts===0&&document.querySelectorAll('.fg-pin').length===1),label+': 3D keeps one map, active pin and zero GPS');
  await (await control('dimension')).click();
  await page.waitForFunction(()=>document.querySelector('[data-action="dimension"]')?.getAttribute('aria-pressed')==='false'&&__acceptanceMaps[0].getPitch()<0.1);
  check(await page.evaluate(()=>__acceptanceMaps[0].getLayoutProperty('fg-landmark-overview','visibility')==='visible'&&__acceptanceMaps[0].getLayoutProperty('fg-landmark-detail','visibility')==='visible'),label+': 2D restores illustrated landmark layers');
  await (await control('fit')).click();
  await page.waitForFunction(()=>!__acceptanceMaps[0].isMoving());
  check(await page.evaluate(active=>__acceptanceMaps.length===1&&__acceptanceGPSStarts===0&&__acceptanceMaps[0].getZoom()<=16.01&&document.querySelectorAll('.fg-pin').length===1&&document.querySelector('.fg-pin')?.dataset.visitKey===active,active),label+': fit frames route without showing hidden stops');
  await (await control('focus')).click();
  await page.waitForFunction(()=>!__acceptanceMaps[0].isMoving()&&__acceptanceMaps[0].getZoom()>=16.4);
  check(await page.locator('.fg-pin').getAttribute('data-visit-key')===active&&await page.locator('.fg-pin').count()===1,label+': focus returns to the same active stop');
  if(width<=900) {
    const options=page.locator('.fg-map-options');
    if(await options.getAttribute('open')!==null)await options.locator('summary').click();
    check(await options.getAttribute('open')===null,label+': native mobile map tools close');
  }
}
async function facts(page) {
  return page.evaluate(async()=>{
    const map=window.__acceptanceMaps[0],style=map.getStyle();
    const source=async id=>{
      const value=map.getSource(id);
      if(!value||typeof value.getData!=='function')throw Error('Required public GeoJSON getData unavailable: '+id);
      return await value.getData();
    };
    const gardenData=await source('fg-gardens'),landmarkData=await source('fg-landmarks');
    const gardens=typeof gardenData==='string'?await (await fetch(gardenData,{credentials:'omit'})).json():gardenData;
    return {maps:__acceptanceMaps.length,gps:__acceptanceGPSStarts,
      paper:getComputedStyle(document.querySelector('#field-guide')).backgroundColor,
      language:document.querySelector('#field-guide').lang,
      watercolor:style.metadata?.['venice-sideways:base'],vector:style.sources.openmaptiles?.type,
      layers:['fg-garden-wash','fg-garden-grain','fg-garden-label','fg-landmark-overview','fg-landmark-detail','fg-landmark-active','fg-landmark-tether','fg-directions'].map(id=>!!map.getLayer(id)),
      landmarks:landmarkData?.features?.map(f=>f.properties.key).sort(),
      artAnchors:landmarkData?.features?.map(f=>({key:f.properties.key,visitKey:f.properties.visitKey,active:f.properties.active,coordinates:f.geometry.coordinates})),
      mapSize:{width:map.getContainer().clientWidth,height:map.getContainer().clientHeight},
      gardens:gardens?.features?.map(f=>({id:String(f.properties.osmWayId),type:f.geometry.type,vertices:f.geometry.coordinates[0].length})),
      routeFeatures:(await source('fg-route'))?.features?.map(f=>({boat:f.properties.boat,vertices:f.geometry.coordinates.length})),
      pins:document.querySelectorAll('.fg-pin').length,boats:document.querySelectorAll('.fg-pin-boat').length,
      steps:document.querySelectorAll('[data-step]').length,visits:document.querySelectorAll('.fg-stop-list [data-inspect]').length,
      active:document.querySelector('[data-step][aria-current="step"]')?.dataset.step,
      overflow:document.documentElement.scrollWidth>innerWidth+1,
    };
  });
}
async function gallery(page,label,measurements) {
  // A native stop selection starts its focus animation. Capture the baseline
  // only after the real camera settles; opening a dialog during an animation
  // intentionally freezes it at the later click position, not an earlier frame.
  await page.waitForFunction(()=>!__acceptanceMaps[0].isMoving());
  const beforeOpen=await measurements.snapshot();
  const initial=await page.evaluate(()=>{
    const map=__acceptanceMaps[0];return {active:document.querySelector('[data-step][aria-current="step"]')?.dataset.step,
      camera:JSON.stringify({center:map.getCenter(),zoom:map.getZoom(),bearing:map.getBearing(),pitch:map.getPitch()})};
  });
  await page.locator('.fg-stop-list [data-inspect]').last().click();
  check(await page.locator('.fg-dialog[open]').count()===1,label+': one detail dialog');
  check(await page.locator('.fg-dialog article').count()===5,label+': five reviewed photo ideas');
  const thumbnails=page.locator('.fg-thumbnails [data-photo-id]');
  check(await thumbnails.count()>0,label+': manual gallery is available');
  const reference=await page.locator('[data-photo-id="reference-eren-3"]').count()>0;
  await page.waitForFunction(()=>{const image=document.querySelector('.fg-gallery-stage img');return image?.complete&&image.naturalWidth>0});
  const afterOpen=await measurements.snapshot();
  if(reference){
    check(await thumbnails.count()===3,label+': three owned temporary photographs');
    check(await page.locator('.fg-reference-note').isVisible(),label+': temporary relation warning');
    for(const id of [3,6,18]) {
      await page.locator(`[data-photo-id="reference-eren-${id}"]`).click();
      await page.waitForFunction(()=>{const image=document.querySelector('.fg-gallery-stage img');return image?.complete&&image.naturalWidth>0});
      check(await page.locator('.fg-gallery-stage img').evaluate(img=>getComputedStyle(img).filter==='none'&&getComputedStyle(img).objectFit==='contain'&&img.naturalHeight>img.naturalWidth),label+': actual portrait full frame '+id);
    }
  }
  await page.locator('[data-open-photo]').click();
  check(await page.locator('.fg-dialog.fg-lightbox[open]').count()===1,label+': lightbox');
  const photo=await page.locator('[data-photo-id][aria-pressed="true"]').getAttribute('data-photo-id');
  if(await thumbnails.count()>1){await page.keyboard.press('ArrowRight');check(await page.locator('[data-photo-id][aria-pressed="true"]').getAttribute('data-photo-id')!==photo,label+': manual next')}
  await page.goBack();await page.waitForFunction(()=>document.querySelector('.fg-dialog')?.open&&!document.querySelector('.fg-dialog').classList.contains('fg-lightbox'));
  check(await page.locator('.fg-dialog[open]').count()===1,label+': Back returns to detail');
  await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('.fg-dialog')?.open);
  check(await page.evaluate(()=>document.activeElement?.hasAttribute('data-inspect')),label+': focus restored');
  // A real native scroll must not be inherited by a fresh opening. The sticky
  // close button previously covered the title after closing a scrolled gallery.
  const reopen=page.locator('.fg-stop-list [data-inspect]').last();
  await reopen.click();
  await page.locator('.fg-dialog').hover();await page.mouse.wheel(0,88);
  await page.waitForFunction(()=>document.querySelector('.fg-dialog').scrollTop>0);
  const scrolledBeforeClose=await page.locator('.fg-dialog').evaluate(dialog=>dialog.scrollTop);
  await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('.fg-dialog')?.open);
  await reopen.click();
  const reopenedLayout=await page.locator('.fg-dialog').evaluate(dialog=>({scrollTop:dialog.scrollTop,
    titleTop:dialog.querySelector('h1').getBoundingClientRect().top,
    closeBottom:dialog.querySelector('.fg-close').getBoundingClientRect().bottom}));
  check(reopenedLayout.scrollTop===0,label+': fresh dialog opening clears previous native scroll');
  check(reopenedLayout.titleTop>=reopenedLayout.closeBottom,label+': reopened title is clear of sticky close button');
  await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('.fg-dialog')?.open);
  const after=await page.evaluate(()=>{
    const map=__acceptanceMaps[0];return {active:document.querySelector('[data-step][aria-current="step"]')?.dataset.step,
      camera:JSON.stringify({center:map.getCenter(),zoom:map.getZoom(),bearing:map.getBearing(),pitch:map.getPitch()}),isMoving:map.isMoving()};
  });
  const exactCameraPreserved=after.active===initial.active&&after.camera===initial.camera;
  check(exactCameraPreserved,label+': inspecting preserves walk and camera');
  return {beforeOpen,afterOpen,afterManualSelection:await measurements.snapshot(),dialogReopen:{scrolledBeforeClose,...reopenedLayout},walkCamera:{baseline:initial,after,exactCameraPreserved}};
}
const unavailable={en:'This event is unavailable.',tr:'Bu etkinlik şu an kullanılamıyor.',it:'Evento non disponibile.',fr:'Événement indisponible.',ru:'Событие недоступно.',zh:'此活动暂不可用。',ja:'イベントを表示できません。',ko:'행사를 이용할 수 없습니다.'};
try {
  for(const language of locales)for(const [width,height] of [[390,844],[1440,900]])for(const routeKey of ['main','full']) {
    const {page,context,measurements}=await newPage(language,width,height);const label=`${language}/${width}/${routeKey}`,record={language,width,routeKey,phase:'cold-page'};
    try {
      const response=await page.goto(`${target}/?lang=${language}#route=${routeKey}`,{waitUntil:'domcontentloaded',timeout:30000});
      check(response?.status()===200,label+': cold page');
      check(/geolocation=\(self\)/.test(response?.headers()['permissions-policy']||''),label+': own-origin permission policy');
      record.phase='actual-map-ready';await mapReady(page);
      check(await page.locator('.fg-offline-banner').count()===0&&await page.locator('.fg-bundled-notice').count()===0,label+': catalogue-checked normal route loaded without user-selected recovery mode');
      record.startup=await measurements.snapshot();
      record.phase='native-map-controls';await mapControls(page,label,width);
      record.phase='public-geojson-facts';await page.locator('[data-action="list"]').click();const state=await facts(page);
      record.facts=state;check(state.language===language,label+': selected language');check(state.paper==='rgb(244, 242, 237)',label+': neutral paper');
      check(state.maps===1&&state.gps===0,label+': one map and zero initial GPS');
      check(state.watercolor==='https://tiles.openfreemap.org/styles/positron'&&state.vector==='vector'&&state.layers.every(Boolean),label+': real light provider and watercolor layers');
      check(state.gardens?.length===2&&state.gardens.every(g=>g.type==='Polygon'&&g.vertices>50)&&state.gardens.map(g=>g.id).sort().join(',')==='174476472,4715855',label+': two bounded real garden polygons');
      check(state.visits===(routeKey==='main'?11:28)&&state.steps===(routeKey==='main'?12:28),label+': retained stops and transfer');
      check(state.pins===1&&state.boats===0,label+': only active photographic pin');
      check(!state.overflow,label+': no horizontal overflow');
      const expectedRoute=expectedRoutes.find(route=>route.key===routeKey),artBudget=state.mapSize.width<=600?3:6;
      check(Array.isArray(state.artAnchors)&&state.artAnchors.length>0&&state.artAnchors.length<=artBudget&&new Set(state.landmarks).size===state.landmarks.length,label+': viewport art budget and unique identities');
      check(state.artAnchors.every(feature=>{const visit=expectedRoute.visits.find(visit=>visit.key===feature.visitKey&&visit.key===feature.key&&(visit.placeKey===undefined||visit.placeKey===feature.key));return approvedArtKeys.has(feature.key)&&visit&&feature.coordinates[0]===visit.longitude&&feature.coordinates[1]===visit.latitude;}),label+': approved illustration anchors use this walk’s own stable coordinates, never titles or another walk');
      check(state.artAnchors.filter(feature=>feature.active).length===1&&state.artAnchors.some(feature=>feature.active&&feature.visitKey==='lucia'),label+': selected first-stop artwork has priority; approved references remain collision bounded');
      check(state.routeFeatures?.some(f=>!f.boat&&f.vertices>2),label+': real walking geometry');
      if(routeKey==='main'){
        record.phase='native-vaporetto-step';
        check(state.routeFeatures?.filter(f=>f.boat).length===2&&state.routeFeatures.filter(f=>f.boat).every(f=>f.vertices>3),label+': real water transfer geometry');
        const boat=page.locator('.fg-stop-list [data-step]').filter({hasText:'⛴'});check(await boat.count()===1,label+': one vaporetto step');
        await boat.click();check(await page.locator('.fg-pin').count()===3&&await page.locator('.fg-pin-boat').count()===3,label+': transfer-only boarding/change/landing pins');
        // Choosing a step closes the list. Return through the actual public UI.
        await page.locator('[data-action="list"]').click();
        await page.locator('[data-step="0"]').click();await page.locator('[data-action="list"]').click();
      }
      record.phase='gallery-history-keyboard';
      record.galleryLoading=await gallery(page,label,measurements);
      record.phase='native-theme-settings';
      if(width<=900)await page.locator('.fg-mobile-settings > summary').click();
      const theme=page.locator('.fg-theme').filter({visible:true}).first();
      const waterColor=await page.evaluate(()=>__acceptanceMaps[0].getPaintProperty('water','fill-color'));
      await theme.selectOption('dark');
      check(await page.evaluate(()=>document.querySelector('#field-guide').dataset.theme==='dark'&&__acceptanceMaps.length===1&&__acceptanceGPSStarts===0),label+': explicit dark keeps map/GPS');
      check(await page.evaluate(expected=>__acceptanceMaps[0].getPaintProperty('water','fill-color')===expected,waterColor),label+': dark does not recolor basemap');
      await theme.selectOption('system');await page.emulateMedia({colorScheme:'dark'});
      await page.waitForFunction(()=>document.querySelector('#field-guide').dataset.theme==='dark');
      check(await page.evaluate(()=>document.querySelector('#field-guide').dataset.theme==='dark'),label+': system follows dark OS');
      await page.emulateMedia({colorScheme:'light'});
      await page.waitForFunction(()=>document.querySelector('#field-guide').dataset.theme==='light');
      check(await page.evaluate(()=>document.querySelector('#field-guide').dataset.theme==='light'),label+': system follows light OS');
      await theme.selectOption('light');
      if(width<=900)await page.locator('.fg-settings-close').click();
      if(language==='en'&&width===1440&&routeKey==='main') {
        record.phase='native-location-denial';
        check(await page.evaluate(async()=> (await navigator.permissions.query({name:'geolocation'})).state==='denied'),label+': native permission is denied');
        await page.locator('[data-action="location"]').click();
        await page.waitForFunction(()=>document.querySelector('#field-guide').dataset.location==='denied');
        check(await page.evaluate(()=>__acceptanceGPSStarts===1&&__acceptanceMaps.length===1&&!__acceptanceMaps[0].getSource('fg-gps-accuracy')),label+': denial leaves map intact and no accuracy source');
        check(await page.locator('.fg-location-dot').count()===0&&await page.locator('.fg-map-status button').count()===0,label+': denial has no location marker/map retry');
      }
      if(language==='tr'&&width===390&&routeKey==='main'||language==='en'&&width===1440&&routeKey==='main') {
        record.phase='public-gallery-screenshot';
        await page.locator('.fg-stop-list [data-inspect]').first().click();await page.screenshot({path:resolve(output,`gallery-${language}-${width}.png`)});await page.keyboard.press('Escape');
      }
      cspFailures.push(...await page.evaluate(()=>__acceptanceCSP));
      // The seeded draft remains inaccessible through its existing QR destination.
      if(routeKey==='main') {
        record.phase='draft-event-and-qr-readonly';
        const draft=await page.request.get(`${target}/api/events/${draftSlug}`);check(draft.status()===404,label+': draft event GET stays 404');
        const catalog=await page.request.get(target+'/api/events');check(catalog.ok(),label+': event catalogue GET');
        if(catalog.ok())check(!(await catalog.json()).events?.some(e=>e.slug===draftSlug),label+': draft absent from catalogue');
        const qr=await page.goto(`${target}/events/${draftSlug}?lang=${language}`,{waitUntil:'domcontentloaded'});check(qr?.status()===200,label+': QR destination stable');
        await page.waitForFunction(expected=>document.querySelector('.event-note')?.textContent===expected,unavailable[language]);
        check(await page.locator('form').count()===0,label+': draft QR shows no registration form');
        check(await page.evaluate(()=>__acceptanceGPSStarts===0),label+': event page zero GPS');
        cspFailures.push(...await page.evaluate(()=>__acceptanceCSP));
      }
      record.phase='complete';
    }catch(error){issues.push(label+': '+(error.name||'Error'));record.failed=true;record.diagnostic={phase:record.phase,name:error.name||'Error',message:String(error.message||'').replace(/https?:\/\/[^\s)]+/g,value=>{try{const u=new URL(value);return u.origin+u.pathname}catch{return '[public-url]'}}).slice(0,800)};}
    finally{cases.push(record);await context.close();console.log(`Finished ${cases.length}/32: ${label}`)}
  }
  check([3,6,18].every(id=>photoGETs.has(`/image/${id}/thumb`)&&photoGETs.has(`/image/${id}/web`)),'Actual owned photo 3/6/18 thumb and web GETs completed');
  check(providerGETs.has('style')&&providerGETs.has('tile'),'Actual OpenFreeMap style and tile GETs completed');
  check(methodsBlocked.length===0,'No production write requests attempted');
  check(cspFailures.length===0,'No CSP violations');check(applicationErrors.length===0,'No uncaught browser errors');
}finally{await browser.close()}
const report={...plan,checks,issues,cases,methodsBlocked,cspFailures,networkFailures,applicationErrors,
  photos:[...photoGETs].sort(),provider:[...providerGETs].sort(),passed:issues.length===0,finishedAt:new Date().toISOString()};
await writeFile(resolve(output,'live-report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({checks,issues,output,passed:report.passed}));if(issues.length)process.exitCode=1;
