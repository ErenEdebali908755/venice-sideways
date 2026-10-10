# 10 October, second evening release

## Scope and authority

Eren explicitly authorized a new visitor PR, passing checks, merge and Railway automatic deployment before 23:30 Europe/Rome. Old PRs, production database access, migrations, Railway setting changes and production writes remain excluded. Live verification is GET-only. A failed post-merge acceptance requires a Revert PR and rollback verification.

- Remove the archive-reference inspiration section, opener, history mode and lightbox path. Public entry no longer loads the archive sample collection. Defense at `galleryImage` and route-photo conversion prevents a `referenceOnly` asset from being rendered even if supplied by a future payload. Verified stop photo registry, image files, credits and gallery behavior are unchanged.
- Move the illustration disclosure to a localized image alt. Remove the old visible AI caption and unused UI keys.
- Give the existing five ideas a native keyboard-operable disclosure with camera, arrow, border, localized explanation and at least 44px touch target. All 50 ideas and their order remain byte-equivalent after serialization.
- Add IT/FR/RU/ZH/JA/KO translations of ten approved TR/EN stories, translate Italian stop/transfer gaps and the five map descriptions, and localize the existing photo-derivative notice. No external translation service. Translation delegation is recorded in `STORY-REVIEW-TR.md`.
- No visible English-fallback note. The fallback implementation still tolerates missing future data without breaking the walk. Current Main copy, stories, ideas, captions and map notes have all eight languages; proper place names, source titles, artist names and license identifiers remain original.
- Public Main still has ten stops ending at Tre Archi; all geometry, coordinates, walking-state transitions and Full Walk data remain unchanged. The non-public Full editorial payload is outside this Main-focused release.
- Cache version `20261010-evening-eight` covers changed entry/renderer/style/imports and route JSON. No service worker exists in this application. No-JavaScript route summary is corrected to ten stops and supplied in all eight languages.

## Local verification

`npm test`: 102 passing. `npm run check`: 45 browser JavaScript files. Both locale/route integrity and absence of reference UI have new regression tests. `git diff --check` clean.

`tests/main-ten-browser.mjs`: WebKit 390px/TR and Chromium 412px/EN; 176 passing checks, zero JavaScript errors, actual vector tiles. Includes ten stops, two boat legs, completion, refresh, old Vino recovery and independent Full progress.

`tests/evening-browser.mjs`: eight locales, 216 passing checks, zero JavaScript errors. Light/dark first-stop screenshots; no reference requests, no visible AI/fallback label, localized alt, five unchanged ideas, keyboard open/close and 44px targets. Measured title/help/border contrast: light 15.91/5.92/6.38; dark 13.97/8.29/7.28.

Existing four-width UI and map regression suites remain CI gates. Admin mirror is a draft PR only: 156 shared files match; eleven focused story/model tests pass. No admin full build or deployment is claimed or needed to serve bundled visitor stories.

## Deployment evidence

Final tested commit, GitHub workflow, deployment identity, fresh live tests and screenshot paths are recorded in the PR and delivery report after deployment. Local screenshots/tests above do not establish a live release.
