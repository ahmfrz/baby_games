# Asset Migration — Phase 2

The application now has a single runtime asset resolver in `services/AssetService.js`.

## Local development

With no `VITE_ASSET_BASE_URL`, logical asset paths resolve to the existing files in the repository.

## Production / R2

Set:

```bash
VITE_ASSET_BASE_URL=https://assets.example.com/baby-games/v1/
```

The application will request assets from that base URL instead of importing/copying the large media files through Vite.

The R2 public/custom-domain layout should be:

```text
baby-games/v1/
├── shared/
│   └── art/...
├── games/
│   ├── alphabet-learner/
│   │   ├── manifest.json
│   │   └── images/...
│   ├── comic-stories/
│   │   ├── manifest.json
│   │   └── images/...
│   ├── fruit-color/
│   │   ├── manifest.json
│   │   ├── outlines/...
│   │   └── regionmaps/...
│   ├── language-adventures/
│   │   ├── new/...
│   │   ├── scenes/...
│   │   └── video/...
│   └── strawberry-garden/
│       └── art/...
```

The existing repository assets remain available as the local-development fallback until the R2 upload is completed. They can be removed in the later migration step after production smoke tests confirm the external asset host is healthy.
