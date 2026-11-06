# Venice Sideways

A multilingual photographic walking guide for [venicesideways.com](https://venicesideways.com/).
The public experience focuses on Main Walk; saved route data and private Full Walk previews remain available to the separate administration application.

## Güncel durum — 6 Kasım 2026

- **Yayında:** main `e6e1f6dd` (PR #31, 11 Ekim 2026). Main Walk 10 fotoğraf durağı, Venezia Santa Lucia → Ponte dei Tre Archi; Full Walk 28 durak; sekiz dil. Admin kataloğunda Main/Full hâlâ `published:false`, bu yüzden ziyaretçi paketli (bundled) rehberi kullanır.
- **Canlı kontrol (yalnız GET, 6 Kasım):** `/`, `/healthz`, `/field-guide/routes.json`, `/robots.txt` 200. `/events` kökü tanımlı değil; etkinlik yalnız `/events/<ad>` ile açılır.
- **Açık PR'lar:** #25 iPhone konum zaman damgası düzeltmesi (canlıda yok; yerel 113/113 test), #21 eski yürüyüş dosyalarının kaldırılması (yerel 110/110), #32 varsayılan açık anonim sayım (karar bekliyor), #22 ve #23 saha/konum belgeleri. #1 ve #24 main ile çakıştığı için 6 Kasım'da kapatıldı.
- **Bilinen eksikler:** 38 ziyaretin 19'unda durak galerisi boş; `routes.json` yürüyüş geometrisi `routingStatus: stale` (sahada doğrulanmamış); harita aktarım işaretleri üst üste binebilir; gerçek iPhone/Android saha testi yapılmadı; 40 kitap dosyasının kullanım hakkı doğrulanmadı.
- **CI:** GitHub Actions 21 Ekim 2026'dan beri hesap faturalandırma engeli yüzünden çalışmıyor; testler yerelde koşulur (`npm test && npm run check`).
- **Ortak renderer:** admin kopyası 11 Ekim'den beri geride kalmıştı; eşitleme PR'ı admin deposunda açıldı (`node tools/sync-field-guide.mjs <admin> --check`).
- **Yayın kuralı:** değişiklikler yalnız 14:00 Europe/Rome öncesinde ve sahibin açık onayıyla yayına alınır.

## Stack

Static HTML, CSS and JavaScript with MapLibre and a dependency-free Node.js server.
The server serves approved public files and relays fixed public route, event and optional anonymous-statistics APIs.

## Run and check

Use Node.js 22 or newer; no runtime npm installation is needed.

```sh
npm start
# http://localhost:3000
npm test && npm run check
```

## Product boundaries

Keep route identities, five ideas per stop, eight languages and the light map intact.
Location is off until requested; raw device coordinates stay in the browser. Denying permission does not block the guide.
Photographs retain their source and licensing information; an empty or revoked administrator gallery stays empty.

## Hosting

Railway builds the supplied Docker service from `main`, with platform-provided `PORT` and `/healthz` health checks.
Static-only hosting cannot provide the API routes. Validate compatible admin changes before a separately approved visitor release.
Deploying code does not publish route content or open an event.

[Documentation](docs/README.md) · [Release procedure](docs/MIGRATION.md) · [Historical records](docs/history/README.md)

The owner's photographs and text are not licensed for reuse. Third-party notices remain with their assets.
