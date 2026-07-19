# Fruit Coloring — new game module

Rub-to-fill coloring: colors are fixed per region (leaves are always green,
apple body is always red, etc.) and every stroke is snapped to whichever
region is under the finger — there's no way to color outside the lines,
by construction, not by careful drawing.

Ships with 6 fruits ready to go: **Apple, Banana, Orange, Strawberry,
Watermelon, Grapes.** Your full wishlist is covered by the spec table below
so the rest are quick to add.

## 1. Add the files to your repo

Copy `fruit-color` into `baby_games/games/`:

```
games/
  fruit-color/
    FruitColorGame.js
    styles.css
    assets/
      manifest.json
      svg/
        apple.svg, banana.svg, orange.svg,
        strawberry.svg, watermelon.svg, grapes.svg
```

## 2. Wire it in (same 2 edits as before)

**`index.html`:**
```html
<link rel="stylesheet" href="games/fruit-color/styles.css">
```

**`js/main.js`:**
```js
import { FruitColorGame } from '../games/fruit-color/FruitColorGame.js';

// inside registerGames():
gameRegistry.register(FruitColorGame);
```

Test locally with `python -m http.server 8000` before pushing.

## 3. How the coloring mechanic works

- She picks a fruit from the grid → a blank/pale outline appears.
- Rubbing a finger over any part fills *that region* toward its fixed
  color, gradually, the longer she rubs it — real "coloring" feel, not an
  instant tap-fill.
- Once every region is filled, it celebrates and offers "Color again" or
  "Next fruit."
- There is no color picker and no way to paint a region the wrong color —
  each shape only ever fills toward the one color it's assigned.

## 4. Adding more fruits

Each fruit is one SVG file + one manifest entry. The engine only needs two
things on each colorable shape:

```html
<path class="fruit-region"
      data-region-id="body"
      data-target-color="#E53935"
      d="M ... Z" />
```

- `data-region-id` — groups shapes that fill together (e.g. all the little
  circles in a grape bunch can share `data-region-id="cluster"` and fill as
  one region).
- `data-target-color` — the fixed color that region fills toward. That's
  it — the pale "uncolored" starting look is generated automatically, so
  you don't need to hand-tune a starting fill.
- Anything decorative that shouldn't be interactive (seeds, texture lines,
  outline strokes) just goes in a plain `<g pointer-events="none">` group
  with a fixed fill — see any of the shipped SVGs for the pattern.
- Keep regions reasonably large — a toddler's finger is not precise, so
  avoid lots of tiny sub-regions (this is why seeds/texture are static
  decoration rather than colorable regions in the shipped fruits).

Then add a line to `assets/manifest.json`:
```json
{ "id": "kiwi", "name": "Kiwi", "file": "kiwi.svg" }
```

### Spec table for the rest of your list

Region breakdown + suggested colors, ready to hand to an illustrator, paste
into a ChatGPT image-gen prompt for reference, or ask me to build next.

| Fruit | Suggested regions (id — color) | Shape note |
|---|---|---|
| Musk melon | `rind` #C9A227, `flesh` #FFA726 | slice/wedge, same technique as watermelon |
| Kiwi | `skin` #8D6E63, `flesh` #AED581, `core` #FAFAFA | round cross-section slice (concentric circles), seeds as static dots |
| Blueberries | `berries` #3F51B5 (cluster of small circles) | grape-cluster technique, smaller circles |
| Cherries | `fruit` #C62828 (×2 circles), `stem` #558B2F | pair of circles joined by curved stems |
| Cranberry | `berries` #B71C1C (small cluster) | like blueberries, red |
| Raspberry | `druplets` #E91E63 (cluster of tiny circles, domed), `leaves` #43A047 | strawberry-crown technique on a rounder body |
| Papaya | `body` #F9A825, `stem` #6D4C41, seeds as static dots | tall vertical oval |
| Mango | `body` #FFA000, `stem` #6D4C41 | rotated oval, slightly kidney-angled |
| Guava | `body` #AFB42B, `leaf` #43A047, `stem` #6D4C41 | round body, same technique as apple/orange |
| Custard apple | `body` #8BC34A, `leaf` #43A047 | round body + static scale-pattern texture lines |
| Chikoo | `body` #8D6E63, `stem` #6D4C41 | small brown oval |
| Coconut | `body` #6D4C41 | round body + static fiber-texture lines + 3 small "eye" dots |

A few more common ones worth adding once you're past this batch: **Pineapple**
(body #F9A825 + spiky green crown), **Pomegranate** (body #C62828 + a
star-shaped calyx), **Pear** (body #C0CA33, teardrop like strawberry but
narrower top), **Peach** (body #FFAB91, with a center-line crease as static
detail), **Lychee** / **Sweet lime (mosambi)** (round, same apple/orange
technique with different colors).

Happy to generate the SVGs for any batch of these the same way I did the
first six — just say which ones.
