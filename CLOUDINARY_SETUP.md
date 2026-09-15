# Cloudinary setup for Little Adventures

Cloudinary cloud name: `orxjbhtb`

## Production delivery

The application uses Cloudinary's shared CDN:

`https://res.cloudinary.com/orxjbhtb/`

Assets are expected under the public ID prefix:

`little-adventures/release-1/`

For example:

`little-adventures/release-1/shared/art/characters/toddler-mascot`

is delivered as:

`https://res.cloudinary.com/orxjbhtb/image/upload/little-adventures/release-1/shared/art/characters/toddler-mascot.svg`

Cloudinary uses the `video` resource type for both video and audio assets; the app resolver handles `.mp4` and `.wav` accordingly.

## Recommended upload method

Because this is a frontend-only game with no user uploads, use the Cloudinary CLI or Media Library rather than putting credentials in the application.

For the safest repeatable migration, the CLI should upload the prepared `r2-assets` directory with public IDs matching its relative paths under `little-adventures/release-1`.

Do **not** put an API secret in GitHub, Render, the frontend, or `.env` files shipped to the browser.

## Verification

Before switching Render to Cloudinary, verify at least:

- one SVG
- one WebP
- one PNG region map
- one MP4
- one WAV
- one `manifest.json`

The application should remain usable locally with `VITE_ASSET_BASE_URL` unset.
