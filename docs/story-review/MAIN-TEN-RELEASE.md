# Main Walk — ten-stop evening release, 10 October 2026

## Scope and authority

Eren explicitly authorized a new visitor PR/merge/deployment for the 11 October walk and delegated approval of the ten remaining Main stop stories tonight. Deadline 23:00 Europe/Rome. No old PR was merged. Production interactions are GET-only; no database access, settings changes, registrations or migration.

Baseline visitor main: `d1ca80540380f0bc0b03acc0f1f55ceddb628d29`; admin main: `199a51f979c4ad463d3158408558c31b41e4af44`. Clean new worktrees preserve older dirty working copies.

## Data path

`public/field-guide/entry.js` loads packaged `routes.json`, then consults `/api/route-catalog`. Main was `published:false` in the live GET, so the bundled Main is retained. Existing `guide.js` `storyFor()` already renders reviewed `visit.story`; no PR #21/#24/#31/#35 dependency. Renderer synchronization does not publish route/story data.

Ten TR/EN stories are projected with the existing admin `publicStory()` function. The existing `review.status=reviewed` and `copy[].needsReview=false` gates apply. The private reviewer identity, notes and source digest stay in the admin proposal file, not in public JSON. There were no other existing language versions of these short stories: the source research is TR and the short-v2 review has TR/EN. Other six interface locales use the existing explicit English fallback; this is not a claim that six new translations were approved.

## Changes

- Main removes `vino`; Tre Archi is stop 10 and the finish. Full route, including all 28 stops, is identical after JSON serialization.
- Final Main walking path is the existing first 25 vertices ending `[12.320735,45.445573]`; no invented shortcut or moved stop. The remaining recorded walking length is approximately 4.602 km instead of 5.722 km. Eight UI strings now say about 4.6 km; duration remains a conservative, explicitly unverified estimate.
- Route and Tre Archi descriptions updated in all eight locales; inactive Vino illustration placement removed from Main. Original artwork/photo files retained.
- Previously saved Main `vino` target maps to Tre Archi; if Tre Archi was completed, walk remains complete. Full progress remains independent.
- Sources and approval changes are in the appended `STORY-REVIEW-TR.md` section. All earlier sections are preserved. Barnaba: Istrian stone, no unsupported prohibition year. Tre Archi: rebuilt in 1688. San Trovaso: the source-supported Cadore craftspeople connection is retained without a blanket timber-origin claim.
- Browser cache keys updated along changed module/data import paths.

## Local evidence

- `npm test`: 98 passed; includes full-route baseline hash, all eight route summaries, ten bilingual stories, two boat legs and retired-target recovery.
- `npm run check`: 45 browser JS files passed.
- `git diff --check`: passed in both worktrees.
- Shared renderer: 156 matching files, SHA-256 `99232542517d53a14d3b9a5ec3d9b523526e427e9f07b2f37942729bd7332945`.
- GET-only real-map local acceptance: WebKit 390/TR and Chromium 412/EN, 88 checks each, zero page errors, all stories and complete walk, refresh and old-Vino recovery. First local WebKit run exposed navigation-aborted resource errors in the test; waiting for network idle before navigation fixed the test without changing application behavior.
- Admin proposal and existing story tests: 11 passed. Admin production build is not a release claim: admin is deliberately left as an unmerged PR because public delivery does not depend on it.
- Existing 32 language/width browser matrix and CI/deployment/live results are recorded separately after completion.

## Rollback and remaining operations

If deployment/live acceptance fails or is not complete by 23:00 Europe/Rome, open a new GitHub Revert PR for this evening's merge, merge it, verify the rollback deployment and live behavior, and stop. Do not merge old PRs or change Railway settings. No schema/data writes need reversal.

Eren still opens the event in admin. GPS emergency PR #25 remains subject to its earlier emergency condition. Real-device GPS and Barnaba footprint field photograph remain physical checks. The pre-existing transit-marker overlap remains outside this narrowly authorized patch; primary walking controls are checked for usability.
