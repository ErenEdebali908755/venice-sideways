/* The active guide's only GPS engine. Coordinates live only in this instance. */
export const inVenice = ([longitude, latitude]) => longitude >= 12.18 && longitude <= 12.55 && latitude >= 45.34 && latitude <= 45.55;
export function locationCapability({ publicLocation = false, preview = false, localTest = false, host = globalThis.location?.hostname, secure = globalThis.isSecureContext, supported = !!globalThis.navigator?.geolocation } = {}) {
  const local = localTest && ["localhost", "127.0.0.1", "[::1]"].includes(host);
  return publicLocation && !preview && (host === "venicesideways.com" || host === "www.venicesideways.com" || local) && (secure || local) && supported;
}
export function validFix(position, now, previous = 0) {
  const { longitude, latitude, accuracy } = position?.coords || {};
  let timestamp = position?.timestamp;
  if (!Number.isFinite(timestamp) || timestamp > now + 5000) {
    // A recent microsecond fix can be just below now * 1000 after delivery delay.
    const milliseconds = timestamp / 1000;
    timestamp = Number.isFinite(timestamp) && milliseconds >= now - 30000 && milliseconds <= now + 5000
      ? milliseconds : now;
  }
  if (![longitude, latitude, accuracy, timestamp].every(Number.isFinite) || Math.abs(longitude) > 180 || Math.abs(latitude) > 90 || accuracy <= 0 || accuracy > 100000 || timestamp <= previous || timestamp < now - 30000 || timestamp > now + 5000) return null;
  return { coordinates: [longitude, latitude], accuracy, timestamp, outside: !inVenice([longitude, latitude]) };
}
export class LocationEngine {
  constructor({ allowed = () => false, geolocation = globalThis.navigator?.geolocation, permissions = globalThis.navigator?.permissions, now = Date.now, timers = globalThis, onFix = () => {}, onState = () => {}, onClear = () => {} } = {}) {
    Object.assign(this, { allowed, geolocation, permissions, now, timers, onFix, onState, onClear });
    this.state = "off"; this.watch = null; this.generation = 0; this.active = false;
    this.fix = null; this.pending = null; this.lastAccepted = 0; this.lastPaint = 0;
  }
  status(state) { this.state = state; this.onState(state); }
  start(identity) {
    if (this.active) return;
    this.stop();
    if (!this.allowed() || !this.geolocation) { this.status("unsupported"); return; }
    this.active = true; this.identity = identity;
    const generation = this.generation;
    const current = () => this.active && generation === this.generation && identity === this.identity;
    this.status("requesting");
    this.requestTimer = this.timers.setTimeout(() => { if (current() && !this.fix) this.stop("timeout"); }, 16000);
    try {
      const watch = this.geolocation.watchPosition(position => {
        if (!current()) return;
        const fix = validFix(position, this.now(), this.lastAccepted);
        if (!fix) return;
        this.lastAccepted = fix.timestamp;
        this.pending = fix;
        this.timers.clearTimeout(this.requestTimer);
        this.requestTimer = null;
        // First fix and a large accuracy change are shown immediately; bursts keep the latest fix.
        if (!this.fix || Math.abs(this.fix.accuracy - fix.accuracy) >= Math.max(50, this.fix.accuracy / 2) || this.now() - this.lastPaint >= 1000) this.flush(current);
        else if (!this.updateTimer) this.updateTimer = this.timers.setTimeout(() => { this.updateTimer = null; this.flush(current); }, Math.max(0, 1000 - (this.now() - this.lastPaint)));
      }, error => {
        if (!current()) return;
        this.stop(error?.code === 1 ? "denied" : error?.code === 3 ? "timeout" : "unavailable");
      }, { enableHighAccuracy: false, timeout: 15000, maximumAge: 10000 });
      if (current()) this.watch = watch;
      else this.geolocation.clearWatch(watch);
      // Permission API is optional, including in Safari. It never initiates a watch.
      const permissionQuery = (() => { try { return this.permissions?.query?.({ name: "geolocation" }); } catch { return null; } })();
      permissionQuery?.then(permission => {
        if (!current()) return;
        this.permission = permission;
        this.permissionChange = () => { if (current() && permission.state === "denied") this.stop("denied"); };
        permission.addEventListener?.("change", this.permissionChange);
        this.permissionChange();
      }).catch(() => {});
    } catch { if (current()) this.stop("unavailable"); }
  }
  flush(current) {
    if (!current() || !this.pending) return;
    this.timers.clearTimeout(this.updateTimer); this.updateTimer = null;
    this.fix = this.pending; this.pending = null; this.lastPaint = this.now();
    this.status("tracking"); this.onFix(this.fix, this.identity);
    if (!current() || !this.fix) return;
    this.timers.clearTimeout(this.staleTimer);
    this.staleTimer = this.timers.setTimeout(() => { if (current()) this.status("stale"); }, Math.max(1, this.fix.timestamp + 30000 - this.now()));
  }
  stop(state = "off") {
    this.generation++; this.active = false;
    if (this.watch !== null) this.geolocation?.clearWatch(this.watch);
    this.watch = null;
    for (const key of ["requestTimer", "updateTimer", "staleTimer"]) { this.timers.clearTimeout(this[key]); this[key] = null; }
    this.permission?.removeEventListener?.("change", this.permissionChange);
    this.permission = null; this.permissionChange = null;
    this.identity = null; this.fix = null; this.pending = null; this.lastAccepted = 0; this.lastPaint = 0;
    this.onClear(); this.status(state);
  }
}
export function accuracyGeometry(fix) {
  const [longitude, latitude] = fix.coordinates;
  const latitudeRadians = latitude * Math.PI / 180, longitudeRadians = longitude * Math.PI / 180, distance = fix.accuracy / 6371008.8;
  const ring = [];
  for (let i = 0; i < 48; i++) {
    const bearing = i * Math.PI * 2 / 48;
    const nextLatitude = Math.asin(Math.sin(latitudeRadians) * Math.cos(distance) + Math.cos(latitudeRadians) * Math.sin(distance) * Math.cos(bearing));
    const nextLongitude = longitudeRadians + Math.atan2(Math.sin(bearing) * Math.sin(distance) * Math.cos(latitudeRadians), Math.cos(distance) - Math.sin(latitudeRadians) * Math.sin(nextLatitude));
    ring.push([((nextLongitude * 180 / Math.PI + 540) % 360) - 180, nextLatitude * 180 / Math.PI]);
  }
  ring.push(ring[0]);
  return { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [ring] } };
}
