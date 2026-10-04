import test from 'node:test';
import assert from 'node:assert/strict';
import {readPublishedRoute} from '../published-routes.mjs';
import {copyFor} from '../public/field-guide/guide.js';

const release=(key,extra={})=>({
  schemaVersion:1,key,revision:3,publishedAt:'2026-10-04T00:00:00.000Z',
  visits:[{key:'stop',visible:true,copy:[]}],segments:[],copy:[],
  ...extra,
});

test('only explicit public releases are fetched without user cookies or headers',async()=>{
  let called=false;
  const fetcher=async(url,options)=>{
    called=true;
    assert.equal(url,'https://erenedebali.com/api/sideways/published/projection');
    assert.deepEqual(options.headers,{Accept:'application/json'});
    return Response.json(release('projection',{
      private:'never forward',adminNotes:'private note',registrationExport:['private entry'],
    }));
  };
  const result=await readPublishedRoute('projection',fetcher);
  assert.equal(result.status,200);
  assert.deepEqual(Object.keys(JSON.parse(result.body)).sort(),[
    'copy','key','publishedAt','revision','schemaVersion','segments','sourceLanguage','visits',
  ]);
  assert.equal(JSON.parse(result.body).sourceLanguage,'en');
  assert.ok(!result.body.includes('private'));
  assert.ok(called);
});

test('Turkish source survives projection and pending text cannot become visitor fallback',async()=>{
  const approved={locale:'tr',title:'Türkçe kaynak',needsReview:false};
  const pending={locale:'it',title:'Unreviewed Italian',needsReview:true};
  const input=release('turkish-source',{
    sourceLanguage:'tr',copy:[approved,pending],
    segments:[{key:'walk',copy:[approved,pending]}],
    visits:[{key:'stop',visible:true,copy:[approved,pending],ideas:[{key:'idea',copy:[approved,pending]}]}],
    places:[{key:'place',copy:[approved,pending]}],
    private:'upstream-only',
  });
  const result=await readPublishedRoute('turkish-source',async()=>Response.json(input));
  assert.equal(result.status,200);
  const publicRoute=JSON.parse(result.body);
  assert.equal(publicRoute.sourceLanguage,'tr');
  assert.equal(copyFor(publicRoute.copy,'it',publicRoute.sourceLanguage).title,'Türkçe kaynak');
  for(const rows of [publicRoute.copy,publicRoute.segments[0].copy,publicRoute.visits[0].copy,
    publicRoute.visits[0].ideas[0].copy,publicRoute.places[0].copy])
    assert.deepEqual(rows,[approved]);
  assert.ok(!result.body.includes('Unreviewed Italian'));
  assert.ok(!result.body.includes('upstream-only'));
});

test('reviewed English remains the first fallback before Turkish source',async()=>{
  const rows=[
    {locale:'tr',title:'Türkçe kaynak',needsReview:false},
    {locale:'en',title:'Reviewed English',needsReview:false},
    {locale:'it',title:'Pending Italian',needsReview:true},
  ];
  const result=await readPublishedRoute('english-fallback',async()=>Response.json(release('english-fallback',{sourceLanguage:'tr',copy:rows})));
  assert.equal(result.status,200);
  const publicRoute=JSON.parse(result.body);
  assert.equal(copyFor(publicRoute.copy,'it',publicRoute.sourceLanguage).title,'Reviewed English');
  assert.equal(copyFor(publicRoute.copy,'tr',publicRoute.sourceLanguage).title,'Türkçe kaynak');
  assert.ok(!result.body.includes('Pending Italian'));
});

test('invalid source languages fail closed rather than creating an untrusted fallback',async()=>{
  for(const [key,value] of [['unknown-source','fr'],['null-source',null],['case-source','TR']]){
    const result=await readPublishedRoute(key,async()=>Response.json(release(key,{sourceLanguage:value})));
    assert.equal(result.status,503,key);
  }
});

test('draft and unknown route paths cannot be proxied',async()=>{
  for(const key of ['../../users','main/save','DRAFT',''])
    assert.equal((await readPublishedRoute(key,()=>{throw Error('must not fetch');})).status,404);
});

test('missing releases retain the original route and failures do not expose upstream data',async()=>{
  assert.equal((await readPublishedRoute('short',async()=>new Response(null,{status:404}))).status,404);
  assert.equal((await readPublishedRoute('full',async()=>Response.json({secret:'private'}))).status,503);
});
