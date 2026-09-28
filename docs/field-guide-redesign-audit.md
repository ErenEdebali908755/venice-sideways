# Venice Sideways — ürün tasarımı ve doğrulama kaydı
28 Eylül 2026

**Durum: inceleme tamamlandı; uygulama başladı, bitmedi. Yeni tasarım yayımlanmadı.**
Bu belge tamamlanmış bir uygulama veya başarılı uçtan uca test raporu değildir.
Kod çalışma ortamı uygulama sırasında bağlantısını kaybetti. Yeni dosyaların derleme,
görsel kontrol ve dağıtımı tamamlanamadı. GitHub üzerinden bu inceleme kaydı ayrı bir
dalda saklandı; main veya üretim verisi değiştirilmedi.

## İncelenen sürümler
- Ziyaretçi: ErenEdebali908755/venice-sideways, e0dccaa96018ac512183dfddebb6f4a84b54984e.
- Admin: ErenEdebali908755/eren-visual-archive, ec1912ab61147ab04e2624785d21c3b4af9c7073.
- Admin gerçek rota kayıtları: Main Walk 11 ziyaret/durak, taslak revizyon 3;
  Full Walk 28 ziyaret/durak, taslak revizyon 2.
- İkisinde de published_release_id boş. İncelenen CMS taslaklarında onaylanmış
  yol bölümü yok. Mevcut ziyaretçi sitesi eski yayımlanmış rehber içeriğini kullanıyor.
  Yeni arayüz dağıtımı bu taslakların otomatik yayımlanmasına yol açmamalı.
- Diğer dört eski rota arşivlenmiş. Ana ziyaretçi seçimi yalnızca Main ve Full olmalı.

## Kısa teşhis
| Ekran / görev | Gözlenen sorun veya sonuç | Kanıt sınırı |
| --- | --- | --- |
| Ziyaretçi giriş, masaüstü | Yoğun başlık, dil/tema/araçlar, harita ve liste aynı anda dikkat istiyor; keşfetme ile yürüme ayrılmamış. | Mevcut checkout tarayıcı ekranı incelendi. |
| Main → Full → Main | Rota değiştirme mevcut tarayıcı testinde çalıştı. Main başlangıcı Santa Lucia, sonu Vino Vero; Full sonu Sant’Elena. | Harita CDN'leri kapalı test: çizgi/pin davranışı için geçerli görsel kanıt değil. |
| Durak / mobil ilerleme | Test edilen görünümde durak fotoğrafı ve açık “Sonraki durak” eylemi bulunmadı. | Mevcut DOM ve ekran incelemesi. |
| Harita yüklenemedi | Alternatif görünüm test edildi; yeni tasarımda numaralı durak listesi birinci sınıf erişim yolu olmalı. | Canlı harita tam yüklenmiş ekran kontrolü doğrulama gerekiyor. |
| Admin rota/durak düzenleme | Liste ile düzenleme aynı yan alanı paylaşıyor; harita ve araçlarla ilişki zor okunuyor. | Kod ve mevcut bileşen testi. |
| Admin oluştur → ekle → kaydet → kontrol → yayımla | Mevcut React bileşeninin taklit API ile testi geçti. | Gerçek oturum, yetki ve canlı kaydet/yayımla doğrulama gerekiyor. Üretime test rotası yayımlanmadı. |
| Kontrol et ve yayımla | Hata listesi var; hangi gerçek sürümün yayına çıkacağını, taslak/yayın ayrımını ve tam ziyaretçi görünümünü aynı karar ekranında göstermiyor. | Kod incelemesi. |
| Fotoğraf içeriği | Mevcut galeride incelenen 64 adayda doğrulanmış rota/durak Venedik fotoğrafı bulunamadı; tanınan içerik ağırlıkla New York/Boston. | Galeride kalan tüm fotoğrafların Venedik dışı olduğu iddia edilmiyor. |

## Tek tasarım yönü
Çağdaş fotoğrafik saha rehberi: açık taş/kâğıt zemin, koyu mürekkep metin,
tek lagün vurgusu, Georgia benzeri ölçülü serif başlık ve okunaklı sistem sans.
Dekoratif pusula, eskitme, cam katmanları veya kartpostal estetiği yok.

