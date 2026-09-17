# Little Adventures — Cloudinary Asset Migration + Render Deployment Runbook

## Purpose

This runbook is intended to be passed directly to an implementation agent (for example, an Antigravity coding agent).

The agent should take the Little Adventures project from the current cleaned/local state to:

1. A clean Cloudinary production asset set.
2. A verified application that resolves all production assets from Cloudinary.
3. A production deployment on Render Static Site.
4. A verified public application with no broken assets, stale local-asset references, or accidental credential exposure.
5. A documented rollback path.
6. A maintainable release/versioning process for future asset migrations.

The agent should perform the work end-to-end rather than merely describing commands.

---

# 0. Current known state

## Application

The current cleaned project is the Little Adventures toddler-game application.

Known project work already completed:

- Legacy `games/language-adventure/` was removed.
- Legacy `public/games/language-adventures/` mirror was removed.
- Unused legacy Language Adventure assets were removed.
- `Baba's Big Jump` page PNGs were optimized to WebP.
- Current Language Adventure image assets were optimized to WebP.
- Asset references were migrated toward a runtime resolver.
- `services/AssetService.js` exists and provides local-development fallback plus external asset URLs.
- `.env.example` supports:
  - `VITE_ASSET_BASE_URL`
  - `VITE_CLOUDINARY_CLOUD_NAME`
- Existing tests currently pass: **24/24**.
- The local environment previously could not run the Vite build because `vite` was unavailable in that execution environment; this was an environment limitation, not a known application test failure.

## Cloudinary

Cloudinary cloud name:

```text
orxjbhtb
```

The Cloudinary CLI (`cld`) is already authenticated through OAuth on the developer machine.

Do NOT request, copy, commit, or expose the Cloudinary API secret.

Current intended production public-ID namespace:

```text
little-adventures/release-2/
```

A previous upload exists under:

```text
little-adventures/release-1/
```

That previous release is known to have the wrong public-ID structure for the current application resolver and must not be treated as the production asset set.

The previous upload contained approximately **185 successfully uploaded resources** and **1 skipped resource**:

```text
games/language-adventures/new/targets.svg
```

The skipped file was reported by Cloudinary as:

```text
Zero-sized SVG is invalid
```

The agent must inspect this file before the final upload and determine whether it is:

- referenced by the application and therefore needs to be restored/replaced, or
- unused and safe to remove from the asset package.

Do not silently ignore a skipped file.

## Important Cloudinary folder-mode detail

The Cloudinary environment uses Dynamic Folder behavior.

In Dynamic Folder mode:

- `-f` / `folder` controls the Cloudinary asset folder.
- It does not necessarily make that folder path part of the public ID.
- `public_id_prefix` can add a public-ID path.
- `use_asset_folder_as_public_id_prefix=true` is the desired approach here because it makes the uploaded asset's initial asset-folder path match its public-ID path.

Therefore, do **not** repeat the earlier upload command that used only:

```powershell
cld upload_dir . `
  -f little-adventures/release-1 `
  -e `
  -o use_filename true `
  -o unique_filename false `
  -w 5
