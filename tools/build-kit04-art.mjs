/** Reproducible Kit 04 derivatives. Original masters remain outside the public renderer. */
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const option = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
const kit = resolve(option('--kit', resolve(root, '../venice-sideways-unified-visual-kit-04-2026-10-06')));
const admin = resolve(option('--admin', resolve(root, '../eren-visual-archive')));
const require = createRequire(resolve(admin, 'package.json'));
const sharp = require('sharp');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const registryBytes = await readFile(resolve(kit, 'additions/registries/illustration-registry.json'));
const registry = JSON.parse(registryBytes);
const placementBytes = await readFile(resolve(kit, 'additions/registries/route-placement-registry.json'));
const placements = JSON.parse(placementBytes).placements;
const canonicalBytes = await readFile(resolve(root, 'public/field-guide/routes.json'));
const canonical = JSON.parse(canonicalBytes).routes;
const output = resolve(root, 'public/field-guide/art');
await mkdir(output, { recursive: true });
if (registry.assets.length !== 30 || new Set(registry.assets.map(row => row.placeKey)).size !== 30 || placements.length !== 39)
  throw Error('The supplied Kit 04 must contain 30 unique assets and 39 route placements.');
function bounds(data, width, height, channels, threshold = 0) {
  let x0 = width, y0 = height, x1 = -1, y1 = -1, visible = 0, transparent = 0;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const alpha = data[(y * width + x) * channels + channels - 1];
    if (alpha === 0) transparent++;
    if (threshold === 0 ? alpha > 0 : alpha >= threshold) { visible++; x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  }
  if (!visible) throw Error('Illustration has no visible subject.');
  return { box: [x0, y0, x1 + 1, y1 + 1], visible, transparent };
}
const coordinateDifferences = [];
for (const placement of placements) {
  const route = canonical.find(row => row.key === placement.route);
  const visit = route?.visits.find(row => row.key === placement.visitKey);
  if (!visit || !registry.assets.some(row => row.placeKey === placement.placeKey)) throw Error(`Unresolved asset placement: ${placement.route}/${placement.visitKey}`);
  if (visit.longitude !== placement.longitude || visit.latitude !== placement.latitude)
    coordinateDifferences.push({ route: placement.route, visitKey: placement.visitKey, reason: 'Historical pack coordinate differs; the actual route remains authoritative.' });
}
const assets = [];
for (const asset of registry.assets) {
  if (!/^[a-z0-9-]+$/.test(asset.placeKey)) throw Error('Unsafe asset key.');
  const original = await readFile(resolve(kit, asset.master));
  if (hash(original) !== asset.sha256) throw Error(`Master checksum mismatch: ${asset.placeKey}`);
  const meta = await sharp(original).metadata();
  if (!meta.hasAlpha || meta.width !== asset.naturalWidth || meta.height !== asset.naturalHeight) throw Error(`Master dimensions or alpha mismatch: ${asset.placeKey}`);
  const decoded = await sharp(original).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = decoded.info;
  const strict = bounds(decoded.data, width, height, channels);
  const visible = bounds(decoded.data, width, height, channels, 16);
  if (JSON.stringify(strict.box) !== JSON.stringify(asset.strictAlphaBoundsPx) || JSON.stringify(visible.box) !== JSON.stringify(asset.visibleAlpha16BoundsPx))
    throw Error(`Recorded alpha bounds differ from decoded master: ${asset.placeKey}`);
  const cornerAlpha = [0, width - 1, (height - 1) * width, width * height - 1].map(index => decoded.data[index * channels + channels - 1]);
  if (JSON.stringify(cornerAlpha) !== JSON.stringify(asset.cornerAlpha) || cornerAlpha.some(alpha => alpha > 16) || !strict.transparent) throw Error(`Master exterior differs from its recorded transparent wash: ${asset.placeKey}`);
  // Trim only completely transparent outside rows/columns; never trim painted pixels or edit alpha.
  const [left, top, right, bottom] = strict.box;
  const crop = { left, top, width: right - left, height: bottom - top };
  const visibleSpan = Math.max(visible.box[2] - visible.box[0], visible.box[3] - visible.box[1]);
  const derivatives = {};
  for (const [variant, target, pixelRatio] of [['map1x', 160, 1], ['map2x', 320, 2], ['card', 640, 1]]) {
    const scale = Math.min(1, target / visibleSpan);
    const longAxis = crop.width >= crop.height ? 'width' : 'height';
    const size = Math.max(1, Math.round(crop[longAxis] * scale));
    const bytes = await sharp(original).extract(crop).resize({ [longAxis]: size, withoutEnlargement: true }).png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();
    const sha256 = hash(bytes), file = `kit-${asset.placeKey}-${variant}-${sha256.slice(0, 12)}.png`;
    const result = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const rb = bounds(result.data, result.info.width, result.info.height, result.info.channels, 16);
    const resultMeta = await sharp(bytes).metadata();
    if (!resultMeta.hasAlpha || !rb.transparent || Math.max(rb.box[2] - rb.box[0], rb.box[3] - rb.box[1]) > target + 2)
      throw Error(`Derivative alpha or visible budget failed: ${asset.placeKey}/${variant}`);
    await writeFile(resolve(output, file), bytes);
    derivatives[variant] = { file: 'art/' + file, sha256, bytes: bytes.length, width: result.info.width, height: result.info.height, pixelRatio,
      visibleAlpha16BoundsPx: rb.box, targetVisibleSpanPx: target, sourcePaintedAspect: crop.width / crop.height,
      aspectErrorPx: Math.abs(result.info.width / result.info.height - crop.width / crop.height) * result.info.height };
  }
  assets.push({ placeKey: asset.placeKey, title: asset.title, kind: 'kit-' + asset.placeKey,
    approved: !asset.humanSpecificReviewRequired, humanSpecificReviewRequired: asset.humanSpecificReviewRequired,
    illustrationNotPhotograph: true, classification: 'AI watercolor illustration; reference-checked candidate, not surveyed architecture or route geometry',
    reviewProvenance: 'Reference identity inherited from the supplied package. Implementation checks file identity, full painted alpha bounds and reduced derivatives; no new human architectural approval is claimed.',
    source: { file: asset.master, sha256: asset.sha256, width, height, alpha: true, cornerAlpha, strictAlphaBoundsPx: strict.box, visibleAlpha16BoundsPx: visible.box,
      croppedTransparentExteriorPx: crop },
    qa: { status: asset.qa.status, referencePath: asset.qa.referencePath, sourceLinks: asset.qa.referenceSourceLinks,
      architecturalChecks: asset.qa.architecturalChecks, caveats: asset.qa.caveats },
    derivatives });
}
const manifest = { schemaVersion: 1, version: '20261006-kit04', source: 'User supplied venice-sideways-unified-visual-kit-04-2026-10-06',
  registrySHA256: hash(registryBytes), placementRegistrySHA256: hash(placementBytes),
  mastersPubliclyCopied: false, runtimePreloadsAllMasters: false, originalAlphaEdited: false,
  cropPolicy: 'Only fully transparent exterior outside the strict nonzero-alpha bounding box is removed. Every painted source pixel remains represented; resizing preserves its aspect to raster rounding.',
  coordinateAuthority: 'Current canonical route payload; source pack placements are a mapping reference and are never written into routes.',
  coordinateDifferences, routePlacements: placements.map(({ route, visitKey, placeKey }) => ({ route, visitKey, placeKey })),
  assets };
