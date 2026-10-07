# Release and rollback procedure

Code deployment, editorial route publication and event registration opening are separate actions.

## Release gates

1. Review the compatible administration/API changes and fresh tests, type checks and complete production build.
2. Verify a current production backup and a tested restore path. Apply schema changes only through the registered migration mechanism after a disposable test; never use automatic production schema synchronisation.
3. Verify the shared visitor/private-preview renderer and public assets have identical bytes. Publish the compatible backend before the visitor service.
4. Check fresh Main/Full opens, route lines, active stop, vaporetto, galleries, mobile layout, eight languages, light basemap, system/manual theme, location denial and keyboard controls.
5. Check administration access boundaries separately from anonymous visitor checks. Keep physical-device acceptance separate from simulated browser tests.
6. Stop on a failed gate. Preserve the failure evidence and do not label deployment success as live acceptance.

## Optional service configuration

Measurement requires a server-only admission secret shared by the compatible services. Missing configuration disables counting. Translation generation stays honestly unavailable without genuine provider credentials and a verified glossary. Neither configuration belongs in a client bundle or public evidence.

## Rollback

Use a compatible release that understands Italian, `sourceLanguage`, public gallery rights/revocations and the current story schema. Do not blindly restore an older seven-language binary or erase newer fields. Schema rollback and destructive restores need a separately reviewed recovery procedure; object storage is not included in a database-only backup.

Detailed backup, migration and deployment identifiers are maintained in the private operator record. Existing dated reports are historical evidence; they are not fresh acceptance of subsequent code. Their presence in public Git history remains a separately recorded limitation.
