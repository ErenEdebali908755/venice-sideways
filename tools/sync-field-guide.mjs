// The public renderer is the source of truth. Pass a local admin checkout explicitly.
import {copyFile,readFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const target=process.argv[2];if(!target)throw Error('Usage: node tools/sync-field-guide.mjs <admin-checkout> [--check]');
for(const name of ['guide.js','guide.css','map-art.js','gardens.json','yana-mark.svg','yana-logo.svg','gallery.js','location-engine.js','ui-copy.js','temporary-selection.js']){
 const from=resolve(root,'public/field-guide',name),to=resolve(target,'public/field-guide',name);
 if(process.argv.includes('--check')){if(!(await readFile(from)).equals(await readFile(to)))throw Error(`Shared renderer differs: ${name}`);}
 else await copyFile(from,to);
}
console.log('Shared visitor renderer matches the admin preview.');