```

That produced public IDs such as:

```text
teddy-mascot
```

instead of the desired:

```text
little-adventures/release-2/shared/art/characters/teddy-mascot
```

---

# 1. Agent operating rules

The agent must follow these rules throughout the migration.

## 1.1 Never expose secrets

Never:

- put Cloudinary API secrets in source code;
- put Cloudinary API secrets in `.env` files that are committed;
- put Cloudinary API secrets in `VITE_*` variables;
- put Cloudinary API secrets in browser JavaScript;
- paste secrets into deployment configuration visible to the client.

The following are safe to use in frontend code:

```text
VITE_ASSET_BASE_URL=https://res.cloudinary.com/orxjbhtb
VITE_CLOUDINARY_CLOUD_NAME=orxjbhtb
```

## 1.2 Do not delete the old Cloudinary release early

Do not delete `release-1` until:

- `release-2` upload is verified;
- the application is verified locally against Cloudinary;
- the Render deployment is successful;
- production smoke tests pass.

`release-1` is the temporary rollback safety net.

## 1.3 Do not weaken tests

Preserve and run the existing test suite.

If a test fails because the asset namespace changed, update the test to validate the correct architecture. Do not simply remove the test.

## 1.4 No silent skipped assets

At the end of upload, expected result is:

```text
all required assets uploaded
0 required assets skipped
```

If any required asset is skipped:

1. identify it;
2. find references to it;
3. repair/replace the source file when appropriate;
4. rerun the upload;
5. rerun verification.

---

# 2. Phase A — Preflight and repository audit

Before modifying anything, inspect the repository.

## 2.1 Identify project root

Determine:

- repository root;
- `package.json`;
- lockfile (`package-lock.json`, `npm-shrinkwrap.json`, etc.);
- Vite configuration;
- PWA configuration;
- current `services/AssetService.js`;
- current `.env.example`;
- all deployment configuration files;
- all asset manifests/data files;
- all game entrypoints.

Do not assume filenames if the repository has changed.

## 2.2 Verify the current asset package

Expected local asset package:

```text
E:\Ahmed\Code\baby_games\r2-assets
```

If this path is different on the agent machine, locate the equivalent `r2-assets` directory.

Produce an inventory containing at least:

- relative path;
- extension;
- byte size;
- MIME/resource type;
- SHA-256.

Save the inventory locally, for example:

```text
asset-migration-manifest-release-2.json
```

The manifest should be usable later to compare local files with Cloudinary.

## 2.3 Check for the zero-byte SVG

Locate:

```text
games/language-adventures/new/targets.svg
```

Check:

- size in bytes;
- whether any JS/JSON/CSS/HTML references it;
- whether it is dynamically referenced;
- whether it is actually needed at runtime.

Decision:

### If unused

Remove it from the Cloudinary upload source package and document:

```text
Removed zero-byte unused asset: games/language-adventures/new/targets.svg
```

### If required

Restore/recreate the valid SVG source and verify it renders correctly before uploading.

Never upload a zero-byte replacement merely to satisfy the upload count.

---

# 3. Phase B — Cloudinary release-2 upload

## 3.1 Confirm CLI authentication

Run:

```powershell
cld config
```

Confirm the active configuration is authenticated for:

```text
orxjbhtb
```

If authentication is missing, use the existing OAuth login flow. Do not ask the user to provide API secrets.

## 3.2 Upload with the correct public-ID structure

From the root of the Cloudinary asset package:

```powershell
cd E:\Ahmed\Code\baby_games\r2-assets
```

Run:

```powershell
cld upload_dir . `
  -f little-adventures/release-2 `
  -e `
  -o use_filename true `
  -o unique_filename false `
  -o overwrite true `
  -o use_asset_folder_as_public_id_prefix true `
  -w 5
```

### Required reasoning

The combination is deliberate:

```text
-e
```

prevents the local parent directory name (`r2-assets`) from becoming an extra Cloudinary folder segment.

```text
-f little-adventures/release-2
```

puts the upload under the intended Cloudinary asset folder.

```text
use_asset_folder_as_public_id_prefix=true
```

makes the initial asset-folder structure part of the public ID.

Thus:

```text
shared/art/characters/teddy-mascot.svg
```

should result in a public ID equivalent to:

```text
little-adventures/release-2/shared/art/characters/teddy-mascot
```

and a delivery URL equivalent to:

```text
https://res.cloudinary.com/orxjbhtb/image/upload/little-adventures/release-2/shared/art/characters/teddy-mascot.svg
```

## 3.3 Do not proceed based only on the upload count

The agent must inspect actual Cloudinary upload results.

Do not accept:

```text
185 resources uploaded
```

as sufficient.

A correct upload must also have the correct public-ID path structure.

---

# 4. Phase C — Cloudinary structural verification

Verification should happen automatically where possible.

## 4.1 Verify representative asset classes

At minimum verify:

### Shared SVG

```text
https://res.cloudinary.com/orxjbhtb/image/upload/little-adventures/release-2/shared/art/characters/teddy-mascot.svg
```

### Shared background

```text
https://res.cloudinary.com/orxjbhtb/image/upload/little-adventures/release-2/shared/art/backgrounds/nest-garden.svg
```

### Comic WebP

Use the actual uploaded filename from the manifest, for example:

```text
https://res.cloudinary.com/orxjbhtb/image/upload/little-adventures/release-2/games/comic-stories/assets/babas-big-jump/page-1.webp
```

If the actual filename differs, generate the URL from the manifest rather than hard-coding it.

### Language Adventure video

```text
https://res.cloudinary.com/orxjbhtb/video/upload/little-adventures/release-2/games/language-adventures/video/home-tidy-room.mp4
```

