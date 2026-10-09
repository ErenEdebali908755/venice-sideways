/** Only directly checked official navigation pages; no redirect/query endpoints. */
export const DEFAULT_ACTV_TIMETABLE = 'https://actv.avmspa.it/en/content/orari-servizio-di-navigazione-0';
const paths = {
  'actv.avmspa.it': new Set(['/en/content/orari-servizio-di-navigazione-0','/it/content/orari-servizio-di-navigazione-0','/en/node/10576']),
  'avm.avmspa.it': new Set(['/it/content/tutororari']),
};
export function officialTimetableURL(value) {
  if (typeof value !== 'string' || value.length > 2000 || /[\\\u0000-\u0020]/.test(value)) return '';
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password && !url.port && !url.search && !url.hash && paths[url.hostname]?.has(url.pathname) ? url.href : ''; } catch { return ''; }
}
