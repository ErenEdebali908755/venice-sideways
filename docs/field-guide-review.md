# Venice Sideways — redesign review, 28 September 2026

Status: implementation draft. Do not call this a completed photographic release or a field-verified walking route. Real Venice photographs have not been supplied/identified, and the production admin save/publish chain has not been exercised. No production route data or deployment was changed.

## Short diagnosis

| Screen / task | Observed issue | Evidence and limit |
| --- | --- | --- |
| Live visitor, desktop Main Walk | Language/theme controls, route navigation, stop list and 55 photo ideas compete with the map. No stop photographs appear. | Browser observation on the existing live site. |
| Live visitor, Full Walk switch | 28 stops replace the Main route; the old sunset tooltip remained in the observed state. | Browser observation. Outdoor navigation was not tested. |
| Admin workspace | Fixed two-column layout; selected fields occupy the same left surface as stop navigation. | Source inspection, then new component UI tested locally. Authenticated production screen still needs verification. |
| Admin review | No revision in the decision screen; segment errors did not reliably select the affected path. | Source inspection. Added route/revision and segment targeting. |
| Shared presentation | Public vanilla scripts and React admin did not share visitor cards/preview. | Source inspection. Added a common presentation module. |
| Route measurements / images | No approved stop-photo mapping; imported walking paths are not source/on-site reviewed. | Actual public route data and initial geometry metadata. No distance/time claims added. |

## One design direction

A photographic field guide: Cormorant headings, Manrope interface text, paper/stone surfaces, ink text and teal walking paths. Explore compares Main Walk and Full Walk near a map preview. Walk keeps one selected route, a compact stop card and the next action. A separate detail view keeps route/stop/camera state when returning.

The cover is explicitly unassigned. The published archive homepage artwork was inspected and not treated as a factual stop photograph. No stock or AI imagery was substituted. Public photo URL, alternative text, credit and crop focus can be authored per route/stop. Photos must come from the existing public image endpoints; private preview URLs are rejected.

## Implemented

- Explore / Walk, 11 Main stops / 28 Full stops, existing eight-language stop/idea content, five ideas per stop, explicit start directions, previous/next and list fallback.
- MapLibre 2D/optional 3D, Leaflet 2D fallback, selected-route-only features/pins, separate ACTV 1 blue and 5.2 purple sailing legs. Ferrovia E → D transfer is described, not rendered as a guessed walking connection. Official feed modification date: 2026-09-25; bundled source check: 2026-09-27. These are data dates, not a claim of live service availability.
- Local location stays off until selected, no coordinate upload/storage, stale/race/hidden-page guards and 15-minute limit. Existing opt-in admin sharing and aggregate measurement stay separate.
- Three-panel admin, pointer/keyboard separators, bounds, collapse/reset, per-account browser preferences, mobile Map / Stops / Edit tabs. Map resize preserves viewport. If the editing map fails, a 2D visitor preview keeps stop selection available and explicitly disables expectations of pin/line editing.
- Shared live impact card and optional visitor frame, TR/EN, mobile/desktop widths; current edits / saved draft / published snapshot labels. Same-origin parent messages carry the draft in memory; no public draft URL, analytics or geolocation in preview.
- Photo presentation is saved in route and version JSON columns and included in immutable public snapshots. Publish success checks the returned published revision. Existing permissions and revision conflict gate remain.

## Verification and limits

| Check | Result |
| --- | --- |
| Visitor server/projection/route-content tests | 15 passed. Includes 8 locales / five prompts, ACTV split, no straight fallback for missing geometry, moved-pier guard, escaped text, immutable hydration and rejection of private/token photo URLs before save. |
| Visitor syntax / location boundary | 31 browser scripts passed syntax; original location module contains no upload/storage/link API. |
| Admin TypeScript and production build | Passed with a build-only local secret; no production credentials used. |
| Admin Sideways tests | 43 passed: permissions, route/model/geometry/location/operations/transit plus presentation validation. |
| Desktop visitor UI | Main selection/start link, next stop, transfer E → D, Full switch and TR switch verified. |
| 390px visitor UI | Actual responsive page in a 390px frame; 2D map, pins, compact card and next-stop action verified. Not a physical phone/GPS test. |
| Admin UI | Actual React components with isolated simulated persistence: live title update, unsaved label, saved revision, review revision, publish-state transition, keyboard right-panel resize (356px), pointer drag (438px), reset (340px), discard-confirmation cancel retains the edited title, full preview; selecting a fallback-map pin opens the corresponding editor; mobile list → stop editor verified. This is NOT production DB save/publish verification. |
| Accessibility | Main color pairs measured at 4.88:1 or better; light focus ring corrected to 3.92:1. Keyboard resizing/visible focus and 44px primary controls implemented. No complete WCAG certification asserted. |
| Still needs verification | Production migration and authenticated save/publish, real photo loading/cropping, admin WebGL pin dragging/3D, device touch resizing, outdoor entrances/bridges/GPS and all eight languages of new chrome (TR/EN authored; other stop content preserved). |

The preview harness used only public legacy route content and a separate in-memory simulated API; it is not included in production public assets. Draft route validation still blocks publishing unreviewed addresses and geometry. Do not bypass that gate to demonstrate success.

## Delivery / rollout

Pair this visitor change with the Sideways admin change. Review actual photos and field data, run the additive presentation migration in staging, then exercise authenticated save → validate → publish and verify the immutable visitor revision. Publish only after these remaining checks. Existing live service is retained during this draft.

Implementation references: [W3C Window Splitter](https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/), [MapLibre Map API](https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/). Shared files in the two repositories should be kept byte-identical (`guide.js`, `guide.css`, map libraries and fonts).

## Screen evidence

Captured from the local implementation using public route data. Admin persistence was simulated; these screenshots do not prove production publication.

- [Desktop walk](evidence/visitor-walk.jpg)
- [390px visitor](evidence/visitor-mobile.jpg)
