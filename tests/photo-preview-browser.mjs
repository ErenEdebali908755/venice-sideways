/* Local browser contract: owned sample images, real MapLibre with an isolated basemap fixture,
   simulated device positions. Does not contact production or grant physical-GPS acceptance. */
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || '/Users/erenedebali/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'), publicRoot=resolve(root,'public');
const output=resolve(process.env.GUIDE_QA_OUTPUT || resolve(root,'../map-photo-layout-20261006/photo-preview/after'));await mkdir(output,{recursive:true});
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
}// This matrix exercises only approved temporary portraits. Changing the cover flag here is
// a local presentation fixture, not a new stop/photo assignment or published content edit.
const sizes=[[320,568,3],[390,844,2],[430,932,1],[844,390,1],[1280,720,1],[1440,900,1]];
const records=[];const cases=[];
for(const language of ['en','tr'])for(const size of sizes)for(const theme of ['light','dark'])cases.push({language,size,theme,route:'main'});
for(const language of ['it','fr','ru','zh','ja','ko'])for(const size of [sizes[1],sizes[5]])for(const theme of ['light','dark'])cases.push({language,size,theme,route:'main'});
for(const language of ['en','tr'])for(const size of [sizes[1],sizes[5]])cases.push({language,size,theme:'dark',route:'full'});
async function settle(page){await page.evaluate(async()=>{await document.fonts.ready;const images=[...document.querySelectorAll('.fg-stop-preview img,.fg-gallery-stage img')];await Promise.all(images.filter(i=>!i.complete).map(i=>new Promise(resolve=>{i.addEventListener('load',resolve,{once:true});i.addEventListener('error',resolve,{once:true})})));for(let i=0;i<4;i++)await new Promise(requestAnimationFrame)});}
function digest(value){return createHash('sha256').update(value).digest('hex')}
async function measurement(page){return page.locator('.fg-stop-preview').evaluate(figure=>{
 const img=figure.querySelector('img'),button=figure.querySelector('button'),parent=figure.closest('.fg-editorial'),computed=getComputedStyle(img),pc=getComputedStyle(parent);
 const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,right:r.right}};
 const caption=figure.querySelector('figcaption');return {surface:'normal-stop-preview',url:location.href,classes:figure.className,currentSrc:img.currentSrc,natural:{width:img.naturalWidth,height:img.naturalHeight},attributes:{width:img.getAttribute('width'),height:img.getAttribute('height')},computed:{width:computed.width,height:computed.height,aspectRatio:computed.aspectRatio,objectFit:computed.objectFit,objectPosition:computed.objectPosition,filter:computed.filter},image:rect(img),button:rect(button),figure:rect(figure),caption:caption&&rect(caption),captionText:caption?.textContent,parent:rect(parent),parentContentHeight:parent.clientHeight-parseFloat(pc.paddingTop)-parseFloat(pc.paddingBottom),parentScrollHeight:parent.scrollHeight,parentScrollTop:parent.scrollTop,containerType:pc.containerType,dialogOpen:document.querySelector('.fg-dialog').open,zoomClass:document.querySelector('.fg-dialog').classList.contains('fg-photo-zoomed'),rootTheme:guide.root.dataset.theme,walkingStep:guide.walkingStep,mapGeneration:guide.mapGeneration,mapCanvasCount:document.querySelectorAll('.maplibregl-canvas').length,gpsCalls:__gpsCalls.length,photoSelection:guide.referencePhotos.map(p=>p.assetID),temporaryText:guide.el('.fg-gallery-link')?.textContent,primaryAction:!!guide.el('[data-action="start"],[data-action="next"]')}
 });}
