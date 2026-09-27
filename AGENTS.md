# Venice Sideways maintenance rules

- Standalone static browser application; Node server is a deployment option, not a data backend.
- Do not embed personal gallery data, database credentials or upstream Git history. User-authorized Sideways aggregate statistics and explicit location sharing use fixed server endpoints only.
- Canonical domain: https://venicesideways.com/. Server-side calls to the owned Sideways API are authorized; do not forward browser credentials or expose private archive data.
- Preserve all route IDs/order, five prompts per stop, eight locales, transit split and light basemap when changing presentation.
- Own-device location remains separate and opt-in. Explicit, off-by-default admin location sharing is user-authorized: stop when hidden, max 15 minutes, latest position only, 90-second expiry, no coordinate history, URL/query storage or console logging. Denial must not block browsing.
- Validate start/stop/race/visibility, language changes and phone layout before deploying.
- Do not redirect the old site until custom-domain HTTPS and smoke tests pass. Do not claim DNS, deployment or repository creation without successful evidence.
