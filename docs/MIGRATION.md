# Venice Sideways — geçiş ve yayın kontrolü

**5 Ekim 2026:** Alan adı ayrımı önceki aşamada yapıldı. Bu belge bekleyen suluboya/MapLibre ziyaretçi sürümünün yayın sırasını anlatır. İlk taşıma notlarındaki “7 dil / 15 durak” sayıları bugünkü veri değildir: Main Walk **11**, Full Walk **28** fotoğraf durağı ve **sekiz** dil vardır. İlk taşıma kaynağı, arşiv commit'i `afce9d31fa8f306e39aa03984fa8097a0f32970b` içinden doğrulanmış yürüyüş paketiydi; özel galeri geçmişi kamu deposuna alınmadı. [Tam sistem rehberi](../../eren-visual-archive/docs/VENICE-SIDEWAYS-SYSTEM.md).

## Kod ve içerik ayrı kapılar

- `venicesideways.com` bağımsız Node sunucusudur; genel HTML/JS dosyaları ile sabit rota, etkinlik ve anonim istatistik aracısını verir. Veritabanı veya admin oturumu içermez.
- `erenedebali.com` Payload admini özel taslakları, etkinlikleri, katılımcı kayıtlarını ve değiştirilemez rota yayınlarını PostgreSQL'de tutar. Ziyaretçi yalnız açık JSON projeksiyonunu alır.
- Katalogda `published:false` Main/Full ziyaretçiye **paketli** rehberi gösterir; admin taslağını veya incelenmemiş güzergâhı yayına çekmez. Yeni bir rota ancak yayın snapshot'ı varsa görünür. Katalog erişilemiyorsa açık **yerel rehber** seçeneği vardır.
- `sourceLanguage` için admin snapshot'ında desteklenen değerler `en`/`tr`dir; alanı olmayan eski snapshot İngilizce kabul edilir. Bekleyen ziyaretçi dalı alanı doğrulanmış açık projeksiyonda taşır, incelenmemiş metinleri ayıklar ve özel upstream alanlarını geçirmez. Eski yayın, Türkçe kaynak, dil yedeği ve sızıntı regresyonları yerelde sınandı; canlı yanıt ayrıca kontrol edilmelidir.

## Bu sürümün sırası

1. İki depoda gerçek ana dal, PR/CI ve çalışan Railway kimliklerini doğrula. Önce adminin canlı `/admin/venice-sideways` yönlendirme sorunu Administrator ve Sideways oturumlarıyla giderilip üretim derlemesinde ve canlıda doğrulanmalıdır.
2. PostgreSQL migration kaydını salt okunur denetle; uygulanmış `20261004_120000_sideways_translation` geçişini tekrar uygulama veya `down` çalıştırma. Yeni şema gerekiyorsa ayrıca incelenmiş migration ve güncel yedek/geri yükleme kanıtı gerekir. Mantıksal DB yedeği **R2 medyayı içermez**.
3. Ziyaretçi `public/field-guide/guide.js`, `guide.css`, `map-art.js`, `gardens.json` dosyalarını `node tools/sync-field-guide.mjs <admin-deposu> --check` ile admin özel önizleme kopyasıyla karşılaştır. Konum reddi harita hatası sayılmamalıdır.
4. Bekleyen PR'ın güncel commit'inde Node testleri, sekiz dil, Main/Full 11/28, beş fikir, tek aktif durak, vaporetto noktaları, açık harita/koyu arayüz, suluboya katmanları, lisans ve mobil doğrulamasını tamamla. Ardından aynı PR'ı birleştir ve Railway dağıtımını izle.
5. Canlıda `/healthz`, son HTML/JS/JSON sürümü, gerçek `Cache-Control`/ETag, soğuk Main/Full açılışı, gerçek karolar, üç çizim ve iki bahçe, konum reddi, harita yeniden dene ayrımı ve etkinlik taslağına 404 durumunu ayrı ayrı gör. SUCCESS tek başına bu kabul değildir.

11 Ekim 2026 Main Walk etkinliği **taslak**, saati boş, kapasitesi sınırsızdır; bu yazılım yayını için açılmaz. Gerçek QR baskısı veya kayıt açılışı içerik sahibinin ayrıca gözden geçireceği adımdır. Konum yalnız cihazda kalır; adminle canlı konum paylaşımı yoktur. Dil/tema tercihleri ve GPS izni alan adına özgüdür; taşınmaz.

Eski yedi dilli admin ikilisine geri dönme: `it` ve `sourceLanguage` verisini okuyabilen uyumlu kod gerekir. Şemayı küçültme veya üretim verisini silme geri dönüş yöntemi değildir. Son canlı durum [ortak güncel durum](../../eren-visual-archive/docs/CURRENT-STATE.md) sayfasında tutulur.
