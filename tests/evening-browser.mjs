// GET-only acceptance against local files or an actual live deployment; never submits forms.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createServer} from '../server.mjs';
import {uiCopy,UI_LANGUAGES} from '../public/field-guide/ui-copy.js';
import {temporarySelection} from '../public/field-guide/temporary-selection.js';
const {webkit,chromium,devices}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const data=JSON.parse(await readFile(new URL('../public/field-guide/routes.json',import.meta.url),'utf8'));
const main=data.routes.find(r=>r.key==='main'),lucia=main.visits[0];
const out=resolve(process.env.EVENING_QA_OUTPUT||'qa-output/evening');await mkdir(out,{recursive:true});
let server,base=process.env.EVENING_BASE_URL;
if(!base){server=await createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;}
const local=!!server,results=[];
const referencePaths=new Set(temporarySelection.flatMap(p=>p.derivatives.map(d=>new URL(d.url,base).pathname)));
try{
 for(const lang of UI_LANGUAGES){
  const engine=lang==='tr'?webkit:chromium,width=lang==='tr'?390:412;
  const result={lang,engine:engine.name(),width,base,checks:[],errors:[],references:[],blocked:[],contrasts:[]};results.push(result);
  const browser=await engine.launch({headless:true});
  const context=await browser.newContext({...devices[lang==='tr'?'iPhone 13':'Pixel 7'],viewport:{width,height:844},locale:lang,serviceWorkers:'block'});
  await context.route('**/*',async route=>{
   const req=route.request(),url=new URL(req.url());
   if(referencePaths.has(url.pathname))result.references.push(url.pathname);
   if(req.method()!=='GET'){result.blocked.push(req.method()+' '+url.pathname);return route.abort();}
   if(local&&url.origin===base&&url.pathname==='/api/route-catalog')return route.fulfill({json:{routes:[{key:'main',published:false},{key:'full',published:false}]}});
   if(local&&url.origin===base&&url.pathname==='/api/events')return route.fulfill({json:{events:[]}});
   return route.continue();
  });
  const page=await context.newPage();page.on('pageerror',e=>result.errors.push(String(e)));
  const check=(ok,name)=>{result.checks.push({ok:!!ok,name});if(!ok)throw Error(name);};
  const absent=async label=>{
   check(await page.locator('.fg-inspiration,[data-inspiration],.fg-reference-note,.fg-source-note,.fg-vignette figcaption').count()===0,label+': no samples, fallback note or visible illustration label');
   check(result.references.length===0,label+': no unrelated image requested');
  };
  try{
   await page.goto(base+'/?lang='+lang,{waitUntil:'domcontentloaded'});
   await page.locator('[data-route="main"]').waitFor({timeout:30000});await absent('Overview');
   check(await page.locator('.fg-main-summary img').count()===0,'Overview stays coverless without a route photograph');
   await page.locator('[data-route="main"]').click();await page.locator('.fg-walking-dock').waitFor();
   await page.waitForFunction(()=>!document.querySelector('[data-action="dimension"]')?.disabled,{timeout:30000});
   await page.locator('[data-panel="photos"]').click();await absent('Photos');
   check(await page.locator('.fg-stop-preview img').getAttribute('src').then(s=>s.includes('/photos/main-20261009/')),'Own verified photo stays visible');
   await page.locator('[data-panel="stops"]').click();await page.locator('.fg-stop-list [data-inspect="lucia"]').click();
   await page.locator('.fg-dialog[open] .fg-place-story').waitFor();await absent('First stop');
   check(await page.locator('.fg-place-story').last().getAttribute('lang')===lang,'First stop story uses selected language');
   const story=lucia.story.copy.find(c=>c.locale===lang),body=await page.locator('.fg-dialog').innerText();
   check(body.includes(story.shortHistory)&&body.includes(story.interestingDetail),'Both approved story fields rendered');
   check(await page.locator('.fg-vignette img').getAttribute('alt').then(s=>s.startsWith(uiCopy('Illustration',lang)+' · ')),'Localized illustration alt');
   const summary=page.locator('.fg-photo-ideas > summary');
   check((await summary.innerText()).includes(uiCopy('5 photo ideas to try at this stop',lang)),'New idea title rendered');
   check((await summary.innerText()).includes(uiCopy('Composition, light and phone tips · tap to open',lang)),'New idea help rendered');
   check(await summary.locator('svg').count()===2,'Camera and open/close arrow');
   await page.screenshot({path:resolve(out,`first-stop-${lang}-top.png`)});
   await summary.scrollIntoViewIfNeeded();
   check(await summary.evaluate(e=>{const r=e.getBoundingClientRect();return r.height>=44&&r.left>=0&&r.right<=innerWidth+1;}),'44px touch target without horizontal clipping');
   for(const scheme of ['light','dark']){
    await page.emulateMedia({colorScheme:scheme});await page.waitForTimeout(120);
    const contrast=await summary.evaluate(e=>{
     const lum=s=>{const c=s.match(/[\d.]+/g).slice(0,3).map(n=>{n=Number(n)/255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4;});return c[0]*.2126+c[1]*.7152+c[2]*.0722;};
     const ratio=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
     const s=getComputedStyle(e),bg=s.backgroundColor;
     return {title:ratio(getComputedStyle(e.querySelector('strong')).color,bg),help:ratio(getComputedStyle(e.querySelector('small')).color,bg),border:ratio(s.borderColor,bg)};
    });result.contrasts.push({scheme,...contrast});
    check(contrast.title>=4.5&&contrast.help>=4.5&&contrast.border>=3,scheme+': measured text AA and control contrast');
    await page.screenshot({path:resolve(out,`first-stop-${lang}${scheme==='dark'?'-dark':''}.png`)});
   }
   await summary.focus();await page.keyboard.press('Enter');
   check(await page.locator('.fg-photo-ideas').getAttribute('open')!==null,'Keyboard opens five ideas');
   const articles=page.locator('.fg-photo-ideas > article');check(await articles.count()===5,'Exactly five unchanged ideas');
   for(let i=0;i<5;i++){
    const copy=lucia.ideas[i].copy.find(c=>c.locale===lang),text=await articles.nth(i).innerText();
    check([copy.title,copy.text,copy.phoneTip].every(t=>text.includes(t)),'Idea '+(i+1)+': selected locale, original order and text');
   }
   await page.keyboard.press('Enter');check(await page.locator('.fg-photo-ideas').getAttribute('open')===null,'Keyboard closes ideas');
   await page.keyboard.press('Escape');await page.locator('.fg-dialog[open]').waitFor({state:'hidden'});
   check(result.references.length===0,'No reference photo requests across screens');check(result.errors.length===0,'Zero JavaScript errors');
  }catch(error){result.error=String(error);await page.screenshot({path:resolve(out,`failure-${lang}.png`)}).catch(()=>{});}
  finally{await browser.close();await writeFile(resolve(out,'results.json'),JSON.stringify(results,null,2));console.log(JSON.stringify({lang,checks:result.checks.length,error:result.error,errors:result.errors,contrasts:result.contrasts}));}
 }
}finally{if(server)await new Promise(r=>server.close(r));}
if(results.some(r=>r.error||r.errors.length))process.exitCode=1;
