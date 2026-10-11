// GET-only walk-day acceptance against the actual production image or live site.
// No data mocking during ordinary walks; network failures and GPS are deliberate simulations.
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {uiCopy} from '../public/field-guide/ui-copy.js';
const {webkit,chromium,devices}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.WALK_DAY_BASE_URL||'http://127.0.0.1:33011';
const out=resolve(process.env.WALK_DAY_OUTPUT||'qa-output/walk-day');await mkdir(out,{recursive:true});
const routes=JSON.parse(await readFile(new URL('../public/field-guide/routes.json',import.meta.url),'utf8'));
const visits=routes.routes.find(r=>r.key==='main').visits,keys=visits.map(v=>v.key);
const langs=['en','tr','it','fr','ru','zh','ja','ko'],storage='sideways-walking-progress-v1';
const removed=['Estimate · not yet verified in the field. Getting to the start, long meals and the return trip are excluded.','Photos at this stop'];
const retired='.fg-stop-preview,.fg-photo-kind,.fg-gallery,.fg-gallery-link,.fg-photo-full,[data-open-stop-photo],.fg-compact-empty';
const all=[],only=process.env.WALK_DAY_ONLY||'';
const delay=ms=>new Promise(r=>setTimeout(r,ms));
for(const [engine,device,normal,lang] of [[webkit,'iPhone 13',{width:390,height:844},'tr'],[chromium,'Pixel 7',{width:412,height:915},'en']]){
 if(only&&only!==engine.name())continue;
 const browser=await engine.launch({headless:true});
 for(const mode of (process.env.WALK_DAY_MODES?process.env.WALK_DAY_MODES.split(','):['portrait','small','landscape','denied','granted','slow','map-unavailable'])){
  const viewport=mode==='small'?{width:360,height:640}:mode==='landscape'?{width:normal.height,height:normal.width}:normal;
  const name=`${engine.name()}-${mode}`,r={name,viewport,base,checks:[],errors:[],consoleErrors:[],nonGetBlocked:[],retiredRequests:[],screenshots:[],tiles:0};all.push(r);
  const context=await browser.newContext({...devices[device],viewport,locale:lang,serviceWorkers:'block',permissions:mode==='granted'?['geolocation']:[],...(mode==='granted'?{geolocation:{latitude:45.44085,longitude:12.32145,accuracy:15}}:{})});
  let offline=false;
  await context.route('**/*',async route=>{
   const req=route.request(),url=new URL(req.url());
   if(req.method()!=='GET'){r.nonGetBlocked.push(req.method()+' '+url.pathname);return route.abort();}
   if(/\/field-guide\/photos\//.test(url.pathname))r.retiredRequests.push(url.pathname);
   if(mode==='map-unavailable'&&(/tiles\.openfreemap\.org/.test(url.hostname)||/maplibre\.js$/.test(url.pathname)))return route.abort();
   if(mode==='slow'&&engine.name()==='webkit'&&!offline){
    // WebKit has no CDP throttle: delay each actual GET response by 400ms + bytes/150KBps.
    try{const response=await route.fetch({timeout:45000}),body=await response.body();await delay(400+body.length/150000*1000);return route.fulfill({response,body});}catch{return route.abort();}
   }
   return route.continue();
  });
  const page=await context.newPage();page.setDefaultTimeout(15000);
  page.on('pageerror',e=>r.errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')r.consoleErrors.push(m.text());});
  page.on('response',response=>{if(response.ok()&&/tiles\.openfreemap\.org.*\/\d+\/\d+\/\d+/.test(response.url()))r.tiles++;});
  if(mode==='slow'&&engine.name()==='chromium'){const cdp=await context.newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:400,downloadThroughput:150000,uploadThroughput:50000,connectionType:'cellular3g'});}
  const check=(ok,label)=>{r.checks.push({ok:!!ok,label});if(!ok)throw Error(label);};
  const saved=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)||'{}').main,storage);
  const signature=async()=>JSON.stringify(await saved());
  const shot=async label=>{if(label.startsWith('stop-')||label==='finish'){await page.locator('.fg-editorial').evaluate(e=>{e.scrollTop=0;});if(!['slow','map-unavailable'].includes(mode)){await page.waitForFunction(()=>!document.querySelector('[data-action="dimension"]')?.disabled,null,{timeout:45000});await page.waitForTimeout(600);}}const path=resolve(out,`${name}-${label}.png`);await page.screenshot({path,fullPage:true});r.screenshots.push(path);};
  const clean=async label=>{
   check(await page.locator(retired).count()===0,label+': removed photo UI absent');
   const text=await page.locator('body').innerText();
   check(!langs.some(l=>removed.some(key=>text.includes(uiCopy(key,l)))),label+': removed notes absent in every language');
   const problems=await page.evaluate(()=>{
    const bad=[];if(document.documentElement.scrollWidth>innerWidth+1)bad.push('document horizontal overflow');
    for(const e of document.querySelectorAll('.fg-stop-copy,.fg-stop-copy h1,.fg-story-button,.fg-walking-dock button,.fg-view-tabs button,.fg-dialog[open] h1,.fg-dialog[open] p,.fg-dialog[open] summary')){
     const s=getComputedStyle(e),b=e.getBoundingClientRect();if(!b.width||!b.height||s.visibility==='hidden'||s.display==='none'||b.bottom<0||b.top>innerHeight)continue;
     if(b.left< -1||b.right>innerWidth+1)bad.push(e.className+': outside viewport');
     if(e.scrollWidth>e.clientWidth+2)bad.push(e.className+': clipped text');
    }
    return bad;
   });check(problems.length===0,label+': layout '+JSON.stringify(problems));
   check(r.errors.length===0,label+': zero JavaScript errors');
  };
  const story=async label=>{
   const before=await signature(),button=page.locator('.fg-stop-copy h1 + .fg-story-button');
   if(await page.locator('#field-guide').getAttribute('data-panel')==='map' && await page.locator('#field-guide').getAttribute('data-sheet')==='collapsed' && await page.locator('[data-sheet="standard"]').isVisible())await page.locator('[data-sheet="standard"]').click();
   await button.waitFor({state:'visible'});check(await button.isVisible(),label+': story button visible');
   const size=await button.evaluate(e=>{const b=e.getBoundingClientRect(),p=e.parentElement.getBoundingClientRect(),s=getComputedStyle(e);return {height:b.height,width:b.width,parent:p.width,fg:s.color,bg:s.backgroundColor};});
   check(size.height>=44&&Math.abs(size.width-size.parent)<2,label+': full-width touch target');
   await button.click();await page.locator('.fg-dialog[open] .fg-photo-ideas').waitFor();
   check(await page.locator('.fg-dialog[open] .fg-photo-ideas article').count()===5,label+': five ideas preserved');
   await page.locator('.fg-dialog[open] .fg-photo-ideas > summary').click();await clean(label+' story');
   // Browser back is the same history path used by Android's system back gesture.
   await page.goBack();await page.locator('.fg-dialog[open]').waitFor({state:'hidden'});
   check(await signature()===before,label+': story/back preserves progress');
  };
  const open=async()=>{
   await page.goto(base+'/?lang='+lang+(base.startsWith('http:')?'&gps-test=1':''),{waitUntil:'domcontentloaded',timeout:60000});
   await page.locator('[data-route="main"]').waitFor({timeout:60000});await clean('overview');
   check((await page.locator('.fg-duration').innerText()).length>30,'distance and duration retained');
   await page.locator('[data-route="main"]').click();await page.locator('.fg-walking-dock').waitFor();
   if(await page.locator('[data-sheet="standard"]').isVisible())await page.locator('[data-sheet="standard"]').click();await page.waitForTimeout(300);
  };
  const usable=async()=>check(await page.locator('.fg-walking-dock [data-action="walk-advance"]').evaluate(e=>{const b=e.getBoundingClientRect(),hit=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2);return b.top>=0&&b.bottom<=innerHeight+1&&b.height>=44&&(hit===e||e.contains(hit));}),'walking action unobscured and touch sized');
  const advance=async()=>{await usable();await page.locator('.fg-walking-dock [data-action="walk-advance"]').click();await page.waitForTimeout(660);};
  try{
   await open();await clean('first stop');await shot('stop-1');
   if(mode==='portrait'){
    await page.waitForFunction(()=>!document.querySelector('[data-action="dimension"]')?.disabled,null,{timeout:45000});
    const initial=await signature();
    for(const panel of ['stops','photos','map']){await page.locator(`[data-panel="${panel}"]`).click();await clean(panel);check(await signature()===initial,panel+': progress retained');if(panel==='stops')check(await page.locator('.fg-stop-list [data-inspect]').count()===10,'all ten stops listed');}
    // Independently inspect every stop in every language, without moving the walking target.
    await page.locator('[data-panel="photos"]').click();
    for(const language of langs){
     await page.locator('.fg-preferences > summary').click();await page.locator('.fg-language').selectOption(language);
     await page.locator('.fg-preferences > summary').click();
     for(const visit of visits){await page.locator('[data-photo-stop]').selectOption(visit.key);await story(language+' '+visit.key);}
     await shot(language+'-photos');check(await signature()===initial,language+': language switch retained progress');
    }
    await page.locator('.fg-preferences > summary').click();await page.locator('.fg-language').selectOption(lang);
    for(const theme of ['dark','light','system']){
     await page.locator('.fg-theme').selectOption(theme);await clean('theme '+theme);check(await signature()===initial,theme+': theme switch retained progress');
     const contrast=await page.locator('.fg-story-button').evaluate(e=>{
      const l=c=>{const a=c.match(/[\d.]+/g).slice(0,3).map(n=>Number(n)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return a[0]*.2126+a[1]*.7152+a[2]*.0722;};
      const s=getComputedStyle(e),a=l(s.color),b=l(s.backgroundColor);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
     });check(contrast>=4.5,theme+': story contrast '+contrast.toFixed(2));
    }
    await page.locator('.fg-preferences > summary').click();await page.locator('[data-panel="map"]').click();
   }
   if(['denied','granted'].includes(mode)){
    await page.waitForFunction(()=>!document.querySelector('[data-action="location"]')?.disabled,null,{timeout:45000});
    const beforeLocation=await signature();await page.locator('[data-action="location"]').click();await page.waitForTimeout(2000);
    check(await signature()===beforeLocation,'location does not move progress');
    if(mode==='granted')check(await page.locator('.fg-location-dot').count()>0||await page.locator('[data-action="location-off"]').count()>0,'granted location is active');
    else check((await page.locator('body').innerText()).includes(uiCopy("Location permission denied. Allow location in your browser's site settings, then try again.",lang)),'denied location explains manual continuation');
    await clean('location '+mode);
   }
   if(['slow','map-unavailable'].includes(mode)){
    await page.locator('[data-panel="stops"]').click();check(await page.locator('.fg-stop-list [data-inspect]').count()===10,'stop list usable without fast map');
    offline=true;await context.setOffline(true);
    await page.locator('.fg-stop-list [data-inspect="barnaba"]').click();await page.locator('.fg-dialog[open]').waitFor();await clean('offline story');
    await page.goBack();await page.locator('.fg-dialog[open]').waitFor({state:'hidden'});
    await page.waitForTimeout(1500);check((await page.locator('body').innerText()).length>200,'brief disconnect never blanks loaded page');
    await context.setOffline(false);offline=false;await page.locator('[data-panel="map"]').click();
   }
   const seen=new Set();let transit=0,previousChecked=false,refreshChecked=false;
   for(let n=0;n<30;n++){
    const state=await saved();await clean('step '+n);
    if(state.phase==='complete')break;
    if(state.phase==='transit')transit++;
    else if(!seen.has(state.targetKey)){
     seen.add(state.targetKey);await story('walk '+state.targetKey);
     if(state.targetKey===keys[4]){await shot('stop-5');if(mode==='portrait'&&!refreshChecked){const before=await signature();await open();check(await signature()===before,'refresh preserves mid-walk progress');
      for(const language of langs){await page.locator('.fg-preferences > summary').click();await page.locator('.fg-language').selectOption(language);await page.keyboard.press('Escape');await clean('mid-walk '+language);check(await signature()===before,'mid-walk '+language+': progress retained');}
      await page.locator('.fg-preferences > summary').click();await page.locator('.fg-language').selectOption(lang);await page.keyboard.press('Escape');refreshChecked=true;}}
    }
    const direction=page.locator('.fg-dock-secondary a'),url=new URL(await direction.getAttribute('href'));check(url.origin==='https://www.google.com'&&url.searchParams.get('api')==='1'&&url.searchParams.get('travelmode')==='walking','external walking directions remain linked');
    const target=visits.find(v=>v.key===state.targetKey);if(target)check(url.searchParams.get('destination')===`${target.latitude},${target.longitude}`,'directions target the actual stop');
    if(mode==='portrait'&&state.targetKey===keys[1]&&state.phase==='at-stop'&&!previousChecked){
     await page.locator('.fg-walking-dock [data-action="previous"]').click();await page.waitForTimeout(660);
     check((await saved()).targetKey===keys[0],'previous stop returns to Santa Lucia');previousChecked=true;continue;
    }
    await advance();
   }
   const final=await saved();check(final.phase==='complete'&&final.targetKey==='trearchi','explicit Tre Archi completion');
   check(JSON.stringify(final.completedVisitKeys)===JSON.stringify(keys),'all ten stops completed in order');check(seen.size===10,'all ten story buttons opened');check(transit===2,'both vaporetto legs acknowledged');
   await clean('finish');await shot('finish');
   if(mode==='portrait'){await open();check((await saved()).phase==='complete','completion survives refresh');check(r.tiles>0,'real map tiles loaded');}
   check(r.retiredRequests.length===0,'removed stop-photo bytes never requested');check(r.errors.length===0,'zero JavaScript errors throughout');
  }catch(e){r.failure=String(e);await shot('failure').catch(()=>{});}
  finally{await context.close();await writeFile(resolve(out,'results.json'),JSON.stringify(all,null,2));console.log(JSON.stringify({name,checks:r.checks.length,passed:!r.failure,failure:r.failure,errors:r.errors}));}
 }
 await browser.close();
}
if(all.some(r=>r.failure||r.errors.length))process.exitCode=1;
