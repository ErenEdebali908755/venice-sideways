"""Main Walk visitor acceptance without the retired stop-photo set. Real MapLibre/geography and
walking behavior are checked separately; no production data is written."""
from pathlib import Path
from urllib.parse import urlparse
import json
import mimetypes
import os
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
BASE = "https://venicesideways.test"
LANGUAGES = ("en", "tr", "it", "fr", "ru", "zh", "ja", "ko")
WIDTHS = (320, 375, 768, 1440)
ROUTES = json.loads((PUBLIC / "field-guide/routes.json").read_text())["routes"]
MAIN = next(route for route in ROUTES if route["key"] == "main")


def stop_title(key, language):
    visit = next(visit for visit in MAIN["visits"] if visit["key"] == key)
    return next(copy["title"] for copy in visit["copy"] if copy["locale"] == language)


def progress(page):
    return page.locator(".fg-walking-dock").inner_text()

issues = []
checks = 0


def serve(route):
    url = urlparse(route.request.url)
    if url.netloc == "erenedebali.com" and url.path.startswith("/image/"):
        issues.append("Unrelated archive photograph was requested: " + url.path)
        route.abort()
        return
    if url.netloc != "venicesideways.test":
        route.abort()
        return
    if url.path == "/api/route-catalog":
        route.fulfill(json={"routes": [{"key": key, "published": False} for key in ("main", "full")]})
        return
    if url.path == "/api/events":
        route.fulfill(json={"events": []})
        return
    if url.path == "/api/events/main-walk-2026-10-11":
        route.fulfill(status=404, json={"error": "not_found"})
        return
    if url.path == "/events/main-walk-2026-10-11":
        route.fulfill(status=200, body=(PUBLIC / "events.html").read_bytes(),
                      content_type="text/html")
        return
    if url.path == "/field-guide/maplibre.js":
        # The external basemap is tested separately; this fixture checks the UI without tiles.
        route.fulfill(status=200, content_type="application/javascript", body="window.maplibregl=undefined;")
        return
    path = (PUBLIC / (url.path.lstrip("/") or "index.html")).resolve()
    if not path.is_relative_to(PUBLIC) or not path.is_file():
        route.fulfill(status=404, body="Not found")
        return
    route.fulfill(status=200, body=path.read_bytes(),
                  content_type=mimetypes.guess_type(path.name)[0] or "application/octet-stream")