### Raw JSON

For any JSON asset such as the alphabet or strawberry manifest, verify it using the `raw` delivery type.

Example:

```text
https://res.cloudinary.com/orxjbhtb/raw/upload/little-adventures/release-2/games/alphabet-learner/manifest.json
```

## 4.2 Programmatic status checks

Implement or use a verification script that:

1. reads the local asset manifest;
2. maps each file to its expected Cloudinary delivery URL;
3. performs an HTTP request against the URL;
4. records status code;
5. records content type;
6. records content length when available;
7. identifies failures.

Images, video/audio, and JSON must be validated according to their Cloudinary resource types.

Expected result:

```text
0 broken asset URLs
0 unexpected 404s
0 missing required resources
```

## 4.3 Detect duplicate/bad public IDs

Search Cloudinary for assets with:

```text
little-adventures/release-1/
```

and for any accidental paths containing:

```text
r2-assets/
```

Also detect public IDs like:

```text
teddy-mascot
background.svg
manifest.json
```

when they are supposed to be under the full `little-adventures/release-2/...` namespace.

Do not delete these yet. Record them for cleanup after production verification.

---

# 5. Phase D — Update the application to release-2

## 5.1 AssetService

Inspect:

```text
services/AssetService.js
```

Change the production namespace from:

```text
little-adventures/release-1
```

to:

```text
little-adventures/release-2
```

The resolver must continue to support local development.

Desired local behavior:

```text
VITE_ASSET_BASE_URL=
```

means:

```text
load from local repository assets
```

Desired production behavior:

```text
VITE_ASSET_BASE_URL=https://res.cloudinary.com/orxjbhtb
```

means:

```text
load from Cloudinary
```

## 5.2 Resource-type handling

Verify that the resolver keeps the correct Cloudinary resource type:

| Extension / Asset | Cloudinary type |
|---|---|
| PNG/JPG/WebP/SVG | `image` |
| MP4/WebM/MOV/M4V | `video` |
| MP3/WAV/OGG/FLAC/M4A | `video` |
| JSON | `raw` |

Verify extension handling carefully:

- image/video public IDs should not depend on retaining the source extension in the public ID;
- raw files such as JSON should retain the extension in the public ID/delivery path where required.

## 5.3 CSS assets

Verify that CSS background images also resolve through the runtime asset mechanism.

Search for:

```text
url(
```

and inspect all background URLs.

No production CSS should contain stale local paths if those assets are intended to live in Cloudinary.

## 5.4 Remove stale R2 migration code

Search the repository for:

```text
R2
r2-assets
Cloudflare
cloudflare
r2-cors
asset-r2-layout
```

Remove obsolete migration artifacts and documentation where they are no longer useful.

Do not remove generic references if they are merely historical notes; clean the code/configuration that could confuse future maintainers.

## 5.5 Update documentation

Update the migration documentation to describe Cloudinary, not R2.

Document:

- cloud name;
- release namespace;
- local-vs-production asset behavior;
- upload command;
- verification process;
- cleanup/rollback process;
- secret handling.

Do not document API secrets.

---

# 6. Phase E — Automated application verification

## 6.1 Existing tests

Run:

```powershell
npm test
```

Acceptance:

```text
24/24 or the repository's current full test suite passes
```

The agent must report the actual current count after the repository is checked.

## 6.2 Install from the lockfile

Prefer:

```powershell
npm ci
```

Do not use an uncontrolled `npm install` for the final verification when a valid lockfile exists.

## 6.3 Production build

Run:

```powershell
npm run build
```

Acceptance:

- build exits successfully;
- `dist/` is generated;
- no unresolved module errors;
- no asset-resolution errors;
- no unexpected giant bundles;
- no missing environment variable errors.

## 6.4 Build-time environment verification

Run a production-like build with:

```env
VITE_ASSET_BASE_URL=https://res.cloudinary.com/orxjbhtb
VITE_CLOUDINARY_CLOUD_NAME=orxjbhtb
```

Do NOT hard-code these values into source files.

## 6.5 Search the built output

After the production build:

Search `dist/` for:

```text
little-adventures/release-1
```

and for unexpected local asset references.

The old release must not appear in the generated application.

Search for known problematic patterns:

```text
r2-assets
games/language-adventure/
public/games/language-adventures/
```

Any remaining occurrence must be investigated.

---

