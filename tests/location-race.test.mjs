import test from 'node:test';
import assert from 'node:assert/strict';
import {FieldGuide} from '../public/field-guide/guide.js';

test('a stopped location watch cannot recreate a pin or interrupt a newer watch',()=>{
  const previous=new Map(['navigator','confirm','maplibregl'].map(name=>[name,Object.getOwnPropertyDescriptor(globalThis,name)]));
  const watches=[];
  const cleared=[];
  let created=0,removed=0;
  class Marker {
    constructor(){created++}
    addTo(){assert.ok(this.coordinates,'setLngLat must precede addTo');return this}
    setLngLat(value){this.coordinates=value;return this}
    remove(){removed++}
  }
  try {
    Object.defineProperty(globalThis,'navigator',{configurable:true,value:{geolocation:{
      watchPosition(success,error){watches.push({success,error});return watches.length},
      clearWatch(id){cleared.push(id)},
    }}});
    Object.defineProperty(globalThis,'confirm',{configurable:true,value:()=>true});
    Object.defineProperty(globalThis,'maplibregl',{configurable:true,value:{Marker}});
    const guide=Object.assign(Object.create(FieldGuide.prototype),{
      preview:false,ready:true,watch:null,locationGeneration:0,locationPin:null,map:{},
      t:(english)=>english,render:()=>{},renderStatus:()=>{},mapError:'',locationStatus:'',
    });
    guide.locate();
    assert.equal(guide.watch,1);
    guide.stopLocation();
    watches[0].success({coords:{longitude:12.32,latitude:45.44}});
    assert.equal(guide.locationPin,null,'late success cannot reveal a stopped position');
    assert.equal(created,0);

    guide.locate();
    assert.equal(guide.watch,2);
    watches[0].error();
    assert.equal(guide.watch,2,'late error cannot stop a new watch');
    assert.equal(guide.mapError,'');
    assert.equal(guide.locationStatus,'');
    watches[1].success({coords:{longitude:12.33,latitude:45.43}});
    assert.deepEqual(guide.locationPin.coordinates,[12.33,45.43]);
    guide.stopLocation();
    watches[1].success({coords:{longitude:12.34,latitude:45.42}});
    assert.equal(guide.locationPin,null);
    assert.equal(created,1);
    assert.equal(removed,1);
    assert.deepEqual(cleared,[1,2]);
  } finally {
    for(const [name,descriptor] of previous)
      if(descriptor)Object.defineProperty(globalThis,name,descriptor);
      else delete globalThis[name];
  }
});

test('GPS denial, timeout and unsupported location leave a working map without map retry',()=>{
  const names=['navigator','document','confirm'];
  const previous=new Map(names.map(name=>[name,Object.getOwnPropertyDescriptor(globalThis,name)]));
  const watches=[];
  const map={};
  const status={
    message:'',children:[],hidden:false,
    set textContent(value){this.message=value;this.children=[]},
    get textContent(){return this.message},
    append(child){this.children.push(child)},
  };
  try {
    Object.defineProperty(globalThis,'navigator',{configurable:true,value:{online:true,onLine:true,geolocation:{
      watchPosition(success,error){watches.push({success,error});return watches.length},
      clearWatch(){},
    }}});
    Object.defineProperty(globalThis,'document',{configurable:true,value:{createElement:()=>({})}});
    Object.defineProperty(globalThis,'confirm',{configurable:true,value:()=>true});
    const guide=Object.assign(Object.create(FieldGuide.prototype),{
      preview:false,ready:true,watch:null,locationGeneration:0,locationPin:null,
      map,mapError:'',locationStatus:'',t:(english)=>english,
      el:()=>status,
    });
    guide.render=()=>guide.renderStatus();
    for(const code of [1,2,3]){
      guide.locate();
      assert.equal(guide.watch,watches.length);
      watches.at(-1).error({code});
      assert.equal(guide.watch,null);
      assert.equal(guide.ready,true);
      assert.equal(guide.map,map);
      assert.match(status.message,/Location unavailable/);
      assert.equal(status.children.length,0,'GPS error must not offer map retry');
      assert.equal(guide.mapError,'');
    }
    globalThis.navigator.geolocation=undefined;
    guide.locate();
    assert.match(status.message,/Location is unavailable on this device/);
    assert.equal(status.children.length,0,'unsupported GPS must not offer map retry');
    assert.equal(guide.ready,true);
    assert.equal(guide.map,map);

    guide.mapError='Map unavailable';
    guide.renderStatus();
    assert.equal(status.children.length,1,'an actual map error still offers retry');
    assert.equal(status.children[0].textContent,'Retry map');
  } finally {
    for(const [name,descriptor] of previous)
      if(descriptor)Object.defineProperty(globalThis,name,descriptor);
      else delete globalThis[name];
  }
});
