# Venice Sideways — görsel ve mobil entegrasyon

**Tarih:** 5 Ekim 2026

**Durum:** Kaynak değişiklikleri ve kontrollü kabul tamamlandı; **bu yeni admin/ziyaretçi sürümü canlıya alınmadı**. Aynı Railway kaynak bağlantısını yenilemeye açık kullanıcı onayı ve ardından gerçek deployment/admin canlı kabulü bekleniyor.

Bu belge, 15:55 UTC [galeri/konum raporunu](2026-10-05-gallery-location.md) tekrar uygulamaz. İki yeni ZIP paketindeki uygun varlıkları ve gerçekten eksik mobil davranışları mevcut tek rehbere ekler. İki sitenin esas güncel kaydı [CURRENT-STATE](https://github.com/ErenEdebali908755/eren-visual-archive/blob/main/docs/CURRENT-STATE.md); yeni ortak ayrıntı [VISUAL-MOBILE-INTEGRATION](https://github.com/ErenEdebali908755/eren-visual-archive/blob/feat/sideways-visual-mobile/docs/VISUAL-MOBILE-INTEGRATION-20261005.md) raporudur. Önceki tarihli başarılı dağıtım bu diff'in canlı kanıtı değildir.

## Kullanıcı ne fark edecek?

- Telefonda durak paneli **Kompakt / Standart / Geniş** olarak seçilir. Kompakt görünüm durak adını, adımı ve açık yürüyüş eylemini korur; standart görünüm fotoğraf/özet/galeri; geniş görünüm gerçek anlatı ve beş fotoğraf fikrini gösterir.
- Panel aynı MapLibre haritasını yeniden boyutlandırır; ikinci harita oluşturmaz. Tam genişleme haritayı gerçekten gizler ve açık GPS'i durdurur. Haritaya dönmek konumu kendiliğinden açmaz.
- Küçük ekranda harita seçenekleri bir **Rota haritası** menüsünde toplanır; konumu açma/kapatma erişilebilir kalır. Kısa yatay ekran haritayı solda, içeriği sağda gösterir. Dört kenar safe-area ve `100dvh` korunur; proje dokunma hedefi 44–48 px'dir.
- Ayarlar sekiz dilin native adlarını ve mevcut Sistem/Açık/Koyu tercihini kullanır. Kapatma/Escape açan kontrole döner; dil değişimi yürüyüş/galeri kimliğini kaybetmez. Harita light, fotoğraflar filtresiz kalır.
- Galeri boşluğu ile yükleme hatası farklıdır. Fotoğraf hatasında **aynı onaylı türeve** manuel retry vardır; başka durağa veya private original'e geçmez. Mobil zoom CSS'i gerçek büyütmeyi artık ezmez; zoom açıkken pan/oklar kare değiştirmez.
- Yürüyüşün son gerçek adımındaki **Yürüyüşü bitir** manuel bitiş ekranını açar. GPS varış/tamamlanma üretmez; son durak galerisini inceleme ve rota seçimine dönüş vardır. Vaporetto mevcut gerçek biniş/aktarma/iniş bilgisiyle manuel devam eder.
- WebGL kesintisi GPS'i temizler ve ayrı harita kurtarma durumuna geçer. En fazla üç manuel map retry kontrollü dispose/recreate yapar, kamera/yürüyüşü korur. Tek tile/optional-art hatası bütün haritayı fatal yapmaz.
- Boot ve etkinlik kurtarma metinleri sekiz dilde çalışır. Son yayımlanan içerik kontrol edilemiyorsa yerleşik rehbere kullanıcı açıkça geçer; rehber yüklenmeden sahte aktif durak gösterilmez. Etkinlik tek uzun formdur; dil/tema değişimi alanları korur, alan yanında hata ve ilk hataya odak vardır.

## Kaynak, test ve canlı matrisi

| Gereksinim | Kaynakta durum | Güncel kontrollü kanıt | Bu diff'in canlı kabulü |
| --- | --- | --- | --- |
| Tek renderer/MapLibre/galeri/GPS | Korundu; yeni paralel sistem yok | 27 ortak dosya, eşit digest; rota/galeri/GPS sözleşmeleri | Bekliyor |
| Main 11 / Full 28 / beş fikir / ACTV / sekiz dil | Kimlikler/sıra/geometri korunur | Güncel 43 ziyaretçi testi ve mobil matris | 32 soğuk açılış bekliyor |
| Üç sheet durumu / resize | Yeni gerçek kontroller; expanded map gizler | 56 locale/viewport bağlamı + lifecycle | Bekliyor |
| 320/375/390/430, yatay, 200% eşdeğer CSS alanı | Safe-area/dvh/min-height düzenlendi | Galeri/mobil 1473 kontrol; form/boot ayrı 683 | Fiziksel bars/notch/klavye ayrıca bekliyor |
| Native ayarlar / tema / yazı | Aynı storage; Latin Extended/Cyrillic ek fontlar | Locale, sistem/manual tema, focus; 38 syntax/privacy | Bekliyor |
| Fotoğraf tam kadraj / zoom / retry / focus / Back | Tek dialog ve bağımsız walkingStep/inspectedVisit | 1473 matris + 21 lifecycle; başarılı gerçek aynı-türev retry | Bekliyor |
| Yalnız aktif durak / ilgili transfer pinleri | Zoom/fit/theme/gallery bütün pinleri açmaz | Rota sözleşmeleri, style reload ve aktif pin kontrolü | Gerçek provider canlı kabulü bekliyor |
| GPS hide/stop/late callback | Tek watch/marker; gizlenen map stop; otomatik resume yok | Lifecycle 21, engine sözleşmeleri | Fiziksel yürüyüş/batarya yapılmadı |
| Map loss/partial/retry/style rebind | Generation/source guards; bounded retry, kamera restore | Gerçek MapLibre üzerinde kontrollü WebGL olayı/recreate/style reload | Gerçek cihaz context loss ayrıca bekliyor |
| Etkinlik formu/state/error/idempotency | Mevcut API sözleşmesi; yeni GPS/consent yok | Events/boot 683; gerçek alan state/dil/uncertain sonuç fixture'ları | Taslak etkinlik açılmadı; canlı QR/kayıt kapısı bekliyor |
| Dört PNG / Yana / native ikon / fontlar | Aşağıdaki sınırlı aile seçildi | Hash/manifest, alpha/boyut/yeniden bağlama; native SVG paint | Bekliyor |
| Analytics/About/ownerId/ANY/day | Önceki düzeltmeler korundu; şema yeniden yazılmadı | Admin 344, TypeScript/tam build; güncel restore Insights 32 + medya/rol verifier | Son canlı owner/media/preview kabulü yok |
| Rollerin server sınırı / private media | Mevcut ACL, protected preview; GPS/analytics kapalı | Ayrı restore üzerinde dört rol grubu ve galeri/medya akışı | Yeni gerçek Sideways-only canlı kabul bekliyor |
| Migration / yedek | İki applied migration birer kez; yeni migration yok | Salt okunur ledger, güncel ayrı hedef restore | Yeni yayın pending; dump R2 nesnesini içermez |
| Google çeviri | Gerçek service account/glossary yoksa üretim pasif | Dürüst unavailable/reviewed fallback | Pasif; bağımsız yayın engeli değildir |

Sayılar farklı çalışmalardır; 1473, 21 ve 683 toplanarak yeni tek başarı iddiası üretilmez. Tarayıcı emülasyonu fiziksel iPhone/Android kabulü değildir.

## Varlıklar ve görsel sınırlar

İki ZIP'in manifest/hash incelemesinde **122 manifest satırı, 101 benzersiz aday, 21 değişmeden tekrar kullanılan kaynak** bulundu. Raster ekranlar ve üç SVG ölçüm şeması HTML/CSS/gerçek davranış için referanstır; ekran PNG'si ürün arayüzü olarak kullanılmadı. AI ekranından fotoğraf kırpılmadı, demo tarih/sayı/rota/provider state'i seed edilmedi. [Varlık kullanım tablosu](/Users/erenedebali/Documents/Codex/2026-09-30/beni/outputs/visual-integration-20261005/asset-usage.md), [CSV kayıt](/Users/erenedebali/Documents/Codex/2026-09-30/beni/outputs/visual-integration-20261005/asset-usage.csv) ve [hash doğrulaması](/Users/erenedebali/Documents/Codex/2026-09-30/beni/outputs/visual-integration-20261005/asset-usage-verification.json) gerçek kullanım kararını taşır.

- Üç yapı: Santa Lucia 272×92, Accademia 272×106, Punta della Dogana 272×240; botanik doku 128×128. Toplam **199,486 bayt**. Yalnız mevcut üç Main Walk route anchor'ı ve iki OSM park polygon'u kullanılır; centroid/bitki türü/envanter/mimari kesinlik iddiası yoktur. Diğer on üç suluboya aday yüklenmez.
- Yana light/dark dosyaları paketin özgün göz geometrisidir; on altı native ikon sprite içindedir. Kontrol anlamı yerelleştirilmiş metin/aria-label'da kalır. Slogan veya yaklaşık raster logo eklenmedi.
- Mevcut Cormorant Garamond/Manrope ailesine dört Latin Extended/Cyrillic subset **84,524 bayt** eklenir. SIL OFL 1.1 dosyaları korunur; CJK sistem fallback kullanır. Pakette font dosyası yoktur.
- Kullanıcının izinli **3/6/18** siyah beyaz public fotoğrafları değişmeden geçici seçki olarak kalır; Eren Edebali kredisi ve **durak ilişkisi doğrulanmadı** uyarısı gösterilir. **20/44 kullanılmadı.** Gerçek yatay/panorama seçki henüz doğrulanmadı; geometri fixture'ları fotoğraf değildir.

Haritanın geometri/lisans/anchor/cache ayrıntısı [kaynak belgesindedir](watercolor-map-sources.md). User package kullanımı yeni genel açık lisans veya kalıcı fotoğraf/yayın onayı oluşturmaz. Özel original dosyaları public'e eklenmedi.

## Ortak dosyalar ve önbellek

`tools/sync-field-guide.mjs --check` **27 dosya** üzerinde eşitlik verir; yeni ikon/mark/font/lisans ve gerçekten seçilmiş PNG türevleri admin private preview kopyasına dahil edilir. Digest: `2d639ad71910f122d6c9e8b3cbef539b309ffa4634016a581ec9219399b57bde`. Public JS/CSS/module/sprite cache sürümü `20261005-mobile`; PNG türev yollarında içerik hash'i vardır. Final dağıtımda HTTP served revision ve cached dosyalar ayrıca doğrulanmalıdır. Hash veya yerel eşitlik tek başına canlı kabul değildir.

## Güncel kanıtlar ve önizlemeler

Aşağıdakiler **yerel/kontrollü gerçek bileşen** görüntüleridir. Mobil rehber, gerçek MapLibre üzerinde izole basemap fixture'ı; GPS/WebGL olayları simülasyondur. Fotoğraflar gerçek, geçici kullanıcı çekimleridir; form/API durumları kontrollü fixture'dır. Canlı kayıt veya fiziksel cihaz gibi sunulmaz.

| Görünüm | Kanıt |
| --- | --- |
| 320 px kompakt sheet | [Ekran](/Users/erenedebali/Documents/Codex/2026-09-30/beni/outputs/visual-integration-20261005/mobile-guide/sheet-compact-tr-320.png) |
| 390 px kompakt / geniş panel | [Kompakt](/Users/erenedebali/Documents/Codex/2026-09-30/beni/outputs/visual-integration-20261005/mobile-guide/sheet-compact-tr-390.png), [Geniş](/Users/erenedebali/Documents/Codex/2026-09-30/beni/outputs/visual-integration-20261005/mobile-guide/sheet-expanded-tr-390.png) |
| Kısa yatay map/detail | [844×390](/Users/erenedebali/Documents/Codex/2026-09-30/beni/outputs/visual-integration-20261005/mobile-guide/sheet-compact-tr-844.png) |
| Mobil açık galeri / masaüstü map+galeri | [Mobil TR](/Users/erenedebali/Documents/Codex/2026-09-30/beni/outputs/visual-integration-20261005/mobile-guide/gallery-mobile-tr.png), [Masaüstü EN](/Users/erenedebali/Documents/Codex/2026-09-30/beni/outputs/visual-integration-20261005/mobile-guide/gallery-desktop-en.png) |
| Koyu lightbox / native SVG paint | [Lightbox](/Users/erenedebali/Documents/Codex/2026-09-30/beni/outputs/visual-integration-20261005/mobile-lifecycle/dark-lightbox-tr-390.png), [Native ikonlar](/Users/erenedebali/Documents/Codex/2026-09-30/beni/outputs/visual-integration-20261005/mobile-lifecycle/native-icons-dark-tr-390.png) |
| 320 px Ayarlar / fotoğraf hatası ve retry | [Ayarlar](/Users/erenedebali/Documents/Codex/2026-09-30/beni/outputs/visual-integration-20261005/mobile-guide/settings-dark-tr-320.png), [Fotoğraf hatası](/Users/erenedebali/Documents/Codex/2026-09-30/beni/outputs/visual-integration-20261005/mobile-guide/photo-error-retry-tr-320.png) |
| Manuel gerçek son adım | [Bitiş](/Users/erenedebali/Documents/Codex/2026-09-30/beni/outputs/visual-integration-20261005/mobile-lifecycle/completion-tr-390.png) |
| Form alan hatası / yatay ayarlar / boot kurtarma | [TR 320](/Users/erenedebali/Documents/Codex/2026-09-30/beni/outputs/visual-integration-20261005/events-boot/event-validation-320-tr.png), [RU yatay](/Users/erenedebali/Documents/Codex/2026-09-30/beni/outputs/visual-integration-20261005/events-boot/event-landscape-settings-ru.png), [Boot TR 320](/Users/erenedebali/Documents/Codex/2026-09-30/beni/outputs/visual-integration-20261005/events-boot/boot-recovery-320-tr.png) |
| Gerçek provider, yerel preview | [Main Walk gerçek karolar](/Users/erenedebali/Documents/Codex/2026-09-30/beni/outputs/visual-integration-20261005/local-preview/main-tr-real-tiles.png), [Mobil açılış](/Users/erenedebali/Documents/Codex/2026-09-30/beni/outputs/visual-integration-20261005/local-preview/home-tr-390.png) |
| Fotoğrafsız durak / gerçek portre / sentetik kadraj | [Boş galeri](/Users/erenedebali/Documents/Codex/2026-09-30/beni/outputs/visual-integration-20261005/local-preview/gallery-empty-tr-390.png), [Gerçek portre](/Users/erenedebali/Documents/Codex/2026-09-30/beni/outputs/visual-integration-20261005/local-preview/gallery-portrait-reference-tr-390.png), [Sentetik yatay](/Users/erenedebali/Documents/Codex/2026-09-30/beni/outputs/visual-integration-20261005/local-preview/gallery-landscape-fixture-tr-390.png), [Sentetik panorama](/Users/erenedebali/Documents/Codex/2026-09-30/beni/outputs/visual-integration-20261005/local-preview/gallery-panorama-fixture-tr-390.png) |
| TR/EN admin dar/geniş | [TR 320](/Users/erenedebali/Documents/Codex/2026-09-30/beni/outputs/visual-integration-20261005/admin-insights/insights-tr-320-overview.png), [EN 1440](/Users/erenedebali/Documents/Codex/2026-09-30/beni/outputs/visual-integration-20261005/admin-insights/insights-en-1440-overview.png) |

[Güncel mobil matris raporu](/Users/erenedebali/Documents/Codex/2026-09-30/beni/outputs/visual-integration-20261005/mobile-guide/browser-report.json), [lifecycle raporu](/Users/erenedebali/Documents/Codex/2026-09-30/beni/outputs/visual-integration-20261005/mobile-lifecycle/browser-report.json), [etkinlik/boot raporu](/Users/erenedebali/Documents/Codex/2026-09-30/beni/outputs/visual-integration-20261005/events-boot/verification.json) ve [PII içermeyen operasyon kanıtı](/Users/erenedebali/Documents/Codex/2026-09-30/beni/outputs/visual-integration-20261005/release-proof-summary.json) ayrı çalışmaları açıklar. [Ayrı gerçek provider/yerel preview ölçümü](/Users/erenedebali/Documents/Codex/2026-09-30/beni/outputs/visual-integration-20261005/local-preview/verification.json) loopback üzerinde yalnız GET/HEAD ile yapıldı; üretime yazı ve GPS başlangıcı sıfır, browser error yok. Başlangıç+yürüyüş 390 px için 37 istek/2,594,401 bayt, 1440 px için 42 istek/2,757,173 bayt; ikisinde JS aktarımı 1,178,476 bayttır. Açılış LCP/CLS sırasıyla 1380 ms/0.0000635 ve 124 ms/0.00519 ölçüldü. Bunlar hız sınırı uygulanmamış masaüstü Chrome ve sıcak OS/provider cache koşullarıdır; fiziksel mobil, soğuk canlı kabul veya performans garantisi değildir. Yalnız dört seçili art türevi ve uygun tek onaylı kapak türevi başlangıçta istendi; tüm galeriler/orijinaller/17 çizim peşin yüklenmedi.

## Veri, izin ve üretim kapısı

Arşivdeki tek analytics/About hattı, üç bağımsız scope ve ilgili epoch/withdrawal/receipt sınırları korundu. Üretim salt okunur kontrolünde aggregate saklama 180, return/About en fazla 90, journey 30 gündür; daha kısa owner ayarı üstündür. Etkinlik katılımcı kaydı ayrı 180 günlük politikasını korur. GPS form/analytics/About/admin/URL/storage/log'a gitmez; map tile istekleri viewport bağlamı taşıyabilir. `ownerId` ve PostgreSQL `ANY`/tarihsel varchar gün düzeltmeleri geri alınmadı; bu çalışma yeni collection veya migration üretmedi.

Güncel DB yedeği **16:45:05 UTC**, ayrı boş hedef restore **16:46:12 UTC**: 128 tablo / 29 migration, eşleşen logical digest. Dump SHA-256: `470284bfa20e70c120f5f9df185f3ed267102f8a9f72608d220e9a7bfeb07ae8`. **R2 nesnelerini kapsamaz.** `20261005_153000_sideways_gallery` ve `20261005_160000_analytics_purposes` üretimde birer kez/batch 21 olarak salt okunur doğrulandı. Schema push/down veya yeniden adlandırılmış duplicate migration yok. Veri silen maintenance/schedule GET çağrılmadı.

Aktif eski admin: SHA `c00e7974aaabd612387c07dee49df21afaa2c1d5`, deployment `c40ddf4b-7bdf-4ec8-a1f4-7930065e6273`. Son başarısız deneme: `9e3d0dff-d7e4-42a4-ac9a-533acf888539`, **SNAPSHOT_CODE**, **canRedeploy=false**; Railway GitHub App'in doğru depoyu okuma kimliği reddedildi. [Genel Railway incident'i](https://status.railway.com/incident/8RELVRFI) çözüldü; bu repo bağlantısının onarıldığı veya son düzeltmenin servis edildiği anlamına gelmez. Taze GitHub Installed App ekranı Railway ayarlarını ve **mevcut “All repositories”** seçimini gösterir; “Confirm access” kimlik doğrulama adımı artık bekleyen işlem değildir. Kaynak okumanın tekrar başarılı olduğu henüz bir snapshot/deployment SUCCESS ile kanıtlanmadı. **Aynı Railway servisindeki aynı private admin deposu/main bağlantısını yenileme** kalıcı kaynak yapılandırmasını değiştirebilir ve deploy tetikleyebilir; otomatik onay incelemesi bu işlemi reddetti. Gerekli en küçük kullanıcı adımı yalnız **bu mevcut bağlantıyı yenilemeye açık onaydır**. Depo erişim kapsamı genişletilmedi, yeni depo seçilmedi ve GitHub ayarı değiştirilmedi. Private repo public yapılmaz, yeni paralel servis açılmaz ve eski image yeni yayın gibi sunulmaz.

[Visitor PR #6](https://github.com/ErenEdebali908755/venice-sideways/pull/6) açık ve birleştirilmemiştir. Yeni ürün commit'i `fd9906218544608b5167f155e94bcf4f3b379e4f`, iki yalnız test düzeltmesinden sonraki doğrulanmış revizyon `6aa5ed7efc9005b2957104f4ddf37218284d2492`; [CI 37356026640](https://github.com/ErenEdebali908755/venice-sideways/actions/runs/37356026640) **SUCCESS**: 43 test/38 kontrol, exact Docker build/smoke, 491 arayüz ve ayrı 21 MapLibre/GPS kontrolü. Son MapLibre kontrolü izole taban haritası/simüle konumdur, canlı kabul değildir. Önceki iki CI denemesi kapalı mobil Ayarlar/harita menüsünü açmayan testlerde durdu; native menüyü açıp kapatan akış düzeltildi, kontroller atlanmadı ve ürün kodu değişmedi. Admin ürün `d050cea5fd4ce2398e517d966f3fd89f067ab034`, [PR #11](https://github.com/ErenEdebali908755/eren-visual-archive/pull/11), [CI 37354896899](https://github.com/ErenEdebali908755/eren-visual-archive/actions/runs/37354896899) SUCCESS. Daha sonraki yalnız belge commitleri uygulama değişikliği değildir; final PR head/CI/dağıtım kimlikleri ortak rapor ve PR kayıtlarında izlenir. Önce admin doğru SHA ile gerçek SUCCESS, served revision ve owner/Sideways medya/preview/ACL kabulü; sonra onunla aynı visitor dosyaları yayımlanır. Main/Full × sekiz dil × mobil/masaüstü **32 soğuk açılış**, event/QR, izin reddi/cache/gerçek tiles ayrıca yapılır. Bu canlı kapılar henüz geçilmedi.

Geri dönüş ileri uyumlu kod/özellik kapatma ile yapılır; İtalyanca/sourceLanguage/gallery/consent epoch/tombstone verisini silen down veya eski yedi dilli admin'e kör dönüş yoktur. Restore gerekirse backup sonrası yazılar ve R2 nesneleri ayrı uzlaştırılır. Google Translation kimlikleri/glossary yokken otomatik üretim pasif kalır; reviewed fallback sahte çeviri başarısı gibi gösterilmez.

## Kısa kullanım ve bekleyen cihaz kabulü

**Ziyaretçi:** Rotayı seç → başlangıca git → **Buradayım** ile yürüyüşü manuel başlat. Panel boyutunu düğmelerle seç. Galeriden başka durağı incelemek yürüyüş adımını değiştirmez; Back önce büyük fotoğraftan galeriye, sonra haritaya döner. Konum isteğe bağlıdır; harita gizlendiğinde/uygulama arka plana geçtiğinde durur. Yeniden açma ve **Konumuma dön** kullanıcı eylemidir. Son adımı **Yürüyüşü bitir** ile kendin onayla.

**Owner/Sideways yönetimi:** Fotoğraf yüklemek, draft save ve private preview içerik yayımlamak değildir. Media hak/onay/place ilişkisi, cover/sıra/focal point ve sekiz dilde reviewed copy kontrol edilir; immutable release ayrı yetkili eylemdir. Sideways-only kullanıcı archive/original/About/istatistik erişimi kazanmaz; publish/event/registration izinleri ayrı kalır. Arşiv ölçümlerini kişi sayısı veya gerçek dikkat olarak okumayın: anonim toplam ile izinli tarayıcı örneklemi ve hazır/ön plandaki görünür süre farklıdır.

**Yapılmadı — fiziksel iOS Safari / Android Chrome kabulü:**

- [ ] Gerçek GPS izin ver/ret/iptal; stale/düşük doğruluk/Venedik dışı konum ve yürüyüşte batarya.
- [ ] Arka plan/ön plan, ekran kilidi/BFCache, tamamen kapalı map; otomatik watch/follow başlamaması.
- [ ] Çentik/dört inset, dinamik browser bars, orientation; native telefon/e-posta klavyesiyle odak/hata/gönderme erişimi.
- [ ] Galeri swipe/zoom pan, panel scroll, map pan, native Back ve focus dönüşü.
- [ ] Gerçek yatay/panorama fotoğraf seçkisi, kendi cihazında tüm kadraj ve okunabilir caption.

Bu liste ve canlı yayın kapısı açık kalmıştır; emülasyon bunları tamamlanmış saymaz.
