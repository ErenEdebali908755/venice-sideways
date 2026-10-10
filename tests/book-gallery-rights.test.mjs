import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createServer} from '../server.mjs';
import {photosForVisit} from '../public/field-guide/gallery.js';
import {temporarySelection} from '../public/field-guide/temporary-selection.js';
import {photosByPlace} from '../public/field-guide/stop-photos.js';

test('the 38 bundled visits use only explicitly verified place photographs; all route content and geography are retained',async()=>{
 const {routes}=JSON.parse(await readFile(new URL('../public/field-guide/routes.json',import.meta.url),'utf8'));
 assert.deepEqual(routes.map(route=>[route.key,route.visits.length]),[['main',10],['full',28]]);
 assert.equal(new Set(routes.flatMap(route=>route.visits.map(visit=>visit.placeKey))).size,29);
 assert.equal(routes.reduce((count,route)=>count+route.visits.reduce((n,visit)=>n+visit.ideas.length,0),0),190);
 let assigned=0;
 for(const route of routes)for(const visit of route.visits){
  const expected=photosByPlace[visit.placeKey];
  assert.deepEqual(visit.gallery,expected?[expected]:[]);
  assert.deepEqual(photosForVisit(visit,temporarySelection),expected?[expected]:[]);
  if(expected)assigned++;
 }
 assert.equal(assigned,19);
 // Main endpoint change reviewed 10 October 2026; includes identities, order, every
 // coordinate, all stop/idea copy and segment geometry, not presentation metadata.
 const critical=routes.map(route=>({key:route.key,sourceLanguage:route.sourceLanguage,visits:route.visits.map(visit=>Object.fromEntries(['key','placeKey','order','longitude','latitude','segmentKey','copy','ideas'].map(key=>[key,visit[key]]))),segments:route.segments}));
 assert.equal(createHash('sha256').update(JSON.stringify(critical)).digest('hex'),'e5a0719d342ca6dea72df7455779ff49f42838f568c5172179b24c895600079e');
});

test('book sources and private assessment material are not reachable through the real anonymous visitor server',async()=>{
 const server=await createServer();await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
 const base='http://127.0.0.1:'+server.address().port;
 try{
  for(const path of ['/ASSET-MANIFEST.json','/DURAK_GORSEL_ESLESTIRME_30.json','/book-assets/venice/manifest.json','/book-assets/gardens/manifest.json','/book-assets/venice/originals/oso-9780190859985-graphic-124-colour.jpg','/book-assets/gardens/originals/named-garden-context/gardens-reali-pergola-pg074.jpg','/preview/KITAPTAN_SECILEN_GORSELLER.jpg','/research/file-license-verification.json','/field-guide/book-assets/venice/manifest.json','/.data/book-assets/venice/manifest.json','/outputs/book-stop-walking-20261009/ASSET-MANIFEST.json','/%2e%2e/book-stop-walking-20261009/ASSET-MANIFEST.json']){
   const response=await fetch(base+path);assert.equal(response.status,404,path);assert.equal(await response.text(),'Not found',path);
  }
  const response=await fetch(base+'/field-guide/routes.json');assert.equal(response.status,200);const body=await response.text();
  assert.doesNotMatch(body,/book-assets|epubImageHref|venice-plate-|venice-figure-|gardens-reali-|KITAPTAN_SECILEN|\.epub|reference-eren-/);
 }finally{await new Promise(resolve=>server.close(resolve));}
});
