# Venice Sideways — 4 Ekim 2026 uygulama raporu

> **Tarihsel yerel uygulama kanıtı.** Aşağıdaki “gönderilmedi/dağıtılmadı”, test sayısı ve eski yedi dilli ikiliye koşullu geri dönüş anlatımı yalnız 4 Ekim aşamasını açıklar; bugünkü üretim adımı olarak kullanılmaz. Güncel yayın, veri uyumluluğu ve geri dönüş için [ortak durum](../../eren-visual-archive/docs/CURRENT-STATE.md), [sistem rehberi](../../eren-visual-archive/docs/VENICE-SIDEWAYS-SYSTEM.md) ve [ziyaretçi geçiş kontrolü](MIGRATION.md) geçerlidir. Bu tarihli metnin kalan kısmı değiştirilmeden korunmuştur.

Bu çalışma yerel kod değişiklikleri ve testlerden oluşur. GitHub’a gönderim, birleştirme, üretim veritabanı geçişi veya canlı yayın yapılmadı. Ziyaretçi dalı `feat/watercolor-visitor-map` (`4aa1bc3` tabanı), admin dalı `feat/sideways-map-editor-translation` (`ed26895` tabanı). Bordo palet, Yana ailesi, rota kimlikleri/sırası ve etkinlik sistemi korundu.

## Güncel görünüm envanteri

| Görünüm | Gerçek kod yolu | Bu çalışmadaki durum |
| --- | --- | --- |
| Ziyaretçi ana rehberi | `index.html` → `field-guide/entry.js` → `guide.js`; MapLibre/OpenFreeMap | Suluboya stil, yer kartları, yükleme sınırı ve çeviri yedeği |
| Yayınlanmış rota | `published.html` → aynı `entry.js/guide.js`; `/api/routes/:key` | Aynı ziyaretçi düzeltmelerini kullanır |
| Eski classic | `classic.html` ve sürümlü `walk-*` betikleri; MapLibre/Leaflet yedeği | Ayrı uygulama; yeni sanat katmanı burada eklenmedi |
| Eski published renderer | `public/sideways/published.js` | HTML/betiklerde çağrılmayan eski dosya; güncel published sayfasının renderer’ı değildir |
| Admin geometri haritası | `SidewaysMap.tsx`, `SidewaysGeometryEditor.tsx` | Açık Positron, düzenleme doğruluğu öncelikli |
| Özel ziyaretçi önizlemesi | `SidewaysPreview.tsx` → `sideways-preview.html`; eşitlenen rehber | Büyük/küçük önizleme, mobil/masaüstü genişlik ve tam kaydırma |
| Sağ konum krokisi | `SidewaysImpactMap.tsx`; SVG | Bağımsız şema; gerçek harita çizgisinin yüklendiğine kanıt sayılmadı |

Eski ekran görüntülerindeki bütün işaretçileri dağıtma davranışı güncel ana rehberde zaten kaldırılmıştı. Yeniden yazılmadı; aktif durak/ilgili vaporetto noktaları kuralı korundu. Dil önceliği de `entry.js` içinde zaten açıktı: bağlantıdaki `lang`, kaydedilmiş seçim, desteklenen sistem dili, İngilizce. Google Maps hedefleri koordinat kullanıyordu; site tarafından karışık adres metni eklenmedi.

Adminin eski kodu her MapLibre `error` olayını genel hata sayıyordu. Bu kod kusuru doğrulandı. Geçmişte canlı ilk açılışta hangi ağ isteğinin başarısız olduğu doğrulanamadı: canlı admin tarayıcı erişimi otomatik izin incelemesinde iki kez zaman aşımına uğradı. Bu yüzden sağlayıcı veya rota verisi geçmiş hatanın kesin nedeni ilan edilmedi. Yerel gerçek panel ayrı EmbeddedPostgres örnek verileriyle açıldı. Tarayıcının DarkReader eklentisinin HTML’ye müdahalesi hydration uyarısıyla doğrulandı. Ayrıca iptal edilen ilk MapLibre stilinde `projection` hatası görüldü; eklentisiz yerel testte de bir hata rozeti vardı. Kurulu MapLibre 5.21 kaynağı, URL stil isteğinin kaldırılmış haritaya geç dönmesiyle uyumlu bir yaşam döngüsü yarışı gösteriyor. Bu çıkarım geçmiş üretim hatasının kesin teşhisi değildir.

