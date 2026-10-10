# Yayını kaldır / paketli rehbere dön · karar önerisi

Durum: ziyaretçi bayrağı bu PR’da uygulanmıştır; admin unpublish yalnız öneridir. Merge, canlı ayar değişikliği ve yayın yapılmadı.

| Seçenek | Kullanım | Avantaj | Sınır / risk |
|---|---|---|---|
| Admin “Yayını kaldır” | Rota başına onaylı işlem; katalog published:false olur | Uzun vadede arayüzden anlaşılır, rota bazında | Yeni yetki/işlem/günlük/eşzamanlılık testleri gerekir; admin veya DB arızasında kullanılamaz. Eski release önbelleği ayrıca ele alınmalı. Bu PR’da uygulanmaz. |
| Ziyaretçi SIDEWAYS_FORCE_BUNDLED=1 | Railway ziyaretçi hizmeti Variables; değeri 1 yapıp değişikliği uygula | Admin ve DB’den bağımsız; upstream ve sunucudaki eski snapshot önbelleği okunmaz; içerik silinmez | Süreç yeniden başlamalıdır. Railway’in “Apply/Deploy” adımı gerekebilir; anında tek tık garantisi yok. Tüm rotalar paketli sürüme döner, açık sekmeler yenilenene kadar eski veri kalabilir. |
| İkisi birden | Acilde bayrak; planlı yayından kaldırmada admin | Operasyon ve editoryal karar ayrılır | Daha fazla kod/izin/denetim yüzeyi; ilk aşamada tek kişi için gereksiz uygulama maliyeti |

**Öneri:** önce küçük ziyaretçi bayrağı. Tek kişi için en kısa ve bağımsız geri dönüş yolu budur. Rota bazında kalıcı yayından kaldırma sık ihtiyaç olursa admin işlemine ayrı onay verin. Bu öneri kendiliğinden canlı işlem yetkisi değildir.

## Var olan arşivleme neden aynı işlem değil?

Admin rota kartındaki “Remove from site” `archiveRoute` işlemini çağırır. Rota archived olur; katalogdan tamamen çıkar, publicRelease 404 verir, yayın referansı korunur. Main katalogdan çıkınca ziyaretçi girişinin Main kontrolü başarısız olabilir; bu, kontrollü `published:false` ile paketli rehbere dönmek değildir. Bu nedenle mevcut arşivleme düğmesini unpublish çözümü olarak önermiyorum. Yeni admin unpublish, Main katalog kaydını koruyup yalnız yayın referansını denetimli olarak pasifleştirmeli; ayrı izin/revision/audit/cache testleri istemelidir.

## Uygulanan sözleşme

- Bayrak yalnız sunucu ortamından, başlatma sırasında okunur. Yalnız tam `1` değeri etkinleştirir; query/cookie/header etkisizdir.
- `/api/route-catalog` paketli dosyadaki rota anahtarlarını `published:false` ve `source:bundled, reason:operator_override` ile döndürür. `Cache-Control:no-store`.
- `/api/routes/*` bu modda 404/no-store döner; upstream veya bellekteki eski yayın okunmaz.
- Giriş kodu paketli rotaları açar ve mevcut paketli rehber uyarısını gösterir. Hikâyeler paketli dosyada yoksa görünmez. Etkinlik API’si/kayıt sayfası ayrı kalır; bu bayrak etkinlik iptali değildir.
- Admin özel önizlemesi ve yayın kayıtları değişmez. Hiçbir yayın, koordinat, dil, kullanıcı ilerlemesi veya şema silinmez. İlerleme aynı kimliklerle okunur; içerik sürüm parmak izi değişebilir, hedef ve tamamlanan duraklar korunmalıdır; gelecekte yayımlanacak rota farklı kimliklere sahipse geri dönüş öncesi karşılaştırma şarttır.
- Ortam değişikliği çalışan eski sekmeye push edilmez: ziyaretçi sayfayı yenilemelidir. Çevrimdışı açık sayfanın anında yenilenmesi garanti edilmez.

## İleride yetki verildiğinde işletim

1. Ziyaretçi hizmetinin bu kod sürümünü içerdiğini ve paketli rotanın kullanılabilirliğini doğrula.
2. Railway’de **venice-sideways ziyaretçi hizmetinde**, başka ayarı değiştirmeden `SIDEWAYS_FORCE_BUNDLED=1` uygula. Yeniden başlatmanın başarı durumunu bekle.
3. Katalogda bundled/operator_override; rota API’sinde 404/no-store; yeni gizli sekmede Main Walk ve kaydedilmiş ilerleme; TR/EN ve etkinlik bağlantısını doğrula. Mevcut sekmeyi yenile.
4. Bu modun nedenini ve açılma saatini kaydet. Adminin yayınları yerinde kalır; admin ekranının hâlâ “published” demesi bu durumda beklenir.
5. Sorun giderilince onaylı güncel admin içeriğini kontrol et. Bayrağı kaldır veya `0` yap, yeniden başlat; katalog ve yeni sekme üzerinden geri açılan **mevcut** yayını doğrula.
6. Eski yedi dilli admin sürümüne dönme; schema down veya içerik silme yapma. Bu geri dönüş yalnız ziyaretçi veri kaynağı seçimini değiştirir.

## Yerel kabul ve hazır olma kapısı

`npm test` içindeki bundled-recovery testi: önbellekte yayın varken ve upstream kapalıyken geçiş; katalog/HEAD/404/cache; bayrağın kaldırılması; dışarıdan bayrak taklidi; etkinlik sayfasının korunması.

`tests/bundled-recovery-browser.mjs`: yerel gerçek sunucu/giriş kodunda normal → paketli → normal; gerçek tarayıcı, sentetik CMS yanıtları, harita sağlayıcısı kapalı. Rapor ve ekran görüntüleri ürün deposu dışında tutulur.

PUBLISH-CHECKLIST her gelecek yayın için bu yerel testlerin başarılı yeni kaydını ve aynı kimliklerle ilerleme kontrolünü ister. Bu belgede bir testin tarif edilmesi o yayının hazır olduğu anlamına gelmez. Canlı bayrak hiç açılmadı; Railway operasyonu bu turda sınanmadı.
