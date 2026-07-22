# Fruit Coloring v2 — paint-where-you-touch

Rebuilt from the SVG version based on feedback: this is now a real canvas
brush that paints exactly where the finger drags, not a whole shape
brightening at once. Colors are still fixed and confined to the correct
shape — that part didn't change, just *how* it's confined.

**Current art status:** 13 of 14 fruits now use your ChatGPT-generated
outlines (converted via flood-fill into region maps): Apple, Banana,
Orange, Watermelon, Musk Melon, Cranberry, Blueberry, Cherry, Raspberry,
Strawberry, Mango, Guava, Papaya. **Grapes** is the only one still on the
procedural placeholder — the image labeled "grapes" in an earlier batch
was actually a raspberry-style druplet cluster (added as its own fruit,
id `raspberry`), so grapes itself still needs a dedicated upload.

## How it works technically

Each fruit is two PNG images at the same size, plus a small color config:

1. **`outlines/{fruit}-outline.png`** — the artwork you actually see: black
   line art, a soft highlight for a bit of shine, transparent everywhere
   else. This sits on top, always crisp, never touched by the interaction.
2. **`regionmaps/{fruit}-regions.png`** — invisible. Each enclosed area
   (body, leaf, stem…) is filled with a flat, unmixed ID color (pure red,
   pure green, pure blue). Never shown on screen — it's purely a lookup
   table.

At runtime:
- A `<canvas>` sits *underneath* the outline image and *above* the page
  background — this is what actually receives touches.
- On every drag position, the game checks the region-map at that exact
  pixel to find out which shape is under the finger, then paints a soft
  brush dab **only within that shape's boundary** (clipped using the
  region map as a mask) in that shape's fixed color.
- Progress is tracked by literally counting painted pixels vs. each
  region's total pixel count — not a guess, actual coverage — so "done"
  reliably means the whole shape looks colored, however she scrubbed it.

This is the same core technique real coloring-book apps use. The line art
and the interaction are now fully decoupled, which also means: whatever
the art source, the mechanic doesn't change.

## On the artwork itself

I rebuilt the shapes with better geometry (an apple is now a proper
apple-like blob with shoulders and a top dip, not a circle) plus a subtle
gloss highlight. It's still procedurally drawn by code, so there's a
ceiling on how organic it can look.

If you want noticeably better-looking fruit, the highest-quality path is
the same one we used for the comic story: **generate the outline art in
ChatGPT**, and I'll turn your output into the matching region map. Rough
shape of that:

1. Ask ChatGPT for a children's-coloring-book-style outline of the fruit —
   flat, clean, closed black outlines, no shading, transparent or white
   background, distinct enclosed areas for each part you want colored
   separately (e.g. body / leaf / stem as clearly separate closed regions).
2. Send me the image — I'll trace it into a region map and wire up the
   manifest entry so it drops straight into this same engine.

Either path (my procedural version or ChatGPT-generated) plugs into the
exact same runtime unchanged.

## Files

```
games/
  fruit-color/
    FruitColorGame.js
    styles.css
    assets/
      manifest.json
      outlines/     (visible line art)
      regionmaps/    (invisible ID-color lookup maps)
```

## Wiring it in

Same as before — no change needed if you already added this from the
previous version:

**`index.html`:**
```html
<link rel="stylesheet" href="games/fruit-color/styles.css">
```

**`js/main.js`:**
```js
import { FruitColorGame } from '../games/fruit-color/FruitColorGame.js';
gameRegistry.register(FruitColorGame); // inside registerGames()
```

If you already have `FruitColorGame.js` from before, just **overwrite the
whole `fruit-color` folder** with this one — the manifest format changed
(`file` → `outline` + `regionMap` + `regions` with `mapColor`/`targetColor`),
so old and new manifests aren't compatible.

## Tuning knobs

At the top of `FruitColorGame.js`:
- `BRUSH_RADIUS` — how big each dab is (default 24px on a 400px canvas)
- `COMPLETE_THRESHOLD` — fraction of a region's pixels that must be
  painted to count as "done" (default 0.80 — a little under 100% since
  soft round dabs never perfectly cover jagged mask edges)
- `MIN_DAB_SPACING` — minimum drag distance between dabs, prevents
  over-painting when dragging slowly

Worth a quick real-device test to see if these feel right for her — happy
to adjust based on what you see.

## Adding more fruits later

For each new fruit you need:
1. An outline PNG (visible art)
2. A region-map PNG, same dimensions, one flat unmixed color per region
3. A manifest entry listing each region's `mapColor` (which color marks it
   on the map) and `targetColor` (what it fills to)

I can keep generating these the same way I did this batch — just say which
fruits from your list to do next (Kiwi, Mango, Papaya, Pineapple, etc. are
all good next candidates), or send me ChatGPT-generated outlines and I'll
build the region maps to match.
