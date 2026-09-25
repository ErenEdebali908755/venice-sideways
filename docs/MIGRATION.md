# Venice Sideways migration

Source: the reviewed walk-only package prepared from eren-visual-archive commit `afce9d31fa8f306e39aa03984fa8097a0f32970b`. Existing public scripts/styles were imported only after SHA-256 validation. The HTML, own-device location module and static server come from the separately tested standalone package.

The owner created `ErenEdebali908755/venice-sideways` as a public repository. Its initial README commit was retained; no private-gallery history was imported.

## Cutover checklist

1. Verify Node HTTP tests, script syntax, seven locales, 15/28 routes, five prompts, light map/dark page and local-only geolocation.
2. Deploy a separate service from this repository without inheriting gallery variables or adding a database.
3. Add the custom domain and configure its exact CNAME and TXT records at the DNS provider. Verify HTTPS before declaring the domain live.
4. Until verification succeeds, preserve the old personal site and map URLs.
5. After HTTPS works, redirect only the old walk paths to `https://venicesideways.com/`, preserving route/date/language fragments. The homepage, gallery, journal and admin must remain on erenedebali.com.
6. Remove old walk code only after cutover verification and a rollback reference. Domain migration does not grant permission to delete personal media or records.

There is no organiser location sharing. Device coordinates are not migration data. Browser theme/language preferences and permissions are origin-specific.
