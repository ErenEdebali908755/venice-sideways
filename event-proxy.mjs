const allowedSlug = value => /^[a-z][a-z0-9-]{0,79}$/.test(value);
let bucket = { count: 0, until: 0 };
function limit() {
  const now = Date.now();
  if (bucket.until <= now) bucket = { count: 0, until: now + 60000 };
  bucket.count++;
  // The socket address may be the hosting proxy shared by many visitors.
  // The upstream separately limits eligible new registrations, without a phone quota.
  return bucket.count <= 450;
}
function response(res, status, body) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'private, no-store');
  res.writeHead(status);
  res.end(JSON.stringify(body));
}
export async function eventProxy(req, res, path, fetcher = fetch) {
  const list = path === '/api/events';
  const match = /^\/api\/events\/([a-z][a-z0-9-]{0,79})(\/register)?$/.exec(path);
  if (!list && !match) return response(res, 404, { error: 'not_found' });
  const registering = !!match?.[2];
  if (req.method !== (registering ? 'POST' : 'GET')) return response(res, 405, { error: 'method' });
  if (registering && (req.headers.origin !== 'https://venicesideways.com' ||
      !req.headers['content-type']?.startsWith('application/json')))
    return response(res, 403, { error: 'origin' });
  if (registering && !limit())
    return response(res, 429, { error: 'rate_limit' });
  const upstream = list ? '/api/sideways/public-events' :
    `/api/sideways/events/${match[1]}${registering ? '/register' : ''}`;
  try {
    let body;
    if (registering) {
      let bytes = 0; const chunks = [];
      for await (const chunk of req) {
        bytes += chunk.length;
        if (bytes > 4096) return response(res, 413, { error: 'too_large' });
        chunks.push(chunk);
      }
      const data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      if (!data || typeof data !== 'object' || Array.isArray(data)) return response(res, 400, { error: 'invalid' });
      body = JSON.stringify({
        firstName: data.firstName, lastName: data.lastName, phone: data.phone,
        email: data.email, gender: data.gender, idempotencyKey: data.idempotencyKey,
      });
    }
    const r = await fetcher('https://erenedebali.com' + upstream, {
      method: req.method,
      headers: registering ? { 'Content-Type': 'application/json', Origin: 'https://erenedebali.com' } : { Accept: 'application/json' },
      ...(registering ? { body } : {}),
      signal: AbortSignal.timeout(8000), redirect: 'error',
    });
    if (r.status === 404) return response(res, 404, { error: 'not_found' });
    if (!r.ok) {
      let message = '';
      if (r.status === 400 || r.status === 409) {
        const detail = await r.json().catch(() => null);
        message = String(detail?.errors?.[0]?.message || detail?.message || '').toLowerCase();
      }
      const code = r.status === 409
        ? ['full','cancelled','upcoming','closed'].find(value => message.includes(value)) || 'closed'
        : r.status === 400
          ? message.includes('email') ? 'invalidEmail' : message.includes('name') ? 'invalidName' : 'invalidPhone'
          : r.status === 429 ? 'rate' : 'error';
      return response(res, [400, 409, 413, 415, 429].includes(r.status) ? r.status : 503, { error: code });
    }
    const data = await r.json();
    if (registering) {
      if (!['registered', 'already_registered'].includes(data.result) || !data.event?.slug)
        throw Error('Invalid response');
      return response(res, r.status === 201 ? 201 : 200, { result: data.result, event: { slug: data.event.slug, eventDate: data.event.eventDate, translations: data.event.translations } });
    }
    const project = event => {
      if (!allowedSlug(event?.slug) || !allowedSlug(event?.routeKey) || !/^\d{4}-\d{2}-\d{2}$/.test(event?.eventDate) ||
          !['open', 'upcoming', 'full', 'closed', 'cancelled'].includes(event?.state) || !event?.translations)
        throw Error('Invalid event');
      return { slug: event.slug, routeKey: event.routeKey, eventDate: event.eventDate,
        startAt: event.startAt || null, endAt: event.endAt || null,
        registrationOpensAt: event.registrationOpensAt || null,
        registrationClosesAt: event.registrationClosesAt || null,
        state: event.state, capacity: event.capacity ?? null, remaining: event.remaining ?? null,
        translations: event.translations, privacyContact: event.privacyContact,
        retentionDays: event.retentionDays, timezone: 'Europe/Rome' };
    };
    return response(res, 200, list ? { events: (data.events || []).slice(0, 30).map(project) } : project(data));
  } catch {
    return response(res, 503, { error: 'unavailable' });
  }
}
