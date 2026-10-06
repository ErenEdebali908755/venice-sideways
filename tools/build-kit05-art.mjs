/** Add optical metadata to the existing reduced family; masters stay private. */
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sharp = createRequire(resolve(root, '../eren-visual-archive/package.json'))('sharp');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const manifestPath = resolve(root, 'public/field-guide/art/illustrations-manifest.json');
const manifest = JSON.parse(await readFile(manifestPath));
const calibration = JSON.parse(await readFile(resolve(root, 'tools/kit05-art-calibration.json')));
const {routes} = JSON.parse(await readFile(resolve(root, 'public/field-guide/routes.json')));
function bounds(data, width, height, channels, threshold = 16) {
  let left=width, top=height, right=0, bottom=0;
  for (let y=0;y<height;y++) for(let x=0;x<width;x++) if(data[(y*width+x)*channels+channels-1]>=threshold) {
    left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x+1);bottom=Math.max(bottom,y+1);
  }
  return [left,top,right,bottom];
}
for (const asset of manifest.assets) {
  const row=calibration.assets.find(item=>item.placeKey===asset.placeKey);
  if (!row) throw Error('Missing optical review row: '+asset.placeKey);
  const [left,top,right,bottom]=asset.source.visibleAlpha16BoundsPx;
  const ground=[left+(right-left)*row.groundInVisibleBounds[0],top+(bottom-top)*row.groundInVisibleBounds[1]];
  const crop=asset.source.croppedTransparentExteriorPx;
  asset.source.imageGroundPointPx=ground;
  asset.artAnchor=row.artAnchor;
  asset.placement={mode:asset.approved?'bounded-callout':'held',minZoom:13,maxZoom:24,maxDisplacementCSSPx:72,
    calibrationStatus:row.artAnchor?'geographic-reference-checked; optical annotation reviewed':'architectural-anchor-unresolved; route-visit callout only',
    opticalReview:row.opticalReview,geographicReview:row.geographicReview||null,
    // A viewpoint, named point or polygon representative is never a footprint.
    notSurveyedFootprint:true,humanArchitecturalApproval:false};
  for(const derivative of Object.values(asset.derivatives)) {
    derivative.imageGroundPointPx=[(ground[0]-crop.left)*derivative.width/crop.width,(ground[1]-crop.top)*derivative.height/crop.height];
    derivative.sourceScale=[derivative.width/crop.width,derivative.height/crop.height];
  }
}
manifest.routePlacements=manifest.routePlacements.map(({route,visitKey,placeKey})=>{
  const visit=routes.find(row=>row.key===route)?.visits.find(row=>row.key===visitKey);
  const asset=manifest.assets.find(row=>row.placeKey===placeKey);
  if(!visit||!asset||visit.placeKey!==placeKey)throw Error('Placement stable identity mismatch: '+route+'/'+visitKey);
  return {route,visitKey,placeKey,visitCoordinate:[visit.longitude,visit.latitude],artAnchor:asset.artAnchor,
    imageGroundPointPx:asset.derivatives.map2x.imageGroundPointPx,groundPointSpace:'map2x raster pixels before sprite pixelRatio',
    placementMode:asset.placement.mode,calibrationStatus:asset.placement.calibrationStatus};
});
const kit=resolve(root,'../venice-books-unified-kit-05-2026-10-06');
const supplied=JSON.parse(await readFile(resolve(kit,'specs/new-asset-manifest.json')));
const gardens=[];
for(const source of supplied.assets.filter(row=>row.kind==='original_ai_watercolor_candidate')) {
  const bytes=await readFile(resolve(kit,source.path));
  if(hash(bytes)!==source.sha256) throw Error('Garden master checksum mismatch');
  const decoded=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  if(decoded.info.width!==source.width||decoded.info.height!==source.height||JSON.stringify(bounds(decoded.data,source.width,source.height,4))!==JSON.stringify(source.visibleAlpha16Bounds))throw Error('Garden master alpha mismatch');
  const key=source.path.includes('reali')?'reali':'papadopoli';const derivatives={};
  for(const [variant,target,pixelRatio] of [['map1x',160,1],['map2x',320,2],['card',640,1]]) {
    const output=await sharp(bytes).resize({width:target,height:target,fit:'inside',withoutEnlargement:true}).png({compressionLevel:9,adaptiveFiltering:true}).toBuffer();
    const sha256=hash(output),file=`kit05-garden-${key}-${variant}-${sha256.slice(0,12)}.png`;
    const data=await sharp(output).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    await writeFile(resolve(root,'public/field-guide/art',file),output);
    derivatives[variant]={file:'art/'+file,sha256,bytes:output.length,width:data.info.width,height:data.info.height,pixelRatio,visibleAlpha16BoundsPx:bounds(data.data,data.info.width,data.info.height,4),imageGroundPointPx:null};
  }
  gardens.push({key,title:key==='reali'?'Giardini Reali':'Giardini Papadopoli',approved:false,runtimeEnabledByDefault:false,
    artAnchor:null,imageGroundPoint:null,calibrationRequired:true,identityCheckedAt:'2026-10-06',
    identitySource:key==='reali'?'https://www.venicegardensfoundation.org/en/giardini-reali':'https://www.openstreetmap.org/way/174476472',
    reviewStatus:'Identity context checked; architectural/optical calibration and candidate approval remain pending',
    source:{sha256:source.sha256,width:source.width,height:source.height,visibleAlpha16BoundsPx:source.visibleAlpha16Bounds},derivatives});
}
manifest.schemaVersion=2;manifest.version='20261006-kit05';manifest.gardenCandidates=gardens;
manifest.opticalCalibration={checkedAt:'2026-10-06',source:'tools/kit05-art-calibration.json',assets:30,routePlacements:39,
  coordinatePolicy:'Visit coordinates unchanged. Separate sourced architectural/place references where checked; unresolved images are bounded route-visit callouts with tethers.',
  verifiedGeographicReferences:manifest.assets.filter(a=>a.artAnchor).map(a=>a.placeKey),
  opticalToleranceCSSPx:2,toleranceScope:'Pixel transform equivalence only; does not certify geographic accuracy or human architectural approval.'};