await writeFile(resolve(output, 'illustrations-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
const catalog = assets.map(asset => {
  const { map1x, map2x, card } = asset.derivatives;
  return { key: asset.placeKey, title: asset.title, kind: asset.kind, approved: asset.approved,
    humanSpecificReviewRequired: asset.humanSpecificReviewRequired, illustrationNotPhotograph: true,
    url: map2x.file, width: map2x.width, height: map2x.height, pixelRatio: 2,
    url1x: map1x.file, width1x: map1x.width, height1x: map1x.height,
    cardURL: card.file, cardWidth: card.width, cardHeight: card.height,
    sha256: map2x.sha256, visibleAlpha16BoundsPx: map2x.visibleAlpha16BoundsPx };
});
await writeFile(resolve(root, 'public/field-guide/illustrations.js'), `// Generated by tools/build-kit04-art.mjs; AI artwork is separate from route geometry and photographs.\nconst rows = ${JSON.stringify(catalog, null, 2)};\nexport const ILLUSTRATIONS = Object.freeze(rows.map(row => Object.freeze({ ...row, url: new URL(row.url, import.meta.url).href, url1x: new URL(row.url1x, import.meta.url).href, cardURL: new URL(row.cardURL, import.meta.url).href })));\nexport const ILLUSTRATION_PLACEMENTS = Object.freeze(${JSON.stringify(manifest.routePlacements)}.map(row => Object.freeze(row)));\n`);
console.log(JSON.stringify({ status: 'kit04-derivatives-verified', assets: assets.length, approved: assets.filter(asset => asset.approved).length,
  held: assets.filter(asset => !asset.approved).map(asset => asset.placeKey), derivatives: assets.length * 3, routePlacements: placements.length,
  coordinateDifferences: coordinateDifferences.length, bytes: assets.reduce((total, asset) => total + Object.values(asset.derivatives).reduce((sum, derivative) => sum + derivative.bytes, 0), 0),
  manifestSHA256: hash(await readFile(resolve(output, 'illustrations-manifest.json'))), canonicalRouteSHA256AtBuild: hash(canonicalBytes) }));
