# Venice Sideways

Independent multilingual photography walks for **https://venicesideways.com/**.

This repository contains only the walk guide. It has no dependency on the personal gallery deployment, Payload CMS, Neon database, Resend, application secrets or the source repository's private Git history. The link to Eren's archive is an ordinary outbound link.

## Run and test

Node.js 22 or newer; no runtime npm packages:

```sh
npm start
# http://localhost:3000
npm test
npm run check
```

Browser checks: `pip install playwright==1.55.0 beautifulsoup4==4.13.4`, `python -m playwright install chromium`, then `python tests/browser.py`.

## Hosting

`public/` can run on a static host with the supplied `_headers` and `_redirects`. The dependency-free Node/Docker server provides equivalent headers on Railway. Healthcheck: `/healthz`; port: platform-provided `PORT`. No database or gallery environment variables are needed.

Deploy this repository's main branch independently from the personal site. Railway compute/bandwidth is usage-based; this is not a promise of free hosting. The map does not use a paid Google Maps API.

Attach `venicesideways.com` and use the exact DNS records returned by the host. Do not change the old gallery's DNS records. Domain verification, certificate issuance and cutover are separate steps; repository creation does not mean custom-domain HTTPS is ready.

## Own location only

Location starts **off**. A visitor clicks the location control, then Show my location, and grants the browser permission. The blue point and accuracy circle are local to that page. Dragging stops automatic centring; Centre on me resumes it. Stop clears the watcher and point. Hidden pages suspend updates.

Coordinates are not posted, logged, saved, placed in URLs or shared with Eren or other visitors. There is no organiser dashboard or location endpoint. Normal map-tile requests can reveal the area displayed to the map provider; browser/OS services may perform their own lookups. HTTPS and user permission are required. Background/lock-screen tracking is not guaranteed.

## Preserved features

- The source's current 15-stop main walk (Punta della Dogana, a waterbus transfer, Cannaregio finish) and full 28-stop walk.
- Five phone-friendly ideas for each place; seven languages with automatic and manual selection.
- Dark page controls with a permanently light basemap.
- Separate walking and waterbus navigation; all stops retained across exported links.
- OpenFreeMap / OpenStreetMap / MapLibre.

## Migration safety

Keep erenedebali.com unchanged until the new domain passes HTTPS, language, route and location checks. Only then redirect former walk URLs; do not redirect the personal homepage, gallery or admin. Preferences and location permissions belong to each origin and do not silently migrate.

The repository was created **public** by its owner. No new open-source licence is granted to the owner's photography or text. Third-party notices remain in source. No personal media library, credentials or private-gallery history is included.
