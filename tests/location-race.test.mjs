import test from 'node:test';
import assert from 'node:assert/strict';
import {LocationEngine,locationCapability,validFix,accuracyGeometry} from '../public/field-guide/location-engine.js';
function fixture(extra={}){
 let time=1790000000000,seq=0;const jobs=new Map(),calls=[],cleared=[],fixes=[],states=[];
 const timers={setTimeout(fn,delay){const id=++seq;jobs.set(id,{fn,at:time+delay});return id},clearTimeout(id){jobs.delete(id)}};
 const geolocation={watchPosition(success,error,options){calls.push({success,error,options});return calls.length},clearWatch(id){cleared.push(id)}};
 const engine=new LocationEngine({allowed:()=>true,geolocation,timers,now:()=>time,onFix:(fix,id)=>fixes.push({fix,id}),onState:state=>states.push(state),...extra});
 const position=(longitude=12.33,accuracy=20,timestamp=time)=>({coords:{longitude,latitude:45.44,accuracy},timestamp});
 const tick=duration=>{time+=duration;for(const [id,job]of[...jobs])if(job.at<=time){jobs.delete(id);job.fn()}};
 return {engine,jobs,calls,cleared,fixes,states,position,tick,now:()=>time};
}
test('capability requires public context and exact host; archive, preview and lookalike hosts are excluded',()=>{
 const base={publicLocation:true,preview:false,secure:true,supported:true};
 assert.equal(locationCapability({...base,host:'venicesideways.com'}),true);
 for(const host of ['erenedebali.com','admin.venicesideways.com','venicesideways.com.evil.test','venicesideways.test','localhost'])assert.equal(locationCapability({...base,host}),false,host);
 assert.equal(locationCapability({...base,host:'localhost',secure:false,localTest:true}),true);
 for(const change of [{publicLocation:false},{preview:true},{secure:false},{supported:false}])assert.equal(locationCapability({...base,host:'venicesideways.com',...change}),false);
});
test('explicit start owns one watch; stop clears coordinates, timers and late callbacks without interrupting a new watch',()=>{
 const f=fixture(),oldMap={},newMap={};assert.equal(f.calls.length,0);
 f.engine.start(oldMap);f.engine.start(oldMap);assert.equal(f.calls.length,1);assert.equal(f.calls[0].options.enableHighAccuracy,false);
 f.engine.stop();f.calls[0].success(f.position());assert.equal(f.fixes.length,0);assert.equal(f.engine.fix,null);assert.equal(f.jobs.size,0);
 f.engine.start(newMap);f.calls[0].error({code:1});assert.equal(f.engine.state,'requesting');
 f.calls[1].success(f.position());assert.equal(f.fixes.length,1);assert.equal(f.fixes[0].id,newMap);assert.deepEqual(f.fixes[0].fix.coordinates,[12.33,45.44]);
 f.engine.stop('suspended');f.calls[1].success(f.position(12.4));assert.equal(f.fixes.length,1);
 assert.equal(f.engine.fix,null);assert.equal(f.engine.pending,null);assert.equal(f.jobs.size,0);assert.deepEqual(f.cleared,[1,2]);assert.equal(f.engine.state,'suspended');
});
test('invalid, old and reversed fixes are rejected; coalescing preserves the newest fix and stale state is truthful',()=>{
 const f=fixture();f.engine.start({});
 for(const p of [f.position(NaN),f.position(181),f.position(12.33,0),f.position(12.33,100001),f.position(12.33,20,f.now()-30001)])f.calls[0].success(p);
 assert.equal(f.fixes.length,0);f.calls[0].success(f.position());assert.equal(f.fixes.length,1);
 f.tick(100);f.calls[0].success(f.position(12.34));f.tick(100);f.calls[0].success(f.position(12.35));f.calls[0].success(f.position(12.36,20,f.now()-100));assert.equal(f.fixes.length,1);
 f.tick(800);assert.equal(f.fixes.length,2);assert.deepEqual(f.fixes.at(-1).fix.coordinates,[12.35,45.44]);
 f.tick(30000);assert.equal(f.engine.state,'stale');f.calls[0].success(f.position(12.37));assert.equal(f.engine.state,'tracking');f.engine.stop();
});
test('recent microsecond timestamps normalize to milliseconds, including delivery delay and window boundaries',()=>{
 const f=fixture(),now=f.now();
 for(const offset of [-30000,-1048,0,5000]){
  const fix=validFix(f.position(12.33,20,(now+offset)*1000),now);
  assert.equal(fix.timestamp,now+offset);
 }
 const native=validFix(f.position(12.33,20,1791618477685000),1791618478737);
 assert.equal(native.timestamp,1791618477685);
});
test('future and non-finite timestamps fall back to receipt time without weakening coordinate validation',()=>{
 const f=fixture(),now=f.now();
 for(const timestamp of [now+5001,NaN,Infinity,undefined,(now+5001)*1000]){
  const position={...f.position(),timestamp};
  assert.equal(validFix(position,now).timestamp,now);
  assert.equal(validFix({...position,coords:{...position.coords,longitude:NaN}},now),null);
  assert.equal(validFix({...position,coords:{...position.coords,accuracy:0}},now),null);
 }
 assert.equal(validFix(f.position(28.97,20,NaN),now).outside,true);
});
test('ordinary milliseconds, stale rejection and strict ordering survive normalization and fallback',()=>{
 const f=fixture(),now=f.now();
 for(const offset of [-30000,-1,0,5000])assert.equal(validFix(f.position(12.33,20,now+offset),now).timestamp,now+offset);
 assert.equal(validFix(f.position(12.33,20,now-30001),now),null);
 for(const timestamp of [now,now-1,now*1000,(now-1)*1000,NaN,now+6000]){
  assert.equal(validFix(f.position(12.33,20,timestamp),now,now),null);
 }
 assert.equal(validFix(f.position(12.33,20,NaN),now,now+1000),null);
 assert.equal(validFix(f.position(12.33,20,NaN),now+1,now).timestamp,now+1);
});
test('denied/unavailable/timeout are GPS states; absent or throwing Permission API does not block start',()=>{
 for(const [code,state]of [[1,'denied'],[2,'unavailable'],[3,'timeout']]){const f=fixture();f.engine.start({});f.calls[0].error({code});assert.equal(f.engine.state,state);assert.equal(f.engine.watch,null);assert.equal(f.jobs.size,0)}
 const bounded=fixture();bounded.engine.start({});bounded.tick(16000);assert.equal(bounded.engine.state,'timeout');assert.equal(bounded.engine.watch,null);
 const unavailable=fixture({allowed:()=>false});unavailable.engine.start({});assert.equal(unavailable.engine.state,'unsupported');assert.equal(unavailable.calls.length,0);
 const optional=fixture({permissions:{query(){throw Error('not supported')}}});optional.engine.start({});assert.equal(optional.engine.state,'requesting');assert.equal(optional.calls.length,1);optional.engine.stop();
});
test('synchronous denial cannot leave a watcher running',()=>{
 const cleared=[];const engine=new LocationEngine({allowed:()=>true,geolocation:{watchPosition(success,error){error({code:1});return 42},clearWatch(id){cleared.push(id)}}});
 engine.start({});assert.equal(engine.state,'denied');assert.equal(engine.watch,null);assert.deepEqual(cleared,[42]);
});
test('a hidden or removed map can stop during paint without leaving a timer or touching the cleared fix',()=>{
 const f=fixture();f.engine.onFix=()=>f.engine.stop('suspended');f.engine.start({});
 assert.doesNotThrow(()=>f.calls[0].success(f.position()));assert.equal(f.engine.state,'suspended');assert.equal(f.engine.fix,null);assert.equal(f.jobs.size,0);assert.deepEqual(f.cleared,[1]);
});
test('outside Venice stays truthful and the accuracy circle uses longitude then latitude',()=>{
 const fix=validFix({coords:{longitude:28.97,latitude:41.01,accuracy:50},timestamp:100000},100000);assert.equal(fix.outside,true);assert.deepEqual(fix.coordinates,[28.97,41.01]);
 const ring=accuracyGeometry(fix).geometry.coordinates[0];assert.deepEqual(ring[0],ring.at(-1));assert.ok(Math.abs(ring[0][0]-28.97)<.001);
});
