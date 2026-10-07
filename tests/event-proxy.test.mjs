import test from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {eventProxy} from '../event-proxy.mjs';

function response(){return {status:0,body:'',headers:{},setHeader(k,v){this.headers[k]=v},writeHead(code){this.status=code},end(body){this.body=body}};}
const event={slug:'main-walk-2026-10-11',routeKey:'main',eventDate:'2026-10-11',state:'open',translations:{en:{title:'Main Walk',description:'A walk'}},privacyContact:'erenedebali5694@gmail.com',retentionDays:180,capacity:null,remaining:null,secret:'never-public'};

test('event relay exposes only the public projection and fixed upstream',async()=>{
  const res=response();
  await eventProxy({method:'GET',headers:{}},res,'/api/events/main-walk-2026-10-11',async(url,options)=>{
    assert.equal(url,'https://erenedebali.com/api/sideways/events/main-walk-2026-10-11');
    assert.equal(options.headers.Cookie,undefined);
    return Response.json(event);
  });
  assert.equal(res.status,200);
  assert.equal(JSON.parse(res.body).secret,undefined);
  assert.equal(JSON.parse(res.body).state,'open');
});

test('registration relay strips extra fields and browser credentials',async()=>{
  const req=Readable.from([Buffer.from(JSON.stringify({firstName:'Ada',lastName:'Lovelace',phone:'+393123456789',email:'',gender:'',idempotencyKey:'12345678-1234-1234-1234-123456789abc',latitude:45.4,adminCookie:'secret'}))]);
  req.method='POST';req.headers={origin:'https://venicesideways.com','content-type':'application/json',cookie:'private'};
  req.socket={remoteAddress:'127.0.0.2'};
  const res=response();
  await eventProxy(req,res,'/api/events/main-walk-2026-10-11/register',async(url,options)=>{
    assert.equal(url,'https://erenedebali.com/api/sideways/events/main-walk-2026-10-11/register');
    assert.equal(options.headers.Cookie,undefined);
    assert.equal(options.headers.Origin,'https://erenedebali.com');
    assert.equal(JSON.parse(options.body).latitude,undefined);
    assert.equal(JSON.parse(options.body).adminCookie,undefined);
    return Response.json({result:'registered',event},{status:201});
  });
  assert.equal(res.status,200);
  assert.deepEqual(JSON.parse(res.body),{result:'received'});
});

test('unknown paths and wrong origins never reach the private service',async()=>{
  const noFetch=()=>{throw Error('unexpected upstream')};
  for(const [path,method,origin,expected] of [
    ['/api/events/../../admin','GET','',404],
    ['/api/events/main-walk-2026-10-11/register','GET','',405],
    ['/api/events/main-walk-2026-10-11/register','POST','https://evil.example',403],
  ]){
    const res=response();
    await eventProxy({method,headers:{origin,'content-type':'application/json'}},res,path,noFetch);
    assert.equal(res.status,expected);
  }
});

test('a shared hosting proxy address does not impose a 15-person registration ceiling',async()=>{
  for(let i=0;i<20;i++){
    const req=Readable.from([Buffer.from(JSON.stringify({firstName:'Ada',lastName:'Lovelace',phone:'+393123456789',idempotencyKey:'12345678-1234-1234-1234-123456789abc'}))]);
    req.method='POST';req.headers={origin:'https://venicesideways.com','content-type':'application/json'};
    req.socket={remoteAddress:'10.0.0.1'};
    const res=response();
    await eventProxy(req,res,'/api/events/main-walk-2026-10-11/register',()=>Response.json({result:'registered',event},{status:201}));
    assert.equal(res.status,200);
  }
});

test('the visitor proxy caps registrations at 450 requests per minute per process',async()=>{
  const {eventProxy: isolatedProxy}=await import('../event-proxy.mjs?isolated-rate-test');
  for(let i=0;i<451;i++){
    const req=Readable.from([Buffer.from(JSON.stringify({firstName:'Ada',lastName:'Lovelace',phone:'+393123456789',idempotencyKey:'12345678-1234-1234-1234-123456789abc'}))]);
    req.method='POST';req.headers={origin:'https://venicesideways.com','content-type':'application/json'};
    const res=response();
    await isolatedProxy(req,res,'/api/events/main-walk-2026-10-11/register',()=>Response.json({result:'registered',event},{status:201}));
    assert.equal(res.status,i<450?200:429);
  }
});