# 7. Phase F — Browser-level Cloudinary verification

Run the built application locally using the Cloudinary environment.

Use a local static server or the project's production preview mechanism.

Open every game.

At minimum verify:

- launcher/home screen;
- ABC learner;
- Comic Stories;
- Fruit Color;
- Fruit Slice;
- Pinch Pop;
- Little Scribbles;
- Shape Pop;
- Star Collector;
- Strawberry Garden;
- Language Adventures;
- Baba's Big Jump.

## 7.1 Network verification

Open browser DevTools → Network.

Filter for:

```text
res.cloudinary.com
```

Acceptance:

- expected images come from Cloudinary;
- expected video/audio assets come from Cloudinary;
- no unexpected 404 requests;
- no unexpected requests to removed local public asset paths.

Also filter for:

```text
404
```

and verify there are no application asset failures.

## 7.2 Console verification

Acceptance:

- no `ReferenceError`;
- no `Cannot access ... before initialization`;
- no failed dynamic import;
- no PWA/service-worker errors that prevent loading;
- no failed JSON loads;
- no media decoding failures.

---

# 8. Phase G — PWA/service-worker cache verification

The project has PWA-related behavior. Do not assume a successful deploy automatically invalidates every client-side cached asset.

The agent must inspect the current PWA setup.

## Required checks

1. Determine how the service worker is generated.
2. Determine its cache/version strategy.
3. Ensure a deployment that changes the asset namespace from `release-1` to `release-2` does not leave clients requesting obsolete local/old resources.
4. Ensure the application version/cache revision changes appropriately.
5. Test:
   - first load;
   - reload;
   - hard refresh;
   - service-worker-controlled reload;
   - a second visit after the cache exists.

If necessary, bump the application/PWA version so existing clients obtain the new asset references.

Do not delete the entire PWA feature just to solve caching.

---

# 9. Phase H — Git repository cleanup before deployment

Inspect Git state.

## 9.1 Working tree

Ensure the repository no longer contains:

- legacy language-adventure implementation;
- legacy public mirror;
- unnecessary giant image sources;
- obsolete R2 configuration;
- build artifacts;
- local secrets;
- Cloudinary CLI credentials.

Run:

```powershell
git status
```

and inspect the diff.

## 9.2 Gitignore

Verify `.gitignore` contains appropriate entries for:

```text
.env
.env.local
dist/
node_modules/
```

and any generated migration manifests that should remain local.

Do not ignore source files that the project actually needs.

## 9.3 Repository size

Check whether the repository history still contains the removed ~160 MB-class asset set.

Removing files from the working tree does not automatically remove them from Git history.

If the remote Git repository is still unnecessarily large:

1. report the issue;
2. create a backup;
3. assess whether history rewriting is acceptable;
4. only then consider a controlled `git filter-repo` migration.

Do not rewrite published history casually.

---

# 10. Phase I — Commit the Cloudinary-ready application

Create a clean commit containing:

- asset resolver changes;
- Cloudinary configuration defaults;
- tests;
- updated documentation;
- cleanup of obsolete R2 code/artifacts;
- removal of obsolete local assets;
- any PWA version/cache changes;
- any required repair of the zero-byte SVG issue.

Suggested commit message:

```text
Migrate Little Adventures assets to Cloudinary
```

Before pushing:

```powershell
npm ci
npm test
npm run build
```

All must pass.

---

# 11. Phase J — Push to GitHub

Push the verified code to the intended production branch, normally:

```text
main
```

Do not upload Cloudinary assets back into Git just because they are no longer local application dependencies.

The repository should contain application source and only the assets intentionally kept in-repo.

---

# 12. Phase K — Create the Render Static Site

The Little Adventures frontend is intended to be a static web application.

Use:

```text
Render → New → Static Site
```

Render supports free Static Sites and serves them through its CDN.

Official Render documentation:

- https://render.com/docs/static-sites
- https://render.com/docs/your-first-deploy

## 12.1 Connect the Git repository

Connect the correct GitHub repository.

Use the production branch:

```text
main
```

## 12.2 Configure the build

Use the repository's actual package scripts after verifying them.

Expected configuration for a Vite application:

```text
Build Command:
npm ci && npm run build
```

Expected:

```text
Publish Directory:
dist
```

Do not blindly use these values if the repository's Vite/build configuration says otherwise; the agent should verify `package.json` and Vite config first.

