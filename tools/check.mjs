import {readdir,readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
let count=0;
async function walk(dir){for(const e of await readdir(dir,{withFileTypes:true})){const p=join(dir,e.name);if(e.isDirectory())await walk(p);else if(e.name.endsWith('.js')){const r=spawnSync(process.execPath,['--check',p],{encoding:'utf8'});if(r.status!==0)throw Error(r.stderr);count++;}}}
await walk('public');
const s=await readFile('public/sideways/location.js','utf8');
for(const x of ['fetch(', 'sendBeacon(', 'localStorage', 'sessionStorage', 'console.', 'XMLHttpRequest','WebSocket','location.hash','URLSearchParams'])if(s.includes(x))throw Error('Unexpected location data path: '+x);
console.log(`${count} browser JS files passed syntax checks; location module has no upload/storage/link API.`);
