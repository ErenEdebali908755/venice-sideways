import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {FieldGuide,copyFor,storyFor} from '../public/field-guide/guide.js';
import {photosForVisit,galleryText} from '../public/field-guide/gallery.js';
import {PLACE_COPY,placeCopy} from '../public/field-guide/map-art.js';
import {UI_LANGUAGES,uiCopy} from '../public/field-guide/ui-copy.js';
const {routes}=JSON.parse(await readFile(new URL('../public/field-guide/routes.json',import.meta.url),'utf8'));
const main=routes.find(r=>r.key==='main');
const source=await readFile(new URL('../public/field-guide/guide.js',import.meta.url),'utf8');

test('Main Walk visible route, segment, stop, story, five ideas and captions never fall back in eight languages',()=>{
 for(const language of UI_LANGUAGES){
  const records=[main,...main.segments,...main.visits,...main.visits.flatMap(v=>v.ideas)];
  for(const record of records){
   const text=copyFor(record.copy,language);
   assert.equal(text.locale,language,`${record.key}: ${language} resolves its own copy`);
   const english=copyFor(record.copy,'en');
   for(const field of ['text','phoneTip']) if(english[field]){
    assert.ok(text[field]?.trim(),`${record.key}.${field}: ${language}`);
    if(language!=='en')assert.notEqual(text[field],english[field],`${record.key}.${field}: ${language} is not a copied English placeholder`);
   }
  }
  for(const visit of main.visits){
   const story=storyFor(visit,main,language);
   assert.equal(story.copy.locale,language,`${visit.key} story ${language}`);
   assert.equal(story.pending,false);
   for(const field of ['shortHistory','interestingDetail']){
    assert.ok(story.copy[field]?.trim());
    if(language!=='en')assert.notEqual(story.copy[field],storyFor(visit,main,'en').copy[field]);
   }
   for(const photo of photosForVisit(visit)){
    const text=galleryText(photo,language);assert.equal(text.locale,language);
    for(const field of ['alt','caption'])assert.ok(text[field]?.trim());
    if(photo.changes&&language!=='en')assert.notEqual(uiCopy(photo.changes,language),photo.changes);
   }
  }
  for(const key of Object.keys(PLACE_COPY))assert.equal(placeCopy(key,language).text,PLACE_COPY[key].text[language],`${key}: ${language} map note`);
 }
});

test('references cannot render as route covers or direct images, and their UI/lightbox path is removed',()=>{
 const guide=Object.create(FieldGuide.prototype);guide.lang='en';
 assert.equal(guide.galleryImage({referenceOnly:true,contentKind:'stop-view',derivatives:[{url:'https://example.org/unrelated.jpg'}]}),'');
 assert.equal(guide.photo({referenceOnly:true,url:'https://example.org/unrelated.jpg'},'cover'),'');
 assert.doesNotMatch(source,/inspirationSection|openInspiration|renderInspiration|data-inspiration|referencePhotos/);
 assert.doesNotMatch(source,/AI illustration · not a photograph|Translation awaiting review|Description in English/);
});

test('illustration disclosure is in localized alt text; idea disclosure preserves a native keyboard control',()=>{
 const guide=Object.create(FieldGuide.prototype);guide.route=main;
 for(const language of UI_LANGUAGES){
  guide.lang=language;
  const html=guide.vignette(main.visits[0]);
  assert.ok(html.includes(`alt="${uiCopy('Illustration',language)} · `));
  assert.doesNotMatch(html,/<figcaption/);
  const ideas=guide.story(main.visits[0]);
  assert.ok(ideas.includes('<details class="fg-photo-ideas"><summary>'));
  assert.ok(ideas.includes(uiCopy('5 photo ideas to try at this stop',language)));
  assert.ok(ideas.includes(uiCopy('Composition, light and phone tips · tap to open',language)));
 }
});

test('all five ideas retain their independently reviewed order and eight-language text',()=>{
 const digest=createHash('sha256').update(JSON.stringify(main.visits.map(v=>({key:v.key,ideas:v.ideas})))).digest('hex');
 assert.equal(digest,'7381587bc4f9b14884456a8e10e7f7c1adcbf2671f9bcb30b30c1b654e984eda');
});
