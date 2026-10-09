import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { opticalPlacement, visibleLandmarks, boxesOverlap, mapDOMObstacles, watercolorStyle, NEARBY_GREEN_SPACES } from '../public/field-guide/map-art.js';
import { ILLUSTRATIONS, GARDEN_ILLUSTRATIONS } from '../public/field-guide/illustrations.js';
import { storyFor, FieldGuide } from '../public/field-guide/guide.js';
import { directionFeatures } from '../public/field-guide/directions.js';
const manifest = JSON.parse(await readFile(new URL('../public/field-guide/art/illustrations-manifest.json', import.meta.url)));
const {routes} = JSON.parse(await readFile(new URL('../public/field-guide/routes.json', import.meta.url)));

test('all thirty optical points survive strict crop, independent derivative rounding and sprite pixelRatio', () => {
  for(const asset of manifest.assets) {
    const {imageGroundPointPx: raw,croppedTransparentExteriorPx: crop}=asset.source;
    assert.equal(raw.length,2);assert.ok(raw.every(Number.isFinite));
    for(const derivative of Object.values(asset.derivatives)) {
      const reconstructed=[crop.left+derivative.imageGroundPointPx[0]*crop.width/derivative.width,crop.top+derivative.imageGroundPointPx[1]*crop.height/derivative.height];
      assert.ok(Math.hypot(reconstructed[0]-raw[0],reconstructed[1]-raw[1])<1e-8,asset.placeKey);
    }
    const runtime=ILLUSTRATIONS.find(row=>row.key===asset.placeKey);
    for(const size of [.35,.64,1]) for(const point of [{x:100,y:140},{x:360,y:240}]) for(const delta of [[0,0],[48,-32]]) {
      const placement=opticalPlacement(runtime,point,size,delta);
      const [gx,gy]=runtime.imageGroundPointPx,scale=size/runtime.pixelRatio;
      const actualGround={x:placement.center.x+(gx-runtime.width/2)*scale,y:placement.center.y+(gy-runtime.height/2)*scale};
      assert.ok(Math.hypot(actualGround.x-point.x-delta[0],actualGround.y-point.y-delta[1])<2,asset.placeKey+' optical tolerance');
      assert.ok(Math.hypot(placement.center.x-point.x-placement.offset[0]*size,placement.center.y-point.y-placement.offset[1]*size)<1e-8,'MapLibre offset must not scale twice');
    }
  }
});
test('separate sourced references keep all thirty-nine visit coordinates intact, and unresolved architecture stays explicit', () => {
  assert.deepEqual(manifest.opticalCalibration.verifiedGeographicReferences,['lucia','frari','dogana','accademia','vino']);
  assert.equal(manifest.routePlacements.length,39);
  for(const row of manifest.routePlacements) {
    const visit=routes.find(route=>route.key===row.route).visits.find(visit=>visit.key===row.visitKey);
    const asset=manifest.assets.find(asset=>asset.placeKey===row.placeKey);
    assert.ok(Number.isFinite(visit.longitude)&&Number.isFinite(visit.latitude));
    assert.deepEqual(row.visitCoordinate,[visit.longitude,visit.latitude]);
    assert.deepEqual(row.artAnchor,asset.artAnchor);
    assert.deepEqual(row.imageGroundPointPx,asset.derivatives.map2x.imageGroundPointPx);
    assert.equal(row.placementMode,asset.placement.mode);
    assert.equal(row.calibrationStatus,asset.placement.calibrationStatus);
    assert.equal(asset.placement.humanArchitecturalApproval,false);
    assert.equal(asset.placement.notSurveyedFootprint,true);
    if(asset.artAnchor) assert.match(asset.placement.geographicReview.sourceURL,/^https:\/\/www\.openstreetmap\.org\/(node|way|relation)\/[0-9]+$/);
    else if(asset.approved) assert.match(asset.placement.calibrationStatus,/unresolved/);
  }
  assert.equal(ILLUSTRATIONS.find(asset=>asset.key==='trearchi').approved,true);
  for(const candidate of GARDEN_ILLUSTRATIONS) {
    assert.equal(candidate.runtimeEnabledByDefault,false);assert.equal(candidate.approved,false);
    assert.equal(candidate.artAnchor,null);assert.equal(candidate.imageGroundPoint,null);assert.equal(candidate.calibrationRequired,true);
    assert.equal(Object.values(candidate.derivatives).every(row=>row.imageGroundPointPx===null),true);
  }
});
test('DOM marker boxes use actual CSS bounds relative to the map rather than native canvas collision assumptions', () => {
  const pin={getBoundingClientRect:()=>({left:122,top:232,right:166,bottom:276,width:44,height:44})};
  const container={getBoundingClientRect:()=>({left:100,top:200}),closest:()=>({querySelectorAll:()=>[pin]})};
  assert.deepEqual(mapDOMObstacles({getContainer:()=>container}),[{left:17,top:27,right:71,bottom:81}]);
});
test('floating artwork obstacles reserve control and open panel boxes without consuming transparent toolbar space', () => {
  let selector='';
  const box={getBoundingClientRect:()=>({left:190,top:210,right:310,bottom:390,width:120,height:180})};
  const container={getBoundingClientRect:()=>({left:100,top:200}),closest:()=>({querySelectorAll:value=>{selector=value;return [box]}})};
  assert.deepEqual(mapDOMObstacles({getContainer:()=>container}),[{left:85,top:5,right:215,bottom:195}]);
  assert.ok(selector.includes('.fg-map-options[open] > .fg-map-option-actions'));
  assert.ok(selector.includes('.fg-location-copy[open] > .fg-privacy-panel'));
  assert.ok(selector.includes('.fg-map-tools > button'));
  assert.equal(selector.split(',').includes('.fg-map-tools'),false);
});
test('collision culling preserves anchors, avoids opaque art boxes and retains accepted positions during small pan jitter', () => {
  let jitter=0;const map={getContainer:()=>({clientWidth:390,clientHeight:500}),getZoom:()=>16.5,getPitch:()=>0,project:()=>({x:195+jitter,y:300})};
  const obstacles=[{left:168,top:273,right:222,bottom:327}];
  const first=visibleLandmarks(map,routes[0],'vino',{obstacles,protectRoute:false});
  assert.ok(first.length>0&&first.length<=3);assert.equal(first[0].properties.key,'vino');
  for(const feature of first) {
    assert.equal(obstacles.some(box=>boxesOverlap(feature.properties.visibleBoundsCSS,box,4)),false);
    assert.ok(Math.hypot(...feature.properties.screenDisplacement)<=72);
  }
  for(let i=0;i<first.length;i++)for(let j=i+1;j<first.length;j++)assert.equal(boxesOverlap(first[i].properties.visibleBoundsCSS,first[j].properties.visibleBoundsCSS,8),false);
  jitter=1;const next=visibleLandmarks(map,routes[0],'vino',{obstacles,protectRoute:false});
  assert.deepEqual(next.map(feature=>[feature.properties.key,feature.properties.screenDisplacement]),first.map(feature=>[feature.properties.key,feature.properties.screenDisplacement]));
  map.project=()=>({x:-1,y:300});assert.deepEqual(visibleLandmarks(map,routes[0],'vino',{obstacles,protectRoute:false}),[],'offscreen true anchors are never clamped into the viewport');
});
test('line labels retain line placement and point labels gain alternatives without changing provider geometry', () => {
  const base={sources:{openmaptiles:{type:'vector'}},layers:[{id:'water_name_line_label',type:'symbol',layout:{'symbol-placement':'line','text-field':['get','name']}},{id:'poi',type:'symbol',layout:{'text-field':['get','name']}}]};
  const style=watercolorStyle(base);
  assert.equal(style.layers[0].layout['symbol-placement'],'line');assert.equal(style.layers[0].layout['text-variable-anchor'],undefined);
  assert.deepEqual(style.layers[1].layout['text-variable-anchor'],['top','bottom','left','right']);
  assert.equal(style.layers.every(layer=>layer.layout['text-allow-overlap']===false),true);
});
test('native projected Point instances are flattened before MapLibre worker serialization', () => {
  class NativePoint { constructor(x,y){this.x=x;this.y=y;} }
  const map={getContainer:()=>({clientWidth:390,clientHeight:500}),getZoom:()=>16.5,getPitch:()=>0,project:()=>new NativePoint(195,300)};
  const features=visibleLandmarks(map,routes[0],'lucia',{obstacles:[],protectRoute:false});
  assert.ok(features.length);
  for(const feature of features)assert.equal(Object.getPrototypeOf(feature.properties.anchorCSS),Object.prototype);
});
test('nearby garden contexts keep public, reserved and ticketed access distinct without adding visits or polygons', () => {
  const render=key=>FieldGuide.prototype.nearbyGreenSpaces.call({t:key=>key},{placeKey:key});
  assert.match(render('lucia'),/guided visits by reservation/);
  for(const key of ['accademia','salute'])assert.match(render(key),/Museum garden · admission conditions apply/);
  for(const key of ['giardini','viale','garibaldi']) {
    assert.match(render(key),/Giardini Napoleonici/);assert.match(render(key),/ticket and event conditions apply/);
  }
  assert.equal(NEARBY_GREEN_SPACES.length,7,'only selected researched relationships are exposed as context');
  assert.equal(NEARBY_GREEN_SPACES.some(row=>row.latitude||row.longitude||row.geometry),false,'context links never generate stop or garden geometry');
});
test('public story requires a reviewed source, hides pending translations, and private preview labels pending content', () => {
  const story={sourceLanguage:'tr',review:{status:'needs-review',revision:1},copy:[{locale:'tr',shortHistory:'Taslak tarih',interestingDetail:'Taslak ayrıntı',needsReview:true},{locale:'en',shortHistory:'Reviewed English',needsReview:false}],sources:[]};
  const visit={key:'lucia',placeKey:'lucia',place:{story}};
  assert.equal(storyFor(visit,null,'tr'),null);
  assert.equal(storyFor(visit,null,'tr',true).copy.shortHistory,'Taslak tarih');assert.equal(storyFor(visit,null,'tr',true).pending,true);
  story.review.status='reviewed';assert.equal(storyFor(visit,null,'tr').copy.locale,'en');
  story.copy[0].needsReview=false;assert.equal(storyFor(visit,null,'tr').copy.locale,'tr');
  assert.equal(storyFor({key:'lucia'},routes[0],'tr'),null,'legacy snapshots retain guidance without inventing story text');
  assert.equal(storyFor({key:'lucia'},{placeStories:[{placeKey:'lucia',story}]},'tr'),null,'private draft proposal cannot be selected by public rendering');
  assert.equal(storyFor({key:'lucia'},{placeStories:[{placeKey:'lucia',story}]},'tr',true).copy.locale,'tr');
});
test('source rendering escapes bibliographic content and refuses credentials, scripts and empty source URLs', () => {
  const previous=globalThis.location;globalThis.location={origin:'https://venicesideways.com'};
  try {
    const fixture={route:null,lang:'en',preview:true,t:key=>key};
    const visit={story:{review:{status:'reviewed'},copy:[{locale:'en',shortHistory:'History',needsReview:false}],sources:[
      {kind:'book',title:'<script>book</script>',url:'javascript:alert(1)',author:'<author>'},
      {kind:'primary',title:'Keeper',url:'https://user:pass@example.org/'},{kind:'other',title:'No URL',url:null},
      {kind:'primary',title:'Official',url:'https://www.venicegardensfoundation.org/en/giardini-reali'}]}};
    const markup=FieldGuide.prototype.storySources.call(fixture,visit);
    assert.ok(markup.includes('&lt;script&gt;book&lt;/script&gt;'));assert.ok(markup.includes('&lt;author&gt;'));
    assert.equal(markup.includes('javascript:'),false);assert.equal(markup.includes('user:pass'),false);assert.equal(markup.includes('/null'),false);
    assert.equal((markup.match(/<a /g)||[]).length,1);
  } finally {globalThis.location=previous;}
});
test('ordered direction glyphs yield to the active pin and toolbar obstacles without editing geometry', () => {
  const map={getContainer:()=>({clientWidth:390,clientHeight:500}),project:([x,y])=>({x,y})};
  const line={properties:{boat:true},geometry:{coordinates:[[20,300],[370,300]]}},before=JSON.stringify(line);
  const normal=directionFeatures(map,[line],{spacing:80});const obstacles=[{left:120,top:270,right:260,bottom:330}];
  const filtered=directionFeatures(map,[line],{spacing:80,obstacles});
  assert.ok(filtered.features.length<normal.features.length);assert.equal(filtered.features.every(feature=>feature.properties.boat),true);
  assert.equal(JSON.stringify(line),before);
});
