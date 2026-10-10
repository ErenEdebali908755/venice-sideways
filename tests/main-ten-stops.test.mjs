import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {storyFor} from '../public/field-guide/guide.js';
import {walkingSteps,restoreWalkingState,advanceWalkingState,activeWalkingGeometry} from '../public/field-guide/walking-state.js';
const {routes}=JSON.parse(await readFile(new URL('../public/field-guide/routes.json',import.meta.url),'utf8'));
const main=routes.find(route=>route.key==='main');
const keys=['lucia','giacomo','frari','margherita','barnaba','trovaso','zattere','dogana','accademia','trearchi'];
test('Main ends at Tre Archi in all eight locales, with the recorded final leg trimmed',()=>{
 assert.deepEqual(main.visits.map(v=>v.key),keys);
 assert.doesNotMatch(JSON.stringify(main),/Vino Vero|"vino"/i);
 assert.equal(main.copy.length,8);
 for(const row of main.copy){assert.match(row.text,/10/);assert.match(row.text,/Tre Archi/);}
 const last=main.visits.at(-1),line=main.segments.at(-1).geometry;
 assert.equal(line.length,25);assert.deepEqual(line.at(-1),[12.320735,45.445573]);
 const state={...restoreWalkingState(main),targetKey:'trearchi',phase:'walking'};
 assert.deepEqual(activeWalkingGeometry(main,state),line);
 assert.equal(main.segments.find(s=>s.type==='vaporetto').transitStops.length-1,2);
 assert.equal(last.ideas.length,5);
});
test('old Vino progress recovers at the new Main endpoint and never restarts at Lucia',()=>{
 for(const phase of ['walking','at-stop','complete']){
  const saved={schemaVersion:1,routeKey:'main',revision:'old-eleven',targetKey:'vino',phase,completedVisitKeys:[...keys,'vino'],transitLeg:0};
  const recovered=restoreWalkingState(main,saved);
  assert.equal(recovered.targetKey,'trearchi');assert.equal(recovered.phase,'complete');assert.deepEqual(recovered.completedVisitKeys,keys);
  assert.deepEqual(restoreWalkingState(main,recovered),recovered);
 }
 const incomplete=restoreWalkingState(main,{schemaVersion:1,routeKey:'main',targetKey:'vino',phase:'walking',completedVisitKeys:['lucia']});
 assert.equal(incomplete.targetKey,'trearchi');assert.equal(incomplete.phase,'walking');
 assert.equal(restoreWalkingState(main,{...incomplete,targetKey:'unknown'}).phase,'reaching-start');
});
test('complete Main walk has ten stops and two separately acknowledged boat legs',()=>{
 let state=restoreWalkingState(main),transitActions=0,actions=0;
 while(state.phase!=='complete'&&actions++<40){if(state.phase==='transit')transitActions++;state=advanceWalkingState(main,state);}
 assert.equal(state.targetKey,'trearchi');assert.equal(state.phase,'complete');assert.deepEqual(state.completedVisitKeys,keys);assert.equal(transitActions,2);
});
test('all ten reviewed short stories show TR and EN, and explicitly fall back to EN in the other locales',()=>{
 for(const visit of main.visits){
  assert.equal(visit.story.review.status,'reviewed');assert.equal(visit.story.copy.length,2);
  for(const locale of ['tr','en','it','fr','ru','zh','ja','ko']){
   const story=storyFor(visit,main,locale);assert.ok(story);assert.equal(story.pending,false);
   assert.equal(story.copy.locale,locale==='tr'?'tr':'en');assert.ok(story.copy.shortHistory.length<=280);assert.ok(story.copy.interestingDetail);
  }
  assert.ok(visit.story.sources.length);assert.ok(visit.story.sources.every(s=>s.url.startsWith('https://')&&s.checkedAt==='2026-10-10'));
  assert.equal(visit.story.review.humanReviewedBy,undefined);assert.equal(visit.story.review.notes,undefined);
 }
 const barnaba=main.visits.find(v=>v.key==='barnaba').story.copy;
 assert.match(barnaba[0].interestingDetail,/İstria taşı/);assert.match(barnaba[1].interestingDetail,/Istrian stone/);assert.doesNotMatch(JSON.stringify(barnaba),/marble|mermer|1705/);
});
test('Full Walk is byte-equivalent after JSON serialization to the pre-event baseline',()=>{
 assert.equal(createHash('sha256').update(JSON.stringify(routes.find(r=>r.key==='full'))).digest('hex'),'7e6b1b8ae0b93053a81f50a13c1c184b883cc245c17142709687522bc47667f7');
});
