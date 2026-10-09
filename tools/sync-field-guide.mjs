// The public renderer is the source of truth. Pass a local admin checkout explicitly.
import {copyFile,readFile,mkdir,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const target=process.argv[2];if(!target)throw Error('Usage: node tools/sync-field-guide.mjs <admin-checkout> [--check]');
const names=['walking-state.js','timetable-policy.js','guide.js','guide.css','map-art.js','illustrations.js','directions.js','gardens.json','yana-mark.svg','yana-logo.svg','yana-mark-light.svg','yana-mark-dark.svg','icons.js','icons.svg','gallery.js','location-engine.js','ui-copy.js','temporary-selection.js','serif.woff2','sans.woff2','serif-latin-ext.woff2','serif-cyrillic.woff2','sans-latin-ext.woff2','sans-cyrillic.woff2','Cormorant-LICENSE.txt','Manrope-LICENSE.txt'];
const art=await readdir(resolve(root,'public/field-guide/art'),{withFileTypes:true});
for(const file of art){if(!file.isFile()||!/^([a-z0-9-]+\.png|(?:illustrations-)?manifest\.json)$/.test(file.name))throw Error('Unexpected shared artwork file');names.push('art/'+file.name);}
const proof=[];
for(const name of names){
 const from=resolve(root,'public/field-guide',name),to=resolve(target,'public/field-guide',name);
 if(process.argv.includes('--check')){if(!(await readFile(from)).equals(await readFile(to)))throw Error(`Shared renderer differs: ${name}`);}
 else {await mkdir(dirname(to),{recursive:true});await copyFile(from,to);}
 proof.push({name,sha256:createHash('sha256').update(await readFile(from)).digest('hex')});
}
const targetArt=(await readdir(resolve(target,'public/field-guide/art'))).sort();
if(JSON.stringify(targetArt)!==JSON.stringify(art.map(file=>file.name).sort()))throw Error('Admin preview has stale or missing artwork');
console.log(JSON.stringify({status:'shared-renderer-matches',files:proof.length,digest:createHash('sha256').update(JSON.stringify(proof)).digest('hex')}));
