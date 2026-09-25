/** Small dependency-free static server. No database, analytics, POST or location endpoint. */
import http from 'node:http';
import {readFile,readdir} from 'node:fs/promises';
import {join,extname,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

export const CSP="default-src 'self'; script-src 'self' 'unsafe-inline' https://unpkg.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://unpkg.com https://cdn.jsdelivr.net; font-src 'self' data:; img-src 'self' data: blob: https://tile.openstreetmap.org https://tiles.openfreemap.org https://unpkg.com https://cdn.jsdelivr.net; connect-src 'self' https://routing.openstreetmap.de https://tiles.openfreemap.org; worker-src 'self' blob:; frame-src 'none'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'";
const ROOT=join(dirname(fileURLToPath(import.meta.url)),'public');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.txt':'text/plain; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon','.webmanifest':'application/manifest+json'};
const aliases=new Set(['/index.html','/venice-photography-walk-map','/venice-photography-walk-map/','/venice-photography-walk-map.html','/venedik-yuruyusu.html']);
async function filesIn(dir,prefix=''){
 const files=new Map();
 for(const entry of await readdir(dir,{withFileTypes:true})){
  if(entry.name.startsWith('.')||entry.name.startsWith('_'))continue;
  const path=join(dir,entry.name),relative=prefix+'/'+entry.name;
  if(entry.isDirectory()){for(const [k,v] of await filesIn(path,relative))files.set(k,v);}
  else if(entry.isFile()&&mime[extname(entry.name)]){const body=await readFile(path);files.set(relative,{body,etag:'"'+createHash('sha256').update(body).digest('hex')+'"',type:mime[extname(entry.name)]});}
 }
 return files;
}
export async function createServer(){
 const files=await filesIn(ROOT);
 return http.createServer((req,res)=>{
  res.setHeader('Content-Security-Policy',CSP);
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options','DENY');
  res.setHeader('Permissions-Policy','geolocation=(self), camera=(), microphone=(), payment=()');
  res.setHeader('Cache-Control','no-cache');
  if(req.method!=='GET'&&req.method!=='HEAD'){res.setHeader('Allow','GET, HEAD');res.writeHead(405);res.end('Method not allowed');return;}
  let url;try{url=new URL(req.url,'http://localhost');}catch{res.writeHead(400);res.end('Invalid request');return;}
  if(url.pathname==='/healthz'){res.setHeader('Content-Type','text/plain');res.writeHead(200);res.end(req.method==='HEAD'?undefined:'ok');return;}
  // Only the explicitly owned www host is canonicalized. Never trust an arbitrary Host for redirects.
  if(req.headers.host?.toLowerCase()==='www.venicesideways.com'){
   const path=aliases.has(url.pathname)?'/':url.pathname;
   res.writeHead(308,{Location:'https://venicesideways.com'+path+url.search});res.end();return;
  }
  if(aliases.has(url.pathname)){res.writeHead(308,{Location:'/'+url.search});res.end();return;}
  let path;try{path=decodeURIComponent(url.pathname);}catch{res.writeHead(400);res.end('Invalid path');return;}
  if(path.includes('\\')||path.includes('\0')||path.split('/').some(s=>s.startsWith('.'))){res.writeHead(404);res.end('Not found');return;}
  const file=files.get(path==='/'?'/index.html':path);
  if(!file){res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('Not found');return;}
  res.setHeader('Content-Type',file.type);res.setHeader('ETag',file.etag);
  if(req.headers['if-none-match']===file.etag){res.writeHead(304);res.end();return;}
  res.setHeader('Content-Length',file.body.length);res.writeHead(200);res.end(req.method==='HEAD'?undefined:file.body);
 });
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
 const port=Number(process.env.PORT||3000);
 if(!Number.isInteger(port)||port<1||port>65535)throw new Error('PORT must be 1..65535');
 const server=await createServer();server.listen(port,'0.0.0.0',()=>console.log('Venice Sideways listening on port '+port));
 const close=()=>server.close(()=>process.exit(0));process.on('SIGTERM',close);process.on('SIGINT',close);
}