## 12.3 Environment variables

Set:

```text
VITE_ASSET_BASE_URL=https://res.cloudinary.com/orxjbhtb
VITE_CLOUDINARY_CLOUD_NAME=orxjbhtb
```

Do not add:

```text
CLOUDINARY_API_SECRET
CLOUDINARY_URL
CLOUDINARY_API_KEY
```

to a public frontend deployment unless a separate server-side service actually needs them.

The frontend only needs public delivery information.

## 12.4 Auto deploy

Enable automatic deployment from the production branch.

Render can automatically deploy on pushes/merges to the selected branch.

Preferred long-term setup:

```text
Deploy after CI checks pass
```

if the repository has reliable GitHub Actions checks.

Otherwise use the simpler:

```text
On Commit
```

mode.

Do not enable an auto-deploy policy that waits for checks that do not exist.

---

# 13. Phase L — Render routing / SPA behavior

Determine whether Little Adventures uses browser history routes.

If it does, configure the Render Static Site rewrite:

```text
/*  →  /index.html
```

with rewrite behavior appropriate for a single-page application.

If the application uses only direct static paths and does not require SPA fallback, do not add unnecessary rewrites.

Test direct navigation to:

- `/`
- every application route used by the launcher;
- any deep-link route exposed by the app.

---

# 14. Phase M — First Render deployment

Trigger the initial Render deployment.

Acceptance:

- build starts;
- dependencies install successfully;
- Vite build succeeds;
- `dist/` is published;
- Render serves the application;
- no secret is present in the client build;
- the Render URL loads over HTTPS.

Record:

```text
Render URL:
____________________________
```

---

# 15. Phase N — Production smoke test

Perform smoke testing against the actual Render URL.

## 15.1 Launcher

Verify:

- page loads;
- shared logo/characters/backgrounds load;
- no console errors;
- no missing network assets.

## 15.2 Each game

Open and test the main interaction path for every game.

At minimum:

- ABC learner;
- Comic Stories;
- Fruit Color;
- Fruit Slice;
- Pinch Pop;
- Little Scribbles;
- Shape Pop;
- Star Collector;
- Strawberry Garden;
- Language Adventures;
- Baba's Big Jump.

## 15.3 Cloudinary network validation

In DevTools:

Filter:

```text
res.cloudinary.com
```

Confirm production assets resolve from:

```text
little-adventures/release-2/
```

There should be no production requests that rely on the old:

```text
little-adventures/release-1/
```

namespace.

## 15.4 Broken asset detection

Confirm:

```text
0 × 404 for required game assets
```

Check:

- images;
- SVGs;
- videos;
- audio;
- JSON;
- CSS background assets.

## 15.5 Mobile/PWA smoke test

Test on:

- desktop Chromium/Edge/Chrome;
- Android Chrome;
- a smaller viewport;
- a fresh browser session.

Verify:

- touch input;
- full-screen behavior if applicable;
- responsive layout;
- audio/video behavior;
- installability if PWA installation is intended.

---

# 16. Phase O — Performance verification

Measure the production application after the first successful Render deployment.

Check:

- initial HTML load;
- JS bundle size;
- first meaningful render;
- largest images;
- video startup;
- number of Cloudinary requests;
- cache behavior;
- repeated-load performance.

Look for:

- duplicate asset requests;
- unused game assets fetched on the home page;
- unnecessarily large images;
- unoptimized videos;
- blocking scripts.

Do not reintroduce local copies simply to hide network latency.

The intended architecture is:

```text
Render CDN
   ↓
HTML/CSS/JS application
   ↓
Cloudinary CDN
   ↓
Large game assets / media
```

---

# 17. Phase P — Cloudinary usage and free-tier monitoring

The project is intentionally using the Cloudinary Free plan.

After deployment:

- inspect Cloudinary usage;
- inspect bandwidth;
- inspect storage;
- inspect transformation usage;
- avoid unnecessary runtime transformations if the source assets are already optimized;
- avoid uploading duplicate releases indefinitely.

Keep old releases only as long as they provide an actual rollback benefit.

Once the deployment is stable, delete obsolete releases.

---

# 18. Phase Q — Clean up old Cloudinary assets

Only perform this step after Render production verification has passed.

## 18.1 Confirm release-2

Before deletion:

```text
release-2 verified locally: YES
release-2 verified on Render: YES
all required assets return 200: YES
games smoke-tested: YES
```

