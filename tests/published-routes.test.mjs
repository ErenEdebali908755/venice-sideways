import test from 'node:test';
import assert from 'node:assert/strict';
import {readPublishedRoute} from '../published-routes.mjs';
import {copyFor,storyFor} from '../public/field-guide/guide.js';

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

const reviewedStory={
  sourceLanguage:'tr',
  copy:[
    {locale:'tr',shortHistory:'Onaylı Türkçe tarih',interestingDetail:'Onaylı ayrıntı',needsReview:false},
    {locale:'en',shortHistory:'Reviewed English history',interestingDetail:'Reviewed detail',needsReview:false},
    {locale:'it',shortHistory:'PRIVATE pending Italian',interestingDetail:'PRIVATE pending detail',needsReview:true},
  ],
  sources:[{
    key:'municipality',kind:'primary',title:'City archive',author:'Archivist',publisher:'Comune',
    edition:'',year:'2026',url:'https://example.org/archive',locator:'',supports:'Building history',checkedAt:'2026-10-06',
    privateNote:'PRIVATE source annotation',
  }],
  review:{status:'reviewed',revision:4,humanReviewedBy:'PRIVATE reviewer',notes:['PRIVATE review note']},
  bookEvidence:[{bookTitle:'PRIVATE book scan',privateNote:'PRIVATE evidence'}],
};

test('v3 public story keeps only reviewed copy, safe bibliography and public review state',async()=>{
  const result=await readPublishedRoute('v3-story',async()=>Response.json(release('v3-story',{
    schemaVersion:3,sourceLanguage:'tr',
    places:[{key:'place',copy:[],story:reviewedStory,storyHistory:['PRIVATE history']}],
    visits:[{key:'stop',placeKey:'place',visible:true,copy:[],gallery:[]}],
    privateStories:['PRIVATE route evidence'],
  })));
  assert.equal(result.status,200);
  const publicRoute=JSON.parse(result.body);
  assert.equal(publicRoute.schemaVersion,3);
  assert.deepEqual(publicRoute.visits[0].gallery,[],'v3 preserves the v2 gallery contract');
  assert.deepEqual(publicRoute.places[0].story,{
    sourceLanguage:'tr',
    copy:reviewedStory.copy.slice(0,2),
    sources:[{
      key:'municipality',kind:'primary',title:'City archive',author:'Archivist',publisher:'Comune',
      edition:'',year:'2026',url:'https://example.org/archive',locator:'',supports:'Building history',checkedAt:'2026-10-06',
    }],
    review:{status:'reviewed',revision:4},
  });
  assert.equal(storyFor(publicRoute.visits[0],publicRoute,'it').copy.shortHistory,'Reviewed English history');
  for(const secret of ['PRIVATE','humanReviewedBy','bookEvidence','storyHistory','reviewedDigest'])
    assert.equal(result.body.includes(secret),false,secret);
});

test('v3 pending, invalid and incomplete stories are omitted without blocking a public route',async()=>{
  const cases=[
    {...reviewedStory,review:{status:'proposal_needs_review',revision:4}},
    {...reviewedStory,copy:reviewedStory.copy.map(row=>row.locale==='tr'?{...row,needsReview:true}:row)},
    {...reviewedStory,sources:[{...reviewedStory.sources[0],url:'javascript:PRIVATE'}]},
    {...reviewedStory,copy:reviewedStory.copy.map(row=>row.locale==='tr'?{...row,shortHistory:'<script>PRIVATE</script>'}:row)},
    {...reviewedStory,sources:[]},
  ];
  for(const [index,story] of cases.entries()){
    const key=`v3-unreviewed-${index}`;
    const result=await readPublishedRoute(key,async()=>Response.json(release(key,{
      schemaVersion:3,places:[{key:'place',story}],
    })));
    assert.equal(result.status,200,key);
    assert.equal(JSON.parse(result.body).places[0].story,undefined,key);
    assert.equal(result.body.includes('PRIVATE'),false,key);
  }
});

test('v1/v2 remain readable and unknown future release schemas stay closed',async()=>{
  for(const version of [1,2]){
    const key=`legacy-${version}`;
    const result=await readPublishedRoute(key,async()=>Response.json(release(key,{schemaVersion:version})));
    assert.equal(result.status,200,key);
    assert.equal(JSON.parse(result.body).schemaVersion,version);
  }
  assert.equal((await readPublishedRoute('future-schema',async()=>Response.json(release('future-schema',{schemaVersion:4})))).status,502);
});

test('draft and unknown route paths cannot be proxied',async()=>{
  for(const key of ['../../users','main/save','DRAFT',''])
    assert.equal((await readPublishedRoute(key,()=>{throw Error('must not fetch');})).status,404);
});

test('missing releases retain the original route and failures do not expose upstream data',async()=>{
  assert.equal((await readPublishedRoute('short',async()=>new Response(null,{status:404}))).status,404);
  assert.equal((await readPublishedRoute('full',async()=>Response.json({secret:'private'}))).status,502);
});