## Yapılan değişiklikler

### Ziyaretçi haritası

- Gerçek OpenFreeMap vektör stili sıcak krem kara/sokaklar, yumuşak mavi su, sıcak taş binalar ve botanik yeşille özelleştirildi. Bordo yürüyüş ve kesikli mavi vaporetto çizgileri korunuyor. Site koyu temaya geçince harita aynı açık stilde kalıyor.
- Santa Lucia’nın yatay cephesi, Accademia’nın ahşap köprüsü ve Punta della Dogana’nın kule/küre detayı için özgün küçük kod çizimleri eklendi. Bunlar Main Walk’un mevcut durak koordinatlarına bağlı ayrı yapı çizimleri; ek numaralı durak değiller. Ölçülmüş bina merkezleri olduğu iddia edilmiyor.
- Giardini Papadopoli ve Parco Savorgnan’ın gerçek OSM poligonları kullanıldı. Botanik doku bu sınırlarla kırpılıyor. Uzak ölçekte sanat seyrek, yakın ölçekte ayrıntılı; 3D’de yapı çizimleri gizleniyor. Sanat katmanı yüklenmese bile rota kullanılabilir kalıyor.
- Yer seçildiğinde açıklama ve fotoğraf boş durumu açılıyor. Yeni AI fotoğrafı veya üçüncü taraf fotoğrafı eklenmedi. “Haritadaki yerler” listesi harita simgelerinin klavye/ekran okuyucu karşılığıdır.
- Stil alma işlemi ve ilk yükleme için süre sınırı eklendi. Sanat stili alınamazsa eski Positron teknik yedeği kullanılıyor; bu yedek aynı sağlayıcıya bağlıdır.
- Görünür fotoğrafik rehber alt başlığı kaldırıldı; arama motoru açıklaması korundu. İncelenmemiş içerik ziyaretçi dil yedeğinde kullanılmıyor.

Ana harita renkleri: krem `#F8F1E6`, su `#B7D7E2`, dar su yolu `#8AB8CB`, taş `#EAD8C4`, bordo yürüyüş `#831D4F`, mavi vaporetto `#275C94`. Düz renklerin hesaplanan kontrastı: bordo/krem **8,30:1**, bordo/su **6,14:1**, vaporetto/su **4,54:1**. Kanal adı/krem halo **4,88:1**, sokak adı/açık halo **6,13:1**. Bunlar seçili renk çiftlerinin hesabıdır; doku, kenar yumuşatma ve bütün arayüz için kapsamlı erişilebilirlik sertifikası değildir.

### Admin haritası ve editör

