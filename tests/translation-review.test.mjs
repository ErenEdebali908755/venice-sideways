import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {uiCopy,UI_LANGUAGES} from '../public/field-guide/ui-copy.js';
import {photosByPlace} from '../public/field-guide/stop-photos.js';
import {bootCopy} from '../public/field-guide/entry.js';
import {PLACE_COPY} from '../public/field-guide/map-art.js';
const data=JSON.parse(await readFile(new URL('../public/field-guide/routes.json',import.meta.url),'utf8'));
const findings=JSON.parse(await readFile(new URL('../docs/i18n/reviewed-corrections.json',import.meta.url),'utf8'));
function resolved(f){
 if(f.file.endsWith('ui-copy.js'))return uiCopy(f.path.startsWith('rows[')?JSON.parse(f.path.slice(5,-1)):f.path,f.locale);
 if(f.file.endsWith('entry.js'))return bootCopy[f.locale][f.path.split('.').at(-1)];
 if(f.file.endsWith('map-art.js'))return PLACE_COPY[f.path.split('.')[1]].text[f.locale];
 let value=f.file.endsWith('routes.json')?data:photosByPlace;
 const path=f.path.replace('routes[key=main]','routes['+data.routes.findIndex(r=>r.key==='main')+']').replace(/^photosByPlace\./,'').replace(/\.copy\[(?:en|tr|it|fr|ru|zh|ja|ko)\]/g,'.copy');
 for(const key of path.replaceAll('[','.').replaceAll(']','').split('.')){
  value=value[key];if(key==='copy')value=value.find(c=>c.locale===f.locale);
 }
 return value;
}
test('all independently reviewed corrections remain applied at their exact locale and field',()=>{
 for(const finding of findings)assert.equal(resolved(finding),finding.new,`${finding.locale}: ${finding.path}`);
});
test('glossary UI terms and route identities stay consistent in eight locales',()=>{
 const words={en:['Stop','Photographs','Vaporetto transfer'],tr:['Durak','Fotoğraflar','Vaporetto aktarması'],it:['Tappa','Fotografie','Tratto in vaporetto'],fr:['Étape','Photographies','Correspondance en vaporetto'],ru:['Остановка','Фотографии','Пересадка на вапоретто'],zh:['站点','照片','水上巴士换乘'],ja:['スポット','写真','ヴァポレット乗り換え'],ko:['장소','사진','수상버스 환승']};
 // Exact button vocabulary is intentionally locked to the reviewed glossary below.
 for(const lang of UI_LANGUAGES){
  assert.equal(uiCopy('Stop',lang),words[lang][0]);
  for(const visit of data.routes.find(r=>r.key==='main').visits){
   const title=visit.copy.find(c=>c.locale===lang).title;
   assert.ok(title.includes(visit.copy.find(c=>c.locale==='en').title.split(' · ')[0]),`${visit.key}: original place name in ${lang}`);
  }
 }
});
