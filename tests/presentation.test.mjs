import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {MAIN_WALK_PRESENTATION, presentedRoutes, replacePublishedRoutes} from '../public/field-guide/presentation.js';
import {restoreWalkingState, advanceWalkingState, saveWalkingProgress, loadWalkingProgress} from '../public/field-guide/walking-state.js';
const {routes} = JSON.parse(await readFile(new URL('../public/field-guide/routes.json', import.meta.url)));
test('Main presentation is independent of complete route records and private preview',()=>{
 assert.deepEqual(presentedRoutes(routes,MAIN_WALK_PRESENTATION).map(route=>route.key),['main']);
 assert.deepEqual(presentedRoutes(routes,null),routes);
 assert.equal(routes.find(route=>route.key==='full').visits.filter(visit=>visit.visible&&visit.isPhotoStop).length,28);
});
test('a Main-only publication cannot erase an existing Full walking target',()=>{
 const main=routes.find(route=>route.key==='main'),full=routes.find(route=>route.key==='full');
 const oldFull=advanceWalkingState(full,restoreWalkingState(full));
 const published={...main,version:main.version};
 const all=replacePublishedRoutes(routes,[published,null]);
 assert.equal(all.find(route=>route.key==='full'),full);
 let text=''; const storage={getItem:()=>text,setItem:(_,value)=>{text=value;}};
 saveWalkingProgress(storage,all,{main:advanceWalkingState(published,restoreWalkingState(published)),full:oldFull});
 assert.deepEqual(loadWalkingProgress(storage).full,oldFull);
});
test('public entry keeps route records and guards both hash and query links',async()=>{
 const entry=await readFile(new URL('../public/field-guide/entry.js', import.meta.url),'utf8');
 assert.match(entry,/replacePublishedRoutes\(base.routes,published\)/);
 assert.match(entry,/presentation:MAIN_WALK_PRESENTATION/);
 assert.match(entry,/requested&&guide.isVisibleRoute\(requested\)/);
 assert.match(entry,/location.hash/);assert.match(entry,/location.search/);
});
