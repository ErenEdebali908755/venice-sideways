# Preserved document — README.md

Archived during the October 2026 documentation cleanup. The original text below is unchanged; its dated status and verification claims are historical, not fresh checks. Relative links retain their original document context; use the [original source](https://github.com/ErenEdebali908755/venice-sideways/blob/d1ca80540380f0bc0b03acc0f1f55ceddb628d29/README.md) to follow them.

<!-- BEGIN VERBATIM ORIGINAL -->
# Venice Sideways

## Güncel yürüyüş/görsel UX yayını — 9 Ekim 2026

Sınırlandırılmış yeni yürüyüş/görsel UX sürümü [canlı rehberde](https://venicesideways.com/) yayımlandı. Admin `fca7d09563d7f4eecd44e38d469393441adb9654` / Railway `63b42b7a-3456-483f-9059-0e76ec44c803` **18:51:45 UTC SUCCESS**, ziyaretçi `4ebe7a528264bb73b9ebf447764769fdbfa488be` / Railway `fe2ad236-736c-4408-a550-db459f1a9b99` **18:57:13 UTC SUCCESS**. Yeni CI/üretim kapıları, iki hostta 325 HTTPS kontrolü ve 128 dosyanın bayt eşitliği, gerçek canlı 50 kontrol/72 GET ve native Chrome sekiz dil/tema/%200 kontrolleri geçti. Fiziksel telefon ve saha kabulü ayrı bekliyor.

**Kullanım:** Santa Lucia'da **Buradayım — yürüyüşe başla**; sonra adlı hedefe varış/fotoğraf molası/sonraki durağa devam manuel ilerler. **Harita / Duraklar / Fotoğraflar** veya başka durak incelemesi yürüyüş hedefini değiştirmez. Main 11 fotoğraf durağı + iki bacaklı ayrı vaporetto, Full 28; GPS otomatik ilerletmez. Eksik fotoğraf kapağı dürüst boş durumdur, izinli arşiv örnekleri ayrı İlham alanındadır. 40 kitap dosyası kamuya eklenmedi. Google üretimi pasif; mevcut 11 Ekim etkinliği taslak, başlangıç saati boş, kayıt açılmadı. Yeni migration veya editoryal snapshot yayını yoktur.

[9 Ekim yayın, güncel kullanım ve kalan sınırlar](docs/WALKING-RELEASE-20261009.md) · [tek güncel durum](https://github.com/ErenEdebali908755/eren-visual-archive/blob/main/docs/CURRENT-STATE.md) · [sistem kılavuzu](https://github.com/ErenEdebali908755/eren-visual-archive/blob/main/docs/VENICE-SIDEWAYS-SYSTEM.md)

Aşağıdaki 5–6 Ekim bölümleri tarihli önceki kanıttır; yeni test/canlı durumun yerine kullanılmaz.

## Tarihsel Kit 05 — 6 Ekim, iki kod dağıtıldı ve QA ayrımı

**İlk ziyaretçi dağıtım kesiti (PR #14):** Kit 05 ziyaretçi kodu ortak durak hikâyesi, optik harita kalibrasyonu, tam kadraj fotoğraflar ve kısa özel önizleme düzenini içerir. Admin `fe4bbbb16e781694f069cb64ad174334eb2067d6` / Railway `8cdb369f-bb7c-45db-b25c-c140cfbdd674` **6 Ekim 20:52:32 UTC SUCCESS**; korumalı admin kabulü 172 denetim/30 kayıtta, ayrı hikâye/özel önizleme kabulü 21:15:38 UTC’de 11/11 geçti. Ziyaretçi [PR #14](https://github.com/ErenEdebali908755/venice-sideways/pull/14) kaynak başı `b018318` ana dala `df6e28e53937bf06c14624030ace326ba0022567` olarak birleşti; Railway `743724a1-e59d-405e-8503-83698e285650` **21:17:49.798 UTC SUCCESS**; **Kit 05 ziyaretçi canlı kabulü o sırada sürüyordu**. Ortak 126 dosyanın admin HTTPS eşitliği 128 denetimde geçti. Üretim hikâye şeması 30 migration ile hazır; araştırma paketindeki 30 Türkçe öneri 21:00:23.719 UTC’de yalnız özel üretim taslağına inceleme bekler durumda aktarıldı; insan onayı ve yayın 0. Google otomatik çevirisi pasif; Tre Archi, 25 çözülmemiş mimari dayanak ve iki yeni bahçe çizimi bekliyor. Etkinlik için CX Lobby / 15:45 Europe/Rome biliniyor; tarih onaylanmadı, kesin QR veya kayıt açılışı yok.

**Son Kit 05 canlı kanıtı:** Son ziyaretçi runtime/merge 073ba8bc5b3ac0bb9897d65aeeb5f606420416c0; PR #15 ürün kaynağı 13807fa9ac0834e24787b88b3f2f63092faa374b, Railway a5b58e97-ba69-40f3-a2d2-4e730af2322c ile 21:32:24.283 UTC'de SUCCESS oldu. İki hostta 257 HTTPS okuma ve 126 ortak dosyanın bayt eşitliği geçti. Gerçek Chrome %200 taraması 32 vaka / 2.767 kontrol PASS. Son geniş soğuk ziyaretçi raporu 32 vaka / 1.736 kontrolde EXIT 1 olarak korunuyor: 1.704 ürün kontrolü geçti; 32 başarısız iddia, paketli genel dil metnindeki needsReview işaretini özel hikâye yayını kuralı sanan QA beklentisiydi. Ayrı dar canlı takip 5 gerçek GET ve 240 metin grubu × 8 dilde 1.920 seçimle PASS; 46 bekleyen genel satır seçilmedi, kamu hikâyesi ve özel alan sayısı 0. Main/Full hâlâ published:false ve paketli rehber kullanıyor; araştırma önerileri yayımlanmadı.

Main/Full katalogda published:false kaldığından açık rota API'si 404 döner ve rehber paketli rotayı gösterir. İlk 32/1.576 raporundaki yanlış koşulsuz 200 beklentileri ile son 32/1.736 raporundaki genel metin needsReview beklentileri ayrı ham QA başarısızlıkları olarak korunur. PR #15'in v3 aracısı son sürümde dağıtıldı; gerçek onaylı editoryal snapshot henüz yayımlanmadı.

[Tek güncel durum](https://github.com/ErenEdebali908755/eren-visual-archive/blob/main/docs/CURRENT-STATE.md) · [harita ve kaynaklar](docs/watercolor-map-sources.md)


Independent multilingual photography walks for **https://venicesideways.com/**.

## Kit 04 — 6 Ekim 2026 canlı yayın

Yeni ziyaretçi rehberi ve native admin kontrollü admin→visitor sırasıyla yayımlandı. Ziyaretçimerge `5c077c04` / Railway `384ccd70-a1e4-46bd-8fec-64cb91727919`; adminmerge `2f3a510b` / Railway `1257b775-707b-4ede-a01d-3b81045a49a9`: **SUCCESS**. Exact CI/tam üretim build, gerçek Sideways28/28, sekiz UI dili×Main/Full×390/1440 **32soğuk/1512kontrol** ve iki host120shared HTTPS eşitliği geçti.

[Canlı rehber](https://venicesideways.com) · [güncel ziyaretçi raporu](docs/2026-10-05-visual-mobile.md) · [teknik kanıt](docs/kit04-release-proof-20261006.json) · [tek CURRENT-STATE](https://github.com/ErenEdebali908755/eren-visual-archive/blob/main/docs/CURRENT-STATE.md). Google üretimi pasif; gerçek owner etkinlik/katılımcı ekranları ve fiziksel telefon kabulü eksik. TreArchi kapalı; AI çizimler fotoğraf değildir,3/6/18 geçici fotoğrafların durak ataması doğrulanmadı. Sıfır istatistik sıfır rızalı olay demektir, sıfır insan değil. Etkinlik taslak/QR unavailable/no-form, gerçek kayıt yok; otobüs gelecekteki stil.

## Kit 04 öncesi tarihli görsel ve mobil entegrasyon — 5 Ekim 2026

**Güncel durum — 6 Ekim 2026 (Roma/UTC):** Admin `93c99ce9` / `56689fed` **05:45:33 UTC SUCCESS**, ziyaretçi `b698162c` / `cf252b24` önceki doğrulanmış sürümde. Dar Insights fotoğraf etiketi düzeltmesi yeni **345 test/TypeScript/tam build/CI** kapısını geçti; son gerçek owner etiket kontrolü giriş bekliyor. 5 Ekim ziyaretçi **32/1432 + ayrı 3/103** kabulü korunur; 6 Ekim yeni admin **Sideways19/19** ve ayrı Main/Full **4/186** geçti. Önceki `86006627` owner/19 kabulü tarihli kanıttır; yeni owner başarısı yerine kullanılmaz. Fiziksel cihaz/native zoom-klavye, gerçek panorama seçkisi ve Google yapılandırması ayrı sınırlardır. [Ziyaretçi raporu](docs/2026-10-05-visual-mobile.md) ve [tek CURRENT-STATE](https://github.com/ErenEdebali908755/eren-visual-archive/blob/main/docs/CURRENT-STATE.md) kaynak/test/canlı ayrımını taşır.

| Kapı | Güncel yerel/kontrollü kanıt | Canlı durum |
| --- | --- | --- |
| Ziyaretçi | Yeni 43 test/38 kontrol ve final CI 37379668161 SUCCESS; önceki 1473/21/683 çalışmaları kendi kapsamındadır. | Final PR8/b698162c/cf252b24 **22:19:55.752UTC SUCCESS**, CI37379668161; yeni1432/32+ayrı103/3 geçti. Önceki PR6/7/c105/9a tarihsel fazlardır. |
| Ortak admin | 6Ekim345 test/TypeScript/tam build ve CI37418712031 SUCCESS. | PR14/93c99ce9/56689fed05:45:33.625UTC SUCCESS; son owner fotoğraf etiketi gerçek giriş bekliyor. Yeni93Sideways19/19 geçti; kontrollü hesap temizlendi. Önceki860 owner kabulü5Ekim tarihli; renderer27 e45 değişmedi. |
| Ortak renderer/varlıklar | 27 dosya/digest `e45c12ccce4afd5ffef1170d51955d683019188df21cfa8dbaeba5bb2ac8a166`; yeni JS yükleme zinciri `20261005-gallery-reopen`; değişmeyen CSS/sprite sürümü `20261005-mobile`. | Admin/visitor/local27byte eşit/e45 ve iki loadingchain3/3HTTP/hash/import geçti; final1432/32+103/3 gerçek kabul. |
| Kaynak bağlantısı | İlk SNAPSHOT_CODE/otomatik onay durması tarihseldir; açık onayla aynı hizmet/private repo/main yenilendi. | Aynı mevcut repo/main bağlantısı/snapshot kapısı geçti, izinler genişletilmedi. İki SUCCESS doğrulandı;5Ekim gerçek kabulü tarihli, son93owner etiketi kabulü giriş bekliyor. |

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

Location starts **off**. A visitor explicitly selects **Show my location / Konumumu göster** and grants browser permission. The device-only explanation is beside the control. The guide draws one marker and an accuracy circle; **Turn location off / Konumu kapat** clears its watcher, marker, circle and temporary fix. Hidden pages and hidden maps stop tracking; returning does not restart it. Late callbacks cannot revive a stopped watcher. Denial or timeout leaves browsing usable. Gallery inspection and manual pan suspend camera following; only **Return to my location / Konumuma dön** resumes it. Local lifecycle/denial and 9 October live location with an existing grant passed; native denial and physical-device acceptance remain separate limits in the [current release note](docs/WALKING-RELEASE-20261009.md).

Coordinates are not posted, logged, saved, placed in URLs or shared with Eren or other visitors. There is no organiser dashboard or location endpoint. Normal map-tile requests can reveal the area displayed to the map provider; browser/OS services may perform their own lookups. HTTPS and user permission are required. Background/lock-screen tracking is not guaranteed.

## Preserved features

- The source's 11-stop Main Walk (Punta della Dogana, a waterbus transfer, Cannaregio finish) and 28-stop Full Walk.
- Five phone-friendly ideas for each place; eight languages (English, Turkish, Russian, French, Chinese, Japanese, Korean and Italian) with automatic and manual selection.
- On phones, a compact/standard/expanded stop panel uses the same map; map options and explicit location controls stay above the canvas. Settings contain the existing language/theme preferences. Expanding until the map is hidden stops GPS; returning does not restart it.
- Dark page controls with a permanently light basemap.
- Separate walking and waterbus navigation; all stops retained across exported links.
- OpenFreeMap / OpenStreetMap / MapLibre, three user-supplied illustrative PNG derivatives and two attributed OSM garden polygons. Explicit authorized stop galleries stay separate from inspiration. An empty stop gallery remains empty; the temporary archive selection never becomes its stop cover. See the [current photo and walking contracts](docs/WALKING-RELEASE-20261009.md).

## Migration safety

The domains already have separate roles. For this release, validate the compatible Payload admin/API and migration first; then merge and deploy the visitor PR and check real Main/Full, tiles, language, mobile, event draft/privacy and location denial. Do not publish unreviewed geometry to make a release test pass. Former walk URLs may redirect only after the destination is verified; the personal homepage, gallery and admin remain on erenedebali.com. Preferences and location permissions belong to each origin and do not silently migrate.

The repository was created **public** by its owner. No new open-source licence is granted to the owner's photography or text. Third-party notices remain in source. No personal media library, credentials or private-gallery history is included.

<!-- END VERBATIM ORIGINAL -->
