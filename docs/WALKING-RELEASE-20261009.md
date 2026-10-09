# Venice Sideways — yürüyüş ve görsel UX yayını, 9 Ekim 2026

**Durum:** Sınırlandırılmış yürüyüş/görsel UX sürümü canlıya alındı. Önce uyumlu admin, ardından ziyaretçi dağıtıldı; iki Railway dağıtımı SUCCESS ve aşağıdaki güncel canlı kontroller geçti. Kitap dosyalarının kamu kullanım hakkı, hikâye yayını, hazırlanmakta olan güvenlik/Google işleri ve fiziksel yürüyüş kabulü bu yayının tamamlanan kapsamına dahil değildir. Saatler aksi belirtilmedikçe UTC'dir.

[Canlı rehber](https://venicesideways.com/) · [ortak güncel durum](https://github.com/ErenEdebali908755/eren-visual-archive/blob/main/docs/CURRENT-STATE.md) · [admin ve kullanım kılavuzu](https://github.com/ErenEdebali908755/eren-visual-archive/blob/main/docs/VENICE-SIDEWAYS-SYSTEM.md) · [harita kaynakları](watercolor-map-sources.md)

## Kaynak ve dağıtım

| Alan | Doğrulanan kimlik |
| --- | --- |
| Admin ürün kaynağı | `ed7608d2db27c28862607810a2fa89fb2bbe5226`, [PR #25](https://github.com/ErenEdebali908755/eren-visual-archive/pull/25) |
| Admin canlı runtime | `fca7d09563d7f4eecd44e38d469393441adb9654`; Railway `63b42b7a-3456-483f-9059-0e76ec44c803`, **9 Ekim 18:51:45 SUCCESS** |
| Admin CI | [37975164659](https://github.com/ErenEdebali908755/eren-visual-archive/actions/runs/37975164659) SUCCESS: TypeScript, 373 test, gerçek izole Payload erişimi, tam üretim derlemesi, diff kontrolü |
| Ziyaretçi ürün kaynağı | `882294693a694658bb949689bb7d2f4090faf84d`, [PR #17](https://github.com/ErenEdebali908755/venice-sideways/pull/17) |
| Ziyaretçi canlı runtime | `4ebe7a528264bb73b9ebf447764769fdbfa488be`; Railway `fe2ad236-736c-4408-a550-db459f1a9b99`, **9 Ekim 18:57:13 SUCCESS** |
| Ziyaretçi exact-head CI | [37975545024](https://github.com/ErenEdebali908755/venice-sideways/actions/runs/37975545024), job `113972798311`, SUCCESS; 1003 UI ve 33 gerçek MapLibre kontrolü dahil tüm adımlar geçti |
| Ortak renderer | 128 dosya; her iki canlı hostta gerçek bayt eşitliği. Toplu SHA-256 `e2e4b0a05b1941cbba088907f120611161f38e09c664fd1b3c4e052c67513795`; yükleme sürümü `20261009-walk` |

## Güncel yürüyüş kullanımı

1. **Main Walk** 11 fotoğraf durağı ve arada ayrı vaporetto aktarımı, **Full Walk** 28 fotoğraf durağı gösterir. Main ve Full ilerlemeleri birbirinden ayrıdır.
2. İlk hedef Santa Lucia'dır. **Buradayım — yürüyüşe başla** ile yürüyüşü başlatınca adlı sonraki hedef Giacomo olur. Yola çıkma, hedefe varma, fotoğraf molası ve sonraki hedefe devam etme ayrı manuel eylemlerdir.
3. **Harita / Duraklar / Fotoğraflar** arasında geçiş yürüyüş hedefini değiştirmez. Bir durak, hikâye veya fotoğraf incelemek de o durağı tamamlamaz. Başka bir yerden sürdürmek için açık **Yürüyüşe bu duraktan devam et** eylemi kullanılır.
4. Main aktarımı ACTV **1: Accademia → Ferrovia**, ardından **5.2: Ferrovia → Tre Archi** olarak iki bacak gösterir. Yalnız geçerli bacağın iki iskelesi görünür; aktarma ve karaya varış ayrı eylemlerdir. Güncel ACTV seferini kontrol etmek gerekir; uygulama kesin ETA veya saha doğrulanmış turn-by-turn yönlendirme sunmaz.
5. Fotoğraf durak sayacı tekne adımını saymaz. Main'in Vino Vero bitişinde yürüyüşü tamamlamak için ayrı eylem vardır.
6. Dil/tema değişimi, rota dönüşü ve yeniden açma geçerli yerel ilerlemeyi korur. Kayıt rota kimliği ve revizyonuna göre doğrulanır; uyumsuz/bozuk ilerleme uygulanmaz. 650 ms hızlı çift basış koruması tek geçerli ilerleme sağlar. Admin özel önizlemesi kalıcı yürüyüş kaydı tutmaz.
7. **Konumumu göster** isteğe bağlıdır. Konum yalnız cihazda kalır; GPS varışı otomatik tamamlamaz. İzin reddi manuel yürüyüşü engellemez. **Konumu kapat** izlemeyi temizler; gizli haritaya dönmek kendi başına yeniden başlatmaz.

### Harita ve mobil yerleşim

Yürüyüş hedefi ve tek adlı ana eylem alt güvenli alanda görünür kalır. Kısa ekran, yatay görünüm, panel boyutları, klavye odağı, kapatma ve görünümler arasında dönüş düzenlendi. Harita gerçek koordinatlarını ve açık altlığını korur; sayfa temasının koyulaşması harita tabanını değiştirmez.

Haritada aktif hedef, kullanıcının bilinçli seçtiği ayrı inceleme pini ve yalnız gerekli aktarım iskeleleri bulunur. Önceki/sonraki duraklar listede kalır; zoom onları açmaz veya çevreye dağıtmaz. Rotanın tamamını kadraja sığdırmak gizli işaretleri otomatik açmaz. Aktif çizgi kayıtlı geometriden çıkarılır; başka bir admin tekne rotasına Main'in ACTV çizgisi uygulanmaz. Konuma dönme ve yürüyüş hedefine dönme birbirinden anlaşılır kontrollerdir.

Mevcut Kit paletinin açık temadaki `#2454D4`, koyu temadaki `#8CAEFF` eylem renkleri korundu. Bu yayın yeni bordo/Yana palet değişikliği yapmadı. Sekiz dil (`en`, `tr`, `it`, `ru`, `fr`, `zh`, `ja`, `ko`), beş fotoğraf fikri, durak sırası, suluboya katmanları, üç yapı ve iki yeşil alan korundu.

## Görsel içerik ve hak sınırı

Paketli Main/Full'un **39 ziyaretinde explicit boş `gallery:[]`** bulunur; 30 yerin gerçek tanıma fotoğrafı henüz yoktur. Kompakt **Bu durak için fotoğraf hazırlanıyor** durumu yürüyüş/haritayı açık bırakır. Genel arşiv seçkisi eksik galeriye kendiliğinden kapak olarak eklenmez.

Kullanıcının izin verdiği arşiv fotoğraf kimlikleri **3, 6, 18 durak numarası değildir**. Yer ilişkileri doğrulanmadığından bunlar ayrı **Fotoğraf örnekleri / İlham** alanında bu açıklamayla gösterilir. Gerçek, açıkça atanmış izinli durak galerileri; revoked/removed, cover/order/alt/credit ve türev sözleşmeleriyle çalışır. Fotoğraflar tam kadraj gösterilir. Mevcut izinli yer çizimleri AI illüstrasyonu olarak ayrıca etiketlenir; gerçek durak fotoğrafı diye sunulmaz.

Kitap paketindeki **40 özgün dosyanın kamu kullanım hakkı doğrulanmadı**; bu yayın kapsamında herkese açık kullanım **0/40**. Kaynak kitap veya lisans adayı, tam EPUB içinden çıkan dosyanın hakkını tek başına kanıtlamaz. Özgün dosyalar, küçültmeleri, seçki ve manifestleri public bundle'a eklenmedi. Bunlar özel yerel araştırma girdisidir; adminin korumalı referans alanına yüklenmiş oldukları da bu yayınla iddia edilmez.

Main planlama metni **yaklaşık 6 km yürüyüş + 2 vaporetto**; normal fotoğraf/kısa site denemesi **3–4 saat**, uzun fotoğraf/ayrıntılı deneme **4–4,5 saat** der. Bunlar tahmini ve henüz sahada doğrulanmadı; başlangıca ulaşım, uzun yemek ve dönüş kapsam dışıdır. Tek bir günün sunset/ACTV saati kalıcı site vaadi yapılmadı.

## Kod yayını ile içerik yayını ayrı

9 Ekim canlı katalogda Main/Full **`published:false`** kaldı; ziyaretçi paketli rehberi kullanır. Gerçek admin Main v3/Full v2 taslakları ve public fallback'ın farklı olması korunur. İnceleme bekleyen hikâye, rota snapshot'ı veya admin taslağı bu UX dağıtımıyla otomatik yayımlanmadı.

Gerçek owner etkinlik görünümünde mevcut **11 Ekim taslağı, 0 kayıt, kapasite sınırı yok ve boş başlangıç saati** görüldü. Yetkili 512 px QR render kontrol edildi; anonim QR isteği 403 döndü. Kamu etkinliği açılmadı, kayıt formu gönderilmedi; tarih/saat veya katılımcı verisi yazılmadı.

Google çevirisi canlı yönetimde **unconfigured / disabled**. Bu yayın yeni kimlik bilgisi, IAM, glossary veya ücretli çeviri denemesi yapmadı; çeviri önerisi çalışıyor denmez. Yeni migration, otomatik schema push, seed/import, DB restore veya veri silme yoktur. Önceki hazırlanmış güvenlik/Google işleri ayrı çalışma kopyalarında korundu; son kayıt admin 142/ziyaretçi 21 değişik dosya bu ayrı UX dağıtımına topluca alınmadı.

## Güncel doğrulama ve kapsamı

| Kanıt | Sonuç ve sınır |
| --- | --- |
| İzole yerel üretim kapıları | Admin 373/373; ziyaretçi 85/85 test, TypeScript, tam admin üretim derlemesi, ziyaretçi üretim Docker build/smoke ve diff kontrolü PASS. Üretim içerik yayını veya fiziksel cihaz kanıtı değildir. |
| Gerçek yerel giriş ve MapLibre | 18:15:31–18:15:51'de 404; 18:39:02–18:39:10'da ayrı transfer/bitiş/yeniden açma 70 kontrol PASS. Paketli ve yerel yayın fixture yolları, sekiz dil, 360/390/430 px, kısa/yatay görünüm ve %200'e eşdeğer CSS viewport. Kontrollü galeri/konum/altlık fixture'ları gerçek üretim verisi sayılmaz. |
| Yerel CI tarayıcı kapıları | 32 dil/genişlik vakasında 1003 UI, ayrı MapLibre kapısında 33; toplam 1036 kontrol PASS. Native zoom ve fiziksel telefon kabulünden ayrıdır. |
| İki canlı host HTTP/cache | **325 kontrol PASS**; iki hostun her birinde 128 dosyanın gerçek baytları aynı digest'e eşit, sürüm/import zinciri ve ETag/304 doğru. Admin draft/media 403, kitap yolları 404, özel preview shell private,no-store. |
| Yeni canlı ziyaretçi tarayıcısı | 19:06:01–19:06:14'te **50 kontrol / 72 GET PASS**, sayfa hatası 0; gerçek domain ve MapLibre, yanıt interception'ı yok. Gerçek index/entry/guide/gallery/walking/routes baytları kaynakla aynı. Beş okunabilir 390×844 PNG: başlangıç, adlı hedef, Fotoğraflar/İlham dönüşü, ilk tekne bacağı ve Vino Vero bitişi. Masaüstü Chromium mobil viewport'udur; fiziksel telefon değildir. |
| Native kullanıcı Chrome'u | Sekiz dil, light/dark/system ve manuel hedef/yol tarifi kontrolü PASS. Gerçek menüden **%200**: 720×303 CSS viewport, görünür adlı hedef/44+ px ana eylem ve taşmasız düzen; sonra %100'e dönüldü. Mevcut GPS izniyle açık kullanıcı eylemi sonrası yerel işaret çalıştı, otomatik ilerleme yok ve kapatıldı. Native ret yapılmadı; kontrollü ret testi ayrı PASS. |
| Gerçek owner admin | Main v3/TR Frari incelemesinde yürüyüş Lucia 1/11 kaldı; Full v2/TR Lucia 1/28, gerçek MapLibre, önizlemeyi kapatıp editöre dönüş ve değişiklik yokken kaydet devre dışı PASS. Gerçek Sideways-role üretim hesabı kontrolü sayılmaz. |

Sürümlenmiş static/CDN URL'leri mevcut **public,max-age=14400** politikasını korur; shell'in no-store olması tüm varlıkların sıfır TTL olması demek değildir. İlk sıfır-TTL varsayımıyla reddedilen HTTP koşuları FAIL olarak saklandı; gerçek bayt/sürüm/ETag sözleşmesini ölçen yeni kapılar geçti. CDN purge veya tüm eski kalıcı profil cache geçişlerinin tekrarlandığı iddiası yoktur. 5–6 Ekim tarihli testler bugünkü sonuçların yerine kullanılmadı.

## Kalan kabul ve uyumlu geri dönüş

Kalanlar: fiziksel iPhone/Android güvenli alan/klavye, saha yürüyüşü/GPS/pil, açıklamasız insan kullanılabilirliği; üretimde gerçek Sideways-role hesabı oturumu; hikâyelerin sistemde insan inceleme kaydı ve public snapshot yayını; gerçek durak fotoğrafları ve kitap dosyalarının kullanım hakkı. Sekiz locale UI kontrolü bağımsız insan çeviri incelemesi veya Google üretimi sayılmaz. Önceden hazırlanmış güvenlik ve Google işleri tamamlanmış/yayımlanmış diye raporlanmaz.

UX sorunu çıkarsa önce ziyaretçi yayını durdurulur; son doğrulanmış uyumlu runtime veya dar UX düzeltmesi tercih edilir. **Sekiz dil/İtalyanca, sourceLanguage, onaylı hikâye/geçmiş, galeri ilişkileri ve mevcut şema/veri korunur.** Eski yedi dilli admin, migration down, tablo/JSON silme veya eski dump'ı üretime kör geri yükleme kullanılmaz. Bu UX-only geri dönüşü schema değişikliği gerektirmez; kod geri dönüşü editoryal snapshot geri alma veya yerel yürüyüş kaydını silme anlamına gelmez. Gerçek geri dönüşün runtime ve iki domain kontrolleri ayrıca kaydedilir.
