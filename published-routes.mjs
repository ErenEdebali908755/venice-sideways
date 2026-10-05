const validSlug=slug=>/^[a-z][a-z0-9-]{0,79}$/.test(slug);
const cache=new Map();
const locales=new Set(['en','tr','it','fr','ru','zh','ja','ko']);
const project=(value,names)=>Object.fromEntries(names.filter(name=>Object.hasOwn(value||{},name)&&(['string','boolean'].includes(typeof value[name])||(typeof value[name]==='number'&&Number.isFinite(value[name])))).map(name=>[name,typeof value[name]==='string'?value[name].slice(0,6000):value[name]]));
const text=value=>typeof value==='string'?value.slice(0,6000):'';
const copy=rows=>Array.isArray(rows)?rows.filter(row=>row&&locales.has(row.locale)&&(!Object.hasOwn(row,'needsReview')||row.needsReview===false)).slice(0,8).map(row=>({...project(row,['locale','needsReview']),...Object.fromEntries(['title','text','theme','phoneTip'].filter(key=>Object.hasOwn(row,key)).map(key=>[key,text(row[key])]))})):[];
const photo=value=>{
 if(!value||typeof value!=='object')return undefined;
 try{const url=new URL(value.url,'https://venicesideways.com');if(url.username||url.password||url.search||url.hash||url.protocol!=='https:'||!((url.origin==='https://erenedebali.com'&&/^\/image\/\d+\/(web|thumb|high)$/.test(url.pathname))||(url.origin==='https://venicesideways.com'&&/^\/field-guide\/[a-z0-9_-]+\.(png|jpe?g|webp|avif)$/.test(url.pathname))))return undefined;return {...project(value,['alt','altTr','credit','x','y','width','height','referenceOnly']),url:url.href};}catch{return undefined;}
};
const point=value=>project(value,['latitude','longitude']);
const coordinates=rows=>Array.isArray(rows)?rows.slice(0,20000).filter(row=>Array.isArray(row)&&row.length===2&&row.every(Number.isFinite)).map(row=>[row[0],row[1]]):[];
const publicDerivative=(value,assetID,version)=>{
 if(!value||!['r400','r900','r1600','r2400'].includes(value.variant)||!Number.isInteger(value.width)||!Number.isInteger(value.height)||value.width<1||value.height<1||value.width>12000||value.height>12000)return null;
 try{const url=new URL(value.url,'https://erenedebali.com');if(url.origin!=='https://erenedebali.com'||url.username||url.password||url.search||url.hash||url.pathname!==`/api/sideways/media/${assetID}/${version}/${value.variant}`||!/^\/api\/sideways\/media\/[a-z0-9_-]+\/[a-z0-9_-]+\/(r400|r900|r1600|r2400)$/.test(url.pathname))return null;return {variant:value.variant,url:url.href,width:value.width,height:value.height};}catch{return null;}
};
export const projectGallery=rows=>{if(Array.isArray(rows)&&rows.length>12)throw Error('Too many gallery photos');return Array.isArray(rows)?rows.slice(0,12).filter(value=>value&&typeof value.assetID==='string'&&typeof value.derivativeVersion==='string').map(value=>({assetID:value.assetID.slice(0,100),derivativeVersion:value.derivativeVersion.slice(0,100),order:Number.isInteger(value.order)?value.order:0,cover:value.cover===true,focalPoint:{x:Number.isFinite(value.focalPoint?.x)?Math.max(0,Math.min(100,value.focalPoint.x)):50,y:Number.isFinite(value.focalPoint?.y)?Math.max(0,Math.min(100,value.focalPoint.y)):50},sourceLanguage:value.sourceLanguage==='tr'?'tr':'en',textRevision:Number.isInteger(value.textRevision)?value.textRevision:1,copy:Array.isArray(value.copy)?value.copy.filter(row=>row&&locales.has(row.locale)&&(!Object.hasOwn(row,'needsReview')||row.needsReview===false)).slice(0,8).map(row=>({locale:row.locale,alt:text(row.alt),caption:text(row.caption),...(Object.hasOwn(row,'needsReview')?{needsReview:false}:{})})):[],credit:text(value.credit),derivatives:Array.isArray(value.derivatives)?value.derivatives.slice(0,4).map(item=>publicDerivative(item,value.assetID,value.derivativeVersion)).filter(Boolean):[],...(value.referenceOnly===true?{referenceOnly:true}:{})})).filter(value=>value.derivatives.length):[];};
export function projectPublishedRoute(data){
 if(![1,2].includes(data.schemaVersion))throw Error('Unsupported release');
 const sourceLanguage=Object.hasOwn(data,'sourceLanguage')?data.sourceLanguage:'en';
 if(sourceLanguage!=='en'&&sourceLanguage!=='tr')throw Error('Invalid source language');
 return {...project(data,['schemaVersion','key','revision','publishedAt','sunsetVisitKey','sunsetOffsetMinutes']),sourceLanguage,copy:copy(data.copy),...(data.photo?{photo:photo(data.photo)}:{}),visits:data.visits.slice(0,200).map(value=>({...project(value,['key','placeKey','segmentKey','order','visible','isPhotoStop','pauseMinutes']),...point(value),copy:copy(value.copy),...(value.photo?{photo:photo(value.photo)}:{}),...(data.schemaVersion===2?{gallery:projectGallery(value.gallery)}:{}),...(Array.isArray(value.ideas)?{ideas:value.ideas.slice(0,5).map(idea=>({...project(idea,['key','order']),copy:copy(idea.copy)}))}:{})})),segments:data.segments.slice(0,100).map(value=>({...project(value,['key','order','type','routingStatus','routingReviewed','distanceMeters','durationMinutes','waitingMinutes','timetableURL']),copy:copy(value.copy),geometry:coordinates(value.geometry),waypoints:Array.isArray(value.waypoints)?value.waypoints.slice(0,100).map(point):[],transitStops:Array.isArray(value.transitStops)?value.transitStops.slice(0,30).map(stop=>({...project(stop,['placeKey','name','lineFrom','lineTo']),...point(stop)})):[]})),...(Array.isArray(data.places)?{places:data.places.slice(0,200).map(value=>({...project(value,['key','name','navigationQuery','sourceURL']),...point(value),copy:copy(value.copy)}))}:{})};
}
export async function readPublishedRoute(slug,fetcher=fetch){
 if(!validSlug(slug))return {status:404};
 const now=Date.now(),old=cache.get(slug);
 if(old&&now-old.at<60000)return {status:200,body:old.body};
 try{
  // Only public immutable releases. No browser cookies, auth headers, drafts or user data are forwarded.
  const response=await fetcher('https://erenedebali.com/api/sideways/published/'+slug,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(6000),redirect:'error'});
  if(response.status===404){cache.delete(slug);return {status:404};}
  if(!response.ok)throw Error('Release unavailable');
  const reader=response.body.getReader(),chunks=[];let size=0;
  try{for(;;){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>2000000){await reader.cancel();throw Error('Oversized release');}chunks.push(part.value);}}finally{reader.releaseLock();}
  const data=JSON.parse(Buffer.concat(chunks).toString('utf8'));
  if(![1,2].includes(data.schemaVersion)||data.key!==slug||!Array.isArray(data.visits)||!Array.isArray(data.segments)||!data.visits.some(v=>v.visible))throw Error('Invalid release');
  // Explicit public projection also prevents future upstream metadata from leaking.
  const body=JSON.stringify(projectPublishedRoute(data));
  cache.set(slug,{at:now,body});return {status:200,body};
 }catch{return old&&now-old.at<86400000?{status:200,body:old.body}:{status:503};}
}

let catalogCache;
export async function readRouteCatalog(fetcher=fetch){
 if(catalogCache&&Date.now()-catalogCache.at<60000)return {status:200,body:catalogCache.body};
 try{const r=await fetcher('https://erenedebali.com/api/sideways/catalog',{headers:{Accept:'application/json'},signal:AbortSignal.timeout(6000),redirect:'error'});if(!r.ok)throw Error();const d=await r.json();if(!Array.isArray(d.routes)||d.routes.length>100)throw Error();const routes=d.routes.filter(r=>validSlug(r.key)&&typeof r.title==='string').map(r=>({key:r.key,title:r.title.slice(0,120),published:r.published===true}));const body=JSON.stringify({routes});catalogCache={at:Date.now(),body};return {status:200,body};}catch{return {status:503};}
}
