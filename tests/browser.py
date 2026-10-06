"""Current field-guide UI acceptance with local routes, explicit synthetic portrait
geometry fixtures, and no external map or photograph traffic. Real owned photographs
and actual MapLibre are validated separately by photo-preview-browser.mjs."""
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
    # Deliberately synthetic geometry, not an archive photograph or stop assignment.
    # The approved derivative URL and actual metadata remain unchanged in the renderer.
    if url.netloc == "erenedebali.com" and url.path in {
            f"/image/{photo}/{variant}" for photo in (3, 6, 18) for variant in ("web", "thumb")}:
        width = 1373 if url.path.split("/")[2] == "18" else 1238
        body = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="2200">
          <rect width="100%" height="100%" fill="#eee"/>
          <rect x="6" y="6" width="{width-12}" height="2188" fill="none" stroke="#222" stroke-width="12"/>
          <text x="30" y="100" font-size="50">QA portrait geometry fixture, not a photograph</text>
        </svg>'''
        route.fulfill(status=200, body=body, content_type="image/svg+xml")
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
            check(map_background == "rgb(248, 241, 230)", f"{language}/{width}: light watercolor map background")
            check(page.evaluate("window.__geoCalls") == 0, f"{language}/{width}: no GPS on load")

            page.locator('[data-route="main"]').click()
            check(root.get_attribute("data-view") == "walk", f"{language}/{width}: route selection")
            check(page.locator(".fg-stop-copy h1").is_visible(), f"{language}/{width}: active stop")
            check(page.locator('[data-action="focus"]').count() == 1,
                  f"{language}/{width}: active stop control")
            page.wait_for_function("""()=>{const i=document.querySelector('.fg-stop-preview img');
                return i?.complete&&i.naturalWidth>0} """)
            preview = page.locator(".fg-stop-preview")
            portrait = preview.evaluate("""figure=>{const i=figure.querySelector('img'),
                b=figure.querySelector('button'),p=figure.closest('.fg-editorial'),
                s=getComputedStyle(i),ps=getComputedStyle(p);return {
                width:i.getAttribute('width'),height:i.getAttribute('height'),
                naturalPortrait:i.naturalHeight>i.naturalWidth,fit:s.objectFit,
                aspect:s.aspectRatio,filter:s.filter,imageHeight:i.getBoundingClientRect().height,
                touchHeight:b.getBoundingClientRect().height,figureHeight:figure.getBoundingClientRect().height,
                usable:p.clientHeight-parseFloat(ps.paddingTop)-parseFloat(ps.paddingBottom),
                credit:figure.querySelector('figcaption')?.textContent}}""")
            check(portrait["width"] == "1238" and portrait["height"] == "2200"
                  and portrait["naturalPortrait"], f"{language}/{width}: portrait metadata retained")
            check(portrait["fit"] == "contain" and portrait["aspect"] == "auto"
                  and portrait["filter"] == "none", f"{language}/{width}: normal preview full frame without crop or filter")
            check(43.5 <= portrait["imageHeight"] <= 240.5
                  and portrait["touchHeight"] >= 43.5
                  and portrait["figureHeight"] <= portrait["usable"] * .36 + 1,
                  f"{language}/{width}: normal preview and credit fit usable panel budget")
            check(portrait["credit"] == "Eren Edebali", f"{language}/{width}: normal preview credit")
            opener = page.locator(".fg-stop-preview-open")
            opener.focus()
            page.keyboard.press("Enter")
            page.locator(".fg-dialog.fg-lightbox[open]").wait_for()
            page.wait_for_function("""()=>{const i=document.querySelector('.fg-gallery-stage img');
                return i?.complete&&i.naturalWidth>0} """)
            check(page.locator(".fg-gallery-stage img").evaluate("""i=>
                getComputedStyle(i).objectFit==='contain'&&!i.closest('.fg-stop-preview')"""),
                  f"{language}/{width}: native Enter opens separate unzoomed full view")
            page.go_back()
            page.wait_for_function("""()=>{const d=document.querySelector('.fg-dialog');
                return d?.open&&!d.classList.contains('fg-lightbox')}""")
            page.keyboard.press("Escape")
            page.wait_for_function("()=>!document.querySelector('.fg-dialog')?.open")
            check(opener.evaluate("b=>document.activeElement===b"),
                  f"{language}/{width}: natural Back and Escape return preview focus")
            page.locator('[data-action="list"]').click()
            check(page.locator(".fg-stop-list [data-step]").count() >= 11,
                  f"{language}/{width}: all stops remain selectable")
            page.locator(".fg-stop-list [data-step]").last.click()
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
