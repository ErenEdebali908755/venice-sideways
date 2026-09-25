"""Standalone UI and own-location contract tests. External maps are blocked.
Position tests use a mock browser geolocation API and a tiny map interface, not real GPS.
"""
from pathlib import Path
from urllib.parse import urlparse, parse_qs
import json, re, shutil, traceback
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'qa-output';OUT.mkdir(exist_ok=True)
BASE='https://venicesideways.test'
report={'checks':[],'issues':[],'external_services':'blocked; real source loaded into an isolated DOM fixture, not live hosting','geolocation':'mocked secure context, browser API, storage and map; no real user position'}
def check(v,name):
 if not v:raise AssertionError(name)
 report['checks'].append(name)
GEO=r'''window.__geo={calls:0,clear:[],success:null,error:null,oldSuccess:null};Object.defineProperty(navigator,'geolocation',{configurable:true,value:{watchPosition(ok,fail,opts){__geo.calls++;__geo.oldSuccess=__geo.success;__geo.success=ok;__geo.error=fail;return __geo.calls;},clearWatch(id){__geo.clear.push(id);}}});'''
MAP=r'''(() => {
class Group{constructor(){this.layers=[];}addTo(){return this}clearLayers(){this.layers=[];return this}eachLayer(f){this.layers.forEach(f)}getLayers(){return this.layers}}
class Shape{constructor(isLocation=false){this.isLocation=isLocation;this.options={}}addTo(g){g.layers.push(this);if(this.isLocation)__localMap.group=g;return this}setLatLng(){return this}setRadius(){return this}bindTooltip(){return this}bindPopup(){return this}on(){return this}setStyle(){return this}}
window.L={LayerGroup:Group,Polyline:Shape,layerGroup:()=>new Group(),circle:()=>new Shape(true),circleMarker:()=>new Shape(true),polyline:()=>new Shape(),marker:()=>new Shape(),divIcon:o=>o};
window.__localMap={group:{layers:[]},handlers:{},centers:[],getZoom:()=>16,on(e,f){this.handlers[e]=f;return this},setView(p,z){this.centers.push({p,z});return this},invalidateSize(){},eachLayer(){},hasLayer(){return true},removeLayer(){},addLayer(){}};map=__localMap;
})();'''
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox'])
  for lang,locale in [('en','en-GB'),('tr','tr-TR'),('ru','ru-RU'),('fr','fr-FR'),('zh','zh-CN'),('ja','ja-JP'),('ko','ko-KR')]:
   ctx=browser.new_context(locale=locale,viewport={'width':390,'height':844},color_scheme='dark')
   ctx.add_init_script(GEO);page=ctx.new_page();errors=[];requests=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   def serve(route):
    u=urlparse(route.request.url);requests.append({'url':route.request.url,'body':route.request.post_data})
    if u.netloc!='venicesideways.test':route.abort();return
    path=ROOT/'public'/('index.html' if u.path=='/' else u.path.lstrip('/'))
    if not path.is_file():route.fulfill(status=404,body='Not found');return
    route.fulfill(status=200,body=path.read_bytes(),content_type={'.html':'text/html','.js':'application/javascript','.css':'text/css'}.get(path.suffix,'text/plain'),headers={'Permissions-Policy':'geolocation=(self), camera=(), microphone=()'})
   page.route('**/*',serve)
   # Isolated renderer: this environment blocks page navigation, so no live URL is visited.
   soup=BeautifulSoup((ROOT/'public/index.html').read_text(),'html.parser')
   scripts=[e['src'] for e in soup.select('script[src]')]
   styles=[e['href'] for e in soup.select('link[rel="stylesheet"]') if e['href'].startswith('/')]
   for e in soup.select('script[src],link[rel="stylesheet"]'):e.decompose()
   page.set_content(str(soup))
   for path in styles:page.add_style_tag(content=(ROOT/'public'/path.lstrip('/')).read_text())
   files={('/'+str(f.relative_to(ROOT/'public'))):f.read_text() for f in (ROOT/'public').rglob('*.js')}
   page.evaluate('(f)=>window.__fixtureFiles=f',files)
   page.add_script_tag(content=r"""
Object.defineProperty(window,'isSecureContext',{configurable:true,value:true});
for(const key of ['localStorage','sessionStorage'])Object.defineProperty(window,key,{configurable:true,value:{data:{},getItem(k){return this.data[k]??null},setItem(k,v){this.data[k]=String(v)},removeItem(k){delete this.data[k]}}});
Object.defineProperty(navigator,'permissions',{configurable:true,value:{query:async()=>({state:'granted',onchange:null})}});
window.__fixtureRequests=[];
window.fetch=async(u,o={})=>{__fixtureRequests.push({url:String(u),body:o.body});if(__fixtureFiles[u])return new Response(__fixtureFiles[u],{status:200});throw Error('External request blocked in fixture');};
const appendChild=document.head.appendChild.bind(document.head);
function intercept(n){if(n.tagName==='SCRIPT'&&n.getAttribute('src')){const path=n.getAttribute('src');const text=__fixtureFiles[path];if(text){n.removeAttribute('src');n.textContent=text;appendChild(n);queueMicrotask(()=>n.onload?.());}else setTimeout(()=>n.onerror?.(),50);return n;}return appendChild(n);}
document.head.appendChild=intercept;document.head.append=(...ns)=>ns.forEach(intercept);
"""+GEO)
   for path in scripts:page.add_script_tag(content=files[path])
   page.wait_for_function('(l)=>window.WalkI18n?.ready&&WalkI18n.language===l',arg=lang,timeout=30000)
   page.wait_for_timeout(150)
   check(page.title()=='Venice Sideways',lang+': branded title')
   check(page.locator('h1').inner_text()=='Venice Sideways',lang+': branded heading')
   check(page.locator('#walk-language option').count()==8,lang+': all locales and automatic mode')
   check(page.locator('#route option').count()==2,lang+': two walks')
   check(page.evaluate('stops().map(p=>p.id)')==['lucia','giacomo','frari','margherita','barnaba','trovaso','zattere','dogana','accademia','trearchi','vino'],lang+': exact revised route')
   check(page.evaluate('WalkV11.points()[1].map(p=>p.id)')==['land','trearchi','vino'],lang+': no extra Cannaregio stops')
   check(page.evaluate('WalkV11.transferPoints().map(p=>p.id)')==['board','change','land'],lang+': Ferrovia change represented')
   check(page.evaluate('WalkV11.journeys.map(j=>j.line)')==['1','5.2'],lang+': two actual boat legs')
   check(page.locator('#parts a').count()==6,lang+': four walking links plus two boat links')
   hrefs=page.locator('#parts a').evaluate_all('(xs)=>xs.map(x=>x.href)')
   check(sum('travelmode=transit' in u for u in hrefs)==2 and sum('travelmode=walking' in u for u in hrefs)==4,lang+': modes stay separate')
   check('T1' not in page.locator('body').inner_text() and 'T2' not in page.locator('body').inner_text(),lang+': no transfer codes shown')
   check(page.locator('link[rel=icon][type="image/svg+xml"]').count()==1,lang+': favicon linked')
   check(page.locator('#my-location span').text_content().strip()!='',lang+': location button label visible')
   check('arrowFor' not in (ROOT/'public/walk-v12/stages.js').read_text(),lang+': no arrow renderer')
   check(page.evaluate('stops().length')==11,lang+': preserved current main route')
   check(page.evaluate('shareURL()').startswith('https://venicesideways.com/'),lang+': canonical share domain')
   check(page.evaluate('__geo.calls')==0,lang+': no permission request on load')
   for width,height in [(320,740),(390,844),(844,390),(1440,960)]:
    page.set_viewport_size({'width':width,'height':height});page.wait_for_timeout(35)
    check(page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),lang+': no horizontal overflow '+str(width))
   page.set_viewport_size({'width':390,'height':844})
   page.evaluate("changeMode('full')");page.wait_for_timeout(50);check(page.evaluate('stops().length')==28,lang+': preserved full walk')
   page.evaluate("changeMode('main')");page.wait_for_timeout(50)
   page.locator('.guide-dock [data-guide-view="ideas"]').click();page.wait_for_timeout(35)
   check(page.locator('#stops .photo-prompt').count()==11,lang+': idea cards retained')
   first=page.locator('#stops .photo-prompt').first
   labels=[]
   for i in range(5):labels.append(first.locator('h4').inner_text());first.locator('.phone-next').click();page.wait_for_timeout(20)
   check(len(set(labels))==5,lang+': five distinct translated ideas')
   page.locator('.guide-dock [data-guide-view="map"]').click()
   check(page.evaluate('getComputedStyle(document.getElementById("map")).backgroundColor')=='rgb(229, 237, 235)',lang+': light map in dark page')
   if lang=='tr':page.screenshot(path=str(OUT/'turkish-brand-map.png'))
   # Exercise only the new location component against a mock map interface.
   page.wait_for_timeout(200)
   page.add_script_tag(content=MAP)
   page.wait_for_timeout(400)
   page.locator('#my-location').click()
   check(page.evaluate('__geo.calls')==0,lang+': opening explanation does not ask permission')
   page.locator('#location-start').click();page.wait_for_timeout(40)
   check(page.evaluate('__geo.calls')==1,lang+': explicit start requests one watcher')
   sentinel={'latitude':45.441234567,'longitude':12.321987654,'accuracy':12}
   page.evaluate('(c)=>__geo.success({coords:c,timestamp:Date.now()})',sentinel)
   check(page.evaluate('__localMap.group.layers.length')==2,lang+': point and accuracy circle')
   check(page.locator('#location-stop').is_visible(),lang+': stop available')
   page.evaluate('__localMap.handlers.dragstart()');check(not page.locator('#location-follow').is_checked(),lang+': manual pan disables follow')
   old=len(page.evaluate('__localMap.centers'))
   page.evaluate('(c)=>__geo.success({coords:c,timestamp:Date.now()})',sentinel)
   check(len(page.evaluate('__localMap.centers'))==old,lang+': no forced recenter after manual pan')
   page.locator('#location-center').click();check(page.locator('#location-follow').is_checked(),lang+': recenter resumes follow')
   page.evaluate("Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))")
   check(len(page.evaluate('__geo.clear'))>=1,lang+': hidden page clears watch')
   calls=page.evaluate('__geo.calls');page.evaluate("Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'))")
   check(page.evaluate('__geo.calls')==calls+1,lang+': visibility resumes opted-in watch')
   page.locator('#location-stop').click();check(page.evaluate('__localMap.group.layers.length')==0,lang+': stop removes all position data from display')
   page.evaluate('(c)=>__geo.success({coords:c,timestamp:Date.now()})',sentinel)
   check(page.evaluate('__localMap.group.layers.length')==0,lang+': late callback ignored after stop')
   storage=page.evaluate('JSON.stringify([localStorage.data,sessionStorage.data])')
   req=json.dumps(requests)+json.dumps(page.evaluate('__fixtureRequests'))
   for coord in ['45.441234567','12.321987654']:
    check(coord not in storage and coord not in req and coord not in page.url,lang+': device coordinate not persisted or requested')
   page.locator('#location-start').click();page.evaluate('__geo.error({code:1})')
   check(page.locator('#location-start').is_visible(),lang+': denied permission gracefully stops')
   if lang=='tr':page.screenshot(path=str(OUT/'turkish-location-permission.png'))
   check(not errors,lang+': no JS errors '+repr(errors))
   ctx.close()
  browser.close()
except Exception:
 report['issues'].append(traceback.format_exc())
finally:
 (OUT/'browser-report.json').write_text(json.dumps(report,indent=2,ensure_ascii=False))
 print(json.dumps({'checks':len(report['checks']),'issues':report['issues']},ensure_ascii=False))
 if report['issues']:raise SystemExit(1)