Keşfet, yürüyüşü seçmeye yardım eder. Yürü, o anda yapılacak işi gösterir.
Fotoğraf kapağı atmosferi, durak fotoğrafı yerin tanınmasını destekler.
Doğrulanmış fotoğraflar gelene kadar başka şehir veya üretilmiş görseller
kullanılmayacak; fotoğrafik tasarım tamamlanmış sayılmayacak.

### Ekran sözleşmesi
| Ekran | Masaüstü | Mobil | Baskın eylem |
| --- | --- | --- | --- |
| Giriş / rota seçimi | Editoryal giriş + iki rota; yanında anlamlı harita önizlemesi | Kısa giriş, ilk rota eylemi erken, ardından ikinci rota | Rotayı keşfet |
| Seçili rota | Tek rota haritası + seçili durak anlatısı | Görünür harita + kompakt, kaydırılabilir alt kart | Başlangıca git / Sonraki durak |
| Durak ayrıntısı | Fotoğraf, kısa neden, isteğe bağlı uzun anlatı ve mevcut 5 fikir | Ayrı okuma görünümü; açık Haritaya dön eylemi | Haritaya dön |
| Vaporetto / aktarma | Su çizgisi, ayrı hat renkleri ve numaraları, iskeleler | Sıralı biniş → aktarma → iniş kartı | Sonraki adım |
| Admin düzenleme | Sol liste, merkez harita, sağ tek editör; gerektiğinde alt araç | Harita / Liste / Düzenle geçişi; üç dar sütun yok | Taslağı kaydet |
| Kontrol et ve yayımla | Rota/sürüm, hazır ve eksik işler, hedefe götüren Düzelt, ziyaretçi önizlemesi | Aynı karar sırası, tek sütun | Bu sürümü yayımla |

## Veri ve harita kuralları
- Seçim değiştiğinde tek GeoJSON kaynak içeriği değiştirilir; önceki rota/pinler kalmaz.
- Numara sırası segment sırası + görünür fotoğraf durak sırasıdır; liste ile aynıdır.
- Yakın pinler kümelenebilir; seçili durağa erişim listede her zaman mümkündür.
- Yaya geometrisi mevcut sokak yönlendirme verisini kullanabilir ancak insan incelemesi
  eksikse “doğrulanmış mesafe/süre” olarak sunulmaz.
- ACTV verisinde bilinen Main bağlantısı: hat 1 Accademia B → Ferrovia E;
  hat 5.2 Ferrovia D → Tre Archi. İki iskele arasında yaya geçişi açıkça anlatılmalı.
- Resmî su geometrisi yalnızca tanınmış eski bağlantıya uygulanır; adminin sonradan
  değiştirdiği bir bağlantı sessizce eski geometriyle değiştirilmez.
- Aktarma hatları renk + hat numarası + tekne simgesi ile ayrılır; yalnızca renge dayanmaz.
- Tarife/hat verisi canlı hizmet garantisi değildir; ACTV kaynak bağlantısı ve veri tarihi gösterilir.
- 3D isteğe bağlıdır, seçimi/kamerayı korur; tek düğmeyle 2D. Panel teması haritayı
  otomatik karartmaz. Her iki panel temasında harita kontrastı ayrıca kontrol edilir.
- Uzun anlatıdan dönüşte rota, durak ve kamera korunur.

## Admin yerel taslak ve önizleme
Alan değişikliği → tek, bütün yerel Draft → etki kartı → tam önizleme →
sunucuda taslak kaydı → doğrulama → değişmez yayın anlık görüntüsü.

Kaynaklar açıkça ayrılır:
1. Kaydedilmemiş önizleme: tüm güncel yerel Draft, yerel değişiklik etiketi.
2. Kaydedilmiş taslak: en son başarılı kayıttan gelen bütün anlık görüntü + revizyon.
3. Yayındaki sürüm: yetkili endpoint'ten gelen current release + yayın zamanı.
   Yayın yoksa boş durum; eski public rehber CMS yayını gibi etiketlenmez.

Etki kartları ve tam önizleme ziyaretçiyle aynı sunum bileşenini kullanır.
Farklı kaynaklardan alan bazında sessiz karışım yok. Hata durumunda son başarılı
görüntü güncelmiş gibi tutulmaz; hata ve yeniden deneme görünür.
Önizleme analitik kodunu veya konum izni isteğini çalıştırmaz. Önizleme açmak
yayınlamaz; bu aşamada paylaşılabilir taslak bağlantısı gerekmiyor.

