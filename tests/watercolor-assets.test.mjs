import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {ART_ASSETS,addWatercolorLayers,loadWatercolorImages,setWatercolorLandmarks} from '../public/field-guide/map-art.js';

function mapFixture() {
 const sources=new Map(),images=new Map(),layers=new Map([['fg-halo',{}]]),pending=new Map();
 const calls={loads:[],updates:[],moves:[]};
 return {sources,images,layers,pending,calls,
  getStyle:()=>({sources:{openmaptiles:{}},layers:[{id:'highway_path'}]}),
  getSource:id=>sources.get(id),addSource(id,data){sources.set(id,{...data,setData(value){this.data=value}})},
  hasImage:id=>images.has(id),addImage(id,data,options){assert.ok(!images.has(id));images.set(id,{data,options})},
  loadImage(url){calls.loads.push(url);return new Promise((resolve,reject)=>pending.set(url,{resolve,reject}))},
  updateImage(id,data){const old=images.get(id);assert.equal(data.width,old.data.width);assert.equal(data.height,old.data.height);old.data=data;calls.updates.push(id)},
  getLayer:id=>layers.get(id),addLayer(layer){layers.set(layer.id,layer)},moveLayer(id,before){calls.moves.push([id,before])},
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
test('registered fallback dimensions permit MapLibre image replacement and decoration remains below route',async()=>{
 const previous=globalThis.document;globalThis.document=canvasDocument();
 try{const map=mapFixture();assert.equal(addWatercolorLayers(map),true);
  for(const asset of ART_ASSETS){const id=asset.kind==='garden-leaves'?'fg-garden-leaves':`fg-art-${asset.kind}`;
   assert.deepEqual([map.images.get(id).data.width,map.images.get(id).data.height],[asset.width,asset.height]);assert.equal(map.images.get(id).options.pixelRatio,asset.pixelRatio);
  }
  assert.equal(addWatercolorLayers(map),false,'a repeated ready callback cannot duplicate sources or images');
  assert.equal(map.calls.moves.length,3);assert.ok(map.calls.moves.every(([,before])=>before==='fg-halo'));
  assert.equal(map.layers.get('fg-landmark-detail').layout['icon-allow-overlap'],false);
  const asset=ART_ASSETS.find(row=>row.kind==='garden-leaves');map.pending.get(asset.url).resolve({data:{width:asset.width,height:asset.height}});
  await loadWatercolorImages(map,['garden-leaves']);assert.deepEqual(map.calls.updates,['fg-garden-leaves']);
 }finally{globalThis.document=previous}
});
test('Main image requests deduplicate; Full never requests another set of landmarks',async()=>{
 const map=mapFixture();map.sources.set('fg-landmarks',{setData(){}});for(const asset of ART_ASSETS)map.images.set('fg-art-'+asset.kind,{data:asset});
 setWatercolorLandmarks(map,{key:'full',visits:[]});assert.equal(map.calls.loads.length,0);
 const first=loadWatercolorImages(map,['station','bridge']),second=loadWatercolorImages(map,['station']);
 assert.equal(map.calls.loads.length,2);
 for(const asset of ART_ASSETS.filter(row=>['station','bridge'].includes(row.kind)))map.pending.get(asset.url).resolve({data:asset});
 assert.deepEqual(await first,[true,true]);assert.deepEqual(await second,[true]);assert.equal(map.calls.updates.length,2);
});
test('late image completion cannot modify a replacement style',async()=>{
 const map=mapFixture();const asset=ART_ASSETS[0];map.sources.set('fg-landmarks',{});map.images.set('fg-art-station',{data:asset});
 const old=loadWatercolorImages(map,['station']);const oldResolve=map.pending.get(asset.url).resolve;
 map.sources.set('fg-landmarks',{});const current=loadWatercolorImages(map,['station']);
 oldResolve({data:asset});assert.deepEqual(await old,[false]);assert.equal(map.calls.updates.length,0);
 map.pending.get(asset.url).resolve({data:asset});assert.deepEqual(await current,[true]);assert.equal(map.calls.updates.length,1);
});
test('missing or wrongly sized optional artwork keeps fallback without repeated requests',async()=>{
 const map=mapFixture();map.sources.set('fg-landmarks',{});for(const asset of ART_ASSETS)map.images.set('fg-art-'+asset.kind,{data:asset});
 const task=loadWatercolorImages(map,['station','bridge']);map.pending.get(ART_ASSETS[0].url).reject(Error('offline'));
 map.pending.get(ART_ASSETS[1].url).resolve({data:{width:10,height:10}});
 assert.deepEqual(await task,[false,false]);assert.equal(map.calls.updates.length,0);
 assert.deepEqual(await loadWatercolorImages(map,['station','bridge']),[false,false]);assert.equal(map.calls.loads.length,2);
});
