import test from 'node:test';import assert from 'node:assert/strict';import {access,readFile} from 'node:fs/promises';import {createServer} from '../server.mjs';
let server,base;
test.before(async()=>{server=await createServer();await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',()=>{server.off('error',reject);resolve()})});base=`http://127.0.0.1:${server.address().port}`;});
test.after(()=>server?.listening?new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve())):undefined);
test('root is independently branded and allows own-origin location',async()=>{const r=await fetch(base);assert.equal(r.status,200);assert.match(await r.text(),/<title>Venice Sideways<\/title>/);assert.match(r.headers.get('permissions-policy'),/geolocation=\(self\)/);assert.equal(r.headers.get('x-frame-options'),'DENY');});
test('old path alias redirects without overriding fragment or query',async()=>{const r=await fetch(base+'/venice-photography-walk-map?lang=tr',{redirect:'manual'});assert.equal(r.status,308);assert.equal(r.headers.get('location'),'/?lang=tr');});
test('private application paths and location uploads are absent',async()=>{for(const p of ['/admin','/.env','/server.mjs','/analytics/collect','/api/location','/%2e%2e/server.mjs'])assert.equal((await fetch(base+p)).status,404,p);assert.equal((await fetch(base+'/api/location',{method:'POST',body:'never-record-this'})).status,405);});
test('current guide assets have correct MIME and conditional caching',async()=>{const path='/field-guide/walking-state.js';const r=await fetch(base+path);assert.equal(r.status,200);assert.match(r.headers.get('content-type'),/javascript/);assert.equal(await r.text(),await readFile(new URL('../public'+path,import.meta.url),'utf8'));const cached=await fetch(base+path,{headers:{'If-None-Match':r.headers.get('etag')}});assert.equal(cached.status,304);});
test('healthcheck works',async()=>{assert.equal(await (await fetch(base+'/healthz')).text(),'ok');});
test('branded tab and mobile icons are served',async()=>{
 for(const [path,type] of [['/favicon.svg','image/svg+xml'],['/favicon.ico','image/x-icon'],['/apple-touch-icon.png','image/png'],['/site.webmanifest','application/manifest+json']]){
  const r=await fetch(base+path);assert.equal(r.status,200,path);assert.match(r.headers.get('content-type'),new RegExp(type.replace('+','\\+')),path);assert.ok((await r.arrayBuffer()).byteLength>100,path);
 }
});
test('event links resolve to a versioned form script without exposing private files',async()=>{
 const r=await fetch(base+'/events/main-walk-2026-10-11?lang=tr');
 assert.equal(r.status,200);assert.match(await r.text(),/events\/events\.js\?v=[\w-]+/);
 assert.equal((await fetch(base+'/events/invalid.slug')).status,404);
});

test('legacy classic URL keeps its 308 redirect after the unused entry file is removed',async()=>{await assert.rejects(access(new URL('../public/classic.html',import.meta.url)),{code:'ENOENT'});for(const method of ['GET','HEAD']){const r=await fetch(base+'/classic.html?lang=tr',{method,redirect:'manual'});assert.equal(r.status,308);assert.equal(r.headers.get('location'),'/?lang=tr');assert.equal(await r.text(),'');}});
