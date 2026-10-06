/* Local browser contract: owned sample images, real MapLibre with an isolated basemap fixture,
   simulated device positions. Does not contact production or grant physical-GPS acceptance. */
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || '/Users/erenedebali/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'), publicRoot=resolve(root,'public');
const output=resolve(process.env.GUIDE_QA_OUTPUT || resolve(root,'../visual-integration-20261005/mobile-guide'));await mkdir(output,{recursive:true});
const photographs=resolve(root,'../combined-20261005/photo-selection');
const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'};
const base='https://venicesideways.com';let checks=0;const issues=[];const pageErrors=[];
const check=(condition,message)=>{checks++;if(!condition)issues.push(message)};
async function serve(route){
 const url=new URL(route.request().url());
 if(url.hostname==='erenedebali.com'&&/^\/image\/(3|6|18)\/(web|thumb)$/.test(url.pathname)){await route.fulfill({body:await readFile(resolve(photographs,url.pathname.split('/')[2]+'.webp')),contentType:'image/webp'});return}
 if(url.href.includes('tiles.openfreemap.org/styles/positron')){await route.fulfill({json:{version:8,sources:{openmaptiles:{type:'vector',tiles:[base+'/test/empty/{z}/{x}/{y}.pbf'],minzoom:0,maxzoom:0}},layers:[{id:'background',type:'background',paint:{'background-color':'#f8f1e6'}}]}});return}
 if(url.pathname.startsWith('/test/frame/')){const [width,height]=url.pathname.includes('panorama')?[2400,800]:[1800,1200];await route.fulfill({body:`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#ccc"/><rect x="3" y="3" width="${width-6}" height="${height-6}" fill="none" stroke="#222" stroke-width="6"/><text x="30" y="80" font-size="50">QA geometry fixture - not a photograph</text></svg>`,contentType:'image/svg+xml'});return}
 if(url.pathname.startsWith('/test/empty/')){await route.fulfill({status:200,body:Buffer.alloc(0),contentType:'application/x-protobuf'});return}
 if(url.origin!==base){await route.abort();return}
 if(url.pathname==='/field-guide/entry.js'){await route.fulfill({body:'',contentType:'application/javascript'});return}
 const path=resolve(publicRoot,'.'+(url.pathname==='/'?'/index.html':url.pathname));
 if(!path.startsWith(publicRoot+'/')){await route.abort();return}
 try{await route.fulfill({body:await readFile(path),contentType:types[extname(path)]||'application/octet-stream'})}catch{await route.fulfill({status:404,body:'fixture unavailable'})}
}
const init=()=>{
 window.__gpsCalls=[];window.__gpsCleared=[];
 Object.defineProperty(navigator,'geolocation',{configurable:true,value:{watchPosition(success,error,options){window.__gpsCalls.push({success,error,options});return window.__gpsCalls.length},clearWatch(id){window.__gpsCleared.push(id)}}});
 Object.defineProperty(navigator,'permissions',{configurable:true,value:{query:()=>Promise.resolve({state:'prompt',addEventListener(){},removeEventListener(){}})}});
};
const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
async function open(language,width=390,height=844,preview=false,host=base,scale=1){
 const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:scale,colorScheme:'light',locale:language});await context.addInitScript(init);
 const page=await context.newPage();page.on('pageerror',error=>pageErrors.push(error.message));await page.route('**/*',serve);await page.goto(base+'/?lang='+language);
 await page.evaluate(async({language,preview,host})=>{const {FieldGuide}=await import('/field-guide/guide.js');const {temporarySelection}=await import('/field-guide/temporary-selection.js');const {routes}=await(await fetch('/field-guide/routes.json')).json();const water=await(await fetch('/sideways/actv-water-paths.json')).json();window.guide=new FieldGuide(document.querySelector('#field-guide'),{routes,water,lang:language,preview,publicLocation:host==='public',referencePhotos:temporarySelection});},{language,preview,host:host===base?'public':'archive'});
 await page.waitForFunction(()=>window.guide.ready);return {page,context};
}
try{
 for(const language of ['en','tr','it','fr','ru','zh','ja','ko'])for(const [width,height,scale]of [[320,568,1],[375,812,1],[390,844,1],[430,932,1],[1440,900,1],[844,390,1],[720,450,2]]){
  const {page,context}=await open(language,width,height,false,base,scale);const label=`${language}/${width}x${height}/${scale}`;
  check(await page.evaluate(()=>__gpsCalls.length===0),label+': zero initial GPS');
  check(await page.evaluate(()=>getComputedStyle(guide.root).backgroundColor==='rgb(244, 242, 237)'),label+': neutral paper');
  await page.locator('[data-route="main"]').click();const initial=await page.evaluate(()=>guide.walkingStep);
  const sameMap=await page.evaluate(()=>guide.mapGeneration);
  if(width<=900){
   await page.locator('[data-sheet="collapsed"]').click();await page.waitForTimeout(40);
   check(await page.locator('[data-action="start"]').isVisible(),label+': compact sheet retains explicit walking action');
   check(await page.locator('.fg-map').evaluate(map=>map.getBoundingClientRect().height>=100),label+': compact sheet retains useful map');
   if(language==='tr'&&[320,390,844].includes(width))await page.screenshot({path:resolve(output,`sheet-compact-tr-${width}.png`)});
   await page.locator('[data-sheet="expanded"]').click();check(!await page.locator('.fg-map-shell').isVisible(),label+': expanded sheet really hides map');
   check(await page.locator('.fg-sheet-story article').count()===5,label+': expanded actual five photo ideas');
   if(language==='tr'&&width===390)await page.screenshot({path:resolve(output,'sheet-expanded-tr-390.png')});
   await page.locator('[data-sheet="standard"]').click();await page.waitForTimeout(40);
   check(await page.evaluate(()=>guide.mapGeneration)===sameMap,label+': all sheet states preserve map instance');
   check(await page.locator('.fg-sheet-controls button').first().evaluate(button=>button.getBoundingClientRect().height>=44),label+': sheet touch target');
   await page.locator('.fg-mobile-settings > summary').click();await page.locator('.fg-mobile-settings .fg-theme').selectOption('dark');
   check(await page.evaluate(()=>guide.root.dataset.theme==='dark'),label+': manual dark theme');
   check(await page.locator('.fg-map-shell').evaluate(map=>getComputedStyle(map).backgroundColor==='rgb(248, 241, 230)'),label+': map stays light');
   if(language==='tr'&&width===320)await page.screenshot({path:resolve(output,'settings-dark-tr-320.png')});
   await page.keyboard.press('Escape');check(await page.locator('.fg-mobile-settings').evaluate(settings=>!settings.open&&document.activeElement===settings.querySelector('summary')),label+': settings Escape returns focus');
   await page.evaluate(()=>{guide.themePreference='light';guide.applyTheme()});
  }
  await page.locator('[data-action="list"]').click();await page.locator('[data-inspect]').last().click();
  check(await page.evaluate(()=>guide.walkingStep)===initial,label+': inspecting another gallery preserves walking step');
  check(await page.locator('.fg-dialog[open]').count()===1,label+': one modal');
  check(await page.locator('.fg-reference-note').isVisible(),label+': truthful temporary reference note');
  check(await page.locator('.fg-thumbnails button').count()===3,label+': three manual choices');
  check(await page.locator('.fg-gallery .fg-photo-full img').first().evaluate(image=>getComputedStyle(image).filter==='none'&&getComputedStyle(image).objectFit==='contain'),label+': full frame without tonal filter');
  await page.locator('[data-open-photo]').click();check(await page.evaluate(()=>guide.modalMode==='lightbox'),label+': large photo');
  await page.locator('[data-photo-zoom]').click();const zoomPhoto=await page.evaluate(()=>guide.selectedPhoto);await page.keyboard.press('ArrowRight');
  check(await page.evaluate(()=>guide.selectedPhoto)===zoomPhoto,label+': zoom keyboard pans without photo switch');
  check(await page.locator('.fg-gallery-stage img').evaluate(image=>getComputedStyle(image).maxWidth==='none'),label+': actual mobile photo zoom is not overridden by full-frame CSS');
  await page.locator('[data-photo-zoom]').click();
  await page.keyboard.press('ArrowRight');check(await page.evaluate(()=>guide.selectedPhoto==='reference-eren-6'),label+': manual keyboard next');
  await page.goBack();await page.waitForFunction(()=>guide.modalMode==='detail');
  await page.keyboard.press('Escape');await page.waitForFunction(()=>!guide.modalMode);
  check(await page.evaluate(()=>guide.walkingStep)===initial,label+': Back then Escape preserve walk');
  check(await page.evaluate(()=>document.activeElement?.hasAttribute('data-inspect')),label+': focus returns to opening control');
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),label+': no horizontal overflow');
  check(await page.evaluate(()=>__gpsCalls.length===0),label+': gallery/language/theme do not start GPS');
  if(language==='tr'&&width===390){await page.locator('[data-inspect]').first().click();await page.screenshot({path:resolve(output,'gallery-mobile-tr.png')});await page.keyboard.press('Escape');await page.waitForFunction(()=>!guide.modalMode)}
  if(language==='en'&&width===1440){await page.locator('[data-inspect]').first().click();await page.screenshot({path:resolve(output,'gallery-desktop-en.png')});await page.keyboard.press('Escape');await page.waitForFunction(()=>!guide.modalMode)}
  await page.evaluate(()=>{guide.referencePhotos=[];const visit=guide.route.visits.find(v=>v.key===guide.walkingStep);visit.gallery=[];guide.openDetail(visit.key)});
  check(await page.locator('.fg-dialog .fg-photo-missing').isVisible(),label+': empty gallery message is visible');
  await page.evaluate(()=>{const visit=guide.route.visits.find(v=>v.key===guide.walkingStep);visit.gallery=[{assetID:'fixture-image-error',order:0,sourceLanguage:'en',copy:[{locale:'en',alt:'QA unavailable image fixture'}],derivatives:[{variant:'r900',url:location.origin+'/test/unavailable-gallery-image.jpg',width:900,height:600}]}];guide.openDetail(visit.key)});
  await page.locator('.fg-gallery-stage .fg-photo-missing').waitFor({state:'visible'});
  check(await page.locator('.fg-gallery-stage .fg-photo-missing').isVisible(),label+': failed image message is visible');
  check(await page.locator('.fg-gallery-stage .fg-photo-error button').isVisible(),label+': failed photograph offers independent retry');
  if(language==='tr'&&width===320)await page.screenshot({path:resolve(output,'photo-error-retry-tr-320.png')});
  await context.close();
 }
 const {page,context}=await open('en',1440,900);const payloads=[];page.on('request',request=>payloads.push({url:request.url(),body:request.postData()}));
 await page.locator('[data-route="main"]').click();const map=await page.evaluate(()=>guide.mapGeneration);const walking=await page.evaluate(()=>guide.walkingStep);
 await page.locator('[data-action="location"]').click();check(await page.evaluate(()=>__gpsCalls.length===1&&guide.locationState==='requesting'),'GPS: explicit start owns one watch');
 await page.evaluate(()=>__gpsCalls[0].success({coords:{longitude:12.42,latitude:45.44,accuracy:35},timestamp:Date.now()}));
 await page.waitForFunction(()=>guide.locationPin&&guide.locationState==='tracking');
 check(await page.evaluate(()=>guide.map.getSource('fg-gps-accuracy')!==undefined),'GPS: accuracy circle uses same map');
 await page.locator('[data-action="location-return"]').click();await page.waitForFunction(()=>guide.cameraMode==='follow');
 await page.evaluate(()=>guide.map.fire('dragstart',{originalEvent:{type:'mousedown'}}));check(await page.evaluate(()=>guide.cameraMode==='free'),'GPS: manual pan suspends follow');
 await page.locator('[data-action="list"]').click();await page.locator('[data-inspect]').last().click();const camera=await page.evaluate(()=>JSON.stringify(guide.cameraSnapshot()));
 await page.evaluate(()=>__gpsCalls[0].success({coords:{longitude:12.34,latitude:45.43,accuracy:100},timestamp:Date.now()}));
 check(await page.evaluate(()=>JSON.stringify(guide.cameraSnapshot()))===camera,'GPS: gallery fix preserves camera');
 check(await page.evaluate(()=>guide.walkingStep)===walking,'GPS: fix preserves walking step');
 await page.keyboard.press('Escape');await page.waitForFunction(()=>!guide.modalMode);const restored=await page.evaluate(()=>JSON.stringify(guide.cameraSnapshot()));
 await page.waitForTimeout(1010);await page.evaluate(()=>__gpsCalls[0].success({coords:{longitude:12.35,latitude:45.43,accuracy:100},timestamp:Date.now()}));
 check(await page.evaluate(()=>JSON.stringify(guide.cameraSnapshot()))===restored,'GPS: closing gallery does not resume follow');
 await page.locator('[data-action="location-off"]').click();check(await page.evaluate(()=>guide.locationEngine.fix===null&&guide.locationPin===null&&!guide.map.getSource('fg-gps-accuracy')),'GPS: stop clears position/marker/circle');
 await page.locator('[data-action="location"]').click();await page.evaluate(()=>__gpsCalls[0].error({code:1}));check(await page.evaluate(()=>guide.locationState==='requesting'),'GPS: late previous error cannot stop current request');
 await page.evaluate(()=>__gpsCalls[1].error({code:1}));check(await page.evaluate(()=>guide.locationState==='denied'&&guide.ready&&!guide.mapError),'GPS: denial leaves map ready');
 check(await page.locator('.fg-map-status button').count()===0,'GPS: denial has no map retry');
 await page.locator('[data-action="location"]').click();await page.evaluate(()=>__gpsCalls[2].success({coords:{longitude:28.97,latitude:41.01,accuracy:50},timestamp:Date.now()}));check(await page.evaluate(()=>guide.locationEngine.fix.outside&&guide.cameraMode==='free'),'GPS: outside Venice is truthful and does not follow');
 await page.evaluate(()=>dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true})));check(await page.evaluate(()=>guide.locationState==='suspended'&&guide.locationEngine.fix===null&&guide.watch===null),'GPS: BFCache pagehide clears tracking');
 const count=await page.evaluate(()=>__gpsCalls.length);await page.evaluate(()=>dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));check(await page.evaluate(()=>__gpsCalls.length)===count,'GPS: BFCache pageshow does not restart');
 await page.evaluate(()=>{guide.referencePhotos=[];const visit=guide.route.visits.find(v=>v.key===guide.walkingStep);visit.gallery=[];guide.openDetail(visit.key)});
 check(await page.locator('.fg-dialog .fg-photo-missing').isVisible(),'Gallery: zero photos has visible concise empty text');
 await page.keyboard.press('Escape');await page.waitForFunction(()=>!guide.modalMode);
 await page.evaluate(()=>{const visit=guide.route.visits.find(v=>v.key===guide.walkingStep);visit.gallery=[{assetID:'fixture-landscape',order:1,cover:true,sourceLanguage:'en',copy:[{locale:'en',alt:'QA landscape geometry fixture'}],derivatives:[{variant:'r1600',url:location.origin+'/test/frame/landscape.svg',width:1800,height:1200}]}];guide.openDetail(visit.key)});
 check(await page.locator('.fg-thumbnails button').count()===1,'Gallery: single photo has one choice');
 check(await page.locator('[data-photo-next]').isDisabled(),'Gallery: single photo next is disabled');
 await page.locator('[data-open-photo]').click();await page.locator('[data-photo-zoom]').click();check(await page.evaluate(()=>guide.photoZoom),'Gallery: manual zoom only');
 await page.keyboard.press('Escape');await page.waitForFunction(()=>guide.modalMode==='detail');check(await page.evaluate(()=>!guide.el('.fg-dialog').classList.contains('fg-photo-zoomed')),'Gallery: Back clears lightbox zoom');
 await page.evaluate(()=>{const visit=guide.route.visits.find(v=>v.key===guide.walkingStep);visit.gallery.push({assetID:'fixture-panorama',order:2,sourceLanguage:'en',copy:[{locale:'en',alt:'QA panorama geometry fixture'}],derivatives:[{variant:'r2400',url:location.origin+'/test/frame/panorama.svg',width:2400,height:800}]});guide.selectPhoto('fixture-panorama')});
 check(await page.locator('.fg-gallery-stage img').evaluate(img=>img.getAttribute('width')==='2400'&&img.getAttribute('height')==='800'&&getComputedStyle(img).objectFit==='contain'),'Gallery: panorama keeps natural dimensions and full frame');
 const photoID=await page.evaluate(()=>guide.selectedPhoto);await page.evaluate(()=>guide.update({lang:'ja'}));check(await page.evaluate(()=>guide.selectedPhoto)===photoID,'Gallery: locale change preserves photo ID');
 for(let i=0;i<8;i++){await page.keyboard.press('Tab');check(await page.evaluate(()=>document.activeElement.closest('.fg-dialog')!==null),'Gallery: native modal focus stays inside')}
 await page.keyboard.press('Escape');await page.waitForFunction(()=>!guide.modalMode);
 check(await page.evaluate(()=>guide.mapGeneration)===map,'GPS/gallery: no map reinitialization');
 check(payloads.every(item=>!/(12\.42|28\.97|41\.01|latitude|longitude|accuracy)/.test(item.body||'')&&!/(12\.42|28\.97|41\.01)/.test(item.url)),'GPS: no coordinates in application requests');
 await context.close();
 for(const preview of [true,false]){const {page,context}=await open('en',390,844,preview,preview?base:'archive');await page.evaluate(()=>guide.locate());check(await page.evaluate(()=>__gpsCalls.length===0),preview?'Preview: zero GPS even on explicit call':'Archive capability: zero GPS');await context.close()}
 check(pageErrors.length===0,'No uncaught browser errors: '+pageErrors.join('; '));
}finally{await browser.close()}
 const report={checks,issues,pageErrors,scope:'Actual shared renderer/MapLibre with isolated basemap fixture, real owned temporary samples, simulated GPS; eight languages at320/375/390/430/1440/844landscape/720x450@2 equivalent CSS viewport for200%zoom. No physical device/live media/release acceptance.'};await writeFile(resolve(output,'browser-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));if(issues.length)process.exitCode=1;
