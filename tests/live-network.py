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
                if urlparse(request.url).netloc == urlparse(base).netloc else None)
        if not remote:
            page.route("**/*", fixture)
        response = page.goto(base + ("/?lang=tr" if remote else "/?lang=tr&gps-test=1"), wait_until="domcontentloaded", timeout=45000)
        check(response.status == 200, "Main document returns 200")
        page.locator(".fg-route-card").first.wait_for()
        if not remote:
            # Finish the initial event update before testing the settled map tools.
            page.wait_for_load_state("networkidle", timeout=30000)
        check(page.locator(".fg-route-card").count() == 2, "Main and Full Walk available")
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
        check(page.locator(".fg-stop-copy h1").is_visible(), "Active stop copy visible")
        check(page.locator(".fg-stop-copy .fg-compact-empty").is_visible()
              and page.locator(".fg-stop-copy .fg-stop-preview img").count() == 0,
              "Missing stop photograph stays empty rather than using an unrelated bank image")
        check(page.locator('.fg-view-tabs [data-panel]').count() == 3,
              "Map, Stops and Photographs share one navigation level")
        check(page.locator('.fg-walking-dock [data-action="walk-advance"]').count() == 1,
              "A singleton named walking action is available independently of panels")
        map_options = page.locator('.fg-map-options')
        fit = page.locator('[data-action="fit"]')
        if not fit.is_visible():
            map_options.locator(':scope > summary').click()
        check(fit.is_visible(), "Whole route control is reachable through mobile map tools")
        fit.click()
        if map_options.locator(':scope > summary').is_visible() and map_options.get_attribute('open') is not None:
            map_options.locator(':scope > summary').click()
        check(map_options.get_attribute('open') is None,
              "Mobile map tools can close after fitting the route")
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
        check(page.locator(".fg-stop-list [data-inspect]").count() == 11
              and page.locator(".fg-stop-list [data-inspect-transfer]").count() == 1,
              "Eleven photo stops and the transfer are separately inspectable")
        page.locator('.fg-stop-list [data-inspect="vino"]').click()
        check(page.locator('.fg-dialog[open]').count() == 1
              and page.locator('.fg-pin.selected').get_attribute('data-visit-key') == 'giacomo'
              and page.locator('.fg-pin-inspected').get_attribute('data-visit-key') == 'vino',
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
        page.locator('[data-photo-stop]').select_option('vino')
        check(page.locator('.fg-inspiration > p').is_visible()
              and page.locator('.fg-stop-copy .fg-stop-preview img').count() == 0
              and page.locator('.fg-walking-dock').inner_text() == before,
              "Photographs explains separate archive inspiration while keeping walking progress")
        page.locator('[data-panel="map"]').click()
        check(page.locator('.fg-pin.selected').count() == 1
              and page.locator('.fg-pin.selected').get_attribute('data-visit-key') == 'giacomo',
              "Returning to Map retains one current target marker")
        page.locator('[data-panel="stops"]').click()
        # This is a distinct user decision after inspection, not the preceding double tap.
        page.wait_for_timeout(660)
        page.locator('.fg-stop-list [data-resume="vino"]').click()
        check(poll(page, "() => document.querySelector('.fg-pin.selected')?.dataset.visitKey === 'vino'"),
              "Only the explicit continue-from-here action changes the target to Vino")
        check(page.locator('#field-guide').get_attribute('data-panel') == 'map'
              and page.locator('.fg-pin.selected').count() == 1,
              "Explicit resume returns to Map with one target marker")
        check(page.evaluate("window.__geoRequests") == 0, "Browsing never asks for GPS")
        page.locator('[data-action="location"]').click()
        check(poll(page, "() => window.__geoRequests === 1", 10),
              "Own position starts only after explicit action")
        page.locator('[data-action="location-off"]').click()
        check(page.evaluate("window.__geoRequests") == 1, "Own position can be stopped")
        for asset in ("/favicon.ico", "/favicon.svg", "/apple-touch-icon.png", "/site.webmanifest"):
            check(context.request.get(base + asset).status == 200, "Icon served: " + asset)
        check(all(method in ("GET", "HEAD") for method in requests),
              "No same-origin location upload or write request")
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
