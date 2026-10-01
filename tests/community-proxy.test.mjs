import test from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {communityProxy} from '../community-proxy.mjs';

function response(){return {code:0,body:'',setHeader(){},writeHead(code){this.code=code},end(body){this.body=body}};}

test('community proxy forwards only anonymous statistics and rejects location sharing',async()=>{
 let calls=0;
 const fetcher=async(url,options)=>{
  calls++;
  assert.equal(url,'https://erenedebali.com/api/sideways/statistics');
  assert.equal(options.headers.Cookie,undefined);
  assert.equal(options.headers.Origin,'https://erenedebali.com');
  assert.deepEqual(JSON.parse(options.body),{consent:true,event:'a'.repeat(32),metric:'page_view',route:'main',language:'en',device:'mobile'});
  return Response.json({ok:true,secret:'not-public'});
 };
 const data={consent:true,event:'a'.repeat(32),metric:'page_view',route:'main',language:'en',device:'mobile',latitude:45.4,longitude:12.3};
 const req=Readable.from([Buffer.from(JSON.stringify(data))]);
 req.method='POST';
 req.headers={origin:'https://venicesideways.com','content-type':'application/json',cookie:'private'};
 const accepted=response();
 await communityProxy(req,accepted,'/api/community/statistics',fetcher);
 assert.equal(accepted.code,200);
 assert.equal(accepted.body,'{"ok":true}');
 assert.equal(calls,1);
 for(const [method,path,origin,expected] of [
  ['POST','presence','https://venicesideways.com',404],
  ['GET','statistics','https://venicesideways.com',405],
  ['POST','users','https://venicesideways.com',404],
  ['POST','statistics','https://evil.example',403],
 ]){
  const result=response();
  await communityProxy({method,headers:{origin,'content-type':'application/json'}},result,'/api/community/'+path,()=>{throw Error('must not call')});
  assert.equal(result.code,expected);
 }
});
