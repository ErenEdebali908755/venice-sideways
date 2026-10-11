"""Real MapLibre, manual walking and inspection regression; public mode is optional.
Local basemap responses are isolated; geography and actual marker positions are retained.
No production form submission, participant writes or physical GPS claim.
"""
import json
import os
import pathlib
import subprocess
import time
import traceback
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "qa-output"
OUT.mkdir(exist_ok=True)
remote = os.environ.get("SIDEWAYS_PUBLIC_CHECK") == "true"
base = "https://venicesideways.com" if remote else "http://127.0.0.1:8879"
report = {"target": base, "checks": [], "issues": [],
          "location_test": "Simulated browser coordinates; no physical GPS measurement."}


def check(value, description):
    if not value:
        raise AssertionError(description)
    report["checks"].append(description)


def poll(page, expression, seconds=30):
    deadline = time.monotonic() + seconds
    while time.monotonic() < deadline:
        if page.evaluate(expression):
            return True
        page.wait_for_timeout(250)
    return False


def fixture(route):
    path = urlparse(route.request.url)
    if path.path == "/api/route-catalog" and path.netloc == "127.0.0.1:8879":
        route.fulfill(json={"routes": [{"key": key, "published": False} for key in ("main", "full")]})
    elif path.hostname == "tiles.openfreemap.org":
        route.fulfill(json={"version": 8, "name": "isolated light basemap",
                            "sources": {}, "layers": [{"id": "background", "type": "background",
                            "paint": {"background-color": "#e8ece5"}}]})
    elif path.netloc != "127.0.0.1:8879":
        route.abort()
    else:
        route.continue_()


