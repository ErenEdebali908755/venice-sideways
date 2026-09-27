const slugs=new Set(['main','full','short','cannaregio','castello','biennale']);
const cache=new Map();
export async function readPublishedRoute(slug,fetcher=fetch){
 if(!slugs.has(slug))return {status:404};
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
  if(data.schemaVersion!==1||data.key!==slug||!Array.isArray(data.visits)||!Array.isArray(data.segments)||!data.visits.some(v=>v.visible))throw Error('Invalid release');
  // Explicit public projection also prevents future upstream metadata from leaking.
  const body=JSON.stringify({schemaVersion:1,key:data.key,revision:data.revision,publishedAt:data.publishedAt,copy:data.copy,visits:data.visits,segments:data.segments,places:data.places,sunsetVisitKey:data.sunsetVisitKey,sunsetOffsetMinutes:data.sunsetOffsetMinutes});
  cache.set(slug,{at:now,body});return {status:200,body};
 }catch{return old&&now-old.at<86400000?{status:200,body:old.body}:{status:503};}
}