- Stil/başlatma hataları ile tekil karo, glyph, sprite ve katman hataları ayrıldı. Kısmi sorunlar tüm haritayı bozuk göstermez; tanı kayıtları anahtar veya hassas URL içermiyor.
- Son tanı incelemesinde `.pbf` uzantısının hem vektör karo hem font dosyalarında kullanıldığı görüldü. Bütün `.pbf` hatalarını font hatası sayan eşleşme kaldırıldı; gerçek karo ve font adresleriyle regresyon eklendi.
- Harita bileşeni, sayfanın tamamı yenilenmeden yeniden denenebiliyor. Stil yüklenince kaynak ve rota katmanları yeniden kuruluyor. Opsiyonel 3D hatası temel rota katmanlarını engellemiyor.
- Positron stil JSON’u harita oluşturulmadan önce iptal edilebilir bir istekle alınıyor. Göreli font/sprite/karo adresleri stilin gerçek adresine bağlanıyor; mutlak adresler ve `{fontstack}`/`{range}` gibi yer tutucular korunuyor. İlk kabul denemesi URL dönüşümünün bu yer tutucuları kodlaması yüzünden tamamlanmadı; bu deneme başarı sayılmadı ve dönüşüm düzeltildi. Kaldırılmış haritaya dönen yükleme ve boyutlandırma callback’leri engelleniyor. Yeniden denemede elle kaydırma bayrağı sıfırlanıyor. Bu düzeltme MapLibre’ın desteklediği [stil nesnesi seçeneğini](https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapOptions/) kullanır; özel kütüphane alanlarını değiştirmez.
- Başlangıçta Main ve Full haritaya birlikte gönderiliyor; seçili rota bordoyla belirgin. İncelenmemiş geometri kesikli, eksik geometri açık etiketli. Kroki görünmesi, ana haritanın çalıştığı varsayımı yerine geçmiyor.
- Rota/durak/bölüm koordinatları kadraja dahil ediliyor. Panel değişiminde yeniden ölçüm var; elle kaydırılmış harita kendiliğinden tekrar tekrar sıfırlanmıyor. “Rotayı göster” açıkça yeniden sığdırıyor.
- Mobil Main Walk görsel incelemesinde, doğru 375×310 canvas ve doğru Venedik koordinatlarına rağmen komşu karo isteklerinin iptal edildiği, yalnız merkez karonun çizildiği bulundu. Otomatik ilk/rota/boyut kadrajları animasyonsuz yapıldığında komşu karolar 200 yanıtla geldi ve tüm alan doldu. Kullanıcının “Rotayı göster” eylemi kısa animasyonu koruyor. Mobilde alt araçlar için 105 px kadraj payı, üst/yanlarda 34 px pay ayrıldı; Full’un son durağı araç panelinin üstünde kalıyor. Bu yerel hata ve çözüm, geçmiş canlı uyarısının kesin nedeni değildir.
- Harita odaklı mod, katlanan durak listesi ve ayrıntı paneli, kompakt geometri araçları eklendi. Ekleme/taşıma/çizim/ACTV/geri alma/kaydetme ve yayın incelemesi korunuyor.
- Mobilde ikincil işlemler kapalı “Diğer araçlar” alanına taşındı. İlk denemede üst kontroller haritayı yaklaşık 100 px’e sıkıştırıyordu; bu sürüm teslim kanıtı sayılmadı. Son test görünür haritanın en az 300 px olmasını kontrol ediyor.
- Önizleme tam ekrana açılıyor; mobil ve masaüstü genişliği seçilebiliyor. Güncel taslak, kaydedilmiş taslak ve yayın ayrımı ayrı kontrollerde. Önizleme konum izni veya ziyaretçi istatistiği üretmiyor.
- Açıklama ipuçları fare beklemesi, odak, Esc, kısa geçiş payı ve dokunmayı destekliyor. “Yayın incelemesini aç” eylemi yayını doğrudan yapıyormuş gibi etiketlenmiyor.

### Sekiz dil ve incelemeli çeviri

- Rota modeline İtalyanca ve İngilizce/Türkçe kaynak dili eklendi. Mevcut kayıtlar İngilizce kaynakla geçerli; veri geçişi mevcut metinleri yeniden yazmıyor.
- Sunucu Google Cloud Translation Advanced kullanacak şekilde hazırlandı; Venedik/ACTV/marka terimleri için eşdeğer terim sözlüğü sağlandı. Gerçek Cloud glossary kaynağı olmadan normal çeviri yanıtı kabul edilmiyor.
- Yalnız seçili ve kaydedilmiş rota/bölüm/durak/fotoğraf fikrinin dört metin alanı gönderiliyor. Katılımcı kaydı, kullanıcı, cihaz koordinatı ve tam rota verisi okunmuyor. Belirgin e-posta/telefon/koordinat içeren kaynak metin dış isteği engelliyor; bu kontrol bütün kişisel adları tanıyamaz.
- İnsan metni korunuyor; eski/yeni öneriler karşılaştırılıyor ve açık onay gerekiyor. Kaynak revizyonu/izi veya insan hedef metni değişmişse eski öneri 409 ile reddediliyor. Kısmi hatada yalnız başarısız dil yeniden denenebiliyor.
- Kayıtlı seçili kaynak değişince yapılandırılmış hizmet bir kez öneri üretir. En fazla üç hedef paralel, OAuth paylaşımı ve süre sınırları var. Karakter tahmini ücret faturası değildir.
- Mevcut insan kaynak/hedef metni, sağlayıcı olmadan da açık inceleme onayıyla yalnız taslağa kaydedilebilir. Kaynak seçimi tek başına eski hedefi onaylamaz. Yayın snapshot’ı incelenmemiş satırları dışlar ve incelenmiş İngilizce yedek ister; makine önerisi kendiliğinden yayımlanmaz.

