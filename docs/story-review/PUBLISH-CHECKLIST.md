# Hikâye yayını kontrol listesi

**Şu an: HAZIR DEĞİL.** Bu çalışma merge/deploy/içerik yayını yetkisi içermez. 11 Ekim 2026 akşamına kadar ziyaretçi tarafında merge yapılmayacak; sonrasında da yeni açık onay gerekir. Admin PR’ları da merge edilmez.

## 1. İçerik ve coğrafya kapısı

- [ ] STORY-REVIEW-TR.md içindeki 30 TR + EN çifti, kesin seçilmiş sürüm ve tarih ile kullanıcı tarafından birlikte onaylandı. Kaynak açığı/taş türü/kurucu düzeltmesi çözüldü. Belgedeki kutu işaretlemek kendiliğinden CMS onayı değildir.
- [ ] Güncel admin taslakları, yetkili admin okumasıyla dışarı aktarıldı; rota/revision/zaman kaydedildi. Üretim DATABASE_URL kullanılmaz. Özel ham export Git’e konmaz.
- [ ] Paketli `public/field-guide/routes.json` ile **her durak** için rota/visitKey/placeKey, sıra, enlem ve boylam karşılaştırıldı. `node tools/compare-story-route-draft.mjs EXPORTED_DRAFT.json` tabloyu üretir; yalnız dosya okur. Girdi `{routes:[{draft:…}]}` veya routes dizisi olabilir.
- [ ] Aşağıdaki eski yerel tablo güncel export sonucu ile yenilendi; eksik/fazla/tekrar duraklar çözülmüş; Lucia ve Accademia dahil tüm farkların doğru değeri kullanıcı tarafından seçildi. Otomatik düzeltme yok.
- [ ] Geometri, vaporetto biniş/iniş, durak sırası, fotoğraf izinleri ve her duraktaki beş fikir ayrıca incelendi. Koordinat tablosu rota çizgisinin doğruluğunu tek başına kanıtlamaz.

## 2. Yerel aktarım ve onay

- [ ] [Aktarım önerisi](IMPORT-PROPOSAL.md) okundu. Kuru çalışma ve geçici PostgreSQL testi yeni içerik dosyasıyla geçti. Üretime aktarım için ayrıca açık izin alındı.
- [ ] EN manuel taslak girişi mevcut editörde yerel fixture ile doğrulandı. Mevcut TR importer EN’yi aktarmıyor; İngilizce metin girmiş olmak reviewed anlamına gelmez.
- [ ] Onay, kesin metin çiftine bağlı olarak kullanıcı tarafından adminin mevcut inceleme akışında verildi. Altı dil için yeni çeviri üretilmedi. EN beklerse onaylı TR geri dönüşü sekiz dilde doğrulandı; hiç onaylı dil yoksa hikâye görünmüyor.

## 3. Teknik ve geri dönüş kapısı

- [ ] Yayınlanacak visitor/admin başlarında testler, syntax/TypeScript, ilgili tarayıcı kontrolleri ve ortak renderer eşitliği geçti. Mevcut lint hataları ayrı kayıtlı; yeni hata yok.
- [ ] [Geri dönüş önerisindeki](ROLLBACK-PROPOSAL.md) sunucu ve tarayıcı testleri **bu yayın için yerelde başarıyla tekrarlandı**; kayıt/log yolu yazıldı: __________
- [ ] Bayrak aç/kapat sırasında aynı rota/visit kimlikleriyle kaydedilmiş ilerleme korundu; hem yeni hem yenilenen sekmeler kontrol edildi. Kanıt: __________
- [ ] Paketli rehberin Main/Full verisi ve görselleri kullanılabilir; etkinlik akışı ayrı kontrol edildi. Geri dönüş testi başarısızsa **HAZIR DEĞİL**.
- [ ] Admin önizlemede TR + EN; diğer altı dilin fallback’i; yerel/kayıtlı/yayınlanmış önizleme ayrımı; mobil hikâye ve fotoğraf görünümü doğrulandı.
- [ ] Operatörün Railway ziyaretçi hizmetinde bayrağı açma yetkisi ve geri dönüş adımları teyit edildi. Henüz çalışan kodda bayrak yoksa içerik yayını açılmaz.

## 4. İleride ayrıca onaylanacak yayın

