import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {photosByPlace, photoForPlace} from '../public/field-guide/stop-photos.js';
import {photosForVisit, galleryText} from '../public/field-guide/gallery.js';

const placeKeys=['lucia','giacomo','frari','margherita','barnaba','trovaso','zattere','dogana','accademia','trearchi','vino'];
const locales=['en','tr','it','fr','ru','zh','ja','ko'];
const publicRoot=new URL('../public/',import.meta.url);
const manifest=JSON.parse(await readFile(new URL('../docs/MAIN-WALK-PHOTO-SOURCES-20261009.json',import.meta.url),'utf8'));

function jpegSize(bytes){
 assert.equal(bytes.readUInt16BE(0),0xffd8);
 let offset=2;
 while(offset<bytes.length){
  assert.equal(bytes[offset],0xff);
  while(bytes[offset]===0xff)offset++;
  const marker=bytes[offset++];
  if(marker===0xd9||marker===0xda)break;
  const length=bytes.readUInt16BE(offset);
  if([0xc0,0xc1,0xc2].includes(marker))return {height:bytes.readUInt16BE(offset+3),width:bytes.readUInt16BE(offset+5)};
  offset+=length;
 }
 throw new Error('JPEG has no supported dimensions marker');
}

test('eleven exact licensed photo files match their recorded bytes, dimensions and place relationships',async()=>{
 assert.deepEqual(Object.keys(photosByPlace),placeKeys);
 assert.equal(manifest.records.length,11);
 const files=await readdir(new URL('field-guide/photos/main-20261009/',publicRoot));
 assert.equal(files.length,11);
 for(const placeKey of placeKeys){
  const photo=photosByPlace[placeKey], evidence=manifest.records.find(row=>row.placeKey===placeKey);
  assert.equal(photo.placeKey,placeKey);
  assert.equal(photo.referenceOnly,false);
  assert.equal(evidence.publicEligible,true);
  assert.equal(photo.assetID,evidence.assetID);
  assert.match(photo.assetID,/^commons-\d+$/);
  for(const [property,value] of [['credit',evidence.photographer],['sourceURL',evidence.sourceURL],['licenseLabel',evidence.licenseLabel],['licenseURL',evidence.licenseURL]])assert.equal(photo[property],value);
  assert.match(photo.sourceURL,/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
  assert.ok(['CC BY-SA 3.0','CC BY-SA 4.0','CC BY 4.0','CC0','Public domain'].includes(photo.licenseLabel));
  assert.match(evidence.original.sha1FromCommons,/^[a-f0-9]{40}$/);
  assert.ok(evidence.identityCheck.length>40);
  assert.equal(evidence.review.humanEditorialApproval,false);
  assert.equal(photo.derivatives.length,1);
  const derivative=photo.derivatives[0];
  assert.equal(derivative.url,evidence.publicDerivative.path);
  const bytes=await readFile(new URL(derivative.url.slice(1),publicRoot));
  const sha=createHash('sha256').update(bytes).digest('hex');
  assert.equal(sha,evidence.publicDerivative.sha256);
  assert.equal(sha.slice(0,16),photo.derivativeVersion);
  assert.ok(derivative.url.includes(sha.slice(0,12)));
  assert.equal(bytes.length,evidence.publicDerivative.bytes);
  assert.deepEqual(jpegSize(bytes),{width:derivative.width,height:derivative.height});
  assert.ok(derivative.width>=900);
  assert.deepEqual(photo.copy.map(row=>row.locale),locales);
  for(const locale of locales){
   const text=galleryText(photo,locale);
   assert.equal(text.locale,locale);
   assert.ok(text.alt.length>15);
   assert.match(text.caption,/20\d\d/);
  }
 }
});

test('Vino Vero is explicitly immediate surroundings, never an asserted bar facade',()=>{
 const photo=photosByPlace.vino;
 assert.equal(photo.contentKind,'context');
 assert.equal(manifest.records.find(row=>row.placeKey==='vino').facadeIdentified,false);
 assert.match(galleryText(photo,'en').caption,/bar facade is not identified/);
 assert.match(galleryText(photo,'tr').caption,/barın cephesi doğrulanmış değil/);
 for(const key of placeKeys.filter(key=>key!=='vino'))assert.equal(photosByPlace[key].contentKind,'stop-view');
});

test('the photo registry never overrides an administrator-empty or revoked gallery',()=>{
 for(const placeKey of placeKeys){
  const photo=photoForPlace(placeKey);
  assert.notEqual(photo,photosByPlace[placeKey]);
  assert.deepEqual(photosForVisit({placeKey,gallery:[]}),[]);
  assert.deepEqual(photosForVisit({placeKey,gallery:[{...photo,revoked:true}]}),[]);
  assert.deepEqual(photosForVisit({placeKey,gallery:[{...photo,removed:true}]}),[]);
  assert.deepEqual(photosForVisit({placeKey}),[]);
  photo.credit='Unrelated edit';
  assert.notEqual(photosByPlace[placeKey].credit,'Unrelated edit');
 }
 assert.equal(photoForPlace('not-a-registered-place'),null);
});
