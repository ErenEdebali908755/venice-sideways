/* Local, manual walking progress. No location, telemetry or network calls. */
export const WALKING_STORAGE_KEY = "sideways-walking-progress-v1";
const PHASES = new Set(["reaching-start", "walking", "at-stop", "transit", "complete"]);
export function walkingSteps(route) {
  let number = 0;
  return [...(route?.segments || [])].sort((a, b) => a.order - b.order).flatMap(segment =>
    segment.type === "vaporetto" ? [{ ...segment, boat: true }] : (route.visits || [])
      .filter(visit => visit.visible && visit.segmentKey === segment.key).sort((a, b) => a.order - b.order)
      .map(visit => ({ ...visit, n: visit.isPhotoStop ? ++number : null })));
}
export function walkingRevision(route) {
  // Check both editorial revision and the actual visit identities/order/geography.
  const layout = JSON.stringify([route?.key, route?.revision ?? route?.version ?? null,
    walkingSteps(route).map(step => [step.key, !!step.boat, step.segmentKey, step.latitude, step.longitude,
      step.transitStops?.map(stop => [stop.placeKey, stop.longitude, stop.latitude, stop.lineTo])])]);
  let hash = 2166136261;
  for (let index = 0; index < layout.length; index++) hash = Math.imul(hash ^ layout.charCodeAt(index), 16777619);
  return (hash >>> 0).toString(16);
}
export function restoreWalkingState(route, saved) {
  const steps = walkingSteps(route), first = steps[0];
  const initial = { schemaVersion: 1, routeKey: route?.key, revision: walkingRevision(route),
    targetKey: first?.key || null, completedVisitKeys: [], phase: "reaching-start", transitLeg: 0 };
  if (!saved || saved.schemaVersion !== 1 || saved.routeKey !== route?.key || !PHASES.has(saved.phase)) return initial;
  let target = steps.find(step => step.key === saved.targetKey);
  // Main ended at Vino Vero before 10 October 2026. Retain that walk's
  // valid progress at its new endpoint without moving any real stop.
  const retiredMainEnd = !target && route?.key === "main" && saved.targetKey === "vino" && steps.at(-1)?.key === "trearchi";
  if (retiredMainEnd) target = steps.at(-1);
  if (!target) return initial;
  const keys = new Set(steps.filter(step => !step.boat).map(step => step.key));
  const completed = [...new Set(Array.isArray(saved.completedVisitKeys) ? saved.completedVisitKeys : [])]
    .filter(key => keys.has(key)).slice(0, keys.size);
  let phase = saved.phase;
  if (retiredMainEnd) phase = completed.includes(target.key) ? "complete" : "walking";
  if (phase === "transit" && !target.boat) phase = "walking";
  if (target.boat && phase !== "complete") phase = "transit";
  if (phase === "reaching-start" && target !== first) phase = "walking";
  if (phase === "complete" && (target !== steps.at(-1) || !completed.includes(target.key))) phase = target.boat ? "transit" : "walking";
  // A changed revision can retain only still-valid manual progress, never stale IDs.
  return { ...initial, targetKey: target.key, completedVisitKeys: completed, phase,
    transitLeg: target.boat && Number.isInteger(saved.transitLeg) ? Math.max(0, Math.min(saved.transitLeg, Math.max(0, (target.transitStops?.length || 1) - 2))) : 0 };
}
export function advanceWalkingState(route, current) {
  const state = restoreWalkingState(route, current), steps = walkingSteps(route);
  const index = steps.findIndex(step => step.key === state.targetKey), target = steps[index];
  if (!target || state.phase === "complete") return state;
  const done = new Set(state.completedVisitKeys);
  const move = () => {
    const next = steps[index + 1];
    return { ...state, completedVisitKeys: [...done], targetKey: next?.key || target.key,
      phase: next ? next.boat ? "transit" : "walking" : "complete", transitLeg: 0 };
  };
  if (state.phase === "reaching-start") { done.add(target.key); return move(); }
  if (state.phase === "walking") return { ...state, phase: "at-stop" };
  if (state.phase === "at-stop") { done.add(target.key); return move(); }
  const lastLeg = Math.max(0, (target.transitStops?.length || 1) - 2);
  return state.transitLeg < lastLeg ? { ...state, transitLeg: state.transitLeg + 1 } : move();
}
export function continueWalkingAt(route, current, key) {
  const state = restoreWalkingState(route, current), steps = walkingSteps(route);
  const step = steps.find(item => item.key === key);
  if (!step) return state;
  return { ...state, targetKey: step.key, phase: step.boat ? "transit" : "walking", transitLeg: 0 };
}
export function previousWalkingState(route, current) {
  const state = restoreWalkingState(route, current), steps = walkingSteps(route);
  const index = Math.max(0, steps.findIndex(step => step.key === state.targetKey) - 1);
  return continueWalkingAt(route, state, steps[index]?.key);
}
export function activeWalkingGeometry(route, current) {
  const state = restoreWalkingState(route, current), steps = walkingSteps(route);
  const index = steps.findIndex(step => step.key === state.targetKey), target = steps[index];
  if (!target || target.boat || state.phase !== "walking") return [];
  const segment = route.segments.find(item => item.key === target.segmentKey);
  const previous = steps[index - 1];
  const from = previous?.boat ? previous.transitStops?.at(-1) : previous;
  const geometry = segment?.geometry || [];
  if (!from || geometry.length < 2) return [];
  const closest = point => geometry.reduce((best, coordinate, number) => {
    const distance = (coordinate[0] - point.longitude) ** 2 + (coordinate[1] - point.latitude) ** 2;
    return distance < best.distance ? { number, distance } : best;
  }, { number: 0, distance: Infinity }).number;
  const start = closest(from), end = closest(target);
  // Use only vertices already in the recorded path. No invented straight shortcut.
  return start <= end ? geometry.slice(start, end + 1) : geometry.slice(end, start + 1).reverse();
}
export function transitLegGeometry(step, water, leg = 0) {
  const original = [[12.32871, 45.43164], [12.32206, 45.44026], [12.31985, 45.44613]];
  const stops = step?.transitStops || [], geometry = step?.geometry || [];
  const known = geometry.length <= 3 && stops.length === 3 && stops.every((stop, index) =>
    stop.placeKey === ["board", "change", "land"][index] &&
    Math.abs(stop.longitude - original[index][0]) < 0.00001 && Math.abs(stop.latitude - original[index][1]) < 0.00001);
  if (known) return water?.legs?.[leg]?.coordinates || [];
  if (!step?.routingReviewed || geometry.length <= 3 || !stops[leg] || !stops[leg + 1]) return [];
  const closest = stop => geometry.reduce((best, point, index) => {
    const distance = (point[0] - stop.longitude) ** 2 + (point[1] - stop.latitude) ** 2;
    return distance < best.distance ? { index, distance } : best;
  }, { index: 0, distance: Infinity }).index;
  const start = closest(stops[leg]), end = closest(stops[leg + 1]);
  return start <= end ? geometry.slice(start, end + 1) : geometry.slice(end, start + 1).reverse();
}
export function loadWalkingProgress(storage) {
  try {
    const text = storage?.getItem(WALKING_STORAGE_KEY);
    if (!text || text.length > 262144) return {};
    const value = JSON.parse(text);
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch { return {}; }
}
export function saveWalkingProgress(storage, routes, states) {
  try {
    const clean = Object.fromEntries(routes.slice(0, 64).map(route => [route.key, restoreWalkingState(route, states[route.key])]));
    storage?.setItem(WALKING_STORAGE_KEY, JSON.stringify(clean));
  } catch { /* Private browsing/quota denial must not block manual walking. */ }
}
