"""Current field-guide browser acceptance with local routes and no external map traffic."""
from pathlib import Path
from urllib.parse import urlparse
import json
import mimetypes
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
BASE = "https://venicesideways.test"
LANGUAGES = ("en", "tr", "it", "fr", "ru", "zh", "ja", "ko")
WIDTHS = (320, 375, 768, 1440)
issues = []
checks = 0


def serve(route):
    url = urlparse(route.request.url)
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
    browser = playwright.chromium.launch(headless=True, args=["--no-sandbox"])
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
            page.locator(".fg-route-card").first.wait_for()
            root = page.locator("#field-guide")
            check(root.get_attribute("lang") == language, f"{language}/{width}: language")
            check(page.locator(".fg-route-card").count() == 2, f"{language}/{width}: two routes")
            check(page.locator(".fg-intro h1").is_visible(), f"{language}/{width}: introduction")
            check(page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"),
                  f"{language}/{width}: no horizontal overflow")
            map_background = page.locator(".fg-map-shell").evaluate("e=>getComputedStyle(e).backgroundColor")
            check(map_background == "rgb(232, 236, 229)", f"{language}/{width}: light map background")
            check(page.evaluate("window.__geoCalls") == 0, f"{language}/{width}: no GPS on load")

            page.locator('[data-route="main"]').click()
            check(root.get_attribute("data-view") == "walk", f"{language}/{width}: route selection")
            check(page.locator(".fg-stop-copy h1").is_visible(), f"{language}/{width}: active stop")
            check(page.locator('[data-action="focus"]').count() == 1,
                  f"{language}/{width}: active stop control")
            page.locator('[data-action="list"]').click()
            check(page.locator(".fg-stop-list button").count() >= 11,
                  f"{language}/{width}: all stops remain selectable")
            page.locator(".fg-stop-list button").last.click()
            check(page.locator(".fg-stop-copy h1").is_visible(),
                  f"{language}/{width}: last stop selection")

            theme = page.locator(".fg-desktop-preferences .fg-theme")
            if not theme.is_visible():
                page.locator(".fg-mobile-settings summary").click()
                theme = page.locator(".fg-mobile-settings .fg-theme")
            theme.select_option("dark")
            check(root.get_attribute("data-theme") == "dark", f"{language}/{width}: manual dark theme")
            check(page.locator(".fg-map-shell").evaluate("e=>getComputedStyle(e).backgroundColor") == map_background,
                  f"{language}/{width}: map appearance unaffected by theme")
            check(page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"),
                  f"{language}/{width}: dark theme no overflow")
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
    for language in LANGUAGES:
        page.locator(".event-header-tools select").first.select_option(language)
        check(note.inner_text() == unavailable[language], f"{language}: draft notice changes language")
    page.locator(".event-header-tools select").nth(1).select_option("dark")
    check(page.locator("#event-app").get_attribute("data-theme") == "dark", "event: dark theme")
    check(page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"), "event: no horizontal overflow")
    context.close()
    browser.close()

print(json.dumps({"checks": checks, "issues": issues}, ensure_ascii=False))
if issues:
    raise SystemExit(1)
