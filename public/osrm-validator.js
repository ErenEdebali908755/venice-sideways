/* Classic-only routing admission; geography and requested stop order remain authoritative. */
(() => {
  'use strict';
  const MAX_BYTES = 2000000, MAX_COORDINATES = 20000, VERSION = 'osrm-stop-bound-v1';
  const point = p => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite) && p[0] >= 12.30 && p[0] <= 12.38 && p[1] >= 45.415 && p[1] <= 45.46;
  function distance(a,b) { const rad=Math.PI/180,p1=a[1]*rad,p2=b[1]*rad,dp=(b[1]-a[1])*rad,dl=(b[0]-a[0])*rad,h=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2; return 6371008.8*2*Math.atan2(Math.sqrt(h),Math.sqrt(Math.max(0,1-h))); }
  const requested = stop => [stop.lon ?? stop.longitude,stop.lat ?? stop.latitude];
  function validate(data, stops) {
    if (!Array.isArray(stops) || stops.length < 2 || stops.length > 200 || stops.some(s=>!point(requested(s)))) throw Error('Invalid requested stops');
    const route=data?.routes?.[0];
    if (data?.code!=='Ok' || !Array.isArray(data.routes) || data.routes.length !== 1 || !route || !Number.isFinite(route.distance) || route.distance<=0 || route.distance>30000 || !Array.isArray(route.legs) || route.legs.length!==stops.length-1 || !Array.isArray(data.waypoints) || data.waypoints.length!==stops.length) throw Error('Invalid route shape');
    let count=0; const geometry=value=>{const rows=value?.coordinates;if(value?.type!=='LineString'||!Array.isArray(rows)||!rows.length||(count+=rows.length)>MAX_COORDINATES||rows.some(p=>!point(p)))throw Error('Invalid geometry');return rows;};
    const whole=geometry(route.geometry);
    for(let i=0;i<stops.length;i++){const waypoint=data.waypoints[i];if(!point(waypoint?.location)||!Number.isFinite(waypoint.distance)||waypoint.distance<0||waypoint.distance>100||distance(waypoint.location,requested(stops[i]))>100)throw Error('Stop mismatch');}
    if(distance(whole[0],data.waypoints[0].location)>20||distance(whole.at(-1),data.waypoints.at(-1).location)>20)throw Error('Route endpoint mismatch');
    let total=0, previousEnd=null, cursor=0;
    for(let i=0;i<data.waypoints.length;i++){let closest=Infinity,index=cursor;for(let k=cursor;k<whole.length;k++){const meters=distance(whole[k],data.waypoints[i].location);if(meters<closest){closest=meters;index=k;}}if(closest>100)throw Error('Route does not follow stop order');cursor=index;}
    for(let i=0;i<route.legs.length;i++){
      const leg=route.legs[i];if(!Number.isFinite(leg.distance)||leg.distance<0||leg.distance>30000||!Array.isArray(leg.steps)||!leg.steps.length||leg.steps.length>2000)throw Error('Invalid leg');
      let first=null,last=null,length=0,stepReported=0;
      for(const step of leg.steps){if(step?.mode==='ferry'||!Number.isFinite(step?.distance)||step.distance<0||step.distance>30000)throw Error('Invalid walking step');const rows=geometry(step.geometry);if(last&&distance(last,rows[0])>10)throw Error('Disconnected steps');if(!first)first=rows[0];for(let k=1;k<rows.length;k++)length+=distance(rows[k-1],rows[k]);last=rows.at(-1);stepReported+=step.distance;}
      if(distance(first,data.waypoints[i].location)>20||distance(last,data.waypoints[i+1].location)>20||previousEnd&&distance(previousEnd,first)>10)throw Error('Leg order mismatch');
      const direct=distance(data.waypoints[i].location,data.waypoints[i+1].location);
      if(leg.distance<direct-10||Math.abs(leg.distance-length)>Math.max(75,length*.35)||Math.abs(stepReported-leg.distance)>Math.max(25,leg.distance*.1))throw Error('Implausible leg distance');previousEnd=last;total+=leg.distance;
    }
    if(Math.abs(total-route.distance)>Math.max(25,total*.1))throw Error('Implausible total distance');
    return route;
  }
  async function readJSON(response, signal) {
    const declared=response.headers?.get?.('content-length');if(declared&&/^\d+$/.test(declared)&&Number(declared)>MAX_BYTES){await response.body?.cancel?.();throw Error('Oversized routing response');}
    if(!response.body?.getReader)throw Error('Routing body unavailable');const reader=response.body.getReader();let bytes=0,cancellation;const chunks=[];
    const cancel=()=>{cancellation ||= reader.cancel().catch(()=>{});};const abort=()=>cancel();signal?.addEventListener('abort',abort,{once:true});
    try{for(;;){if(signal?.aborted)throw Error('Routing interrupted');const part=await reader.read();if(part.done)break;bytes+=part.value.byteLength;if(bytes>MAX_BYTES){cancel();throw Error('Oversized routing response');}chunks.push(part.value);}if(signal?.aborted)throw Error('Routing interrupted');const merged=new Uint8Array(bytes);let offset=0;for(const chunk of chunks){merged.set(chunk,offset);offset+=chunk.byteLength;}return JSON.parse(new TextDecoder().decode(merged));}
    finally{signal?.removeEventListener('abort',abort);if(cancellation)await cancellation;reader.releaseLock();}
  }
  const fingerprint = stops => VERSION+':'+stops.map(stop=>requested(stop).join(',')).join(';');
  globalThis.SidewaysOSRM = Object.freeze({validate,readJSON,distance,fingerprint,MAX_BYTES,MAX_COORDINATES,VERSION});
})();
