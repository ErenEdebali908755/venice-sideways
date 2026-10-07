import { createHmac, timingSafeEqual, createHash } from 'node:crypto';
import { RelayError, clientSignal, fetchJSON, plainObject, readRequestJSON, sendJSON, windowBudget } from './relay-security.mjs';
const fields = ['consent','event','metric','route','language','device','schemaVersion','consentEpoch'];
const bootstrapFields = ['consent','schemaVersion','consentEpoch'];
const claimFields = ['schemaVersion','product','scope','site','consentEpoch','nonce','iat','exp'];
const hex = /^[a-f0-9]{32}$/;
export function validateMeasurement(value, bootstrap = false) {
  const allowed = bootstrap ? bootstrapFields : fields;
  if (!plainObject(value) || Object.keys(value).length !== allowed.length || Object.keys(value).some(key => !allowed.includes(key)) || value.consent !== true || value.schemaVersion !== 1 || typeof value.consentEpoch !== 'string' || !hex.test(value.consentEpoch)) throw new RelayError(400, 'invalid');
  if (!bootstrap && (typeof value.event !== 'string' || !hex.test(value.event) || !['page_view','route_open'].includes(value.metric) || typeof value.route !== 'string' || !/^[a-z][a-z0-9-]{0,79}$/.test(value.route) || !['en','tr','it','fr','ru','zh','ja','ko','other'].includes(value.language) || !['mobile','desktop'].includes(value.device))) throw new RelayError(400, 'invalid');
  return Object.fromEntries(allowed.map(key => [key, value[key]]));
}
export function verifyMeasurement(token, epoch, now = Date.now(), secret = process.env.MEASUREMENT_ADMISSION_SECRET) {
  if (typeof token !== 'string' || token.length > 1024 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{43}$/.test(token)) throw new RelayError(403, 'admission');
  if (!secret || !/^[a-f0-9]{64,128}$/.test(secret)) throw new RelayError(503, 'unavailable');
  const [encoded, signature] = token.split('.'), actual = Buffer.from(signature, 'base64url'), expected = createHmac('sha256', secret).update('measurement-v1:' + encoded).digest();
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new RelayError(403, 'admission');
  let claim; try { claim = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')); } catch { throw new RelayError(403, 'admission'); }
  const seconds = Math.floor(now / 1000);
  if (!plainObject(claim) || Object.keys(claim).length !== claimFields.length || Object.keys(claim).some(key => !claimFields.includes(key)) || claim.schemaVersion !== 1 || claim.product !== 'sideways' || claim.scope !== 'anonymous-counts' || claim.site !== 'venicesideways.com' || claim.consentEpoch !== epoch || typeof claim.nonce !== 'string' || !hex.test(claim.nonce) || !Number.isSafeInteger(claim.iat) || !Number.isSafeInteger(claim.exp) || claim.exp <= seconds || claim.iat > seconds + 30 || claim.exp - claim.iat !== 300) throw new RelayError(403, 'admission');
  return claim;
}
export function createCommunityProxy({ now = Date.now, secret = () => process.env.MEASUREMENT_ADMISSION_SECRET, fetcher = fetch } = {}) {
  const abuse = windowBudget(9000, 60000, now), bootstrapBudget = windowBudget(180, 60000, now), eventBudget = windowBudget(1200, 60000, now);
  const nonces = new Map(), done = new Map();
  const prune = map => { for (const [key, row] of map) if (row.until <= now()) map.delete(key); };
  return async function proxy(req, res, path, request = fetcher) {
    const bootstrap = path === '/api/community/admission';
    if (!bootstrap && path !== '/api/community/statistics') return sendJSON(res, 404, {});
    if (req.method !== 'POST') return sendJSON(res, 405, {});
    if (!['https://venicesideways.com','https://www.venicesideways.com'].includes(req.headers.origin)) return sendJSON(res, 403, {});
    if (!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] || '')) return sendJSON(res, 415, {});
    const client = clientSignal(req, res);
    try {
      abuse(); const body = validateMeasurement(await readRequestJSON(req, bootstrap ? 256 : 1024, 3000), bootstrap);
      let token, claim, key, digest;
      if (bootstrap) {
        if (!secret() || !/^[a-f0-9]{64,128}$/.test(secret())) throw new RelayError(503);
        bootstrapBudget();
      } else {
        token = req.headers['x-measurement-capability']; claim = verifyMeasurement(token, body.consentEpoch, now(), secret());
        prune(done); prune(nonces); key = claim.nonce + ':' + body.event; digest = createHash('sha256').update(JSON.stringify(body)).digest('hex');
        const old = done.get(key); if (old) { if (old.digest !== digest) throw new RelayError(403, 'admission'); return sendJSON(res, 200, { ok: true }); }
        let nonce = nonces.get(claim.nonce); if (!nonce) { if (nonces.size >= 256) throw new RelayError(503, 'busy'); nonce = { count: 0, until: claim.exp * 1000 }; nonces.set(claim.nonce, nonce); }
        if (nonce.count >= 60) throw new RelayError(429, 'rate', Math.max(1, Math.ceil((nonce.until - now()) / 1000)));
        eventBudget(); nonce.count++;
      }
      const { response, data } = await fetchJSON(request, 'https://erenedebali.com/api/sideways/' + (bootstrap ? 'measurement-admission' : 'statistics'), { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://erenedebali.com', ...(token ? { 'X-Measurement-Capability': token } : {}) }, body: JSON.stringify(body), signal: client.signal }, bootstrap ? 2048 : 1024);
      if (!response.ok) return sendJSON(res, response.status >= 400 && response.status < 500 ? response.status : 503, { ok: false }, response.status === 429 ? 60 : undefined);
      if (bootstrap) { const minted = verifyMeasurement(data?.capability, body.consentEpoch, now(), secret()); if (data.expiresAt !== minted.exp) throw new RelayError(502); return sendJSON(res, 200, { capability: data.capability, expiresAt: minted.exp }); }
      if (!plainObject(data) || data.ok !== true) throw new RelayError(502);
      done.set(key, { digest, until: claim.exp * 1000 }); while (done.size > 2048) done.delete(done.keys().next().value);
      return sendJSON(res, 200, { ok: true });
    } catch (error) { return sendJSON(res, error.status || 503, { ok: false }, error.status === 429 || error.status >= 500 ? error.retryAfter || 1 : undefined); }
    finally { client.close(); }
  };
}
export const communityProxy = createCommunityProxy();
