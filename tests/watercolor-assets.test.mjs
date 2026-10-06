import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {ART_ASSETS,addWatercolorLayers,applyWatercolorPresentation,landmarkFeatures,loadWatercolorImages,setWatercolorLandmarks,watercolorLayout} from '../public/field-guide/map-art.js';

function mapFixture() {
 const sources=new Map(),images=new Map(),layers=new Map([
  ['background',{id:'background',type:'background'}],['highway_path',{id:'highway_path',type:'line'}],
  ['place-label',{id:'place-label',type:'symbol'}],['fg-halo',{id:'fg-halo',type:'line'}],
  ['fg-walk',{id:'fg-walk',type:'line'}],['fg-boat',{id:'fg-boat',type:'line'}],['fg-buildings',{id:'fg-buildings',type:'fill-extrusion',layout:{visibility:'none'}}],
 ]),pending=new Map();
 const calls={loads:[],updates:[],moves:[],layout:[]};
 return {sources,images,layers,pending,calls,
  getStyle:()=>({sources:{openmaptiles:{}},layers:[...layers.values()]}),getContainer:()=>({clientWidth:390,clientHeight:360}),
  getSource:id=>sources.get(id),addSource(id,data){sources.set(id,{...data,setData(value){this.data=value}})},
  hasImage:id=>images.has(id),addImage(id,data,options){assert.ok(!images.has(id));images.set(id,{data,options})},
  loadImage(url){calls.loads.push(url);return new Promise((resolve,reject)=>pending.set(url,{resolve,reject}))},
  updateImage(id,data){const old=images.get(id);assert.equal(data.width,old.data.width);assert.equal(data.height,old.data.height);old.data=data;calls.updates.push(id)},
  getLayer:id=>layers.get(id),addLayer(layer,before){layers.set(layer.id,layer);if(before)this.moveLayer(layer.id,before)},
  moveLayer(id,before){const layer=layers.get(id);assert.ok(layer);assert.ok(!before||layers.has(before));layers.delete(id);const ordered=[...layers.entries()];layers.clear();for(const [key,value]of ordered){if(key===before)layers.set(id,layer);layers.set(key,value)}if(!before)layers.set(id,layer);calls.moves.push([id,before])},
  getLayoutProperty:(id,name)=>layers.get(id)?.layout?.[name],setLayoutProperty(id,name,value){const layer=layers.get(id);layer.layout={...layer.layout,[name]:value};calls.layout.push([id,name,value])},
  getPaintProperty:(id,name)=>layers.get(id)?.paint?.[name],setPaintProperty(id,name,value){const layer=layers.get(id);layer.paint={...layer.paint,[name]:value}},
  setLayerZoomRange(id,minzoom,maxzoom){Object.assign(layers.get(id),{minzoom,maxzoom})},
 };
}
function canvasDocument() {
 return {createElement(){const canvas={width:0,height:0};const context=new Proxy({}, {get:(_,key)=>key==='getImageData'?(_x,_y,width,height)=>({width,height,data:new Uint8ClampedArray(width*height*4)}):()=>{}});canvas.getContext=()=>context;return canvas}};
}
test('only four bounded, content-addressed derivatives ship, with actual PNG dimensions',async()=>{
 let total=0;
 for(const asset of ART_ASSETS){const bytes=await readFile(new URL('../public'+asset.url,import.meta.url));total+=bytes.length;
  assert.equal(bytes.readUInt32BE(16),asset.width);assert.equal(bytes.readUInt32BE(20),asset.height);
  assert.ok(asset.url.includes(createHash('sha256').update(bytes).digest('hex').slice(0,12)));
 }
 assert.equal(ART_ASSETS.length,4);assert.ok(total<210_000);
});
test('bounded fallback registration is idempotent; garden, route/halo, art, and labels follow the new order',async()=>{
 const previous=globalThis.document;globalThis.document=canvasDocument();
 try{const map=mapFixture();assert.equal(addWatercolorLayers(map),true);
  for(const asset of ART_ASSETS){const id=asset.kind==='garden-leaves'?'fg-garden-leaves':`fg-art-${asset.kind}`;
   assert.deepEqual([map.images.get(id).data.width,map.images.get(id).data.height],[asset.width,asset.height]);assert.equal(map.images.get(id).options.pixelRatio,asset.pixelRatio);
  }
  const source=map.getSource('fg-landmarks'),moves=map.calls.moves.length;
  assert.equal(addWatercolorLayers(map),true,'an existing/partial style remains available to the common state application');
  assert.equal(map.getSource('fg-landmarks'),source);assert.equal(map.calls.moves.length,moves,'ready callback keeps an already correct order');
  const order=[...map.layers.keys()],before=(a,b)=>assert.ok(order.indexOf(a)<order.indexOf(b),`${a} before ${b}`);
  before('fg-garden-wash','fg-garden-grain');before('fg-garden-grain','highway_path');
  for(const route of ['fg-halo','fg-walk','fg-boat'])for(const art of ['fg-landmark-overview','fg-landmark-detail','fg-landmark-active'])before(route,art);
  before('fg-landmark-detail','place-label');before('fg-landmark-detail','fg-garden-label');
  assert.equal(map.layers.get('fg-landmark-detail').layout['icon-allow-overlap'],false);
  const asset=ART_ASSETS.find(row=>row.kind==='garden-leaves');map.pending.get(asset.url).resolve({data:{width:asset.width,height:asset.height}});
  await loadWatercolorImages(map,['garden-leaves']);assert.deepEqual(map.calls.updates,['fg-garden-leaves']);
 }finally{globalThis.document=previous}
});
test('both verified routes use their own visit anchors; unknown places/titles cannot invent a landmark',async()=>{
 const routes=JSON.parse(await readFile(new URL('../public/field-guide/routes.json',import.meta.url))).routes;
 const before=JSON.stringify(routes);const [main,full]=routes.map(landmarkFeatures);
 assert.equal(main.length,3);assert.equal(full.length,3);
 for(const route of routes)for(const feature of landmarkFeatures(route)){
  const visit=route.visits.find(v=>v.key===feature.properties.visitKey);
  assert.equal(feature.properties.placeKey,visit.placeKey);
  assert.deepEqual(feature.geometry.coordinates,[visit.longitude,visit.latitude]);
 }
 assert.notDeepEqual(main[0].geometry.coordinates,full[0].geometry.coordinates,'Full has its own Santa Lucia anchor');
 assert.equal(JSON.stringify(routes),before,'route/visit/segment data remains unchanged');
 assert.deepEqual(landmarkFeatures({key:'other',visits:routes[0].visits}),[]);
 assert.deepEqual(landmarkFeatures({key:'full',visits:[{key:'unverified',copy:[{locale:'en',title:'Punta della Dogana'}],longitude:12.3,latitude:45.4}]}),[]);
 assert.deepEqual(landmarkFeatures({key:'full',visits:[{key:'dogana',placeKey:'other-place',longitude:12.3,latitude:45.4}]}),[]);
});
test('Main and Full share deduplicated optional asset requests',async()=>{
 const map=mapFixture();map.sources.set('fg-landmarks',{setData(){}});for(const asset of ART_ASSETS)map.images.set('fg-art-'+asset.kind,{data:asset});
 setWatercolorLandmarks(map,{key:'full',visits:[]});assert.equal(map.calls.loads.length,0);
 setWatercolorLandmarks(map,{key:'full',visits:[{key:'lucia',placeKey:'lucia',latitude:45.4,longitude:12.3}]});assert.equal(map.calls.loads.length,1);
 const first=loadWatercolorImages(map,['station','bridge']),second=loadWatercolorImages(map,['station']);
 assert.equal(map.calls.loads.length,2);
 for(const asset of ART_ASSETS.filter(row=>['station','bridge'].includes(row.kind)))map.pending.get(asset.url).resolve({data:asset});
 assert.deepEqual(await first,[true,true]);assert.deepEqual(await second,[true]);assert.equal(map.calls.updates.length,2);
});
test('common presentation reapplies 2D/3D state and repairs partially removed art without replacing sources',()=>{
 const previous=globalThis.document;globalThis.document=canvasDocument();
 try{const map=mapFixture();addWatercolorLayers(map);applyWatercolorPresentation(map,{threeD:true});
  for(const id of ['fg-landmark-tether','fg-landmark-overview','fg-landmark-detail','fg-landmark-active'])assert.equal(map.getLayoutProperty(id,'visibility'),'none');
  assert.equal(map.getLayoutProperty('fg-buildings','visibility'),'visible');
  const source=map.getSource('fg-landmarks');map.layers.delete('fg-landmark-detail');map.images.delete('fg-art-bridge');
  assert.equal(addWatercolorLayers(map),true);applyWatercolorPresentation(map,{threeD:true});
  assert.equal(map.getSource('fg-landmarks'),source);assert.equal(map.getLayoutProperty('fg-landmark-detail','visibility'),'none');
  applyWatercolorPresentation(map,{threeD:false});
  assert.equal(map.getLayoutProperty('fg-buildings','visibility'),'none');assert.equal(map.getLayoutProperty('fg-landmark-detail','visibility'),'visible');
  const layouts=map.calls.layout.length,moves=map.calls.moves.length;applyWatercolorPresentation(map,{threeD:false});
  assert.equal(map.calls.layout.length,layouts);assert.equal(map.calls.moves.length,moves,'resize/ready callback causes no repeated mutations');
  const overview=map.layers.get('fg-landmark-overview'),detail=map.layers.get('fg-landmark-detail');
  assert.equal(map.layers.get('fg-landmark-tether').maxzoom,24,'annotation cannot outlive the illustration zoom range');
  assert.equal(overview.minzoom,13);assert.equal(overview.maxzoom,24);assert.equal(detail.minzoom,14.5);
  assert.deepEqual(overview.filter,['all',['==',['get','key'],'dogana'],['!=',['get','active'],true]]);
  assert.deepEqual(detail.filter,['all',['!=',['get','key'],'dogana'],['!=',['get','active'],true]],'Dogana is never duplicated at 15');
 }finally{globalThis.document=previous}
});
test('only one selected verified landmark has explicit priority; secondary art keeps normal symbol collision',()=>{
 const previous=globalThis.document;globalThis.document=canvasDocument();
 try{const map=mapFixture();addWatercolorLayers(map);
  const visits=[{key:'dogana',placeKey:'dogana',longitude:12.33625,latitude:45.43069},{key:'lucia',placeKey:'lucia',longitude:12.32145,latitude:45.44085}];
  setWatercolorLandmarks(map,{key:'main',visits},'dogana');
  assert.equal(map.getSource('fg-landmarks').data.features.filter(f=>f.properties.active).length,1);
  assert.equal(map.getLayer('fg-landmark-active').minzoom,13);assert.equal(map.getPaintProperty('fg-landmark-active','icon-opacity'),1);
  setWatercolorLandmarks(map,{key:'main',visits},'lucia');
  assert.equal(map.getLayer('fg-landmark-active').minzoom,14.5);assert.equal(map.getLayer('fg-landmark-tether').minzoom,14.5);
  assert.equal(map.getLayoutProperty('fg-landmark-active','icon-allow-overlap'),true);
  assert.equal(map.getLayoutProperty('fg-landmark-active','icon-ignore-placement'),false);
  assert.equal(map.getLayoutProperty('fg-landmark-overview','icon-allow-overlap'),false);
  assert.equal(map.getLayoutProperty('fg-landmark-detail','icon-allow-overlap'),false);
  setWatercolorLandmarks(map,{key:'main',visits},'unknown-visit');
  assert.equal(map.getSource('fg-landmarks').data.features.filter(f=>f.properties.active).length,0);
 }finally{globalThis.document=previous}
});
test('per-asset screen budgets preserve aspect and bound the tall Dogana, including small map containers',()=>{
 for(const [width,height]of [[390,360],[1440,700],[320,100],[844,150]]){
  const {sizes,gap,visible}=watercolorLayout(width,height);assert.ok(gap<=42&&gap>=34);
  assert.equal(visible,width>=180&&height>=160,'optional art yields to controls in short/narrow containers');
  for(const asset of ART_ASSETS.filter(a=>a.kind!=='garden-leaves')){
   const w=asset.width/asset.pixelRatio*sizes[asset.kind],h=asset.height/asset.pixelRatio*sizes[asset.kind];
   assert.ok(w<=Math.min(width<=600?104:124,width*.27)+.001);
   assert.ok(h<=Math.min(width<=600?72:80,height*.24)+.001);
   assert.ok(Math.abs(w/h-asset.width/asset.height)<.0001,'one scalar preserves the aspect ratio');
  }
  assert.ok(sizes.dogana<sizes.station,'equal icon-size would overweight the tall building');
 }
});
test('late image completion cannot modify a replacement style',async()=>{
 const map=mapFixture();const asset=ART_ASSETS[0];map.sources.set('fg-landmarks',{});map.images.set('fg-art-station',{data:asset});
 const old=loadWatercolorImages(map,['station']);const oldResolve=map.pending.get(asset.url).resolve;
 map.sources.set('fg-landmarks',{});const current=loadWatercolorImages(map,['station']);
 oldResolve({data:asset});assert.deepEqual(await old,[false]);assert.equal(map.calls.updates.length,0);
 map.pending.get(asset.url).resolve({data:asset});assert.deepEqual(await current,[true]);assert.equal(map.calls.updates.length,1);
});
test('repairing a removed registered image reloads that same asset rather than retaining the native fallback forever',async()=>{
 const previous=globalThis.document;globalThis.document=canvasDocument();
 try{const map=mapFixture();addWatercolorLayers(map);const asset=ART_ASSETS[0];
  const first=loadWatercolorImages(map,['station']);map.pending.get(asset.url).resolve({data:asset});assert.deepEqual(await first,[true]);
  const source=map.getSource('fg-landmarks');map.images.delete('fg-art-station');addWatercolorLayers(map);
  const repaired=loadWatercolorImages(map,['station']);assert.equal(map.getSource('fg-landmarks'),source);
  assert.equal(map.calls.loads.filter(url=>url===asset.url).length,2,'only deliberate missing-image repair invalidates its completed request');
  map.pending.get(asset.url).resolve({data:asset});assert.deepEqual(await repaired,[true]);
  assert.equal(map.calls.updates.filter(id=>id==='fg-art-station').length,2);
 }finally{globalThis.document=previous}
});
test('missing or wrongly sized optional artwork keeps fallback without repeated requests',async()=>{
 const map=mapFixture();map.sources.set('fg-landmarks',{});for(const asset of ART_ASSETS)map.images.set('fg-art-'+asset.kind,{data:asset});
 const task=loadWatercolorImages(map,['station','bridge']);map.pending.get(ART_ASSETS[0].url).reject(Error('offline'));
 map.pending.get(ART_ASSETS[1].url).resolve({data:{width:10,height:10}});
 assert.deepEqual(await task,[false,false]);assert.equal(map.calls.updates.length,0);
 assert.deepEqual(await loadWatercolorImages(map,['station','bridge']),[false,false]);assert.equal(map.calls.loads.length,2);
});
