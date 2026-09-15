# Little Adventures Asset Migration — Phase 1

This working tree is a cleaned copy of the original repository. The original ZIP is preserved separately.

## Changes

- Removed legacy `games/language-adventure/` implementation.
- Removed obsolete GitHub Pages mirror `public/games/language-adventures/`.
- Removed Language Adventures source character sheets.
- Removed legacy Language Adventures runtime asset folders that are not used by the current v2 implementation (`characters/`, `effects/`, `objects/`).
- Removed unused legacy scene backgrounds except `toy-room` and `park`, which are still used by the current implementation.
- Converted Baba's Big Jump story pages from PNG to WebP quality 90 and updated the story manifest.
- Converted the two active Language Adventures scene backgrounds to WebP quality 90 and updated `languageData.js`.
- Removed the obsolete GitHub Pages asset assertion from the Little Adventures regression test.
- Removed the GitHub Pages deployment workflow; Render will replace it.

## Intentionally retained

- Fruit Coloring outline/region-map PNGs: pixel data may be semantically important to the coloring engine.
- SVG assets: already compact and appropriate for vector artwork.
- Current Language Adventures `new/` assets and video.
- Existing docs and design references unless specifically identified as obsolete.

## Next phase

Create a canonical external asset manifest/resolver and migrate runtime assets to Cloudflare R2. The application should not mix local and remote asset URL conventions permanently.
