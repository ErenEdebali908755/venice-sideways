/* Visitor visibility is separate from route records and saved walking progress. */
export const MAIN_WALK_PRESENTATION = Object.freeze({
  routeKeys: Object.freeze(["main"]),
  homeRouteKey: "main",
  singleRoute: true,
});

export function presentedRoutes(routes, presentation) {
  if (!Array.isArray(presentation?.routeKeys)) return routes;
  return routes.filter(route => presentation.routeKeys.includes(route.key));
}

/** Keep every bundled route, even when only Main has a public publication. */
export function replacePublishedRoutes(bundled, published) {
  const replacements = new Map(published.filter(Boolean).map(route => [route.key, route]));
  return bundled.map(route => replacements.get(route.key) || route);
}
