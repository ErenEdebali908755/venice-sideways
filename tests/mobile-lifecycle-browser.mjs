/* Local browser contract: owned sample images, real MapLibre with an isolated basemap fixture,
   simulated device positions. Does not contact production or grant physical-GPS acceptance. */
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || '/Users/erenedebali/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'), publicRoot=resolve(root,'public');
const output=resolve(process.env.GUIDE_QA_OUTPUT || resolve(root,'../visual-integration-20261005/mobile-lifecycle'));await mkdir(output,{recursive:true});
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
try {
 const {page,context}=await open('tr',390,844);await page.locator('[data-route="main"]').click();
 await page.locator('[data-action="start"]').click();const walking=await page.evaluate(()=>guide.walkingStep);const generation=await page.evaluate(()=>guide.mapGeneration);
 await page.locator('[data-action="location"]').click();await page.evaluate(()=>__gpsCalls[0].success({coords:{longitude:12.33,latitude:45.44,accuracy:20},timestamp:Date.now()}));
 await page.waitForFunction(()=>guide.locationState==='tracking');await page.locator('[data-sheet="expanded"]').click();
 check(await page.evaluate(()=>guide.watch===null&&guide.locationPin===null&&guide.locationState==='suspended'&&__gpsCleared.includes(1)),'Expanded sheet stops watch, marker and accuracy immediately');
 await page.locator('[data-sheet="standard"]').click();await page.waitForTimeout(100);
 check(await page.evaluate(()=>__gpsCalls.length===1&&guide.mapGeneration)===generation,'Showing map does not restart GPS or recreate map');
 await page.evaluate(()=>__gpsCalls[0].success({coords:{longitude:12.34,latitude:45.44,accuracy:20},timestamp:Date.now()}));
 check(await page.evaluate(()=>guide.locationEngine.fix===null),'Hidden-map late fix remains rejected');
 await page.locator('[data-action="location"]').click();await page.evaluate(()=>__gpsCalls[1].success({coords:{longitude:12.33,latitude:45.44,accuracy:300},timestamp:Date.now()}));
 await page.waitForFunction(()=>guide.locationState==='tracking');check(await page.locator('.fg-map-status').textContent().then(value=>value.includes('Doğruluk düşük')),'Low accuracy has genuine engine-derived localized state');
 const camera=await page.evaluate(()=>JSON.stringify(guide.cameraSnapshot()));await page.evaluate(()=>guide.map.fire('webglcontextlost'));
 check(await page.evaluate(()=>!guide.ready&&guide.watch===null&&guide.locationState==='suspended'),'Simulated WebGL loss stops GPS and enters independent map recovery');
 check(await page.locator('.fg-map-status button').isVisible(),'WebGL loss supplies map-only retry');
 await page.locator('.fg-map-status button').click();await page.waitForFunction(()=>guide.ready);
 check(await page.evaluate(()=>guide.mapGeneration===2&&document.querySelectorAll('.maplibregl-canvas').length===1),'Explicit map retry disposes previous canvas and recreates exactly one');
 check(await page.evaluate(()=>JSON.stringify(guide.cameraSnapshot()))===camera,'Map retry restores prior camera');
 check(await page.evaluate(()=>__gpsCalls.length===2&&guide.watch===null),'Map recovery does not restart GPS');
 check(await page.evaluate(()=>guide.walkingStep)===walking,'Map recovery preserves walking step');
 await page.evaluate(()=>guide.map.setStyle({version:8,sources:{openmaptiles:{type:'vector',tiles:[location.origin+'/test/empty/{z}/{x}/{y}.pbf'],minzoom:0,maxzoom:0}},layers:[{id:'background',type:'background',paint:{'background-color':'#f8f1e6'}}]}));
 await page.waitForFunction(async()=>guide.map.getLayer('fg-walk')&&guide.map.getLayer('fg-boat')&&(await guide.map.getSource('fg-route').getData()).features.length>0);
 check(await page.evaluate(()=>guide.pins.length===1),'Style reload rebinds real route and active pin only');
 await page.waitForFunction(()=>guide.map.getImage('fg-art-station')?.data?.width>0);
 const imageDimensions=await page.evaluate(()=>['fg-art-station','fg-art-bridge','fg-art-dogana','fg-garden-leaves'].map(name=>{const image=guide.map.getImage(name)?.data;return {name,width:image?.width,height:image?.height}}));
 check(imageDimensions.every(item=>item.width>0&&item.height>0),'Real four watercolor images remain registered after style reload');
 let retryAllowed=false,retryRequests=0;await page.route('**/test/retry-photo.webp',async route=>{retryRequests++;await route.fulfill(retryAllowed?{body:await readFile(resolve(photographs,'3.webp')),contentType:'image/webp',headers:{'Cache-Control':'no-store'}}:{status:503,body:'Controlled derivative error',headers:{'Cache-Control':'no-store'}})});
 await page.evaluate(()=>{guide.referencePhotos=[];const visit=guide.route.visits.find(visit=>visit.key===guide.walkingStep);visit.gallery=[{assetID:'controlled-retry-photo',order:0,referenceOnly:true,credit:'Eren Edebali',sourceLanguage:'en',copy:[{locale:'en',alt:'Temporary owned photograph, stop association unverified'}],derivatives:[{variant:'r900',url:location.origin+'/test/retry-photo.webp',width:900,height:1350}]}];guide.openDetail(visit.key)});
 await page.locator('.fg-gallery-stage .fg-photo-error button').waitFor({state:'visible'});const beforeRequests=retryRequests;retryAllowed=true;await page.locator('.fg-gallery-stage .fg-photo-error button').click();await page.locator('.fg-gallery-stage img').waitFor({state:'visible'});await page.waitForFunction(()=>guide.el('.fg-gallery-stage img').complete&&guide.el('.fg-gallery-stage img').naturalWidth>0);
 check(retryRequests>beforeRequests&&await page.evaluate(()=>guide.selectedPhoto==='controlled-retry-photo'),'Manual photo retry requests same derivative and keeps asset identity');
 check(await page.evaluate(()=>guide.walkingStep)===walking,'Photo retry does not advance walk');
 await page.locator('[data-open-photo]').click();await page.evaluate(()=>{guide.themePreference='dark';guide.applyTheme()});
 await page.waitForFunction(()=>[...guide.el('.fg-dialog').querySelectorAll('.fg-icon use')].every(use=>use.getBBox().width>0));
 check(await page.locator('.fg-dialog .fg-icon').first().evaluate(svg=>getComputedStyle(svg).color==='rgb(242, 240, 235)'&&svg.querySelector('use').getBBox().width>0),'Loaded native sprite has visible dark-theme geometry and correct inherited ink');
 await page.screenshot({path:resolve(output,'dark-lightbox-tr-390.png')});
 await page.locator('[data-photo-zoom]').click();const photoID=await page.evaluate(()=>guide.selectedPhoto);
 await page.evaluate(()=>{const stage=guide.el('.fg-gallery-stage');stage.dispatchEvent(new TouchEvent('touchstart',{touches:[new Touch({identifier:1,target:stage,clientX:250,clientY:300})]}));stage.dispatchEvent(new TouchEvent('touchend',{changedTouches:[new Touch({identifier:1,target:stage,clientX:60,clientY:300})]}));});
 check(await page.evaluate(()=>guide.selectedPhoto)===photoID,'Zoom gesture does not switch photograph');
 check(await page.locator('.fg-gallery-stage').evaluate(stage=>stage.scrollWidth>stage.clientWidth),'Zoom exposes native pan surface');
 await page.keyboard.press('Escape');await page.waitForFunction(()=>guide.modalMode==='detail');
 await page.keyboard.press('Escape');await page.waitForFunction(()=>!guide.modalMode);
 await page.evaluate(()=>{guide.index=guide.steps().length-1;guide.started=true;guide.render();guide.draw()});const finalStop=await page.evaluate(()=>guide.walkingStep);
 await page.locator('[data-action="next"]').click();check(await page.evaluate(()=>guide.completed&&guide.walkingStep)===finalStop,'Manual final action opens completion attached to real final stop');
 await page.screenshot({path:resolve(output,'completion-tr-390.png')});await page.locator('[data-inspect]').click();check(await page.evaluate(()=>guide.inspectedVisit===guide.walkingStep),'Completion can inspect real final stop');
 await page.keyboard.press('Escape');await page.waitForFunction(()=>!guide.modalMode);await page.locator('.fg-completion [data-action="explore"]').click();check(await page.evaluate(()=>guide.view==='explore'&&!guide.completed),'Completion returns to same route selection');
 await context.close();check(pageErrors.length===0,'No uncaught browser errors');
 await writeFile(resolve(output,'browser-report.json'),JSON.stringify({checks,issues,pageErrors,imageDimensions,scope:'Actual MapLibre/shared guide; isolated basemap, owned temporary photo, simulated GPS and MapLibre WebGL event. Physical WebGL loss/GPS/device performance remain separate.'},null,2));
} finally {await browser.close()}
console.log(JSON.stringify({checks,issues,pageErrors}));if(issues.length)process.exitCode=1;
