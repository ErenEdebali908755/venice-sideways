// Real renderer and map, GET-only on local or production; all Main screens at 390px.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createServer} from '../server.mjs';
import {UI_LANGUAGES,uiCopy} from '../public/field-guide/ui-copy.js';
const {webkit,chromium,devices}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const {routes}=JSON.parse(await readFile(new URL('../public/field-guide/routes.json',import.meta.url),'utf8'));
const main=routes.find(r=>r.key==='main');
const out=resolve(process.env.THIRD_QA_OUTPUT||'qa-output/third');await mkdir(out,{recursive:true});
let server,base=process.env.THIRD_BASE_URL;
if(!base){server=await createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;}
const results=[];
try{
 for(const lang of (process.env.THIRD_LANGUAGES?.split(',')||UI_LANGUAGES)){
  const engine=lang==='tr'?webkit:chromium,result={lang,width:390,base,checks:[],errors:[],blocked:[],screens:[],overflow:[]};results.push(result);
  const browser=await engine.launch({headless:true});
  const context=await browser.newContext({...devices[lang==='tr'?'iPhone 13':'Pixel 7'],viewport:{width:390,height:844},locale:lang,serviceWorkers:'block'});
  await context.route('**/*',async route=>{
   const req=route.request(),url=new URL(req.url());
   if(req.method()!=='GET'){result.blocked.push(req.method()+' '+url.pathname);return route.abort();}
   if(server&&url.origin===base&&url.pathname==='/api/route-catalog')return route.fulfill({json:{routes:[{key:'main',published:false},{key:'full',published:false}]}});
   if(server&&url.origin===base&&url.pathname==='/api/events')return route.fulfill({json:{events:[]}});
   return route.continue();
  });
  const page=await context.newPage();page.setDefaultTimeout(15000);page.on('pageerror',e=>result.errors.push(String(e)));
  const check=(ok,name)=>{result.checks.push({ok:!!ok,name});if(!ok)throw Error(name);};
  const screen=async name=>{
   await page.evaluate(()=>document.fonts.ready);
   const issues=await page.evaluate(()=>{
    const root=document.querySelector('.fg-dialog[open]')||document.querySelector('#field-guide');
    const problems=[];
    if(document.documentElement.scrollWidth>innerWidth+1)problems.push({selector:'document',width:document.documentElement.scrollWidth});
    for(const e of root.querySelectorAll('h1,h2,h3,p,button,summary,select,label,li,figcaption,.fg-kicker,.fg-duration,small,strong')){
     const style=getComputedStyle(e),r=e.getBoundingClientRect();
     if(!r.width||!r.height||style.visibility==='hidden'||e.closest('details:not([open])')&&!e.closest('summary'))continue;
     // Map attribution is provider-owned. Text is measured within scrollable panels too.
     if(e.closest('.maplibregl-control-container,.maplibregl-marker'))continue;
     if(e.scrollWidth>e.clientWidth+2 && style.overflowX!=='auto' && style.overflowX!=='scroll')problems.push({selector:e.tagName+'.'+e.className,text:e.textContent.trim().slice(0,110),scroll:e.scrollWidth,client:e.clientWidth});
     if(r.left< -1||r.right>innerWidth+1)problems.push({selector:e.tagName+'.'+e.className,text:e.textContent.trim().slice(0,80),left:r.left,right:r.right});
    }
    return problems;
   });
   result.overflow.push({name,issues});
   await page.screenshot({path:resolve(out,`${lang}-${name}.png`)});result.screens.push(`${lang}-${name}.png`);
   check(issues.length===0,name+': no horizontal clipping or text overflow');
   check(await page.locator('.fg-inspiration,[data-inspiration],.fg-reference-note,.fg-source-note,.fg-vignette figcaption').count()===0,name+': no reference photos or disclosure/fallback banner');
  };
  const close=async()=>{await page.keyboard.press('Escape');await page.locator('.fg-dialog[open]').waitFor({state:'hidden'});};
  try{
   await page.goto(base+'/?lang='+lang+(server?'&gps-test=1':''),{waitUntil:'domcontentloaded'});await page.locator('[data-route="main"]').waitFor({timeout:30000});await screen('overview');
   await page.locator('.fg-preferences > summary').click();await screen('settings');await page.locator('.fg-preferences > summary').click();
   await page.locator('[data-route="main"]').click();await page.locator('.fg-walking-dock').waitFor();
   await page.waitForFunction(()=>!document.querySelector('[data-action="dimension"]')?.disabled,{timeout:30000});await page.waitForLoadState('networkidle');await screen('map-start');
   await page.locator('.fg-location-copy > summary').click();await screen('location-privacy');await page.locator('.fg-location-copy > summary').click();
   await page.locator('[data-action="location"]').click();await page.waitForTimeout(700);await screen('location-permission');
   await page.locator('.fg-map-options > summary').click();await screen('map-options');await page.locator('[data-action="places"]').click();await screen('map-notes');await close();
   await page.locator('[data-panel="stops"]').click();await screen('stops');
   for(const [i,visit] of main.visits.entries()){
    await page.locator(`.fg-stop-list [data-inspect="${visit.key}"]`).click();await page.locator('.fg-dialog[open] .fg-place-story').waitFor();
    const copy=visit.story.copy.find(c=>c.locale===lang),text=await page.locator('.fg-dialog').innerText();
    check(text.includes(copy.shortHistory)&&text.includes(copy.interestingDetail),visit.key+': approved localized story');
    await screen(`${visit.key}-story`);
    if(i===0||i===main.visits.length-1)await page.screenshot({path:resolve(out,`${i===0?'first':'last'}-stop-${lang}.png`)});
    const summary=page.locator('.fg-photo-ideas > summary');await summary.scrollIntoViewIfNeeded();
    check((await summary.innerText()).includes(uiCopy('5 photo ideas to try at this stop',lang)),visit.key+': localized five-ideas button');
    await summary.click();const articles=page.locator('.fg-photo-ideas > article');check(await articles.count()===5,visit.key+': five ideas');
    for(let j=0;j<5;j++){
     await articles.nth(j).scrollIntoViewIfNeeded();const idea=visit.ideas[j].copy.find(c=>c.locale===lang),shown=await articles.nth(j).innerText();
     check([idea.title,idea.text,idea.phoneTip].every(t=>shown.includes(t)),`${visit.key} idea ${j+1}: exact locale text`);
     await screen(`${visit.key}-idea-${j+1}`);
    }
    await page.locator('.fg-gallery-stage').scrollIntoViewIfNeeded();await screen(`${visit.key}-gallery`);
    const thumbs=page.locator('[data-photo-id]');check(await thumbs.count()>=1&&await thumbs.count()<=3,visit.key+': one to three own photos');
    for(let j=0;j<await thumbs.count();j++){
     await thumbs.nth(j).click();const img=page.locator('.fg-gallery-stage img');await img.scrollIntoViewIfNeeded();
     await img.evaluate(e=>e.decode());check(await img.evaluate(e=>e.naturalWidth>0),`${visit.key} photo ${j+1}: loads`);
     check((await img.getAttribute('alt')).length>0,`${visit.key} photo ${j+1}: alt`);
     await screen(`${visit.key}-photo-${j+1}`);
    }
    await page.locator('[data-open-photo]').click();await page.locator('.fg-lightbox[open]').waitFor();await screen(`${visit.key}-lightbox`);
    await page.keyboard.press('Escape');await page.locator('.fg-dialog[open]:not(.fg-lightbox)').waitFor();await close();
   }
   await page.locator('[data-inspect-transfer]').click();await screen('transfer-inspection');await close();
   await page.locator('[data-panel="photos"]').click();await screen('photos');
   for(const visit of main.visits){await page.locator('[data-photo-stop]').selectOption(visit.key);await screen(visit.key+'-photo-panel');}
   await page.locator('[data-panel="map"]').click();
   for(let i=0;i<28;i++){
    const phase=await page.locator('#field-guide').getAttribute('data-walking-phase');await screen(`walk-${i}-${phase}`);
    if(phase==='complete')break;
    await page.locator('.fg-walking-dock [data-action="walk-advance"]').click();await page.waitForTimeout(660);
   }
   check(await page.locator('#field-guide').getAttribute('data-walking-phase')==='complete','Main walk completed');
   check(result.errors.length===0,'Zero JavaScript errors');
  }catch(error){result.error=String(error);await page.screenshot({path:resolve(out,`failure-${lang}.png`)}).catch(()=>{});}
  finally{await browser.close();await writeFile(resolve(out,'results.json'),JSON.stringify(results,null,2));console.log(JSON.stringify({lang,checks:result.checks.length,screens:result.screens.length,error:result.error,errors:result.errors,overflow:result.overflow.filter(s=>s.issues.length)}));}
 }
}finally{if(server)await new Promise(r=>server.close(r));}
if(results.some(r=>r.error||r.errors.length))process.exitCode=1;
