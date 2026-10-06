import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { UI_LANGUAGES, uiCopy } from '../public/field-guide/ui-copy.js';

test('shared guide controls have a translation in every supported non-source locale', async () => {
  assert.deepEqual(UI_LANGUAGES, ['en', 'tr', 'it', 'fr', 'ru', 'zh', 'ja', 'ko']);
  const guide = await readFile(new URL('../public/field-guide/guide.js', import.meta.url), 'utf8');
  // Editorial payload is reviewed separately. These literals are control/status copy.
  const keys = [...new Set([...guide.matchAll(/(?:this\.t|\bt)\("([^"\n]+)"/g)].map(match => match[1]))];
  assert.ok(keys.includes('Directions to this stop'));
  assert.ok(keys.includes('Illustration awaiting identity review.'));
  for (const key of keys) for (const language of UI_LANGUAGES.slice(1)) {
    const translated = uiCopy(key, language);
    assert.equal(typeof translated, 'string', `${language}: ${key}`);
    assert.ok(translated.trim(), `${language}: ${key}`);
    assert.notEqual(translated, key, `Control must not silently fall back to English: ${language}: ${key}`);
  }
});