Çeviri hizmeti bu ortamda etkin değil. Eksik sunucu ayarları: `GOOGLE_CLOUD_TRANSLATION_PROJECT_ID`, `GOOGLE_CLOUD_TRANSLATION_CLIENT_EMAIL`, `GOOGLE_CLOUD_TRANSLATION_PRIVATE_KEY`, `GOOGLE_CLOUD_TRANSLATION_GLOSSARY`. Özel Cloud Storage sözlüğü, service account yetkileri ve gerçek sağlayıcı çağrısı ayrıca hazırlanıp doğrulanmalıdır. Panel bu durumu açıkça gösteriyor.

İşletme ve inceleme ayrıntıları: [admin harita QA notu](../../eren-visual-archive/docs/sideways-admin-map-qa.md), [çeviri yapılandırması ve geri dönüş sınırları](../../eren-visual-archive/docs/sideways-translation-drafts.md).

## Testler ve ekran kanıtı

| Kontrol | Sonuç |
| --- | --- |
| Ziyaretçi Node testleri | 23/23 geçti; proxy, kayıt relay’i, marka, gizlilik, rota ve yeni geometri/yedek testleri |
| Admin Sideways testleri | 69/69 geçti; yetkiler, etkinlikler, konum incelemesi, geometri, yayın ve çeviri. Son gerçek `.pbf` adresi düzeltmesinden sonra iki harita testi ayrıca 2/2 geçti |
| Ziyaretçi sözdizimi/gizlilik kontrolü | 33 tarayıcı JS dosyası geçti; konum modülünde upload/storage/link API yok |
| Eski şemadan çeviri geçişi | Gerçek geçici PostgreSQL’de iki uygulama geçti; eski rota/kopya/sürüm/yayın verisi korundu, İtalyanca yazıldı |
| İzole admin erişim/yayın testi | `verify-sideways-access.ts` geçti; üretim bağlantısı kullanılmadı |
| Admin harita hata senaryoları | Yerelde stil 503 → yalnız haritayı yeniden deneme, kaydedilmemiş metni koruma, 2,5 sn yavaş stil ve tek karo hatasında kısmi uyarı geçti |
| Admin mobil/masaüstü kabul | 375 ve 1440 px geçti; Main/Full, paneller, araç menüsü, odak/Esc, 390 px/masaüstü/tam ekran özel önizleme ve iç kaydırma; son soğuk açılışlarda konsol hata/harita uyarısı yok |
| TypeScript | `--noEmit --incremental false` geçti |
| Ortak renderer | `sync-field-guide.mjs --check` geçti; `map-art.js` ve `gardens.json` da eşit |
| Değişiklik biçimi | Her iki depoda `git diff --check` geçti |

Teslim edilen yerel QA başlatıcısı yeni geçici veritabanıyla açıldı; son harita hata senaryoları bu yeni örnekte tekrar geçti. Ardından iki yerel port kapatıldı, sentetik hesap dosyası kaldırıldı ve geliştirme sunucusunun ürettiği geçici `next-env.d.ts` farkı eski haline getirildi. Son TypeScript ve renderer eşitlik kontrolleri temiz.