def check(condition, description):
    global checks
    checks += 1
    if not condition:
        issues.append(description)


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True, args=["--no-sandbox"],
                                          executable_path=os.environ.get("BROWSER_EXECUTABLE"))
    for language in LANGUAGES:
        for width in WIDTHS:
            context = browser.new_context(viewport={"width": width, "height": 900},
                                          color_scheme="dark", locale=language)
            context.add_init_script("""window.__geoCalls=0;
                Object.defineProperty(navigator,'geolocation',{configurable:true,value:{
                watchPosition(){window.__geoCalls++;return 1},clearWatch(){}}});""")
            page = context.new_page()
            page.route("**/*", serve)
            page.goto(f"{BASE}/?lang={language}", wait_until="domcontentloaded")
            page.locator(".fg-main-summary h1").wait_for()
            root = page.locator("#field-guide")
            check(root.get_attribute("lang") == language, f"{language}/{width}: language")
            check(page.locator('.fg-main-summary [data-route="main"]').count() == 1
                  and page.locator('[data-route="full"],.fg-route-switch,.fg-route-card').count() == 0,
                  f"{language}/{width}: only Main summary and one opening action")
            check(page.locator(".fg-intro").count() == 0
                  and page.locator('.fg-main-summary img').count() == 0,
                  f"{language}/{width}: removed introduction and temporary cover stay absent")
            check(root.get_attribute("data-view") == "explore"
                  and root.get_attribute("data-walking-phase") == "reaching-start"
                  and page.locator('.fg-walking-dock').is_hidden(),
                  f"{language}/{width}: summary does not automatically start walking")
            check(page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"),
                  f"{language}/{width}: no horizontal overflow")
            map_background = page.locator(".fg-map-shell").evaluate("e=>getComputedStyle(e).backgroundColor")
            check(map_background == "rgb(248, 241, 230)", f"{language}/{width}: light watercolor map background")
            check(page.evaluate("window.__geoCalls") == 0, f"{language}/{width}: no GPS on load")

            page.locator('[data-route="main"]').click()
            check(root.get_attribute("data-view") == "walk", f"{language}/{width}: route selection")
            if width < 768:
                check(root.get_attribute("data-sheet") == "collapsed",
                      f"{language}/{width}: walking opens with the compact map-first sheet")
                page.locator('[data-sheet="standard"]').click()
            check(page.locator(".fg-stop-copy h1").is_visible(), f"{language}/{width}: active stop")
            check(page.locator('.fg-walking-dock [data-action="focus"]').count() == 1,
                  f"{language}/{width}: one explicitly named walking-target control in dock")
            dock_action = page.locator('.fg-walking-dock [data-action="walk-advance"]')
            check(dock_action.count() == 1 and dock_action.is_visible()
                  and bool(dock_action.inner_text().strip()),
                  f"{language}/{width}: singleton named walking action")
            check(stop_title("lucia", language) in progress(page)
                  and "1 / 10" in progress(page) and "/ 12" not in progress(page),
                  f"{language}/{width}: Santa Lucia start and eleven-photo progress")
            check(page.locator(".fg-stop-preview,.fg-photo-kind,.fg-gallery-link,.fg-compact-empty").count() == 0,
                  f"{language}/{width}: removed stop-photo set leaves no cover, credit or gap")
            story_button = page.locator('.fg-stop-copy h1 + .fg-story-button')
            check(story_button.is_visible() and story_button.bounding_box()['height'] >= 44,
                  f"{language}/{width}: full-width story button directly follows stop title")
            story_button.click()
            page.locator('.fg-dialog[open] .fg-photo-ideas').wait_for()
            check(page.locator('.fg-dialog[open] .fg-photo-ideas article').count() == 5,
                  f"{language}/{width}: active-stop story button opens all five ideas")
            page.keyboard.press('Escape')
            page.wait_for_function("()=>!document.querySelector('.fg-dialog')?.open")
            check(page.locator('.fg-view-tabs [data-panel]').count() == 3,
                  f"{language}/{width}: Map, Stops and Photo ideas are separate views")
            dock_action.click()
            check(root.get_attribute("data-walking-phase") == "walking"
                  and stop_title("giacomo", language) in progress(page),
                  f"{language}/{width}: start advances once to Giacomo walking target")
            before = progress(page)

            page.locator('[data-panel="photos"]').click()
            check(root.get_attribute("data-panel") == "photos",
                  f"{language}/{width}: photo ideas view reachable")
            check(page.locator('[data-ideas-stop="giacomo"] .fg-direct-ideas article').count() == 5
                  and page.locator('[data-photo-stop]').count() == 0,
                  f"{language}/{width}: one tap directly opens current stop's five ideas")
            check(page.locator('.fg-direct-ideas article').first.is_visible()
                  and progress(page) == before,
                  f"{language}/{width}: ideas are expanded without changing walking progress")
            check(page.locator('.fg-inspiration,[data-inspiration],.fg-reference-note').count() == 0,
                  f"{language}/{width}: unrelated archive examples remain absent")

            page.locator('[data-panel="stops"]').click()
            check(page.locator('.fg-stop-list [data-inspect]').count() == 10
                  and page.locator('.fg-stop-list [data-inspect-transfer]').count() == 1,
                  f"{language}/{width}: ten photo stops and one separate transfer inspectable")
            last = page.locator('.fg-stop-list [data-inspect]').last
            last.click()
            check(stop_title("trearchi", language) in page.locator('.fg-dialog h1').inner_text()
                  and progress(page) == before,
                  f"{language}/{width}: stop list inspects Tre Archi without changing walking target")
            page.keyboard.press("Escape")
            page.wait_for_function("()=>!document.querySelector('.fg-dialog')?.open")
            check(last.evaluate("b=>document.activeElement===b"),
                  f"{language}/{width}: stop inspection restores opening control focus")
            # Allow the deliberately bounded double-tap guard before a distinct resume action.
            page.wait_for_timeout(660)
            page.locator('.fg-stop-list [data-resume="trearchi"]').click()
            check(root.get_attribute("data-panel") == "map"
                  and root.get_attribute("data-walking-phase") == "walking"
                  and stop_title("trearchi", language) in progress(page),
                  f"{language}/{width}: only explicit resume changes target to Tre Archi")
            check(page.locator('.fg-walking-dock [data-action="walk-advance"]').count() == 1,
                  f"{language}/{width}: inspection and resume leave one walking action")

            preferences = page.locator('.fg-preferences')
            preferences.locator(':scope > summary').click()
            theme = preferences.locator('.fg-theme')
            theme.select_option("dark")
            check(root.get_attribute("data-theme") == "dark", f"{language}/{width}: manual dark theme")
            check(page.locator(".fg-map-shell").evaluate("e=>getComputedStyle(e).backgroundColor") == map_background,
                  f"{language}/{width}: map appearance unaffected by theme")
            check(page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"),
                  f"{language}/{width}: dark theme no overflow")
            page.keyboard.press('Escape')
            check(preferences.get_attribute('open') is None
                  and preferences.locator(':scope > summary').evaluate('button=>document.activeElement===button'),
                  f"{language}/{width}: Preferences closes with Escape and returns focus")
            check(page.evaluate("window.__geoCalls") == 0, f"{language}/{width}: no GPS after navigation")
            context.close()
    unavailable = {
        "en": "This event is unavailable.",
        "tr": "Bu etkinlik şu an kullanılamıyor.",
        "it": "Evento non disponibile.",
        "fr": "Événement indisponible.",
        "ru": "Событие недоступно.",
        "zh": "此活动暂不可用。",
        "ja": "イベントを表示できません。",
        "ko": "행사를 이용할 수 없습니다.",
    }
    context = browser.new_context(viewport={"width": 375, "height": 900})
    page = context.new_page()
    page.route("**/*", serve)
    page.goto(f"{BASE}/events/main-walk-2026-10-11?lang=en", wait_until="domcontentloaded")
    note = page.locator(".event-note")
    page.get_by_text(unavailable["en"], exact=True).wait_for()
    page.locator(".event-settings > summary").click()
    check(page.locator("#event-language").is_visible(), "event: language available through settings")
    for language in LANGUAGES:
        page.locator("#event-language").select_option(language)
        check(note.inner_text() == unavailable[language], f"{language}: draft notice changes language")
    page.locator("#event-theme").select_option("dark")
    check(page.locator("#event-app").get_attribute("data-theme") == "dark", "event: dark theme")
    check(page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"), "event: no horizontal overflow")
    context.close()
    browser.close()

print(json.dumps({"checks": checks, "issues": issues}, ensure_ascii=False))
if issues:
    raise SystemExit(1)
