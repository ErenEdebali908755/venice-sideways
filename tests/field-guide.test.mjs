import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {orderedVisits,copyFor} from '../public/field-guide/guide.js';
import {BASE_STYLE,GARDENS,landmarkFeatures,placeCopy,watercolorStyle} from '../public/field-guide/map-art.js';
import {ILLUSTRATIONS,ILLUSTRATION_PLACEMENTS} from '../public/field-guide/illustrations.js';
const {routes}=JSON.parse(await readFile(new URL('../public/field-guide/routes.json',import.meta.url),'utf8'));
const gardens=JSON.parse(await readFile(new URL('../public/field-guide/gardens.json',import.meta.url),'utf8'));
test('field guide keeps Main and Full stop counts, independent order and eight prompt languages',()=>{
 assert.deepEqual(routes.map(r=>r.key),['main','full']);
 assert.deepEqual(routes.map(r=>orderedVisits(r).length),[11,28]);
 for(const route of routes) for(const visit of orderedVisits(route)) {
  assert.equal(visit.ideas.length,5);
  for(const idea of visit.ideas) for(const locale of ['en','tr','it','fr','ru','zh','ja','ko'])assert.ok(idea.copy.find(c=>c.locale===locale)?.text,`${visit.key} ${locale}`);
 }
 const changed=structuredClone(routes[0]);changed.visits[0].visible=false;
 assert.equal(orderedVisits(changed)[0].key,'giacomo');
 assert.equal(orderedVisits(routes[0])[0].key,'lucia');
});
test('requested language uses its own content and safely falls back to English',()=>{
 const rows=[{locale:'en',title:'English'},{locale:'tr',title:'Türkçe'}];
 assert.equal(copyFor(rows,'tr').title,'Türkçe');assert.equal(copyFor(rows,'missing').title,'English');assert.deepEqual(copyFor(undefined,'tr'),{});
});
test('unreviewed translations never appear in a visitor fallback',()=>{
 const rows=[{locale:'en',title:'English',needsReview:false},{locale:'tr',title:'Old Turkish',needsReview:true}];
 assert.equal(copyFor(rows,'tr').title,'English');
 assert.deepEqual(copyFor([{locale:'en',title:'Unreviewed',needsReview:true}],'en'),{});
 assert.equal(copyFor([{locale:'tr',title:'Source',needsReview:false}],'it','tr').title,'Source');
 assert.deepEqual(copyFor([{locale:'tr',title:'Unreviewed source',needsReview:true}],'it','tr'),{});
});
test('watercolor presentation preserves provider geometry, sources and attribution',()=>{
 const base={version:8,sources:{openmaptiles:{type:'vector',url:'https://tiles.openfreemap.org/planet',attribution:'OpenStreetMap contributors'}},layers:[
  {id:'water',type:'fill',source:'openmaptiles','source-layer':'water',paint:{'fill-color':'#ccc'},filter:['==',['get','class'],'lake']},
  {id:'bridge',type:'line',source:'openmaptiles','source-layer':'transportation',paint:{'line-width':3}},
  {id:'shop-label',type:'symbol',source:'openmaptiles','source-layer':'poi',layout:{'text-field':['get','name']}},
 ]};
 const snapshot=structuredClone(base),style=watercolorStyle(base);
 assert.deepEqual(base,snapshot,'shared provider style is not mutated');
 assert.deepEqual(style.sources,base.sources,'tile source and credits stay intact');
 assert.deepEqual(style.layers.map(({id,type,source,filter,...rest})=>({id,type,source,filter})),base.layers.map(({id,type,source,filter,...rest})=>({id,type,source,filter})), 'presentation cannot move streets, bridges or features');
 assert.notEqual(style.layers[0].paint['fill-color'],base.layers[0].paint['fill-color']);
 assert.equal(style.metadata['venice-sideways:base'],BASE_STYLE);
 assert.throws(()=>watercolorStyle({version:8,sources:{},layers:[]}),/vector source/);
});
test('art landmarks use each verified walk’s coordinates and never become extra numbered stops',()=>{
 const main=routes.find(route=>route.key==='main'),features=landmarkFeatures(main);
 assert.equal(features.length,10,'Main has eleven visit identities; the unreviewed Tre Archi artwork stays hidden');
 assert.equal(new Set(features.map(feature=>feature.properties.key)).size,10);
 for(const feature of features){
  const visit=main.visits.find(visit=>visit.key===feature.properties.key);
  assert.deepEqual(feature.properties.visitCoordinate,[visit.longitude,visit.latitude]);
  assert.deepEqual(feature.geometry.coordinates,feature.properties.artAnchor||feature.properties.visitCoordinate);
  assert.equal(feature.geometry.type,'Point');
  assert.equal(feature.properties.number,undefined);
 }
 const full=routes.find(route=>route.key==='full');
 assert.equal(landmarkFeatures(full).length,28,'all Full visit identities have approved artwork; Tre Archi is not a Full stop');
 for(const feature of landmarkFeatures(full)){
  const visit=full.visits.find(visit=>visit.key===feature.properties.visitKey);
  assert.equal(visit.placeKey,feature.properties.key);
  assert.deepEqual(feature.properties.visitCoordinate,[visit.longitude,visit.latitude],'Full retains its own visit geography independently of illustration references');
  assert.equal(feature.properties.number,undefined);
 }
 assert.deepEqual(landmarkFeatures({key:'main',visits:[]}),[],'missing coordinates do not produce invented locations');
 assert.equal(ILLUSTRATIONS.length,30);
 assert.equal(ILLUSTRATION_PLACEMENTS.length,39);
 assert.deepEqual(ILLUSTRATIONS.filter(asset=>!asset.approved).map(asset=>asset.key),['trearchi']);
 assert.equal(features.some(feature=>feature.properties.key==='trearchi'),false);
 assert.equal(GARDENS.length,2);
 assert.ok(placeCopy('dogana','tr').text);
 assert.equal(placeCopy('dogana','ja').text,placeCopy('dogana','en').text,'missing art copy uses explicit English fallback');
 assert.equal(placeCopy('unknown','tr'),null);
});
test('garden artwork stays within the two attributed OSM polygon boundaries',()=>{
 assert.equal(gardens.type,'FeatureCollection');
 assert.equal(gardens.source,'OpenStreetMap contributors');
 assert.equal(gardens.license,'ODbL-1.0');
 assert.match(gardens.retrieved,/^\d{4}-\d{2}-\d{2}$/);
 assert.deepEqual(gardens.features.map(feature=>feature.properties.osmWayId),['174476472','4715855']);
 for(const feature of gardens.features){
  assert.equal(feature.geometry.type,'Polygon');
  assert.equal(feature.geometry.coordinates.length,1);
  const ring=feature.geometry.coordinates[0];
  assert.ok(ring.length>50,'true mapped boundary, not a decorative rectangle');
  assert.deepEqual(ring[0],ring.at(-1),'boundary is closed');
  for(const [longitude,latitude] of ring){
   assert.ok(longitude>12.31&&longitude<12.34);
   assert.ok(latitude>45.43&&latitude<45.45);
  }
 }
});
