import phone from './lib/libphonenumber-max.cjs';
import { RelayError, clientSignal, fetchJSON, plainObject, publicCache, readRequestJSON, sendJSON, windowBudget } from './relay-security.mjs';
const allowedSlug = value => typeof value === 'string' && /^[a-z][a-z0-9-]{0,79}$/.test(value);
const locales = new Set(['en','tr','it','fr','ru','zh','ja','ko']);
const namePattern = /^[\p{L}\p{M}][\p{L}\p{M}\p{Zs}'’.-]*$/u;
export function normalizeRegistration(data) {
  if (!plainObject(data)) throw new RelayError(400, 'invalid');
  const name = value => { if (typeof value !== 'string') throw new RelayError(400, 'invalidName'); const normalized = value.normalize('NFC').trim().replace(/\p{Zs}+/gu, ' '); if (!normalized || normalized.length > 80 || !namePattern.test(normalized)) throw new RelayError(400, 'invalidName'); return normalized; };
  const firstName = name(data.firstName), lastName = name(data.lastName);
  if (typeof data.phone !== 'string' || data.phone.length > 40) throw new RelayError(400, 'invalidPhone');
  const number = data.phone.replace(/[\s().-]/g, '');
  if (!/^\+[1-9]\d{7,14}$/.test(number)) throw new RelayError(400, 'invalidPhone');
  const parsed = phone.parsePhoneNumberFromString(number, { extract: false });
  if (!parsed?.isValid() || parsed.number !== number) throw new RelayError(400, 'invalidPhone');
  if (data.email != null && typeof data.email !== 'string') throw new RelayError(400, 'invalidEmail');
  const email = data.email === '' || data.email == null ? null : data.email.trim().toLowerCase();
  if (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email))) throw new RelayError(400, 'invalidEmail');
  const gender = data.gender === '' || data.gender == null ? null : data.gender;
  if (gender !== null && !['woman','man','nonbinary','prefer_not_to_say'].includes(gender)) throw new RelayError(400, 'invalid');
  if (typeof data.idempotencyKey !== 'string' || !/^[a-f0-9-]{36}$/i.test(data.idempotencyKey)) throw new RelayError(400, 'invalid');
  if (data.retryReceipt !== undefined && (typeof data.retryReceipt !== 'string' || !data.retryReceipt || data.retryReceipt.length > 1024)) throw new RelayError(400, 'invalid');
  return { firstName, lastName, phone: number, email, gender, idempotencyKey: data.idempotencyKey, ...(data.retryReceipt ? { retryReceipt: data.retryReceipt } : {}) };
}
function translations(value) {
  if (!plainObject(value) || Object.keys(value).length > 8) throw new RelayError(502);
  const result = {};
  for (const [locale, row] of Object.entries(value)) { if (!locales.has(locale) || !plainObject(row) || typeof row.title !== 'string' || row.title.length > 200 || typeof row.description !== 'string' || row.description.length > 4000) throw new RelayError(502); result[locale] = { title: row.title, description: row.description }; }
  return result;
}
export function projectEvent(event) {
  if (!plainObject(event) || !allowedSlug(event.slug) || !allowedSlug(event.routeKey) || !/^\d{4}-\d{2}-\d{2}$/.test(event.eventDate) || !['open','upcoming','full','closed','cancelled'].includes(event.state)) throw new RelayError(502);
  const date = value => value == null ? null : typeof value === 'string' && value.length <= 40 && Number.isFinite(Date.parse(value)) ? value : (() => { throw new RelayError(502); })();
  const count = value => value == null ? null : Number.isSafeInteger(value) && value >= 0 ? value : (() => { throw new RelayError(502); })();
  return { slug: event.slug, routeKey: event.routeKey, eventDate: event.eventDate, startAt: date(event.startAt), endAt: date(event.endAt), registrationOpensAt: date(event.registrationOpensAt), registrationClosesAt: date(event.registrationClosesAt), state: event.state, capacity: count(event.capacity), remaining: count(event.remaining), translations: translations(event.translations), privacyContact: typeof event.privacyContact === 'string' && event.privacyContact.length <= 254 ? event.privacyContact : '', retentionDays: Number.isSafeInteger(event.retentionDays) && event.retentionDays > 0 && event.retentionDays <= 3650 ? event.retentionDays : 180, timezone: 'Europe/Rome' };
}
export function createEventProxy({ now = Date.now, fetcher = fetch } = {}) {
  // Abuse admission is deliberately separate and higher than eligible registration work.
  const abuse = windowBudget(9000, 60000, now), eligible = windowBudget(450, 60000, now), reads = windowBudget(1200, 60000, now);
  const cache = publicCache({ maxEntries: 64, ttl: 3000, negativeTTL: 2000, now });
  return async function proxy(req, res, path, request = fetcher) {
    const list = path === '/api/events'; const match = /^\/api\/events\/([a-z][a-z0-9-]{0,79})(\/register)?$/.exec(path);
    if (!list && !match) return sendJSON(res, 404, { error: 'not_found' });
    const registering = !!match?.[2]; if (req.method !== (registering ? 'POST' : 'GET')) return sendJSON(res, 405, { error: 'method' });
    if (registering && !['https://venicesideways.com','https://www.venicesideways.com'].includes(req.headers.origin)) return sendJSON(res, 403, { error: 'origin' });
    if (registering && !/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] || '')) return sendJSON(res, 415, { error: 'type' });
    const client = clientSignal(req, res);
    try {
      const upstream = list ? '/api/sideways/public-events' : `/api/sideways/events/${match[1]}${registering ? '/register' : ''}`;
      let body;
      if (registering) { abuse(); body = JSON.stringify(normalizeRegistration(await readRequestJSON(req))); eligible(); }
      else reads();
      const load = async () => {
        const { response: r, data } = await fetchJSON(request, 'https://erenedebali.com' + upstream, { method: req.method, headers: registering ? { 'Content-Type': 'application/json', Origin: 'https://erenedebali.com' } : { Accept: 'application/json' }, ...(registering ? { body } : {}), signal: client.signal }, list ? 160000 : registering ? 16000 : 16000);
        if (r.status === 404) return { status: 404, value: { error: 'not_found' } };
        if (!r.ok) { const message = typeof data?.errors?.[0]?.message === 'string' ? data.errors[0].message.toLowerCase() : typeof data?.message === 'string' ? data.message.toLowerCase() : ''; const code = r.status === 409 ? ['full','cancelled','upcoming','closed'].find(value => message.includes(value)) || 'closed' : r.status === 400 ? message.includes('email') ? 'invalidEmail' : message.includes('name') ? 'invalidName' : 'invalidPhone' : r.status === 429 ? 'rate' : 'error'; return { status: [400,409,413,415,429].includes(r.status) ? r.status : 503, value: { error: code }, retryAfter: r.status === 429 ? 60 : 1 }; }
        if (registering) {
          if (!plainObject(data) || !['received','registered','already_registered'].includes(data.result)) throw new RelayError(502);
          // Generic receipt conceals old membership across compatible rolling releases.
          return { status: 200, value: { result: 'received', ...(typeof data.retryReceipt === 'string' && data.retryReceipt.length > 0 && data.retryReceipt.length <= 1024 ? { retryReceipt: data.retryReceipt } : {}) } };
        }
        if (list && (!Array.isArray(data?.events) || data.events.length > 30)) throw new RelayError(502);
        return { status: 200, value: list ? { events: data.events.map(projectEvent) } : projectEvent(data) };
      };
      // Registration responses contain participant context and never enter cache/single-flight.
      const result = registering ? await load() : await cache.read(path, load);
      return sendJSON(res, result.status, result.value || { error: 'unavailable' }, result.retryAfter);
    } catch (error) { return sendJSON(res, error.status || 503, { error: error.code || 'unavailable' }, error.status === 429 || error.status >= 500 ? error.retryAfter || 1 : undefined); }
    finally { client.close(); }
  };
}
export const eventProxy = createEventProxy();
