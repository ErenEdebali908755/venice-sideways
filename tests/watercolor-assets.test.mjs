import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {inflateSync} from 'node:zlib';
import {ART_ASSETS,addWatercolorLayers,applyWatercolorPresentation,landmarkFeatures,loadWatercolorImages,setWatercolorLandmarks,visibleLandmarks,watercolorLayout} from '../public/field-guide/map-art.js';
import {ILLUSTRATIONS,ILLUSTRATION_PLACEMENTS} from '../public/field-guide/illustrations.js';
const {routes}=JSON.parse(await readFile(new URL('../public/field-guide/routes.json',import.meta.url)));
const legacy=ART_ASSETS.filter(asset=>!asset.kind.startsWith('kit-'));
const assetFile=asset=>asset.url.startsWith('file:')?new URL(asset.url):new URL('../public'+asset.url,import.meta.url);
// Decode the shipped noninterlaced RGBA PNG scanlines independently of Sharp.
// Merely having an alpha channel would not detect an opaque white rectangle.
function pngAlpha(bytes){
 const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20),stride=width*4;
 assert.equal(bytes[24],8);assert.equal(bytes[25],6);assert.equal(bytes[28],0);
 const chunks=[];for(let at=8;at<bytes.length;){const length=bytes.readUInt32BE(at),kind=bytes.subarray(at+4,at+8).toString();if(kind==='IDAT')chunks.push(bytes.subarray(at+8,at+8+length));at+=length+12;}
 const raw=inflateSync(Buffer.concat(chunks));assert.equal(raw.length,height*(stride+1));
 let previous=Buffer.alloc(stride),transparent=0,visible=0,left=width,top=height,right=-1,bottom=-1;
 const paeth=(a,b,c)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;};
 for(let y=0;y<height;y++){const filter=raw[y*(stride+1)],row=Buffer.alloc(stride);assert.ok(filter<=4);
  for(let i=0;i<stride;i++){const a=i>=4?row[i-4]:0,b=previous[i],c=i>=4?previous[i-4]:0;const add=filter===0?0:filter===1?a:filter===2?b:filter===3?Math.floor((a+b)/2):paeth(a,b,c);row[i]=(raw[y*(stride+1)+i+1]+add)&255;}
  for(let x=0;x<width;x++){const alpha=row[x*4+3];if(alpha===0)transparent++;if(alpha>=16){visible++;left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}}
  previous=row;
 }
 return {transparent,visible,bounds:[left,top,right+1,bottom+1]};
}
function mapFixture({width=390,height=360,zoom=17,pitch=0,project=()=>({x:width/2,y:height*.65})}={}) {
 const sources=new Map(),images=new Map(),layers=new Map([
  ['background',{id:'background',type:'background'}],['highway_path',{id:'highway_path',type:'line'}],
  ['place-label',{id:'place-label',type:'symbol'}],['fg-halo',{id:'fg-halo',type:'line'}],
  ['fg-walk',{id:'fg-walk',type:'line'}],['fg-boat',{id:'fg-boat',type:'line'}],['fg-directions',{id:'fg-directions',type:'symbol'}],['fg-buildings',{id:'fg-buildings',type:'fill-extrusion',layout:{visibility:'none'}}],
 ]),pending=new Map();
 const calls={loads:[],updates:[],moves:[],layout:[]};
 return {sources,images,layers,pending,calls,zoom,pitch,width,height,project,
  getZoom(){return this.zoom},getPitch(){return this.pitch},getContainer(){return {clientWidth:this.width,clientHeight:this.height}},
  getStyle:()=>({sources:{openmaptiles:{}},layers:[...layers.values()]}),
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
async function withCanvas(run){const previous=globalThis.document;globalThis.document=canvasDocument();try{return await run()}finally{globalThis.document=previous}}
function registered(map,asset){map.images.set('fg-art-'+asset.kind,{data:asset});}

test('thirty content-addressed alpha-preserving catalog derivatives have actual PNG dimensions and distinct identities',async()=>{
 assert.equal(ILLUSTRATIONS.length,30);assert.equal(new Set(ILLUSTRATIONS.map(a=>a.key)).size,30);
 assert.equal(ILLUSTRATIONS.filter(a=>a.approved).length,30);
 assert.deepEqual(ILLUSTRATIONS.filter(a=>!a.approved).map(a=>[a.key,a.humanSpecificReviewRequired]),[]);
 for(const asset of ILLUSTRATIONS){
  assert.equal(asset.illustrationNotPhotograph,true);assert.equal(asset.pixelRatio,2);
  for(const [url,width,height]of [[asset.url,asset.width,asset.height],[asset.url1x,asset.width1x,asset.height1x],[asset.cardURL,asset.cardWidth,asset.cardHeight]]){
   const bytes=await readFile(new URL(url));assert.equal(bytes.subarray(1,4).toString(),'PNG');
   assert.deepEqual([bytes.readUInt32BE(16),bytes.readUInt32BE(20)],[width,height]);assert.equal(bytes[25],6,'PNG RGBA retains alpha');
   assert.ok(url.includes(createHash('sha256').update(bytes).digest('hex').slice(0,12)),asset.key+' content hash');
   const alpha=pngAlpha(bytes);assert.ok(alpha.transparent>0&&alpha.visible>0,'decoded derivative has transparent exterior and visible painted subject');
   if(url===asset.url)assert.deepEqual(alpha.bounds,asset.visibleAlpha16BoundsPx,'decoded map alpha bounds match catalog');
  }
  assert.ok(asset.width<=512&&asset.height<=512,'map raster decode stays below 512×512');
  assert.ok(Math.abs(asset.width/asset.height-asset.cardWidth/asset.cardHeight)<.012,'integer resizing preserves natural aspect');
 }
 for(const asset of legacy){const bytes=await readFile(assetFile(asset));assert.deepEqual([bytes.readUInt32BE(16),bytes.readUInt32BE(20)],[asset.width,asset.height]);}
 assert.equal(ART_ASSETS.some(a=>a.key==='trearchi'),true,'new three-arch reference-reviewed asset is a map candidate');
});
test('initial fallback registration is bounded and idempotent; layer order protects routes and native collision',async()=>withCanvas(async()=>{
 const map=mapFixture();assert.equal(addWatercolorLayers(map),true);
 assert.deepEqual(map.calls.loads,[legacy.find(a=>a.kind==='garden-leaves').url],'opening does not fetch all thirty landmark rasters');
 assert.equal([...map.images.keys()].filter(id=>id.startsWith('fg-art-kit-')).length,0,'viewport relevance precedes raster registration');
 for(const asset of legacy){const id=asset.kind==='garden-leaves'?'fg-garden-leaves':`fg-art-${asset.kind}`;assert.deepEqual([map.images.get(id).data.width,map.images.get(id).data.height],[asset.width,asset.height]);assert.equal(map.images.get(id).options.pixelRatio,asset.pixelRatio);}
 const source=map.getSource('fg-landmarks'),moves=map.calls.moves.length;assert.equal(addWatercolorLayers(map),true);assert.equal(map.getSource('fg-landmarks'),source);assert.equal(map.calls.moves.length,moves);
 const order=[...map.layers.keys()],before=(a,b)=>assert.ok(order.indexOf(a)<order.indexOf(b),`${a} before ${b}`);
 before('fg-garden-wash','fg-garden-grain');before('fg-garden-grain','highway_path');
 for(const route of ['fg-halo','fg-walk','fg-boat','fg-directions'])for(const art of ['fg-landmark-overview','fg-landmark-detail','fg-landmark-active'])before(route,art);
 before('place-label','fg-landmark-detail');before('fg-landmark-detail','fg-garden-label');
 for(const id of ['fg-landmark-overview','fg-landmark-detail']){assert.equal(map.getLayoutProperty(id,'icon-allow-overlap'),false);assert.equal(map.getLayoutProperty(id,'icon-ignore-placement'),false);}
 const asset=legacy.find(a=>a.kind==='garden-leaves');map.pending.get(asset.url).resolve({data:asset});await loadWatercolorImages(map,['garden-leaves']);assert.deepEqual(map.calls.updates,['fg-garden-leaves']);
}));
test('thirty-eight placements preserve each route’s own canonical anchor and never invent locations from titles',()=>{
 const before=JSON.stringify(routes);assert.equal(ILLUSTRATION_PLACEMENTS.length,38);
 assert.deepEqual(routes.map(route=>landmarkFeatures(route).length),[10,28]);
 for(const route of routes)for(const feature of landmarkFeatures(route)){
  const visit=route.visits.find(v=>v.key===feature.properties.visitKey);assert.equal(feature.properties.placeKey,visit.placeKey);assert.deepEqual(feature.properties.visitCoordinate,[visit.longitude,visit.latitude]);assert.deepEqual(feature.geometry.coordinates,feature.properties.artAnchor||feature.properties.visitCoordinate);assert.equal(feature.properties.number,undefined);
 }
 const mainLucia=landmarkFeatures(routes[0]).find(f=>f.properties.key==='lucia'),fullLucia=landmarkFeatures(routes[1]).find(f=>f.properties.key==='lucia');assert.notDeepEqual(mainLucia.properties.visitCoordinate,fullLucia.properties.visitCoordinate,'shared image must not force Full onto Main visit coordinates');assert.deepEqual(mainLucia.geometry.coordinates,fullLucia.geometry.coordinates,'a separate sourced facade reference is shared while visits remain distinct');
 assert.equal(JSON.stringify(routes),before);assert.deepEqual(landmarkFeatures({key:'other',visits:routes[0].visits}),[]);
 assert.deepEqual(landmarkFeatures({key:'full',visits:[{key:'unverified',copy:[{locale:'en',title:'Punta della Dogana'}],longitude:12.3,latitude:45.4}]}),[]);
 assert.deepEqual(landmarkFeatures({key:'full',visits:[{key:'dogana',placeKey:'other-place',longitude:12.3,latitude:45.4}]}),[]);
});
test('viewport budget is three mobile/six desktop, active first, and offscreen/low zoom/3D art yields without moving anchors',()=>{
 for(const width of [390,1440]){const map=mapFixture({width,height:700});let features=visibleLandmarks(map,routes[1],'elena');assert.ok(features.length>0&&features.length<=(width<768?3:6));assert.equal(features[0].properties.visitKey,'elena');assert.equal(features.filter(f=>f.properties.active).length,1);
  for(const f of features){const visit=routes[1].visits.find(v=>v.key===f.properties.visitKey);assert.deepEqual(f.properties.visitCoordinate,[visit.longitude,visit.latitude]);}
  map.zoom=12.9;assert.deepEqual(visibleLandmarks(map,routes[1],'elena'),[]);map.zoom=17;map.pitch=45;assert.deepEqual(visibleLandmarks(map,routes[1],'elena'),[]);map.pitch=0;map.height=100;assert.deepEqual(visibleLandmarks(map,routes[1],'elena'),[]);
 }
 const outside=mapFixture({project:()=>({x:-5,y:250})});assert.deepEqual(visibleLandmarks(outside,routes[0],'lucia'),[],'decorative art is hidden instead of relocating a real anchor into frame');
});
test('only relevant approved raster kinds load and shared route requests deduplicate while pending',async()=>withCanvas(async()=>{
 const map=mapFixture();addWatercolorLayers(map);const garden=legacy.find(a=>a.kind==='garden-leaves');map.pending.get(garden.url).resolve({data:garden});await loadWatercolorImages(map,['garden-leaves']);
 setWatercolorLandmarks(map,routes[0],'lucia');const features=map.getSource('fg-landmarks').data.features;assert.ok(features.length>0&&features.length<=3);
 const kinds=features.map(f=>f.properties.icon),first=loadWatercolorImages(map,kinds),second=loadWatercolorImages(map,kinds);
 assert.equal(map.calls.loads.length,1+features.length,'one garden plus only accepted collision-free landmark images');
 for(const kind of kinds){const asset=ART_ASSETS.find(a=>a.kind===kind);map.pending.get(asset.url).resolve({data:asset});}
 assert.deepEqual(await first,kinds.map(()=>true));assert.deepEqual(await second,kinds.map(()=>true));assert.equal(map.calls.updates.length,1+features.length);
 setWatercolorLandmarks(map,routes[0],'lucia');assert.equal(map.calls.loads.length,1+features.length,'same accepted identities share already decoded assets');
}));
test('presentation repairs partially removed art and reapplies 2D/3D without replacing source or repeat mutations',async()=>withCanvas(async()=>{
 const map=mapFixture();addWatercolorLayers(map);applyWatercolorPresentation(map,{threeD:true});
 for(const id of ['fg-landmark-tether','fg-landmark-overview','fg-landmark-detail','fg-landmark-active'])assert.equal(map.getLayoutProperty(id,'visibility'),'none');assert.equal(map.getLayoutProperty('fg-buildings','visibility'),'visible');
 const source=map.getSource('fg-landmarks');map.layers.delete('fg-landmark-detail');map.images.delete('fg-art-bridge');assert.equal(addWatercolorLayers(map),true);applyWatercolorPresentation(map,{threeD:true});assert.equal(map.getSource('fg-landmarks'),source);assert.equal(map.getLayoutProperty('fg-landmark-detail','visibility'),'none');
 applyWatercolorPresentation(map,{threeD:false});assert.equal(map.getLayoutProperty('fg-buildings','visibility'),'none');assert.equal(map.getLayoutProperty('fg-landmark-overview','visibility'),'visible');
 const layouts=map.calls.layout.length,moves=map.calls.moves.length;applyWatercolorPresentation(map,{threeD:false});assert.equal(map.calls.layout.length,layouts);assert.equal(map.calls.moves.length,moves);
 assert.equal(map.getLayer('fg-landmark-tether').maxzoom,24);assert.equal(map.getLayer('fg-landmark-overview').minzoom,13);
 assert.deepEqual(map.getLayer('fg-landmark-detail').filter,['==',['get','key'],'__unused__'],'unused duplicate family cannot show a second copy of the same art');
}));
test('one active approved landmark has priority while secondary art retains native collision and unknown selection cannot activate',async()=>withCanvas(async()=>{
 const map=mapFixture();addWatercolorLayers(map);setWatercolorLandmarks(map,routes[0],'dogana');assert.equal(map.getSource('fg-landmarks').data.features.filter(f=>f.properties.active).length,1);
 assert.equal(map.getSource('fg-landmarks').data.features[0].properties.key,'dogana');assert.equal(map.getLayer('fg-landmark-active').minzoom,13);assert.equal(map.getPaintProperty('fg-landmark-active','icon-opacity'),1);
 assert.equal(map.getLayoutProperty('fg-landmark-active','icon-allow-overlap'),false);assert.equal(map.getLayoutProperty('fg-landmark-active','icon-ignore-placement'),false);
 for(const id of ['fg-landmark-overview','fg-landmark-detail'])assert.equal(map.getLayoutProperty(id,'icon-allow-overlap'),false);
 setWatercolorLandmarks(map,routes[0],'trearchi');assert.equal(map.getSource('fg-landmarks').data.features.filter(f=>f.properties.active).length,1);assert.equal(map.calls.loads.some(url=>url.includes('trearchi')),true);
 setWatercolorLandmarks(map,routes[0],'unknown');assert.equal(map.getSource('fg-landmarks').data.features.filter(f=>f.properties.active).length,0);
}));
test('all approved aspect ratios and legacy fallbacks fit independent width/height budgets including short containers',()=>{
 for(const [width,height]of [[390,360],[1440,700],[320,100],[844,150]]){const {sizes,gap,visible}=watercolorLayout(width,height);assert.equal(gap,0,"no shared artificial lift");assert.equal(visible,width>=180&&height>=160);
  for(const asset of ART_ASSETS.filter(a=>a.kind!=='garden-leaves')){const w=asset.width/asset.pixelRatio*sizes[asset.kind],h=asset.height/asset.pixelRatio*sizes[asset.kind];assert.ok(w<=Math.min(width<768?96:112,width*.27)+.001);assert.ok(h<=Math.min(width<768?64:72,height*.24)+.001);assert.ok(Math.abs(w/h-asset.width/asset.height)<.0001);}
 }
});
test('late optional image completion cannot modify a replacement style',async()=>{
 const map=mapFixture(),asset=ILLUSTRATIONS[0];map.sources.set('fg-landmarks',{});registered(map,asset);
 const old=loadWatercolorImages(map,[asset.kind]),oldResolve=map.pending.get(asset.url).resolve;map.sources.set('fg-landmarks',{});const current=loadWatercolorImages(map,[asset.kind]);oldResolve({data:asset});assert.deepEqual(await old,[false]);assert.equal(map.calls.updates.length,0);map.pending.get(asset.url).resolve({data:asset});assert.deepEqual(await current,[true]);assert.equal(map.calls.updates.length,1);
});
test('repairing a removed catalog image reloads only that missing asset and keeps the same geography source',async()=>withCanvas(async()=>{
 const map=mapFixture();addWatercolorLayers(map);setWatercolorLandmarks(map,routes[0],'lucia');const asset=ILLUSTRATIONS[0];let task=loadWatercolorImages(map,[asset.kind]);map.pending.get(asset.url).resolve({data:asset});assert.deepEqual(await task,[true]);
 const source=map.getSource('fg-landmarks');map.images.delete('fg-art-'+asset.kind);setWatercolorLandmarks(map,routes[0],'lucia');task=loadWatercolorImages(map,[asset.kind]);assert.equal(map.getSource('fg-landmarks'),source);assert.equal(map.calls.loads.filter(url=>url===asset.url).length,2);map.pending.get(asset.url).resolve({data:asset});assert.deepEqual(await task,[true]);assert.equal(map.calls.updates.filter(id=>id==='fg-art-'+asset.kind).length,2);
}));
test('offline or wrong-sized optional artwork remains bounded and is not repeatedly requested',async()=>{
 const map=mapFixture();map.sources.set('fg-landmarks',{});const assets=ILLUSTRATIONS.slice(0,2);for(const asset of assets)registered(map,asset);
 const task=loadWatercolorImages(map,assets.map(a=>a.kind));map.pending.get(assets[0].url).reject(Error('offline'));map.pending.get(assets[1].url).resolve({data:{width:10,height:10}});assert.deepEqual(await task,[false,false]);assert.equal(map.calls.updates.length,0);assert.deepEqual(await loadWatercolorImages(map,assets.map(a=>a.kind)),[false,false]);assert.equal(map.calls.loads.length,2);
});
