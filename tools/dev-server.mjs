// Local presentation QA uses checked-in, already-public route content only.
// Production continues to use server.mjs and the live published catalog.
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {createServer} from '../server.mjs';
const server=await createServer();
const app=server.listeners('request')[0];server.removeAllListeners('request');
server.on('request',async(req,res)=>{
 if(req.url==='/api/route-catalog'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({routes:[{key:'main',title:'Main Walk',published:false},{key:'full',title:'Full Walk',published:false}]}));return;}
 if(req.url?.startsWith('/api/community/')){res.writeHead(503);res.end('{}');return;}
 app(req,res);
});
const at=process.argv.indexOf('--port');server.listen(at>=0?Number(process.argv[at+1]):4173,'0.0.0.0');
