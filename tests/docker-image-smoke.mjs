import assert from 'node:assert/strict';
import {setTimeout as delay} from 'node:timers/promises';

const base = process.argv[2];
if (!base) throw Error('Pass the running Docker image base URL.');
let health;
for (let attempt=0; attempt<50; attempt++) {
  try { health = await fetch(`${base}/healthz`); if (health.ok) break; } catch { /* starting */ }
  await delay(200);
}
assert.equal(health?.status, 200, 'container healthcheck');
assert.equal(await health.text(), 'ok');
const event = await fetch(`${base}/events/main-walk-2026-10-11?lang=tr`);
assert.equal(event.status, 200);
assert.match(await event.text(), /events\/events\.js/);
const wrongMethod = await fetch(`${base}/api/events`, {method:'POST'});
assert.equal(wrongMethod.status, 405, 'Node event proxy handles the API route');
assert.deepEqual(await wrongMethod.json(), {error:'method'});
const api = await fetch(`${base}/api/events`);
assert.ok([200,404,503].includes(api.status), `event proxy status: ${api.status}`);
assert.match(api.headers.get('content-type') || '', /application\/json/);
assert.match(api.headers.get('cache-control') || '', /no-store/);
const body = await api.json();
assert.ok(api.status === 200 ? Array.isArray(body.events)
  : body.error === (api.status === 404 ? 'not_found' : 'unavailable'));
console.log(`PASS Docker image health, event page and Node event proxy (upstream status ${api.status})`);
