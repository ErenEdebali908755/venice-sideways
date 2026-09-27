const allowed=new Set(['presence','statistics']);
export async function communityProxy(req,res,path,fetcher=fetch){
 const kind=path.slice('/api/community/'.length);res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json');
 if(!allowed.has(kind)){res.writeHead(404);res.end('{}');return;}
 if(req.method!=='POST'){res.writeHead(405);res.end('{}');return;}
 if(!['https://venicesideways.com','https://www.venicesideways.com'].includes(req.headers.origin)||!req.headers['content-type']?.startsWith('application/json')){res.writeHead(403);res.end('{}');return;}
 try{let size=0;const chunks=[];for await(const part of req){size+=part.length;if(size>4096){res.writeHead(413);res.end('{}');return;}chunks.push(part);}const data=JSON.parse(Buffer.concat(chunks).toString());
 // Fixed upstream, explicit public projection, no cookies, IP, identity or arbitrary URL forwarding.
 const body=kind==='presence'?{token:data.token,stop:data.stop,consent:data.consent,latitude:data.latitude,longitude:data.longitude,accuracy:data.accuracy}:{consent:data.consent,event:data.event,metric:data.metric,route:data.route,language:data.language,device:data.device};
 const r=await fetcher('https://erenedebali.com/api/sideways/'+kind,{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://venicesideways.com'},body:JSON.stringify(body),signal:AbortSignal.timeout(8000),redirect:'error'});
 if(!r.ok){res.writeHead(r.status>=400&&r.status<500?r.status:503);res.end('{"ok":false}');return;}
 const result=await r.json();res.writeHead(200);res.end(JSON.stringify({ok:result.ok===true}));
 }catch{res.writeHead(503);res.end('{"ok":false}');}
}
