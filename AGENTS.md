# Venice Sideways maintenance rules

- Standalone static browser application; Node server is a deployment option, not a data backend.
- Do not add the personal gallery, CMS, analytics, database credentials or upstream Git history.
- Canonical domain: https://venicesideways.com/. The only erenedebali.com reference in runtime should be an explicit outbound archive link.
- Preserve all route IDs/order, five prompts per stop, seven locales, transit split and light basemap when changing presentation.
- Own-device location must be opt-in. No organiser tracking, location upload, URL/query storage, persistent coordinate history or console logging. Denial must not block browsing.
- Validate start/stop/race/visibility, language changes and phone layout before deploying.
- Do not redirect the old site until custom-domain HTTPS and smoke tests pass. Do not claim DNS, deployment or repository creation without successful evidence.