Only then continue.

## 18.2 Delete release-1

Delete:

```text
little-adventures/release-1/
```

from Cloudinary.

Because the Cloudinary environment uses Dynamic Folder behavior, delete based on the actual public-ID namespace/resource IDs, not merely the visual folder name.

The safest options are:

### Option A — Cloudinary Media Library

Select the old release and delete its assets.

### Option B — Cloudinary Admin API / CLI

If the authenticated agent has the required management privileges, use the Admin API's delete-by-prefix functionality against:

```text
little-adventures/release-1/
```

with the correct resource types.

Cloudinary documents programmatic deletion through the Admin API's delete-resources-by-prefix functionality.

Do not use a broad `delete_all_resources` operation.

## 18.3 Remove accidental old public IDs

Also remove any known assets created incorrectly by the previous migration, such as public IDs that contain:

```text
r2-assets/
```

provided they are not needed by another application.

## 18.4 Final Cloudinary state

Desired state:

```text
little-adventures/
└── release-2/
    ├── shared/
    └── games/
```

No obsolete `release-1` assets should remain once rollback is no longer required.

---

# 19. Phase R — Final verification after Cloudinary cleanup

After deletion:

1. Open the Render production site again.
2. Run every game's smoke path.
3. Confirm no request still uses `release-1`.
4. Confirm no old `r2-assets` public-ID URL is requested.
5. Confirm no asset suddenly becomes 404.
6. Check browser console.
7. Check network failures.
8. Test a fresh incognito/private browsing session.
9. Test an existing PWA/service-worker-controlled browser session.

The application must continue working after `release-1` has been removed.

---

# 20. Phase S — Optional custom domain

Once the `onrender.com` URL is stable, configure the project's custom domain if desired.

Render provides managed TLS for custom domains.

Do this only after the base Render deployment is stable.

Record:

```text
Production URL:
____________________________

Render URL:
____________________________
```

---

# 21. Phase T — CI/CD hardening

Add or verify GitHub Actions for:

```text
npm ci
npm test
npm run build
```

Recommended pipeline:

```text
Pull Request
    ↓
Install
    ↓
Unit/integration tests
    ↓
Production build
    ↓
Asset reference checks
    ↓
Cloudinary URL smoke verification
    ↓
Merge
    ↓
Render auto-deploy
```

If Render is configured to deploy only after CI checks pass, ensure the GitHub Actions check names/conclusions are actually visible to Render.

---

# 22. Phase U — Add an automated asset verification script

Create a reusable script such as:

```text
scripts/verify-cloudinary-assets.mjs
```

Responsibilities:

1. enumerate required assets from the application's manifests/source;
2. resolve each production Cloudinary URL;
3. verify HTTP availability;
4. classify resource type;
5. report missing assets;
6. report incorrect namespaces;
7. fail with non-zero exit status when required assets are missing.

Suggested package script:

```json
{
  "scripts": {
    "verify:cloudinary-assets": "node scripts/verify-cloudinary-assets.mjs"
  }
}
```

This becomes a regression guard for future releases.

---

# 23. Phase V — Create a release manifest

Create a versioned manifest for each asset release.

Example:

```text
release-2/
  manifest.json
```

The manifest should record:

- release version;
- Cloudinary cloud name;
- public-ID prefix;
- relative source path;
- public ID;
- resource type;
- extension;
- source byte size;
- SHA-256;
- upload verification result;
- timestamp.

Do not store credentials in the manifest.

This makes later asset migrations deterministic and auditable.

---

# 24. Phase W — Future release procedure

For future changes, do not modify a live asset namespace in place unless there is a strong reason.

Preferred approach:

```text
release-3
release-4
release-5
...
```

Process:

```text
prepare new local assets
        ↓
create local manifest
        ↓
upload new Cloudinary release
        ↓
verify every URL
        ↓
point application to new release
        ↓
run tests
        ↓
build
        ↓
deploy Render
        ↓
production smoke test
        ↓
wait until rollback window has passed
        ↓
delete old release
```

This gives the project a simple rollback model.

---

# 25. Rollback procedure

If `release-2` fails before `release-1` is deleted:

1. change `AssetService.js` back to `release-1`;
2. restore the corresponding environment/configuration if changed;
3. build and test;
4. redeploy Render;
5. investigate the release-2 problem;
6. do not delete release-1 until the problem is resolved.

