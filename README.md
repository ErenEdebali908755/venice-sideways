# Venice Sideways

Independent multilingual photographic walks for [venicesideways.com](https://venicesideways.com/).

## The guide

Main Walk has 11 photographic stops and a separate vaporetto step; Full Walk has 28 photographic stops. Each stop has five ideas. English, Turkish, Italian, French, Russian, Chinese, Japanese and Korean are supported. The page follows system light/dark preferences while the geographically accurate map remains light.

Curated, published stop galleries take priority. A deliberately empty or removed gallery stays empty. The owner-authorized temporary monochrome selection is labeled as a visual reference: its photos are not verified depictions of those Venice stops. Approved AI illustrations are labeled as illustrations, not photographs. Map data and artwork sources are documented in [map provenance](docs/watercolor-map-sources.md).

## Run and check

Node.js 22 or newer. The server uses a pinned, licensed private phone-number validation bundle; no runtime package installation is required.

```sh
npm start
npm test
npm run check
```

The server serves only the public application and narrowly projected route, event and optional anonymous-statistics APIs. It does not serve repository documentation, private libraries or audit artifacts. A static-only host does not implement these API routes. The healthcheck is `/healthz`; the platform supplies `PORT`.

## Privacy and optional services

Location starts off. Allowing location shows a marker without moving the map camera. Explicit follow or recenter can make the map provider receive requests for the displayed area. Raw device coordinates are not posted to the organiser or analytics. Denial leaves the guide usable; hiding or stopping the map clears tracking and late callbacks cannot restart it.

Anonymous counts are off until opted in. DNT/GPC prevents them; withdrawal stops pending work. An ephemeral server-issued admission capability is required. Measurement fails closed when the server-only admission configuration is absent. It counts views and opened walks using bounded dimensions; it does not identify people or prove that a visitor is human. No secrets are embedded in the browser.

Event availability comes from the public event API. Code deployment does not publish a route or open registration. Translation generation is shown as unavailable until its separate service is genuinely configured.

## Hosting and release

The supplied Node/Docker service supports the public domain. Validate the compatible administration service first, then the visitor build and live checks. [Release procedure](docs/MIGRATION.md) describes the gates without private operational records. Detailed deployment, backup, account and audit evidence belongs in the separate private operator record.

The owner’s photography and text are not licensed for reuse by this repository. Third-party asset notices and integrity manifests remain with the corresponding assets. Some older tracked reports and prior Git revisions still contain historical operational metadata; the runtime does not serve them, and removing history requires a separate authorised operation.