await writeFile(manifestPath,JSON.stringify(manifest,null,2)+'\n');
const rows=manifest.assets.map(asset=>{
  const {map1x,map2x,card}=asset.derivatives;
  return {key:asset.placeKey,title:asset.title,kind:asset.kind,approved:asset.approved,humanSpecificReviewRequired:asset.humanSpecificReviewRequired,
    illustrationNotPhotograph:true,url:map2x.file,width:map2x.width,height:map2x.height,pixelRatio:map2x.pixelRatio,
    url1x:map1x.file,width1x:map1x.width,height1x:map1x.height,cardURL:card.file,cardWidth:card.width,cardHeight:card.height,
    sha256:map2x.sha256,visibleAlpha16BoundsPx:map2x.visibleAlpha16BoundsPx,imageGroundPointPx:map2x.imageGroundPointPx,artAnchor:asset.artAnchor,placement:asset.placement};
});
await writeFile(resolve(root,'public/field-guide/illustrations.js'),`// Generated by tools/build-kit04-art.mjs then tools/build-kit05-art.mjs.\nconst rows = ${JSON.stringify(rows,null,2)};\nexport const ILLUSTRATIONS = Object.freeze(rows.map(row => Object.freeze({ ...row, url: new URL(row.url, import.meta.url).href, url1x: new URL(row.url1x, import.meta.url).href, cardURL: new URL(row.cardURL, import.meta.url).href })));\nexport const ILLUSTRATION_PLACEMENTS = Object.freeze(${JSON.stringify(manifest.routePlacements)}.map(row=>Object.freeze(row)));\nexport const GARDEN_ILLUSTRATIONS = Object.freeze(${JSON.stringify(gardens,null,2)}.map(row=>Object.freeze(row)));\n`);
console.log(JSON.stringify({assets:30,placements:39,approved:rows.filter(a=>a.approved).length,held:rows.filter(a=>!a.approved).map(a=>a.key),sourcedReferences:manifest.opticalCalibration.verifiedGeographicReferences,heldGardens:gardens.map(a=>a.key),publicMasters:false}));
