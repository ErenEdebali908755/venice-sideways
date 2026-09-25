"""Bounded real-map regression; optional public-origin verification, no location upload."""
import json, os, pathlib, subprocess, time, traceback, shutil
from urllib.parse import urlparse, parse_qs
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/'qa-output';OUT.mkdir(exist_ok=True)
remote=os.environ.get('SIDEWAYS_PUBLIC_CHECK')=='true'
base='https://venicesideways.com' if remote else 'http://127.0.0.1:8879'
process=None
report={'target':base,'checks':[],'issues':[],'network':[],'location_test':'Simulated coordinates; no physical GPS measurement.'}
def check(ok,description):
 if not ok: raise AssertionError(description)
 report['checks'].append(description)
def poll(page,expression,seconds=45):
 deadline=time.monotonic()+seconds
 while time.monotonic()<deadline:
  if page.evaluate(expression):return True
  page.wait_for_timeout(400)
 return False
try:
 if not remote:
  process=subprocess.Popen(['node','server.mjs'],cwd=ROOT,env={**os.environ,'PORT':'8879'},stdout=subprocess.DEVNULL)
  time.sleep(.8)
 with sync_playwright() as p:
  args={'headless':True,'args':['--no-sandbox']}
  if shutil.which('chromium'):args['executable_path']=shutil.which('chromium')
  browser=p.chromium.launch(**args)
  context=browser.new_context(locale='tr-TR',viewport={'width':390,'height':844},is_mobile=True,has_touch=True,permissions=['geolocation'],geolocation={'latitude':45.44085,'longitude':12.32145,'accuracy':15})
  context.add_init_script('''window.__geoRequests=0;const original=navigator.geolocation.watchPosition.bind(navigator.geolocation);navigator.geolocation.watchPosition=(...args)=>{window.__geoRequests++;return original(...args);};''')
  page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('request',lambda r:report['network'].append({'method':r.method,'url':r.url}) if urlparse(r.url).hostname==urlparse(base).hostname else None)
  response=page.goto(base+'/',wait_until='domcontentloaded',timeout=45000)
  check(response.status==200,'Main document returns 200')
  check(poll(page,'() => !!window.WalkI18n?.ready && typeof map!=="undefined" && !!map'),'Application and map initialized')
  check(page.evaluate('stops().map(p=>p.id)')==['lucia','giacomo','frari','margherita','barnaba','trovaso','zattere','dogana','accademia','trearchi','vino'],'Exact new 11-stop order')
  check(poll(page,'() => WalkV11.audit().networkState!=="loading"'),'Walking requests settled')
  audit=page.evaluate('WalkV11.audit()');report['route']=audit
  check(audit['networkState']=='ready','Both real walking sections loaded')
  modes=page.evaluate('''() => {const data=JSON.parse(localStorage.getItem('walk-mixed-v13-trearchi-11-main'));return data.packs.flatMap(p=>p.routes[0].legs.flatMap(l=>l.steps.map(s=>s.mode)));}''')
  check('ferry' not in modes,'No ferry segments inside walking routes')
  check(poll(page,'() => !!document.querySelector(".maplibregl-canvas")'),'Real vector map present')
  check(not page.locator('#map-error').is_visible(),'No visible map failure warning')
  check(page.locator('.walk-direction').count()==0,'No decorative route direction arrows')
  check(page.locator('.transit-marker .boat-icon').count()==3,'Three boat markers for departure, change, arrival')
  page.locator('.walk-stage-tabs [data-stage="boat"]').click();page.wait_for_timeout(300)
  check(page.locator('.transit-marker .boat-icon').count()==3,'Boat view keeps all three transfer icons')
  page.screenshot(path=str(OUT/'boat-route-mobile.png'))
  page.locator('.walk-stage-tabs [data-stage="walk2"]').click();page.wait_for_timeout(300)
  check(page.evaluate('WalkStages.audit().sections.at(-1).points.map(p=>p.id)')==['land','trearchi','vino'],'Northern stage only landing, Tre Archi and Vino Vero')
  page.locator('.walk-stage-tabs [data-stage="all"]').click();page.wait_for_timeout(300)
  page.screenshot(path=str(OUT/'main-route-mobile.png'))
  check(page.evaluate('window.__geoRequests')==0,'Location not requested on arrival')
  page.locator('#my-location').click();page.locator('#location-start').click()
  check(poll(page,'() => document.querySelector("#location-details").textContent.includes("15")',10),'Own simulated location and accuracy displayed')
  check(page.evaluate('window.__geoRequests')==1,'Location requested only after user interaction')
  page.locator('#location-stop').click()
  check(page.locator('#location-details').inner_text()=='','Stopping clears own coordinates from the display')
  page.locator('#location-close').click()
  page.locator('.guide-dock [data-guide-view="plan"]').click();page.wait_for_timeout(300)
  links=page.locator('#parts a').evaluate_all('(nodes)=>nodes.map(a=>a.href)')
  check(sum('travelmode=walking' in u for u in links)==4,'Four separate walking exports')
  transit=[parse_qs(urlparse(u).query) for u in links if 'travelmode=transit' in u]
  check(len(transit)==2,'Two separate waterbus exports')
  check('Ferrovia' in transit[0]['destination'][0] and 'Ferrovia' in transit[1]['origin'][0] and 'Tre Archi' in transit[1]['destination'][0],'Waterbus links join at Ferrovia and finish at Tre Archi')
  check(not any(x in page.locator('body').inner_text() for x in ['T1','T2']),'No T1 or T2 in visible page text')
  for f in ['/favicon.ico','/favicon.svg','/apple-touch-icon.png','/site.webmanifest']:
   r=context.request.get(base+f);check(r.status==200,'Icon asset served: '+f)
  check(not any(r['method'] not in ['GET','HEAD'] for r in report['network']),'No same-origin position upload or write request')
  check(not errors,'No application JavaScript errors: '+repr(errors))
  context.close();browser.close()
except Exception: report['issues'].append(traceback.format_exc())
finally:
 if process:process.terminate();process.wait(timeout=5)
 (OUT/'live-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
 print(json.dumps({'checks':len(report['checks']),'issues':report['issues'],'target':base},ensure_ascii=False))
 if report['issues']:raise SystemExit(1)
