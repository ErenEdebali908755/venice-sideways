# Venice Sideways — yürüyüş akışı ve görsel ilişkileri · 9 Ekim 2026

## Ziyaretçi kullanımı

1. Main Walk veya Full Walk seçilir. Başlangıç ve bitiş rota kartında yazılıdır.
2. Santa Lucia başlangıcında **Buradayım — yürüyüşe başla** eylemiyle yürüyüş başlar. Sonraki hedef adı alt bölümde görünür.
3. **Bu durağa geldim** fotoğraf molasını açar; **[durak adı] durağına devam et** ayrı bir sonraki adımdır. Bir dokunma bir durumu ilerletir.
4. Harita, Duraklar ve Fotoğraflar aynı düzeydeki görünümlerdir. Başka bir durağı incelemek yürüyüş hedefini değiştirmez. Bilerek değiştirmek için **Yürüyüşe bu duraktan devam et** seçilir.
5. Main 11 fotoğraf durağıdır. Accademia → Ferrovia (ACTV 1) ve Ferrovia → Tre Archi (ACTV 5.2) aktarımı ayrı gösterilir; 12. fotoğraf durağı yaratılmaz. Güncel iskele ve sefer bilgisi resmi ACTV kaynağından kontrol edilir.
6. Yerel manuel ilerleme rota kimliği, ziyaret kimliği ve veri revizyonuyla kontrol edilir. Dil/tema ve fotoğrafı kapatma ilerlemeyi sıfırlamaz. Konum reddedilse de bütün manuel akış kullanılabilir.

## Görsel kuralları

- Bir durağın doğrulanmış galerisi yoksa açık boş durum gösterilir. Global arşiv örneği otomatik durak kapağına dönüşmez.
- Sahibinin izin verdiği üç arşiv örneği ayrı **Fotoğraf örnekleri / ilham** seçkisidir; o durakta çekildiği iddia edilmez.
- Galeri kapak, sıralama, alt, açıklama, kredi, türev, kaldırma ve iptal davranışını korur. İptal edilmiş ilişki tekrar referans galeriye düşmez.
- 40 kitap adayı yalnız özel yerel değerlendirme dizinindedir. Dosya kimliği, lisans ve atıf ayrıca doğrulanmadan ürün public klasörüne, anonim projeksiyona veya CDN'e eklenmez. ZIP/EPUB, kitap görseli ve QA türevi ürün paketine alınmaz.
- Mevcut AI çizimleri fotoğraf değildir; yeni mimari insan onayı verilmez. Tre Archi adayı kapalı kalır.

## Yönetici ve veri yolu

Payload taslağı → aynı kökenli yetkili özel önizleme → ayrı yayın kapısından geçmiş public snapshot veya ziyaretçi paketli fallback korunur. Taslakta fotoğrafı değiştirmek paketli fallback'i otomatik değiştirmez. Yetkisiz kişi taslak medyayı veya özel önizlemeyi alamaz. Bu UX çalışması etkinlik tarihini, kayıt verisini, hikâye onaylarını, rol kurallarını veya veritabanı şemasını değiştirmez.

Ortak `guide.js`, `guide.css`, `gallery.js`, `ui-copy.js`, `walking-state.js` ve görsel kaynakları mevcut sync aracıyla eşitlenir. Değişen giriş, modül ve önizleme URL'leri `20261009-walk` sürümünü taşır. Önce admin, canlı özel önizleme kabulünden sonra ziyaretçi yayımlanır.

## Süre sınırı

Main için **yaklaşık 6 km yürüyüş + 2 vaporetto**, fotoğraf/kısa site denemesiyle **3–4 saat**, ayrıntılı denemeyle **4–4,5 saat** planlama aralığı gösterilir. Sahada doğrulanmış ETA değildir; buluşmaya ulaşım, uzun yemek ve dönüş dışarıdadır. Kayıtlı yol stale/unreviewed olabilir; kesin adım adım yönlendirme veya bugünün kalıcı sunset/sefer saati eklenmez.

## Yayın kapsamı ve kabul

Bu kaynak dalı güncel main sürümünden ayrılmıştır. 7 Ekim'de hazırlanan güvenlik migration, ölçüm kabul sırları ve Google kurulum taslağı ayrı çalışma kopyasında korunur; bu UX dalına eklenmez. Yeni Google hizmeti veya anahtar akışı oluşturulmaz.

Kaynak, yerel/CI test, canlı sürüm ve fiziksel cihaz kanıtı farklı kapılardır. Testlerin eski rapordan kopyalanması yayın kanıtı sayılmaz. Kesin commit/CI/deploy kimlikleri ve güncel canlı kontrol sonucu teslim raporunda kayıtlı olmalıdır. Fiziksel iPhone/Android, batarya ve bağımsız insan görev denemesi yapılmadıysa açıkça bekliyor yazılır.