If the project has already deleted `release-1`, use the last known verified release or restore the required assets from the local release manifest/source package.

---

# 26. Definition of Done

The migration is complete only when **all** of the following are true.

## Cloudinary

- [ ] `orxjbhtb` account is authenticated.
- [ ] release-2 exists.
- [ ] required assets use the expected public-ID namespace.
- [ ] no required assets are skipped.
- [ ] zero-byte `targets.svg` issue is resolved.
- [ ] all required URLs return successfully.
- [ ] image/video/audio/JSON resource types are correct.
- [ ] accidental `r2-assets` public IDs are identified and cleaned.
- [ ] release-1 has not been deleted until production verification is complete.
- [ ] release-1 is deleted after successful production verification.

## Application

- [ ] `AssetService.js` uses release-2.
- [ ] local development still works without Cloudinary.
- [ ] production uses Cloudinary.
- [ ] CSS asset references are migrated.
- [ ] no stale release-1 references remain.
- [ ] no stale R2 configuration remains.
- [ ] no client-visible secrets exist.
- [ ] all automated tests pass.
- [ ] production build passes.

## Render

- [ ] correct GitHub repository connected.
- [ ] correct production branch selected.
- [ ] build command verified.
- [ ] publish directory verified as `dist` if this is confirmed to be the Vite output.
- [ ] Cloudinary public environment variables configured.
- [ ] no secrets exposed.
- [ ] auto-deploy configured appropriately.
- [ ] SPA rewrites configured only if required.
- [ ] Render deployment succeeds.
- [ ] production URL works over HTTPS.

## Browser

- [ ] launcher works.
- [ ] all games launch.
- [ ] images work.
- [ ] SVGs work.
- [ ] videos work.
- [ ] audio works.
- [ ] JSON/manifests load.
- [ ] no asset 404s.
- [ ] no console errors.
- [ ] mobile layout works.
- [ ] touch interaction works.
- [ ] PWA/service-worker behavior is correct.

## Operations

- [ ] asset manifest stored.
- [ ] verification script exists.
- [ ] CI runs test + build.
- [ ] deployment procedure documented.
- [ ] rollback procedure documented.
- [ ] Cloudinary old-release cleanup completed.
- [ ] final production URL recorded.

---

# 27. Expected final architecture

The final production architecture should look like:

```text
GitHub
  │
  │ source code
  ▼
Render Static Site
  │
  ├── HTML
  ├── CSS
  └── JavaScript
        │
        │ runtime assetUrl(...)
        ▼
Cloudinary CDN
  │
  └── little-adventures/release-2/
       ├── shared/
       └── games/
```

The Git repository should no longer need to carry the large production media library merely for deployment.

---

# 28. Important implementation note for the agent

Cloudinary's current documentation states that in Dynamic Folder mode:

- `asset_folder` controls the Media Library folder;
- `public_id_prefix` controls the public-ID path;
- `use_asset_folder_as_public_id_prefix` can make the initial public-ID path match the asset folder.

Official references:

- Cloudinary CLI:
  https://cloudinary.com/documentation/cloudinary_cli
- Cloudinary folder modes:
  https://cloudinary.com/documentation/folder_modes
- Cloudinary upload API:
  https://cloudinary.com/documentation/image_upload_api_reference
- Cloudinary asset deletion:
  https://cloudinary.com/documentation/delete_assets
- Render Static Sites:
  https://render.com/docs/static-sites
- Render first deploy:
  https://render.com/docs/your-first-deploy
- Render deploys / auto-deploy:
  https://render.com/docs/deploys

Use the current documentation if CLI behavior differs from this runbook.

---

# 29. Final agent report required

At the end of execution, the agent must produce a concise completion report containing:

```text
Cloudinary
- Cloud name:
- Release namespace:
- Required assets uploaded:
- Required assets skipped:
- Verification failures:
- Old release deleted: YES/NO

Application
- Tests:
- Production build:
- Cloudinary URLs verified:
- Remaining local asset references:
- Remaining release-1 references:

Render
- Render URL:
- Build status:
- Environment configured:
- SPA rewrite:
- Auto-deploy:

Browser smoke test
- Launcher:
- Games passed:
- Games failed:
- 404 count:
- Console error count:

Final status:
READY / NOT READY

Outstanding issues:
...
```

The agent must not report `READY` unless all Definition-of-Done checks pass.
