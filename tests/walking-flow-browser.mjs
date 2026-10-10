/* Controlled local browser: actual renderer and MapLibre, isolated map/image fixtures.
   Route galleries are explicitly empty fixtures to test honest absence and separate inspiration;
   this is not acceptance evidence for the bundled real-photograph selection.
   No production writes, real GPS, physical-device or human-usability acceptance. */
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'/Users/erenedebali/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const publicRoot=resolve(dirname(fileURLToPath(import.meta.url)),'../public');
const output=resolve(process.env.WALKING_QA_OUTPUT||resolve(publicRoot,'../../book-stop-ux-20261009/walking-qa'));
await mkdir(output,{recursive:true});const base='https://venicesideways.com';
const types={'.js':'application/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'};
const issues=[],errors=[];let checks=0;const check=(ok,message)=>{checks++;if(!ok)issues.push(message)};
async function serve(route){
 const url=new URL(route.request().url());
 if(url.href.includes('tiles.openfreemap.org/styles/positron'))return route.fulfill({json:{version:8,sources:{openmaptiles:{type:'vector',tiles:[base+'/qa/empty/{z}/{x}/{y}.pbf'],minzoom:0,maxzoom:0}},layers:[{id:'background',type:'background',paint:{'background-color':'#f8f1e6'}}]}});
 if(url.pathname.startsWith('/qa/empty/'))return route.fulfill({body:Buffer.alloc(0),contentType:'application/x-protobuf'});
 if(url.pathname==='/qa/photo.svg')return route.fulfill({body:'<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="1200"><rect width="1800" height="1200" fill="#ccc"/><text x="30" y="80" font-size="50">Local geometry fixture, not a place photograph</text></svg>',contentType:'image/svg+xml'});
 if(url.hostname==='erenedebali.com'&&/^\/image\/(3|6|18)\/(web|thumb)$/.test(url.pathname))return route.fulfill({body:await readFile(resolve(publicRoot,'../../combined-20261005/photo-selection',url.pathname.split('/')[2]+'.webp')),contentType:'image/webp'});
 if(url.origin!==base)return route.abort();
 if(url.pathname==='/field-guide/entry.js')return route.fulfill({body:'',contentType:'application/javascript'});
 const path=resolve(publicRoot,'.'+(url.pathname==='/'?'/index.html':url.pathname));
 if(!path.startsWith(publicRoot+'/'))return route.abort();
 try{return route.fulfill({body:await readFile(path),contentType:types[extname(path)]||'application/octet-stream'})}catch{return route.fulfill({status:404,body:''})}
}
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
async function open(lang,width,height,preview=false){
 const context=await browser.newContext({viewport:{width,height},locale:lang,colorScheme:'light'});
 await context.addInitScript(()=>{window.__gpsCalls=0;Object.defineProperty(navigator,'geolocation',{value:{watchPosition(success,error){window.__gpsCalls++;queueMicrotask(()=>error({code:1}));return 1;},clearWatch(){}}});});
 const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));await page.route('**/*',serve);await page.goto(base+'/');
 await page.evaluate(async({lang,preview})=>{const {FieldGuide}=await import('/field-guide/guide.js');const {routes}=await(await fetch('/field-guide/routes.json')).json();for(const route of routes)for(const visit of route.visits)visit.gallery=[];const water=await(await fetch('/sideways/actv-water-paths.json')).json();const {temporarySelection}=await import('/field-guide/temporary-selection.js');window.guide=new FieldGuide(document.querySelector('#field-guide'),{routes,water,lang,preview,compactPreview:preview,publicLocation:true,referencePhotos:temporarySelection});},{lang,preview});
 await page.waitForFunction(()=>guide.ready);if(preview)await page.evaluate(()=>guide.choose("main"));else await page.locator('[data-route="main"]').click();return{page,context};
}
const visibleDock=async page=>page.locator('.fg-walking-dock').evaluate(dock=>{const r=dock.getBoundingClientRect(),action=dock.querySelector('.fg-primary').getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight+1&&action.top>=r.top&&action.bottom<=innerHeight+1&&action.height>=44&&document.documentElement.scrollWidth<=innerWidth+1;});
try{
 for(const lang of (process.env.WALKING_QA_QUICK==='1'?['tr']:['en','tr','it','fr','ru','zh','ja','ko']))for(const [width,height]of (process.env.WALKING_QA_QUICK==='1'?[[390,844],[390,460]]:[[360,740],[390,844],[430,932],[390,460],[844,390],[720,450]])){
  const {page,context}=await open(lang,width,height),label=`${lang}/${width}x${height}`;
  check(await visibleDock(page),label+': named walking target and primary action fit viewport');
  check(await page.evaluate(()=>guide.walking.phase==='reaching-start'&&guide.walkingStep==='lucia'),label+': starts at Santa Lucia');
  check(await page.locator('.fg-walking-dock').innerText().then(text=>text.includes('1 / 10')&&!text.includes('/ 12')),label+': separate ten-photo progress');
  check(await page.evaluate(()=>__gpsCalls===0),label+': no initial location permission');
  if(lang==='tr'&&width===390&&height===844){await page.waitForTimeout(280);await page.screenshot({path:resolve(output,'01-start-390-tr.png')});}
  await page.locator('[data-action="walk-advance"]').dblclick();
  check(await page.evaluate(()=>guide.walking.phase==='walking'&&guide.walkingStep==='giacomo'),label+': double start reaches only Giacomo target');
  check(await page.locator('.fg-dock-secondary a').getAttribute('href').then(link=>link.includes('45.')&&link.includes('destination=')),label+': directions explicitly name walking target');
  if(lang==='tr'&&width===390&&height===844){await page.waitForTimeout(280);await page.screenshot({path:resolve(output,'02-walking-390-tr.png')});}
  await page.waitForTimeout(660);await page.locator('[data-action="walk-advance"]').dblclick();
  check(await page.evaluate(()=>guide.walking.phase==='at-stop'&&guide.walkingStep==='giacomo'),label+': double arrival does not skip photo stop');
  await page.waitForTimeout(260);
  const before=await page.evaluate(()=>({state:JSON.stringify(guide.walking),camera:JSON.stringify(guide.cameraSnapshot())}));
  await page.locator('[data-panel="stops"]').click();await page.locator('[data-inspect]').last().click();
  await page.keyboard.press('Escape');await page.waitForFunction(()=>!guide.modalMode);
  check(await page.evaluate(()=>JSON.stringify(guide.walking))===before.state,label+': future-stop inspection preserves walking state');
  check(await page.evaluate(camera=>{const now=guide.cameraSnapshot(),old=JSON.parse(camera);return Math.abs(now.zoom-old.zoom)<1e-7&&Math.abs(now.center[0]-old.center[0])<1e-7&&Math.abs(now.center[1]-old.center[1])<1e-7;},before.camera),label+': inspection close restores camera');
  await page.locator('[data-panel="photos"]').click();
  check(await page.locator('.fg-compact-empty').isVisible(),label+': missing real stop photo stays compact and honest');
  check(await page.locator('.fg-stop-preview img').count()===0,label+': bank reference is not a stop cover');
  await page.locator('[data-inspiration]').first().click();check(await page.evaluate(()=>guide.modalMode==='inspiration'),label+': owner examples open separately');
  await page.keyboard.press('Escape');await page.waitForFunction(()=>!guide.modalMode);
  check(await page.evaluate(()=>JSON.stringify(guide.walking))===before.state,label+': photo examples leave walking progress unchanged');
  await page.locator('[data-panel="map"]').click();
  check(await visibleDock(page),label+': map return keeps walking action visible');
  if(lang==='tr'&&width===390&&height===844){await page.waitForTimeout(280);await page.screenshot({path:resolve(output,'03-photo-close-return-390-tr.png')});}
  await page.locator('.fg-mobile-settings > summary').click();await page.locator('.fg-mobile-settings .fg-theme').selectOption('dark');await page.keyboard.press('Escape');
  check(await page.evaluate(()=>guide.root.dataset.theme==='dark'&&JSON.stringify(guide.walking))===before.state,label+': theme change keeps progress');
  await page.locator('.fg-route-switch').selectOption('full');check(await page.evaluate(()=>guide.walkingStep==='lucia'&&guide.walking.phase==='reaching-start'),label+': Full has independent progress');
  await page.locator('.fg-route-switch').selectOption('main');check(await page.evaluate(()=>JSON.stringify(guide.walking))===before.state,label+': return to Main resumes saved target');
  await page.locator('[data-action="location"]').click();await page.waitForTimeout(20);
  check(await page.evaluate(()=>guide.locationState==='denied'&&JSON.stringify(guide.walking))===before.state,label+': denied GPS leaves manual walking usable');
  check(await visibleDock(page),label+': dock survives location denial');
  await page.evaluate(()=>guide.setSheet('collapsed'));check(await visibleDock(page),label+': compact sheet keeps dock');
  await page.locator('[data-sheet-drag]').focus();await page.keyboard.press('End');check(await page.evaluate(()=>guide.sheet==='expanded'),label+': sheet keyboard resize');
  await page.evaluate(()=>guide.setSheet('standard'));
  if(lang==='tr'&&width===390&&height===844){
    await page.waitForTimeout(660);await page.evaluate(()=>guide.resumeWalking(guide.steps().find(step=>step.boat).key));
    check(await page.locator('.fg-walking-dock').innerText().then(text=>text.includes('ACTV 1')&&text.includes('Ferrovia')),label+': first transit target names line and interchange');
    await page.waitForTimeout(280);await page.screenshot({path:resolve(output,'04-vaporetto-390-tr.png')});
    await page.waitForTimeout(660);await page.locator('[data-action="walk-advance"]').click();
    check(await page.locator('.fg-walking-dock').innerText().then(text=>text.includes('ACTV 5.2')&&text.includes('Tre Archi')),label+': second transit target names correct landing');
    await page.waitForTimeout(660);await page.evaluate(()=>guide.resumeWalking(guide.steps().at(-1).key));
    await page.waitForTimeout(660);await page.locator('[data-action="walk-advance"]').click();await page.waitForTimeout(660);await page.locator('[data-action="walk-advance"]').click();
    check(await page.evaluate(()=>guide.walking.phase==='complete'&&guide.walkingStep==='trearchi'),label+': explicit completion at Ponte dei Tre Archi');
    await page.waitForTimeout(280);await page.screenshot({path:resolve(output,'05-finish-390-tr.png')});
  }
  await context.close();
 }
 const preview=await open('tr',390,520,true);
 await preview.page.evaluate(()=>guide.update({visitKey:'frari',view:'walk'}));
 check(await preview.page.evaluate(()=>guide.walkingStep==='lucia'&&guide.inspectedVisit==='frari'),'Private preview selection remains separate from walking progress');
 check(await preview.page.locator('.fg-map').evaluate(map=>{const r=map.getBoundingClientRect();return r.width>100&&r.height>100;}),'Compact admin preview map stays visible while details are closed');
 await preview.page.locator('.fg-preview-panel-toggle').click();
 check(await preview.page.locator('.fg-editorial h1').innerText().then(text=>text.includes('Frari')),'Private preview details show the selected inspected stop');
 check(await preview.page.evaluate(()=>__gpsCalls===0),'Private preview never starts GPS');await preview.context.close();
 check(errors.length===0,'No uncaught application errors: '+errors.join('; '));
}catch(error){errors.push(error.message);throw error;}finally{await browser.close();await writeFile(resolve(output,process.env.WALKING_QA_QUICK==='1'?'walking-final-targeted-report.json':'walking-browser-report.json'),JSON.stringify({observedAt:new Date().toISOString(),passed:issues.length===0&&errors.length===0,scope:'Controlled Chromium, actual renderer and MapLibre with isolated base map and explicit empty-gallery fixtures, not bundled-photograph acceptance. '+(process.env.WALKING_QA_QUICK==='1'?'Targeted Turkish at 390x844 and 390x460, plus compact private preview.':'Eight languages at 360/390/430, short viewport, landscape, 720x450 equivalent CSS viewport for 200% zoom.')+' Simulated denial, not real GPS, phone or human usability testing.',checks,issues,errors},null,2));}
console.log(JSON.stringify({checks,issues,errors}));if(issues.length)process.exitCode=1;
