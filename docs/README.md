# Ziyaretçi belge dizini — 5 Ekim 2026

İki sitenin güncel yerel/test/canlı ayrımı tek [CURRENT-STATE](https://github.com/ErenEdebali908755/eren-visual-archive/blob/main/docs/CURRENT-STATE.md) kaydında tutulur. Bu ziyaretçi dizini yeni bir current-state belgesi oluşturmaz. [Ziyaretçi README](../README.md) yeni release kimlikleri ve canlı kabul için bekleyen alanları gösterir; önceki yayın kimlikleri tarihsel kalır.

| Konu | Esas belge |
| --- | --- |
| Güncel görsel/mobil entegrasyon, varlıklar ve canlı kabul kapısı | [VISUAL-MOBILE-INTEGRATION-20261005](https://github.com/ErenEdebali908755/eren-visual-archive/blob/main/docs/VISUAL-MOBILE-INTEGRATION-20261005.md) |
| Yeni mobil davranış, fotoğraf retry, safe-area ve kanıtlar | [5 Ekim görsel/mobil ziyaretçi raporu](2026-10-05-visual-mobile.md) |
| Tarihsel 15:55 UTC birleşik kapsam, migration ve geri dönüş | [COMBINED-RELEASE-20261005](https://github.com/ErenEdebali908755/eren-visual-archive/blob/main/docs/COMBINED-RELEASE-20261005.md) |
| Galeri/GPS uygulaması, ağ sınırı, yerel kabul ve beş önizleme | [5 Ekim ziyaretçi raporu](2026-10-05-gallery-location.md) |
| Rota/admin/etkinlik işlemleri ve iki alan adı | [VENICE-SIDEWAYS-SYSTEM](https://github.com/ErenEdebali908755/eren-visual-archive/blob/main/docs/VENICE-SIDEWAYS-SYSTEM.md) |
| Admin ölçüm, izin, galeri ve operasyon belgeleri | [Admin belge dizini](https://github.com/ErenEdebali908755/eren-visual-archive/blob/main/docs/README.md) |
| Gerçek harita/çizim/bahçe kaynakları ve lisans | [Suluboya harita kaynakları](watercolor-map-sources.md) |
| Hosting ve geçiş | [MIGRATION](MIGRATION.md) |
| Önceki uygulama aşaması | [4 Ekim tarihli rapor](2026-10-04-implementation-report.md) |

**Güncel durum — 6 Ekim 2026 (Roma/UTC):** Admin `93c99ce9` / `56689fed` **05:45:33 UTC SUCCESS**, ziyaretçi `b698162c` / `cf252b24` önceki doğrulanmış sürümde. Dar Insights fotoğraf etiketi düzeltmesi yeni **345 test/TypeScript/tam build/CI** kapısını geçti; son gerçek owner etiket kontrolü giriş bekliyor. 5 Ekim ziyaretçi **32/1432 + ayrı 3/103** kabulü korunur; 6 Ekim yeni admin **Sideways19/19** ve ayrı Main/Full **4/186** geçti. Önceki `86006627` owner/19 kabulü tarihli kanıttır; yeni owner başarısı yerine kullanılmaz. Fiziksel cihaz/native zoom-klavye, gerçek panorama seçkisi ve Google yapılandırması ayrı sınırlardır. [Rapor](2026-10-05-visual-mobile.md) ve [ortak kanıt](https://github.com/ErenEdebali908755/eren-visual-archive/blob/main/docs/visual-mobile-proof-20261005.json) esas alınır.

**Tarihsel 5 Ekim 15:55 UTC aşaması:** ziyaretçi 36 test/37 JS kontrolü; galeri 633 kontrol ve observer/native permission eklenmiş ayrı 597 kontrollü yerel çalışma. Gerçek fotoğraflar kullanıcının izin verdiği portrelerdir; sentetik yatay/panorama fixture'ları gerçek fotoğraf veya durak doğrulaması olarak sunulmaz. Son admin Railway dağıtımı GitHub App kaynak erişimi reddedildiği için FAILED; bu nedenle ziyaretçi PR #6 ve gerçek canlı kabul bekliyor. Fiziksel telefon GPS/batarya kabulü ayrı bir eksiktir. Geçici QA ekranları repoya alınmaz; kalıcı yollar ziyaretçi raporundadır.
