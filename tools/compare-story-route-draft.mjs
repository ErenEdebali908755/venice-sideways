/** Offline only. Exported draft input must be supplied explicitly; no API or DB access. */
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
export function compareRoutes(bundled, input) {
 const records=Array.isArray(input)?input:input.routes;
 if(!Array.isArray(records))throw Error('Expected an array or {routes:[{draft,...}]} export');
 const drafts=records.map(r=>r.draft||r),places=new Map((input.places||[]).map(p=>[p.key,p]));
 const output=[];
 for(const route of bundled.routes){
  const matches=drafts.filter(r=>r.key===route.key);if(matches.length>1)throw Error(`Duplicate route ${route.key}`);
  const draft=matches[0], visits=draft?.visits||[];
  for(const collection of [route.visits,visits]){const seen=new Set();for(const v of collection){if(seen.has(v.key))throw Error(`Duplicate visit ${route.key}/${v.key}`);seen.add(v.key)}}
  const keys=new Set([...route.visits.map(v=>v.key),...visits.map(v=>v.key)]);
  for(const key of keys){const b=route.visits.find(v=>v.key===key),a=visits.find(v=>v.key===key),p=places.get(a?.placeKey);const fields=['placeKey','order','latitude','longitude'];
   output.push({route:route.key,key,bundled:b?Object.fromEntries(fields.map(f=>[f,b[f]])):null,draft:a?Object.fromEntries(fields.map(f=>[f,a[f]])):null,legacyPlace:p?{latitude:p.latitude,longitude:p.longitude}:null,differences:!a?['missing-draft']:!b?['extra-draft']:fields.filter(f=>a[f]!==b[f])});
  }
 }
 return output;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const [file,bundledFile='public/field-guide/routes.json']=process.argv.slice(2);if(!file)throw Error('Usage: node tools/compare-story-route-draft.mjs EXPORTED_DRAFT.json [BUNDLED_ROUTES.json]');
 const rows=compareRoutes(JSON.parse(await readFile(bundledFile,'utf8')),JSON.parse(await readFile(file,'utf8')));
 console.log('| Rota / kimlik | Paketli place / sıra | Taslak place / sıra | Paketli enlem, boylam | Taslak enlem, boylam | Eski yer kaydı enlem, boylam (varsa) | Fark | Kullanıcı kararı |\n|---|---|---|---|---|---|---|---|');
 const safe=s=>String(s??'EKSİK').replaceAll('|','\\|').replaceAll('\n',' '),coords=v=>v?`${v.latitude}, ${v.longitude}`:'EKSİK';
 for(const r of rows)console.log(`| ${safe(r.route)} / ${safe(r.key)} | ${safe(r.bundled?.placeKey)} / ${safe(r.bundled?.order)} | ${safe(r.draft?.placeKey)} / ${safe(r.draft?.order)} | ${coords(r.bundled)} | ${coords(r.draft)} | ${r.legacyPlace?coords(r.legacyPlace):'—'} | ${r.differences.join(', ')||'eşit'} | bekliyor |`);
}