process = None
try:
    if not remote:
        process = subprocess.Popen(["node", "server.mjs"], cwd=ROOT,
                                   env={**os.environ, "PORT": "8879"},
                                   stdout=subprocess.DEVNULL)
        time.sleep(0.8)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, args=["--no-sandbox"],
                                              executable_path=os.environ.get("BROWSER_EXECUTABLE"))
        context = browser.new_context(locale="tr-TR", viewport={"width": 390, "height": 844},
                                      is_mobile=True, has_touch=True,
                                      permissions=["geolocation"],
                                      geolocation={"latitude": 45.44085, "longitude": 12.32145,
                                                   "accuracy": 15})
        context.add_init_script("""window.__geoRequests=0;
            const original=navigator.geolocation.watchPosition.bind(navigator.geolocation);
            navigator.geolocation.watchPosition=(...args)=>{window.__geoRequests++;return original(...args)};""")
        page = context.new_page()
        page.on("dialog", lambda dialog: dialog.accept())
        requests = []
        page.on("request", lambda request: requests.append(request.method)
                if urlparse(request.url).netloc == urlparse(base).netloc
                and urlparse(request.url).path != "/api/community/statistics" else None)
        statistics = []

        def count(route):
            # Default-on anonymous counts are answered in the browser; tests never add real counts.
            if route.request.method == "POST":
                statistics.append(json.loads(route.request.post_data or "{}"))
                route.fulfill(json={"ok": True})
            else:
                route.fallback()
        if not remote:
            page.route("**/*", fixture)
        page.route("**/api/community/statistics", count)
        response = page.goto(base + ("/?lang=tr" if remote else "/?lang=tr&gps-test=1"), wait_until="domcontentloaded", timeout=45000)
        check(response.status == 200, "Main document returns 200")
        page.locator(".fg-main-summary h1").wait_for()
        if not remote:
            # Finish the initial event update before testing the settled map tools.
            page.wait_for_load_state("networkidle", timeout=30000)
        check(page.locator('.fg-main-summary [data-route="main"]').count() == 1
              and page.locator('[data-route="full"],.fg-route-switch,.fg-intro').count() == 0,
              "Only Main Walk summary is visible; old introduction and Full controls are absent")
        check(page.locator('#field-guide').get_attribute('data-view') == 'explore'
              and page.locator('#field-guide').get_attribute('data-walking-phase') == 'reaching-start',
              "Opening the site does not start the walk")
        check(page.evaluate("window.__geoRequests") == 0, "No location request on arrival")
        check(poll(page, "() => !!document.querySelector('.maplibregl-canvas')"),
              "MapLibre canvas initialized")
        check(poll(page, "() => !document.querySelector('[data-action=dimension]').disabled"),
              "Map style loaded and map controls enabled")
        page.locator('[data-route="main"]').click()
        check(page.locator("#field-guide").get_attribute("data-view") == "walk",
              "Main Walk opens")
        check(page.locator(".fg-pin.selected").count() == 1
              and page.locator(".fg-pin.selected").get_attribute("data-visit-key") == "lucia",
              "Santa Lucia is the single walking-target marker")
        check(page.locator('#field-guide').get_attribute('data-sheet') == 'collapsed',
              "The mobile walking panel opens compactly")
        page.locator('[data-sheet="standard"]').click()
        check(page.locator(".fg-stop-copy h1").is_visible(), "User can expand the sheet to read the active stop")
        check(page.locator('.fg-stop-preview,.fg-photo-kind,.fg-gallery-link').count() == 0,
              "Stop-photo cover, credit and gallery link are absent")
        check(page.locator('.fg-stop-copy h1 + .fg-story-button').is_visible(),
              "Story button is directly below the stop title")
        check(page.locator('.fg-view-tabs [data-panel]').count() == 3,
              "Map, Stops and Photo ideas share one navigation level")
        check(page.locator('.fg-walking-dock [data-action="walk-advance"]').count() == 1,
              "A singleton named walking action is available independently of panels")
        map_options = page.locator('.fg-map-options')
        fit = page.locator('[data-action="fit"]')
        check(fit.is_visible() and map_options.get_attribute('open') is None,
              "Whole route is directly reachable beside the closed compact options")
        fit.click()
        summary = map_options.locator(':scope > summary')
        height_before_options = page.locator('.fg-map-shell').bounding_box()['height']
        summary.click()
        check(page.locator('[data-action="places"]').is_visible()
              and page.locator('[data-action="dimension"]').is_visible(),
              "Places and 2D/3D are reachable in the compact options panel")
        check(abs(page.locator('.fg-map-shell').bounding_box()['height'] - height_before_options) < 1,
              "Opening map options does not shrink the map")
        page.keyboard.press('Escape')
        check(map_options.get_attribute('open') is None
              and summary.evaluate('button=>document.activeElement===button'),
              "Map options close with Escape and return focus")
        page.evaluate("""() => {
            const canvas=document.querySelector('.maplibregl-canvas');
            canvas.dispatchEvent(new WheelEvent('wheel',{deltaY:200,bubbles:true}));
        }""")
        page.wait_for_timeout(200)
        check(page.locator(".fg-pin.selected").count() == 1
              and page.locator(".fg-pin.selected").get_attribute("data-visit-key") == "lucia",
              "Fit and zoom keep the same single walking-target marker")
        page.locator('.fg-walking-dock [data-action="walk-advance"]').click()
        check(poll(page, "() => document.querySelector('.fg-pin.selected')?.dataset.visitKey === 'giacomo'"),
              "Manual start changes only the walking target to Giacomo")
        check(page.locator('#field-guide').get_attribute('data-walking-phase') == 'walking',
              "Walking phase is explicit after the manual start")
        before = page.locator('.fg-walking-dock').inner_text()
        page.locator('[data-panel="stops"]').click()
        check(page.locator(".fg-stop-list [data-inspect]").count() == 10
              and page.locator(".fg-stop-list [data-inspect-transfer]").count() == 1,
              "Ten photo stops and the transfer are separately inspectable")
        page.locator('.fg-stop-list [data-inspect="trearchi"]').click()
        check(page.locator('.fg-dialog[open]').count() == 1
              and page.locator('.fg-pin.selected').get_attribute('data-visit-key') == 'giacomo'
              and page.locator('.fg-pin-inspected').get_attribute('data-visit-key') == 'trearchi',
              "Future-stop inspection uses a separate marker without moving the walking target")
        check(page.locator('.fg-walking-dock').inner_text() == before,
              "Inspection preserves the named target and photo progress")
        page.keyboard.press('Escape')
        check(poll(page, "() => !document.querySelector('.fg-dialog')?.open"),
              "Stop inspection closes through Escape")
        check(page.locator('.fg-walking-dock').inner_text() == before
              and page.locator('.fg-pin.selected').get_attribute('data-visit-key') == 'giacomo',
              "Inspection close returns to the same walking target")
        page.locator('[data-panel="photos"]').click()
        check(page.locator('[data-ideas-stop="giacomo"] .fg-direct-ideas article').count() == 5
              and page.locator('[data-photo-stop]').count() == 0,
              "Photo ideas opens all five ideas for the walking target directly")
        check(page.locator('.fg-inspiration,[data-inspiration],.fg-stop-preview,.fg-photo-kind').count() == 0
              and page.locator('.fg-walking-dock').inner_text() == before,
              "Ideas retain the current walking target and contain no retired photos")
        page.locator('[data-panel="map"]').click()
        check(page.locator('.fg-pin.selected').count() == 1
              and page.locator('.fg-pin.selected').get_attribute('data-visit-key') == 'giacomo',
              "Returning to Map retains one current target marker")
        page.locator('[data-panel="stops"]').click()
        # This is a distinct user decision after inspection, not the preceding double tap.
        page.wait_for_timeout(660)
        page.locator('.fg-stop-list [data-resume="trearchi"]').click()
        check(poll(page, "() => document.querySelector('.fg-pin.selected')?.dataset.visitKey === 'trearchi'"),
              "Only the explicit continue-from-here action changes the target to Tre Archi")
        check(page.locator('#field-guide').get_attribute('data-panel') == 'map'
              and page.locator('.fg-pin.selected').count() == 1,
              "Explicit resume returns to Map with one target marker")
        check(page.evaluate("window.__geoRequests") == 0, "Browsing never asks for GPS")
        page.locator('[data-action="location"]').click()
        check(poll(page, "() => window.__geoRequests === 1", 10),
              "Own position starts only after explicit action")
        privacy = page.locator('.fg-location-copy')
        privacy.locator(':scope > summary').click()
        page.locator('[data-action="location-off"]').click()
        check(page.evaluate("window.__geoRequests") == 1, "Own position can be stopped")
        for asset in ("/favicon.ico", "/favicon.svg", "/apple-touch-icon.png", "/site.webmanifest"):
            check(context.request.get(base + asset).status == 200, "Icon served: " + asset)
        check(all(method in ("GET", "HEAD") for method in requests),
              "No same-origin location upload or write request")
        check(all(sorted(event) == ["consent", "device", "event", "language", "metric", "route"]
                  for event in statistics), "Anonymous counts carry no location or new fields")
        context.close()
        browser.close()
except Exception:
    report["issues"].append(traceback.format_exc())
finally:
    if process:
        process.terminate()
        process.wait(timeout=5)
    (OUT / "live-report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2))
    print(json.dumps({"checks": len(report["checks"]), "issues": report["issues"],
                      "target": base}, ensure_ascii=False))
    if report["issues"]:
        raise SystemExit(1)
