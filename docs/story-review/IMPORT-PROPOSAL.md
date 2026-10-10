# Onaydan sonra taslak aktarımı · üretime uygulanmadı

Mevcut admin `scripts/sideways/import-stories.ts` ve `importStoryProposals` kullanılır. Girdi `data/sideways/place-stories.tr.json`; varsayılan kuru çalışma, gerçek uygulama ayrıca plan digest ister. Yalnız owner; Sideways/anonim istek reddedilir. Mevcut insan düzenlemesi ezilmez, tekrar aktarım değişiklik oluşturmaz. Import yayın yapmaz.

1. STORY-REVIEW’deki TR + EN çiftlerini ve kaynak düzeltmelerini kullanıcı kesin sürümüyle seçsin. Bu turdaki belgelere bakarak JSON’u otomatik değiştirmeyin.
2. Seçilen Türkçe metinleri ayrı gözden geçirilebilir veri diff’i yapın. `needsReview:true`, `proposal_needs_review`, `humanReviewedAt:null` korunur.
3. Admin checkout’ta scriptin argümanlarını okuyup **offline kuru çalışma** kullanın: `node --import tsx scripts/sideways/import-stories.ts`. `--database` verilmediği için bu yol yalnız seed/research dosyalarını okur; DATABASE_URL gerekmez.
4. `npm run test:sideways:integration` kendi geçici 127.0.0.1 PostgreSQL’ini oluşturur, `.env` okumaz. Import30/39ziyaret/195fikir, idempotans, insan metnini koruma, ortak Main/Full çakışması ve yayın/restore sözleşmesini **sentetik yerel veriyle** sınar. Gerçek araştırma içeriği reviewed yapılmaz; reviewed örnekler sentetik test metnidir. Testin geçmesi üretim taslağında 30 kayıt bulunduğunu kanıtlamaz.
5. Mevcut importer yalnız TR üretir. EN taslakları STORY-REVIEW belgesinden, mevcut admin hikâye editöründe dil EN seçilip iki alana ayrı yapıştırılmalı; review düğmesi kullanıcı onayına kadar kullanılmamalı. Bu turda yeni çok dilli importer/API eklenmedi.
6. Üretim için ileride ayrıca izin: önce yetkili kuru çalışma, var olan insan düzenlemelerini koruma sayıları ve digest incelemesi; sonra yalnız onaylanan taslak uygulaması. Üretim DATABASE_URL ile doğrudan SQL/şema eşitlemesi yapılmaz. Üretim aktarımı ve onay/yayın ayrı adımlardır.

Bu turdaki yerel sonuçlar üst klasördeki raporda bulunur. Üretimde geçmişte aktarım yapıldığına dair eski belge **güncel doğrulama değildir**; mevcut admin export/okuması olmadan böyle bir iddia yapılmaz.
