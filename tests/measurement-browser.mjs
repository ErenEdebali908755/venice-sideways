// Phone check (WebKit iPhone + Chromium Android) for default-on anonymous counting against a local server.
// Count POSTs are answered inside the browser and never reach a server; the route catalog is a local fixture.
const {webkit,chromium,devices}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.MEASUREMENT_BASE_URL||'http://127.0.0.1:33011',FIELDS='["consent","device","event","language","metric","route"]';
const TR='Sayfa görüntülemelerini ve açılan rotaları dil ve ekran boyutuna göre sayar. GPS, isim, kalıcı ziyaretçi kimliği veya gezinme geçmişi yok; çerez kullanılmaz. Toplu sayılar 180 gün tutulur. Varsayılan olarak açıktır; kapatırsan bu cihazdan sayım yapılmaz.';
let checks=0,current='';const results=[];
const check=(ok,label)=>{checks++;results.push((ok?'PASS ':'FAIL ')+(current||'')+label);if(!ok)process.exitCode=1;};
const engines=[[webkit,'iPhone 13'],[chromium,'Pixel 7']].filter(([e])=>!process.env.MEASUREMENT_ONLY||process.env.MEASUREMENT_ONLY===e.name());
for(const [engine,device] of engines){
const browser=await engine.launch();current=engine.name()+' ';
async function session({init}={}){
 const context=await browser.newContext({...devices[device],locale:'tr-TR',serviceWorkers:'block'});
 const posts=[],other=[],errors=[];
 if(init)await context.addInitScript(init);
 await context.route('**/*',route=>{const req=route.request(),url=new URL(req.url());
  if(req.method()==='POST'&&url.pathname==='/api/community/statistics'){posts.push(JSON.parse(req.postData()));return route.fulfill({json:{ok:true}});}
  if(req.method()!=='GET'){other.push(req.method()+' '+url.pathname);return route.abort();}
  if(url.pathname==='/api/route-catalog')return route.fulfill({json:{routes:[{key:'main',published:false},{key:'full',published:false}]}});
  if(url.host!==new URL(base).host)return route.abort();
  return route.continue();});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));
 return {context,page,posts,other,errors};
}
const box=page=>page.locator('[data-measurement-preference] input[type=checkbox]').first();
const settle=page=>page.waitForTimeout(1200);
// 1. No choice stored: counts, box checked and enabled, honest text.
let s=await session();await s.page.goto(base+'/?lang=tr');await s.page.locator('[data-route="main"]').first().waitFor({timeout:30000});await settle(s.page);
check(s.posts.some(p=>p.metric==='page_view'),'no choice: page view counted');
check(await box(s.page).count()===1,'preferences checkbox present');
check(await box(s.page).isChecked(),'checkbox checked by default');check(!(await box(s.page).isDisabled()),'checkbox enabled');
check((await s.page.locator('[data-measurement-preference] .fg-muted').first().textContent())===TR,'Turkish explanation text');
check(await s.page.evaluate(()=>localStorage.getItem('sideways-measurement'))===null,'nothing stored by default');
// 2. Turn off: stops at once and stores no.
await box(s.page).evaluate(i=>i.click());const before=s.posts.length;
check(await s.page.evaluate(()=>localStorage.getItem('sideways-measurement'))==='no','turning off stores no');
await s.page.locator('[data-route="main"]').first().click();await settle(s.page);check(s.posts.length===before,'no counts after turning off (route opened)');
// 3. Reload: no persists.
await s.page.goto(base+'/?lang=tr');await s.page.locator('[data-route="main"]').first().waitFor();await settle(s.page);
check(s.posts.length===before,'no counts after reload with stored no');check(!(await box(s.page).isChecked()),'checkbox stays unchecked');
// 4. Turn on again: resumes.
await box(s.page).evaluate(i=>i.click());await settle(s.page);
check(s.posts.length>before,'turning on again resumes counting');check(await s.page.evaluate(()=>localStorage.getItem('sideways-measurement'))==='yes','stores yes');
check(s.posts.every(p=>JSON.stringify(Object.keys(p).sort())===FIELDS),'every count has only the six existing fields');
check(s.other.length===0&&s.errors.length===0,'no other writes, no JS errors');await s.context.close();
// 5. DNT + GPC on: still counts, box enabled, no blocked message.
s=await session({init:()=>{Object.defineProperty(Navigator.prototype,'globalPrivacyControl',{get:()=>true});Object.defineProperty(Navigator.prototype,'doNotTrack',{get:()=>'1'});}});
await s.page.goto(base+'/?lang=tr');await s.page.locator('[data-route="main"]').first().waitFor();await settle(s.page);
check(await s.page.evaluate(()=>navigator.globalPrivacyControl===true&&navigator.doNotTrack==='1'),'DNT/GPC simulated');
check(s.posts.some(p=>p.metric==='page_view'),'DNT/GPC: still counted');check(await box(s.page).isChecked()&&!(await box(s.page).isDisabled()),'DNT/GPC: checkbox checked and enabled');
check(!(await s.page.locator('body').innerText()).includes('Tarayıcının gizlilik tercihi'),'blocked message gone');await s.context.close();
// 6. Earlier refusal kept.
s=await session({init:()=>{if(!sessionStorage.getItem('seeded')){localStorage.setItem('sideways-measurement','no');sessionStorage.setItem('seeded','1');}}});
await s.page.goto(base+'/?lang=tr');await s.page.locator('[data-route="main"]').first().waitFor();await s.page.locator('[data-route="main"]').first().click();await settle(s.page);
check(s.posts.length===0,'earlier no: zero counts');check(!(await box(s.page).isChecked()),'earlier no: checkbox unchecked');await s.context.close();
await browser.close();
}
console.log(results.join('\n'));console.log(JSON.stringify({checks,failed:results.filter(r=>r.startsWith('FAIL')).length}));
