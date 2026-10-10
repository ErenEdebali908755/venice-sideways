// Real local server + real boot, synthetic published route; no production requests.
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
import {createServer} from '../server.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
if(!process.env.QA_OUTPUT)throw Error('Set QA_OUTPUT outside the checkout');const output=resolve(process.env.QA_OUTPUT);await mkdir(output,{recursive:true});
const packaged=JSON.parse(await readFile(new URL('../public/field-guide/routes.json',import.meta.url))),release={...structuredClone(packaged.routes[0]),schemaVersion:3,revision:999};
for(const row of release.copy)row.title='Local published fixture';
let upstream=0,down=false;const original=globalThis.fetch;
globalThis.fetch=async url=>{upstream++;if(down)throw Error('Simulated upstream outage');if(String(url).endsWith('/catalog'))return Response.json({routes:[{key:'main',title:'Main',published:true},{key:'full',title:'Full',published:false}]});if(String(url).endsWith('/published/main'))return Response.json(release);throw Error('Unexpected test request')};
const browser=await chromium.launch({headless:true}),context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage();const checks=[];let port=0,progress;
try{
 for(const flag of ['0','1','0']){
  const server=await createServer({env:{SIDEWAYS_FORCE_BUNDLED:flag}});await new Promise(r=>server.listen(port,'127.0.0.1',r));port=server.address().port;const base='http://127.0.0.1:'+port;
  const before=upstream;down=flag==='1';await page.unrouteAll({behavior:'wait'});await page.route('**/*',async route=>{const u=new URL(route.request().url());if(u.origin!==base)return route.abort();if(u.pathname==='/field-guide/guide.js')return route.fulfill({contentType:'text/javascript',body:(await readFile(new URL('../public/field-guide/guide.js',import.meta.url),'utf8')).replace('this.root = root;','this.root = root; window.__guide = this;')});if(u.pathname==='/field-guide/maplibre.js')return route.fulfill({contentType:'text/javascript',body:'window.maplibregl=undefined;'});if(u.pathname==='/api/events')return route.fulfill({json:{events:[]}});return route.continue()});
  try{await page.goto(base+'/?lang=tr');await page.locator('.fg-main-summary h1').waitFor();const title=await page.locator('.fg-main-summary h1').innerText();
   if(flag==='1'){assert.notEqual(title,'Local published fixture');assert.equal(upstream,before);assert(await page.locator('#field-guide').innerText().then(s=>/yerleşik|paket|bundled/i.test(s)),'explicit bundled notice');}
   else assert.equal(title,'Local published fixture');
   await page.locator('[data-route="main"]').click();assert(await page.locator('.fg-walking-dock').isVisible());if(!progress){await page.waitForTimeout(700);await page.locator('[data-action="walk-advance"]').click();progress=await page.evaluate(()=>JSON.stringify(Object.fromEntries(Object.entries(__guide.walking).filter(([key])=>key!=='revision'))));}else assert.equal(await page.evaluate(()=>JSON.stringify(Object.fromEntries(Object.entries(__guide.walking).filter(([key])=>key!=='revision')))),progress,'same-origin saved progress survives recovery and restoration');await page.screenshot({path:resolve(output,`recovery-${checks.length}-${flag}.png`)});checks.push({flag,title,passed:true,progressPreserved:true,upstreamCalls:upstream-before});
  }finally{await new Promise(r=>server.close(r));}
 }
}catch(e){checks.push({passed:false,error:e.message});throw e;}finally{globalThis.fetch=original;await browser.close();await writeFile(resolve(output,'recovery-browser-report.json'),JSON.stringify({scope:'Real localhost server and entry; synthetic CMS release; map deliberately unavailable; no production writes',checks},null,2));}
console.log(JSON.stringify(checks));
