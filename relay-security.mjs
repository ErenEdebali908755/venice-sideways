/** Process-local admission is a second bound; upstream shared budgets remain fleet authority. */
export class RelayError extends Error {
  constructor(status, code = 'unavailable', retryAfter = 1) { super(code); this.status = status; this.code = code; this.retryAfter = retryAfter; }
}
export const plainObject = value => !!value && typeof value === 'object' && !Array.isArray(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value));
export function windowBudget(max, duration = 60000, now = Date.now) {
  let count = 0, until = 0;
  return () => { const time = now(); if (time >= until) { count = 0; until = time + duration; } if (count >= max) throw new RelayError(429, 'rate', Math.max(1, Math.ceil((until - time) / 1000))); count++; };
}
export function createSemaphore({ limit = 8, queueLimit = 16, queueTimeout = 750 } = {}) {
  let active = 0; const queue = [];
  function acquire(signal) {
    if (signal?.aborted) return Promise.reject(new RelayError(503));
    if (active < limit) { active++; return Promise.resolve(release); }
    if (queue.length >= queueLimit) return Promise.reject(new RelayError(503, 'busy'));
    return new Promise((resolve, reject) => {
      const item = { resolve, reject, signal, timer: null, abort: null };
      const remove = () => { const index = queue.indexOf(item); if (index >= 0) queue.splice(index, 1); clearTimeout(item.timer); signal?.removeEventListener('abort', item.abort); };
      item.abort = () => { remove(); reject(new RelayError(503)); };
      item.start = () => { remove(); active++; resolve(release); };
      item.timer = setTimeout(() => { remove(); reject(new RelayError(503, 'busy')); }, queueTimeout);
      signal?.addEventListener('abort', item.abort, { once: true }); queue.push(item);
    });
  }
  function release() { active--; if (queue.length) queue[0].start(); }
  return { async run(signal, task) { const done = await acquire(signal); try { return await task(); } finally { done(); } }, stats: () => ({ active, queued: queue.length, limit, queueLimit }) };
}
export const upstreamGate = createSemaphore();
export function deadline(milliseconds, parent) {
  const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), milliseconds);
  const cancel = () => controller.abort(); parent?.addEventListener('abort', cancel, { once: true }); if (parent?.aborted) cancel();
  return { signal: controller.signal, abort: cancel, close() { clearTimeout(timeout); parent?.removeEventListener('abort', cancel); } };
}
async function withAbort(promise, signal, cleanup = () => {}) {
  if (signal?.aborted) { cleanup(); throw new RelayError(503); }
  let abort;
  try { return await Promise.race([promise, new Promise((_, reject) => { abort = () => { cleanup(); reject(new RelayError(503)); }; signal?.addEventListener('abort', abort, { once: true }); })]); }
  finally { signal?.removeEventListener('abort', abort); }
}
export async function readJSONStream(response, maxBytes, signal) {
  const length = response.headers?.get?.('content-length');
  if (length && /^\d+$/.test(length) && Number(length) > maxBytes) { await response.body?.cancel?.().catch(() => {}); throw new RelayError(502); }
  if (!response.body?.getReader) throw new RelayError(502);
  const reader = response.body.getReader(); const chunks = []; let bytes = 0, canceled = false, cancellation;
  const cancel = () => { if (!canceled) { canceled = true; cancellation = reader.cancel().catch(() => {}); } };
  try {
    for (;;) { const part = await withAbort(reader.read(), signal, cancel); if (part.done) break; bytes += part.value.byteLength; if (bytes > maxBytes) { cancel(); throw new RelayError(502); } chunks.push(part.value); }
    if (signal?.aborted) throw new RelayError(503);
    try { return JSON.parse(Buffer.concat(chunks, bytes).toString('utf8')); } catch { throw new RelayError(502); }
  } finally { if (cancellation) await cancellation; reader.releaseLock(); }
}
export async function readRequestJSON(req, maxBytes = 4096, milliseconds = 3000) {
  const length = req.headers?.['content-length'];
  if (length && /^\d+$/.test(length) && Number(length) > maxBytes) throw new RelayError(413, 'too_large');
  const iterator = req[Symbol.asyncIterator](); const clock = deadline(milliseconds); const chunks = []; let size = 0;
  try {
    for (;;) { const part = await withAbort(iterator.next(), clock.signal, () => req.destroy?.()); if (part.done) break; const chunk = Buffer.isBuffer(part.value) ? part.value : Buffer.from(part.value); size += chunk.length; if (size > maxBytes) { req.pause?.(); throw new RelayError(413, 'too_large'); } chunks.push(chunk); }
    try { const value = JSON.parse(Buffer.concat(chunks, size).toString('utf8')); if (!plainObject(value)) throw Error(); return value; } catch { throw new RelayError(400, 'invalid'); }
  } finally { clock.close(); }
}
export async function fetchJSON(fetcher, url, options, maxBytes, milliseconds = 8000, gate = upstreamGate) {
  const clock = deadline(milliseconds, options.signal);
  try { return await gate.run(clock.signal, async () => { const response = await withAbort(Promise.resolve().then(() => fetcher(url, { ...options, signal: clock.signal, redirect: 'error' })), clock.signal); if (options.method === 'HEAD') { await response.body?.cancel?.().catch(() => {}); return { response, data: null }; } const data = response.status === 404 || response.status === 204 ? (await response.body?.cancel?.().catch(() => {}), null) : await readJSONStream(response, maxBytes, clock.signal); return { response, data }; }); }
  finally { clock.close(); }
}
export function clientSignal(req, res) {
  const controller = new AbortController(); const cancel = () => controller.abort(); const close = () => { if (!res.writableEnded) cancel(); };
  req.once?.('aborted', cancel); res.once?.('close', close);
  return { signal: controller.signal, close() { req.removeListener?.('aborted', cancel); res.removeListener?.('close', close); } };
}
export function sendJSON(res, status, value, retryAfter) {
  if (status === 413) res.setHeader('Connection', 'close');
  res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.setHeader('Cache-Control', 'private, no-store');
  if (retryAfter) res.setHeader('Retry-After', String(retryAfter)); res.writeHead(status); res.end(JSON.stringify(value));
}
/** No stale serving after TTL: withdrawn data must not return on upstream failure. */
export function publicCache({ maxEntries = 128, ttl = 60000, negativeTTL = 5000, now = Date.now } = {}) {
  const entries = new Map(), pending = new Map(); let generation = 0;
  return {
    async read(key, load) { const old = entries.get(key); if (old && now() < old.until) { entries.delete(key); entries.set(key, old); return old.value; } entries.delete(key); if (pending.has(key)) return pending.get(key); if (pending.size >= maxEntries) return { status: 503, retryAfter: 1 }; const version = generation; const job = Promise.resolve().then(load).then(value => { if (version === generation && (value.status === 200 || value.status === 404)) { entries.delete(key); entries.set(key, { value, until: now() + (value.status === 404 ? negativeTTL : ttl) }); while (entries.size > maxEntries) entries.delete(entries.keys().next().value); } return value; }).catch(error => ({ status: error.status || 503, retryAfter: error.retryAfter || 1 })).finally(() => pending.delete(key)); pending.set(key, job); return job; },
    invalidate(key) { generation++; if (key == null) entries.clear(); else entries.delete(key); },
    stats: () => ({ entries: entries.size, pending: pending.size, maxEntries })
  };
}