try{
 for(const item of cases){
  const {language,size:[width,height,scale],theme,route}=item;const label=`${route}/${language}/${width}x${height}@${scale}/${theme}`;const {page,context}=await open(language,width,height,false,base,scale);
  await page.locator(`[data-route="${route}"]`).click();await page.waitForFunction(()=>guide.ready&&!guide.map.isMoving());await page.evaluate(theme=>{guide.themePreference=theme;guide.applyTheme()},theme);
  const before=await page.evaluate(()=>({generation:guide.mapGeneration,walk:guide.walkingStep,camera:JSON.stringify(guide.cameraSnapshot()),geometry:JSON.stringify(guide.route.segments.map(s=>({key:s.key,type:s.type,geometry:s.geometry,visits:guide.route.visits.filter(v=>v.segmentKey===s.key).map(v=>({key:v.key,longitude:v.longitude,latitude:v.latitude,order:v.order}))})))}));
  const record={...item,geometryDigest:digest(before.geometry),normal:[],interactions:[]};
  for(const id of [3,6,18]){
   await page.evaluate(async id=>{const {temporarySelection}=await import('/field-guide/temporary-selection.js');guide.referencePhotos=temporarySelection.map(p=>({...p,cover:p.assetID===`reference-eren-${id}`}));guide.render()},id);
   await settle(page);await page.waitForFunction(()=>guide.el('.fg-stop-preview img')?.complete&&guide.el('.fg-stop-preview img').naturalWidth>0);const measured=await measurement(page);record.normal.push({id,...measured});
   check(measured.currentSrc.includes(`/image/${id}/`),label+`: actual approved temporary portrait ${id}`);
   check(measured.attributes.height==='2200'&&measured.attributes.width===(id===18?'1373':'1238'),label+`: intrinsic metadata ${id} preserved`);
   check(measured.computed.objectFit==='contain'&&measured.computed.aspectRatio==='auto'&&measured.computed.filter==='none',label+`: complete ${id} frame, no forced crop or tonal filter`);
   check(measured.image.height<=240.5&&measured.image.height>=43.5&&measured.figure.height<=measured.parentContentHeight*.36+1,label+`: compact ${id} image and caption within about one third of usable panel`);
   check(measured.button.height>=43.5&&measured.button.width>=44&&measured.image.height<=measured.button.height+.5,label+`: bounded native ${id} touch control`);
   check(!measured.dialogOpen&&!measured.zoomClass&&measured.primaryAction&&measured.captionText==='Eren Edebali',label+`: normal ${id} surface retains credit and walking action`);
   check(measured.photoSelection.every(p=>['reference-eren-3','reference-eren-6','reference-eren-18'].includes(p)),label+': only authorized temporary selection');
   if(language==='tr'&&(id===3||[390,1440].includes(width)))await page.screenshot({path:resolve(output,`normal-${route}-${language}-${width}x${height}-${theme}-${id}.png`)});
  }
  await page.locator('.fg-stop-preview-open').focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>guide.modalMode==='lightbox');await settle(page);
  const full=await page.locator('.fg-gallery-stage img').evaluate(img=>({fit:getComputedStyle(img).objectFit,height:img.getBoundingClientRect().height,filter:getComputedStyle(img).filter,previewClass:!!img.closest('.fg-stop-preview'),widthAttribute:img.getAttribute('width'),heightAttribute:img.getAttribute('height')}));
  check(full.fit==='contain'&&full.filter==='none'&&!full.previewClass&&full.height<=height*.66+1,label+': native preview keyboard opens separate unzoomed full frame');
  check(await page.locator('.fg-dialog .fg-reference-note').isVisible(),label+': explicit unverified temporary-photo notice in large view');
  await page.locator('[data-photo-zoom]').click();const selected=await page.evaluate(()=>guide.selectedPhoto);await page.keyboard.press('ArrowRight');
  const zoom=await page.locator('.fg-gallery-stage img').evaluate(img=>({maxWidth:getComputedStyle(img).maxWidth,maxHeight:getComputedStyle(img).maxHeight,stageWidth:img.closest('.fg-gallery-stage').clientWidth,imageWidth:img.getBoundingClientRect().width}));
  check(zoom.maxWidth==='none'&&zoom.maxHeight==='none'&&zoom.imageWidth>zoom.stageWidth*1.8,label+': explicit 200% zoom remains independently pannable');
  check(await page.evaluate(()=>guide.selectedPhoto)===selected,label+': zoom keyboard pan preserves photograph identity');
  await page.locator('[data-photo-zoom]').click();await page.goBack();await page.waitForFunction(()=>guide.modalMode==='detail');await settle(page);
  check(await page.locator('.fg-gallery-stage img').evaluate(i=>getComputedStyle(i).objectFit==='contain'&&!i.closest('.fg-stop-preview')),label+': Back returns to separate detail contain view');
  await page.keyboard.press('Escape');await page.waitForFunction(()=>!guide.modalMode&&!guide.el('.fg-dialog').open);
  check(await page.locator('.fg-stop-preview-open').evaluate(button=>document.activeElement===button),label+': Escape returns native focus to normal preview opener');
  await page.locator('.fg-gallery-link').click();await page.waitForFunction(()=>guide.modalMode==='detail');await settle(page);await page.locator('.fg-dialog').hover();await page.mouse.wheel(0,80);await page.waitForFunction(()=>guide.el('.fg-dialog').scrollTop>0);
  const scroll=await page.locator('.fg-dialog').evaluate(d=>d.scrollTop);await page.keyboard.press('Escape');await page.waitForFunction(()=>!guide.el('.fg-dialog').open);await page.locator('.fg-gallery-link').click();await page.waitForFunction(()=>guide.el('.fg-dialog').open);await settle(page);
  const reopened=await page.locator('.fg-dialog').evaluate(d=>({scrollTop:d.scrollTop,title:d.querySelector('h1').getBoundingClientRect().top,close:d.querySelector('.fg-close').getBoundingClientRect().bottom,previewClass:!!d.querySelector('.fg-stop-preview')}));
  check(scroll>0&&reopened.scrollTop===0&&reopened.title>=reopened.close-1&&!reopened.previewClass,label+': closed detail wheel/Escape/reopen starts with an unobscured heading');record.interactions.push({full,zoom,scrolledBeforeClose:scroll,reopened});
  await page.keyboard.press('Escape');await page.waitForFunction(()=>!guide.modalMode);
  if(width<=900){for(const state of ['collapsed','expanded','standard']){await page.locator(`[data-sheet="${state}"]`).click();await settle(page);check(await page.evaluate(()=>guide.mapGeneration)===before.generation,label+`: ${state} panel retains map instance`);if(state==='collapsed')check(!await page.locator('.fg-stop-preview').isVisible()&&await page.locator('[data-action="start"],[data-action="next"]').isVisible(),label+': compact panel retains walking action and hides preview');if(state==='expanded'){const expanded=await measurement(page);check(expanded.image.height<=240.5&&expanded.image.height<=expanded.parentContentHeight*.34+1,label+': expanded photo remains bounded within actual taller panel');record.expanded=expanded}}}
  const after=await page.evaluate(()=>({generation:guide.mapGeneration,walk:guide.walkingStep,camera:JSON.stringify(guide.cameraSnapshot()),geometry:JSON.stringify(guide.route.segments.map(s=>({key:s.key,type:s.type,geometry:s.geometry,visits:guide.route.visits.filter(v=>v.segmentKey===s.key).map(v=>({key:v.key,longitude:v.longitude,latitude:v.latitude,order:v.order}))}))),canvas:document.querySelectorAll('.maplibregl-canvas').length,gps:__gpsCalls.length,overflow:document.documentElement.scrollWidth>innerWidth+1}));
  check(after.generation===before.generation&&after.walk===before.walk&&after.camera===before.camera&&after.geometry===before.geometry&&after.canvas===1,label+': photo, dialog and panel interactions preserve real geometry, camera, active step and one canvas');check(after.gps===0&&!after.overflow,label+': no location start or horizontal overflow');
  record.after={...after,geometryDigest:digest(after.geometry)};delete record.after.geometry;records.push(record);await context.close();
 }
 // Native one-time request failure, followed by manual retry of the same approved derivative.
 for(const [width,height]of [[320,568],[390,844],[1440,900]]){
  const {page,context}=await open('tr',width,height);let failed=false;let retried=0;let allowed=false;const requestPaths=[];
  await page.route('https://erenedebali.com/image/6/*',async route=>{requestPaths.push(new URL(route.request().url()).pathname);if(!allowed){failed=true;await route.abort('failed')}else{retried++;await route.fulfill({body:await readFile(resolve(photographs,'6.webp')),contentType:'image/webp',headers:{'Cache-Control':'no-store'}})}});
  await page.locator('[data-route="main"]').click();await page.waitForFunction(()=>guide.ready&&!guide.map.isMoving());await page.evaluate(()=>{guide.referencePhotos=guide.referencePhotos.map(p=>({...p,cover:p.assetID==='reference-eren-6'}));guide.render()});
  await page.locator('.fg-stop-preview > .fg-photo-error button').waitFor({state:'visible'});const errorBox=await page.locator('.fg-stop-preview').evaluate(f=>({figure:f.getBoundingClientRect().height,error:f.querySelector('.fg-photo-error').getBoundingClientRect().height,caption:f.querySelector('figcaption')?.textContent}));await page.screenshot({path:resolve(output,`normal-retry-${width}.png`)});allowed=true;await page.locator('.fg-stop-preview > .fg-photo-error button').click();await page.waitForFunction(()=>guide.el('.fg-stop-preview img')?.complete&&guide.el('.fg-stop-preview img').naturalWidth>0);await settle(page);const restored=await measurement(page);
  check(failed&&retried>0&&requestPaths.every(p=>/^\/image\/6\/(web|thumb)$/.test(p)),`retry/${width}: only native same approved photo derivative requests`);check(Math.abs(errorBox.figure-restored.figure.height)<1&&Math.abs(errorBox.error-restored.button.height)<1&&errorBox.caption==='Eren Edebali',`retry/${width}: error and restored frame stable with credit retained`);check(await page.locator('.fg-stop-preview-open').evaluate(b=>document.activeElement===b),`retry/${width}: successful retry returns focus to preview opener`);records.push({type:'native-retry',width,height,errorBox,restored,requestPaths});await context.close();
 }
 check(pageErrors.length===0,'No uncaught browser errors: '+pageErrors.join('; '));
}finally{await browser.close()}
const report={at:new Date().toISOString(),checks,issues,pageErrors,cases:cases.length,records,scope:'Local actual shared renderer, real MapLibre with isolated basemap, authorized temporary owned portraits 3/6/18. Targeted photo-specific EN/TR six viewport matrix with light/dark/DPR1/2/3 plus all eight locales on390/1440, and four Full targets. Native buttons, keyboard, history, wheel, actual one-time derivative request failure/retry. No production, physical-device, real GPS or final stop/photo relationship claim.'};await writeFile(resolve(output,'photo-preview-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({checks,issues,pageErrors,cases:cases.length,report:resolve(output,'photo-preview-report.json')}));if(issues.length)process.exitCode=1;