- [ ] Merge/deploy ve rota içerik yayını için ayrı kullanıcı onayı var; bekleme tarihi geçmiş.
- [ ] Uyumlu kod önce admin sonra ziyaretçide dağıtılmış ve kontrol edilmiş; bu turda yapılmadı.
- [ ] Yayın öncesi mevcut release/revision kaydedilmiş; editör taslağının incelenen sürümle aynı olduğu teyit edilmiş.
- [ ] Mevcut yetkili admin yayın akışıyla yalnız onaylı rota yayımlanmış. Taslak kaydı, kod yayını ve rota yayını ayrı işlemlerdir.
- [ ] Canlı yeni sekmede katalog, Main/Full veri yolu, 8 dil, hikâye, beş fikir, GPS ret/opt-in, fotoğraflar, vaporetto ve ilerleme doğrulanmış. Google servis durumu ayrıca dürüstçe gösterilmiş.
- [ ] Sorunda ziyaretçi bayrağı ile paketli rehbere dönülmüş; açık sekme yenilenmiş; yeni sekmede doğrulanmış. Admin unpublish henüz yok; eski şema/sürümle veri silme yok.

## Tüm durak karşılaştırması · yalnız eski yerel seed

**Bu tablo güncel canlı admin taslağı değildir.** Kaynak `data/sideways/legacy-seed.json`; üretim DB’ye bağlanılmadı. Main 11 + Full 28 = 39 ziyaret. Eski yer kaydı koordinatı ile rota ziyaret koordinatı farklı alanlardır; ziyaretçinin esas kullandığı ziyaret koordinatını karşılaştırıyoruz. Önceki nottaki Lucia/Accademia farkı, seed’in yer kaydına karşıydı; bunu güncel taslak farkı diye sunmuyoruz. Gerçek admin export kontrolü zorunlu ve bekliyor.

