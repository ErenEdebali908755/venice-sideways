import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveInitialLanguage,bootCopy} from '../public/field-guide/entry.js';

test('boot language respects explicit URL then saved choice then normalized browser language',()=>{
  assert.equal(resolveInitialLanguage({query:'FR-fr',saved:'tr',browser:['it-IT']}),'fr');
  assert.equal(resolveInitialLanguage({query:'unsupported',saved:'JA',browser:['tr-TR']}),'ja');
  assert.equal(resolveInitialLanguage({browser:['de-DE','zh-Hant-TW','en-GB']}),'zh');
  assert.equal(resolveInitialLanguage({query:null,saved:null,browser:['de-DE','ar']}),'en');
  assert.equal(resolveInitialLanguage({browser:[]}),'en');
});
test('all eight supported languages have boot recovery messages without inventing an active stop',()=>{
  const expected=['en','tr','it','fr','ru','zh','ja','ko'];
  assert.deepEqual(Object.keys(bootCopy),expected);
  for(const language of expected) {
    assert.equal(resolveInitialLanguage({query:language}),language);
    for(const key of ['loading','title','detail','retry','bundled','network','limit'])assert.ok(bootCopy[language][key]);
  }
});
