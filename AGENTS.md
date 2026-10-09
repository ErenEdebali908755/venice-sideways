# Venice Sideways maintenance rules

- Standalone static browser application; Node server is a deployment option, not a data backend.
- Do not embed personal gallery data, database credentials or upstream Git history. User-authorized Sideways aggregate statistics use a fixed server endpoint only.
- Canonical domain: https://venicesideways.com/. Server-side calls to the owned Sideways API are authorized; do not forward browser credentials or expose private archive data.
- Preserve all route IDs/order, five prompts per stop, eight locales, transit split and light basemap when changing presentation.
- Own-device location remains opt-in and local to the browser. Never send device coordinates to admins or a server. Denial must not block browsing.
- Validate start/stop/race/visibility, language changes and phone layout before deploying.
- Do not redirect the old site until custom-domain HTTPS and smoke tests pass. Do not claim DNS, deployment or repository creation without successful evidence.

- Public Main-only visibility belongs to the explicit presentation setting. Keep all route records when saving progress; private Full previews and saved Full progress must remain intact.
- Bundled stop photos have explicit gallery relations and source/license metadata. Never fill administrator-empty or revoked galleries automatically from a static catalog.
