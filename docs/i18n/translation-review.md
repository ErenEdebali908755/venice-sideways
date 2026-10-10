# Main Walk translation review · 10 October 2026

Independent review: separate EN/TR/IT/FR and RU/ZH/JA/KO contexts, with a separate reading pass for each language. Source: the approved bundled TR/EN at `ff57040515525d75c5a46421dc683a04a62a6478`. No translation service was used.

Per-text semantic backtranslations and differences: [inventories](review-inventories/). These are a meaning audit, not a native-speaker certification. Exact approved changes: [reviewed-corrections.json](reviewed-corrections.json).

## Applied corrections

Counts are changed text fields, with the duplicate stop-photo registry fields shown separately; changing an identical caption in two stored places is not counted as two different visitor messages. The three quantity templates per locale were additionally revised for Intl formatting.

| Language | Reviewed field locations | Corrected fields | Registry mirrors within total | Unique product fields | Additional quantity templates |
|---|---:|---:|---:|---:|---:|
| EN | 509 | 8 | 2 | 6 | 3 |
| TR | 509 | 12 | 0 | 12 | 3 |
| IT | 509 | 21 | 0 | 21 | 3 |
| FR | 509 | 20 | 2 | 18 | 3 |
| RU | 506 | 52 | 20 | 32 | 3 |
| ZH | 506 | 40 | 14 | 26 | 3 |
| JA | 506 | 59 | 20 | 39 | 3 |
| KO | 506 | 57 | 20 | 37 | 3 |

## Source reconciliation

Zattere had conflicting legacy route copy: EN called it the original first walk finish, TR described a pause on both walks. All eight versions now state that Main Walk continues from Zattere, consistent with the unchanged route ending at Ponte dei Tre Archi. No new historical fact was added. The fifth idea themes at Zattere and Accademia were stale: Balance and Negative space now match their approved tasks. Italian still contained two older tasks and was aligned with the current EN/TR. Full Walk data remains byte-for-byte unchanged.

## Important examples

### EN

- **routes[key=main].visits[6].ideas[4].copy[en].theme**
  - Before: Light
  - After: Balance
  - Why: Theme is stale after the idea changed to comparing foreground/background balance.

- **routes[key=main].visits[8].ideas[4].copy[en].theme**
  - Before: Colour
  - After: Negative space
  - Why: Theme is stale after the idea changed to observing gaps between boats.

- **routes[key=main].segments[1].copy[en].title**
  - Before: Vaporetto
  - After: Vaporetto · waterbus
  - Why: Explain the local transport term once without changing the route.

### TR

- **routes[key=main].visits[6].ideas[4].copy[tr].theme**
  - Before: Işık
  - After: Denge
  - Why: Theme is stale after the idea changed to comparing foreground/background balance.

- **routes[key=main].visits[8].ideas[4].copy[tr].theme**
  - Before: Renk
  - After: Boşluk
  - Why: Theme is stale after the idea changed to observing gaps between boats.

- **rows["Illustration awaiting identity review."]**
  - Before: Çizimin yer kimliği kontrol bekliyor.
  - After: Çizimde gösterilen yer henüz doğrulanmadı.
  - Why: Replace the unclear literal phrase yer kimliği kontrol bekliyor with a natural review status.

### IT

- **routes[key=main].visits[6].ideas[4].copy[it].theme**
  - Before: Luce
  - After: Equilibrio
  - Why: Theme is stale after the idea changed to comparing foreground/background balance.

- **routes[key=main].visits[8].ideas[4].copy[it].theme**
  - Before: Colore
  - After: Spazio negativo
  - Why: Theme is stale after the idea changed to observing gaps between boats.

- **rows["Retry photograph"]**
  - Before: Riprova la fotografia
  - After: Ricarica la foto
  - Why: Riprova la fotografia is not a natural image-loading action.

### FR

- **routes[key=main].visits[6].ideas[4].copy[fr].theme**
  - Before: Lumière
  - After: Équilibre
  - Why: Theme is stale after the idea changed to comparing foreground/background balance.

