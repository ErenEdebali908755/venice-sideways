/* Isolated local application/fixture content; real MapLibre engine. No API writes,
   collection events, user positions or published story edits. Live tiles optional. */
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'/Users/erenedebali/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),publicRoot=resolve(root,'public');
const output=resolve(process.env.GUIDE_QA_OUTPUT||resolve(root,'../kit05-qa/visitor'));
await mkdir(output,{recursive:true});
const base='https://venicesideways.com',liveTiles=process.env.MAP_ART_QA_LIVE_TILES==='1',photosOnly=process.env.GUIDE_QA_PHOTOS==='1';
const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'};
let checks=0;const issues=[],pageErrors=[],mapErrors=[],records=[];
const check=(condition,message)=>{checks++;if(!condition)issues.push(message);};
async function serve(route) {
 const url=new URL(route.request().url());
 if(route.request().method()!=='GET'){issues.push('Unexpected write '+url.pathname);await route.abort();return;}
 if(url.href.includes('tiles.openfreemap.org/styles/positron')) {
  if(liveTiles){await route.continue();return;}
  await route.fulfill({json:{version:8,sources:{openmaptiles:{type:'vector',tiles:[base+'/test/empty/{z}/{x}/{y}.pbf'],minzoom:0,maxzoom:0}},layers:[{id:'background',type:'background',paint:{'background-color':'#f5f3ec'}}]}});return;
 }
 if(url.hostname==='tiles.openfreemap.org'){if(liveTiles)await route.continue();else await route.abort();return;}
 if(photosOnly&&url.origin==='https://erenedebali.com'&&/^\/image\/(3|6|18)\/(thumb|web)$/.test(url.pathname)){await route.continue();return;}
 if(url.pathname.startsWith('/test/empty/')){await route.fulfill({body:Buffer.alloc(0),contentType:'application/x-protobuf'});return;}
 if(url.origin!==base){await route.abort();return;}
 if(url.pathname==='/field-guide/entry.js'){await route.fulfill({body:'',contentType:'application/javascript'});return;}
 const path=resolve(publicRoot,'.'+(url.pathname==='/'?'/index.html':url.pathname));
 if(!path.startsWith(publicRoot+'/')){await route.abort();return;}
 try{await route.fulfill({body:await readFile(path),contentType:types[extname(path)]||'application/octet-stream'});}catch{await route.fulfill({status:404,body:'isolated fixture unavailable'});}
}
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
async function initialize(page,{locale='tr',preview=false,theme='light'}={}) {
 await page.evaluate(async({locale,preview,theme,photosOnly})=>{
  const {FieldGuide}=await import('/field-guide/guide.js?v=20261006-kit05');
  const {temporarySelection}=await import('/field-guide/temporary-selection.js?v=20261005-mobile');
  const {routes}=await(await fetch('/field-guide/routes.json')).json();const water=await(await fetch('/sideways/actv-water-paths.json')).json();
  const story={sourceLanguage:'en',review:{status:'reviewed',revision:1},copy:[{locale:'en',shortHistory:'Local QA history fixture. It verifies the card order and never becomes published content.',interestingDetail:'Local QA detail fixture.',needsReview:false}],sources:[{key:'keeper',kind:'primary',title:'Official place source',url:'https://www.pinaultcollection.com/palazzograssi/it/punta-della-dogana'}]};
  routes[0].visits[0].place={story};
  window.guide=new FieldGuide(document.querySelector('#field-guide'),{routes,water,lang:locale,preview,compactPreview:preview,referencePhotos:photosOnly?temporarySelection:[]});
  guide.themePreference=theme;guide.applyTheme();guide.choose('main');
  window.__mapErrors=[];
  const bind=()=>{if(guide.map){guide.map.on('error',event=>window.__mapErrors.push(event.error?.message||'Map error'));}else setTimeout(bind,20)};bind();
 },{locale,preview,theme,photosOnly});
 await page.waitForFunction(()=>guide.ready,{timeout:20000});
 await page.waitForFunction(()=>!guide.map.isMoving());await page.evaluate(async()=>{await document.fonts.ready;for(let i=0;i<4;i++)await new Promise(requestAnimationFrame)});
}
async function open({width,height,locale='tr',preview=false,theme='light',missingArt=false}) {
 const context=await browser.newContext({viewport:{width,height},locale,deviceScaleFactor:2});
 const page=await context.newPage(),artRequests=new Map();page.on('pageerror',error=>pageErrors.push(error.message));
 await page.route('**/*',async route=>{
  const path=new URL(route.request().url()).pathname;
  if(path.startsWith('/field-guide/art/')&&path.endsWith('.png')) {
   artRequests.set(path,(artRequests.get(path)||0)+1);
   if(missingArt){await route.fulfill({status:404,body:'Deliberate optional art failure'});return;}
  }
  await serve(route);
 });
 await page.addInitScript(()=>{window.__gpsRequests=0;Object.defineProperty(navigator,'geolocation',{configurable:true,value:{watchPosition(){window.__gpsRequests++;return 1},clearWatch(){}}});});
 await page.goto(base);await initialize(page,{locale,preview,theme});
 return {page,context,artRequests};
}
function camera(page){return page.evaluate(()=>JSON.stringify({center:guide.map.getCenter(),zoom:guide.map.getZoom(),bearing:guide.map.getBearing(),pitch:guide.map.getPitch()}));}
try {
 const sizes=photosOnly?[[390,844],[1440,900]]:[[320,568],[390,844],[430,932],[844,390],[1440,900]];
 const cases=sizes.map(([width,height])=>({width,height,locale:'tr'}));
 if(!photosOnly) {
  for(const locale of ['en','it','fr','ru','zh','ja','ko'])cases.push({width:390,height:844,locale,theme:'dark'});
  for(const [width,height] of [[320,264],[390,264],[430,520],[844,300]])for(const locale of ['tr','ru'])cases.push({width,height,locale,preview:true});
 }
 for(const item of cases) {
  const {page,context}=await open(item);const label=JSON.stringify(item),before=await camera(page);
  const metric=await page.evaluate(async()=>{
   const rectangle=selector=>{const r=guide.el(selector).getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,right:r.right}};
   return {map:rectangle('.fg-map'),header:rectangle('.fg-header'),bodyWidth:document.body.scrollWidth,viewportWidth:innerWidth,viewportHeight:innerHeight,preview:guide.compactPreview,paragraph:guide.el('.fg-place-story > p:not(.fg-source-note)')?.textContent,source:guide.el('.fg-story-sources')?.textContent,art:(await guide.map.getSource('fg-landmarks').getData()).features,gps:__gpsRequests,mapVersion:maplibregl.getVersion()};
  });
  check(metric.bodyWidth<=metric.viewportWidth+1,label+' no horizontal page overflow');
  check(metric.map.height>100,label+' meaningful real map height');
  check(metric.paragraph?.includes('Local QA history fixture'),label+' reviewed English story fallback');
  check(metric.source?.includes('Official place source'),label+' expandable source');
  if(item.preview) {
   check(metric.preview&&metric.header.height<=65,label+' explicit compact private chrome');
   check(metric.map.height>=Math.min(220,item.height-65)-1,label+' compact map uses available height');
   check(metric.gps===0,label+' preview has no GPS request');
   await page.locator('.fg-preview-panel-toggle').click();check(await page.locator('.fg-editorial').isVisible(),label+' accessible stop detail panel');
   await page.keyboard.press('Escape');check(!(await page.locator('.fg-editorial').isVisible()),label+' Escape returns to real map');
   check(await page.locator('.fg-preview-panel-toggle').evaluate(element=>document.activeElement===element),label+' Escape restores trigger focus');
  } else {
   const settings=page.locator('.fg-mobile-settings');
   if(await settings.isVisible()){await settings.locator('summary').click();await settings.locator('.fg-language').selectOption('ru');await page.keyboard.press('Escape');check(!(await page.locator('.fg-mobile-settings').evaluate(element=>element.open)),label+' settings Escape');}
   await page.locator('[data-action="detail"]').click();
   check(await page.locator('.fg-dialog').evaluate(dialog=>dialog.open&&dialog.scrollTop===0),label+' gallery/story opens at heading');
   if(photosOnly) {
    const gallery=page.locator('.fg-dialog .fg-gallery-stage img');await gallery.scrollIntoViewIfNeeded();
    for(const id of [3,6,18]) {
     await page.evaluate(id=>guide.selectPhoto('reference-eren-'+id),id);
     await page.waitForFunction(()=>{const image=guide.el('.fg-dialog .fg-gallery-stage img');return image?.complete&&image.naturalWidth>0;},undefined,{timeout:15000});
     const photo=await gallery.evaluate(image=>({src:image.currentSrc,fit:getComputedStyle(image).objectFit,naturalWidth:image.naturalWidth,naturalHeight:image.naturalHeight,displayHeight:image.getBoundingClientRect().height}));
     check(photo.src.includes('/image/'+id+'/'),'authorized temporary photo '+id+' is loaded');
     check(photo.fit==='contain'&&photo.displayHeight<=261,'temporary photograph is fully contained and subordinate to story');
     records.push({authorizedReferencePhoto:id,width:item.width,height:item.height,photo});
    }
    await page.locator('.fg-close').click();await page.waitForFunction(()=>!guide.el('.fg-dialog').open);
    await page.locator('[data-action="detail"]').click();check(await page.locator('.fg-dialog').evaluate(dialog=>dialog.scrollTop===0),'scrolling photographs then reopening restores stop heading');
   }
   await page.locator('.fg-close').click();await page.waitForFunction(()=>!guide.el('.fg-dialog').open);
  }
  check(await camera(page)===before,label+' panels/story/settings preserve camera');
  const errors=await page.evaluate(()=>__mapErrors);mapErrors.push(...errors);records.push({...item,metric});
  if((item.width===390&&item.locale==='tr')||item.width===1440)await page.screenshot({path:resolve(output,`${item.preview?'private':'public'}-${item.width}x${item.height}.png`)});
  await context.close();
 }
 for(const missingArt of photosOnly?[]:[false,true]) {
  const {page,context,artRequests}=await open({width:390,height:844,locale:'tr',missingArt});
  await page.evaluate(()=>{guide.map.jumpTo({zoom:16.5});guide.draw();});await page.waitForTimeout(500);
  const attempts=new Map(artRequests),before=await camera(page);
  await page.evaluate(()=>{for(let i=0;i<5;i++){guide.draw();guide.scheduleAnnotations();}});await page.waitForTimeout(300);
  const state=await page.evaluate(async()=>({ready:guide.ready,pins:guide.root.querySelectorAll('.fg-pin').length,routes:(await guide.map.getSource('fg-route').getData()).features.length,gps:__gpsRequests}));
  check(state.ready&&state.pins===1,'optional missing art retains ready map and exactly one active pin');
  check(state.routes>0,'optional missing art retains real route geometry');
  check([...attempts].every(([url,count])=>artRequests.get(url)===count),'same-map repeated draw deduplicates optional image requests');
  check(await camera(page)===before,'same-map optional image completion preserves camera');
  check(state.gps===0,'isolated optional image test does not request GPS');
  records.push({optionalImageFailure:missingArt,attempts:Object.fromEntries(artRequests),state});
  if(!missingArt) {
   await page.reload();await initialize(page,{locale:'tr'});
   const imports=await page.evaluate(()=>performance.getEntriesByType('resource').map(entry=>entry.name).filter(url=>/\/(guide|map-art|directions|illustrations|ui-copy)\.js/.test(url)));
   check(imports.length>=5&&imports.every(url=>url.endsWith('?v=20261006-kit05')),'same-context document reload loads one current module chain');
   check(await page.evaluate(()=>guide.ready&&guide.root.querySelectorAll('.fg-pin').length===1),'same-context reload retains usable map and a single active pin');
   records.push({sameContextReload:true,imports});
  }
  mapErrors.push(...await page.evaluate(()=>__mapErrors));await context.close();
 }
 if(liveTiles) {
  for(const key of ['lucia','dogana','accademia','vino','frari']) {
   const {page,context}=await open({width:390,height:844,locale:'tr'});
   await page.evaluate(key=>{guide.index=guide.steps().findIndex(step=>step.key===key);guide.render();guide.draw();guide.focus();},key);
   await page.waitForFunction(()=>!guide.map.isMoving());await page.waitForTimeout(800);
   for(const zoom of [15,16.5,18])for(const bearing of [0,45]) {
    await page.evaluate(({zoom,bearing})=>guide.map.jumpTo({zoom,bearing}),{zoom,bearing});await page.waitForTimeout(120);
    const state=await page.evaluate(async()=>({features:(await guide.map.getSource('fg-landmarks').getData()).features,pin:guide.el('.fg-pin')?.getBoundingClientRect().toJSON(),layers:guide.map.getStyle().layers.map(layer=>layer.id),providerCanals:guide.map.queryRenderedFeatures({layers:['waterway_line_label','water_name_line_label'].filter(id=>guide.map.getLayer(id))}).map(feature=>feature.properties.name)}));
    check(state.layers.indexOf('waterway_line_label')<state.layers.indexOf('fg-landmark-active'),`${key}/${zoom}/${bearing} actual provider label drawn below art`);
    check(state.features.length<=3,`${key}/${zoom}/${bearing} collision budget`);
    records.push({liveTiles:true,key,zoom,bearing,state});
   }
   await page.screenshot({path:resolve(output,`real-basemap-${key}.png`)});mapErrors.push(...await page.evaluate(()=>__mapErrors));await context.close();
  }
 }
} finally {await browser.close();}
const result={environment:photosOnly?'local isolated app + authorized public photos 3/6/18':liveTiles?'local isolated app + real provider tiles':'local isolated app + basemap fixture',date:new Date().toISOString(),version:'20261006-kit05',checks,passed:!issues.length&&!pageErrors.length&&!mapErrors.length,issues,pageErrors,mapErrors,records,physicalDeviceGPSVerified:false,publishedContentChanged:false};
await writeFile(resolve(output,'report.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({checks,records:records.length,passed:result.passed,issues,pageErrors,mapErrors,output}));if(!result.passed)process.exitCode=1;
