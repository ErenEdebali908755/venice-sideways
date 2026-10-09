# Shared renderer maintenance proposal

**Status: analysis only.** This document does not install an Action, change code, synchronize files, add a package/submodule, open automated pull requests or change Railway. The proposal favors low maintenance for one owner.

## Current ownership and serving path

`venice-sideways/public/field-guide/` is the source of truth for the shared renderer. The visitor repository's `tools/sync-field-guide.mjs` takes an explicit admin checkout path. In copy mode it writes selected files into the admin's `public/field-guide/`; in `--check` mode it compares bytes and rejects missing or changed expected files. It also compares the complete artwork directory listing.

The current source inventory contains **156 shared files, totaling 30,402,336 bytes**:

| Group | Files | Inclusion rule |
| --- | ---: | --- |
| Runtime, presentation, brand, fonts and licenses | 28 | Explicit `names` list |
| Artwork and manifests | 117 | Direct entries in `art/`, validated filenames |
| Stop photographs | 11 | Recursive `photos/` entries, approved image extensions |

The earlier working copy had a smaller shared set. Future checks must derive the list from the selected source revision, not hard-code this document's count.

The explicit files are `presentation.js`, `stop-photos.js`, `walking-state.js`, `timetable-policy.js`, `guide.js`, `guide.css`, `map-art.js`, `illustrations.js`, `directions.js`, `gardens.json`, `yana-mark.svg`, `yana-logo.svg`, `yana-mark-light.svg`, `yana-mark-dark.svg`, `icons.js`, `icons.svg`, `gallery.js`, `location-engine.js`, `ui-copy.js`, `temporary-selection.js`, `serif.woff2`, `sans.woff2`, `serif-latin-ext.woff2`, `serif-cyrillic.woff2`, `sans-latin-ext.woff2`, `sans-cyrillic.woff2`, `Cormorant-LICENSE.txt` and `Manrope-LICENSE.txt`.

The list intentionally does **not** copy the visitor entrypoint, route catalog, measurement collector, private preview shell or MapLibre distribution. `entry.js`, `routes.json`, `measurement.js`, `preview.js`, `maplibre.js`, `maplibre.css` and `MapLibre-LICENSE.txt` need their own ownership rules; matching a directory name is not permission to overwrite them.

On the admin side, `SidewaysPreview.tsx` embeds `/sideways-preview.html`. Its separate `public/field-guide/preview.js` receives draft data from the same-origin parent using `postMessage`, then constructs the shared `FieldGuide` with `preview: true`. The shared assets are served from the admin's own static `public/` tree. Drafts are kept in memory; the preview shell must not import the public measurement collector or start GPS. The admin's separate `water.json` also remains outside this sync list.

## Gaps in the existing check

- Neither repository currently has a cross-repository `sync-field-guide.mjs ... --check` CI gate.
- The check rejects extra/missing `art/` files but does not reject stale extra `photos/` files in the target.
- The proof digest follows directory enumeration order; sort the inventory before treating it as a portable revision fingerprint.
- Copy mode can leave partial changes before the final stale-art check fails. A future automation should prepare its change in a disposable worktree and open a reviewable PR, never modify an active deployment checkout.
- Equality covers the selected shared files, not iframe messaging, private access, language behavior, static URL versions or a live release. Those remain distinct acceptance checks.

## Options

| Option | Setup effort | One-person maintenance | Railway compatibility | Rollback |
| --- | --- | --- | --- | --- |
| Git submodule | Medium to high: isolate the renderer into a suitable repository/subdirectory and update checkout/build paths | Track both repository revisions and submodule pointers; extra checkout and asset-path failure cases | Checkout and Docker copy paths must resolve the pinned submodule before building; private submodules need build access | Revert the pointer and rebuild with the matching parent source |
| Private npm package | High: define exports/assets, package releases, registry access and installation/copy steps | Maintain versions, package provenance, credentials and dependency updates across both products | Private package installation needs authorized registry access; the current dependency-free visitor workflow changes | Restore the package version and corresponding lockfile/assets, then rebuild |
| Existing sync with CI and an admin PR Action | Low to medium: retain current static files and add an explicit source revision plus checks | Review an ordinary file diff; one update PR can contain modules, artwork and licenses together | Committed generated files continue through the existing Docker builds; Railway needs no new cross-repository checkout or registry secret | Revert an ordinary source PR while retaining compatible runtime/data contracts |

## Recommendation

**Keep the sync tool and add CI plus a narrowly scoped admin update PR.** It reuses the working static serving model and avoids operating a package registry or submodule lifecycle. The copies remain generated artifacts with a known source; CI makes drift visible.

The admin should record an immutable visitor source revision for its copied renderer. Its CI checks against that revision, not whichever visitor `main` happens to exist when CI starts. Otherwise a later visitor change could break an unrelated admin PR without any admin file changing.

The future update Action belongs in the private admin repository. It can read the public visitor source and propose only the permitted renderer paths. It needs only the access required to create a branch and PR in its own repository; repository settings and token permissions must be reviewed at implementation time. Do not place an admin repository credential in the public visitor repository. No automatic merge, provider configuration or deployment step is proposed.

## Release order still matters

Both repositories publish from `main`. A bot that notices a visitor change only after it has merged cannot guarantee admin-first compatibility: the visitor may already be deploying. The updater therefore needs a manual candidate-revision input as well as any later scheduled drift check. For a coordinated renderer change, prepare the admin PR from the visitor's reviewed candidate revision and follow the existing compatible-admin-first release procedure before merging the visitor change. A periodic check may open a follow-up PR; it must not claim that the release order was satisfied.

## Future implementation split into reviewable PRs

1. **Visitor: document and tighten the sync contract.** Add a sorted manifest of shared paths and explicit exclusions; check stale photograph files as well as artwork; preserve module, image, font and license bytes. Verify copy/check behavior against disposable directories. Do not refactor the renderer or route data in this PR.
2. **Admin: add a pinned-source equality gate.** Record the chosen visitor revision, check out that public revision in CI, run its sync tool with `--check`, and run the existing admin validation. Cover the private preview entrypoint/version contract separately. Keep Railway's build inputs unchanged.
3. **Admin: add the update PR Action.** Accept an explicit source revision, reuse one update branch/PR rather than creating duplicates, restrict the diff to shared paths and the source record, and fail on unexpected files. A scheduled drift check is optional. A human still decides whether and when to merge.
4. **Paired verification before first use.** Exercise a normal update, a missing/changed file and a revert; verify that private preview/visitor entrypoints and the public route catalog are excluded. Demonstrate the candidate-revision workflow without merging or deploying automatically.

These are proposals for future code PRs. This documentation branch does not implement them, acquire credentials, change GitHub permissions or establish live-site behavior.
