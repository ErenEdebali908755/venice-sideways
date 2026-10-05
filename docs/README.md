# Ziyaretçi belge dizini — 5 Ekim 2026

İki sitenin güncel yerel/test/canlı ayrımı tek [CURRENT-STATE](https://github.com/ErenEdebali908755/eren-visual-archive/blob/main/docs/CURRENT-STATE.md) kaydında tutulur. Bu ziyaretçi dizini yeni bir current-state belgesi oluşturmaz. [Ziyaretçi README](../README.md) yeni release kimlikleri ve canlı kabul için bekleyen alanları gösterir; önceki yayın kimlikleri tarihsel kalır.

| Konu | Esas belge |
| --- | --- |
| Güncel görsel/mobil entegrasyon, varlıklar ve yayın engeli | [VISUAL-MOBILE-INTEGRATION-20261005](https://github.com/ErenEdebali908755/eren-visual-archive/blob/feat/sideways-visual-mobile/docs/VISUAL-MOBILE-INTEGRATION-20261005.md) |
| Yeni mobil davranış, fotoğraf retry, safe-area ve kanıtlar | [5 Ekim görsel/mobil ziyaretçi raporu](2026-10-05-visual-mobile.md) |
| Tarihsel 15:55 UTC birleşik kapsam, migration ve geri dönüş | [COMBINED-RELEASE-20261005](https://github.com/ErenEdebali908755/eren-visual-archive/blob/main/docs/COMBINED-RELEASE-20261005.md) |
| Galeri/GPS uygulaması, ağ sınırı, yerel kabul ve beş önizleme | [5 Ekim ziyaretçi raporu](2026-10-05-gallery-location.md) |
| Rota/admin/etkinlik işlemleri ve iki alan adı | [VENICE-SIDEWAYS-SYSTEM](https://github.com/ErenEdebali908755/eren-visual-archive/blob/main/docs/VENICE-SIDEWAYS-SYSTEM.md) |
| Admin ölçüm, izin, galeri ve operasyon belgeleri | [Admin belge dizini](https://github.com/ErenEdebali908755/eren-visual-archive/blob/main/docs/README.md) |
| Gerçek harita/çizim/bahçe kaynakları ve lisans | [Suluboya harita kaynakları](watercolor-map-sources.md) |
| Hosting ve geçiş | [MIGRATION](MIGRATION.md) |
| Önceki uygulama aşaması | [4 Ekim tarihli rapor](2026-10-04-implementation-report.md) |

**Güncel görsel/mobil çalışma:** ziyaretçi 43 test/38 syntax/privacy kontrolü, sekiz dil/56 bağlamda 1473 mobil/galeri, ayrı 21 lifecycle ve 683 etkinlik/boot kontrolü geçti. Ortak renderer artık 27 dosyadır; yeni [rapor](2026-10-05-visual-mobile.md) kaynak/test/canlı ayrımını ve önizlemeleri taşır. Yeni admin/visitor yayını yok. Güncel GitHub Installed App ekranında Railway/mevcut “All repositories” seçimi görülür; aynı servis/private admin depo/main kaynak bağlantısını yenileme otomatik onay incelemesinde reddedildiği için bu sınırlı yenilemeye kullanıcı açık onayı beklenir. Başarılı snapshot/deployment ve kimliği doğrulanmış admin canlı kabulü henüz yok. Google çeviri üretimi pasif, fiziksel cihaz testi yapılmadı.

**Tarihsel 5 Ekim 15:55 UTC aşaması:** ziyaretçi 36 test/37 JS kontrolü; galeri 633 kontrol ve observer/native permission eklenmiş ayrı 597 kontrollü yerel çalışma. Gerçek fotoğraflar kullanıcının izin verdiği portrelerdir; sentetik yatay/panorama fixture'ları gerçek fotoğraf veya durak doğrulaması olarak sunulmaz. Son admin Railway dağıtımı GitHub App kaynak erişimi reddedildiği için FAILED; bu nedenle ziyaretçi PR #6 ve gerçek canlı kabul bekliyor. Fiziksel telefon GPS/batarya kabulü ayrı bir eksiktir. Geçici QA ekranları repoya alınmaz; kalıcı yollar ziyaretçi raporundadır.
