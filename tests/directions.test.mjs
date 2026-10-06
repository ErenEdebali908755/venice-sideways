import test from 'node:test';
import assert from 'node:assert/strict';
import {directionFeatures} from '../public/field-guide/directions.js';
const map={getContainer:()=>({clientWidth:1000,clientHeight:600}),project:([x,y])=>({x,y})};
const line=(coordinates,properties={})=>({properties,geometry:{coordinates}});
test('ordered route turns rotate screen arrows and reverse order reverses bearing',()=>{
 const result=directionFeatures(map,[line([[20,50],[600,50],[600,550]])]);
 assert.ok(result.features.length>5);
 assert.ok(result.features.some(f=>f.properties.angle===0));
 assert.ok(result.features.some(f=>f.properties.angle===90));
 const reversed=directionFeatures(map,[line([[600,50],[20,50]])]);
 assert.ok(reversed.features.every(f=>Math.abs(f.properties.angle)===180));
});
test('spacing is independent of vertex density and respects budget, viewport and selection',()=>{
 const dense=Array.from({length:901},(_,i)=>[20+i,100]);
 assert.deepEqual(directionFeatures(map,[line(dense)]),directionFeatures(map,[line([[20,100],[920,100]])]));
 assert.equal(directionFeatures(map,[line([[20,100],[920,100]])],{max:3}).features.length,3);
 assert.equal(directionFeatures(map,[line([[20,100],[920,100]],{selected:false})]).features.length,0);
 assert.equal(directionFeatures(map,[line([[20,-100],[920,-100]])]).features.length,0);
 assert.equal(directionFeatures({...map,getContainer:()=>({clientWidth:320,clientHeight:100})},[line([[20,50],[300,50]])]).features.length,0);
});
