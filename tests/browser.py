"""Main Walk visitor acceptance with the actual local photo files and explicit
synthetic archive inspiration geometry fixtures. Real MapLibre/geography and
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
    # Deliberately synthetic geometry, not an archive photograph or stop assignment.
    # These permitted archive samples remain separate inspiration, not stop covers.
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
            check(page.locator(".fg-stop-copy .fg-compact-empty").count() == 0
                  and page.locator(".fg-stop-copy .fg-stop-preview img").is_visible(),
                  f"{language}/{width}: Santa Lucia has an actual visible stop photograph")
            check('/field-guide/photos/main-20261009/lucia-' in page.locator(
                  '.fg-stop-copy .fg-stop-preview img').get_attribute('src'),
                  f"{language}/{width}: stop cover is its verified local photograph")
            check(page.locator('.fg-view-tabs [data-panel]').count() == 3,
                  f"{language}/{width}: Map, Stops and Photographs are separate views")
            dock_action.click()
            check(root.get_attribute("data-walking-phase") == "walking"
                  and stop_title("giacomo", language) in progress(page),
                  f"{language}/{width}: start advances once to Giacomo walking target")
            before = progress(page)

            page.locator('[data-panel="photos"]').click()
            check(root.get_attribute("data-panel") == "photos",
                  f"{language}/{width}: photographs view reachable")
            for visit in MAIN["visits"]:
                page.locator('[data-photo-stop]').select_option(visit["key"])
                cover = page.locator('.fg-stop-copy .fg-stop-preview img')
                cover.scroll_into_view_if_needed()
                page.wait_for_function("""()=>{const image=document.querySelector('.fg-stop-copy .fg-stop-preview img');
                    return image?.complete && image.naturalWidth > 0}""")
                expected = visit["gallery"][0]
                caption = page.locator('.fg-stop-copy .fg-stop-preview figcaption')
                links = caption.locator('a').evaluate_all('(links)=>links.map(link=>link.getAttribute("href"))')
                check(urlparse(cover.get_attribute('src')).path == expected['derivatives'][0]['url']
                      and cover.get_attribute('alt') == next(row['alt'] for row in expected['copy'] if row['locale'] == language)
                      and expected['credit'] in caption.inner_text()
                      and expected['sourceURL'] in links and expected['licenseURL'] in links,
                      f"{language}/{width}: {visit['placeKey']} loads its exact licensed photograph with alt and credits")
                check(progress(page) == before,
                      f"{language}/{width}: {visit['placeKey']} photo inspection does not change target")
            page.locator('[data-photo-stop]').select_option("trearchi")
            check(stop_title("trearchi", language) in page.locator('.fg-stop-copy h1').inner_text()
                  and progress(page) == before,
                  f"{language}/{width}: future-photo inspection preserves walking progress")
            trearchi_photo = next(visit for visit in MAIN["visits"] if visit['key'] == 'trearchi')['gallery'][0]
            check(trearchi_photo['contentKind'] == 'stop-view'
                  and page.locator('.fg-stop-copy .fg-stop-preview img').count() == 1
                  and next(row['caption'] for row in trearchi_photo['copy'] if row['locale'] == language)
                      in page.locator('.fg-stop-copy .fg-stop-preview figcaption').inner_text()
                  and page.locator('.fg-stop-copy .fg-photo-kind').is_visible(),
                  f"{language}/{width}: Tre Archi photograph is a verified stop view")
            photo_opener = page.locator('.fg-stop-copy [data-open-stop-photo]')
            photo_opener.click()
            page.locator('.fg-dialog[open] .fg-photo-full img').wait_for()
            full_photo = page.locator('.fg-dialog[open] .fg-photo-full img').evaluate("""image=>({
                fit:getComputedStyle(image).objectFit,source:image.getAttribute('src'),
                credit:image.closest('figure').querySelector('figcaption')?.textContent})""")
            check(full_photo['fit'] == 'contain' and urlparse(full_photo['source']).path == trearchi_photo['derivatives'][0]['url']
                  and trearchi_photo['credit'] in full_photo['credit'],
                  f"{language}/{width}: real stop photo opens uncropped with its credit")
            page.keyboard.press('Escape')
            page.wait_for_function("()=>document.querySelector('.fg-dialog')?.open && !document.querySelector('.fg-dialog').classList.contains('fg-lightbox')")
            check(progress(page) == before, f"{language}/{width}: leaving the full photograph restores stop details without advancing")
            page.keyboard.press('Escape')
            page.wait_for_function("()=>!document.querySelector('.fg-dialog')?.open")
            check(photo_opener.evaluate('button=>document.activeElement===button') and progress(page) == before,
                  f"{language}/{width}: real photo close restores opener and target")
            check(page.locator('.fg-inspiration [data-inspiration]').count() == 3
                  and page.locator('.fg-inspiration > p').is_visible(),
                  f"{language}/{width}: archive examples live in explicitly explained inspiration")
            opener = page.locator('.fg-inspiration [data-inspiration]').first
            opener.focus()
            page.keyboard.press("Enter")
            page.locator('.fg-dialog[open] .fg-reference-note').wait_for()
            page.wait_for_function("""()=>{const i=document.querySelector('.fg-dialog .fg-photo-full img');
                return i?.complete&&i.naturalWidth>0}""")
            portrait = page.locator('.fg-dialog .fg-photo-full img').evaluate("""i=>({
                width:i.getAttribute('width'),height:i.getAttribute('height'),
                naturalPortrait:i.naturalHeight>i.naturalWidth,fit:getComputedStyle(i).objectFit,
                filter:getComputedStyle(i).filter,alt:i.getAttribute('alt'),
                credit:i.closest('figure').querySelector('figcaption')?.textContent})""")
            check(portrait["width"] == "1238" and portrait["height"] == "2200"
                  and portrait["naturalPortrait"] and bool(portrait["alt"]),
                  f"{language}/{width}: separate inspiration retains dimensions and natural alt")
            check(portrait["fit"] == "contain" and portrait["filter"] == "none"
                  and portrait["credit"] == "Eren Edebali",
                  f"{language}/{width}: inspiration full frame and credit preserved")
            page.keyboard.press("Escape")
            page.wait_for_function("()=>!document.querySelector('.fg-dialog')?.open")
            check(opener.evaluate("b=>document.activeElement===b") and progress(page) == before,
                  f"{language}/{width}: inspiration close returns focus without advancing walk")

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
