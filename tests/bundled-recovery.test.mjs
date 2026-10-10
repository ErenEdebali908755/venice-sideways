import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from '../server.mjs';
import {readPublishedRoute} from '../published-routes.mjs';
import {storyFor} from '../public/field-guide/guide.js';
const nativeFetch=globalThis.fetch;
async function serve(env,run){const server=await createServer({env});await new Promise((yes,no)=>{server.once('error',no);server.listen(0,'127.0.0.1',yes)});try{await run(`http://127.0.0.1:${server.address().port}`)}finally{await new Promise(r=>server.close(r))}}
test('operator recovery bypasses upstream and previously cached releases; does not rewrite packaged files',async()=>{
 const release={schemaVersion:3,key:'recovery-fixture',revision:42,visits:[{key:'fixture',visible:true,copy:[]}],segments:[],copy:[]};
 assert.equal((await readPublishedRoute('recovery-fixture',async()=>Response.json(release))).status,200);
 let upstream=0;globalThis.fetch=async()=>{upstream++;throw Error('Upstream deliberately unavailable')};
 try{await serve({SIDEWAYS_FORCE_BUNDLED:'1'},async base=>{
  const catalog=await nativeFetch(base+'/api/route-catalog');assert.equal(catalog.status,200);assert.equal(catalog.headers.get('cache-control'),'no-store');const body=await catalog.json();assert.equal(body.source,'bundled');assert.equal(body.reason,'operator_override');assert.deepEqual(body.routes,[{key:'main',published:false},{key:'full',published:false}]);
  for(const key of ['main','full','recovery-fixture']){const r=await nativeFetch(base+'/api/routes/'+key);assert.equal(r.status,404);assert.equal(r.headers.get('cache-control'),'no-store')}
  const head=await nativeFetch(base+'/api/route-catalog',{method:'HEAD'});assert.equal(head.status,200);assert.equal(await head.text(),'');
  const routes=await(await nativeFetch(base+'/field-guide/routes.json')).json();assert.equal(routes.routes[0].visits.length,11);assert.equal(routes.routes[1].visits.length,28);
  assert.equal((await nativeFetch(base+'/api/route-catalog',{method:'POST'})).status,405);
  assert.equal((await nativeFetch(base+'/events/main-walk-2026-10-11')).status,200);
 });assert.equal(upstream,0);
 // Removing the operator flag restores the existing publication path; no CMS data deleted.
 await serve({},async base=>{const r=await nativeFetch(base+'/api/routes/recovery-fixture?SIDEWAYS_FORCE_BUNDLED=1',{headers:{'X-Sideways-Force-Bundled':'1',Cookie:'SIDEWAYS_FORCE_BUNDLED=1'}});assert.equal(r.status,200);assert.equal((await r.json()).revision,42)});
 for(const value of ['0','true','yes'])await serve({SIDEWAYS_FORCE_BUNDLED:value},async base=>assert.equal((await nativeFetch(base+'/api/routes/recovery-fixture')).status,200));
 }finally{globalThis.fetch=nativeFetch;}
});
test('all eight locales respect joint TR/EN review and never expose English drafts',()=>{
 // Entirely synthetic review states; no research content is approved by this test.
 const visit={key:'fixture',placeKey:'fixture'};
 const story={sourceLanguage:'tr',review:{status:'reviewed'},copy:[{locale:'tr',shortHistory:'TR fixture',interestingDetail:'TR detail',needsReview:false},{locale:'en',shortHistory:'EN fixture',interestingDetail:'EN detail',needsReview:false}]};
 const route={places:[{key:'fixture',story}]};
 for(const lang of ['en','tr','it','fr','ru','zh','ja','ko'])assert.equal(storyFor(visit,route,lang).copy.locale,lang==='tr'?'tr':'en');
 story.copy[1].needsReview=true;
 for(const lang of ['en','it','fr','ru','zh','ja','ko'])assert.equal(storyFor(visit,route,lang).copy.locale,'tr');
 story.copy[0].needsReview=true;
 for(const lang of ['en','tr','it','fr','ru','zh','ja','ko'])assert.equal(storyFor(visit,route,lang),null);
 story.review.status='proposal_needs_review';assert.equal(storyFor(visit,route,'en'),null);assert.equal(storyFor(visit,route,'en',true).pending,true);
});
