import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {orderedVisits,copyFor} from '../public/field-guide/guide.js';
const {routes}=JSON.parse(await readFile(new URL('../public/field-guide/routes.json',import.meta.url),'utf8'));
test('field guide keeps Main and Full stop counts, independent order and eight prompt languages',()=>{
 assert.deepEqual(routes.map(r=>r.key),['main','full']);
 assert.deepEqual(routes.map(r=>orderedVisits(r).length),[11,28]);
 for(const route of routes) for(const visit of orderedVisits(route)) {
  assert.equal(visit.ideas.length,5);
  for(const idea of visit.ideas) for(const locale of ['en','tr','it','fr','ru','zh','ja','ko'])assert.ok(idea.copy.find(c=>c.locale===locale)?.text,`${visit.key} ${locale}`);
 }
 const changed=structuredClone(routes[0]);changed.visits[0].visible=false;
 assert.equal(orderedVisits(changed)[0].key,'giacomo');
 assert.equal(orderedVisits(routes[0])[0].key,'lucia');
});
test('requested language uses its own content and safely falls back to English',()=>{
 const rows=[{locale:'en',title:'English'},{locale:'tr',title:'Türkçe'}];
 assert.equal(copyFor(rows,'tr').title,'Türkçe');assert.equal(copyFor(rows,'missing').title,'English');assert.deepEqual(copyFor(undefined,'tr'),{});
});