- **routes[key=main].visits[8].ideas[4].copy[fr].theme**
  - Before: Couleur
  - After: Espace vide
  - Why: Theme is stale after the idea changed to observing gaps between boats.

- **rows["Retry photograph"]**
  - Before: Réessayer la photographie
  - After: Recharger la photo
  - Why: Réessayer la photographie sounds like taking the photograph again rather than loading it.

### RU

- **routes[0].segments[0].copy.title**
  - Before: Walking
  - After: Пешком
  - Why: Untranslated English segment label; use the same walking term as the localized visitor UI.

- **routes[0].segments[2].copy.title**
  - Before: Walking
  - After: Пешком
  - Why: Untranslated English segment label; use the same walking term as the localized visitor UI.

- **routes[0].segments[1].copy.title**
  - Before: Vaporetto
  - After: Вапоретто (водный автобус)
  - Why: Explain vaporetto with the local waterbus term; original transit type remains recognizable.

### ZH

- **routes[0].segments[0].copy.title**
  - Before: Walking
  - After: 步行
  - Why: Untranslated English segment label; use the same walking term as the localized visitor UI.

- **routes[0].segments[2].copy.title**
  - Before: Walking
  - After: 步行
  - Why: Untranslated English segment label; use the same walking term as the localized visitor UI.

- **routes[0].segments[1].copy.title**
  - Before: Vaporetto
  - After: Vaporetto（水上巴士）
  - Why: Explain vaporetto with the local waterbus term; original transit type remains recognizable.

### JA

- **routes[0].segments[0].copy.title**
  - Before: Walking
  - After: 徒歩
  - Why: Untranslated English segment label; use the same walking term as the localized visitor UI.

- **routes[0].segments[2].copy.title**
  - Before: Walking
  - After: 徒歩
  - Why: Untranslated English segment label; use the same walking term as the localized visitor UI.

- **routes[0].segments[1].copy.title**
  - Before: Vaporetto
  - After: ヴァポレット（水上バス）
  - Why: Explain vaporetto with the local waterbus term; original transit type remains recognizable.

### KO

- **routes[0].segments[0].copy.title**
  - Before: Walking
  - After: 도보
  - Why: Untranslated English segment label; use the same walking term as the localized visitor UI.

- **routes[0].segments[2].copy.title**
  - Before: Walking
  - After: 도보
  - Why: Untranslated English segment label; use the same walking term as the localized visitor UI.

- **routes[0].segments[1].copy.title**
  - Before: Vaporetto
  - After: 바포레토(수상버스)
  - Why: Explain vaporetto with the local waterbus term; original transit type remains recognizable.

## Formatting and acceptance

Distances and duration ranges use Intl.NumberFormat; stop counts use Intl.PluralRules (including Russian one/few/many and teen exceptions); the guide event date uses Intl.DateTimeFormat in Europe/Rome. The event form already uses Intl date/time. Italian instructions use tu; French vous; Russian вы; Japanese and Korean polite forms. Place names remain identifiable in their original forms.

Browser gate: all eight locales at 390px, all ten stop stories, all 50 photo ideas, gallery/detail/lightbox, overview/settings/map/privacy/stop list/photo panel/transit/completion; screenshots plus DOM text-overflow checks. Geographic markers partially outside the map viewport and provider map attribution are not treated as text-layout failures. Main walkthrough also runs WebKit 390/TR and Chromium 412/EN. Results are recorded separately from this review.

## Visual line-break correction

Parent screenshot review caught Korean 아이디어 and Japanese 5つ splitting across title lines despite zero horizontal overflow. Korean prose/controls now keep words together, Chinese/Japanese use strict punctuation breaks, and the Japanese photo-idea heading balances its lines. The mobile browser gate measures the full word/count range on every stop title as one rendered line fragment.

## Scope limits

This audits Main Walk and its shared visitor controls, not Full Walk editorial copy. No geometry, permissions, schema, production database or publishing policy is changed. Newly added photograph captions are separately checked against their photographed content and must have eight localized alternatives.

Review and translation authorization: çeviri: Codex, Eren adına, 10.10.2026.
