# Konum ve mobil doğrulama kapsamı

`tests/location-mobile-browser.mjs` iki tarayıcı motorunda yerel giriş kodu, gerçek renderer ve MapLibre kullanır. Vektör taban boş sentetik tile ile yalıtılır; tile sağlayıcısının güncelliği/coğrafyası bu testin kanıtı değildir. Koordinatlar emülasyondur; test dış sunucuya istekleri engeller.

Çalıştırma:

```sh
QA_OUTPUT=/tmp/sideways-location-qa node tests/location-mobile-browser.mjs
```

Playwright kurulumu yoksa `PLAYWRIGHT_MODULE` ile kurulu modülün yolu; tarayıcılar için `PLAYWRIGHT_BROWSERS_PATH` verilir. `QA_ENGINE=webkit` veya `chromium`, yalnız konum denemesi için `QA_GPS_ONLY=1`. Sonuçlar/screenshotlar ürün deposu dışında tutulur. Bir başarısız kontrol varsa çıkış kodu 1’dir; sessiz skip yok.

## Kapsam

- iPhone 13/WebKit ve Pixel 7/Chromium; 360/390/430 px; EN/TR; light/dark: 24 baştan sona yürüyüş.
- Lucia → Vino Vero, iki vaporetto bacağı, Frari ve aktarım sırasında yenileme; birebir yürüme durumunun korunması; alt eylem 44 px ve taşma; konumun kendiliğinden açılmaması.
- Native izin/geolocation override: 100 m/1000 m geometrik yarıçap, Venedik dışı, kapat/aç, sentetik visibility değişimi.
- Ayrı açıkça işaretli callback benzetimi: ret, zaman aşımı, 100/1000 m daire, 30 hızlı konum, pagehide ve kapatma sonrası geç gelen callback. Bunlar gerçek telefon OS davranışını kanıtlamaz.

## 10 Ekim yerel bulgusu

24 yürüyüş geçti. Chromium native geolocation ve iki motordaki callback benzetimleri geçti. WebKit native geolocation **başarısız**: bu kurulu emülatör callback’inde epoch değeri milisaniye yerine yaklaşık 1000 kat büyük geldi (`1791618477685000`; aynı anda Date.now `1791618478737`). Motor gelecekte görünen konumu doğru şekilde reddetti. Playwright WebKit sürücüsü timestamp alanına Date.now gönderiyor; bu ortamın native override zinciriyle uyumsuzluk gözlendi. Gerçek iPhone’da aynı sorun var sonucu çıkarılamaz.

Chromium override değiştirilirken geçici code 2 üretir; yeni test her yeni sentetik konum için yeni watch başlatır. Ret/zaman aşımı/hızlı callback testleri ayrı kalır. Bu değişiklik ürünün konum kodunu değiştirmez.

**WebKit native kontrolünü geçmiş saymıyoruz.** Test ortamı uyumluluğu ve gerçek iPhone saha kontrolü açık kalır. Hatalı timestamp’i ürün kodunda normalize ederek sorunu gizlemedik. Geniş tarayıcı testinin 1883 kontrolü GPS kanıtı yerine kullanılamaz.

## enableHighAccuracy kararı

Kullanıcının talimatıyla `false`, timeout 15000, maximumAge 10000 korunur. `true` daha kesin fix isteyebilir; kesinlik garantisi değildir. Daha fazla pil/ilk fix beklemesi getirebilir; iOS izin/OS askıya alma davranışını ortadan kaldırmaz. Karar açık alan ve dar sokakta metre cinsinden doğruluk yarıçapı/çapı, gözlenen sapma, ilk fix süresi ve pil ölçümüne göre verilecek. Saha listesi ayrı `qa/field-test-checklist` PR’ındadır; bu dal listeyi tekrar değiştirmez.

Gerçek hataya dayanan ürün düzeltmesi bu aşamada yapılmadı. GPS ve yerel ilerleme modeli aynıdır. Fiziksel cihaz, ekran kilidi, vaporetto hareketi, gerçek şehir gölgelenmesi ve pil ölçümü bekliyor.

Kaynak: [W3C Geolocation · enableHighAccuracy](https://www.w3.org/TR/geolocation/#enablehighaccuracy-member). Yüksek doğruluk isteği uygulanmayabilir; güç tüketimi ve yanıt süresi cihazda ölçülmelidir.