Ziyaretçi gerçek karo kontrolleri: 320/375/768/1440 px taşma yok; sekiz dil ve başlangıç dil önceliği geçti. Main ve 28 duraklı Full, z7/16.5/19’da tek aktif durak gösterdi; vaporetto adımında üç gerekli iskele işareti görüldü. Manuel ve sistem koyu teması harita renklerini değiştirmedi. 3D, konum reddi, yer kartı, odağa dönme ve OSM bağlantıları çalıştı. Üç yapı ve iki bahçe ekranda `queryRenderedFeatures` ile doğrulandı; yalnız kaynak beyanı sayılmadı. %200 CSS yakınlaştırma simülasyonu geçti; bu, tarayıcının yerel %200 zoom testi değildir. [Gerçek karo önce/sonra ekranları ve ayrıntılar](qa-watercolor/README.md).

Yerel gerçek admin panelinde Main Walk’un 11 durağı, ACTV bağlantıları, eksik/inceleme gereken yol etiketleri, harita odaklı görünüm ve özel önizleme açıldı. Konfigürasyonu eksik çeviri düğmesi pasif ve nedenleri görünürdü. Manuel tarayıcı boyut API’si 1280 px döndürdüğü için o adım mobil kanıt sayılmadı; ayrı headless Chrome testi gerçek 375 ve 1440 px viewport kullandı. Son mobil Main canvas’ı 375×310, komşu vektör karoları 200 yanıtlı ve harita alanı dolu. Full’un 28. durağı araç panelinin üstünde. İlk yarım karo görüntüleri nihai kanıtla değiştirildi. [Admin ekranları, tekrar çalıştırma ve sınırlar](../../eren-visual-archive/docs/sideways-admin-map-qa.md).

Tam üretim derlemesi, gerçek mobil Safari veya üretimde çeviri sağlayıcısı testi yapılmadı. Yerel derleme/kabul ile gerçek Cloud entegrasyonu birbirinden ayrıdır.

Mevcut yerel admin seed’inde bazı yürüyüş geometrileri boş veya inceleme gerektiriyor. Bunlar kesin yol çizgileriyle sessizce doldurulmadı; uyarılar ve mevcut yol hesaplama/inceleme araçları korunuyor. Seçili rota katmanında yalnız gerçekten kayıtlı çizgiler ve doğrulanmış ACTV referansları çizilir. Yerel örnek verinin durumu üretim taslağının durumuyla aynı kabul edilmez.

## Değişen dosya grupları

- Ziyaretçi: `guide.js`, `guide.css`, yeni `map-art.js` ve `gardens.json`, eşitleme aracı, rehber/tarayıcı testleri ve QA/kaynak belgeleri.
- Admin: `SidewaysMap`, `SidewaysGeometryEditor`, `SidewaysDraftEditor`, `SidewaysPreview`, `SidewaysView`, yeni `SidewaysHint` ve `SidewaysTranslationDrafts`, harita/çeviri yardımcıları ve CSS.
- Admin veri/API: `Sideways.ts`, `model.ts`, `service.ts`, `endpoints.ts`, `translation-provider.ts`, `translation-drafts.ts`, üretilmiş Payload tipleri, yeni migration ve migration dizini, sözlük CSV’si.
- Doğrulama: model/harita/çeviri testleri, eski şema yükseltme betiği, geçici PostgreSQL ve sentetik hesap açan `serve-sideways-local-qa.ts`, yalnız bu yerel hesabı kullanan responsive kabul betiği ve ekranlar.

Arşivin genel sayfa yerleşimi, etkinlik kayıt/QR uygulaması, konum paylaşımı kaldırma işi ve logo/favicon ailesi bu çalışmada yeniden yazılmadı. Mevcut `.DS_Store` dosyaları ürün değişikliği değildir.

## Kaynak, lisans ve sınırlar

