# Venice Sideways

Independent multilingual photography walks for **https://venicesideways.com/**.

## Birleşik güncelleme — 5 Ekim 2026

Arşiv ölçümü/About ve Sideways nötr galeri/medya/GPS çalışmasının esas kaydı [birleşik sonuç raporudur](https://github.com/ErenEdebali908755/eren-visual-archive/blob/main/docs/COMBINED-RELEASE-20261005.md). [Belge dizini](docs/README.md), iki sitenin tek [CURRENT-STATE kaydı](https://github.com/ErenEdebali908755/eren-visual-archive/blob/main/docs/CURRENT-STATE.md) ve [admin belge dizini](https://github.com/ErenEdebali908755/eren-visual-archive/blob/main/docs/README.md) bu aşamayı birlikte izler. Aşağıdaki eski dağıtım kimlikleri bu yeni çalışmanın canlı kabulü değildir.

| Alan | 5 Ekim yerel/test durumu | Yeni canlı kabul |
| --- | --- | --- |
| Venice Sideways | 36 test, 37 JS syntax/privacy kontrolü, 633 galeri kontrolü; observer/permission eklenmiş ayrı yerel çalışmada 597 kontrol. Shared renderer admin ile eşit. Yeni read-only canlı kabul gözlemcileri izole fixture'da geçti. | PR #6 ürün kaynağı `a76bb10c9cdf1813f3f5ffb69ccf05eb91b5308d`; CI `37325643028` başarılı. Son yönetim kabulünü bekler; yeni visitor deployment ve gerçek canlı kabul yok. |
| Arşiv/admin | 342 test, TypeScript/tam üretim derlemesi, gerçek restore/Payload rapor ve medya testleri geçti. İki migration üretimde birer kez/batch 21. Doğal ingestion/cleanup doğrulandı. | Düzeltme PR #9 merge `85cb7b22`, Railway `9e3d0dff-d7e4-42a4-ac9a-533acf888539` FAILED (SNAPSHOT_CODE: GitHub App repo erişimi reddedildi). Sağlayıcı GitHub build olayını araştırıyor; son owner/Sideways/preview kabulü bekliyor. Esas CURRENT-STATE ve birleşik rapor ayrıntıları taşır. |
| İçerik | Geçici gerçek public photo 3/6/18 seçkisi yalnız görsel referanstır; ilgili Venedik durağında çekildiği doğrulanmış değildir. | Rota/etkinlik yayımlama ve kayıt açma ayrı işlemdir. |
| Cihaz ve fotoğraf kapsamı | Gerçek seçki portredir. Yatay/panorama yalnız açıkça etiketli sentetik geometri fixture'larıdır. | Fiziksel iPhone/Android GPS ve batarya ile gerçek yatay/panorama seçki kabulü bekliyor. |

[Ziyaretçi uygulama ve beş önizleme kanıtı](docs/2026-10-05-gallery-location.md). Canlı çalıştırıcı bu aşamada kapalıdır; başarılı son admin kabulü olmadan visitor PR'ı birleştirilmez. [Railway GitHub build gecikmesi](https://status.railway.com/incident/8RELVRFI). Birleşik yayın tamamlandı denmez.

**Önceki yayın, 5 Ekim 2026:** [GitHub PR #5](https://github.com/ErenEdebali908755/venice-sideways/pull/5) CI `37241092165` geçtikten sonra `6d3d365078f1a8b1475e0f570fe6895c644309b7` olarak ana dala birleşti. Railway `a58d3f86-3994-46a1-ac1d-84545a7111ae` SUCCESS; gerçek canlı Main/Full dört soğuk açılış, gerçek karolar, üç yapı/iki bahçe, 11/28 fotoğraf durağı, sekiz dil, tema, konum reddi ve dosya/önbellek doğrulaması 7/7 geçti. Admin de `b952dd21` ile gerçek Chrome owner/Sideways kabulünden geçti. Kod dağıtımı, adminin rota snapshot'ını veya 11 Ekim taslak etkinliğini yayımlamaz. [Türkçe sistem rehberi](https://github.com/ErenEdebali908755/eren-visual-archive/blob/main/docs/VENICE-SIDEWAYS-SYSTEM.md), [tarihsel sonuç raporu](https://github.com/ErenEdebali908755/eren-visual-archive/blob/main/docs/SIDEWAYS-RELEASE-20261005.md).

This repository contains the walk guide and the public event registration page. The Node server relays only fixed public route, opt-in anonymous statistics and event endpoints to the separate Sideways service in the Payload application. It has no database credentials, admin session, personal gallery data or private Git history. The link to Eren's archive is an ordinary outbound link. Main Walk has 11 photo stops and Full Walk has 28; both use five photo ideas per stop and eight UI/content locales (`en`, `tr`, `it`, `ru`, `fr`, `zh`, `ja`, `ko`).

The catalog always permits bundled Main/Full. When an admin snapshot is actually published, the Node server reads its explicit public projection; `published:false` means the bundled guide remains the content source. If publication status cannot be checked, the guide offers an explicit bundled-mode choice rather than presenting it silently as current. The live watercolor map uses local MapLibre assets with an OpenFreeMap/OSM base; the page theme can be dark while the map stays light. See [map provenance](docs/watercolor-map-sources.md) and the [rollout checklist](docs/MIGRATION.md).

## Run and test

Node.js 22 or newer; no runtime npm packages:

```sh
npm start
# http://localhost:3000
npm test
npm run check
```

Browser checks: `pip install playwright==1.55.0 beautifulsoup4==4.13.4`, `python -m playwright install chromium`, then `python tests/browser.py`.

## Hosting

The event form and current public route/statistics services require the dependency-free Node/Docker server; serving `public/` alone does not provide these API routes. Railway runs that server with the supplied headers. Healthcheck: `/healthz`; port: platform-provided `PORT`. No database or gallery environment variables are needed in this repository.

Deploy this repository's main branch independently from the personal site. Railway compute/bandwidth is usage-based; this is not a promise of free hosting. The map does not use a paid Google Maps API.

Attach `venicesideways.com` and use the exact DNS records returned by the host. Do not change the old gallery's DNS records. Domain verification, certificate issuance and cutover are separate steps; repository creation does not mean custom-domain HTTPS is ready.

## Own location only

Location starts **off**. A visitor explicitly selects **Show my location / Konumumu göster** and grants browser permission. The device-only explanation is beside the control. The guide draws one marker and an accuracy circle; **Turn location off / Konumu kapat** clears its watcher, marker, circle and temporary fix. Hidden pages and hidden maps stop tracking; returning does not restart it. Late callbacks cannot revive a stopped watcher. Denial or timeout leaves browsing usable. Gallery inspection and manual pan suspend camera following; only **Return to my location / Konumuma dön** resumes it. Local lifecycle/denial tests passed; current release live and physical-device acceptance remains in the table above.

Coordinates are not posted, logged, saved, placed in URLs or shared with Eren or other visitors. There is no organiser dashboard or location endpoint. Normal map-tile requests can reveal the area displayed to the map provider; browser/OS services may perform their own lookups. HTTPS and user permission are required. Background/lock-screen tracking is not guaranteed.

## Preserved features

- The source's 11-stop Main Walk (Punta della Dogana, a waterbus transfer, Cannaregio finish) and 28-stop Full Walk.
- Five phone-friendly ideas for each place; eight languages (English, Turkish, Russian, French, Chinese, Japanese, Korean and Italian) with automatic and manual selection.
- On phones, settings and nearby-place filters open in separate panels; route and location controls sit below the map.
- Dark page controls with a permanently light basemap.
- Separate walking and waterbus navigation; all stops retained across exported links.
- OpenFreeMap / OpenStreetMap / MapLibre, three original landmark drawings and two attributed OSM garden polygons. A curated stop gallery takes precedence; otherwise the authorized temporary selection is explicitly labeled. The empty-gallery state is separately tested.

## Migration safety

The domains already have separate roles. For this release, validate the compatible Payload admin/API and migration first; then merge and deploy the visitor PR and check real Main/Full, tiles, language, mobile, event draft/privacy and location denial. Do not publish unreviewed geometry to make a release test pass. Former walk URLs may redirect only after the destination is verified; the personal homepage, gallery and admin remain on erenedebali.com. Preferences and location permissions belong to each origin and do not silently migrate.

The repository was created **public** by its owner. No new open-source licence is granted to the owner's photography or text. Third-party notices remain in source. No personal media library, credentials or private-gallery history is included.