| Rota / kimlik | Paketli place / sıra | Taslak place / sıra | Paketli enlem, boylam | Taslak enlem, boylam | Eski yer kaydı enlem, boylam (varsa) | Fark | Kullanıcı kararı |
|---|---|---|---|---|---|---|---|
| main / lucia | lucia / 0 | lucia / 0 | 45.44085, 12.32145 | 45.44085, 12.32145 | 45.4404, 12.3213 | eşit | bekliyor |
| main / giacomo | giacomo / 1 | giacomo / 1 | 45.4402, 12.3271 | 45.4402, 12.3271 | 45.4402, 12.3271 | eşit | bekliyor |
| main / frari | frari / 2 | frari / 2 | 45.4371, 12.32568 | 45.4371, 12.32568 | 45.4371, 12.32568 | eşit | bekliyor |
| main / margherita | margherita / 3 | margherita / 3 | 45.4344, 12.323822 | 45.4344, 12.323822 | 45.4344, 12.323822 | eşit | bekliyor |
| main / barnaba | barnaba / 4 | barnaba / 4 | 45.43335, 12.3254 | 45.43335, 12.3254 | 45.43335, 12.3254 | eşit | bekliyor |
| main / trovaso | trovaso / 5 | trovaso / 5 | 45.43008, 12.327 | 45.43008, 12.327 | 45.43008, 12.327 | eşit | bekliyor |
| main / zattere | zattere / 6 | zattere / 6 | 45.42928, 12.32761 | 45.42928, 12.32761 | 45.42928, 12.32761 | eşit | bekliyor |
| main / dogana | dogana / 7 | dogana / 7 | 45.43069, 12.33625 | 45.43069, 12.33625 | 45.43069, 12.33625 | eşit | bekliyor |
| main / accademia | accademia / 8 | accademia / 8 | 45.43166, 12.32891 | 45.43166, 12.32891 | 45.43164, 12.32899 | eşit | bekliyor |
| main / trearchi | trearchi / 9 | trearchi / 9 | 45.44557, 12.32074 | 45.44557, 12.32074 | 45.44557, 12.32074 | eşit | bekliyor |
| main / vino | vino / 10 | vino / 10 | 45.44405, 12.33309 | 45.44405, 12.33309 | 45.44405, 12.33309 | eşit | bekliyor |
| full / lucia | lucia / 0 | lucia / 0 | 45.4404, 12.3213 | 45.4404, 12.3213 | 45.4404, 12.3213 | eşit | bekliyor |
| full / guglie | guglie / 1 | guglie / 1 | 45.44356, 12.32527 | 45.44356, 12.32527 | 45.44356, 12.32527 | eşit | bekliyor |
| full / ghetto | ghetto / 2 | ghetto / 2 | 45.44525, 12.3275 | 45.44525, 12.3275 | 45.44525, 12.3275 | eşit | bekliyor |
| full / ormesini | ormesini / 3 | ormesini / 3 | 45.44605, 12.328 | 45.44605, 12.328 | 45.44605, 12.328 | eşit | bekliyor |
| full / orto | orto / 4 | orto / 4 | 45.44621, 12.33235 | 45.44621, 12.33235 | 45.44621, 12.33235 | eşit | bekliyor |
| full / misericordia | misericordia / 5 | misericordia / 5 | 45.44405, 12.33312 | 45.44405, 12.33312 | 45.44405, 12.33312 | eşit | bekliyor |
| full / chiodo | chiodo / 6 | chiodo / 6 | 45.44288, 12.33459 | 45.44288, 12.33459 | 45.44288, 12.33459 | eşit | bekliyor |
| full / rialto | rialto / 7 | rialto / 7 | 45.4381, 12.3354 | 45.4381, 12.3354 | 45.4381, 12.3354 | eşit | bekliyor |
| full / giacomo | giacomo / 8 | giacomo / 8 | 45.4402, 12.3271 | 45.4402, 12.3271 | 45.4402, 12.3271 | eşit | bekliyor |
| full / polo | polo / 9 | polo / 9 | 45.43735, 12.32925 | 45.43735, 12.32925 | 45.43735, 12.32925 | eşit | bekliyor |
| full / frari | frari / 10 | frari / 10 | 45.4371, 12.32568 | 45.4371, 12.32568 | 45.4371, 12.32568 | eşit | bekliyor |
| full / margherita | margherita / 11 | margherita / 11 | 45.4344, 12.323822 | 45.4344, 12.323822 | 45.4344, 12.323822 | eşit | bekliyor |
| full / barnaba | barnaba / 12 | barnaba / 12 | 45.43335, 12.3254 | 45.43335, 12.3254 | 45.43335, 12.3254 | eşit | bekliyor |
| full / trovaso | trovaso / 13 | trovaso / 13 | 45.43008, 12.327 | 45.43008, 12.327 | 45.43008, 12.327 | eşit | bekliyor |
| full / zattere | zattere / 14 | zattere / 14 | 45.42928, 12.32761 | 45.42928, 12.32761 | 45.42928, 12.32761 | eşit | bekliyor |
| full / dogana | dogana / 15 | dogana / 15 | 45.43069, 12.33625 | 45.43069, 12.33625 | 45.43069, 12.33625 | eşit | bekliyor |
| full / salute | salute / 16 | salute / 16 | 45.43086, 12.33439 | 45.43086, 12.33439 | 45.43086, 12.33439 | eşit | bekliyor |
| full / accademia | accademia / 17 | accademia / 17 | 45.43164, 12.32899 | 45.43164, 12.32899 | 45.43164, 12.32899 | eşit | bekliyor |
| full / stefano | stefano / 18 | stefano / 18 | 45.43303, 12.3313 | 45.43303, 12.3313 | 45.43303, 12.3313 | eşit | bekliyor |
| full / marco | marco / 19 | marco / 19 | 45.43404, 12.33873 | 45.43404, 12.33873 | 45.43404, 12.33873 | eşit | bekliyor |
| full / schiavoni | schiavoni / 20 | schiavoni / 20 | 45.43342, 12.34415 | 45.43342, 12.34415 | 45.43342, 12.34415 | eşit | bekliyor |
| full / arsenale | arsenale / 21 | arsenale / 21 | 45.43482, 12.34984 | 45.43482, 12.34984 | 45.43482, 12.34984 | eşit | bekliyor |
| full / tana | tana / 22 | tana / 22 | 45.433188, 12.351705 | 45.433188, 12.351705 | 45.433188, 12.351705 | eşit | bekliyor |
| full / garibaldi | garibaldi / 23 | garibaldi / 23 | 45.43226, 12.35412 | 45.43226, 12.35412 | 45.43226, 12.35412 | eşit | bekliyor |
| full / viale | viale / 24 | viale / 24 | 45.43089, 12.35633 | 45.43089, 12.35633 | 45.43089, 12.35633 | eşit | bekliyor |
| full / giardini | giardini / 25 | giardini / 25 | 45.429291, 12.356997 | 45.429291, 12.356997 | 45.429291, 12.356997 | eşit | bekliyor |
| full / sette | sette / 26 | sette / 26 | 45.42908, 12.3551 | 45.42908, 12.3551 | 45.42908, 12.3551 | eşit | bekliyor |
| full / elena | elena / 27 | elena / 27 | 45.4251, 12.36149 | 45.4251, 12.36149 | 45.4251, 12.36149 | eşit | bekliyor |
