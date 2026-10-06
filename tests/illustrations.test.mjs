import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { inflateSync } from 'node:zlib';
import { ILLUSTRATIONS, ILLUSTRATION_PLACEMENTS } from '../public/field-guide/illustrations.js';
const directory = new URL('../public/field-guide/', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('art/illustrations-manifest.json', directory), 'utf8'));
const routes = JSON.parse(await readFile(new URL('routes.json', directory), 'utf8')).routes;

// Decode actual PNG filters and alpha; metadata alone cannot prove a transparent bitmap.
function decodeAlpha(bytes) {
  assert.deepEqual(bytes.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  let width, height, bits, color, end = false; const blocks = [];
  for (let offset = 8; offset < bytes.length;) {
    const length = bytes.readUInt32BE(offset), type = bytes.toString('ascii', offset + 4, offset + 8);
    const chunk = bytes.subarray(offset + 8, offset + 8 + length);
    assert.ok(offset + 12 + length <= bytes.length, 'complete PNG chunk');
    if (type === 'IHDR') { width = chunk.readUInt32BE(0); height = chunk.readUInt32BE(4); bits = chunk[8]; color = chunk[9]; assert.equal(chunk[12], 0, 'non-interlaced output'); }
    if (type === 'IDAT') blocks.push(chunk);
    offset += length + 12; if (type === 'IEND') { end = true; assert.equal(offset, bytes.length); break; }
  }
  assert.ok(end); assert.equal(bits, 8); assert.equal(color, 6, 'RGBA preserves alpha');
  const stream = inflateSync(Buffer.concat(blocks)); const stride = width * 4;
  assert.equal(stream.length, height * (stride + 1));
  let previous = new Uint8Array(stride), zero = 0, painted = 0, translucent = 0;
  const paeth = (a, b, c) => { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); return pa <= pb && pa <= pc ? a : pb <= pc ? b : c; };
  for (let y = 0; y < height; y++) {
    const offset = y * (stride + 1), filter = stream[offset], row = new Uint8Array(stride); assert.ok(filter <= 4);
    for (let x = 0; x < stride; x++) {
      const left = x >= 4 ? row[x - 4] : 0, up = previous[x], corner = x >= 4 ? previous[x - 4] : 0;
      const predictor = filter === 0 ? 0 : filter === 1 ? left : filter === 2 ? up : filter === 3 ? Math.floor((left + up) / 2) : paeth(left, up, corner);
      row[x] = (stream[offset + 1 + x] + predictor) & 255;
    }
    for (let x = 3; x < stride; x += 4) { if (!row[x]) zero++; else painted++; if (row[x] > 0 && row[x] < 255) translucent++; }
    previous = row;
  }
  return { width, height, zero, painted, translucent };
}

test('Kit 04 has 30 transparent hash derivatives, 39 own-route mappings and an explicit Tre Archi hold', async () => {
  assert.equal(manifest.assets.length, 30); assert.equal(ILLUSTRATIONS.length, 30);
  assert.equal(manifest.assets.filter(asset => asset.approved).length, 29);
  assert.deepEqual(manifest.assets.filter(asset => !asset.approved).map(asset => asset.placeKey), ['trearchi']);
  assert.equal(ILLUSTRATIONS.find(asset => asset.key === 'trearchi').humanSpecificReviewRequired, true);
  assert.equal(ILLUSTRATION_PLACEMENTS.length, 39);
  for (const route of routes.filter(route => ['main', 'full'].includes(route.key))) {
    const mapped = ILLUSTRATION_PLACEMENTS.filter(row => row.route === route.key);
    assert.equal(mapped.length, route.visits.filter(visit => visit.isPhotoStop && visit.visible).length);
    for (const placement of mapped) { assert.ok(route.visits.some(visit => visit.key === placement.visitKey && visit.placeKey === placement.placeKey)); assert.ok(ILLUSTRATIONS.some(asset => asset.key === placement.placeKey)); }
  }
  assert.notEqual(routes.find(route => route.key === 'main').visits.find(visit => visit.key === 'lucia').latitude, routes.find(route => route.key === 'full').visits.find(visit => visit.key === 'lucia').latitude);
  const files = await readdir(new URL('art/', directory));
  assert.equal(files.filter(name => /^kit-.*\.png$/.test(name)).length, 90, 'only reduced 1x/2x/card assets are public');
  for (const asset of manifest.assets) {
    assert.equal(asset.illustrationNotPhotograph, true); assert.ok(asset.qa.sourceLinks.length);
    const exported = ILLUSTRATIONS.find(row => row.key === asset.placeKey);
    for (const [variant, derivative] of Object.entries(asset.derivatives)) {
      const bytes = await readFile(new URL(derivative.file, directory));
      assert.equal(createHash('sha256').update(bytes).digest('hex'), derivative.sha256);
      assert.ok(derivative.file.includes(derivative.sha256.slice(0, 12)));
      assert.equal(bytes.length, derivative.bytes);
      const decoded = decodeAlpha(bytes);
      assert.equal(decoded.width, derivative.width); assert.equal(decoded.height, derivative.height);
      assert.ok(decoded.zero && decoded.painted && decoded.translucent, `${asset.placeKey}/${variant} real transparency and wash`);
      assert.ok(derivative.aspectErrorPx <= 1.1, `${asset.placeKey}/${variant} preserves painted subject aspect within one raster pixel`);
    }
    assert.equal(exported.url, new URL(asset.derivatives.map2x.file, directory).href);
    assert.equal(exported.cardURL, new URL(asset.derivatives.card.file, directory).href);
  }
});
