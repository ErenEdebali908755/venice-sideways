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
      t:(english)=>english,render:()=>{},renderStatus:()=>{},error:'',
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
    assert.equal(guide.error,'');
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
