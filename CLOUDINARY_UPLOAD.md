# Upload Little Adventures assets to Cloudinary

Cloud name: `orxjbhtb`

The prepared asset package is the contents of `r2-assets/` from the Phase 2 asset ZIP.

## Recommended method: Cloudinary CLI + OAuth

Cloudinary's current CLI supports browser OAuth, so you do not need to copy your API secret into the shell. Install the CLI and log in:

```powershell
py -m pip install cloudinary-cli
cld login
```

A browser window will open for Cloudinary authentication.

After login, verify:

```powershell
cld config
```

## Upload layout

Extract the prepared asset package so you have:

```text
r2-assets/
  shared/
  games/
```

Run the upload from the directory containing `r2-assets`:

```powershell
cld upload_dir r2-assets -f little-adventures/release-1 `
  -o use_filename=true `
  -o unique_filename=false `
  -o use_asset_folder_as_public_id_prefix=true
```

The command is intended to preserve the directory hierarchy and create stable public IDs matching:

```text
little-adventures/release-1/shared/...
little-adventures/release-1/games/...
```

Cloudinary's new accounts use dynamic folder mode. The `use_asset_folder_as_public_id_prefix` option makes the initial asset-folder path part of the public ID, which is what the application resolver expects. Verify a few uploaded assets before uploading the entire set if desired.

## Verify representative URLs

For an SVG:

```text
https://res.cloudinary.com/orxjbhtb/image/upload/little-adventures/release-1/shared/art/characters/toddler-mascot.svg
```

For a WebP:

```text
https://res.cloudinary.com/orxjbhtb/image/upload/little-adventures/release-1/games/comic-stories/images/babas-big-jump/page-1.webp
```

For an MP4:

```text
https://res.cloudinary.com/orxjbhtb/video/upload/little-adventures/release-1/games/language-adventures/video/<filename>.mp4
```

For a WAV:

```text
https://res.cloudinary.com/orxjbhtb/video/upload/little-adventures/release-1/games/alphabet-learner/<filename>.wav
```

For a JSON manifest:

```text
https://res.cloudinary.com/orxjbhtb/raw/upload/little-adventures/release-1/games/alphabet-learner/manifest.json
```

Cloudinary classifies images as `image`, videos and audio as `video`, and non-media such as JSON as `raw`.

## Do not put credentials in the game

The browser only needs the public delivery URL. Never put an API secret in Vite environment variables that are shipped to the browser, GitHub, or Render.