OSM verisi [ODbL](https://www.openstreetmap.org/copyright) altında, iki küçük poligonun tarih ve kaynak bilgisi `gardens.json` içinde. Belediye kamu yeşil alan envanteri iki yerin adını destekliyor; [Geoportale servisinde](https://geoportale.comune.venezia.it/Geocortex/Essentials/REST/sites/GeoPortale/map/mapservices/3) yeniden kullanım hakkı belirtilmemiş (`Copyright: N/A`). Katman veri isteği koruma betiği içeren HTML döndürdü; poligon yanıtı alınamadı. Belediye geometrisi kopyalanmadı; güncel sınırların belediye poligonlarıyla birebir karşılaştırılması tamamlanmış sayılmıyor. Güncel erişim/saatler garanti edilmiyor. Ayrıntı: [harita kaynak notu](watercolor-map-sources.md).

[OpenFreeMap](https://openfreemap.org/) sağlayıcısı, glyph/sprite alanları, CSP ve görünür OSM/OpenMapTiles/OpenFreeMap atıfları korundu. Yeni harita API anahtarı veya ücretli sağlayıcı eklenmedi; kamusal servisin kesintisiz erişimi garanti değildir. MapTiler/Mapbox yalnız görsel/teknik araştırma kaynağıydı; varlıkları kopyalanmadı. [Google glossary](https://docs.cloud.google.com/translate/docs/advanced/glossary), [çeviri fiyatları](https://cloud.google.com/products/translate/pricing) ve [Maps URL biçimi](https://developers.google.com/maps/documentation/urls/get-started) teknik karar kaynaklarıdır. Google Maps’in kendi yer adı dili site tarafından kesin kontrol edilmez.

Ziyaretçi statik sunucusu dosyaları `no-cache` ve içerik tabanlı ETag ile yeniden doğruluyor; yayınlanmış rota JSON’u en fazla 60 saniye önbellekleniyor. Adminin özel önizleme ve API yanıtları `private, no-store` kalıyor. Yeni bir CDN/sprite/font alanı açılmadı. Yayın gününde gerçek yanıt başlıkları ayrıca kontrol edilmeli.

## Sonraki yayın ve geri dönüş planı

1. İki yerel dalı incele; eşitlenen rehber/sanat dosyaları ve otomatik testleri birlikte kontrol et. Ayrı PR’lar ve staging dağıtımı ancak yayın işi başlatılınca hazırlanır.
2. Üretim veritabanı için o günün yeni geri dönüş noktası/yedeğini oluştur ve geri yükleme yolunu doğrula. Eski snapshot’ın varlığını güncel yedek sayma; kota için silme gerekiyorsa ayrıca mevcut yetkiyi doğrula.
3. `20261004_120000_sideways_translation` geçişini staging’de eski yedi dil verisiyle uygula. Üretimde otomatik schema push kullanma; kayıtlı migration’ı kontrollü uygulayıp ledger ve iki yeni source sütununu doğrula.
4. Önce uyumlu admin arka ucunu, sonra eşitlenmiş ziyaretçi dosyalarını yayımla. Çeviri yapılandırması yoksa özellik dürüstçe pasif kalır. Hizmet açılacaksa Cloud glossary ve dar service account yetkileri ayrıca doğrulanır; sadece kamu rota metniyle deneme yapılır.
5. Yayın kapısı: art arda soğuk Main/Full açılışı, inceleme/onay, bütün diller, mobil/masaüstü önizleme, etkinlik QR/kayıt, Sideways yetki sınırı ve yerel konum reddi. Başarısız kapıda ilerleme.
6. Ziyaretçi kodu önceki `4aa1bc3` sürümüne dönebilir. Adminin yeni İtalyanca satırları oluşmuşsa eski yedi dil parser’ına doğrudan dönme: sekiz dili/source alanını okuyabilen uyumlu geri dönüş build’iyle yeni UI/çeviriyi kapat. Şema küçültme ve veri silme yapma. Yeni yazılar yoksa eski admin build’i/yedek dönüşü staging kanıtına göre kullanılabilir.

Bu plan uygulanmadı; canlı site bu çalışmanın yeni kodunu kullanmıyor.
