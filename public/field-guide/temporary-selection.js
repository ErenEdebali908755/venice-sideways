/* User-authorized visual samples. They are not asserted to depict Venice stops. */
const locales = ["en", "tr", "it", "fr", "ru", "zh", "ja", "ko"];
const samples = [
  [3, 1238, ["A reader sits alone on a slatted bench in monochrome.", "Siyah beyaz fotoğrafta bir okur çıtalı bankta yalnız oturuyor.", "Una persona legge da sola su una panchina a doghe, in bianco e nero.", "Une personne lit seule sur un banc à lattes, en noir et blanc.", "Читатель сидит один на скамейке с рейками, чёрно-белый снимок.", "黑白照片中，一位读者独自坐在板条长椅上。", "モノクロ写真。すのこ状のベンチに一人で座る読者。", "흑백 사진 속 독자가 나무 벤치에 홀로 앉아 있다."]],
  [6, 1238, ["A monochrome bar is framed by long illuminated shelves and repeated stools.", "Siyah beyaz barda uzun ışıklı raflar ve sıralı tabureler görülüyor.", "Un bar in bianco e nero, con lunghe mensole illuminate e sgabelli in fila.", "Un bar en noir et blanc, avec de longues étagères éclairées et des tabourets alignés.", "Чёрно-белый бар с длинными освещёнными полками и рядом стульев.", "黑白照片中的酒吧，有长长的照明搁架和一排高脚凳。", "モノクロのバー。長い照明付き棚と並ぶスツール。", "긴 조명 선반과 반복되는 의자가 있는 흑백 바 사진."]],
  [18, 1373, ["A saxophonist stands beneath a heavy stone arch in monochrome.", "Siyah beyaz fotoğrafta bir saksofoncu kalın taş kemerin altında duruyor.", "Un sassofonista sotto un imponente arco di pietra, in bianco e nero.", "Un saxophoniste sous une imposante arche en pierre, en noir et blanc.", "Саксофонист под массивной каменной аркой, чёрно-белый снимок.", "黑白照片中，一位萨克斯手站在厚重的石拱下。", "モノクロ写真。重厚な石のアーチの下に立つサックス奏者。", "무거운 돌 아치 아래 서 있는 색소폰 연주자의 흑백 사진."]],
];
const approvedSamples = samples.map(([id, width, alt], order) => ({
  assetID: `reference-eren-${id}`, derivativeVersion: "public-web-20261005", order, cover: order === 0,
  focalPoint: { x: 50, y: 50 }, sourceLanguage: "en", textRevision: 1,
  copy: locales.map((locale, index) => ({ locale, alt: alt[index], caption: "", needsReview: false })),
  credit: "Eren Edebali", referenceOnly: true,
  derivatives: [{ variant: "r400", url: `https://erenedebali.com/image/${id}/thumb`, width: 640, height: id === 18 ? 1025 : 1138 }, { variant: "r900", url: `https://erenedebali.com/image/${id}/web`, width, height: 2200 }],
}));

/** Owner-authorized display samples only. Disable/revoke here and redeploy to stop new use.
 * Already downloaded public derivatives cannot be recalled from a visitor's device. */
export const temporarySelectionPolicy = Object.freeze({version: 1, enabled: true, scope: "public-reference-only", revokedAssets: Object.freeze([])});
export function referenceSelection(policy = temporarySelectionPolicy) {
  if (policy?.enabled !== true || policy.scope !== "public-reference-only") return [];
  const revoked = new Set(policy.revokedAssets || []);
  return approvedSamples.filter(photo => !revoked.has(photo.assetID)).map(photo => structuredClone(photo));
}
export const temporarySelection = referenceSelection();
