export const MAX_GALLERY_PHOTOS = 12;
const legacyID = url => {
  let value = 2166136261;
  for (const character of url) value = Math.imul(value ^ character.charCodeAt(0), 16777619);
  return "legacy-" + (value >>> 0).toString(16);
};
export function galleryForVisit(visit) {
  if (Array.isArray(visit?.gallery)) return visit.gallery.slice(0, MAX_GALLERY_PHOTOS).filter(photo => photo && typeof photo.assetID === "string" && Array.isArray(photo.derivatives) && photo.derivatives.length).sort((a, b) => a.order - b.order || a.assetID.localeCompare(b.assetID));
  const photo = visit?.photo;
  if (!photo?.url || photo.url.endsWith("/field-guide/venice-illustration.png")) return [];
  return [{ assetID: legacyID(photo.url), derivativeVersion: "legacy", order: 0, cover: true, focalPoint: { x: photo.x ?? 50, y: photo.y ?? 50 }, sourceLanguage: "en", textRevision: 1, copy: [{ locale: "en", alt: photo.alt || "", caption: "" }, { locale: "tr", alt: photo.altTr || photo.alt || "", caption: "" }], credit: photo.credit || "", derivatives: [{ variant: "legacy", url: photo.url, width: photo.width || 0, height: photo.height || 0 }], referenceOnly: photo.referenceOnly === true }];
}
export const galleryText = (photo, language) => {
  const rows = photo?.copy?.filter(row => row?.needsReview !== true) || [];
  return rows.find(row => row.locale === language) || rows.find(row => row.locale === "en") || rows.find(row => row.locale === photo.sourceLanguage) || {};
};
export const coverPhoto = photos => photos.find(photo => photo.cover) || photos[0];
export function imageVariant(photo, width = 900) {
  const sizes = [...(photo?.derivatives || [])].sort((a, b) => a.width - b.width);
  return sizes.find(item => item.width >= width) || sizes.at(-1);
}
