import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {walkingSteps, restoreWalkingState, advanceWalkingState, continueWalkingAt, previousWalkingState, activeWalkingGeometry, transitLegGeometry, loadWalkingProgress, saveWalkingProgress, WALKING_STORAGE_KEY} from '../public/field-guide/walking-state.js';
import {FieldGuide} from '../public/field-guide/guide.js';
const {routes} = JSON.parse(await readFile(new URL('../public/field-guide/routes.json',import.meta.url),'utf8'));
const main=routes.find(route=>route.key==='main'), full=routes.find(route=>route.key==='full');
test('Main has eleven photo stops and one separate transfer; Full keeps twenty-eight',()=>{
  assert.equal(walkingSteps(main).filter(step=>step.isPhotoStop).length,11);
  assert.equal(walkingSteps(main).filter(step=>step.boat).length,1);
  assert.equal(walkingSteps(full).filter(step=>step.isPhotoStop).length,28);
});
test('start, arrival, photo pause and named next target are distinct manual states',()=>{
  let state=restoreWalkingState(main);const steps=walkingSteps(main);
  assert.equal(state.phase,'reaching-start');assert.equal(state.targetKey,steps[0].key);
  state=advanceWalkingState(main,state);assert.equal(state.targetKey,steps[1].key);assert.equal(state.phase,'walking');
  state=advanceWalkingState(main,state);assert.equal(state.targetKey,steps[1].key);assert.equal(state.phase,'at-stop');
  state=advanceWalkingState(main,state);assert.equal(state.targetKey,steps[2].key);assert.equal(state.phase,'walking');
  assert.deepEqual(state.completedVisitKeys,[steps[0].key,steps[1].key]);
});
test('two boat legs must both be acknowledged before the next real photo stop',()=>{
  const steps=walkingSteps(main),boat=steps.find(step=>step.boat),index=steps.indexOf(boat);
  let state=continueWalkingAt(main,restoreWalkingState(main),boat.key);
  assert.equal(state.transitLeg,0);assert.equal(state.phase,'transit');
  state=advanceWalkingState(main,state);assert.equal(state.targetKey,boat.key);assert.equal(state.transitLeg,1);
  state=advanceWalkingState(main,state);assert.equal(state.targetKey,steps[index+1].key);assert.equal(state.phase,'walking');
  assert.equal(state.completedVisitKeys.includes(boat.key),false);
});
test('completion is explicit and previous-stop navigation remains manual',()=>{
  let state=restoreWalkingState(full);let safety=0;
  while(state.phase!=='complete'&&safety++<100)state=advanceWalkingState(full,state);
  assert.equal(state.phase,'complete');assert.equal(state.completedVisitKeys.length,28);
  assert.deepEqual(advanceWalkingState(full,state),state);
  state=previousWalkingState(full,state);assert.equal(state.phase,'walking');assert.equal(state.targetKey,walkingSteps(full).at(-2).key);
});
test('storage is route-specific and changed revisions never keep removed visit identities',()=>{
  const state=advanceWalkingState(main,restoreWalkingState(main));let text='';const storage={setItem(key,value){assert.equal(key,WALKING_STORAGE_KEY);text=value;},getItem(){return text;}};
  saveWalkingProgress(storage,routes,{main:state});const loaded=loadWalkingProgress(storage);
  assert.equal(restoreWalkingState(main,loaded.main).targetKey,state.targetKey);
  assert.equal(restoreWalkingState(full,loaded.full).phase,'reaching-start');
  const changed=structuredClone(main);changed.revision=77;changed.visits=changed.visits.filter(visit=>visit.key!==state.targetKey);
  assert.equal(restoreWalkingState(changed,loaded.main).phase,'reaching-start');
  const validChanged=structuredClone(main);validChanged.revision=78;
  assert.equal(restoreWalkingState(validChanged,loaded.main).targetKey,state.targetKey);
  assert.notEqual(restoreWalkingState(validChanged,loaded.main).revision,state.revision);
  assert.deepEqual(loadWalkingProgress({getItem(){return '{bad'}}),{});
});
test('walking leg is a subset of recorded path vertices and never a fabricated shortcut',()=>{
  const state=advanceWalkingState(main,restoreWalkingState(main));const line=activeWalkingGeometry(main,state);
  assert.ok(line.length>=2);
  const geometry=main.segments.find(segment=>segment.key===walkingSteps(main)[1].segmentKey).geometry;
  assert.ok(line.every(coordinate=>geometry.some(point=>point[0]===coordinate[0]&&point[1]===coordinate[1])));
  assert.deepEqual(activeWalkingGeometry(main,restoreWalkingState(main)),[]);
});
test('rapid repeated activation advances exactly one valid transition',()=>{
  const fixture={route:main,walking:restoreWalkingState(main),lastWalkingAction:-Infinity,
    allowWalkingAction:FieldGuide.prototype.allowWalkingAction,syncWalkingState(){},persistWalkingState(){},render(){},draw(){},focus(){}};
  FieldGuide.prototype.action.call(fixture,'walk-advance');const target=fixture.walking.targetKey;
  FieldGuide.prototype.action.call(fixture,'walk-advance');assert.equal(fixture.walking.targetKey,target);assert.equal(fixture.walking.phase,'walking');
});

test('a custom boat segment cannot borrow the Main ACTV geometry',()=>{
  const custom={boat:true,routingReviewed:false,geometry:[[13,46],[13.1,46.1]],transitStops:[{placeKey:'board',longitude:13,latitude:46},{placeKey:'land',longitude:13.1,latitude:46.1}]};
  const water={legs:[{coordinates:[[12.3,45.4],[12.4,45.5]]}]};
  assert.deepEqual(transitLegGeometry(custom,water,0),[]);
  const reviewed={...custom,routingReviewed:true,geometry:[[13,46],[13.025,46.025],[13.05,46.05],[13.1,46.1]]};
  assert.deepEqual(transitLegGeometry(reviewed,water,0),reviewed.geometry);
});
