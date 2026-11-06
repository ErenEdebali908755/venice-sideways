import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {mainPhotoAdditions, mainGalleryForPlace} from '../public/field-guide/main-photo-additions.js';
import {photosByPlace} from '../public/field-guide/stop-photos.js';
import {galleryText, photosForVisit, coverPhoto, imageVariant} from '../public/field-guide/gallery.js';
const root=new URL('../public/',import.meta.url);
const manifest=JSON.parse(await readFile(new URL('../docs/MAIN-WALK-PHOTO-ADDITIONS-20261010.json',import.meta.url),'utf8'));
const {routes}=JSON.parse(await readFile(new URL('field-guide/routes.json',root),'utf8'));
const main=routes.find(route=>route.key==='main');
const locales=['en','tr','it','fr','ru','zh','ja','ko'];
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
function webpDimensions(bytes){
 assert.equal(bytes.toString('ascii',0,4),'RIFF');
 assert.equal(bytes.toString('ascii',8,12),'WEBP');
 let size;
 for(let offset=12;offset+8<=bytes.length;){
  const kind=bytes.toString('ascii',offset,offset+4), length=bytes.readUInt32LE(offset+4), data=bytes.subarray(offset+8,offset+8+length);
  assert.ok(!['EXIF','XMP ','ICCP'].includes(kind),'Derivatives must not embed extra metadata');
  if(kind==='VP8 ')size={width:data.readUInt16LE(6)&0x3fff,height:data.readUInt16LE(8)&0x3fff};
  offset+=8+length+(length%2);
 }
 assert.ok(size,'A lossy WebP image frame must be present');return size;
}
test('Main visits explicitly contain 1–3 real photos, retaining each existing cover first',()=>{
 assert.deepEqual(Object.keys(mainPhotoAdditions),main.visits.map(v=>v.placeKey));
 assert.equal(manifest.records.length,20);
 for(const visit of main.visits){
  const expected=mainGalleryForPlace(visit.placeKey);
  assert.ok(visit.gallery.length>=1&&visit.gallery.length<=3);
  assert.equal(visit.gallery.length,3);
  assert.deepEqual(visit.gallery,expected);
  assert.deepEqual(visit.gallery[0],photosByPlace[visit.placeKey]);
  assert.equal(coverPhoto(photosForVisit(visit)).assetID,photosByPlace[visit.placeKey].assetID);
  assert.equal(new Set(visit.gallery.map(p=>p.assetID)).size,visit.gallery.length);
  assert.deepEqual(visit.gallery.map(p=>p.order),[0,1,2]);
  assert.deepEqual(visit.gallery.map(p=>p.cover),[true,false,false]);
 }
 assert.deepEqual(mainGalleryForPlace('vino'),[]);
 assert.deepEqual(mainGalleryForPlace('unknown'),[]);
});
test('all 20 additions have exact open-license provenance, visual identity and eight reviewed localized text rows',()=>{
 const all=Object.values(mainPhotoAdditions).flat();
 assert.equal(new Set(all.map(p=>p.assetID)).size,20);
 for(const photo of all){
  const evidence=manifest.records.find(row=>row.assetID===photo.assetID);
  assert.ok(evidence);assert.equal(evidence.placeKey,photo.placeKey);assert.equal(evidence.publicEligible,true);
  for(const [key,value] of [['credit',evidence.photographer],['sourceURL',evidence.sourceURL],['licenseLabel',evidence.licenseLabel],['licenseURL',evidence.licenseURL]])assert.equal(photo[key],value);
  assert.match(photo.sourceURL,/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
  assert.ok(['CC BY-SA 4.0','CC BY-SA 3.0','CC BY-SA 2.5 ca','CC BY 4.0','CC0 1.0'].includes(photo.licenseLabel));
  assert.match(photo.licenseURL,/^https:\/\/creativecommons\.org\/(licenses|publicdomain)\//);
  assert.ok(evidence.sourcePageRevision.revid>0);assert.ok(evidence.identityCheck.length>70);
  assert.match(evidence.original.sha1FromCommons,/^[a-f0-9]{40}$/);
  assert.match(evidence.downloadedSource.sha256,/^[a-f0-9]{64}$/);
  assert.equal(photo.referenceOnly,false);assert.equal(photo.cover,false);
  if(evidence.coordinates)assert.ok(evidence.coordinates.distanceToBundledStopMetres<=150);
  assert.deepEqual(photo.copy.map(row=>row.locale),locales);
  for(const locale of locales){
   const copy=galleryText(photo,locale);assert.equal(copy.locale,locale);assert.equal(copy.needsReview,false);
   for(const key of ['title','alt','caption'])assert.ok(copy[key].length>(key==='title'?5:12));
   assert.match(copy.caption,/20\d\d$/);
  }
  if(photo.placeKey==='dogana')assert.equal(evidence.review.exteriorOnly,true);
 }
});
test('40 metadata-free 800/1600 WebP files match recorded hashes, dimensions and mobile/large selection',async()=>{
 const files=await readdir(new URL('field-guide/photos/main-20261010/',root));assert.equal(files.length,40);
 let bytes=0;
 for(const photo of Object.values(mainPhotoAdditions).flat()){
  const evidence=manifest.records.find(row=>row.assetID===photo.assetID);
  assert.deepEqual(photo.derivatives.map(d=>d.width),[800,1600]);
  assert.equal(imageVariant(photo,800).width,800);assert.equal(imageVariant(photo,1600).width,1600);
  assert.equal(photo.derivativeVersion,sha(evidence.publicDerivatives.map(d=>d.sha256).join('')).slice(0,16));
  for(const derivative of photo.derivatives){
   const record=evidence.publicDerivatives.find(d=>d.url===derivative.url),file=await readFile(new URL(derivative.url.slice(1),root));
   assert.equal(sha(file),record.sha256);assert.equal(file.length,record.bytes);bytes+=file.length;
   assert.ok(derivative.url.includes(record.sha256.slice(0,12)));
   assert.deepEqual(webpDimensions(file),{width:derivative.width,height:derivative.height});
  }
 }
 assert.equal(bytes,manifest.byteSummary.addedPhotoBytes);
});
test('explicit gallery selection never populates empty, revoked or Full galleries',()=>{
 for(const key of Object.keys(mainPhotoAdditions)){
  assert.deepEqual(photosForVisit({placeKey:key,gallery:[]}),[]);
  assert.deepEqual(photosForVisit({placeKey:key}),[]);
  assert.deepEqual(photosForVisit({placeKey:key,gallery:mainPhotoAdditions[key].map(p=>({...p,revoked:true}))}),[]);
 }
 const extraIDs=new Set(Object.values(mainPhotoAdditions).flat().map(p=>p.assetID));
 for(const visit of routes.find(r=>r.key==='full').visits)for(const photo of visit.gallery)assert.ok(!extraIDs.has(photo.assetID));
 const clone=mainGalleryForPlace('lucia');clone[1].credit='Changed';assert.notEqual(mainPhotoAdditions.lucia[0].credit,'Changed');
});
