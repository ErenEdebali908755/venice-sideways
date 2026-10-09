export const MAX_GALLERY_PHOTOS = 12;
const CONTENT_KINDS = new Set(["stop-view", "inspiration", "historic", "context"]);
/** A reference is never promoted to a view of a stop by a presentation label. */
export function photoContentKind(photo) {
  if (photo?.referenceOnly === true) return "inspiration";
  return CONTENT_KINDS.has(photo?.contentKind) ? photo.contentKind : "stop-view";
}
const legacyID = url => {
  let value = 2166136261;
  for (const character of url) value = Math.imul(value ^ character.charCodeAt(0), 16777619);
  return "legacy-" + (value >>> 0).toString(16);
};
export function galleryForVisit(visit) {
  if (Array.isArray(visit?.gallery)) return visit.gallery.slice(0, MAX_GALLERY_PHOTOS).filter(photo => photo && photo.revoked !== true && photo.removed !== true && typeof photo.assetID === "string" && Array.isArray(photo.derivatives) && photo.derivatives.length).sort((a, b) => a.order - b.order || a.assetID.localeCompare(b.assetID));
  const photo = visit?.photo;
  if (photo?.revoked === true || photo?.removed === true || !photo?.url || photo.url.endsWith("/field-guide/venice-illustration.png")) return [];
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

/** Stop photographs must be assigned to this visit; archive samples are separate. */
export function photosForVisit(visit) {
  return galleryForVisit(visit).filter(photo => photoContentKind(photo) !== "inspiration");
}

/** Call only from an explicitly labelled inspiration gallery, never a stop cover. */
export function inspirationPhotosForVisit(visit, references = []) {
  const denied = new Set((Array.isArray(visit?.gallery) ? visit.gallery : [])
    .filter(photo => photo?.revoked === true || photo?.removed === true)
    .map(photo => photo.assetID));
  const candidates = [...galleryForVisit(visit).filter(photo => photoContentKind(photo) === "inspiration"),
    ...galleryForVisit({ gallery: references.filter(photo => photo?.referenceOnly === true) })];
  const seen = new Set();
  return candidates.filter(photo => {
    if (denied.has(photo.assetID) || seen.has(photo.assetID)) return false;
    seen.add(photo.assetID);
    return true;
  }).slice(0, MAX_GALLERY_PHOTOS);
}
