import test from 'node:test';
import assert from 'node:assert/strict';
import {projectPublishedRoute} from '../published-routes.mjs';
import {galleryForVisit,galleryText,imageVariant} from '../public/field-guide/gallery.js';
const sample={assetID:'asset-known',derivativeVersion:'version-known',order:1,cover:true,focalPoint:{x:30,y:60},sourceLanguage:'tr',textRevision:4,copy:[{locale:'tr',alt:'Kaynak',caption:'Metin',needsReview:false},{locale:'en',alt:'English',caption:'Reviewed',needsReview:false},{locale:'it',alt:'Pending',caption:'Pending',needsReview:true}],credit:'Eren Edebali',derivatives:[{variant:'r400',url:'https://erenedebali.com/api/sideways/media/asset-known/version-known/r400',width:400,height:600},{variant:'r900',url:'https://erenedebali.com/api/sideways/media/asset-known/version-known/r900',width:900,height:1350}],rights:{privateNote:'SECRET'},uploader:'SECRET',storageKey:'SECRET'};
const release={schemaVersion:2,key:'main',revision:4,publishedAt:'2026-10-05T00:00:00Z',sourceLanguage:'tr',copy:[],visits:[{key:'stop',placeKey:'place',segmentKey:'walk',visible:true,gallery:[sample],copy:[],ideas:[{key:'idea',order:1,copy:[],private:'SECRET'}],private:'SECRET',photo:{url:'https://erenedebali.com/api/private/original?token=SECRET'}}],segments:[{key:'walk',type:'walking',geometry:[[12.3,45.4]],waypoints:[{longitude:12.3,latitude:45.4,private:'SECRET'}],transitStops:[{placeKey:'board',longitude:12.3,latitude:45.4,review:'SECRET'}],copy:[],private:'SECRET'}],places:[{key:'place',copy:[],private:'SECRET'}]};
test('v2 projection strips nested rights, drafts, originals, storage, editor fields and unreviewed photo text',()=>{
 const result=projectPublishedRoute(release),body=JSON.stringify(result);
 assert.equal(result.schemaVersion,2);assert.equal(result.sourceLanguage,'tr');assert.ok(!body.includes('SECRET'));assert.ok(!body.includes('Pending'));assert.equal(result.visits[0].gallery[0].derivatives.length,2);
 assert.equal(result.visits[0].gallery[0].focalPoint.x,30);assert.equal(galleryText(result.visits[0].gallery[0],'it').alt,'English');
 assert.equal(imageVariant(result.visits[0].gallery[0],800).width,900);
});
test('private preview, signed/auth URLs, arbitrary hosts and derivative metadata cannot pass public gallery projection',()=>{
 for(const url of ['https://evil.test/r900','https://erenedebali.com/api/sideways/media/asset-known/version-known/r900/preview','https://erenedebali.com/api/sideways/media/asset-known/version-known/r900?token=SECRET','https://user:password@erenedebali.com/api/sideways/media/asset-known/version-known/r900']){
  const data=structuredClone(release);data.visits[0].gallery[0].derivatives=[{...sample.derivatives[1],url}];assert.deepEqual(projectPublishedRoute(data).visits[0].gallery,[]);
 }
});
test('v1 photo becomes a stable single gallery; an explicitly empty gallery remains empty and sort follows stable asset IDs',()=>{
 const legacy={url:'https://erenedebali.com/image/3/web',alt:'Reader',altTr:'Okur',x:20,y:40,credit:'Eren'};
 const a=galleryForVisit({key:'old',photo:legacy}),b=galleryForVisit({key:'reordered',photo:legacy});assert.equal(a.length,1);assert.equal(a[0].assetID,b[0].assetID);assert.equal(galleryText(a[0],'tr').alt,'Okur');
 assert.deepEqual(galleryForVisit({photo:legacy,gallery:[]}),[]);
 assert.deepEqual(galleryForVisit({gallery:[{...sample,assetID:'b',order:2},{...sample,assetID:'a',order:1}]}).map(p=>p.assetID),['a','b']);
 assert.equal(galleryForVisit({gallery:Array.from({length:13},(_,i)=>({...sample,assetID:String(i),order:i}))}).length,12);
 const v1=projectPublishedRoute({...release,schemaVersion:1,visits:[{key:'old',visible:true,copy:[],photo:legacy}]});assert.equal(v1.visits[0].photo.url,legacy.url);assert.equal(v1.visits[0].gallery,undefined);
});
test('relay projection preserves explicit removals and never strips the only denial marker into a reference fallback',()=>{const data=structuredClone(release);data.visits[0].gallery[0].revoked=true;assert.deepEqual(projectPublishedRoute(data).visits[0].gallery,[]);const v1=projectPublishedRoute({...release,schemaVersion:1,visits:[{key:'old',visible:true,copy:[],photo:{url:'https://erenedebali.com/image/3/web',removed:true}}]});assert.equal(v1.visits[0].photo,null);assert.equal(Object.hasOwn(v1.visits[0],'photo'),true);});
