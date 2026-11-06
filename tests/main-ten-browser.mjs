// GET-only acceptance. Local mode serves this checkout; live mode never mocks API/data.
// PLAYWRIGHT_MODULE may point at an existing local Playwright installation.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createServer} from '../server.mjs';
const {webkit,chromium,devices}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const expected=JSON.parse(await readFile(new URL('../public/field-guide/routes.json',import.meta.url),'utf8'));
const main=expected.routes.find(r=>r.key==='main');
const keys=main.visits.map(v=>v.key),storageKey='sideways-walking-progress-v1';
const output=resolve(process.env.MAIN_TEN_QA_OUTPUT || 'qa-output/main-ten');await mkdir(output,{recursive:true});
let server,base=process.env.MAIN_TEN_BASE_URL;
if(!base){server=await createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base='http://127.0.0.1:'+server.address().port;}
const local=!!server,results=[];
const fullSaved={schemaVersion:1,routeKey:'full',targetKey:'frari',phase:'walking',completedVisitKeys:['lucia','giacomo'],transitLeg:0};
try{
for(const [engine,device,width,lang] of [[webkit,'iPhone 13',390,'tr'],[chromium,'Pixel 7',412,'en']]){
 const name=`${engine.name()}-${width}-${lang}`,result={name,base,checks:[],errors:[],consoleErrors:[],blocked:[],tileResponses:0};results.push(result);
 const browser=await engine.launch({headless:true});
 const context=await browser.newContext({...devices[device],viewport:{width,height:844},locale:lang,serviceWorkers:'block'});
 await context.route('**/*',async route=>{
  const req=route.request(),url=new URL(req.url());
  if(req.method()!=='GET'){result.blocked.push(req.method()+' '+url.pathname);return route.abort();}
  if(local&&url.origin===base&&url.pathname==='/api/route-catalog')return route.fulfill({json:{routes:[{key:'main',title:'Main Walk',published:false},{key:'full',title:'Full Walk',published:false}]}});
  if(local&&url.origin===base&&url.pathname==='/api/events')return route.fulfill({json:{events:[]}});
  return route.continue();
 });
 const page=await context.newPage();page.on('pageerror',e=>result.errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')result.consoleErrors.push(m.text());});
 page.on('response',r=>{if(r.status()===200&&/openfreemap.*\/\d+\/\d+\/\d+/.test(r.url()))result.tileResponses++;});
 const check=(ok,message)=>{result.checks.push({ok:!!ok,message});if(!ok)throw Error(message);};
 const shot=async label=>page.screenshot({path:resolve(output,name+'-'+label+'.png'),fullPage:true});
 const saved=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)||'{}'),storageKey);
 const open=async()=>{await page.waitForLoadState('networkidle');await page.goto(base+'/?lang='+lang,{waitUntil:'domcontentloaded'});await page.locator('[data-route="main"]').waitFor({timeout:30000});await page.locator('[data-route="main"]').click();await page.locator('.fg-walking-dock').waitFor();await page.waitForLoadState('networkidle');};
 try{
  await page.goto(base+'/?lang='+lang,{waitUntil:'domcontentloaded'});await page.locator('[data-route="main"]').waitFor({timeout:30000});
  check((await page.locator('.fg-main-summary').innerText()).includes('Ponte dei Tre Archi'),'Overview names the new final stop');
  check(!/Vino Vero/i.test(await page.locator('body').innerText()),'Overview has no Vino Vero');
  await page.evaluate(({key,full})=>localStorage.setItem(key,JSON.stringify({full})),{key:storageKey,full:fullSaved});
  await open();await page.waitForTimeout(2500);
  check(await page.locator('.maplibregl-canvas').count()===1,'MapLibre canvas');
  await page.waitForFunction(()=>!document.querySelector('[data-action="dimension"]')?.disabled,{timeout:20000});
  check(await page.locator('[data-action="dimension"]').isEnabled(),'Map style loaded');
  await page.locator('[data-panel="stops"]').click();
  check(await page.locator('.fg-stop-list [data-inspect]').count()===10,'Exactly ten stops in Stops');
  check(await page.locator('.fg-stop-list [data-inspect-transfer]').count()===1,'One transfer containing two boat legs');
  for(const visit of main.visits){
   await page.locator(`.fg-stop-list [data-inspect="${visit.key}"]`).click();
   const story=page.locator('.fg-dialog[open] .fg-place-story'),copy=visit.story.copy.find(c=>c.locale===lang);
   check(await story.getAttribute('lang')===lang,visit.key+': correct story language');
   const text=await story.innerText();check(text.includes(copy.shortHistory)&&text.includes(copy.interestingDetail),visit.key+': both approved fields visible');
   check(!/Vino Vero/i.test(await page.locator('.fg-dialog[open]').innerText()),visit.key+': no retired stop in card');
   if(['barnaba','trearchi'].includes(visit.key))await shot(visit.key+'-story');
   await page.keyboard.press('Escape');await page.locator('.fg-dialog[open]').waitFor({state:'hidden'});
  }
  await page.locator('[data-panel="map"]').click();
  let transit=0,refreshChecked=false,completed=false;
  for(let i=0;i<28;i++){
   const phase=await page.locator('#field-guide').getAttribute('data-walking-phase');
   check(!/Vino Vero/i.test(await page.locator('body').innerText()),'No retired stop in walking UI '+i);
   if(phase==='complete'){completed=true;break;}
   const action=page.locator('.fg-walking-dock [data-action="walk-advance"]');
   check(await action.evaluate(e=>{const r=e.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return r.y>=0&&r.bottom<=innerHeight+1&&r.height>=44&&(e===hit||e.contains(hit));}),'Primary action usable '+i);
   if(phase==='transit'){transit++;if(transit===1){await page.waitForTimeout(3500);await shot('transit');}}
   await action.click();await page.waitForTimeout(660);
   if(!refreshChecked&&i===3){const before=(await saved()).main;await open();check(JSON.stringify((await saved()).main)===JSON.stringify(before),'Mid-walk refresh preserves progress');refreshChecked=true;}
  }
  const final=(await saved()).main;
  check(completed&&final.phase==='complete'&&final.targetKey==='trearchi','Walk explicitly completes at Tre Archi');
  check(JSON.stringify(final.completedVisitKeys)===JSON.stringify(keys),'All ten stops completed in order');check(transit===2,'Two boat actions completed');
  await shot('completed');await open();check((await saved()).main.phase==='complete','Completion survives refresh');
  const preserved=(await saved()).full;check(preserved.targetKey===fullSaved.targetKey&&preserved.phase===fullSaved.phase&&JSON.stringify(preserved.completedVisitKeys)===JSON.stringify(fullSaved.completedVisitKeys),'Saved Full progress preserved');
  await page.evaluate(({key,keys})=>{const all=JSON.parse(localStorage.getItem(key)||'{}');all.main={schemaVersion:1,routeKey:'main',targetKey:'vino',phase:'at-stop',revision:'old',completedVisitKeys:keys,transitLeg:0};localStorage.setItem(key,JSON.stringify(all));},{key:storageKey,keys});
  await open();const recovered=(await saved()).main;check(recovered.targetKey==='trearchi'&&recovered.phase==='complete','Old Vino session safely recovers to finished Tre Archi');await shot('old-vino-recovered');
  check(result.tileResponses>0,'Real map vector tiles received');check(result.errors.length===0,'Zero JavaScript page errors');
 }catch(error){result.error=String(error);await shot('failure').catch(()=>{});}
 finally{await browser.close();await writeFile(resolve(output,'results.json'),JSON.stringify(results,null,2));console.log(JSON.stringify({name,checks:result.checks.length,error:result.error,errors:result.errors,tileResponses:result.tileResponses}));}
}
}finally{if(server)await new Promise(resolve=>server.close(resolve));}
if(results.some(r=>r.error||r.errors.length))process.exitCode=1;
