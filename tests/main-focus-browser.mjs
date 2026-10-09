/* Actual public entry/renderer in an isolated browser. Network fixtures only supply
   the existing bundled catalog and empty basemap; no user profile or production writes. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'/Users/erenedebali/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=resolve('public'),out=resolve(process.env.MAIN_FOCUS_QA_OUTPUT||'qa-output/main-focus');await mkdir(out,{recursive:true});
const base='https://venicesideways.com';const proof={at:new Date().toISOString(),checks:[],issues:[],scope:'Isolated Chromium with actual public entry and renderer; real MapLibre with empty basemap fixture. Not physical-phone evidence.'};
const check=(value,name)=>{proof.checks.push(name);if(!value)proof.issues.push(name)};
const {routes}=JSON.parse(await readFile(resolve(root,'field-guide/routes.json')));
const {restoreWalkingState,advanceWalkingState}=await import('../public/field-guide/walking-state.js');
const savedFull=advanceWalkingState(routes[1],restoreWalkingState(routes[1]));
const storage=JSON.stringify({full:savedFull});
const mime={'.js':'application/javascript','.json':'application/json','.html':'text/html','.css':'text/css','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.woff2':'font/woff2'};
async function serve(route){
 const u=new URL(route.request().url());
 if(u.hostname==='tiles.openfreemap.org')return route.fulfill({json:{version:8,sources:{},layers:[{id:'background',type:'background',paint:{'background-color':'#f8f1e6'}}]}});
 if(u.origin!==base)return route.abort();
 if(u.pathname==='/api/route-catalog')return route.fulfill({json:{routes:[{key:'main',published:false},{key:'full',published:false}]}});
 if(u.pathname==='/api/events')return route.fulfill({json:{events:[]}});
 const path=resolve(root,'.'+(u.pathname==='/'?'/index.html':u.pathname));
 if(!path.startsWith(root+'/'))return route.abort();
 try{let body=await readFile(path);if(u.pathname==='/field-guide/entry.js')body=body.toString().replace('guide=new FieldGuide','guide=window.__guide=new FieldGuide');return route.fulfill({body,contentType:mime[extname(path)]||'application/octet-stream'});}catch{return route.fulfill({status:404,body:''});}
}
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
try{
 for(const lang of ['en','tr','it','fr','ru','zh','ja','ko'])for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:width===1440?662:844},colorScheme:'dark',locale:lang});
  await context.addInitScript(saved=>{if(!sessionStorage.getItem('seeded')){localStorage.setItem('sideways-walking-progress-v1',saved);sessionStorage.setItem('seeded','1');}window.__gps=0;Object.defineProperty(navigator,'geolocation',{value:{watchPosition(_,error){window.__gps++;queueMicrotask(()=>error({code:1}));return 1},clearWatch(){}}});},storage);
  const page=await context.newPage();page.on('pageerror',e=>proof.issues.push(e.message));await page.route('**/*',serve);
  await page.goto(base+'/?lang='+lang+'#route=full');await page.waitForFunction(()=>window.__guide?.ready);const id=lang+'/'+width;
  check(await page.locator('.fg-main-summary').count()===1,id+' old Full link opens Main summary');
  check(await page.locator('.fg-main-summary [role=status]').count()===1,id+' old link explanation');
  check(await page.locator('.fg-route-switch,.fg-route-card,.fg-intro,[data-route=full]').count()===0,id+' no public Full navigation or hero');
  check(await page.evaluate(()=>localStorage.getItem('sideways-walking-progress-v1'))===storage,id+' landing never rewrites progress');
  check(await page.evaluate(()=>__gps===0),id+' no initial GPS');
  await page.locator('[data-route=main]').click();check(await page.evaluate(()=>__guide.walking.phase==='reaching-start'),id+' open walk does not start it');
  await page.locator('[data-action=walk-advance]').click();const state=await page.evaluate(()=>JSON.stringify(__guide.walking));
  await page.locator('[data-panel=photos]').click();await page.locator('[data-photo-stop]').selectOption('frari');
  await page.locator('[data-open-stop-photo]').click();await page.waitForFunction(()=>__guide.modalMode==='lightbox');
  check(await page.evaluate(()=>__guide.inspectedVisit==='frari'),id+' inspected photo opens Frari instead of walking target');
  await page.waitForFunction(()=>{const i=document.querySelector('.fg-dialog .fg-photo img');return i?.complete&&i.naturalWidth>0});
  check(await page.locator('.fg-dialog figcaption a').count()>=2,id+' source and license in full photo');
  await page.keyboard.press('Escape');await page.waitForFunction(()=>__guide.modalMode==='detail');await page.keyboard.press('Escape');await page.waitForFunction(()=>!__guide.modalMode);
  check(await page.evaluate(()=>JSON.stringify(__guide.walking))===state,id+' gallery close retains walking target');
  await page.locator('.fg-preferences > summary').click();await page.locator('.fg-theme').selectOption('light');await page.locator('.fg-language').selectOption(lang==='tr'?'fr':'tr');
  await page.keyboard.press('Escape');check(await page.locator('.fg-preferences > summary').evaluate(e=>e===document.activeElement),id+' Escape returns preference focus');
  check(await page.locator('.fg-preferences > summary').getAttribute('aria-expanded')==='false',id+' disclosure aria state');
  check(await page.evaluate(()=>JSON.stringify(__guide.walking))===state,id+' preferences retain walking state');
  check(await page.evaluate(()=>JSON.stringify(JSON.parse(localStorage.getItem('sideways-walking-progress-v1')).full))===JSON.stringify(savedFull),id+' full progress survives Main saving');
  if(lang==='tr'&&width===1440){
   for(const visit of routes[0].visits.filter(v=>v.visible&&v.isPhotoStop)){
    await page.locator('[data-photo-stop]').selectOption(visit.key);await page.waitForFunction(()=>{const i=document.querySelector('.fg-stop-preview img');return i?.complete&&i.naturalWidth>0});
    check(await page.locator('.fg-stop-preview figcaption a').count()===2,visit.key+' cover credit source license loaded');
    check(await page.locator('.fg-stop-preview img').getAttribute('src').then(src=>src.includes('/photos/main-20261009/')),visit.key+' approved real place asset');
   }
   await page.locator('[data-panel=map]').click();const camera=await page.evaluate(()=>JSON.stringify(__guide.cameraSnapshot()));
   await page.locator('.fg-map-options > summary').click();const box=await page.locator('.fg-map').boundingBox();await page.keyboard.press('Escape');
   check(JSON.stringify(await page.locator('.fg-map').boundingBox())===JSON.stringify(box),'map options do not resize map');
   check(await page.evaluate(()=>JSON.stringify(__guide.cameraSnapshot()))===camera,'map popup does not reset camera');
   await page.locator('[data-action=location]').click();await page.waitForFunction(()=>__guide.locationState==='denied');
   check(await page.evaluate(()=>__gps===1&&JSON.stringify(__guide.walking))===state,'one explicit GPS request denial preserves state');
   await page.reload();await page.waitForFunction(()=>window.__guide?.ready);check(await page.evaluate(()=>JSON.stringify(__guide.walking))===state,'old Full link reload preserves Main target');
   check(await page.locator('.fg-main-summary').count()===1,'reload remains Main summary');
   await page.evaluate(async()=>{__guide.destroy();const {FieldGuide}=await import('/field-guide/guide.js');const {routes}=await(await fetch('/field-guide/routes.json')).json();window.__guide=new FieldGuide(document.querySelector('#field-guide'),{routes,preview:true});__guide.choose('full');});await page.waitForFunction(()=>__guide.ready);
   check(await page.locator('.fg-route-switch').inputValue()==='full'&&await page.locator('.fg-route-switch option').count()===2,'private renderer retains Full route selection');
   check(await page.evaluate(()=>__guide.steps().filter(v=>v.isPhotoStop).length)===28,'private Full preview 28 stops');
  }
  await page.locator('.fg-brand').click();
  if(!(lang==='tr'&&width===1440)) { check(await page.locator('.fg-main-summary').count()===1&&await page.locator('#field-guide').getAttribute('data-panel')==='map',id+' photos-to-overview restores compact map panel'); }
  await context.close();
 }
}finally{await browser.close();await writeFile(resolve(out,'main-focus-browser.json'),JSON.stringify(proof,null,2));}
console.log(JSON.stringify({checks:proof.checks.length,issues:proof.issues}));if(proof.issues.length)process.exitCode=1;
