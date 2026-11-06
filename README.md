# Venice Sideways

A multilingual photographic walking guide for [venicesideways.com](https://venicesideways.com/).
The public experience focuses on Main Walk; saved route data and private Full Walk previews remain available to the separate administration application.

## Stack

Static HTML, CSS and JavaScript with MapLibre and a dependency-free Node.js server.
The server serves approved public files and relays fixed public route, event and optional anonymous-statistics APIs.

## Run and check

Use Node.js 22 or newer; no runtime npm installation is needed.

```sh
npm start
# http://localhost:3000
npm test && npm run check
```

## Product boundaries

Keep route identities, five ideas per stop, eight languages and the light map intact.
Location is off until requested; raw device coordinates stay in the browser. Denying permission does not block the guide.
Photographs retain their source and licensing information; an empty or revoked administrator gallery stays empty.

## Hosting

Railway builds the supplied Docker service from `main`, with platform-provided `PORT` and `/healthz` health checks.
Static-only hosting cannot provide the API routes. Validate compatible admin changes before a separately approved visitor release.
Deploying code does not publish route content or open an event.

[Documentation](docs/README.md) · [Release procedure](docs/MIGRATION.md) · [Historical records](docs/history/README.md)

The owner's photographs and text are not licensed for reuse. Third-party notices remain with their assets.
