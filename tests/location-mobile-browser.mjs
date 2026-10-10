/* Local-only acceptance: real entry/renderer/MapLibre, isolated vector tiles.
 * Browser geolocation emulation is separate from deterministic error/burst callbacks.
 * Physical iPhone/Android GPS, battery and OS suspension are not proven here.
 */
import assert from 'node:assert/strict';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {resolve, dirname, extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const {chromium,webkit,devices}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../public');
if(!process.env.QA_OUTPUT)throw Error('Set QA_OUTPUT outside the product checkout');
const output=resolve(process.env.QA_OUTPUT);await mkdir(output,{recursive:true});
const base='https://venicesideways.com',results=[],failures=[];
const mime={'.js':'text/javascript','.css':'text/css','.json':'application/json','.html':'text/html','.svg':'image/svg+xml','.woff2':'font/woff2','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg'};
async function serve(route){
 const u=new URL(route.request().url());
 if(u.href.includes('tiles.openfreemap.org/styles/positron'))return route.fulfill({json:{version:8,sources:{openmaptiles:{type:'vector',tiles:[base+'/qa/empty/{z}/{x}/{y}.pbf'],minzoom:0,maxzoom:0}},layers:[{id:'background',type:'background',paint:{'background-color':'#f8f1e6'}}]}});
 if(u.origin!==base)return route.abort();
 if(u.pathname.startsWith('/qa/empty/'))return route.fulfill({body:Buffer.alloc(0),contentType:'application/x-protobuf'});
 if(u.pathname==='/api/route-catalog')return route.fulfill({json:{routes:[{key:'main',published:false},{key:'full',published:false}]}});
 if(u.pathname==='/api/events')return route.fulfill({json:{events:[]}});
 if(u.pathname.startsWith('/api/'))return route.fulfill({status:404,body:'{}'});
 const file=resolve(root,'.'+(u.pathname==='/'?'/index.html':u.pathname));
 if(!file.startsWith(root+'/'))return route.abort();
 try {let body=await readFile(file);if(u.pathname==='/field-guide/guide.js')body=body.toString().replace('this.root = root;','this.root = root; window.__guide = this;');return route.fulfill({body,contentType:mime[extname(file)]||'application/octet-stream'});}catch{return route.fulfill({status:404,body:''});}
}
async function open(browser,device,{width=390,lang='tr',theme='light',mock=false,geo={longitude:12.33,latitude:45.44,accuracy:100}}={}){
 const context=await browser.newContext({...devices[device],viewport:{width,height:844},locale:lang,colorScheme:theme,permissions:['geolocation'],geolocation:geo});
 if(!mock)await context.addInitScript(()=>{window.__nativeGPS=[];const original=navigator.geolocation.watchPosition.bind(navigator.geolocation);navigator.geolocation.watchPosition=(success,error,options)=>original(p=>{__nativeGPS.push({longitude:p.coords.longitude,latitude:p.coords.latitude,accuracy:p.coords.accuracy,timestamp:p.timestamp,now:Date.now()});success(p)},e=>{__nativeGPS.push({code:e.code});error(e)},options);});
 if(mock)await context.addInitScript(()=>{window.__gps={calls:[],cleared:[]};Object.defineProperty(navigator,'geolocation',{value:{watchPosition(success,error,options){__gps.calls.push({success,error,options});return __gps.calls.length;},clearWatch(id){__gps.cleared.push(id);}}});});
 const page=await context.newPage();page.setDefaultTimeout(15000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',serve);await page.goto(base+'/?lang='+lang);await page.waitForFunction(()=>window.__guide?.ready);await page.locator('[data-route="main"]').click();await page.waitForFunction(()=>__guide.ready);
 return{context,page,errors};
}
async function snapshot(page){return page.evaluate(()=>({key:__guide.walkingStep,phase:__guide.walking.phase,leg:__guide.walking.transitLeg,pins:__guide.pins.length,state:JSON.stringify(__guide.walking)}));}
async function layout(page){assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'horizontal overflow');assert(await page.locator('.fg-walking-dock .fg-primary').evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight+1&&r.height>=44;}),'walking action outside screen');}
const engines=[['webkit',webkit,'iPhone 13'],['chromium',chromium,'Pixel 7']];
for(const [engine,launcher,device]of engines.filter(([name])=>!process.env.QA_ENGINE||name===process.env.QA_ENGINE)){
 const browser=await launcher.launch({headless:true});
 try{
 for(const width of (process.env.QA_GPS_ONLY==='1'?[]:[360,390,430]))for(const lang of ['en','tr'])for(const theme of ['light','dark']){
  const name=`${engine}-${width}-${lang}-${theme}`;let context;
  try{
   const opened=await open(browser,device,{width,lang,theme});context=opened.context;const {page,errors}=opened;
   assert.equal(await page.evaluate(()=>__guide.locationEngine.active),false);assert.equal(await page.locator('#field-guide').getAttribute('data-theme'),theme);await layout(page);
   const visited=new Set(),transitLegs=new Set();let refreshed=false,transitRefreshed=false,steps=0;
   while((await snapshot(page)).phase!=='complete'&&steps++<40){
    const state=await snapshot(page);visited.add(state.key);if(state.phase==='transit')transitLegs.add(state.leg);
    await layout(page);
    if((state.key==='frari'&&!refreshed)||(state.phase==='transit'&&!transitRefreshed)){
     if(state.phase==='transit')transitRefreshed=true;else refreshed=true;
     await page.reload();await page.waitForFunction(()=>window.__guide?.ready);await page.locator('[data-route="main"]').click();assert.equal((await snapshot(page)).state,state.state,'refresh preserves exact walking state');
    }
    await page.waitForTimeout(660);await page.locator('[data-action="walk-advance"]').click();
   }
   const end=await snapshot(page);assert.equal(end.phase,'complete');assert.equal(end.key,'vino');assert.equal(visited.size,12,'eleven photo stops plus transit');assert.equal(transitLegs.size,2);assert(refreshed&&transitRefreshed);
   assert.deepEqual(errors,[]);if(width===390&&lang==='tr')await page.screenshot({path:resolve(output,name+'-finish.png')});results.push({name,passed:true,visited:[...visited],transitLegs:[...transitLegs]});
  }catch(e){failures.push({name,error:e.message});}finally{await context?.close();}
  console.log(name,failures.at(-1)?.name===name?'FAIL':'PASS');
 }
 // Native browser permission/geolocation; trace wrapper delegates unchanged positions.
 // A fresh watch avoids Chromium's transient unavailable callback during override changes.
 {const name=engine+'-emulated-geolocation';let context,gpsPage;try{
  const opened=await open(browser,device);context=opened.context;const {page}=opened;gpsPage=page;await page.locator('[data-action="location"]').click();await page.waitForFunction(()=>__guide.locationState==='tracking');
  assert.equal(await page.evaluate(()=>__guide.locationEngine.fix.accuracy),100);
  for(const accuracy of [100,1000]){
   await page.evaluate(()=>__guide.locationEngine.stop());await context.setGeolocation({longitude:12.331,latitude:45.441,accuracy});await page.locator('[data-action="location"]').click();await page.waitForFunction(a=>__guide.locationEngine.fix?.accuracy===a,accuracy);
   const radius=await page.evaluate(async()=>{const f=__guide.locationEngine.fix,p=(await __guide.map.getSource('fg-gps-accuracy').getData()).geometry.coordinates[0][0];const r=Math.PI/180;return 6371008.8*2*Math.asin(Math.sqrt(Math.sin((p[1]-f.coordinates[1])*r/2)**2+Math.cos(p[1]*r)*Math.cos(f.coordinates[1]*r)*Math.sin((p[0]-f.coordinates[0])*r/2)**2));});assert(Math.abs(radius-accuracy)<1);
  }
  const saved=await snapshot(page);await page.evaluate(()=>__guide.locationEngine.stop());await context.setGeolocation({longitude:28.97,latitude:41.01,accuracy:100});await page.locator('[data-action="location"]').click();await page.waitForFunction(()=>__guide.locationEngine.fix?.outside);assert.equal((await snapshot(page)).state,saved.state);
  await page.locator('.fg-location-copy > summary').click();await page.locator('[data-action="location-off"]').click();assert.equal(await page.evaluate(()=>__guide.locationEngine.fix),null);assert.equal(await page.locator('.fg-location-pin').count(),0);
  await page.locator('[data-action="location"]').click();await page.waitForFunction(()=>__guide.locationState==='tracking');
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});assert.equal(await page.evaluate(()=>__guide.locationState),'suspended');
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});assert.equal(await page.evaluate(()=>__guide.locationEngine.active),false);
  await page.locator('[data-action="location"]').click();await page.waitForFunction(()=>__guide.locationState==='tracking');await page.screenshot({path:resolve(output,name+'.png')});results.push({name,passed:true});
 }catch(e){failures.push({name,error:e.stack,diagnostics:await gpsPage?.evaluate(()=>({state:__guide.locationState,fix:__guide.locationEngine.fix,watch:__guide.locationEngine.watch,allowed:__guide.locationAllowed(),status:__guide.locationStatus,native:window.__nativeGPS})).catch(()=>null)});}finally{await context?.close();}}
 // Denial and timeout are deterministic Geolocation API callback simulations.
 {const name=engine+'-geolocation-errors-bursts';let context;try{
  const opened=await open(browser,device,{mock:true});context=opened.context;const {page}=opened;
  for(const [code,state]of [[1,'denied'],[3,'timeout']]){await page.locator('[data-action="location"]').click();await page.evaluate(code=>__gps.calls.at(-1).error({code}),code);assert.equal(await page.evaluate(()=>__guide.locationState),state);await layout(page);}
  await page.locator('[data-action="location"]').click();assert.equal(await page.evaluate(()=>__gps.calls.at(-1).options.enableHighAccuracy),false);
  for(const accuracy of [100,1000]){await page.evaluate(accuracy=>__gps.calls.at(-1).success({coords:{longitude:12.33,latitude:45.44,accuracy},timestamp:Date.now()}),accuracy);await page.waitForFunction(a=>__guide.locationEngine.fix?.accuracy===a,accuracy);assert.equal(await page.evaluate(async()=>(await __guide.map.getSource('fg-gps-accuracy').getData()).geometry.coordinates[0].length),49);await page.waitForTimeout(5);}
  await page.evaluate(()=>{let timestamp=Date.now();for(let i=0;i<30;i++)__gps.calls.at(-1).success({coords:{longitude:12.33+i*.00001,latitude:45.44,accuracy:100},timestamp:timestamp+i});});await page.waitForTimeout(1100);
  assert(Math.abs(await page.evaluate(()=>__guide.locationEngine.fix.coordinates[0])-12.33029)<1e-8);
  await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));assert.equal(await page.evaluate(()=>__guide.locationEngine.watch),null);assert.equal(await page.evaluate(()=>__guide.locationEngine.fix),null);
  await page.evaluate(()=>__gps.calls.at(-1).success({coords:{longitude:12.5,latitude:45.4,accuracy:10},timestamp:Date.now()}));assert.equal(await page.evaluate(()=>__guide.locationEngine.fix),null);results.push({name,passed:true});
 }catch(e){failures.push({name,error:e.message});}finally{await context?.close();}}
 }finally{await browser.close();await writeFile(resolve(output,'location-mobile-report.json'),JSON.stringify({at:new Date().toISOString(),scope:'Local real entry/renderer/MapLibre; isolated tiles. Browser geolocation emulation plus separately identified callback mocks and synthetic visibility/pagehide. No physical device proof.',results,failures},null,2));}
}
console.log(JSON.stringify({passed:results.length,failures}));if(failures.length)process.exitCode=1;
