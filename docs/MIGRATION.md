# Venice Sideways — geçiş ve yayın durumu

## 5 Ekim görsel/mobil sürümün güncel kapısı

**Yeni sürüm canlıya alınmadı.** Son kaynakta 43 test, 38 JS/gizlilik kontrolü ve admin önizlemesiyle 27 ortak dosya eşitliği geçti. [Yeni rapor](2026-10-05-visual-mobile.md) kaynak, taze test, eski aktif dağıtım ve bekleyen canlı kabulü ayırır. Admin için önce doğru SHA ile Railway SUCCESS ve gerçek owner/Sideways/medya/önizleme kabulü gerekir; ziyaretçi PR #6 sonra birleştirilir. Ardından Main/Full × sekiz dil × mobil/masaüstü 32 soğuk açılış kontrol edilir.

GitHub Railway App mevcut izinleriyle erişilebilir; aynı mevcut admin hizmeti, özel depo ve `main` bağlantısını yenileme işlemi otomatik onay incelemesinde durduruldu ve son işlem onayı bekliyor. Yeni migration yok: iki 5 Ekim geçişi üretimde birer kez/batch 21, toplam 29 kayıt. Güncel 16:45 UTC veritabanı yedeği 16:46 UTC'de ayrı hedefe geri yüklendi; R2 nesneleri dahil değil. Geri dönüş sekiz dil/sourceLanguage/galeri/izin epoch/hak iptali verilerini koruyan uyumlu kodla yapılır. Aşağıdaki önceki harita yayını tarihsel kanıttır.

**5 Ekim 2026:** Alan adları daha önce ayrıldı. Suluboya/MapLibre ziyaretçi sürümü [PR #5](https://github.com/ErenEdebali908755/venice-sideways/pull/5) ile `6d3d365078f1a8b1475e0f570fe6895c644309b7` olarak birleşti; CI `37241092165` geçti, Railway `a58d3f86-3994-46a1-ac1d-84545a7111ae` SUCCESS. Canlı 7/7 kabulde dört soğuk Main/Full görünümü, gerçek karolar, sanat katmanları, diller, tema, konum reddi, dosya sürümü ve önbellek başlıkları doğrulandı. Admin [PR #6](https://github.com/ErenEdebali908755/eren-visual-archive/pull/6) `b952dd21` de gerçek owner/Sideways Chrome oturumlarında kabul edildi. [Tam sistem rehberi](https://github.com/ErenEdebali908755/eren-visual-archive/blob/main/docs/VENICE-SIDEWAYS-SYSTEM.md) · [sonuç raporu](https://github.com/ErenEdebali908755/eren-visual-archive/blob/main/docs/SIDEWAYS-RELEASE-20261005.md).

İlk taşıma notlarındaki “7 dil / 15 durak” sayıları bugünkü veri değildir: Main Walk **11 fotoğraf durağı + 1 vaporetto adımı = 12 gezinti adımı**, Full Walk **28 fotoğraf durağı**, sekiz dil vardır. İlk paketli yürüyüş kaynağı, arşiv `afce9d31fa8f306e39aa03984fa8097a0f32970b` commit'inden doğrulandı; özel galeri geçmişi kamu deposuna alınmadı.

## Kod ve içerik ayrı kapılar

- `venicesideways.com` bağımsız Node sunucusudur; genel HTML/JS ile sabit açık rota, etkinlik ve isteğe bağlı anonim istatistik aracısını verir. Veritabanı veya admin oturumu içermez.
- `erenedebali.com` Payload özel taslakları, etkinlikleri, katılımcı kayıtlarını ve değiştirilemez rota yayınlarını PostgreSQL'de tutar. Ziyaretçi yalnız açık alan listesiyle daraltılmış JSON projeksiyonunu alır.
- Katalogda `published:false` Main/Full ziyaretçiye **paketli rehberi** gösterir. Bu içerik akışı 5 Ekim canlıda doğrulandı; admin taslağı veya incelenmemiş geometri otomatik yayımlanmadı. Yeni rota ancak yayın snapshot'ı varsa ziyaretçiye açılır. Katalog erişilemezse açık **yerel rehber** seçeneği vardır.
- Açık snapshot'taki `sourceLanguage` yalnız `en`/`tr` değerini geçirir; alanı olmayan eski snapshot `en` kabul edilir. İncelenmemiş metinler ayıklanır; özel upstream alanları genel nesne kopyasıyla taşınmaz. Eski yayın/Türkçe kaynak/dil yedeği/sızıntı regresyonları yerelde, sekiz gerçek canlı dil yanıtı yayında kontrol edildi.
- Ziyaretçinin **Konumum** izni yalnız cihazdaki işaret içindir. Canlı ret testinde harita hazır kaldı; konum pini ve gereksiz **Haritayı yeniden dene** eylemi oluşmadı. Eski admin canlı koordinat paylaşımı yoktur.

## Yayın ve geri dönüş kanıtı

1. Adminin son kodu `b952dd21`, Railway `539fcb1e-20f9-461c-a926-2def9bf4185f`; gerçek Chrome owner doğrudan/yenileme/menüyle editöre, Main/Full haritaya ve özel önizlemeye girdi. Ayrı Sideways hesabı 13/13 sınır testini geçti; test hesabı kaldırıldı. Owner 375 px CUA viewport isteği uygulanmadığı için owner mobil ölçümü ayrı kanıt sayılmaz; Sideways hesabının 375 px canlı haritası ve yerel üretim testi vardır.
2. Ziyaretçi ortak `guide.js`, `guide.css`, `map-art.js`, `gardens.json` dosyaları admin özel önizlemesine `node tools/sync-field-guide.mjs <admin-deposu> --check` ile eşittir. Son canlı HTML/JS/JSON dosyalarının sürümü, gerçek `Cache-Control` ve ETag başlıkları kontrol edildi.
3. `20261004_120000_sideways_translation` üretim ledger'ında **bir kez, batch 20**; sekiz dil enumu ve iki `source_language NOT NULL DEFAULT en` sütunu salt okunur yeniden kontrol edildi. Railway kayıtlı predeploy `node scripts/production.mjs migrate` çağrısı çalıştı; bekleyen geçiş olmadığı için `up` yeniden uygulanmadı. `down` veya şema `push`u yok.
4. 5 Ekim 00:19:49 Roma güncel PostgreSQL mantıksal yedeği ayrı boş hedefte geri yüklendi; **R2 medya nesneleri bu yedeğe dahil değildir**. Geri dönüş eski yedi dilli ikiliyle değil, `it` ve `sourceLanguage` okuyabilen uyumlu kodla yapılır.
5. 11 Ekim Main Walk etkinliği `draft`, saat/kapanış/kapasite `NULL`, kayıt 0, saklama 180 gün durumunda bırakıldı. Gerçek QR yolu `/events/main-walk-2026-10-11` HTML 200, taslak API 404, genel etkinlik listesi 200/boş ve 375 px form kapalı doğrulandı; test için kayıt yazılmadı. Google otomatik çeviri için dört sunucu ayarı eksik olduğundan öneri üretimi pasiftir.

Railway SUCCESS tek başına bu kontrollerin kanıtı değildir; sonuçlar [ortak güncel durum](https://github.com/ErenEdebali908755/eren-visual-archive/blob/main/docs/CURRENT-STATE.md) ve [ayrıntılı raporda](https://github.com/ErenEdebali908755/eren-visual-archive/blob/main/docs/SIDEWAYS-RELEASE-20261005.md) ayrılmıştır.
