# Venice Sideways

Independent multilingual photography walks for **https://venicesideways.com/**.

**Yayın durumu, 5 Ekim 2026:** [GitHub PR #5](https://github.com/ErenEdebali908755/venice-sideways/pull/5) CI `37241092165` geçtikten sonra `6d3d365078f1a8b1475e0f570fe6895c644309b7` olarak ana dala birleşti. Railway `a58d3f86-3994-46a1-ac1d-84545a7111ae` SUCCESS; gerçek canlı Main/Full dört soğuk açılış, gerçek karolar, üç yapı/iki bahçe, 11/28 fotoğraf durağı, sekiz dil, tema, konum reddi ve dosya/önbellek doğrulaması 7/7 geçti. Admin de `b952dd21` ile gerçek Chrome owner/Sideways kabulünden geçti. Kod dağıtımı, adminin rota snapshot'ını veya 11 Ekim taslak etkinliğini yayımlamaz. [Türkçe sistem rehberi](https://github.com/ErenEdebali908755/eren-visual-archive/blob/main/docs/VENICE-SIDEWAYS-SYSTEM.md), [güncel durum](https://github.com/ErenEdebali908755/eren-visual-archive/blob/main/docs/CURRENT-STATE.md) ve [sonuç raporu](https://github.com/ErenEdebali908755/eren-visual-archive/blob/main/docs/SIDEWAYS-RELEASE-20261005.md).

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

Location starts **off**. A visitor explicitly selects **My location / Konumum**, confirms that it is device-only, and grants browser permission. The live guide draws only that device's marker; **Stop location / Konumu kapat** clears its watcher and marker. Hidden pages stop tracking; a late position callback cannot restart a stopped watcher. Denial or timeout leaves map and stop browsing usable. The location-error versus map-error correction passed the shared-renderer sync and live denial check: the map stayed ready with no location pin or map-retry control.

Coordinates are not posted, logged, saved, placed in URLs or shared with Eren or other visitors. There is no organiser dashboard or location endpoint. Normal map-tile requests can reveal the area displayed to the map provider; browser/OS services may perform their own lookups. HTTPS and user permission are required. Background/lock-screen tracking is not guaranteed.

## Preserved features

- The source's 11-stop Main Walk (Punta della Dogana, a waterbus transfer, Cannaregio finish) and 28-stop Full Walk.
- Five phone-friendly ideas for each place; eight languages (English, Turkish, Russian, French, Chinese, Japanese, Korean and Italian) with automatic and manual selection.
- On phones, settings and nearby-place filters open in separate panels; route and location controls sit below the map.
- Dark page controls with a permanently light basemap.
- Separate walking and waterbus navigation; all stops retained across exported links.
- OpenFreeMap / OpenStreetMap / MapLibre. The live design includes three original landmark drawings and two attributed OSM garden polygons; photo cards without an owned photo remain empty.

## Migration safety

The domains already have separate roles. For this release, validate the compatible Payload admin/API and migration first; then merge and deploy the visitor PR and check real Main/Full, tiles, language, mobile, event draft/privacy and location denial. Do not publish unreviewed geometry to make a release test pass. Former walk URLs may redirect only after the destination is verified; the personal homepage, gallery and admin remain on erenedebali.com. Preferences and location permissions belong to each origin and do not silently migrate.

The repository was created **public** by its owner. No new open-source licence is granted to the owner's photography or text. Third-party notices remain in source. No personal media library, credentials or private-gallery history is included.
