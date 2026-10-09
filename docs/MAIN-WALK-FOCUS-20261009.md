# Main Walk presentation and verified visual sources — 9 October 2026

## Presentation contract

`entry.js` passes `MAIN_WALK_PRESENTATION` to the shared renderer. The route array retains Main and Full; visibility is separate from saved walking state. The private editor does not receive the public-only setting. An old Full hash/query link opens the Main summary with an explanation and does not select or advance a stop. `/classic.html` now resolves to the same entry, preserving query/fragment semantics.

The public landing page has one summary and one opening/resuming action. Main walking retains eleven photo stops and a separate two-leg vaporetto transfer. Opening, inspecting a different stop, changing language/theme or opening a photo does not acknowledge arrival or start GPS.

Desktop map uses the full area below a 64 px header beside a 320 px column. Mobile uses a 56 px header and resizable compact/standard/expanded sheet in separate grid rows; popup controls do not consume map height. Existing camera snapshots and ResizeObserver behavior remain in use.

## Photographs and data boundaries

The licensed catalog in `stop-photos.js` is explicitly assigned to bundled `routes.json` galleries: 11 Main visits and 9 shared Full places. Sources, versions, dimensions, photographer, alt/caption and license links are recorded per image in `MAIN-WALK-PHOTO-SOURCES-20261009.json`. Ten images identify their named stop. Vino Vero uses a labeled nearby-surroundings photo, not a verified facade photograph. The forty book images remain reference-only and unapproved for public reproduction.

These are bundled visitor gallery records, not a production Payload media import. Existing administrator drafts, their empty galleries, publication snapshots, removed photos and rights/revocation safeguards are unchanged. Shared photo and renderer files are copied to the admin application; a private draft renders its own gallery records. Do not silently fill a saved empty gallery from this catalog. Future Payload publication requires an explicit media upload/metadata/route-save workflow with preserved source/license/context fields; do not bypass canonical media validation.

## Illustrations

See `MAIN-WALK-ILLUSTRATIONS-20261009.json` for subject-by-subject technical comparison. Five replacements use content-addressed map and detail derivatives; six existing Main illustrations are retained. These are labeled AI illustrations, not photographs or surveyed architecture. Pixel ground points are separate from route coordinates; an unset architectural anchor stays unset. The placement engine limits decoration to six desktop / three mobile and gives priority to the active stop, route and controls.

## Release and rollback

Visitor/admin imports use `20261009-main`. Run `node tools/sync-field-guide.mjs <admin-checkout> --check` after both code and art updates. Validate CI and publish the compatible admin renderer first, then the public entry. Do not accept unrelated staged Railway configuration changes. No production schema migration or route publication is part of this change.

Code-only rollback can restore the preceding application revisions without deleting gallery files, route data or walking progress. Keep newly added hashed assets available during any cache transition. Current test logs, deployment IDs and live browser acceptance are recorded separately in the delivery report, not inferred from this implementation note.
