# Venice Sideways

Independent multilingual photography walks for **https://venicesideways.com/**.

## Görsel ve mobil entegrasyon — 5 Ekim 2026

**Yeni sürüm canlıya alınmadı.** Son çalışma iki ZIP paketindeki uygun native varlıkları mevcut rehbere entegre etti; üç mobil panel durumu, küçük/yatay ekran, Ayarlar, fotoğraf yeniden deneme, manuel bitiş, harita toparlanması ve etkinlik formu tamamlandı. Mevcut tek MapLibre/galeri/GPS ve ortak admin renderer korundu. [Yeni ziyaretçi raporu](docs/2026-10-05-visual-mobile.md), [güncel ortak uygulama raporu](https://github.com/ErenEdebali908755/eren-visual-archive/blob/feat/sideways-visual-mobile/docs/VISUAL-MOBILE-INTEGRATION-20261005.md) ve [varlık/kaynak kaydı](docs/watercolor-map-sources.md) ayrıntıları taşır.

| Kapı | Güncel yerel/kontrollü kanıt | Canlı durum |
| --- | --- | --- |
| Ziyaretçi | 43 test; 38 syntax/privacy kontrolü; sekiz dil/56 viewport bağlamında 1473 galeri/mobil kontrol; ayrı lifecycle 21 ve etkinlik/boot 683 kontrolü geçti. | PR #6 final admin SUCCESS ve kimliği doğrulanmış canlı kabulü bekliyor. Yeni visitor sürümü yayımlanmadı; 32 canlı soğuk açılış bekliyor. |
| Ortak admin | 344 test, TypeScript ve tam üretim derlemesi geçti. Güncel yedekten ayrı restore üzerinde Insights 32 kontrol, dört rol grubu ve medya/galeri doğrulaması geçti. | Aktif `c00e7974` / Railway `c40ddf4b-7bdf-4ec8-a1f4-7930065e6273`; düzeltme ve bu yeni tasarımın son canlı kabulü yok. |
| Ortak renderer/varlıklar | 27 dosya aynı; digest `2d639ad71910f122d6c9e8b3cbef539b309ffa4634016a581ec9219399b57bde`, cache sürümü `20261005-mobile`. | Final dağıtımda served revision/cache eşleşmesi doğrulanacak. |
| Yayın engeli | Railway son denemesi `9e3d0dff-d7e4-42a4-ac9a-533acf888539`, `SNAPSHOT_CODE`, `canRedeploy=false`: GitHub App depo erişimi reddedildi. Genel incident çözüldü; bu repo erişiminin düzeldiği kanıtlanmadı. | Güncel GitHub Installed App ekranında Railway ve mevcut “All repositories” seçimi görünür. Aynı servis/private admin depo/main bağlantısını yenileme işlemi kalıcı kaynak yapılandırmasını değiştirebilir ve deploy tetikleyebilir; otomatik onay incelemesi bu işlemi reddetti. Gerekli en küçük kullanıcı adımı aynı bağlantının yenilenmesine açık onaydır. Başarılı snapshot/deployment ve admin kabulü hâlâ doğrulanmadı. |

Fotoğraflar filtresiz; 3/6/18 geçici kullanıcı fotoğraflarının durak ilişkisi doğrulanmadı. Paketin 20/44 fotoğrafları kullanılmadı. Google çeviri üretimi pasif; fiziksel telefon/GPS/batarya, native klavye/tarayıcı çubuğu ve gerçek yatay/panorama seçki kabulü yapılmadı. Rota/etkinlik açma işlemi yapılmadı. Yeni şema veya ikinci sistem eklenmedi.

## Tarihsel birleşik aşama — 5 Ekim 2026, 15:55 UTC

Arşiv ölçümü/About ve Sideways nötr galeri/medya/GPS çalışmasının esas kaydı [birleşik sonuç raporudur](https://github.com/ErenEdebali908755/eren-visual-archive/blob/main/docs/COMBINED-RELEASE-20261005.md). [Belge dizini](docs/README.md), iki sitenin tek [CURRENT-STATE kaydı](https://github.com/ErenEdebali908755/eren-visual-archive/blob/main/docs/CURRENT-STATE.md) ve [admin belge dizini](https://github.com/ErenEdebali908755/eren-visual-archive/blob/main/docs/README.md) bu aşamayı birlikte izler. Aşağıdaki eski dağıtım kimlikleri bu yeni çalışmanın canlı kabulü değildir.

| Alan | 5 Ekim yerel/test durumu | Yeni canlı kabul |
| --- | --- | --- |
| Venice Sideways | 36 test, 37 JS syntax/privacy kontrolü, 633 galeri kontrolü; observer/permission eklenmiş ayrı yerel çalışmada 597 kontrol. Shared renderer admin ile eşit. Yeni read-only canlı kabul gözlemcileri izole fixture'da geçti. | PR #6 ürün kaynağı `a76bb10c9cdf1813f3f5ffb69ccf05eb91b5308d`; Başarılı son CI `37335751873`, doğrulanmış head `87f370d5` (ardından yalnız belge düzeltmesi). Son yönetim kabulünü bekler; yeni visitor deployment ve gerçek canlı kabul yok. |
| Arşiv/admin | 342 test, TypeScript/tam üretim derlemesi, gerçek restore/Payload rapor ve medya testleri geçti. İki migration üretimde birer kez/batch 21. Doğal ingestion/cleanup doğrulandı. | Düzeltme PR #9 merge `85cb7b22`, Railway `9e3d0dff-d7e4-42a4-ac9a-533acf888539` FAILED (SNAPSHOT_CODE: GitHub App repo erişimi reddedildi). Bu tarihsel kesitte sağlayıcı GitHub build olayını araştırıyordu; güncel engel yukarıdaki yeni bölümde kayıtlıdır. Esas CURRENT-STATE ve birleşik rapor ayrıntıları taşır. |
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
- On phones, a compact/standard/expanded stop panel uses the same map; map options and explicit location controls stay above the canvas. Settings contain the existing language/theme preferences. Expanding until the map is hidden stops GPS; returning does not restart it.
- Dark page controls with a permanently light basemap.
- Separate walking and waterbus navigation; all stops retained across exported links.
- OpenFreeMap / OpenStreetMap / MapLibre, three user-supplied illustrative PNG derivatives and two attributed OSM garden polygons. A curated stop gallery takes precedence; otherwise the authorized temporary selection is explicitly labeled. The empty-gallery state is separately tested.

## Migration safety

The domains already have separate roles. For this release, validate the compatible Payload admin/API and migration first; then merge and deploy the visitor PR and check real Main/Full, tiles, language, mobile, event draft/privacy and location denial. Do not publish unreviewed geometry to make a release test pass. Former walk URLs may redirect only after the destination is verified; the personal homepage, gallery and admin remain on erenedebali.com. Preferences and location permissions belong to each origin and do not silently migrate.

The repository was created **public** by its owner. No new open-source licence is granted to the owner's photography or text. Third-party notices remain in source. No personal media library, credentials or private-gallery history is included.
