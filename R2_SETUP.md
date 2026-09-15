# Cloudflare R2 setup for Little Adventures

## Bucket

Create a private-by-default R2 bucket for the game assets. The browser needs read access, so expose the bucket through a Cloudflare R2 public/custom domain (preferred) or the R2.dev development URL.

Recommended public URL shape:

```text
https://assets.<your-domain>/baby-games/v1/
```

Upload the **contents** of `r2-assets/` into that prefix. Do not upload the `r2-assets` directory itself as an extra nesting level.

## CORS

The application fetches JSON manifests from the asset host and loads media cross-origin. Configure CORS to allow GET/HEAD requests from the deployed application origin. For an initial setup, `*` is acceptable because these are public, non-user-specific game assets and the application does not send credentials to the asset host.

Suggested policy is in `r2-cors.json`.

## Caching

Use the versioned prefix (`v1`) so immutable assets can be cached for a long time:

```text
Cache-Control: public, max-age=31536000, immutable
```

For the JSON manifests, a shorter cache is safer while content is still changing, for example:

```text
Cache-Control: public, max-age=300
```

## Render

Set this environment variable on the Render Static Site:

```text
VITE_ASSET_BASE_URL=https://assets.<your-domain>/baby-games/v1/
```

Do not add quotes around the value.

## Important

Do not remove the repository asset directories until the Render deployment has passed the external-asset smoke test. The resolver intentionally supports both local assets and R2 assets so development remains usable during the migration.