Bağlamsal kart:
- Rota adı/kapak/açıklama: gerçek rota seçici kartı, EN/TR geçişi.
- Durak içeriği/fotoğraf: gerçek durak kartı ve kırpma odağı.
- Sıra/konum/yol: gerçek yerel geometri, gerektiğinde önce/sonra.
- Görünürlük/yayın: ziyaretçide görünüp görünmeyeceğini açık cümleyle anlat.
- Panel ölçüsü: “Yalnızca senin çalışma alanını etkiler.”
- Konum/istatistik: sahte görsel yerine kapsam, izin ve saklama davranışı.

### Ayarlanabilir çalışma alanı
- Sol ve sağ genişlik, alt yükseklik; okunabilir alt/üst sınırlar.
- Görünür tutamak, klavye okları, separator rolü ve aria değerleri.
- Sürüklemeden çalışan büyüt/küçült ve daralt/aç düğmeleri; Düzeni sıfırla.
- Tercihler admin kimliğiyle yerel saklanır; ekran daralınca sınırlandırılır.
- ResizeObserver haritayı yeniden boyutlandırır; rota/durak/yol taslağını veya kamerayı sıfırlamaz.
- Mobilde kapalı/kısmi/geniş durumlar ve erişilebilir liste/editör geçişleri.
- Seçili pin kapatılıyorsa kullanılabilir alana göre sınırlı odak düzeltmesi.

## Eksik içerik ve doğrulamalar
- Main/Full gerçek kapakları ve durak fotoğrafları, kullanım hakkı/kredi, EN/TR alternatif metin.
- İnsan tarafından gözden geçirilmiş yol geometrisi ve güvenilir rota metrikleri.
- İtalyanca mevcut içerik korunmalı; yeni sunumda İngilizceye sessizce düşen yerler kontrol edilmeli.
- Gerçek canlı oturumla davet/giriş, yükleme, kaydetme, yetki, yayın ve eşzamanlı düzenleme testi.
- Gerçek cihaz GPS doğruluğu fiziksel test olmadan doğrulanmış sayılamaz.
- İstatistik üretim doğruluğu önizleme trafiği hariç ayrı kontrol edilmeli.

## Test görevleri ve geçiş ölçütleri
Henüz yeni tasarım üzerinde çalıştırılmadı; bunlar kabul testleridir.
1. İlk ziyaretçi Main'i seçip başlangıcı bulur: tek baskın eylem, gerçek başlangıç,
   rota değişiminde yalnızca yeni çizgi/pinler, harita yokken liste.
2. Yürüyen kişi sıradaki durağı ve aktarmayı bulur: pin/listede aynı numara,
   iki ACTV hattı ayrı, kalkış iskeleleri açık, geri dönüşte kamera korunur.
3. Admin durağı değiştirir: yerel kart ve tam önizleme güncellenir; kaydet taslak
   revizyonunu değiştirir; kontrol eksik işi doğru alana yönlendirir; yalnızca
   sunucunun başarılı yayın cevabı yayın başarısı sayılır.

Ek kontrol: panel sürükleme/ok/düğme, daralt/aç/sıfırla, mobil sekmeler;
EN/TR sürüm eşleşmesi; fotoğraf kırpma ve konum önizlemesi; kirli çıkış uyarısı;
yükleniyor/boş/hata/çevrimdışı durumları; klavye odak ve dokunma boyutları.
Taklit API testleri canlı üretim testlerinden raporda ayrı tutulacak.

## Birincil kaynaklar
- W3C panel ayırıcı örüntüsü: https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/
- W3C sürükleme alternatifleri: https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements
- W3C minimum hedef boyutu: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum
- ACTV seferler: https://actv.avmspa.it/en/content/orari-servizio-di-navigazione-0

Klavye desteği tek başına sürükleme alternatifini tamamlamaz; sürüklemeden
tek işaretçi ile kullanım da gerekir. AA uygunluğu uygulama ve ölçüm sonrası
iddia edilebilir; bu belge bir uygunluk sertifikası değildir.
