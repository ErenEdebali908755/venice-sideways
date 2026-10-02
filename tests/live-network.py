"""MapLibre and active-stop browser regression; public-origin mode is optional."""
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
        browser = playwright.chromium.launch(headless=True, args=["--no-sandbox"])
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
        response = page.goto(base + "/?lang=tr", wait_until="domcontentloaded", timeout=45000)
        check(response.status == 200, "Main document returns 200")
        page.locator(".fg-route-card").first.wait_for()
        check(page.locator(".fg-route-card").count() == 2, "Main and Full Walk available")
        check(page.evaluate("window.__geoRequests") == 0, "No location request on arrival")
        check(poll(page, "() => !!document.querySelector('.maplibregl-canvas')"),
              "MapLibre canvas initialized")
        check(poll(page, "() => !document.querySelector('[data-action=dimension]').disabled"),
              "Map style loaded and map controls enabled")
        page.locator('[data-route="main"]').click()
        check(page.locator("#field-guide").get_attribute("data-view") == "walk",
              "Main Walk opens")
        check(page.locator(".fg-pin").count() == 1, "Only active stop has a map marker")
        check(page.locator(".fg-stop-copy h1").is_visible(), "Active stop copy visible")
        page.locator('[data-action="fit"]').click()
        page.evaluate("""() => {
            const canvas=document.querySelector('.maplibregl-canvas');
            canvas.dispatchEvent(new WheelEvent('wheel',{deltaY:200,bubbles:true}));
        }""")
        page.wait_for_timeout(200)
        check(page.locator(".fg-pin").count() == 1, "Fit and zoom keep one active marker")
        page.locator('[data-action="list"]').click()
        check(page.locator(".fg-stop-list button").count() >= 11, "All stops remain selectable")
        page.locator(".fg-stop-list button").last.click()
        check(page.locator(".fg-pin").count() == 1, "Selecting another stop replaces marker")
        check(page.evaluate("window.__geoRequests") == 0, "Browsing never asks for GPS")
        page.locator('[data-action="location"]').click()
        check(poll(page, "() => window.__geoRequests === 1", 10),
              "Own position starts only after explicit action")
        page.locator('[data-action="location"]').click()
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
